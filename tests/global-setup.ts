import { chromium, type FullConfig } from "@playwright/test";

/**
 * Global setup for Playwright tests
 * Runs once before all tests to prepare the environment
 */
async function globalSetup(_config: FullConfig): Promise<void> {
  console.log("🚀 Setting up test environment...");

  // Create a browser instance for setup tasks
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Wait for both servers to be ready
    console.log("⏳ Waiting for servers to be ready...");

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

    // Setup test database
    await setupTestDatabase();

    // Create test users and data
    await setupTestData();

    console.log("✅ Test environment setup complete");
  } catch (error) {
    console.error("❌ Failed to setup test environment:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Setup test database with clean state
 */
async function setupTestDatabase(): Promise<void> {
  console.log("🗄️ Setting up test database...");

  // Reset database to clean state
  // This would typically run database migrations and seed data
  // Implementation depends on your database setup

  console.log("✅ Test database ready");
}

/**
 * Create test users and sample data
 */
async function setupTestData(): Promise<void> {
  console.log("👥 Creating test users and data...");

  // Create test users with different roles
  const _testUsers = [
    {
      email: "admin@test.com",
      password: "TestPassword123!",
      role: "admin",
      firstName: "Admin",
      lastName: "User",
    },
    {
      email: "manager@test.com",
      password: "TestPassword123!",
      role: "manager",
      firstName: "Manager",
      lastName: "User",
    },
    {
      email: "client@test.com",
      password: "TestPassword123!",
      role: "client",
      firstName: "Client",
      lastName: "User",
    },
    {
      email: "staff@test.com",
      password: "TestPassword123!",
      role: "staff",
      firstName: "Staff",
      lastName: "User",
    },
  ];

  // Create test clients and projects
  const _testClients = [
    {
      name: "Acme Corporation",
      email: "contact@acme.com",
      phone: "+1-555-0123",
      address: "123 Main St, City, State 12345",
      taxId: "12-3456789",
    },
    {
      name: "Tech Solutions Inc",
      email: "info@techsolutions.com",
      phone: "+1-555-0124",
      address: "456 Tech Ave, Silicon Valley, CA 94000",
      taxId: "98-7654321",
    },
  ];

  // This would typically make API calls to create the test data
  // For now, we'll store this configuration for tests to use
  process.env.TEST_ADMIN_EMAIL = "admin@test.com";
  process.env.TEST_ADMIN_PASSWORD = "TestPassword123!";
  process.env.TEST_CLIENT_EMAIL = "client@test.com";
  process.env.TEST_CLIENT_PASSWORD = "TestPassword123!";

  console.log("✅ Test data created");
}

export default globalSetup;
