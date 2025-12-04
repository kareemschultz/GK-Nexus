# GK-Nexus Code Conventions

Canonical patterns from Better-T-Stack base scaffold and GK-Nexus implementation.

---

## 1. Navigation Components

### Base Scaffold Pattern (SIMPLE)

```tsx
import { Link } from "@tanstack/react-router";

<Link to="/dashboard">Dashboard</Link>
```

### GK-Nexus Pattern (CORRECT)

```tsx
// Leaf items - direct Link
<Link
  to={item.to}
  className={cn(
    "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
    active && "bg-accent text-accent-foreground"
  )}
>
  <item.icon className="h-4 w-4" />
  <span>{item.title}</span>
</Link>

// Parent items - button for expand only
<button
  onClick={() => toggleExpanded(item.title)}
  type="button"
  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm"
>
  <item.icon className="h-4 w-4" />
  <span>{item.title}</span>
  {isExpanded ? <ChevronDown /> : <ChevronRight />}
</button>
```

### If Using shadcn/ui Sidebar (Must use asChild)

```tsx
// ❌ BROKEN
<SidebarMenuButton>
  <Link to="/dashboard">Dashboard</Link>
</SidebarMenuButton>

// ✅ CORRECT
<SidebarMenuButton asChild>
  <Link to="/dashboard">Dashboard</Link>
</SidebarMenuButton>
```

---

## 2. oRPC Router Patterns

### REQUIRED: FLAT Structure (Better-T-Stack Standard)

**Nested routers cause type inference issues, broken API calls, and navigation problems. ALWAYS use flat.**

```typescript
// packages/api/src/routers/index.ts - CORRECT
import { protectedProcedure, publicProcedure } from "../index";
import { clientCreate, clientGetById, clientList, clientContactList } from "./clients";
import { dashboardOverview, dashboardStats } from "./dashboard";
import { taxCalculatePAYE, taxCalculateNIS, taxFilingCreate } from "./tax";

export const appRouter = {
  // Health
  healthCheck: publicProcedure.handler(() => "OK"),
  
  // Clients - FLAT with prefix
  clientCreate,
  clientGetById,
  clientList,
  clientContactList,
  clientContactCreate,
  
  // Dashboard
  dashboardOverview,
  dashboardStats,
  
  // Tax
  taxCalculatePAYE,
  taxCalculateNIS,
  taxFilingCreate,
  
  // ALL procedures at root level
};

export type AppRouter = typeof appRouter;
```

### Individual Router File Pattern

```typescript
// packages/api/src/routers/clients.ts - CORRECT
import { protectedProcedure } from "../index";
import { createClientSchema, updateClientSchema } from "../schemas/client";

export const clientCreate = protectedProcedure
  .input(createClientSchema)
  .handler(async ({ input, context }) => {
    // Implementation
  });

export const clientGetById = protectedProcedure
  .input(z.object({ id: z.string() }))
  .handler(async ({ input, context }) => {
    // Implementation
  });

export const clientList = protectedProcedure
  .input(listQuerySchema)
  .handler(async ({ input, context }) => {
    // Implementation
  });

export const clientContactList = protectedProcedure
  .input(z.object({ clientId: z.string() }))
  .handler(async ({ input, context }) => {
    // Implementation
  });

// Export each procedure individually - NO nested objects
```

### Naming Convention

| Pattern | Example |
|---------|---------|
| `{domain}{Action}` | `clientCreate` |
| `{domain}{SubDomain}{Action}` | `clientContactCreate` |
| `{domain}{Action}{Detail}` | `taxCalculatePAYE` |

### ❌ NEVER DO THIS (Nested)

```typescript
// WRONG - causes type issues and broken functionality
export const appRouter = {
  clients: {
    create: protectedProcedure.handler(...),
    contacts: {
      list: protectedProcedure.handler(...),  // Triple nesting = broken
    },
  },
};
```

### Frontend Usage

```typescript
import { client } from "@/utils/orpc";

// CORRECT - flat calls
await client.clientCreate({ name: "Test" });
await client.clientContactList({ clientId: "123" });
await client.taxCalculatePAYE({ income: 100000 });
await client.dashboardOverview();

// With TanStack Query
const { data } = orpc.clientList.useQuery({ input: { page: 1 } });
const mutation = orpc.clientCreate.useMutation();
```

---

## 3. Route Definition Pattern

```typescript
// apps/web/src/routes/dashboard.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

function DashboardPage() {
  return <Dashboard />;
}
```

### File-Based Routing

| File | Route |
|------|-------|
| `routes/index.tsx` | `/` |
| `routes/dashboard.tsx` | `/dashboard` |
| `routes/clients/index.tsx` | `/clients` |
| `routes/clients/[id].tsx` | `/clients/:id` |

---

## 4. Type Definitions

### Prefer `type` over `interface`

```typescript
// ✅ Preferred (Biome enforced)
type TimeEntry = {
  id: string;
  project: string;
  duration: number;
};

// ❌ Avoid
interface TimeEntry {
  id: string;
  project: string;
  duration: number;
}
```

---

## 5. Conditional Styling

### Use Helper Functions (Not Nested Ternaries)

```typescript
// ❌ WRONG - nested ternary
className={index < current ? "bg-primary" : index === current ? "bg-primary/20" : "bg-muted"}

// ✅ CORRECT - helper function
const getStepClass = (index: number) => {
  if (index < currentStep) return "bg-primary text-primary-foreground";
  if (index === currentStep) return "border-2 border-primary bg-primary/20";
  return "bg-muted text-muted-foreground";
};

// Usage
className={getStepClass(index)}
```

### Or Use Object Lookup

```typescript
// ✅ ALSO CORRECT - object lookup
const variantMap: Record<string, string> = {
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  default: "bg-gray-500",
};

className={variantMap[status] ?? variantMap.default}
```

---

## 6. React Keys

### Use Unique Identifiers (Not Array Index)

```tsx
// ❌ WRONG
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}

// ✅ CORRECT
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}

// ✅ ALSO CORRECT (if no id, use unique property)
{steps.map((step) => (
  <div key={step.title}>{step.title}</div>
))}
```

---

## 7. Interactive Elements

### Use Semantic HTML

```tsx
// ❌ WRONG - div is not interactive
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>

// ✅ CORRECT - button is interactive
<button onClick={handleClick} type="button" className="cursor-pointer">
  Click me
</button>

// ✅ CORRECT - for navigation
<Link to="/somewhere" className="cursor-pointer">
  Go somewhere
</Link>
```

---

## 8. Regex and Constants

### Module-Level Constants

```typescript
// ✅ CORRECT - at top of file
const TIN_REGEX = /^[0-9]{3}-[0-9]{6}$/;
const NIS_REGEX = /^[A-Z]{2}[0-9]{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// In component
const isValidTIN = TIN_REGEX.test(tinValue);
```

---

## 9. Lucide Icons

### Import and Usage

```typescript
// Import specific icons
import {
  Calendar,
  Clock,
  Home,
  Square,  // Must import if using!
  Users,
} from "lucide-react";

// Usage
<Home className="h-4 w-4" />
<Users className="h-5 w-5 text-muted-foreground" />
```

### Icon Map Pattern (For Dynamic Icons)

```typescript
type IconName = "Home" | "Users" | "Clock";

const ICON_MAP: Record<IconName, React.ComponentType<{ className?: string }>> = {
  Home,
  Users,
  Clock,
};

// Store name (serializable)
const widget = { iconName: "Home" as IconName };

// Render from map
const Icon = ICON_MAP[widget.iconName];
<Icon className="h-4 w-4" />
```

---

## 10. Error Handling

### Server-Side

```typescript
import { ORPCError } from "@orpc/server";

// In handler
if (!user) {
  throw new ORPCError("UNAUTHORIZED", "Authentication required");
}

if (!client) {
  throw new ORPCError("NOT_FOUND", "Client not found");
}

if (!hasPermission) {
  throw new ORPCError("FORBIDDEN", "Insufficient permissions");
}
```

### Client-Side (Global Handler)

```typescript
// apps/web/src/utils/orpc.ts
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  }),
});
```

---

## 11. Package Imports

### Cross-Package

```typescript
import type { AppRouterClient } from "@GK-Nexus/api/routers/index";
import { auth } from "@GK-Nexus/auth";
import { db, businessSchema } from "@GK-Nexus/db";
```

### Within App (Path Aliases)

```typescript
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { client } from "@/utils/orpc";
import { cn } from "@/lib/utils";
```

---

## 12. Form Handling

### TanStack Form + Zod

```typescript
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

const form = useForm({
  defaultValues: { name: "", email: "" },
  validatorAdapter: zodValidator(),
  validators: { onChange: schema },
  onSubmit: async ({ value }) => {
    await client.clients.create(value);
  },
});
```

---

## Quick Reference Commands

```bash
# Find linting issues
npx ultracite check

# Auto-fix issues
npx ultracite fix

# Find all icon imports
grep -rn "from \"lucide-react\"" apps/web/src --include="*.tsx"

# Find nested ternaries
grep -rn "? .* : .* ?" apps/web/src --include="*.tsx"

# Find div with onClick
grep -rn "<div.*onClick" apps/web/src --include="*.tsx"
```
