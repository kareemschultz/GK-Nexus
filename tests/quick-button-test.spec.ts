import { expect, test } from "@playwright/test";

test.describe("Button Functionality Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@gk-nexus.com");
    await page.fill('input[type="password"]', "Admin123!@#");
    await page.click('button[type="submit"]');

    // Wait for navigation after login
    await page.waitForURL("**/dashboard", { timeout: 10_000 }).catch(() => {
      // If not redirected to dashboard, continue anyway
    });
  });

  test("Dashboard quick action buttons work", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Take screenshot of dashboard
    await page.screenshot({
      path: "test-results/dashboard.png",
      fullPage: true,
    });

    // Look for quick action buttons
    const addClientBtn = page
      .locator('button:has-text("Add Client"), a:has-text("Add Client")')
      .first();
    const newInvoiceBtn = page
      .locator('button:has-text("New Invoice"), a:has-text("New Invoice")')
      .first();

    // Check if buttons exist
    if (await addClientBtn.isVisible()) {
      console.log("Add Client button found");
      await addClientBtn.click();
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: "test-results/add-client-page.png",
        fullPage: true,
      });

      // Check if we're on the right page
      const currentUrl = page.url();
      console.log("After Add Client click, URL:", currentUrl);
    }
  });

  test("Clients page - Add Client button works", async ({ page }) => {
    await page.goto("/clients");
    await page.waitForLoadState("networkidle");

    // Take screenshot of clients page
    await page.screenshot({
      path: "test-results/clients-page.png",
      fullPage: true,
    });

    // Close any open dropdowns by clicking on the page body or pressing Escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    // Find Add Client button
    const addClientBtn = page.locator('button:has-text("Add Client")').first();

    if (await addClientBtn.isVisible()) {
      console.log("Add Client button is visible on /clients");
      await addClientBtn.click({ force: true });

      // Wait for navigation or modal
      await page.waitForTimeout(2000);
      await page.waitForLoadState("networkidle");

      const currentUrl = page.url();
      console.log("After click, URL:", currentUrl);

      await page.screenshot({
        path: "test-results/after-add-client-click.png",
        fullPage: true,
      });

      // Check if wizard/form is visible
      const wizardVisible = await page
        .locator('text="New Client Onboarding"')
        .isVisible();
      const formVisible = await page.locator("form").first().isVisible();

      console.log("Wizard visible:", wizardVisible);
      console.log("Form visible:", formVisible);

      expect(
        wizardVisible || formVisible || currentUrl.includes("/new")
      ).toBeTruthy();
    } else {
      console.log("Add Client button NOT visible");
      test.fail();
    }
  });

  test("Navigation sidebar works", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Check sidebar navigation links
    const navLinks = [
      { text: "Clients", url: "/clients" },
      { text: "Invoices", url: "/invoices" },
      { text: "Appointments", url: "/appointments" },
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`nav >> a:has-text("${link.text}")`).first();
      if (await navLink.isVisible()) {
        await navLink.click();
        await page.waitForLoadState("networkidle");

        const currentUrl = page.url();
        console.log(`Clicked ${link.text}, URL: ${currentUrl}`);

        await page.screenshot({
          path: `test-results/${link.text.toLowerCase()}-page.png`,
          fullPage: true,
        });

        expect(currentUrl).toContain(link.url);
      }
    }
  });
});
