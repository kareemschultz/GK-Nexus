# Test Suite Repair Plan

**Total Failures:** 1,386 (Initial) → **19 auth test failures remaining**
**Date:** 2025-12-08
**Updated:** 2025-12-08
**Priority:** Critical - Authentication blocking all downstream tests

---

## Progress Summary

- **Auth tests passing:** 7/26 (up from 4/26)
- **oRPC syntax fixes:** 29 occurrences across 7 files
- **Routes created:** `/register`, `/forgot-password`, `/reset-password`
- **Test users seeded:** 9 users including admin, client, manager, staff, security roles

---

## Root Cause Analysis (Phase 1)

The authentication failures stem from **selector/element mismatches** between what the test suite expects and what the application actually provides:

### Primary Issues Identified:

1. **Missing `data-testid` attributes** - Tests expect elements that don't exist:
   - ~~`[data-testid="user-menu"]`~~ ✅ FIXED - Added to enterprise-sidebar.tsx
   - ~~`[data-testid="forgot-password-link"]`~~ ✅ FIXED - Added to sign-in-form.tsx
   - ~~`[data-testid="register-link"]`~~ ✅ FIXED - Added to sign-in-form.tsx
   - ~~`[data-testid="login-error"]`~~ ✅ FIXED - Added to sign-in-form.tsx
   - ~~`[data-testid="session-expired-message"]`~~ ✅ FIXED - Added to sign-in-form.tsx
   - ~~`[data-testid="rate-limit-error"]`~~ ✅ FIXED - Added to sign-in-form.tsx

2. ~~**Test users don't exist in database**~~ ✅ FIXED - Created `packages/db/src/seed-test-users.ts`

3. ~~**Environment variables not configured**~~ ✅ FIXED - Created `.env.test`

4. **Security tests use different credentials** - ✅ FIXED - Seed script includes security test users

5. ~~**Form error IDs differ**~~ ✅ FIXED - Updated FormError component to accept data-testid prop

---

## Phase 1: Critical Auth Fixes

**Files:** `tests/security.spec.ts`, `tests/auth/authentication.spec.ts`
**Impact:** Unblocks 461 failures + downstream tests

### Selector & Element Fixes

- [x] Add `data-testid="user-menu"` to dashboard header/nav component
- [x] Add `data-testid="logout-button"` to user menu dropdown
- [x] Add `data-testid="forgot-password-link"` to sign-in form
- [x] Add `data-testid="register-link"` to sign-in form switch button
- [x] Add `data-testid="login-error"` wrapper for authentication errors
- [x] Add `data-testid="session-expired-message"` to login page (query param triggered)
- [x] Add `data-testid="rate-limit-error"` for rate limiting feedback
- [x] Add `data-testid="user-name"` to display logged-in user name

### Form Error Handling

- [x] Update `FormError` component to accept/use `data-testid` prop
- [x] Ensure error elements have `data-testid="{field}-error"` pattern
- [x] Add `data-testid="email-error"` and `data-testid="password-error"` to sign-in form

### Test Database Seeding

- [x] Create test database seed script with fixture users
- [x] Seed users: `admin@test.com`, `client@test.com`, `manager@test.com`, `staff@test.com`
- [x] Seed security test users: `security.staff@test.com`, `security.manager@test.com`, `security.admin@test.com`
- [ ] Add seed script to test setup/beforeAll hooks (optional - can be run manually)

### Environment Configuration

- [x] Create `.env.test` file with test credentials
- [x] Set `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`
- [x] Set `TEST_CLIENT_EMAIL`, `TEST_CLIENT_PASSWORD`
- [ ] Update `playwright.config.ts` to load `.env.test` (optional)

### Security Test Alignment

- [x] Align `securityAuth()` helper credentials with seeded users
- [ ] Add missing security-related UI elements (NOT IMPLEMENTED - features don't exist):
  - [ ] `[data-testid="account-locked-error"]` - requires backend rate limiting
  - [ ] `[data-testid="captcha-challenge"]` - CAPTCHA not implemented
- [ ] ~~Verify CSRF token element exists~~ - better-auth doesn't use form-based CSRF tokens

### Remaining Issues (Features Not Implemented)

These tests are failing because the **features don't exist** in the application:

1. **CSRF Token** - better-auth uses HTTP-only cookies, not CSRF form tokens
2. **Google OAuth** - No OAuth provider buttons implemented
3. **2FA/MFA** - Two-factor authentication not implemented
4. **Remember Me** - No "remember me" checkbox functionality
5. **Secure Headers** - Security headers not configured (X-Frame-Options, etc.)
6. **Rate Limiting UI** - Backend rate limiting responses not connected to UI

**Recommendation:** Skip these tests until features are implemented, or mark as TODO

---

## Phase 2: Unblock Wizard & Workflows

**Files:** `tests/onboarding/client-onboarding.spec.ts`, `tests/workflows/tax-calculation-workflow.spec.ts`
**Impact:** Unblocks 255 failures

### Onboarding Wizard Selectors

- [ ] Add `data-testid="onboarding-wizard"` to wizard container
- [ ] Add `data-testid="wizard-progress"` to progress component
- [ ] Add `data-testid="step-indicator"` to step indicator
- [ ] Add `data-testid="step-1"` through `data-testid="step-5"` to step elements
- [ ] Add `data-testid="progress-bar"` with `aria-valuenow` and `aria-valuemax`
- [ ] Add `data-testid="progress-text"` for "Step X of Y" display

### Form Input Test IDs

- [ ] Add `data-testid="client-name-input"`
- [ ] Add `data-testid="client-email-input"`
- [ ] Add `data-testid="client-phone-input"`
- [ ] Add `data-testid="next-step-button"` and `data-testid="prev-step-button"`
- [ ] Add validation error test IDs: `client-name-error`, `client-email-error`, etc.

### Step-Specific Elements

- [ ] Step 2: `business-details-form`, `tax-id-input`, `business-type-select`, `industry-select`
- [ ] Step 3: `street-address-input`, `city-input`, `state-input`, `zip-code-input`, `country-select`
- [ ] Step 4: Service checkboxes with test IDs, `communication-preference-select`
- [ ] Step 5: `business-license-upload`, `complete-onboarding-button`

### Draft/Persistence Features

- [ ] Add `data-testid="save-draft-button"`
- [ ] Add `data-testid="draft-indicator"`
- [ ] Add `data-testid="drafts-list"` and `data-testid="draft-item"`
- [ ] Add `data-testid="resume-draft-button"`

### Toast Notifications

- [ ] Ensure toast component has `data-testid="toast"`
- [ ] Verify toast messages match expected strings in tests

---

## Phase 3: Visual & Branding

**Files:** `tests/screenshot-all-routes.spec.ts`, `tests/visual/screenshot-all-routes.spec.ts`
**Impact:** Fixes 52 failures

### Invoice Number Prefixes

- [ ] Verify invoice numbers use "KAJ" prefix format (e.g., `KAJ-2024-001`)
- [ ] Update invoice generation logic if using different prefix
- [ ] Check all invoice display components show correct prefix

### Client Reference Prefixes

- [ ] Verify client references use "GCMC" prefix format
- [ ] Update client ID generation if needed
- [ ] Check client cards/lists display correct prefix

### Visual Consistency

- [ ] Update baseline screenshots after auth fixes
- [ ] Ensure consistent branding across all pages
- [ ] Verify logo and brand colors render correctly

### Screenshot Test Maintenance

- [ ] Run visual tests in isolation after Phases 1-2 complete
- [ ] Update snapshot baselines for changed components
- [ ] Consider increasing visual diff threshold if minor variations expected

---

## Execution Order

```
1. Phase 1 (Auth) - MUST complete first
   ├── Database seeding
   ├── Environment variables
   ├── Selector additions to components
   └── Verify auth tests pass

2. Phase 2 (Wizard) - Depends on Phase 1
   ├── Wizard component updates
   ├── Form field test IDs
   └── Verify onboarding tests pass

3. Phase 3 (Visual) - Depends on Phases 1-2
   ├── Branding verification
   ├── Screenshot baseline updates
   └── Final visual regression pass
```

---

## Verification Commands

```bash
# Run auth tests only
npx playwright test tests/auth/ tests/security.spec.ts

# Run wizard tests only
npx playwright test tests/onboarding/

# Run visual tests only
npx playwright test tests/visual/ tests/screenshot-all-routes.spec.ts

# Full suite
npx playwright test
```

---

## Notes

- All Phase 1 fixes are **blocking** - no other tests will pass until auth works
- Consider creating a `tests/setup/global-setup.ts` for database seeding
- May need to add `test.beforeAll` hooks to ensure test data exists
- Security tests may need mocking for rate-limiting/lockout scenarios
