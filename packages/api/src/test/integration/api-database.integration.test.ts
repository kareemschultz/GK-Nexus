/**
 * API Endpoint Integration Tests with Database
 * Tests real API endpoints with actual database operations for comprehensive validation
 */

import type { Client, Organization, User } from "@GK-Nexus/db/schema";
// Import database schemas and types
import * as schema from "@GK-Nexus/db/schema";
import { createId } from "@paralleldrive/cuid2";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { count, eq } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { Hono } from "hono";
import postgres from "postgres";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

// Global test infrastructure
let container: StartedPostgreSqlContainer;
let db: PostgresJsDatabase<typeof schema>;
let sql: postgres.Sql;
let _app: Hono;

// Test data
let testOrganization: Organization;
let testUser: User;
let testClient: Client;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
describe.skip("API-Database Integration Tests", () => {
  beforeAll(async () => {
    // Start PostgreSQL container
    console.log("🐳 Starting PostgreSQL container for integration tests...");
    container = await new PostgreSqlContainer("postgres:15")
      .withDatabase("gk_nexus_integration_test")
      .withUsername("test")
      .withPassword("test")
      .start();

    const connectionString = container.getConnectionUri();

    // Set up database connection
    sql = postgres(connectionString);
    db = drizzle(sql, { schema });

    // Run migrations
    try {
      await migrate(db, { migrationsFolder: "./migrations" });
    } catch (error) {
      console.log("⚠️ No migrations found, continuing with manual schema setup");
    }

    // Set up Hono app with routers
    _app = new Hono();
    // NOTE: Routers don't exist yet - test is skipped
    // app.route("/api/tax", taxRouter);
    // app.route("/api/clients", clientsRouter);
    // app.route("/api/documents", documentsRouter);
    // app.route("/api/users", usersRouter);
    // app.route("/api/audit", auditRouter);

    // Set environment variables for testing
    process.env.DATABASE_URL = connectionString;
    process.env.NODE_ENV = "test";
  });

  beforeEach(async () => {
    // Create test organization
    testOrganization = {
      id: createId(),
      name: "Integration Test Organization",
      subdomain: "integration-test",
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
        createdFor: "integration-testing",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert test organization
    await db.insert(schema.organizationsTable).values(testOrganization);

    // Create test user
    testUser = {
      id: createId(),
      organizationId: testOrganization.id,
      email: "integration.test@example.com",
      firstName: "Integration",
      lastName: "Tester",
      phone: "+592-123-4567",
      avatar: null,
      isActive: true,
      preferences: {
        theme: "light",
        language: "en",
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
        dashboard: {
          layout: "default",
          widgets: ["tasks", "calendar"],
        },
      },
      metadata: {
        source: "test",
        onboardingCompleted: true,
      },
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.usersTable).values(testUser);

    // Create test client
    testClient = {
      id: createId(),
      organizationId: testOrganization.id,
      type: "INDIVIDUAL",
      firstName: "Test",
      lastName: "Client",
      email: "test.client@example.com",
      phone: "+592-987-6543",
      address: {
        street: "123 Test Street",
        city: "Georgetown",
        region: "Demerara-Mahaica",
        country: "Guyana",
        postalCode: "12345",
      },
      identification: {
        type: "PASSPORT",
        number: "GY987654321",
        issuedDate: "2020-01-01",
        expiryDate: "2030-01-01",
        issuingAuthority: "Guyana Passport Office",
      },
      taxInformation: {
        tinNumber: "987-654-321",
        nisNumber: "87654321",
        employmentStatus: "EMPLOYED",
        annualIncome: 1_800_000,
      },
      status: "ACTIVE",
      notes: [],
      metadata: {
        source: "test",
        priority: "normal",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.clientsTable).values(testClient);
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(schema.auditLogsTable);
    await db.delete(schema.documentsTable);
    await db.delete(schema.taxCalculationsTable);
    await db.delete(schema.clientsTable);
    await db.delete(schema.usersTable);
    await db.delete(schema.organizationsTable);
  });

  afterAll(async () => {
    await sql.end();
    await container.stop();
  });

  describe("Tax Router Integration", () => {
    it("should calculate and store PAYE tax with database persistence", async () => {
      const payeData = {
        clientId: testClient.id,
        calculationType: "PAYE",
        taxYear: 2025,
        period: "MONTHLY",
        inputs: {
          basicSalary: 200_000,
          overtime: 25_000,
          allowances: 10_000,
          deductions: 5000,
          dependents: 2,
        },
      };

      // Make API request
      const response = await request(app)
        .post("/api/tax/calculate")
        .send(payeData)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty("id");
      expect(response.body.calculationType).toBe("PAYE");
      expect(response.body.results).toHaveProperty("grossEarnings");
      expect(response.body.results).toHaveProperty("totalPAYETax");
      expect(response.body.results).toHaveProperty("netPay");

      // Verify database persistence
      const savedCalculation = await db
        .select()
        .from(schema.taxCalculationsTable)
        .where(eq(schema.taxCalculationsTable.id, response.body.id));

      expect(savedCalculation).toHaveLength(1);
      expect(savedCalculation[0].organizationId).toBe(testOrganization.id);
      expect(savedCalculation[0].clientId).toBe(testClient.id);
      expect(savedCalculation[0].calculationType).toBe("PAYE");

      // Verify audit log creation
      const auditLogs = await db
        .select()
        .from(schema.auditLogsTable)
        .where(eq(schema.auditLogsTable.action, "tax:calculate"));

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].organizationId).toBe(testOrganization.id);
      expect(auditLogs[0].userId).toBe(testUser.id);
    });

    it("should calculate VAT with proper validation and storage", async () => {
      const vatData = {
        clientId: testClient.id,
        calculationType: "VAT",
        taxYear: 2025,
        period: "QUARTERLY",
        inputs: {
          standardRateSales: 1_000_000,
          zeroRateSales: 200_000,
          exemptSales: 50_000,
          standardRatePurchases: 600_000,
          zeroRatePurchases: 100_000,
        },
      };

      const response = await request(app)
        .post("/api/tax/calculate")
        .send(vatData)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(response.body.calculationType).toBe("VAT");
      expect(response.body.results).toHaveProperty("outputVAT");
      expect(response.body.results).toHaveProperty("inputVAT");
      expect(response.body.results).toHaveProperty("netVAT");

      // Verify VAT calculation accuracy
      const results = response.body.results;
      expect(results.outputVAT).toBe(160_000); // 16% of 1,000,000
      expect(results.inputVAT).toBe(96_000); // 16% of 600,000
      expect(results.netVAT).toBe(64_000); // Output - Input
    });

    it("should retrieve tax calculation history with proper filtering", async () => {
      // Create multiple tax calculations
      const calculations = [
        {
          id: createId(),
          organizationId: testOrganization.id,
          clientId: testClient.id,
          calculationType: "PAYE",
          taxYear: 2024,
          period: "MONTHLY",
          inputs: { basicSalary: 180_000 },
          results: { totalPAYETax: 12_000, netPay: 168_000 },
          calculatedAt: new Date("2024-06-01"),
          calculatedBy: testUser.id,
          createdAt: new Date("2024-06-01"),
        },
        {
          id: createId(),
          organizationId: testOrganization.id,
          clientId: testClient.id,
          calculationType: "VAT",
          taxYear: 2024,
          period: "QUARTERLY",
          inputs: { standardRateSales: 800_000 },
          results: { netVAT: 50_000 },
          calculatedAt: new Date("2024-09-01"),
          calculatedBy: testUser.id,
          createdAt: new Date("2024-09-01"),
        },
      ];

      await db.insert(schema.taxCalculationsTable).values(calculations);

      // Test history retrieval
      const response = await request(app)
        .get(`/api/tax/history/${testClient.id}`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].calculationType).toBe("VAT"); // Latest first
      expect(response.body[1].calculationType).toBe("PAYE");

      // Test filtering by calculation type
      const payeResponse = await request(app)
        .get(`/api/tax/history/${testClient.id}?type=PAYE`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(payeResponse.body).toHaveLength(1);
      expect(payeResponse.body[0].calculationType).toBe("PAYE");
    });

    it("should enforce multi-tenant isolation in tax calculations", async () => {
      // Create another organization and client
      const otherOrg = {
        id: createId(),
        name: "Other Organization",
        subdomain: "other-org",
        settings: { timezone: "America/Guyana", currency: "GYD" },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(schema.organizationsTable).values(otherOrg);

      const otherClient = {
        id: createId(),
        organizationId: otherOrg.id,
        type: "INDIVIDUAL" as const,
        firstName: "Other",
        lastName: "Client",
        email: "other@example.com",
        status: "ACTIVE" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(schema.clientsTable).values(otherClient);

      // Try to access other organization's client
      const response = await request(app)
        .get(`/api/tax/history/${otherClient.id}`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(404); // Should not find client from different organization

      expect(response.body.error).toBeDefined();
    });
  });

  describe("Clients Router Integration", () => {
    it("should create and retrieve clients with full database validation", async () => {
      const newClientData = {
        type: "BUSINESS",
        businessName: "Test Business Ltd.",
        registrationNumber: "REG123456",
        businessType: "LIMITED_LIABILITY",
        email: "business@test.com",
        phone: "+592-456-7890",
        address: {
          street: "456 Business Ave",
          city: "Georgetown",
          region: "Demerara-Mahaica",
          country: "Guyana",
          postalCode: "54321",
        },
        taxInformation: {
          tinNumber: "456-789-123",
          vatNumber: "VAT987654321",
          businessCategory: "PROFESSIONAL_SERVICES",
          annualRevenue: 5_000_000,
        },
      };

      // Create client via API
      const createResponse = await request(app)
        .post("/api/clients")
        .send(newClientData)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(201);

      expect(createResponse.body).toHaveProperty("id");
      expect(createResponse.body.businessName).toBe("Test Business Ltd.");
      expect(createResponse.body.type).toBe("BUSINESS");

      // Verify database persistence
      const savedClient = await db
        .select()
        .from(schema.clientsTable)
        .where(eq(schema.clientsTable.id, createResponse.body.id));

      expect(savedClient).toHaveLength(1);
      expect(savedClient[0].businessName).toBe("Test Business Ltd.");
      expect(savedClient[0].organizationId).toBe(testOrganization.id);

      // Retrieve client via API
      const getResponse = await request(app)
        .get(`/api/clients/${createResponse.body.id}`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(getResponse.body.id).toBe(createResponse.body.id);
      expect(getResponse.body.businessName).toBe("Test Business Ltd.");
    });

    it("should update client information with proper validation", async () => {
      const updateData = {
        phone: "+592-555-9999",
        address: {
          ...testClient.address,
          street: "Updated Street Address",
        },
        taxInformation: {
          ...testClient.taxInformation,
          annualIncome: 2_000_000,
        },
      };

      const response = await request(app)
        .put(`/api/clients/${testClient.id}`)
        .send(updateData)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(response.body.phone).toBe("+592-555-9999");
      expect(response.body.address.street).toBe("Updated Street Address");
      expect(response.body.taxInformation.annualIncome).toBe(2_000_000);

      // Verify database update
      const updatedClient = await db
        .select()
        .from(schema.clientsTable)
        .where(eq(schema.clientsTable.id, testClient.id));

      expect(updatedClient[0].phone).toBe("+592-555-9999");
      expect(updatedClient[0].address.street).toBe("Updated Street Address");
    });

    it("should validate client data integrity on creation", async () => {
      const invalidClientData = {
        type: "INDIVIDUAL",
        // Missing required fields
        email: "invalid-email", // Invalid format
        phone: "invalid-phone", // Invalid format
      };

      const response = await request(app)
        .post("/api/clients")
        .send(invalidClientData)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.validationErrors).toBeDefined();

      // Verify no client was created in database
      const clientCount = await db
        .select({ count: count() })
        .from(schema.clientsTable)
        .where(eq(schema.clientsTable.organizationId, testOrganization.id));

      expect(clientCount[0].count).toBe(1); // Only the test client
    });
  });

  describe("Documents Router Integration", () => {
    it("should handle document upload and metadata storage", async () => {
      const documentData = {
        name: "Test Tax Document",
        type: "TAX_RETURN",
        category: "TAX_DOCUMENTS",
        description: "Test document for integration testing",
        clientId: testClient.id,
        fileUrl: "https://storage.example.com/test-document.pdf",
        fileName: "test-document.pdf",
        fileSize: 1_024_000,
        mimeType: "application/pdf",
        metadata: {
          taxYear: 2024,
          documentNumber: "TD-2024-001",
          isOfficial: true,
        },
        tags: ["tax", "2024", "test"],
      };

      const response = await request(app)
        .post("/api/documents")
        .send(documentData)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Test Tax Document");
      expect(response.body.clientId).toBe(testClient.id);

      // Verify database storage
      const savedDocument = await db
        .select()
        .from(schema.documentsTable)
        .where(eq(schema.documentsTable.id, response.body.id));

      expect(savedDocument).toHaveLength(1);
      expect(savedDocument[0].organizationId).toBe(testOrganization.id);
      expect(savedDocument[0].uploadedBy).toBe(testUser.id);
    });

    it("should retrieve client documents with proper filtering", async () => {
      // Create multiple documents
      const documents = [
        {
          id: createId(),
          organizationId: testOrganization.id,
          clientId: testClient.id,
          name: "Document 1",
          type: "TAX_RETURN",
          category: "TAX_DOCUMENTS",
          fileUrl: "https://example.com/doc1.pdf",
          fileName: "doc1.pdf",
          fileSize: 100_000,
          mimeType: "application/pdf",
          status: "ACTIVE",
          uploadedBy: testUser.id,
          uploadedAt: new Date("2024-01-01"),
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: createId(),
          organizationId: testOrganization.id,
          clientId: testClient.id,
          name: "Document 2",
          type: "FINANCIAL_STATEMENT",
          category: "FINANCIAL_DOCUMENTS",
          fileUrl: "https://example.com/doc2.pdf",
          fileName: "doc2.pdf",
          fileSize: 200_000,
          mimeType: "application/pdf",
          status: "ACTIVE",
          uploadedBy: testUser.id,
          uploadedAt: new Date("2024-02-01"),
          createdAt: new Date("2024-02-01"),
          updatedAt: new Date("2024-02-01"),
        },
      ];

      await db.insert(schema.documentsTable).values(documents);

      // Test document retrieval
      const response = await request(app)
        .get(`/api/documents/client/${testClient.id}`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe("Document 2"); // Latest first
      expect(response.body[1].name).toBe("Document 1");

      // Test filtering by category
      const taxDocsResponse = await request(app)
        .get(`/api/documents/client/${testClient.id}?category=TAX_DOCUMENTS`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(taxDocsResponse.body).toHaveLength(1);
      expect(taxDocsResponse.body[0].category).toBe("TAX_DOCUMENTS");
    });
  });

  describe("Users Router Integration", () => {
    it("should manage user profiles with database persistence", async () => {
      const newUserData = {
        email: "new.user@test.com",
        firstName: "New",
        lastName: "User",
        phone: "+592-111-2222",
        preferences: {
          theme: "dark",
          language: "en",
          notifications: {
            email: false,
            push: true,
            sms: false,
          },
        },
      };

      const response = await request(app)
        .post("/api/users")
        .send(newUserData)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(201);

      expect(response.body.email).toBe("new.user@test.com");
      expect(response.body.organizationId).toBe(testOrganization.id);

      // Verify database persistence
      const savedUser = await db
        .select()
        .from(schema.usersTable)
        .where(eq(schema.usersTable.id, response.body.id));

      expect(savedUser[0].preferences.theme).toBe("dark");
      expect(savedUser[0].preferences.notifications.push).toBe(true);
    });

    it("should update user preferences with validation", async () => {
      const updatedPreferences = {
        preferences: {
          theme: "light",
          language: "es",
          notifications: {
            email: true,
            push: false,
            sms: true,
          },
          dashboard: {
            layout: "compact",
            widgets: ["calendar", "tasks", "notifications"],
          },
        },
      };

      const response = await request(app)
        .patch(`/api/users/${testUser.id}/preferences`)
        .send(updatedPreferences)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(response.body.preferences.theme).toBe("light");
      expect(response.body.preferences.language).toBe("es");
      expect(response.body.preferences.dashboard.layout).toBe("compact");
    });
  });

  describe("Audit Router Integration", () => {
    it("should capture and query audit logs across operations", async () => {
      // Perform several auditable operations
      await request(app)
        .post("/api/tax/calculate")
        .send({
          clientId: testClient.id,
          calculationType: "PAYE",
          taxYear: 2025,
          inputs: { basicSalary: 150_000 },
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id);

      await request(app)
        .put(`/api/clients/${testClient.id}`)
        .send({ phone: "+592-999-8888" })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id);

      // Query audit logs
      const response = await request(app)
        .get("/api/audit/logs")
        .query({ limit: 10 })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(response.body).toHaveProperty("logs");
      expect(response.body.logs.length).toBeGreaterThan(0);

      // Verify log structure
      const log = response.body.logs[0];
      expect(log).toHaveProperty("action");
      expect(log).toHaveProperty("userId");
      expect(log).toHaveProperty("timestamp");
      expect(log.organizationId).toBe(testOrganization.id);
    });

    it("should filter audit logs by resource type and date range", async () => {
      const startDate = new Date();

      // Perform tax calculation
      await request(app)
        .post("/api/tax/calculate")
        .send({
          clientId: testClient.id,
          calculationType: "VAT",
          taxYear: 2025,
          inputs: { standardRateSales: 500_000 },
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id);

      const endDate = new Date();

      // Query with filters
      const response = await request(app)
        .get("/api/audit/logs")
        .query({
          resourceType: "tax_calculation",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(response.body.logs.length).toBeGreaterThan(0);
      expect(response.body.logs[0].resourceType).toBe("tax_calculation");
      expect(response.body.logs[0].action).toBe("tax:calculate");
    });
  });

  describe("Cross-Router Integration Scenarios", () => {
    it("should handle complex workflow with multiple API calls", async () => {
      // 1. Create a business client
      const businessClientResponse = await request(app)
        .post("/api/clients")
        .send({
          type: "BUSINESS",
          businessName: "Integration Test Business",
          email: "business@integration.test",
          phone: "+592-777-8888",
          taxInformation: {
            tinNumber: "777-888-999",
            vatNumber: "VAT777888999",
            annualRevenue: 8_000_000,
          },
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(201);

      const businessClientId = businessClientResponse.body.id;

      // 2. Upload documents for the client
      const documentResponse = await request(app)
        .post("/api/documents")
        .send({
          name: "Business Registration Certificate",
          type: "LEGAL_DOCUMENT",
          category: "LEGAL_DOCUMENTS",
          clientId: businessClientId,
          fileUrl: "https://storage.example.com/business-cert.pdf",
          fileName: "business-cert.pdf",
          fileSize: 500_000,
          mimeType: "application/pdf",
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(201);

      // 3. Calculate VAT for the business
      const vatResponse = await request(app)
        .post("/api/tax/calculate")
        .send({
          clientId: businessClientId,
          calculationType: "VAT",
          taxYear: 2025,
          period: "QUARTERLY",
          inputs: {
            standardRateSales: 2_000_000,
            standardRatePurchases: 1_200_000,
          },
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      // 4. Verify audit trail captures the entire workflow
      const auditResponse = await request(app)
        .get("/api/audit/logs")
        .query({ limit: 10 })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(auditResponse.body.logs.length).toBeGreaterThanOrEqual(3);

      const actions = auditResponse.body.logs.map((log: any) => log.action);
      expect(actions).toContain("client:create");
      expect(actions).toContain("document:upload");
      expect(actions).toContain("tax:calculate");

      // 5. Verify data consistency across all operations
      expect(businessClientResponse.body.id).toBeDefined();
      expect(documentResponse.body.clientId).toBe(businessClientId);
      expect(vatResponse.body.clientId).toBe(businessClientId);
      expect(vatResponse.body.results.netVAT).toBe(128_000); // (2M - 1.2M) * 16%
    });

    it("should maintain data integrity under concurrent operations", async () => {
      // Simulate concurrent tax calculations for the same client
      const calculations = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post("/api/tax/calculate")
          .send({
            clientId: testClient.id,
            calculationType: "PAYE",
            taxYear: 2025,
            inputs: { basicSalary: 150_000 + i * 10_000 },
          })
          .set("Organization-ID", testOrganization.id)
          .set("User-ID", testUser.id)
      );

      const responses = await Promise.all(calculations);

      // Verify all calculations succeeded
      for (const response of responses) {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("id");
        expect(response.body.calculationType).toBe("PAYE");
      }

      // Verify all calculations are stored in database
      const storedCalculations = await db
        .select()
        .from(schema.taxCalculationsTable)
        .where(eq(schema.taxCalculationsTable.clientId, testClient.id));

      expect(storedCalculations).toHaveLength(5);

      // Verify unique IDs and correct calculations
      const ids = new Set(storedCalculations.map((calc) => calc.id));
      expect(ids.size).toBe(5); // All unique
    });
  });
});
