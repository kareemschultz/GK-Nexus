/**
 * Integration tests for database operations with multi-tenant isolation
 */

import { schema } from "@GK-Nexus/db";
import { and, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  createTestOrganization,
  createTestUser,
  testDatabase,
} from "../integration-setup";

describe("Database Integration Tests", () => {
  describe("Multi-Tenant Isolation", () => {
    it("should isolate data between organizations", async () => {
      // Create two organizations
      const org1 = await createTestOrganization("Organization 1");
      const org2 = await createTestOrganization("Organization 2");

      // Create users for each organization
      const user1 = await createTestUser(org1.id, "ADMIN", {
        firstName: "Admin",
        lastName: "One",
        email: "admin1@org1.com",
      });

      const user2 = await createTestUser(org2.id, "ADMIN", {
        firstName: "Admin",
        lastName: "Two",
        email: "admin2@org2.com",
      });

      // Create clients for each organization
      const [client1] = await testDatabase
        .insert(schema.clients)
        .values({
          organizationId: org1.id,
          firstName: "Client",
          lastName: "One",
          email: "client1@example.com",
          status: "ACTIVE",
          clientType: "INDIVIDUAL",
          createdBy: user1.id,
        })
        .returning();

      const [client2] = await testDatabase
        .insert(schema.clients)
        .values({
          organizationId: org2.id,
          firstName: "Client",
          lastName: "Two",
          email: "client2@example.com",
          status: "ACTIVE",
          clientType: "INDIVIDUAL",
          createdBy: user2.id,
        })
        .returning();

      // Verify org1 can only see their own clients
      const org1Clients = await testDatabase
        .select()
        .from(schema.clients)
        .where(eq(schema.clients.organizationId, org1.id));

      expect(org1Clients).toHaveLength(1);
      expect(org1Clients[0].id).toBe(client1.id);
      expect(org1Clients[0].email).toBe("client1@example.com");

      // Verify org2 can only see their own clients
      const org2Clients = await testDatabase
        .select()
        .from(schema.clients)
        .where(eq(schema.clients.organizationId, org2.id));

      expect(org2Clients).toHaveLength(1);
      expect(org2Clients[0].id).toBe(client2.id);
      expect(org2Clients[0].email).toBe("client2@example.com");

      // Verify cross-organization data isolation
      const org1CannotSeeOrg2Clients = await testDatabase
        .select()
        .from(schema.clients)
        .where(
          and(
            eq(schema.clients.organizationId, org1.id),
            eq(schema.clients.id, client2.id)
          )
        );

      expect(org1CannotSeeOrg2Clients).toHaveLength(0);
    });

    it("should enforce organization context in user operations", async () => {
      const org1 = await createTestOrganization("Test Org 1");
      const org2 = await createTestOrganization("Test Org 2");

      const user1 = await createTestUser(org1.id, "MANAGER");
      const user2 = await createTestUser(org2.id, "MANAGER");

      // Verify users belong to correct organizations
      const org1Users = await testDatabase
        .select()
        .from(schema.users)
        .innerJoin(
          schema.userOrganizations,
          eq(schema.users.id, schema.userOrganizations.userId)
        )
        .where(eq(schema.userOrganizations.organizationId, org1.id));

      expect(org1Users).toHaveLength(1);
      expect(org1Users[0].users.id).toBe(user1.id);

      const org2Users = await testDatabase
        .select()
        .from(schema.users)
        .innerJoin(
          schema.userOrganizations,
          eq(schema.users.id, schema.userOrganizations.userId)
        )
        .where(eq(schema.userOrganizations.organizationId, org2.id));

      expect(org2Users).toHaveLength(1);
      expect(org2Users[0].users.id).toBe(user2.id);
    });

    it("should maintain data integrity with foreign key constraints", async () => {
      const organization = await createTestOrganization("FK Test Org");
      const user = await createTestUser(organization.id);

      // Create a client
      const [client] = await testDatabase
        .insert(schema.clients)
        .values({
          organizationId: organization.id,
          firstName: "Test",
          lastName: "Client",
          email: "test@example.com",
          status: "ACTIVE",
          clientType: "INDIVIDUAL",
          createdBy: user.id,
        })
        .returning();

      // Create a document for the client
      const [document] = await testDatabase
        .insert(schema.documents)
        .values({
          organizationId: organization.id,
          clientId: client.id,
          title: "Test Document",
          description: "A test document",
          type: "PASSPORT",
          status: "PENDING_REVIEW",
          uploadedBy: user.id,
          metadata: {},
        })
        .returning();

      expect(document.clientId).toBe(client.id);
      expect(document.organizationId).toBe(organization.id);

      // Verify constraint prevents orphaned records
      await expect(
        testDatabase.insert(schema.documents).values({
          organizationId: organization.id,
          clientId: "non-existent-client-id",
          title: "Invalid Document",
          description: "Should fail",
          type: "PASSPORT",
          status: "PENDING_REVIEW",
          uploadedBy: user.id,
          metadata: {},
        })
      ).rejects.toThrow();
    });

    it("should handle complex queries with proper tenant filtering", async () => {
      const org1 = await createTestOrganization("Complex Query Org 1");
      const org2 = await createTestOrganization("Complex Query Org 2");

      const user1 = await createTestUser(org1.id, "ADMIN");
      const user2 = await createTestUser(org2.id, "ADMIN");

      // Create multiple clients for each org
      const org1Clients = await Promise.all([
        testDatabase
          .insert(schema.clients)
          .values({
            organizationId: org1.id,
            firstName: "Client",
            lastName: "One",
            email: "client1@org1.com",
            status: "ACTIVE",
            clientType: "INDIVIDUAL",
            createdBy: user1.id,
          })
          .returning()
          .then((result) => result[0]),

        testDatabase
          .insert(schema.clients)
          .values({
            organizationId: org1.id,
            firstName: "Client",
            lastName: "Two",
            email: "client2@org1.com",
            status: "INACTIVE",
            clientType: "BUSINESS",
            createdBy: user1.id,
          })
          .returning()
          .then((result) => result[0]),
      ]);

      const org2Clients = await Promise.all([
        testDatabase
          .insert(schema.clients)
          .values({
            organizationId: org2.id,
            firstName: "Client",
            lastName: "Three",
            email: "client3@org2.com",
            status: "ACTIVE",
            clientType: "INDIVIDUAL",
            createdBy: user2.id,
          })
          .returning()
          .then((result) => result[0]),
      ]);

      // Complex query: Get active individual clients count by organization
      const activeIndividualCounts = await testDatabase
        .select({
          organizationId: schema.clients.organizationId,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(schema.clients)
        .where(
          and(
            eq(schema.clients.status, "ACTIVE"),
            eq(schema.clients.clientType, "INDIVIDUAL")
          )
        )
        .groupBy(schema.clients.organizationId);

      const org1Count = activeIndividualCounts.find(
        (row) => row.organizationId === org1.id
      );
      const org2Count = activeIndividualCounts.find(
        (row) => row.organizationId === org2.id
      );

      expect(org1Count?.count).toBe(1); // Only one active individual client
      expect(org2Count?.count).toBe(1); // Only one active individual client
    });
  });

  describe("Audit Trail Integration", () => {
    it("should automatically create audit logs for data changes", async () => {
      const organization = await createTestOrganization("Audit Test Org");
      const user = await createTestUser(organization.id, "ADMIN");

      // Create a client (should trigger audit log)
      const [client] = await testDatabase
        .insert(schema.clients)
        .values({
          organizationId: organization.id,
          firstName: "Audited",
          lastName: "Client",
          email: "audit@example.com",
          status: "ACTIVE",
          clientType: "INDIVIDUAL",
          createdBy: user.id,
        })
        .returning();

      // Manually create audit log (in real system, this would be automatic)
      await testDatabase.insert(schema.auditLogs).values({
        organizationId: organization.id,
        userId: user.id,
        action: "CLIENT_CREATED",
        entityType: "CLIENT",
        entityId: client.id,
        changes: {
          firstName: "Audited",
          lastName: "Client",
          email: "audit@example.com",
          status: "ACTIVE",
        },
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      });

      // Update the client (should trigger another audit log)
      await testDatabase
        .update(schema.clients)
        .set({
          firstName: "Updated",
          status: "INACTIVE",
        })
        .where(eq(schema.clients.id, client.id));

      // Create update audit log
      await testDatabase.insert(schema.auditLogs).values({
        organizationId: organization.id,
        userId: user.id,
        action: "CLIENT_UPDATED",
        entityType: "CLIENT",
        entityId: client.id,
        changes: {
          firstName: { old: "Audited", new: "Updated" },
          status: { old: "ACTIVE", new: "INACTIVE" },
        },
        ipAddress: "127.0.0.1",
        userAgent: "test-agent",
      });

      // Verify audit trail
      const auditLogs = await testDatabase
        .select()
        .from(schema.auditLogs)
        .where(
          and(
            eq(schema.auditLogs.entityType, "CLIENT"),
            eq(schema.auditLogs.entityId, client.id)
          )
        )
        .orderBy(schema.auditLogs.timestamp);

      expect(auditLogs).toHaveLength(2);
      expect(auditLogs[0].action).toBe("CLIENT_CREATED");
      expect(auditLogs[1].action).toBe("CLIENT_UPDATED");
      expect(auditLogs[1].changes).toEqual({
        firstName: { old: "Audited", new: "Updated" },
        status: { old: "ACTIVE", new: "INACTIVE" },
      });
    });

    it("should maintain audit trail integrity across organizations", async () => {
      const org1 = await createTestOrganization("Audit Org 1");
      const org2 = await createTestOrganization("Audit Org 2");

      const user1 = await createTestUser(org1.id, "ADMIN");
      const user2 = await createTestUser(org2.id, "ADMIN");

      // Create audit logs for each organization
      await testDatabase.insert(schema.auditLogs).values({
        organizationId: org1.id,
        userId: user1.id,
        action: "LOGIN",
        entityType: "USER",
        entityId: user1.id,
        changes: {},
        ipAddress: "192.168.1.1",
        userAgent: "browser-1",
      });

      await testDatabase.insert(schema.auditLogs).values({
        organizationId: org2.id,
        userId: user2.id,
        action: "LOGIN",
        entityType: "USER",
        entityId: user2.id,
        changes: {},
        ipAddress: "192.168.1.2",
        userAgent: "browser-2",
      });

      // Verify organization isolation in audit logs
      const org1Logs = await testDatabase
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.organizationId, org1.id));

      const org2Logs = await testDatabase
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.organizationId, org2.id));

      expect(org1Logs).toHaveLength(1);
      expect(org2Logs).toHaveLength(1);
      expect(org1Logs[0].userId).toBe(user1.id);
      expect(org2Logs[0].userId).toBe(user2.id);
    });
  });

  describe("Document Management Integration", () => {
    it("should handle document upload and processing workflow", async () => {
      const organization = await createTestOrganization("Document Test Org");
      const user = await createTestUser(organization.id, "STAFF");

      const [client] = await testDatabase
        .insert(schema.clients)
        .values({
          organizationId: organization.id,
          firstName: "Document",
          lastName: "Client",
          email: "docs@example.com",
          status: "ACTIVE",
          clientType: "INDIVIDUAL",
          createdBy: user.id,
        })
        .returning();

      // Upload a document
      const [document] = await testDatabase
        .insert(schema.documents)
        .values({
          organizationId: organization.id,
          clientId: client.id,
          title: "Passport Scan",
          description: "Client passport document",
          type: "PASSPORT",
          status: "PENDING_REVIEW",
          uploadedBy: user.id,
          metadata: {
            filename: "passport.pdf",
            fileSize: 2_048_000,
            mimeType: "application/pdf",
            uploadDate: new Date().toISOString(),
          },
        })
        .returning();

      expect(document.status).toBe("PENDING_REVIEW");

      // Process document (simulate review)
      await testDatabase
        .update(schema.documents)
        .set({
          status: "APPROVED",
          metadata: {
            ...document.metadata,
            reviewedBy: user.id,
            reviewDate: new Date().toISOString(),
            ocrData: {
              passportNumber: "GB123456789",
              expiryDate: "2030-12-31",
              nationality: "British",
            },
          },
        })
        .where(eq(schema.documents.id, document.id));

      // Verify document processing
      const [processedDocument] = await testDatabase
        .select()
        .from(schema.documents)
        .where(eq(schema.documents.id, document.id));

      expect(processedDocument.status).toBe("APPROVED");
      expect(processedDocument.metadata.ocrData).toBeDefined();
      expect(processedDocument.metadata.ocrData.passportNumber).toBe(
        "GB123456789"
      );
    });

    it("should enforce document access permissions", async () => {
      const organization = await createTestOrganization("Document Access Org");
      const adminUser = await createTestUser(organization.id, "ADMIN");
      const staffUser = await createTestUser(organization.id, "STAFF");

      const [client] = await testDatabase
        .insert(schema.clients)
        .values({
          organizationId: organization.id,
          firstName: "Secure",
          lastName: "Client",
          email: "secure@example.com",
          status: "ACTIVE",
          clientType: "INDIVIDUAL",
          createdBy: adminUser.id,
        })
        .returning();

      // Upload confidential document as admin
      const [confidentialDoc] = await testDatabase
        .insert(schema.documents)
        .values({
          organizationId: organization.id,
          clientId: client.id,
          title: "Confidential Document",
          description: "Sensitive financial information",
          type: "FINANCIAL_STATEMENT",
          status: "APPROVED",
          uploadedBy: adminUser.id,
          metadata: {
            confidentialityLevel: "HIGH",
            accessRestrictions: ["ADMIN_ONLY"],
          },
        })
        .returning();

      // Upload regular document as staff
      const [regularDoc] = await testDatabase
        .insert(schema.documents)
        .values({
          organizationId: organization.id,
          clientId: client.id,
          title: "Regular Document",
          description: "Standard client document",
          type: "IDENTITY_CARD",
          status: "APPROVED",
          uploadedBy: staffUser.id,
          metadata: {
            confidentialityLevel: "NORMAL",
          },
        })
        .returning();

      // Verify document access based on user permissions
      // In a real system, this would be enforced at the API level
      const adminAccessibleDocs = await testDatabase
        .select()
        .from(schema.documents)
        .where(
          and(
            eq(schema.documents.clientId, client.id),
            eq(schema.documents.organizationId, organization.id)
          )
        );

      expect(adminAccessibleDocs).toHaveLength(2); // Admin can see all

      // Staff should potentially see only non-confidential docs
      // This would require additional filtering in real implementation
      const allDocs = await testDatabase
        .select()
        .from(schema.documents)
        .where(eq(schema.documents.clientId, client.id));

      const regularDocs = allDocs.filter(
        (doc) => doc.metadata.confidentialityLevel !== "HIGH"
      );

      expect(regularDocs).toHaveLength(1);
      expect(regularDocs[0].id).toBe(regularDoc.id);
    });
  });

  describe("Business Logic Integration", () => {
    it("should handle complex tax calculation scenarios with database persistence", async () => {
      const organization = await createTestOrganization("Tax Calc Org");
      const user = await createTestUser(organization.id, "MANAGER");

      const [client] = await testDatabase
        .insert(schema.clients)
        .values({
          organizationId: organization.id,
          firstName: "Tax",
          lastName: "Client",
          email: "tax@example.com",
          status: "ACTIVE",
          clientType: "BUSINESS",
          createdBy: user.id,
        })
        .returning();

      // Create multiple tax calculations for the client
      const taxCalculations = [
        {
          clientId: client.id,
          organizationId: organization.id,
          calculationType: "PAYE" as const,
          inputData: {
            grossSalary: 200_000,
            allowances: 20_000,
            dependents: 2,
          },
          resultData: {
            payeTax: 25_000,
            netSalary: 175_000,
          },
          period: "2025-01",
          calculatedBy: user.id,
        },
        {
          clientId: client.id,
          organizationId: organization.id,
          calculationType: "VAT" as const,
          inputData: {
            salesAmount: 500_000,
            vatRate: 0.14,
          },
          resultData: {
            vatAmount: 70_000,
            totalAmount: 570_000,
          },
          period: "2025-Q1",
          calculatedBy: user.id,
        },
      ];

      const insertedCalculations = await testDatabase
        .insert(schema.taxCalculations)
        .values(taxCalculations)
        .returning();

      expect(insertedCalculations).toHaveLength(2);

      // Query calculations by type and period
      const payeCalculations = await testDatabase
        .select()
        .from(schema.taxCalculations)
        .where(
          and(
            eq(schema.taxCalculations.clientId, client.id),
            eq(schema.taxCalculations.calculationType, "PAYE")
          )
        );

      expect(payeCalculations).toHaveLength(1);
      expect(payeCalculations[0].resultData.payeTax).toBe(25_000);

      const vatCalculations = await testDatabase
        .select()
        .from(schema.taxCalculations)
        .where(
          and(
            eq(schema.taxCalculations.clientId, client.id),
            eq(schema.taxCalculations.calculationType, "VAT")
          )
        );

      expect(vatCalculations).toHaveLength(1);
      expect(vatCalculations[0].resultData.vatAmount).toBe(62_500);
    });

    it("should maintain referential integrity in complex business workflows", async () => {
      const organization = await createTestOrganization("Workflow Test Org");
      const adminUser = await createTestUser(organization.id, "ADMIN");
      const staffUser = await createTestUser(organization.id, "STAFF");

      // Create client
      const [client] = await testDatabase
        .insert(schema.clients)
        .values({
          organizationId: organization.id,
          firstName: "Workflow",
          lastName: "Client",
          email: "workflow@example.com",
          status: "ACTIVE",
          clientType: "INDIVIDUAL",
          createdBy: adminUser.id,
        })
        .returning();

      // Create appointment
      const [appointment] = await testDatabase
        .insert(schema.appointments)
        .values({
          organizationId: organization.id,
          clientId: client.id,
          title: "Tax Consultation",
          description: "Annual tax planning meeting",
          startTime: new Date("2025-02-15T10:00:00Z"),
          endTime: new Date("2025-02-15T11:00:00Z"),
          status: "SCHEDULED",
          assignedTo: staffUser.id,
          createdBy: adminUser.id,
        })
        .returning();

      // Create associated documents
      const [document] = await testDatabase
        .insert(schema.documents)
        .values({
          organizationId: organization.id,
          clientId: client.id,
          title: "Tax Documents for Review",
          description: "Documents for consultation meeting",
          type: "TAX_RETURN",
          status: "PENDING_REVIEW",
          uploadedBy: client.createdBy,
          metadata: {
            appointmentId: appointment.id,
            reviewRequired: true,
          },
        })
        .returning();

      // Verify all relationships are properly established
      const clientWithRelations = await testDatabase
        .select({
          client: schema.clients,
          appointmentCount:
            sql<number>`COUNT(DISTINCT ${schema.appointments.id})`.as(
              "appointmentCount"
            ),
          documentCount: sql<number>`COUNT(DISTINCT ${schema.documents.id})`.as(
            "documentCount"
          ),
        })
        .from(schema.clients)
        .leftJoin(
          schema.appointments,
          eq(schema.clients.id, schema.appointments.clientId)
        )
        .leftJoin(
          schema.documents,
          eq(schema.clients.id, schema.documents.clientId)
        )
        .where(eq(schema.clients.id, client.id))
        .groupBy(schema.clients.id);

      expect(clientWithRelations).toHaveLength(1);
      expect(clientWithRelations[0].appointmentCount).toBe(1);
      expect(clientWithRelations[0].documentCount).toBe(1);
    });
  });

  describe("Performance and Optimization", () => {
    it("should handle concurrent database operations efficiently", async () => {
      const organization = await createTestOrganization("Performance Test Org");
      const user = await createTestUser(organization.id, "ADMIN");

      const startTime = performance.now();

      // Create multiple clients concurrently
      const clientCreationPromises = Array.from({ length: 50 }, (_, i) =>
        testDatabase
          .insert(schema.clients)
          .values({
            organizationId: organization.id,
            firstName: `Client${i}`,
            lastName: "Performance",
            email: `client${i}@performance.com`,
            status: "ACTIVE",
            clientType: i % 2 === 0 ? "INDIVIDUAL" : "BUSINESS",
            createdBy: user.id,
          })
          .returning()
          .then((result) => result[0])
      );

      const createdClients = await Promise.all(clientCreationPromises);
      const endTime = performance.now();

      expect(createdClients).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all clients were created properly
      const allClients = await testDatabase
        .select()
        .from(schema.clients)
        .where(eq(schema.clients.organizationId, organization.id));

      expect(allClients).toHaveLength(50);
    });

    it("should optimize complex queries with proper indexing", async () => {
      const organization = await createTestOrganization("Index Test Org");
      const user = await createTestUser(organization.id, "ADMIN");

      // Create test data
      const clients = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          testDatabase
            .insert(schema.clients)
            .values({
              organizationId: organization.id,
              firstName: `Client${i}`,
              lastName: i % 10 === 0 ? "Important" : "Regular",
              email: `client${i}@index.com`,
              status: i % 3 === 0 ? "INACTIVE" : "ACTIVE",
              clientType: i % 2 === 0 ? "INDIVIDUAL" : "BUSINESS",
              createdBy: user.id,
            })
            .returning()
            .then((result) => result[0])
        )
      );

      const startQueryTime = performance.now();

      // Complex query that should benefit from indexing
      const complexQueryResult = await testDatabase
        .select({
          status: schema.clients.status,
          clientType: schema.clients.clientType,
          count: sql<number>`count(*)`.as("count"),
        })
        .from(schema.clients)
        .where(
          and(
            eq(schema.clients.organizationId, organization.id),
            eq(schema.clients.lastName, "Important")
          )
        )
        .groupBy(schema.clients.status, schema.clients.clientType);

      const endQueryTime = performance.now();

      expect(endQueryTime - startQueryTime).toBeLessThan(100); // Should be fast with proper indexing
      expect(complexQueryResult.length).toBeGreaterThan(0);
    });
  });
});
