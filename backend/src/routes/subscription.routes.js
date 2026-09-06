import { Router } from "express";
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.route("/c/:channelId").get(getUserChannelSubscribers);
router.route("/u/:subscriberId").get(getSubscribedChannels);

// Secured routes
router.route("/c/:channelId").post(verifyJWT, toggleSubscription);

export default router;
