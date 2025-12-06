# GK-Nexus AI Assistant Rules

> **CRITICAL:** Read this file COMPLETELY before making ANY changes to the codebase.

---

## Current Status (Updated December 2025)

### ✅ Recently Fixed
- **ALL ROUTERS FLATTENED** - Complete migration to flat oRPC pattern
  - AI router (17 procedures: `aiClassifyDocument`, `aiGetSystemHealth`, etc.)
  - Backup router (14 procedures: `backupCreate`, `backupList`, etc.)
  - Immigration router (12 procedures)
  - Property-management router (27 procedures)
  - Training router (18 procedures)
  - Expediting router (14 procedures)
  - Local-content router (20 procedures)
  - Partner-network router (33 procedures)
  - OCR router (7 procedures)
  - GRA-integration router (6 procedures)
  - Service-catalog router (spread - flat internally)
- Square icon import (time-tracking/dashboard.tsx)
- Disabled routers (audit, rbac) - now re-enabled
- Nested ternaries - refactored to helper functions
- Array index keys - using unique identifiers
- Accessibility issues - div onClick → button

### ⚠️ Current Priority
- `client-onboarding-wizard.tsx:1216` - `handleSubmit` complexity 18 (max 15)
- API TS7056 warnings (type serialization limits) - code runs correctly

### 📊 System Stats (Dec 2025)
- **Route files:** 75 (all working)
- **API endpoints:** 313 (flat pattern)
- **TypeScript errors:** 0 (reduced from 1,217 → 0, 100% fixed)
- **Server status:** Both web (3001) and API (3000) verified working
- **Tax rates:** Verified against official GRA sources Dec 2025

---

## Part 1: Tech Stack Enforcement (DO NOT SUBSTITUTE)

This project uses **Better-T-Stack**. These technologies are NON-NEGOTIABLE:

| Layer | Required | ❌ DO NOT USE |
|-------|----------|---------------|
| Runtime | **Bun** | Node.js, Deno |
| Frontend | **React 19 + TanStack Router** | Next.js, React Router, Remix |
| Backend | **Hono** | Express, Fastify, Koa |
| API Layer | **oRPC** | tRPC, REST, GraphQL |
| Auth | **Better-auth** | NextAuth, Clerk, Auth0 |
| Database | **Drizzle ORM + PostgreSQL** | Prisma, TypeORM, Sequelize |
| Styling | **TailwindCSS + shadcn/ui** | CSS Modules, Styled Components |
| Linting | **Ultracite (Biome)** | ESLint, Prettier |

**Rule:** If you're reaching for a different technology, STOP and ask why.

---

## Part 2: Bug Patterns to Avoid

These bugs were found and fixed. Learn from them - don't repeat them.

### Pattern #1: Missing Lucide Icon Imports ✅ FIXED

**What went wrong:** Used `Square` icon without importing it.

```tsx
// ❌ WRONG - icon used but not imported
import { Calendar, Clock, Play } from "lucide-react";
<Square className="h-4 w-4" />  // ReferenceError!

// ✅ CORRECT - always import what you use
import { Calendar, Clock, Play, Square } from "lucide-react";
<Square className="h-4 w-4" />
```

**Prevention:** Check https://lucide.dev/icons and verify imports before using.

---

### Pattern #2: Nested Ternaries ✅ FIXED

**What went wrong:** Complex nested ternaries failed Biome linting.

```tsx
// ❌ WRONG - nested ternary
className={index < current ? "bg-primary" : index === current ? "bg-primary/20" : "bg-muted"}

// ✅ CORRECT - helper function
const getStepClass = (index: number) => {
  if (index < currentStep) return "bg-primary text-primary-foreground";
  if (index === currentStep) return "border-2 border-primary bg-primary/20";
  return "bg-muted text-muted-foreground";
};

className={getStepClass(index)}
```

---

### Pattern #3: Array Index as Key ✅ FIXED

**What went wrong:** Using array index as React key.

```tsx
// ❌ WRONG
{steps.map((step, index) => (
  <div key={index}>  // Bad - index can change

// ✅ CORRECT
{steps.map((step) => (
  <div key={step.title}>  // Good - stable unique identifier
```

---

### Pattern #4: Div with onClick ✅ FIXED

**What went wrong:** Non-interactive element with click handler (accessibility issue).

```tsx
// ❌ WRONG - div is not interactive
<div onClick={handleClick} className="cursor-pointer">

// ✅ CORRECT - button is interactive
<button onClick={handleClick} type="button" className="cursor-pointer">
```

---

### Pattern #5: Interface vs Type ✅ FIXED

**What went wrong:** Biome prefers `type` over `interface` for object types.

```tsx
// ❌ Biome warning
interface TimeEntry {
  id: string;
  project: string;
}

// ✅ Preferred
type TimeEntry = {
  id: string;
  project: string;
};
```

---

### Pattern #6: Regex in Render

**What went wrong:** Creating regex inside component (recreated each render).

```tsx
// ❌ WRONG - regex created on every render
const isValid = /^[0-9]{3}-[0-9]{6}$/.test(value);

// ✅ CORRECT - regex at module level
const TIN_REGEX = /^[0-9]{3}-[0-9]{6}$/;
// In component:
const isValid = TIN_REGEX.test(value);
```

---

## Part 3: Current Issue

### ⚠️ Excessive Complexity in handleSubmit

**File:** `apps/web/src/components/client-onboarding-wizard.tsx`  
**Line:** 1216  
**Issue:** Complexity score 18 (max: 15)

**Why it happens:** Large form submission handler with multiple validation steps and API calls.

**Fix approach:** Extract sub-functions:
```typescript
// Break into smaller functions
const validateFormData = async () => { ... };
const prepareClientData = () => { ... };
const submitToAPI = async (data) => { ... };
const handleSuccess = () => { ... };
const handleError = (error) => { ... };

const handleSubmit = async () => {
  const validated = await validateFormData();
  if (!validated) return;
  
  const clientData = prepareClientData();
  await submitToAPI(clientData);
  handleSuccess();
};
```

---

## Part 4: Base Scaffold Canonical Patterns

### Navigation Pattern

```tsx
// Use TanStack Router's Link directly
import { Link } from "@tanstack/react-router";

// For navigation items
<Link to="/dashboard" className="...">Dashboard</Link>

// For expandable parents (no navigation, just expand)
<button onClick={() => toggle()} type="button">
  <span>Section Name</span>
  <ChevronDown />
</button>
```

### Route Definition Pattern

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

### oRPC Router Pattern (MUST BE FLAT)

**CRITICAL:** Use FLAT routers like base scaffold. Nested routers cause type issues and broken functionality.

```typescript
// packages/api/src/routers/index.ts - CORRECT (FLAT)
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  
  // FLAT - prefixed naming
  clientCreate,
  clientGetById,
  clientList,
  clientContactList,
  clientContactCreate,
  
  dashboardOverview,
  dashboardStats,
  
  taxCalculatePAYE,
  taxFilingCreate,
};

// Frontend usage (FLAT)
await client.clientCreate({ ... });
await client.dashboardOverview();
await client.taxCalculatePAYE({ income: 100000 });
```

**Naming Convention:** `domainAction` (e.g., `clientCreate`, `taxCalculatePAYE`, `documentUpload`)

### Error Handling Pattern

```typescript
// Server - use ORPCError
import { ORPCError } from "@orpc/server";

if (!user) {
  throw new ORPCError("UNAUTHORIZED", "Authentication required");
}

// Client - toast notification (handled globally in QueryClient)
```

---

## Part 5: Guyana-Specific Requirements

### 2025 GRA Tax Rates (Verified Dec 2025)

| Tax | Rate | Notes |
|-----|------|-------|
| PAYE | 0% / 25% / 35% | First GYD 130,000/month exempt, 25% from 130,001-260,000, 35% above 260,000 |
| NIS Employee | 5.6% | Monthly ceiling GYD 280,000 |
| NIS Employer | 8.4% | Monthly ceiling GYD 280,000 |
| VAT | 14% | Standard rate (registration threshold: GYD 15M/year) |
| Child Allowance | GYD 120,000/year per child | Max 3 children |
| Overtime Exemption | First GYD 50,000 | From overtime/second job is tax-free |

### Filing Deadlines

| Filing | Deadline |
|--------|----------|
| PAYE/NIS | 14th of following month |
| VAT | 21st of following month |
| Corporate Tax | March 31 |
| Personal Tax | April 30 |

---

## Part 6: Commands

```bash
# Development
bun run dev              # Start all
bun run dev:server       # Server only (port 3000)
bun run dev:web          # Web only (port 3001)

# Linting (ALWAYS run before committing)
npx ultracite fix        # Auto-fix
npx ultracite check      # Check only

# Database
bun run db:push          # Push schema
bun run db:studio        # Open studio (port 4983)

# Testing
npx playwright test      # E2E tests
```

### Credentials

- **Email:** admin@gk-nexus.com
- **Password:** Admin123!@#

---

## Part 7: DO NOT / DO Rules

### ❌ DO NOT

- Substitute technologies
- Use nested ternaries (use helper functions)
- Use array index as React key
- Use div with onClick (use button)
- Use interface (prefer type)
- Create regex inside components
- Skip manual browser testing
- Use `force: true` in tests
- Use `@ts-ignore`

### ✅ DO

- Run `bun run dev` before starting
- Run `npx ultracite fix` before committing
- Test in browser after every change
- Check console for errors
- Follow existing patterns
- Use helper functions for complex logic
- Use unique identifiers for keys

---

## Part 8: Verification Checklist

Before marking ANY task complete:

- [ ] `bun run dev` starts without errors
- [ ] `npx ultracite check` passes (or only shows known complexity warning)
- [ ] Browser console shows no red errors
- [ ] Feature works when tested manually
- [ ] Login/logout still works
- [ ] Dashboard loads correctly
