# GK-Nexus Official Architecture Standards

## 1. Core Technology Stack (Non-Negotiable)

| Component | Technology |
|-----------|------------|
| **Runtime** | Bun |
| **API Engine** | oRPC (OpenRPC) running on Hono |
| **Frontend** | TanStack Router + React |
| **Database** | Drizzle ORM + PostgreSQL |
| **Auth** | Better-Auth |
| **Linting** | Ultracite (Biome) - STRICT compliance required |
| **Monorepo** | Turborepo with bun workspaces |

## 2. API Router Architecture (Modular & Nested)

### Overview
We use **Nested Routers** following oRPC's pattern to strictly separate domains and provide clean, hierarchical API organization.

### Naming Convention
* **Pattern:** `orpc.{domain}.{resource}.{action}`
    * ✅ `orpc.training.courses.list`
    * ✅ `orpc.expediting.requests.create`
    * ✅ `orpc.tax.filings.list`
    * ❌ `orpc.trainingCoursesList` (Forbidden: No flat prefixes)
    * ❌ `orpc.expeditingRequestsList` (Forbidden: No camelCase concatenation)

### File Structure
```
packages/api/
├── src/
│   ├── index.ts              → Exports oRPC primitives (o, publicProcedure, protectedProcedure, requirePermission)
│   └── routers/
│       ├── index.ts          → Exports the root `appRouter` object with NESTED structure
│       ├── ai.ts             → AI domain procedures (flat exports internally)
│       ├── appointments.ts   → Appointments domain procedures
│       ├── audit.ts          → Audit domain procedures
│       ├── backup.ts         → Backup domain procedures
│       ├── clients.ts        → Clients domain procedures
│       ├── compliance.ts     → Compliance domain procedures
│       ├── dashboard.ts      → Dashboard domain procedures
│       ├── documents.ts      → Documents domain procedures
│       ├── expediting.ts     → Expediting domain procedures
│       ├── gra-integration.ts → GRA integration procedures
│       ├── immigration.ts    → Immigration domain procedures
│       ├── invoices.ts       → Invoices domain procedures
│       ├── local-content.ts  → Local content domain procedures
│       ├── notifications.ts  → Notifications domain procedures
│       ├── ocr.ts            → OCR domain procedures
│       ├── partner-network.ts → Partner network domain procedures
│       ├── payroll.ts        → Payroll domain procedures
│       ├── property-management.ts → Property management domain procedures
│       ├── rbac.ts           → RBAC domain procedures
│       ├── service-catalog.ts → Service catalog domain procedures
│       ├── tax.ts            → Tax domain procedures
│       ├── training.ts       → Training domain procedures
│       └── users.ts          → Users domain procedures
```

### Router Implementation Pattern

Individual router files export **flat procedures** with descriptive names:
```typescript
// packages/api/src/routers/training.ts
export const trainingCoursesList = protectedProcedure
  .use(requirePermission("training.read"))
  .input(courseQuerySchema)
  .handler(async ({ input, context }) => { ... });

export const trainingCoursesCreate = protectedProcedure
  .use(requirePermission("training.create"))
  .input(createCourseSchema)
  .handler(async ({ input, context }) => { ... });
```

The main router file (`index.ts`) organizes them into a **nested structure**:
```typescript
// packages/api/src/routers/index.ts
export const appRouter = {
  // Health check endpoints (public)
  healthCheck: publicProcedure.handler(() => "OK"),

  // Training domain - NESTED structure
  training: {
    courses: {
      list: trainingCoursesList,
      getById: trainingCoursesGetById,
      create: trainingCoursesCreate,
      update: trainingCoursesUpdate,
      publish: trainingCoursesPublish,
      stats: trainingCoursesStats,
    },
    sessions: {
      list: trainingSessionsList,
      getById: trainingSessionsGetById,
      create: trainingSessionsCreate,
      update: trainingSessionsUpdate,
    },
    certificates: {
      list: trainingCertificatesList,
      issue: trainingCertificatesIssue,
      verify: trainingCertificatesVerify,
    },
  },

  // Tax domain - NESTED structure
  tax: {
    filings: {
      list: taxFilingsList,
      submitVat: taxSubmitVatReturn,
      submitPaye: taxSubmitPayeReturn,
    },
    calculate: {
      paye: taxCalculatePaye,
      nis: taxCalculateNis,
      vat: taxCalculateVat,
    },
  },

  // ... other domains follow same pattern
};
```

### oRPC Documentation References

oRPC routers are simple JavaScript objects where each key corresponds to a procedure. Nesting is achieved by including objects as values:

```typescript
import { os } from '@orpc/server'

const router = {
  ping: os.handler(async () => 'ping'),
  nested: {
    pong: os.handler(async () => 'pong')
  }
}
```

**Middleware Application:**
```typescript
const router = os.use(requiredAuth).router({
  ping,
  nested: { ping }
})
```

**Lazy Loading (for code splitting):**
```typescript
const router = {
  ping,
  planet: os.lazy(() => import('./planet'))
}
```

Sources:
- [oRPC Router Documentation](https://orpc.dev/docs/router)
- [oRPC Monorepo Setup](https://orpc.dev/docs/best-practices/monorepo-setup)
- [Better-T-Stack GitHub](https://github.com/AmanVarshney01/create-better-t-stack)

## 3. The "Schema-First" Rule (Critical for Type Inference)

To prevent type inference issues:
* **Input/Output:** EVERY procedure must have an explicit `.input()` and `.output()` Zod schema.
* **Prohibition:** Usage of `z.any()` or `unknown` in schemas is **STRICTLY FORBIDDEN**.
* **Result:** This ensures the frontend client gets perfect autocomplete.

```typescript
// ✅ GOOD - Explicit schemas
export const trainingCoursesList = protectedProcedure
  .input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    search: z.string().optional(),
  }))
  .output(z.object({
    success: z.boolean(),
    data: z.object({
      items: z.array(courseSchema),
      pagination: paginationSchema,
    }),
  }))
  .handler(async ({ input }) => { ... });

// ❌ BAD - No input schema, any types
export const getCourses = protectedProcedure
  .handler(async ({ input }: any) => { ... });
```

## 4. Authentication & Security

| Route Type | Procedure | Usage |
|------------|-----------|-------|
| **Public** | `publicProcedure` | Health checks, login, public APIs |
| **Protected** | `protectedProcedure` | All business logic |
| **Permission-based** | `protectedProcedure.use(requirePermission(...))` | Fine-grained access control |

### Context
- `ctx.user` or `ctx.session` is available in `protectedProcedure`
- `ctx.db` provides database access via Drizzle ORM

### Permission Middleware
```typescript
export const trainingCoursesList = protectedProcedure
  .use(requirePermission("training.read"))  // Requires training.read permission
  .input(...)
  .handler(...);
```

## 5. Coding Standards (from AGENTS.md)

### Async
- Always use `async/await`. Never use promise chains.
- Handle errors with try-catch blocks.

### Errors
- Throw descriptive `ORPCError` objects. Do not return error strings.
```typescript
import { ORPCError } from "@orpc/server";

throw new ORPCError("NOT_FOUND", { message: "Course not found" });
throw new ORPCError("FORBIDDEN", { message: "Insufficient permissions" });
throw new ORPCError("BAD_REQUEST", { message: "Invalid input data" });
```

### Naming
- Use verbs for actions: `create`, `list`, `update`, `delete`, `getById`
- Use nouns for resources: `courses`, `sessions`, `certificates`

## 6. Frontend Integration

### Hooks
- Use `useQuery` for reads, `useMutation` for writes
- Use TanStack Query for data fetching and caching

### API Client Pattern
```typescript
// apps/web/src/utils/orpc.ts
import { createORPCClient } from "@orpc/client";
import type { AppRouter } from "@GK-Nexus/api";

export const client = createORPCClient<AppRouter>({
  baseURL: import.meta.env.VITE_API_URL,
});
```

### Usage in Components
```typescript
// Frontend calls use nested paths that match backend structure
const { data, isLoading } = useQuery({
  queryKey: ["training", "courses"],
  queryFn: () => client.training.courses.list({
    page: 1,
    limit: 20,
    search: searchTerm,
  }),
});

// Mutations
const createCourse = useMutation({
  mutationFn: (data) => client.training.courses.create(data),
  onSuccess: () => queryClient.invalidateQueries(["training", "courses"]),
});
```

## 7. Monorepo Structure

```
GK-Nexus/
├── apps/
│   ├── web/              → React frontend (TanStack Router)
│   ├── server/           → Hono backend server
│   └── docs/             → Astro documentation site
├── packages/
│   ├── api/              → oRPC router definitions and procedures
│   ├── auth/             → Better-Auth configuration
│   ├── db/               → Drizzle ORM schema and migrations
│   └── config/           → Shared TypeScript configuration
├── turbo.json            → Turborepo configuration
├── package.json          → Root package.json with workspace config
└── bun.lockb             → Bun lockfile
```

### Running Commands
```bash
# Development
bun run dev              # Start all apps in development mode
bun run dev:web          # Start only the web app
bun run dev:server       # Start only the server

# Database
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio
bun run db:migrate       # Run migrations

# Build & Check
bun run build            # Build all packages
npx ultracite check      # Check code quality
npx ultracite fix        # Auto-fix issues
```

## 8. Implementation Notes

### Router Types by Domain
Some domains use slightly different internal naming patterns:
- **Standard nested routers**: `clients`, `users`, `invoices`, `appointments`, `documents`, `dashboard`, etc.
- **Service catalog router**: Uses flat procedure names like `servicesList`, `projectsList` (accessed as `serviceCatalog.servicesList`)

### Frontend API Usage Pattern
Components use dynamic imports for lazy loading:
```typescript
// Pattern used throughout the codebase
const { data } = useQuery({
  queryKey: ["domain", "resource"],
  queryFn: async () => {
    const { client } = await import("@/utils/orpc");
    return client.domain.resource.action({ ...params });
  },
});
```

### Known Limitations
1. **Password Reset**: Email provider not configured. `forgetPassword` functionality requires Better-Auth email configuration.
2. **Docs App**: Uses Zod v3 override due to Astro/Starlight incompatibility with Zod v4.

## 9. Version History

| Date | Changes |
|------|---------|
| 2025-12-10 | Fixed frontend API patterns to use nested router structure. Fixed TypeScript compilation errors. |
| 2025-12-10 | Added Zod v3 override for docs app to resolve Starlight compatibility issue. |
