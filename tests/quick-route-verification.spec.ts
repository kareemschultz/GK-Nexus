import { expect, test } from "@playwright/test";

// Quick verification test for critical routes
test.describe("Quick Route Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@gk-nexus.com");
    await page.fill('input[name="password"]', "Admin123!@#");
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard.*/);
  });

  const criticalRoutes = [
    { path: "/dashboard", name: "Dashboard" },
    { path: "/clients", name: "Clients" },
    { path: "/invoices", name: "Invoices" },
    { path: "/documents", name: "Documents" },
    { path: "/tax", name: "Tax" },
    { path: "/settings", name: "Settings" },
    { path: "/immigration", name: "Immigration" },
    { path: "/expediting", name: "Expediting" },
    { path: "/property-management", name: "Property Management" },
    { path: "/local-content", name: "Local Content" },
    { path: "/partner-network", name: "Partner Network" },
    { path: "/training", name: "Training" },
  ];

  for (const route of criticalRoutes) {
    test(`should load ${route.name} page`, async ({ page }) => {
      await page.goto(route.path);

      // Should not get 404 or error
      const errorText = await page.locator('text="404"').count();
      const forbiddenText = await page.locator('text="Forbidden"').count();

      expect(errorText).toBe(0);
      expect(forbiddenText).toBe(0);

      // Page should have meaningful content
      const bodyContent = await page.textContent("body");
      expect(bodyContent?.length).toBeGreaterThan(100);
    });
  }
});
