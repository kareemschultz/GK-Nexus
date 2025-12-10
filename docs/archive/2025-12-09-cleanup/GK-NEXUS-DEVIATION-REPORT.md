# GK-Nexus Deviation Analysis Report
## Comprehensive Source Code Audit

**Generated:** December 4, 2025  
**Scope:** Full source code analysis against Better-T-Stack base scaffold patterns  
**Base Scaffold Reference:** test-project.zip (Better-T-Stack CLI generated)

---

## Executive Summary

After analyzing the GK-Nexus source code against the Better-T-Stack base scaffold, I identified several deviations and bugs. Notably, the project is **better aligned with the base scaffold than initially expected** in many areas, but there are critical issues requiring immediate attention.

### Critical Issues: 2
### High Priority: 3
### Medium Priority: 4
### Low Priority: 2

---

## 🔴 CRITICAL ISSUES

### 1. Missing Lucide Icon Import (Causes Runtime Error)

**File:** `apps/web/src/components/time-tracking/dashboard.tsx`  
**Line:** 174  
**Error:** `ReferenceError: Square is not defined`

**Problem:**
```tsx
// Line 1 - MISSING Square in import
import { Calendar, Clock, Play, TrendingUp, Users } from "lucide-react";

// Line 174 - Uses Square without import!
<Square className="h-4 w-4" />
```

**Fix:**
```tsx
import { Calendar, Clock, Play, Square, TrendingUp, Users } from "lucide-react";
```

**Impact:** Application crashes when navigating to Time Tracking dashboard

---

### 2. Nested oRPC Router Structure

**File:** `packages/api/src/routers/index.ts`  
**Lines:** 28-59

**Problem:**
The project uses a **nested router structure** which differs from the base scaffold's flat pattern. While oRPC supports nested routers, this can cause issues with type inference in complex scenarios.

**Current Structure:**
```typescript
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  clients: clientsRouter,  // Nested
  users: usersRouter,      // Nested
  // ... 20+ nested routers
};
```

**Base Scaffold Pattern:**
```typescript
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({...})),
  // Flat procedures
};
```

**Assessment:** 
- The nested pattern is **functional** and oRPC supports it
- However, some routers are **disabled** (audit, rbac) due to "incompatible architecture"
- The clients router has **triple nesting** (`clients.contacts.list`, `clients.services.create`)

**Recommendation:** 
- Keep the nested pattern (it's working)
- Fix the disabled audit/rbac routers
- Document the pattern in CLAUDE.md

---

## 🟠 HIGH PRIORITY ISSUES

### 3. Disabled Routers (audit, rbac)

**File:** `packages/api/src/routers/index.ts`  
**Lines:** 5-7, 35-37

```typescript
// TEMPORARILY DISABLED - audit and rbac routers have incompatible architecture
// import { auditRouter } from "./audit";
// import { rbacRouter } from "./rbac";
```

**Impact:** Audit logging and RBAC functionality unavailable

**Recommended Action:** Investigate and fix the incompatible architecture

---

### 4. Backend Connection Failures

**Evidence from Console Errors:**
```
TypeError: Failed to fetch
    at async Object.beforeLoad (dashboard.tsx:23:21)
```

**Possible Causes:**
1. Server not running on port 3000
2. CORS misconfiguration
3. Incorrect `VITE_SERVER_URL` in `.env`

**Recommended Checks:**
- Verify `VITE_SERVER_URL=http://localhost:3000` in `apps/web/.env`
- Ensure server is running: `bun run dev:server`
- Check CORS settings in `apps/server/src/index.ts`

---

### 5. HTTP Error Patterns

**From Console Errors:**
- `403 Forbidden` - RBAC/permission issues  
- `404 Not Found` - Missing API routes  
- `500 Internal Server Error` - Backend crashes

**Root Cause:** Likely related to disabled rbac router and permission middleware issues

---

## 🟡 MEDIUM PRIORITY ISSUES

### 6. Sidebar Navigation Pattern

**File:** `apps/web/src/components/enterprise-sidebar.tsx`

**Assessment:** ✅ CORRECTLY IMPLEMENTED

The sidebar correctly uses:
- Direct `<Link>` components from TanStack Router for navigation
- `<button>` for parent items with children (expand/collapse)
- No shadcn/ui SidebarMenuButton wrapper

This aligns with base scaffold patterns. No changes needed.

---

### 7. Document Filter Logic

**File:** `apps/web/src/lib/document-requirements.ts`  
**Function:** `getRequiredDocuments()`

**Assessment:** ✅ CORRECTLY IMPLEMENTED

The wizard properly filters documents based on:
- Entity type (`ENTITY_TYPE_DOCUMENTS`)
- Selected services (`SERVICE_SPECIFIC_DOCUMENTS`)
- Deduplication of service documents

No changes needed.

---

### 8. Authentication Pattern

**File:** `apps/web/src/routes/dashboard.tsx`

**Current Implementation:**
```tsx
export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});
```

**Assessment:** ✅ MATCHES BASE SCAFFOLD PATTERN

---

### 9. oRPC Client Setup

**File:** `apps/web/src/utils/orpc.ts`

**Assessment:** ✅ CORRECTLY IMPLEMENTED

```typescript
export const link = new RPCLink({
  url: `${import.meta.env.VITE_SERVER_URL}/rpc`,
  fetch(_url, options) {
    return fetch(_url, { ...options, credentials: "include" });
  },
});

export const client: AppRouterClient = createORPCClient(link);
export const orpc = createTanstackQueryUtils(client);
```

---

## 🟢 LOW PRIORITY ISSUES

### 10. Missing Icon Audit

Other files using `Square`:
- `apps/web/src/components/time-tracking/timer.tsx` - Has proper import ✅

**Recommendation:** Run icon audit across all files:
```bash
grep -rn "from \"lucide-react\"" apps/web/src --include="*.tsx" | \
  while read line; do
    file=$(echo $line | cut -d: -f1)
    # Check all icon usages match imports
  done
```

---

### 11. API Package Import Path

**File:** `apps/web/src/utils/orpc.ts`

```typescript
import type { AppRouterClient } from "@GK-Nexus/api/routers/index";
```

**Note:** Package naming uses `@GK-Nexus/` (capital letters) which differs from base scaffold's lowercase pattern (`@project-name/`). This is fine but should be consistent.

---

## Recommended Fixes Priority Order

### Immediate (Before Next Deploy)

1. **Fix Square import** in `time-tracking/dashboard.tsx`
```bash
# Quick fix command
sed -i 's/import { Calendar, Clock, Play, TrendingUp, Users }/import { Calendar, Clock, Play, Square, TrendingUp, Users }/' apps/web/src/components/time-tracking/dashboard.tsx
```

2. **Verify server is running** before frontend development

### Short Term (This Sprint)

3. **Investigate disabled routers** (audit, rbac)
4. **Add error boundary** around Time Tracking routes
5. **Create startup checklist** for developers

### Medium Term

6. **Comprehensive Lucide icon audit**
7. **Document nested router pattern** in CLAUDE.md
8. **Add health check to frontend** for API connectivity

---

## Updated .claude/ Folder Files

Based on this analysis, I've created updated files at:

- `/mnt/user-data/outputs/claude-files/CLAUDE.md` (enhanced with real bug patterns)
- `/mnt/user-data/outputs/claude-files/CONVENTIONS.md` (with actual patterns found)
- `/mnt/user-data/outputs/claude-files/instructions.md` (step-by-step fixes)

---

## Verification Checklist

Before considering any fix complete:

- [ ] Run `bun run dev` - both server and web start without errors
- [ ] Navigate to `/dashboard` - loads without errors
- [ ] Navigate to `/time-tracking` - loads without errors
- [ ] Check browser console - no red errors
- [ ] Run `npx ultracite check` - no linting errors
- [ ] Test login/logout flow works

---

## Files Analyzed

| Path | Status | Issues |
|------|--------|--------|
| `packages/api/src/routers/index.ts` | ⚠️ | Nested pattern, disabled routers |
| `packages/api/src/routers/clients.ts` | ✅ | Working, triple nesting |
| `packages/api/src/routers/dashboard.ts` | ✅ | Correctly implemented |
| `apps/web/src/utils/orpc.ts` | ✅ | Correct setup |
| `apps/web/src/components/enterprise-sidebar.tsx` | ✅ | Correct navigation |
| `apps/web/src/components/time-tracking/dashboard.tsx` | 🔴 | Missing import |
| `apps/web/src/components/client-onboarding-wizard.tsx` | ✅ | Uses getRequiredDocuments |
| `apps/web/src/lib/document-requirements.ts` | ✅ | Correct filtering |
| `apps/web/src/routes/dashboard.tsx` | ✅ | Correct auth pattern |

---

## Summary

**Good News:**
- Navigation pattern is correct (uses direct Links)
- Auth pattern matches base scaffold
- Document filtering is properly implemented
- oRPC client setup is correct

**Issues Found:**
- 1 critical missing import (runtime crash)
- 2 disabled routers (reduced functionality)
- Backend connection issues (likely config)
- HTTP errors suggesting permission problems

The project is closer to base scaffold patterns than expected, with the main issues being:
1. A simple missing import causing crashes
2. Architectural decisions around disabled routers that need investigation

---

## Appendix A: Base Scaffold vs GK-Nexus Comparison

### Pattern Comparison Table

| Pattern | Base Scaffold | GK-Nexus | Status |
|---------|---------------|----------|--------|
| **oRPC Router** | Flat (all procedures at root) | Nested (sub-routers) | ⚠️ Different but functional |
| **Navigation** | Direct `<Link>` components | Direct `<Link>` components | ✅ Matches |
| **Route Definition** | `createFileRoute` + `beforeLoad` | `createFileRoute` + `beforeLoad` | ✅ Matches |
| **Auth Pattern** | `authClient.getSession()` in beforeLoad | `authClient.getSession()` in beforeLoad | ✅ Matches |
| **oRPC Client** | `createORPCClient` + `RPCLink` | `createORPCClient` + `RPCLink` | ✅ Matches |
| **Package Naming** | `@project-name/package` | `@GK-Nexus/package` | ✅ Matches (case differs) |
| **Form Handling** | TanStack Form + Zod | TanStack Form + Zod | ✅ Matches |
| **Error Handling** | `ORPCError` + toast | `ORPCError` + toast | ✅ Matches |

### Base Scaffold Canonical Patterns

#### 1. oRPC Router (Base Scaffold - FLAT)

```typescript
// packages/api/src/routers/index.ts
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.user,
  })),
};
```

#### 2. Navigation (Base Scaffold - SIMPLE)

```tsx
// Direct Link components
import { Link } from "@tanstack/react-router";

<Link to="/dashboard">Dashboard</Link>
```

#### 3. Route Definition (Base Scaffold)

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});
```

### GK-Nexus Deviations Explained

#### Deviation 1: Nested oRPC Routers

**Why it differs:** GK-Nexus has 20+ domain areas (clients, tax, payroll, documents, etc.) which would make a flat structure unwieldy. Nested routers provide better organization.

**Impact:** 
- Works correctly for most routers
- Two routers (audit, rbac) have "incompatible architecture" issues
- Triple nesting (`clients.contacts.list`) adds complexity

**Recommendation:** Keep nested pattern but fix disabled routers.

#### Deviation 2: Complex Sidebar

**Why it differs:** GK-Nexus has 6 sections with 40+ routes, requiring expandable/collapsible groups.

**Impact:** None - correctly uses `<button>` for expand and `<Link>` for navigation.

**Recommendation:** No changes needed.

---

## Appendix B: Files Delivered

### .claude/ Folder Files

| File | Purpose | Key Contents |
|------|---------|--------------|
| `CLAUDE.md` | Main rules | Tech stack, known bugs, patterns, verification checklist |
| `CONVENTIONS.md` | Code patterns | Base scaffold patterns, GK-Nexus patterns, examples |
| `instructions.md` | Step-by-step | Bug fixes, debugging tips, verification protocol |
| `settings.json` | Claude Code config | Hooks, permissions, model settings |

### Installation

```bash
# From GK-Nexus project root
mkdir -p .claude
cp ~/Downloads/CLAUDE.md .claude/
cp ~/Downloads/CONVENTIONS.md .claude/
cp ~/Downloads/instructions.md .claude/
cp ~/Downloads/settings.json .claude/
```

---

## Appendix C: Quick Fix Commands

### Fix Missing Square Import

```bash
# Option 1: Manual edit
# Open apps/web/src/components/time-tracking/dashboard.tsx
# Add Square to line 1 imports

# Option 2: sed command
sed -i 's/import { Calendar, Clock, Play, TrendingUp, Users }/import { Calendar, Clock, Play, Square, TrendingUp, Users }/' apps/web/src/components/time-tracking/dashboard.tsx
```

### Verify All Lucide Imports

```bash
# Find all files using Square
grep -rn "Square" apps/web/src --include="*.tsx"

# Check imports in each file
for file in $(grep -l "Square" apps/web/src --include="*.tsx" -r); do
  echo "=== $file ==="
  head -20 "$file" | grep "lucide-react"
done
```

### Test Backend Connectivity

```bash
# Health check
curl http://localhost:3000/rpc/healthCheck

# Check all registered routes
grep -n "Router" packages/api/src/routers/index.ts

# Verify disabled routers
grep -n "DISABLED\|disabled" packages/api/src/routers/index.ts
```

---

## Appendix D: Guyana Tax Reference

### 2025 GRA Rates

| Tax | Rate | Threshold/Cap |
|-----|------|---------------|
| PAYE | 25% | Up to GYD 130,000/month |
| PAYE | 35% | Above GYD 130,000/month |
| PAYE Exempt | - | First GYD 85,000/month |
| NIS Employee | 5.6% | Cap: GYD 294,840/year |
| NIS Employer | 8.4% | Cap: GYD 442,260/year |
| NIS Self-Employed | 14% | Combined rate |
| VAT | 14% | Standard rate |
| Corporate Tax | 25% | Commercial companies |
| Corporate Tax | 40% | Non-commercial companies |

### Filing Deadlines

| Filing | Deadline |
|--------|----------|
| PAYE Monthly | 14th of following month |
| NIS Monthly | 14th of following month |
| VAT Monthly | 21st of following month |
| Corporate Tax | March 31 (for previous year) |
| Personal Tax | April 30 (for previous year) |
| Annual NIS Return | January 31 |
