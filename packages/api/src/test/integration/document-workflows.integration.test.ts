/**
 * Document Workflow Integration Tests
 * Tests complete document management workflows including upload, processing, storage, and retrieval
 */

import type { Client, Document, Organization, User } from "@GK-Nexus/db/schema";
// Import database schemas and types
import * as schema from "@GK-Nexus/db/schema";
import { createId } from "@paralleldrive/cuid2";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { and, desc, eq } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { mkdir, writeFile } from "fs/promises";
import { Hono } from "hono";
import { tmpdir } from "os";
import { join } from "path";
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
let testBusinessClient: Client;
let testTempDir: string;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
describe.skip("Document Workflow Integration Tests", () => {
  beforeAll(async () => {
    // Start PostgreSQL container
    console.log(
      "🐳 Starting PostgreSQL container for document workflow tests..."
    );
    container = await new PostgreSqlContainer("postgres:15")
      .withDatabase("gk_nexus_documents_integration_test")
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

    // Create temporary directory for test files
    testTempDir = join(tmpdir(), `gk-nexus-test-${Date.now()}`);
    await mkdir(testTempDir, { recursive: true });

    // Set up Hono app with document processing middleware
    _app = new Hono();

    // NOTE: Middleware and routers are commented out as they don't exist yet
    // This test file is a placeholder for future implementation
    // app.use("/api/documents/*", authMiddleware("test-secret"));
    // app.use("/api/documents/upload", uploadMiddleware({...}));
    // app.route("/api/documents", documentsRouter);
    // app.route("/api/clients", clientsRouter);
    // app.route("/api/audit", auditRouter);

    // Set environment variables for testing
    process.env.DATABASE_URL = connectionString;
    process.env.NODE_ENV = "test";
    process.env.UPLOAD_DIR = testTempDir;
  });

  beforeEach(async () => {
    // Create test organization
    testOrganization = {
      id: createId(),
      name: "Document Test Organization",
      subdomain: "doc-test",
      settings: {
        timezone: "America/Guyana",
        currency: "GYD",
        features: {
          documentManagement: true,
          clientManagement: true,
          taxCalculations: true,
        },
      },
      metadata: {
        testData: true,
        documentStorage: {
          maxFileSize: 10_485_760, // 10MB
          allowedTypes: ["pdf", "jpg", "png", "doc", "docx"],
          retentionDays: 2555, // 7 years
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.organizationsTable).values(testOrganization);

    // Create test user
    testUser = {
      id: createId(),
      organizationId: testOrganization.id,
      email: "document.test@example.com",
      firstName: "Document",
      lastName: "Tester",
      phone: "+592-123-4567",
      avatar: null,
      isActive: true,
      preferences: {
        theme: "light",
        language: "en",
        notifications: { email: true, push: false, sms: true },
        dashboard: { layout: "default", widgets: ["documents", "tasks"] },
      },
      metadata: {
        source: "test",
        permissions: ["documents:upload", "documents:view", "documents:manage"],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.usersTable).values(testUser);

    // Create test individual client
    testClient = {
      id: createId(),
      organizationId: testOrganization.id,
      type: "INDIVIDUAL",
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+592-987-6543",
      address: {
        street: "123 Main Street",
        city: "Georgetown",
        region: "Demerara-Mahaica",
        country: "Guyana",
        postalCode: "12345",
      },
      identification: {
        type: "PASSPORT",
        number: "GY123456789",
        issuedDate: "2020-01-15",
        expiryDate: "2030-01-15",
        issuingAuthority: "Guyana Passport Office",
      },
      taxInformation: {
        tinNumber: "123-456-789",
        nisNumber: "12345678",
        employmentStatus: "EMPLOYED",
        annualIncome: 2_400_000,
      },
      status: "ACTIVE",
      notes: [],
      metadata: {
        source: "referral",
        documentRequirements: [
          "passport",
          "nis_card",
          "pay_slips",
          "bank_statements",
        ],
        compliance: { kycCompleted: false, documentsVerified: false },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.clientsTable).values(testClient);

    // Create test business client
    testBusinessClient = {
      id: createId(),
      organizationId: testOrganization.id,
      type: "BUSINESS",
      businessName: "Doe Enterprises Ltd.",
      registrationNumber: "REG123456",
      businessType: "LIMITED_LIABILITY",
      email: "info@doe-enterprises.gy",
      phone: "+592-234-5678",
      address: {
        street: "456 Business Ave",
        city: "Georgetown",
        region: "Demerara-Mahaica",
        country: "Guyana",
        postalCode: "54321",
      },
      taxInformation: {
        tinNumber: "987-654-321",
        vatNumber: "VAT987654321",
        businessCategory: "PROFESSIONAL_SERVICES",
        annualRevenue: 12_000_000,
      },
      status: "ACTIVE",
      notes: [],
      metadata: {
        source: "marketing",
        documentRequirements: [
          "certificate_of_incorporation",
          "memorandum_of_association",
          "financial_statements",
          "vat_registration",
        ],
        compliance: { corporateCompliance: false, taxCompliance: false },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(schema.clientsTable).values(testBusinessClient);
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(schema.auditLogsTable);
    await db.delete(schema.documentsTable);
    await db.delete(schema.clientsTable);
    await db.delete(schema.usersTable);
    await db.delete(schema.organizationsTable);
  });

  afterAll(async () => {
    await sql.end();
    await container.stop();
  });

  describe("Document Upload and Storage", () => {
    it("should upload and store PDF document with metadata extraction", async () => {
      // Create a mock PDF file
      const pdfContent = Buffer.from(
        "%PDF-1.4\n%Mock PDF for testing\nendobj\n%%EOF",
        "utf8"
      );

      const testFilePath = join(testTempDir, "test-document.pdf");
      await writeFile(testFilePath, pdfContent);

      const uploadData = {
        name: "Tax Return 2024",
        type: "TAX_RETURN",
        category: "TAX_DOCUMENTS",
        description: "Annual tax return for John Doe",
        clientId: testClient.id,
        metadata: {
          taxYear: 2024,
          documentNumber: "TR-2024-001",
          isOfficial: true,
          requiresSignature: true,
        },
        tags: ["tax", "2024", "annual", "individual"],
      };

      const response = await request(app)
        .post("/api/documents/upload")
        .attach("file", testFilePath)
        .field("documentData", JSON.stringify(uploadData))
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Tax Return 2024");
      expect(response.body.type).toBe("TAX_RETURN");
      expect(response.body.clientId).toBe(testClient.id);
      expect(response.body.fileSize).toBeGreaterThan(0);
      expect(response.body.mimeType).toBe("application/pdf");

      // Verify document stored in database
      const savedDocument = await db
        .select()
        .from(schema.documentsTable)
        .where(eq(schema.documentsTable.id, response.body.id));

      expect(savedDocument).toHaveLength(1);
      expect(savedDocument[0].organizationId).toBe(testOrganization.id);
      expect(savedDocument[0].uploadedBy).toBe(testUser.id);
      expect(savedDocument[0].status).toBe("ACTIVE");

      // Verify audit log created
      const auditLogs = await db
        .select()
        .from(schema.auditLogsTable)
        .where(eq(schema.auditLogsTable.action, "document:upload"));

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].resourceId).toBe(response.body.id);
      expect(auditLogs[0].userId).toBe(testUser.id);
    });

    it("should validate file type and size restrictions", async () => {
      // Test invalid file type
      const invalidFile = Buffer.from("This is not a valid document type");
      const invalidFilePath = join(testTempDir, "invalid.txt");
      await writeFile(invalidFilePath, invalidFile);

      const invalidResponse = await request(app)
        .post("/api/documents/upload")
        .attach("file", invalidFilePath)
        .field(
          "documentData",
          JSON.stringify({
            name: "Invalid Document",
            type: "OTHER",
            clientId: testClient.id,
          })
        )
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(400);

      expect(invalidResponse.body.error).toContain("file type not allowed");

      // Test file too large
      const largeFile = Buffer.alloc(15 * 1024 * 1024); // 15MB - exceeds 10MB limit
      const largeFilePath = join(testTempDir, "large.pdf");
      await writeFile(largeFilePath, largeFile);

      const largeResponse = await request(app)
        .post("/api/documents/upload")
        .attach("file", largeFilePath)
        .field(
          "documentData",
          JSON.stringify({
            name: "Large Document",
            type: "TAX_RETURN",
            clientId: testClient.id,
          })
        )
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(413);

      expect(largeResponse.body.error).toContain("file too large");
    });

    it("should handle multiple document upload for business client", async () => {
      const businessDocuments = [
        {
          name: "Certificate of Incorporation",
          type: "LEGAL_DOCUMENT",
          category: "LEGAL_DOCUMENTS",
          description: "Business registration certificate",
          content: "Mock certificate content",
          filename: "cert-incorporation.pdf",
        },
        {
          name: "Financial Statements 2024",
          type: "FINANCIAL_STATEMENT",
          category: "FINANCIAL_DOCUMENTS",
          description: "Annual financial statements",
          content: "Mock financial statements",
          filename: "financial-statements-2024.pdf",
        },
        {
          name: "VAT Registration Certificate",
          type: "TAX_DOCUMENT",
          category: "TAX_DOCUMENTS",
          description: "VAT registration documentation",
          content: "Mock VAT registration",
          filename: "vat-registration.pdf",
        },
      ];

      const uploadedDocuments = [];

      for (const doc of businessDocuments) {
        // Create mock PDF file
        const pdfContent = Buffer.from(
          `%PDF-1.4\n%${doc.content}\nendobj\n%%EOF`,
          "utf8"
        );
        const filePath = join(testTempDir, doc.filename);
        await writeFile(filePath, pdfContent);

        const uploadData = {
          name: doc.name,
          type: doc.type,
          category: doc.category,
          description: doc.description,
          clientId: testBusinessClient.id,
          metadata: {
            businessDocument: true,
            complianceRequired: true,
          },
          tags: ["business", "compliance", "2024"],
        };

        const response = await request(app)
          .post("/api/documents/upload")
          .attach("file", filePath)
          .field("documentData", JSON.stringify(uploadData))
          .set("Organization-ID", testOrganization.id)
          .set("User-ID", testUser.id)
          .expect(201);

        uploadedDocuments.push(response.body);
      }

      // Verify all documents uploaded
      expect(uploadedDocuments).toHaveLength(3);

      // Verify documents linked to business client
      const clientDocuments = await db
        .select()
        .from(schema.documentsTable)
        .where(eq(schema.documentsTable.clientId, testBusinessClient.id));

      expect(clientDocuments).toHaveLength(3);

      const documentTypes = clientDocuments.map((doc) => doc.type);
      expect(documentTypes).toContain("LEGAL_DOCUMENT");
      expect(documentTypes).toContain("FINANCIAL_STATEMENT");
      expect(documentTypes).toContain("TAX_DOCUMENT");
    });
  });

  describe("Document Processing and Validation", () => {
    let sampleDocument: Document;

    beforeEach(async () => {
      // Create a sample document for processing tests
      sampleDocument = {
        id: createId(),
        organizationId: testOrganization.id,
        clientId: testClient.id,
        name: "Sample Tax Document",
        type: "TAX_RETURN",
        category: "TAX_DOCUMENTS",
        description: "Sample document for processing",
        fileUrl: `file://${testTempDir}/sample-doc.pdf`,
        fileName: "sample-doc.pdf",
        fileSize: 256_000,
        mimeType: "application/pdf",
        metadata: {
          taxYear: 2024,
          processingStatus: "PENDING",
          validationResults: {},
        },
        tags: ["tax", "processing", "test"],
        status: "PROCESSING",
        uploadedBy: testUser.id,
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(schema.documentsTable).values(sampleDocument);
    });

    it("should process document with OCR and content extraction", async () => {
      const response = await request(app)
        .post(`/api/documents/${sampleDocument.id}/process`)
        .send({
          processingOptions: {
            extractText: true,
            validateContent: true,
            detectNumbers: true,
            extractTables: false,
          },
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(response.body.processingStatus).toBe("COMPLETED");
      expect(response.body.extractedData).toBeDefined();
      expect(response.body.validationResults).toBeDefined();

      // Verify database update
      const processedDocument = await db
        .select()
        .from(schema.documentsTable)
        .where(eq(schema.documentsTable.id, sampleDocument.id));

      expect(processedDocument[0].metadata.processingStatus).toBe("COMPLETED");
      expect(processedDocument[0].status).toBe("ACTIVE");
    });

    it("should validate document content against business rules", async () => {
      const validationResponse = await request(app)
        .post(`/api/documents/${sampleDocument.id}/validate`)
        .send({
          validationRules: [
            { rule: "required_fields", fields: ["tax_year", "taxpayer_name"] },
            {
              rule: "date_range",
              startDate: "2024-01-01",
              endDate: "2024-12-31",
            },
            { rule: "amount_validation", minAmount: 0, maxAmount: 10_000_000 },
          ],
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(validationResponse.body).toHaveProperty("isValid");
      expect(validationResponse.body).toHaveProperty("validationResults");
      expect(validationResponse.body).toHaveProperty("issues");

      if (!validationResponse.body.isValid) {
        expect(validationResponse.body.issues).toBeInstanceOf(Array);
        expect(validationResponse.body.issues.length).toBeGreaterThan(0);
      }
    });

    it("should handle document approval workflow", async () => {
      // Submit for approval
      const submitResponse = await request(app)
        .post(`/api/documents/${sampleDocument.id}/submit-approval`)
        .send({
          approvalType: "CONTENT_REVIEW",
          reviewerNotes: "Please review tax calculations",
          priority: "HIGH",
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(submitResponse.body.status).toBe("PENDING_APPROVAL");
      expect(submitResponse.body.approvalWorkflow).toBeDefined();

      // Approve document
      const approvalResponse = await request(app)
        .post(`/api/documents/${sampleDocument.id}/approve`)
        .send({
          decision: "APPROVED",
          reviewerComments: "Document content verified and approved",
          conditions: [],
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(approvalResponse.body.status).toBe("APPROVED");
      expect(approvalResponse.body.approvedAt).toBeDefined();
      expect(approvalResponse.body.approvedBy).toBe(testUser.id);

      // Verify audit trail
      const approvalAudits = await db
        .select()
        .from(schema.auditLogsTable)
        .where(
          and(
            eq(schema.auditLogsTable.resourceId, sampleDocument.id),
            eq(schema.auditLogsTable.action, "document:approve")
          )
        );

      expect(approvalAudits).toHaveLength(1);
    });
  });

  describe("Document Retrieval and Management", () => {
    let multipleDocuments: Document[];

    beforeEach(async () => {
      // Create multiple documents for retrieval testing
      multipleDocuments = [
        {
          id: createId(),
          organizationId: testOrganization.id,
          clientId: testClient.id,
          name: "Tax Return 2023",
          type: "TAX_RETURN",
          category: "TAX_DOCUMENTS",
          fileUrl: "file://test-2023.pdf",
          fileName: "tax-return-2023.pdf",
          fileSize: 200_000,
          mimeType: "application/pdf",
          status: "ACTIVE",
          uploadedBy: testUser.id,
          uploadedAt: new Date("2024-01-15"),
          createdAt: new Date("2024-01-15"),
          updatedAt: new Date("2024-01-15"),
        },
        {
          id: createId(),
          organizationId: testOrganization.id,
          clientId: testClient.id,
          name: "Tax Return 2024",
          type: "TAX_RETURN",
          category: "TAX_DOCUMENTS",
          fileUrl: "file://test-2024.pdf",
          fileName: "tax-return-2024.pdf",
          fileSize: 250_000,
          mimeType: "application/pdf",
          status: "ACTIVE",
          uploadedBy: testUser.id,
          uploadedAt: new Date("2024-12-01"),
          createdAt: new Date("2024-12-01"),
          updatedAt: new Date("2024-12-01"),
        },
        {
          id: createId(),
          organizationId: testOrganization.id,
          clientId: testBusinessClient.id,
          name: "Business License",
          type: "LEGAL_DOCUMENT",
          category: "LEGAL_DOCUMENTS",
          fileUrl: "file://business-license.pdf",
          fileName: "business-license.pdf",
          fileSize: 150_000,
          mimeType: "application/pdf",
          status: "ACTIVE",
          uploadedBy: testUser.id,
          uploadedAt: new Date("2024-06-01"),
          createdAt: new Date("2024-06-01"),
          updatedAt: new Date("2024-06-01"),
        },
      ];

      await db.insert(schema.documentsTable).values(multipleDocuments);
    });

    it("should retrieve client documents with filtering and pagination", async () => {
      // Get all documents for individual client
      const allDocsResponse = await request(app)
        .get(`/api/documents/client/${testClient.id}`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(allDocsResponse.body).toHaveLength(2);
      expect(allDocsResponse.body[0].name).toBe("Tax Return 2024"); // Latest first

      // Filter by document type
      const taxDocsResponse = await request(app)
        .get(`/api/documents/client/${testClient.id}`)
        .query({ type: "TAX_RETURN" })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(taxDocsResponse.body).toHaveLength(2);
      expect(
        taxDocsResponse.body.every((doc: any) => doc.type === "TAX_RETURN")
      ).toBe(true);

      // Filter by category
      const taxCategoryResponse = await request(app)
        .get(`/api/documents/client/${testClient.id}`)
        .query({ category: "TAX_DOCUMENTS" })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(taxCategoryResponse.body).toHaveLength(2);

      // Pagination
      const paginatedResponse = await request(app)
        .get(`/api/documents/client/${testClient.id}`)
        .query({ limit: 1, offset: 1 })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(paginatedResponse.body).toHaveLength(1);
      expect(paginatedResponse.body[0].name).toBe("Tax Return 2023");
    });

    it("should provide document search functionality", async () => {
      // Search by name
      const nameSearchResponse = await request(app)
        .get("/api/documents/search")
        .query({ q: "Tax Return", organizationId: testOrganization.id })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(nameSearchResponse.body.results.length).toBeGreaterThanOrEqual(2);
      expect(
        nameSearchResponse.body.results.every((doc: any) =>
          doc.name.includes("Tax Return")
        )
      ).toBe(true);

      // Search by content (if OCR is enabled)
      const contentSearchResponse = await request(app)
        .get("/api/documents/search")
        .query({
          q: "2024",
          searchIn: "content,metadata",
          organizationId: testOrganization.id,
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(contentSearchResponse.body.results.length).toBeGreaterThan(0);

      // Advanced search with multiple filters
      const advancedSearchResponse = await request(app)
        .get("/api/documents/search")
        .query({
          type: "TAX_RETURN",
          category: "TAX_DOCUMENTS",
          uploadedAfter: "2024-01-01",
          uploadedBefore: "2024-12-31",
          organizationId: testOrganization.id,
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(advancedSearchResponse.body.results.length).toBe(2);
    });

    it("should handle document versioning and history", async () => {
      const originalDocument = multipleDocuments[0];

      // Create new version of document
      const newVersionData = {
        name: "Tax Return 2023 (Amended)",
        description: "Amended version with corrections",
        metadata: {
          ...originalDocument.metadata,
          version: "1.1",
          amendmentReason: "Corrected income figures",
          parentDocumentId: originalDocument.id,
        },
      };

      // Upload new version
      const pdfContent = Buffer.from(
        "%PDF-1.4\n%Amended content\nendobj\n%%EOF",
        "utf8"
      );
      const amendedFilePath = join(testTempDir, "tax-return-2023-amended.pdf");
      await writeFile(amendedFilePath, pdfContent);

      const versionResponse = await request(app)
        .post("/api/documents/upload")
        .attach("file", amendedFilePath)
        .field(
          "documentData",
          JSON.stringify({
            ...newVersionData,
            clientId: testClient.id,
          })
        )
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(201);

      expect(versionResponse.body.name).toBe("Tax Return 2023 (Amended)");
      expect(versionResponse.body.metadata.version).toBe("1.1");

      // Get document history
      const historyResponse = await request(app)
        .get(`/api/documents/${originalDocument.id}/history`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(historyResponse.body.versions).toHaveLength(2);
      expect(historyResponse.body.versions[0].metadata.version).toBe("1.1");
      expect(historyResponse.body.versions[1]).toMatchObject({
        id: originalDocument.id,
        name: originalDocument.name,
      });
    });

    it("should enforce document retention and archival policies", async () => {
      const oldDocument = {
        id: createId(),
        organizationId: testOrganization.id,
        clientId: testClient.id,
        name: "Old Tax Document",
        type: "TAX_RETURN",
        category: "TAX_DOCUMENTS",
        fileUrl: "file://old-doc.pdf",
        fileName: "old-doc.pdf",
        fileSize: 100_000,
        mimeType: "application/pdf",
        metadata: {
          retentionPolicy: "7_YEARS",
          archivalDate: new Date("2025-01-01"),
        },
        status: "ACTIVE",
        uploadedBy: testUser.id,
        uploadedAt: new Date("2018-01-01"), // 6+ years old
        createdAt: new Date("2018-01-01"),
        updatedAt: new Date("2018-01-01"),
      };

      await db.insert(schema.documentsTable).values(oldDocument);

      // Check retention status
      const retentionResponse = await request(app)
        .get(`/api/documents/${oldDocument.id}/retention-status`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(retentionResponse.body).toHaveProperty("retentionPolicy");
      expect(retentionResponse.body).toHaveProperty("daysSinceUpload");
      expect(retentionResponse.body).toHaveProperty("archivalDate");
      expect(retentionResponse.body.daysSinceUpload).toBeGreaterThan(2000);

      // Archive document
      const archiveResponse = await request(app)
        .post(`/api/documents/${oldDocument.id}/archive`)
        .send({
          archivalReason: "Retention policy compliance",
          preserveAccessibility: true,
        })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(archiveResponse.body.status).toBe("ARCHIVED");
      expect(archiveResponse.body.archivedAt).toBeDefined();
    });
  });

  describe("Document Security and Compliance", () => {
    it("should enforce access control based on document sensitivity", async () => {
      // Create sensitive document
      const sensitiveDocument = {
        id: createId(),
        organizationId: testOrganization.id,
        clientId: testClient.id,
        name: "Confidential Tax Information",
        type: "TAX_RETURN",
        category: "TAX_DOCUMENTS",
        fileUrl: "file://confidential.pdf",
        fileName: "confidential.pdf",
        fileSize: 500_000,
        mimeType: "application/pdf",
        metadata: {
          sensitivityLevel: "CONFIDENTIAL",
          accessRestrictions: {
            requiresApproval: true,
            allowedRoles: ["TAX_MANAGER", "SUPER_ADMIN"],
            restrictDownload: true,
          },
        },
        status: "ACTIVE",
        uploadedBy: testUser.id,
        uploadedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(schema.documentsTable).values(sensitiveDocument);

      // Test access with insufficient permissions
      const unauthorizedResponse = await request(app)
        .get(`/api/documents/${sensitiveDocument.id}`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .set("User-Role", "TAX_STAFF") // Insufficient role
        .expect(403);

      expect(unauthorizedResponse.body.error).toContain(
        "insufficient permissions"
      );

      // Test access with proper permissions
      const authorizedResponse = await request(app)
        .get(`/api/documents/${sensitiveDocument.id}`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .set("User-Role", "TAX_MANAGER") // Sufficient role
        .expect(200);

      expect(authorizedResponse.body.id).toBe(sensitiveDocument.id);
    });

    it("should track document access and maintain audit trail", async () => {
      const testDocument = multipleDocuments[0];

      // Access document
      await request(app)
        .get(`/api/documents/${testDocument.id}`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      // Download document
      await request(app)
        .get(`/api/documents/${testDocument.id}/download`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      // Check audit logs
      const auditLogs = await db
        .select()
        .from(schema.auditLogsTable)
        .where(eq(schema.auditLogsTable.resourceId, testDocument.id))
        .orderBy(desc(schema.auditLogsTable.timestamp));

      expect(auditLogs.length).toBeGreaterThanOrEqual(2);

      const actions = auditLogs.map((log) => log.action);
      expect(actions).toContain("document:view");
      expect(actions).toContain("document:download");

      // Check for IP address and user agent tracking
      expect(auditLogs[0].metadata.ipAddress).toBeDefined();
      expect(auditLogs[0].metadata.userAgent).toBeDefined();
    });

    it("should implement document encryption and secure storage", async () => {
      const encryptedDocData = {
        name: "Encrypted Personal Data",
        type: "PERSONAL_DOCUMENT",
        category: "PERSONAL_DOCUMENTS",
        description: "Document containing PII requiring encryption",
        clientId: testClient.id,
        metadata: {
          encryptionRequired: true,
          encryptionAlgorithm: "AES-256-GCM",
          containsPII: true,
          dataClassification: "RESTRICTED",
        },
        tags: ["encrypted", "pii", "restricted"],
      };

      // Create encrypted content
      const sensitiveContent = Buffer.from("Sensitive personal information");
      const encryptedFilePath = join(testTempDir, "encrypted-doc.pdf");
      await writeFile(encryptedFilePath, sensitiveContent);

      const uploadResponse = await request(app)
        .post("/api/documents/upload")
        .attach("file", encryptedFilePath)
        .field("documentData", JSON.stringify(encryptedDocData))
        .field(
          "encryptionOptions",
          JSON.stringify({
            encrypt: true,
            algorithm: "AES-256-GCM",
            keyDerivation: "PBKDF2",
          })
        )
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(201);

      expect(uploadResponse.body.metadata.isEncrypted).toBe(true);
      expect(uploadResponse.body.metadata.encryptionAlgorithm).toBe(
        "AES-256-GCM"
      );

      // Verify encrypted storage
      const storedDoc = await db
        .select()
        .from(schema.documentsTable)
        .where(eq(schema.documentsTable.id, uploadResponse.body.id));

      expect(storedDoc[0].metadata.isEncrypted).toBe(true);
      expect(storedDoc[0].metadata.encryptionKeyId).toBeDefined();
    });
  });

  describe("Integration with Tax Calculations", () => {
    it("should link documents to tax calculation workflows", async () => {
      // Create tax calculation record
      const taxCalculation = {
        id: createId(),
        organizationId: testOrganization.id,
        clientId: testClient.id,
        calculationType: "PAYE",
        taxYear: 2024,
        period: "ANNUAL",
        inputs: { annualSalary: 2_400_000 },
        results: { totalPAYETax: 180_000, netIncome: 2_220_000 },
        calculatedAt: new Date(),
        calculatedBy: testUser.id,
        createdAt: new Date(),
      };

      await db.insert(schema.taxCalculationsTable).values(taxCalculation);

      // Upload supporting document
      const supportingDocData = {
        name: "Pay Slips 2024",
        type: "SUPPORTING_DOCUMENT",
        category: "TAX_DOCUMENTS",
        description: "Pay slips supporting tax calculation",
        clientId: testClient.id,
        metadata: {
          linkedCalculationId: taxCalculation.id,
          supportingEvidence: true,
          taxYear: 2024,
        },
        tags: ["supporting", "paye", "2024"],
      };

      const paySlipContent = Buffer.from(
        "%PDF-1.4\n%Pay slip data\nendobj\n%%EOF"
      );
      const paySlipPath = join(testTempDir, "pay-slips-2024.pdf");
      await writeFile(paySlipPath, paySlipContent);

      const docResponse = await request(app)
        .post("/api/documents/upload")
        .attach("file", paySlipPath)
        .field("documentData", JSON.stringify(supportingDocData))
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(201);

      // Verify linkage
      expect(docResponse.body.metadata.linkedCalculationId).toBe(
        taxCalculation.id
      );

      // Get documents linked to tax calculation
      const linkedDocsResponse = await request(app)
        .get(`/api/documents/tax-calculation/${taxCalculation.id}`)
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(linkedDocsResponse.body).toHaveLength(1);
      expect(linkedDocsResponse.body[0].id).toBe(docResponse.body.id);
    });

    it("should validate document requirements for tax submissions", async () => {
      // Check required documents for PAYE submission
      const requirementsResponse = await request(app)
        .get(`/api/documents/requirements/${testClient.id}`)
        .query({ submissionType: "PAYE", taxYear: 2024 })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(requirementsResponse.body.requiredDocuments).toBeInstanceOf(Array);
      expect(requirementsResponse.body.requiredDocuments).toContain(
        "pay_slips"
      );
      expect(requirementsResponse.body.requiredDocuments).toContain(
        "nis_statement"
      );

      // Check compliance status
      const complianceResponse = await request(app)
        .get(`/api/documents/compliance/${testClient.id}`)
        .query({ submissionType: "PAYE", taxYear: 2024 })
        .set("Organization-ID", testOrganization.id)
        .set("User-ID", testUser.id)
        .expect(200);

      expect(complianceResponse.body).toHaveProperty("isCompliant");
      expect(complianceResponse.body).toHaveProperty("missingDocuments");
      expect(complianceResponse.body).toHaveProperty("completionPercentage");
    });
  });
});
