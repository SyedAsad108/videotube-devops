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

        // Reliable sample video stream URLs
        const SAMPLE_VIDEO_1 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
        const SAMPLE_VIDEO_2 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";
        const SAMPLE_VIDEO_3 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
        const SAMPLE_VIDEO_4 = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4";

        // 3. Create Videos
        console.log("Publishing high-concurrency video catalog...");
        const videos = await Video.create([
            {
                title: "Deep Dive: Building High-Throughput Microservices on AWS ECS",
                description: "Comprehensive guide to architectural design, VPC subnet segregation, ALB path routing, and target-tracking auto scaling under real-world loads.",
                videoFile: SAMPLE_VIDEO_1,
                thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80",
                duration: 840,
                views: 28450,
                isPublished: true,
                owner: asad._id
            },
            {
                title: "Redis Cache-Aside Architecture vs Direct Database Queries",
                description: "Benchmarking read-heavy MongoDB queries against an in-memory ElastiCache tier. Analyzing cache invalidation, TTLs, and fault tolerance.",
                videoFile: SAMPLE_VIDEO_2,
                thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80",
                duration: 615,
                views: 42100,
                isPublished: true,
                owner: asad._id
            },
            {
                title: "Kubernetes Networking Explained: CNI, Services & Ingress",
                description: "Demystifying packet flow across pods, overlay networks, kube-proxy iptables rules, and high-performance Nginx ingress controllers.",
                videoFile: SAMPLE_VIDEO_3,
                thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&w=800&q=80",
                duration: 1120,
                views: 19800,
                isPublished: true,
                owner: sarah._id
            },
            {
                title: "Top DevOps Trends & Cloud Architecture Strategies in 2026",
                description: "An overview of GitOps, automated canary deployments, platform engineering portals, and the evolution of Infrastructure as Code.",
                videoFile: SAMPLE_VIDEO_4,
                thumbnail: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
                duration: 945,
                views: 53200,
                isPublished: true,
                owner: alex._id
            },
            {
                title: "Automated CI/CD with GitHub Actions & Terraform IaC",
                description: "Building production-grade CI/CD pipelines: Linting, container security scanning, automated Terraform plan/apply, and zero-downtime rolling updates.",
                videoFile: SAMPLE_VIDEO_1,
                thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
                duration: 730,
                views: 14500,
                isPublished: true,
                owner: david._id
            },
            {
                title: "Coding Lo-Fi Chill Beats & Ambient Synthwave Mix",
                description: "Continuous focus session soundtrack for deep work, system design, and debugging infrastructure.",
                videoFile: SAMPLE_VIDEO_2,
                thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80",
                duration: 3600,
                views: 89400,
                isPublished: true,
                owner: alex._id
            },
            {
                title: "Cloud Native Weekly #42: Open Source vs Managed Services",
                description: "Discussing self-hosted vs managed databases, cost optimization tradeoffs, and operational overhead in multi-cloud deployments.",
                videoFile: SAMPLE_VIDEO_3,
                thumbnail: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=800&q=80",
                duration: 2150,
                views: 11200,
                isPublished: true,
                owner: sarah._id
            },
            {
                title: "Tech Radar 2026: SRE Observability & Distributed Tracing",
                description: "How OpenTelemetry, Prometheus, and Grafana provide deep visibility across microservices and reduce Mean Time to Resolution (MTTR).",
                videoFile: SAMPLE_VIDEO_4,
                thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
                duration: 1280,
                views: 24700,
                isPublished: true,
                owner: david._id
            }
        ]);
        console.log(`✓ ${videos.length} videos seeded.`);

        // 4. Create Comments
        console.log("Adding community discussions...");
        await Comment.create([
            {
                content: "Outstanding walkthrough of the ECS target tracking policies. The latency graphs made the scaling mechanics crystal clear!",
                video: videos[0]._id,
                owner: sarah._id
            },
            {
                content: "The Cache-Aside benchmark comparison was impressive. Sub-10ms response times make a huge difference under high concurrency.",
                video: videos[1]._id,
                owner: alex._id
            },
            {
                content: "Crucial points on CNI plugin performance. Looking forward to part 2!",
                video: videos[2]._id,
                owner: david._id
            },
            {
                content: "This playlist is on repeat during every deployment window!",
                video: videos[5]._id,
                owner: asad._id
            }
        ]);
        console.log("✓ Comments created.");

        // 5. Create Likes
        console.log("Generating engagement likes...");
        await Like.create([
            { video: videos[0]._id, likedBy: alex._id },
            { video: videos[0]._id, likedBy: sarah._id },
            { video: videos[1]._id, likedBy: sarah._id },
            { video: videos[1]._id, likedBy: david._id },
            { video: videos[3]._id, likedBy: asad._id },
            { video: videos[5]._id, likedBy: asad._id },
            { video: videos[5]._id, likedBy: sarah._id }
        ]);
        console.log("✓ Likes created.");

        // 6. Set Watch History for Asad
        asad.watchHistory = [videos[0]._id, videos[1]._id, videos[5]._id];
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
