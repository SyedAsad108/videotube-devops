output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "URL of the Amazon ECR repository for backend images"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_frontend_repository_url" {
  description = "URL of the Amazon ECR repository for frontend images"
  value       = aws_ecr_repository.frontend.repository_url
}

output "s3_bucket_name" {
  description = "Name of the S3 media storage bucket"
  value       = aws_s3_bucket.media.bucket
}

output "elasticache_endpoint" {
  description = "Connection endpoint for the ElastiCache Redis cluster"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the backend ECS service"
  value       = aws_ecs_service.backend.name
}

output "ecs_frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "frontend_target_group_arn" {
  description = "ARN of the frontend ALB target group"
  value       = aws_lb_target_group.frontend.arn
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "ecs_capacity_provider" {
  description = "Name of the ECS EC2 capacity provider"
  value       = aws_ecs_capacity_provider.ec2.name
}

output "autoscaling_group_name" {
  description = "Name of the EC2 Auto Scaling Group backing ECS"
  value       = aws_autoscaling_group.ecs.name
}

output "github_actions_role_arn" {
  description = "ARN of the IAM role assumed by GitHub Actions via OIDC"
  value       = aws_iam_role.github_actions.arn
}
