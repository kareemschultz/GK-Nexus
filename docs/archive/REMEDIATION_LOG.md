# Remediation & Standardization Plan (Daybreak)

**Date:** 2025-12-09
**Status:** Analysis Complete

## 1. Architectural Alignment Analysis

### Router Architecture
**Current State:** Hybrid / Inconsistent.
- **Pattern A (Flat):** `users.ts`, `clients.ts` export individual procedures (`userList`, `clientCreate`).
- **Pattern B (Modular):** `service-catalog.ts` exports a single router object (`serviceCatalogRouter`).
- **Assembly:** `packages/api/src/routers/index.ts` manually imports functions from Pattern A and spreads objects from Pattern B.

**Better-T-Stack Principle:** Modular, self-contained routers combined in a root router.
**Verdict:** **Deviation.** The "Flat" pattern requires manual maintenance in the index file, increasing the risk of human error (forgetting to register a procedure).
**Action:** Standardize on **Pattern B** (Router Objects).

### Type Safety
**Current State:** Compromised.
- **Issue 1:** `service-catalog.ts` uses `z.any()` for complex fields (`requiredDocuments`, `metadata`, `tags`). This bypasses type checking.
- **Issue 2:** `users.ts` uses `as any` casts to interface with `@GK-Nexus/auth`.
**Verdict:** **Gaps Found.**
**Action:** Define proper Zod schemas for JSON fields (e.g., `z.record(z.string(), z.unknown())` or specific interfaces). Fix auth type definitions.

### Security
**Current State:** **GOOD** (Contrary to previous Gap Analysis).
- `requirePermission` middleware is **active** in core routers (`clients.ts`).
- Rate limiting is configured in `apps/server`.
**Action:** Maintain current posture. Verify coverage across *all* routers.

## 2. Remediation Todo List

### Phase 1: Standardization (High Priority)
- [ ] Refactor `users.ts` to export a `usersRouter` object.
- [ ] Refactor `clients.ts` to export a `clientsRouter` object.
- [ ] Update `packages/api/src/routers/index.ts` to use the new router objects instead of manual composition.

### Phase 2: Type Hardening (Medium Priority)
- [ ] Replace `z.any()` in `service-catalog.ts` with `z.record()` or specific schemas.
- [ ] Investigate and fix `@GK-Nexus/auth` type mismatches in `users.ts`.

### Phase 3: Documentation Update (Low Priority)
- [ ] Update `PROJECT_GAP_ANALYSIS.md` to reflect that security permissions are fixed.
- [ ] Archive `FAILURE_INVENTORY.md` if cleared.