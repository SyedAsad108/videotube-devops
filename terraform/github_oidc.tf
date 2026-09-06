# ==========================================
# GitHub Actions OIDC Provider & Deployment Role
# Region: ap-south-1
# ==========================================

# GitHub Actions OIDC Provider (global IAM resource)
resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  # GitHub's OIDC audience for AWS
  client_id_list = ["sts.amazonaws.com"]

  # GitHub's OIDC thumbprints (current as of 2025)
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c5876126b3048e29be0a75179a046f044963d00"
  ]
}

# IAM Role assumed by GitHub Actions via OIDC
resource "aws_iam_role" "github_actions" {
  name = "videotube-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = [
              "repo:SyedAsad108/videotube-devops:*",
              "repo:SyedAsad108@*/videotube-devops@*:*",
              "repo:SyedAsad108@181968760/videotube-devops@1359536819:*"
            ]
          }
        }
      }
    ]
  })

  tags = {
    Name = "videotube-github-actions-role"
  }
}

# Policy: allows GitHub Actions to push images to ECR and update ECS
resource "aws_iam_role_policy" "github_actions_deploy" {
  name = "VideoTubeGitHubActionsDeploymentPolicy"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "ECRAuth"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "ECRRepositoryAccess"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:DescribeRepositories",
          "ecr:ListImages"
        ]
        Resource = aws_ecr_repository.backend.arn
      },
      {
        Sid    = "ECSDeployment"
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:UpdateService",
          "ecs:DescribeTaskDefinition",
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:DescribeClusters",
          "ecs:ListContainerInstances",
          "ecs:DescribeContainerInstances"
        ]
        Resource = "*"
      },
      {
        Sid    = "IAMPassRoleToECS"
        Effect = "Allow"
        Action = ["iam:PassRole"]
        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.ecs_task.arn
        ]
      }
    ]
  })
}
