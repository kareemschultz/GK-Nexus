# GK-Nexus Complete Restructuring: Full Better-T-Stack Alignment

> **MISSION:** Systematically audit and fix the ENTIRE GK-Nexus project to align with Better-T-Stack base scaffold patterns. The current architecture has widespread failures - nested routers causing type issues, document filters not working, navigation broken, buttons non-functional, pages showing wrong content.

> **APPROACH:** This is a systematic, exhaustive restructuring. Do NOT skip files. Do NOT assume things work. Test EVERYTHING.

---

## CRITICAL RULES

1. **Follow Better-T-Stack patterns EXACTLY** - No deviations
2. **Test every change in browser** - Don't trust code alone
3. **Fix root causes, not symptoms** - If something doesn't work, trace WHY
4. **Document what you find** - Keep a log of issues discovered
5. **One phase at a time** - Complete each phase before moving on

---

## PHASE 0: ENVIRONMENT SETUP & AUDIT

### 0.1 Start Fresh
```bash
git stash
git checkout main
git pull
git checkout -b fix/complete-better-t-stack-alignment

bun install
bun run dev
```

### 0.2 Verify Base State
```bash
# Server health
curl http://localhost:3000/rpc/healthCheck

# Check for TypeScript errors
cd apps/web && npx tsc --noEmit
cd ../server && npx tsc --noEmit
cd ../../packages/api && npx tsc --noEmit
```

### 0.3 Create Issue Log
Create a file to track everything you find:
```bash
touch RESTRUCTURE-LOG.md
```

Log format:
```markdown
## Issues Found

### [File Path]
- [ ] Issue description
- [ ] Fix applied
- [ ] Tested: Yes/No
```

---

## PHASE 1: FLATTEN ALL oRPC ROUTERS

### 1.1 Inventory All Routers

First, find every router file:
```bash
find packages/api/src/routers -name "*.ts" | sort
```

List them all and their current structure:
```bash
for file in packages/api/src/routers/*.ts; do
  echo "=== $file ==="
  grep -n "export const\|Router = {" "$file" | head -20
done
```

### 1.2 Understand the Target Pattern

**Better-T-Stack Base Scaffold (FLAT):**
```typescript
// packages/api/src/routers/index.ts
import { protectedProcedure, publicProcedure } from "../index";

export const appRouter = {
  // All procedures at ROOT level
  // Named with prefix: domain + action
  
  healthCheck: publicProcedure.handler(() => "OK"),
  
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "Private",
    user: context.user,
  })),
};

export type AppRouter = typeof appRouter;
```

**Naming Convention:**
- `clientCreate` not `clients.create`
- `clientContactList` not `clients.contacts.list`
- `taxCalculatePAYE` not `tax.paye.calculate`
- `documentGetRequired` not `documents.getRequired`

### 1.3 Flatten Each Router

For EACH router file found in step 1.1:

#### A. Read the current structure
```bash
cat packages/api/src/routers/[router-name].ts
```

#### B. Identify all procedures (including nested)
Look for:
- Direct procedures: `procedureName: protectedProcedure.handler(...)`
- Nested objects: `contacts: { list: ..., create: ... }`
- Triple nesting: `something: { nested: { deep: ... } }`

#### C. Flatten to prefixed procedures

**Example - Flattening clients router:**

BEFORE (nested):
```typescript
export const clientsRouter = {
  create: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
  getById: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
  update: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
  delete: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
  list: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
  
  contacts: {
    list: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
    create: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
    update: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
    delete: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
  },
  
  services: {
    list: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
    create: protectedProcedure.input(schema).handler(async ({ input }) => {...}),
  },
};
```

AFTER (flat):
```typescript
// packages/api/src/routers/clients.ts
export const clientCreate = protectedProcedure
  .input(createClientSchema)
  .handler(async ({ input, context }) => {...});

export const clientGetById = protectedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {...});

export const clientUpdate = protectedProcedure
  .input(updateClientSchema)
  .handler(async ({ input, context }) => {...});

export const clientDelete = protectedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {...});

export const clientList = protectedProcedure
  .input(listQuerySchema)
  .handler(async ({ input, context }) => {...});

export const clientContactList = protectedProcedure
  .input(z.object({ clientId: z.string() }))
  .handler(async ({ input, context }) => {...});

export const clientContactCreate = protectedProcedure
  .input(createContactSchema)
  .handler(async ({ input, context }) => {...});

export const clientContactUpdate = protectedProcedure
  .input(updateContactSchema)
  .handler(async ({ input, context }) => {...});

export const clientContactDelete = protectedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {...});

export const clientServiceList = protectedProcedure
  .input(z.object({ clientId: z.string() }))
  .handler(async ({ input, context }) => {...});

export const clientServiceCreate = protectedProcedure
  .input(createServiceSchema)
  .handler(async ({ input, context }) => {...});
```

#### D. Update the main router index

```typescript
// packages/api/src/routers/index.ts
import { protectedProcedure, publicProcedure } from "../index";

// Import all flattened procedures
import {
  clientCreate,
  clientGetById,
  clientUpdate,
  clientDelete,
  clientList,
  clientContactList,
  clientContactCreate,
  clientContactUpdate,
  clientContactDelete,
  clientServiceList,
  clientServiceCreate,
} from "./clients";

import {
  dashboardOverview,
  dashboardStats,
  dashboardRecentActivity,
} from "./dashboard";

import {
  taxCalculatePAYE,
  taxCalculateNIS,
  taxCalculateVAT,
  taxFilingCreate,
  taxFilingList,
  taxFilingGetById,
} from "./tax";

// ... import from ALL router files

export const appRouter = {
  // Health
  healthCheck: publicProcedure.handler(() => "OK"),
  
  // Clients
  clientCreate,
  clientGetById,
  clientUpdate,
  clientDelete,
  clientList,
  clientContactList,
  clientContactCreate,
  clientContactUpdate,
  clientContactDelete,
  clientServiceList,
  clientServiceCreate,
  
  // Dashboard
  dashboardOverview,
  dashboardStats,
  dashboardRecentActivity,
  
  // Tax
  taxCalculatePAYE,
  taxCalculateNIS,
  taxCalculateVAT,
  taxFilingCreate,
  taxFilingList,
  taxFilingGetById,
  
  // ... ALL procedures from ALL routers, FLAT
};

export type AppRouter = typeof appRouter;
```

### 1.4 Complete Router Flattening Checklist

Go through EVERY router. Check each off:

- [ ] `packages/api/src/routers/audit.ts`
- [ ] `packages/api/src/routers/clients.ts`
- [ ] `packages/api/src/routers/dashboard.ts`
- [ ] `packages/api/src/routers/documents.ts`
- [ ] `packages/api/src/routers/employees.ts`
- [ ] `packages/api/src/routers/immigration.ts`
- [ ] `packages/api/src/routers/invoices.ts`
- [ ] `packages/api/src/routers/notifications.ts`
- [ ] `packages/api/src/routers/organizations.ts`
- [ ] `packages/api/src/routers/payroll.ts`
- [ ] `packages/api/src/routers/rbac.ts`
- [ ] `packages/api/src/routers/reports.ts`
- [ ] `packages/api/src/routers/settings.ts`
- [ ] `packages/api/src/routers/tax.ts`
- [ ] `packages/api/src/routers/time-tracking.ts`
- [ ] `packages/api/src/routers/users.ts`
- [ ] `packages/api/src/routers/workflows.ts`
- [ ] ANY OTHER routers found in step 1.1

### 1.5 Verify Router Flattening

```bash
# Check no nested objects remain
grep -rn "}: {" packages/api/src/routers/

# Should return nothing or only type definitions

# Check TypeScript compiles
cd packages/api && npx tsc --noEmit
```

---

## PHASE 2: UPDATE ALL FRONTEND API CALLS

### 2.1 Find All oRPC Client Usage

```bash
# Find all files using the oRPC client
grep -rn "client\." apps/web/src --include="*.tsx" --include="*.ts" | grep -v "authClient" | grep -v "queryClient"
```

### 2.2 Update Each Call

**BEFORE (nested):**
```typescript
await client.clients.create({ name: "Test" });
await client.clients.contacts.list({ clientId: "123" });
await client.tax.paye.calculate({ income: 100000 });
await client.dashboard.overview();
```

**AFTER (flat):**
```typescript
await client.clientCreate({ name: "Test" });
await client.clientContactList({ clientId: "123" });
await client.taxCalculatePAYE({ income: 100000 });
await client.dashboardOverview();
```

### 2.3 Update TanStack Query Usage

**BEFORE:**
```typescript
const { data } = orpc.clients.list.useQuery({ input: { page: 1 } });
const mutation = orpc.clients.create.useMutation();
```

**AFTER:**
```typescript
const { data } = orpc.clientList.useQuery({ input: { page: 1 } });
const mutation = orpc.clientCreate.useMutation();
```

### 2.4 Complete Frontend Update Checklist

Find and update EVERY file:

```bash
# Generate list of files to update
grep -rl "client\." apps/web/src --include="*.tsx" --include="*.ts" | grep -v "authClient" | sort -u
```

Update each file found. Check off:

- [ ] `apps/web/src/components/client-onboarding-wizard.tsx`
- [ ] `apps/web/src/components/clients/*.tsx`
- [ ] `apps/web/src/components/dashboard/*.tsx`
- [ ] `apps/web/src/components/documents/*.tsx`
- [ ] `apps/web/src/components/tax/*.tsx`
- [ ] `apps/web/src/components/payroll/*.tsx`
- [ ] `apps/web/src/components/time-tracking/*.tsx`
- [ ] `apps/web/src/routes/*.tsx`
- [ ] ALL other files found by grep

### 2.5 Verify Frontend Compiles

```bash
cd apps/web && npx tsc --noEmit
```

---

## PHASE 3: FIX DOCUMENT FILTER

### 3.1 Trace the Data Flow

The document upload shows ALL documents instead of filtering by selected services. Trace the ENTIRE flow:

#### A. Find where services are selected
```bash
grep -rn "selectedServices\|serviceSelect\|services.*select" apps/web/src --include="*.tsx"
```

#### B. Find where getRequiredDocuments is called
```bash
grep -rn "getRequiredDocuments" apps/web/src --include="*.tsx"
```

#### C. Verify the function receives correct parameters
```typescript
// In client-onboarding-wizard.tsx or wherever documents are rendered
console.log("Entity Type:", entityType);
console.log("Selected Services:", selectedServices);
console.log("Required Docs:", getRequiredDocuments(entityType, selectedServices));
```

### 3.2 Fix the Filter Function

Check `apps/web/src/lib/document-requirements.ts`:

```typescript
// Verify this function actually filters correctly
export function getRequiredDocuments(
  entityType: string,
  selectedServices: string[]
): DocumentCategory[] {
  console.log("getRequiredDocuments called with:", { entityType, selectedServices });
  
  // If selectedServices is empty or undefined, that's the bug!
  if (!selectedServices || selectedServices.length === 0) {
    console.warn("No services selected - returning only entity docs");
    return ENTITY_TYPE_DOCUMENTS[entityType] || [];
  }
  
  // ... rest of implementation
}
```

### 3.3 Verify Service Selection State Flows Correctly

The issue is likely one of:
1. Services selected in step X but not passed to document step
2. State reset between wizard steps
3. Wrong variable name being passed
4. selectedServices is always empty array

Find and fix the actual cause:

```bash
# Find wizard step state management
grep -n "useState\|useForm\|currentStep\|selectedServices" apps/web/src/components/client-onboarding-wizard.tsx
```

### 3.4 Implement Correct Document Requirements

Based on web research, these are the ACTUAL requirements:

#### By Entity Type

**Individual:**
- Valid ID (Passport/Driver's License)
- TIN Certificate
- Proof of Address

**Sole Proprietorship:**
- Business Name Registration
- TIN Certificate
- NIS Registration
- Owner's ID

**Partnership:**
- Partnership Agreement
- Business Registration
- TIN Certificate
- Partners' IDs

**Private Limited Company:**
- Certificate of Incorporation
- Articles of Association
- TIN Certificate
- VAT Certificate (if turnover > GYD 15M)
- Directors' IDs
- Register of Shareholders

#### By Service Type

**Tax Services (PAYE/VAT/Corporate Tax):**
- Previous Tax Returns (if any)
- Financial Statements
- Bank Statements (12 months)
- Payroll Records (for PAYE)

**Payroll Services:**
- Employee List
- Employment Contracts
- NIS Cards for employees
- Salary Structure

**Immigration Services:**
- Passport (all pages)
- Educational Certificates
- Police Clearance
- Medical Certificate
- Job Offer Letter

**Compliance/Audit:**
- Previous Audit Reports
- GRA Correspondence
- Compliance Certificates

### 3.5 Update document-requirements.ts

Ensure the file correctly maps services to documents:

```typescript
// apps/web/src/lib/document-requirements.ts

const SERVICE_DOCUMENTS: Record<string, DocumentRequirement[]> = {
  "tax-paye": [
    { id: "payroll-records", name: "Payroll Records", required: true },
    { id: "employee-list", name: "Employee List", required: true },
    { id: "previous-returns", name: "Previous PAYE Returns", required: false },
  ],
  "tax-vat": [
    { id: "vat-invoices", name: "VAT Invoices (sample)", required: true },
    { id: "financial-statements", name: "Financial Statements", required: true },
    { id: "previous-vat-returns", name: "Previous VAT Returns", required: false },
  ],
  "tax-corporate": [
    { id: "financial-statements", name: "Financial Statements", required: true },
    { id: "bank-statements", name: "Bank Statements (12 months)", required: true },
    { id: "previous-corporate-returns", name: "Previous Corporate Tax Returns", required: false },
  ],
  "payroll": [
    { id: "employee-contracts", name: "Employment Contracts", required: true },
    { id: "nis-cards", name: "NIS Cards", required: true },
    { id: "salary-structure", name: "Salary Structure", required: true },
  ],
  "immigration": [
    { id: "passport", name: "Passport (all pages)", required: true },
    { id: "education-certs", name: "Educational Certificates", required: true },
    { id: "police-clearance", name: "Police Clearance", required: true },
    { id: "medical-cert", name: "Medical Certificate", required: true },
    { id: "job-offer", name: "Job Offer Letter", required: true },
  ],
  // ... ALL services
};

export function getRequiredDocuments(
  entityType: string,
  selectedServices: string[]
): DocumentCategory[] {
  // 1. Get entity-specific docs
  const entityDocs = ENTITY_TYPE_DOCUMENTS[entityType] || [];
  
  // 2. Get service-specific docs (deduplicated)
  const serviceDocs = new Map<string, DocumentRequirement>();
  
  for (const serviceId of selectedServices) {
    const docs = SERVICE_DOCUMENTS[serviceId] || [];
    for (const doc of docs) {
      if (!serviceDocs.has(doc.id)) {
        serviceDocs.set(doc.id, doc);
      }
    }
  }
  
  return [
    {
      id: "entity",
      name: "Identity & Registration Documents",
      description: `Required documents for ${entityType.toLowerCase()} registration`,
      documents: entityDocs,
    },
    {
      id: "services",
      name: "Service-Specific Documents",
      description: "Additional documents required for your selected services",
      documents: Array.from(serviceDocs.values()),
    },
  ];
}
```

### 3.6 Test Document Filter

1. Go to client onboarding wizard
2. Select entity type (e.g., "Private Limited Company")
3. Select specific services (e.g., only "PAYE")
4. Proceed to document step
5. Verify ONLY relevant documents shown
6. Go back, change services, verify documents change

---

## PHASE 4: FIX ALL NAVIGATION

### 4.1 Audit Every Route

```bash
# List all route files
find apps/web/src/routes -name "*.tsx" | sort

# Count them
find apps/web/src/routes -name "*.tsx" | wc -l
```

### 4.2 Verify Each Route Has Content

For EACH route file:

1. Check it has a proper component
2. Check it's not showing placeholder/duplicate content
3. Check navigation to it works

```bash
# Find routes that might be placeholders
grep -l "Coming Soon\|TODO\|Placeholder\|NotImplemented" apps/web/src/routes/**/*.tsx
```

### 4.3 Fix Sidebar Navigation

```bash
# Find sidebar component
find apps/web/src -name "*sidebar*"

# Check navigation items
grep -n "to=\"\|to={\|href=" apps/web/src/components/enterprise-sidebar.tsx
```

Verify EACH navigation item:
- Links to correct route
- Route file exists
- Route renders unique content
- Click actually navigates

### 4.4 Navigation Checklist

Test EVERY navigation item manually:

#### Core Services
- [ ] Dashboard → `/dashboard` → Shows dashboard
- [ ] Clients → `/clients` → Shows client list
- [ ] Clients > All Clients → `/clients` → Shows all clients
- [ ] Clients > Add New → `/clients/new` → Shows add form
- [ ] Tax Services → `/tax` → Shows tax overview
- [ ] Tax > PAYE → `/tax/paye` → Shows PAYE (NOT same as tax overview)
- [ ] Tax > VAT → `/tax/vat` → Shows VAT (NOT same as PAYE)
- [ ] Tax > Corporate Tax → `/tax/corporate` → Shows Corporate
- [ ] Tax > Tax Filing → `/tax/filing` → Shows filings
- [ ] Payroll → `/payroll` → Shows payroll
- [ ] Payroll > Run Payroll → `/payroll/run` → Shows payroll run
- [ ] Payroll > Employees → `/payroll/employees` → Shows employees
- [ ] Payroll > Reports → `/payroll/reports` → Shows reports

#### Document & Compliance
- [ ] Documents → `/documents` → Shows documents
- [ ] Compliance → `/compliance` → Shows compliance
- [ ] ... ALL document/compliance sub-routes

#### Productivity
- [ ] Time Tracking → `/time-tracking` → Shows time tracking
- [ ] Invoices → `/invoices` → Shows invoices
- [ ] Reports → `/reports` → Shows reports
- [ ] ... ALL productivity sub-routes

#### Business Modules
- [ ] Immigration → `/immigration` → Shows immigration
- [ ] Property → `/property` → Shows property
- [ ] Training → `/training` → Shows training
- [ ] ... ALL business module sub-routes

#### Administration
- [ ] Settings → `/settings` → Shows settings
- [ ] Users → `/users` → Shows users
- [ ] Roles → `/roles` → Shows roles
- [ ] ... ALL admin sub-routes

### 4.5 Fix Any Route Showing Wrong Content

If Tax > PAYE shows same content as Tax > VAT:

1. Check the route files are different:
```bash
diff apps/web/src/routes/tax/paye.tsx apps/web/src/routes/tax/vat.tsx
```

2. If same, create proper unique content for each

3. Check components being imported:
```bash
grep -n "import.*from" apps/web/src/routes/tax/paye.tsx
grep -n "import.*from" apps/web/src/routes/tax/vat.tsx
```

4. Ensure different components or different props

---

## PHASE 5: FIX ALL BUTTONS & ACTIONS

### 5.1 Find All Buttons

```bash
# Find all buttons with onClick
grep -rn "<Button.*onClick\|<button.*onClick" apps/web/src --include="*.tsx"

# Find buttons that might be broken (no handler or empty handler)
grep -rn "onClick={() => {}}\|onClick={undefined}\|onClick={null}" apps/web/src --include="*.tsx"
```

### 5.2 Test Every Button

For each page, click every button and verify:
- It does something (not just console.log)
- It calls the correct API
- It shows feedback (loading state, success/error toast)
- It updates the UI appropriately

### 5.3 Common Button Fixes

#### Add Client Button
```typescript
// BEFORE (broken - nested)
onClick={() => client.clients.create(formData)}

// AFTER (working - flat)
onClick={() => client.clientCreate(formData)}
```

#### Submit Form Button
```typescript
// Ensure it:
// 1. Validates form
// 2. Shows loading state
// 3. Calls API
// 4. Handles success (toast + redirect/refresh)
// 5. Handles error (toast + keep form)

const handleSubmit = async () => {
  if (!validateForm()) return;
  
  setIsLoading(true);
  try {
    await client.clientCreate(formData);
    toast.success("Client created successfully");
    navigate({ to: "/clients" });
  } catch (error) {
    toast.error("Failed to create client");
  } finally {
    setIsLoading(false);
  }
};
```

### 5.4 Button Checklist by Page

#### Dashboard
- [ ] Quick action buttons work
- [ ] Widget action buttons work
- [ ] Navigation buttons work

#### Clients
- [ ] "Add Client" button opens form/wizard
- [ ] "Edit" button on each client works
- [ ] "Delete" button works (with confirmation)
- [ ] "View" button works
- [ ] Search/filter works
- [ ] Pagination works

#### Tax
- [ ] Calculate buttons work
- [ ] File return buttons work
- [ ] Download buttons work
- [ ] ... all tax page buttons

#### (Continue for ALL pages)

---

## PHASE 6: FIX FORMS & WIZARDS

### 6.1 Find All Forms

```bash
grep -rn "useForm\|<form\|onSubmit" apps/web/src --include="*.tsx" | grep -v node_modules
```

### 6.2 Verify Each Form

For each form:
1. Fill out all fields
2. Submit
3. Verify data saved correctly
4. Verify validation works
5. Verify error handling works

### 6.3 Fix Client Onboarding Wizard

This is the main wizard with document filter issues:

1. Step 1: Entity selection works
2. Step 2: Contact info saves
3. Step 3: Service selection saves AND passes to step 4
4. Step 4: Documents filtered by services selected in step 3
5. Step 5: Review shows correct data
6. Submit creates client with all data

### 6.4 Form Checklist

- [ ] Client Onboarding Wizard - all steps work
- [ ] Client Edit Form - saves changes
- [ ] Tax Filing Form - calculates and submits
- [ ] Invoice Form - creates invoice
- [ ] Employee Form - adds employee
- [ ] Payroll Run Form - processes payroll
- [ ] Settings Forms - save settings
- [ ] User Forms - create/edit users
- [ ] ... ALL forms in project

---

## PHASE 7: VERIFY EVERYTHING

### 7.1 Full Application Test

Run through the entire application as a user would:

1. Login
2. View dashboard
3. Navigate to every section
4. Click every button
5. Submit every form
6. Verify data persists

### 7.2 Linting Check

```bash
npx ultracite check
```

Fix any issues found.

### 7.3 TypeScript Check

```bash
# All packages
cd packages/api && npx tsc --noEmit
cd ../auth && npx tsc --noEmit
cd ../db && npx tsc --noEmit
cd ../../apps/web && npx tsc --noEmit
cd ../server && npx tsc --noEmit
```

### 7.4 Console Errors

Open browser DevTools, navigate through entire app:
- No red errors in console
- No TypeScript errors
- No "undefined" or "null" reference errors

---

## PHASE 8: DOCUMENTATION

### 8.1 Update RESTRUCTURE-LOG.md

Document everything fixed:
```markdown
# Restructure Log

## Routers Flattened
- [x] clients.ts - 11 procedures extracted
- [x] tax.ts - 8 procedures extracted
- ... etc

## Frontend Calls Updated
- [x] client-onboarding-wizard.tsx - 5 calls updated
- ... etc

## Navigation Fixed
- [x] Tax submenu - all items now route correctly
- ... etc

## Buttons Fixed
- [x] Add Client button - now calls clientCreate
- ... etc

## Forms Fixed
- [x] Document filter - now filters by selected services
- ... etc
```

### 8.2 Update .claude/ Files

Update CLAUDE.md with:
- New flat router pattern
- New API call pattern
- Any new conventions discovered

### 8.3 Commit

```bash
git add -A
git commit -m "Complete Better-T-Stack alignment

- Flattened all oRPC routers to match base scaffold
- Updated all frontend API calls
- Fixed document filter to respect selected services
- Fixed all navigation routes
- Fixed all buttons and forms
- Full application tested"

git push origin fix/complete-better-t-stack-alignment
```

---

## QUICK REFERENCE

### Router Naming Convention
| Old (Nested) | New (Flat) |
|--------------|------------|
| `clients.create` | `clientCreate` |
| `clients.contacts.list` | `clientContactList` |
| `tax.paye.calculate` | `taxCalculatePAYE` |
| `dashboard.overview` | `dashboardOverview` |

### Frontend Call Pattern
```typescript
// Old
await client.clients.create(data);
orpc.clients.list.useQuery({ input });

// New
await client.clientCreate(data);
orpc.clientList.useQuery({ input });
```

### Commands
```bash
bun run dev              # Start all
npx ultracite check      # Lint check
npx tsc --noEmit         # Type check
curl localhost:3000/rpc/healthCheck  # API check
```

### Credentials
- Email: admin@gk-nexus.com
- Password: Admin123!@#
