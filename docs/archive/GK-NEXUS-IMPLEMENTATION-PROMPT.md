# GK-NEXUS MASTER IMPLEMENTATION PROMPT
## Fix ALL Audit Findings - Claude Code Edition

**Generated:** 2025-12-09
**Based on:** AUDIT_FINDINGS-CLAUDE.md, AUDIT_FINDINGS_DEEP_DIVE.md, AUDIT_Findings_report-codex.md

---

## CRITICAL CONTEXT

You are implementing fixes for GK-Nexus, a **unified business management platform** for:

- **KAJ Financial Services** - Tax, NIS, Compliance, Audits
- **GCMC (Green Crescent Management Consultancy)** - Training, Incorporation, Paralegal, Immigration

### Key Business Requirements
1. **Shared Clients** - One client can use services from BOTH businesses
2. **Unified Invoicing** - One invoice can have line items from different businesses
3. **Employee Multi-Assignment** - Staff can work for KAJ only, GCMC only, or both
4. **Cross-Business Workflows** - Work permits need both GCMC (immigration) and KAJ (tax compliance)

---

## PHASE 1: CRITICAL SECURITY FIXES (Do First - 2 hours)

### 1.1 Uncomment ALL Permission Checks

**Issue:** SEC-001, SEC-002 - All 653 permission checks are commented out
**Impact:** ANY authenticated user can access ANY endpoint

**Files to fix:** ALL files in `packages/api/src/routers/*.ts` (24 files)

```bash
# Find all commented permission checks
grep -rn "// .use(requirePermission" packages/api/src/routers/
```

**For EACH file, uncomment the permission middleware:**

```typescript
// BEFORE (broken)
export const clientList = protectedProcedure
  // .use(requirePermission("clients.read"))
  .input(...)

// AFTER (fixed)
export const clientList = protectedProcedure
  .use(requirePermission("clients.read"))
  .input(...)
```

**Files to update:**
1. `packages/api/src/routers/clients.ts` (49 occurrences)
2. `packages/api/src/routers/audit.ts` (23 occurrences)
3. `packages/api/src/routers/documents.ts` (38 occurrences)
4. `packages/api/src/routers/tax.ts` (35 occurrences)
5. `packages/api/src/routers/payroll.ts` (19 occurrences)
6. `packages/api/src/routers/invoices.ts`
7. `packages/api/src/routers/users.ts`
8. `packages/api/src/routers/services.ts`
9. `packages/api/src/routers/cases.ts`
10. `packages/api/src/routers/reports.ts`
11. ALL other router files

**Verification:**
```bash
# Should return 0 results after fix
grep -rn "// .use(requirePermission" packages/api/src/routers/ | wc -l
```

---

### 1.2 Fix Hardcoded Password Fallback

**Issue:** AUTH-001 - Default admin password hardcoded
**File:** `packages/database/src/seed.ts` (or `packages/db/src/seed.ts`)

```typescript
// BEFORE (line ~46)
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin123!@#";

// AFTER
const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
if (!superAdminPassword) {
  throw new Error("SUPER_ADMIN_PASSWORD environment variable is required for seeding");
}
```

---

### 1.3 Remove Password Logging

**Issue:** AUTH-002 - Password logged to console
**File:** `packages/database/src/seed.ts` (line ~76)

```typescript
// BEFORE
console.log(`Password: ${superAdminPassword}`);

// AFTER - Remove this line entirely or replace with:
console.log("Super admin created successfully. Password was set from SUPER_ADMIN_PASSWORD env var.");
```

---

### 1.4 Fix Cookie Security

**File:** `packages/auth/src/index.ts`

```typescript
// BEFORE
sameSite: "none"

// AFTER
sameSite: "lax",
secure: process.env.NODE_ENV === "production",
httpOnly: true,
```

---

### 1.5 Fix CORS Configuration

**File:** `apps/server/src/index.ts`

```typescript
// BEFORE
origin: process.env.CORS_ORIGIN || ""

// AFTER
origin: process.env.CORS_ORIGIN || "http://localhost:3001",
credentials: true,
```

---

## PHASE 2: DATABASE SCHEMA FIXES (4 hours)

### 2.1 Create Businesses Table

**Issue:** KAJ/GCMC are hardcoded, should be database-driven
**File:** Create `packages/database/src/schema/businesses.ts`

```typescript
import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const businesses = pgTable("businesses", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(), // "KAJ Financial Services", "Green Crescent Management Consultancy"
  code: text("code").notNull().unique(), // "KAJ", "GCMC"
  type: text("type").notNull(), // "tax_accounting", "business_consulting"
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  settings: jsonb("settings"), // Business-specific settings (branding, defaults)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Business = typeof businesses.$inferSelect;
export type NewBusiness = typeof businesses.$inferInsert;
```

---

### 2.2 Create User-Business Join Table

**Issue:** Users can only be assigned to one business, need many-to-many
**File:** Create `packages/database/src/schema/user-businesses.ts`

```typescript
import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { businesses } from "./businesses";

export const userBusinesses = pgTable("user_businesses", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  businessId: text("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("employee"), // Role within this business
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  assignedBy: text("assigned_by").references(() => user.id),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.businessId] }),
}));

export type UserBusiness = typeof userBusinesses.$inferSelect;
```

---

### 2.3 Create Client-Business Join Table

**Issue:** Clients can only belong to one business, need many-to-many for shared clients
**File:** Create `packages/database/src/schema/client-businesses.ts`

```typescript
import { pgTable, text, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { businesses } from "./businesses";

export const clientBusinesses = pgTable("client_businesses", {
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  businessId: text("business_id").notNull().references(() => businesses.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").notNull().default(false), // Primary business relationship
  addedAt: timestamp("added_at").defaultNow().notNull(),
  addedBy: text("added_by"),
}, (table) => ({
  pk: primaryKey({ columns: [table.clientId, table.businessId] }),
}));
```

---

### 2.4 Create/Update Invoices Schema

**Issue:** Invoices don't support cross-business line items
**File:** `packages/database/src/schema/invoices.ts`

```typescript
import { pgTable, text, timestamp, decimal, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { clients } from "./clients";
import { user } from "./auth";

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  invoiceNumber: text("invoice_number").notNull().unique(),
  clientId: text("client_id").notNull().references(() => clients.id),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled, void
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  
  // Totals (calculated from line items)
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull().default("0"),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 15, scale: 2 }).notNull().default("0"),
  amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }).notNull().default("0"),
  balanceDue: decimal("balance_due", { precision: 15, scale: 2 }).notNull().default("0"),
  
  currency: text("currency").notNull().default("GYD"),
  notes: text("notes"),
  terms: text("terms"),
  
  // Metadata
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  
  // CRITICAL: Business ID per line item for cross-business invoicing
  businessId: text("business_id").notNull().references(() => businesses.id),
  
  serviceId: text("service_id"), // Optional link to service catalog
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }), // e.g., 14 for VAT
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }),
  sortOrder: integer("sort_order").default(0),
});
```

---

### 2.5 Create Cases/Engagements Table

**Issue:** No way to track cross-business engagements
**File:** Create `packages/database/src/schema/cases.ts`

```typescript
import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { clients } from "./clients";
import { user } from "./auth";

export const cases = pgTable("cases", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  caseNumber: text("case_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  clientId: text("client_id").notNull().references(() => clients.id),
  
  status: text("status").notNull().default("open"), // open, in_progress, pending, completed, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  
  // Can span multiple businesses
  assignedTo: text("assigned_to").references(() => user.id),
  
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  completedDate: timestamp("completed_date"),
  
  metadata: jsonb("metadata"), // Flexible storage for case-specific data
  
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Services linked to a case (can be from different businesses)
export const caseServices = pgTable("case_services", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  serviceId: text("service_id").notNull().references(() => services.id),
  businessId: text("business_id").notNull().references(() => businesses.id),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
});

// Link related cases (e.g., GCMC Work Permit + KAJ Tax Compliance)
export const linkedCases = pgTable("linked_cases", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  caseId: text("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  linkedCaseId: text("linked_case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  linkType: text("link_type").notNull(), // "related", "depends_on", "parent", "child"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### 2.6 Create Audit Logs Table (if missing)

**File:** `packages/database/src/schema/audit-logs.ts`

```typescript
import { pgTable, text, timestamp, jsonb, inet } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  
  // Who
  userId: text("user_id"),
  userEmail: text("user_email"),
  
  // What
  action: text("action").notNull(), // create, update, delete, view, export, login, logout
  resource: text("resource").notNull(), // clients, invoices, documents, users, etc.
  resourceId: text("resource_id"),
  
  // Details
  description: text("description"),
  previousData: jsonb("previous_data"),
  newData: jsonb("new_data"),
  metadata: jsonb("metadata"),
  
  // Where
  ipAddress: inet("ip_address"),
  userAgent: text("user_agent"),
  
  // When
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});
```

---

### 2.7 Update Schema Index

**File:** `packages/database/src/schema/index.ts`

Add exports for all new schemas:

```typescript
// Add these exports
export * from "./businesses";
export * from "./user-businesses";
export * from "./client-businesses";
export * from "./invoices";
export * from "./cases";
export * from "./audit-logs";
```

---

### 2.8 Generate and Run Migrations

```bash
cd packages/database
bun run db:generate
bun run db:migrate
```

---

## PHASE 3: SEED DATA UPDATES (1 hour)

### 3.1 Seed Businesses

**File:** `packages/database/src/seed.ts` - Add business seeding:

```typescript
// Seed businesses
const [kajBusiness] = await db.insert(businesses).values({
  name: "KAJ Financial Services",
  code: "KAJ",
  type: "tax_accounting",
  description: "GRA Licensed Accountant Practice - Tax, NIS, Compliance, Audits",
  isActive: true,
  settings: {
    primaryColor: "#1a365d",
    logo: "/logos/kaj.png",
  },
}).returning();

const [gcmcBusiness] = await db.insert(businesses).values({
  name: "Green Crescent Management Consultancy",
  code: "GCMC",
  type: "business_consulting",
  description: "Training, Incorporation, Paralegal, Immigration, Business Proposals",
  isActive: true,
  settings: {
    primaryColor: "#276749",
    logo: "/logos/gcmc.png",
  },
}).returning();

console.log("Businesses seeded:", kajBusiness.code, gcmcBusiness.code);
```

### 3.2 Update Service Catalog Seeds

**File:** `packages/database/src/seed-services.ts`

Ensure all services reference the new `businesses` table:

```typescript
// Update service seeds to use businessId foreign key
await db.insert(services).values([
  // KAJ Services
  {
    name: "Income Tax Returns",
    businessId: kajBusiness.id, // Reference to businesses table
    category: "Tax Filing",
    // ... rest of service data
  },
  // GCMC Services
  {
    name: "Company Incorporation",
    businessId: gcmcBusiness.id,
    category: "Business Development",
    // ... rest of service data
  },
]);
```

---

## PHASE 4: API ROUTER UPDATES (4 hours)

### 4.1 Update Client Router for Multi-Business

**File:** `packages/api/src/routers/clients.ts`

```typescript
// Add business filtering based on user's assigned businesses
export const clientList = protectedProcedure
  .use(requirePermission("clients.read"))
  .input(z.object({
    businessId: z.string().optional(), // Filter by specific business
    includeShared: z.boolean().optional().default(true),
  }))
  .query(async ({ ctx, input }) => {
    // Get user's assigned businesses
    const userBusinessIds = await db
      .select({ businessId: userBusinesses.businessId })
      .from(userBusinesses)
      .where(eq(userBusinesses.userId, ctx.user.id));
    
    const allowedBusinessIds = userBusinessIds.map(ub => ub.businessId);
    
    // If user is owner/super_admin, show all
    if (ctx.user.role === "super_admin" || ctx.user.role === "owner") {
      // No filtering
    }
    
    // Get clients that belong to user's businesses
    const clients = await db
      .select()
      .from(clients)
      .innerJoin(clientBusinesses, eq(clients.id, clientBusinesses.clientId))
      .where(
        input.businessId 
          ? eq(clientBusinesses.businessId, input.businessId)
          : inArray(clientBusinesses.businessId, allowedBusinessIds)
      );
    
    return clients;
  });
```

### 4.2 Update Invoice Router for Cross-Business

**File:** `packages/api/src/routers/invoices.ts`

Replace mock data with real database queries:

```typescript
// CREATE invoice with cross-business line items
export const createInvoice = protectedProcedure
  .use(requirePermission("invoices.create"))
  .input(z.object({
    clientId: z.string().uuid(),
    issueDate: z.date(),
    dueDate: z.date(),
    lineItems: z.array(z.object({
      businessId: z.string().uuid(), // CRITICAL: Per line item
      serviceId: z.string().uuid().optional(),
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      taxRate: z.number().optional(),
    })),
    notes: z.string().optional(),
    terms: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    
    const processedLineItems = input.lineItems.map((item, index) => {
      const amount = item.quantity * item.unitPrice;
      const itemTax = item.taxRate ? amount * (item.taxRate / 100) : 0;
      subtotal += amount;
      taxAmount += itemTax;
      
      return {
        ...item,
        amount,
        taxAmount: itemTax,
        sortOrder: index,
      };
    });
    
    const total = subtotal + taxAmount;
    
    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();
    
    // Create invoice
    const [invoice] = await db.insert(invoices).values({
      invoiceNumber,
      clientId: input.clientId,
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      subtotal: subtotal.toString(),
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      balanceDue: total.toString(),
      notes: input.notes,
      terms: input.terms,
      createdBy: ctx.user.id,
    }).returning();
    
    // Create line items
    await db.insert(invoiceLineItems).values(
      processedLineItems.map(item => ({
        invoiceId: invoice.id,
        businessId: item.businessId,
        serviceId: item.serviceId,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        amount: item.amount.toString(),
        taxRate: item.taxRate?.toString(),
        taxAmount: item.taxAmount.toString(),
        sortOrder: item.sortOrder,
      }))
    );
    
    // Log audit
    await logAudit({
      userId: ctx.user.id,
      action: "create",
      resource: "invoices",
      resourceId: invoice.id,
      description: `Created invoice ${invoiceNumber}`,
    });
    
    return invoice;
  });
```

---

## PHASE 5: REMOVE MOCK DATA (2 hours)

### 5.1 Fix OCR Router

**File:** `packages/api/src/routers/ocr.ts` (lines 29-77)

```typescript
// BEFORE - Mock data
let mockExtractedText = "";
let mockStructuredData = {};
// ... switch statement with fake data

// AFTER - Either implement real OCR or return honest response
export const extractDocument = protectedProcedure
  .use(requirePermission("documents.process"))
  .input(z.object({
    documentId: z.string().uuid(),
    documentType: z.enum(["INVOICE", "RECEIPT", "TAX_FORM", "ID_DOCUMENT"]),
  }))
  .mutation(async ({ ctx, input }) => {
    // Option 1: Integrate real OCR service (Tesseract, Google Vision, AWS Textract)
    // const result = await ocrService.extract(documentId);
    
    // Option 2: Mark as not implemented
    return {
      success: false,
      message: "OCR processing is not yet implemented. Documents must be entered manually.",
      extractedText: null,
      structuredData: null,
    };
  });
```

### 5.2 Fix Analytics Service

**File:** `packages/api/src/services/analytics-reporting.ts` (lines 502-654)

```typescript
// BEFORE - Mock data
const mockData = {
  summary: {
    totalRevenue: 125_000,
    // ...
  }
};

// AFTER - Real calculations from database
export async function generateAnalytics(params: AnalyticsParams) {
  const { startDate, endDate, businessId } = params;
  
  // Real revenue calculation
  const revenueResult = await db
    .select({
      total: sql<number>`SUM(${invoices.total}::numeric)`,
    })
    .from(invoices)
    .where(and(
      gte(invoices.paidDate, startDate),
      lte(invoices.paidDate, endDate),
      businessId ? eq(invoiceLineItems.businessId, businessId) : undefined,
    ));
  
  // Real client count
  const clientCount = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${clients.id})` })
    .from(clients)
    .innerJoin(clientBusinesses, eq(clients.id, clientBusinesses.clientId))
    .where(businessId ? eq(clientBusinesses.businessId, businessId) : undefined);
  
  return {
    summary: {
      totalRevenue: revenueResult[0]?.total || 0,
      clientCount: clientCount[0]?.count || 0,
      // ... real calculations
    },
  };
}
```

### 5.3 Fix Tax Filing Fallback

**File:** `packages/api/src/routers/tax.ts` (lines 1004-1053)

```typescript
// BEFORE - Returns fake data when empty
if (filings.length === 0) {
  return {
    success: true,
    data: {
      items: [
        { id: "fil-001", type: "VAT_RETURN", ... } // FAKE!
      ]
    }
  };
}

// AFTER - Return empty array honestly
if (filings.length === 0) {
  return {
    success: true,
    data: {
      items: [],
      message: "No tax filings found for the selected period.",
    },
  };
}
```

---

## PHASE 6: CI/CD FIXES (30 minutes)

### 6.1 Enable Lint in CI

**File:** `.github/workflows/ci.yml`

```yaml
# BEFORE
- name: Skip lint in CI
  run: echo "Lint skipped in CI - run locally"

# AFTER
- name: Run linting
  run: bun run lint
```

### 6.2 Make Tests Required

**File:** `.github/workflows/ci.yml`

```yaml
# BEFORE
- name: Run unit tests
  run: bun run test
  continue-on-error: true  # REMOVE THIS!

# AFTER
- name: Run unit tests
  run: bun run test
  # No continue-on-error - tests must pass
```

---

## PHASE 7: REMOVE CONSOLE.LOG STATEMENTS (1 hour)

### 7.1 Find All Console Statements

```bash
# Find all console.log in production code (excluding tests)
grep -rn "console.log\|console.warn\|console.error" \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="tests" --exclude-dir="node_modules" \
  packages/ apps/
```

### 7.2 Remove or Replace with Logger

For each occurrence:
- If debug statement: **Remove**
- If error logging: **Replace with proper logger**

```typescript
// BEFORE
console.log("Processing invoice:", invoiceId);

// AFTER - Either remove or use logger
import { logger } from "@/lib/logger";
logger.info("Processing invoice", { invoiceId });
```

### 7.3 Priority Files to Clean

1. `packages/api/src/services/analytics-reporting.ts`
2. `packages/api/src/services/ocr-processing.ts`
3. `packages/api/src/services/monitoring-observability.ts`
4. `packages/database/src/seed.ts`
5. `packages/database/src/seed-services.ts`
6. `apps/web/src/main.tsx` (12 statements!)

---

## PHASE 8: UI FIXES (3 hours)

### 8.1 Add Business Switcher Component

**File:** Create `apps/web/src/components/business-switcher.tsx`

```tsx
import { useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBusinessContext } from "@/contexts/business-context";
import { cn } from "@/lib/utils";

export function BusinessSwitcher() {
  const [open, setOpen] = useState(false);
  const { businesses, selectedBusiness, setSelectedBusiness } = useBusinessContext();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          <Building2 className="mr-2 h-4 w-4" />
          {selectedBusiness?.name || "All Businesses"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search business..." />
          <CommandEmpty>No business found.</CommandEmpty>
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                setSelectedBusiness(null); // All businesses
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  !selectedBusiness ? "opacity-100" : "opacity-0"
                )}
              />
              All Businesses
            </CommandItem>
            {businesses.map((business) => (
              <CommandItem
                key={business.id}
                onSelect={() => {
                  setSelectedBusiness(business);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedBusiness?.id === business.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {business.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### 8.2 Create Business Context

**File:** Create `apps/web/src/contexts/business-context.tsx`

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { orpc } from "@/utils/orpc";

interface Business {
  id: string;
  name: string;
  code: string;
  type: string;
}

interface BusinessContextType {
  businesses: Business[];
  selectedBusiness: Business | null;
  setSelectedBusiness: (business: Business | null) => void;
  isLoading: boolean;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user's assigned businesses
    orpc.businesses.list.query()
      .then((data) => {
        setBusinesses(data);
        setIsLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <BusinessContext.Provider
      value={{ businesses, selectedBusiness, setSelectedBusiness, isLoading }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error("useBusinessContext must be used within BusinessProvider");
  }
  return context;
}
```

### 8.3 Fix Empty onClick Handlers

```bash
# Find empty handlers
grep -rn "onClick={() => {}}" apps/web/src --include="*.tsx"
grep -rn "onClick={undefined}" apps/web/src --include="*.tsx"
```

For each occurrence, either:
1. Implement the handler
2. Remove the onClick if not needed
3. Add a TODO with explanation if pending

---

## PHASE 9: IMPLEMENT MISSING FEATURES (Estimated 2+ weeks)

### 9.1 Notifications Service

**File:** `packages/api/src/services/notifications.ts`

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(params: {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}) {
  // Implement real email sending
  const { to, subject, template, data } = params;
  
  const html = await renderTemplate(template, data);
  
  await resend.emails.send({
    from: 'GK-Nexus <noreply@gk-nexus.com>',
    to,
    subject,
    html,
  });
}

// Required templates:
// - welcome
// - password-reset
// - invoice-sent
// - deadline-reminder
// - case-status-update
```

### 9.2 Service Catalog Verification

Ensure ALL 41 services from the PDF are in the database:

**KAJ (20 services):**
- [ ] Income Tax Returns
- [ ] PAYE Returns
- [ ] Tender Compliance Certificate
- [ ] Work Permit Tax Compliance
- [ ] Land Transfer Compliance
- [ ] Liability Compliance (Firearm)
- [ ] Pension Compliance
- [ ] Certificate of Assessment
- [ ] Income/Expenditure Statements
- [ ] Bank Account Verification
- [ ] Cash Flow Projection
- [ ] Statements for Loans
- [ ] Statements for Investments
- [ ] Statement for Commissioner of Police
- [ ] NGO Audit
- [ ] Co-operative Society Audit
- [ ] NIS Registration
- [ ] NIS Contribution Schedules
- [ ] NIS Compliance Certificate
- [ ] NIS Pension Queries

**GCMC (21 services):**
- [ ] HR Management Training
- [ ] Customer Relations Training
- [ ] Co-operatives & Credit Unions Training
- [ ] Organisational Management Training
- [ ] Company Incorporation
- [ ] Business Registration
- [ ] Affidavits
- [ ] Agreement of Sales & Purchases
- [ ] Wills
- [ ] Settlement Agreement
- [ ] Separation Agreement
- [ ] Investment & Partnership Agreement
- [ ] Work Permit Application
- [ ] Citizenship Application
- [ ] Business Visa
- [ ] Land Occupation Proposal
- [ ] Investment Proposal
- [ ] Start-up Proposal
- [ ] Real Estate Agency Referral
- [ ] IT Services Referral
- [ ] Law Firm Referral

---

## PHASE 10: VERIFICATION (Do After Each Phase)

### 10.1 After Security Fixes (Phase 1)

```bash
# Verify no commented permissions
grep -rn "// .use(requirePermission" packages/api/src/routers/ | wc -l
# Should be 0

# Verify no password logging
grep -rn "console.log.*password\|console.log.*Password" packages/
# Should be 0

# Type check
bun run check-types
```

### 10.2 After Schema Changes (Phase 2)

```bash
# Generate migrations
cd packages/database
bun run db:generate

# Apply migrations
bun run db:migrate

# Verify tables created
bun run db:studio
# Check for: businesses, user_businesses, client_businesses, invoices, invoice_line_items, cases, case_services
```

### 10.3 After All Changes

```bash
# Full type check
bun run check-types

# Build all packages
bun run build

# Run tests
bun run test

# Start dev server and test manually
bun run dev
```

---

## SUMMARY CHECKLIST

### P0 - Critical (Do Today)

- [ ] Uncomment all 653 permission checks
- [ ] Remove hardcoded password fallback
- [ ] Remove password logging
- [ ] Fix cookie security (sameSite)
- [ ] Fix CORS configuration

### P1 - High (Do This Week)

- [ ] Create businesses table
- [ ] Create user_businesses join table
- [ ] Create client_businesses join table
- [ ] Update invoices schema with line item business IDs
- [ ] Create cases/engagements table
- [ ] Remove mock data from OCR
- [ ] Remove mock data from analytics
- [ ] Fix tax filing fallback
- [ ] Enable lint in CI
- [ ] Make tests required in CI

### P2 - Medium (Do This Sprint)

- [ ] Add business switcher to UI
- [ ] Create business context
- [ ] Remove console.log statements (42 files)
- [ ] Fix empty onClick handlers
- [ ] Implement email notifications
- [ ] Verify all 41 services in catalog

### P3 - Lower Priority

- [ ] Implement real OCR service
- [ ] Implement real GRA API integration
- [ ] Implement NIS e-services integration
- [ ] Add audit logging to all sensitive actions
- [ ] Add document expiry tracking

---

## ESTIMATED TOTAL EFFORT

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Security | 2 hours | P0 |
| Phase 2: Database | 4 hours | P1 |
| Phase 3: Seeds | 1 hour | P1 |
| Phase 4: API Updates | 4 hours | P1 |
| Phase 5: Remove Mock Data | 2 hours | P1 |
| Phase 6: CI/CD | 30 min | P1 |
| Phase 7: Console Cleanup | 1 hour | P2 |
| Phase 8: UI Fixes | 3 hours | P2 |
| Phase 9: Missing Features | 2+ weeks | P2-P3 |
| **TOTAL** | **~18 hours + 2 weeks** | |

---

**START WITH PHASE 1 NOW.** Security issues are critical and must be fixed before any other work.
