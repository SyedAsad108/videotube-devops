import { Router } from "express";
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Public route to view comments
router.route("/:videoId").get(getVideoComments);

// Secured routes
router.route("/:videoId").post(verifyJWT, addComment);
router.route("/c/:commentId")
    .patch(verifyJWT, updateComment)
    .delete(verifyJWT, deleteComment);

export default router;
