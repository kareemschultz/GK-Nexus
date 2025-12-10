# GK-Nexus Project Status & Architecture

**Last Updated:** 2025-12-09
**Status:** Active Remediation

## Executive Summary

GK-Nexus is a tax consultancy platform for Guyana, built on the **Better-T-Stack** (Hono, React 19, TanStack Router, Drizzle, oRPC).

The project is currently undergoing a **Standardization Phase** to align with the modular "Nested Router" architecture.

## 1. Architecture Standards

### API Layer (In Progress)
- **Pattern:** Nested / Modular Routers.
- **Structure:**
  - `packages/api/src/routers/users.ts` -> Exports `usersRouter` object.
  - `packages/api/src/routers/index.ts` -> Assembles `appRouter = { users: usersRouter, ... }`.
- **Client Usage:** `orpc.users.list.useQuery(...)` (NOT `orpc.userList`).

### Authentication & Security
- **Auth Provider:** Better-Auth (Session-based).
- **Permissions:** Middleware (`requirePermission`) enabled on all protected routes.
- **Rate Limiting:** Enabled (100 req/15min).

### Database
- **ORM:** Drizzle.
- **Validation:** Zod schemas.
- **Multi-tenancy:** Organization-based isolation (Partial implementation).

## 2. Current Remediation Goals

1.  **Refactor API Routers:** Convert all "Flat" routers (`users.ts`, `clients.ts`) to "Modular" routers.
2.  **Fix Frontend Calls:** Ensure all frontend API calls match the new nested structure.
3.  **Harden Types:** Replace `z.any()` in schemas with strict types.
4.  **Documentation:** Keep this file as the single source of truth.

## 3. Known Issues

- **Dashboard Schema:** References non-existent `businessSchema.client` (Fix pending).
- **Type Safety:** `service-catalog.ts` uses `z.any()` extensively (Fix pending).
- **Frontend/Backend Mismatch:** Some frontend routes expect nested API calls, but backend currently serves flat ones (Fix in progress).

## 4. Operational Logs

- **Active Work Log:** See `REMEDIATION_LOG.md` for task tracking.
- **Archived Logs:** See `docs/archive/` for historical reports.
