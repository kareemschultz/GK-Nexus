import { expect, type Page, test } from "@playwright/test";

const BASE_URL = "http://localhost:3001";

// Helper to login
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', "admin@gk-nexus.com");
  await page.fill('input[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  // Wait for login to complete
  await page.waitForTimeout(3000);
}

test.describe("Verify Fixes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("Service Catalog page screenshot", async ({ page }) => {
    await page.goto(`${BASE_URL}/service-catalog`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "test-results/service-catalog-fixed.png",
      fullPage: true,
    });

    // Check no Forbidden error
    const pageContent = await page.textContent("body");
    expect(pageContent).not.toContain("Forbidden");
  });

  test("Invoices page screenshot", async ({ page }) => {
    await page.goto(`${BASE_URL}/invoices`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "test-results/invoices-fixed.png",
      fullPage: true,
    });

    // Check no "stats is not a function" error
    const pageContent = await page.textContent("body");
    expect(pageContent).not.toContain("is not a function");
  });

  test("Paralegal page screenshot", async ({ page }) => {
    await page.goto(`${BASE_URL}/paralegal`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "test-results/paralegal-fixed.png",
      fullPage: true,
    });
  });

  test("Tax page screenshots", async ({ page }) => {
    // Main tax page
    await page.goto(`${BASE_URL}/tax`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: "test-results/tax-page-fixed.png",
      fullPage: true,
    });

    // Screenshot taken - visual verification

    // PAYE Calculator
    await page.goto(`${BASE_URL}/tax/paye`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "test-results/tax-paye-fixed.png",
      fullPage: true,
    });

    // VAT Calculator
    await page.goto(`${BASE_URL}/tax/vat`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "test-results/tax-vat-fixed.png",
      fullPage: true,
    });

    // NIS Calculator
    await page.goto(`${BASE_URL}/tax/nis`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "test-results/tax-nis-fixed.png",
      fullPage: true,
    });

    // Tax Filing
    await page.goto(`${BASE_URL}/tax/filing`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "test-results/tax-filing-fixed.png",
      fullPage: true,
    });
  });
});
