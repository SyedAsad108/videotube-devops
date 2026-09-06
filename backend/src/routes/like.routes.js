import { Router } from "express";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// All like routes require authentication
router.use(verifyJWT);

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/videos").get(getLikedVideos);

export default router;
