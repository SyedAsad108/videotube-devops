output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_url" {
  description = "URL of the Amazon ECR repository for backend images"
  value       = aws_ecr_repository.backend.repository_url
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
  description = "Name of the ECS service"
  value       = aws_ecs_service.backend.name
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}
