# GK-Nexus Selector Mapping Reference

> **Author**: Kareem Schultz - Karetech Solutions
> **Project**: GK-Nexus Suite
> **Last Updated**: December 10, 2024

## Overview

This document maps test selectors to actual UI component selectors. Use this as a reference when writing or updating E2E tests.

---

## Authentication Components

### Sign In Form (`/login`)
**Component**: `apps/web/src/components/sign-in-form.tsx`

| Element | Test Selector (data-testid) | Actual Selector |
|---------|----------------------------|-----------------|
| Email input | `[data-testid="email-input"]` | `input[name="email"]` |
| Password input | `[data-testid="password-input"]` | `input[name="password"]` |
| Submit button | `[data-testid="login-button"]` | `button[type="submit"]` |
| Form container | `[data-testid="login-form"]` | `form` |
| Sign up link | `[data-testid="register-link"]` | `button:has-text("Need an account?")` |
| Forgot password | `[data-testid="forgot-password-link"]` | **NOT IMPLEMENTED** |

### Sign Up Form (embedded in `/login`)
**Component**: `apps/web/src/components/sign-up-form.tsx`

| Element | Test Selector (data-testid) | Actual Selector |
|---------|----------------------------|-----------------|
| Name input | `[data-testid="name-input"]` | `input[name="name"]` |
| Email input | `[data-testid="email-input"]` | `input[name="email"]` |
| Password input | `[data-testid="password-input"]` | `input[name="password"]` |
| Submit button | `[data-testid="register-button"]` | `button[type="submit"]` |
| Sign in link | `[data-testid="login-link"]` | `button:has-text("Already have an account?")` |

---

## Navigation

### Sidebar Navigation
**Component**: `apps/web/src/components/sidebar.tsx`

| Element | Test Selector | Actual Selector |
|---------|---------------|-----------------|
| Dashboard link | `[data-testid="nav-dashboard"]` | `a[href="/dashboard"]` |
| Clients link | `[data-testid="nav-clients"]` | `a[href="/clients"]` |
| Tax Services link | `[data-testid="nav-tax"]` | `a[href="/tax"]` |
| Invoices link | `[data-testid="nav-invoices"]` | `a[href="/invoices"]` |
| Documents link | `[data-testid="nav-documents"]` | `a[href="/documents"]` |

### User Menu
| Element | Test Selector | Actual Selector |
|---------|---------------|-----------------|
| User menu button | `[data-testid="user-menu"]` | `.user-menu-trigger` or dropdown trigger |
| Logout button | `[data-testid="logout-button"]` | `button:has-text("Logout")` |
| User name display | `[data-testid="user-name"]` | `.user-name` or within dropdown |

---

## Dashboard

### KPI Cards
**Component**: `apps/web/src/routes/dashboard.tsx`

| Element | Test Selector | Actual Selector |
|---------|---------------|-----------------|
| Total clients card | `[data-testid="kpi-total-clients"]` | `[class*="card"]:has-text("Clients")` |
| Revenue card | `[data-testid="kpi-revenue"]` | `[class*="card"]:has-text("Revenue")` |
| Pending tasks card | `[data-testid="kpi-pending-tasks"]` | `[class*="card"]:has-text("Tasks")` |

---

## Client Management

### Client List (`/clients`)
| Element | Test Selector | Actual Selector |
|---------|---------------|-----------------|
| Client table | `[data-testid="clients-table"]` | `table` or `[role="table"]` |
| Add client button | `[data-testid="add-client-button"]` | `button:has-text("Add Client")` |
| Search input | `[data-testid="search-clients"]` | `input[placeholder*="Search"]` |

### Client Wizard (`/clients/new`)
| Element | Test Selector | Actual Selector |
|---------|---------------|-----------------|
| Entity type select | `[data-testid="entity-type"]` | `[name="entityType"]` or select element |
| Business name input | `[data-testid="business-name"]` | `input[name="businessName"]` |
| Next button | `[data-testid="wizard-next"]` | `button:has-text("Next")` |
| Previous button | `[data-testid="wizard-prev"]` | `button:has-text("Previous")` |
| Submit button | `[data-testid="wizard-submit"]` | `button:has-text("Submit")` |

---

## Form Elements (Common Patterns)

### Input Fields
```typescript
// Test expects:
await page.fill('[data-testid="field-name"]', value);

// Actual (use name attribute):
await page.fill('input[name="fieldName"]', value);
await page.fill('#fieldName', value); // if id matches name
```

### Buttons
```typescript
// Test expects:
await page.click('[data-testid="action-button"]');

// Actual (use text content):
await page.click('button:has-text("Action Text")');
await page.click('button[type="submit"]'); // for form submissions
```

### Select/Dropdown
```typescript
// Test expects:
await page.click('[data-testid="select-trigger"]');
await page.click('[data-value="option-value"]');

// Actual (varies by component library):
await page.click('[role="combobox"]');
await page.click('[role="option"]:has-text("Option Text")');
```

---

## Toast/Notifications

| Element | Test Selector | Actual Selector |
|---------|---------------|-----------------|
| Toast container | `[data-testid="toast"]` | `.sonner-toast` or `[data-sonner-toast]` |
| Success toast | `[data-testid="toast-success"]` | `.sonner-toast[data-type="success"]` |
| Error toast | `[data-testid="toast-error"]` | `.sonner-toast[data-type="error"]` |

**Note**: The application uses `sonner` for toasts. Check content with:
```typescript
await expect(page.locator('.sonner-toast')).toContainText('Expected message');
```

---

## Modal/Dialog

| Element | Test Selector | Actual Selector |
|---------|---------------|-----------------|
| Modal container | `[data-testid="modal"]` | `[role="dialog"]` |
| Modal close | `[data-testid="close-modal"]` | `[role="dialog"] button[aria-label="Close"]` |
| Modal title | `[data-testid="modal-title"]` | `[role="dialog"] h2` |

---

## Recommended Test ID Strategy

When updating UI components, add data-testid attributes following this pattern:

```tsx
// Pattern: {component}-{element}-{descriptor}
<input data-testid="signin-input-email" ... />
<button data-testid="signin-btn-submit" ... />
<form data-testid="signin-form" ... />
```

### Priority Components to Update

1. **sign-in-form.tsx** - Authentication critical path
2. **sign-up-form.tsx** - User registration
3. **sidebar.tsx** - Navigation elements
4. **dashboard.tsx** - KPI cards and widgets
5. **client-wizard.tsx** - Client creation flow

---

## Quick Reference: Working Selectors

These selectors are confirmed working in the current codebase:

```typescript
// Login
await page.fill('input[name="email"]', email);
await page.fill('input[name="password"]', password);
await page.click('button[type="submit"]');

// Navigation
await page.goto('/dashboard');
await page.goto('/clients');
await page.click('a[href="/tax"]');

// Page verification
await expect(page.locator('text=Dashboard')).toBeVisible();
await expect(page.locator('text=Client Management')).toBeVisible();

// Buttons by text
await page.click('button:has-text("Add Client")');
await page.click('button:has-text("Next")');
await page.click('button:has-text("Submit")');
```
