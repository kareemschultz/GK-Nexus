/**
 * Multi-Role User Scenarios E2E Tests
 * Tests complete workflows across different user roles and permission levels
 */

import { createId } from "@paralleldrive/cuid2";
import { expect, type Page, test } from "@playwright/test";

// Test data and configuration
const TEST_ORGANIZATION = {
  id: "test-org-multi-role",
  name: "Multi-Role Test Organization",
  subdomain: "multi-role-test",
};

const USER_ROLES = {
  SUPER_ADMIN: {
    email: process.env.TEST_SUPER_ADMIN_EMAIL || "superadmin@test.com",
    password: process.env.TEST_SUPER_ADMIN_PASSWORD || "TestPassword123!",
    role: "SUPER_ADMIN",
    permissions: ["*"], // All permissions
  },
  ADMIN: {
    email: process.env.TEST_ADMIN_EMAIL || "admin@test.com",
    password: process.env.TEST_ADMIN_PASSWORD || "TestPassword123!",
    role: "ADMIN",
    permissions: [
      "users:manage",
      "clients:manage",
      "tax:calculate",
      "documents:manage",
      "reports:generate",
    ],
  },
  TAX_MANAGER: {
    email: process.env.TEST_MANAGER_EMAIL || "manager@test.com",
    password: process.env.TEST_MANAGER_PASSWORD || "TestPassword123!",
    role: "TAX_MANAGER",
    permissions: [
      "tax:calculate",
      "tax:review",
      "clients:view",
      "clients:manage",
      "documents:upload",
      "reports:generate",
    ],
  },
  TAX_STAFF: {
    email: process.env.TEST_STAFF_EMAIL || "staff@test.com",
    password: process.env.TEST_STAFF_PASSWORD || "TestPassword123!",
    role: "TAX_STAFF",
    permissions: ["tax:calculate", "clients:view", "documents:upload"],
  },
  CLIENT: {
    email: process.env.TEST_CLIENT_EMAIL || "client@test.com",
    password: process.env.TEST_CLIENT_PASSWORD || "TestPassword123!",
    role: "CLIENT",
    permissions: ["portal:access", "documents:view_own", "appointments:book"],
  },
};

// Shared authentication function
async function authenticateUser(page: Page, userRole: keyof typeof USER_ROLES) {
  const user = USER_ROLES[userRole];

  await page.goto("/login");
  await page.fill("[data-testid=email-input]", user.email);
  await page.fill("[data-testid=password-input]", user.password);
  await page.click("[data-testid=login-button]");

  // Wait for successful authentication
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  // Verify user role is displayed
  await expect(page.locator("[data-testid=user-role]")).toContainText(
    user.role
  );
}

// Helper function to create test client
async function createTestClient(page: Page, clientData = {}) {
  const defaultClientData = {
    type: "INDIVIDUAL",
    firstName: "Test",
    lastName: "Client",
    email: `client-${createId()}@example.com`,
    phone: "+592-123-4567",
    tinNumber: "123-456-789",
    nisNumber: "12345678",
    ...clientData,
  };

  await page.goto("/clients");
  await page.click("[data-testid=add-client-button]");

  // Fill client form
  await page.fill(
    "[data-testid=client-firstName]",
    defaultClientData.firstName
  );
  await page.fill("[data-testid=client-lastName]", defaultClientData.lastName);
  await page.fill("[data-testid=client-email]", defaultClientData.email);
  await page.fill("[data-testid=client-phone]", defaultClientData.phone);
  await page.fill("[data-testid=client-tin]", defaultClientData.tinNumber);
  await page.fill("[data-testid=client-nis]", defaultClientData.nisNumber);

  await page.click("[data-testid=save-client-button]");

  // Wait for success notification
  await expect(
    page.locator("[data-testid=success-notification]")
  ).toBeVisible();

  return defaultClientData;
}

test.describe("Multi-Role User Scenarios", () => {
  test.describe("Super Admin Workflows", () => {
    test("should manage users and assign roles across the organization", async ({
      page,
    }) => {
      await authenticateUser(page, "SUPER_ADMIN");

      // Navigate to user management
      await page.click("[data-testid=navigation-users]");
      await expect(page).toHaveURL(/\/users/);

      // Create new tax staff user
      await page.click("[data-testid=add-user-button]");

      const newUserData = {
        email: `new-staff-${createId()}@test.com`,
        firstName: "New",
        lastName: "Staff",
        phone: "+592-555-0123",
      };

      await page.fill("[data-testid=user-email]", newUserData.email);
      await page.fill("[data-testid=user-firstName]", newUserData.firstName);
      await page.fill("[data-testid=user-lastName]", newUserData.lastName);
      await page.fill("[data-testid=user-phone]", newUserData.phone);

      // Assign TAX_STAFF role
      await page.selectOption("[data-testid=user-role-select]", "TAX_STAFF");

      await page.click("[data-testid=save-user-button]");

      // Verify user creation
      await expect(
        page.locator("[data-testid=success-notification]")
      ).toBeVisible();
      await expect(page.locator("[data-testid=users-table]")).toContainText(
        newUserData.email
      );

      // Verify role assignment
      const userRow = page.locator(
        `[data-testid=user-row-${newUserData.email}]`
      );
      await expect(userRow.locator("[data-testid=user-role]")).toContainText(
        "TAX_STAFF"
      );

      // Test role modification
      await userRow.click("[data-testid=edit-user-button]");
      await page.selectOption("[data-testid=user-role-select]", "TAX_MANAGER");
      await page.click("[data-testid=save-user-button]");

      // Verify role update
      await expect(userRow.locator("[data-testid=user-role]")).toContainText(
        "TAX_MANAGER"
      );
    });

    test("should access all system areas and perform administrative tasks", async ({
      page,
    }) => {
      await authenticateUser(page, "SUPER_ADMIN");

      // Verify access to all navigation items
      const navigationItems = [
        "dashboard",
        "clients",
        "tax",
        "documents",
        "users",
        "settings",
        "reports",
        "audit",
      ];

      for (const item of navigationItems) {
        const navItem = page.locator(`[data-testid=navigation-${item}]`);
        await expect(navItem).toBeVisible();
      }

      // Test system settings access
      await page.click("[data-testid=navigation-settings]");
      await expect(page).toHaveURL(/\/settings/);

      // Verify access to organization settings
      await page.click("[data-testid=organization-settings-tab]");
      await expect(
        page.locator("[data-testid=organization-settings]")
      ).toBeVisible();

      // Test audit logs access
      await page.click("[data-testid=navigation-audit]");
      await expect(page).toHaveURL(/\/audit/);
      await expect(
        page.locator("[data-testid=audit-logs-table]")
      ).toBeVisible();

      // Verify ability to view all organization data
      await page.click("[data-testid=navigation-clients]");
      await expect(page.locator("[data-testid=clients-table]")).toBeVisible();

      const clientCount = await page
        .locator("[data-testid=client-row]")
        .count();
      expect(clientCount).toBeGreaterThan(0);
    });
  });

  test.describe("Tax Manager Workflows", () => {
    test("should manage tax calculations and oversee staff work", async ({
      page,
    }) => {
      await authenticateUser(page, "TAX_MANAGER");

      // Create a test client first
      const testClient = await createTestClient(page, {
        type: "INDIVIDUAL",
        firstName: "Manager",
        lastName: "Client",
        annualIncome: 2_400_000,
      });

      // Navigate to tax calculations
      await page.click("[data-testid=navigation-tax]");
      await expect(page).toHaveURL(/\/tax/);

      // Perform PAYE calculation
      await page.click("[data-testid=calculate-paye-button]");

      // Select client
      await page.selectOption("[data-testid=client-select]", testClient.email);

      // Fill calculation inputs
      await page.fill("[data-testid=basic-salary]", "200000");
      await page.fill("[data-testid=overtime]", "25000");
      await page.fill("[data-testid=allowances]", "10000");
      await page.fill("[data-testid=dependents]", "2");

      await page.click("[data-testid=calculate-button]");

      // Verify calculation results
      await expect(
        page.locator("[data-testid=calculation-results]")
      ).toBeVisible();
      await expect(page.locator("[data-testid=gross-earnings]")).toContainText(
        "235,000"
      );
      await expect(page.locator("[data-testid=paye-tax]")).toBeVisible();
      await expect(page.locator("[data-testid=net-pay]")).toBeVisible();

      // Review and approve calculation
      await page.click("[data-testid=review-calculation-button]");
      await page.fill(
        "[data-testid=review-notes]",
        "Calculation reviewed and approved by manager"
      );
      await page.click("[data-testid=approve-calculation-button]");

      await expect(
        page.locator("[data-testid=approval-success]")
      ).toBeVisible();

      // Verify calculation appears in history
      await page.click("[data-testid=calculation-history-tab]");
      await expect(
        page.locator("[data-testid=calculations-table]")
      ).toContainText(testClient.lastName);
      await expect(
        page.locator("[data-testid=calculation-status]")
      ).toContainText("APPROVED");
    });

    test("should manage clients and view sensitive financial information", async ({
      page,
    }) => {
      await authenticateUser(page, "TAX_MANAGER");

      await page.click("[data-testid=navigation-clients]");

      // Create business client
      await page.click("[data-testid=add-client-button]");

      // Switch to business client form
      await page.click("[data-testid=client-type-business]");

      const businessData = {
        businessName: "Manager Test Business Ltd.",
        registrationNumber: "REG789012",
        email: `business-${createId()}@test.com`,
        annualRevenue: "8000000",
        vatNumber: "VAT789012345",
      };

      await page.fill("[data-testid=business-name]", businessData.businessName);
      await page.fill(
        "[data-testid=registration-number]",
        businessData.registrationNumber
      );
      await page.fill("[data-testid=business-email]", businessData.email);
      await page.fill(
        "[data-testid=annual-revenue]",
        businessData.annualRevenue
      );
      await page.fill("[data-testid=vat-number]", businessData.vatNumber);

      await page.click("[data-testid=save-client-button]");

      // Verify business client creation
      await expect(
        page.locator("[data-testid=success-notification]")
      ).toBeVisible();

      // View client details (financial information should be visible)
      await page.click(`[data-testid=view-client-${businessData.email}]`);

      await expect(page.locator("[data-testid=client-revenue]")).toContainText(
        "8,000,000"
      );
      await expect(page.locator("[data-testid=client-vat]")).toContainText(
        businessData.vatNumber
      );

      // Update client information
      await page.click("[data-testid=edit-client-button]");
      await page.fill("[data-testid=annual-revenue]", "9500000");
      await page.click("[data-testid=save-client-button]");

      await expect(page.locator("[data-testid=client-revenue]")).toContainText(
        "9,500,000"
      );
    });

    test("should generate reports with access to aggregated data", async ({
      page,
    }) => {
      await authenticateUser(page, "TAX_MANAGER");

      await page.click("[data-testid=navigation-reports]");
      await expect(page).toHaveURL(/\/reports/);

      // Generate tax summary report
      await page.click("[data-testid=generate-tax-report-button]");

      // Configure report parameters
      await page.selectOption("[data-testid=report-period]", "QUARTERLY");
      await page.fill("[data-testid=report-year]", "2024");
      await page.selectOption("[data-testid=report-type]", "TAX_SUMMARY");

      await page.click("[data-testid=generate-report-button]");

      // Wait for report generation
      await expect(
        page.locator("[data-testid=report-generating]")
      ).toBeVisible();
      await expect(page.locator("[data-testid=report-results]")).toBeVisible({
        timeout: 30_000,
      });

      // Verify report contains expected data
      await expect(
        page.locator("[data-testid=total-tax-calculated]")
      ).toBeVisible();
      await expect(page.locator("[data-testid=client-count]")).toBeVisible();
      await expect(
        page.locator("[data-testid=average-tax-rate]")
      ).toBeVisible();

      // Download report
      await page.click("[data-testid=download-report-button]");

      // Verify download initiated (check for download notification or file)
      await expect(
        page.locator("[data-testid=download-notification]")
      ).toBeVisible();
    });
  });

  test.describe("Tax Staff Workflows", () => {
    test("should perform tax calculations but have limited access", async ({
      page,
    }) => {
      await authenticateUser(page, "TAX_STAFF");

      // Verify limited navigation access
      await expect(
        page.locator("[data-testid=navigation-users]")
      ).not.toBeVisible();
      await expect(
        page.locator("[data-testid=navigation-settings]")
      ).not.toBeVisible();
      await expect(
        page.locator("[data-testid=navigation-audit]")
      ).not.toBeVisible();

      // Access allowed areas
      await expect(
        page.locator("[data-testid=navigation-dashboard]")
      ).toBeVisible();
      await expect(
        page.locator("[data-testid=navigation-clients]")
      ).toBeVisible();
      await expect(page.locator("[data-testid=navigation-tax]")).toBeVisible();
      await expect(
        page.locator("[data-testid=navigation-documents]")
      ).toBeVisible();

      // Create a client (staff can view, not create by default)
      await page.click("[data-testid=navigation-clients]");

      // Should see existing clients but not create button for new clients
      await expect(
        page.locator("[data-testid=add-client-button]")
      ).not.toBeVisible();
      await expect(page.locator("[data-testid=clients-table]")).toBeVisible();

      // Select existing client for tax calculation
      const firstClient = page.locator("[data-testid=client-row]").first();
      await firstClient.click("[data-testid=calculate-tax-button]");

      // Perform basic PAYE calculation
      await page.fill("[data-testid=basic-salary]", "180000");
      await page.fill("[data-testid=overtime]", "20000");
      await page.fill("[data-testid=dependents]", "1");

      await page.click("[data-testid=calculate-button]");

      // Verify calculation results displayed
      await expect(
        page.locator("[data-testid=calculation-results]")
      ).toBeVisible();
      await expect(page.locator("[data-testid=gross-earnings]")).toContainText(
        "200,000"
      );

      // Should NOT have approval buttons (only managers can approve)
      await expect(
        page.locator("[data-testid=approve-calculation-button]")
      ).not.toBeVisible();
      await expect(
        page.locator("[data-testid=reject-calculation-button]")
      ).not.toBeVisible();

      // Save calculation for manager review
      await page.click("[data-testid=save-for-review-button]");
      await page.fill(
        "[data-testid=staff-notes]",
        "Calculation completed, awaiting manager approval"
      );
      await page.click("[data-testid=submit-for-review-button]");

      await expect(
        page.locator("[data-testid=submitted-notification]")
      ).toBeVisible();
    });

    test("should upload documents but have restricted document access", async ({
      page,
    }) => {
      await authenticateUser(page, "TAX_STAFF");

      await page.click("[data-testid=navigation-documents]");
      await expect(page).toHaveURL(/\/documents/);

      // Should be able to upload documents
      await expect(
        page.locator("[data-testid=upload-document-button]")
      ).toBeVisible();

      // Upload a test document
      await page.click("[data-testid=upload-document-button]");

      // Fill document metadata
      await page.fill(
        "[data-testid=document-name]",
        "Staff Uploaded Tax Document"
      );
      await page.selectOption("[data-testid=document-type]", "TAX_RETURN");
      await page.selectOption(
        "[data-testid=document-category]",
        "TAX_DOCUMENTS"
      );
      await page.fill(
        "[data-testid=document-description]",
        "Tax document uploaded by staff"
      );

      // Simulate file upload (would normally be a real file)
      await page.setInputFiles("[data-testid=file-input]", {
        name: "test-document.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("Mock PDF content"),
      });

      await page.click("[data-testid=upload-button]");

      // Verify upload success
      await expect(page.locator("[data-testid=upload-success]")).toBeVisible();

      // Should see document in list but with limited actions
      await expect(page.locator("[data-testid=documents-table]")).toContainText(
        "Staff Uploaded Tax Document"
      );

      // Should NOT have delete or advanced management options
      const documentRow = page.locator("[data-testid=document-row]").first();
      await expect(
        documentRow.locator("[data-testid=delete-document-button]")
      ).not.toBeVisible();
      await expect(
        documentRow.locator("[data-testid=archive-document-button]")
      ).not.toBeVisible();

      // Should be able to view and download
      await expect(
        documentRow.locator("[data-testid=view-document-button]")
      ).toBeVisible();
      await expect(
        documentRow.locator("[data-testid=download-document-button]")
      ).toBeVisible();
    });
  });

  test.describe("Client Portal Access", () => {
    test("should access limited portal functionality", async ({ page }) => {
      await authenticateUser(page, "CLIENT");

      // Client should see portal-specific interface
      await expect(page).toHaveURL(/\/portal/);

      // Should have limited navigation
      await expect(
        page.locator("[data-testid=portal-dashboard]")
      ).toBeVisible();
      await expect(
        page.locator("[data-testid=portal-documents]")
      ).toBeVisible();
      await expect(
        page.locator("[data-testid=portal-appointments]")
      ).toBeVisible();

      // Should NOT see admin areas
      await expect(
        page.locator("[data-testid=navigation-users]")
      ).not.toBeVisible();
      await expect(
        page.locator("[data-testid=navigation-settings]")
      ).not.toBeVisible();
      await expect(
        page.locator("[data-testid=navigation-reports]")
      ).not.toBeVisible();

      // View own documents only
      await page.click("[data-testid=portal-documents]");

      const documentsTable = page.locator(
        "[data-testid=client-documents-table]"
      );
      await expect(documentsTable).toBeVisible();

      // Should only see own documents, not all client documents
      const documentCount = await page
        .locator("[data-testid=document-row]")
        .count();

      if (documentCount > 0) {
        // All documents should belong to the authenticated client
        const firstDoc = page.locator("[data-testid=document-row]").first();
        await expect(firstDoc).toContainText("Your Document"); // Client-specific labeling
      }

      // Book appointment
      await page.click("[data-testid=portal-appointments]");
      await page.click("[data-testid=book-appointment-button]");

      await page.selectOption(
        "[data-testid=appointment-type]",
        "TAX_CONSULTATION"
      );
      await page.fill("[data-testid=appointment-date]", "2024-12-15");
      await page.fill("[data-testid=appointment-time]", "10:00");
      await page.fill(
        "[data-testid=appointment-notes]",
        "Need help with tax planning for 2024"
      );

      await page.click("[data-testid=submit-appointment-button]");

      await expect(
        page.locator("[data-testid=appointment-success]")
      ).toBeVisible();
      await expect(
        page.locator("[data-testid=appointments-table]")
      ).toContainText("TAX_CONSULTATION");
    });
  });

  test.describe("Cross-Role Collaboration Workflows", () => {
    test("should demonstrate complete workflow from staff to manager to client", async ({
      browser,
    }) => {
      // Create multiple browser contexts for different users
      const staffContext = await browser.newContext();
      const managerContext = await browser.newContext();
      const clientContext = await browser.newContext();

      const staffPage = await staffContext.newPage();
      const managerPage = await managerContext.newPage();
      const clientPage = await clientContext.newPage();

      try {
        // Step 1: Staff performs initial tax calculation
        await authenticateUser(staffPage, "TAX_STAFF");

        const testClient = await createTestClient(staffPage, {
          firstName: "Workflow",
          lastName: "Client",
          email: `workflow-client-${createId()}@test.com`,
        });

        // Staff calculates tax
        await staffPage.click("[data-testid=navigation-tax]");
        await staffPage.selectOption(
          "[data-testid=client-select]",
          testClient.email
        );
        await staffPage.fill("[data-testid=basic-salary]", "250000");
        await staffPage.fill("[data-testid=overtime]", "30000");
        await staffPage.fill("[data-testid=dependents]", "2");
        await staffPage.click("[data-testid=calculate-button]");

        // Submit for review
        await staffPage.click("[data-testid=save-for-review-button]");
        await staffPage.fill(
          "[data-testid=staff-notes]",
          "Initial calculation completed by staff"
        );
        await staffPage.click("[data-testid=submit-for-review-button]");

        const calculationId = await staffPage
          .locator("[data-testid=calculation-id]")
          .textContent();

        // Step 2: Manager reviews and approves
        await authenticateUser(managerPage, "TAX_MANAGER");

        await managerPage.click("[data-testid=navigation-tax]");
        await managerPage.click("[data-testid=pending-reviews-tab]");

        // Find the submitted calculation
        const calculationRow = managerPage.locator(
          `[data-testid=calculation-${calculationId}]`
        );
        await expect(calculationRow).toBeVisible();

        await calculationRow.click("[data-testid=review-button]");

        // Review calculation details
        await expect(
          managerPage.locator("[data-testid=staff-notes]")
        ).toContainText("Initial calculation completed by staff");

        // Approve with manager notes
        await managerPage.click("[data-testid=approve-button]");
        await managerPage.fill(
          "[data-testid=manager-notes]",
          "Calculation reviewed and approved by manager"
        );
        await managerPage.click("[data-testid=confirm-approval-button]");

        await expect(
          managerPage.locator("[data-testid=approval-success]")
        ).toBeVisible();

        // Step 3: Generate and share document with client
        await managerPage.click("[data-testid=generate-tax-statement-button]");
        await managerPage.click("[data-testid=share-with-client-button]");
        await managerPage.check("[data-testid=notify-client-email]");
        await managerPage.click("[data-testid=send-to-client-button]");

        // Step 4: Client accesses document
        await authenticateUser(clientPage, "CLIENT");

        // Client should see notification about new document
        await expect(
          clientPage.locator("[data-testid=new-document-notification]")
        ).toBeVisible();

        await clientPage.click("[data-testid=portal-documents]");

        // Find the tax statement
        await expect(
          clientPage.locator("[data-testid=client-documents-table]")
        ).toContainText("Tax Statement");

        const taxStatement = clientPage.locator(
          "[data-testid=document-tax-statement]"
        );
        await taxStatement.click("[data-testid=view-document-button]");

        // Verify client can see their tax calculation results
        await expect(
          clientPage.locator("[data-testid=tax-results]")
        ).toBeVisible();
        await expect(
          clientPage.locator("[data-testid=gross-earnings]")
        ).toContainText("280,000");

        // Client acknowledges receipt
        await clientPage.click("[data-testid=acknowledge-document-button]");
        await expect(
          clientPage.locator("[data-testid=acknowledgment-success]")
        ).toBeVisible();
      } finally {
        // Clean up contexts
        await staffContext.close();
        await managerContext.close();
        await clientContext.close();
      }
    });

    test("should handle permission escalation requests", async ({
      browser,
    }) => {
      const staffContext = await browser.newContext();
      const managerContext = await browser.newContext();

      const staffPage = await staffContext.newPage();
      const managerPage = await managerContext.newPage();

      try {
        // Staff attempts restricted action
        await authenticateUser(staffPage, "TAX_STAFF");
        await staffPage.click("[data-testid=navigation-clients]");

        // Try to access client financial details (restricted)
        const clientRow = staffPage.locator("[data-testid=client-row]").first();
        await clientRow.click("[data-testid=view-client-button]");

        // Should see permission request option for sensitive data
        await expect(
          staffPage.locator("[data-testid=sensitive-data-blocked]")
        ).toBeVisible();
        await staffPage.click("[data-testid=request-access-button]");

        await staffPage.fill(
          "[data-testid=access-justification]",
          "Need access to complete tax calculation review"
        );
        await staffPage.selectOption("[data-testid=urgency-level]", "MEDIUM");
        await staffPage.click("[data-testid=submit-request-button]");

        await expect(
          staffPage.locator("[data-testid=request-submitted]")
        ).toBeVisible();

        // Manager receives and processes request
        await authenticateUser(managerPage, "TAX_MANAGER");

        // Should see pending access request notification
        await expect(
          managerPage.locator("[data-testid=pending-access-requests]")
        ).toBeVisible();

        await managerPage.click("[data-testid=access-requests-panel]");

        const accessRequest = managerPage
          .locator("[data-testid=access-request]")
          .first();
        await expect(accessRequest).toContainText(
          "Need access to complete tax calculation review"
        );

        // Approve temporary access
        await accessRequest.click("[data-testid=approve-access-button]");
        await managerPage.selectOption(
          "[data-testid=access-duration]",
          "4_HOURS"
        );
        await managerPage.fill(
          "[data-testid=approval-notes]",
          "Temporary access granted for calculation completion"
        );
        await managerPage.click("[data-testid=confirm-access-button]");

        // Verify staff now has temporary access
        await staffPage.reload();
        await expect(
          staffPage.locator("[data-testid=temporary-access-indicator]")
        ).toBeVisible();
        await expect(
          staffPage.locator("[data-testid=sensitive-data-blocked]")
        ).not.toBeVisible();

        // Staff should now see client financial information
        await expect(
          staffPage.locator("[data-testid=client-financial-details]")
        ).toBeVisible();
      } finally {
        await staffContext.close();
        await managerContext.close();
      }
    });
  });

  test.describe("Role-Based UI Adaptations", () => {
    test("should adapt interface based on user permissions", async ({
      page,
    }) => {
      const roles = [
        "SUPER_ADMIN",
        "TAX_MANAGER",
        "TAX_STAFF",
        "CLIENT",
      ] as const;

      for (const role of roles) {
        await authenticateUser(page, role);

        // Take screenshot for visual regression testing
        await page.screenshot({
          path: `test-results/ui-role-${role.toLowerCase()}.png`,
          fullPage: true,
        });

        // Verify role-specific UI elements
        switch (role) {
          case "SUPER_ADMIN":
            await expect(
              page.locator("[data-testid=admin-dashboard]")
            ).toBeVisible();
            await expect(
              page.locator("[data-testid=system-health-widget]")
            ).toBeVisible();
            await expect(
              page.locator("[data-testid=user-management-widget]")
            ).toBeVisible();
            break;

          case "TAX_MANAGER":
            await expect(
              page.locator("[data-testid=manager-dashboard]")
            ).toBeVisible();
            await expect(
              page.locator("[data-testid=pending-approvals-widget]")
            ).toBeVisible();
            await expect(
              page.locator("[data-testid=team-performance-widget]")
            ).toBeVisible();
            break;

          case "TAX_STAFF":
            await expect(
              page.locator("[data-testid=staff-dashboard]")
            ).toBeVisible();
            await expect(
              page.locator("[data-testid=daily-tasks-widget]")
            ).toBeVisible();
            await expect(
              page.locator("[data-testid=quick-calculation-widget]")
            ).toBeVisible();
            break;

          case "CLIENT":
            await expect(
              page.locator("[data-testid=client-portal]")
            ).toBeVisible();
            await expect(
              page.locator("[data-testid=client-documents-widget]")
            ).toBeVisible();
            await expect(
              page.locator("[data-testid=appointment-booking-widget]")
            ).toBeVisible();
            break;
        }

        // Logout for next iteration
        await page.click("[data-testid=user-menu]");
        await page.click("[data-testid=logout-button]");
        await expect(page).toHaveURL(/\/login/);
      }
    });

    test("should handle dynamic permission changes", async ({
      page,
      browser,
    }) => {
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();

      try {
        // Start as staff user
        await authenticateUser(page, "TAX_STAFF");

        // Verify current permissions
        await page.click("[data-testid=navigation-clients]");
        await expect(
          page.locator("[data-testid=add-client-button]")
        ).not.toBeVisible();

        // Admin promotes staff to manager in parallel session
        await authenticateUser(adminPage, "SUPER_ADMIN");
        await adminPage.click("[data-testid=navigation-users]");

        const staffUserRow = adminPage.locator(
          `[data-testid=user-row-${USER_ROLES.TAX_STAFF.email}]`
        );
        await staffUserRow.click("[data-testid=edit-user-button]");
        await adminPage.selectOption(
          "[data-testid=user-role-select]",
          "TAX_MANAGER"
        );
        await adminPage.click("[data-testid=save-user-button]");

        // Staff user should receive real-time permission update
        await page.reload(); // In real app, this would be via WebSocket/SSE

        // Wait for permission update to propagate
        await page.waitForTimeout(2000);

        // Staff user should now have manager permissions
        await expect(
          page.locator("[data-testid=add-client-button]")
        ).toBeVisible();
        await expect(page.locator("[data-testid=user-role]")).toContainText(
          "TAX_MANAGER"
        );

        // Verify access to manager features
        await page.click("[data-testid=navigation-reports]");
        await expect(
          page.locator("[data-testid=reports-dashboard]")
        ).toBeVisible();
      } finally {
        await adminContext.close();
      }
    });
  });
});
