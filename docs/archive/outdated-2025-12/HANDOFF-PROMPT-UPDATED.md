# GK-Nexus Handoff Prompt (Updated December 2025)

> Copy this when starting a new Claude session.

---

## Main Prompt (For Complete Restructuring)

```
I'm working on GK-Nexus, a tax consultancy app that needs COMPLETE restructuring to align with Better-T-Stack patterns.

## CRITICAL: Read These First
1. `docs/GK-NEXUS-COMPLETE-RESTRUCTURE.md` - Full restructuring guide
2. `.claude/CLAUDE.md` - Rules and patterns
3. `.claude/CONVENTIONS.md` - Code patterns (FLAT routers required)

## The Problem
The current codebase has:
- Nested oRPC routers causing type issues
- Document filter not working (shows all docs regardless of services)
- Navigation broken (submenus show same pages)
- Buttons non-functional
- Forms not saving correctly

## The Solution
Follow the restructuring guide to:
1. FLATTEN all oRPC routers (Phase 1)
2. Update all frontend API calls (Phase 2)
3. Fix document filter (Phase 3)
4. Fix all navigation (Phase 4)
5. Fix all buttons & actions (Phase 5)
6. Fix all forms & wizards (Phase 6)
7. Full verification (Phase 7)

## Tech Stack (DO NOT SUBSTITUTE)
- Bun, React+TanStack Router, Hono, oRPC, Better-auth, Drizzle

## Required Router Pattern (FLAT)
```typescript
// CORRECT
export const appRouter = {
  clientCreate,
  clientList,
  clientContactList,
  dashboardOverview,
  taxCalculatePAYE,
};

// Frontend
await client.clientCreate(data);
```

## Verification
- `bun run dev` works
- `npx tsc --noEmit` passes
- Browser console clean
- ALL features tested manually

## Credentials
- Email: admin@gk-nexus.com
- Password: Admin123!@#
```

---

## Quick Prompt (For Ongoing Work)

```
Continue GK-Nexus restructuring. Follow docs/GK-NEXUS-COMPLETE-RESTRUCTURE.md.

Current phase: [PHASE NUMBER]
Last completed: [WHAT WAS DONE]
Next step: [WHAT TO DO]

Remember:
- FLAT routers only (no nesting)
- Test every change in browser
- Update RESTRUCTURE-LOG.md
```
