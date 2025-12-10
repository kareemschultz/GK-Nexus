# Failure Inventory

**Total Failures:** 1386  
**Artifact Folders on Disk:** 8 (All belonging to the Auth category)

## Breakdown by Feature

### 1. Authentication
**Total Failures:** 461  
**Artifact Folders:** 8 (in `test-results/artifacts/`)  

*Hotspots:*
- `tests/security.spec.ts`: **203 failures**
- `tests/auth/authentication.spec.ts`: **174 failures**
- `tests/multi-role-scenarios.spec.ts`: **84 failures**

### 2. Workflows & Wizard
**Total Failures:** 255  
**Artifact Folders:** 0  

*Hotspots:*
- `tests/onboarding/client-onboarding.spec.ts`: **175 failures**
- `tests/workflows/tax-calculation-workflow.spec.ts`: **56 failures**
- `tests/services-wizard.spec.ts`: **17 failures**
- `tests/client-creation.spec.ts`: **7 failures**

### 3. Dashboard
**Total Failures:** 189  
**Artifact Folders:** 0  

*Hotspots:*
- `tests/dashboard/dashboard-interactions.spec.ts`: **189 failures**

### 4. Visuals
**Total Failures:** 52  
**Artifact Folders:** 0 (but 15 screenshot files exist in `test-results/screenshots/`)  

*Hotspots:*
- `tests/screenshot-all-routes.spec.ts`: **45 failures**
- `tests/visual/screenshot-all-routes.spec.ts`: **7 failures**

### 5. System / Comprehensive (Other)
**Total Failures:** 429  
**Artifact Folders:** 0  

*Hotspots:*
- `tests/comprehensive-pages.spec.ts`: **220 failures**
- `tests/performance.spec.ts`: **112 failures**
- `tests/comprehensive-audit.spec.ts`: **40 failures**
- `tests/quick-route-verification.spec.ts`: **36 failures**
- `tests/verify-fixes.spec.ts`: **12 failures**
- `tests/quick-button-test.spec.ts`: **9 failures**
