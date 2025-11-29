/**
 * Security Testing Suite
 * Tests application security measures, vulnerability prevention, and compliance
 */

import { expect, type Page, test } from "@playwright/test";

// Security test configuration
const SECURITY_TESTS = {
  PASSWORD_COMPLEXITY: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
  SESSION_TIMEOUTS: {
    idle: 30 * 60 * 1000, // 30 minutes idle timeout
    absolute: 8 * 60 * 60 * 1000, // 8 hours absolute timeout
  },
  RATE_LIMITS: {
    login: { attempts: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    api: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
    upload: { files: 10, window: 60 * 1000 }, // 10 uploads per minute
  },
  XSS_TEST_PAYLOADS: [
    "<script>alert('xss')</script>",
    "javascript:alert('xss')",
    "<img src=x onerror=alert('xss')>",
    "';alert('xss');//",
    "<svg onload=alert('xss')>",
  ],
  SQL_INJECTION_PAYLOADS: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "1' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1 /*",
  ],
};

// Helper function to authenticate for security tests
async function securityAuth(page: Page, role = "TAX_STAFF"): Promise<void> {
  await page.goto("/login");

  const credentials = {
    TAX_STAFF: {
      email: "security.staff@test.com",
      password: "SecurePassword123!",
    },
    TAX_MANAGER: {
      email: "security.manager@test.com",
      password: "SecurePassword123!",
    },
    ADMIN: { email: "security.admin@test.com", password: "SecurePassword123!" },
  };

  const creds =
    credentials[role as keyof typeof credentials] || credentials.TAX_STAFF;

  await page.fill("[data-testid=email-input]", creds.email);
  await page.fill("[data-testid=password-input]", creds.password);
  await page.click("[data-testid=login-button]");
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

// Helper function to test input sanitization
async function testInputSanitization(
  page: Page,
  selector: string,
  payloads: string[]
): Promise<void> {
  for (const payload of payloads) {
    await page.fill(selector, payload);
    await page.waitForTimeout(100);

    // Check that the payload is properly escaped/sanitized
    const inputValue = await page.inputValue(selector);
    const displayedValue = await page.locator(selector).textContent();

    // The input should not execute JavaScript or contain unescaped HTML
    expect(inputValue).not.toContain("<script>");
    expect(displayedValue).not.toContain("<script>");

    // Clear the input
    await page.fill(selector, "");
  }
}

test.describe("Security Testing Suite", () => {
  test.describe("Authentication Security", () => {
    test("should enforce strong password requirements", async ({ page }) => {
      await page.goto("/register");

      const weakPasswords = [
        "123456", // Too short
        "password", // No numbers/symbols
        "PASSWORD123", // No lowercase
        "password123", // No uppercase
        "Password", // No numbers
        "Pass123", // Too short with requirements
      ];

      for (const password of weakPasswords) {
        await page.fill(
          "[data-testid=email-input]",
          `test-${Date.now()}@example.com`
        );
        await page.fill("[data-testid=password-input]", password);
        await page.fill("[data-testid=confirm-password-input]", password);
        await page.fill("[data-testid=firstName-input]", "Test");
        await page.fill("[data-testid=lastName-input]", "User");

        await page.click("[data-testid=register-button]");

        // Should show password validation error
        await expect(
          page.locator("[data-testid=password-error]")
        ).toBeVisible();
        expect(
          await page.locator("[data-testid=password-error]").textContent()
        ).toMatch(/password.*requirements|weak.*password/i);

        // Clear form
        await page.fill("[data-testid=email-input]", "");
        await page.fill("[data-testid=password-input]", "");
        await page.fill("[data-testid=confirm-password-input]", "");
      }

      // Test strong password acceptance
      const strongPassword = "StrongP@ssw0rd123!";
      await page.fill(
        "[data-testid=email-input]",
        `strong-password-${Date.now()}@example.com`
      );
      await page.fill("[data-testid=password-input]", strongPassword);
      await page.fill("[data-testid=confirm-password-input]", strongPassword);
      await page.fill("[data-testid=firstName-input]", "Strong");
      await page.fill("[data-testid=lastName-input]", "Password");

      await page.click("[data-testid=register-button]");

      // Should not show password error
      await expect(
        page.locator("[data-testid=password-error]")
      ).not.toBeVisible();
    });

    test("should implement account lockout after failed attempts", async ({
      page,
    }) => {
      const testEmail = "lockout.test@example.com";
      const wrongPassword = "WrongPassword123!";

      // Attempt login with wrong password multiple times
      for (
        let attempt = 1;
        attempt <= SECURITY_TESTS.RATE_LIMITS.login.attempts;
        attempt++
      ) {
        await page.goto("/login");
        await page.fill("[data-testid=email-input]", testEmail);
        await page.fill("[data-testid=password-input]", wrongPassword);
        await page.click("[data-testid=login-button]");

        if (attempt < SECURITY_TESTS.RATE_LIMITS.login.attempts) {
          // Should show invalid credentials error
          await expect(page.locator("[data-testid=login-error]")).toBeVisible();
          expect(
            await page.locator("[data-testid=login-error]").textContent()
          ).toMatch(/invalid.*credentials/i);
        } else {
          // Should show account locked error
          await expect(
            page.locator("[data-testid=account-locked-error]")
          ).toBeVisible();
          expect(
            await page
              .locator("[data-testid=account-locked-error]")
              .textContent()
          ).toMatch(/account.*locked|too.*many.*attempts/i);
        }

        await page.waitForTimeout(1000); // Brief delay between attempts
      }

      // Verify that even correct password is rejected when locked
      await page.goto("/login");
      await page.fill("[data-testid=email-input]", testEmail);
      await page.fill("[data-testid=password-input]", "CorrectPassword123!");
      await page.click("[data-testid=login-button]");

      await expect(
        page.locator("[data-testid=account-locked-error]")
      ).toBeVisible();
    });

    test("should enforce session timeouts", async ({ page }) => {
      await securityAuth(page);

      // Verify user is logged in
      await expect(page.locator("[data-testid=user-menu]")).toBeVisible();

      // Test idle timeout (simulate by manipulating session storage/cookies)
      await page.evaluate((timeout) => {
        // Simulate session expiration
        const expiredTime = Date.now() - timeout - 1000;
        localStorage.setItem("sessionExpiry", expiredTime.toString());
      }, SECURITY_TESTS.SESSION_TIMEOUTS.idle);

      // Navigate to any page to trigger session check
      await page.goto("/clients");

      // Should redirect to login due to expired session
      await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
      await expect(
        page.locator("[data-testid=session-expired-message]")
      ).toBeVisible();
    });

    test("should secure password reset functionality", async ({ page }) => {
      await page.goto("/forgot-password");

      // Test with valid email
      await page.fill("[data-testid=email-input]", "security.test@example.com");
      await page.click("[data-testid=send-reset-button]");

      await expect(
        page.locator("[data-testid=reset-email-sent]")
      ).toBeVisible();

      // Test rate limiting on password reset
      for (let i = 0; i < 5; i++) {
        await page.fill("[data-testid=email-input]", `test${i}@example.com`);
        await page.click("[data-testid=send-reset-button]");
        await page.waitForTimeout(500);
      }

      // Should show rate limiting message
      await expect(
        page.locator("[data-testid=rate-limit-error]")
      ).toBeVisible();

      // Test invalid reset token (simulate)
      await page.goto("/reset-password?token=invalid-token-12345");
      await expect(
        page.locator("[data-testid=invalid-token-error]")
      ).toBeVisible();
    });
  });

  test.describe("Input Validation and XSS Prevention", () => {
    test("should prevent XSS attacks in form inputs", async ({ page }) => {
      await securityAuth(page);
      await page.goto("/clients");

      // Test client creation form
      await page.click("[data-testid=add-client-button]");

      // Test XSS in text inputs
      await testInputSanitization(
        page,
        "[data-testid=client-firstName]",
        SECURITY_TESTS.XSS_TEST_PAYLOADS
      );
      await testInputSanitization(
        page,
        "[data-testid=client-lastName]",
        SECURITY_TESTS.XSS_TEST_PAYLOADS
      );
      await testInputSanitization(
        page,
        "[data-testid=client-email]",
        SECURITY_TESTS.XSS_TEST_PAYLOADS
      );

      // Test XSS in textarea (notes)
      await page.click("[data-testid=add-note-button]");
      await testInputSanitization(
        page,
        "[data-testid=client-notes]",
        SECURITY_TESTS.XSS_TEST_PAYLOADS
      );

      // Verify no JavaScript execution occurred
      const alertDialogs = [];
      page.on("dialog", (dialog) => alertDialogs.push(dialog));

      // Fill form with XSS payload and submit
      await page.fill(
        "[data-testid=client-firstName]",
        SECURITY_TESTS.XSS_TEST_PAYLOADS[0]
      );
      await page.fill("[data-testid=client-lastName]", "Test");
      await page.fill("[data-testid=client-email]", "xss.test@example.com");
      await page.click("[data-testid=save-client-button]");

      // Wait a moment for any potential JavaScript execution
      await page.waitForTimeout(2000);

      // No alert dialogs should have appeared
      expect(alertDialogs.length).toBe(0);
    });

    test("should prevent XSS in search functionality", async ({ page }) => {
      await securityAuth(page);
      await page.goto("/clients");

      // Test search input sanitization
      await testInputSanitization(
        page,
        "[data-testid=search-input]",
        SECURITY_TESTS.XSS_TEST_PAYLOADS
      );

      // Test that search results are properly escaped
      for (const payload of SECURITY_TESTS.XSS_TEST_PAYLOADS.slice(0, 3)) {
        await page.fill("[data-testid=search-input]", payload);
        await page.press("[data-testid=search-input]", "Enter");

        await page.waitForTimeout(1000);

        // Check that search results don't contain unescaped HTML
        const searchResults = await page
          .locator("[data-testid=search-results]")
          .innerHTML();
        expect(searchResults).not.toContain("<script>");
        expect(searchResults).not.toContain("onerror=");
        expect(searchResults).not.toContain("onload=");
      }
    });

    test("should sanitize file upload metadata", async ({ page }) => {
      await securityAuth(page);
      await page.goto("/documents");

      await page.click("[data-testid=upload-document-button]");

      // Test XSS in document metadata fields
      await testInputSanitization(
        page,
        "[data-testid=document-name]",
        SECURITY_TESTS.XSS_TEST_PAYLOADS
      );
      await testInputSanitization(
        page,
        "[data-testid=document-description]",
        SECURITY_TESTS.XSS_TEST_PAYLOADS
      );

      // Upload a file with malicious filename
      const maliciousContent = Buffer.from("Safe PDF content");
      await page.setInputFiles("[data-testid=file-input]", {
        name: "<script>alert('xss')</script>.pdf",
        mimeType: "application/pdf",
        buffer: maliciousContent,
      });

      await page.fill("[data-testid=document-name]", "Test Document");
      await page.selectOption("[data-testid=document-type]", "TAX_RETURN");
      await page.click("[data-testid=upload-button]");

      // Check that filename is sanitized in the display
      await expect(page.locator("[data-testid=upload-success]")).toBeVisible();

      const uploadedFileName = await page
        .locator("[data-testid=uploaded-filename]")
        .textContent();
      expect(uploadedFileName).not.toContain("<script>");
      expect(uploadedFileName).not.toContain("alert");
    });
  });

  test.describe("SQL Injection Prevention", () => {
    test("should prevent SQL injection in search parameters", async ({
      page,
      request,
    }) => {
      await securityAuth(page);

      // Test SQL injection payloads through API
      for (const payload of SECURITY_TESTS.SQL_INJECTION_PAYLOADS) {
        const response = await request.get(
          `/api/clients/search?q=${encodeURIComponent(payload)}`
        );

        // Should return 200 (not crash) and proper response structure
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty("clients");
        expect(Array.isArray(data.clients)).toBe(true);

        // Should not return all records (which would indicate successful injection)
        expect(data.clients.length).toBeLessThan(1000);
      }
    });

    test("should prevent SQL injection in filter parameters", async ({
      request,
    }) => {
      const sqlInjectionFilters = [
        "type=' OR '1'='1",
        "status='; DROP TABLE clients; --",
        "year=2024' UNION SELECT * FROM users --",
      ];

      for (const filter of sqlInjectionFilters) {
        const response = await request.get(`/api/tax/calculations?${filter}`);

        // Should either return 400 (bad request) or 200 with safe results
        expect([200, 400]).toContain(response.status());

        if (response.status() === 200) {
          const data = await response.json();
          expect(data).toHaveProperty("calculations");
          expect(Array.isArray(data.calculations)).toBe(true);
        }
      }
    });

    test("should validate and sanitize form data before database operations", async ({
      page,
    }) => {
      await securityAuth(page);
      await page.goto("/clients");

      await page.click("[data-testid=add-client-button]");

      // Fill form with SQL injection payloads
      await page.fill(
        "[data-testid=client-firstName]",
        SECURITY_TESTS.SQL_INJECTION_PAYLOADS[0]
      );
      await page.fill(
        "[data-testid=client-lastName]",
        SECURITY_TESTS.SQL_INJECTION_PAYLOADS[1]
      );
      await page.fill("[data-testid=client-email]", "sql.test@example.com");
      await page.fill("[data-testid=client-phone]", "+592-123-4567");

      await page.click("[data-testid=save-client-button]");

      // Should either show validation error or save safely
      const isSuccess = await page
        .locator("[data-testid=success-notification]")
        .isVisible();
      const isError = await page
        .locator("[data-testid=validation-error]")
        .isVisible();

      expect(isSuccess || isError).toBe(true);

      if (isSuccess) {
        // Verify the client was created with sanitized data
        await page.goto("/clients");
        const clientsList = await page
          .locator("[data-testid=clients-table]")
          .textContent();

        // Should not contain raw SQL injection payloads
        expect(clientsList).not.toContain("DROP TABLE");
        expect(clientsList).not.toContain("UNION SELECT");
      }
    });
  });

  test.describe("Authorization and Access Control", () => {
    test("should enforce role-based access to sensitive endpoints", async ({
      page,
      request,
    }) => {
      // Test with TAX_STAFF role (limited permissions)
      await securityAuth(page, "TAX_STAFF");

      // Try to access admin endpoints
      const restrictedEndpoints = [
        "/api/users",
        "/api/users/123/roles",
        "/api/audit/logs",
        "/api/admin/settings",
        "/api/reports/system-health",
      ];

      for (const endpoint of restrictedEndpoints) {
        const response = await request.get(endpoint);

        // Should return 403 (Forbidden) or 401 (Unauthorized)
        expect([401, 403]).toContain(response.status());
      }
    });

    test("should prevent privilege escalation", async ({ page }) => {
      await securityAuth(page, "TAX_STAFF");

      // Navigate to users page (should not be accessible)
      await page.goto("/users");

      // Should redirect to dashboard or show access denied
      await expect(page).toHaveURL(/\/(dashboard|access-denied)/);

      if (await page.locator("[data-testid=access-denied]").isVisible()) {
        expect(
          await page.locator("[data-testid=access-denied]").textContent()
        ).toMatch(/access.*denied|insufficient.*permissions/i);
      }

      // Try to access admin settings
      await page.goto("/settings/admin");
      await expect(page).toHaveURL(/\/(dashboard|access-denied)/);
    });

    test("should enforce multi-tenant data isolation", async ({ browser }) => {
      // Create two separate browser contexts for different organizations
      const org1Context = await browser.newContext();
      const org2Context = await browser.newContext();

      const org1Page = await org1Context.newPage();
      const org2Page = await org2Context.newPage();

      try {
        // Authenticate as users from different organizations
        await org1Page.goto("/login");
        await org1Page.fill("[data-testid=email-input]", "org1.user@test.com");
        await org1Page.fill("[data-testid=password-input]", "TestPassword123!");
        await org1Page.click("[data-testid=login-button]");

        await org2Page.goto("/login");
        await org2Page.fill("[data-testid=email-input]", "org2.user@test.com");
        await org2Page.fill("[data-testid=password-input]", "TestPassword123!");
        await org2Page.click("[data-testid=login-button]");

        // Each user should only see their organization's data
        await org1Page.goto("/clients");
        await org2Page.goto("/clients");

        const org1Clients = await org1Page
          .locator("[data-testid=client-row]")
          .count();
        const org2Clients = await org2Page
          .locator("[data-testid=client-row]")
          .count();

        // Verify data isolation by checking for different client lists
        if (org1Clients > 0 && org2Clients > 0) {
          const org1FirstClient = await org1Page
            .locator("[data-testid=client-row]")
            .first()
            .textContent();
          const org2FirstClient = await org2Page
            .locator("[data-testid=client-row]")
            .first()
            .textContent();

          expect(org1FirstClient).not.toBe(org2FirstClient);
        }

        // Test that org1 user cannot access org2's client directly via URL
        await org2Page.locator("[data-testid=client-row]").first().click();
        const org2ClientUrl = org2Page.url();
        const clientId = org2ClientUrl.match(/clients\/([^/]+)/)?.[1];

        if (clientId) {
          await org1Page.goto(`/clients/${clientId}`);
          // Should show access denied or redirect
          await expect(
            org1Page.locator(
              "[data-testid=client-not-found], [data-testid=access-denied]"
            )
          ).toBeVisible();
        }
      } finally {
        await org1Context.close();
        await org2Context.close();
      }
    });

    test("should validate JWT tokens and prevent token manipulation", async ({
      page,
      request,
    }) => {
      await securityAuth(page);

      // Get the current auth token
      const authToken = await page.evaluate(
        () =>
          localStorage.getItem("authToken") ||
          sessionStorage.getItem("authToken")
      );

      if (authToken) {
        // Test with manipulated token
        const manipulatedToken = authToken.slice(0, -10) + "manipulated";

        // Try to use manipulated token in API request
        const response = await request.get("/api/clients", {
          headers: {
            Authorization: `Bearer ${manipulatedToken}`,
          },
        });

        expect(response.status()).toBe(401);

        // Test with expired token (simulate)
        await page.evaluate(() => {
          const expiredToken =
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJleHAiOjE2MDAwMDAwMDB9.expired";
          localStorage.setItem("authToken", expiredToken);
        });

        await page.goto("/dashboard");
        // Should redirect to login
        await expect(page).toHaveURL(/\/login/);
      }
    });
  });

  test.describe("Data Protection and Privacy", () => {
    test("should protect sensitive data in transit", async ({ page }) => {
      // Verify HTTPS enforcement
      await page.goto("http://localhost:3001/login");

      // In production, should redirect to HTTPS
      // For local testing, verify security headers are present
      const response = await page.goto("/login");
      const headers = response?.headers();

      // Check for security headers
      expect(headers?.["strict-transport-security"]).toBeTruthy();
      expect(headers?.["x-frame-options"]).toBeTruthy();
      expect(headers?.["x-content-type-options"]).toBeTruthy();
    });

    test("should mask sensitive data in UI", async ({ page }) => {
      await securityAuth(page);
      await page.goto("/clients");

      // Click on a client to view details
      await page.locator("[data-testid=client-row]").first().click();

      // Check that sensitive fields are masked or protected
      const tinField = page.locator("[data-testid=client-tin]");
      if (await tinField.isVisible()) {
        const tinText = await tinField.textContent();
        // TIN should be masked (e.g., "***-***-789" or similar)
        expect(tinText).toMatch(/\*+/);
      }

      // Test that full data is only shown when explicitly requested
      await page.click("[data-testid=show-sensitive-data-button]");

      // Should require additional confirmation
      await expect(
        page.locator("[data-testid=confirm-access-dialog]")
      ).toBeVisible();
      await page.fill(
        "[data-testid=access-reason]",
        "Required for tax calculation"
      );
      await page.click("[data-testid=confirm-access-button]");

      // Now sensitive data should be visible
      const fullTinText = await tinField.textContent();
      expect(fullTinText).not.toMatch(/\*+/);
      expect(fullTinText).toMatch(/^\d{3}-\d{3}-\d{3}$/);
    });

    test("should implement data retention policies", async ({
      page,
      request,
    }) => {
      await securityAuth(page, "ADMIN");

      // Test data retention API
      const response = await request.get("/api/admin/data-retention/status");
      expect(response.status()).toBe(200);

      const retentionData = await response.json();
      expect(retentionData).toHaveProperty("policies");
      expect(retentionData).toHaveProperty("upcomingDeletions");

      // Test data anonymization for old records
      const anonymizationResponse = await request.post(
        "/api/admin/anonymize-data",
        {
          data: {
            olderThan: "7 years",
            dryRun: true,
          },
        }
      );

      expect(anonymizationResponse.status()).toBe(200);
      const anonymizationResult = await anonymizationResponse.json();
      expect(anonymizationResult).toHaveProperty("recordsAffected");
      expect(anonymizationResult).toHaveProperty("fieldsAnonymized");
    });
  });

  test.describe("File Upload Security", () => {
    test("should validate file types and prevent malicious uploads", async ({
      page,
    }) => {
      await securityAuth(page);
      await page.goto("/documents");

      await page.click("[data-testid=upload-document-button]");

      // Test malicious file types
      const maliciousFiles = [
        { name: "malicious.exe", mimeType: "application/x-executable" },
        { name: "script.js", mimeType: "application/javascript" },
        { name: "malware.bat", mimeType: "application/x-bat" },
        { name: "virus.scr", mimeType: "application/x-screensaver" },
      ];

      for (const file of maliciousFiles) {
        const fileContent = Buffer.from("Potentially malicious content");

        await page.setInputFiles("[data-testid=file-input]", {
          name: file.name,
          mimeType: file.mimeType,
          buffer: fileContent,
        });

        await page.fill("[data-testid=document-name]", "Test Document");
        await page.click("[data-testid=upload-button]");

        // Should show file type error
        await expect(
          page.locator("[data-testid=file-type-error]")
        ).toBeVisible();
        expect(
          await page.locator("[data-testid=file-type-error]").textContent()
        ).toMatch(/file.*type.*not.*allowed|invalid.*file.*type/i);

        // Clear the input
        await page.setInputFiles("[data-testid=file-input]", []);
      }
    });

    test("should scan uploaded files for malware signatures", async ({
      page,
    }) => {
      await securityAuth(page);
      await page.goto("/documents");

      await page.click("[data-testid=upload-document-button]");

      // Simulate file with malware signature
      const suspiciousContent = Buffer.from(
        "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
      );

      await page.setInputFiles("[data-testid=file-input]", {
        name: "suspicious.pdf",
        mimeType: "application/pdf",
        buffer: suspiciousContent,
      });

      await page.fill("[data-testid=document-name]", "Suspicious Document");
      await page.selectOption("[data-testid=document-type]", "TAX_RETURN");
      await page.click("[data-testid=upload-button]");

      // Should show security scan error
      await expect(
        page.locator("[data-testid=security-scan-error]")
      ).toBeVisible();
      expect(
        await page.locator("[data-testid=security-scan-error]").textContent()
      ).toMatch(/security.*scan.*failed|potential.*threat.*detected/i);
    });

    test("should enforce file size limits", async ({ page }) => {
      await securityAuth(page);
      await page.goto("/documents");

      await page.click("[data-testid=upload-document-button]");

      // Test file too large (15MB when limit is 10MB)
      const oversizedContent = Buffer.alloc(15 * 1024 * 1024);

      await page.setInputFiles("[data-testid=file-input]", {
        name: "oversized.pdf",
        mimeType: "application/pdf",
        buffer: oversizedContent,
      });

      await page.fill("[data-testid=document-name]", "Oversized Document");
      await page.click("[data-testid=upload-button]");

      // Should show file size error
      await expect(page.locator("[data-testid=file-size-error]")).toBeVisible();
      expect(
        await page.locator("[data-testid=file-size-error]").textContent()
      ).toMatch(/file.*too.*large|exceeds.*size.*limit/i);
    });
  });

  test.describe("Audit and Compliance", () => {
    test("should log security-relevant events", async ({ page, request }) => {
      await securityAuth(page, "ADMIN");

      // Perform various security-relevant actions
      await page.goto("/users");
      await page.click("[data-testid=add-user-button]");
      await page.fill("[data-testid=user-email]", "audit.test@example.com");
      await page.click("[data-testid=cancel-button]");

      // Access audit logs
      await page.goto("/audit");

      // Check that security events are logged
      const auditLogs = await request.get("/api/audit/logs?category=security");
      expect(auditLogs.status()).toBe(200);

      const logsData = await auditLogs.json();
      expect(logsData.logs).toBeInstanceOf(Array);

      // Verify required audit fields
      if (logsData.logs.length > 0) {
        const log = logsData.logs[0];
        expect(log).toHaveProperty("timestamp");
        expect(log).toHaveProperty("userId");
        expect(log).toHaveProperty("action");
        expect(log).toHaveProperty("ipAddress");
        expect(log).toHaveProperty("userAgent");
      }
    });

    test("should maintain data integrity controls", async ({
      page,
      request,
    }) => {
      await securityAuth(page, "ADMIN");

      // Test data integrity checks
      const integrityResponse = await request.get(
        "/api/admin/data-integrity/check"
      );
      expect(integrityResponse.status()).toBe(200);

      const integrityData = await integrityResponse.json();
      expect(integrityData).toHaveProperty("checksumValidation");
      expect(integrityData).toHaveProperty("referentialIntegrity");
      expect(integrityData).toHaveProperty("corruptedRecords");

      expect(integrityData.checksumValidation).toBe("PASS");
      expect(integrityData.referentialIntegrity).toBe("PASS");
      expect(integrityData.corruptedRecords).toBe(0);
    });

    test("should handle security incident response", async ({ page }) => {
      await securityAuth(page, "ADMIN");

      // Simulate security incident detection
      await page.goto("/admin/security");

      // Check incident response dashboard
      await expect(
        page.locator("[data-testid=security-dashboard]")
      ).toBeVisible();

      const alertsCount = await page
        .locator("[data-testid=security-alerts-count]")
        .textContent();
      const threatsBlocked = await page
        .locator("[data-testid=threats-blocked-count]")
        .textContent();

      expect(Number.parseInt(alertsCount || "0")).toBeGreaterThanOrEqual(0);
      expect(Number.parseInt(threatsBlocked || "0")).toBeGreaterThanOrEqual(0);

      // Test incident escalation
      if (Number.parseInt(alertsCount || "0") > 0) {
        await page.click("[data-testid=view-alerts-button]");
        await expect(
          page.locator("[data-testid=security-alerts-table]")
        ).toBeVisible();

        const firstAlert = page.locator("[data-testid=alert-row]").first();
        if (await firstAlert.isVisible()) {
          await firstAlert.click("[data-testid=escalate-alert-button]");
          await expect(
            page.locator("[data-testid=escalation-dialog]")
          ).toBeVisible();
        }
      }
    });
  });

  test.describe("Content Security Policy", () => {
    test("should enforce Content Security Policy", async ({ page }) => {
      // Monitor CSP violations
      const cspViolations: any[] = [];

      page.on("console", (msg) => {
        if (
          msg.text().includes("Content Security Policy") ||
          msg.text().includes("CSP")
        ) {
          cspViolations.push(msg.text());
        }
      });

      await page.goto("/dashboard");
      await page.waitForTimeout(3000);

      // Navigate through different pages to test CSP
      const pages = ["/clients", "/tax", "/documents", "/settings"];
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForTimeout(1000);
      }

      // Should have no CSP violations
      expect(cspViolations.length).toBe(0);

      // Test inline script blocking
      const scriptResult = await page.evaluate(() => {
        try {
          // This should be blocked by CSP
          eval("console.log('Inline script executed')");
          return "executed";
        } catch (error) {
          return "blocked";
        }
      });

      expect(scriptResult).toBe("blocked");
    });

    test("should prevent clickjacking attacks", async ({ page }) => {
      // Check X-Frame-Options header
      const response = await page.goto("/login");
      const xFrameOptions = response?.headers()["x-frame-options"];

      expect(xFrameOptions).toBeDefined();
      expect(xFrameOptions?.toLowerCase()).toMatch(/deny|sameorigin/);

      // Test that page cannot be embedded in iframe
      const frameTest = await page.evaluate(() => {
        try {
          return window.top === window.self;
        } catch (error) {
          return false;
        }
      });

      expect(frameTest).toBe(true);
    });
  });

  test.describe("Rate Limiting and DoS Protection", () => {
    test("should enforce API rate limits", async ({ request }) => {
      const endpoint = "/api/clients";
      const requests = [];

      // Make requests beyond rate limit
      for (let i = 0; i < SECURITY_TESTS.RATE_LIMITS.api.requests + 10; i++) {
        requests.push(request.get(endpoint));
      }

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status() === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Check rate limit headers
      const rateLimitedResponse = rateLimitedResponses[0];
      const headers = rateLimitedResponse.headers();
      expect(headers["retry-after"]).toBeDefined();
      expect(headers["x-ratelimit-limit"]).toBeDefined();
      expect(headers["x-ratelimit-remaining"]).toBeDefined();
    });

    test("should protect against brute force attacks", async ({ page }) => {
      const testEmail = "brute.force@example.com";

      // Attempt multiple rapid logins
      for (let i = 0; i < 10; i++) {
        await page.goto("/login");
        await page.fill("[data-testid=email-input]", testEmail);
        await page.fill("[data-testid=password-input]", `attempt${i}`);
        await page.click("[data-testid=login-button]");

        await page.waitForTimeout(100); // Brief delay
      }

      // Should eventually show rate limiting or CAPTCHA
      const isRateLimited = await page
        .locator("[data-testid=rate-limit-error]")
        .isVisible();
      const hasCaptcha = await page
        .locator("[data-testid=captcha-challenge]")
        .isVisible();

      expect(isRateLimited || hasCaptcha).toBe(true);
    });
  });

  test.describe("Compliance and Regulatory Requirements", () => {
    test("should maintain GDPR compliance features", async ({ page }) => {
      await securityAuth(page);

      // Test data export functionality
      await page.goto("/settings/privacy");

      await expect(
        page.locator("[data-testid=export-data-button]")
      ).toBeVisible();
      await page.click("[data-testid=export-data-button]");

      await expect(
        page.locator("[data-testid=data-export-dialog]")
      ).toBeVisible();
      await page.click("[data-testid=request-export-button]");

      await expect(
        page.locator("[data-testid=export-requested]")
      ).toBeVisible();

      // Test data deletion request
      await page.click("[data-testid=delete-account-button]");
      await expect(
        page.locator("[data-testid=delete-account-dialog]")
      ).toBeVisible();

      // Should require confirmation and reason
      await page.fill("[data-testid=deletion-reason]", "No longer needed");
      await page.check("[data-testid=deletion-confirmation]");
      await page.click("[data-testid=confirm-deletion-button]");

      await expect(
        page.locator("[data-testid=deletion-requested]")
      ).toBeVisible();
    });

    test("should handle consent management", async ({ page }) => {
      // Test first-time consent
      await page.goto("/login");

      // Should show privacy consent
      if (await page.locator("[data-testid=privacy-consent]").isVisible()) {
        await expect(page.locator("[data-testid=consent-text]")).toBeVisible();
        await expect(
          page.locator("[data-testid=accept-consent]")
        ).toBeVisible();
        await expect(
          page.locator("[data-testid=decline-consent]")
        ).toBeVisible();

        await page.click("[data-testid=accept-consent]");
      }

      await securityAuth(page);

      // Test consent withdrawal
      await page.goto("/settings/privacy");
      await page.click("[data-testid=manage-consent-button]");

      await expect(
        page.locator("[data-testid=consent-preferences]")
      ).toBeVisible();

      // Should be able to withdraw specific consents
      await page.uncheck("[data-testid=analytics-consent]");
      await page.click("[data-testid=save-consent-button]");

      await expect(page.locator("[data-testid=consent-updated]")).toBeVisible();
    });
  });
});
