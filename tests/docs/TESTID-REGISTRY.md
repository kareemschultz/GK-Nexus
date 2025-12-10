# GK-Nexus Test ID Registry

> **Author**: Kareem Schultz - Karetech Solutions
> **Project**: GK-Nexus Suite
> **Last Updated**: December 10, 2024

## Overview

This document tracks the `data-testid` attributes that need to be added to UI components to support comprehensive E2E testing.

---

## Test ID Naming Convention

```
{component}-{element}-{descriptor}
```

Examples:
- `signin-input-email`
- `signin-btn-submit`
- `sidebar-nav-dashboard`
- `dashboard-card-revenue`

---

## Priority 1: Authentication Components

### Sign In Form (`apps/web/src/components/sign-in-form.tsx`)

| Test ID | Element | Status |
|---------|---------|--------|
| `signin-form` | Form container | Not added |
| `signin-input-email` | Email input | Not added |
| `signin-input-password` | Password input | Not added |
| `signin-btn-submit` | Submit button | Not added |
| `signin-link-signup` | Switch to signup link | Not added |
| `signin-link-forgot` | Forgot password link | Not implemented |
| `signin-error-email` | Email validation error | Not added |
| `signin-error-password` | Password validation error | Not added |

### Sign Up Form (`apps/web/src/components/sign-up-form.tsx`)

| Test ID | Element | Status |
|---------|---------|--------|
| `signup-form` | Form container | Not added |
| `signup-input-name` | Name input | Not added |
| `signup-input-email` | Email input | Not added |
| `signup-input-password` | Password input | Not added |
| `signup-btn-submit` | Submit button | Not added |
| `signup-link-signin` | Switch to signin link | Not added |

---

## Priority 2: Navigation Components

### Sidebar (`apps/web/src/components/sidebar.tsx`)

| Test ID | Element | Status |
|---------|---------|--------|
| `sidebar-nav` | Navigation container | TBD |
| `sidebar-nav-dashboard` | Dashboard link | TBD |
| `sidebar-nav-clients` | Clients link | TBD |
| `sidebar-nav-invoices` | Invoices link | TBD |
| `sidebar-nav-documents` | Documents link | TBD |
| `sidebar-nav-tax` | Tax services link | TBD |
| `sidebar-nav-payroll` | Payroll link | TBD |
| `sidebar-nav-compliance` | Compliance link | TBD |
| `sidebar-nav-settings` | Settings link | TBD |

### User Menu

| Test ID | Element | Status |
|---------|---------|--------|
| `user-menu-trigger` | User menu button | TBD |
| `user-menu-dropdown` | Dropdown container | TBD |
| `user-menu-profile` | Profile link | TBD |
| `user-menu-settings` | Settings link | TBD |
| `user-menu-logout` | Logout button | TBD |
| `user-menu-name` | User name display | TBD |

---

## Priority 3: Dashboard Components

### KPI Cards (`apps/web/src/routes/dashboard.tsx`)

| Test ID | Element | Status |
|---------|---------|--------|
| `dashboard-kpi-clients` | Total clients card | TBD |
| `dashboard-kpi-revenue` | Revenue card | TBD |
| `dashboard-kpi-tasks` | Pending tasks card | TBD |
| `dashboard-kpi-invoices` | Invoices card | TBD |

### Quick Actions

| Test ID | Element | Status |
|---------|---------|--------|
| `dashboard-action-newclient` | New client button | TBD |
| `dashboard-action-newinvoice` | New invoice button | TBD |
| `dashboard-action-upload` | Upload document button | TBD |

---

## Priority 4: Client Management

### Client List (`apps/web/src/routes/clients/index.tsx`)

| Test ID | Element | Status |
|---------|---------|--------|
| `clients-table` | Clients table | TBD |
| `clients-btn-add` | Add client button | TBD |
| `clients-input-search` | Search input | TBD |
| `clients-filter-status` | Status filter | TBD |

### Client Wizard (`apps/web/src/routes/clients/new.tsx`)

| Test ID | Element | Status |
|---------|---------|--------|
| `wizard-step-indicator` | Step progress | TBD |
| `wizard-select-entity` | Entity type select | TBD |
| `wizard-input-name` | Business name input | TBD |
| `wizard-input-email` | Email input | TBD |
| `wizard-input-phone` | Phone input | TBD |
| `wizard-btn-next` | Next step button | TBD |
| `wizard-btn-prev` | Previous step button | TBD |
| `wizard-btn-submit` | Submit button | TBD |

---

## Priority 5: Invoice Management

### Invoice List (`apps/web/src/routes/invoices/index.tsx`)

| Test ID | Element | Status |
|---------|---------|--------|
| `invoices-table` | Invoices table | TBD |
| `invoices-btn-create` | Create invoice button | TBD |
| `invoices-filter-status` | Status filter | TBD |
| `invoices-filter-client` | Client filter | TBD |

---

## Implementation Guide

### Adding Test IDs to Components

```tsx
// Before
<Input
  name="email"
  type="email"
  value={email}
  onChange={handleChange}
/>

// After
<Input
  name="email"
  type="email"
  value={email}
  onChange={handleChange}
  data-testid="signin-input-email"
/>
```

### Using Test IDs in Tests

```typescript
// In tests
await page.fill('[data-testid="signin-input-email"]', 'test@example.com');
await page.click('[data-testid="signin-btn-submit"]');
await expect(page.locator('[data-testid="dashboard-kpi-clients"]')).toBeVisible();
```

---

## Workaround: Alternative Selectors

Until test IDs are added, use these alternative selectors:

```typescript
// Form inputs by name attribute
await page.fill('input[name="email"]', value);
await page.fill('input[name="password"]', value);

// Buttons by type or text
await page.click('button[type="submit"]');
await page.click('button:has-text("Add Client")');

// Links by href
await page.click('a[href="/dashboard"]');
await page.click('a[href="/clients"]');

// Elements by role
await page.click('[role="combobox"]');
await page.click('[role="option"]:has-text("Option")');
```

---

## Test ID Audit Checklist

### Phase 1: Critical Path
- [ ] Sign in form
- [ ] Sign up form
- [ ] User menu / logout
- [ ] Main navigation

### Phase 2: Core Features
- [ ] Dashboard KPIs
- [ ] Dashboard quick actions
- [ ] Client list
- [ ] Client wizard
- [ ] Invoice list

### Phase 3: Secondary Features
- [ ] Document management
- [ ] Tax calculators
- [ ] Payroll pages
- [ ] Settings pages

### Phase 4: Full Coverage
- [ ] All form inputs
- [ ] All action buttons
- [ ] All navigation links
- [ ] All modal dialogs
- [ ] All table components
