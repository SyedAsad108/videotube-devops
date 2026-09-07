import { uploadToS3, deleteFromS3, getPresignedPlaybackUrl } from "./s3.js";
import { uploadOnCloudinary } from "./cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

/**
 * Determine active storage provider:
 * - "s3" if STORAGE_PROVIDER is explicitly "s3" or AWS S3 credentials/bucket are configured
 * - "cloudinary" as fallback or default
 */
const getStorageProvider = () => {
    if (process.env.STORAGE_PROVIDER) {
        return process.env.STORAGE_PROVIDER.toLowerCase();
    }
    if (process.env.AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME) {
        return "s3";
    }
    return "s3";
};

/**
 * @function uploadMedia
 * @description Uploads media file to the active storage provider (S3 or Cloudinary)
 * 
 * @param {string} localFilePath - Local file path from Multer.
 * @param {string} folder - Destination folder ('videos', 'thumbnails', 'avatars', 'cover-images').
 * @returns {Promise<{ url: string, key: string, duration?: number }|null>}
 */
const uploadMedia = async (localFilePath, folder = "general") => {
    const provider = getStorageProvider();

    if (provider === "s3") {
        const result = await uploadToS3(localFilePath, folder);
        if (!result) return null;
        return {
            url: result.url,
            key: result.key,
            provider: "s3"
        };
    }

    // Default: Cloudinary
    const result = await uploadOnCloudinary(localFilePath);
    if (!result) return null;
    return {
        url: result.url,
        key: result.public_id,
        duration: result.duration || 0,
        provider: "cloudinary"
    };
};

/**
 * @function deleteMedia
 * @description Deletes media from the appropriate storage provider based on URL or key
 */
const deleteMedia = async (keyOrUrl) => {
    if (!keyOrUrl) return false;

    // Check if it's an S3 key or URL
    if (!keyOrUrl.includes("cloudinary.com") && !keyOrUrl.startsWith("http")) {
        return await deleteFromS3(keyOrUrl);
    }

    // Cloudinary deletion
    try {
        if (keyOrUrl.includes("cloudinary.com")) {
            // Extract publicId from URL
            const parts = keyOrUrl.split("/");
            const filename = parts[parts.length - 1];
            const publicId = filename.split(".")[0];
            await cloudinary.uploader.destroy(publicId);
            return true;
        }
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
    return false;
};

export {
    uploadMedia,
    deleteMedia,
    getStorageProvider,
    getPresignedPlaybackUrl
};
