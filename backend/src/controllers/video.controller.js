import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadMedia, deleteMedia, getPresignedPlaybackUrl } from "../utils/storage.js";
import { getCache, setCache, deleteCache, invalidateCachePattern } from "../utils/redis.js";

/**
 * @function getAllVideos
 * @description Get paginated videos based on search query, sort, and optional user filter
 */
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const pipeline = [];

    const matchConditions = { isPublished: true };

    if (query) {
        matchConditions.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        matchConditions.owner = new mongoose.Types.ObjectId(userId);
    }

    pipeline.push({ $match: matchConditions });

    // Lookup owner details
    pipeline.push(
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
    );

    // Sort stage
    const cacheKey = `videos:feed:p:${page}:l:${limit}:q:${query || "all"}:sort:${sortBy}:${sortType}:u:${userId || "all"}`;
    const cachedVideos = await getCache(cacheKey);

    if (cachedVideos) {
        res.setHeader("X-Cache", "HIT");
        return res
            .status(200)
            .json(new ApiResponse(200, cachedVideos, "Videos fetched successfully (cached)"));
    }

    const sortStage = {};
    sortStage[sortBy] = sortType === "asc" ? 1 : -1;
    pipeline.push({ $sort: sortStage });

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videos = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

    // Cache results for 2 minutes (120s TTL)
    await setCache(cacheKey, videos, 120);

    res.setHeader("X-Cache", "MISS");
    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

/**
 * @function publishAVideo
 * @description Upload video and thumbnail to cloud, create record in MongoDB
 */
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description || title.trim() === "" || description.trim() === "") {
        throw new ApiError(400, "Title and description are required");
    }

    const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400, "Video file is required");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail file is required");
    }

    const videoFile = await uploadMedia(videoFileLocalPath, "videos");
    const thumbnail = await uploadMedia(thumbnailLocalPath, "thumbnails");

    if (!videoFile?.url) {
        throw new ApiError(500, "Failed to upload video file");
    }

    if (!thumbnail?.url) {
        throw new ApiError(500, "Failed to upload thumbnail file");
    }

    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: videoFile.key || videoFile.url,
        thumbnail: thumbnail.key || thumbnail.url,
        duration: videoFile.duration || 0,
        views: 0,
        isPublished: true,
        owner: req.user._id
    });

    const createdVideo = await Video.findById(video._id).populate("owner", "fullName username avatar");

    if (!createdVideo) {
        throw new ApiError(500, "Video creation failed");
    }

    // Invalidate cached listings
    await invalidateCachePattern("videos:feed:*");

    return res
        .status(201)
        .json(new ApiResponse(201, createdVideo, "Video published successfully"));
});

/**
 * @function getVideoById
 * @description Get video by ID, increments view count, includes channel info and like count
 */
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Increment view count
    await Video.findByIdAndUpdate(videoId, {
        $inc: { views: 1 }
    });

    // If user is logged in, optionally add video to watchHistory
    if (req.user?._id) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: videoId }
        });
    }

    const videoAggregate = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: { $size: "$subscribers" },
                            isSubscribed: {
                                $cond: {
                                    if: req.user?._id
                                        ? { $in: [new mongoose.Types.ObjectId(req.user._id), "$subscribers.subscriber"] }
                                        : false,
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: req.user?._id
                            ? { $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"] }
                            : false,
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                likes: 0
            }
        }
    ]);

    if (!videoAggregate?.length) {
        throw new ApiError(404, "Video not found");
    }

    const videoData = videoAggregate[0];
    videoData.playbackUrl = await getPresignedPlaybackUrl(videoData.videoFile);

    return res
        .status(200)
        .json(new ApiResponse(200, videoData, "Video retrieved successfully"));
});

/**
 * @function updateVideo
 * @description Update video title, description, and thumbnail (owner only)
 */
const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to update this video");
    }

    const updateFields = {};
    if (title && title.trim() !== "") updateFields.title = title.trim();
    if (description && description.trim() !== "") updateFields.description = description.trim();

    if (req.file?.path) {
        const thumbnail = await uploadMedia(req.file.path, "thumbnails");
        if (thumbnail?.url) {
            updateFields.thumbnail = thumbnail.key || thumbnail.url;
            if (video.thumbnail) {
                await deleteMedia(video.thumbnail);
            }
        }
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updateFields },
        { new: true }
    ).populate("owner", "fullName username avatar");

    // Invalidate caches
    await Promise.all([
        invalidateCachePattern("videos:feed:*"),
        deleteCache(`video:detail:${videoId}`)
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

/**
 * @function deleteVideo
 * @description Delete a video and associated comments/likes (owner only)
 */
const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to delete this video");
    }

    await Video.findByIdAndDelete(videoId);
    await Comment.deleteMany({ video: videoId });
    await Like.deleteMany({ video: videoId });

    if (video.videoFile) await deleteMedia(video.videoFile);
    if (video.thumbnail) await deleteMedia(video.thumbnail);

    // Invalidate caches
    await Promise.all([
        invalidateCachePattern("videos:feed:*"),
        deleteCache(`video:detail:${videoId}`)
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video and related data deleted successfully"));
});

/**
 * @function togglePublishStatus
 * @description Toggle isPublished boolean (owner only)
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (!video.owner.equals(req.user._id)) {
        throw new ApiError(403, "You do not have permission to modify this video");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    // Invalidate caches
    await Promise.all([
        invalidateCachePattern("videos:feed:*"),
        deleteCache(`video:detail:${videoId}`)
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, { isPublished: video.isPublished }, "Publish status toggled"));
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
};
