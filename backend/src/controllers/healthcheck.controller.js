import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isRedisConnected } from "../utils/redis.js";

/**
 * @function healthcheck
 * @description Health check endpoint for monitoring uptime, DB state, and ALB health probes.
 */
const healthcheck = asyncHandler(async (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting"
    };

    const healthData = {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: dbStatusMap[dbState] || "unknown",
        cache: isRedisConnected() ? "connected" : "offline (fallback to DB)",
        status: dbState === 1 ? "healthy" : "degraded"
    };

    const statusCode = dbState === 1 ? 200 : 503;

    return res
        .status(statusCode)
        .json(new ApiResponse(statusCode, healthData, "System status retrieved"));
});

export { healthcheck };
