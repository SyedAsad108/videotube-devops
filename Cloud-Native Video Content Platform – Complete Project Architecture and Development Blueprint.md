# Cloud-Native Video Content Platform with Automated Deployment and Scalable Infrastructure

## 1. Project Overview

### Project Title

**Cloud-Native Video Content Platform with Automated Deployment and Scalable Infrastructure**

### Project Objective

The objective of this project is to design and develop a full-stack video content platform and deploy it using cloud-native infrastructure and modern DevOps practices.

The project is not intended to recreate YouTube or build a large-scale commercial streaming platform. Instead, the primary objective is to demonstrate the following engineering concepts:

- Full-stack application development.
- Containerization using Docker.
- Cloud infrastructure design.
- Private and public subnet networking.
- Load balancing.
- Container orchestration.
- Automated application deployment.
- Infrastructure as Code using Terraform.
- Application and infrastructure scaling.
- Caching.
- Monitoring and observability.
- Load testing.
- Failure recovery and resilience testing.

The project should demonstrate how a traditional Node.js application can evolve from:

```text
Local Application
      ↓
Dockerized Application
      ↓
Cloud Deployment
      ↓
Load Balanced Application
      ↓
Scalable Container Infrastructure
      ↓
Automated CI/CD Deployment
```

The final project is therefore both a **full-stack application project** and a **cloud/DevOps architecture project**.

---

# 2. Core Project Concept

The application will be a video content platform where users can:

- Create accounts.
- Log in and log out.
- Manage their profiles.
- Upload videos.
- Upload thumbnails.
- Browse video listings.
- View video details.
- Play videos.
- Subscribe to channels.
- Like content.
- Comment on videos.
- Manage watch history.
- Potentially manage playlists.

The project will use the existing **VideoTube Node.js backend** as its starting point.

However, the existing backend is incomplete and requires significant work before deployment.

The frontend will also be built as part of the project.

---

# 3. Existing Backend Status

The existing backend is a Node.js and Express REST API originally designed as a video-sharing platform.

Current technology stack:

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
bcrypt
Multer
Cookie Parser
CORS
```

The backend currently contains:

```text
Authentication
User registration
Login
Logout
JWT authentication
Refresh tokens
User profiles
Video model
Subscription model
```

However, many core features are incomplete.

The backend should therefore be treated as a **foundation**, not as a finished application.

---

# 4. Existing Backend Problems That Must Be Fixed

Before cloud deployment, the backend must be stabilized.

## Critical fixes include:

### Routing Issues

Several controller functions exist but are not connected to Express routes.

Examples include:

- Change password.
- Get current user.
- Update account details.
- Update avatar.
- Update cover image.

These endpoints must be correctly wired into the routing layer.

---

### Missing `await`

One update operation currently does not await the MongoDB operation.

This causes the application to return a Mongoose query object instead of the updated user.

The backend must ensure all asynchronous database operations are properly awaited.

---

### Incorrect API Responses

One controller incorrectly uses:

```javascript
res.json(200, req.user, "message")
```

Express only accepts one response body argument.

The backend should consistently use the existing:

```text
ApiResponse
ApiError
asyncHandler
```

architecture.

---

### Missing Global Error Handler

The backend currently has an async error wrapper but lacks a centralized Express error middleware.

A global error middleware must be added.

The goal is to ensure all errors return structured JSON responses rather than default HTML error pages.

---

### Security Issues

The backend previously contained exposed credentials.

The following must never be committed:

```text
.env
AWS credentials
MongoDB credentials
JWT secrets
Cloud service credentials
```

A proper `.gitignore` must be created.

Previously exposed credentials should be rotated.

---

### File Upload Problems

The current Multer configuration uses original filenames.

This can cause:

- Filename collisions.
- File overwrites.
- Security problems.

The new architecture will gradually move media storage away from Cloudinary and toward Amazon S3.

The backend must validate:

- File type.
- File size.
- Allowed MIME types.

---

# 5. Final Technology Stack

## Frontend

```text
React
Vite
React Router
Axios or Fetch API
```

Possible state management can be added if required.

The frontend should provide:

```text
Authentication pages
Home page
Video feed
Video details page
Video player
Upload video page
User profile
Channel page
Subscription features
```

---

## Backend

```text
Node.js
Express.js
MongoDB
Mongoose
JWT
bcrypt
```

The backend will expose REST APIs.

---

## Media Storage

```text
Amazon S3
```

S3 will replace Cloudinary.

S3 will store:

```text
Videos
Thumbnails
Avatars
Cover Images
```

---

## Primary Database

```text
MongoDB Atlas
```

MongoDB Atlas will store application data and metadata.

Examples:

```text
Users
Video metadata
Subscriptions
Comments
Likes
Watch history
Playlists
```

MongoDB should not store the actual large video files.

Instead:

```text
Video File → Amazon S3

Video Metadata → MongoDB Atlas
```

---

## Caching

```text
Amazon ElastiCache
```

ElastiCache will be used for caching frequently requested application data.

Initial use cases should include:

```text
Homepage video feed
Popular videos
Trending video listings
Individual video metadata
```

The cache is intended to reduce repeated reads from MongoDB Atlas.

---

## Containerization

```text
Docker
```

The backend will be packaged as a Docker image.

The Docker image will contain:

```text
Node.js runtime
Application dependencies
Backend source code
Production configuration
```

---

## Container Registry

```text
Amazon ECR
```

ECR will store the backend Docker image.

The deployment pipeline will:

```text
Build Docker Image
       ↓
Tag Docker Image
       ↓
Push Image to ECR
       ↓
ECS pulls Image from ECR
       ↓
Deploy Updated Container
```

---

## Container Orchestration

```text
Amazon ECS
```

The project will use:

> **ECS with EC2 capacity**

This means the Docker containers will run as ECS Tasks on EC2 instances.

The architecture hierarchy is:

```text
ECS Cluster
      │
      ▼
EC2 Instances
      │
      ▼
ECS Tasks
      │
      ▼
Docker Containers
      │
      ▼
Node.js Backend
```

---

# 6. Final Cloud Architecture

The final architecture will consist of:

```text
Internet
   │
   ▼
Internet Gateway
   │
   ▼
Application Load Balancer
   │
   ▼
ECS Service
   │
   ▼
ECS Tasks
   │
   ├─────────────┐
   ▼             ▼
ElastiCache   MongoDB Atlas
   │
   ▼
Cached Data

ECS Backend
   │
   ▼
Amazon S3
```

All infrastructure will be organized inside a VPC where appropriate.

---

# 7. VPC Architecture

The project will use:

```text
1 VPC
2 Availability Zones
2 Public Subnets
2 Private Subnets
1 Internet Gateway
1 NAT Gateway
```

Example:

```text
VPC
│
├── Availability Zone A
│
│   ├── Public Subnet A
│   │
│   └── Private Subnet A
│
└── Availability Zone B
    │
    ├── Public Subnet B
    │
    └── Private Subnet B
```

The purpose of using two Availability Zones is to demonstrate a more resilient and scalable architecture.

---

# 8. Public Subnets

The public subnets will contain infrastructure that must interact with the internet.

The primary resources are:

```text
Application Load Balancer
NAT Gateway
```

---

## Application Load Balancer

The Application Load Balancer will be internet-facing.

Users will send API requests to the ALB.

The ALB will distribute requests across healthy backend ECS Tasks.

Flow:

```text
User
 │
 ▼
Internet
 │
 ▼
Application Load Balancer
 │
 ▼
Target Group
 │
 ├─────────────┐
 ▼             ▼
ECS Task      ECS Task
```

The ALB performs:

- Traffic distribution.
- Health checks.
- Routing to healthy containers.

---

# 9. Private Subnets

The backend infrastructure will run inside private subnets.

This includes:

```text
EC2 Instances
ECS Tasks
Node.js Containers
ElastiCache
```

The private backend is not directly accessible from the internet.

The request flow is:

```text
Internet
    │
    ▼
ALB
    │
    ▼
Private ECS Task
```

Users cannot directly connect to the backend containers.

This improves security.

---

# 10. NAT Gateway

The NAT Gateway will be placed in a public subnet.

The NAT Gateway allows private resources to initiate outbound internet connections.

Example:

```text
Private ECS Task
      │
      ▼
NAT Gateway
      │
      ▼
Internet Gateway
      │
      ▼
Internet
```

The NAT Gateway is required because private ECS workloads may need access to external resources.

For example:

```text
MongoDB Atlas
External APIs
AWS services where required
```

The NAT Gateway does not allow unsolicited internet traffic to enter private ECS resources.

It provides outbound access only.

---

# 11. NAT Gateway Cost Decision

The NAT Gateway has an hourly cost.

However, this project will not leave infrastructure running continuously.

The operational workflow will be:

```text
terraform apply
       │
       ▼
Deploy Infrastructure
       │
       ▼
Run Application
       │
       ▼
Perform Demonstration
       │
       ▼
Run Tests
       │
       ▼
Collect Screenshots and Metrics
       │
       ▼
terraform destroy
```

Therefore, the NAT Gateway will only run while actively developing or demonstrating the infrastructure.

The project should also include:

```text
AWS Budget
Billing Alert
```

to reduce the risk of unexpected costs.

---

# 12. High Availability Strategy

The project must be technically honest about its availability model.

The architecture can demonstrate multiple levels of resilience.

## Task-Level Availability

Multiple ECS Tasks can run behind the ALB.

Example:

```text
ALB
 │
 ├──── ECS Task A
 │
 └──── ECS Task B
```

If Task A fails:

```text
Task A → Failed
Task B → Continues Serving Traffic
```

The ECS Service can create a replacement task.

This demonstrates:

```text
Container-level fault tolerance
```

---

## Infrastructure-Level Availability

True infrastructure-level availability requires workloads across separate EC2 instances and preferably Availability Zones.

Example:

```text
AZ-A

EC2 Instance A
     │
     ▼
ECS Task A


AZ-B

EC2 Instance B
     │
     ▼
ECS Task B
```

The project can demonstrate this architecture when scaling.

---

# 13. EC2 Auto Scaling Group

The ECS cluster will use EC2 capacity.

An Auto Scaling Group can manage the EC2 instances.

Recommended configuration:

```text
Minimum Capacity: 1 EC2 Instance
Desired Capacity: 1 EC2 Instance
Maximum Capacity: 2 EC2 Instances
```

This prevents uncontrolled infrastructure scaling.

The scaling architecture is:

```text
Load Increases
      │
      ▼
ECS Needs Additional Tasks
      │
      ▼
Check Available EC2 Capacity
      │
      ├── Capacity Available
      │        │
      │        ▼
      │    Start ECS Task
      │
      └── Capacity Not Available
               │
               ▼
        EC2 Auto Scaling Group
               │
               ▼
       Launch Additional EC2
               │
               ▼
      ECS Places New Task
```

This allows the project to demonstrate both:

```text
Application Scaling
```

and:

```text
Infrastructure Scaling
```

---

# 14. ECS Service Auto Scaling

ECS Service Auto Scaling controls the number of running backend tasks.

Example:

```text
Normal Traffic

1 ECS Task
```

Under increased load:

```text
High CPU Usage
       │
       ▼
Scaling Policy Triggered
       │
       ▼
Desired Task Count

1 → 2 → 3
```

The Application Load Balancer automatically routes traffic to healthy tasks.

---

# 15. Auto Scaling Demonstration

The project will use **k6** to generate traffic.

k6 is a load-testing tool.

Example:

```text
k6
 │
 │ 100 Virtual Users
 ▼
Application Load Balancer
 │
 ▼
ECS Service
 │
 ▼
Backend CPU Increases
 │
 ▼
CloudWatch Metrics
 │
 ▼
Auto Scaling Policy
 │
 ▼
Additional ECS Tasks
```

The demonstration should show:

1. Initial task count.
2. Normal CPU usage.
3. Increased traffic from k6.
4. CPU usage increasing.
5. ECS Service scaling.
6. New task starting.
7. ALB registering the new target.
8. Requests distributed across multiple tasks.

---

# 16. MongoDB Atlas Architecture

MongoDB Atlas will remain the primary application database.

The backend will access Atlas through outbound networking.

Flow:

```text
Private ECS Task
       │
       ▼
NAT Gateway
       │
       ▼
Internet
       │
       ▼
MongoDB Atlas
```

MongoDB Atlas stores:

```text
Users
Video metadata
Subscriptions
Comments
Likes
Watch history
Playlists
```

---

# 17. MongoDB Atlas as a Load Testing Constraint

MongoDB Atlas may become a bottleneck during stress testing depending on the selected tier.

This must be explicitly documented.

The goal of the project is not to claim that MongoDB Atlas itself scales infinitely.

Instead, the load-testing results should be interpreted carefully.

Potential bottlenecks include:

```text
MongoDB Atlas tier limitations
Connection limits
Shared compute resources
Database read performance
Network latency
```

The architecture introduces ElastiCache partly to reduce unnecessary repeated database reads.

Therefore, the project can demonstrate the difference between:

```text
Without Cache
```

and:

```text
With Cache
```

---

# 18. Amazon ElastiCache Architecture

ElastiCache will be used as an application caching layer.

The primary pattern will be:

> Cache-Aside Pattern

Flow:

```text
Request
   │
   ▼
Node.js Backend
   │
   ▼
Check Cache
   │
   ├── Cache Hit
   │       │
   │       ▼
   │    Return Data
   │
   └── Cache Miss
           │
           ▼
      MongoDB Atlas
           │
           ▼
      Retrieve Data
           │
           ▼
       Store in Cache
           │
           ▼
       Return Data
```

---

# 19. ElastiCache Data

ElastiCache should initially cache:

### Video Listings

```text
Homepage Feed
Popular Videos
Trending Videos
Paginated Video Lists
```

Example key:

```text
videos:homepage:page:1
```

---

### Individual Video Metadata

Example:

```text
video:{videoId}
```

Cached data may include:

```text
Title
Description
Thumbnail
Owner
Views
Video Storage Key
```

---

## Data That Should Not Be Cached Initially

The project should avoid caching sensitive data such as:

```text
Passwords
JWT secrets
Refresh tokens
Sensitive authentication information
```

---

# 20. Amazon S3 Architecture

Amazon S3 will replace Cloudinary.

S3 stores media files.

Example structure:

```text
S3 Bucket

├── videos/
│
├── thumbnails/
│
├── avatars/
│
└── cover-images/
```

MongoDB stores references to these objects.

Example:

```text
Video

Title
Description
Owner
S3 Object Key
Thumbnail S3 Object Key
```

---

# 21. Video Upload Flow

The upload architecture should avoid permanently storing uploaded files on EC2.

The flow is:

```text
User
 │
 ▼
Frontend
 │
 ▼
Backend API
 │
 ▼
Amazon S3
 │
 ▼
Store Video Object
 │
 ▼
Store Metadata in MongoDB
```

The final implementation can later use more optimized upload patterns.

The important architectural principle is:

> EC2 and ECS task storage must not be treated as permanent media storage.

Containers can be replaced or destroyed.

Therefore, persistent media belongs in S3.

---

# 22. Video Playback Architecture

The backend should not act as a permanent proxy for every video byte.

The scalable approach is:

```text
User opens Video
        │
        ▼
Frontend requests video metadata
        │
        ▼
Node.js Backend
        │
        ▼
Retrieve Video Information
        │
        ▼
Return Video Access Information
        │
        ▼
Browser
        │
        ▼
Amazon S3
        │
        ▼
Video Playback
```

This avoids:

```text
User
 │
 ▼
Node.js Backend
 │
 ▼
S3
 │
 ▼
Node.js Backend
 │
 ▼
User
```

which would unnecessarily consume backend resources.

---

# 23. Frontend Architecture

The frontend will be developed locally first.

Recommended development stack:

```text
React
Vite
React Router
Axios
```

The frontend should communicate with the backend REST API.

---

## Major Frontend Pages

### Authentication

```text
Login
Register
Logout
```

### Video Discovery

```text
Home
Video Feed
Search
Video Details
```

### Video Playback

```text
Video Player
Title
Description
Channel Information
Comments
Likes
Subscriptions
```

### User Features

```text
Profile
Avatar
Cover Image
Account Settings
Watch History
```

### Creator Features

```text
Upload Video
Manage Uploaded Videos
```

---

# 24. Frontend Deployment

The React frontend will be built into static files.

Process:

```text
React Source Code
       │
       ▼
npm run build
       │
       ▼
Static Files

HTML
CSS
JavaScript
       │
       ▼
Amazon S3
```

The frontend and backend remain separate.

Conceptually:

```text
User
 │
 ├──────────────► S3 Frontend
 │
 │
 └──────────────► ALB Backend API
```

The frontend uses the ALB DNS endpoint to access the backend API.

---

# 25. Docker Architecture

The backend will be containerized.

Development:

```text
Node.js Backend
      │
      ▼
Dockerfile
      │
      ▼
Docker Image
```

The Docker image will then be tested locally.

Example workflow:

```text
Build Image
     │
     ▼
Run Container
     │
     ▼
Test API
     │
     ▼
Push Image to ECR
```

---

# 26. Amazon ECR

Amazon Elastic Container Registry stores backend Docker images.

Flow:

```text
Developer
    │
    ▼
GitHub
    │
    ▼
GitHub Actions
    │
    ▼
Build Docker Image
    │
    ▼
Amazon ECR
    │
    ▼
Amazon ECS
```

---

# 27. CI Pipeline

Continuous Integration ensures that application changes are validated before deployment.

The CI pipeline will work as follows:

```text
Developer Pushes Code
          │
          ▼
GitHub Repository
          │
          ▼
GitHub Actions Trigger
          │
          ▼
Install Dependencies
          │
          ▼
Run Tests
          │
          ├── Tests Fail
          │      │
          │      ▼
          │   Stop Pipeline
          │
          └── Tests Pass
                 │
                 ▼
           Build Application
                 │
                 ▼
          Build Docker Image
                 │
                 ▼
           Push Image to ECR
```

---

# 28. Continuous Deployment Pipeline

After a Docker image successfully reaches ECR:

```text
New Docker Image
       │
       ▼
ECR
       │
       ▼
Update ECS Service
       │
       ▼
New ECS Deployment
       │
       ▼
New Task Started
       │
       ▼
Health Check
       │
       ▼
ALB Registers Healthy Task
       │
       ▼
Old Task Removed
```

This allows application changes to be deployed automatically.

---

# 29. CI/CD Pipeline Summary

The complete pipeline is:

```text
Developer
    │
    ▼
Git Push
    │
    ▼
GitHub Actions
    │
    ▼
Install Dependencies
    │
    ▼
Run Tests
    │
    ▼
Build Docker Image
    │
    ▼
Push Image to ECR
    │
    ▼
Deploy to ECS
    │
    ▼
ECS Starts New Task
    │
    ▼
ALB Health Check
    │
    ▼
Application Updated
```

---

# 30. Infrastructure as Code

All major AWS infrastructure should be created using Terraform.

Terraform will manage:

```text
VPC
Public Subnets
Private Subnets
Internet Gateway
NAT Gateway
Route Tables
Security Groups
Application Load Balancer
Target Groups
EC2 Auto Scaling
ECS Cluster
ECS Service
Task Definitions
ECR
S3
ElastiCache
CloudWatch resources
```

---

# 31. Recommended Terraform Project Structure

```text
terraform/

├── main.tf
├── variables.tf
├── outputs.tf
├── providers.tf
│
├── networking.tf
├── security-groups.tf
├── alb.tf
├── ec2.tf
├── autoscaling.tf
├── ecs.tf
├── ecr.tf
├── s3.tf
├── elasticache.tf
├── monitoring.tf
│
└── terraform.tfvars
```

The final structure may evolve, but networking should remain clearly separated.

---

# 32. Terraform Workflow

Infrastructure deployment will follow:

```text
terraform init
       │
       ▼
terraform validate
       │
       ▼
terraform plan
       │
       ▼
Review Infrastructure Changes
       │
       ▼
terraform apply
```

After testing:

```text
terraform destroy
```

This is especially important for controlling costs.

---

# 33. Terraform State

Terraform state management must be considered.

A remote backend is preferred over relying exclusively on a local `.tfstate` file.

The Terraform state contains information about created infrastructure.

Loss of state can make infrastructure management difficult.

The final implementation should include a deliberate Terraform state strategy.

---

# 34. Security Architecture

Security Groups will control network communication.

The intended flow is:

```text
Internet
   │
   ▼
ALB Security Group
   │
   ▼
ECS Security Group
```

The ECS Security Group should allow backend traffic only from the ALB Security Group.

It should not allow unrestricted public access.

Conceptually:

```text
Internet
   │
   ▼
ALB : HTTP
   │
   ▼
ECS Backend : Application Port
```

---

# 35. IAM Security

The backend should not contain:

```text
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

as long-term credentials inside the ECS container.

Instead, the ECS workload should use an IAM role.

The IAM role should provide the permissions required by the backend.

For example:

```text
S3 Upload Permission
S3 Read Permission
```

Permissions should be restricted to the required bucket and operations.

This follows the principle of:

> Least Privilege

---

# 36. Application Security

The backend should include:

```text
Input validation
Rate limiting
Authentication
Authorization
Secure cookies
JWT validation
File type validation
File size limits
CORS configuration
```

The current CORS configuration must not use:

```text
*
```

together with credential-based authentication.

The frontend origin should be explicitly configured.

---

# 37. Rate Limiting

Rate limiting should be applied to sensitive endpoints.

Examples:

```text
Login
Registration
Password operations
Video upload
```

This protects the backend from abuse and excessive requests.

---

# 38. Monitoring

Amazon CloudWatch will be used for monitoring.

Important metrics include:

```text
ECS CPU Utilization
ECS Memory Utilization
Running Task Count
Desired Task Count
ALB Request Count
ALB Target Health
HTTP 4xx Errors
HTTP 5xx Errors
EC2 CPU Utilization
```

---

# 39. CloudWatch Logs

The backend containers should send application logs to CloudWatch.

Logs can include:

```text
Application startup
Errors
Request failures
Deployment events
Container failures
```

This allows debugging after deployment.

---

# 40. CloudWatch Alarms

Monitoring should not only mean viewing metrics manually.

At least a small number of alarms should be configured.

Examples:

```text
Unhealthy Targets > 0
```

or:

```text
HTTP 5xx errors exceed threshold
```

This demonstrates operational monitoring.

---

# 41. Load Testing Using k6

k6 will be used to simulate increased traffic.

Example:

```text
10 Users
   ↓

50 Users
   ↓

100 Users
```

The test will send requests to the Application Load Balancer.

Example flow:

```text
k6
 │
 ▼
ALB
 │
 ▼
ECS Backend
 │
 ▼
ElastiCache / MongoDB
```

---

# 42. Load Testing Metrics

The project should collect:

```text
Response Time
Requests Per Second
Error Rate
CPU Usage
Memory Usage
Number of ECS Tasks
ALB Target Health
```

The objective is to compare system behavior under different loads.

---

# 43. Cache Performance Testing

A useful benchmark will compare:

### Without Cache

```text
Request
   │
   ▼
MongoDB Atlas
   │
   ▼
Response
```

versus:

### With Cache

```text
Request
   │
   ▼
ElastiCache
   │
   ├── Hit → Response
   │
   └── Miss → MongoDB → Cache → Response
```

Metrics can include:

```text
Average Response Time
Database Requests
Cache Hit Rate
Cache Miss Rate
```

---

# 44. Failure Testing

The project should demonstrate resilience.

Example:

```text
ECS Task Running
       │
       ▼
Manually Stop Task
       │
       ▼
ALB Detects Unhealthy Target
       │
       ▼
Traffic Goes to Healthy Task
       │
       ▼
ECS Creates Replacement
```

This demonstrates container orchestration and recovery.

---

# 45. Application Scaling Test

The project should demonstrate:

```text
Normal Load
     │
     ▼
1 ECS Task
```

Then:

```text
Increased k6 Load
     │
     ▼
CPU Utilization Increases
     │
     ▼
Auto Scaling Policy
     │
     ▼
2 ECS Tasks
```

The ALB should distribute traffic across healthy tasks.

---

# 46. Infrastructure Scaling Test

If ECS requires additional capacity:

```text
ECS Needs More Tasks
       │
       ▼
Insufficient EC2 Capacity
       │
       ▼
EC2 Auto Scaling Group
       │
       ▼
Additional EC2 Instance
       │
       ▼
ECS Schedules Task
```

This demonstrates the difference between:

```text
Container Scaling
```

and:

```text
Infrastructure Scaling
```

---

# 47. Important Scaling Limitation

The project should explicitly document possible bottlenecks.

Examples include:

```text
MongoDB Atlas tier
EC2 instance size
NAT Gateway costs
ElastiCache capacity
Network throughput
S3 access patterns
```

A scaling demonstration should not claim that every component automatically scales infinitely.

Instead, the project should analyze:

> Which component becomes the bottleneck first?

This makes the project more technically credible.

---

# 48. Development Strategy

The project should not begin with AWS infrastructure.

The recommended workflow is:

```text
Phase 1
Application Development Locally
        │
        ▼
Phase 2
Testing and Backend Stabilization
        │
        ▼
Phase 3
Frontend Completion
        │
        ▼
Phase 4
Dockerization
        │
        ▼
Phase 5
Terraform Infrastructure
        │
        ▼
Phase 6
Cloud Deployment
        │
        ▼
Phase 7
CI/CD
        │
        ▼
Phase 8
Scaling and Load Testing
```

---

# 49. Development Phase 1 — Backend Stabilization

Tasks:

```text
Fix existing bugs
Add missing routes
Add global error handler
Fix database operations
Fix validation
Fix naming inconsistencies
Remove exposed credentials
Create .gitignore
Add health endpoint
```

### Outcome

A stable backend that works locally.

### Tests

```text
Registration
Login
Logout
JWT authentication
Profile access
Account updates
Error responses
```

---

# 50. Development Phase 2 — Complete Backend Features

Implement:

```text
Video APIs
Video upload
Video listing
Video details
Video update
Video deletion

Subscriptions

Comments

Likes

Playlists if included
```

### Outcome

A functional REST API.

### Tests

```text
Unit tests
API integration tests
Authentication tests
Authorization tests
```

---

# 51. Development Phase 3 — S3 Integration

Replace Cloudinary functionality.

Implement:

```text
S3 upload
S3 object management
Media metadata storage
Video references
Thumbnail references
```

### Outcome

Persistent media stored independently from backend containers.

### Tests

```text
Upload media
Retrieve media
Validate object creation
Check metadata
```

---

# 52. Development Phase 4 — Frontend Development

Build:

```text
Authentication
Home
Video feed
Video page
Video player
Upload interface
Profile
Channel interface
```

### Outcome

A complete full-stack application running locally.

### Tests

```text
Frontend navigation
Authentication flow
API communication
Video display
Video playback
Upload workflow
```

---

# 53. Development Phase 5 — Dockerization

Create:

```text
Dockerfile
.dockerignore
Environment configuration
```

Run the backend locally inside Docker.

### Outcome

Backend runs independently as a container.

### Tests

```text
docker build
docker run
Health endpoint
API testing
Environment testing
```

---

# 54. Development Phase 6 — Terraform Infrastructure

Create the AWS architecture using Terraform.

Implement:

```text
VPC
Public subnets
Private subnets
Internet Gateway
NAT Gateway
Route tables
Security groups
ALB
ECS
EC2
Auto Scaling
ECR
S3
ElastiCache
CloudWatch
```

### Outcome

Infrastructure can be recreated using Infrastructure as Code.

### Tests

```text
terraform validate
terraform plan
terraform apply

Verify:
VPC
Subnets
ALB
ECS
Connectivity
```

---

# 55. Development Phase 7 — Cloud Deployment

Deploy:

```text
Docker Image → ECR

ECS Task Definition

ECS Service

ALB Target Group
```

### Outcome

The backend becomes accessible through the ALB.

### Tests

```text
Health Check
API Requests
ALB Routing
Target Health
Container Logs
```

---

# 56. Development Phase 8 — ElastiCache Integration

Implement cache-aside logic.

Start with:

```text
Video listing cache
Individual video metadata cache
```

### Outcome

Frequently requested data avoids repeated MongoDB queries.

### Tests

```text
Cache Miss
Cache Hit
Cache Invalidation
Response Time Comparison
```

---

# 57. Development Phase 9 — CI/CD

Create GitHub Actions workflows.

Pipeline:

```text
Push Code
    │
    ▼
Install Dependencies
    │
    ▼
Run Tests
    │
    ▼
Build Docker Image
    │
    ▼
Push ECR Image
    │
    ▼
Deploy ECS
```

### Outcome

Application deployment becomes automated.

### Tests

```text
Make Code Change
       │
       ▼
Push to GitHub
       │
       ▼
Observe Pipeline
       │
       ▼
Verify ECS Deployment
```

---

# 58. Development Phase 10 — Load Testing and Scaling

Use k6.

Test:

```text
Low Traffic
Medium Traffic
High Traffic
```

Observe:

```text
Response Time
CPU
Memory
Task Count
Errors
Cache Behavior
```

### Outcome

Demonstrate ECS scaling and system behavior under increased traffic.

---

# 59. Development Phase 11 — Failure Testing

Perform controlled failures.

Examples:

```text
Stop ECS Task
Observe ALB
Observe ECS Replacement
Observe CloudWatch
```

### Outcome

Demonstrate resilience and recovery.

---

# 60. Final Architecture Diagram

```text
                              USERS
                                │
                                ▼
                             INTERNET
                                │
                                ▼
                        INTERNET GATEWAY
                                │
┌───────────────────────────────┼──────────────────────────────┐
│                               VPC                             │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    PUBLIC SUBNETS                       │  │
│  │                                                         │  │
│  │       ┌──────────────────────────────────────┐          │  │
│  │       │ Application Load Balancer            │          │  │
│  │       │         Multi-AZ                     │          │  │
│  │       └─────────────────┬────────────────────┘          │  │
│  │                         │                               │  │
│  │       ┌─────────────────▼──────────────────┐            │  │
│  │       │          NAT Gateway               │            │  │
│  │       └────────────────────────────────────┘            │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│                         │                                     │
│                         ▼                                     │
│                  ALB Target Group                             │
│                         │                                     │
│             ┌───────────┴───────────┐                         │
│             ▼                       ▼                         │
│  ┌───────────────────┐   ┌───────────────────┐                │
│  │ PRIVATE SUBNET A  │   │ PRIVATE SUBNET B  │                │
│  │                   │   │                   │                │
│  │ EC2 Instance      │   │ EC2 Instance      │                │
│  │       │           │   │       │           │                │
│  │   ECS Task        │   │   ECS Task        │                │
│  │       │           │   │       │           │                │
│  │ Node.js Backend   │   │ Node.js Backend   │                │
│  └─────────┬─────────┘   └─────────┬─────────┘                │
│            │                       │                          │
│            └───────────┬───────────┘                          │
│                        │                                      │
│                        ▼                                      │
│                   ElastiCache                                │
│                                                               │
└────────────────────────┼──────────────────────────────────────┘
                         │
             ┌───────────┴────────────┐
             │                        │
             ▼                        ▼
        Amazon S3                MongoDB Atlas
      Media Storage              Primary Database


Frontend:

Users
  │
  ▼
React Application
  │
  ▼
Amazon S3 Static Hosting
```

---

# 61. Final Request Flow

### API Request

```text
User
 │
 ▼
React Frontend
 │
 ▼
ALB
 │
 ▼
ECS Task
 │
 ▼
ElastiCache
 │
 ├── Cache Hit → Response
 │
 └── Cache Miss
         │
         ▼
     MongoDB Atlas
         │
         ▼
       Response
```

---

# 62. Final Video Upload Flow

```text
User
 │
 ▼
React Upload Page
 │
 ▼
Node.js Backend
 │
 ▼
Amazon S3
 │
 ▼
Store Object
 │
 ▼
MongoDB Atlas
 │
 ▼
Store Metadata
```

---

# 63. Final Video Playback Flow

```text
User clicks Video
       │
       ▼
Frontend
       │
       ▼
Backend API
       │
       ▼
Retrieve Video Metadata
       │
       ▼
Return Video Access Information
       │
       ▼
Browser
       │
       ▼
Amazon S3
       │
       ▼
Video Playback
```

---

# 64. Final CI/CD Flow

```text
Developer
    │
    ▼
Git Push
    │
    ▼
GitHub Repository
    │
    ▼
GitHub Actions
    │
    ▼
Run Tests
    │
    ├── FAIL → Stop
    │
    └── PASS
          │
          ▼
Build Docker Image
          │
          ▼
Push to ECR
          │
          ▼
Update ECS Service
          │
          ▼
New ECS Task
          │
          ▼
ALB Health Check
          │
          ▼
Deployment Complete
```

---

# 65. What This Project Demonstrates

By the end of the project, the system will demonstrate:

### Full-Stack Engineering

```text
React
Node.js
REST APIs
Authentication
Database Design
Media Management
```

### Cloud Engineering

```text
AWS VPC
Public Subnets
Private Subnets
NAT Gateway
ALB
ECS
EC2
S3
ElastiCache
CloudWatch
```

### DevOps

```text
Docker
Terraform
GitHub Actions
CI/CD
ECR
Automated Deployment
```

### Scalability

```text
Load Balancing
ECS Service Scaling
EC2 Infrastructure Scaling
Caching
Load Testing
```

### Resilience

```text
Health Checks
Multiple Tasks
Automatic Task Replacement
Failure Testing
CloudWatch Monitoring
```

---

# 66. Important Architectural Tradeoffs

The project should explicitly acknowledge its tradeoffs.

### MongoDB Atlas

MongoDB Atlas may become a bottleneck depending on the selected tier.

Caching reduces repeated reads but does not eliminate database limitations.

---

### NAT Gateway

A single NAT Gateway is being used to control costs.

This means the project does not provide complete NAT-level redundancy.

---

### EC2 Capacity

The Auto Scaling Group will have a deliberately small maximum capacity.

This is a cost-control decision.

---

### HTTPS

Without a custom domain and certificate setup, HTTPS architecture may be outside the initial demonstration scope.

This should be documented rather than ignored.

---

# 67. Final Project Goal

The completed project should tell the following engineering story:

> A traditional Node.js application was first repaired and completed locally. A React frontend was developed to create a complete full-stack video content platform. Media storage was migrated to Amazon S3, the backend was containerized using Docker, and AWS infrastructure was provisioned using Terraform. The backend was deployed as ECS tasks running on EC2 instances inside private subnets and exposed through an Application Load Balancer. MongoDB Atlas was retained as the primary database while Amazon ElastiCache was introduced to reduce repeated database reads. GitHub Actions automated testing, container image creation, and deployment through Amazon ECR and ECS. Finally, k6 load testing, ECS scaling, EC2 Auto Scaling, CloudWatch monitoring, and controlled failure testing were used to evaluate the platform's scalability and resilience.

---

# 68. Final Scope Statement

This project is **not attempting to build YouTube**.

It is a controlled demonstration of a cloud-native application architecture.

The primary focus is:

```text
Application Development
        +
Cloud Architecture
        +
DevOps Automation
        +
Scalability
        +
Infrastructure as Code
        +
Testing
        +
Observability
```

The final outcome should be a portfolio-quality project demonstrating how a full-stack application can be designed, deployed, automated, monitored, and tested using modern cloud engineering practices.