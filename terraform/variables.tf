variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name prefix for naming resources"
  type        = string
  default     = "videotube"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (2 AZs)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (2 AZs)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "ec2_instance_type" {
  description = "EC2 instance type for the ECS cluster nodes"
  type        = string
  default     = "t3.micro"
}

variable "asg_min_size" {
  description = "Minimum number of EC2 instances in Auto Scaling Group"
  type        = number
  default     = 1
}

variable "asg_desired_capacity" {
  description = "Desired number of EC2 instances in Auto Scaling Group"
  type        = number
  default     = 1
}

variable "asg_max_size" {
  description = "Maximum number of EC2 instances in Auto Scaling Group"
  type        = number
  default     = 2
}

variable "container_port" {
  description = "Port exposed by the backend container"
  type        = number
  default     = 8000
}

variable "elasticache_node_type" {
  description = "ElastiCache Redis node type (smallest suitable size for credits/free tier)"
  type        = string
  default     = "cache.t3.micro"
}

variable "mongodb_uri" {
  description = "MongoDB connection string (Atlas or remote)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "jwt_access_secret" {
  description = "JWT Access Token Secret"
  type        = string
  default     = "videotube_dev_access_secret_1234567890"
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT Refresh Token Secret"
  type        = string
  default     = "videotube_dev_refresh_secret_1234567890"
  sensitive   = true
}

variable "enable_cloudfront" {
  description = "Flag to create CloudFront distribution once AWS Support verifies the account for CloudFront"
  type        = bool
  default     = false
}

