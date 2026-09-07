import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @function toggleVideoLike
 * @description Toggle like/unlike on a video
 */
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    let isLiked = false;
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        isLiked = false;
    } else {
        await Like.create({
            video: videoId,
            likedBy: req.user._id
        });
        isLiked = true;
    }

    const likesCount = await Like.countDocuments({ video: videoId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isLiked, likesCount },
                isLiked ? "Video liked successfully" : "Video unliked successfully"
            )
        );
});

/**
 * @function toggleCommentLike
 * @description Toggle like/unlike on a comment
 */
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Comment unliked successfully"));
    } else {
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        });
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }, "Comment liked successfully"));
    }
});

/**
 * @function getLikedVideos
 * @description Get all videos liked by current user
 */
const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true, $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video: { $first: "$video" }
            }
        },
        {
            $match: {
                video: { $exists: true, $ne: null }
            }
        },
        {
            $project: {
                _id: 1,
                video: 1,
                createdAt: 1
            }
        }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"));
});

export {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos
};
