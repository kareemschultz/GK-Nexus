# GK-Nexus Production Dockerfile
# Multi-stage build for optimized production image

# ============================================
# Stage 1: Base - Install dependencies
# ============================================
FROM oven/bun:1.2-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# ============================================
# Stage 2: Dependencies - Install node modules
# ============================================
FROM base AS deps

# Copy package files
COPY package.json bun.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/ 2>/dev/null || true

# Install dependencies
RUN bun install --frozen-lockfile

# ============================================
# Stage 3: Builder - Build the application
# ============================================
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules 2>/dev/null || true
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules 2>/dev/null || true

# Copy source code
COPY . .

# Build the applications
RUN bun run build

# ============================================
# Stage 4: Production Server
# ============================================
FROM base AS production
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 gknexus

# Copy built application
COPY --from=builder --chown=gknexus:nodejs /app/apps/server/dist ./apps/server/dist
COPY --from=builder --chown=gknexus:nodejs /app/apps/web/dist ./apps/web/dist
COPY --from=builder --chown=gknexus:nodejs /app/packages ./packages
COPY --from=builder --chown=gknexus:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=gknexus:nodejs /app/package.json ./

# Switch to non-root user
USER gknexus

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server
CMD ["bun", "run", "apps/server/dist/index.js"]
