# GK-Nexus Deployment Guide

## Overview

GK-Nexus can be deployed using Docker Compose for production environments. This guide covers the complete deployment process.

## Prerequisites

- Docker Engine 24.0+
- Docker Compose v2.0+
- Domain name with DNS configured
- SSL certificates (or use Let's Encrypt)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/kareemschultz/GK-Nexus.git
cd GK-Nexus

# Create production environment file
cp .env.example .env.production

# Edit environment variables
nano .env.production

# Deploy with Docker Compose
docker compose -f docker-compose.production.yml up -d
```

## Environment Variables

### Required Variables

```bash
# Database
POSTGRES_DB=gk_nexus_prod
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-random-password>

# Redis
REDIS_PASSWORD=<strong-random-password>

# Security
JWT_SECRET=<32-character-random-string>
ENCRYPTION_KEY=<32-character-random-string>
BETTER_AUTH_SECRET=<random-string>

# URLs
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
```

### Optional Variables

```bash
# Ports (defaults shown)
POSTGRES_PORT=5432
REDIS_PORT=6379
SERVER_PORT=3000
WEB_PORT=80

# Logging
LOG_LEVEL=info

# File uploads
FILE_UPLOAD_MAX_SIZE=10485760

# External services (when configured)
GRA_API_KEY=
EMAIL_SERVICE_API_KEY=
SMS_SERVICE_API_KEY=
```

## Production Architecture

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (Reverse   │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  Frontend   │ │   Backend   │ │   Static    │
    │  (Web App)  │ │   (API)     │ │   Assets    │
    └─────────────┘ └──────┬──────┘ └─────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐
    │  PostgreSQL │ │   Redis     │
    │  (Database) │ │   (Cache)   │
    └─────────────┘ └─────────────┘
```

## Docker Compose Services

### docker-compose.production.yml

The production compose file includes:

| Service | Image | Purpose |
|---------|-------|---------|
| `postgres` | postgres:16-alpine | Primary database |
| `redis` | redis:7-alpine | Session storage and caching |
| `server` | Custom build | API server (Hono + oRPC) |
| `web` | Custom build | Frontend (React + Nginx) |
| `nginx` | nginx:1.25-alpine | Reverse proxy with SSL |
| `backup` | postgres:16-alpine | Database backup service |

## Building Docker Images

### Build All Services

```bash
docker compose -f docker-compose.production.yml build
```

### Build Individual Services

```bash
# Backend server
docker build -t gk-nexus-server -f apps/server/Dockerfile .

# Frontend web app
docker build -t gk-nexus-web -f apps/web/Dockerfile .
```

## SSL/TLS Configuration

### Option 1: Pre-existing Certificates

Place certificates in the `ssl/` directory:

```
nginx/
├── ssl/
│   ├── cert.pem
│   └── key.pem
```

### Option 2: Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

## Database Management

### Initial Setup

```bash
# Run migrations
docker compose exec server bun run db:migrate

# Seed initial data
docker compose exec server bun run db:seed
```

### Backups

```bash
# Manual backup
docker compose -f docker-compose.production.yml --profile backup up backup

# Scheduled backups (add to crontab)
0 2 * * * cd /path/to/GK-Nexus && docker compose -f docker-compose.production.yml --profile backup up backup
```

### Restore from Backup

```bash
# Stop services
docker compose -f docker-compose.production.yml down

# Restore database
cat backups/gk_nexus_YYYYMMDD_HHMMSS.sql | docker compose exec -T postgres psql -U postgres -d gk_nexus_prod

# Restart services
docker compose -f docker-compose.production.yml up -d
```

## Monitoring

### Health Checks

All services include health checks:

```bash
# Check all service health
docker compose -f docker-compose.production.yml ps

# Check specific service
docker compose -f docker-compose.production.yml exec server curl -f http://localhost:3000/
```

### Logs

```bash
# All logs
docker compose -f docker-compose.production.yml logs -f

# Specific service
docker compose -f docker-compose.production.yml logs -f server

# Last 100 lines
docker compose -f docker-compose.production.yml logs --tail=100 server
```

## Scaling

### Horizontal Scaling

For high-traffic deployments, scale the server:

```bash
docker compose -f docker-compose.production.yml up -d --scale server=3
```

Note: Requires load balancer configuration in nginx.

## Updates and Maintenance

### Rolling Updates

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker compose -f docker-compose.production.yml build

# Rolling restart
docker compose -f docker-compose.production.yml up -d --no-deps server
docker compose -f docker-compose.production.yml up -d --no-deps web
```

### Database Migrations

```bash
# Generate migration
docker compose exec server bun run db:generate

# Apply migration
docker compose exec server bun run db:migrate
```

## Troubleshooting

### Common Issues

**Container won't start:**
```bash
# Check logs
docker compose -f docker-compose.production.yml logs server

# Check resource usage
docker stats
```

**Database connection failed:**
```bash
# Test connection
docker compose exec server bun run db:studio
```

**Permission denied errors:**
```bash
# Fix volume permissions
sudo chown -R 1001:1001 ./data
```

### Debug Mode

```bash
# Start with debug logging
LOG_LEVEL=debug docker compose -f docker-compose.production.yml up
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong random secrets for JWT and encryption keys
- [ ] Enable SSL/TLS with valid certificates
- [ ] Configure firewall to only expose ports 80 and 443
- [ ] Set up regular backups
- [ ] Enable log rotation
- [ ] Configure rate limiting in nginx
- [ ] Review and restrict CORS origins

## Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations applied
- [ ] Initial admin user created
- [ ] Backup schedule configured
- [ ] Monitoring/alerting set up
- [ ] DNS records configured
- [ ] Load balancer configured (if scaling)

---

**GK-Nexus Suite** - Created by **Kareem Schultz** at [Karetech Solutions](https://karetech.gy)
