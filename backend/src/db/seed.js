import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { deleteCache } from "../utils/redis.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const DB_NAME = "videotube";

async function seedDatabase() {
    console.log("==================================================");
    console.log("  VideoTube Database Seeder & Live Content Populator");
    console.log("==================================================");

    try {
        const cleanUri = MONGODB_URI.endsWith("/") ? MONGODB_URI.slice(0, -1) : MONGODB_URI;
        const connectionUrl = cleanUri.includes(DB_NAME) ? cleanUri : `${cleanUri}/${DB_NAME}`;

        console.log(`Connecting to database: ${connectionUrl}...`);
        await mongoose.connect(connectionUrl);
        console.log("✓ Connected to MongoDB.");

        // Clean existing seed data
        console.log("Cleaning old records...");
        await Promise.all([
            User.deleteMany({}),
            Video.deleteMany({}),
            Subscription.deleteMany({}),
            Comment.deleteMany({}),
            Like.deleteMany({})
        ]);
        console.log("✓ Existing collections purged.");

        const hashedPassword = await bcrypt.hash("Password123!", 10);

        // 1. Create Creators
        console.log("Creating creator profiles...");
        const users = await User.create([
            {
                username: "asad_dev",
                email: "asad@videotube.io",
                fullName: "Asad Syed",
                password: hashedPassword,
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
                coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80"
            },
            {
                username: "alex_lead",
                email: "alex@videotube.io",
                fullName: "Alex Rivera",
                password: hashedPassword,
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
                coverImage: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80"
            },
            {
                username: "sarah_k8s",
                email: "sarah@videotube.io",
                fullName: "Sarah Chen",
                password: hashedPassword,
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
                coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80"
            },
            {
                username: "david_sre",
                email: "david@videotube.io",
                fullName: "David Kim",
                password: hashedPassword,
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
                coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80"
            }
        ]);
        console.log(`✓ ${users.length} creators created successfully.`);

        const [asad, alex, sarah, david] = users;

        // 2. Create Subscriptions
        console.log("Setting up subscriptions network...");
        await Subscription.create([
            { subscriber: asad._id, channel: alex._id },
            { subscriber: asad._id, channel: sarah._id },
            { subscriber: alex._id, channel: asad._id },
            { subscriber: sarah._id, channel: asad._id },
            { subscriber: sarah._id, channel: david._id },
            { subscriber: david._id, channel: asad._id },
            { subscriber: david._id, channel: alex._id }
        ]);
        console.log("✓ Subscriptions established.");

        // Note: Demo Google sample videos have been removed.
        // Users can now upload real MP4 videos and thumbnails manually via S3.
        console.log("✓ Video system ready for real user uploads.");

        // 6. Set Watch History for Asad
        asad.watchHistory = [];
        await asad.save();
        console.log("✓ Watch history populated.");

        // 7. Flush old Redis keys
        console.log("Flushing stale cache keys...");
        try {
            await deleteCache(["videos:feed:page:1", "videos:trending"]);
        } catch { }

        console.log("\n==================================================");
        console.log("  DATABASE SEEDING COMPLETED SUCCESSFULLY!        ");
        console.log("==================================================");
        console.log("Demo Credentials:");
        console.log("  Username: asad_dev  | Password: Password123!");
        console.log("  Username: alex_lead | Password: Password123!");
        console.log("  Username: sarah_k8s | Password: Password123!");
        console.log("  Username: david_sre | Password: Password123!");
        console.log("==================================================");

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error("FATAL: Database seeding failed:", error);
        process.exit(1);
    }
}

seedDatabase();
