import { expeditingSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, requirePermission } from "../index";

// Helper functions
function generateRequestNumber(): string {
  const prefix = "EXP";
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

function _generateQueueId(): string {
  const prefix = "QUE";
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

// Government agencies in Guyana
const governmentAgencies = [
  "GRA",
  "NIS",
  "DEEDS_REGISTRY",
  "LANDS_SURVEYS",
  "BUSINESS_REGISTRY",
  "IMMIGRATION",
  "MINISTRY_OF_LABOUR",
  "MINISTRY_OF_LEGAL_AFFAIRS",
  "MINISTRY_OF_HOME_AFFAIRS",
  "MINISTRY_OF_NATURAL_RESOURCES",
  "EPA",
  "GUYANA_ENERGY",
  "GNBS",
  "GPL",
  "GWI",
  "GTT",
  "OTHER",
] as const;

const requestTypes = [
  "DOCUMENT_SUBMISSION",
  "DOCUMENT_COLLECTION",
  "APPLICATION_FOLLOW_UP",
  "CERTIFICATE_RENEWAL",
  "COMPLIANCE_CLEARANCE",
  "PERMIT_APPLICATION",
  "LICENSE_APPLICATION",
  "TAX_CLEARANCE",
  "REGISTRATION",
  "INQUIRY",
  "GENERAL_EXPEDITING",
] as const;

const expeditingStatuses = [
  "PENDING",
  "ASSIGNED",
  "IN_QUEUE",
  "AT_AGENCY",
  "PROCESSING",
  "AWAITING_RESPONSE",
  "DOCUMENTS_READY",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "ON_HOLD",
] as const;

const priorities = ["STANDARD", "PRIORITY", "URGENT", "RUSH"] as const;

// Zod schemas
const expeditingQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  agency: z.enum(governmentAgencies).optional(),
  requestType: z.enum(requestTypes).optional(),
  status: z.enum(expeditingStatuses).optional(),
  priority: z.enum(priorities).optional(),
  clientId: z.string().optional(),
  assignedToId: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createExpediteRequestSchema = z.object({
  clientId: z.string().min(1),
  requestType: z.enum(requestTypes),
  agency: z.enum(governmentAgencies),
  priority: z.enum(priorities).default("STANDARD"),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  instructions: z.string().optional(),
  agencyReferenceNumber: z.string().optional(),
  agencyDepartment: z.string().optional(),
  agencyContactPerson: z.string().optional(),
  agencyContactPhone: z.string().optional(),
  documentsRequired: z.array(z.string()).optional(),
  documentsProvided: z.array(z.string()).optional(),
  targetCompletionDate: z.string().datetime().optional(),
  estimatedProcessingDays: z.number().optional(),
  governmentFee: z.string().optional(),
  serviceFee: z.string().optional(),
  notes: z.string().optional(),
});

const createActivitySchema = z.object({
  requestId: z.string().min(1),
  activityType: z.enum([
    "visit",
    "call",
    "submission",
    "collection",
    "follow_up",
    "other",
  ]),
  activityDate: z.string().datetime(),
  description: z.string().min(1),
  agencyVisited: z.enum(governmentAgencies).optional(),
  departmentVisited: z.string().optional(),
  officerMet: z.string().optional(),
  queueNumber: z.string().optional(),
  waitTime: z.number().optional(),
  newStatus: z.enum(expeditingStatuses).optional(),
  documentsSubmitted: z.array(z.string()).optional(),
  documentsCollected: z.array(z.string()).optional(),
  expenseAmount: z.string().optional(),
  expenseType: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().datetime().optional(),
  followUpNotes: z.string().optional(),
});

const createAgencyContactSchema = z.object({
  agency: z.enum(governmentAgencies),
  departmentName: z.string().optional(),
  officeName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  contactName: z.string().optional(),
  contactTitle: z.string().optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  operatingHours: z.record(z.string()).optional(),
  servicesOffered: z.array(z.string()).optional(),
  processingTimes: z.record(z.string()).optional(),
  fees: z.record(z.string()).optional(),
  tips: z.string().optional(),
  notes: z.string().optional(),
});

export const expeditingRouter = {
  // ===== EXPEDITING REQUESTS =====
  requests: {
    list: protectedProcedure
      .use(requirePermission("expediting.read"))
      .input(expeditingQuerySchema)
      .handler(async ({ input, context }) => {
        const {
          page,
          limit,
          search,
          agency,
          requestType,
          status,
          priority,
          clientId,
          assignedToId,
          sortBy,
          sortOrder,
        } = input;
        const { db } = context;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (search) {
          conditions.push(
            sql`(
              ${ilike(expeditingSchema.expeditingRequests.title, `%${search}%`)} OR
              ${ilike(expeditingSchema.expeditingRequests.requestNumber, `%${search}%`)} OR
              ${ilike(expeditingSchema.expeditingRequests.agencyReferenceNumber, `%${search}%`)}
            )`
          );
        }

        if (agency) {
          conditions.push(
            eq(expeditingSchema.expeditingRequests.agency, agency)
          );
        }

        if (requestType) {
          conditions.push(
            eq(expeditingSchema.expeditingRequests.requestType, requestType)
          );
        }

        if (status) {
          conditions.push(
            eq(expeditingSchema.expeditingRequests.status, status)
          );
        }

        if (priority) {
          conditions.push(
            eq(expeditingSchema.expeditingRequests.priority, priority)
          );
        }

        if (clientId) {
          conditions.push(
            eq(expeditingSchema.expeditingRequests.clientId, clientId)
          );
        }

        if (assignedToId) {
          conditions.push(
            eq(expeditingSchema.expeditingRequests.assignedToId, assignedToId)
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [totalResult] = await db
          .select({ count: count() })
          .from(expeditingSchema.expeditingRequests)
          .where(whereClause);

        const sortColumn =
          expeditingSchema.expeditingRequests[
            sortBy as keyof typeof expeditingSchema.expeditingRequests
          ] || expeditingSchema.expeditingRequests.createdAt;
        const orderClause =
          sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

        const requests = await db
          .select()
          .from(expeditingSchema.expeditingRequests)
          .where(whereClause)
          .orderBy(orderClause)
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          data: {
            items: requests,
            pagination: {
              page,
              limit,
              total: totalResult.count,
              pages: Math.ceil(totalResult.count / limit),
            },
          },
        };
      }),

    getById: protectedProcedure
      .use(requirePermission("expediting.read"))
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id } = input;

        const [request] = await db
          .select()
          .from(expeditingSchema.expeditingRequests)
          .where(eq(expeditingSchema.expeditingRequests.id, id))
          .limit(1);

        if (!request) {
          throw new ORPCError("NOT_FOUND", "Expediting request not found");
        }

        // Get activities for this request
        const activities = await db
          .select()
          .from(expeditingSchema.expeditingActivities)
          .where(eq(expeditingSchema.expeditingActivities.requestId, id))
          .orderBy(desc(expeditingSchema.expeditingActivities.activityDate));

        return {
          success: true,
          data: {
            ...request,
            activities,
          },
        };
      }),

    create: protectedProcedure
      .use(requirePermission("expediting.create"))
      .input(createExpediteRequestSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        // Calculate total fee
        const govFee = Number.parseFloat(input.governmentFee || "0");
        const svcFee = Number.parseFloat(input.serviceFee || "0");
        const totalFee = govFee + svcFee;

        const requestData = {
          ...input,
          id: nanoid(),
          requestNumber: generateRequestNumber(),
          organizationId: user?.organizationId || "default",
          totalFee: totalFee.toString(),
          documentsRequired: input.documentsRequired
            ? JSON.stringify(input.documentsRequired)
            : null,
          documentsProvided: input.documentsProvided
            ? JSON.stringify(input.documentsProvided)
            : null,
          targetCompletionDate: input.targetCompletionDate
            ? new Date(input.targetCompletionDate)
            : null,
          createdBy: user?.id,
        };

        const [newRequest] = await db
          .insert(expeditingSchema.expeditingRequests)
          .values(requestData)
          .returning();

        return {
          success: true,
          data: newRequest,
          message: "Expediting request created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("expediting.update"))
      .input(
        z.object({
          id: z.string().min(1),
          data: createExpediteRequestSchema.partial().extend({
            status: z.enum(expeditingStatuses).optional(),
            assignedToId: z.string().optional(),
            expeditorName: z.string().optional(),
            expeditorPhone: z.string().optional(),
            outcome: z.string().optional(),
            actualCompletionDate: z.string().datetime().optional(),
          }),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, data } = input;

        const updateData = {
          ...data,
          documentsRequired: data.documentsRequired
            ? JSON.stringify(data.documentsRequired)
            : undefined,
          documentsProvided: data.documentsProvided
            ? JSON.stringify(data.documentsProvided)
            : undefined,
          targetCompletionDate: data.targetCompletionDate
            ? new Date(data.targetCompletionDate)
            : undefined,
          actualCompletionDate: data.actualCompletionDate
            ? new Date(data.actualCompletionDate)
            : undefined,
        };

        const [updatedRequest] = await db
          .update(expeditingSchema.expeditingRequests)
          .set(updateData)
          .where(eq(expeditingSchema.expeditingRequests.id, id))
          .returning();

        if (!updatedRequest) {
          throw new ORPCError("NOT_FOUND", "Expediting request not found");
        }

        return {
          success: true,
          data: updatedRequest,
          message: "Expediting request updated successfully",
        };
      }),

    assign: protectedProcedure
      .use(requirePermission("expediting.update"))
      .input(
        z.object({
          id: z.string().min(1),
          assignedToId: z.string().min(1),
          expeditorName: z.string().optional(),
          expeditorPhone: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, assignedToId, expeditorName, expeditorPhone } = input;

        const [updatedRequest] = await db
          .update(expeditingSchema.expeditingRequests)
          .set({
            assignedToId,
            expeditorName,
            expeditorPhone,
            status: "ASSIGNED",
          })
          .where(eq(expeditingSchema.expeditingRequests.id, id))
          .returning();

        if (!updatedRequest) {
          throw new ORPCError("NOT_FOUND", "Expediting request not found");
        }

        return {
          success: true,
          data: updatedRequest,
          message: "Request assigned successfully",
        };
      }),

    complete: protectedProcedure
      .use(requirePermission("expediting.update"))
      .input(
        z.object({
          id: z.string().min(1),
          outcome: z.string().min(1),
          resultDocuments: z.array(z.string()).optional(),
          notes: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, outcome, resultDocuments, notes } = input;

        const [updatedRequest] = await db
          .update(expeditingSchema.expeditingRequests)
          .set({
            status: "COMPLETED",
            outcome,
            resultDocuments: resultDocuments
              ? JSON.stringify(resultDocuments)
              : null,
            actualCompletionDate: new Date(),
            notes,
          })
          .where(eq(expeditingSchema.expeditingRequests.id, id))
          .returning();

        if (!updatedRequest) {
          throw new ORPCError("NOT_FOUND", "Expediting request not found");
        }

        return {
          success: true,
          data: updatedRequest,
          message: "Request completed successfully",
        };
      }),

    stats: protectedProcedure
      .use(requirePermission("expediting.read"))
      .handler(async ({ context }) => {
        const { db } = context;

        const statusStats = await db
          .select({
            status: expeditingSchema.expeditingRequests.status,
            count: count(),
          })
          .from(expeditingSchema.expeditingRequests)
          .groupBy(expeditingSchema.expeditingRequests.status);

        const agencyStats = await db
          .select({
            agency: expeditingSchema.expeditingRequests.agency,
            count: count(),
          })
          .from(expeditingSchema.expeditingRequests)
          .groupBy(expeditingSchema.expeditingRequests.agency);

        const priorityStats = await db
          .select({
            priority: expeditingSchema.expeditingRequests.priority,
            count: count(),
          })
          .from(expeditingSchema.expeditingRequests)
          .groupBy(expeditingSchema.expeditingRequests.priority);

        const [totalResult] = await db
          .select({ total: count() })
          .from(expeditingSchema.expeditingRequests);

        return {
          success: true,
          data: {
            total: totalResult.total,
            byStatus: statusStats,
            byAgency: agencyStats,
            byPriority: priorityStats,
          },
        };
      }),
  },

  // ===== ACTIVITIES =====
  activities: {
    list: protectedProcedure
      .use(requirePermission("expediting.read"))
      .input(
        z.object({
          requestId: z.string().min(1),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
        })
      )
      .handler(async ({ input, context }) => {
        const { requestId, page, limit } = input;
        const { db } = context;
        const offset = (page - 1) * limit;

        const [totalResult] = await db
          .select({ count: count() })
          .from(expeditingSchema.expeditingActivities)
          .where(
            eq(expeditingSchema.expeditingActivities.requestId, requestId)
          );

        const activities = await db
          .select()
          .from(expeditingSchema.expeditingActivities)
          .where(eq(expeditingSchema.expeditingActivities.requestId, requestId))
          .orderBy(desc(expeditingSchema.expeditingActivities.activityDate))
          .limit(limit)
          .offset(offset);

        return {
          success: true,
          data: {
            items: activities,
            pagination: {
              page,
              limit,
              total: totalResult.count,
              pages: Math.ceil(totalResult.count / limit),
            },
          },
        };
      }),

    create: protectedProcedure
      .use(requirePermission("expediting.update"))
      .input(createActivitySchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const activityData = {
          ...input,
          id: nanoid(),
          activityDate: new Date(input.activityDate),
          followUpDate: input.followUpDate
            ? new Date(input.followUpDate)
            : null,
          documentsSubmitted: input.documentsSubmitted
            ? JSON.stringify(input.documentsSubmitted)
            : null,
          documentsCollected: input.documentsCollected
            ? JSON.stringify(input.documentsCollected)
            : null,
          performedBy: user?.id || "system",
        };

        const [newActivity] = await db
          .insert(expeditingSchema.expeditingActivities)
          .values(activityData)
          .returning();

        // Update request status if provided
        if (input.newStatus) {
          await db
            .update(expeditingSchema.expeditingRequests)
            .set({ status: input.newStatus })
            .where(eq(expeditingSchema.expeditingRequests.id, input.requestId));
        }

        return {
          success: true,
          data: newActivity,
          message: "Activity recorded successfully",
        };
      }),
  },

  // ===== AGENCY CONTACTS =====
  agencyContacts: {
    list: protectedProcedure
      .use(requirePermission("expediting.read"))
      .input(
        z.object({
          agency: z.enum(governmentAgencies).optional(),
          city: z.string().optional(),
          search: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { agency, city, search } = input;
        const { db } = context;

        const conditions = [eq(expeditingSchema.agencyContacts.isActive, true)];

        if (agency) {
          conditions.push(eq(expeditingSchema.agencyContacts.agency, agency));
        }

        if (city) {
          conditions.push(
            ilike(expeditingSchema.agencyContacts.city, `%${city}%`)
          );
        }

        if (search) {
          conditions.push(
            sql`(
              ${ilike(expeditingSchema.agencyContacts.contactName, `%${search}%`)} OR
              ${ilike(expeditingSchema.agencyContacts.departmentName, `%${search}%`)} OR
              ${ilike(expeditingSchema.agencyContacts.officeName, `%${search}%`)}
            )`
          );
        }

        const contacts = await db
          .select()
          .from(expeditingSchema.agencyContacts)
          .where(and(...conditions))
          .orderBy(asc(expeditingSchema.agencyContacts.agency));

        return { success: true, data: contacts };
      }),

    create: protectedProcedure
      .use(requirePermission("expediting.create"))
      .input(createAgencyContactSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const contactData = {
          ...input,
          id: nanoid(),
          organizationId: user?.organizationId || "default",
          operatingHours: input.operatingHours
            ? JSON.stringify(input.operatingHours)
            : null,
          servicesOffered: input.servicesOffered
            ? JSON.stringify(input.servicesOffered)
            : null,
          processingTimes: input.processingTimes
            ? JSON.stringify(input.processingTimes)
            : null,
          fees: input.fees ? JSON.stringify(input.fees) : null,
          updatedBy: user?.id,
        };

        const [newContact] = await db
          .insert(expeditingSchema.agencyContacts)
          .values(contactData)
          .returning();

        return {
          success: true,
          data: newContact,
          message: "Agency contact created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("expediting.update"))
      .input(
        z.object({
          id: z.string().min(1),
          data: createAgencyContactSchema.partial(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user } = context;
        const { id, data } = input;

        const updateData = {
          ...data,
          operatingHours: data.operatingHours
            ? JSON.stringify(data.operatingHours)
            : undefined,
          servicesOffered: data.servicesOffered
            ? JSON.stringify(data.servicesOffered)
            : undefined,
          processingTimes: data.processingTimes
            ? JSON.stringify(data.processingTimes)
            : undefined,
          fees: data.fees ? JSON.stringify(data.fees) : undefined,
          lastVerified: new Date(),
          updatedBy: user?.id,
        };

        const [updatedContact] = await db
          .update(expeditingSchema.agencyContacts)
          .set(updateData)
          .where(eq(expeditingSchema.agencyContacts.id, id))
          .returning();

        if (!updatedContact) {
          throw new ORPCError("NOT_FOUND", "Agency contact not found");
        }

        return {
          success: true,
          data: updatedContact,
          message: "Agency contact updated successfully",
        };
      }),
  },

  // ===== QUEUE MANAGEMENT =====
  queue: {
    list: protectedProcedure
      .use(requirePermission("expediting.read"))
      .input(
        z.object({
          date: z.string().datetime().optional(),
          agency: z.enum(governmentAgencies).optional(),
          expeditorId: z.string().optional(),
          status: z
            .enum(["planned", "in_progress", "completed", "cancelled"])
            .optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { date, agency, expeditorId, status } = input;
        const { db } = context;

        const conditions = [];

        if (date) {
          const targetDate = new Date(date);
          const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
          const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
          conditions.push(
            and(
              gte(expeditingSchema.expeditingQueue.queueDate, startOfDay),
              lte(expeditingSchema.expeditingQueue.queueDate, endOfDay)
            )
          );
        }

        if (agency) {
          conditions.push(eq(expeditingSchema.expeditingQueue.agency, agency));
        }

        if (expeditorId) {
          conditions.push(
            eq(expeditingSchema.expeditingQueue.expeditorId, expeditorId)
          );
        }

        if (status) {
          conditions.push(eq(expeditingSchema.expeditingQueue.status, status));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const queue = await db
          .select()
          .from(expeditingSchema.expeditingQueue)
          .where(whereClause)
          .orderBy(desc(expeditingSchema.expeditingQueue.queueDate));

        return { success: true, data: queue };
      }),

    create: protectedProcedure
      .use(requirePermission("expediting.create"))
      .input(
        z.object({
          queueDate: z.string().datetime(),
          agency: z.enum(governmentAgencies),
          expeditorId: z.string().min(1),
          requestIds: z.array(z.string()),
          plannedStartTime: z.string().datetime().optional(),
          plannedEndTime: z.string().datetime().optional(),
          routeNotes: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const queueData = {
          id: nanoid(),
          organizationId: user?.organizationId || "default",
          queueDate: new Date(input.queueDate),
          agency: input.agency,
          expeditorId: input.expeditorId,
          requestIds: JSON.stringify(input.requestIds),
          requestCount: input.requestIds.length,
          plannedStartTime: input.plannedStartTime
            ? new Date(input.plannedStartTime)
            : null,
          plannedEndTime: input.plannedEndTime
            ? new Date(input.plannedEndTime)
            : null,
          routeNotes: input.routeNotes,
          status: "planned",
        };

        const [newQueue] = await db
          .insert(expeditingSchema.expeditingQueue)
          .values(queueData)
          .returning();

        // Update request statuses to IN_QUEUE
        for (const requestId of input.requestIds) {
          await db
            .update(expeditingSchema.expeditingRequests)
            .set({ status: "IN_QUEUE" })
            .where(eq(expeditingSchema.expeditingRequests.id, requestId));
        }

        return {
          success: true,
          data: newQueue,
          message: "Queue created successfully",
        };
      }),

    updateStatus: protectedProcedure
      .use(requirePermission("expediting.update"))
      .input(
        z.object({
          id: z.string().min(1),
          status: z.enum(["planned", "in_progress", "completed", "cancelled"]),
          actualStartTime: z.string().datetime().optional(),
          actualEndTime: z.string().datetime().optional(),
          completionNotes: z.string().optional(),
          requestsCompleted: z.number().optional(),
          requestsPending: z.number().optional(),
          transportExpense: z.string().optional(),
          otherExpenses: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const {
          id,
          actualStartTime,
          actualEndTime,
          transportExpense,
          otherExpenses,
          ...data
        } = input;

        const transport = Number.parseFloat(transportExpense || "0");
        const other = Number.parseFloat(otherExpenses || "0");

        const updateData = {
          ...data,
          actualStartTime: actualStartTime
            ? new Date(actualStartTime)
            : undefined,
          actualEndTime: actualEndTime ? new Date(actualEndTime) : undefined,
          transportExpense,
          otherExpenses,
          totalExpenses: (transport + other).toString(),
        };

        const [updatedQueue] = await db
          .update(expeditingSchema.expeditingQueue)
          .set(updateData)
          .where(eq(expeditingSchema.expeditingQueue.id, id))
          .returning();

        if (!updatedQueue) {
          throw new ORPCError("NOT_FOUND", "Queue not found");
        }

        return {
          success: true,
          data: updatedQueue,
          message: "Queue status updated successfully",
        };
      }),
  },
};
