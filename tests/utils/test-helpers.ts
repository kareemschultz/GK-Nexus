import { expect, type Locator, type Page } from "@playwright/test";
import { checkA11y, injectAxe } from "axe-playwright";

/**
 * Test helper utilities for GK-Nexus E2E tests
 */

/**
 * Authentication helper
 */
export class AuthHelper {
  constructor(private readonly page: Page) {}

  async login(email: string, password: string): Promise<void> {
    await this.page.goto("/login");
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');

    // Wait for successful login redirect
    await this.page.waitForURL(/\/dashboard/);
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL(/\/login/);
  }

  async loginAsAdmin(): Promise<void> {
    await this.login(
      process.env.TEST_ADMIN_EMAIL!,
      process.env.TEST_ADMIN_PASSWORD!
    );
  }

  async loginAsClient(): Promise<void> {
    await this.login(
      process.env.TEST_CLIENT_EMAIL!,
      process.env.TEST_CLIENT_PASSWORD!
    );
  }
}

/**
 * Form helper utilities
 */
export class FormHelper {
  constructor(private readonly page: Page) {}

  async fillForm(formData: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[data-testid="${field}"]`, value);
    }
  }

  async selectOption(selectTestId: string, optionValue: string): Promise<void> {
    await this.page.click(`[data-testid="${selectTestId}"]`);
    await this.page.click(`[data-value="${optionValue}"]`);
  }

  async uploadFile(inputTestId: string, filePath: string): Promise<void> {
    await this.page.setInputFiles(`[data-testid="${inputTestId}"]`, filePath);
  }

  async submitForm(buttonTestId = "submit-button"): Promise<void> {
    await this.page.click(`[data-testid="${buttonTestId}"]`);
  }
}

/**
 * Navigation helper utilities
 */
export class NavigationHelper {
  constructor(private readonly page: Page) {}

  async goToDashboard(): Promise<void> {
    await this.page.goto("/dashboard");
    await this.page.waitForLoadState("networkidle");
  }

  async goToClients(): Promise<void> {
    await this.page.goto("/clients");
    await this.page.waitForLoadState("networkidle");
  }

  async goToProjects(): Promise<void> {
    await this.page.goto("/projects");
    await this.page.waitForLoadState("networkidle");
  }

  async goToTaxes(): Promise<void> {
    await this.page.goto("/taxes");
    await this.page.waitForLoadState("networkidle");
  }

  async goToDocuments(): Promise<void> {
    await this.page.goto("/documents");
    await this.page.waitForLoadState("networkidle");
  }

  async goToSettings(): Promise<void> {
    await this.page.goto("/settings");
    await this.page.waitForLoadState("networkidle");
  }
}

/**
 * Table helper utilities
 */
export class TableHelper {
  constructor(private readonly page: Page) {}

  async getRowCount(tableTestId: string): Promise<number> {
    const rows = await this.page.locator(
      `[data-testid="${tableTestId}"] tbody tr`
    );
    return await rows.count();
  }

  async getRowByText(tableTestId: string, text: string): Promise<Locator> {
    return this.page.locator(
      `[data-testid="${tableTestId}"] tbody tr:has-text("${text}")`
    );
  }

  async clickRowAction(
    tableTestId: string,
    rowText: string,
    actionTestId: string
  ): Promise<void> {
    const row = await this.getRowByText(tableTestId, rowText);
    await row.locator(`[data-testid="${actionTestId}"]`).click();
  }

  async sortByColumn(tableTestId: string, columnTestId: string): Promise<void> {
    await this.page.click(
      `[data-testid="${tableTestId}"] [data-testid="${columnTestId}"]`
    );
  }

  async filterTable(filterTestId: string, filterValue: string): Promise<void> {
    await this.page.fill(`[data-testid="${filterTestId}"]`, filterValue);
    await this.page.waitForTimeout(500); // Wait for filter to apply
  }
}

/**
 * Accessibility testing helper
 */
export class AccessibilityHelper {
  constructor(private readonly page: Page) {}

  async injectAxe(): Promise<void> {
    await injectAxe(this.page);
  }

  async checkAccessibility(options?: {
    include?: string[];
    exclude?: string[];
    rules?: Record<string, { enabled: boolean }>;
  }): Promise<void> {
    await checkA11y(this.page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
      ...options,
    });
  }

  async checkKeyboardNavigation(): Promise<void> {
    // Test Tab navigation
    await this.page.keyboard.press("Tab");
    const focusedElement = await this.page.locator(":focus");
    await expect(focusedElement).toBeVisible();

    // Test Enter/Space activation
    await this.page.keyboard.press("Enter");
    // Add specific assertions based on the focused element
  }

  async checkScreenReaderText(): Promise<void> {
    // Check for proper ARIA labels and screen reader text
    const srOnlyElements = this.page.locator(
      ".sr-only, [aria-label], [aria-describedby]"
    );
    const count = await srOnlyElements.count();
    expect(count).toBeGreaterThan(0);
  }
}

/**
 * Performance testing helper
 */
export class PerformanceHelper {
  constructor(private readonly page: Page) {}

  async measurePageLoad(url: string): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstPaint: number;
    firstContentfulPaint: number;
  }> {
    const _startTime = Date.now();

    await this.page.goto(url, { waitUntil: "load" });

    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType("paint");

      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstPaint: paint.find((p) => p.name === "first-paint")?.startTime || 0,
        firstContentfulPaint:
          paint.find((p) => p.name === "first-contentful-paint")?.startTime ||
          0,
      };
    });

    return metrics;
  }

  async measureInteraction(action: () => Promise<void>): Promise<number> {
    const startTime = performance.now();
    await action();
    const endTime = performance.now();
    return endTime - startTime;
  }

  async checkCoreWebVitals(): Promise<{
    lcp: number;
    fid: number;
    cls: number;
  }> {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = { lcp: 0, fid: 0, cls: 0 };

          for (const entry of entries) {
            if (entry.entryType === "largest-contentful-paint") {
              metrics.lcp = entry.startTime;
            } else if (entry.entryType === "first-input") {
              metrics.fid = (entry as any).processingStart - entry.startTime;
            } else if (
              entry.entryType === "layout-shift" &&
              !(entry as any).hadRecentInput
            ) {
              metrics.cls += (entry as any).value;
            }
          }

          resolve(metrics);
        });

        observer.observe({
          entryTypes: [
            "largest-contentful-paint",
            "first-input",
            "layout-shift",
          ],
        });

        // Fallback timeout
        setTimeout(() => resolve({ lcp: 0, fid: 0, cls: 0 }), 5000);
      });
    });
  }
}

/**
 * Visual regression helper
 */
export class VisualHelper {
  constructor(private readonly page: Page) {}

  async compareScreenshot(
    name: string,
    options?: {
      fullPage?: boolean;
      clip?: { x: number; y: number; width: number; height: number };
      threshold?: number;
    }
  ): Promise<void> {
    await expect(this.page).toHaveScreenshot(`${name}.png`, {
      fullPage: options?.fullPage ?? true,
      clip: options?.clip,
      threshold: options?.threshold ?? 0.2,
    });
  }

  async compareElementScreenshot(
    selector: string,
    name: string
  ): Promise<void> {
    const element = this.page.locator(selector);
    await expect(element).toHaveScreenshot(`${name}.png`);
  }

  async waitForImagesLoaded(): Promise<void> {
    await this.page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images.every((img) => img.complete);
    });
  }
}

/**
 * API testing helper
 */
export class APIHelper {
  constructor(private readonly page: Page) {}

  async makeAPICall(
    endpoint: string,
    options?: {
      method?: string;
      data?: any;
      headers?: Record<string, string>;
    }
  ): Promise<any> {
    const response = await this.page.request.fetch(
      `http://localhost:3000${endpoint}`,
      {
        method: options?.method || "GET",
        data: options?.data,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      }
    );

    expect(response.ok()).toBeTruthy();
    return await response.json();
  }

  async authenticatedAPICall(
    endpoint: string,
    options?: {
      method?: string;
      data?: any;
    }
  ): Promise<any> {
    // Get auth token from browser storage
    const token = await this.page.evaluate(
      () =>
        localStorage.getItem("auth-token") ||
        sessionStorage.getItem("auth-token")
    );

    return this.makeAPICall(endpoint, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

/**
 * Wait utilities
 */
export class WaitHelper {
  constructor(private readonly page: Page) {}

  async waitForToast(message?: string): Promise<void> {
    const toastSelector = message
      ? `[data-testid="toast"]:has-text("${message}")`
      : '[data-testid="toast"]';

    await expect(this.page.locator(toastSelector)).toBeVisible();
  }

  async waitForLoader(): Promise<void> {
    await this.page.waitForSelector('[data-testid="loading-spinner"]', {
      state: "hidden",
    });
  }

  async waitForModal(modalTestId: string): Promise<void> {
    await expect(
      this.page.locator(`[data-testid="${modalTestId}"]`)
    ).toBeVisible();
  }

  async closeModal(modalTestId: string): Promise<void> {
    await this.page.click(
      `[data-testid="${modalTestId}"] [data-testid="close-modal"]`
    );
    await expect(
      this.page.locator(`[data-testid="${modalTestId}"]`)
    ).toBeHidden();
  }
}

/**
 * Test helper factory
 */
export function createTestHelpers(page: Page) {
  return {
    auth: new AuthHelper(page),
    form: new FormHelper(page),
    nav: new NavigationHelper(page),
    table: new TableHelper(page),
    a11y: new AccessibilityHelper(page),
    perf: new PerformanceHelper(page),
    visual: new VisualHelper(page),
    api: new APIHelper(page),
    wait: new WaitHelper(page),
  };
}
