import Redis from "ioredis";

const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

let redis = null;
let isConnected = false;

try {
    redis = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        lazyConnect: true,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        commandTimeout: 1500,
        retryStrategy(times) {
            if (times > 3) {
                // Stop retrying after 3 attempts in local dev if Redis is absent
                return null;
            }
            return Math.min(times * 1000, 3000);
        }
    });

    redis.on("connect", () => {
        isConnected = true;
        console.log(`[Redis] Connected successfully to ${REDIS_HOST}:${REDIS_PORT}`);
    });

    redis.on("ready", () => {
        isConnected = true;
    });

    redis.on("error", (err) => {
        isConnected = false;
        // Suppress noisy reconnection errors when Redis is not running
        if (err.code !== "ECONNREFUSED") {
            console.warn("[Redis] Warning:", err.message);
        }
    });

    redis.on("close", () => {
        isConnected = false;
    });

    // Attempt non-blocking initial connection
    redis.connect().catch(() => {
        isConnected = false;
        console.log(`[Redis] No local Redis instance found at ${REDIS_HOST}:${REDIS_PORT} - continuing with database fallback.`);
    });
} catch (error) {
    console.warn("[Redis] Initialization skipped:", error.message);
}

/**
 * Get cached item by key (Graceful fallback to null)
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export const getCache = async (key) => {
    if (!isConnected || !redis) return null;
    try {
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

/**
 * Set cached item with TTL in seconds
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds - Time-To-Live in seconds
 */
export const setCache = async (key, value, ttlSeconds = 120) => {
    if (!isConnected || !redis) return false;
    try {
        const payload = JSON.stringify(value);
        await redis.set(key, payload, "EX", ttlSeconds);
        return true;
    } catch {
        return false;
    }
};

/**
 * Delete a specific key or list of keys
 * @param {string|string[]} keys
 */
export const deleteCache = async (keys) => {
    if (!isConnected || !redis) return false;
    try {
        const keysArr = Array.isArray(keys) ? keys : [keys];
        if (keysArr.length > 0) {
            await redis.del(...keysArr);
        }
        return true;
    } catch {
        return false;
    }
};

/**
 * Invalidate cache keys matching pattern (e.g. "videos:*")
 * @param {string} pattern
 */
export const invalidateCachePattern = async (pattern) => {
    if (!isConnected || !redis) return false;
    try {
        const stream = redis.scanStream({ match: pattern, count: 100 });
        stream.on("data", async (keys) => {
            if (keys.length > 0) {
                const pipeline = redis.pipeline();
                keys.forEach((key) => pipeline.del(key));
                await pipeline.exec();
            }
        });
        return true;
    } catch {
        return false;
    }
};

/**
 * Check if Redis is actively connected
 * @returns {boolean}
 */
export const isRedisConnected = () => isConnected;

export default redis;
