import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import path from "path";

// Initialize S3 Client
const s3Config = {
    region: process.env.AWS_REGION || "us-east-1"
};

// If explicit static credentials are provided in .env (for local testing)
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Config.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    };
}

const s3Client = new S3Client(s3Config);
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME || "videotube-media-bucket";

/**
 * Helper to determine Content-Type from file extension
 */
const getContentType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        ".mp4": "video/mp4",
        ".mkv": "video/x-matroska",
        ".webm": "video/webm",
        ".mov": "video/quicktime",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif"
    };
    return mimeTypes[ext] || "application/octet-stream";
};

/**
 * @function uploadToS3
 * @description Uploads a local file to Amazon S3, deletes local temp file, and returns key and URL.
 * 
 * @param {string} localFilePath - Path to local file staged by Multer.
 * @param {string} folder - Target S3 prefix (e.g. 'videos', 'thumbnails', 'avatars', 'cover-images').
 * @returns {Promise<{ key: string, url: string, bucket: string }|null>}
 */
const uploadToS3 = async (localFilePath, folder = "videos") => {
    try {
        if (!localFilePath || !fs.existsSync(localFilePath)) return null;

        const fileStream = fs.createReadStream(localFilePath);
        const fileName = path.basename(localFilePath);
        const key = `${folder}/${fileName}`;
        const contentType = getContentType(localFilePath);

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileStream,
            ContentType: contentType
        });

        await s3Client.send(command);

        // Delete local temporary file after successful upload
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        const url = `https://${BUCKET_NAME}.s3.${s3Config.region}.amazonaws.com/${key}`;

        return {
            key,
            url,
            bucket: BUCKET_NAME
        };
    } catch (error) {
        console.error("S3 Upload Error:", error);
        // Ensure local temporary file is cleaned up even on failure
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

/**
 * @function deleteFromS3
 * @description Deletes an object from Amazon S3 by key.
 * 
 * @param {string} key - S3 object key (e.g. 'videos/video-123.mp4').
 * @returns {Promise<boolean>}
 */
const deleteFromS3 = async (key) => {
    try {
        if (!key) return false;

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        await s3Client.send(command);
        return true;
    } catch (error) {
        console.error("S3 Delete Error:", error);
        return false;
    }
};

/**
 * @function getPresignedPlaybackUrl
 * @description Generates a presigned GET URL for secure, direct video streaming from S3.
 * 
 * @param {string} key - S3 object key or existing URL.
 * @param {number} expiresInSeconds - Expiration window in seconds (default: 3600 = 1 hour).
 * @returns {Promise<string>} Presigned S3 URL or direct URL.
 */
const getPresignedPlaybackUrl = async (key, expiresInSeconds = 3600) => {
    try {
        if (!key) return "";

        // If it's already an external HTTP(S) URL (e.g., Cloudinary), return as is
        if (key.startsWith("http://") || key.startsWith("https://")) {
            return key;
        }

        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
    } catch (error) {
        console.error("Error generating S3 presigned URL:", error);
        return key;
    }
};

export {
    s3Client,
    BUCKET_NAME,
    uploadToS3,
    deleteFromS3,
    getPresignedPlaybackUrl
};
