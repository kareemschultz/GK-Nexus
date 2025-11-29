import { clientsSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, requirePermission } from "../index";
import {
  bulkClientActionSchema,
  clientQuerySchema,
  clientWizardStep1Schema,
  clientWizardStep2Schema,
  clientWizardStep3Schema,
  clientWizardStep4Schema,
  createClientContactSchema,
  createClientSchema,
  createClientServiceSchema,
  updateClientContactSchema,
  updateClientSchema,
  updateClientServiceSchema,
} from "../schemas";

// Helper function to generate client number
function generateClientNumber(): string {
  const prefix = "GK";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(4).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

export const clientsRouter = {
  // Immigration Workflow Management

  // Get immigration status workflow for client
  getImmigrationStatus: protectedProcedure
    .use(requirePermission("clients.read"))
    .input(z.object({ clientId: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { clientId } = input;

      try {
        const [immigrationRecord] = await db
          .select({
            id: clientsSchema.immigrationStatus.id,
            currentStatus: clientsSchema.immigrationStatus.currentStatus,
            visaType: clientsSchema.immigrationStatus.visaType,
            applicationDate: clientsSchema.immigrationStatus.applicationDate,
            expiryDate: clientsSchema.immigrationStatus.expiryDate,
            documents: clientsSchema.immigrationStatus.documents,
            notes: clientsSchema.immigrationStatus.notes,
            nextAction: clientsSchema.immigrationStatus.nextAction,
            nextActionDate: clientsSchema.immigrationStatus.nextActionDate,
            assignedOfficer: clientsSchema.immigrationStatus.assignedOfficer,
            createdAt: clientsSchema.immigrationStatus.createdAt,
            updatedAt: clientsSchema.immigrationStatus.updatedAt,
          })
          .from(clientsSchema.immigrationStatus)
          .where(eq(clientsSchema.immigrationStatus.clientId, clientId))
          .limit(1);

        if (!immigrationRecord) {
          return {
            success: true,
            data: null,
            message: "No immigration record found for this client",
          };
        }

        // Parse JSON fields
        const parsedRecord = {
          ...immigrationRecord,
          documents: immigrationRecord.documents
            ? JSON.parse(immigrationRecord.documents)
            : [],
          notes: immigrationRecord.notes
            ? JSON.parse(immigrationRecord.notes)
            : [],
        };

        // Calculate status timeline and progress
        const statusTimeline = await db
          .select({
            status: clientsSchema.immigrationStatusHistory.status,
            changedAt: clientsSchema.immigrationStatusHistory.changedAt,
            changedBy: clientsSchema.immigrationStatusHistory.changedBy,
            notes: clientsSchema.immigrationStatusHistory.notes,
          })
          .from(clientsSchema.immigrationStatusHistory)
          .where(eq(clientsSchema.immigrationStatusHistory.clientId, clientId))
          .orderBy(desc(clientsSchema.immigrationStatusHistory.changedAt));

        return {
          success: true,
          data: {
            ...parsedRecord,
            timeline: statusTimeline,
            daysUntilExpiry: immigrationRecord.expiryDate
              ? Math.ceil(
                  (new Date(immigrationRecord.expiryDate).getTime() -
                    Date.now()) /
                    (1000 * 60 * 60 * 24)
                )
              : null,
          },
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to retrieve immigration status"
        );
      }
    }),

  // Update immigration status
  updateImmigrationStatus: protectedProcedure
    .use(requirePermission("clients.update"))
    .input(
      z.object({
        clientId: z.string().uuid(),
        status: z.enum([
          "APPLICATION_SUBMITTED",
          "UNDER_REVIEW",
          "ADDITIONAL_DOCS_REQUESTED",
          "INTERVIEW_SCHEDULED",
          "APPROVED",
          "REJECTED",
          "APPEAL_IN_PROGRESS",
          "VISA_ISSUED",
          "RENEWAL_REQUIRED",
          "EXPIRED",
        ]),
        visaType: z
          .enum([
            "WORK_PERMIT",
            "STUDENT_VISA",
            "BUSINESS_VISA",
            "INVESTOR_VISA",
            "FAMILY_REUNIFICATION",
            "PERMANENT_RESIDENCE",
            "CITIZENSHIP",
            "OTHER",
          ])
          .optional(),
        expiryDate: z.string().datetime().optional(),
        nextAction: z.string().max(500).optional(),
        nextActionDate: z.string().datetime().optional(),
        notes: z.string().max(1000).optional(),
        documentsRequired: z.array(z.string()).optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { clientId, status, notes, ...updateData } = input;

      try {
        // Check if immigration record exists
        const [existingRecord] = await db
          .select({ id: clientsSchema.immigrationStatus.id })
          .from(clientsSchema.immigrationStatus)
          .where(eq(clientsSchema.immigrationStatus.clientId, clientId))
          .limit(1);

        let immigrationRecord;

        if (existingRecord) {
          // Update existing record
          [immigrationRecord] = await db
            .update(clientsSchema.immigrationStatus)
            .set({
              currentStatus: status,
              ...updateData,
              updatedBy: user?.id,
            })
            .where(eq(clientsSchema.immigrationStatus.id, existingRecord.id))
            .returning();
        } else {
          // Create new record
          [immigrationRecord] = await db
            .insert(clientsSchema.immigrationStatus)
            .values({
              clientId,
              currentStatus: status,
              ...updateData,
              createdBy: user?.id,
              updatedBy: user?.id,
            })
            .returning();
        }

        // Add to status history
        await db.insert(clientsSchema.immigrationStatusHistory).values({
          clientId,
          status,
          changedBy: user?.id!,
          notes: notes || null,
        });

        return {
          success: true,
          data: immigrationRecord,
          message: "Immigration status updated successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to update immigration status"
        );
      }
    }),

  // Submit required documents for immigration
  submitImmigrationDocuments: protectedProcedure
    .use(requirePermission("clients.update"))
    .input(
      z.object({
        clientId: z.string().uuid(),
        documents: z.array(
          z.object({
            documentId: z.string().uuid(),
            documentType: z.enum([
              "PASSPORT",
              "BIRTH_CERTIFICATE",
              "MARRIAGE_CERTIFICATE",
              "EDUCATIONAL_CREDENTIALS",
              "EMPLOYMENT_LETTER",
              "FINANCIAL_STATEMENTS",
              "MEDICAL_EXAMINATION",
              "POLICE_CLEARANCE",
              "SPONSOR_DOCUMENTS",
              "OTHER",
            ]),
            isRequired: z.boolean(),
            submittedAt: z.string().datetime().optional(),
            notes: z.string().max(500).optional(),
          })
        ),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { clientId, documents } = input;

      try {
        // Update immigration status with submitted documents
        const [immigrationRecord] = await db
          .select({ documents: clientsSchema.immigrationStatus.documents })
          .from(clientsSchema.immigrationStatus)
          .where(eq(clientsSchema.immigrationStatus.clientId, clientId))
          .limit(1);

        const existingDocs = immigrationRecord?.documents
          ? JSON.parse(immigrationRecord.documents)
          : [];

        // Merge with existing documents
        const updatedDocs = [...existingDocs, ...documents];

        await db
          .update(clientsSchema.immigrationStatus)
          .set({
            documents: JSON.stringify(updatedDocs),
            updatedBy: user?.id,
          })
          .where(eq(clientsSchema.immigrationStatus.clientId, clientId));

        // Add status history entry
        await db.insert(clientsSchema.immigrationStatusHistory).values({
          clientId,
          status: "DOCUMENTS_SUBMITTED",
          changedBy: user?.id!,
          notes: `Submitted ${documents.length} document(s)`,
        });

        return {
          success: true,
          data: {
            documentsSubmitted: documents.length,
            totalDocuments: updatedDocs.length,
          },
          message: "Immigration documents submitted successfully",
        };
      } catch (error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to submit immigration documents"
        );
      }
    }),

  // Get immigration workflow templates
  getImmigrationWorkflowTemplates: protectedProcedure
    .use(requirePermission("clients.read"))
    .input(
      z.object({
        visaType: z
          .enum([
            "WORK_PERMIT",
            "STUDENT_VISA",
            "BUSINESS_VISA",
            "INVESTOR_VISA",
            "FAMILY_REUNIFICATION",
            "PERMANENT_RESIDENCE",
            "CITIZENSHIP",
            "OTHER",
          ])
          .optional(),
      })
    )
    .handler(async ({ input }) => {
      const { visaType } = input;

      const templates = {
        WORK_PERMIT: {
          name: "Work Permit Application",
          requiredDocuments: [
            "PASSPORT",
            "EDUCATIONAL_CREDENTIALS",
            "EMPLOYMENT_LETTER",
            "MEDICAL_EXAMINATION",
            "POLICE_CLEARANCE",
          ],
          workflow: [
            { step: 1, name: "Document Collection", estimatedDays: 14 },
            { step: 2, name: "Application Submission", estimatedDays: 1 },
            { step: 3, name: "Initial Review", estimatedDays: 30 },
            { step: 4, name: "Interview (if required)", estimatedDays: 14 },
            { step: 5, name: "Decision", estimatedDays: 30 },
            { step: 6, name: "Visa Issuance", estimatedDays: 7 },
          ],
          totalEstimatedDays: 96,
          fees: {
            applicationFee: 50_000, // GYD
            processingFee: 25_000, // GYD
            consultationFee: 15_000, // GYD
          },
        },
        STUDENT_VISA: {
          name: "Student Visa Application",
          requiredDocuments: [
            "PASSPORT",
            "EDUCATIONAL_CREDENTIALS",
            "FINANCIAL_STATEMENTS",
            "MEDICAL_EXAMINATION",
            "SPONSOR_DOCUMENTS",
          ],
          workflow: [
            { step: 1, name: "Document Collection", estimatedDays: 21 },
            { step: 2, name: "Application Submission", estimatedDays: 1 },
            { step: 3, name: "Initial Review", estimatedDays: 21 },
            { step: 4, name: "Financial Verification", estimatedDays: 14 },
            { step: 5, name: "Decision", estimatedDays: 21 },
            { step: 6, name: "Visa Issuance", estimatedDays: 7 },
          ],
          totalEstimatedDays: 85,
          fees: {
            applicationFee: 35_000, // GYD
            processingFee: 20_000, // GYD
            consultationFee: 10_000, // GYD
          },
        },
        BUSINESS_VISA: {
          name: "Business Visa Application",
          requiredDocuments: [
            "PASSPORT",
            "FINANCIAL_STATEMENTS",
            "EMPLOYMENT_LETTER",
            "MEDICAL_EXAMINATION",
            "POLICE_CLEARANCE",
          ],
          workflow: [
            { step: 1, name: "Document Collection", estimatedDays: 14 },
            { step: 2, name: "Business Plan Review", estimatedDays: 7 },
            { step: 3, name: "Application Submission", estimatedDays: 1 },
            { step: 4, name: "Initial Review", estimatedDays: 30 },
            { step: 5, name: "Interview", estimatedDays: 14 },
            { step: 6, name: "Decision", estimatedDays: 21 },
            { step: 7, name: "Visa Issuance", estimatedDays: 7 },
          ],
          totalEstimatedDays: 94,
          fees: {
            applicationFee: 75_000, // GYD
            processingFee: 30_000, // GYD
            consultationFee: 20_000, // GYD
          },
        },
      };

      if (visaType && templates[visaType]) {
        return {
          success: true,
          data: templates[visaType],
        };
      }

      return {
        success: true,
        data: templates,
      };
    }),
  // Core Client Management

  // Get all clients with filtering and pagination
  list: protectedProcedure
    .use(requirePermission("clients.read"))
    .input(clientQuerySchema)
    .handler(async ({ input, context }) => {
      const {
        page,
        limit,
        search,
        entityType,
        status,
        complianceStatus,
        riskLevel,
        assignedAccountant,
        assignedManager,
        tags,
        sortBy,
        sortOrder,
      } = input;

      const { db } = context;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [eq(clientsSchema.clients.isActive, true)];

      if (search) {
        conditions.push(
          sql`(
            ${ilike(clientsSchema.clients.name, `%${search}%`)} OR
            ${ilike(clientsSchema.clients.clientNumber, `%${search}%`)} OR
            ${ilike(clientsSchema.clients.email, `%${search}%`)} OR
            ${ilike(clientsSchema.clients.taxIdNumber, `%${search}%`)}
          )`
        );
      }

      if (entityType) {
        conditions.push(eq(clientsSchema.clients.entityType, entityType));
      }

      if (status) {
        conditions.push(eq(clientsSchema.clients.status, status));
      }

      if (complianceStatus) {
        conditions.push(
          eq(clientsSchema.clients.complianceStatus, complianceStatus)
        );
      }

      if (riskLevel) {
        conditions.push(eq(clientsSchema.clients.riskLevel, riskLevel));
      }

      if (assignedAccountant) {
        conditions.push(
          eq(clientsSchema.clients.assignedAccountant, assignedAccountant)
        );
      }

      if (assignedManager) {
        conditions.push(
          eq(clientsSchema.clients.assignedManager, assignedManager)
        );
      }

      if (tags) {
        conditions.push(
          sql`${clientsSchema.clients.tags}::text LIKE ${`%"${tags}"%`}`
        );
      }

      const whereClause = and(...conditions);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(clientsSchema.clients)
        .where(whereClause);

      // Get clients with sorting
      const sortColumn =
        clientsSchema.clients[sortBy as keyof typeof clientsSchema.clients];
      const orderClause =
        sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      const clients = await db
        .select({
          id: clientsSchema.clients.id,
          clientNumber: clientsSchema.clients.clientNumber,
          name: clientsSchema.clients.name,
          entityType: clientsSchema.clients.entityType,
          status: clientsSchema.clients.status,
          complianceStatus: clientsSchema.clients.complianceStatus,
          riskLevel: clientsSchema.clients.riskLevel,
          email: clientsSchema.clients.email,
          phoneNumber: clientsSchema.clients.phoneNumber,
          assignedAccountant: clientsSchema.clients.assignedAccountant,
          assignedManager: clientsSchema.clients.assignedManager,
          clientSince: clientsSchema.clients.clientSince,
          createdAt: clientsSchema.clients.createdAt,
          updatedAt: clientsSchema.clients.updatedAt,
        })
        .from(clientsSchema.clients)
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset);

      const total = totalResult.count;
      const pages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          items: clients,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        },
      };
    }),

  // Get client by ID
  getById: protectedProcedure
    .use(requirePermission("clients.read"))
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id } = input;

      const [client] = await db
        .select()
        .from(clientsSchema.clients)
        .where(
          and(
            eq(clientsSchema.clients.id, id),
            eq(clientsSchema.clients.isActive, true)
          )
        )
        .limit(1);

      if (!client) {
        throw new ORPCError("NOT_FOUND", "Client not found");
      }

      return {
        success: true,
        data: client,
      };
    }),

  // Create new client
  create: protectedProcedure
    .use(requirePermission("clients.create"))
    .input(createClientSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const clientData = {
        ...input,
        id: nanoid(),
        clientNumber: generateClientNumber(),
        clientSince: new Date(),
        createdBy: user?.id,
        updatedBy: user?.id,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        customFields: input.customFields
          ? JSON.stringify(input.customFields)
          : null,
      };

      const [newClient] = await db
        .insert(clientsSchema.clients)
        .values(clientData)
        .returning();

      return {
        success: true,
        data: newClient,
        message: "Client created successfully",
      };
    }),

  // Update client
  update: protectedProcedure
    .use(requirePermission("clients.update"))
    .input(z.object({ id: z.string().min(1), data: updateClientSchema }))
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { id, data } = input;

      // Check if client exists
      const [existingClient] = await db
        .select()
        .from(clientsSchema.clients)
        .where(
          and(
            eq(clientsSchema.clients.id, id),
            eq(clientsSchema.clients.isActive, true)
          )
        )
        .limit(1);

      if (!existingClient) {
        throw new ORPCError("NOT_FOUND", "Client not found");
      }

      const updateData = {
        ...data,
        updatedBy: user?.id,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
        customFields: data.customFields
          ? JSON.stringify(data.customFields)
          : undefined,
      };

      const [updatedClient] = await db
        .update(clientsSchema.clients)
        .set(updateData)
        .where(eq(clientsSchema.clients.id, id))
        .returning();

      return {
        success: true,
        data: updatedClient,
        message: "Client updated successfully",
      };
    }),

  // Delete client (soft delete)
  delete: protectedProcedure
    .use(requirePermission("clients.delete"))
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { id } = input;

      const [deletedClient] = await db
        .update(clientsSchema.clients)
        .set({
          isActive: false,
          updatedBy: user?.id,
        })
        .where(
          and(
            eq(clientsSchema.clients.id, id),
            eq(clientsSchema.clients.isActive, true)
          )
        )
        .returning();

      if (!deletedClient) {
        throw new ORPCError("NOT_FOUND", "Client not found");
      }

      return {
        success: true,
        message: "Client deleted successfully",
      };
    }),

  // Client wizard endpoints
  wizard: {
    step1: protectedProcedure
      .use(requirePermission("clients.create"))
      .input(clientWizardStep1Schema)
      .handler(async ({ input }) => {
        // Validate step 1 data
        return {
          success: true,
          data: input,
          message: "Step 1 validated successfully",
        };
      }),

    step2: protectedProcedure
      .use(requirePermission("clients.create"))
      .input(clientWizardStep2Schema)
      .handler(async ({ input }) => ({
        success: true,
        data: input,
        message: "Step 2 validated successfully",
      })),

    step3: protectedProcedure
      .use(requirePermission("clients.create"))
      .input(clientWizardStep3Schema)
      .handler(async ({ input }) => ({
        success: true,
        data: input,
        message: "Step 3 validated successfully",
      })),

    step4: protectedProcedure
      .use(requirePermission("clients.create"))
      .input(clientWizardStep4Schema)
      .handler(async ({ input }) => ({
        success: true,
        data: input,
        message: "Step 4 validated successfully",
      })),

    complete: protectedProcedure
      .use(requirePermission("clients.create"))
      .input(
        z.object({
          step1: clientWizardStep1Schema,
          step2: clientWizardStep2Schema,
          step3: clientWizardStep3Schema,
          step4: clientWizardStep4Schema,
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        // Combine all steps into a complete client object
        const clientData = {
          ...input.step1,
          ...input.step2,
          ...input.step3,
          ...input.step4,
          id: nanoid(),
          clientNumber: generateClientNumber(),
          clientSince: new Date(),
          createdBy: user?.id,
          updatedBy: user?.id,
          tags: input.step4.tags ? JSON.stringify(input.step4.tags) : null,
        };

        const [newClient] = await db
          .insert(clientsSchema.clients)
          .values(clientData)
          .returning();

        return {
          success: true,
          data: newClient,
          message: "Client created successfully through wizard",
        };
      }),
  },

  // Client contacts
  contacts: {
    list: protectedProcedure
      .use(requirePermission("clients.read"))
      .input(z.object({ clientId: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { clientId } = input;

        const contacts = await db
          .select()
          .from(clientsSchema.clientContacts)
          .where(
            and(
              eq(clientsSchema.clientContacts.clientId, clientId),
              eq(clientsSchema.clientContacts.isActive, true)
            )
          )
          .orderBy(
            desc(clientsSchema.clientContacts.isPrimary),
            asc(clientsSchema.clientContacts.name)
          );

        return {
          success: true,
          data: contacts,
        };
      }),

    create: protectedProcedure
      .use(requirePermission("clients.update"))
      .input(createClientContactSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const contactData = {
          ...input,
          id: nanoid(),
          createdBy: user?.id,
        };

        const [newContact] = await db
          .insert(clientsSchema.clientContacts)
          .values(contactData)
          .returning();

        return {
          success: true,
          data: newContact,
          message: "Contact created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("clients.update"))
      .input(
        z.object({ id: z.string().min(1), data: updateClientContactSchema })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, data } = input;

        const [updatedContact] = await db
          .update(clientsSchema.clientContacts)
          .set(data)
          .where(eq(clientsSchema.clientContacts.id, id))
          .returning();

        if (!updatedContact) {
          throw new ORPCError("NOT_FOUND", "Contact not found");
        }

        return {
          success: true,
          data: updatedContact,
          message: "Contact updated successfully",
        };
      }),

    delete: protectedProcedure
      .use(requirePermission("clients.update"))
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id } = input;

        const [deletedContact] = await db
          .update(clientsSchema.clientContacts)
          .set({ isActive: false })
          .where(eq(clientsSchema.clientContacts.id, id))
          .returning();

        if (!deletedContact) {
          throw new ORPCError("NOT_FOUND", "Contact not found");
        }

        return {
          success: true,
          message: "Contact deleted successfully",
        };
      }),
  },

  // Client services
  services: {
    list: protectedProcedure
      .use(requirePermission("clients.read"))
      .input(z.object({ clientId: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { clientId } = input;

        const services = await db
          .select()
          .from(clientsSchema.clientServices)
          .where(eq(clientsSchema.clientServices.clientId, clientId))
          .orderBy(
            desc(clientsSchema.clientServices.isActive),
            asc(clientsSchema.clientServices.serviceName)
          );

        return {
          success: true,
          data: services,
        };
      }),

    create: protectedProcedure
      .use(requirePermission("clients.update"))
      .input(createClientServiceSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const serviceData = {
          ...input,
          id: nanoid(),
          createdBy: user?.id,
        };

        const [newService] = await db
          .insert(clientsSchema.clientServices)
          .values(serviceData)
          .returning();

        return {
          success: true,
          data: newService,
          message: "Service created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("clients.update"))
      .input(
        z.object({ id: z.string().min(1), data: updateClientServiceSchema })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, data } = input;

        const [updatedService] = await db
          .update(clientsSchema.clientServices)
          .set(data)
          .where(eq(clientsSchema.clientServices.id, id))
          .returning();

        if (!updatedService) {
          throw new ORPCError("NOT_FOUND", "Service not found");
        }

        return {
          success: true,
          data: updatedService,
          message: "Service updated successfully",
        };
      }),

    delete: protectedProcedure
      .use(requirePermission("clients.update"))
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id } = input;

        const [deletedService] = await db
          .delete(clientsSchema.clientServices)
          .where(eq(clientsSchema.clientServices.id, id))
          .returning();

        if (!deletedService) {
          throw new ORPCError("NOT_FOUND", "Service not found");
        }

        return {
          success: true,
          message: "Service deleted successfully",
        };
      }),
  },

  // Bulk operations
  bulkAction: protectedProcedure
    .use(requirePermission("clients.update"))
    .input(bulkClientActionSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { clientIds, action, assignedUserId, reason } = input;

      const updateData: any = {
        updatedBy: user?.id,
      };

      switch (action) {
        case "activate":
          updateData.status = "active";
          break;
        case "deactivate":
          updateData.status = "inactive";
          break;
        case "archive":
          updateData.status = "archived";
          break;
        case "delete":
          updateData.isActive = false;
          break;
        case "assign_accountant":
          if (!assignedUserId) {
            throw new ORPCError(
              "BAD_REQUEST",
              "Assigned user ID is required for assignment actions"
            );
          }
          updateData.assignedAccountant = assignedUserId;
          break;
        case "assign_manager":
          if (!assignedUserId) {
            throw new ORPCError(
              "BAD_REQUEST",
              "Assigned user ID is required for assignment actions"
            );
          }
          updateData.assignedManager = assignedUserId;
          break;
        default:
          throw new ORPCError("BAD_REQUEST", "Invalid action");
      }

      const updatedClients = await db
        .update(clientsSchema.clients)
        .set(updateData)
        .where(sql`${clientsSchema.clients.id} = ANY(${clientIds})`)
        .returning({
          id: clientsSchema.clients.id,
          name: clientsSchema.clients.name,
        });

      return {
        success: true,
        data: {
          updatedClients,
          action,
          reason,
        },
        message: `Bulk ${action} completed for ${updatedClients.length} clients`,
      };
    }),

  // Get client statistics
  stats: protectedProcedure
    .use(requirePermission("clients.read"))
    .handler(async ({ context }) => {
      const { db } = context;

      const stats = await db
        .select({
          status: clientsSchema.clients.status,
          count: count(),
        })
        .from(clientsSchema.clients)
        .where(eq(clientsSchema.clients.isActive, true))
        .groupBy(clientsSchema.clients.status);

      const complianceStats = await db
        .select({
          complianceStatus: clientsSchema.clients.complianceStatus,
          count: count(),
        })
        .from(clientsSchema.clients)
        .where(eq(clientsSchema.clients.isActive, true))
        .groupBy(clientsSchema.clients.complianceStatus);

      const riskStats = await db
        .select({
          riskLevel: clientsSchema.clients.riskLevel,
          count: count(),
        })
        .from(clientsSchema.clients)
        .where(eq(clientsSchema.clients.isActive, true))
        .groupBy(clientsSchema.clients.riskLevel);

      const [totalResult] = await db
        .select({ total: count() })
        .from(clientsSchema.clients)
        .where(eq(clientsSchema.clients.isActive, true));

      return {
        success: true,
        data: {
          total: totalResult.total,
          byStatus: stats,
          byComplianceStatus: complianceStats,
          byRiskLevel: riskStats,
        },
      };
    }),
};
