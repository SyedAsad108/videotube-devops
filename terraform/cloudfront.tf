# ==========================================
# Amazon CloudFront CDN & S3 Frontend Hosting
# ==========================================

# ------------------------------------------
# S3 Bucket for Static React SPA
# ------------------------------------------
resource "aws_s3_bucket" "frontend" {
  bucket        = "${local.name_prefix}-frontend-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name = "${local.name_prefix}-frontend"
  }
}

# Block all direct public access (Only CloudFront OAC can read)
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption (AES256)
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# ------------------------------------------
# CloudFront Origin Access Control (OAC)
# ------------------------------------------
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name_prefix}-frontend-oac"
  description                       = "OAC for VideoTube Frontend Static Assets"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_origin_access_control" "media" {
  name                              = "${local.name_prefix}-media-oac"
  description                       = "OAC for VideoTube Media and Video Streaming"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ------------------------------------------
# CloudFront Edge Function: SPA Client-Side Routing
# (Rewrites deep SPA paths to /index.html without breaking assets or API)
# ------------------------------------------
resource "aws_cloudfront_function" "spa_rewrite" {
  name    = "${local.name_prefix}-spa-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrites non-file routes to /index.html for React Router without masking API 404s"
  publish = true
  code    = <<-EOT
function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // If URI has a file extension (.js, .css, .png, .svg, etc.), pass through directly
    if (uri.indexOf('.') !== -1) {
        return request;
    }

    // Otherwise rewrite to /index.html for React SPA client routing
    request.uri = '/index.html';
    return request;
}
EOT
}

# ------------------------------------------
# Managed CloudFront Policies
# ------------------------------------------
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer_except_host_header" {
  name = "Managed-AllViewerExceptHostHeader"
}

data "aws_cloudfront_response_headers_policy" "cors_with_preflight" {
  name = "Managed-CORS-With-Preflight"
}

# ------------------------------------------
# Multi-Origin CloudFront Distribution
# ------------------------------------------
resource "aws_cloudfront_distribution" "main" {
  count               = var.enable_cloudfront ? 1 : 0
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "VideoTube Global CDN (S3 Frontend + ALB Backend API + S3 Media)"
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  # Origin 1: S3 Frontend Static Assets
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-Frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # Origin 2: ALB Backend REST API
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB-Backend"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Origin 3: S3 Media Storage (Videos, Thumbnails, Avatars)
  origin {
    domain_name              = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id                = "S3-Media"
    origin_access_control_id = aws_cloudfront_origin_access_control.media.id
  }

  # ------------------------------------------
  # Cache Behaviors
  # ------------------------------------------

  # 1. API Route: /api/* -> ALB Backend (Dynamic, Never Cached, Preserves Auth & Cookies)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    target_origin_id = "ALB-Backend"

    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host_header.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # 2. Hashed Static Assets: /assets/* -> S3 Frontend (1-Year Immutable Caching, Brotli & Gzip)
  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    target_origin_id = "S3-Frontend"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
  }

  # 3. Video Streaming: /videos/* -> S3 Media (Range Requests, Seeking, Edge Caching)
  ordered_cache_behavior {
    path_pattern     = "/videos/*"
    target_origin_id = "S3-Media"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.cors_with_preflight.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = false # Pre-compressed video files
  }

  # 4. Thumbnails: /thumbnails/* -> S3 Media (Edge Cached)
  ordered_cache_behavior {
    path_pattern     = "/thumbnails/*"
    target_origin_id = "S3-Media"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.cors_with_preflight.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = false
  }

  # 5. Avatars: /avatars/* -> S3 Media (Edge Cached)
  ordered_cache_behavior {
    path_pattern     = "/avatars/*"
    target_origin_id = "S3-Media"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id            = data.aws_cloudfront_cache_policy.caching_optimized.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.cors_with_preflight.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = false
  }

  # Default Cache Behavior: /* -> S3 Frontend SPA (with SPA Client-Routing Function)
  default_cache_behavior {
    target_origin_id = "S3-Frontend"

    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD"]

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_rewrite.arn
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "${local.name_prefix}-cloudfront"
    Environment = var.environment
  }
}

# ------------------------------------------
# S3 Bucket Policy: S3 Frontend (OAC Only)
# ------------------------------------------
resource "aws_s3_bucket_policy" "frontend" {
  count  = var.enable_cloudfront ? 1 : 0
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main[0].arn
          }
        }
      }
    ]
  })
}

# ------------------------------------------
# S3 Bucket Policy: S3 Media (CloudFront OAC + IAM Task)
# ------------------------------------------
resource "aws_s3_bucket_policy" "media" {
  count  = var.enable_cloudfront ? 1 : 0
  bucket = aws_s3_bucket.media.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.media.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main[0].arn
          }
        }
      }
    ]
  })
}
