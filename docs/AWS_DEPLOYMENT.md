---
noteId: "aws-deployment-guide"
tags: ["deployment", "aws", "production", "infrastructure"]
---

# AWS Deployment Strategy

This guide provides the recommended AWS architecture and deployment strategy for the TimeTrack multi-tenant time tracking SaaS application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Recommended AWS Services](#recommended-aws-services)
3. [Deployment Options](#deployment-options)
4. [Step-by-Step Deployment](#step-by-step-deployment)
5. [Infrastructure as Code](#infrastructure-as-code)
6. [Security Configuration](#security-configuration)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Scaling Strategy](#scaling-strategy)
10. [Cost Optimization](#cost-optimization)
11. [Disaster Recovery](#disaster-recovery)

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Route 53 (DNS)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│           CloudFront CDN (Static Assets + API Cache)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              Application Load Balancer (ALB)                     │
│                    SSL/TLS Termination                           │
└────┬───────────────────────┬──────────────────────────────────┬─┘
     │                       │                                  │
┌────▼────┐           ┌──────▼────┐                    ┌───────▼───┐
│  ECS    │           │    ECS    │                    │    ECS    │
│ Fargate │◄─────────►│  Fargate  │◄──────────────────►│  Fargate  │
│Container│           │ Container │                    │ Container │
└────┬────┘           └─────┬─────┘                    └─────┬─────┘
     │                      │                                │
     └──────────────────────┼────────────────────────────────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
    ┌─────▼──────┐                    ┌──────▼───────┐
    │   Amazon   │                    │  ElastiCache │
    │    RDS     │                    │    Redis     │
    │ PostgreSQL │                    │  (Sessions)  │
    │ Multi-AZ   │                    └──────────────┘
    └────────────┘
```

### Key Components

- **CloudFront**: CDN for static assets and API caching
- **ALB**: Load balancing across availability zones
- **ECS Fargate**: Serverless container orchestration
- **RDS PostgreSQL**: Managed database with Multi-AZ failover
- **ElastiCache Redis**: Session store and caching layer
- **S3**: Static asset storage and backups
- **Secrets Manager**: Secure credential storage

## Recommended AWS Services

### Compute: ECS Fargate (Recommended)

**Why Fargate over EC2 or Lambda:**
- No server management (serverless containers)
- Automatic scaling with predictable performance
- WebSocket support for Neon database connections
- Long-running processes for session management
- Cost-effective for consistent workloads

**Alternative Options:**
- **AWS App Runner**: Simpler but less control, good for smaller deployments
- **EKS**: If you need Kubernetes, but adds complexity
- **Lambda + API Gateway**: Not ideal due to WebSocket requirements and session management

### Database: Amazon RDS for PostgreSQL

**Configuration:**
- **Instance Type**: Start with `db.t4g.micro` (free tier) or `db.t4g.small`
- **Multi-AZ**: Enabled for production (automatic failover)
- **Storage**: General Purpose SSD (gp3), start with 20GB, auto-scaling enabled
- **Version**: PostgreSQL 15 or later
- **Backup**: Automated daily backups, 7-day retention

**Why RDS over Aurora:**
- Lower cost for small to medium workloads
- Simpler pricing model
- Sufficient performance for time tracking workload
- Upgrade path to Aurora available if needed

### Session Store: ElastiCache Redis

**Why Redis for Sessions:**
- Fast session lookups (sub-millisecond)
- Automatic failover with cluster mode
- Better than in-memory when scaling horizontally
- TTL support for session expiration

**Configuration:**
- **Node Type**: `cache.t4g.micro` (free tier) or `cache.t4g.small`
- **Mode**: Cluster mode enabled for production
- **Replicas**: 1 replica per primary for high availability

### CDN & Storage: CloudFront + S3

**CloudFront Benefits:**
- Global content delivery
- DDoS protection with AWS Shield
- SSL/TLS termination
- Caching for static assets and API responses

**S3 Usage:**
- Static asset storage (built React app)
- Database backup storage
- Logs and audit trails

## Deployment Options

### Option 1: ECS Fargate with Application Load Balancer (Recommended)

**Best for:** Production deployments, scaling teams, high availability requirements

**Pros:**
- Full control over container configuration
- Excellent scaling capabilities
- Supports health checks and blue-green deployments
- Integrated monitoring with CloudWatch

**Monthly Cost Estimate (Starter):**
- ECS Fargate (0.25 vCPU, 0.5 GB): ~$15
- RDS db.t4g.micro Multi-AZ: ~$25
- ALB: ~$20
- ElastiCache cache.t4g.micro: ~$12
- Data transfer: ~$10
- **Total: ~$82/month**

### Option 2: AWS App Runner (Simplest)

**Best for:** MVP, solo developers, proof of concept

**Pros:**
- Extremely simple deployment (push and deploy)
- Automatic SSL certificates
- Built-in load balancing
- Lower operational overhead

**Cons:**
- Less control over infrastructure
- Higher per-request cost at scale
- Limited customization options

**Monthly Cost Estimate (Starter):**
- App Runner service: ~$25
- RDS db.t4g.micro: ~$15 (single AZ)
- ElastiCache (optional): ~$12
- **Total: ~$40-52/month**

### Option 3: Elastic Beanstalk

**Best for:** Teams familiar with traditional hosting, gradual cloud migration

**Pros:**
- Managed platform with less configuration
- Supports Docker containers
- Easy environment management (staging, production)

**Cons:**
- More expensive than raw ECS
- Less flexible than pure ECS

## Step-by-Step Deployment

### Prerequisites

1. AWS Account with billing enabled
2. AWS CLI installed and configured
3. Docker installed locally
4. Domain name (for production)

### Phase 1: Database Setup

#### 1.1 Create RDS PostgreSQL Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier timetrack-prod-db \
  --db-instance-class db.t4g.small \
  --engine postgres \
  --engine-version 15.5 \
  --master-username postgres \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 20 \
  --storage-type gp3 \
  --storage-encrypted \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name default \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00"
```

#### 1.2 Run Database Migrations

```bash
# Get database endpoint
export DATABASE_URL="postgresql://postgres:password@timetrack-prod-db.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require"

# Run migrations
npm run db:push

# Verify connection
npm run db:test
```

### Phase 2: Session Store Setup

#### 2.1 Create ElastiCache Redis Cluster

```bash
aws elasticache create-replication-group \
  --replication-group-id timetrack-sessions \
  --replication-group-description "Session store for TimeTrack" \
  --engine redis \
  --cache-node-type cache.t4g.micro \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token YOUR_REDIS_AUTH_TOKEN \
  --cache-subnet-group-name default \
  --security-group-ids sg-xxxxx
```

#### 2.2 Update Application Configuration

Update `server/replitAuth.ts` to use Redis for session store:

```typescript
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_AUTH_TOKEN,
});

await redisClient.connect();

const sessionStore = new RedisStore({ client: redisClient });
```

### Phase 3: Container Setup

#### 3.1 Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY client ./client
COPY server ./server
COPY shared ./shared
COPY migrations ./migrations
COPY vite.config.ts ./
COPY drizzle.config.ts ./

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY shared ./shared

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start application
CMD ["node", "dist/index.js"]
```

#### 3.2 Create .dockerignore

```
node_modules
npm-debug.log
.env
.env.*
dist
.git
.gitignore
*.md
test
docs
.replit
```

#### 3.3 Build and Test Locally

```bash
# Build image
docker build -t timetrack:latest .

# Test locally
docker run -p 8080:8080 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="..." \
  -e STRIPE_SECRET_KEY="..." \
  timetrack:latest
```

### Phase 4: ECS Fargate Deployment

#### 4.1 Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name timetrack \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256
```

#### 4.2 Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag timetrack:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timetrack:latest

# Push image
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timetrack:latest
```

#### 4.3 Create ECS Task Definition

Create `task-definition.json`:

```json
{
  "family": "timetrack",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "timetrack",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/timetrack:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "8080"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:timetrack/database-url"
        },
        {
          "name": "SESSION_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:timetrack/session-secret"
        },
        {
          "name": "STRIPE_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:timetrack/stripe-secret"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:timetrack/redis-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/timetrack",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### 4.4 Create ECS Service

```bash
aws ecs create-service \
  --cluster timetrack-cluster \
  --service-name timetrack-service \
  --task-definition timetrack:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --platform-version LATEST \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:targetgroup/timetrack-tg/xxxxx,containerName=timetrack,containerPort=8080" \
  --health-check-grace-period-seconds 60 \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100,deploymentCircuitBreaker={enable=true,rollback=true}"
```

### Phase 5: Load Balancer Setup

#### 5.1 Create Application Load Balancer

```bash
aws elbv2 create-load-balancer \
  --name timetrack-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4
```

#### 5.2 Create Target Group

```bash
aws elbv2 create-target-group \
  --name timetrack-tg \
  --protocol HTTP \
  --port 8080 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-enabled \
  --health-check-protocol HTTP \
  --health-check-path /api/health \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3
```

#### 5.3 Create Listener

```bash
# HTTP listener (redirects to HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:loadbalancer/app/timetrack-alb/xxxxx \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}

# HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:loadbalancer/app/timetrack-alb/xxxxx \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/xxxxx \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:ACCOUNT_ID:targetgroup/timetrack-tg/xxxxx
```

### Phase 6: Domain and SSL Setup

#### 6.1 Request SSL Certificate (ACM)

```bash
aws acm request-certificate \
  --domain-name timetrack.example.com \
  --subject-alternative-names "*.timetrack.example.com" \
  --validation-method DNS \
  --idempotency-token timetrack-cert-2024
```

#### 6.2 Configure Route 53

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone \
  --name timetrack.example.com \
  --caller-reference timetrack-2024

# Create A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dns-record.json
```

`dns-record.json`:

```json
{
  "Changes": [
    {
      "Action": "CREATE",
      "ResourceRecordSet": {
        "Name": "timetrack.example.com",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "timetrack-alb-xxxxx.us-east-1.elb.amazonaws.com",
          "EvaluateTargetHealth": true
        }
      }
    }
  ]
}
```

### Phase 7: Secrets Management

#### 7.1 Store Secrets in AWS Secrets Manager

```bash
# Database URL
aws secretsmanager create-secret \
  --name timetrack/database-url \
  --secret-string "postgresql://postgres:password@timetrack-prod-db.xxxxx.us-east-1.rds.amazonaws.com:5432/postgres?sslmode=require"

# Session secret
aws secretsmanager create-secret \
  --name timetrack/session-secret \
  --secret-string "$(openssl rand -base64 32)"

# Stripe secret key
aws secretsmanager create-secret \
  --name timetrack/stripe-secret \
  --secret-string "sk_live_xxxxx"

# Redis URL
aws secretsmanager create-secret \
  --name timetrack/redis-url \
  --secret-string "rediss://:authtoken@timetrack-sessions.xxxxx.cache.amazonaws.com:6379"
```

#### 7.2 Grant ECS Task Access

Update task role policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:timetrack/*"
      ]
    }
  ]
}
```

### Phase 8: Auto Scaling

#### 8.1 Configure ECS Service Auto Scaling

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/timetrack-cluster/timetrack-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy (CPU-based)
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/timetrack-cluster/timetrack-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

`scaling-policy.json`:

```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

## Infrastructure as Code

### Terraform Configuration

For production deployments, use Terraform to manage infrastructure:

Create `terraform/main.tf`:

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "timetrack-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC and Networking
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "timetrack-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  enable_vpn_gateway = false

  tags = {
    Environment = "production"
    Application = "timetrack"
  }
}

# RDS PostgreSQL
module "rds" {
  source = "terraform-aws-modules/rds/aws"

  identifier = "timetrack-prod-db"

  engine               = "postgres"
  engine_version       = "15.5"
  family               = "postgres15"
  major_engine_version = "15"
  instance_class       = "db.t4g.small"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = "timetrack"
  username = "postgres"
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group
  vpc_security_group_ids = [module.database_sg.security_group_id]

  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  deletion_protection = true
  skip_final_snapshot = false

  tags = {
    Environment = "production"
    Application = "timetrack"
  }
}

# ElastiCache Redis
module "elasticache" {
  source = "terraform-aws-modules/elasticache/aws"

  cluster_id               = "timetrack-sessions"
  engine                   = "redis"
  node_type                = "cache.t4g.micro"
  num_cache_nodes          = 2
  parameter_group_name     = "default.redis7"
  engine_version           = "7.0"
  port                     = 6379

  subnet_ids              = module.vpc.private_subnets
  security_group_ids      = [module.redis_sg.security_group_id]

  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Environment = "production"
    Application = "timetrack"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "timetrack-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = "production"
    Application = "timetrack"
  }
}

# Application Load Balancer
module "alb" {
  source = "terraform-aws-modules/alb/aws"

  name = "timetrack-alb"

  load_balancer_type = "application"

  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  security_groups = [module.alb_sg.security_group_id]

  target_groups = [
    {
      name             = "timetrack-tg"
      backend_protocol = "HTTP"
      backend_port     = 8080
      target_type      = "ip"

      health_check = {
        enabled             = true
        interval            = 30
        path                = "/api/health"
        port                = "traffic-port"
        healthy_threshold   = 2
        unhealthy_threshold = 3
        timeout             = 5
        protocol            = "HTTP"
        matcher             = "200-299"
      }
    }
  ]

  https_listeners = [
    {
      port               = 443
      protocol           = "HTTPS"
      certificate_arn    = aws_acm_certificate.main.arn
      target_group_index = 0
    }
  ]

  http_listeners = [
    {
      port        = 80
      protocol    = "HTTP"
      action_type = "redirect"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  ]

  tags = {
    Environment = "production"
    Application = "timetrack"
  }
}
```

Deploy with Terraform:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

## Security Configuration

### Security Group Rules

#### ALB Security Group

```
Inbound:
- Port 80 (HTTP) from 0.0.0.0/0
- Port 443 (HTTPS) from 0.0.0.0/0

Outbound:
- Port 8080 to ECS Security Group
```

#### ECS Security Group

```
Inbound:
- Port 8080 from ALB Security Group

Outbound:
- Port 5432 to RDS Security Group
- Port 6379 to Redis Security Group
- Port 443 to 0.0.0.0/0 (for Stripe API, OAuth)
```

#### RDS Security Group

```
Inbound:
- Port 5432 from ECS Security Group

Outbound:
- None required
```

#### Redis Security Group

```
Inbound:
- Port 6379 from ECS Security Group

Outbound:
- None required
```

### IAM Roles and Policies

#### ECS Task Execution Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

#### ECS Task Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:ACCOUNT_ID:secret:timetrack/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::timetrack-backups/*"
      ]
    }
  ]
}
```

### Environment Variables Best Practices

**Never commit secrets to version control**

Use AWS Secrets Manager for:
- DATABASE_URL
- SESSION_SECRET
- STRIPE_SECRET_KEY
- REDIS_URL
- OAuth client secrets

Use environment variables for:
- NODE_ENV
- PORT
- AWS_REGION (non-sensitive configuration)

## Monitoring and Logging

### CloudWatch Configuration

#### Log Groups

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/timetrack

# Set retention policy (30 days)
aws logs put-retention-policy \
  --log-group-name /ecs/timetrack \
  --retention-in-days 30
```

#### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name timetrack-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=timetrack-service Name=ClusterName,Value=timetrack-cluster

# High memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name timetrack-high-memory \
  --alarm-description "Alert when memory exceeds 80%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=timetrack-service Name=ClusterName,Value=timetrack-cluster

# Database connection alarm
aws cloudwatch put-metric-alarm \
  --alarm-name timetrack-db-connections \
  --alarm-description "Alert when DB connections exceed 80%" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 16 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=DBInstanceIdentifier,Value=timetrack-prod-db

# ALB 5xx errors
aws cloudwatch put-metric-alarm \
  --alarm-name timetrack-5xx-errors \
  --alarm-description "Alert on high 5xx error rate" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=LoadBalancer,Value=app/timetrack-alb/xxxxx
```

### Application-Level Monitoring

Add health check endpoint in `server/routes.ts`:

```typescript
app.get('/api/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    checks: {
      database: 'unknown',
      redis: 'unknown'
    }
  };

  try {
    // Check database
    await db.execute(sql`SELECT 1`);
    health.checks.database = 'healthy';
  } catch (err) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    // Check Redis
    await redisClient.ping();
    health.checks.redis = 'healthy';
  } catch (err) {
    health.checks.redis = 'unhealthy';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});
```

### CloudWatch Dashboard

Create custom dashboard:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name TimeTrack-Production \
  --dashboard-body file://dashboard.json
```

`dashboard.json`:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
          [".", "MemoryUtilization", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Resource Utilization",
        "yAxis": {
          "left": {"min": 0, "max": 100}
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
          [".", "CPUUtilization", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "RDS Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ApplicationELB", "RequestCount", {"stat": "Sum"}],
          [".", "TargetResponseTime", {"stat": "Average"}]
        ],
        "period": 300,
        "region": "us-east-1",
        "title": "Load Balancer Performance"
      }
    }
  ]
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS ECS

on:
  push:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: timetrack
  ECS_SERVICE: timetrack-service
  ECS_CLUSTER: timetrack-cluster
  CONTAINER_NAME: timetrack

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition timetrack \
            --query taskDefinition > task-definition.json

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

      - name: Run database migrations
        run: |
          # Get task ARN
          TASK_ARN=$(aws ecs list-tasks \
            --cluster $ECS_CLUSTER \
            --service-name $ECS_SERVICE \
            --query 'taskArns[0]' \
            --output text)

          # Run migration command
          aws ecs execute-command \
            --cluster $ECS_CLUSTER \
            --task $TASK_ARN \
            --container $CONTAINER_NAME \
            --interactive \
            --command "npm run db:push"
```

### Pre-deployment Checklist

Before deploying:

- [ ] Run tests: `npm run test`
- [ ] Type check: `npm run check`
- [ ] Build locally: `npm run build`
- [ ] Test Docker image locally
- [ ] Review environment variables
- [ ] Backup database
- [ ] Check AWS service quotas
- [ ] Verify SSL certificate is valid

## Scaling Strategy

### Horizontal Scaling

**ECS Service Auto Scaling Configuration:**

```hcl
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "ecs_policy_memory" {
  name               = "memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

### Vertical Scaling

**Task Size Recommendations by Load:**

| Users | CPU | Memory | Task Count | Cost/Month |
|-------|-----|--------|------------|------------|
| 0-100 | 0.25 vCPU | 512 MB | 2 | $15 |
| 100-500 | 0.5 vCPU | 1 GB | 2-4 | $30-60 |
| 500-2000 | 1 vCPU | 2 GB | 2-6 | $90-270 |
| 2000-10000 | 2 vCPU | 4 GB | 4-10 | $480-1200 |

### Database Scaling

**RDS Instance Size Recommendations:**

| Users | Instance Type | Storage | IOPS | Cost/Month |
|-------|---------------|---------|------|------------|
| 0-500 | db.t4g.micro | 20 GB | 3000 | $15 |
| 500-2000 | db.t4g.small | 50 GB | 3000 | $30 |
| 2000-5000 | db.t4g.medium | 100 GB | 12000 | $75 |
| 5000-20000 | db.r6g.large | 200 GB | 12000 | $180 |
| 20000+ | Aurora Serverless v2 | Auto | Auto | Variable |

**When to migrate to Aurora:**
- Sustained load above 5000 concurrent users
- Need for read replicas across regions
- Require sub-second failover
- Budget allows for 2-3x RDS cost

### Cache Strategy

**Redis Sizing:**

| Sessions | Node Type | Replicas | Cost/Month |
|----------|-----------|----------|------------|
| 0-1000 | cache.t4g.micro | 1 | $24 |
| 1000-5000 | cache.t4g.small | 2 | $60 |
| 5000-20000 | cache.t4g.medium | 2 | $120 |
| 20000+ | cache.r6g.large | 3 | $400 |

## Cost Optimization

### Cost Breakdown (Typical Production Setup)

```
Monthly AWS Costs (2000 users, moderate usage):

Compute (ECS Fargate):
  - 2 tasks × 0.5 vCPU × 730 hours       = $36
  - 2 tasks × 1 GB RAM × 730 hours       = $8

Database (RDS):
  - db.t4g.small Multi-AZ                = $30
  - Storage 50 GB gp3                    = $6
  - Backup storage 50 GB                 = $5

Cache (ElastiCache):
  - cache.t4g.small × 2 nodes            = $60

Load Balancer:
  - ALB base cost                        = $20
  - LCU charges (estimated)              = $10

Networking:
  - Data transfer out (100 GB)           = $9
  - Inter-AZ data transfer               = $5

Other:
  - Route 53 hosted zone                 = $0.50
  - CloudWatch logs (5 GB)               = $2.50
  - Secrets Manager (4 secrets)          = $1.60

TOTAL:                                   ≈ $193/month
```

### Cost Saving Strategies

#### 1. Use Savings Plans

```bash
# Compute Savings Plan (1-year commitment)
# Save up to 17% on Fargate costs
# $30/month → $25/month
```

#### 2. Reserved Instances for RDS

```bash
# RDS Reserved Instance (1-year, no upfront)
# Save up to 38% on database costs
# $30/month → $19/month
```

#### 3. CloudFront for Static Assets

```bash
# Reduce data transfer costs by 50%
# Faster global performance
# Additional $5-10/month for CloudFront
# Save $15-20/month on data transfer
```

#### 4. S3 Intelligent Tiering

```bash
# Automatic cost optimization for backups
# Move infrequent backups to cheaper tiers
# Save 40-70% on backup storage
```

#### 5. Right-Size Resources

```bash
# Monitor actual usage in CloudWatch
# Scale down during off-peak hours
# Use scheduled scaling for predictable patterns
```

#### 6. Optimize Images

```bash
# Use multi-stage Docker builds (already implemented)
# Compress static assets
# Enable gzip/brotli compression in ALB
```

### Budget Alerts

```bash
aws budgets create-budget \
  --account-id ACCOUNT_ID \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

`budget.json`:

```json
{
  "BudgetName": "TimeTrack-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "250",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {
    "TagKeyValue": ["Application$timetrack"]
  }
}
```

`notifications.json`:

```json
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "devops@example.com"
      }
    ]
  }
]
```

## Disaster Recovery

### Backup Strategy

#### Automated RDS Backups

- **Frequency**: Daily automated backups
- **Retention**: 7 days (configurable up to 35 days)
- **Window**: 03:00-04:00 UTC (low traffic period)
- **Type**: Full snapshot + transaction logs

#### Manual Snapshots

```bash
# Create manual snapshot before major changes
aws rds create-db-snapshot \
  --db-instance-identifier timetrack-prod-db \
  --db-snapshot-identifier timetrack-manual-$(date +%Y%m%d-%H%M%S)
```

#### Application Data Export

Create daily export job:

```bash
# Create Lambda function for daily exports
aws lambda create-function \
  --function-name timetrack-daily-export \
  --runtime nodejs20.x \
  --handler index.handler \
  --zip-file fileb://export-function.zip \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-export-role
```

### Recovery Procedures

#### Database Recovery

**Scenario: Accidental data deletion**

```bash
# 1. Identify point in time before deletion
RESTORE_TIME="2024-01-15T10:30:00Z"

# 2. Create new instance from point-in-time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier timetrack-prod-db \
  --target-db-instance-identifier timetrack-restored-db \
  --restore-time $RESTORE_TIME

# 3. Verify data in restored instance
# 4. Export/import specific data
# 5. Delete restored instance when done
```

**Scenario: Database corruption**

```bash
# 1. Restore from latest snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier timetrack-prod-db-restored \
  --db-snapshot-identifier latest-snapshot

# 2. Update DNS to point to new instance
# 3. Monitor application logs
# 4. Delete old instance after verification
```

#### Application Recovery

**Scenario: Failed deployment**

```bash
# 1. ECS automatically rolls back on health check failures
# Circuit breaker configuration enables automatic rollback

# 2. Manual rollback if needed
aws ecs update-service \
  --cluster timetrack-cluster \
  --service timetrack-service \
  --task-definition timetrack:PREVIOUS_VERSION \
  --force-new-deployment

# 3. Verify service health
aws ecs describe-services \
  --cluster timetrack-cluster \
  --services timetrack-service
```

**Scenario: Complete region failure**

Multi-region disaster recovery:

```bash
# 1. Promote read replica in secondary region
aws rds promote-read-replica \
  --db-instance-identifier timetrack-prod-db-us-west-2

# 2. Update Route 53 health checks to fail over
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://failover-dns.json

# 3. Deploy application in secondary region
# (requires pre-configured infrastructure)
```

### RTO/RPO Targets

| Scenario | RTO (Recovery Time) | RPO (Data Loss) | Cost Impact |
|----------|---------------------|-----------------|-------------|
| Single task failure | 2-5 minutes | None | Low |
| Complete service failure | 10-15 minutes | None | Low |
| Database failure (Multi-AZ) | 1-2 minutes | None | Included |
| Region failure | 30-60 minutes | 5-15 minutes | High (multi-region) |
| Accidental deletion | 15-30 minutes | Minutes (PITR) | Low |

### Testing Disaster Recovery

**Quarterly DR drill checklist:**

```bash
# 1. Test database restore
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier timetrack-prod-db \
  --target-db-instance-identifier timetrack-dr-test \
  --restore-time $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 2. Verify data integrity
# Connect to restored database and run validation queries

# 3. Test application deployment rollback
# Deploy old version, verify functionality, roll back

# 4. Test failover to secondary region (if configured)
# Update DNS, verify application works, fail back

# 5. Document lessons learned
# Update runbooks based on findings
```

## Post-Deployment Checklist

After initial deployment:

- [ ] Verify SSL certificate is valid and auto-renews
- [ ] Test all authentication flows (local + OAuth)
- [ ] Verify Stripe payment processing
- [ ] Test workspace isolation with multiple tenants
- [ ] Check CloudWatch alarms are triggering correctly
- [ ] Verify auto-scaling policies work as expected
- [ ] Test database backups and restore
- [ ] Configure monitoring alerts to team channels (Slack/PagerDuty)
- [ ] Set up cost alerts and budgets
- [ ] Document any custom configuration
- [ ] Create incident response runbook
- [ ] Test disaster recovery procedures
- [ ] Enable AWS CloudTrail for audit logging
- [ ] Configure AWS Config for compliance
- [ ] Set up AWS Backup for automated backup management

## Troubleshooting

### Common Issues

#### ECS Tasks Failing to Start

```bash
# Check task logs
aws logs tail /ecs/timetrack --follow

# Check task stopped reason
aws ecs describe-tasks \
  --cluster timetrack-cluster \
  --tasks TASK_ARN \
  --query 'tasks[0].stoppedReason'
```

**Common causes:**
- Missing secrets in Secrets Manager
- Incorrect IAM permissions
- Health check failing
- Insufficient resources (CPU/memory)

#### Database Connection Issues

```bash
# Check security group rules
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx \
  --query 'SecurityGroups[0].IpPermissions'

# Test connection from ECS task
aws ecs execute-command \
  --cluster timetrack-cluster \
  --task TASK_ARN \
  --container timetrack \
  --interactive \
  --command "npm run db:test"
```

**Common causes:**
- Security group not allowing ECS → RDS traffic
- Incorrect DATABASE_URL format
- RDS instance not publicly accessible (but ECS not in VPC)
- SSL/TLS configuration mismatch

#### High Response Times

```bash
# Check ALB target response time
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/timetrack-alb/xxxxx \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300
```

**Common causes:**
- Database query performance (add indexes)
- Insufficient ECS task resources
- High database connections (increase connection pool)
- Missing Redis cache configuration

#### Out of Memory Errors

```bash
# Check memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=timetrack-service \
  --statistics Average,Maximum \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300
```

**Solutions:**
- Increase task memory allocation
- Check for memory leaks in application
- Optimize large data queries
- Implement pagination for large result sets

## Additional Resources

### AWS Documentation

- [ECS Fargate Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/intro.html)
- [RDS PostgreSQL Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Application Load Balancer Guide](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html)
- [Secrets Manager Best Practices](https://docs.aws.amazon.com/secretsmanager/latest/userguide/best-practices.html)

### Internal Documentation

- [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Technical architecture
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration
- [TESTING.md](./TESTING.md) - Testing strategy

### Cost Calculators

- [AWS Pricing Calculator](https://calculator.aws/)
- [Fargate Pricing Calculator](https://aws.amazon.com/fargate/pricing/)

### Support

For issues or questions:
1. Check CloudWatch logs: `/ecs/timetrack`
2. Review RDS events in AWS Console
3. Check ECS service events
4. Consult AWS Support (if enabled)

---

**Last Updated**: 2024-01-15
**Maintained By**: DevOps Team
**Review Cycle**: Quarterly
