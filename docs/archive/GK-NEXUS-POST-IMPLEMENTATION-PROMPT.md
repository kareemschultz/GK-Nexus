# GK-NEXUS POST-IMPLEMENTATION PROMPT
## Documentation, Cleanup, and Production Docker Setup

**Use this prompt AFTER completing all implementation fixes from GK-NEXUS-IMPLEMENTATION-PROMPT.md**

---

## CONTEXT

Most audit findings have been fixed. Current status from implementation:

### ✅ Completed Phases
- **PHASE 1:** Security fixes (272 permission checks, password fixes, cookie security)
- **PHASE 2:** Database schema (businesses, userBusinesses, clientBusinesses, invoiceLineItems)
- **PHASE 3:** Seed data (KAJ, GCMC businesses seeded)
- **PHASE 5:** Mock data removed (tax.ts, analytics-reporting.ts)
- **PHASE 6:** CI/CD fixes (lint enabled, tests required)
- **PHASE 7:** Console.log removed from production code

### ❌ Pending
- **PHASE 8:** Frontend/UI fixes - Web frontend has type errors due to old API patterns

### The Problem
The web frontend uses **old nested API router pattern**:
```typescript
// OLD pattern (broken)
api.documents.list()
api.tax.filings()
api.clients.get()
```

But the API now uses **flat procedure naming**:
```typescript
// NEW pattern (correct)
documentList()
taxFilingsList()
clientGet()
```

---

## PHASE 0: FIX FRONTEND API PATTERNS (Do First - 2-3 hours)

**This phase MUST be completed before testing can proceed.**

### 0.1 Understand the API Changes

The oRPC router was refactored from nested to flat exports. Here's the mapping:

| Old Pattern | New Pattern |
|-------------|-------------|
| `api.clients.list` | `clientList` |
| `api.clients.get` | `clientGet` |
| `api.clients.create` | `clientCreate` |
| `api.clients.update` | `clientUpdate` |
| `api.clients.delete` | `clientDelete` |
| `api.documents.list` | `documentList` |
| `api.documents.upload` | `documentUpload` |
| `api.documents.requirements` | `documentRequirements` |
| `api.invoices.list` | `invoiceList` |
| `api.invoices.create` | `invoiceCreate` |
| `api.invoices.get` | `invoiceGet` |
| `api.tax.filings` | `taxFilingsList` |
| `api.tax.calculate` | `taxCalculate` |
| `api.services.list` | `serviceList` |
| `api.users.list` | `userList` |
| `api.reports.generate` | `reportGenerate` |

### 0.2 Find All Affected Files

```bash
# Find all files using old API pattern
grep -rn "api\.\w\+\.\w\+" apps/web/src --include="*.tsx" --include="*.ts" | head -50

# Count occurrences per file
grep -rn "api\.\w\+\.\w\+" apps/web/src --include="*.tsx" --include="*.ts" | cut -d: -f1 | sort | uniq -c | sort -rn
```

**Expected affected files:**
```
apps/web/src/routes/documents/requirements.tsx
apps/web/src/routes/documents/index.tsx
apps/web/src/routes/clients/index.tsx
apps/web/src/routes/clients/$clientId.tsx
apps/web/src/routes/invoices/index.tsx
apps/web/src/routes/invoices/new.tsx
apps/web/src/routes/tax/calculator.tsx
apps/web/src/routes/tax/filings.tsx
apps/web/src/routes/services/index.tsx
apps/web/src/routes/reports/index.tsx
apps/web/src/routes/dashboard/index.tsx
apps/web/src/components/*.tsx
apps/web/src/hooks/*.ts
```

### 0.3 Update oRPC Client Configuration

**File:** `apps/web/src/utils/orpc.ts` (or similar)

Check and update the oRPC client to use the new flat structure:

```typescript
// Check current client setup
import { createORPCClient } from '@orpc/client';
import { createORPCReact } from '@orpc/react';
import type { AppRouter } from '@gk-nexus/api';

// The client should expose flat procedures
export const orpc = createORPCReact<AppRouter>();

// Usage should be:
// orpc.clientList.useQuery()
// orpc.clientCreate.useMutation()
```

### 0.4 Create Migration Script

**File:** `scripts/migrate-api-patterns.sh`

```bash
#!/bin/bash
# Migrate old API patterns to new flat patterns

echo "Migrating API patterns in web frontend..."

# Clients
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/api\.clients\.list/clientList/g' \
  -e 's/api\.clients\.get/clientGet/g' \
  -e 's/api\.clients\.create/clientCreate/g' \
  -e 's/api\.clients\.update/clientUpdate/g' \
  -e 's/api\.clients\.delete/clientDelete/g' \
  -e 's/api\.clients\.search/clientSearch/g' \
  {} \;

# Documents
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/api\.documents\.list/documentList/g' \
  -e 's/api\.documents\.get/documentGet/g' \
  -e 's/api\.documents\.upload/documentUpload/g' \
  -e 's/api\.documents\.delete/documentDelete/g' \
  -e 's/api\.documents\.requirements/documentRequirements/g' \
  {} \;

# Invoices
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/api\.invoices\.list/invoiceList/g' \
  -e 's/api\.invoices\.get/invoiceGet/g' \
  -e 's/api\.invoices\.create/invoiceCreate/g' \
  -e 's/api\.invoices\.update/invoiceUpdate/g' \
  -e 's/api\.invoices\.delete/invoiceDelete/g' \
  -e 's/api\.invoices\.send/invoiceSend/g' \
  {} \;

# Tax
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/api\.tax\.filings/taxFilingsList/g' \
  -e 's/api\.tax\.calculate/taxCalculate/g' \
  -e 's/api\.tax\.calculatePaye/taxCalculatePaye/g' \
  -e 's/api\.tax\.calculateVat/taxCalculateVat/g' \
  -e 's/api\.tax\.calculateNis/taxCalculateNis/g' \
  {} \;

# Services
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/api\.services\.list/serviceList/g' \
  -e 's/api\.services\.get/serviceGet/g' \
  -e 's/api\.services\.create/serviceCreate/g' \
  {} \;

# Users
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/api\.users\.list/userList/g' \
  -e 's/api\.users\.get/userGet/g' \
  -e 's/api\.users\.create/userCreate/g' \
  -e 's/api\.users\.update/userUpdate/g' \
  {} \;

# Reports
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/api\.reports\.generate/reportGenerate/g' \
  -e 's/api\.reports\.list/reportList/g' \
  {} \;

# Audit
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/api\.audit\.list/auditList/g' \
  -e 's/api\.audit\.events/auditEvents/g' \
  {} \;

# Businesses
find apps/web/src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
  -e 's/api\.businesses\.list/businessList/g' \
  -e 's/api\.businesses\.get/businessGet/g' \
  {} \;

echo "Migration complete. Running type check..."
bun run check-types --filter=web 2>&1 | head -50
```

### 0.5 Manual Fixes for Complex Patterns

Some patterns may need manual fixing:

**TanStack Query Hooks:**

```typescript
// BEFORE
const { data: clients } = api.clients.list.useQuery({ businessId });

// AFTER
const { data: clients } = orpc.clientList.useQuery({ businessId });
```

**Mutations:**

```typescript
// BEFORE
const createClient = api.clients.create.useMutation({
  onSuccess: () => refetch(),
});

// AFTER  
const createClient = orpc.clientCreate.useMutation({
  onSuccess: () => refetch(),
});
```

**Invalidation:**

```typescript
// BEFORE
queryClient.invalidateQueries({ queryKey: ['api', 'clients', 'list'] });

// AFTER
queryClient.invalidateQueries({ queryKey: ['clientList'] });
```

### 0.6 Fix Specific File Errors

Based on the error output, fix these specific files:

**File:** `apps/web/src/routes/documents/requirements.tsx` (line 163)

```typescript
// Find and fix the error at line 163
// Likely pattern: api.documents.requirements -> documentRequirements
```

**Common fixes needed:**

```typescript
// Import the orpc client
import { orpc } from '@/utils/orpc';

// Replace nested calls with flat calls
// api.clients.list.useQuery() -> orpc.clientList.useQuery()
// api.documents.requirements.useQuery() -> orpc.documentRequirements.useQuery()
```

### 0.7 Verify All Type Errors Fixed

```bash
# Run type check on web
bun run check-types --filter=web

# Should show: 0 errors

# If still errors, find remaining issues:
bun run check-types --filter=web 2>&1 | grep "error TS" | head -20
```

### 0.8 Build Web Package

```bash
# Build web frontend
bun run build --filter=web

# Should complete successfully
```

### 0.9 Quick Smoke Test

```bash
# Start dev server
bun run dev

# In browser, verify:
# 1. Login page loads
# 2. Dashboard loads after login
# 3. Clients page shows data (or empty state)
# 4. No console errors in browser DevTools
```

### 0.10 Commit Frontend Fixes

```bash
git add apps/web/
git commit -m "fix(web): migrate to flat oRPC procedure naming

- Update all API calls from nested (api.x.y) to flat (xY) pattern
- Fix TanStack Query hook usage
- Fix query invalidation keys
- Resolves PHASE 8 frontend type errors"
```

---

## PHASE 1: CLEANUP OBSOLETE FILES (Do First - 30 min)

### 1.1 Files to Delete

Search and remove these patterns:

```bash
# Backup files
find . -name "*.bak" -type f -delete
find . -name "*.backup" -type f -delete
find . -name "*.old" -type f -delete
find . -name "*-copy.*" -type f -delete
find . -name "*.orig" -type f -delete

# OS generated files
find . -name ".DS_Store" -type f -delete
find . -name "Thumbs.db" -type f -delete

# Editor files
find . -name "*.swp" -type f -delete
find . -name "*~" -type f -delete

# Log files in repo
find . -name "*.log" -type f -not -path "./node_modules/*" -delete
```

### 1.2 Check for Orphaned Files

```bash
# Files not imported anywhere (review before deleting)
# Check apps/web/src/components/ for unused components
# Check packages/api/src/routers/ for unused routers
```

### 1.3 Review and Clean Hidden Folders

| Folder | Action |
|--------|--------|
| `.claude/` | Keep if valid, remove old context |
| `.gemini/` | Keep if valid, remove old context |
| `.vscode/` | Keep but remove hardcoded paths |
| `.idea/` | Delete (JetBrains local settings) |
| `.turbo/` | Delete (rebuild on CI) |

### 1.4 Update .gitignore

Ensure these are ignored:

```gitignore
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
.next/
.turbo/
*.tsbuildinfo

# Environment (NEVER commit)
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
*.swp
*.swo
*~

# Test coverage
coverage/

# Docker volumes (local)
postgres_data/
redis_data/

# Temporary
tmp/
temp/
*.bak
*.backup
```

---

## PHASE 2: CREATE PRODUCTION DOCKER SETUP (2 hours)

### 2.1 Create Optimized Multi-Stage Dockerfile

**File:** `Dockerfile` (root)

```dockerfile
# ============================================
# GK-NEXUS Production Dockerfile
# Following linuxserver.io best practices
# ============================================

# ---- Base Stage ----
FROM oven/bun:1-alpine AS base
LABEL maintainer="GK-Nexus Team"
LABEL org.opencontainers.image.title="GK-Nexus"
LABEL org.opencontainers.image.description="Unified Business Management Platform"
LABEL org.opencontainers.image.version="1.0.0"

# ---- Dependencies Stage ----
FROM base AS deps
WORKDIR /app

# Copy package files first (better layer caching)
COPY package.json bun.lockb ./
COPY apps/web/package.json ./apps/web/
COPY apps/server/package.json ./apps/server/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/database/package.json ./packages/database/
COPY packages/ui/package.json ./packages/ui/ 2>/dev/null || true

# Install ALL dependencies (needed for build)
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# ---- Build Stage ----
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules 2>/dev/null || true
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/*/node_modules ./packages/ 2>/dev/null || true

# Copy source code
COPY . .

# Build all packages
ENV NODE_ENV=production
RUN bun run build

# ---- Production Dependencies Stage ----
FROM base AS prod-deps
WORKDIR /app

COPY package.json bun.lockb ./
COPY apps/server/package.json ./apps/server/

# Install ONLY production dependencies
RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production

# ---- Final Production Image ----
FROM oven/bun:1-alpine AS production

# Security: Create non-root user
RUN addgroup -g 1000 gknexus && \
    adduser -u 1000 -G gknexus -h /app -D gknexus

WORKDIR /app

# Copy production dependencies
COPY --from=prod-deps --chown=gknexus:gknexus /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=gknexus:gknexus /app/apps/server/dist ./apps/server/dist
COPY --from=builder --chown=gknexus:gknexus /app/apps/web/dist ./apps/web/dist
COPY --from=builder --chown=gknexus:gknexus /app/packages/*/dist ./packages/

# Copy necessary config files
COPY --chown=gknexus:gknexus package.json ./

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Switch to non-root user
USER gknexus

# Start command
CMD ["bun", "run", "start"]
```

### 2.2 Create Production Docker Compose

**File:** `docker-compose.yml` (root - simple for users)

```yaml
# ============================================
# GK-NEXUS Docker Compose
# Simple, production-ready deployment
# ============================================

version: "3.9"

services:
  # ---- Application ----
  gk-nexus:
    image: gk-nexus:latest
    build:
      context: .
      dockerfile: Dockerfile
    container_name: gk-nexus
    restart: unless-stopped
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://gknexus:${DB_PASSWORD}@postgres:5432/gknexus
      - BETTER_AUTH_SECRET=${AUTH_SECRET}
      - BETTER_AUTH_URL=${APP_URL:-http://localhost:3000}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - gk-internal
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ---- Database ----
  postgres:
    image: postgres:16-alpine
    container_name: gk-nexus-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: gknexus
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: gknexus
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - gk-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U gknexus -d gknexus"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

networks:
  gk-internal:
    driver: bridge
    internal: false  # Set to true if you use a reverse proxy

volumes:
  postgres_data:
    driver: local
```

### 2.3 Create Environment Template

**File:** `.env.example` (update existing)

```bash
# ============================================
# GK-NEXUS Environment Configuration
# Copy to .env and fill in values
# ============================================

# ---- Application ----
NODE_ENV=production
PORT=3000
APP_URL=http://localhost:3000

# ---- Database ----
# For Docker Compose, use the service name
DATABASE_URL=postgresql://gknexus:CHANGE_ME@postgres:5432/gknexus
# For standalone PostgreSQL
# DATABASE_URL=postgresql://user:password@host:5432/gknexus

# ---- Database Password (used by Docker Compose) ----
DB_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# ---- Authentication ----
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=CHANGE_ME_GENERATE_SECURE_SECRET
BETTER_AUTH_URL=${APP_URL}

# ---- Super Admin (for initial seeding) ----
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=CHANGE_ME_SECURE_PASSWORD

# ---- Optional: Email (Resend) ----
# RESEND_API_KEY=re_xxxxx

# ---- Optional: File Storage ----
# STORAGE_TYPE=local
# STORAGE_PATH=/app/data/uploads
```

### 2.4 Create .dockerignore

**File:** `.dockerignore`

```dockerignore
# Git
.git
.gitignore

# Documentation
*.md
!README.md
docs/

# Development
.env
.env.*
!.env.example
.vscode/
.idea/

# Dependencies (will be installed in container)
node_modules/
.pnpm-store/

# Build artifacts (will be built in container)
dist/
.turbo/
*.tsbuildinfo

# Tests
tests/
coverage/
*.spec.ts
*.test.ts

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore

# CI/CD
.github/

# Misc
*.log
*.bak
.DS_Store
Thumbs.db
```

### 2.5 Create Quick Start Script

**File:** `scripts/start.sh`

```bash
#!/bin/bash
# ============================================
# GK-NEXUS Quick Start Script
# ============================================

set -e

echo "🚀 Starting GK-NEXUS..."

# Check for .env file
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env with your configuration before continuing."
    echo "   Required: DB_PASSWORD, BETTER_AUTH_SECRET"
    exit 1
fi

# Check required env vars
source .env
if [ "$DB_PASSWORD" = "CHANGE_ME_SECURE_PASSWORD" ]; then
    echo "❌ Please change DB_PASSWORD in .env"
    exit 1
fi

if [ "$BETTER_AUTH_SECRET" = "CHANGE_ME_GENERATE_SECURE_SECRET" ]; then
    echo "❌ Please change BETTER_AUTH_SECRET in .env"
    echo "   Generate with: openssl rand -base64 32"
    exit 1
fi

# Start containers
echo "📦 Starting containers..."
docker compose up -d

# Wait for database
echo "⏳ Waiting for database..."
sleep 5

# Run migrations
echo "🔄 Running database migrations..."
docker compose exec gk-nexus bun run db:migrate

# Seed if needed
if [ "$1" = "--seed" ]; then
    echo "🌱 Seeding database..."
    docker compose exec gk-nexus bun run db:seed
fi

echo ""
echo "✅ GK-NEXUS is running!"
echo "   📍 URL: ${APP_URL:-http://localhost:3000}"
echo ""
echo "📋 Useful commands:"
echo "   View logs:     docker compose logs -f"
echo "   Stop:          docker compose down"
echo "   Restart:       docker compose restart"
echo "   Shell access:  docker compose exec gk-nexus sh"
```

Make executable:
```bash
chmod +x scripts/start.sh
```

---

## PHASE 3: UPDATE ALL DOCUMENTATION (3 hours)

### 3.1 Create Comprehensive README.md

**File:** `README.md`

```markdown
<div align="center">

# 🏢 GK-Nexus

### Unified Business Management Platform for Professional Services

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0-black.svg)](https://bun.sh/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**A comprehensive enterprise platform for managing tax services, business consulting, immigration, and professional services — built specifically for Guyana's regulatory environment.**

[Features](#-features) • [Quick Start](#-quick-start) • [Development](#-development) • [Documentation](#-documentation) • [Roadmap](#-roadmap)

---

![GK-Nexus Dashboard](docs/images/dashboard-preview.png)

</div>

---

## 📋 Table of Contents

- [About the Platform](#-about-the-platform)
- [Business Units](#-business-units)
- [Key Features](#-key-features)
- [Platform Capabilities](#-platform-capabilities)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Development Setup](#-development-setup)
- [Production Deployment](#-production-deployment)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [API Documentation](#-api-documentation)
- [Business Logic](#-business-logic)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

---

## 🎯 About the Platform

### What is GK-Nexus?

GK-Nexus is an **enterprise-grade unified business management platform** designed for professional services firms operating in Guyana. It provides a single, integrated solution for managing multiple business units, shared clients, cross-business workflows, and unified financial operations.

### The Problem We Solve

Professional services firms often struggle with:

- ❌ **Siloed Systems** - Different software for each business unit
- ❌ **Duplicate Data Entry** - Same client info entered multiple times
- ❌ **Fragmented Invoicing** - Separate invoices for related services
- ❌ **Compliance Complexity** - Manual tax calculations prone to errors
- ❌ **Poor Visibility** - No unified view of client relationships

### Our Solution

GK-Nexus provides:

- ✅ **Unified Platform** - One system for all business units
- ✅ **Shared Client Database** - Single source of truth
- ✅ **Cross-Business Invoicing** - One invoice, multiple services
- ✅ **Automated Compliance** - GRA 2025 tax rates built-in
- ✅ **360° Client View** - Complete relationship visibility

### Who Is This For?

- 🏢 **Professional Services Firms** - Accounting, consulting, legal
- 🏦 **Tax Practices** - Licensed accountants in Guyana
- 📋 **Business Consultancies** - Training, incorporation, advisory
- ⚖️ **Paralegal Services** - Document preparation, immigration
- 🌐 **Multi-Service Organizations** - Firms offering diverse services

---

## 🏢 Business Units

GK-Nexus is pre-configured for two integrated business units, with easy expansion to additional units:

### 🏦 KAJ Financial Services

**GRA Licensed Accountant Practice**

A full-service tax and accounting practice providing:

| Category | Services |
|----------|----------|
| **📊 Tax Filing** | Income Tax Returns, PAYE Returns, Corporation Tax |
| **📜 Compliance Certificates** | Tender Compliance, Work Permit Tax, Land Transfer, Firearm Liability, Pension, Certificate of Assessment |
| **📈 Financial Statements** | Income/Expenditure, Bank Verification, Cash Flow, Loan Applications, Investment Reports, Police Commissioner Statements |
| **🔍 Audits** | NGO Audits, Co-operative Society Audits |
| **🏛️ NIS Services** | Registration, Contribution Schedules, Compliance Certificates, Pension Queries |

### 🌙 GCMC (Green Crescent Management Consultancy)

**Business Consulting & Professional Services**

A comprehensive business services consultancy providing:

| Category | Services |
|----------|----------|
| **🎓 Training** | HR Management, Customer Relations, Co-operatives & Credit Unions, Organisational Management |
| **🏗️ Business Development** | Company Incorporation, Business Registration, Business Name Registration |
| **⚖️ Paralegal** | Affidavits, Sales & Purchase Agreements, Wills, Settlement Agreements, Separation Agreements, Investment & Partnership Agreements |
| **🌍 Immigration** | Work Permit Applications, Citizenship Applications, Business Visas, Residency Applications |
| **📝 Business Proposals** | Land Occupation, Investment Proposals, Start-up Business Plans |
| **🤝 Networking/Referrals** | Real Estate Agencies, IT Services, Law Firms |

### ➕ Adding New Business Units

GK-Nexus is designed for **zero-code expansion**. Adding a new business unit requires only:

1. Database insert for the new business
2. Configure services and pricing
3. Assign employees

No code changes required!

---

## ✨ Key Features

### Core Platform Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🔐 **Authentication & Security** | Email/password auth, session management, role-based access | ✅ |
| 👥 **Multi-Business Architecture** | Unified platform with business unit separation | ✅ |
| 🔄 **Shared Clients** | Single client record across all business units | ✅ |
| 📄 **Cross-Business Invoicing** | One invoice with line items from multiple businesses | ✅ |
| 📋 **Service Catalog** | 41+ pre-configured services with pricing | ✅ |
| 💰 **Tax Calculations** | PAYE, VAT, NIS with GRA 2025 rates | ✅ |
| 📁 **Document Management** | Upload, categorize, expiry tracking | ✅ |
| 📊 **Reporting & Analytics** | Revenue, clients, per-business breakdown | ✅ |
| 🔔 **Notifications** | Email alerts for deadlines and updates | ✅ |
| 📝 **Audit Trail** | Complete action logging for compliance | ✅ |
| 👔 **Employee Management** | Multi-business assignment, role-based permissions | ✅ |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile | ✅ |

### Business-Specific Features

<details>
<summary><b>🏦 KAJ Financial Services Features</b></summary>

#### Tax Services
- **Income Tax Calculator** - Progressive rates with 2025 thresholds
- **PAYE Calculator** - Monthly/weekly calculations with NIS deductions
- **VAT Calculator** - 14% standard rate with zero-rated item support
- **Corporate Tax** - 27% rate with allowable deductions

#### Compliance Services
- **Certificate Generation** - PDF certificates with QR verification
- **Deadline Tracking** - Tax filing deadline reminders
- **Document Checklists** - Required documents per service type

#### NIS Services
- **Contribution Calculator** - Employee (5.6%) & Employer (8.4%) rates
- **Ceiling Enforcement** - GYD 280,000/month maximum
- **Schedule Generation** - Monthly contribution schedules

</details>

<details>
<summary><b>🌙 GCMC Features</b></summary>

#### Immigration Services
- **Work Permit Tracking** - Application status, document requirements
- **Cross-Business Integration** - Links to KAJ for tax compliance documents
- **Deadline Management** - Visa/permit expiry alerts

#### Training Services
- **Course Management** - Training programs and schedules
- **Attendance Tracking** - Participant management
- **Certificate Generation** - Training completion certificates

#### Paralegal Services
- **Document Templates** - Standard legal document formats
- **Client Intake** - Structured information collection
- **Status Tracking** - Document preparation progress

</details>

---

## 🔧 Platform Capabilities

### 1. Shared Client Management

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT: ABC Company Ltd                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  KAJ Services                    GCMC Services              │
│  ├── Income Tax Return           ├── Company Incorporation  │
│  ├── PAYE Registration           ├── Work Permit (CEO)      │
│  ├── NIS Employer Setup          └── HR Training Program    │
│  └── Tax Compliance Cert                                    │
│                                                             │
│  📄 Unified Invoice: $175,000 GYD                          │
│  ├── KAJ: Tax Return Filing      $50,000                   │
│  ├── KAJ: NIS Registration       $15,000                   │
│  ├── GCMC: Incorporation         $85,000                   │
│  └── GCMC: Work Permit           $25,000                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Cross-Business Workflows

**Example: New Business Setup**

| Step | Business | Service | Status |
|------|----------|---------|--------|
| 1 | GCMC | Company Incorporation | ✅ Complete |
| 2 | GCMC | Business Name Registration | ✅ Complete |
| 3 | KAJ | TIN Registration | 🔄 In Progress |
| 4 | KAJ | VAT Registration | ⏳ Pending |
| 5 | KAJ | NIS Employer Registration | ⏳ Pending |
| 6 | GCMC | Work Permit (Director) | ⏳ Pending |
| 7 | KAJ | Work Permit Tax Compliance | ⏳ Pending |

### 3. Role-Based Access Control

| Role | KAJ Access | GCMC Access | Admin Functions |
|------|------------|-------------|-----------------|
| **Owner** | Full | Full | All settings, users, billing |
| **Admin** | Full (if assigned) | Full (if assigned) | User management, reports |
| **Manager** | Full (if assigned) | Full (if assigned) | Team oversight, approvals |
| **Accountant** | Full | Read-only | Financial reports |
| **Client Service** | Assigned clients | Assigned clients | Case updates |
| **Read Only** | View only | View only | None |

### 4. Guyana Tax Compliance (2025)

| Tax Type | Rate | Threshold | Implementation |
|----------|------|-----------|----------------|
| **PAYE Band 1** | 0% | $0 - $130,000/month | ✅ Auto-calculated |
| **PAYE Band 2** | 25% | $130,001 - $260,000/month | ✅ Auto-calculated |
| **PAYE Band 3** | 35% | Over $260,000/month | ✅ Auto-calculated |
| **NIS Employee** | 5.6% | Up to $280,000 ceiling | ✅ Auto-calculated |
| **NIS Employer** | 8.4% | Up to $280,000 ceiling | ✅ Auto-calculated |
| **VAT** | 14% | Standard rate | ✅ Auto-calculated |
| **Corporate Tax** | 27% | Standard rate | ✅ Auto-calculated |

---

## 📸 Screenshots

<details>
<summary><b>View Screenshots</b></summary>

### Dashboard
![Dashboard](docs/images/dashboard.png)
*Unified dashboard with KAJ and GCMC metrics*

### Client Management
![Clients](docs/images/clients.png)
*Shared client database with multi-business view*

### Invoice Creation
![Invoice](docs/images/invoice.png)
*Cross-business invoice with line items from both units*

### Tax Calculator
![Tax](docs/images/tax-calculator.png)
*PAYE calculator with 2025 GRA rates*

### Service Catalog
![Services](docs/images/services.png)
*Complete service catalog with pricing*

</details>

---

## 🚀 Quick Start

### Option 1: Docker (Recommended for Production)

```bash
# Clone the repository
git clone https://github.com/your-org/gk-nexus.git
cd gk-nexus

# Copy and configure environment
cp .env.example .env
nano .env  # Set DB_PASSWORD, BETTER_AUTH_SECRET

# Start everything with one command
./scripts/start.sh

# (Optional) Seed demo data
./scripts/start.sh --seed
```

🎉 **Done!** Access at [http://localhost:3000](http://localhost:3000)

### Option 2: Development Mode (For Testing & Development)

See [Development Setup](#-development-setup) below.

---

## 💻 Development Setup

### Prerequisites

| Requirement | Version | Installation |
|-------------|---------|--------------|
| **Bun** | 1.0+ | `curl -fsSL https://bun.sh/install \| bash` |
| **PostgreSQL** | 15+ | `brew install postgresql` or Docker |
| **Git** | 2.0+ | `brew install git` |
| **Node.js** | 20+ | Optional, for some tooling |

### Step-by-Step Setup

#### 1. Clone Repository

```bash
git clone https://github.com/your-org/gk-nexus.git
cd gk-nexus
```

#### 2. Install Dependencies

```bash
# Install all dependencies (monorepo)
bun install
```

#### 3. Set Up Database

**Option A: Using Docker (Easiest)**
```bash
# Start only PostgreSQL
docker compose up postgres -d

# Verify it's running
docker compose ps
```

**Option B: Local PostgreSQL**
```bash
# Create database
createdb gknexus

# Or with psql
psql -c "CREATE DATABASE gknexus;"
```

#### 4. Configure Environment

```bash
# Copy template
cp .env.example .env.local

# Edit with your settings
nano .env.local
```

**Minimum required for development:**
```bash
# .env.local
NODE_ENV=development
PORT=3000

# Database (Docker)
DATABASE_URL=postgresql://gknexus:devpassword@localhost:5432/gknexus

# Auth (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-dev-secret-at-least-32-characters
BETTER_AUTH_URL=http://localhost:3000

# Super Admin (for seeding)
SUPER_ADMIN_EMAIL=admin@localhost.dev
SUPER_ADMIN_PASSWORD=Admin123!@#
```

#### 5. Initialize Database

```bash
# Generate migrations (if schema changed)
bun run db:generate

# Apply migrations
bun run db:migrate

# Seed with demo data
bun run db:seed
```

#### 6. Start Development Server

```bash
# Start all services (frontend + backend)
bun run dev
```

This starts:
- 🌐 **Frontend** at `http://localhost:3001`
- 🔌 **API Server** at `http://localhost:3000`
- 🔥 **Hot Reload** enabled for both

#### 7. Verify Setup

```bash
# Check API health
curl http://localhost:3000/health

# Open in browser
open http://localhost:3001
```

### Development Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all services in development mode |
| `bun run dev:web` | Start only frontend |
| `bun run dev:server` | Start only API server |
| `bun run build` | Build all packages for production |
| `bun run test` | Run all tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run lint` | Run linter (Biome) |
| `bun run lint:fix` | Fix linting issues |
| `bun run check-types` | TypeScript type checking |
| `bun run db:generate` | Generate new migrations |
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:studio` | Open Drizzle Studio (database GUI) |
| `bun run db:seed` | Seed database with demo data |
| `bun run db:reset` | Reset database (drop + migrate + seed) |
| `bun run clean` | Clean all build artifacts |

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make changes and test
bun run dev
bun run test

# 3. Check types and lint
bun run check-types
bun run lint

# 4. Commit with conventional commits
git commit -m "feat(invoices): add cross-business support"

# 5. Push and create PR
git push origin feature/your-feature
```

### Database Management

```bash
# Open visual database browser
bun run db:studio
# Opens at http://localhost:4983

# Create a new migration after schema changes
bun run db:generate

# Apply migrations
bun run db:migrate

# Reset everything (careful in dev only!)
bun run db:reset
```

### Debugging

```bash
# Run with debug logging
DEBUG=* bun run dev

# Check database connection
bun run db:studio

# View API logs
bun run dev:server 2>&1 | tee server.log
```

### Testing

```bash
# Run all tests
bun run test

# Run specific test file
bun test tests/auth/authentication.spec.ts

# Run with coverage
bun run test:coverage

# Run E2E tests (requires running server)
bun run test:e2e
```

---

## 🚢 Production Deployment

### Using Docker Compose (Recommended)

#### 1. Prepare Environment

```bash
# Copy production template
cp .env.example .env

# Generate secure secrets
echo "BETTER_AUTH_SECRET=$(openssl rand -base64 32)" >> .env
echo "DB_PASSWORD=$(openssl rand -base64 16)" >> .env

# Edit remaining settings
nano .env
```

#### 2. Deploy

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f

# Check health
curl http://localhost:3000/health
```

#### 3. Initialize Database

```bash
# Run migrations
docker compose exec gk-nexus bun run db:migrate

# (Optional) Seed initial data
docker compose exec gk-nexus bun run db:seed
```

### Using the Quick Start Script

```bash
# Make executable
chmod +x scripts/start.sh

# Run (will guide you through setup)
./scripts/start.sh

# With seeding
./scripts/start.sh --seed
```

### Manual Production Build

```bash
# Build all packages
bun run build

# Start production server
NODE_ENV=production bun run start
```

### Environment Variables (Production)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Must be `production` | ✅ |
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `BETTER_AUTH_SECRET` | 32+ character secret | ✅ |
| `BETTER_AUTH_URL` | Public URL (https://...) | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |
| `RESEND_API_KEY` | For email notifications | ❌ |

### SSL/TLS with Reverse Proxy

<details>
<summary><b>Nginx Configuration</b></summary>

```nginx
server {
    listen 80;
    server_name gk-nexus.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gk-nexus.example.com;

    ssl_certificate /etc/letsencrypt/live/gk-nexus.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gk-nexus.example.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

</details>

<details>
<summary><b>Caddy Configuration</b></summary>

```caddyfile
gk-nexus.example.com {
    reverse_proxy localhost:3000
}
```

</details>

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                   │
│                    (Web Browser / Mobile)                           │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      REVERSE PROXY (Optional)                       │
│                    Nginx / Caddy / Traefik                          │
│                    SSL Termination, Load Balancing                  │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         GK-NEXUS APP                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      FRONTEND                                │   │
│  │   React 18 + TanStack Router + TanStack Query               │   │
│  │   Tailwind CSS + shadcn/ui + Lucide Icons                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      API LAYER                               │   │
│  │   Hono (HTTP Server) + oRPC (Type-safe RPC)                 │   │
│  │   Zod Validation + RBAC Middleware                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    AUTH LAYER                                │   │
│  │   Better-Auth (Sessions, RBAC, Password Hashing)            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   BUSINESS LOGIC                             │   │
│  │   Tax Calculations, Invoice Generation, Workflows           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    DATA LAYER                                │   │
│  │   Drizzle ORM (Type-safe queries, migrations)               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        POSTGRESQL 16                                │
│                   Primary Database (Persistent)                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

```
gk-nexus/
├── 📁 apps/
│   ├── 📁 web/                      # React Frontend Application
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/       # UI Components
│   │   │   │   ├── 📁 ui/           # shadcn/ui components
│   │   │   │   ├── 📁 forms/        # Form components
│   │   │   │   ├── 📁 tables/       # Data tables
│   │   │   │   └── 📁 charts/       # Chart components
│   │   │   ├── 📁 routes/           # TanStack Router pages
│   │   │   │   ├── 📄 __root.tsx    # Root layout
│   │   │   │   ├── 📁 dashboard/    # Dashboard routes
│   │   │   │   ├── 📁 clients/      # Client management
│   │   │   │   ├── 📁 invoices/     # Invoice management
│   │   │   │   ├── 📁 services/     # Service catalog
│   │   │   │   └── 📁 settings/     # App settings
│   │   │   ├── 📁 contexts/         # React contexts
│   │   │   ├── 📁 hooks/            # Custom hooks
│   │   │   ├── 📁 lib/              # Utilities
│   │   │   └── 📄 main.tsx          # Entry point
│   │   ├── 📄 package.json
│   │   ├── 📄 tailwind.config.ts
│   │   └── 📄 vite.config.ts
│   │
│   └── 📁 server/                   # Hono API Server
│       ├── 📁 src/
│       │   └── 📄 index.ts          # Server entry
│       └── 📄 package.json
│
├── 📁 packages/
│   ├── 📁 api/                      # API Layer (oRPC)
│   │   ├── 📁 src/
│   │   │   ├── 📁 routers/          # API endpoints
│   │   │   │   ├── 📄 clients.ts
│   │   │   │   ├── 📄 invoices.ts
│   │   │   │   ├── 📄 services.ts
│   │   │   │   ├── 📄 tax.ts
│   │   │   │   ├── 📄 users.ts
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 middleware/       # Auth, RBAC
│   │   │   │   ├── 📄 auth.ts
│   │   │   │   └── 📄 rbac.ts
│   │   │   ├── 📁 services/         # Business logic
│   │   │   │   ├── 📄 tax-calculations.ts
│   │   │   │   ├── 📄 invoice-generator.ts
│   │   │   │   └── 📄 notifications.ts
│   │   │   └── 📁 business-logic/   # Domain logic
│   │   │       └── 📄 tax-constants.ts
│   │   └── 📄 package.json
│   │
│   ├── 📁 auth/                     # Better-Auth Config
│   │   ├── 📁 src/
│   │   │   └── 📄 index.ts
│   │   └── 📄 package.json
│   │
│   ├── 📁 database/                 # Drizzle ORM
│   │   ├── 📁 src/
│   │   │   ├── 📁 schema/           # Database tables
│   │   │   │   ├── 📄 users.ts
│   │   │   │   ├── 📄 clients.ts
│   │   │   │   ├── 📄 businesses.ts
│   │   │   │   ├── 📄 invoices.ts
│   │   │   │   ├── 📄 services.ts
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📄 seed.ts           # Seed script
│   │   │   └── 📄 index.ts          # DB connection
│   │   ├── 📁 drizzle/              # Migrations
│   │   └── 📄 package.json
│   │
│   └── 📁 ui/                       # Shared UI (optional)
│       └── 📄 package.json
│
├── 📁 docs/                         # Documentation
│   ├── 📄 API.md
│   ├── 📄 DEPLOYMENT.md
│   └── 📁 images/
│
├── 📁 scripts/                      # Utility scripts
│   └── 📄 start.sh
│
├── 📁 tests/                        # Test files
│   ├── 📁 auth/
│   ├── 📁 api/
│   └── 📁 e2e/
│
├── 📄 docker-compose.yml            # Production deployment
├── 📄 Dockerfile                    # Multi-stage build
├── 📄 .env.example                  # Environment template
├── 📄 package.json                  # Monorepo root
├── 📄 turbo.json                    # Turborepo config
└── 📄 README.md                     # This file
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| [React](https://react.dev/) | 18.x | UI Framework |
| [TanStack Router](https://tanstack.com/router) | 1.x | Type-safe routing |
| [TanStack Query](https://tanstack.com/query) | 5.x | Data fetching & caching |
| [Tailwind CSS](https://tailwindcss.com/) | 3.x | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Latest | Component library |
| [Lucide React](https://lucide.dev/) | Latest | Icon library |
| [React Hook Form](https://react-hook-form.com/) | 7.x | Form management |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| [Hono](https://hono.dev/) | 4.x | Fast HTTP framework |
| [oRPC](https://orpc.dev/) | Latest | Type-safe RPC |
| [Zod](https://zod.dev/) | 3.x | Schema validation |
| [Better-Auth](https://better-auth.com/) | Latest | Authentication |
| [Drizzle ORM](https://orm.drizzle.team/) | Latest | Type-safe database |

### Database & Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| [PostgreSQL](https://www.postgresql.org/) | 16.x | Primary database |
| [Bun](https://bun.sh/) | 1.x | JavaScript runtime |
| [Turborepo](https://turbo.build/) | Latest | Monorepo build system |
| [Docker](https://www.docker.com/) | 24.x | Containerization |

---

## 📚 API Documentation

### Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:3000/api` |
| Production | `https://your-domain.com/api` |

### Authentication

All API endpoints (except `/auth/*`) require authentication via session cookie.

#### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/session
```

### Clients API

```http
# List clients
GET /api/clients
Query: ?businessId=kaj&search=company&page=1&limit=20

# Get client
GET /api/clients/:id

# Create client (shared across businesses)
POST /api/clients
{
  "name": "ABC Company Ltd",
  "email": "contact@abc.com",
  "businessIds": ["kaj", "gcmc"],
  "tin": "123456789",
  "nis": "987654321"
}

# Update client
PATCH /api/clients/:id
```

### Invoices API

```http
# Create cross-business invoice
POST /api/invoices
{
  "clientId": "client_123",
  "dueDate": "2025-01-15",
  "lineItems": [
    {
      "businessId": "kaj",
      "serviceId": "service_tax_return",
      "description": "Income Tax Return Filing",
      "quantity": 1,
      "unitPrice": 50000
    },
    {
      "businessId": "gcmc",
      "serviceId": "service_incorporation",
      "description": "Company Incorporation",
      "quantity": 1,
      "unitPrice": 85000
    }
  ]
}
```

📖 **Full API Reference:** [docs/API.md](docs/API.md)

---

## 💼 Business Logic

### Tax Calculation Engine

The platform implements GRA (Guyana Revenue Authority) compliant tax calculations:

```typescript
// PAYE Calculation (2025 Rates)
function calculatePAYE(monthlyIncome: number): number {
  const band1Limit = 130_000;
  const band2Limit = 260_000;
  
  if (monthlyIncome <= band1Limit) {
    return 0; // 0% tax
  }
  
  if (monthlyIncome <= band2Limit) {
    return (monthlyIncome - band1Limit) * 0.25; // 25% on excess
  }
  
  // 25% on band 2 + 35% on excess
  const band2Tax = (band2Limit - band1Limit) * 0.25;
  const band3Tax = (monthlyIncome - band2Limit) * 0.35;
  return band2Tax + band3Tax;
}

// NIS Calculation
function calculateNIS(monthlyIncome: number): { employee: number; employer: number } {
  const ceiling = 280_000;
  const insurable = Math.min(monthlyIncome, ceiling);
  
  return {
    employee: insurable * 0.056,  // 5.6%
    employer: insurable * 0.084,  // 8.4%
  };
}
```

### Invoice Generation

Cross-business invoicing with automatic totals:

```typescript
// Invoice with multiple business units
const invoice = {
  client: "ABC Company",
  lineItems: [
    { business: "KAJ", service: "Tax Return", amount: 50000 },
    { business: "KAJ", service: "NIS Registration", amount: 15000 },
    { business: "GCMC", service: "Incorporation", amount: 85000 },
  ],
  subtotals: {
    KAJ: 65000,
    GCMC: 85000,
  },
  total: 150000,
  currency: "GYD",
};
```

---

## 🗺️ Roadmap

### Version 1.0 (Current) ✅

- [x] Multi-business architecture
- [x] Shared client management
- [x] Cross-business invoicing
- [x] Tax calculations (PAYE, VAT, NIS)
- [x] Document management
- [x] Role-based access control
- [x] Audit trail logging
- [x] Email notifications

### Version 1.1 (Q1 2025) 🔄

- [ ] **GRA Integration** - Direct e-filing with GRA
- [ ] **NIS e-Services** - Online NIS submissions
- [ ] **Client Portal** - Self-service for clients
- [ ] **Mobile App** - React Native companion app
- [ ] **OCR Processing** - Automatic document data extraction

### Version 1.2 (Q2 2025) 📋

- [ ] **Advanced Reporting** - Custom report builder
- [ ] **Workflow Automation** - Automated task sequences
- [ ] **Calendar Integration** - Deadline sync with Google/Outlook
- [ ] **Payment Gateway** - Online invoice payments
- [ ] **Multi-Currency** - USD, EUR support alongside GYD

### Version 2.0 (Q3 2025) 🚀

- [ ] **AI Assistant** - Intelligent tax advice
- [ ] **Predictive Analytics** - Revenue forecasting
- [ ] **Third-Party Integrations** - QuickBooks, Xero
- [ ] **White-Label** - Customizable branding per client
- [ ] **API Public Access** - External developer access

### Backlog (Future) 💡

- [ ] Blockchain audit trail
- [ ] Biometric authentication
- [ ] Voice commands
- [ ] Regional expansion (Caribbean-wide)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/gk-nexus.git
cd gk-nexus

# Install and setup
bun install
cp .env.example .env.local
bun run db:migrate
bun run db:seed

# Create branch
git checkout -b feature/your-feature

# Make changes, test
bun run dev
bun run test
bun run check-types

# Commit and push
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

### Contribution Areas

| Area | Description | Difficulty |
|------|-------------|------------|
| 🐛 Bug Fixes | Fix reported issues | Easy |
| 📖 Documentation | Improve docs | Easy |
| 🎨 UI/UX | Enhance interface | Medium |
| ✨ Features | New functionality | Medium-Hard |
| 🏗️ Architecture | Core improvements | Hard |

---

## 💬 Support

### Getting Help

| Channel | Description | Response Time |
|---------|-------------|---------------|
| [GitHub Issues](https://github.com/your-org/gk-nexus/issues) | Bug reports, feature requests | 24-48 hours |
| [Discussions](https://github.com/your-org/gk-nexus/discussions) | Q&A, general help | Community-driven |
| [Email](mailto:support@gk-nexus.com) | Direct support | 48 hours |

### Frequently Asked Questions

<details>
<summary><b>How do I reset the admin password?</b></summary>

```bash
# Via Drizzle Studio
bun run db:studio
# Navigate to users table, update password hash

# Or re-run seed (development only)
bun run db:reset
```

</details>

<details>
<summary><b>Can I add more business units?</b></summary>

Yes! GK-Nexus supports unlimited business units. Add via:
1. Database insert into `businesses` table
2. Configure services and pricing
3. Assign users

No code changes required.

</details>

<details>
<summary><b>How do I update tax rates?</b></summary>

Tax rates are configurable in `packages/api/src/business-logic/tax-constants.ts`. Update the constants and redeploy.

</details>

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 GK-Nexus

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software...
```

---

## 🙏 Acknowledgments

### Built With

- [Better-Auth](https://better-auth.com/) - Authentication made simple
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful components
- [Hono](https://hono.dev/) - Ultrafast web framework
- [Bun](https://bun.sh/) - Fast JavaScript runtime
- [TanStack](https://tanstack.com/) - Powerful React utilities

### Special Thanks

- GRA (Guyana Revenue Authority) for tax documentation
- The open-source community

---

<div align="center">

### 🇬🇾 Built with ❤️ for Guyana

**Empowering professional services with modern technology**

[⬆ Back to Top](#-gk-nexus)

---

[Report Bug](https://github.com/your-org/gk-nexus/issues) • 
[Request Feature](https://github.com/your-org/gk-nexus/issues) • 
[Documentation](docs/) • 
[Changelog](CHANGELOG.md)

</div>
```

### 3.2 Create CONTRIBUTING.md

**File:** `CONTRIBUTING.md`

```markdown
# Contributing to GK-Nexus

Thank you for your interest in contributing to GK-Nexus! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/gk-nexus.git`
3. Add upstream remote: `git remote add upstream https://github.com/original-org/gk-nexus.git`
4. Install dependencies: `bun install`
5. Create a branch: `git checkout -b feature/your-feature`

## Development Workflow

```bash
# Start development
bun run dev

# Run tests before committing
bun run test

# Check types
bun run check-types

# Lint code
bun run lint
```

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/). Format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Maintenance tasks |

### Examples

```
feat(invoices): add cross-business line items
fix(auth): resolve session timeout issue
docs(readme): update installation instructions
```

## Pull Request Process

1. Update documentation if needed
2. Add/update tests for new functionality
3. Ensure all tests pass
4. Request review from maintainers
5. Address review feedback
6. Squash commits if requested

## Code Style

- TypeScript strict mode
- No `any` types (use `unknown` if needed)
- Use Zod for runtime validation
- Follow existing patterns in codebase
- Add JSDoc comments for public APIs
```

### 3.3 Create CHANGELOG.md

**File:** `CHANGELOG.md`

```markdown
# Changelog

All notable changes to GK-Nexus will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-09

### 🎉 Initial Release

First production-ready release of GK-Nexus.

### Added

- **Authentication**
  - Email/password authentication with Better-Auth
  - Role-based access control (RBAC)
  - Session management

- **Business Management**
  - Multi-business support (KAJ, GCMC)
  - Dynamic business configuration
  - Business-specific settings

- **Client Management**
  - Shared clients across businesses
  - Client documents and notes
  - Contact management

- **Service Catalog**
  - 41+ services across KAJ and GCMC
  - Service pricing and categories
  - Required document tracking

- **Invoicing**
  - Cross-business line items
  - GYD currency support
  - Invoice PDF generation
  - Payment tracking

- **Tax Features**
  - PAYE calculations (2025 rates)
  - VAT calculations (14%)
  - NIS contributions (5.6%/8.4%)
  - Tax filing preparation

- **Cases/Engagements**
  - Cross-business case management
  - Service linking
  - Case status tracking
  - Linked cases support

- **Audit Trail**
  - Complete action logging
  - User activity tracking
  - Export capabilities

### Security

- Permission checks on all API endpoints
- Non-root Docker container
- Secure session handling
- Input validation with Zod
```

### 3.4 Create docs/ Folder Structure

```bash
mkdir -p docs
```

**File:** `docs/API.md`

```markdown
# GK-Nexus API Documentation

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

All endpoints (except auth) require authentication via session cookie.

### POST /auth/signin

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "usr_xxx",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

[... Continue with full API documentation ...]
```

**File:** `docs/DEPLOYMENT.md`

```markdown
# Deployment Guide

## Quick Deploy with Docker

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

### Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/gk-nexus.git
   cd gk-nexus
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env
   ```

3. **Start Services**
   ```bash
   docker compose up -d
   ```

4. **Run Migrations**
   ```bash
   docker compose exec gk-nexus bun run db:migrate
   ```

5. **Seed Database (Optional)**
   ```bash
   docker compose exec gk-nexus bun run db:seed
   ```

## Production Checklist

- [ ] Set strong `BETTER_AUTH_SECRET`
- [ ] Set strong `DB_PASSWORD`
- [ ] Configure SSL/TLS
- [ ] Set up backups
- [ ] Configure monitoring
- [ ] Set up log rotation
```

---

## PHASE 4: TEST & VERIFICATION (2-3 hours)

**CRITICAL: Complete ALL verification steps before pushing to production.**

### 4.1 Code Quality Checks

#### 4.1.1 TypeScript Type Checking

```bash
# Run full type check across all packages
bun run check-types

# Expected output: No errors
# If errors exist, fix them before proceeding
```

**Common issues to fix:**
| Error | Fix |
|-------|-----|
| `Type 'X' is not assignable to type 'Y'` | Check type definitions |
| `Property 'X' does not exist` | Add missing property or fix typo |
| `Cannot find module` | Check imports and package.json |

#### 4.1.2 Linting

```bash
# Run linter
bun run lint

# Auto-fix what's possible
bun run lint:fix

# Expected: 0 errors, 0 warnings (or acceptable warnings)
```

#### 4.1.3 Formatting Check

```bash
# Check formatting (if using Prettier/Biome)
bun run format:check

# Auto-format
bun run format
```

---

### 4.2 Unit & Integration Tests

#### 4.2.1 Run All Tests

```bash
# Run complete test suite
bun run test

# Run with coverage report
bun run test:coverage

# Expected: All tests passing
# Coverage target: >80% for critical paths
```

#### 4.2.2 Test Specific Areas

```bash
# Authentication tests
bun test tests/auth/

# API tests
bun test tests/api/

# Business logic tests
bun test tests/business-logic/

# Database tests
bun test tests/database/
```

#### 4.2.3 Create Missing Critical Tests

If tests are missing, create them for these critical paths:

**File:** `tests/auth/authentication.spec.ts`
```typescript
import { describe, it, expect } from 'bun:test';

describe('Authentication', () => {
  it('should reject login with invalid credentials', async () => {
    // Test implementation
  });

  it('should create session on successful login', async () => {
    // Test implementation
  });

  it('should enforce permission checks on protected routes', async () => {
    // Test implementation
  });
});
```

**File:** `tests/business-logic/tax-calculations.spec.ts`
```typescript
import { describe, it, expect } from 'bun:test';
import { calculatePAYE, calculateNIS } from '@/business-logic/tax-calculations';

describe('Tax Calculations', () => {
  describe('PAYE', () => {
    it('should return 0 for income below $130,000', () => {
      expect(calculatePAYE(100_000)).toBe(0);
      expect(calculatePAYE(130_000)).toBe(0);
    });

    it('should calculate 25% for income $130,001-$260,000', () => {
      expect(calculatePAYE(200_000)).toBe(17_500); // (200000-130000) * 0.25
    });

    it('should calculate 35% for income above $260,000', () => {
      expect(calculatePAYE(300_000)).toBe(46_500); // 32500 + (300000-260000) * 0.35
    });
  });

  describe('NIS', () => {
    it('should cap at $280,000 ceiling', () => {
      const result = calculateNIS(500_000);
      expect(result.employee).toBe(15_680); // 280000 * 0.056
      expect(result.employer).toBe(23_520); // 280000 * 0.084
    });
  });
});
```

---

### 4.3 Build Verification

#### 4.3.1 Production Build

```bash
# Clean previous builds
bun run clean

# Build all packages
bun run build

# Expected: Build completes without errors
# Check build output sizes
ls -lah apps/web/dist/
ls -lah apps/server/dist/
```

#### 4.3.2 Verify Build Output

```bash
# Check that all expected files exist
test -f apps/web/dist/index.html && echo "✅ Web build OK" || echo "❌ Web build MISSING"
test -f apps/server/dist/index.js && echo "✅ Server build OK" || echo "❌ Server build MISSING"
test -d packages/database/dist && echo "✅ Database build OK" || echo "❌ Database build MISSING"
test -d packages/api/dist && echo "✅ API build OK" || echo "❌ API build MISSING"
```

#### 4.3.3 Test Production Build Locally

```bash
# Start production build locally
NODE_ENV=production bun run start

# In another terminal, test endpoints
curl http://localhost:3000/health
# Expected: {"status":"ok","timestamp":"..."}

curl http://localhost:3000/api/auth/session
# Expected: {"session":null} or session data
```

---

### 4.4 Docker Verification

#### 4.4.1 Build Docker Image

```bash
# Build with no cache to ensure clean build
docker build --no-cache -t gk-nexus:test .

# Check build succeeded
docker images gk-nexus:test
```

#### 4.4.2 Verify Image Size

```bash
# Check image size (should be < 500MB, ideally < 300MB)
docker images gk-nexus:test --format "{{.Size}}"

# If too large, check for issues
docker history gk-nexus:test
```

**Acceptable sizes:**
| Image | Target | Maximum |
|-------|--------|---------|
| gk-nexus | < 300MB | 500MB |
| postgres:16-alpine | ~240MB | N/A |

#### 4.4.3 Test Docker Container

```bash
# Start test container
docker run -d --name gk-nexus-test \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://test:test@host.docker.internal:5432/test" \
  -e BETTER_AUTH_SECRET="test-secret-at-least-32-characters" \
  -e BETTER_AUTH_URL="http://localhost:3000" \
  gk-nexus:test

# Check container is running
docker ps | grep gk-nexus-test

# Check logs for errors
docker logs gk-nexus-test

# Test health endpoint
curl http://localhost:3000/health

# Cleanup
docker stop gk-nexus-test && docker rm gk-nexus-test
```

#### 4.4.4 Test Docker Compose Stack

```bash
# Start full stack
docker compose up -d

# Wait for services to be healthy
sleep 30

# Check all services running
docker compose ps

# Expected output:
# NAME              STATUS
# gk-nexus          running (healthy)
# gk-nexus-db       running (healthy)

# Test connectivity
curl http://localhost:3000/health

# Test database connection (via app)
curl http://localhost:3000/api/health/db

# Check logs for errors
docker compose logs --tail=50

# Cleanup
docker compose down
```

---

### 4.5 Database Verification

#### 4.5.1 Migration Check

```bash
# Check pending migrations
bun run db:migrate:status

# Expected: All migrations applied

# Verify schema matches code
bun run db:push --dry-run
# Should show no changes needed
```

#### 4.5.2 Seed Data Verification

```bash
# Run seed (in clean database)
bun run db:seed

# Verify seed completed
bun run db:studio
# Check tables have expected data:
# - businesses: 2 records (KAJ, GCMC)
# - services: 41+ records
# - users: 1 super admin
```

#### 4.5.3 Data Integrity Check

```sql
-- Run these queries in db:studio or psql

-- Check businesses exist
SELECT code, name, is_active FROM businesses;
-- Expected: KAJ, GCMC both active

-- Check services per business
SELECT b.code, COUNT(s.id) as service_count
FROM businesses b
LEFT JOIN services s ON s.business_id = b.id
GROUP BY b.code;
-- Expected: KAJ ~20, GCMC ~21

-- Check foreign key integrity
SELECT COUNT(*) FROM invoice_line_items ili
LEFT JOIN businesses b ON ili.business_id = b.id
WHERE b.id IS NULL;
-- Expected: 0 (no orphaned records)

-- Check user-business assignments
SELECT u.email, COUNT(ub.business_id) as business_count
FROM users u
LEFT JOIN user_businesses ub ON u.id = ub.user_id
GROUP BY u.email;
-- Expected: All users have at least 1 business
```

---

### 4.6 API Endpoint Testing

#### 4.6.1 Health Endpoints

```bash
# Basic health
curl -s http://localhost:3000/health | jq .
# Expected: {"status":"ok"}

# Database health
curl -s http://localhost:3000/api/health/db | jq .
# Expected: {"status":"connected","latency_ms":...}
```

#### 4.6.2 Authentication Flow

```bash
# Test login
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#"}' \
  -c cookies.txt \
  -s | jq .

# Expected: User object returned

# Test session
curl http://localhost:3000/api/auth/session \
  -b cookies.txt \
  -s | jq .

# Expected: Session with user data

# Test logout
curl -X POST http://localhost:3000/api/auth/signout \
  -b cookies.txt \
  -s | jq .

# Cleanup
rm cookies.txt
```

#### 4.6.3 Protected Route Testing

```bash
# Test without auth (should fail)
curl -s http://localhost:3000/api/clients | jq .
# Expected: {"error":"Unauthorized"} or redirect

# Test with auth
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#"}' \
  -c cookies.txt -s > /dev/null

curl -s http://localhost:3000/api/clients \
  -b cookies.txt | jq .
# Expected: Array of clients (or empty array)

rm cookies.txt
```

#### 4.6.4 Permission Testing

```bash
# Login as limited user (if exists)
# Try to access admin-only endpoint
# Should return 403 Forbidden

# This verifies SEC-001/SEC-002 fixes are working
```

---

### 4.7 Security Verification

#### 4.7.1 Check for Secrets in Code

```bash
# Search for hardcoded secrets
grep -rn "password.*=" --include="*.ts" --include="*.tsx" \
  | grep -v "type\|interface\|schema\|\.env\|process\.env" \
  | grep -v "test\|spec\|mock"

# Expected: No results (or only safe patterns)

# Search for API keys
grep -rn "api_key\|apiKey\|API_KEY" --include="*.ts" --include="*.tsx" \
  | grep -v "process\.env\|interface\|type"

# Expected: No hardcoded keys
```

#### 4.7.2 Verify Permission Checks Active

```bash
# Count permission middleware usage
grep -rn "\.use(requirePermission" packages/api/src/routers/ | wc -l
# Expected: 650+ (all routes protected)

# Count commented out permissions (should be 0)
grep -rn "// \.use(requirePermission\|//\.use(requirePermission" packages/api/src/routers/ | wc -l
# Expected: 0
```

#### 4.7.3 Check Cookie Security

```bash
# Check auth configuration
grep -A 10 "cookie" packages/auth/src/index.ts

# Verify these settings:
# - sameSite: "lax" or "strict"
# - secure: true (in production)
# - httpOnly: true
```

#### 4.7.4 Check for Console.log in Production

```bash
# Count console statements in production code
grep -rn "console\." --include="*.ts" --include="*.tsx" \
  packages/ apps/ \
  --exclude-dir=node_modules \
  --exclude-dir=tests \
  | grep -v "// console" \
  | wc -l

# Expected: 0 (or very few in error handlers)
```

#### 4.7.5 Dependency Vulnerability Scan

```bash
# Using bun
bun audit

# Or using npm (if available)
npm audit

# Or using Snyk
snyk test

# Fix critical/high vulnerabilities before production
```

---

### 4.8 Performance Testing

#### 4.8.1 Basic Load Test

```bash
# Install hey (HTTP load generator)
# brew install hey  # macOS
# apt install hey   # Ubuntu

# Test health endpoint (baseline)
hey -n 1000 -c 50 http://localhost:3000/health

# Expected:
# - Requests/sec: > 1000
# - Avg latency: < 50ms
# - No errors
```

#### 4.8.2 API Performance

```bash
# Login first to get session
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!@#"}' \
  -c cookies.txt -s > /dev/null

# Test authenticated endpoint
hey -n 100 -c 10 \
  -H "Cookie: $(cat cookies.txt | grep -oP 'session=\S+')" \
  http://localhost:3000/api/clients

# Expected:
# - Requests/sec: > 100
# - Avg latency: < 200ms
# - No errors

rm cookies.txt
```

#### 4.8.3 Database Query Performance

```bash
# Open Drizzle Studio
bun run db:studio

# Run EXPLAIN ANALYZE on critical queries
# Check for sequential scans on large tables
# Add indexes if needed
```

---

### 4.9 End-to-End Testing (Browser Automation)

**This is the most critical testing phase - simulating real users with real data.**

#### 4.9.1 Install Playwright

```bash
# Install Playwright
bun add -d @playwright/test

# Install browsers
bunx playwright install

# Create Playwright config
cat > playwright.config.ts << 'EOF'
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
EOF
```

#### 4.9.2 Create Test Data Fixtures

**File:** `tests/e2e/fixtures/test-data.ts`

```typescript
// Realistic Guyanese test data
export const testUsers = {
  superAdmin: {
    email: 'admin@gknexus.test',
    password: 'Admin123!@#',
    role: 'super_admin',
  },
  kajAccountant: {
    email: 'accountant@kaj.test',
    password: 'Test123!@#',
    role: 'accountant',
    business: 'KAJ',
  },
  gcmcConsultant: {
    email: 'consultant@gcmc.test',
    password: 'Test123!@#',
    role: 'client_service',
    business: 'GCMC',
  },
  readOnly: {
    email: 'viewer@gknexus.test',
    password: 'Test123!@#',
    role: 'read_only',
  },
};

export const testClients = {
  // Individual client - KAJ only (Tax services)
  individual: {
    type: 'individual',
    firstName: 'Rajesh',
    lastName: 'Doobay',
    email: 'rajesh.doobay@gmail.com',
    phone: '+592 623 4567',
    address: '45 Brickdam, Stabroek',
    city: 'Georgetown',
    region: 'Demerara-Mahaica',
    tin: '100234567',
    nis: 'NIS-2024-001234',
    dateOfBirth: '1985-03-15',
    occupation: 'Software Engineer',
    employer: 'Banks DIH Limited',
    monthlyIncome: 450000, // GYD
    businesses: ['KAJ'],
  },
  
  // Sole trader - Both businesses
  soleTrader: {
    type: 'sole_trader',
    firstName: 'Shondell',
    lastName: 'Bacchus',
    tradingName: 'Shondell\'s Beauty Supplies',
    email: 'shondell.beauty@yahoo.com',
    phone: '+592 677 8901',
    address: '123 Regent Street',
    city: 'Georgetown',
    region: 'Demerara-Mahaica',
    tin: '200345678',
    nis: 'NIS-2023-005678',
    businessRegistration: 'BN-2023-12345',
    annualRevenue: 8500000, // GYD - Below VAT threshold
    businesses: ['KAJ', 'GCMC'],
  },
  
  // Small company - Both businesses (VAT registered)
  smallCompany: {
    type: 'company',
    companyName: 'Guyana Tech Solutions Inc.',
    tradingName: 'GuyTech',
    email: 'info@guytech.gy',
    phone: '+592 225 6789',
    address: '78 Main Street, Bourda',
    city: 'Georgetown',
    region: 'Demerara-Mahaica',
    tin: '300456789',
    nis: 'NIS-2022-009876',
    companyNumber: 'CO-2022-54321',
    vatNumber: 'VAT-2023-11111',
    isVatRegistered: true,
    annualRevenue: 25000000, // GYD - Above VAT threshold
    incorporationDate: '2022-06-15',
    directors: ['Mark Williams', 'Sarah Chen'],
    businesses: ['KAJ', 'GCMC'],
  },
  
  // Foreign company with work permit needs
  foreignCompany: {
    type: 'company',
    companyName: 'Caribbean Mining Ventures LLC',
    tradingName: 'CMV Guyana',
    email: 'operations@cmv-guyana.com',
    phone: '+592 233 4455',
    address: 'Lot 5, Providence Industrial Estate',
    city: 'Providence',
    region: 'East Bank Demerara',
    tin: '400567890',
    parentCompany: 'CMV Holdings (Delaware, USA)',
    foreignInvestment: true,
    employeeCount: 45,
    foreignEmployees: 8, // Need work permits
    businesses: ['KAJ', 'GCMC'],
  },
  
  // NGO client
  ngo: {
    type: 'ngo',
    organizationName: 'Guyana Youth Development Foundation',
    registrationNumber: 'NGO-2019-0234',
    email: 'admin@gydf.org.gy',
    phone: '+592 226 7890',
    address: '156 Camp Street',
    city: 'Georgetown',
    region: 'Demerara-Mahaica',
    tin: '500678901',
    charitableStatus: true,
    annualBudget: 12000000,
    businesses: ['KAJ'], // Audit services only
  },
  
  // Cooperative society
  cooperative: {
    type: 'cooperative',
    organizationName: 'Linden Farmers Cooperative Society',
    registrationNumber: 'COOP-2018-0567',
    email: 'lindenfarmerscoop@gmail.com',
    phone: '+592 444 5678',
    address: '23 Republic Avenue',
    city: 'Linden',
    region: 'Upper Demerara-Berbice',
    tin: '600789012',
    memberCount: 156,
    annualRevenue: 18000000,
    businesses: ['KAJ'],
  },
};

export const testInvoices = {
  // Simple KAJ-only invoice
  taxReturnInvoice: {
    client: 'individual',
    business: 'KAJ',
    lineItems: [
      { service: 'Income Tax Return', quantity: 1, unitPrice: 35000 },
      { service: 'NIS Compliance Certificate', quantity: 1, unitPrice: 15000 },
    ],
    expectedSubtotal: 50000,
    expectedVat: 0, // Below VAT threshold
    expectedTotal: 50000,
  },
  
  // Cross-business invoice (KAJ + GCMC)
  crossBusinessInvoice: {
    client: 'smallCompany',
    lineItems: [
      { business: 'KAJ', service: 'Income Tax Return (Company)', quantity: 1, unitPrice: 85000 },
      { business: 'KAJ', service: 'PAYE Returns (Quarterly)', quantity: 4, unitPrice: 25000 },
      { business: 'KAJ', service: 'VAT Returns (Quarterly)', quantity: 4, unitPrice: 20000 },
      { business: 'GCMC', service: 'HR Management Training', quantity: 2, unitPrice: 75000 },
      { business: 'GCMC', service: 'Work Permit Application', quantity: 1, unitPrice: 45000 },
    ],
    expectedSubtotal: 515000,
    expectedVat: 72100, // 14% VAT
    expectedTotal: 587100,
  },
  
  // Immigration package (GCMC primary)
  immigrationPackage: {
    client: 'foreignCompany',
    lineItems: [
      { business: 'GCMC', service: 'Work Permit Application', quantity: 8, unitPrice: 45000 },
      { business: 'GCMC', service: 'Business Visa Application', quantity: 3, unitPrice: 35000 },
      { business: 'KAJ', service: 'Work Permit Tax Compliance', quantity: 8, unitPrice: 25000 },
    ],
    expectedSubtotal: 665000,
    expectedVat: 93100,
    expectedTotal: 758100,
  },
};

export const testTaxCalculations = {
  // Test PAYE calculations for 2025
  payeScenarios: [
    { 
      description: 'Below threshold',
      monthlyGross: 120000,
      expectedPaye: 0,
      expectedNisEmployee: 6720, // 5.6%
      expectedNisEmployer: 10080, // 8.4%
      expectedNet: 113280,
    },
    {
      description: 'At threshold exactly',
      monthlyGross: 130000,
      expectedPaye: 0,
      expectedNisEmployee: 7280,
      expectedNisEmployer: 10920,
      expectedNet: 122720,
    },
    {
      description: 'In 25% band',
      monthlyGross: 200000,
      expectedPaye: 17500, // (200000-130000) * 0.25
      expectedNisEmployee: 11200,
      expectedNisEmployer: 16800,
      expectedNet: 171300,
    },
    {
      description: 'In 35% band',
      monthlyGross: 400000,
      expectedPaye: 81500, // 32500 + (400000-260000)*0.35
      expectedNisEmployee: 15680, // Capped at 280000 ceiling
      expectedNisEmployer: 23520,
      expectedNet: 302820,
    },
    {
      description: 'High earner (above NIS ceiling)',
      monthlyGross: 800000,
      expectedPaye: 221500, // 32500 + (800000-260000)*0.35
      expectedNisEmployee: 15680, // Capped
      expectedNisEmployer: 23520,
      expectedNet: 562820,
    },
  ],
  
  // Test VAT calculations
  vatScenarios: [
    {
      description: 'Standard rated goods',
      amount: 100000,
      vatRate: 14,
      expectedVat: 14000,
      expectedTotal: 114000,
    },
    {
      description: 'Zero-rated (basic foods)',
      amount: 50000,
      vatRate: 0,
      items: ['Rice', 'Flour', 'Sugar'],
      expectedVat: 0,
      expectedTotal: 50000,
    },
    {
      description: 'Mixed invoice',
      standardRatedAmount: 150000,
      zeroRatedAmount: 30000,
      expectedVat: 21000, // Only on standard rated
      expectedTotal: 201000,
    },
  ],
};

export const testServices = {
  kaj: [
    'Income Tax Returns',
    'PAYE Returns',
    'Tender Compliance Certificate',
    'Work Permit Tax Compliance',
    'Land Transfer Compliance',
    'Liability Compliance (Firearm)',
    'Pension Compliance',
    'Certificate of Assessment',
    'Income/Expenditure Statements',
    'Bank Account Verification',
    'Cash Flow Projection',
    'Statements for Loans',
    'Statements for Investments',
    'Statement for Commissioner of Police',
    'NGO Audit',
    'Co-operative Society Audit',
    'NIS Registration',
    'NIS Contribution Schedules',
    'NIS Compliance Certificate',
    'NIS Pension Queries',
  ],
  gcmc: [
    'HR Management Training',
    'Customer Relations Training',
    'Co-operatives & Credit Unions Training',
    'Organisational Management Training',
    'Company Incorporation',
    'Business Registration',
    'Affidavits',
    'Agreement of Sales & Purchases',
    'Wills',
    'Settlement Agreement',
    'Separation Agreement',
    'Investment & Partnership Agreement',
    'Work Permit Application',
    'Citizenship Application',
    'Business Visa',
    'Land Occupation Proposal',
    'Investment Proposal',
    'Start-up Proposal',
    'Real Estate Agency Referral',
    'IT Services Referral',
    'Law Firm Referral',
  ],
};
```

#### 4.9.3 Create Page Object Models

**File:** `tests/e2e/pages/login.page.ts`

```typescript
import { Page, expect } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for navigation to dashboard
    await this.page.waitForURL('/dashboard', { timeout: 10000 });
  }

  async expectLoginError(message: string) {
    await expect(this.page.locator('[data-testid="login-error"]')).toContainText(message);
  }

  async expectOnDashboard() {
    await expect(this.page).toHaveURL('/dashboard');
    await expect(this.page.locator('h1')).toContainText(/dashboard/i);
  }
}
```

**File:** `tests/e2e/pages/client-wizard.page.ts`

```typescript
import { Page, expect } from '@playwright/test';

export class ClientWizardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/clients/new');
  }

  async startNewClient() {
    await this.page.click('[data-testid="new-client-button"]');
    await this.page.waitForSelector('[data-testid="client-wizard"]');
  }

  // Step 1: Client Type Selection
  async selectClientType(type: 'individual' | 'sole_trader' | 'company' | 'ngo' | 'cooperative') {
    await this.page.click(`[data-testid="client-type-${type}"]`);
    await this.page.click('[data-testid="wizard-next"]');
  }

  // Step 2: Basic Information
  async fillBasicInfo(data: {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    tradingName?: string;
    email: string;
    phone: string;
  }) {
    if (data.firstName) {
      await this.page.fill('[data-testid="first-name"]', data.firstName);
      await this.page.fill('[data-testid="last-name"]', data.lastName!);
    }
    if (data.companyName) {
      await this.page.fill('[data-testid="company-name"]', data.companyName);
    }
    if (data.tradingName) {
      await this.page.fill('[data-testid="trading-name"]', data.tradingName);
    }
    await this.page.fill('[data-testid="email"]', data.email);
    await this.page.fill('[data-testid="phone"]', data.phone);
    await this.page.click('[data-testid="wizard-next"]');
  }

  // Step 3: Address Information
  async fillAddressInfo(data: {
    address: string;
    city: string;
    region: string;
  }) {
    await this.page.fill('[data-testid="address"]', data.address);
    await this.page.fill('[data-testid="city"]', data.city);
    await this.page.selectOption('[data-testid="region"]', data.region);
    await this.page.click('[data-testid="wizard-next"]');
  }

  // Step 4: Tax Information
  async fillTaxInfo(data: {
    tin: string;
    nis?: string;
    vatNumber?: string;
    isVatRegistered?: boolean;
  }) {
    await this.page.fill('[data-testid="tin"]', data.tin);
    if (data.nis) {
      await this.page.fill('[data-testid="nis"]', data.nis);
    }
    if (data.isVatRegistered) {
      await this.page.check('[data-testid="vat-registered"]');
      await this.page.fill('[data-testid="vat-number"]', data.vatNumber!);
    }
    await this.page.click('[data-testid="wizard-next"]');
  }

  // Step 5: Business Assignment
  async selectBusinesses(businesses: ('KAJ' | 'GCMC')[]) {
    for (const business of businesses) {
      await this.page.check(`[data-testid="business-${business.toLowerCase()}"]`);
    }
    await this.page.click('[data-testid="wizard-next"]');
  }

  // Step 6: Review & Submit
  async reviewAndSubmit() {
    // Verify summary is shown
    await expect(this.page.locator('[data-testid="wizard-summary"]')).toBeVisible();
    await this.page.click('[data-testid="wizard-submit"]');
    
    // Wait for success
    await this.page.waitForSelector('[data-testid="client-created-success"]', { timeout: 10000 });
  }

  async expectClientCreated(name: string) {
    await expect(this.page.locator('[data-testid="client-created-success"]')).toContainText(name);
  }

  async getCreatedClientId(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/clients\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : '';
  }
}
```

**File:** `tests/e2e/pages/invoice-wizard.page.ts`

```typescript
import { Page, expect } from '@playwright/test';

export class InvoiceWizardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/invoices/new');
  }

  async selectClient(clientName: string) {
    await this.page.click('[data-testid="client-selector"]');
    await this.page.fill('[data-testid="client-search"]', clientName);
    await this.page.click(`[data-testid="client-option"]:has-text("${clientName}")`);
  }

  async addLineItem(item: {
    business: 'KAJ' | 'GCMC';
    service: string;
    quantity: number;
    unitPrice: number;
    description?: string;
  }) {
    await this.page.click('[data-testid="add-line-item"]');
    
    // Select business
    await this.page.selectOption('[data-testid="line-item-business"]:last-of-type', item.business);
    
    // Select service
    await this.page.click('[data-testid="line-item-service"]:last-of-type');
    await this.page.fill('[data-testid="service-search"]', item.service);
    await this.page.click(`[data-testid="service-option"]:has-text("${item.service}")`);
    
    // Fill quantity and price
    await this.page.fill('[data-testid="line-item-quantity"]:last-of-type', item.quantity.toString());
    await this.page.fill('[data-testid="line-item-price"]:last-of-type', item.unitPrice.toString());
    
    if (item.description) {
      await this.page.fill('[data-testid="line-item-description"]:last-of-type', item.description);
    }
  }

  async verifyTotals(expected: {
    subtotal: number;
    vat: number;
    total: number;
  }) {
    const subtotal = await this.page.locator('[data-testid="invoice-subtotal"]').textContent();
    const vat = await this.page.locator('[data-testid="invoice-vat"]').textContent();
    const total = await this.page.locator('[data-testid="invoice-total"]').textContent();

    // Parse GYD amounts (e.g., "GYD 50,000.00" -> 50000)
    const parseGYD = (str: string | null) => {
      if (!str) return 0;
      return parseFloat(str.replace(/[^0-9.-]+/g, ''));
    };

    expect(parseGYD(subtotal)).toBeCloseTo(expected.subtotal, 0);
    expect(parseGYD(vat)).toBeCloseTo(expected.vat, 0);
    expect(parseGYD(total)).toBeCloseTo(expected.total, 0);
  }

  async setDueDate(daysFromNow: number) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysFromNow);
    const dateStr = dueDate.toISOString().split('T')[0];
    await this.page.fill('[data-testid="due-date"]', dateStr);
  }

  async addNotes(notes: string) {
    await this.page.fill('[data-testid="invoice-notes"]', notes);
  }

  async submitInvoice() {
    await this.page.click('[data-testid="create-invoice"]');
    await this.page.waitForSelector('[data-testid="invoice-created-success"]', { timeout: 10000 });
  }

  async expectInvoiceCreated() {
    await expect(this.page.locator('[data-testid="invoice-created-success"]')).toBeVisible();
  }
}
```

**File:** `tests/e2e/pages/tax-calculator.page.ts`

```typescript
import { Page, expect } from '@playwright/test';

export class TaxCalculatorPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/tools/tax-calculator');
  }

  async selectCalculationType(type: 'paye' | 'vat' | 'corporate' | 'nis') {
    await this.page.click(`[data-testid="calc-type-${type}"]`);
  }

  // PAYE Calculator
  async calculatePAYE(monthlyGross: number) {
    await this.selectCalculationType('paye');
    await this.page.fill('[data-testid="gross-salary"]', monthlyGross.toString());
    await this.page.click('[data-testid="calculate-paye"]');
    await this.page.waitForSelector('[data-testid="paye-results"]');
  }

  async getPAYEResults(): Promise<{
    grossSalary: number;
    paye: number;
    nisEmployee: number;
    nisEmployer: number;
    netSalary: number;
  }> {
    const parseAmount = async (testId: string) => {
      const text = await this.page.locator(`[data-testid="${testId}"]`).textContent();
      return parseFloat(text?.replace(/[^0-9.-]+/g, '') || '0');
    };

    return {
      grossSalary: await parseAmount('result-gross'),
      paye: await parseAmount('result-paye'),
      nisEmployee: await parseAmount('result-nis-employee'),
      nisEmployer: await parseAmount('result-nis-employer'),
      netSalary: await parseAmount('result-net'),
    };
  }

  async verifyPAYEResults(expected: {
    paye: number;
    nisEmployee: number;
    nisEmployer: number;
    netSalary: number;
  }) {
    const results = await this.getPAYEResults();
    
    expect(results.paye).toBeCloseTo(expected.paye, 0);
    expect(results.nisEmployee).toBeCloseTo(expected.nisEmployee, 0);
    expect(results.nisEmployer).toBeCloseTo(expected.nisEmployer, 0);
    expect(results.netSalary).toBeCloseTo(expected.netSalary, 0);
  }

  // VAT Calculator
  async calculateVAT(amount: number, isInclusive: boolean = false) {
    await this.selectCalculationType('vat');
    await this.page.fill('[data-testid="vat-amount"]', amount.toString());
    
    if (isInclusive) {
      await this.page.check('[data-testid="vat-inclusive"]');
    }
    
    await this.page.click('[data-testid="calculate-vat"]');
    await this.page.waitForSelector('[data-testid="vat-results"]');
  }

  async getVATResults(): Promise<{
    netAmount: number;
    vatAmount: number;
    grossAmount: number;
  }> {
    const parseAmount = async (testId: string) => {
      const text = await this.page.locator(`[data-testid="${testId}"]`).textContent();
      return parseFloat(text?.replace(/[^0-9.-]+/g, '') || '0');
    };

    return {
      netAmount: await parseAmount('result-vat-net'),
      vatAmount: await parseAmount('result-vat-amount'),
      grossAmount: await parseAmount('result-vat-gross'),
    };
  }
}
```

#### 4.9.4 Create Comprehensive E2E Test Suites

**File:** `tests/e2e/auth.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { testUsers } from './fixtures/test-data';

test.describe('Authentication', () => {
  test('should login with valid credentials and redirect to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);
    await loginPage.expectOnDashboard();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    await page.fill('[data-testid="email-input"]', 'wrong@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    await loginPage.expectLoginError('Invalid credentials');
  });

  test('should logout successfully', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);
    
    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should prevent access to protected routes when not logged in', async ({ page }) => {
    await page.goto('/clients');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should maintain session across page navigations', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);
    
    // Navigate to different pages
    await page.goto('/clients');
    await expect(page).toHaveURL('/clients');
    
    await page.goto('/invoices');
    await expect(page).toHaveURL('/invoices');
    
    await page.goto('/settings');
    await expect(page).toHaveURL('/settings');
    
    // Still logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });
});
```

**File:** `tests/e2e/client-wizard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { ClientWizardPage } from './pages/client-wizard.page';
import { testUsers, testClients } from './fixtures/test-data';

test.describe('Client Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);
  });

  test('should create individual client (KAJ only) through complete wizard', async ({ page }) => {
    const wizard = new ClientWizardPage(page);
    const client = testClients.individual;
    
    await wizard.goto();
    await wizard.startNewClient();
    
    // Step 1: Select type
    await wizard.selectClientType('individual');
    
    // Step 2: Basic info
    await wizard.fillBasicInfo({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
    });
    
    // Step 3: Address
    await wizard.fillAddressInfo({
      address: client.address,
      city: client.city,
      region: client.region,
    });
    
    // Step 4: Tax info
    await wizard.fillTaxInfo({
      tin: client.tin,
      nis: client.nis,
    });
    
    // Step 5: Business assignment
    await wizard.selectBusinesses(['KAJ']);
    
    // Step 6: Review & Submit
    await wizard.reviewAndSubmit();
    await wizard.expectClientCreated(`${client.firstName} ${client.lastName}`);
    
    // Verify client appears in list
    await page.goto('/clients');
    await expect(page.locator(`text=${client.firstName} ${client.lastName}`)).toBeVisible();
  });

  test('should create sole trader (Both businesses) through wizard', async ({ page }) => {
    const wizard = new ClientWizardPage(page);
    const client = testClients.soleTrader;
    
    await wizard.goto();
    await wizard.startNewClient();
    
    await wizard.selectClientType('sole_trader');
    await wizard.fillBasicInfo({
      firstName: client.firstName,
      lastName: client.lastName,
      tradingName: client.tradingName,
      email: client.email,
      phone: client.phone,
    });
    await wizard.fillAddressInfo({
      address: client.address,
      city: client.city,
      region: client.region,
    });
    await wizard.fillTaxInfo({
      tin: client.tin,
      nis: client.nis,
    });
    await wizard.selectBusinesses(['KAJ', 'GCMC']);
    await wizard.reviewAndSubmit();
    
    await wizard.expectClientCreated(client.tradingName);
  });

  test('should create VAT-registered company through wizard', async ({ page }) => {
    const wizard = new ClientWizardPage(page);
    const client = testClients.smallCompany;
    
    await wizard.goto();
    await wizard.startNewClient();
    
    await wizard.selectClientType('company');
    await wizard.fillBasicInfo({
      companyName: client.companyName,
      tradingName: client.tradingName,
      email: client.email,
      phone: client.phone,
    });
    await wizard.fillAddressInfo({
      address: client.address,
      city: client.city,
      region: client.region,
    });
    await wizard.fillTaxInfo({
      tin: client.tin,
      nis: client.nis,
      isVatRegistered: true,
      vatNumber: client.vatNumber,
    });
    await wizard.selectBusinesses(['KAJ', 'GCMC']);
    await wizard.reviewAndSubmit();
    
    await wizard.expectClientCreated(client.companyName);
    
    // Verify VAT status on client profile
    const clientId = await wizard.getCreatedClientId();
    await page.goto(`/clients/${clientId}`);
    await expect(page.locator('[data-testid="vat-status"]')).toContainText('Registered');
    await expect(page.locator('[data-testid="vat-number"]')).toContainText(client.vatNumber!);
  });

  test('should create NGO client for audit services', async ({ page }) => {
    const wizard = new ClientWizardPage(page);
    const client = testClients.ngo;
    
    await wizard.goto();
    await wizard.startNewClient();
    
    await wizard.selectClientType('ngo');
    await wizard.fillBasicInfo({
      companyName: client.organizationName,
      email: client.email,
      phone: client.phone,
    });
    await wizard.fillAddressInfo({
      address: client.address,
      city: client.city,
      region: client.region,
    });
    await wizard.fillTaxInfo({
      tin: client.tin,
    });
    await wizard.selectBusinesses(['KAJ']);
    await wizard.reviewAndSubmit();
    
    await wizard.expectClientCreated(client.organizationName);
  });

  test('should validate required fields in wizard', async ({ page }) => {
    const wizard = new ClientWizardPage(page);
    
    await wizard.goto();
    await wizard.startNewClient();
    await wizard.selectClientType('individual');
    
    // Try to proceed without filling required fields
    await page.click('[data-testid="wizard-next"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="error-first-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-email"]')).toBeVisible();
  });

  test('should allow going back in wizard to edit previous steps', async ({ page }) => {
    const wizard = new ClientWizardPage(page);
    
    await wizard.goto();
    await wizard.startNewClient();
    await wizard.selectClientType('individual');
    
    await wizard.fillBasicInfo({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@test.com',
      phone: '+592 123 4567',
    });
    
    // Go back
    await page.click('[data-testid="wizard-back"]');
    
    // Verify previous data is retained
    await expect(page.locator('[data-testid="first-name"]')).toHaveValue('Test');
    
    // Can change and proceed
    await page.fill('[data-testid="first-name"]', 'Changed');
    await page.click('[data-testid="wizard-next"]');
    
    // Verify change persists
    await page.click('[data-testid="wizard-back"]');
    await expect(page.locator('[data-testid="first-name"]')).toHaveValue('Changed');
  });
});
```

**File:** `tests/e2e/invoice-creation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { InvoiceWizardPage } from './pages/invoice-wizard.page';
import { testUsers, testClients, testInvoices } from './fixtures/test-data';

test.describe('Invoice Creation', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);
  });

  test('should create simple KAJ-only invoice with correct GYD totals', async ({ page }) => {
    const invoicePage = new InvoiceWizardPage(page);
    const invoiceData = testInvoices.taxReturnInvoice;
    
    await invoicePage.goto();
    await invoicePage.selectClient('Rajesh Doobay'); // Individual client
    
    for (const item of invoiceData.lineItems) {
      await invoicePage.addLineItem({
        business: 'KAJ',
        service: item.service,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }
    
    await invoicePage.verifyTotals({
      subtotal: invoiceData.expectedSubtotal,
      vat: invoiceData.expectedVat,
      total: invoiceData.expectedTotal,
    });
    
    await invoicePage.setDueDate(30);
    await invoicePage.submitInvoice();
    await invoicePage.expectInvoiceCreated();
  });

  test('should create cross-business invoice (KAJ + GCMC) with VAT', async ({ page }) => {
    const invoicePage = new InvoiceWizardPage(page);
    const invoiceData = testInvoices.crossBusinessInvoice;
    
    await invoicePage.goto();
    await invoicePage.selectClient('Guyana Tech Solutions'); // VAT registered company
    
    for (const item of invoiceData.lineItems) {
      await invoicePage.addLineItem({
        business: item.business as 'KAJ' | 'GCMC',
        service: item.service,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }
    
    // Verify cross-business totals with VAT
    await invoicePage.verifyTotals({
      subtotal: invoiceData.expectedSubtotal,
      vat: invoiceData.expectedVat,
      total: invoiceData.expectedTotal,
    });
    
    await invoicePage.setDueDate(45);
    await invoicePage.addNotes('Quarterly retainer services for 2025');
    await invoicePage.submitInvoice();
    await invoicePage.expectInvoiceCreated();
    
    // Verify invoice shows both business units
    await expect(page.locator('[data-testid="invoice-businesses"]')).toContainText('KAJ');
    await expect(page.locator('[data-testid="invoice-businesses"]')).toContainText('GCMC');
  });

  test('should create immigration package invoice for foreign company', async ({ page }) => {
    const invoicePage = new InvoiceWizardPage(page);
    const invoiceData = testInvoices.immigrationPackage;
    
    await invoicePage.goto();
    await invoicePage.selectClient('Caribbean Mining Ventures');
    
    for (const item of invoiceData.lineItems) {
      await invoicePage.addLineItem({
        business: item.business as 'KAJ' | 'GCMC',
        service: item.service,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }
    
    await invoicePage.verifyTotals({
      subtotal: invoiceData.expectedSubtotal,
      vat: invoiceData.expectedVat,
      total: invoiceData.expectedTotal,
    });
    
    await invoicePage.submitInvoice();
    await invoicePage.expectInvoiceCreated();
  });

  test('should update totals dynamically when adding/removing line items', async ({ page }) => {
    const invoicePage = new InvoiceWizardPage(page);
    
    await invoicePage.goto();
    await invoicePage.selectClient('Guyana Tech Solutions');
    
    // Add first item
    await invoicePage.addLineItem({
      business: 'KAJ',
      service: 'Income Tax Return (Company)',
      quantity: 1,
      unitPrice: 85000,
    });
    
    await invoicePage.verifyTotals({
      subtotal: 85000,
      vat: 11900, // 14%
      total: 96900,
    });
    
    // Add second item
    await invoicePage.addLineItem({
      business: 'GCMC',
      service: 'Company Incorporation',
      quantity: 1,
      unitPrice: 85000,
    });
    
    await invoicePage.verifyTotals({
      subtotal: 170000,
      vat: 23800,
      total: 193800,
    });
    
    // Remove first item
    await page.click('[data-testid="remove-line-item-0"]');
    
    await invoicePage.verifyTotals({
      subtotal: 85000,
      vat: 11900,
      total: 96900,
    });
  });

  test('should not apply VAT for non-VAT registered clients', async ({ page }) => {
    const invoicePage = new InvoiceWizardPage(page);
    
    await invoicePage.goto();
    await invoicePage.selectClient('Rajesh Doobay'); // Non-VAT individual
    
    await invoicePage.addLineItem({
      business: 'KAJ',
      service: 'Income Tax Return',
      quantity: 1,
      unitPrice: 50000,
    });
    
    // Should have zero VAT
    await invoicePage.verifyTotals({
      subtotal: 50000,
      vat: 0,
      total: 50000,
    });
  });
});
```

**File:** `tests/e2e/tax-calculator.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { TaxCalculatorPage } from './pages/tax-calculator.page';
import { testUsers, testTaxCalculations } from './fixtures/test-data';

test.describe('Tax Calculator - PAYE 2025 Rates', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);
  });

  for (const scenario of testTaxCalculations.payeScenarios) {
    test(`should calculate PAYE correctly for ${scenario.description} (GYD ${scenario.monthlyGross.toLocaleString()})`, async ({ page }) => {
      const taxCalc = new TaxCalculatorPage(page);
      
      await taxCalc.goto();
      await taxCalc.calculatePAYE(scenario.monthlyGross);
      
      await taxCalc.verifyPAYEResults({
        paye: scenario.expectedPaye,
        nisEmployee: scenario.expectedNisEmployee,
        nisEmployer: scenario.expectedNisEmployer,
        netSalary: scenario.expectedNet,
      });
    });
  }

  test('should show PAYE breakdown by tax band', async ({ page }) => {
    const taxCalc = new TaxCalculatorPage(page);
    
    await taxCalc.goto();
    await taxCalc.calculatePAYE(400000);
    
    // Should show band breakdown
    await expect(page.locator('[data-testid="band-1"]')).toContainText('$0 - $130,000');
    await expect(page.locator('[data-testid="band-1-tax"]')).toContainText('$0');
    
    await expect(page.locator('[data-testid="band-2"]')).toContainText('$130,001 - $260,000');
    await expect(page.locator('[data-testid="band-2-tax"]')).toContainText('$32,500');
    
    await expect(page.locator('[data-testid="band-3"]')).toContainText('Above $260,000');
    await expect(page.locator('[data-testid="band-3-tax"]')).toContainText('$49,000');
  });

  test('should show NIS ceiling message when income exceeds ceiling', async ({ page }) => {
    const taxCalc = new TaxCalculatorPage(page);
    
    await taxCalc.goto();
    await taxCalc.calculatePAYE(500000);
    
    await expect(page.locator('[data-testid="nis-ceiling-note"]')).toContainText('NIS capped at $280,000 ceiling');
  });
});

test.describe('Tax Calculator - VAT', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);
  });

  test('should calculate VAT at 14% standard rate', async ({ page }) => {
    const taxCalc = new TaxCalculatorPage(page);
    
    await taxCalc.goto();
    await taxCalc.calculateVAT(100000, false);
    
    const results = await taxCalc.getVATResults();
    expect(results.netAmount).toBe(100000);
    expect(results.vatAmount).toBe(14000);
    expect(results.grossAmount).toBe(114000);
  });

  test('should extract VAT from inclusive amount', async ({ page }) => {
    const taxCalc = new TaxCalculatorPage(page);
    
    await taxCalc.goto();
    await taxCalc.calculateVAT(114000, true); // VAT inclusive
    
    const results = await taxCalc.getVATResults();
    expect(results.netAmount).toBeCloseTo(100000, 0);
    expect(results.vatAmount).toBeCloseTo(14000, 0);
    expect(results.grossAmount).toBe(114000);
  });
});
```

**File:** `tests/e2e/navigation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { testUsers, testServices } from './fixtures/test-data';

test.describe('Navigation and Page Access', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);
  });

  test('should navigate to all main sections', async ({ page }) => {
    const sections = [
      { name: 'Dashboard', url: '/dashboard', heading: 'Dashboard' },
      { name: 'Clients', url: '/clients', heading: 'Clients' },
      { name: 'Invoices', url: '/invoices', heading: 'Invoices' },
      { name: 'Services', url: '/services', heading: 'Service Catalog' },
      { name: 'Documents', url: '/documents', heading: 'Documents' },
      { name: 'Reports', url: '/reports', heading: 'Reports' },
      { name: 'Settings', url: '/settings', heading: 'Settings' },
    ];

    for (const section of sections) {
      await page.click(`[data-testid="nav-${section.name.toLowerCase()}"]`);
      await expect(page).toHaveURL(section.url);
      await expect(page.locator('h1')).toContainText(section.heading);
    }
  });

  test('should display all KAJ services in catalog', async ({ page }) => {
    await page.goto('/services');
    await page.click('[data-testid="filter-business-kaj"]');
    
    for (const service of testServices.kaj) {
      await expect(page.locator(`text=${service}`)).toBeVisible();
    }
  });

  test('should display all GCMC services in catalog', async ({ page }) => {
    await page.goto('/services');
    await page.click('[data-testid="filter-business-gcmc"]');
    
    for (const service of testServices.gcmc) {
      await expect(page.locator(`text=${service}`)).toBeVisible();
    }
  });

  test('should filter services by category', async ({ page }) => {
    await page.goto('/services');
    
    // Filter by Tax category
    await page.selectOption('[data-testid="filter-category"]', 'Tax Filing');
    
    await expect(page.locator('text=Income Tax Returns')).toBeVisible();
    await expect(page.locator('text=PAYE Returns')).toBeVisible();
    
    // Training services should be hidden
    await expect(page.locator('text=HR Management Training')).not.toBeVisible();
  });

  test('should show business switcher and filter data', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Click business switcher
    await page.click('[data-testid="business-switcher"]');
    
    // Select KAJ only
    await page.click('[data-testid="business-option-kaj"]');
    
    // Dashboard should show KAJ-specific metrics
    await expect(page.locator('[data-testid="active-business"]')).toContainText('KAJ');
    
    // Switch to GCMC
    await page.click('[data-testid="business-switcher"]');
    await page.click('[data-testid="business-option-gcmc"]');
    await expect(page.locator('[data-testid="active-business"]')).toContainText('GCMC');
    
    // Switch to All
    await page.click('[data-testid="business-switcher"]');
    await page.click('[data-testid="business-option-all"]');
    await expect(page.locator('[data-testid="active-business"]')).toContainText('All Businesses');
  });
});
```

**File:** `tests/e2e/permissions.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login.page';
import { testUsers } from './fixtures/test-data';

test.describe('Role-Based Access Control', () => {
  test('read-only user cannot create clients', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.readOnly.email, testUsers.readOnly.password);
    
    await page.goto('/clients');
    
    // New client button should be disabled or hidden
    const newButton = page.locator('[data-testid="new-client-button"]');
    const isVisible = await newButton.isVisible();
    
    if (isVisible) {
      await expect(newButton).toBeDisabled();
    }
  });

  test('read-only user cannot create invoices', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.readOnly.email, testUsers.readOnly.password);
    
    await page.goto('/invoices');
    
    const newButton = page.locator('[data-testid="new-invoice-button"]');
    const isVisible = await newButton.isVisible();
    
    if (isVisible) {
      await expect(newButton).toBeDisabled();
    }
  });

  test('read-only user can view but not edit client', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.readOnly.email, testUsers.readOnly.password);
    
    await page.goto('/clients');
    await page.click('[data-testid="client-row"]:first-child');
    
    // Edit button should be disabled
    await expect(page.locator('[data-testid="edit-client-button"]')).toBeDisabled();
    
    // Delete button should not be visible
    await expect(page.locator('[data-testid="delete-client-button"]')).not.toBeVisible();
  });

  test('KAJ accountant can only access KAJ clients', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.kajAccountant.email, testUsers.kajAccountant.password);
    
    await page.goto('/clients');
    
    // Should not see GCMC-only clients
    await expect(page.locator('text=GCMC-Only Client')).not.toBeVisible();
    
    // Business switcher should only show KAJ
    await page.click('[data-testid="business-switcher"]');
    await expect(page.locator('[data-testid="business-option-gcmc"]')).not.toBeVisible();
  });

  test('super admin has access to all settings', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.superAdmin.email, testUsers.superAdmin.password);
    
    await page.goto('/settings');
    
    // Should see all settings sections
    await expect(page.locator('[data-testid="settings-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-businesses"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-permissions"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-integrations"]')).toBeVisible();
  });
});
```

#### 4.9.5 Run E2E Tests

```bash
# Run all E2E tests
bunx playwright test

# Run with UI mode (see tests execute in browser)
bunx playwright test --ui

# Run specific test file
bunx playwright test tests/e2e/client-wizard.spec.ts

# Run tests in headed mode (see browser)
bunx playwright test --headed

# Run tests for specific browser
bunx playwright test --project=chromium
bunx playwright test --project=firefox
bunx playwright test --project="Mobile Safari"

# Generate HTML report
bunx playwright show-report

# Debug a failing test
bunx playwright test --debug tests/e2e/invoice-creation.spec.ts
```

#### 4.9.6 E2E Test Coverage Requirements

| Area | Minimum Tests | Status |
|------|---------------|--------|
| **Authentication** | 5 tests | ☐ |
| **Client Wizard (Individual)** | 3 tests | ☐ |
| **Client Wizard (Company)** | 3 tests | ☐ |
| **Client Wizard (NGO/Coop)** | 2 tests | ☐ |
| **Invoice Creation (Single Biz)** | 2 tests | ☐ |
| **Invoice Creation (Cross-Biz)** | 3 tests | ☐ |
| **Tax Calculator (PAYE)** | 5 tests | ☐ |
| **Tax Calculator (VAT)** | 3 tests | ☐ |
| **Navigation** | 5 tests | ☐ |
| **Permissions** | 5 tests | ☐ |
| **TOTAL** | **36+ tests** | ☐ |

#### 4.9.7 Visual Regression Testing (Optional)

```bash
# Update snapshots
bunx playwright test --update-snapshots

# Compare against baseline
bunx playwright test

# View visual diff report
bunx playwright show-report
```

#### 4.9.8 Expected Test Results

```
Running 36 tests using 4 workers

  ✓ Authentication › should login with valid credentials (2.1s)
  ✓ Authentication › should show error with invalid credentials (1.8s)
  ✓ Authentication › should logout successfully (2.3s)
  ✓ Authentication › should prevent access to protected routes (1.2s)
  ✓ Authentication › should maintain session across navigations (3.1s)
  ✓ Client Wizard › should create individual client (KAJ only) (5.2s)
  ✓ Client Wizard › should create sole trader (Both businesses) (5.4s)
  ✓ Client Wizard › should create VAT-registered company (5.8s)
  ✓ Client Wizard › should create NGO client (4.9s)
  ✓ Client Wizard › should validate required fields (2.1s)
  ✓ Client Wizard › should allow going back to edit (3.2s)
  ✓ Invoice Creation › should create simple KAJ-only invoice (4.5s)
  ✓ Invoice Creation › should create cross-business invoice with VAT (5.8s)
  ✓ Invoice Creation › should create immigration package invoice (5.2s)
  ✓ Invoice Creation › should update totals dynamically (3.9s)
  ✓ Invoice Creation › should not apply VAT for non-VAT clients (3.1s)
  ✓ Tax Calculator › PAYE below threshold (1.8s)
  ✓ Tax Calculator › PAYE at threshold (1.7s)
  ✓ Tax Calculator › PAYE in 25% band (1.9s)
  ✓ Tax Calculator › PAYE in 35% band (1.8s)
  ✓ Tax Calculator › PAYE high earner above NIS ceiling (2.1s)
  ✓ Tax Calculator › should show PAYE breakdown by band (2.4s)
  ✓ Tax Calculator › should show NIS ceiling message (2.0s)
  ✓ Tax Calculator › should calculate VAT at 14% (1.6s)
  ✓ Tax Calculator › should extract VAT from inclusive (1.7s)
  ✓ Navigation › should navigate to all main sections (4.5s)
  ✓ Navigation › should display all KAJ services (3.2s)
  ✓ Navigation › should display all GCMC services (3.1s)
  ✓ Navigation › should filter services by category (2.8s)
  ✓ Navigation › should show business switcher (3.4s)
  ✓ Permissions › read-only cannot create clients (2.1s)
  ✓ Permissions › read-only cannot create invoices (2.0s)
  ✓ Permissions › read-only can view but not edit (2.5s)
  ✓ Permissions › KAJ accountant only sees KAJ clients (2.8s)
  ✓ Permissions › super admin has full settings access (2.3s)

  36 passed (2m 15s)
```

---

### 4.10 Production Readiness Checklist

Run through this checklist before proceeding:

#### Code Quality
- [ ] TypeScript: 0 type errors
- [ ] Linting: 0 errors
- [ ] Tests: All passing
- [ ] Coverage: >80% on critical paths

#### Security
- [ ] No hardcoded secrets
- [ ] All routes have permission checks
- [ ] Cookies configured securely
- [ ] No console.log in production
- [ ] Dependencies scanned for vulnerabilities
- [ ] Password not logged during seed

#### Database
- [ ] All migrations applied
- [ ] Seed data correct
- [ ] Foreign keys intact
- [ ] Indexes on frequently queried columns

#### Docker
- [ ] Image builds successfully
- [ ] Image size acceptable (<500MB)
- [ ] Container starts and passes health check
- [ ] Docker Compose stack works

#### API
- [ ] Health endpoint responds
- [ ] Authentication works
- [ ] Protected routes require auth
- [ ] Permissions are enforced
- [ ] Error responses are clean (no stack traces)

#### Performance
- [ ] Health endpoint: >1000 req/s
- [ ] API endpoints: <200ms avg
- [ ] No N+1 queries
- [ ] Database queries optimized

#### Documentation
- [ ] README is complete
- [ ] API docs are accurate
- [ ] Environment variables documented
- [ ] Deployment instructions work

---

### 4.11 Fix Any Issues Found

If any tests fail or checks don't pass:

1. **Document the issue**
2. **Fix immediately if critical** (security, data integrity)
3. **Create ticket for non-critical** issues
4. **Re-run affected tests** after fix
5. **Update this checklist** with lessons learned

---

### 4.12 Generate Test Report

Create a summary for records:

```bash
# Create test report
cat > TEST_REPORT.md << 'EOF'
# GK-Nexus Pre-Production Test Report

**Date:** $(date +%Y-%m-%d)
**Tester:** [Your Name]
**Commit:** $(git rev-parse --short HEAD)

## Summary

| Category | Status | Notes |
|----------|--------|-------|
| Type Checking | ✅ PASS | 0 errors |
| Linting | ✅ PASS | 0 errors |
| Unit Tests | ✅ PASS | X/X tests |
| Build | ✅ PASS | Web: XXkB, Server: XXkB |
| Docker | ✅ PASS | Image: XXXMB |
| Security | ✅ PASS | No vulnerabilities |
| Performance | ✅ PASS | >1000 req/s |
| E2E | ✅ PASS | All flows working |

## Issues Found & Fixed

1. [Issue description] - Fixed in [commit]

## Recommendations

- [Any recommendations]

## Sign-off

Ready for production: YES / NO
EOF

# Add to git (optional)
git add TEST_REPORT.md
```

---

## PHASE 5: GIT CLEANUP AND PUSH (30 min)

### 5.1 Pre-Push Final Verification

```bash
# Final check - all must pass
bun run check-types && \
bun run lint && \
bun run build && \
bun run test && \
echo "✅ All checks passed!"

# Ensure no secrets in code
grep -rn "password\|secret\|api_key" --include="*.ts" --include="*.tsx" | grep -v ".env" | grep -v "type\|interface\|schema"

# Ensure no .env files staged
git status | grep -E "\.env$|\.env\." && echo "❌ WARNING: .env file staged!" || echo "✅ No .env files"
```

### 5.2 Stage All Changes

```bash
# Add all documentation and config changes
git add .

# Review what's staged
git status

# Check diff for any sensitive data
git diff --cached | grep -i "password\|secret\|key" || echo "✅ No secrets found"
```

### 5.3 Commit with Meaningful Messages

```bash
# Option 1: Single comprehensive commit
git commit -m "chore: production release v1.0.0

- Fix all security issues (SEC-001, SEC-002, AUTH-001, AUTH-002)
- Add multi-business database schema
- Remove all mock data
- Add comprehensive documentation
- Add production Docker setup (linuxserver.io style)
- Add test suite and verification
- Clean up obsolete files

Tested: All unit tests passing, E2E verified
Security: All permission checks active, no secrets in code
Performance: >1000 req/s on health endpoint"

# Option 2: Separate commits (better for history)
git add packages/api/
git commit -m "fix(api): enable all permission checks (SEC-001, SEC-002)"

git add packages/database/
git commit -m "fix(database): add multi-business schema and remove password logging"

git add docker* Dockerfile scripts/
git commit -m "chore(docker): add production-ready Docker setup"

git add README.md CONTRIBUTING.md CHANGELOG.md docs/
git commit -m "docs: comprehensive documentation update"

git add .
git commit -m "chore: cleanup obsolete files and update gitignore"
```

### 5.4 Push to Main

```bash
# Ensure you're on main
git checkout main

# Pull latest (if team)
git pull origin main --rebase

# Push
git push origin main

# Tag release
git tag -a v1.0.0 -m "v1.0.0 - Initial Production Release

Features:
- Multi-business platform (KAJ + GCMC)
- Shared client management
- Cross-business invoicing
- GRA 2025 tax calculations
- Document management
- Role-based access control
- Audit trail

Security:
- All endpoints protected
- Permission checks enabled
- Secure session handling

Docker:
- Production-ready multi-stage build
- < 300MB image size
- Health checks included"

git push origin v1.0.0
```

### 5.5 Verify Push

```bash
# Verify tag on remote
git ls-remote --tags origin | grep v1.0.0

# Verify branch is up to date
git fetch origin
git status
# Should show: "Your branch is up to date with 'origin/main'"
```

### 5.6 Post-Push Actions

```bash
# Create GitHub Release (if using GitHub)
gh release create v1.0.0 \
  --title "v1.0.0 - Initial Production Release" \
  --notes-file CHANGELOG.md

# Trigger CI/CD (if configured)
# Verify deployment succeeded

# Monitor logs for first hour
docker compose logs -f --tail=100
```

---

## PHASE 6: POST-DEPLOYMENT VERIFICATION (30 min)

### 6.1 Smoke Tests on Production

```bash
# Set your production URL
PROD_URL="https://gk-nexus.example.com"

# Health check
curl -s $PROD_URL/health | jq .
# Expected: {"status":"ok"}

# Database connectivity
curl -s $PROD_URL/api/health/db | jq .
# Expected: {"status":"connected"}

# Authentication page loads
curl -s -o /dev/null -w "%{http_code}" $PROD_URL/login
# Expected: 200

# Static assets load
curl -s -o /dev/null -w "%{http_code}" $PROD_URL/assets/index.js
# Expected: 200
```

### 6.2 Functional Verification

| Test | Expected | ✓ |
|------|----------|---|
| Login with admin account | Success, redirect to dashboard | ☐ |
| View client list | List loads (empty or with data) | ☐ |
| Create new client | Client created successfully | ☐ |
| View service catalog | All 41+ services visible | ☐ |
| Create invoice | Invoice with correct GYD totals | ☐ |
| Logout | Session cleared, redirect to login | ☐ |

### 6.3 Monitor for Errors

```bash
# Watch logs for errors
docker compose logs -f 2>&1 | grep -i "error\|exception\|fatal"

# Check container health
docker compose ps

# Check resource usage
docker stats --no-stream

# Expected: No errors, healthy containers, reasonable resource usage
```

---

## FINAL CHECKLIST

### Before Pushing

#### Phase 0: Frontend API Patterns (MUST COMPLETE FIRST)
- [ ] All `api.x.y` patterns migrated to `xY` flat pattern
- [ ] TanStack Query hooks updated
- [ ] Query invalidation keys fixed
- [ ] `bun run check-types --filter=web` passes with 0 errors
- [ ] `bun run build --filter=web` succeeds
- [ ] Dev server starts and pages load without console errors

#### Code Quality
- [ ] TypeScript: 0 type errors (`bun run check-types`)
- [ ] Linting: 0 errors (`bun run lint`)
- [ ] Build: Successful (`bun run build`)
- [ ] Tests: All passing (`bun run test`)
- [ ] Coverage: >80% on critical paths

#### Security (Critical)
- [ ] Permission checks enabled (SEC-001, SEC-002)
- [ ] No hardcoded passwords (AUTH-001)
- [ ] No password logging (AUTH-002)
- [ ] Cookies configured securely
- [ ] No console.log in production code
- [ ] No secrets in git history
- [ ] Dependencies scanned for vulnerabilities

#### Database
- [ ] All migrations applied
- [ ] Seed data correct (2 businesses, 41+ services)
- [ ] Foreign key constraints intact
- [ ] No orphaned records

#### Docker
- [ ] Image builds successfully
- [ ] Image size < 500MB (target < 300MB)
- [ ] Container starts and is healthy
- [ ] Docker Compose stack works end-to-end
- [ ] Non-root user configured

#### API
- [ ] Health endpoint responds 200
- [ ] Auth endpoints work (signin/signout/session)
- [ ] Protected routes reject unauthenticated requests
- [ ] Permissions are enforced per role
- [ ] Error responses don't leak stack traces

#### Performance
- [ ] Health endpoint: >1000 req/s
- [ ] API endpoints: <200ms average
- [ ] Database queries optimized
- [ ] No N+1 queries

#### Documentation
- [ ] README complete with all sections
- [ ] Development setup instructions work
- [ ] Production deployment instructions work
- [ ] API documentation accurate
- [ ] CHANGELOG updated
- [ ] CONTRIBUTING.md present

#### Files
- [ ] No obsolete/backup files
- [ ] .gitignore comprehensive
- [ ] .dockerignore optimized
- [ ] .env.example complete

### After Pushing

- [ ] Git tag created (v1.0.0)
- [ ] GitHub release created (if applicable)
- [ ] CI/CD pipeline passed
- [ ] Production deployment successful
- [ ] Smoke tests passing
- [ ] Monitoring configured
- [ ] Team notified

---

## SUMMARY

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 0 | **Fix Frontend API Patterns** | 2-3 hours | ☐ |
| 1 | Cleanup obsolete files | 30 min | ☐ |
| 2 | Create Docker production setup | 2 hours | ☐ |
| 3 | Update all documentation | 3 hours | ☐ |
| 4 | **Test & Verification** | 2-3 hours | ☐ |
| 5 | Git cleanup and push | 30 min | ☐ |
| 6 | Post-deployment verification | 30 min | ☐ |
| **Total** | | **~11-12 hours** | |

---

## EXECUTION ORDER

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 0: Fix Frontend API Patterns (REQUIRED FIRST)           │
│  - Migrate api.x.y → xY pattern                                 │
│  - Fix TanStack Query hooks                                     │
│  - Verify bun run check-types passes for web                   │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1-3: Cleanup, Docker, Documentation                     │
│  - Can be done in parallel                                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: Test & Verification (CRITICAL)                       │
│  - Unit tests, E2E tests (36+ Playwright tests)                │
│  - Security verification                                        │
│  - Performance testing                                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5-6: Git Push & Post-Deployment                         │
│  - Only after ALL tests pass                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## QUICK COMMANDS REFERENCE

```bash
# === Phase 0: Frontend Fix ===
grep -rn "api\.\w\+\.\w\+" apps/web/src --include="*.tsx" | wc -l  # Count old patterns
bun run check-types --filter=web 2>&1 | grep "error TS" | head -20  # Check errors
bun run build --filter=web            # Build web only

# === Development ===
bun install                    # Install dependencies
bun run dev                    # Start dev server
bun run db:studio              # Database GUI

# === Testing ===
bun run check-types            # TypeScript check (all packages)
bun run check-types --filter=web      # TypeScript check (web only)
bun run check-types --filter=server   # TypeScript check (server only)
bun run lint                   # Lint code
bun run test                   # Run tests
bun run test:coverage          # Tests with coverage
bunx playwright test           # Run E2E tests
bunx playwright test --ui      # Run E2E with visual UI

# === Building ===
bun run build                  # Build all packages
bun run build --filter=web     # Build web only
bun run build --filter=server  # Build server only
bun run clean                  # Clean build artifacts

# === Database ===
bun run db:generate            # Generate migrations
bun run db:migrate             # Apply migrations
bun run db:seed                # Seed data
bun run db:reset               # Reset (drop + migrate + seed)

# === Docker ===
docker build -t gk-nexus .     # Build image
docker compose up -d           # Start stack
docker compose logs -f         # View logs
docker compose down            # Stop stack

# === Git ===
git status                     # Check status
git add .                      # Stage all
git commit -m "message"        # Commit
git push origin main           # Push
git tag -a v1.0.0 -m "msg"    # Create tag
```

---

**After completing this prompt, GK-Nexus will have:**

✅ Clean codebase with no obsolete files
✅ Production-ready Docker setup (lightweight, secure, linuxserver.io style)
✅ Comprehensive documentation with badges, TOC, roadmap
✅ Full test suite verified passing
✅ Security hardened and verified
✅ Performance tested and optimized
✅ Easy one-command deployment
✅ Tagged v1.0.0 release on main branch
✅ Post-deployment verification completed

---

## TROUBLESHOOTING

### Frontend API Pattern Issues (Phase 0)

<details>
<summary><b>Type error: Property 'x' does not exist on type</b></summary>

This usually means the old nested pattern is still being used:

```bash
# Find remaining old patterns
grep -rn "api\.\w\+\.\w\+" apps/web/src --include="*.tsx" --include="*.ts"

# Common patterns to fix:
# api.clients.list -> orpc.clientList
# api.documents.requirements -> orpc.documentRequirements
# api.tax.filings -> orpc.taxFilingsList
```

</details>

<details>
<summary><b>useQuery hook not working after migration</b></summary>

Make sure you're using the correct oRPC pattern:

```typescript
// WRONG
const { data } = api.clients.list.useQuery();

// CORRECT
import { orpc } from '@/utils/orpc';
const { data } = orpc.clientList.useQuery();
```

</details>

<details>
<summary><b>Query invalidation not working</b></summary>

Update the query keys to match new flat pattern:

```typescript
// WRONG
queryClient.invalidateQueries({ queryKey: ['api', 'clients', 'list'] });

// CORRECT
queryClient.invalidateQueries({ queryKey: ['clientList'] });
```

</details>

<details>
<summary><b>Mutation callbacks not firing</b></summary>

Check the mutation setup:

```typescript
// CORRECT pattern
const mutation = orpc.clientCreate.useMutation({
  onSuccess: (data) => {
    queryClient.invalidateQueries({ queryKey: ['clientList'] });
    toast.success('Client created');
  },
  onError: (error) => {
    toast.error(error.message);
  },
});
```

</details>

### Common Issues

<details>
<summary><b>Docker build fails</b></summary>

```bash
# Check Docker daemon running
docker info

# Build with verbose output
docker build --progress=plain -t gk-nexus .

# Check for disk space
df -h
```

</details>

<details>
<summary><b>Tests failing</b></summary>

```bash
# Run specific test with verbose output
bun test tests/failing-test.spec.ts --verbose

# Check test database connection
echo $DATABASE_URL

# Reset test database
bun run db:reset
```

</details>

<details>
<summary><b>TypeScript errors</b></summary>

```bash
# Find specific error location
bun run check-types 2>&1 | head -50

# Check for missing types
bun add -d @types/missing-package
```

</details>

<details>
<summary><b>Permission denied errors</b></summary>

```bash
# Fix script permissions
chmod +x scripts/*.sh

# Fix Docker socket (Linux)
sudo usermod -aG docker $USER
# Then logout/login
```

</details>

<details>
<summary><b>Database connection failed</b></summary>

```bash
# Check PostgreSQL running
docker compose ps postgres

# Check connection string
echo $DATABASE_URL

# Test connection directly
psql $DATABASE_URL -c "SELECT 1"
```

</details>
