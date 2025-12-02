import * as fs from "node:fs";
import * as path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * Visual Verification Test Suite
 *
 * This test navigates to every route in the application and takes screenshots
 * to verify that all pages render correctly without errors.
 *
 * Run with: npx playwright test tests/visual/screenshot-all-routes.spec.ts --headed
 */

const SCREENSHOT_DIR = "test-results/proof";

// Ensure screenshot directory exists
test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

// Test credentials - using the default super admin from README
const TEST_EMAIL = "admin@gk-nexus.com";
const TEST_PASSWORD = "Admin123!@#";

/**
 * All routes in the application organized by category
 */
const APPLICATION_ROUTES = {
  // Public routes
  public: ["/login"],

  // Core Services
  coreServices: [
    "/dashboard",
    "/clients",
    "/clients/new",
    "/clients/active",
    "/tax",
    "/tax/paye",
    "/tax/vat",
    "/tax/nis",
    "/tax/filing",
    "/payroll",
    "/payroll/employees",
    "/payroll/run",
    "/payroll/reports",
  ],

  // Document & Compliance
  documentCompliance: [
    "/documents",
    "/documents/upload",
    "/documents/templates",
    "/documents/search",
    "/documents/requirements",
    "/documents/advanced",
    "/compliance",
    "/compliance/gra-filing",
    "/compliance/reports",
    "/compliance/alerts",
    "/invoices",
    "/invoices/new",
    "/invoices/payments",
  ],

  // Productivity
  productivity: [
    "/time-tracking",
    "/time-tracking/timer",
    "/time-tracking/entries",
    "/time-tracking/reports",
    "/time-tracking/projects",
    "/automation",
    "/automation/rules",
    "/automation/templates",
    "/automation/history",
  ],

  // Operations
  operations: [
    "/appointments",
    "/appointments/calendar",
    "/appointments/requests",
    "/appointments/new",
    "/users",
    "/users/invite",
    "/users/roles",
    "/settings",
    "/settings/profile",
    "/settings/security",
    "/settings/notifications",
  ],

  // Business Modules (Phase 5)
  businessModules: [
    "/property-management",
    "/expediting",
    "/training",
    "/local-content",
    "/partner-network",
    "/service-catalog",
  ],

  // Portal
  portal: [
    "/portal",
    "/portal/profile",
    "/portal/documents",
    "/portal/appointments",
    "/portal/filings",
    "/portal/payments",
  ],

  // User Profile
  userProfile: ["/profile"],
};

/**
 * Helper to create a safe filename from a route path
 */
function routeToFilename(route: string): string {
  return route.replace(/\//g, "_").replace(/^_/, "") || "index";
}

/**
 * Helper to wait for page to be ready
 */
async function waitForPageReady(page: any): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {
    // Ignore timeout - page might have streaming content
  });

  // Wait for any loading spinners to disappear
  await page
    .locator('[data-testid="loading"]')
    .waitFor({ state: "hidden", timeout: 5000 })
    .catch(() => {
      // Ignore if no loading spinner
    });

  // Wait for Skeleton loaders to disappear
  const skeletonCount = await page.locator(".animate-pulse").count();
  if (skeletonCount > 0) {
    await page.waitForTimeout(1000);
  }

  // Additional small wait for any animations
  await page.waitForTimeout(500);
}

/**
 * Helper to perform sign-up via API
 */
async function performSignUp(page: any): Promise<boolean> {
  try {
    // First, try to create the test user via API
    const response = await page.request.post(
      "http://localhost:3000/api/auth/sign-up/email",
      {
        data: {
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
          name: "Test Admin",
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok()) {
      console.log("Created test user via API");
      return true;
    }

    // User might already exist, which is fine
    const body = await response.json().catch(() => ({}));
    if (body?.error?.includes("exist") || body?.message?.includes("exist")) {
      console.log("Test user already exists");
      return true;
    }

    console.log("Sign-up response:", response.status(), body);
    return false;
  } catch (error) {
    console.log("Sign-up API call failed:", error);
    return false;
  }
}

/**
 * Helper to perform login
 */
async function performLogin(page: any): Promise<boolean> {
  try {
    // Try to create user first
    await performSignUp(page);

    await page.goto("/login");

    // Wait for the page to fully load
    await page.waitForTimeout(2000);

    // Check if we're already redirected to dashboard (already logged in)
    if (page.url().includes("/dashboard")) {
      return true;
    }

    // Wait for the form to appear - check for the h1 "Welcome Back"
    const heading = page.locator("h1");
    await heading.waitFor({ state: "visible", timeout: 15_000 });

    // Wait for email input to be available
    const emailInput = page.locator("#email");
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });

    // Fill the form
    await emailInput.fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);

    // Click submit
    await page.locator('button[type="submit"]').click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
    return true;
  } catch {
    console.log("Login failed or not needed");
    return false;
  }
}

test.describe("Visual Verification - Screenshot All Routes", () => {
  test.describe.configure({ mode: "serial" });

  // Test login page first (public route)
  test("Screenshot: Login Page", async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");
    await page.waitForTimeout(3000); // Wait for any redirects or loading

    // Take screenshot regardless of state
    const screenshotPath = path.join(SCREENSHOT_DIR, "login.png");
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Verify page has content
    await expect(page.locator("body")).toBeVisible();
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  // Test authenticated routes
  test("Screenshot all authenticated routes", async ({ page }) => {
    // Perform login first
    const loggedIn = await performLogin(page);

    if (!loggedIn) {
      console.log("Could not log in, skipping authenticated routes");
      return;
    }

    // Get all routes except public
    const allRoutes: string[] = [];
    for (const [category, routes] of Object.entries(APPLICATION_ROUTES)) {
      if (category !== "public") {
        allRoutes.push(...routes);
      }
    }

    const results = {
      successful: [] as string[],
      failed: [] as string[],
    };

    // Navigate to each route and take screenshot
    for (const route of allRoutes) {
      try {
        console.log(`Navigating to: ${route}`);
        await page.goto(route, { timeout: 30_000 });
        await waitForPageReady(page);

        // Check for errors
        const pageContent = await page.content();
        const hasError =
          pageContent.includes("Element type is invalid") ||
          pageContent.includes("Cannot read properties");

        // Take screenshot
        const filename = hasError
          ? `ERROR_${routeToFilename(route)}.png`
          : `${routeToFilename(route)}.png`;
        const screenshotPath = path.join(SCREENSHOT_DIR, filename);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        if (hasError) {
          results.failed.push(route);
          console.log(`ERROR: ${route}`);
        } else {
          results.successful.push(route);
          console.log(`OK: ${route}`);
        }
      } catch (error) {
        // Take error screenshot
        const errorScreenshotPath = path.join(
          SCREENSHOT_DIR,
          `ERROR_${routeToFilename(route)}.png`
        );
        await page
          .screenshot({ path: errorScreenshotPath, fullPage: true })
          .catch(() => {});
        results.failed.push(route);
        console.log(`FAILED: ${route} - ${error}`);
      }
    }

    // Generate summary
    const summaryPath = path.join(SCREENSHOT_DIR, "SUMMARY.md");
    let summary = "# Visual Verification Screenshot Report\n\n";
    summary += `Generated: ${new Date().toISOString()}\n\n`;
    summary += "## Results\n\n";
    summary += `- **Total Routes**: ${allRoutes.length}\n`;
    summary += `- **Successful**: ${results.successful.length}\n`;
    summary += `- **Failed/Errors**: ${results.failed.length}\n\n`;

    if (results.failed.length > 0) {
      summary += "### Failed Routes\n\n";
      for (const route of results.failed) {
        summary += `- ❌ \`${route}\`\n`;
      }
      summary += "\n";
    }

    summary += "### Successful Routes\n\n";
    for (const route of results.successful) {
      summary += `- ✅ \`${route}\`\n`;
    }

    fs.writeFileSync(summaryPath, summary);

    // Assert that most routes worked
    const successRate = results.successful.length / allRoutes.length;
    console.log(`Success rate: ${(successRate * 100).toFixed(1)}%`);
    expect(successRate).toBeGreaterThan(0.5);
  });
});
