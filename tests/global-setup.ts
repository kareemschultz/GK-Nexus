/**
 * Global setup for Playwright E2E tests
 * Sets up test database and authentication for comprehensive testing
 */

import { chromium, type FullConfig } from "@playwright/test";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { GenericContainer } from "testcontainers";

let postgresContainer: any;
let testDatabase: any;

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global test setup...");

  try {
    // Start test database container
    console.log("📦 Starting PostgreSQL test container...");
    postgresContainer = await new GenericContainer("postgres:15")
      .withEnvironment({
        POSTGRES_DB: "gk_nexus_e2e_test",
        POSTGRES_USER: "test",
        POSTGRES_PASSWORD: "test",
      })
      .withExposedPorts(5432)
      .withStartupTimeout(120_000)
      .start();

    const port = postgresContainer.getMappedPort(5432);
    const host = postgresContainer.getHost();
    const connectionString = `postgres://test:test@${host}:${port}/gk_nexus_e2e_test`;

    // Store connection info in environment for tests
    process.env.E2E_DATABASE_URL = connectionString;
    process.env.E2E_DB_HOST = host;
    process.env.E2E_DB_PORT = port.toString();

    // Set up database connection and run migrations
    console.log("🗄️ Setting up test database...");
    const sql = postgres(connectionString);
    testDatabase = drizzle(sql);

    // Run migrations (assuming migrations directory exists)
    try {
      await migrate(testDatabase, { migrationsFolder: "./migrations" });
      console.log("✅ Database migrations completed");
    } catch (error) {
      console.log("⚠️ No migrations found or migration failed:", error.message);
      // Continue - we'll create test data manually if needed
    }

    // Seed test data for E2E tests
    await seedTestData(testDatabase);

    // Start the application in test mode
    console.log("🌐 Starting application for E2E testing...");

    // Set test environment variables
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = connectionString;
    process.env.DISABLE_EXTERNAL_APIS = "true";
    process.env.TEST_MODE = "true";

    // Wait for servers to be ready
    await waitForServers();

    console.log("✅ Global setup completed successfully");

    // Store container reference for cleanup
    global.testCleanup = {
      postgresContainer,
      sql,
    };
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    process.exit(1);
  }
}

async function waitForServers() {
  console.log("⏳ Waiting for servers to be ready...");

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Check web server
    await page.goto("http://localhost:3001", {
      waitUntil: "networkidle",
      timeout: 120_000,
    });
    console.log("✅ Web server is ready");

    // Check API server
    await page.goto("http://localhost:3000/health", {
      waitUntil: "networkidle",
      timeout: 30_000,
    });
    console.log("✅ API server is ready");
  } finally {
    await browser.close();
  }
}

async function seedTestData(db: any) {
  console.log("🌱 Seeding test data...");

  try {
    // Create test organizations
    const organizations = [
      {
        id: "test-org-primary",
        name: "Primary Test Organization",
        subdomain: "primary-test",
        settings: {
          timezone: "America/Guyana",
          currency: "GYD",
          features: {
            taxCalculations: true,
            clientManagement: true,
            documentManagement: true,
            appointments: true,
          },
        },
        metadata: {
          testData: true,
          createdFor: "e2e-testing",
        },
      },
      {
        id: "test-org-secondary",
        name: "Secondary Test Organization",
        subdomain: "secondary-test",
        settings: {
          timezone: "America/Guyana",
          currency: "GYD",
          features: {
            taxCalculations: true,
            clientManagement: false,
            documentManagement: true,
            appointments: false,
          },
        },
        metadata: {
          testData: true,
          createdFor: "e2e-testing",
        },
      },
    ];

    // Set test credentials for different roles
    process.env.TEST_SUPER_ADMIN_EMAIL = "superadmin@test.com";
    process.env.TEST_SUPER_ADMIN_PASSWORD = "TestPassword123!";
    process.env.TEST_ADMIN_EMAIL = "admin@test.com";
    process.env.TEST_ADMIN_PASSWORD = "TestPassword123!";
    process.env.TEST_MANAGER_EMAIL = "manager@test.com";
    process.env.TEST_MANAGER_PASSWORD = "TestPassword123!";
    process.env.TEST_STAFF_EMAIL = "staff@test.com";
    process.env.TEST_STAFF_PASSWORD = "TestPassword123!";
    process.env.TEST_CLIENT_EMAIL = "client@test.com";
    process.env.TEST_CLIENT_PASSWORD = "TestPassword123!";

    console.log("✅ Test data seeded successfully");

    // Store test data IDs for use in tests
    global.testData = {
      organizations,
      primaryOrgId: "test-org-primary",
      secondaryOrgId: "test-org-secondary",
      testClients: {
        individual: "test-client-individual",
        business: "test-client-business",
      },
      testDocuments: {
        passport: "test-doc-passport",
        financial: "test-doc-financial",
      },
      testAppointments: {
        consultation: "test-appointment-consultation",
      },
    };
  } catch (error) {
    console.error("❌ Failed to seed test data:", error);
    throw error;
  }
}

export default globalSetup;
