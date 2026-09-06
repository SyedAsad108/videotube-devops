import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary credentials. This initializes the Cloudinary SDK using API credentials
// stored in environment variables, allowing the application to securely connect to Cloudinary services.
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * @function uploadOnCloudinary
 * @description Uploads a file stored on the local server filesystem to Cloudinary,
 *              logs the success, and automatically deletes the local temporary file to free up space.
 * 
 * @param {string} localFilePath - The absolute or relative path to the local file (usually uploaded via Multer).
 * @returns {Promise<Object|null>} The Cloudinary API response object on success, or null on failure.
 * 
 * @reason Why it is written:
 * When users upload images/videos (e.g., avatars or cover images), saving them directly on the application server 
 * is bad practice because it consumes server storage, makes horizontal scaling difficult, and is slower to serve. 
 * Instead, we use Multer to temporarily accept files locally, then this utility uploads them to a cloud media 
 * storage service (Cloudinary) which serves them via a globally optimized CDN. Once uploaded, the local file is 
 * immediately deleted to prevent disk usage from piling up on our web server.
 * 
 * @logic
 * 1. Verifies if a valid `localFilePath` is provided. If not, returns `null` immediately.
 * 2. Invokes `cloudinary.uploader.upload()` with the local file path, specifying `{ resource_type: "auto" }` 
 *    so Cloudinary automatically detects whether the file is an image, video, raw file, etc.
 * 3. Awaits the upload resolution, logs the secure URL to the console, and deletes the local temporary file 
 *    using `fs.unlinkSync(localFilePath)` to keep the local filesystem clean.
 * 4. Returns the full response object from Cloudinary (which includes the URL, public ID, dimensions, format, etc.).
 * 5. If the upload throws an error, the `catch` block catches it, logs the error, and still deletes the local 
 *    file using `fs.unlinkSync(localFilePath)` to ensure failed uploads do not leave orphan temporary files behind.
 * 6. Returns `null` on failure.
 */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath);
        return response;
    }
    catch (error) {
        console.error("Cloudinary upload error:", error);
        // Ensure local temporary file is removed regardless of upload success
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

export { uploadOnCloudinary };