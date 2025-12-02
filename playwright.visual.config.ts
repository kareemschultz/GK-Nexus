import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Visual Verification tests
 *
 * This configuration is optimized for taking screenshots of all routes
 * against the local development server.
 *
 * Run with: npx playwright test --config=playwright.visual.config.ts --headed
 */
export default defineConfig({
  testDir: "./tests/visual",
  /* Run tests serially for visual verification */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* No retries for visual tests */
  retries: 0,
  /* Single worker for visual tests to ensure screenshots are taken in order */
  workers: 1,
  /* Reporter */
  reporter: [["html", { outputFolder: "test-results/html-report" }], ["list"]],
  /* Shared settings */
  use: {
    /* Base URL for local dev server */
    baseURL: "http://localhost:3001",

    /* Always take screenshots */
    screenshot: "on",

    /* Trace on first retry */
    trace: "on-first-retry",

    /* No video for visual tests */
    video: "off",

    /* Timeout settings */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,

    /* Viewport for consistent screenshots */
    viewport: { width: 1280, height: 720 },

    /* Emulate timezone for Guyana */
    timezoneId: "America/Guyana",
  },

  /* Only test in Chromium for visual verification */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Expect local dev server to already be running */
  webServer: {
    command: "echo 'Expecting dev server to be running on port 3001'",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 5000,
  },

  /* Test timeout - longer for screenshots (5 minutes for all routes) */
  timeout: 300_000,

  /* Output folder for screenshots */
  outputDir: "test-results/proof",

  /* Expect timeout */
  expect: {
    timeout: 10_000,
  },
});
