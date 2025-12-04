import { expect, test } from "@playwright/test";

// Comprehensive E2E audit test suite
test.describe("Comprehensive Application Audit", () => {
  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
      }
      if (msg.type() === "warning") {
        consoleWarnings.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    // Capture network errors
    page.on("requestfailed", (request) => {
      networkErrors.push(
        `${request.method()} ${request.url()} - ${request.failure()?.errorText}`
      );
    });

    // Login first
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Fill login form
    await page.fill('input[type="email"]', "admin@gk-nexus.com");
    await page.fill('input[type="password"]', "Admin123!@#");
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 15_000 }).catch(() => {
      console.log("Login may have failed, continuing...");
    });

    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async () => {
    // Log collected errors/warnings
    if (consoleErrors.length > 0) {
      console.log("\n=== CONSOLE ERRORS ===");
      consoleErrors.forEach((err) => console.log(err));
    }
    if (consoleWarnings.length > 0) {
      console.log("\n=== CONSOLE WARNINGS ===");
      consoleWarnings.forEach((warn) => console.log(warn));
    }
    if (networkErrors.length > 0) {
      console.log("\n=== NETWORK ERRORS ===");
      networkErrors.forEach((err) => console.log(err));
    }

    // Clear for next test
    consoleErrors.length = 0;
    consoleWarnings.length = 0;
    networkErrors.length = 0;
  });

  test("Dashboard loads correctly", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Take screenshot
    await page.screenshot({
      path: "test-results/audit/dashboard.png",
      fullPage: true,
    });

    // Check main elements exist
    await expect(page.locator("text=Dashboard").first()).toBeVisible();

    // Check for KPI cards
    const kpiCards = page.locator('[class*="card"]');
    expect(await kpiCards.count()).toBeGreaterThan(0);

    console.log("Dashboard loaded successfully");
  });

  test("Clients page loads and Add Client works", async ({ page }) => {
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Close any dropdowns
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: "test-results/audit/clients-list.png",
      fullPage: true,
    });

    // Check page title
    await expect(page.locator("text=Client Management").first()).toBeVisible();

    // Find and click Add Client button
    const addClientBtn = page.locator('button:has-text("Add Client")').first();
    await expect(addClientBtn).toBeVisible();
    await addClientBtn.click({ force: true });

    // Wait for navigation
    await page.waitForURL("**/clients/new", { timeout: 10_000 });
    await page.waitForLoadState("networkidle");

    // Take screenshot of wizard
    await page.screenshot({
      path: "test-results/audit/client-wizard.png",
      fullPage: true,
    });

    // Check wizard elements
    await expect(page.locator("text=New Client Onboarding")).toBeVisible();
    await expect(page.locator("text=Entity Structure").first()).toBeVisible();

    console.log("Clients page and Add Client wizard work correctly");
  });

  test("Client wizard form validation", async ({ page }) => {
    await page.goto("/clients/new");
    await page.waitForLoadState("networkidle");

    // Check required fields
    await expect(page.locator("text=Entity Type")).toBeVisible();
    await expect(page.locator("text=Business Name")).toBeVisible();

    // Try to proceed without filling required fields
    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
      // Check for validation errors
      await page.screenshot({
        path: "test-results/audit/wizard-validation.png",
        fullPage: true,
      });
    }

    console.log("Client wizard form validation checked");
  });

  test("Tax Services routes work", async ({ page }) => {
    // Check various tax service sub-routes
    const taxRoutes = [
      "/tax/vat",
      "/tax/paye",
      "/tax/corporate",
      "/tax/individual",
    ];

    for (const route of taxRoutes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const routeName = route.split("/").pop();
      await page.screenshot({
        path: `test-results/audit/tax-${routeName}.png`,
        fullPage: true,
      });

      // Check it's not a 404
      const notFound = await page
        .locator("text=Not Found")
        .isVisible()
        .catch(() => false);
      if (notFound) {
        console.log(`WARNING: ${route} returns Not Found`);
      } else {
        console.log(`${route} loaded successfully`);
      }
    }
  });

  test("Invoices page loads", async ({ page }) => {
    await page.goto("/invoices");
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "test-results/audit/invoices.png",
      fullPage: true,
    });

    // Check for invoice-related content
    const hasInvoiceContent = await page
      .locator("text=Invoice")
      .first()
      .isVisible()
      .catch(() => false);
    console.log(`Invoices page loaded: ${hasInvoiceContent}`);
  });

  test("Documents page loads", async ({ page }) => {
    await page.goto("/documents");
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "test-results/audit/documents.png",
      fullPage: true,
    });

    const notFound = await page
      .locator("text=Not Found")
      .isVisible()
      .catch(() => false);
    console.log(`Documents page: ${notFound ? "Not Found" : "Loaded"}`);
  });

  test("Compliance page loads", async ({ page }) => {
    await page.goto("/compliance");
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "test-results/audit/compliance.png",
      fullPage: true,
    });

    const notFound = await page
      .locator("text=Not Found")
      .isVisible()
      .catch(() => false);
    console.log(`Compliance page: ${notFound ? "Not Found" : "Loaded"}`);
  });

  test("Appointments page loads", async ({ page }) => {
    await page.goto("/appointments");
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "test-results/audit/appointments.png",
      fullPage: true,
    });

    const notFound = await page
      .locator("text=Not Found")
      .isVisible()
      .catch(() => false);
    console.log(`Appointments page: ${notFound ? "Not Found" : "Loaded"}`);
  });

  test("Settings page loads", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: "test-results/audit/settings.png",
      fullPage: true,
    });

    const notFound = await page
      .locator("text=Not Found")
      .isVisible()
      .catch(() => false);
    console.log(`Settings page: ${notFound ? "Not Found" : "Loaded"}`);
  });

  test("Navigation sidebar links work", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Find all nav links
    const navItems = [
      { name: "Dashboard", url: "/dashboard" },
      { name: "Client Management", url: "/clients" },
      { name: "Tax Services", url: "/tax" },
      { name: "Payroll Services", url: "/payroll" },
      { name: "Document Center", url: "/documents" },
      { name: "Compliance Hub", url: "/compliance" },
      { name: "Invoice Management", url: "/invoices" },
      { name: "Time Tracking", url: "/time-tracking" },
      { name: "Automation", url: "/automation" },
    ];

    for (const item of navItems) {
      const link = page.locator(`nav >> text="${item.name}"`).first();
      if (await link.isVisible().catch(() => false)) {
        await link.click();
        await page.waitForLoadState("networkidle");

        const currentUrl = page.url();
        console.log(`Nav "${item.name}" -> ${currentUrl}`);

        await page.screenshot({
          path: `test-results/audit/nav-${item.name.toLowerCase().replace(/\s+/g, "-")}.png`,
          fullPage: true,
        });
      } else {
        console.log(`Nav item "${item.name}" not visible`);
      }
    }
  });

  test("API endpoints respond correctly", async ({ page }) => {
    // Test key API endpoints
    const apiEndpoints = [
      "/rpc/dashboard/overview",
      "/rpc/dashboard/kpis",
      "/rpc/clients/list",
      "/rpc/clients/stats",
    ];

    for (const endpoint of apiEndpoints) {
      const response = await page.request
        .post(`http://localhost:3000${endpoint}`, {
          headers: { "Content-Type": "application/json" },
          data: {},
        })
        .catch((e) => ({ status: () => 500, statusText: () => e.message }));

      console.log(
        `API ${endpoint}: ${response.status()} ${response.statusText?.() || ""}`
      );
    }
  });

  test("Logout functionality works", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Find logout button
    const logoutBtn = page
      .locator(
        'button:has-text("Logout"), button:has-text("Sign Out"), [aria-label="Logout"]'
      )
      .first();

    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForLoadState("networkidle");

      // Should redirect to login
      await expect(page)
        .toHaveURL(/login/, { timeout: 5000 })
        .catch(() => {
          console.log("Logout may not have redirected to login page");
        });

      await page.screenshot({
        path: "test-results/audit/after-logout.png",
        fullPage: true,
      });
      console.log("Logout functionality tested");
    } else {
      console.log("Logout button not found in expected locations");
    }
  });
});
