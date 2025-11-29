/**
 * E2E tests for complete tax calculation workflows
 */

import { expect, test } from "@playwright/test";

test.describe("Tax Calculation Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Login as staff user
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.TEST_STAFF_EMAIL!);
    await page.fill('input[name="password"]', process.env.TEST_STAFF_PASSWORD!);
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should complete PAYE tax calculation workflow", async ({ page }) => {
    // Navigate to PAYE calculator
    await page.click('a[href*="tax"]');
    await page.click("text=PAYE Calculator");
    await page.waitForURL(/tax.*paye/);

    // Verify calculator page loaded
    await expect(page.locator("h1")).toContainText("PAYE Calculator");
    await expect(page.locator("text=Guyana Budget 2025")).toBeVisible();

    // Fill employee information
    await page.fill('input[name="firstName"]', "John");
    await page.fill('input[name="lastName"]', "Doe");
    await page.fill('input[name="nisNumber"]', "123456789");
    await page.fill('input[name="basicSalary"]', "200000");
    await page.fill('input[name="overtime"]', "25000");
    await page.fill('input[name="allowances"]', "15000");
    await page.fill('input[name="bonuses"]', "10000");
    await page.fill('input[name="dependents"]', "2");

    // Calculate PAYE
    await page.click('button:has-text("Calculate PAYE & NIS")');

    // Wait for calculation to complete
    await page.waitForSelector("text=Calculation Results", { timeout: 10_000 });

    // Verify calculation results are displayed
    await expect(page.locator("text=Gross Earnings")).toBeVisible();
    await expect(page.locator("text=Net Pay")).toBeVisible();
    await expect(page.locator("text=PAYE Tax")).toBeVisible();
    await expect(page.locator("text=NIS Employee Contribution")).toBeVisible();

    // Verify amounts are reasonable (gross should be sum of inputs)
    const grossEarningsText = await page
      .locator("[data-testid='gross-earnings']")
      .textContent();
    expect(grossEarningsText).toContain("250,000"); // 200k + 25k + 15k + 10k

    // Test print functionality
    const printPromise = page.waitForEvent("popup");
    await page.click('button:has-text("Print")');
    const printPage = await printPromise;
    await printPage.close();

    // Test save to payroll functionality (if save button exists)
    const saveButton = page.locator('button:has-text("Save to Payroll")');
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await expect(page.locator("text=saved successfully")).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("should handle VAT calculation workflow", async ({ page }) => {
    // Navigate to VAT calculator
    await page.click('a[href*="tax"]');
    await page.click("text=VAT Calculator");
    await page.waitForURL(/tax.*vat/);

    // Verify VAT calculator page
    await expect(page.locator("h1")).toContainText("VAT Calculator");

    // Fill VAT calculation form
    await page.fill('input[name="salesAmount"]', "100000");
    await page.selectOption('select[name="category"]', "STANDARD");
    await page.fill('input[name="customerName"]', "Test Customer");
    await page.fill('input[name="invoiceNumber"]', "INV-001");

    // Calculate VAT
    await page.click('button:has-text("Calculate VAT")');

    // Wait for results
    await page.waitForSelector("text=VAT Calculation Results", {
      timeout: 10_000,
    });

    // Verify VAT calculation results
    await expect(page.locator("text=Net Amount")).toBeVisible();
    await expect(page.locator("text=VAT Amount")).toBeVisible();
    await expect(page.locator("text=Gross Amount")).toBeVisible();

    // Verify VAT amount is 12.5% (Guyana rate)
    const vatAmountText = await page
      .locator("[data-testid='vat-amount']")
      .textContent();
    expect(vatAmountText).toContain("12,500"); // 12.5% of 100,000

    // Test quarterly VAT return submission
    await page.click('button:has-text("Submit to GRA")');

    // Fill GRA submission form
    await page.fill('input[name="period"]', "2025-Q1");
    await page.fill('textarea[name="notes"]', "Test quarterly VAT submission");

    await page.click('button:has-text("Submit Return")');

    // Verify submission confirmation
    await expect(page.locator("text=VAT return submitted")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.locator("text=GRA Reference")).toBeVisible();
  });

  test("should complete payroll processing workflow", async ({ page }) => {
    // Navigate to payroll section
    await page.click('a[href*="payroll"]');
    await page.waitForURL(/payroll/);

    // Verify payroll page
    await expect(page.locator("h1")).toContainText("Payroll Management");

    // Start new payroll run
    await page.click('button:has-text("New Payroll Run")');

    // Select payroll period
    await page.selectOption('select[name="period"]', "2025-01");
    await page.click('button:has-text("Continue")');

    // Add employees to payroll
    await page.click('button:has-text("Add Employee")');

    // Fill employee details
    await page.fill('input[name="employeeName"]', "Jane Smith");
    await page.fill('input[name="nisNumber"]', "A87654321");
    await page.fill('input[name="basicSalary"]', "180000");
    await page.fill('input[name="overtime"]', "20000");
    await page.fill('input[name="dependents"]', "1");

    await page.click('button:has-text("Add to Payroll")');

    // Add another employee
    await page.click('button:has-text("Add Employee")');
    await page.fill('input[name="employeeName"]', "Bob Johnson");
    await page.fill('input[name="nisNumber"]', "B12345678");
    await page.fill('input[name="basicSalary"]', "220000");
    await page.fill('input[name="dependents"]', "3");

    await page.click('button:has-text("Add to Payroll")');

    // Verify employees added
    await expect(page.locator("text=Jane Smith")).toBeVisible();
    await expect(page.locator("text=Bob Johnson")).toBeVisible();

    // Process payroll
    await page.click('button:has-text("Calculate Payroll")');

    // Wait for processing
    await page.waitForSelector("text=Payroll Summary", { timeout: 15_000 });

    // Verify payroll summary
    await expect(page.locator("text=Total Gross Pay")).toBeVisible();
    await expect(page.locator("text=Total Net Pay")).toBeVisible();
    await expect(page.locator("text=Total PAYE Tax")).toBeVisible();
    await expect(page.locator("text=Total NIS Employee")).toBeVisible();
    await expect(page.locator("text=Total NIS Employer")).toBeVisible();

    // Generate payroll reports
    await page.click('button:has-text("Generate Reports")');

    // Test different report types
    await page.click('button:has-text("Payslips")');
    await page.waitForSelector("text=Payslips Generated", { timeout: 10_000 });

    await page.click('button:has-text("GRA Form 7B")');
    await page.waitForSelector("text=GRA Form Generated", { timeout: 10_000 });

    await page.click('button:has-text("NIS Schedule")');
    await page.waitForSelector("text=NIS Schedule Generated", {
      timeout: 10_000,
    });

    // Finalize payroll
    await page.click('button:has-text("Finalize Payroll")');
    await page.click('button:has-text("Confirm")'); // Confirmation dialog

    // Verify payroll finalized
    await expect(
      page.locator("text=Payroll finalized successfully")
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.locator("text=Status: FINALIZED")).toBeVisible();
  });

  test("should validate tax calculation edge cases", async ({ page }) => {
    // Navigate to PAYE calculator
    await page.goto("/tax/paye");

    // Test with very low income (below tax threshold)
    await page.fill('input[name="firstName"]', "Low");
    await page.fill('input[name="lastName"]', "Earner");
    await page.fill('input[name="nisNumber"]', "L12345678");
    await page.fill('input[name="basicSalary"]', "50000");
    await page.fill('input[name="dependents"]', "0");

    await page.click('button:has-text("Calculate PAYE & NIS")');
    await page.waitForSelector("text=Calculation Results");

    // Verify no PAYE tax for low income
    const payeTaxText = await page
      .locator("[data-testid='paye-tax']")
      .textContent();
    expect(payeTaxText).toContain("0.00");

    // Clear and test with high income (multiple tax bands)
    await page.reload();
    await page.fill('input[name="firstName"]', "High");
    await page.fill('input[name="lastName"]', "Earner");
    await page.fill('input[name="nisNumber"]', "H87654321");
    await page.fill('input[name="basicSalary"]', "500000");
    await page.fill('input[name="overtime"]', "100000");
    await page.fill('input[name="dependents"]', "3");

    await page.click('button:has-text("Calculate PAYE & NIS")');
    await page.waitForSelector("text=Calculation Results");

    // Verify tax bands are applied
    await expect(page.locator("text=Band 1 (25%)")).toBeVisible();
    await expect(page.locator("text=Band 2 (35%)")).toBeVisible();

    // Verify NIS ceiling is applied
    const nisContributionText = await page
      .locator("[data-testid='nis-employee']")
      .textContent();
    expect(nisContributionText).toContain("15,680"); // Max NIS contribution

    // Test maximum children allowance
    const childAllowanceText = await page
      .locator("[data-testid='child-allowance']")
      .textContent();
    expect(childAllowanceText).toContain("30,000"); // Max 3 children × 10k each
  });

  test("should handle form validation errors gracefully", async ({ page }) => {
    await page.goto("/tax/paye");

    // Test empty form submission
    await page.click('button:has-text("Calculate PAYE & NIS")');

    // Verify validation errors
    await expect(page.locator("text=First name is required")).toBeVisible();
    await expect(page.locator("text=Last name is required")).toBeVisible();
    await expect(page.locator("text=NIS number is required")).toBeVisible();

    // Test invalid NIS number format
    await page.fill('input[name="firstName"]', "Test");
    await page.fill('input[name="lastName"]', "User");
    await page.fill('input[name="nisNumber"]', "invalid");
    await page.fill('input[name="basicSalary"]', "100000");

    await page.click('button:has-text("Calculate PAYE & NIS")');

    // Verify NIS validation error
    await expect(page.locator("text=Invalid NIS number format")).toBeVisible();

    // Test negative salary
    await page.fill('input[name="nisNumber"]', "123456789");
    await page.fill('input[name="basicSalary"]', "-1000");

    await page.click('button:has-text("Calculate PAYE & NIS")');

    // Verify salary validation error
    await expect(
      page.locator("text=Basic salary must be positive")
    ).toBeVisible();

    // Test invalid dependents
    await page.fill('input[name="basicSalary"]', "100000");
    await page.fill('input[name="dependents"]', "15");

    await page.click('button:has-text("Calculate PAYE & NIS")');

    // Should still calculate but limit to max 3 children
    await page.waitForSelector("text=Calculation Results");
    const childAllowanceText = await page
      .locator("[data-testid='child-allowance']")
      .textContent();
    expect(childAllowanceText).toContain("30,000"); // Max allowance for 3 children
  });

  test("should maintain calculation history and audit trail", async ({
    page,
  }) => {
    // Navigate to tax calculations history
    await page.goto("/tax/history");

    // Verify history page
    await expect(page.locator("h1")).toContainText("Tax Calculation History");

    // Perform a few calculations to create history
    for (let i = 1; i <= 3; i++) {
      await page.goto("/tax/paye");

      await page.fill('input[name="firstName"]', `Employee${i}`);
      await page.fill('input[name="lastName"]', "Test");
      await page.fill('input[name="nisNumber"]', `12345678${i}`);
      await page.fill(
        'input[name="basicSalary"]',
        (150_000 + i * 10_000).toString()
      );

      await page.click('button:has-text("Calculate PAYE & NIS")');
      await page.waitForSelector("text=Calculation Results");

      // Save calculation if save button exists
      const saveButton = page.locator('button:has-text("Save")');
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForSelector("text=saved", { timeout: 5000 });
      }
    }

    // Return to history page
    await page.goto("/tax/history");

    // Verify calculations appear in history
    await expect(page.locator("text=Employee1 Test")).toBeVisible();
    await expect(page.locator("text=Employee2 Test")).toBeVisible();
    await expect(page.locator("text=Employee3 Test")).toBeVisible();

    // Test filtering and search
    await page.fill('input[name="search"]', "Employee2");
    await page.click('button:has-text("Search")');

    await expect(page.locator("text=Employee2 Test")).toBeVisible();
    await expect(page.locator("text=Employee1 Test")).not.toBeVisible();

    // Test date range filtering
    await page.selectOption('select[name="period"]', "last-30-days");
    await page.click('button:has-text("Apply Filter")');

    // Verify recent calculations are shown
    await expect(page.locator("text=Employee2 Test")).toBeVisible();

    // Test export functionality
    await page.click('button:has-text("Export")');
    await page.selectOption('select[name="format"]', "csv");
    await page.click('button:has-text("Download")');

    // Verify download initiated (file download handling varies by browser)
    await page.waitForTimeout(2000);
  });
});

test.describe("Tax Calculation Mobile Workflow", () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 12 Pro viewport

  test("should work properly on mobile devices", async ({ page }) => {
    // Login on mobile
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.TEST_STAFF_EMAIL!);
    await page.fill('input[name="password"]', process.env.TEST_STAFF_PASSWORD!);
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard");

    // Navigate to PAYE calculator via mobile menu
    await page.click('button[aria-label="Open menu"]');
    await page.click('a:has-text("Tax Calculations")');
    await page.click('a:has-text("PAYE Calculator")');

    // Verify mobile layout
    await expect(page.locator("h1")).toContainText("PAYE Calculator");

    // Fill form on mobile (should have responsive layout)
    await page.fill('input[name="firstName"]', "Mobile");
    await page.fill('input[name="lastName"]', "User");
    await page.fill('input[name="nisNumber"]', "M12345678");
    await page.fill('input[name="basicSalary"]', "175000");

    // Calculate
    await page.click('button:has-text("Calculate PAYE & NIS")');
    await page.waitForSelector("text=Calculation Results");

    // Verify results are displayed properly on mobile
    await expect(page.locator("text=Gross Earnings")).toBeVisible();
    await expect(page.locator("text=Net Pay")).toBeVisible();

    // Test mobile-specific interactions
    await page
      .locator("[data-testid='calculation-results']")
      .scrollIntoViewIfNeeded();
    await expect(page.locator("text=Total Deductions")).toBeVisible();
  });
});

test.describe("Tax Calculation Performance", () => {
  test("should handle bulk calculations efficiently", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', process.env.TEST_ADMIN_EMAIL!);
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD!);
    await page.click('button[type="submit"]');

    await page.waitForURL("/dashboard");

    // Navigate to bulk processing (if available)
    await page.goto("/tax/bulk");

    // Upload CSV file with employee data (if bulk upload is available)
    const csvContent = `firstName,lastName,nisNumber,basicSalary,allowances,dependents
John,Doe,123456789,200000,20000,2
Jane,Smith,A87654321,180000,15000,1
Bob,Johnson,B12345678,250000,30000,3`;

    // Create and upload test file
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: "employees.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(csvContent),
      });

      await page.click('button:has-text("Process Bulk Calculations")');

      // Monitor processing time
      const startTime = Date.now();
      await page.waitForSelector("text=Bulk processing completed", {
        timeout: 30_000,
      });
      const endTime = Date.now();

      // Verify reasonable processing time (should be under 10 seconds for 3 employees)
      expect(endTime - startTime).toBeLessThan(10_000);

      // Verify all calculations completed
      await expect(page.locator("text=3 employees processed")).toBeVisible();
      await expect(page.locator("text=0 errors")).toBeVisible();
    }
  });
});
