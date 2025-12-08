# Multi-stage production Dockerfile for GK-Nexus Backend Server
# ================================================================

# Stage 1: Base image with Bun runtime
FROM oven/bun:1.2.18-alpine AS base
WORKDIR /app

# Install security updates and essential tools
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates && \
    rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 -G nodejs

# Stage 2: Dependencies installation
FROM base AS deps
WORKDIR /app

# Copy package files for dependency resolution
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/*/package.json ./packages/*/

# Install dependencies with production optimizations
RUN bun install --frozen-lockfile --production

# Stage 3: Builder stage
FROM base AS builder
WORKDIR /app

# Copy all source code and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the server application
RUN cd apps/server && bun run build

# Stage 4: Production runner
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy built application and dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/server/dist ./apps/server/dist
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./

# Create directories for logs and temp files
RUN mkdir -p /app/logs /tmp/uploads && \
    chown -R nextjs:nodejs /app/logs /tmp/uploads

# Switch to non-root user
USER nextjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "apps/server/dist/index.js"]

# Labels for metadata
LABEL maintainer="GK-Nexus Team"
LABEL version="1.0.0"
LABEL description="GK-Nexus Backend Server - Tax Consultancy Management System"
LABEL org.opencontainers.image.source="https://github.com/kareem-GK-Nexus/GK-Nexus"