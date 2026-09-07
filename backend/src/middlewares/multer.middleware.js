import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure local temporary staging directory exists
const tempUploadDir = "./public/temp";
if (!fs.existsSync(tempUploadDir)) {
    fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempUploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// Allowed MIME types across different browsers and operating systems
const allowedMimeTypes = new Set([
    // Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
    "image/gif",
    // Videos (MP4, MKV, WebM, QuickTime MOV)
    "video/mp4",
    "video/mkv",
    "video/x-matroska",
    "video/webm",
    "video/quicktime",
    "video/mov",
    "video/x-quicktime",
    "video/x-mov",
    "application/x-quicktime"
]);

// Allowed file extensions for media uploads
const allowedExtensions = new Set([
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".gif",
    ".mp4",
    ".mkv",
    ".webm",
    ".mov"
]);

// File filter to allow safe media types with MIME & extension fallback
export const fileFilter = (req, file, cb) => {
    const ext = path.extname(file?.originalname || "").toLowerCase();
    const mimeType = (file?.mimetype || "").toLowerCase();

    // 1. Direct match on recognized MIME type
    if (allowedMimeTypes.has(mimeType)) {
        return cb(null, true);
    }

    // 2. Fallback: Extension match when browser sends generic or octet-stream MIME
    if (allowedExtensions.has(ext)) {
        if (
            mimeType.startsWith("video/") ||
            mimeType.startsWith("image/") ||
            mimeType === "application/octet-stream" ||
            !mimeType
        ) {
            return cb(null, true);
        }
    }

    cb(new Error(`Unsupported file type: ${mimeType || ext}. Allowed video formats: .mp4, .mov, .webm, .mkv. Allowed image formats: .jpg, .png, .webp`), false);
};

export const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB max file size
    },
    fileFilter
});

