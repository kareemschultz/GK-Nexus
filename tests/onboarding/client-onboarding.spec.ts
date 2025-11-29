import { expect, test } from "@playwright/test";
import { generateTestPDF, testClients } from "../fixtures/test-data";
import { createTestHelpers } from "../utils/test-helpers";

test.describe("Client Onboarding Wizard", () => {
  test.beforeEach(async ({ page }) => {
    const helpers = createTestHelpers(page);
    // Login as admin/manager who can onboard clients
    await helpers.auth.loginAsAdmin();
  });

  test.describe("Onboarding Flow Navigation", () => {
    test("should display onboarding wizard correctly", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      // Verify wizard structure
      await expect(
        page.locator('[data-testid="onboarding-wizard"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="wizard-progress"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="step-indicator"]')
      ).toBeVisible();

      // Verify first step is active
      await expect(page.locator('[data-testid="step-1"]')).toHaveClass(
        /active/
      );
      await expect(
        page.locator('[data-testid="client-info-form"]')
      ).toBeVisible();

      // Check accessibility
      await helpers.a11y.injectAxe();
      await helpers.a11y.checkAccessibility();
    });

    test("should navigate between steps correctly", async ({ page }) => {
      const _helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      // Fill required fields in step 1
      await page.fill('[data-testid="client-name-input"]', "Test Corporation");
      await page.fill(
        '[data-testid="client-email-input"]',
        "test@corporation.com"
      );
      await page.fill('[data-testid="client-phone-input"]', "+1-555-0123");

      // Navigate to step 2
      await page.click('[data-testid="next-step-button"]');

      // Verify step 2 is active
      await expect(page.locator('[data-testid="step-2"]')).toHaveClass(
        /active/
      );
      await expect(
        page.locator('[data-testid="business-details-form"]')
      ).toBeVisible();

      // Navigate back to step 1
      await page.click('[data-testid="prev-step-button"]');
      await expect(page.locator('[data-testid="step-1"]')).toHaveClass(
        /active/
      );

      // Verify data is preserved
      await expect(
        page.locator('[data-testid="client-name-input"]')
      ).toHaveValue("Test Corporation");
    });

    test("should prevent navigation without required fields", async ({
      page,
    }) => {
      await page.goto("/clients/new");

      // Try to navigate without filling required fields
      await page.click('[data-testid="next-step-button"]');

      // Should show validation errors and stay on step 1
      await expect(page.locator('[data-testid="step-1"]')).toHaveClass(
        /active/
      );
      await expect(
        page.locator('[data-testid="client-name-error"]')
      ).toContainText("Name is required");
      await expect(
        page.locator('[data-testid="client-email-error"]')
      ).toContainText("Email is required");
    });

    test("should show progress indicator correctly", async ({ page }) => {
      await page.goto("/clients/new");

      // Verify initial progress
      const progressBar = page.locator('[data-testid="progress-bar"]');
      await expect(progressBar).toHaveAttribute("aria-valuenow", "1");
      await expect(progressBar).toHaveAttribute("aria-valuemax", "5");

      // Complete step 1 and verify progress
      await page.fill('[data-testid="client-name-input"]', "Test Corp");
      await page.fill('[data-testid="client-email-input"]', "test@corp.com");
      await page.fill('[data-testid="client-phone-input"]', "+1-555-0123");
      await page.click('[data-testid="next-step-button"]');

      await expect(progressBar).toHaveAttribute("aria-valuenow", "2");
      await expect(page.locator('[data-testid="progress-text"]')).toContainText(
        "Step 2 of 5"
      );
    });
  });

  test.describe("Step 1: Basic Information", () => {
    test("should complete basic information step", async ({ page }) => {
      const _helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      const clientData = testClients[0];

      // Fill basic information
      await page.fill('[data-testid="client-name-input"]', clientData.name);
      await page.fill('[data-testid="client-email-input"]', clientData.email);
      await page.fill('[data-testid="client-phone-input"]', clientData.phone);

      // Verify real-time validation
      await expect(
        page.locator('[data-testid="client-name-input"]')
      ).toHaveClass(/valid/);
      await expect(
        page.locator('[data-testid="client-email-input"]')
      ).toHaveClass(/valid/);

      await page.click('[data-testid="next-step-button"]');
      await expect(page.locator('[data-testid="step-2"]')).toHaveClass(
        /active/
      );
    });

    test("should validate email format", async ({ page }) => {
      await page.goto("/clients/new");

      // Test invalid email
      await page.fill('[data-testid="client-email-input"]', "invalid-email");
      await page.blur('[data-testid="client-email-input"]');

      await expect(
        page.locator('[data-testid="client-email-error"]')
      ).toContainText("Please enter a valid email");

      // Test valid email
      await page.fill('[data-testid="client-email-input"]', "valid@email.com");
      await expect(
        page.locator('[data-testid="client-email-error"]')
      ).toBeHidden();
    });

    test("should validate phone number format", async ({ page }) => {
      await page.goto("/clients/new");

      // Test invalid phone
      await page.fill('[data-testid="client-phone-input"]', "123");
      await page.blur('[data-testid="client-phone-input"]');

      await expect(
        page.locator('[data-testid="client-phone-error"]')
      ).toContainText("Please enter a valid phone number");

      // Test valid phone
      await page.fill('[data-testid="client-phone-input"]', "+1-555-123-4567");
      await expect(
        page.locator('[data-testid="client-phone-error"]')
      ).toBeHidden();
    });
  });

  test.describe("Step 2: Business Details", () => {
    test("should complete business details step", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Complete step 1
      await helpers.form.fillForm({
        "client-name-input": clientData.name,
        "client-email-input": clientData.email,
        "client-phone-input": clientData.phone,
      });
      await page.click('[data-testid="next-step-button"]');

      // Fill business details
      await page.fill('[data-testid="tax-id-input"]', clientData.taxId);
      await helpers.form.selectOption(
        "business-type-select",
        clientData.businessType
      );
      await helpers.form.selectOption("industry-select", clientData.industry);
      await page.fill(
        '[data-testid="established-date-input"]',
        clientData.establishedDate
      );
      await page.fill('[data-testid="website-input"]', clientData.website);

      await page.click('[data-testid="next-step-button"]');
      await expect(page.locator('[data-testid="step-3"]')).toHaveClass(
        /active/
      );
    });

    test("should validate tax ID format", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      // Navigate to step 2
      await helpers.form.fillForm({
        "client-name-input": "Test Corp",
        "client-email-input": "test@corp.com",
        "client-phone-input": "+1-555-0123",
      });
      await page.click('[data-testid="next-step-button"]');

      // Test invalid tax ID
      await page.fill('[data-testid="tax-id-input"]', "123");
      await page.blur('[data-testid="tax-id-input"]');

      await expect(page.locator('[data-testid="tax-id-error"]')).toContainText(
        "Please enter a valid tax ID"
      );

      // Test valid tax ID
      await page.fill('[data-testid="tax-id-input"]', "12-3456789");
      await expect(page.locator('[data-testid="tax-id-error"]')).toBeHidden();
    });

    test("should provide business type suggestions", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      // Navigate to step 2
      await helpers.form.fillForm({
        "client-name-input": "Test Corp",
        "client-email-input": "test@corp.com",
        "client-phone-input": "+1-555-0123",
      });
      await page.click('[data-testid="next-step-button"]');

      // Open business type dropdown
      await page.click('[data-testid="business-type-select"]');

      // Verify options
      await expect(page.locator('[data-value="corporation"]')).toBeVisible();
      await expect(page.locator('[data-value="llc"]')).toBeVisible();
      await expect(page.locator('[data-value="partnership"]')).toBeVisible();
      await expect(
        page.locator('[data-value="sole-proprietorship"]')
      ).toBeVisible();
    });
  });

  test.describe("Step 3: Address Information", () => {
    test("should complete address information step", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Navigate to step 3
      await helpers.form.fillForm({
        "client-name-input": clientData.name,
        "client-email-input": clientData.email,
        "client-phone-input": clientData.phone,
      });
      await page.click('[data-testid="next-step-button"]');

      await helpers.form.fillForm({
        "tax-id-input": clientData.taxId,
      });
      await helpers.form.selectOption(
        "business-type-select",
        clientData.businessType
      );
      await helpers.form.selectOption("industry-select", clientData.industry);
      await page.click('[data-testid="next-step-button"]');

      // Fill address information
      await page.fill(
        '[data-testid="street-address-input"]',
        clientData.address.street
      );
      await page.fill('[data-testid="city-input"]', clientData.address.city);
      await page.fill('[data-testid="state-input"]', clientData.address.state);
      await page.fill(
        '[data-testid="zip-code-input"]',
        clientData.address.zipCode
      );
      await helpers.form.selectOption(
        "country-select",
        clientData.address.country
      );

      await page.click('[data-testid="next-step-button"]');
      await expect(page.locator('[data-testid="step-4"]')).toHaveClass(
        /active/
      );
    });

    test("should validate address fields", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      // Navigate to step 3
      await helpers.form.fillForm({
        "client-name-input": "Test Corp",
        "client-email-input": "test@corp.com",
        "client-phone-input": "+1-555-0123",
      });
      await page.click('[data-testid="next-step-button"]');

      await helpers.form.fillForm({ "tax-id-input": "12-3456789" });
      await helpers.form.selectOption("business-type-select", "corporation");
      await page.click('[data-testid="next-step-button"]');

      // Try to proceed without required fields
      await page.click('[data-testid="next-step-button"]');

      await expect(
        page.locator('[data-testid="street-address-error"]')
      ).toContainText("Street address is required");
      await expect(page.locator('[data-testid="city-error"]')).toContainText(
        "City is required"
      );
      await expect(page.locator('[data-testid="state-error"]')).toContainText(
        "State is required"
      );
      await expect(
        page.locator('[data-testid="zip-code-error"]')
      ).toContainText("ZIP code is required");
    });

    test("should validate ZIP code format", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      // Navigate to step 3 and fill required fields
      await helpers.form.fillForm({
        "client-name-input": "Test Corp",
        "client-email-input": "test@corp.com",
        "client-phone-input": "+1-555-0123",
      });
      await page.click('[data-testid="next-step-button"]');

      await helpers.form.fillForm({ "tax-id-input": "12-3456789" });
      await helpers.form.selectOption("business-type-select", "corporation");
      await page.click('[data-testid="next-step-button"]');

      // Test invalid ZIP code
      await page.fill('[data-testid="zip-code-input"]', "123");
      await page.blur('[data-testid="zip-code-input"]');

      await expect(
        page.locator('[data-testid="zip-code-error"]')
      ).toContainText("Please enter a valid ZIP code");

      // Test valid ZIP code
      await page.fill('[data-testid="zip-code-input"]', "12345");
      await expect(page.locator('[data-testid="zip-code-error"]')).toBeHidden();
    });
  });

  test.describe("Step 4: Service Preferences", () => {
    test("should complete service preferences step", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Navigate to step 4
      await completeSteps1to3(page, helpers, clientData);

      // Select services
      await page.check('[data-testid="tax-preparation-service"]');
      await page.check('[data-testid="bookkeeping-service"]');
      await page.check('[data-testid="payroll-service"]');

      // Set preferences
      await helpers.form.selectOption(
        "communication-preference-select",
        "email"
      );
      await helpers.form.selectOption("meeting-frequency-select", "monthly");
      await page.fill(
        '[data-testid="special-requirements-textarea"]',
        "Quarterly reports needed"
      );

      await page.click('[data-testid="next-step-button"]');
      await expect(page.locator('[data-testid="step-5"]')).toHaveClass(
        /active/
      );
    });

    test("should require at least one service selection", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Navigate to step 4
      await completeSteps1to3(page, helpers, clientData);

      // Try to proceed without selecting services
      await page.click('[data-testid="next-step-button"]');

      await expect(
        page.locator('[data-testid="services-error"]')
      ).toContainText("Please select at least one service");
    });

    test("should show service details on selection", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Navigate to step 4
      await completeSteps1to3(page, helpers, clientData);

      // Select tax preparation service
      await page.check('[data-testid="tax-preparation-service"]');

      // Verify service details appear
      await expect(
        page.locator('[data-testid="tax-preparation-details"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="tax-preparation-pricing"]')
      ).toBeVisible();
    });
  });

  test.describe("Step 5: Document Upload", () => {
    test("should complete document upload step", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Navigate to step 5
      await completeSteps1to4(page, helpers, clientData);

      // Upload required documents
      const _testFile = generateTestPDF("business-license.pdf");
      await helpers.form.uploadFile(
        "business-license-upload",
        "test-files/business-license.pdf"
      );

      // Verify upload success
      await helpers.wait.waitForToast("Document uploaded successfully");
      await expect(
        page.locator('[data-testid="uploaded-file-business-license"]')
      ).toBeVisible();

      // Complete onboarding
      await page.click('[data-testid="complete-onboarding-button"]');

      // Verify success
      await helpers.wait.waitForToast("Client onboarded successfully");
      await expect(page).toHaveURL(/\/clients\/[a-z0-9-]+/);
    });

    test("should validate file types and sizes", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Navigate to step 5
      await completeSteps1to4(page, helpers, clientData);

      // Try to upload invalid file type
      await helpers.form.uploadFile(
        "business-license-upload",
        "test-files/invalid-file.txt"
      );

      await expect(
        page.locator('[data-testid="file-type-error"]')
      ).toContainText("Please upload a PDF or image file");

      // Try to upload oversized file
      await helpers.form.uploadFile(
        "business-license-upload",
        "test-files/large-file.pdf"
      );

      await expect(
        page.locator('[data-testid="file-size-error"]')
      ).toContainText("File size must be less than 10MB");
    });

    test("should allow optional document uploads", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Navigate to step 5
      await completeSteps1to4(page, helpers, clientData);

      // Complete without uploading optional documents
      await page.click('[data-testid="complete-onboarding-button"]');

      // Should succeed
      await helpers.wait.waitForToast("Client onboarded successfully");
    });
  });

  test.describe("Form Persistence and Recovery", () => {
    test("should save progress automatically", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      // Fill step 1
      await helpers.form.fillForm({
        "client-name-input": "Auto Save Corp",
        "client-email-input": "autosave@corp.com",
        "client-phone-input": "+1-555-9999",
      });

      // Wait for auto-save
      await page.waitForTimeout(2000);
      await helpers.wait.waitForToast("Progress saved automatically");

      // Reload page
      await page.reload();

      // Verify data is restored
      await expect(
        page.locator('[data-testid="client-name-input"]')
      ).toHaveValue("Auto Save Corp");
      await expect(
        page.locator('[data-testid="client-email-input"]')
      ).toHaveValue("autosave@corp.com");
    });

    test("should allow user to save draft manually", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      // Fill partial data
      await page.fill('[data-testid="client-name-input"]', "Draft Corp");
      await page.fill('[data-testid="client-email-input"]', "draft@corp.com");

      // Save draft
      await page.click('[data-testid="save-draft-button"]');

      await helpers.wait.waitForToast("Draft saved successfully");
      await expect(
        page.locator('[data-testid="draft-indicator"]')
      ).toBeVisible();
    });

    test("should allow user to resume from drafts", async ({ page }) => {
      const _helpers = createTestHelpers(page);

      await page.goto("/clients/drafts");

      // Verify drafts list
      await expect(page.locator('[data-testid="drafts-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="draft-item"]')).toHaveCount(1);

      // Resume draft
      await page.click('[data-testid="resume-draft-button"]');

      // Verify data is restored
      await expect(page).toHaveURL(/\/clients\/new/);
      await expect(
        page.locator('[data-testid="client-name-input"]')
      ).toHaveValue("Draft Corp");
    });
  });

  test.describe("Error Handling and Edge Cases", () => {
    test("should handle network errors gracefully", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Mock network error on submission
      await page.route("**/api/clients", (route) => {
        route.abort("connectionreset");
      });

      // Complete all steps
      await completeSteps1to4(page, helpers, clientData);
      await page.click('[data-testid="complete-onboarding-button"]');

      // Verify error handling
      await helpers.wait.waitForToast("Connection error. Please try again.");
      await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

      // Verify form data is preserved
      await expect(
        page.locator('[data-testid="client-name-input"]')
      ).toHaveValue(clientData.name);
    });

    test("should handle validation errors from server", async ({ page }) => {
      const helpers = createTestHelpers(page);
      const clientData = testClients[0];

      await page.goto("/clients/new");

      // Mock server validation error
      await page.route("**/api/clients", (route) => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            errors: {
              email: "Email already exists in system",
              taxId: "Invalid tax ID format",
            },
          }),
        });
      });

      // Complete all steps
      await completeSteps1to4(page, helpers, clientData);
      await page.click('[data-testid="complete-onboarding-button"]');

      // Verify server errors are shown
      await expect(
        page.locator('[data-testid="client-email-error"]')
      ).toContainText("Email already exists");
      await expect(page.locator('[data-testid="tax-id-error"]')).toContainText(
        "Invalid tax ID format"
      );

      // Should navigate back to relevant step
      await expect(page.locator('[data-testid="step-1"]')).toHaveClass(
        /active/
      );
    });

    test("should handle session timeout during onboarding", async ({
      page,
    }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/clients/new");

      // Fill some data
      await page.fill('[data-testid="client-name-input"]', "Session Test Corp");

      // Simulate session timeout
      await page.evaluate(() => {
        localStorage.removeItem("auth-token");
        sessionStorage.removeItem("auth-token");
      });

      // Try to proceed
      await page.click('[data-testid="next-step-button"]');

      // Should redirect to login with message
      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.locator('[data-testid="session-expired-message"]')
      ).toBeVisible();

      // Should preserve onboarding data for after login
      await helpers.auth.loginAsAdmin();
      await expect(page).toHaveURL(/\/clients\/new/);
      await expect(
        page.locator('[data-testid="client-name-input"]')
      ).toHaveValue("Session Test Corp");
    });
  });
});

// Helper functions
async function completeSteps1to3(page: any, helpers: any, clientData: any) {
  // Step 1
  await helpers.form.fillForm({
    "client-name-input": clientData.name,
    "client-email-input": clientData.email,
    "client-phone-input": clientData.phone,
  });
  await page.click('[data-testid="next-step-button"]');

  // Step 2
  await helpers.form.fillForm({ "tax-id-input": clientData.taxId });
  await helpers.form.selectOption(
    "business-type-select",
    clientData.businessType
  );
  await helpers.form.selectOption("industry-select", clientData.industry);
  await page.click('[data-testid="next-step-button"]');

  // Step 3
  await page.fill(
    '[data-testid="street-address-input"]',
    clientData.address.street
  );
  await page.fill('[data-testid="city-input"]', clientData.address.city);
  await page.fill('[data-testid="state-input"]', clientData.address.state);
  await page.fill('[data-testid="zip-code-input"]', clientData.address.zipCode);
  await helpers.form.selectOption("country-select", clientData.address.country);
  await page.click('[data-testid="next-step-button"]');
}

async function completeSteps1to4(page: any, helpers: any, clientData: any) {
  await completeSteps1to3(page, helpers, clientData);

  // Step 4
  await page.check('[data-testid="tax-preparation-service"]');
  await helpers.form.selectOption("communication-preference-select", "email");
  await page.click('[data-testid="next-step-button"]');
}
