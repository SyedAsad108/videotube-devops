import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI environment variable is required.");
    process.exit(1);
}

async function cleanupDemoVideos() {
    console.log("Connecting to MongoDB Atlas to purge broken Google demo videos...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    const db = mongoose.connection.db;

    // 1. Find all demo videos (pointing to commondatastorage.googleapis.com)
    const demoVideos = await db.collection("videos").find({
        $or: [
            { videoFile: { $regex: "commondatastorage" } },
            { videoFile: { $regex: "googleapis.com" } },
            { videoFile: { $regex: "sample" } }
        ]
    }).toArray();

    console.log(`Found ${demoVideos.length} demo videos to purge.`);

    if (demoVideos.length > 0) {
        const videoIds = demoVideos.map((v) => v._id);

        // Delete related comments
        const deletedComments = await db.collection("comments").deleteMany({
            video: { $in: videoIds }
        });
        console.log(`Deleted ${deletedComments.deletedCount} related comments.`);

        // Delete related likes
        const deletedLikes = await db.collection("likes").deleteMany({
            video: { $in: videoIds }
        });
        console.log(`Deleted ${deletedLikes.deletedCount} related likes.`);

        // Remove from user watch histories
        await db.collection("users").updateMany(
            {},
            { $pull: { watchHistory: { $in: videoIds } } }
        );
        console.log("Cleaned watch histories for all users.");

        // Delete the demo videos
        const deletedVideos = await db.collection("videos").deleteMany({
            _id: { $in: videoIds }
        });
        console.log(`Successfully purged ${deletedVideos.deletedCount} demo videos from MongoDB Atlas.`);
    }

    const remainingVideos = await db.collection("videos").countDocuments();
    const userCount = await db.collection("users").countDocuments();
    console.log(`Database state: ${remainingVideos} videos remaining, ${userCount} users preserved.`);

    await mongoose.disconnect();
    console.log("Database cleanup finished.");
}

cleanupDemoVideos().catch((err) => {
    console.error("Cleanup failed:", err);
    process.exit(1);
});
