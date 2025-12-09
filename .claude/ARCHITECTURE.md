# GK-Nexus Official Architecture Standards

## 1. Core Technology Stack (Non-Negotiable)
* **Runtime:** Bun
* **API Engine:** oRPC (OpenRPC) running on Hono
* **Frontend:** TanStack Router + React
* **Database:** Drizzle ORM + PostgreSQL
* **Auth:** Better-Auth
* **Linting:** Ultracite (Biome) - STRICT compliance required.

## 2. API Router Architecture (Modular & Nested)
* **Pattern:** We use **Nested Routers** to strictly separate domains.
* **Naming:** `orpc.{domain}.{resource}.{action}`
    * ✅ `orpc.expediting.requests.list`
    * ❌ `orpc.expeditingRequestsList` (Forbidden: No flat prefixes)
* **File Structure:**
    * `packages/api/src/routers/index.ts` -> Exports the root `appRouter` object.
    * `packages/api/src/routers/{domain}.ts` -> Defines the router logic.

## 3. The "Schema-First" Rule (Critical for Inference)
To prevent the type inference issues that caused previous bugs:
* **Input/Output:** EVERY procedure must have an explicit `.input()` and `.output()` Zod schema.
* **Prohibition:** usage of `z.any()` or `unknown` in schemas is **STRICTLY FORBIDDEN**.
* **Result:** This ensures the frontend client (`orpc.expediting...`) gets perfect autocomplete.

## 4. Authentication & Security
* **Public Routes:** Use `publicProcedure` (e.g., health checks, login).
* **Protected Routes:** Use `protectedProcedure` for all business logic.
* **Context:** Assume `ctx.user` or `ctx.session` is available in `protectedProcedure`.

## 5. Coding Standards (from AGENTS.md)
* **Async:** Always use `async/await`. Never use promise chains.
* **Errors:** Throw descriptive `Error` objects (or oRPC specific errors). Do not return error strings.
* **Naming:** Use verbs for actions (`create`, `list`, `update`, `delete`).

## 6. Frontend Integration
* **Hooks:** Use `useQuery` for reads, `useMutation` for writes.
* **Paths:** Update `apps/web` to match the nested API structure exactly.
