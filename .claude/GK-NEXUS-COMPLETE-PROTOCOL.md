# GK-Nexus Complete Audit & Fix Protocol for Claude Code

> **MANDATORY**: Read this ENTIRE document before ANY action. This contains the complete project context, business requirements, known issues, and systematic fix protocol.

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

## Business Requirements Summary

The platform MUST support:

1. **Multi-service workflow management** - Track cases/jobs across tax, immigration, paralegal, training
2. **Client lifecycle management** - From onboarding through service delivery
3. **Document management** - Store, organize, and track required documents per service type
4. **Compliance tracking** - Deadlines for GRA, NIS, Immigration services
5. **GRA Integration** - OPTIMAL system, eServices, Form 7B, PAYE calculations
6. **Immigration case tracking** - Work permit status, document checklists, expiration alerts
7. **Paralegal document generation** - Templates for affidavits, agreements, wills
8. **Training management** - Course registrations, certifications, scheduling
9. **Invoicing and payments** - Per-service billing
10. **Client portal** - Self-service document upload and status checking

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
│   │   │   ├── components/           # UI components
│   │   │   │   ├── ui/               # shadcn/ui base components
│   │   │   │   ├── tax/              # Tax calculator components
│   │   │   │   ├── documents/        # Document management UI
│   │   │   │   └── enhanced-dashboard.tsx  # Main dashboard (CURRENTLY BROKEN)
│   │   │   ├── routes/               # TanStack Router pages
│   │   │   ├── utils/
│   │   │   │   └── orpc.ts           # oRPC client setup
│   │   │   └── lib/
│   │   │       └── auth-client.ts    # Better-auth client
│   │   └── package.json
│   └── server/                       # Hono.js backend (port 3000)
│       └── src/
│           └── index.ts
├── packages/
│   ├── api/                          # Business logic & API routers
│   │   └── src/
│   │       ├── routers/              # oRPC endpoint definitions
│   │       │   ├── index.ts          # Main router aggregation
│   │       │   ├── dashboard.ts      # Dashboard API
│   │       │   ├── users.ts          # User management API
│   │       │   ├── clients.ts        # Client management API
│   │       │   ├── tax.ts            # Tax calculations API
│   │       │   └── [others].ts
│   │       ├── middleware/
│   │       │   └── rbac.ts           # Role-based access control
│   │       ├── context.ts            # Request context
│   │       └── index.ts              # API exports
│   ├── auth/                         # Better-auth configuration
│   │   └── src/
│   │       └── index.ts
│   └── db/                           # Database layer
│       └── src/
│           ├── schema/               # Drizzle table definitions
│           │   ├── users.ts
│           │   ├── organizations.ts
│           │   ├── clients.ts
│           │   └── [others].ts
│           ├── index.ts              # Schema exports
│           └── seed.ts               # Database seeding
├── tests/                            # Playwright E2E tests
├── docs/                             # Documentation
├── .claude/                          # Claude Code settings
│   └── settings.json                 # PostToolUse hooks for Ultracite
├── CLAUDE.md                         # Ultracite code standards
├── SPECIFICATION.md                  # System specification
└── docker-compose.yml                # PostgreSQL + Redis
```

## Critical File Locations

| What | Location |
|------|----------|
| oRPC client setup | `apps/web/src/utils/orpc.ts` |
| Main router index | `packages/api/src/routers/index.ts` |
| Dashboard router | `packages/api/src/routers/dashboard.ts` |
| Users router | `packages/api/src/routers/users.ts` |
| RBAC middleware | `packages/api/src/middleware/rbac.ts` |
| Request context | `packages/api/src/context.ts` |
| User schema | `packages/db/src/schema/users.ts` |
| EnhancedDashboard | `apps/web/src/components/enhanced-dashboard.tsx` |
| Auth client | `apps/web/src/lib/auth-client.ts` |

---

# PART 3: KNOWN BROKEN STATE (From Console Logs)

## Issue 1: EnhancedDashboard Crash (CRITICAL - P0)

**Console Error:**
```
Error: Element type is invalid: expected a string (for built-in components) 
or a class/function (for composite components) but got: object.
Check the render method of `EnhancedDashboard`.
```

**Root Cause**: Icons stored in localStorage via `JSON.stringify()` lose their function reference. When retrieved, `widget.icon` becomes `{}` instead of a React component.

**Fix Pattern:**
```typescript
// BAD - Storing React components in localStorage
const widgets = [{ icon: DollarSign, ... }];
localStorage.setItem("widgets", JSON.stringify(widgets)); // icon becomes {}

// GOOD - Store icon NAME, use lookup map
const ICON_MAP = {
  DollarSign: DollarSign,
  Users: Users,
  FileText: FileText,
  // ... etc
};

const widgets = [{ iconName: "DollarSign", ... }];
localStorage.setItem("widgets", JSON.stringify(widgets));

// When rendering:
const IconComponent = ICON_MAP[widget.iconName] || DollarSign;
```

**Also Required**: Clear old localStorage
```typescript
localStorage.removeItem("dashboard-widgets"); // Clear corrupted data
```

## Issue 2: API Functions Don't Exist (CRITICAL - P0)

**Console Errors:**
```
TypeError: orpc.dashboard.overview is not a function
TypeError: orpc.dashboard.kpis is not a function
TypeError: orpc.dashboard.financialSummary is not a function
TypeError: orpc.dashboard.complianceReport is not a function
```

**Root Cause**: Either:
1. Dashboard router doesn't export these procedures
2. Dashboard router not properly added to main router in `packages/api/src/routers/index.ts`
3. Procedure names don't match what frontend expects

**Verification Steps:**
```bash
# Check what dashboard router exports
cat packages/api/src/routers/dashboard.ts | grep -E "procedure|export"

# Check main router integration
cat packages/api/src/routers/index.ts | grep -i dashboard
```

## Issue 3: 401 Unauthorized on ALL /rpc/ Calls (CRITICAL - P0)

**Console Errors:**
```
/rpc/users/list - 401
/rpc/users/stats - 401
/rpc/users/rolesAndPermissions - 401
/rpc/privateData - 401
```

**Root Cause**: New users get:
- `role: "read_only"` (default)
- `status: "pending"` (default)

The RBAC middleware blocks "pending" users and "read_only" doesn't have `users.read` permission.

**Fix Options:**
1. Change default status to "active" for development
2. Make first user automatically admin
3. Update seed script to create proper admin user
4. Add development bypass in RBAC middleware

## Issue 4: Settings Sub-menus Don't Work (HIGH - P1)

**Symptom**: Clicking settings sub-menu items does nothing.

**Likely Causes:**
1. Routes not properly defined in TanStack Router
2. Click handlers not wired up
3. Navigation links have wrong paths

## Issue 5: Upload Buttons Not Working (HIGH - P1)

**Symptom**: Upload buttons on various pages don't function.

**Likely Causes:**
1. File input not properly connected
2. Upload mutation not implemented
3. API endpoint missing

## Issue 6: "Loading users..." Never Completes (HIGH - P1)

**Symptom**: Users page stuck on loading state.

**Root Cause**: 401 errors from Issue 3 - API calls failing due to permissions.

---

# PART 4: GRA INTEGRATION REQUIREMENTS

## Guyana Revenue Authority Systems

The platform should integrate with or support:

### 1. OPTIMAL Revenue Management System
- GRA's official tax management platform
- eServices portal: https://eservices.gra.gov.gy/
- Features: Online registration, return filing, payment processing

### 2. GRA Padna App
- Mobile app for taxpayers
- Features: Tax returns filing, income tax calculator, vehicle import calculator
- Document verification via QR codes

### 3. Form 7B Slip Generator
- GRA tool to generate employee tax slips
- Upload employee earnings summary then Generate Form 7B slips
- Required for PAYE compliance

### 4. Key GRA Deadlines
| Filing Type | Deadline |
|-------------|----------|
| Individual Income Tax | April 30th annually |
| PAYE Returns | Monthly (15th of following month) |
| Quarterly payments | April 1, July 1, October 1, December 31 |
| VAT Returns | 15th of following month |

### 5. Required Tax Calculations (2025 Rates)

| Tax Type | Rate/Threshold |
|----------|----------------|
| PAYE | 28% flat rate (first $130,000/month exempt) |
| NIS Employee | 5.6% of insurable earnings |
| NIS Employer | 8.4% of insurable earnings |
| NIS Ceiling | $280,000/month |
| VAT | 14% standard rate |
| Corporate Tax | 25% small company, 40% large company |
| Withholding Tax | Various (10-20% depending on payment type) |

---

# PART 5: FEATURE GAPS & RECOMMENDATIONS

Based on industry best practices from TaxDome, Canopy, eImmigration, and Docketwise:

## Missing Critical Features

### 1. Client Portal (HIGH PRIORITY)
- Self-service document upload
- Case status tracking
- Secure messaging
- Payment history

### 2. Automated Deadline Tracking
- GRA filing deadlines
- Work permit expiration alerts
- Document expiration monitoring (passports, licenses)
- 30/60/90 day advance warnings

### 3. Document Request System
- Customizable checklists per service type
- Automated reminder emails
- Upload status tracking
- Missing document alerts

### 4. Immigration Case Tracking
- Visual timeline/workflow
- Stage progression (Application -> Processing -> Approved/Denied)
- Document requirement checklist per visa type
- Government reference number tracking

### 5. Paralegal Document Templates
- Affidavit templates
- Agreement templates (sale, purchase, partnership)
- Will templates
- Auto-fill from client data

### 6. Training Module
- Course catalog
- Registration management
- Certification tracking
- Attendance records

### 7. Integrated Invoicing
- Per-service pricing
- Retainer tracking
- Payment reminders
- Multiple payment methods

## UI/UX Improvements Needed

### 1. Dashboard Widgets
- Service-type breakdown (Tax, Immigration, Paralegal, Training)
- Upcoming deadlines widget
- Recent activity feed
- Quick action buttons

### 2. Client Overview
- Unified view of all services per client
- Timeline of all interactions
- Document library
- Communication history

### 3. Recommended Navigation Structure

Based on GCMC + KAJ services:

```
CORE SERVICES
├── Dashboard
├── Client Management
├── Tax Services
│   ├── PAYE Calculator
│   ├── VAT Calculator
│   ├── NIS Calculator
│   ├── Tax Filing
│   └── Compliance Certificates
├── Immigration Services
│   ├── Work Permits
│   ├── Citizenship
│   └── Business Visas
├── Paralegal Services
│   ├── Affidavits
│   ├── Agreements
│   └── Wills
└── Training Services
    ├── Courses
    ├── Registrations
    └── Certifications

DOCUMENT & COMPLIANCE
├── Document Center
├── Compliance Hub
└── Invoice Management

OPERATIONS
├── Appointments
├── User Management
└── System Settings
```

---

# PART 6: SYSTEMATIC FIX PROTOCOL

## Phase 0: Confirmation Checkpoint

**STOP - Before proceeding, you MUST answer these questions:**

1. How many phases are in this protocol?
2. What document(s) must be created before any fixing begins?
3. What is required to mark an issue as "fixed"?
4. What mode must Playwright tests run in?
5. What happens if you skip to fixing without completing analysis?

**DO NOT PROCEED until you have answered ALL questions.**

---

## Phase 1: Codebase Discovery

### Step 1.1: Run Discovery Commands

Execute these commands and document ALL output:

```bash
# Project overview
echo "=== FILE COUNT ==="
find . -type f \( -name "*.tsx" -o -name "*.ts" \) | wc -l

echo -e "\n=== APPS STRUCTURE ==="
ls -la apps/
ls -la apps/web/src/
ls -la apps/web/src/components/

echo -e "\n=== PACKAGES STRUCTURE ==="
ls -la packages/
ls -la packages/api/src/routers/
ls -la packages/db/src/schema/

echo -e "\n=== ROUTES STRUCTURE ==="
ls -la apps/web/src/routes/
```

### Step 1.2: Read Critical Files

You MUST read these files IN FULL before any fixing:

```bash
# API Layer
cat packages/api/src/routers/index.ts
cat packages/api/src/routers/dashboard.ts
cat packages/api/src/context.ts
cat packages/api/src/middleware/rbac.ts

# Database Layer
cat packages/db/src/schema/users.ts

# Frontend Layer
cat apps/web/src/utils/orpc.ts
cat apps/web/src/components/enhanced-dashboard.tsx
```

### Step 1.3: Create ANALYSIS.md

You MUST create this document with your findings:

```markdown
# GK-Nexus Codebase Analysis
Generated: [timestamp]

## 1. API Router Status

| Router File | Imported in index.ts | Procedures Found | Issues |
|-------------|---------------------|------------------|--------|
| dashboard.ts | YES/NO | [list them] | [list] |
| users.ts | YES/NO | [list them] | [list] |
| clients.ts | YES/NO | [list them] | [list] |
| [etc...] | | | |

## 2. Dashboard Procedures - Expected vs Actual

| Frontend Expects | Router Has It | Signature Matches | Notes |
|------------------|---------------|-------------------|-------|
| dashboard.overview | YES/NO | YES/NO | |
| dashboard.kpis | YES/NO | YES/NO | |
| dashboard.financialSummary | YES/NO | YES/NO | |
| dashboard.complianceReport | YES/NO | YES/NO | |

## 3. User/Auth Configuration

- Default role assigned to new users: [value]
- Default status assigned to new users: [value]
- Seed script creates admin: YES/NO
- RBAC middleware behavior for pending users: [describe]

## 4. EnhancedDashboard Analysis

- Uses localStorage for widgets: YES/NO
- Stores icon components directly: YES/NO
- Has icon lookup map: YES/NO
- localStorage key used: [value]

## 5. All Identified Issues (Prioritized)

### P0 - Critical (Prevents Usage)
1. [Issue]: [Root cause]
2. ...

### P1 - High (Major Feature Broken)
1. [Issue]: [Root cause]
2. ...

### P2 - Medium (Minor Feature Broken)
1. ...

### P3 - Low (Polish/Enhancement)
1. ...
```

### Phase 1 Checkpoint

**STOP HERE. Do not proceed to Phase 2 until:**
- [ ] All discovery commands have been run
- [ ] All critical files have been read
- [ ] ANALYSIS.md has been created and shown to user
- [ ] User has confirmed findings

---

## Phase 2: Systematic Fixes (One at a Time)

### Fix Template

For EVERY fix, use this EXACT format:

```
================================================================================
FIX #[N]: [Issue Title]
================================================================================

REFERENCE: [Which console error or audit finding]
PRIORITY: P0/P1/P2/P3
FILE(S): [exact path(s)]

--------------------------------------------------------------------------------
CURRENT BROKEN CODE:
--------------------------------------------------------------------------------
[paste the exact broken code from the file]

--------------------------------------------------------------------------------
ROOT CAUSE ANALYSIS:
--------------------------------------------------------------------------------
[Explain WHY this code is broken - be specific]

--------------------------------------------------------------------------------
FIXED CODE:
--------------------------------------------------------------------------------
[paste the complete fixed code]

--------------------------------------------------------------------------------
VERIFICATION COMMAND:
--------------------------------------------------------------------------------
[exact command to verify the fix works]

--------------------------------------------------------------------------------
VERIFICATION OUTPUT:
--------------------------------------------------------------------------------
[paste the ACTUAL output from running the verification command]

================================================================================
WAITING FOR USER CONFIRMATION before proceeding to next fix...
================================================================================
```

### Fix Order (Strictly Follow)

1. **FIX #1**: EnhancedDashboard icon serialization crash (P0)
2. **FIX #2**: Dashboard API procedures don't exist (P0)
3. **FIX #3**: 401 Unauthorized - user permissions (P0)
4. **FIX #4**: Settings sub-menus not working (P1)
5. **FIX #5**: Upload buttons not functional (P1)
6. **FIX #6**: Users page infinite loading (P1)
7. [Continue with any issues found in ANALYSIS.md]

---

## Phase 3: Real Browser Testing (HEADED MODE)

### Step 3.1: Create Playwright Config

```typescript
// playwright.userflow.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/userflows",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3001",
    headless: false,        // MUST BE FALSE - User needs to see browser
    slowMo: 300,            // Slow down for visibility
    video: "on",
    screenshot: "on",
    trace: "on",
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
```

### Step 3.2: Create Navigation Test

```typescript
// tests/userflows/01-navigation.spec.ts
import { test, expect } from "@playwright/test";

const MENU_ITEMS = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Client Management", path: "/clients" },
  { name: "Payroll Services", path: "/payroll" },
  { name: "Document Center", path: "/documents" },
  { name: "Compliance Hub", path: "/compliance" },
  { name: "Invoice Management", path: "/invoices" },
  { name: "User Management", path: "/users" },
  { name: "System Settings", path: "/settings" },
  { name: "Property Management", path: "/property-management" },
  { name: "Expediting Services", path: "/expediting" },
  { name: "Training", path: "/training" },
  { name: "Local Content", path: "/local-content" },
  { name: "Partner Network", path: "/partner-network" },
  { name: "Service Catalog", path: "/service-catalog" },
];

test.describe("Navigation Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@gk-nexus.com");
    await page.fill('input[name="password"]', "Admin123!@#");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  });

  for (const item of MENU_ITEMS) {
    test(`Navigate to ${item.name}`, async ({ page }) => {
      // Find and click menu item
      const menuItem = page.locator(`[data-testid="nav-${item.path.slice(1)}"]`)
        .or(page.getByRole("link", { name: item.name }))
        .or(page.getByText(item.name, { exact: true }));
      
      await menuItem.click();
      
      // Verify navigation
      await expect(page).toHaveURL(new RegExp(item.path));
      
      // Check no crash
      await expect(page.locator("text=Something went wrong")).not.toBeVisible();
      await expect(page.locator("text=Error")).not.toBeVisible();
    });
  }
});
```

### Step 3.3: Create Dashboard Test

```typescript
// tests/userflows/02-dashboard.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Dashboard Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@gk-nexus.com");
    await page.fill('input[name="password"]', "Admin123!@#");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");
  });

  test("Dashboard loads without errors", async ({ page }) => {
    // Check page loaded
    await expect(page.locator("h1, h2").first()).toBeVisible();
    
    // Check no React error boundary
    await expect(page.locator("text=Something went wrong")).not.toBeVisible();
    
    // Check no console errors (collect them)
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Report errors found
    if (errors.length > 0) {
      console.log("Console errors found:", errors);
    }
    expect(errors.filter(e => e.includes("is not a function"))).toHaveLength(0);
  });

  test("Dashboard widgets render", async ({ page }) => {
    // Look for common dashboard elements
    await expect(
      page.locator('[class*="card"], [class*="widget"], [class*="stat"]').first()
    ).toBeVisible({ timeout: 5000 });
  });
});
```

### Step 3.4: Create API Connection Test

```typescript
// tests/userflows/03-api-connections.spec.ts
import { test, expect } from "@playwright/test";

test.describe("API Connection Tests", () => {
  test("Capture all API calls and failures", async ({ page }) => {
    const apiCalls: { url: string; status: number; ok: boolean }[] = [];
    
    // Intercept all API calls
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/rpc/") || url.includes("/api/")) {
        apiCalls.push({
          url: url,
          status: response.status(),
          ok: response.ok(),
        });
      }
    });

    // Login and navigate
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@gk-nexus.com");
    await page.fill('input[name="password"]', "Admin123!@#");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");
    
    // Wait for API calls
    await page.waitForTimeout(3000);
    
    // Report results
    console.log("\n=== API CALLS SUMMARY ===");
    for (const call of apiCalls) {
      const status = call.ok ? "OK" : "FAILED";
      console.log(`[${status}] ${call.status} - ${call.url}`);
    }
    
    // Check for 401s
    const unauthorized = apiCalls.filter((c) => c.status === 401);
    console.log(`\n401 Unauthorized calls: ${unauthorized.length}`);
    
    // This test documents, doesn't fail
    expect(true).toBe(true);
  });
});
```

### Step 3.5: Run Tests

```bash
# Run with visible browser
npx playwright test --config=playwright.userflow.config.ts --headed

# Or run specific test
npx playwright test tests/userflows/01-navigation.spec.ts --headed
```

### Step 3.6: Create USER-FLOW-RESULTS.md

Document all test results:

```markdown
# User Flow Test Results
Generated: [timestamp]

## Test Environment
- Browser: Chromium
- Viewport: 1920x1080
- Mode: Headed (visible)

## Navigation Test Results

| Page | Navigated | Loaded | Errors | Notes |
|------|-----------|--------|--------|-------|
| Dashboard | PASS/FAIL | PASS/FAIL | [list] | |
| Clients | PASS/FAIL | PASS/FAIL | [list] | |
| [etc...] | | | | |

## API Call Results

| Endpoint | Status | Response | Notes |
|----------|--------|----------|-------|
| /rpc/dashboard/overview | 200/401/404 | OK/Error | |
| /rpc/users/list | 200/401/404 | OK/Error | |
| [etc...] | | | |

## Console Errors Captured

1. [error message]
2. [error message]

## Screenshots/Videos
- [link to artifacts]
```

---

## Phase 4: Final Verification Checklist

```markdown
# Final Verification Checklist

## Core Functionality
- [ ] Login works with admin@gk-nexus.com / Admin123!@#
- [ ] Dashboard loads without console errors
- [ ] All sidebar menu items navigate correctly
- [ ] All sub-menus expand and collapse
- [ ] User list loads (not stuck on "Loading...")

## API Connections
- [ ] No 401 errors in browser console after login
- [ ] No "is not a function" errors
- [ ] Dashboard data loads from backend
- [ ] User data loads from backend

## UI/UX
- [ ] No React error boundaries triggered
- [ ] All buttons respond to clicks
- [ ] All forms can be submitted
- [ ] All modals open and close properly
- [ ] Charts and graphs render

## Each Page Verified (No Errors)
- [ ] /dashboard
- [ ] /clients
- [ ] /tax/paye-calculator
- [ ] /tax/vat-calculator
- [ ] /tax/nis-calculator
- [ ] /payroll
- [ ] /documents
- [ ] /compliance
- [ ] /invoices
- [ ] /users
- [ ] /settings
- [ ] /property-management
- [ ] /expediting
- [ ] /training
- [ ] /local-content
- [ ] /partner-network
- [ ] /service-catalog

## Sign-off
- [ ] All P0 issues resolved
- [ ] All P1 issues resolved
- [ ] User has confirmed each fix
- [ ] Playwright tests pass in headed mode
```

---

# PART 7: CODE STANDARDS REMINDER

## Ultracite/Biome Rules

The `.claude/settings.json` auto-runs `npx ultracite fix` after edits. Key rules:

- Use `const` by default, `let` only when reassignment needed
- Use arrow functions for callbacks
- Use `for...of` over `.forEach()`
- Use optional chaining (`?.`) and nullish coalescing (`??`)
- Remove `console.log` from production code
- Use semantic HTML and ARIA attributes

## Lucide Icon Rules

**VALID Icons** (safe to use):
```typescript
import { 
  User, Users, UserCheck, UserPlus,
  Home, Menu, X, 
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  Plus, Edit, Trash2, Save, Download, Upload,
  Check, CheckCircle, CheckCircle2,
  AlertCircle, AlertTriangle, Info, XCircle,
  File, FileText, Folder, FolderOpen,
  Calculator, DollarSign, CreditCard, Receipt,
  TrendingUp, BarChart3, PieChart,
  Mail, Phone, MessageSquare, Bell, Calendar,
  Settings, Cog, Lock, Unlock, Eye, EyeOff, Search,
  Building2,  // NOTE: Building2 not Building
  Clock, CalendarDays, Timer
} from "lucide-react";
```

**INVALID Icons** (DO NOT USE - will cause crashes):
```typescript
// These do not exist or have different names:
Stop, Building, CheckIcon, XIcon, FilePdf, Print, 
Scales, Scale, Target, CircleIcon, ChevronRightIcon,
InfoIcon, FileCheck, FileImage
```

**Always verify at**: https://lucide.dev/icons/

---

# PART 8: QUICK REFERENCE COMMANDS

```bash
# Start development
bun run dev                    # All services
bun run dev:web               # Frontend only (port 3001)
bun run dev:server            # Backend only (port 3000)

# Database
bun run db:push               # Push schema changes
bun run db:studio             # Open Drizzle Studio GUI
bun run db:seed               # Seed database with admin user

# Docker
bun run docker:up             # Start PostgreSQL + Redis
bun run docker:down           # Stop containers

# Code quality
npx ultracite fix             # Auto-fix formatting
npx ultracite check           # Check for issues

# Testing
npx playwright test --headed              # Run with visible browser
npx playwright test --debug               # Debug mode with inspector
npx playwright test --ui                  # Interactive UI mode

# Type checking
bun run typecheck             # Run TypeScript checks

# API verification (replace [session] with actual cookie)
curl -X POST http://localhost:3000/rpc/dashboard/overview \
  -H "Content-Type: application/json" \
  -H "Cookie: better-auth.session_token=[session]" \
  -d '{}'
```

---

# PART 9: ENFORCEMENT RULES

## Absolute Rules (Never Violate)

1. **NO fixing before ANALYSIS.md is complete**
2. **NO claiming "fixed" without showing verification command output**
3. **NO moving to next issue without explicit user confirmation**
4. **ONE issue at a time, in strict priority order**
5. **Every fix MUST include root cause analysis**
6. **Tests MUST run in HEADED mode (headless: false)**
7. **Follow Better-T-Stack strictly - NO technology substitutions**
8. **Verify Lucide icon names at lucide.dev before using**
9. **Run `npx ultracite fix` after every code change**

## If You Get Stuck

1. Show what you've tried
2. Show the exact error message
3. Ask the user for guidance
4. DO NOT make random changes hoping something works
5. DO NOT claim something is fixed if you can't verify it

## Communication Style

- Be honest about what's working and what's not
- If you don't know something, say so
- If a fix didn't work, admit it and try a different approach
- Never use phrases like "everything should work now" without proof
- Always show your work

---

# START COMMAND

To begin this protocol, copy and paste:

```
I have read the complete GK-NEXUS-COMPLETE-PROTOCOL.md file.

Before I do anything, I will answer the Phase 0 confirmation questions:

1. There are 4 phases in this protocol:
   - Phase 1: Codebase Discovery
   - Phase 2: Systematic Fixes
   - Phase 3: Real Browser Testing
   - Phase 4: Final Verification

2. Before any fixing begins, I must create ANALYSIS.md documenting:
   - All API routers and their status
   - Dashboard procedures expected vs actual
   - User/auth configuration
   - EnhancedDashboard analysis
   - All identified issues prioritized

3. To mark an issue as "fixed", I must:
   - Show the current broken code
   - Provide root cause analysis
   - Show the fixed code
   - Run a verification command
   - Paste the actual verification output
   - Wait for user confirmation

4. Playwright tests must run in HEADED mode (headless: false) so the user can see the browser.

5. If I skip to fixing without completing analysis, I will likely make incorrect assumptions, miss related issues, and create more problems than I solve.

I will now begin Phase 1: Codebase Discovery by running the discovery commands...
```

---

*This protocol incorporates:*
- *Project documentation and technical stack (Better-T-Stack)*
- *Business requirements (Green Crescent Management Consultancy + KAJ Financial Services)*
- *Industry best practices (TaxDome, Canopy, eImmigration, Docketwise)*
- *Guyana-specific requirements (GRA OPTIMAL, Padna, NIS, 2025 tax rates)*
- *Known broken state from console logs*
- *Systematic debugging methodology*
