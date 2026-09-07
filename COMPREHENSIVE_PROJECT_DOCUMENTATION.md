# VideoTube — Comprehensive Technical Documentation

> **A Cloud-Native, DevOps-Oriented Video Streaming Platform**
> Documented for B.Tech Major Project Viva, Technical Interviews, and Onboarding

---
## Table of Contents

| Part | Section |
|------|---------|
| 1 | [Project Overview](#part-1--project-overview) |
| 2 | [Complete System Architecture](#part-2--complete-system-architecture) |
| 3 | [Database Architecture](#part-3--database-architecture) |
| 4 | [Redis Caching Architecture](#part-4--redis-caching-architecture) |
| 5 | [Video Storage and Amazon S3](#part-5--video-storage-and-amazon-s3) |
| 6 | [Docker and Containerization](#part-6--docker-and-containerization) |
| 7 | [AWS Cloud Architecture](#part-7--aws-cloud-architecture) |
| 8 | [ECS EC2 Deployment Architecture](#part-8--ecs-ec2-deployment-architecture) |
| 9 | [ALB and Routing](#part-9--application-load-balancer-and-routing) |
| 10 | [Terraform IaC](#part-10--terraform-infrastructure-as-code) |
| 11 | [CI/CD Pipeline](#part-11--cicd-pipeline) |
| 12 | [Complete Codebase Explanation](#part-12--complete-codebase-explanation) |
| 13 | [End-to-End User Flows](#part-13--end-to-end-user-flows) |
| 14 | [Security Architecture](#part-14--security-architecture) |
| 15 | [Local Development Guide](#part-15--local-development-guide) |
| 16 | [Deployment Guide](#part-16--deployment-guide) |
| 17 | [Troubleshooting](#part-17--troubleshooting) |
| 18 | [Architectural Decisions](#part-18--architectural-decisions-and-trade-offs) |
| 19 | [Current Project Status](#part-19--current-infrastructure-and-project-status) |

---
## PART 1 - PROJECT OVERVIEW

### What is VideoTube?

**VideoTube** is a full-stack, cloud-native video sharing and streaming platform -- conceptually similar to YouTube -- built as a B.Tech major project to demonstrate end-to-end software engineering skills across development, containerization, cloud infrastructure provisioning, and DevOps automation.

It allows registered users to **upload, watch, like, comment on, and manage video content**. The application is fully containerized with Docker, provisioned on AWS using Terraform Infrastructure-as-Code, deployed on Amazon ECS (EC2 launch type), backed by MongoDB Atlas as the database, and integrated with a complete GitHub Actions CI/CD pipeline that tests, builds, and deploys the application automatically on every push to the main branch.

### Problem it Solves

From a software engineering and DevOps perspective, VideoTube demonstrates how a modern web application can be:

1. **Developed locally** using Docker Compose (consistent environment for all developers).
2. **Stored in a private container registry** (Amazon ECR) using immutable, commit-tagged image builds.
3. **Deployed on managed cloud compute** (Amazon ECS) with automatic health management, service scaling, and zero-downtime re-deployments.
4. **Scaled** horizontally using Auto Scaling Groups and ECS service capacity management.
5. **Observed** using AWS CloudWatch logs and alarms.
6. **Secured** using layered IAM roles, security groups, JWT-based authentication, and S3 presigned URLs.

### Main Features

| Feature | Description |
|---------|-------------|
| User Registration and Login | JWT-based authentication with access and refresh tokens |
| Video Upload | MP4 and other video files uploaded directly to Amazon S3 |
| Thumbnail Upload | Optional thumbnail; default Unsplash fallback if omitted |
| Video Playback | Secure S3 presigned URL generation for streaming |
| Video Like/Unlike | Toggle likes; like count tracked in MongoDB |
| Comments | Add, update, delete comments on videos |
| Comment Likes | Like/unlike individual comments |
| Subscriptions | Subscribe/unsubscribe to channels |
| Watch History | Automatically recorded, most-recent first, limited to 100 entries |
| Channel Profile | View any user channel, subscriber count, subscription status |
| Liked Videos Page | View all videos liked by the current user |
| Subscriptions Feed | View videos from channels the user subscribes to |
| Video Delete | Owner-only cascading deletion (DB + S3 + comments + likes) |
| Redis Caching | Feed caching with 2-minute TTL and automatic invalidation |
| Health Check | System health endpoint polled by ALB for container liveness |

### Technology Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Frontend Framework | React | v19.x |
| Frontend Build Tool | Vite | v8.x |
| Frontend Routing | React Router DOM | v7.x |
| HTTP Client | Axios | v1.x |
| Frontend Icons | Lucide React | v1.x |
| Frontend Server | Nginx | Alpine |
| Backend Runtime | Node.js | v20 LTS |
| Backend Framework | Express | v5.x |
| Database | MongoDB Atlas | Fully managed cloud MongoDB |
| ODM | Mongoose | v9.x |
| Caching | Redis via ioredis | v7.x (ElastiCache in production) |
| Authentication | JWT (jsonwebtoken) | Access + Refresh tokens |
| Password Hashing | bcrypt | v6.x, 10 salt rounds |
| File Upload | Multer | v2.x (disk storage to temp) |
| Object Storage | Amazon S3 (AWS SDK v3) | Videos, thumbnails, avatars |
| S3 Presigning | @aws-sdk/s3-request-presigner | v3.x |
| Container Runtime | Docker | Multi-stage builds |
| Local Orchestration | Docker Compose | 4-service stack |
| Cloud Provider | Amazon Web Services | ap-south-1 (Mumbai) |
| Container Orchestration | Amazon ECS | EC2 launch type |
| Container Registry | Amazon ECR | Two private repositories |
| Load Balancing | AWS ALB | Path-based routing |
| IaC Tool | Terraform | v1.5.x, AWS provider ~5.0 |
| CI/CD | GitHub Actions | OIDC-based AWS auth, 4 jobs |
| Observability | AWS CloudWatch | Log groups + metric alarms |
| CI Auth | GitHub OIDC Provider | No long-lived IAM keys |

### Why This is Cloud-Native and DevOps-Oriented

A project is **cloud-native** when it is designed specifically to leverage cloud services rather than being adapted from an on-premises architecture. VideoTube qualifies because:

1. **Containerized from day one** -- every component runs as a Docker container.
2. **Infrastructure as Code** -- all AWS resources (VPC, subnets, ECS, ALB, ECR, S3, ElastiCache, IAM roles, security groups, CloudWatch) are defined in Terraform. There is no manual AWS console work.
3. **Fully automated CI/CD** -- pushing code to main triggers a pipeline that validates, builds Docker images, pushes to ECR, and deploys to ECS without any human intervention.
4. **Managed services** -- MongoDB Atlas (managed database), Amazon ElastiCache (managed Redis), Amazon S3 (managed object storage), Amazon ECS (managed container orchestration).
5. **Horizontal scalability** -- ECS services can run multiple tasks; an Auto Scaling Group adds EC2 nodes automatically based on CPU metrics.
6. **Secure secret management** -- no secrets are hard-coded; injected via ECS task definitions and GitHub Actions secrets.
7. **Observability** -- CloudWatch log groups capture all container stdout/stderr; metric alarms trigger on high CPU or unhealthy host counts.

---

## PART 2 - COMPLETE SYSTEM ARCHITECTURE

### High-Level Architecture Diagram

The complete system has these major layers:

**User Browser -> ALB -> EC2 Nodes (ECS) -> MongoDB Atlas / ElastiCache Redis / Amazon S3**

When deployed on AWS:
- The ALB is the single entry point. It routes /api/* to backend containers and everything else to frontend containers.
- Backend and frontend containers both run on EC2 instances managed by ECS.
- Redis (ElastiCache) is in private subnets, accessible only from the ECS security group.
- MongoDB Atlas is an external cloud database (not inside the VPC).
- S3 is accessed by the backend via IAM Task Role -- no credentials in code.

### Request Journey Through the System

1. User opens the ALB DNS URL in browser.
2. DNS resolves to ALB IP. ALB evaluates listener rules on port 80.
3. Path /api/* -> Backend Target Group -> Backend Container (Node.js:8000).
4. All other paths -> Frontend Target Group -> Frontend Container (Nginx:80).
5. Nginx serves the compiled React SPA (index.html + JS bundle).
6. React boots: AuthProvider calls GET /api/v1/users/current-user to restore session.
7. User clicks a video: Axios sends GET /api/v1/videos/:videoId with Bearer token header.
8. Backend: optionalVerifyJWT reads token, controller checks Redis, queries MongoDB, generates S3 presigned URLs.
9. Response with presigned playbackUrl returned to browser.
10. React renders <video src={playbackUrl}> -- stream goes directly from S3 to browser.

### Frontend Architecture

**Entry point**: main.jsx -> renders <App />.

**App.jsx**: Wraps in AuthProvider + BrowserRouter. Layout: Navbar + Sidebar + main content area + UploadModal overlay.

**Pages**:
- / -> HomePage: video feed grid
- /watch/:videoId -> WatchPage: player, likes, comments, delete
- /c/:username -> ChannelPage: channel profile, subscribe
- /auth -> AuthPage: login/register forms
- /history -> HistoryPage: watch history
- /liked-videos -> LikedVideosPage: liked videos
- /subscriptions -> SubscriptionsPage: subscribed channels' videos

**Components**: Navbar, Sidebar, VideoCard, UploadModal.

**State**: React Context API (AuthContext), component-local useState.

**API client** (pi/client.js): Axios instance with baseURL /api/v1, withCredentials: true.
- Request interceptor: attaches Authorization: Bearer token from localStorage.
- Response interceptor: on 401, auto-refreshes token using refresh-token endpoint and retries.

**How requests reach backend**:
- Local dev (npm run dev): Vite proxy /api -> localhost:8000.
- Docker Compose: Nginx proxy /api -> http://backend:8000.
- Production: Browser sends /api/* directly to ALB, which routes to backend (Nginx is bypassed).

### Backend Architecture

**index.js**: Sets DNS servers, loads env, starts HTTP server, calls connectDB().
**app.js**: Configures Express -- trust proxy, CORS, middleware, routes, global error handler.

Route mounting:
- /api/v1/healthcheck
- /api/v1/users
- /api/v1/videos
- /api/v1/subscriptions
- /api/v1/comments
- /api/v1/likes

Every controller is wrapped in syncHandler which catches errors and passes them to the global error handler via 
ext(err).

### Authentication: Dual-Token JWT

**Access Token**: JWT signed with ACCESS_TOKEN_SECRET, expires in 1d (1 day). Payload: {_id, email, fullName, username}.
**Refresh Token**: JWT signed with REFRESH_TOKEN_SECRET, expires in 10d (10 days). Payload: {_id} only.

**Flow**:
1. Login: verify password with bcrypt, generate both tokens, store refresh token in MongoDB, set both as httpOnly cookies, also return in JSON body.
2. AuthContext stores tokens in localStorage for Axios header injection.
3. Subsequent requests: Axios attaches Bearer token. Backend verifyJWT middleware validates and populates req.user.
4. 401 response: Axios interceptor reads refresh token from localStorage, calls /users/refresh-token, stores new tokens, retries original request.
5. Logout: clears refreshToken from DB and clears both cookies. AuthContext clears localStorage.

**Dynamic cookie settings** (getCookieOptions in user.controller.js):
- Reads x-forwarded-proto from ALB headers (trust proxy 1 makes this work).
- HTTPS: secure:true, sameSite:none.
- HTTP: secure:false, sameSite:lax.
This prevents silent cookie drops on the current HTTP deployment.

---

## PART 3 - DATABASE ARCHITECTURE

### MongoDB Atlas

MongoDB Atlas is the fully managed cloud MongoDB service. The application uses the database named ideotube (from ackend/constants.js).

**Connection** (ackend/src/db/index.js):
- Reads MONGODB_URI from env, appends /videotube if not present.
- Connects with 5s serverSelectionTimeout.
- On failure: logs error, retries after 5s with setTimeout.

### Collections and Schemas

#### users Collection

Fields:
- username: String, unique, lowercase, indexed
- email: String, unique, lowercase
- fullName: String, required
- password: String, required, min 6 chars (stored as bcrypt hash)
- avatar: String (S3 key or external URL, defaults to Unsplash URL)
- coverImage: String (S3 key for channel banner)
- watchHistory: Array of ObjectId references to Video collection (max 100)
- refreshToken: String (current active refresh token for session validation)
- createdAt, updatedAt: timestamps

Schema Methods:
- isPasswordCorrect(password): bcrypt.compare against hash
- generateAccessToken(): jwt.sign with ACCESS_TOKEN_SECRET, 1d expiry
- generateRefreshToken(): jwt.sign with REFRESH_TOKEN_SECRET, 10d expiry

Pre-save hook: hashes password with bcrypt.hash(password, 10) if password was modified.

#### videos Collection

Fields:
- videoFile: String, required (S3 key e.g. "videos/uuid.mp4")
- thumbnail: String (S3 key or Unsplash URL default)
- title: String, required
- description: String, required
- duration: Number, default 0 (not auto-extracted -- limitation)
- views: Number, default 0 (incremented per getVideoById call)
- isPublished: Boolean, default true
- owner: ObjectId -> User
- createdAt, updatedAt: timestamps

Plugin: mongoose-aggregate-paginate-v2 enables Video.aggregatePaginate().

#### comments Collection

Fields:
- content: String, required, trimmed
- video: ObjectId -> Video, required
- owner: ObjectId -> User, required
- createdAt, updatedAt: timestamps

Plugin: mongoose-aggregate-paginate-v2.

#### likes Collection

A Like document represents one user liking one item (video OR comment). Only one of video/comment is set per document.

Fields:
- video: ObjectId -> Video (set for video likes)
- comment: ObjectId -> Comment (set for comment likes)
- likedBy: ObjectId -> User, required
- createdAt, updatedAt: timestamps

Toggle logic: findOne({video, likedBy}). If found -> delete (unlike). If not found -> create (like).

#### subscriptions Collection

Both fields reference the User collection since every user is also a channel.

Fields:
- subscriber: ObjectId -> User (the user subscribing)
- channel: ObjectId -> User (the channel being subscribed to)
- createdAt, updatedAt: timestamps

To count subscribers of user X: query {channel: X}.
To find channels user X subscribes to: query {subscriber: X}.

### Collection Relationships

`
USER (1) ----< VIDEO (many)         via video.owner
USER (1) ----< COMMENT (many)       via comment.owner
USER (1) ----< LIKE (many)          via like.likedBy
USER (1) ----< SUBSCRIPTION (many)  via subscription.subscriber
USER (1) ----< SUBSCRIPTION (many)  via subscription.channel
VIDEO (1) ---< COMMENT (many)       via comment.video
VIDEO (1) ---< LIKE (many)          via like.video
COMMENT (1) -< LIKE (many)          via like.comment
USER.watchHistory ---[ VIDEO IDs ]  (embedded array of references)
`

---

## PART 4 - REDIS CACHING ARCHITECTURE

### Why Redis is Used

Without caching, every video feed request runs a MongoDB aggregation pipeline with $match, $lookup (joining users), $sort, and pagination. Redis stores the JSON result so identical subsequent requests are served from memory in microseconds.

### What is Cached

The getAllVideos endpoint caches the paginated video feed with a 2-minute (120 second) TTL.

Cache key pattern: videos:feed:p:{page}:l:{limit}:q:{query}:sort:{sortBy}:{sortType}:u:{userId}

Note: Individual video detail (getVideoById) is NOT cached in reads. The key video:detail:{videoId} is deleted on update/delete but never set on fetch -- a minor inconsistency in the codebase.

### Cache-Aside Pattern

1. Build a deterministic cache key from all query parameters.
2. Call getCache(key) -- if HIT, return cached JSON immediately with X-Cache: HIT header.
3. On MISS: run MongoDB aggregation, generate S3 presigned URLs.
4. Call setCache(key, result, 120) to cache for 2 minutes.
5. Return result with X-Cache: MISS header.

### Cache Invalidation

When video data changes, relevant cache is invalidated:
- New video uploaded: invalidateCachePattern("videos:feed:*") deletes ALL feed keys.
- Video updated: same feed pattern + deleteCache("video:detail:{videoId}").
- Video deleted: same as update.
- Publish status toggled: same as update.

invalidateCachePattern uses Redis SCAN with a glob pattern -- non-blocking, unlike KEYS*.

### Redis Client Configuration (redis.js)

- lazyConnect: true (do not connect at module load time)
- enableOfflineQueue: false (fail fast, no queuing)
- maxRetriesPerRequest: 1
- connectTimeout: 2000ms, commandTimeout: 1500ms
- retryStrategy: stops after 3 attempts (returns null)

### Graceful Degradation

Every cache function is wrapped in try/catch returning null/false on failure. Controllers check the return:

  const cachedVideos = await getCache(cacheKey);
  if (cachedVideos) { return res.json(cachedVideos); }
  // Falls through to MongoDB if Redis unavailable

Redis failure NEVER crashes the backend. Application falls back to MongoDB queries automatically.

In production: Redis = Amazon ElastiCache (private subnet, always available).
In Docker Compose: Redis = redis:7-alpine container.
Without Docker: Backend warns and continues without caching.

---

## PART 5 - VIDEO STORAGE AND AMAZON S3

### Why Amazon S3

Container storage is ephemeral (files lost on restart). Multiple ECS tasks cannot share local disk. Amazon S3 provides virtually unlimited, 99.999999999% durable (11 nines) object storage external to the containers.

### S3 Bucket Configuration (s3.tf)

- Bucket name: videotube-dev-media-{random_hex} (random suffix for global uniqueness)
- Public access: completely blocked (all four block_public_* settings = true)
- Encryption: Server-Side Encryption with AES256
- CORS: allows GET, PUT, POST, HEAD from any origin (required for presigned URL access and streaming)

### S3 Object Key Structure

Files are stored with folder prefixes in the key:
- videos/       -- MP4 video files (e.g., videos/1725890000-video.mp4)
- thumbnails/   -- Thumbnail images
- avatars/      -- User avatar images
- cover-images/ -- Channel cover/banner images

MongoDB stores only the S3 key (not the full URL). Full URLs are computed on-demand via presigning.

### Complete Video Upload Flow

1. User selects MP4 in UploadModal, submits FormData via POST /api/v1/videos.
2. ALB routes to backend. Multer saves file to backend/public/temp/ disk staging directory.
3. publishAVideo controller validates title, description, video file presence.
4. uploadToS3(localPath, "videos") streams the file to S3 via PutObjectCommand.
5. Local temp file deleted with fs.unlinkSync.
6. If thumbnail provided: upload to thumbnails/ folder. Else: use default Unsplash URL.
7. Video.create({title, desc, videoFile: s3Key, thumbnail, owner: req.user._id}).
8. invalidateCachePattern("videos:feed:*") busts stale cache.
9. Returns 201 with created video.

### Video Retrieval and Presigned URLs

Direct S3 URLs require AWS credentials. Instead, presigned URLs are generated -- time-limited signed GET URLs that authorize the holder to download the object for a set period (default: 3600 seconds = 1 hour).

Every call to getVideoById:
1. Fetches video S3 key from MongoDB.
2. Generates presigned URL for videoFile (1hr expiry).
3. Generates presigned URL for thumbnail and owner avatar.
4. Returns playbackUrl in JSON response.
5. React sets <video src={playbackUrl}> -- browser streams directly from S3.

Known limitation: Presigned URLs expire in 1 hour. Page refresh needed for a new URL after expiry.

### Video Deletion Flow (Cascading)

Owner-only deletion (deleteVideo controller):
1. Verify ownership: video.owner.equals(req.user._id) else 403 Forbidden.
2. Video.findByIdAndDelete(videoId).
3. Comment.deleteMany({ video: videoId }) -- cascade delete all comments.
4. Like.deleteMany({ video: videoId }) -- cascade delete all likes.
5. User.updateMany({ watchHistory: videoId }, {$pull: {watchHistory: videoId}}) -- remove from all watch histories.
6. deleteMedia(video.videoFile) -- sends DeleteObjectCommand to S3.
7. deleteMedia(video.thumbnail) -- deletes thumbnail from S3.
8. Invalidates Redis cache.

### S3 IAM Permissions

Production: ECS Task Role (ecs_task_role) grants the running container:
- s3:PutObject, s3:GetObject, s3:DeleteObject on bucket/*
- s3:ListBucket on the bucket

No static credentials in production. Local dev uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from .env.

### Storage Provider Abstraction (utils/storage.js)

Reads STORAGE_PROVIDER env var:
- "s3" -> delegates to s3.js (current production)
- anything else -> delegates to cloudinary.js (legacy support)

Provides uploadMedia(localPath, folder) and deleteMedia(keyOrUrl) as unified interface.

---

## PART 6 - DOCKER AND CONTAINERIZATION

### Docker Image vs Docker Container

- A Docker Image is a read-only, layered filesystem snapshot defined by a Dockerfile. It is a blueprint.
- A Docker Container is a running instance of a Docker Image -- an isolated process with its own filesystem, network, and process space.
- Many containers can be started from the same image simultaneously.

Analogy: Image is a class definition; Container is an instance of that class.

### Backend Dockerfile (Multi-Stage Build)

Stage 1 "builder" (node:20-alpine):
- Installs native build tools: python3, make, g++ (needed to compile bcrypt's C++ native addon).
- Runs npm ci --omit=dev to install only production dependencies.

Stage 2 "runner" (node:20-alpine):
- Does NOT include the build tools (smaller attack surface, smaller image size).
- Copies only the compiled node_modules from the builder stage.
- Copies source code: app.js, index.js, constants.js, src/, public/.
- Creates public/temp/ with correct permissions.
- Runs as non-root "node" user for security.
- Sets HEALTHCHECK: curl -f http://localhost:8000/api/v1/healthcheck || exit 1
- CMD: ["node", "index.js"]
- Exposes port 8000.

Why multi-stage? The builder stage may download hundreds of MB of compilers. The final runner image only contains the compiled deps and source code -- no compilers, no build tools.

### Frontend Dockerfile (Multi-Stage Build)

Stage 1 "builder" (node:20-alpine):
- npm ci installs all dependencies.
- npm run build runs Vite to compile React app to /app/dist (static HTML, JS, CSS bundles).

Stage 2 "runner" (nginx:alpine):
- Copies only /app/dist to /usr/share/nginx/html.
- Copies custom nginx.conf.
- Exposes port 80.
- CMD: ["nginx", "-g", "daemon off;"]

The final frontend image contains ONLY Nginx and the compiled static files. No Node.js, no source code, no node_modules in production.

### Nginx Configuration (frontend/nginx.conf)

Key sections:
1. gzip compression for text/css/js/json/svg assets.
2. client_max_body_size 100M (for video file uploads proxied to backend).
3. /healthz location: returns 200 "healthy\n" -- used as health check endpoint.
4. Static asset caching: .js, .css, images, fonts cached for 1 year (Cache-Control: immutable).
5. SPA routing: location / { try_files $uri $uri/ /index.html; } -- all unknown paths serve index.html so React Router handles routing client-side.
6. /api/ proxy: proxy_pass to http://backend:8000 (Docker DNS resolves "backend" to backend container). Used only in Docker Compose; NOT used in production where ALB handles routing.

### Docker Compose (Local Development)

Four services on the "videotube_net" bridge network:

| Service | Image | Port | Healthcheck |
|---------|-------|------|-------------|
| mongo | mongo:7.0 | 27017 | mongosh ping |
| redis | redis:7-alpine | 6379 | redis-cli ping |
| backend | Built from ./backend/Dockerfile | 8000 | Dockerfile HEALTHCHECK |
| frontend | Built from ./frontend/Dockerfile | 80, 5173 | none |

Dependency ordering:
- backend depends on mongo (healthy) and redis (healthy).
- frontend depends on backend.

Named volumes: mongo_data (persists MongoDB data), redis_data (persists Redis data).

Backend environment in Docker Compose reads AWS credentials from host environment variables (${AWS_ACCESS_KEY_ID}) so developers provide their own credentials without modifying the Compose file.

---

## PART 7 - AWS CLOUD ARCHITECTURE

### Region and Availability Zones

All resources deployed in ap-south-1 (Asia Pacific -- Mumbai).
Two AZs used: ap-south-1a and ap-south-1b.

Using two AZs: ALB requires at least 2 AZs. ASG can spread EC2 across zones for resilience.

### VPC and Networking

VPC (videotube-dev-vpc): 10.0.0.0/16 -- the isolated private network.

Public Subnets:
- 10.0.1.0/24 (ap-south-1a) and 10.0.2.0/24 (ap-south-1b)
- map_public_ip_on_launch = true (EC2 instances get public IPs)
- Connected to Internet Gateway via public route table (0.0.0.0/0 -> IGW)
- Why public? Avoids NAT Gateway cost (~$32/month). Security enforced by Security Groups.

Private Subnets:
- 10.0.10.0/24 (ap-south-1a) and 10.0.11.0/24 (ap-south-1b)
- Only local route table (no internet route)
- Exclusively for ElastiCache Redis -- no internet access needed

Internet Gateway (videotube-dev-igw): allows inbound internet traffic to ALB, outbound from EC2 to ECR/S3/internet.

### Security Groups

1. ALB Security Group (videotube-dev-alb-sg):
   - Inbound: TCP 80 from 0.0.0.0/0 (internet)
   - Outbound: All traffic

2. ECS EC2 Nodes Security Group (videotube-dev-ecs-sg):
   - Inbound: TCP 32768-65535 from ALB SG only (dynamic/ephemeral host ports for bridge mode)
   - Inbound: TCP 8000 from ALB SG (direct container port)
   - Outbound: All traffic (ECR pulls, MongoDB Atlas, S3, AWS APIs)
   
   Why ephemeral ports? In ECS bridge networking, each container port (e.g., 8000) is mapped to a random host port in the 32768-65535 range. The ALB registers the EC2 instance with this dynamic port. Multiple containers can run on the same host without port conflicts.

3. ElastiCache Security Group (videotube-dev-elasticache-sg):
   - Inbound: TCP 6379 from ECS SG only
   - Outbound: All traffic
   - Redis is completely inaccessible from the internet.

### EC2 vs ECS -- Critical Distinction

| Term | Definition |
|------|-----------|
| EC2 Instance | Virtual machine on AWS hardware. OS: ECS-Optimized Amazon Linux 2. |
| ECS Cluster | Logical grouping of compute capacity where tasks are placed. |
| ECS Container Instance | An EC2 instance registered with the ECS cluster via the ECS Agent. |
| ECS Service | Ensures a desired count of Task instances always run. Manages deployments. |
| ECS Task | A single running instance of a Task Definition (one or more containers). |
| Task Definition | JSON blueprint: container image, CPU/memory, env vars, ports, log config, health check. |
| Docker Container | The actual process inside a Task, from a Docker Image pulled from ECR. |

Hierarchy: ECS Cluster -> ECS Service -> ECS Task -> Docker Container(s)

### Amazon ECR

Two private repositories:
- videotube-dev-backend
- videotube-dev-frontend

Both have:
- image_tag_mutability = "MUTABLE" (allows pushing "latest" tag)
- scan_on_push = true (CVE scanning on every push)
- Lifecycle policy: keep last 5 images only (auto-delete older images to save storage costs)

Images pushed with two tags per deploy:
- Immutable git SHA tag (e.g., 21b24b4dc6ebdf66cdd0fb90ff419066cf0284aa) -- exact code version
- "latest" tag -- most recently deployed image

### CloudWatch Observability

Log Groups:
- /ecs/videotube-dev-backend -- backend stdout/stderr, 7-day retention
- /ecs/videotube-dev-frontend -- Nginx logs, 7-day retention

Metric Alarms (CloudWatch):
- videotube-dev-high-cpu-alarm: backend service CPU >= 80% for 2 consecutive 60s periods
- videotube-dev-unhealthy-hosts-alarm: any unhealthy host in backend target group for 1 period

Important: No SNS topic or notification action is configured. Alarms trigger silently (visible in CloudWatch console only). This is a known gap -- no alerting/paging currently set up.

---

## PART 8 - ECS EC2 DEPLOYMENT ARCHITECTURE

### Why ECS was Chosen

ECS is AWS's native container orchestration service. It integrates natively with ECR, ALB, CloudWatch, and IAM -- the lowest-friction way to run containers on AWS. Kubernetes (via EKS) is more powerful but significantly more complex and expensive to operate.

### Why EC2 Launch Type (Not Fargate)

- Cost: t3.micro instance is free-tier eligible (~$8-10/month). Fargate pricing (per vCPU/memory-second) costs more for always-on workloads.
- Control: EC2 gives fine-grained control over instance type, storage, networking mode.
- Educational value: Managing EC2 nodes with ASG, Capacity Providers, Launch Templates, and IAM Instance Profiles provides richer learning for a DevOps project.

### Full Deployment Trace

1. EC2 Instance launches from ASG using Launch Template.
   - AMI: Latest ECS-Optimized Amazon Linux 2 (fetched from AWS SSM Parameter Store dynamically in Terraform).
   - Instance type: t3.micro.
   - IAM Instance Profile: ecs_instance_role (allows ECS agent to register with cluster, write CloudWatch logs, pull from ECR).

2. User Data script executes on boot:
   echo ECS_CLUSTER=videotube-dev-cluster >> /etc/ecs/ecs.config

3. ECS Agent starts automatically on the Amazon Linux 2 AMI.
   - Reads the cluster name from /etc/ecs/ecs.config.
   - Registers the EC2 instance as a Container Instance with the ECS cluster.

4. ECS Capacity Provider (videotube-dev-ec2-capacity-provider) sees available compute.

5. ECS Service Scheduler places tasks on the Container Instance.

6. ECS Agent receives the task placement and reads the Task Definition.

7. Docker pull from ECR: pulls videotube-dev-backend:{SHA} image.

8. Docker run: starts the container with port 8000 mapped to a random ephemeral host port.

9. ECS registers the EC2 instance+port in the ALB Backend Target Group.

10. ALB health check: GET /api/v1/healthcheck -> 200 OK.

11. Target is marked healthy. ALB routes traffic to the new container.

### Auto Scaling Configuration

EC2 Auto Scaling Group (videotube-dev-ecs-asg):
- min_size = 1 (always at least 1 EC2 node running)
- desired_capacity = 1 (normal operating count)
- max_size = 2 (can scale up to 2 nodes under load)
- protect_from_scale_in = true (ECS drains tasks gracefully before EC2 terminates)

ECS Service Application Auto Scaling (backend service):
- min_capacity = 1 task
- max_capacity = 3 tasks
- Scale out: CPU utilization >= 70% triggers adding a task (60s cooldown)
- Scale in: 300s cooldown to prevent flapping

### Rolling Deployment (Zero Downtime)

When CI/CD deploys a new image:
1. ECS registers a new task definition revision.
2. ECS Service starts new task(s) with the new image.
3. Waits for new task health checks to pass (ALB marks it healthy).
4. Registers new task in ALB target group.
5. Drains old task (ALB stops routing to it, waits for in-flight requests to complete).
6. Stops old container.

Result: zero downtime during deployment. At no point are all containers stopped simultaneously.

### Task Definitions

Backend Task Definition (videotube-dev-backend):
- Network mode: bridge (EC2 mode; Fargate uses awsvpc which gives each task its own ENI)
- CPU: 256 units (1/4 vCPU of the host EC2)
- Memory: 400 MB hard limit
- Container port: 8000 -> host port 0 (dynamic ephemeral port)
- All configuration via environment variables (MONGODB_URI, REDIS_HOST, JWT secrets, S3 bucket, etc.)
- Log driver: awslogs -> /ecs/videotube-dev-backend CloudWatch log group
- Health check: curl -f http://localhost:8000/api/v1/healthcheck || exit 1 (30s interval, 5s timeout)
- Execution Role: ecs_execution_role (pull ECR image, write CloudWatch logs)
- Task Role: ecs_task_role (S3 access for the running application)

Frontend Task Definition (videotube-dev-frontend):
- Network mode: bridge
- CPU: 128 units, Memory: 200 MB
- Container port: 80 -> host port 0 (dynamic)
- Health check: wget -q --spider http://localhost:80/healthz || exit 1
- No task role (Nginx does not access AWS APIs)

### IAM Roles for ECS

ecs_execution_role: Used by the ECS agent/ECR to set up the container.
- Permissions: ecr:GetAuthorizationToken, ecr:BatchGetImage, ecr:GetDownloadUrlForLayer, logs:CreateLogStream, logs:PutLogEvents

ecs_instance_role: Attached to EC2 instances as Instance Profile.
- Permissions: ecs:RegisterContainerInstance, ecs:DeregisterContainerInstance, ecs:DiscoverPollEndpoint, ecs:Poll, ecs:Submit*, logs:*, ecr:* (standard ECS instance policy AmazonEC2ContainerServiceforEC2Role)

ecs_task_role: Attached to running containers (the application itself).
- Custom inline policy: S3 PutObject, GetObject, DeleteObject, ListBucket on the media bucket.

---

## PART 9 - APPLICATION LOAD BALANCER AND ROUTING

### ALB Configuration

Name: videotube-dev-alb
Type: Application Load Balancer (Layer 7 -- HTTP/HTTPS aware)
Scheme: internet-facing (internal = false)
Subnets: both public subnets (ap-south-1a and ap-south-1b)
Security Group: alb-sg (allows TCP 80 from 0.0.0.0/0)

### Listener Rules (HTTP:80)

The ALB has a single HTTP listener on port 80 with two actions:

Rule Priority 10 (evaluated first):
- Condition: path pattern /api/*
- Action: Forward to Backend Target Group (videotube-dev-tg)

Default Action (evaluated last, catches everything else):
- Action: Forward to Frontend Target Group (videotube-dev-frontend-tg)

Traffic flow:
- /api/v1/users/login -> Backend Container (Node.js:8000)
- /api/v1/videos -> Backend Container
- / -> Frontend Container (Nginx:80) -> serves index.html
- /watch/abc123 -> Frontend Container -> serves index.html -> React Router renders WatchPage
- /history -> Frontend Container -> serves index.html -> React Router renders HistoryPage

### Target Groups

Backend Target Group (videotube-dev-tg):
- target_type = "instance" (registers EC2 instance ID + dynamic port)
- Health check: GET /api/v1/healthcheck, expects 200
- Healthy threshold: 2 consecutive successes
- Unhealthy threshold: 3 consecutive failures
- Interval: 30s, Timeout: 5s

Frontend Target Group (videotube-dev-frontend-tg):
- target_type = "instance"
- Health check: GET /, expects 200
- Same thresholds and timing

### Why Both Services Share One ALB

One ALB costs ~$16-18/month. Using separate ALBs for frontend and backend would double infrastructure cost. Path-based routing on a single ALB serves both, making it cost-efficient.

This also means both services share a single DNS name and port -- the frontend and backend API appear as one unified application to the browser. No CORS issues with separate domains.

### Sticky Sessions

Not configured. Requests can be routed to any healthy target. Since the backend is stateless (all state in MongoDB/Redis), this works correctly.

---

## PART 10 - TERRAFORM INFRASTRUCTURE AS CODE

### What is Infrastructure as Code?

Instead of clicking through the AWS console, Terraform lets you declare all AWS resources in .tf files. Running terraform apply creates/modifies/destroys resources to match the declaration. Benefits: reproducibility, version control, peer review, automatic dependency resolution, state tracking.

### Terraform File Inventory

| File | Purpose |
|------|---------|
| main.tf | AWS provider config, required versions, locals (name_prefix, az_a, az_b) |
| variables.tf | Input variable declarations with types and defaults |
| terraform.tfvars | Actual variable values (excluded from Git) |
| terraform.tfvars.example | Template for developers to copy |
| outputs.tf | Output values: ALB DNS, ECR repo URLs, S3 bucket name |
| vpc.tf | VPC, public subnets, private subnets, route tables, IGW |
| security_groups.tf | ALB SG, ECS SG, ElastiCache SG |
| alb.tf | ALB, backend + frontend target groups, HTTP listener, listener rules |
| ecr.tf | ECR repositories for backend + frontend, lifecycle policies |
| ecs.tf | IAM roles (execution, task, instance), EC2 launch template, ASG, capacity provider, ECS cluster, task definitions, services, application auto-scaling |
| elasticache.tf | ElastiCache subnet group, Redis cluster |
| s3.tf | S3 bucket, public access block, SSE, CORS configuration |
| cloudwatch.tf | CloudWatch log groups, CPU and unhealthy host alarms |
| github_oidc.tf | GitHub OIDC identity provider, IAM role for GitHub Actions, inline deploy policy |

### Terraform Lifecycle

1. terraform init: Downloads AWS provider plugin, initializes backend. Run once.
2. terraform plan: Reads current state + .tf files. Shows what will be Created (+), Modified (~), or Destroyed (-). Makes NO AWS changes.
3. terraform apply: Executes the plan. Creates resources in dependency order. Updates terraform.tfstate.
4. terraform destroy: Deletes all resources tracked in terraform.tfstate.

The terraform.tfstate file tracks every resource with real AWS IDs (ARNs, resource IDs, etc.). It must NOT be committed with production secrets. This project commits state locally (acceptable for educational demo; production should use S3 remote state with DynamoDB locking).

### Key Terraform Design Decisions

Local naming prefix: name_prefix = "${var.project_name}-${var.environment}" -> "videotube-dev". All resources named with this prefix for easy identification and multi-environment support.

Dynamic AMI lookup: Instead of hardcoding AMI IDs (which differ by region and change over time), Terraform fetches the latest ECS-optimized Amazon Linux 2 AMI from AWS SSM Parameter Store:
  data "aws_ssm_parameter" "ecs_ami" {
    name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
  }

lifecycle { ignore_changes = [task_definition, desired_count] }: ECS services ignore task_definition and desired_count changes after creation. This prevents Terraform from overwriting task definitions deployed by the CI/CD pipeline (GitHub Actions registers new revisions independently of Terraform).

### GitHub OIDC Authentication (github_oidc.tf)

Traditional CI/CD stores long-lived AWS access keys as secrets. This project uses GitHub OIDC:

1. GitHub Actions generates a short-lived OIDC token for each workflow run.
2. The IAM role videotube-github-actions-role has a trust policy allowing sts:AssumeRoleWithWebIdentity from GitHub's OIDC provider.
3. Condition restricts trust to repo:SyedAsad108/videotube-devops:* only.
4. Role's inline policy allows: ecr:*, ecs:DescribeServices, ecs:UpdateService, ecs:RegisterTaskDefinition, ecs:DescribeTaskDefinition, iam:PassRole, elasticloadbalancing:DescribeLoadBalancers.
5. No static AWS keys ever stored. The OIDC token used per run expires immediately after the workflow completes.

### Terraform Dependency Graph (Key Resources)

  VPC
   |
   +-- Public Subnets -> Internet Gateway -> Public Route Table
   +-- Private Subnets -> Private Route Table
   +-- Security Groups (ALB, ECS, ElastiCache)
        |
        +-- ALB (uses ALB SG + public subnets)
        |    +-- Target Groups (backend, frontend)
        |    +-- HTTP Listener -> Listener Rules
        |
        +-- ElastiCache (uses elasticache SG + private subnets)
        |
        +-- ECR Repositories (independent)
        |
        +-- IAM Roles (execution, task, instance)
        |
        +-- EC2 Launch Template (uses ECS SG + IAM instance profile)
             +-- Auto Scaling Group -> ECS Capacity Provider
             +-- ECS Cluster
                  +-- Task Definitions (reference ECR repos, IAM roles)
                  +-- ECS Services (reference cluster, task defs, ALB target groups)
                       +-- Application Auto Scaling

---

## PART 11 - CI/CD PIPELINE

### Continuous Integration vs Continuous Deployment

- Continuous Integration (CI): Automatically validating code on every commit/PR (tests, build, lint).
- Continuous Delivery (CD): Automatically building a deployable artifact; deployment requires manual approval.
- Continuous Deployment: Automatically deploying every validated change to production without human approval.

VideoTube implements full Continuous Deployment to ECS on every push to main.

### Pipeline Trigger

On: push to main branch, or pull_request targeting main.

### Job 1: test-backend (runs on push + PR)

1. Checkout code.
2. Setup Node.js 20 with npm cache.
3. npm ci in backend directory.
4. Node.js syntax/boot check: loads app.js via dynamic import to verify:
   - No syntax errors
   - All imports resolve
   - No initialization crashes

### Job 2: build-frontend (runs on push + PR)

1. Checkout code.
2. Setup Node.js 20 with npm cache.
3. npm ci in frontend directory.
4. npm run build: Vite production build. Catches JSX syntax errors, missing imports, TypeScript errors.

The built dist/ is NOT persisted -- it will be rebuilt inside the Docker build in Job 4.

### Job 3: validate-terraform (runs on push + PR)

1. Checkout code.
2. Install Terraform v1.5.7.
3. terraform init -backend=false (init providers without AWS credentials or remote backend).
4. terraform validate: checks .tf syntax, resource type validity, variable references. Does NOT connect to AWS.

### Job 4: deploy-to-aws (runs ONLY on push to main, after all 3 jobs pass)

Step 1: aws-actions/configure-aws-credentials@v4
- Exchanges the GitHub OIDC token for temporary AWS credentials.
- Assumes the videotube-github-actions-role IAM role.

Step 2: aws-actions/amazon-ecr-login@v2
- Calls docker login with temporary ECR credentials.

Step 3: Build and push backend Docker image.
- docker build -t {ECR_REGISTRY}/videotube-dev-backend:{GITHUB_SHA} ./backend
- docker tag ... :latest
- docker push both tags.

Step 4: Build and push frontend Docker image.
- Same process for frontend repo.

Step 5: Download active Task Definitions from ECS.
- aws ecs describe-task-definition --task-definition videotube-dev-backend
- Uses jq to strip read-only fields (ARN, revision, status, registeredAt, registeredBy, compatibilities) that cannot be included when registering a new revision.

Step 6: aws-actions/amazon-ecs-render-task-definition@v1
- Substitutes the new Docker image URI (with git SHA tag) into the container definition.
- For backend: also injects MONGODB_URI from GitHub Secret into the task definition environment.

Step 7: aws-actions/amazon-ecs-deploy-task-definition@v2
- Registers the new task definition revision.
- Updates the ECS service to use the new revision.
- wait-for-service-stability: true blocks until ECS reports the service as stable.
- Applied to both backend and frontend services.

Step 8: Verification
- Queries aws ecs describe-services to confirm running count equals desired count.
- Queries aws elbv2 describe-load-balancers for ALB status.
- Calls curl on ALB /api/v1/healthcheck to confirm HTTP 200 response.

### GitHub Secrets and Variables

| Name | Type | Purpose |
|------|------|---------|
| MONGODB_URI | Secret | Injected into backend ECS task definition at deploy time |
| AWS_REGION | Variable | ap-south-1 |
| AWS_ROLE_TO_ASSUME | Variable | ARN of videotube-github-actions-role |
| ECS_CLUSTER | Variable | videotube-dev-cluster |
| ECR_REPOSITORY | Variable | videotube-dev-backend |
| ECR_FRONTEND_REPOSITORY | Variable | videotube-dev-frontend |
| ECS_SERVICE | Variable | videotube-dev-service |
| ECS_FRONTEND_SERVICE | Variable | videotube-dev-frontend-service |

---

## PART 12 - COMPLETE CODEBASE EXPLANATION

### Repository Structure

  VideoTube-DevOps/
  |
  +-- backend/                         # Node.js + Express API
  |   +-- src/
  |   |   +-- controllers/             # Business logic handlers
  |   |   |   +-- comment.controller.js
  |   |   |   +-- healthcheck.controller.js
  |   |   |   +-- like.controller.js
  |   |   |   +-- subscription.controller.js
  |   |   |   +-- user.controller.js
  |   |   |   +-- video.controller.js
  |   |   +-- db/
  |   |   |   +-- index.js             # MongoDB connection with retry logic
  |   |   +-- middlewares/
  |   |   |   +-- auth.middleware.js   # verifyJWT + optionalVerifyJWT
  |   |   |   +-- multer.middleware.js # File upload disk staging
  |   |   +-- models/                  # Mongoose schemas
  |   |   |   +-- comment.model.js
  |   |   |   +-- like.model.js
  |   |   |   +-- subscription.model.js
  |   |   |   +-- user.model.js
  |   |   |   +-- video.model.js
  |   |   +-- routes/                  # Express Router definitions
  |   |   |   +-- comment.routes.js
  |   |   |   +-- healthcheck.routes.js
  |   |   |   +-- like.routes.js
  |   |   |   +-- subscription.routes.js
  |   |   |   +-- user.routes.js
  |   |   |   +-- video.routes.js
  |   |   +-- utils/
  |   |       +-- ApiError.js          # Custom error class
  |   |       +-- ApiResponse.js       # Consistent response wrapper
  |   |       +-- asyncHandler.js      # try/catch wrapper for controllers
  |   |       +-- cloudinary.js        # Cloudinary upload (legacy/fallback)
  |   |       +-- redis.js             # Redis client + getCache/setCache/deleteCache
  |   |       +-- s3.js                # AWS S3 upload/delete/presign
  |   |       +-- storage.js           # Provider abstraction (S3 vs Cloudinary)
  |   +-- public/
  |   |   +-- temp/                    # Multer disk staging directory
  |   +-- app.js                       # Express configuration
  |   +-- index.js                     # Application entry point
  |   +-- constants.js                 # DB_NAME = "videotube"
  |   +-- Dockerfile                   # Multi-stage Docker build
  |   +-- .env.example                 # Environment variable template
  |   +-- package.json
  |
  +-- frontend/                        # React + Vite SPA
  |   +-- src/
  |   |   +-- api/
  |   |   |   +-- client.js            # Axios instance + interceptors
  |   |   +-- components/
  |   |   |   +-- Navbar.jsx
  |   |   |   +-- Sidebar.jsx
  |   |   |   +-- UploadModal.jsx
  |   |   |   +-- VideoCard.jsx
  |   |   +-- context/
  |   |   |   +-- AuthContext.jsx      # Global auth state + login/logout/register
  |   |   +-- pages/
  |   |   |   +-- AuthPage.jsx
  |   |   |   +-- ChannelPage.jsx
  |   |   |   +-- HistoryPage.jsx
  |   |   |   +-- HomePage.jsx
  |   |   |   +-- LikedVideosPage.jsx
  |   |   |   +-- SubscriptionsPage.jsx
  |   |   |   +-- WatchPage.jsx
  |   |   +-- App.jsx                  # Root component + layout + router
  |   |   +-- main.jsx                 # ReactDOM.createRoot entry point
  |   |   +-- index.css                # Global styles
  |   +-- nginx.conf                   # SPA routing + /api proxy + /healthz
  |   +-- Dockerfile                   # Multi-stage: Node build -> Nginx serve
  |   +-- vite.config.js               # Dev proxy: /api -> localhost:8000
  |   +-- package.json
  |
  +-- terraform/                       # All AWS Infrastructure as Code
  |   +-- main.tf, variables.tf, outputs.tf
  |   +-- vpc.tf, security_groups.tf
  |   +-- alb.tf, ecr.tf, ecs.tf
  |   +-- elasticache.tf, s3.tf
  |   +-- cloudwatch.tf, github_oidc.tf
  |   +-- terraform.tfvars.example
  |
  +-- .github/
  |   +-- workflows/
  |       +-- ci-cd.yml                # 4-job GitHub Actions pipeline
  |
  +-- k8s/                             # Kubernetes manifests (present, not deployed)
  +-- tests/                           # Test directory (present, content minimal)
  +-- docker-compose.yml               # Local full-stack orchestration
  +-- .gitignore                       # Excludes .env, terraform.tfvars, *.tfstate, node_modules
  +-- BACKEND_DOCUMENTATION.md         # Earlier partial documentation

### Backend Utilities -- Deep Dive

**utils/ApiError.js**

Custom class extending Error. Every controller throws new ApiError(statusCode, message) on errors.
The global error handler in app.js catches these and formats them as:
  { statusCode, message, success: false, errors: [] }

**utils/ApiResponse.js**

Simple wrapper class. Every successful response uses new ApiResponse(statusCode, data, message).
Response format: { statusCode, data, message, success: true }
This ensures every API response follows the same predictable structure.

**utils/asyncHandler.js**

Higher-order function that wraps async controllers:
  const asyncHandler = (fn) => async (req, res, next) => {
    try { await fn(req, res, next); }
    catch (err) { next(err); }
  };
No try/catch needed in individual controllers. All errors pass to the global error handler.

**utils/multer.middleware.js**

Multer configured with diskStorage to save files to public/temp/ with a timestamp-based filename.
Supported by upload.single(fieldname) and upload.fields([...]) calls in route definitions.
After S3 upload completes, the local temp file is deleted with fs.unlinkSync.

**middlewares/auth.middleware.js**

Two exported middlewares:
- verifyJWT: reads token from Authorization header or cookie. Calls jwt.verify(). Fetches user from DB. Sets req.user. Throws 401 if missing/invalid.
- optionalVerifyJWT: same but catches all errors silently. Sets req.user if valid, leaves it undefined if not. Used on public endpoints that also benefit from auth context (video feed, video detail).

### API Documentation

#### Authentication Endpoints (/api/v1/users)

POST /register
- Auth: No
- Accepts: fullName, username, email, password (JSON) + optional avatar, coverImage (multipart)
- Creates user account. Hashes password. Generates tokens. Returns user + token pair.
- Sets httpOnly cookies for accessToken and refreshToken.

POST /login
- Auth: No
- Accepts: username or email + password (JSON)
- Verifies bcrypt hash. Generates token pair. Stores refreshToken in DB.
- Returns user + token pair. Sets cookies.

POST /logout
- Auth: Yes (verifyJWT)
- Clears refreshToken from DB. Clears cookies.

POST /refresh-token
- Auth: No
- Accepts: refreshToken in body or cookie.
- Verifies refresh token, generates new token pair, saves new refreshToken to DB.
- Returns new accessToken + refreshToken.

GET /current-user
- Auth: Yes (verifyJWT)
- Returns authenticated user profile with presigned avatar URL.

POST /change-password
- Auth: Yes
- Accepts: oldPassword, newPassword
- Verifies old password, saves new hash.

PATCH /update-account
- Auth: Yes
- Accepts: fullName, email
- Updates account details.

PATCH /avatar
- Auth: Yes
- Accepts: avatar file (multipart)
- Uploads to S3, updates user.avatar, deletes old avatar from S3.

PATCH /cover-image
- Auth: Yes
- Accepts: coverImage file (multipart)
- Uploads to S3, updates user.coverImage, deletes old from S3.

GET /c/:username
- Auth: No
- Returns channel profile: subscriber count, isSubscribed (if auth), video count, presigned avatar.
- Uses MongoDB aggregation with $lookup on subscriptions collection.

GET /history
- Auth: Yes (verifyJWT)
- Returns watch history as array of Video documents, most recent first, with presigned URLs.
- Uses aggregation: $unwind watchHistory in reverse, $lookup video details, $group to restore array.

#### Video Endpoints (/api/v1/videos)

GET /
- Auth: No (cache-aside with Redis)
- Query params: page, limit, query, sortBy, sortType, userId
- Returns paginated video feed with owner info and presigned thumbnails.

POST /
- Auth: Yes
- Multipart: title, description, videoFile (required), thumbnail (optional)
- Uploads files to S3, creates Video document, busts cache.

GET /:videoId
- Auth: Optional (optionalVerifyJWT)
- Returns video with presigned playbackUrl, owner info, likesCount, isLiked, channel info.
- Increments views counter. Records to watch history if authenticated.

PATCH /:videoId
- Auth: Yes (owner only)
- Accepts: title, description, thumbnail file
- Updates video metadata. Busts cache.

DELETE /:videoId
- Auth: Yes (owner only)
- Cascading delete: Video + Comments + Likes + watch history entries + S3 files.
- Busts cache.

PATCH /toggle/publish/:videoId
- Auth: Yes (owner only)
- Toggles isPublished boolean. Busts cache.

#### Comment Endpoints (/api/v1/comments)

GET /:videoId
- Auth: Optional
- Returns paginated comments with owner info (presigned avatar), like counts, isLiked.

POST /:videoId
- Auth: Yes
- Body: { content }
- Creates comment. Returns populated comment with presigned owner avatar.

PATCH /c/:commentId
- Auth: Yes (owner only)
- Body: { content }
- Updates comment text.

DELETE /c/:commentId
- Auth: Yes (owner only)
- Deletes comment + all its likes.

#### Like Endpoints (/api/v1/likes)

POST /toggle/v/:videoId
- Auth: Yes
- Toggles video like. Returns { isLiked, likesCount }.

POST /toggle/c/:commentId
- Auth: Yes
- Toggles comment like. Returns { isLiked }.

GET /videos
- Auth: Yes
- Returns all videos liked by the current user with video + owner details.

#### Subscription Endpoints (/api/v1/subscriptions)

POST /c/:channelId
- Auth: Yes
- Toggle subscribe/unsubscribe.

GET /c/:channelId
- Auth: Yes
- Returns subscribers list for a channel.

GET /u/:subscriberId
- Auth: Yes
- Returns channels a user subscribes to.

#### Health Check (/api/v1/healthcheck)

GET /
- Auth: No
- Returns: { uptime, timestamp, database: "connected"|"disconnected", cache: "connected"|"offline", status: "healthy"|"degraded" }
- Always returns HTTP 200 (so ALB health probes always pass during reconnects/startup).

---

### Frontend Pages -- Deep Dive

**HomePage.jsx**
- API: GET /api/v1/videos?page=1&limit=12&sortBy=createdAt&sortType=desc
- Renders responsive grid of VideoCard components.
- Handles loading skeleton and error states.
- VideoCard shows thumbnail, title, owner, view count, delete button (owner only).

**WatchPage.jsx** (largest component ~17KB)
- Reads videoId from URL params via useParams().
- API calls: GET /api/v1/videos/:videoId (video + presigned URLs), GET /api/v1/comments/:videoId (paginated comments).
- Renders: <video src={video.playbackUrl}>, like button showing likesCount and isLiked state, comment list, add-comment form, owner info with subscribe button.
- Like toggle: POST /api/v1/likes/toggle/v/:videoId, updates local state with returned isLiked + likesCount.
- Add comment: POST /api/v1/comments/:videoId, prepends new comment to local list.
- Delete comment: DELETE /api/v1/comments/c/:commentId (owner only).
- Delete video: DELETE /api/v1/videos/:videoId (owner only). Custom confirmation modal (not window.confirm). Navigates to / on success.
- Requires login check for like/comment/subscribe actions.

**AuthPage.jsx**
- Two tabs: Login and Register.
- Login calls auth.login(usernameOrEmail, password) from AuthContext.
- Register calls auth.register(formData) from AuthContext.
- On success navigates to /.

**ChannelPage.jsx**
- Reads :username from URL params.
- API: GET /api/v1/users/c/:username (channel profile), GET /api/v1/videos?userId={ownerId} (channel videos).
- Subscribe button: POST /api/v1/subscriptions/c/:channelId.
- Owner sees delete buttons on their own videos.

**HistoryPage.jsx**
- Auth-required page.
- API: GET /api/v1/users/history
- Shows videos in watch history order (most recent first) with presigned thumbnails.

**LikedVideosPage.jsx**
- Auth-required page.
- API: GET /api/v1/likes/videos
- Shows all videos the user has liked.

**SubscriptionsPage.jsx**
- Auth-required page.
- Calls GET /api/v1/subscriptions/u/:userId to find subscribed channels, then fetches their videos.

**UploadModal.jsx** (component)
- Form: title (required), description (required), video file (required), thumbnail (optional).
- Constructs FormData and sends POST /api/v1/videos with multipart/form-data.
- Shows progress and error states.
- On success: calls onUploadSuccess() -> window.location.reload().

---

## PART 13 - END-TO-END USER FLOWS

### 1. User Registration Flow

1. User fills form in AuthPage (fullName, username, email, password).
2. AuthContext.register() sends POST /api/v1/users/register.
3. Backend validateUser -> User.findOne({username OR email}) to check uniqueness.
4. Pre-save hook: bcrypt.hash(password, 10) runs automatically.
5. User.create() stores the hashed password and default avatar URL.
6. generateAccessToken() + generateRefreshToken() called on new user.
7. user.refreshToken = token; user.save() -- persists refresh token.
8. Response: 201 with Set-Cookie (accessToken, refreshToken httpOnly) + JSON body with tokens.
9. AuthContext stores tokens in localStorage, sets user state.
10. React navigates to /.

### 2. Video Upload Flow

1. User opens UploadModal, selects MP4 file, fills title and description.
2. UploadModal sends POST /api/v1/videos with Authorization: Bearer token header.
3. ALB routes /api/* to backend. Multer saves MP4 to public/temp/ disk.
4. verifyJWT middleware validates token and populates req.user.
5. publishAVideo controller: uploads to S3 with PutObjectCommand, deletes temp file, handles optional thumbnail.
6. Video.create() creates MongoDB document with S3 key (not full URL).
7. invalidateCachePattern("videos:feed:*") -- clears Redis cache for all feed queries.
8. Returns 201. UploadModal calls window.location.reload() to refresh the video feed.

### 3. Watch Video Flow

1. User clicks VideoCard -> navigates to /watch/:videoId.
2. WatchPage calls GET /api/v1/videos/:videoId.
3. optionalVerifyJWT: populates req.user if token present.
4. Video.findByIdAndUpdate(id, {$inc: {views: 1}}) increments view count.
5. If authenticated: updates watchHistory in the user document (pull then push to maintain recency).
6. MongoDB aggregation: joins video with owner, computes likesCount and isLiked.
7. getPresignedPlaybackUrl() generates 1-hour presigned URLs for videoFile, thumbnail, avatar.
8. Response returned to React with playbackUrl.
9. React renders <video src={playbackUrl}>. Video streams directly from S3 to browser via presigned URL.

### 4. Like/Unlike Flow

1. User clicks Like button in WatchPage.
2. POST /api/v1/likes/toggle/v/:videoId with Authorization header.
3. verifyJWT validates auth.
4. Like.findOne({video: videoId, likedBy: userId}):
   - Found: Like.findByIdAndDelete() -> isLiked = false.
   - Not found: Like.create() -> isLiked = true.
5. Like.countDocuments({video: videoId}) -> current likesCount.
6. Returns {isLiked, likesCount}.
7. React updates button state and count display immediately.

### 5. Video Deletion Flow

1. Video owner clicks delete icon in VideoCard or WatchPage.
2. Custom confirmation modal appears (not browser window.confirm).
3. User confirms -> DELETE /api/v1/videos/:videoId.
4. verifyJWT validates auth.
5. Video.findById(videoId) -- checks video.owner.equals(req.user._id) else 403.
6. Cascading deletion: Video.findByIdAndDelete, Comment.deleteMany, Like.deleteMany, User.updateMany (remove from watchHistory).
7. deleteFromS3(videoFile key) + deleteFromS3(thumbnail key).
8. invalidateCachePattern("videos:feed:*") + deleteCache("video:detail:videoId").
9. Returns 200. React navigates to /.

### 6. Comment Flow

Add comment:
1. User types in comment box and submits.
2. POST /api/v1/comments/:videoId with {content}.
3. verifyJWT validates auth.
4. Comment.create({content, video: videoId, owner: userId}).
5. Populate owner (fullName, username, avatar). Generate presigned avatar URL.
6. Returns 201 with populated comment. React prepends to comment list.

Fetch comments:
1. WatchPage calls GET /api/v1/comments/:videoId.
2. Comment.aggregatePaginate with $lookup on users and likes.
3. Returns paginated {docs, totalDocs, page, limit}. React renders each comment.

Delete comment (owner only):
1. DELETE /api/v1/comments/c/:commentId.
2. Verifies comment.owner.equals(req.user._id).
3. Comment.findByIdAndDelete + Like.deleteMany({comment: commentId}).
4. React removes comment from list.

### 7. CI/CD Deployment Flow

1. Developer pushes code to main branch.
2. GitHub Actions triggers. Jobs 1-3 (test, build, validate) run in parallel.
3. All pass -> Job 4 (deploy-to-aws) starts.
4. OIDC: GitHub Actions exchanges OIDC token for temporary AWS credentials.
5. Docker builds backend and frontend images, pushes with SHA + latest tags to ECR.
6. Downloads current task definitions from ECS, strips read-only fields.
7. Renders new task definitions with new image URIs + MongoDB URI secret.
8. Registers new task definition revisions.
9. Updates ECS services to use new revisions. wait-for-service-stability blocks until healthy.
10. Rolling update: new containers start, health checks pass, old containers drain and stop.
11. Verification: curl ALB /api/v1/healthcheck -> 200 OK confirmed.

---

## PART 14 - SECURITY ARCHITECTURE

### Implemented Security Mechanisms

**Password Hashing**
bcrypt with 10 salt rounds. Passwords never stored in plaintext. Even if MongoDB is breached, passwords cannot be reversed. Comparison uses bcrypt.compare() which is timing-safe.

**JWT Token Security**
- Access tokens: 1 day expiry, signed with ACCESS_TOKEN_SECRET.
- Refresh tokens: 10 day expiry, signed with REFRESH_TOKEN_SECRET (different secret).
- Refresh tokens stored in MongoDB -- logout invalidates the stored token, preventing replay attacks with intercepted refresh tokens.

**HttpOnly Cookies**
Tokens set as httpOnly: true, preventing JavaScript (document.cookie) from reading them. Protection against XSS token theft via cookie.

**Dynamic Cookie Security Settings**
getCookieOptions(req) checks x-forwarded-proto (via trust proxy 1) to set secure: true only over HTTPS, sameSite: "none" for HTTPS and sameSite: "lax" for HTTP. This prevents silent cookie drops on the current HTTP-only deployment.

**LocalStorage Dual Storage**
Tokens also stored in localStorage for Axios Bearer header injection. Known trade-off: localStorage is readable by any JavaScript in the page (XSS risk), but provides reliability when cookies are not transmitted correctly.

**Authorization Middleware**
verifyJWT: blocks unauthenticated access to all protected routes.
optionalVerifyJWT: permits unauthenticated access but enriches responses when authenticated.

**Resource Ownership Checks**
Before update/delete on any resource (video, comment): checks resource.owner.equals(req.user._id). Returns 403 Forbidden for unauthorized attempts.

**S3 Security**
Bucket is fully private (all public access blocked). Videos accessed only via presigned URLs with 1-hour expiry. No publicly accessible S3 URLs exist.

**AWS OIDC (No Static Keys)**
GitHub Actions uses OpenID Connect to assume an IAM role. No long-lived static access keys stored anywhere.

**Environment Variables**
All secrets injected via env vars. Never hardcoded. .gitignore excludes .env, terraform.tfvars, terraform.tfstate, node_modules.

**Security Groups**
Layered network access: internet -> ALB SG -> ECS SG -> ElastiCache SG. Redis unreachable from internet.

### Known Security Weaknesses

1. HTTP only (no HTTPS): Current ALB listener is HTTP only. Tokens transmitted in plaintext over the wire. Needs ACM certificate + HTTPS listener.

2. sameSite:"lax" + secure:false: Without HTTPS, cookies susceptible to interception on unencrypted networks.

3. localStorage token storage: Exposes tokens to XSS. Pure httpOnly cookie with CSRF token would be more secure.

4. Terraform state in Git: terraform.tfstate committed to repository. Contains resource IDs. Production should use S3 remote state with DynamoDB state locking.

5. No rate limiting: Login endpoint has no rate limiting. Brute-force attacks on /login are theoretically possible.

6. CloudWatch alarms without notifications: Alarms defined but no SNS topic, so alerts fire silently.

7. Default JWT secrets in env example: If env vars not set, fallback default secrets from docker-compose.yml are used. Production ECS task definition sets real secrets.

8. MongoDB Atlas IP whitelisting: Atlas must allow connections from ECS EC2 public IPs. Dynamic IPs from ASG make per-IP whitelisting impractical -- 0.0.0.0/0 commonly used. A NAT Gateway with Elastic IP would fix this.

---

## PART 15 - LOCAL DEVELOPMENT GUIDE

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Docker Desktop | Latest | Required for Docker Compose |
| Node.js | v20 LTS | Only if running without Docker |
| AWS CLI | v2 | For AWS management commands |
| Terraform | v1.5.x | For infrastructure changes only |
| Git | Latest | |

### Option A: Full Stack with Docker Compose (Recommended)

  # 1. Clone repository
  git clone https://github.com/SyedAsad108/videotube-devops.git
  cd videotube-devops

  # 2. Create backend .env (never commit this file)
  cp backend/.env.example backend/.env
  # Edit backend/.env with your actual values

  # 3. Set AWS credentials in your shell session
  export AWS_ACCESS_KEY_ID=your_key_here
  export AWS_SECRET_ACCESS_KEY=your_secret_here
  export AWS_BUCKET_NAME=videotube-dev-media-5f087aba
  export AWS_REGION=ap-south-1

  # 4. Build and start all containers
  docker compose up --build

  # Access:
  # Frontend: http://localhost  (or http://localhost:5173)
  # Backend API: http://localhost:8000
  # MongoDB: localhost:27017
  # Redis: localhost:6379

### Option B: Backend Only (No Docker)

  cd backend
  npm install
  # Ensure backend/.env is configured
  npm run dev   # Uses nodemon for hot-reload

### Option C: Frontend Only (No Docker)

  cd frontend
  npm install
  npm run dev   # Vite dev server at http://localhost:5173
  # /api/* automatically proxied to http://localhost:8000

### Environment Variables Reference (backend)

| Variable | Purpose | Required |
|----------|---------|----------|
| PORT | Server port | No (default: 8000) |
| MONGODB_URI | MongoDB Atlas connection string | Yes |
| CORS_ORIGIN | Comma-separated allowed origins | Yes |
| ACCESS_TOKEN_SECRET | JWT signing secret for access tokens | Yes |
| ACCESS_TOKEN_EXPIRY | Access token expiry (e.g., 1d) | No (default: 1d) |
| REFRESH_TOKEN_SECRET | JWT signing secret for refresh tokens | Yes |
| REFRESH_TOKEN_EXPIRY | Refresh token expiry (e.g., 10d) | No (default: 10d) |
| STORAGE_PROVIDER | "s3" or "cloudinary" | No (default: s3) |
| AWS_REGION | S3 region | Yes (for S3) |
| AWS_BUCKET_NAME | S3 bucket name | Yes (for S3) |
| AWS_ACCESS_KEY_ID | Static credentials (local only) | No (uses IAM role in ECS) |
| AWS_SECRET_ACCESS_KEY | Static credentials (local only) | No (uses IAM role in ECS) |
| REDIS_HOST | Redis hostname | No (default: 127.0.0.1) |
| REDIS_PORT | Redis port | No (default: 6379) |

---

## PART 16 - DEPLOYMENT GUIDE

### Automated Deployment (Normal Workflow)

1. Make code changes locally.
2. Test with docker compose up.
3. git add . && git commit -m "feat: description"
4. git push origin main
5. GitHub Actions triggers automatically.
6. All 3 CI jobs run (test-backend, build-frontend, validate-terraform).
7. If all pass: deploy-to-aws runs automatically.
8. New Docker images pushed to ECR with git SHA tag.
9. ECS services updated with new task definitions.
10. Rolling deployment -- zero downtime.
11. ALB routes traffic to new containers after health checks pass.
12. Pipeline verification: curls ALB healthcheck to confirm 200.

### First-Time Terraform Provisioning

  cd terraform
  cp terraform.tfvars.example terraform.tfvars
  # Edit terraform.tfvars: set mongodb_uri, jwt secrets

  export AWS_ACCESS_KEY_ID=...
  export AWS_SECRET_ACCESS_KEY=...

  terraform init
  terraform plan     # Review all resources to be created
  terraform apply    # Creates all AWS resources (~5-10 minutes)

Terraform creates (in dependency order): VPC, subnets, IGW, route tables, security groups, S3 bucket, ElastiCache, ECR repos, IAM roles, EC2 launch template, ASG, capacity provider, ECS cluster, task definitions, ECS services, ALB, target groups, listeners, listener rules, CloudWatch log groups, GitHub OIDC provider.

After first terraform apply: get the ALB DNS from outputs:
  terraform output alb_dns_name

### Verifying Deployment

  # Check ECS service status
  aws ecs describe-services \
    --cluster videotube-dev-cluster \
    --services videotube-dev-service videotube-dev-frontend-service \
    --region ap-south-1

  # Get ALB DNS name
  aws elbv2 describe-load-balancers \
    --names videotube-dev-alb \
    --region ap-south-1 \
    --query "LoadBalancers[0].DNSName" \
    --output text

  # Test backend health
  curl http://<ALB_DNS>/api/v1/healthcheck

  # Stream backend logs (real-time)
  aws logs tail /ecs/videotube-dev-backend --follow --region ap-south-1

---

## PART 17 - TROUBLESHOOTING

### 1. MongoDB Connection Failure

Symptoms: Backend logs show "MONGODB Connection Error: connection timed out". Health check returns database: "disconnected".

Causes:
- MongoDB Atlas cluster IP whitelist does not include the ECS EC2 public IP.
- MONGODB_URI env var is malformed or missing.
- Atlas cluster is paused (Atlas auto-pauses free clusters after inactivity).

Diagnosis:
  aws logs tail /ecs/videotube-dev-backend --region ap-south-1 | grep MONGODB

Fix:
1. MongoDB Atlas -> Network Access -> Add IP 0.0.0.0/0 for all access (dev environments).
2. Verify MONGODB_URI in GitHub Secrets.
3. Resume paused Atlas cluster from the Atlas console.

### 2. ECS Task Keeps Restarting

Symptoms: ECS service shows running: 0 tasks. Tasks start then stop repeatedly.

Causes:
- Application crashes on startup (syntax error, missing env var, failed DB connection).
- Health check failing (container not listening on PORT).
- Container exceeds 400MB memory limit.

Diagnosis:
  # Find stopped task
  aws ecs list-tasks --cluster videotube-dev-cluster --desired-status STOPPED --region ap-south-1
  
  # Get stopped reason
  aws ecs describe-tasks --cluster videotube-dev-cluster --tasks <task-arn> --region ap-south-1

  # Check application logs
  aws logs tail /ecs/videotube-dev-backend --region ap-south-1

### 3. ALB Health Check Failures

Symptoms: Target group shows targets as "unhealthy". videotube-dev-unhealthy-hosts-alarm triggered.

Causes:
- Backend container not running.
- /api/v1/healthcheck not returning 200 (note: healthcheck always returns 200 even on DB errors by design).
- Security group doesn't allow ALB to reach ephemeral ports.

Diagnosis: AWS Console -> EC2 -> Target Groups -> videotube-dev-tg -> Targets tab -> view health status description.

### 4. GitHub Actions Deployment Failure

Symptoms: CI/CD pipeline fails at deploy-to-aws job.

Common causes:
- OIDC role ARN in GitHub Variables (AWS_ROLE_TO_ASSUME) is wrong.
- GitHub OIDC trust policy condition doesn't match repository name.
- ECS service/cluster name variables are wrong.
- MONGODB_URI secret not set in GitHub Secrets.

Fix: Check GitHub Actions logs for the specific failing step. Verify all Variables and Secrets in: GitHub -> Repository Settings -> Secrets and Variables -> Actions.

### 5. Video Upload Fails

Symptoms: Upload modal shows "Failed to upload video".

Causes:
- AWS_BUCKET_NAME env var wrong or bucket doesn't exist.
- ECS Task Role doesn't have s3:PutObject permission.
- public/temp/ directory doesn't exist or isn't writable.

Diagnosis:
  aws logs tail /ecs/videotube-dev-backend --region ap-south-1 | grep "S3 Upload Error"

### 6. Auth Lost After Page Refresh

Symptoms: User logged out when refreshing browser.

Root cause analysis:
- localStorage.getItem("videotube_token") returns null -> token not stored on login.
- /api/v1/users/current-user returns 401 -> token expired.
- Cookie dropped -> HTTP/HTTPS mismatch with secure: true cookie setting.

Fix applied in codebase:
- getCookieOptions(req) dynamically sets secure based on x-forwarded-proto.
- Axios interceptor attaches token from localStorage as Authorization: Bearer.
- AuthContext initializes user from localStorage before making the /current-user API call (prevents flash of unauthenticated state on refresh).

### 7. Redis Connection Warning

Symptoms: Backend logs show "[Redis] No local Redis instance found" or connection refused.

Impact: Application continues working. All Redis operations return null gracefully. MongoDB queried on every request. Slightly lower performance.

In production: Should not occur because ElastiCache is always running and REDIS_HOST env var points to it.

In local dev without Docker: Expected behavior. No fix needed.

### 8. S3 Presigned URL Expired

Symptoms: Video player shows error or thumbnail missing after page open > 1 hour.

Cause: Presigned URLs are valid for 3600 seconds (1 hour) only.

Fix: Refresh the page. This is a known limitation -- presigned URL expiry is not extended automatically.

---

## PART 18 - ARCHITECTURAL DECISIONS AND TRADE-OFFS

### MongoDB vs PostgreSQL

MongoDB was chosen because:
- Flexible schema suits the document-heavy nature of videos, users, comments.
- $lookup aggregation pipelines handle the required joins.
- MongoDB Atlas provides fully managed cloud hosting with minimal ops overhead.
- Horizontal scaling via sharding available if needed in future.

PostgreSQL trade-off: More mature relational features, stronger ACID guarantees, native JOINs. Better for complex relational queries but requires more rigid schema design.

### Redis vs Direct MongoDB Queries

Redis chosen because:
- Feed queries involve multi-collection $lookup aggregations (20-50ms each).
- Feed content changes infrequently (video uploads are rare events).
- 2-minute TTL gives good freshness/performance balance.
- Graceful degradation to MongoDB on Redis failure.

Without Redis: every feed request would hit MongoDB with an expensive aggregation. Under concurrent load, response times would degrade significantly.

### ECS EC2 vs ECS Fargate

EC2 launch type chosen because:
- Cost: t3.micro ~$8-10/month. Fargate for the same workload would cost ~$15-25/month.
- Control: EC2 gives access to instance-level settings, networking modes, storage.
- Educational value: Managing EC2 nodes with ASG, Capacity Providers, IAM Instance Profiles provides richer DevOps learning.

Fargate trade-off: Serverless -- no EC2 to manage. Tasks get their own ENI (awsvpc mode). Better isolation. Simpler operations. Higher cost for always-on workloads.

### ECS vs Kubernetes

ECS chosen because:
- Native AWS integration with ECR, ALB, IAM, CloudWatch -- seamless out of the box.
- Lower operational complexity than Kubernetes.
- Lower cost (EKS control plane costs ~$73/month alone).
- Sufficient for this application's orchestration needs.

Kubernetes trade-off: Cloud-agnostic, richer ecosystem, more sophisticated scheduling. k8s/ manifests present in repository for future use.

### S3 vs Local Storage / EFS

S3 chosen because:
- Container storage is ephemeral -- files lost on restart.
- Multiple ECS tasks can't share local disk.
- S3 is infinitely scalable, globally available, 11-nines durable.
- Presigned URLs provide secure direct-to-browser streaming without backend involvement.

Local storage would fail in a containerized multi-task environment. EFS (shared NFS) would work but adds networking complexity and cost.

### Terraform vs Manual AWS Configuration

Terraform chosen because:
- Every resource is code-reviewed, version-controlled, reproducible.
- terraform destroy cleanly removes all resources (no orphaned AWS resources accumulating costs).
- Infrastructure changes are tracked in Git history.
- terraform plan provides safe preview before changes.
- Multi-environment support via variable files (dev, staging, prod).

Manual console clicking: Not reproducible, not version-controlled, error-prone, impossible to audit.

### GitHub Actions vs Other CI Systems

GitHub Actions chosen because:
- Native to GitHub, no additional server to maintain.
- OIDC integration with AWS is first-class via aws-actions.
- YAML workflow files are version-controlled with the code.
- Free tier for public repos; generous minutes for private repos.
- Community-maintained actions ecosystem (aws-actions, hashicorp/setup-terraform).

Jenkins alternative: More flexible, requires dedicated server (~$20-50/month), more configuration overhead.

---

## PART 19 - CURRENT INFRASTRUCTURE AND PROJECT STATUS

### Implemented and Currently Active

| Component | Status | Notes |
|-----------|--------|-------|
| Backend API (Node.js/Express) | Active | ECS task definition revision 2+ running on EC2 host |
| Frontend S3 Static Hosting | Active | Private S3 bucket `videotube-dev-frontend-5f087aba` populated with optimized build |
| CloudFront Infrastructure | Staged / Ready | OACs and Edge SPA Function active; distribution ready for account activation |
| Frontend ECS Container | Active (Fallback) | Preserved on ALB port 80 until CloudFront verification completes |
| MongoDB Atlas | Active | DB queries working end-to-end |
| Amazon S3 Media Bucket | Active | Video upload/download/presign working (`videotube-dev-media-5f087aba`) |
| Amazon ECS Cluster | Active | `videotube-dev-cluster` in ap-south-1 |
| Amazon ECR (backend) | Active | Images pushed on every backend CI run |
| Amazon ECR (frontend) | Retained | Available for emergency rollback; not updated in CI/CD |
| Application Load Balancer | Active | `videotube-dev-alb` serving traffic |
| ElastiCache Redis | Active | Backend connects via `REDIS_HOST` env var |
| Modernized CI/CD Pipeline | Active | Path-based change detection with independent S3 and ECS deployment jobs |
| GitHub OIDC Authentication | Active | No static AWS keys used |
| CloudWatch Log Groups | Active | `/ecs/videotube-dev-backend` and `-frontend` |
| VPC + Subnets + SGs | Active | Full networking provisioned via Terraform |
| Auto Scaling Group | Active | 2 nodes active (1 idle node terminated to save $14.67/mo) |
| EC2 Launch Template | Active | ECS-optimized AMI, user data for cluster registration |

### Present But Requires Verification / Has Gaps

| Component | Status | Notes |
|-----------|--------|-------|
| CloudFront Account Verification | Blocked by AWS | New AWS accounts require a support verification ticket to enable CloudFront |
| CloudWatch Alarms | Defined | No SNS notification action -- alerts fire silently |
| Terraform state | Local file | State in Git repo; should be remote S3 backend for production |
| k8s/ directory | Present | Kubernetes manifests present but not deployed to any cluster |
| tests/ directory | Present | Directory exists; full test suite content not confirmed |
| Cloudinary support | Code present | `cloudinary.js` and `storage.js` abstraction work; not active (`STORAGE_PROVIDER=s3`) |

### Not Implemented / Future Improvements

| Feature | Notes |
|---------|-------|
| HTTPS / TLS | ALB is HTTP only; CloudFront provides edge HTTPS automatically |
| Video transcoding | No FFmpeg or MediaConvert -- videos served as-is in original format |
| Full-text search | Search UI visible in Navbar but query parameter is not wired to an external search index |
| Admin panel | No admin role or management interface implemented |
| Email verification | No email service or account verification flow |
| SNS notifications | CloudWatch alarms have no notification target configured |
| API rate limiting | No rate limiting on any endpoint |
| Remote Terraform state | No S3 backend + DynamoDB state locking configured |

---

## Quick Reference Summary for Viva

| Question | Answer |
|----------|--------|
| What does it do? | YouTube-like video platform with full DevOps stack |
| Frontend stack? | React 19 + Vite + React Router DOM + Axios + Nginx |
| Backend stack? | Node.js 20 + Express 5 + Mongoose + Multer |
| Database? | MongoDB Atlas (managed cloud MongoDB) |
| Cache? | Amazon ElastiCache Redis 7 (via ioredis) |
| File storage? | Amazon S3 (private bucket + presigned URLs) |
| Auth mechanism? | JWT -- access (1d) + refresh (10d) in HttpOnly cookies + localStorage |
| Containerization? | Multi-stage Docker builds (backend + frontend) |
| Local orchestration? | Docker Compose (4 services: frontend, backend, mongo, redis) |
| Cloud provider? | AWS ap-south-1 (Mumbai) |
| Compute? | Amazon ECS with EC2 launch type (t3.micro) |
| Container orchestration? | ECS Cluster -> Service -> Task -> Docker Container |
| Container registry? | Amazon ECR (2 private repos) |
| Load balancer? | AWS Application Load Balancer (path-based routing: /api/* to backend, / to frontend) |
| IaC tool? | Terraform v1.5 (AWS provider ~5.0) |
| CI/CD? | GitHub Actions (4 jobs: test-backend, build-frontend, validate-terraform, deploy-to-aws) |
| CI/CD AWS auth? | GitHub OIDC (no static keys ever stored) |
| Observability? | CloudWatch Log Groups + Metric Alarms |
| Deployment strategy? | ECS rolling update (zero downtime) |
| Why ECS over K8s? | Simpler, cheaper, native AWS integration |
| Why EC2 over Fargate? | Cost savings, richer educational value, fine-grained control |
| Why MongoDB over SQL? | Flexible schema, Atlas managed hosting, aggregation pipeline |
| Why Redis? | Cache video feed aggregations, 2-min TTL, graceful degradation |
| Why S3 for videos? | Ephemeral containers, shared across tasks, 11-nines durability, presigned security |

---

*Documentation created from direct inspection of the VideoTube-DevOps repository (SyedAsad108/videotube-devops). All architectural details reflect the actual codebase implementation as of September 2026.*
