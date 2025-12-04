import { type ConsoleMessage, expect, type Page, test } from "@playwright/test";

const BASE_URL = "http://localhost:3001";

// Store console errors
const consoleErrors: { route: string; message: string; type: string }[] = [];

// Helper to login with correct credentials
async function login(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  // Fill login form with correct seeded credentials
  await page.fill('input[name="email"]', "admin@gk-nexus.com");
  await page.fill('input[name="password"]', "Admin123!@#");
  await page.click('button[type="submit"]');

  // Wait for navigation away from login
  await page.waitForTimeout(3000);

  // Verify we're logged in (not on login page)
  const currentUrl = page.url();
  if (currentUrl.includes("/login")) {
    // Try alternate password
    await page.fill('input[name="password"]', "admin123");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  }
}

// All routes to test (excluding dynamic routes with IDs)
const ROUTES = [
  // Core pages
  { path: "/dashboard", name: "Dashboard" },
  { path: "/service-catalog", name: "Service Catalog" },

  // Client Management
  { path: "/clients", name: "Clients" },
  { path: "/clients/active", name: "Clients Active" },
  { path: "/clients/new", name: "Clients New" },

  // Tax Services
  { path: "/tax", name: "Tax Services" },
  { path: "/tax/paye", name: "Tax PAYE Calculator" },
  { path: "/tax/vat", name: "Tax VAT Calculator" },
  { path: "/tax/nis", name: "Tax NIS Calculator" },
  { path: "/tax/filing", name: "Tax Filing" },

  // Payroll
  { path: "/payroll", name: "Payroll" },
  { path: "/payroll/employees", name: "Payroll Employees" },
  { path: "/payroll/run", name: "Payroll Run" },
  { path: "/payroll/reports", name: "Payroll Reports" },

  // Documents
  { path: "/documents", name: "Documents" },
  { path: "/documents/search", name: "Documents Search" },
  { path: "/documents/upload", name: "Documents Upload" },
  { path: "/documents/templates", name: "Documents Templates" },
  { path: "/documents/requirements", name: "Documents Requirements" },
  { path: "/documents/advanced", name: "Documents Advanced" },

  // Compliance
  { path: "/compliance", name: "Compliance" },
  { path: "/compliance/alerts", name: "Compliance Alerts" },
  { path: "/compliance/gra-filing", name: "Compliance GRA Filing" },
  { path: "/compliance/reports", name: "Compliance Reports" },

  // Invoices
  { path: "/invoices", name: "Invoices" },
  { path: "/invoices/new", name: "Invoices New" },
  { path: "/invoices/payments", name: "Invoices Payments" },

  // Appointments
  { path: "/appointments", name: "Appointments" },
  { path: "/appointments/calendar", name: "Appointments Calendar" },
  { path: "/appointments/new", name: "Appointments New" },
  { path: "/appointments/requests", name: "Appointments Requests" },

  // Time Tracking
  { path: "/time-tracking", name: "Time Tracking" },
  { path: "/time-tracking/timer", name: "Time Tracking Timer" },
  { path: "/time-tracking/entries", name: "Time Tracking Entries" },
  { path: "/time-tracking/projects", name: "Time Tracking Projects" },
  { path: "/time-tracking/reports", name: "Time Tracking Reports" },

  // Automation
  { path: "/automation", name: "Automation" },
  { path: "/automation/rules", name: "Automation Rules" },
  { path: "/automation/templates", name: "Automation Templates" },
  { path: "/automation/history", name: "Automation History" },

  // Users
  { path: "/users", name: "Users" },
  { path: "/users/invite", name: "Users Invite" },
  { path: "/users/roles", name: "Users Roles" },

  // Settings
  { path: "/settings", name: "Settings" },
  { path: "/settings/profile", name: "Settings Profile" },
  { path: "/settings/security", name: "Settings Security" },
  { path: "/settings/notifications", name: "Settings Notifications" },
  { path: "/settings/appearance", name: "Settings Appearance" },
  { path: "/settings/billing", name: "Settings Billing" },
  { path: "/settings/integrations", name: "Settings Integrations" },
  { path: "/settings/backup", name: "Settings Backup" },

  // Profile
  { path: "/profile", name: "Profile" },

  // Other services
  { path: "/paralegal", name: "Paralegal" },
  { path: "/immigration", name: "Immigration" },
  { path: "/expediting", name: "Expediting" },
  { path: "/property-management", name: "Property Management" },
  { path: "/local-content", name: "Local Content" },
  { path: "/partner-network", name: "Partner Network" },
  { path: "/training", name: "Training" },

  // Portal (client-facing)
  { path: "/portal", name: "Portal" },
];

test.describe("Comprehensive Page Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Setup console error listener
    page.on("console", (msg: ConsoleMessage) => {
      if (msg.type() === "error") {
        consoleErrors.push({
          route: page.url(),
          message: msg.text(),
          type: msg.type(),
        });
      }
    });

    await login(page);
  });

  // Test each route
  for (const route of ROUTES) {
    test(`${route.name} (${route.path}) loads without errors`, async ({
      page,
    }) => {
      await page.goto(`${BASE_URL}${route.path}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1500);

      const pageContent = (await page.textContent("body")) || "";

      // Check for common error patterns
      const hasErrors =
        pageContent.includes("is not a function") ||
        pageContent.includes("Cannot read properties") ||
        pageContent.includes("Forbidden") ||
        pageContent.includes("Something went wrong") ||
        pageContent.includes("Error Loading") ||
        pageContent.includes("Unhandled Runtime Error");

      // Take screenshot
      const screenshotName =
        route.path.replace(/\//g, "-").replace(/^-/, "") || "index";
      await page.screenshot({
        path: `test-results/pages/${screenshotName}.png`,
        fullPage: true,
      });

      // Verify no critical errors
      if (hasErrors) {
        console.log(`ERROR on ${route.path}:`, pageContent.substring(0, 500));
      }

      expect(hasErrors, `Page ${route.path} has errors`).toBe(false);
    });
  }

  test.afterAll(async () => {
    // Report all console errors
    if (consoleErrors.length > 0) {
      console.log("\n=== CONSOLE ERRORS FOUND ===\n");
      for (const error of consoleErrors) {
        console.log(`Route: ${error.route}`);
        console.log(`Type: ${error.type}`);
        console.log(`Message: ${error.message}`);
        console.log("---");
      }
    } else {
      console.log("\nNo console errors found!");
    }
  });
});
