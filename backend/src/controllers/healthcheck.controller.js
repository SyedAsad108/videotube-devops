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

    // Return HTTP 200 so ALB health probes pass and container remains healthy during startup/reconnects
    return res
        .status(200)
        .json(new ApiResponse(200, healthData, "System status retrieved"));
});

export { healthcheck };
