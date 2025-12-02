# GK-Nexus Complete Audit & Fix Protocol v2.2

> **MANDATORY**: Read this ENTIRE document before ANY action. This is version 2.2 with UX/UI quality standards for non-technical users.

---

# PART 1: BUSINESS CONTEXT

## What is GK-Nexus?

GK-Nexus Suite is a **unified business management platform** for two related Guyanese businesses:

### 1. Green Crescent Management Consultancy (GCMC)

| Service Category | Specific Services |
|------------------|-------------------|
| **Training** | HR Management, Customer Relations, Co-operatives & Credit Unions, Organizational Management |
| **Small Business Development** | Company Incorporation, Business Registration |
| **Paralegal Services** | Affidavits, Sale/Purchase Agreements, Wills, Settlement Agreements, Separation Agreements, Investment & Partnership Agreements |
| **Immigration** | Work Permits, Citizenship Applications, Business Visas |
| **Business Proposals** | Land Occupation, Investment Proposals, Startup Business Plans |
| **Networking/Referrals** | Real Estate Agencies, IT Technicians, Law Firms |

### 2. KAJ Financial Services (GRA Licensed Accountant)

| Service Category | Specific Services |
|------------------|-------------------|
| **Tax Returns** | Individual Income Tax, Corporate Tax |
| **Compliances** | Tender, Work Permit, Land Transfer, Liability (Firearm), Pension, Certificate of Assessments |
| **PAYE** | Monthly Returns, Form 7B Generation, Employee Tax Slips |
| **Financial Statements** | Bank Accounts, Police Commissioner (Firearm), Loans, Investments, Cash Flow Projections |
| **Auditing** | NGO Audits, Co-operative Societies Audits |
| **NIS (National Insurance)** | Registrations, Contribution Schedules, Compliances, Pension Queries |

---

# PART 2: TECHNICAL STACK (STRICTLY ENFORCED)

## Better-T-Stack Foundation - DO NOT DEVIATE

| Layer | Correct Technology | WRONG (Do Not Use) |
|-------|-------------------|-------------------|
| **Frontend** | React 19 + TanStack Router | Next.js, Remix |
| **Styling** | TailwindCSS + shadcn/ui + Radix | Material UI, Chakra |
| **Backend** | Hono.js | Express, Fastify |
| **API** | oRPC | tRPC, REST |
| **Auth** | Better-auth | NextAuth, Clerk |
| **Database** | PostgreSQL + Drizzle ORM | Prisma, Mongoose |
| **Build** | Vite + Turbo monorepo | Webpack |
| **Runtime** | Bun | npm, yarn |
| **Linting** | Ultracite (Biome) | ESLint |
| **Icons** | Lucide React | Font Awesome, Heroicons |

## Monorepo Structure

```
GK-Nexus/
├── apps/
│   ├── web/                          # React 19 frontend (port 3001)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── ui/               # shadcn/ui base components
│   │   │   │   └── enhanced-dashboard.tsx
│   │   │   ├── routes/               # TanStack Router pages
│   │   │   ├── utils/
│   │   │   │   └── orpc.ts           # oRPC client setup
│   │   │   └── lib/
│   │   │       └── auth-client.ts
│   │   └── package.json
│   └── server/                       # Hono.js backend (port 3000)
├── packages/
│   ├── api/                          # Business logic & API routers
│   │   └── src/
│   │       ├── routers/
│   │       ├── middleware/
│   │       ├── business-logic/
│   │       ├── context.ts
│   │       └── index.ts
│   ├── auth/
│   └── db/
├── tests/
├── .claude/
└── docker-compose.yml
```

---

# PART 3: KNOWN ISSUES & PATTERNS (From Production Debugging)

## Issue Pattern 1: oRPC Nested Routers Don't Work

**Symptom**: `orpc.serviceCatalog.services.list is not a function`

**Root Cause**: oRPC doesn't support nested plain objects in routers.

**WRONG Pattern**:
```typescript
export const serviceCatalogRouter = {
  services: {           // Nested object - BROKEN
    list: procedure...,
    create: procedure...,
  },
  projects: {
    list: procedure...,
  }
}
```

**CORRECT Pattern**:
```typescript
export const serviceCatalogRouter = {
  servicesList: procedure...,      // Flat structure
  servicesCreate: procedure...,
  projectsList: procedure...,
}
```

**Frontend must match**:
```typescript
// WRONG
orpc.serviceCatalog.services.list()

// CORRECT
orpc.serviceCatalog.servicesList()
```

## Issue Pattern 2: User ID vs Email Mismatch

**Symptom**: 401 Unauthorized on all API calls after successful login

**Root Cause**: Better-auth creates user with ID "X", but users table has same email with different ID "Y". Context lookup by ID fails, insert by email fails (duplicate).

**Fix**: In `context.ts`, lookup user by BOTH id AND email:
```typescript
// First try by ID
let dbUser = await db.select()...where(eq(users.id, session.user.id));

// If not found, try by email
if (!dbUser[0]) {
  dbUser = await db.select()...where(eq(users.email, session.user.email));
}

// Only insert if neither found
if (!dbUser[0]) {
  // Insert new user
}
```

## Issue Pattern 3: Wrong Package Import Casing

**Symptom**: `Cannot find module '@gknexus/db'`

**Root Cause**: Package name is `@GK-Nexus/db` (with capitals), but import uses `@gknexus/db`.

**Fix**: Always use exact package name from package.json:
```typescript
// WRONG
import { db } from "@gknexus/db";

// CORRECT
import { db } from "@GK-Nexus/db";
```

## Issue Pattern 4: 500 vs 401 Error Interpretation

| Error Code | Meaning | Debug Location |
|------------|---------|----------------|
| **401 Unauthorized** | Auth/session problem | Check context.ts, auth middleware |
| **400 Bad Request** | Input validation failed | Check Zod schemas, frontend payload |
| **500 Internal Server Error** | Backend handler crashed | Check SERVER LOGS (not browser) |

**CRITICAL**: For 500 errors, always check `turbo dev` terminal output for stack trace, NOT browser console.

## Issue Pattern 5: Ultracite Linter Interference

**Symptom**: Multi-line file edits get corrupted/mangled

**Root Cause**: `.claude/settings.json` has PostToolUse hook that runs `npx ultracite fix` after every edit.

**Workarounds**:
1. Temporarily disable hook in settings.json
2. Use full file replacement instead of incremental edits
3. Use bash `sed` commands which bypass the hook

## Issue Pattern 6: Invalid Lucide Icon Names

**Symptom**: ReferenceError: [IconName] is not defined

**Known Invalid Icons Found**:
- `FileType` → Use `File` or `FileText`
- `CheckCircle` → Use `CheckCircle2`
- `Stop` → Use `Ban` or `XCircle`
- `Building` → Use `Building2`

**Prevention**: Always verify icons at https://lucide.dev/icons/ before using.

**Quick Fix Pattern**:
```bash
grep -rn "from \"lucide-react\"" apps/web/src/routes/ | head -20
```

---

# PART 4: UI/UX QUALITY STANDARDS (Basic)

## Modal/Dialog Requirements

All modals MUST have:
- [ ] Proper backdrop/overlay (semi-transparent background)
- [ ] Centered positioning
- [ ] Close button (X) in top-right
- [ ] Click-outside-to-close behavior
- [ ] Escape key to close
- [ ] Focus trap (tab stays within modal)
- [ ] Proper z-index (above all content)
- [ ] Responsive sizing (max-width with padding on mobile)

**WRONG** (inline expansion):
```tsx
{showDetails && <div className="absolute">{/* content */}</div>}
```

**CORRECT** (proper modal):
```tsx
<Dialog open={showDetails} onOpenChange={setShowDetails}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Client Details</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

## Mobile Responsiveness Requirements

Test at these breakpoints:
- **Mobile**: 375px (iPhone SE)
- **Mobile Large**: 428px (iPhone 14 Pro Max)
- **Tablet**: 768px (iPad)
- **Desktop**: 1024px+

Every page MUST:
- [ ] Have no horizontal scroll at any breakpoint
- [ ] Have readable text (min 14px on mobile)
- [ ] Have tappable targets (min 44x44px on mobile)
- [ ] Collapse sidebar to hamburger menu on mobile
- [ ] Stack columns vertically on mobile
- [ ] Hide non-essential elements on mobile

## Component Quality Checklist

For EVERY interactive component:
- [ ] Has hover state
- [ ] Has focus state (keyboard navigation)
- [ ] Has disabled state (if applicable)
- [ ] Has loading state (if async)
- [ ] Has error state (if can fail)
- [ ] Has empty state (if can be empty)

---

# PART 5: SYSTEMATIC AUDIT PROTOCOL

## Phase 0: Confirmation Checkpoint

**Answer these questions before proceeding:**

1. How many phases are in this protocol?
2. What documents must be created before any fixing?
3. What is required to mark an issue as "fixed"?
4. What mode must Playwright tests run in?
5. Where do you check for 500 error details?

**Note**: There are 6 phases. Phase 2 has Step 2.0 (fix crashes) before Step 2.1 (audit UI).

## Phase 1: Codebase Discovery

### Step 1.1: Run Discovery Commands

```bash
# Project overview
find . -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" | wc -l

# Structure check
ls -la apps/
ls -la packages/api/src/routers/
ls -la packages/db/src/schema/
ls -la apps/web/src/routes/
```

### Step 1.2: Read Critical Files

```bash
cat packages/api/src/routers/index.ts
cat packages/api/src/context.ts
cat packages/api/src/middleware/rbac.ts
cat apps/web/src/utils/orpc.ts
```

### Step 1.3: Create ANALYSIS.md

Document:
- All routers and their status
- API procedures expected vs actual
- User/auth configuration
- Identified issues prioritized (P0/P1/P2/P3)

**STOP. Wait for user confirmation before Phase 2.**

---

## Phase 2: Comprehensive UI/UX Audit

### Step 2.0: Fix Page-Breaking Errors First

**Before auditing UI, ensure all pages RENDER.**

Check for undefined component errors in browser console.
Common patterns:
- "X is not defined" = missing import
- "X is not a function" = wrong API structure
- Page shows error boundary = component crashed

**Priority order**:
1. Fix ReferenceErrors (pages won't load at all)
2. Fix API 500/400 errors (pages load but no data)
3. Then audit UI/UX (styling, modals, responsiveness)

### Step 2.1: Page-by-Page Audit

For EVERY route in the app, document:

```markdown
## Page: /dashboard

### Desktop (1920x1080)
- [ ] Loads without errors
- [ ] All data displays correctly
- [ ] All buttons clickable
- [ ] All forms functional

### Mobile (375px)
- [ ] No horizontal scroll
- [ ] Sidebar collapses
- [ ] Content readable
- [ ] Buttons tappable

### Console Errors
- [list any errors]

### Broken Interactions
- [list any broken buttons/forms]

### Wizard Audit
- [ ] Does this feature need a wizard? (if multi-step)
- [ ] Is there a progress indicator?
- [ ] Are step titles descriptive?
- [ ] Is there a review step before submission?
- [ ] Does validation prevent advancing with errors?
- [ ] Are there keyboard shortcuts?

### Template Audit
- [ ] Does this feature need templates? (if repetitive)
- [ ] Are templates easy to find?
- [ ] Can user start from scratch?
- [ ] Are template descriptions helpful?

### Intuitiveness Check
- [ ] Can a non-technical user understand this in 3 seconds?
- [ ] Is the primary action obvious?
- [ ] Are empty states helpful?
- [ ] Do forms have clear labels and validation?

### GRA Integration Readiness
- [ ] Are TIN/NIS/VAT fields captured correctly?
- [ ] Is data formatted for GRA submission?
- [ ] Are required documents listed per service?
```

### Step 2.2: Component Audit

Test EVERY:
- Modal/Dialog
- Dropdown menu
- Form submission
- Button click
- Link navigation
- Tab switching

### Step 2.3: Create UI-AUDIT.md

```markdown
# UI/UX Audit Report

## Summary
- Total pages audited: X
- Pages with errors: X
- Broken modals: X
- Mobile issues: X

## Critical Issues (P0)
[list]

## High Priority (P1)
[list]

## Medium Priority (P2)
[list]

## Low Priority (P3)
[list]
```

**STOP. Wait for user confirmation before Phase 3.**

---

## Phase 3: Server-Side Error Investigation

### Step 3.1: Check Server Logs

For ANY 500 error, check the turbo dev terminal output:

```bash
# View recent server output
# Look for stack traces, error messages
```

### Step 3.2: Database Verification

```bash
# Check if tables exist
bun run db:studio

# Verify schema is pushed
bun run db:push
```

### Step 3.3: Test API Directly

```bash
# Test endpoint with curl
curl -X POST http://localhost:3000/rpc/dashboard/overview \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=[TOKEN]" \
  -d '{"timeRange": "30d"}'
```

---

## Phase 4: Systematic Fixes

### Fix Template

```
================================================================================
FIX #[N]: [Issue Title]
================================================================================

REFERENCE: [Console error / Audit finding]
PRIORITY: P0/P1/P2/P3
FILE(S): [paths]

--------------------------------------------------------------------------------
CURRENT BROKEN CODE:
--------------------------------------------------------------------------------
[paste broken code]

--------------------------------------------------------------------------------
ROOT CAUSE ANALYSIS:
--------------------------------------------------------------------------------
[explain WHY]

--------------------------------------------------------------------------------
FIXED CODE:
--------------------------------------------------------------------------------
[paste fixed code]

--------------------------------------------------------------------------------
VERIFICATION:
--------------------------------------------------------------------------------
Command: [exact command]
Output: [paste actual output]

================================================================================
WAITING FOR USER CONFIRMATION
================================================================================
```

### Fix Priority Order

1. **P0 - Critical**: App crashes, can't login, data loss
2. **P1 - High**: Major feature broken, 500 errors
3. **P2 - Medium**: UI/UX issues, minor features broken
4. **P3 - Low**: Polish, warnings, enhancements

---

## Phase 5: Real Browser Testing

### Playwright Config (HEADED MODE)

```typescript
// playwright.userflow.config.ts
export default defineConfig({
  use: {
    headless: false,      // MUST SEE BROWSER
    slowMo: 300,
    video: "on",
    screenshot: "on",
    viewport: { width: 1920, height: 1080 },
  },
});
```

### Mobile Testing

```typescript
// Test mobile viewport
{
  name: "Mobile Chrome",
  use: {
    ...devices["Pixel 5"],
    headless: false,
  },
}
```

### Run Tests

```bash
# Desktop
npx playwright test --headed

# Mobile
npx playwright test --project="Mobile Chrome" --headed
```

---

## Phase 6: Final Verification

### Checklist

```markdown
## Core Functionality
- [ ] Login works
- [ ] Dashboard loads with real data (not fallback)
- [ ] All sidebar navigation works
- [ ] All sub-menus work

## API Status
- [ ] No 401 errors
- [ ] No 500 errors
- [ ] No 400 errors
- [ ] No "is not a function" errors

## UI/UX Quality
- [ ] All modals open/close properly
- [ ] All forms submit successfully
- [ ] All buttons respond
- [ ] Mobile layout works

## Pages Verified
- [ ] /dashboard
- [ ] /clients
- [ ] /tax/*
- [ ] /payroll
- [ ] /documents
- [ ] /compliance
- [ ] /invoices
- [ ] /users
- [ ] /settings/*
- [ ] /property-management
- [ ] /expediting
- [ ] /training
- [ ] /local-content
- [ ] /partner-network
- [ ] /service-catalog
```

---

# PART 6: PARALLEL EXECUTION

## Enable Parallel Tool Calls

For faster execution, batch independent operations:

```
You can run multiple operations in parallel:
- Update multiple files simultaneously
- Run multiple search/read operations at once
- Execute independent bash commands in parallel
```

## Batch Replacements

Instead of sequential edits, use batch sed:

```bash
# Replace multiple patterns at once
sed -i '
  s/serviceCatalog\.services\.list/serviceCatalog.servicesList/g
  s/serviceCatalog\.services\.create/serviceCatalog.servicesCreate/g
  s/serviceCatalog\.projects\.list/serviceCatalog.projectsList/g
' apps/web/src/routes/service-catalog.tsx
```

---

# PART 7: CODE STANDARDS

## Lucide Icon Rules

**VALID Icons**:
```typescript
import {
  User, Users, Building2, Calculator, FileText,
  DollarSign, Check, X, ChevronRight, Home,
  Settings, Bell, Calendar, BarChart3, PieChart
} from "lucide-react";
```

**INVALID Icons** (will crash):
```
Stop, Building, CheckIcon, XIcon, FilePdf, Print,
Scales, Target, CircleIcon, ChevronRightIcon, FileType, CheckCircle
```

Always verify at: https://lucide.dev/icons/

## Ultracite/Biome Rules

- Use `const` by default
- Use arrow functions for callbacks
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Remove `console.log` from production

---

# PART 8: QUICK REFERENCE

## Commands

```bash
# Development
bun run dev                    # All services
bun run dev:web               # Frontend only
bun run dev:server            # Backend only

# Database
bun run db:push               # Push schema
bun run db:studio             # Open GUI
bun run db:seed               # Seed data

# Testing
npx playwright test --headed  # Visible browser
npx playwright test --debug   # Debug mode

# Build
bun run build                 # Full build
bun run typecheck             # Type check
```

## Default Credentials

```
Email: admin@gk-nexus.com
Password: Admin123!@#
```

## Ports

```
Frontend: http://localhost:3001
Backend:  http://localhost:3000
Docs:     http://localhost:4321
```

## Valid Lucide Icons (Commonly Used)

**ALWAYS VALID**:
```
Check, X, Plus, Minus, Search, Settings,
User, Users, Home, FileText, File, Folder,
Calendar, Clock, Bell, Mail, Phone,
ChevronLeft, ChevronRight, ChevronUp, ChevronDown,
ArrowLeft, ArrowRight, ArrowUp, ArrowDown,
Edit, Trash2, Copy, Download, Upload,
Eye, EyeOff, Lock, Unlock,
CheckCircle2, XCircle, AlertCircle, Info,
Building2, Briefcase, DollarSign, CreditCard,
BarChart3, PieChart, TrendingUp, TrendingDown
```

**INVALID (will crash)**:
```
FileType, CheckCircle, Stop, Building, Print, Scales
```

---

# PART 9: ENFORCEMENT RULES

## Absolute Rules

1. **NO fixing before ANALYSIS.md is complete**
2. **NO fixing before UI-AUDIT.md is complete**
3. **NO claiming "fixed" without verification output**
4. **NO moving to next issue without user confirmation**
5. **ONE issue at a time, in priority order**
6. **Check SERVER LOGS for 500 errors, not browser**
7. **Test at MOBILE viewport, not just desktop**
8. **Use FLAT router structure for oRPC**
9. **Verify Lucide icons before using**

## If You Get Stuck

1. Show what you've tried
2. Show the exact error
3. Check SERVER logs for 500s
4. Ask user for guidance
5. DO NOT make random changes

---

# PART 10: REFERENCE ARCHITECTURE

## 10.1 App Factory Pattern

Create apps via factory function for testability:

```typescript
// packages/api/src/lib/create-app.ts
export function createApp() {
  const app = new Hono();
  // middleware, routes
  return app;
}
```

## 10.2 drizzle-zod Integration

Generate Zod schemas directly from DB tables to prevent schema drift:

```typescript
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { users } from "./schema";

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
export const selectUserSchema = createSelectSchema(users);
```

## 10.3 Route Separation Pattern

Separate route config from handler:

```
routes/
└── users/
    ├── users.routes.ts   # OpenAPI/oRPC contract
    ├── users.handlers.ts # Implementation
    └── users.index.ts    # Router export
```

## 10.4 Structured Error Responses

All errors must return JSON, never HTML:

```typescript
app.onError((err, c) => {
  return c.json({
    error: err.message,
    code: "INTERNAL_ERROR"
  }, 500);
});

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});
```

## 10.5 Environment Validation

Fail fast on missing env vars using Zod to parse process.env.

---

# PART 11: UX/UI QUALITY STANDARDS (MANDATORY)

> **CRITICAL**: This app is for accountants and consultants who are NOT technical users. Everything must be intuitive and guide users through complex processes.

## 11.1 Navigation Principles

- Maximum 2 clicks to reach any feature
- Sidebar shows current location (highlighted active state)
- Breadcrumbs on nested pages (Settings > Users > Edit User)
- Back buttons where context matters
- Search/filter on all list pages
- Related features grouped logically

## 11.2 Wizard Architecture (REQUIRED for multi-step processes)

### Wizard Pattern (Based on Client Onboarding)

All multi-step processes MUST follow this architecture:

```
feature-wizard.tsx              <- Main orchestrator (state, validation, navigation)
├── wizard-context.ts           <- Shared state via React Context
├── Step1_[Name].tsx            <- First logical step
├── Step2_[Name].tsx            <- Second step
├── Step3_[Name].tsx            <- etc.
└── StepN_Review.tsx            <- Always end with Review step
```

### Wizard Requirements

1. Progress Indicator: Visual step bar showing current/completed/remaining
2. Step Titles: Descriptive names ("Client Information" not "Step 1")
3. Per-Step Validation: validateStep(stepNumber) before advancing
4. Conditional Fields: Adapt based on type/category selection
5. Keyboard Navigation:
   - Escape: Close dialog
   - Ctrl+Enter: Next step or submit
   - Alt+Arrow: Navigate steps
6. Review Step: Always show summary before final submission
7. Auto-Save: Persist draft to localStorage (warn on accidental close)
8. Accessibility: Announce step changes for screen readers

### Wizard Data Flow

```typescript
// wizard-context.ts pattern
interface WizardData {
  // Step 1 fields
  // Step 2 fields
  // ...
  uploadedFiles: Record<string, File>;
}

// Parent wizard manages:
// - currentStep state
// - formData state (via context)
// - validateStep(step) function
// - handleNext/handleBack navigation
// - handleSubmit final submission
```

### Processes That MUST Use Wizards

| Feature | Steps | Key Fields |
|---------|-------|------------|
| Client Onboarding | 5 | Type → Contact → ID/KYC → Services → Review |
| Tax Return Filing | 6 | Client → Tax Year → Income → Deductions → Calculate → Review |
| Work Permit Application | 5 | Employer → Employee → Documents → Fees → Review |
| Business Registration | 4 | Type → Details → Directors → Review |
| Invoice Creation | 4 | Client → Services → Payment Terms → Review |
| Compliance Filing | 4 | Type → Details → Documents → Review |
| Payroll Setup | 5 | Company → Employees → Rates → Schedule → Review |

### Step Validation Pattern

```typescript
const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
      // Type-specific validation
      if (formData.type === "INDIVIDUAL") {
        return formData.firstName.length > 1 && formData.surname.length > 1;
      } else {
        return formData.name.length > 2;
      }
    case 2:
      return formData.email.includes("@") && formData.phone.length >= 7;
    case 3:
      // KYC validation for individuals
      if (formData.type === "INDIVIDUAL") {
        return formData.primaryIdType && formData.primaryIdNumber.length > 3;
      }
      return true; // Companies: optional
    case 4:
      return true; // Services optional
    case 5:
      // Re-validate all previous steps
      return validateStep(1) && validateStep(2) && validateStep(3);
  }
};
```

## 11.3 Template System

### Template Requirements

For repetitive tasks, provide pre-built templates:

| Feature | Templates Needed |
|---------|------------------|
| Tax Returns | Individual, Corporate, Partnership, Sole Trader |
| Invoices | Service Invoice, Product Invoice, Recurring, Pro-forma |
| Compliance | Work Permit, Business Registration, Tax Compliance Certificate |
| Documents | Document Request (per service type) |
| Emails | Client Welcome, Document Request, Filing Confirmation |

### Template UI Pattern

```
┌─────────────────────────────────────────┐
│ Choose a Template                       │
├─────────────────────────────────────────┤
│ ○ Individual Tax Return                 │
│   For employed individuals, rental      │
│   income, investment income             │
│                                         │
│ ○ Corporate Tax Return                  │
│   For registered companies, includes    │
│   financial statements                  │
│                                         │
│ ○ Partnership Return                    │
│   For business partnerships             │
│                                         │
│ ○ Start from Scratch                    │
│   Blank form, fill everything manually  │
└─────────────────────────────────────────┘
        [Cancel]  [Use Template]
```

### Template Data Structure

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  prefilledData: Partial<FormData>;
  requiredDocuments: string[];
  estimatedTime: string; // "15 minutes"
}
```

## 11.4 GRA Integration Pre-population

### Government ID Fields (Critical for Guyana)

Client records MUST capture for GRA OPTIMAL integration:

| Field | Format | Used For |
|-------|--------|----------|
| TIN | XX-XXXXX-X | Tax filings, all GRA submissions |
| NIS | XXXXXX | Employee contributions, compliance |
| VAT | XXXXXXXX | VAT returns (if registered) |
| Business Reg | XXXXX/XXXX | Company verification |
| National ID | XXXXXXXXX | Individual identification |

### Auto-Population Flow

1. Client enters TIN → System queries existing data
2. Pre-fill known fields (name, address, prior returns)
3. Flag discrepancies for review
4. Link to GRA OPTIMAL/Padna for real-time validation (future)

## 11.5 Modal/Dialog Standards

ALL popups MUST use shadcn Dialog:

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-[600px]">
    <DialogHeader>
      <DialogTitle>Clear Title</DialogTitle>
      <DialogDescription>What this dialog does</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? <Spinner /> : "Save"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

Requirements:
- Semi-transparent backdrop
- Click outside to close
- Escape key to close
- Focus trapped inside
- Close X button in corner
- Loading state on submit button

WRONG: Inline expansion overlapping content
RIGHT: Proper Dialog with backdrop

## 11.6 Feedback States (REQUIRED on every page)

| State | Implementation |
|-------|----------------|
| Loading | Skeleton loaders OR spinner with text ("Loading clients...") |
| Empty | Icon + message + action button ("No clients yet. Add your first client.") |
| Error | User-friendly message + retry button (NO technical jargon) |
| Success | Toast notification (auto-dismiss after 3s) |
| Saving | Button shows spinner, text changes to "Saving..." |

## 11.7 Form UX Standards

- Labels ABOVE inputs (never placeholder-only)
- Required fields: red asterisk (*)
- Validation errors: inline, below field, in red
- Submit button: loading spinner when processing
- Error messages: plain English ("Email is required" not "validation failed")
- Destructive actions: confirmation dialog
- Long forms: auto-save drafts every 30 seconds
- Field formatting: auto-format phone numbers, TIN, dates

## 11.8 Mobile Requirements (375px minimum)

- Hamburger menu (no persistent sidebar)
- Touch targets: minimum 44x44px
- No horizontal scroll EVER
- Forms stack vertically
- Tables become cards
- Wizards: full-screen steps on mobile
- Bottom sheet for actions (not dropdowns)

## 11.9 Empty States Design

Every list page needs:

```
┌─────────────────────────────────────────┐
│                                         │
│            [Icon: Users]                │
│                                         │
│          No clients yet                 │
│                                         │
│  Add your first client to start         │
│  managing their tax and compliance.     │
│                                         │
│         [+ Add Client]                  │
│                                         │
│  Need help? View our getting started    │
│  guide →                                │
└─────────────────────────────────────────┘
```

## 11.10 Service Catalog Integration

### SERVICE_CATALOG Constant

Maintain a single source of truth for all services:

```typescript
const SERVICE_CATALOG = {
  TAX_SERVICES: {
    name: "Tax Services",
    services: [
      { id: "individual_tax", name: "Individual Tax Return", price: 15000 },
      { id: "corporate_tax", name: "Corporate Tax Return", price: 50000 },
      // ...
    ]
  },
  COMPLIANCE: {
    name: "Compliance Services",
    services: [
      { id: "work_permit", name: "Work Permit Application", price: 25000 },
      // ...
    ]
  }
};
```

### Service Selection UI

- Group by category
- Show price/estimated time
- Multi-select with checkboxes
- Search/filter for large catalogs
- "Popular" or "Recommended" badges

## 11.11 Document Requirements System

### Per-Service Document Checklists

```typescript
const SERVICE_REQUIREMENTS = {
  individual_tax: [
    { id: "id", name: "Valid ID (Passport/National ID)", required: true },
    { id: "tin", name: "TIN Certificate", required: true },
    { id: "income", name: "Income Statements/Pay Slips", required: true },
    { id: "bank", name: "Bank Statements", required: false },
  ],
  work_permit: [
    { id: "passport", name: "Passport (valid 6+ months)", required: true },
    { id: "photos", name: "Passport Photos (2)", required: true },
    { id: "contract", name: "Employment Contract", required: true },
    { id: "qualifications", name: "Qualifications/Certificates", required: true },
  ]
};

const COMMON_REQUIREMENTS = [
  { id: "id", name: "Government-issued ID", required: true },
  { id: "address", name: "Proof of Address", required: false },
];
```

### Document Upload UI

- Drag-and-drop zone
- File type indicators (PDF icon, image icon, etc.)
- Progress bar during upload
- Preview for images/PDFs
- Delete/replace option
- Status: Pending, Uploaded, Verified, Rejected

## 11.12 Accessibility Requirements

- All buttons: visible text or aria-label
- Form inputs: associated labels (htmlFor)
- Color not sole indicator (use icons too)
- Focus states visible for keyboard navigation
- Skip links for screen readers
- Announce dynamic changes (aria-live)

---

# START COMMAND

```
I have read GK-NEXUS-PROTOCOL-V2.2.md completely.

Phase 0 Confirmation:

1. There are 6 phases: Discovery, UI/UX Audit, Server Investigation, Fixes, Browser Testing, Final Verification
   - Phase 2 has Step 2.0 (fix crashes) before Step 2.1 (audit UI)

2. Before fixing, I must create:
   - ANALYSIS.md (codebase structure)
   - UI-AUDIT.md (comprehensive UI/UX audit)
   - NAVIGATION-AUDIT.md (sidebar, wizards, templates)
   - WIZARD-INVENTORY.md (existing/missing wizards)

3. To mark an issue "fixed":
   - Show broken code
   - Explain root cause
   - Show fixed code
   - Run verification command
   - Paste actual output
   - Wait for user confirmation

4. Playwright tests run in HEADED mode (headless: false)

5. For 500 errors, check SERVER LOGS (turbo dev terminal), not browser console

6. All multi-step processes MUST use wizards with review step

7. Non-technical users must understand every page in 3 seconds

Beginning Phase 1: Codebase Discovery...
```

---

*Protocol v2.2 - Updated with comprehensive UX/UI standards for non-technical users*
*Includes: Wizard architecture, template system, GRA integration, accessibility requirements*
