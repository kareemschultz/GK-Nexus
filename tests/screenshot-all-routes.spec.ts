import { test } from "@playwright/test";

test.describe("Screenshot All Routes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@gk-nexus.com");
    await page.fill('input[name="password"]', "Admin123!@#");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard.*/);
  });

  const routes = [
    { path: "/dashboard", name: "dashboard" },
    { path: "/clients", name: "clients" },
    { path: "/invoices", name: "invoices" },
    { path: "/documents", name: "documents" },
    { path: "/tax", name: "tax" },
    { path: "/settings", name: "settings" },
    { path: "/immigration", name: "immigration" },
    { path: "/expediting", name: "expediting" },
    { path: "/property-management", name: "property-management" },
    { path: "/local-content", name: "local-content" },
    { path: "/partner-network", name: "partner-network" },
    { path: "/training", name: "training" },
    { path: "/payroll", name: "payroll" },
    { path: "/appointments", name: "appointments" },
    { path: "/compliance", name: "compliance" },
  ];

  for (const route of routes) {
    test(`Screenshot ${route.name}`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForTimeout(1000);
      await page.screenshot({
        path: `test-results/screenshots/${route.name}.png`,
        fullPage: true,
      });
    });
  }
});
