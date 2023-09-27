terraform {
  backend "s3" {
    bucket = "io.cribl.sandbox.tfbackend"
    key = "ecr-example-rest-server"
    region = "us-west-2"
  }

  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 4.0"
    }

    tls = {
      source = "hashicorp/tls"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"
}

provider "aws" {
  region = "us-east-1"
  alias = "useast1"
}

// TLS Certificate info for Github Actions
data "tls_certificate" "github-actions-token" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}

// IAM Identity Provider
// Only one of these per account
// terraform import aws_iam_openid_connect_provider.github_actions arn:aws:iam::##########:oidc-provider/token.actions.githubusercontent.com
resource "aws_iam_openid_connect_provider" "github_actions" {
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = data.tls_certificate.github-actions-token.certificates[*].sha1_fingerprint
  url             = "https://token.actions.githubusercontent.com"

  lifecycle {
    prevent_destroy = true

    ignore_changes = [thumbprint_list]
  }
}

resource "aws_iam_role" "github_example_rest_server" {
  name = "Github-Actions-example-rest-server-docker-publisher"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRoleWithWebIdentity"
        Effect    = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github_actions.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" : "sts.amazonaws.com"
          },
          StringLike = {
            "token.actions.githubusercontent.com:sub" : "repo:criblio/example-rest-server:ref:refs/tags/*",
          }
        }
      },
    ]
  })

  inline_policy {
    name   = "write_to_public_ecr"
    policy = jsonencode(
      {
        Statement = [
          {
            Action = [
                "ecr-public:GetAuthorizationToken",
                "sts:GetServiceBearerToken"
            ]
            Resource = ["*"]
            Effect = "Allow"
            Sid = "GetPublicAuthToken"
          },
          {
            Action = [
                "ecr-public:CompleteLayerUpload",
                "ecr-public:UploadLayerPart",
                "ecr-public:InitiateLayerUpload",
                "ecr-public:BatchCheckLayerAvailability",
                "ecr-public:PutImage"
            ]
            Resource = [
              module.example-rest-server.repository_arn,
            ]
            Effect = "Allow"
            Sid = "WritePublic"
          }
        ]
        Version = "2012-10-17"
      }
    )
  }
}

module "example-rest-server" {
  source = "terraform-aws-modules/ecr/aws"
  repository_name = "example-rest-server"
  repository_type = "public"
  providers = {
    aws = aws.useast1
  }

  create_lifecycle_policy = false
  repository_image_scan_on_push = false
  repository_image_tag_mutability = "MUTABLE"
}