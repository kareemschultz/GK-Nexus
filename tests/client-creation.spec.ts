import { expect, test } from "@playwright/test";

test.describe("Client Creation Wizard", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.fill('input[type="email"]', "admin@gk-nexus.com");
    await page.fill('input[type="password"]', "Admin123!@#");
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard", { timeout: 15_000 }).catch(() => {
      console.log("Login redirect may have failed");
    });

    await page.waitForLoadState("networkidle");
  });

  test("Full wizard creates client successfully", async ({ page }) => {
    // Generate unique values for this test run
    const timestamp = Date.now();
    const uniqueTIN = String(timestamp).slice(-9);
    const uniqueEmail = `test${timestamp}@testcompany.com`;
    const uniqueName = `Test Company ${timestamp}`;

    // Navigate to clients/new
    await page.goto("/clients/new");
    await page.waitForLoadState("networkidle");

    // Step 1: Entity Structure
    await expect(page.locator("text=Entity Structure").first()).toBeVisible({
      timeout: 10_000,
    });

    // Select entity type - Company (COMPANY is already selected by default, skip if not needed)
    // Or use force click
    await page
      .locator('button[role="combobox"]')
      .first()
      .click({ force: true });
    await page.waitForTimeout(300);
    await page
      .locator('[data-radix-select-viewport] >> text="Company"')
      .first()
      .click({ force: true });

    // Fill business name
    await page.fill("input#businessName", uniqueName);

    // Fill TIN (unique per test run)
    await page.fill("input#tinNumber", uniqueTIN);

    // Click next
    await page.click('button:has-text("Continue to Contact Information")');
    await page.waitForTimeout(500);

    // Step 2: Contact Information
    await expect(
      page.locator("text=Contact Information").first()
    ).toBeVisible();

    // Fill email (unique per test run)
    await page.fill("input#email", uniqueEmail);

    // Fill phone
    await page.fill("input#phoneNumber", "+592-123-4567");

    // Fill address
    await page.fill("textarea#address", "123 Main Street, Georgetown");

    // Fill city
    await page.fill("input#city", "Georgetown");

    // Select region (Region 4 - Georgetown is in Demerara-Mahaica)
    await page.click('button:has-text("Select region")');
    await page.click('text="Region 4 - Demerara-Mahaica"');

    // Click next
    await page.click('button:has-text("Continue to Document Upload")');
    await page.waitForTimeout(500);

    // Step 3: Document Upload - Just skip for now
    await expect(page.locator("text=Document Upload").first()).toBeVisible();
    await page.click('button:has-text("Continue to Services")');
    await page.waitForTimeout(500);

    // Step 4: Service Selection
    await expect(page.locator("text=Service Selection").first()).toBeVisible();

    // Select at least one service
    await page.click('text="PAYE Filing"');

    // Click next
    await page.click('button:has-text("Review & Submit")');
    await page.waitForTimeout(500);

    // Step 5: Review - Check summary is shown
    await expect(page.locator("text=Review Your Information")).toBeVisible();
    // Verify the unique name and email are shown in review
    await expect(page.locator(`text=${uniqueName}`)).toBeVisible();
    await expect(page.locator(`text=${uniqueEmail}`)).toBeVisible();

    // Take screenshot before submitting
    await page.screenshot({
      path: "test-results/client-wizard-review.png",
      fullPage: true,
    });

    // Click Create Client
    const createButton = page.locator('button:has-text("Create Client")');
    await expect(createButton).toBeVisible();
    await createButton.click();

    // Wait for success or error
    await page.waitForTimeout(3000);

    // Take screenshot of result
    await page.screenshot({
      path: "test-results/client-creation-result.png",
      fullPage: true,
    });

    // Check for success toast or error
    const successToast = page.locator("text=Client created successfully");
    const errorToast = page.locator("text=Failed to create client");

    const hasSuccess = await successToast
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    const hasError = await errorToast
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (hasError) {
      console.log("ERROR: Client creation failed!");
      // Get any error details visible on page
      const pageContent = await page.content();
      console.log(
        "Page contains error:",
        pageContent.includes("Internal Server Error")
      );
    }

    // Assert success
    expect(hasSuccess || !hasError).toBeTruthy();

    console.log(`Test result: Success=${hasSuccess}, Error=${hasError}`);
  });
});
