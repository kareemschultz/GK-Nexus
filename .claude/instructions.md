# GK-Nexus Development Instructions

Step-by-step guidance for working on the GK-Nexus codebase.

---

## Current Priority

### ⚠️ handleSubmit Complexity Issue

**File:** `apps/web/src/components/client-onboarding-wizard.tsx`  
**Line:** 1216  
**Issue:** Complexity score 18 (max: 15)

**Fix approach:** Extract sub-functions to reduce complexity.

---

## Before ANY Code Changes

### Step 1: Start Development Environment

```bash
bun run dev
# Wait for:
# - Server: http://localhost:3000
# - Web: http://localhost:3001
```

### Step 2: Verify Server

```bash
curl http://localhost:3000/rpc/healthCheck
# Expected: "OK"
```

### Step 3: Open Browser + DevTools

1. Go to http://localhost:3001
2. Press F12 → Console tab
3. Note any existing errors

---

## Fixing the Complexity Issue

### Current State

The `handleSubmit` function in `client-onboarding-wizard.tsx` has too much logic:
- Form validation
- Data transformation
- API calls
- Success/error handling
- Navigation

### Solution: Extract Sub-Functions

```typescript
// BEFORE (complexity 18)
const handleSubmit = async () => {
  try {
    // 50+ lines of validation
    // 30+ lines of data transformation
    // API call
    // Success handling
    // Navigation
  } catch (error) {
    // Error handling
  }
};

// AFTER (complexity ~8 each)
const validateFormData = async (): Promise<ValidatedData | null> => {
  // Validation logic
  return validatedData;
};

const prepareClientData = (validatedData: ValidatedData): CreateClientInput => {
  // Data transformation
  return clientData;
};

const submitClient = async (clientData: CreateClientInput) => {
  const { client: orpcClient } = await import("@/utils/orpc");
  return orpcClient.clients.create(clientData);
};

const handleSubmit = async () => {
  const validated = await validateFormData();
  if (!validated) return;
  
  try {
    const clientData = prepareClientData(validated);
    const result = await submitClient(clientData);
    
    toast.success("Client created successfully");
    navigate({ to: "/clients/$clientId", params: { clientId: result.data.id } });
  } catch (error) {
    toast.error("Failed to create client");
  }
};
```

### Steps to Fix

1. **Read the current function** (lines 1216-1310 approximately)
2. **Identify logical sections:**
   - Validation
   - Data transformation
   - API call
   - Success handling
   - Error handling
3. **Extract each section** to its own function
4. **Run linting:** `npx ultracite check`
5. **Test manually** in browser

---

## Standard Workflow

### For Any Bug Fix

1. **Read .claude/CLAUDE.md** for patterns to follow
2. **Start dev environment:** `bun run dev`
3. **Locate the issue** in code
4. **Apply fix** following conventions
5. **Run linting:** `npx ultracite fix`
6. **Test in browser**
7. **Verify console** has no new errors

### For Adding Features

1. **Read .claude/CONVENTIONS.md** for patterns
2. **Find similar existing code** to follow
3. **Implement** following the pattern
4. **Run linting:** `npx ultracite fix`
5. **Test in browser**

---

## Common Patterns

### Adding a Helper Function

```typescript
// Place ABOVE the component that uses it
const getStatusClass = (status: string) => {
  if (status === "active") return "bg-green-500";
  if (status === "pending") return "bg-yellow-500";
  return "bg-gray-500";
};

export function MyComponent() {
  // Use the helper
  return <div className={getStatusClass(item.status)} />;
}
```

### Moving Regex to Module Level

```typescript
// TOP of file, outside component
const TIN_REGEX = /^[0-9]{3}-[0-9]{6}$/;

export function MyComponent() {
  // Use the constant
  const isValid = TIN_REGEX.test(value);
}
```

### Using Type Instead of Interface

```typescript
// ✅ Preferred
type FormData = {
  name: string;
  email: string;
};

// ❌ Avoid
interface FormData {
  name: string;
  email: string;
}
```

---

## Verification Checklist

Before marking ANY task complete:

- [ ] `bun run dev` starts without errors
- [ ] `npx ultracite check` passes (or only known warning)
- [ ] No new console errors in browser
- [ ] Feature works when tested manually
- [ ] Didn't break existing functionality

---

## What NOT to Do

| ❌ Don't | ✅ Do Instead |
|----------|--------------|
| Nested ternaries | Helper functions or object lookup |
| Array index as key | Unique identifier (id, title) |
| div with onClick | button with onClick |
| interface | type |
| Regex in component | Regex at module level |
| Skip browser testing | Always test manually |
| Use `@ts-ignore` | Fix the type error |
| Use `force: true` | Fix the actual issue |

---

## Quick Reference

### Commands

```bash
bun run dev              # Start all
npx ultracite fix        # Auto-fix linting
npx ultracite check      # Check linting
npx playwright test      # E2E tests
```

### Ports

| Service | Port |
|---------|------|
| Frontend | 3001 |
| Backend | 3000 |
| DB Studio | 4983 |

### Credentials

- **Email:** admin@gk-nexus.com
- **Password:** Admin123!@#

### Key Files

| What | Where |
|------|-------|
| Routers | `packages/api/src/routers/` |
| Routes | `apps/web/src/routes/` |
| Components | `apps/web/src/components/` |
| oRPC client | `apps/web/src/utils/orpc.ts` |
| Auth client | `apps/web/src/lib/auth-client.ts` |

---

## Debugging

### Linting Fails

```bash
# See what's wrong
npx ultracite check

# Auto-fix what can be fixed
npx ultracite fix

# If complexity issue, extract functions (don't ignore)
```

### API Errors

```bash
# Check server is running
curl http://localhost:3000/rpc/healthCheck

# Check .env
cat apps/web/.env | grep VITE_SERVER_URL

# Should be: VITE_SERVER_URL=http://localhost:3000
```

### Component Not Rendering

1. Check browser console for errors
2. Check route file exists in `apps/web/src/routes/`
3. Check imports are correct
4. Check auth guard in `beforeLoad`
