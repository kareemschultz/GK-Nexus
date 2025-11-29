import { expect, test } from "@playwright/test";
import { testUsers } from "../fixtures/test-data";
import { createTestHelpers } from "../utils/test-helpers";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start from clean state
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test.describe("Login Process", () => {
    test("should display login form correctly", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/login");

      // Verify login form elements
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="forgot-password-link"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="register-link"]')).toBeVisible();

      // Check for proper labels and accessibility
      await helpers.a11y.injectAxe();
      await helpers.a11y.checkAccessibility();

      // Verify form validation
      await page.click('[data-testid="login-button"]');
      await expect(page.locator('[data-testid="email-error"]')).toContainText(
        "Email is required"
      );
      await expect(
        page.locator('[data-testid="password-error"]')
      ).toContainText("Password is required");
    });

    test("should login successfully with valid credentials", async ({
      page,
    }) => {
      const helpers = createTestHelpers(page);

      await helpers.auth.login(
        testUsers.client.email,
        testUsers.client.password
      );

      // Verify successful login
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"]')).toContainText(
        `${testUsers.client.firstName} ${testUsers.client.lastName}`
      );

      // Verify authentication token is stored
      const token = await page.evaluate(
        () =>
          localStorage.getItem("auth-token") ||
          sessionStorage.getItem("auth-token")
      );
      expect(token).toBeTruthy();
    });

    test("should show error for invalid credentials", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/login");

      await page.fill('[data-testid="email-input"]', "invalid@test.com");
      await page.fill('[data-testid="password-input"]', "wrongpassword");
      await page.click('[data-testid="login-button"]');

      // Verify error message
      await helpers.wait.waitForToast("Invalid credentials");
      await expect(page.locator('[data-testid="login-error"]')).toBeVisible();

      // Verify user stays on login page
      await expect(page).toHaveURL(/\/login/);
    });

    test("should handle rate limiting gracefully", async ({ page }) => {
      const _helpers = createTestHelpers(page);

      // Simulate multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await page.goto("/login");
        await page.fill('[data-testid="email-input"]', "test@test.com");
        await page.fill('[data-testid="password-input"]', "wrongpassword");
        await page.click('[data-testid="login-button"]');
        await page.waitForTimeout(500);
      }

      // Verify rate limiting message
      await expect(
        page.locator('[data-testid="rate-limit-error"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="rate-limit-error"]')
      ).toContainText("Too many attempts");
    });

    test("should remember user preference for login", async ({ page }) => {
      await page.goto("/login");

      await page.fill('[data-testid="email-input"]', testUsers.client.email);
      await page.fill(
        '[data-testid="password-input"]',
        testUsers.client.password
      );
      await page.check('[data-testid="remember-me-checkbox"]');
      await page.click('[data-testid="login-button"]');

      // Verify successful login and remember me
      await expect(page).toHaveURL(/\/dashboard/);

      // Check if persistent session is set
      const persistentToken = await page.evaluate(() =>
        localStorage.getItem("remember-me")
      );
      expect(persistentToken).toBeTruthy();
    });
  });

  test.describe("Registration Process", () => {
    test("should display registration form correctly", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/register");

      // Verify registration form elements
      await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="first-name-input"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="last-name-input"]')
      ).toBeVisible();
      await expect(page.locator('[data-testid="email-input"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="password-input"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="confirm-password-input"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="terms-checkbox"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="register-button"]')
      ).toBeVisible();

      // Check accessibility
      await helpers.a11y.injectAxe();
      await helpers.a11y.checkAccessibility();
    });

    test("should register new user successfully", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/register");

      const newUser = {
        firstName: "New",
        lastName: "User",
        email: "newuser@test.com",
        password: "NewPassword123!",
      };

      // Fill registration form
      await page.fill('[data-testid="first-name-input"]', newUser.firstName);
      await page.fill('[data-testid="last-name-input"]', newUser.lastName);
      await page.fill('[data-testid="email-input"]', newUser.email);
      await page.fill('[data-testid="password-input"]', newUser.password);
      await page.fill(
        '[data-testid="confirm-password-input"]',
        newUser.password
      );
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="register-button"]');

      // Verify successful registration
      await helpers.wait.waitForToast("Registration successful");
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('[data-testid="user-name"]')).toContainText(
        `${newUser.firstName} ${newUser.lastName}`
      );
    });

    test("should validate password strength", async ({ page }) => {
      await page.goto("/register");

      // Test weak password
      await page.fill('[data-testid="password-input"]', "weak");
      await page.blur('[data-testid="password-input"]');
      await expect(
        page.locator('[data-testid="password-strength-indicator"]')
      ).toContainText("Weak");

      // Test medium password
      await page.fill('[data-testid="password-input"]', "Medium123");
      await expect(
        page.locator('[data-testid="password-strength-indicator"]')
      ).toContainText("Medium");

      // Test strong password
      await page.fill('[data-testid="password-input"]', "StrongPassword123!");
      await expect(
        page.locator('[data-testid="password-strength-indicator"]')
      ).toContainText("Strong");
    });

    test("should validate password confirmation", async ({ page }) => {
      await page.goto("/register");

      await page.fill('[data-testid="password-input"]', "Password123!");
      await page.fill(
        '[data-testid="confirm-password-input"]',
        "DifferentPassword123!"
      );
      await page.blur('[data-testid="confirm-password-input"]');

      await expect(
        page.locator('[data-testid="confirm-password-error"]')
      ).toContainText("Passwords do not match");
    });

    test("should show error for existing email", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/register");

      // Try to register with existing email
      await page.fill('[data-testid="first-name-input"]', "Test");
      await page.fill('[data-testid="last-name-input"]', "User");
      await page.fill('[data-testid="email-input"]', testUsers.client.email);
      await page.fill('[data-testid="password-input"]', "Password123!");
      await page.fill('[data-testid="confirm-password-input"]', "Password123!");
      await page.check('[data-testid="terms-checkbox"]');
      await page.click('[data-testid="register-button"]');

      await helpers.wait.waitForToast("Email already exists");
      await expect(page.locator('[data-testid="email-error"]')).toContainText(
        "Email already exists"
      );
    });
  });

  test.describe("Logout Process", () => {
    test("should logout successfully", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Login first
      await helpers.auth.loginAsClient();

      // Logout
      await helpers.auth.logout();

      // Verify logout
      await expect(page).toHaveURL(/\/login/);

      // Verify token is cleared
      const token = await page.evaluate(
        () =>
          localStorage.getItem("auth-token") ||
          sessionStorage.getItem("auth-token")
      );
      expect(token).toBeFalsy();
    });

    test("should clear all session data on logout", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await helpers.auth.loginAsClient();

      // Add some user data to storage
      await page.evaluate(() => {
        localStorage.setItem(
          "user-preferences",
          JSON.stringify({ theme: "dark" })
        );
        sessionStorage.setItem("temp-data", "test");
      });

      await helpers.auth.logout();

      // Verify all user data is cleared
      const userPrefs = await page.evaluate(() =>
        localStorage.getItem("user-preferences")
      );
      const tempData = await page.evaluate(() =>
        sessionStorage.getItem("temp-data")
      );

      expect(userPrefs).toBeFalsy();
      expect(tempData).toBeFalsy();
    });
  });

  test.describe("Password Reset", () => {
    test("should send password reset email", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/forgot-password");

      // Fill email and submit
      await page.fill('[data-testid="email-input"]', testUsers.client.email);
      await page.click('[data-testid="send-reset-button"]');

      // Verify success message
      await helpers.wait.waitForToast("Password reset email sent");
      await expect(
        page.locator('[data-testid="reset-success-message"]')
      ).toBeVisible();
    });

    test("should show error for non-existent email", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await page.goto("/forgot-password");

      await page.fill('[data-testid="email-input"]', "nonexistent@test.com");
      await page.click('[data-testid="send-reset-button"]');

      await helpers.wait.waitForToast("Email not found");
      await expect(page.locator('[data-testid="email-error"]')).toContainText(
        "Email not found"
      );
    });

    test("should reset password with valid token", async ({ page }) => {
      const helpers = createTestHelpers(page);

      // Simulate visiting reset link with valid token
      await page.goto("/reset-password?token=valid-reset-token");

      // Fill new password
      await page.fill('[data-testid="new-password-input"]', "NewPassword123!");
      await page.fill(
        '[data-testid="confirm-new-password-input"]',
        "NewPassword123!"
      );
      await page.click('[data-testid="reset-password-button"]');

      // Verify success and redirect to login
      await helpers.wait.waitForToast("Password reset successful");
      await expect(page).toHaveURL(/\/login/);
    });

    test("should show error for invalid/expired token", async ({ page }) => {
      const _helpers = createTestHelpers(page);

      await page.goto("/reset-password?token=invalid-token");

      await expect(page.locator('[data-testid="token-error"]')).toContainText(
        "Invalid or expired reset link"
      );
      await expect(
        page.locator('[data-testid="reset-password-form"]')
      ).toBeHidden();
    });
  });

  test.describe("Session Management", () => {
    test("should redirect to login when session expires", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await helpers.auth.loginAsClient();

      // Simulate session expiration by clearing token
      await page.evaluate(() => {
        localStorage.removeItem("auth-token");
        sessionStorage.removeItem("auth-token");
      });

      // Navigate to protected page
      await page.goto("/dashboard");

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
      await expect(
        page.locator('[data-testid="session-expired-message"]')
      ).toBeVisible();
    });

    test("should refresh token automatically", async ({ page }) => {
      const helpers = createTestHelpers(page);

      await helpers.auth.loginAsClient();

      // Mock token refresh endpoint
      await page.route("**/auth/refresh", (route) => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            token: "new-token",
            refreshToken: "new-refresh-token",
            expiresIn: 3600,
          }),
        });
      });

      // Wait for automatic token refresh (this would be triggered by a timer in real app)
      await page.waitForTimeout(2000);

      // Verify new token is stored
      const token = await page.evaluate(() =>
        localStorage.getItem("auth-token")
      );
      expect(token).toBe("new-token");
    });

    test("should handle concurrent login sessions", async ({ browser }) => {
      // Create two browser contexts to simulate different sessions
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();

      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      const helpers1 = createTestHelpers(page1);
      const helpers2 = createTestHelpers(page2);

      // Login from first session
      await helpers1.auth.loginAsClient();

      // Login from second session (should invalidate first session if configured)
      await helpers2.auth.loginAsClient();

      // Check first session behavior
      await page1.reload();
      // Behavior depends on app configuration - single session or multiple sessions allowed

      await context1.close();
      await context2.close();
    });
  });

  test.describe("Two-Factor Authentication", () => {
    test("should prompt for 2FA when enabled", async ({ page }) => {
      // This test would be implemented if 2FA is part of the app
      const _helpers = createTestHelpers(page);

      await page.goto("/login");
      await page.fill('[data-testid="email-input"]', "user-with-2fa@test.com");
      await page.fill('[data-testid="password-input"]', "Password123!");
      await page.click('[data-testid="login-button"]');

      await expect(page).toHaveURL(/\/two-factor/);
      await expect(
        page.locator('[data-testid="2fa-code-input"]')
      ).toBeVisible();
    });

    test("should verify 2FA code", async ({ page }) => {
      // Implementation would depend on 2FA setup
    });
  });

  test.describe("Social Authentication", () => {
    test("should login with Google OAuth", async ({ page }) => {
      // This would test OAuth integration if implemented
      const _helpers = createTestHelpers(page);

      await page.goto("/login");
      await page.click('[data-testid="google-login-button"]');

      // Handle OAuth popup/redirect
      // Verify successful login
    });

    test("should login with Microsoft OAuth", async ({ page }) => {
      // Similar to Google OAuth test
    });
  });
});

test.describe("Authentication Security", () => {
  test("should have proper CSRF protection", async ({ page }) => {
    const helpers = createTestHelpers(page);

    await page.goto("/login");

    // Check for CSRF token
    const csrfToken = await page
      .locator('[name="csrf-token"]')
      .getAttribute("value");
    expect(csrfToken).toBeTruthy();

    // Verify CSRF token is validated on form submission
    await page.route("**/auth/login", (route) => {
      const headers = route.request().headers();
      expect(headers["x-csrf-token"] || headers["csrf-token"]).toBeTruthy();
      route.continue();
    });

    await helpers.auth.loginAsClient();
  });

  test("should use secure headers", async ({ page }) => {
    const response = await page.goto("/login");

    const headers = response?.headers();
    expect(headers?.["x-frame-options"]).toBeTruthy();
    expect(headers?.["x-content-type-options"]).toBe("nosniff");
    expect(headers?.["referrer-policy"]).toBeTruthy();
  });

  test("should implement proper password policies", async ({ page }) => {
    await page.goto("/register");

    // Test minimum length
    await page.fill('[data-testid="password-input"]', "123");
    await page.blur('[data-testid="password-input"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      "at least 8 characters"
    );

    // Test complexity requirements
    await page.fill('[data-testid="password-input"]', "password");
    await page.blur('[data-testid="password-input"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      "uppercase letter"
    );

    await page.fill('[data-testid="password-input"]', "Password");
    await page.blur('[data-testid="password-input"]');
    await expect(page.locator('[data-testid="password-error"]')).toContainText(
      "number"
    );
  });
});
