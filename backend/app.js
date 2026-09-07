import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./src/utils/ApiError.js";

// Route imports
import userRouter from "./src/routes/user.routes.js";
import healthcheckRouter from "./src/routes/healthcheck.routes.js";
import videoRouter from "./src/routes/video.routes.js";
import subscriptionRouter from "./src/routes/subscription.routes.js";
import commentRouter from "./src/routes/comment.routes.js";
import likeRouter from "./src/routes/like.routes.js";

const app = express();

// Trust proxy for accurate protocol/header detection behind AWS ALB and reverse proxies
app.set("trust proxy", 1);

// CORS Configuration
const rawOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";
const allowedOrigins = rawOrigin.split(",").map((o) => o.trim());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));

// Standard Middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// Route Declarations
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);

// Centralized Global Error Handling Middleware
app.use((err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            statusCode: err.statusCode,
            data: err.data,
            message: err.message,
            success: false,
            errors: err.errors
        });
    }

    // Handle Multer upload errors (size limit, invalid format) gracefully as 400 Bad Request
    if (err.name === "MulterError" || err.message?.includes("Unsupported file type") || err.code === "LIMIT_FILE_SIZE") {
        const message = err.code === "LIMIT_FILE_SIZE"
            ? "File size exceeds the 100 MB limit"
            : err.message || "File upload validation error";
        return res.status(400).json({
            statusCode: 400,
            data: null,
            message,
            success: false,
            errors: [message]
        });
    }

    // Default fallback for generic/unexpected errors
    const statusCode = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
        statusCode,
        data: null,
        message,
        success: false,
        errors: err.errors || []
    });
});

export { app };