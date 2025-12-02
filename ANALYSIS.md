# GK-Nexus Codebase Analysis
Generated: 2025-12-01

## Project Overview

- **Total TypeScript/TSX files**: 745
- **Monorepo Structure**: Better-T-Stack (React 19, TanStack Router, Hono, oRPC, Drizzle ORM)
- **Apps**: web (port 3001), server (port 3000), docs
- **Packages**: api, auth, db

---

## 1. API Router Status

| Router File | Imported in index.ts | Procedures Found | Issues |
|-------------|---------------------|------------------|--------|
| dashboard.ts | YES (line 9) | overview, kpis, revenueAnalysis, complianceReport, clientPerformance, financialSummary | None - All procedures exist |
| users.ts | YES (line 24) | list, getById, me, create, update, delete, changePassword, resetPassword, updatePermissions, bulkAction, stats, rolesAndPermissions | None |
| clients.ts | YES (line 7) | Not fully analyzed | |
| appointments.ts | YES (line 4) | Not fully analyzed | |
| documents.ts | YES (line 10) | Not fully analyzed | |
| tax.ts | YES (line 22) | Not fully analyzed | |
| compliance.ts | YES (line 8) | Not fully analyzed | |
| immigration.ts | YES (line 13) | Not fully analyzed | |
| invoices.ts | YES (line 14) | Not fully analyzed | |
| audit.ts | YES (line 6) | Not fully analyzed | |
| ai.ts | YES (line 3) | Not fully analyzed | |
| backup.ts | YES (line 6) | Not fully analyzed | |
| gra-integration.ts | YES (line 12) | Not fully analyzed | |
| notifications.ts | YES (line 16) | Not fully analyzed | |
| ocr.ts | YES (line 17) | Not fully analyzed | |
| rbac.ts | YES (line 20) | Not fully analyzed | |
| expediting.ts | YES (line 11) | Not fully analyzed | Phase 5 |
| local-content.ts | YES (line 15) | Not fully analyzed | Phase 5 |
| partner-network.ts | YES (line 18) | Not fully analyzed | Phase 5 |
| property-management.ts | YES (line 19) | Not fully analyzed | Phase 5 |
| service-catalog.ts | YES (line 21) | Not fully analyzed | Phase 5 |
| training.ts | YES (line 23) | Not fully analyzed | Phase 5 |

---

## 2. Dashboard Procedures - Expected vs Actual

| Frontend Expects | Router Has It | Line # | Permission Required | Notes |
|------------------|---------------|--------|---------------------|-------|
| dashboard.overview | **YES** | 43 | dashboard.read | Returns client stats, revenue, tax, appointments, documents, compliance alerts |
| dashboard.kpis | **YES** | 262 | dashboard.read | Returns revenue and client KPIs by period |
| dashboard.financialSummary | **YES** | 718 | dashboard.read | Returns invoice summary and cash flow |
| dashboard.complianceReport | **YES** | 483 | **compliance.read** | Returns compliance alerts overview and upcoming deadlines |

**IMPORTANT FINDING**: `complianceReport` requires `compliance.read` permission, not `dashboard.read`. This could cause issues if `read_only` users don't have this permission.

Checking RBAC permissions for `read_only` role (packages/api/src/middleware/rbac.ts:149-156):
```typescript
read_only: [
  "clients.read",
  "tax_calculations.read",
  "compliance.read",      // <-- HAS this permission
  "documents.read",
  "dashboard.read",       // <-- HAS this permission
  "reports.read",
]
```

**Verdict**: `read_only` role has both required permissions. This should not be the issue.

---

## 3. User/Auth Configuration

### Default Values in Schema (packages/db/src/schema/users.ts)
- **Default role**: `read_only` (line 36)
- **Default status**: `pending` (line 37)

### Auto-creation Logic in Context (packages/api/src/context.ts:48-71)

When a session exists but user doesn't exist in users table:
```typescript
const isFirstUser = userCount.count === 0;
const defaultRole: Role = isFirstUser ? "super_admin" : "admin";

const newUserData = {
  // ...
  role: defaultRole,          // super_admin or admin (OVERRIDES schema default)
  status: "active" as const,  // OVERRIDES schema default of "pending"
  // ...
};
```

**VERDICT**: New users auto-created from auth sessions get:
- **First user**: `super_admin` role, `active` status
- **Subsequent users**: `admin` role, `active` status

### Auth Middleware Check (packages/api/src/index.ts:14-17)
```typescript
// Check if user is active
if (context.user.status !== "active") {
  throw new ORPCError("FORBIDDEN", "Account is not active");
}
```

**POTENTIAL ISSUE**: If a user was created directly in the database (not through the auto-creation flow), they would have `pending` status and `read_only` role by default, causing 401/403 errors.

---

## 4. EnhancedDashboard Analysis

### File: apps/web/src/components/enhanced-dashboard.tsx

| Check | Status | Evidence |
|-------|--------|----------|
| Uses localStorage for widgets | YES | Line 372: `localStorage.getItem("dashboard-widgets-v2")` |
| Stores icon components directly | **NO (FIXED)** | Uses `iconName: IconName` (string type) |
| Has icon lookup map | **YES** | Lines 84-94: `ICON_MAP` constant |
| localStorage key used | `dashboard-widgets-v2` | Line 372 (new key), Line 180 removes old `dashboard-widgets` key |

### Icon Serialization Fix Already In Place:

```typescript
// Type definition (line 63-70)
type IconName = "DollarSign" | "Users" | "Shield" | "Clock" | "TrendingUp" | "UserCheck";

interface KPIWidget {
  // ...
  iconName: IconName;  // String, not React component
  // ...
}

// Icon lookup map (lines 84-94)
const ICON_MAP: Record<IconName, React.ComponentType<{ className?: string }>> = {
  DollarSign,
  Users,
  Shield,
  Clock,
  TrendingUp,
  UserCheck,
};

// Cleanup old broken data (lines 178-181)
useEffect(() => {
  localStorage.removeItem("dashboard-widgets");
}, []);

// Widget rendering (line 861)
const IconComponent = ICON_MAP[widget.iconName] || DollarSign;
```

**VERDICT**: The icon serialization issue has **ALREADY BEEN FIXED** in the codebase.

---

## 5. Settings Routes Analysis

### Routes Exist in apps/web/src/routes/settings/

| Route File | Exists | Path |
|------------|--------|------|
| profile.tsx | YES | /settings/profile |
| security.tsx | YES | /settings/security |
| notifications.tsx | YES | /settings/notifications |
| appearance.tsx | YES | /settings/appearance |
| integrations.tsx | YES | /settings/integrations |
| billing.tsx | YES | /settings/billing |
| backup.tsx | YES | /settings/backup |

### Settings Navigation (apps/web/src/components/settings-layout.tsx)

Navigation uses TanStack Router's `Link` component properly:
```typescript
<Link
  to={item.href}  // e.g., "/settings/profile"
  className={cn(...)}
>
```

**VERDICT**: Settings routes and navigation appear to be properly configured. If navigation isn't working, the issue is likely elsewhere (route registration, auth guards, etc.).

---

## 6. All Identified Issues (Prioritized)

### P0 - Critical (Prevents Usage)

| # | Issue | Root Cause Analysis | Status |
|---|-------|---------------------|--------|
| 1 | EnhancedDashboard icon crash | Icons stored as objects in localStorage lose function reference | **ALREADY FIXED** - Code uses `iconName` string + `ICON_MAP` lookup |
| 2 | "dashboard.overview is not a function" | Procedure might not be callable from frontend | **NEEDS INVESTIGATION** - Procedure EXISTS in router, may be client-side issue |
| 3 | 401 Unauthorized on all /rpc/ calls | User status or permissions issue | **NEEDS INVESTIGATION** - Auto-creation sets active+admin, but could be timing issue |

### P1 - High (Major Feature Broken)

| # | Issue | Root Cause Analysis | Status |
|---|-------|---------------------|--------|
| 4 | Settings sub-menus don't work | Routes exist, navigation configured | **NEEDS INVESTIGATION** - May be route tree generation issue |
| 5 | Upload buttons not functional | Not analyzed yet | **NEEDS INVESTIGATION** |
| 6 | Users page infinite loading | Related to Issue 3 - 401 errors | **BLOCKED BY** Issue 3 |

### P2 - Medium (Minor Feature Broken)

None identified yet.

### P3 - Low (Polish/Enhancement)

None identified yet.

---

## 7. Recommended Investigation Order

1. **Verify API connectivity**: Run curl commands against the backend to confirm procedures are callable
2. **Check oRPC client setup**: Verify `apps/web/src/utils/orpc.ts` is correctly configured
3. **Test authentication flow**: Login and verify session is properly established
4. **Check route tree generation**: Run `bun run dev` and verify routes are registered
5. **Inspect browser console**: Get actual error messages when issues occur

---

## 8. Key Files Reference

| What | Location |
|------|----------|
| oRPC client setup | apps/web/src/utils/orpc.ts |
| Main router index | packages/api/src/routers/index.ts |
| Dashboard router | packages/api/src/routers/dashboard.ts |
| Users router | packages/api/src/routers/users.ts |
| RBAC middleware | packages/api/src/middleware/rbac.ts |
| Request context | packages/api/src/context.ts |
| User schema | packages/db/src/schema/users.ts |
| EnhancedDashboard | apps/web/src/components/enhanced-dashboard.tsx |
| Auth client | apps/web/src/lib/auth-client.ts |
| Settings routes | apps/web/src/routes/settings/*.tsx |
| Enterprise sidebar | apps/web/src/components/enterprise-sidebar.tsx |
| Settings layout | apps/web/src/components/settings-layout.tsx |

---

## 9. Commands for Verification

```bash
# Start development servers
bun run dev

# Check if backend is running
curl http://localhost:3000/rpc/healthCheck

# Test dashboard overview (requires auth cookie)
curl -X POST http://localhost:3000/rpc/dashboard/overview \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=[SESSION_TOKEN]" \
  -d '{"timeRange": "30d"}'

# Check database connection
bun run db:studio

# Run type checking
bun run typecheck
```

---

## 10. Summary

| Category | Finding |
|----------|---------|
| EnhancedDashboard Icon Issue | **ALREADY FIXED** in codebase |
| Dashboard API Procedures | **EXIST** and properly defined |
| User Auto-Creation | **WORKS** - sets active status and admin/super_admin role |
| Settings Routes | **EXIST** and properly configured |
| Remaining Issues | Need runtime investigation - code appears correct |

**Next Step**: Run the application and capture actual runtime errors to identify the true root causes.

---

*Analysis completed following GK-NEXUS-COMPLETE-PROTOCOL.md Phase 1 requirements.*
