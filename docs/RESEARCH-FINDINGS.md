# GK-Nexus Research & Findings

> This document consolidates all research, bug discoveries, and architectural analysis from the December 2025 code audit.

---

## Table of Contents

1. [Console Error Analysis](#console-error-analysis)
2. [Navigation Audit Findings](#navigation-audit-findings)
3. [Wizard Inventory](#wizard-inventory)
4. [Service-Specific Document Requirements](#service-specific-document-requirements)
5. [Base Scaffold Deviations](#base-scaffold-deviations)
6. [Disabled Features](#disabled-features)
7. [Guyana Regulatory Requirements](#guyana-regulatory-requirements)
8. [Recommended Fixes Priority](#recommended-fixes-priority)

---

## Console Error Analysis

### Critical Errors Found

#### Error 1: ReferenceError - Square Icon
```
ReferenceError: Square is not defined
    at TimeTrackingDashboard (time-tracking/dashboard.tsx:158:36)
```
**Root Cause:** `Square` icon used on line 174 but not imported on line 1.  
**File:** `apps/web/src/components/time-tracking/dashboard.tsx`  
**Fix:** Add `Square` to the lucide-react import.

#### Error 2: Failed to Fetch
```
TypeError: Failed to fetch
    at async Object.beforeLoad (dashboard.tsx:23:21)
```
**Root Cause:** Backend connection failure - server not running, CORS issue, or wrong VITE_SERVER_URL.  
**Fix:** Verify server is running at port 3000 and .env is correct.

#### Error 3: HTTP Status Errors
- **403 Forbidden:** RBAC permission denied (rbac router disabled)
- **404 Not Found:** API route not registered or disabled
- **500 Internal Server Error:** Backend crash, check server logs

---

## Navigation Audit Findings

### Structure Overview

| Section | Child Routes | Max Depth |
|---------|--------------|-----------|
| Core Services | 12 | 2 clicks |
| Document & Compliance | 11 | 2 clicks |
| Productivity | 8 | 2 clicks |
| Business Modules | 12 | 2 clicks |
| Administration | 6 | 2 clicks |
| Client Access | 2 | 1 click |

**Total:** 6 top-level sections, 41 child routes

### Navigation Implementation Status

| Pattern | Expected | Actual | Status |
|---------|----------|--------|--------|
| Direct `<Link>` for leaf items | Yes | Yes | ✅ |
| `<button>` for expandable parents | Yes | Yes | ✅ |
| No shadcn/ui SidebarMenuButton wrapper | Yes | Yes | ✅ |
| TanStack Router Link component | Yes | Yes | ✅ |

**Conclusion:** Navigation is correctly implemented.

---

## Wizard Inventory

### Existing Wizards

#### 1. Client Onboarding Wizard
**Location:** `apps/web/src/components/client-onboarding-wizard.tsx`  
**Steps:**
1. Entity Structure (individual/business type)
2. Contact Information
3. Document Upload (filtered by entity type + services)
4. Service Selection
5. Review & Submit

**Status:** ✅ Implemented, uses `getRequiredDocuments()` correctly

#### 2. Setup Wizard
**Location:** `apps/web/src/components/onboarding/setup-wizard.tsx`  
**Steps:**
1. Organization Details
2. Contact Information
3. Tax Configuration
4. Feature Selection

**Status:** ✅ Implemented

### Missing Wizards (Identified)

| Wizard | Priority | Purpose |
|--------|----------|---------|
| Tax Filing Wizard | High | Guide through tax return submission |
| Invoice Creation Wizard | High | Create invoices with proper VAT |
| Payroll Run Wizard | High | Monthly payroll processing |
| GRA Filing Wizard | High | Government submissions |
| Employee Onboarding | Medium | Add employees with NIS setup |
| Document Request Wizard | Medium | Request docs from clients |
| Compliance Check Wizard | Medium | Verify client compliance status |
| Immigration Application | Medium | Work permit/visa applications |
| Property Listing Wizard | Low | Add rental properties |
| Training Course Creation | Low | Create training modules |
| Partner Onboarding | Low | Add business partners |
| Audit Preparation Wizard | Low | Prepare for GRA audits |

---

## Service-Specific Document Requirements

### Implementation Location
**File:** `apps/web/src/lib/document-requirements.ts`

### Document Categories by Entity Type

#### Individual
- Valid ID (Passport/Driver's License)
- TIN Certificate
- NIS Registration
- Proof of Address

#### Sole Proprietorship
- Business Registration Certificate
- TIN Certificate
- NIS Registration
- Bank Statement
- Owner's ID

#### Partnership
- Partnership Agreement
- Business Registration
- TIN Certificate for Partnership
- Partners' IDs
- NIS Registration

#### Corporation / LLC
- Certificate of Incorporation
- Articles of Association
- TIN Certificate
- VAT Certificate (if applicable)
- Directors' IDs
- Shareholders Register
- Annual Returns

### Document Categories by Service

#### Tax Services (PAYE, VAT, Corporate)
- Previous Tax Returns (3 years)
- Financial Statements
- Bank Statements
- Payroll Records
- VAT Invoices
- Asset Register

#### Payroll Services
- Employee Contracts
- NIS Cards
- TIN Letters (employees)
- Salary Schedules
- Leave Records
- Overtime Records

#### Immigration Services
- Passport (all pages)
- Educational Credentials
- Police Clearance
- Medical Certificate
- Employment Contract
- Sponsor Documents
- Financial Proof

#### Compliance/Audit
- Previous Audit Reports
- GRA Correspondence
- Compliance Certificates
- Legal Documents
- Board Resolutions

### Filter Logic

```typescript
// apps/web/src/lib/document-requirements.ts
export function getRequiredDocuments(
  entityType: string,
  selectedServices: string[]
): DocumentCategory[] {
  // 1. Get base documents for entity type
  const baseDocuments = ENTITY_TYPE_DOCUMENTS[entityType] || [];
  
  // 2. Get service-specific documents (deduplicated)
  const serviceDocuments = new Map();
  for (const service of selectedServices) {
    const docs = SERVICE_SPECIFIC_DOCUMENTS[service] || [];
    for (const doc of docs) {
      if (!serviceDocuments.has(doc.id)) {
        serviceDocuments.set(doc.id, doc);
      }
    }
  }
  
  // 3. Return combined categories
  return [
    { id: "base", name: "Identity & Registration", documents: baseDocuments },
    { id: "services", name: "Service-Specific", documents: [...serviceDocuments.values()] },
  ];
}
```

---

## Base Scaffold Deviations

### Deviation 1: Nested oRPC Routers

**Base Scaffold (Flat):**
```typescript
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({...})),
};
```

**GK-Nexus (Nested):**
```typescript
export const appRouter = {
  healthCheck: publicProcedure.handler(() => "OK"),
  clients: clientsRouter,
  dashboard: dashboardRouter,
  // 18+ nested routers
};
```

**Impact:** Works but two routers are disabled due to "incompatible architecture."

**Triple Nesting Found:**
- `clients.contacts.list`
- `clients.contacts.create`
- `clients.contacts.update`
- `clients.contacts.delete`
- `clients.services.list`
- `clients.services.create`
- `clients.services.update`
- `clients.services.delete`

### Deviation 2: Package Naming Case

**Base Scaffold:** `@project-name/package` (lowercase)  
**GK-Nexus:** `@GK-Nexus/package` (mixed case)

**Impact:** None, just a style difference.

### Deviation 3: Project Scale

**Base Scaffold:** Simple starter with 2 routes  
**GK-Nexus:** Enterprise app with 40+ routes, 20+ routers

**Impact:** Required more complex patterns (nested routers, expandable sidebar).

---

## Disabled Features

### Disabled Routers

| Router | Location | Reason |
|--------|----------|--------|
| `auditRouter` | `packages/api/src/routers/audit.ts` | "Incompatible architecture" |
| `rbacRouter` | `packages/api/src/routers/rbac.ts` | "Incompatible architecture" |

**Code Location:** `packages/api/src/routers/index.ts` lines 5-7, 35-37

**Impact:**
- No audit logging functionality
- Limited RBAC (role-based access control)
- 403 errors when hitting permission checks

### Investigation Needed

1. Compare audit.ts and rbac.ts with working routers (e.g., dashboard.ts)
2. Identify what makes them "incompatible"
3. Fix and re-enable

---

## Guyana Regulatory Requirements

### GRA Tax Rates (2025)

| Tax Type | Rate | Details |
|----------|------|---------|
| PAYE | 25% | Income up to GYD 130,000/month |
| PAYE | 35% | Income above GYD 130,000/month |
| PAYE Exemption | GYD 85,000 | Monthly tax-free threshold |
| NIS Employee | 5.6% | Capped at GYD 294,840/year |
| NIS Employer | 8.4% | Capped at GYD 442,260/year |
| NIS Self-Employed | 14% | Combined rate |
| VAT | 14% | Standard rate |
| Corporate Tax | 25% | Commercial companies |
| Corporate Tax | 40% | Non-commercial companies |
| Withholding Tax | 20% | Dividends, interest, royalties |

### Filing Deadlines

| Filing | Deadline | Penalty |
|--------|----------|---------|
| PAYE Monthly | 14th of following month | Interest + fines |
| NIS Monthly | 14th of following month | Prosecution possible |
| VAT Monthly | 21st of following month | Interest + fines |
| Corporate Tax | March 31 | Interest + penalties |
| Personal Tax | April 30 | Interest + penalties |
| Annual NIS | January 31 | Fines |

### Required Registrations

1. **TIN (Tax Identification Number)** - Mandatory for all taxpayers
2. **NIS (National Insurance Scheme)** - Mandatory for employers
3. **VAT Registration** - Required if turnover > GYD 15M/year
4. **Business Registration** - Deeds Registry for all businesses

---

## Recommended Fixes Priority

### Immediate (Before Next Deploy)

| Priority | Issue | File | Fix |
|----------|-------|------|-----|
| 🔴 P0 | Missing Square import | `time-tracking/dashboard.tsx` | Add to import |
| 🔴 P0 | Backend connection | `.env` / server | Verify VITE_SERVER_URL |

### Short Term (This Sprint)

| Priority | Issue | File | Fix |
|----------|-------|------|-----|
| 🟠 P1 | Disabled audit router | `routers/audit.ts` | Investigate and fix |
| 🟠 P1 | Disabled rbac router | `routers/rbac.ts` | Investigate and fix |
| 🟠 P1 | 403/404/500 errors | Various | Fix after routers enabled |

### Medium Term (Next Sprint)

| Priority | Issue | Action |
|----------|-------|--------|
| 🟡 P2 | Missing wizards (4 high priority) | Implement Tax Filing, Invoice, Payroll, GRA wizards |
| 🟡 P2 | Empty states | Add empty states to ~35 routes |
| 🟡 P2 | Error boundaries | Add around Time Tracking routes |

### Long Term (Backlog)

| Priority | Issue | Action |
|----------|-------|--------|
| 🟢 P3 | Lucide icon audit | Verify all icons imported correctly |
| 🟢 P3 | Missing wizards (8 medium/low) | Implement remaining wizards |
| 🟢 P3 | Documentation | Update README with architecture |

---

## Appendix: Verification Commands

```bash
# Check for missing imports
npx ultracite check 2>&1 | grep "is not defined"

# Find all icon usage
grep -rn "from \"lucide-react\"" apps/web/src --include="*.tsx"

# Check disabled routers
grep -n "DISABLED\|disabled" packages/api/src/routers/index.ts

# Test API health
curl http://localhost:3000/rpc/healthCheck

# Find all route files
find apps/web/src/routes -name "*.tsx" | wc -l

# Check getRequiredDocuments usage
grep -rn "getRequiredDocuments" apps/web/src

# Find wizards
find apps/web/src -name "*wizard*"
```
