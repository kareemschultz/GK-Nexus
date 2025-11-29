import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for GK-Nexus E2E testing
 *
 * This configuration includes:
 * - Multi-browser testing (Chrome, Firefox, Safari)
 * - Mobile testing for responsive design
 * - Visual regression testing
 * - Accessibility testing
 * - Performance testing
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { outputFolder: "test-results/html-report" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
    ["json", { outputFile: "test-results/test-results.json" }],
    ["allure-playwright", { outputFolder: "test-results/allure-results" }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3001",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on test failure */
    screenshot: "only-on-failure",

    /* Record video on test failure */
    video: "retain-on-failure",

    /* Global test timeout */
    actionTimeout: 30_000,

    /* Navigation timeout */
    navigationTimeout: 30_000,
  },

  /* Configure projects for major browsers */
  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Mobile devices
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },

    // Tablet devices
    {
      name: "iPad",
      use: { ...devices["iPad Pro"] },
    },

    // High DPI screens
    {
      name: "High DPI",
      use: { ...devices["Desktop Chrome HiDPI"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: "bun run dev:web",
      port: 3001,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "bun run dev:server",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve("./tests/global-setup.ts"),
  globalTeardown: require.resolve("./tests/global-teardown.ts"),

  /* Test timeout */
  timeout: 60_000,

  /* Maximum time one test can run for. */
  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 10_000,
    /* Threshold for pixel difference in visual comparisons */
    toHaveScreenshot: { threshold: 0.2 },
    toMatchSnapshot: { threshold: 0.2 },
  },
});
