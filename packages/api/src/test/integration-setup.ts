/**
 * Test setup for API integration tests
 */

import { schema } from "@GK-Nexus/db";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { GenericContainer, type StartedTestContainer } from "testcontainers";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

// Global test container state
let postgresContainer: StartedTestContainer;
let testDatabase: ReturnType<typeof drizzle>;
let sql: ReturnType<typeof postgres>;

export { testDatabase };

beforeAll(async () => {
  // Start PostgreSQL container for integration tests
  console.log("Starting PostgreSQL test container...");

  postgresContainer = await new GenericContainer("postgres:15")
    .withEnvironment({
      POSTGRES_DB: "gk_nexus_test",
      POSTGRES_USER: "test",
      POSTGRES_PASSWORD: "test",
    })
    .withExposedPorts(5432)
    .withStartupTimeout(120_000)
    .start();

  const port = postgresContainer.getMappedPort(5432);
  const host = postgresContainer.getHost();

  // Set up database connection
  const connectionString = `postgres://test:test@${host}:${port}/gk_nexus_test`;
  process.env.DATABASE_URL = connectionString;

  sql = postgres(connectionString);
  testDatabase = drizzle(sql, { schema });

  // Run migrations
  console.log("Running database migrations...");
  await migrate(testDatabase, { migrationsFolder: "./migrations" });

  console.log("Integration test database ready");
}, 120_000);

beforeEach(async () => {
  // Clean all tables before each test
  await cleanupAllTables();
});

afterEach(async () => {
  // Additional cleanup if needed
});

afterAll(async () => {
  // Clean up resources
  if (sql) {
    await sql.end();
  }

  if (postgresContainer) {
    console.log("Stopping PostgreSQL test container...");
    await postgresContainer.stop();
  }
});

/**
 * Clean up all test data from tables
 */
async function cleanupAllTables() {
  if (!testDatabase) return;

  try {
    // Delete in order to respect foreign key constraints
    const tables = [
      "audit_logs",
      "notifications",
      "documents",
      "appointments",
      "tax_calculations",
      "compliance_checks",
      "user_organizations",
      "users",
      "organizations",
    ];

    for (const table of tables) {
      await sql`DELETE FROM ${sql(table)}`;
    }
  } catch (error) {
    console.warn("Error cleaning up test data:", error);
  }
}

/**
 * Create test organization for multi-tenancy tests
 */
export async function createTestOrganization(name = "Test Organization") {
  const timestamp = Date.now();
  const slug = `test-${timestamp}`;
  const ownerId = `owner-${timestamp}`;

  // First create the owner user
  await testDatabase.insert(schema.users).values({
    id: ownerId,
    name: "Organization Owner",
    email: `owner-${timestamp}@example.com`,
  });

  const [organization] = await testDatabase
    .insert(schema.organizations)
    .values({
      id: `org-${timestamp}`,
      name,
      slug,
      ownerId,
    })
    .returning();

  if (!organization) {
    throw new Error("Failed to create test organization");
  }

  return organization;
}

/**
 * Create test user with organization
 */
export async function createTestUser(
  _organizationId: string,
  role = "read_only",
  overrides: Record<string, unknown> = {}
) {
  const timestamp = Date.now();
  const [user] = await testDatabase
    .insert(schema.users)
    .values({
      id: `user-${timestamp}`,
      name: "Test User",
      email: `test-${timestamp}@example.com`,
      role: role as
        | "super_admin"
        | "admin"
        | "manager"
        | "accountant"
        | "client_service"
        | "read_only",
      ...overrides,
    })
    .returning();

  if (!user) {
    throw new Error("Failed to create test user");
  }

  return user;
}

/**
 * Mock authentication context for tests
 */
export function mockAuthContext(user: any, organization: any) {
  return {
    user,
    organization,
    permissions: [], // Will be populated based on role
    isAuthenticated: true,
  };
}
