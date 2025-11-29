import { db } from "@GK-Nexus/db";
import { auditLogs } from "@GK-Nexus/db/schema/audit-logs";
import { clients } from "@GK-Nexus/db/schema/clients";
import {
  complianceFilings,
  complianceRequirements,
  complianceStatusEnum,
  complianceTypeEnum,
  priorityEnum,
  taxPeriodEnum,
} from "@GK-Nexus/db/schema/compliance";
import { users } from "@GK-Nexus/db/schema/users";
import { generateId } from "@GK-Nexus/db/utils";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

// Validation schemas
const createComplianceRequirementSchema = z.object({
  clientId: z.string(),
  complianceType: z.enum(complianceTypeEnum.enumValues),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  frequency: z.enum(taxPeriodEnum.enumValues),
  priority: z.enum(priorityEnum.enumValues).default("medium"),
  nextDueDate: z.string().optional(),
  reminderDays: z.array(z.number()).optional(),
  assignedTo: z.string().optional(),
  estimatedHours: z.number().optional(),
  feeAmount: z.number().optional(),
  notes: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
});

const updateComplianceRequirementSchema =
  createComplianceRequirementSchema.partial();

const createComplianceFilingSchema = z.object({
  requirementId: z.string(),
  clientId: z.string(),
  filingPeriod: z.string(),
  periodStartDate: z.string().optional(),
  periodEndDate: z.string().optional(),
  dueDate: z.string(),
  priority: z.enum(priorityEnum.enumValues).default("medium"),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

const updateComplianceFilingSchema = z.object({
  status: z.enum(complianceStatusEnum.enumValues).optional(),
  priority: z.enum(priorityEnum.enumValues).optional(),
  assignedTo: z.string().optional(),
  reviewedBy: z.string().optional(),
  preparedBy: z.string().optional(),
  percentComplete: z.number().min(0).max(100).optional(),
  actualHours: z.number().optional(),
  feeCharged: z.number().optional(),
  penalties: z.number().optional(),
  interest: z.number().optional(),
  referenceNumber: z.string().optional(),
  confirmationNumber: z.string().optional(),
  filingMethod: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  filedAt: z.string().optional(),
});

const complianceFiltersSchema = z.object({
  clientId: z.string().optional(),
  complianceType: z.array(z.enum(complianceTypeEnum.enumValues)).optional(),
  status: z.array(z.enum(complianceStatusEnum.enumValues)).optional(),
  priority: z.array(z.enum(priorityEnum.enumValues)).optional(),
  assignedTo: z.string().optional(),
  dueDateFrom: z.string().optional(),
  dueDateTo: z.string().optional(),
  filingPeriod: z.string().optional(),
  isOverdue: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  sortBy: z
    .enum(["dueDate", "createdAt", "updatedAt", "priority", "status"])
    .default("dueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const graForm7BExportSchema = z.object({
  clientId: z.string(),
  periodStart: z.string(),
  periodEnd: z.string(),
  includeDetails: z.boolean().default(true),
});

export const complianceRouter = {
  // Dashboard overview
  getDashboardOverview: protectedProcedure.handler(async ({ context }) => {
    const userId = context.user.id;
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get compliance statistics
    const [
      totalRequirements,
      activeFilings,
      overdueFilings,
      upcomingDeadlines,
      criticalAlerts,
      completedThisMonth,
    ] = await Promise.all([
      // Total active requirements
      db
        .select({ count: count() })
        .from(complianceRequirements)
        .where(eq(complianceRequirements.isActive, true)),

      // Active filings
      db
        .select({ count: count() })
        .from(complianceFilings)
        .where(
          inArray(complianceFilings.status, [
            "not_started",
            "in_progress",
            "under_review",
          ])
        ),

      // Overdue filings
      db
        .select({ count: count() })
        .from(complianceFilings)
        .where(
          and(
            eq(complianceFilings.status, "overdue"),
            lte(complianceFilings.dueDate, today.toISOString().split("T")[0])
          )
        ),

      // Upcoming deadlines (next 30 days)
      db
        .select({ count: count() })
        .from(complianceFilings)
        .where(
          and(
            inArray(complianceFilings.status, [
              "not_started",
              "in_progress",
              "under_review",
            ]),
            gte(complianceFilings.dueDate, today.toISOString().split("T")[0]),
            lte(
              complianceFilings.dueDate,
              thirtyDaysFromNow.toISOString().split("T")[0]
            )
          )
        ),

      // Critical priority alerts
      db
        .select({ count: count() })
        .from(complianceFilings)
        .where(
          and(
            eq(complianceFilings.priority, "critical"),
            inArray(complianceFilings.status, [
              "not_started",
              "in_progress",
              "under_review",
            ])
          )
        ),

      // Completed this month
      db
        .select({ count: count() })
        .from(complianceFilings)
        .where(
          and(
            eq(complianceFilings.status, "completed"),
            gte(
              complianceFilings.completedAt,
              new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
            )
          )
        ),
    ]);

    // Calculate compliance score (percentage of on-time filings)
    const totalFilings = await db
      .select({ count: count() })
      .from(complianceFilings);
    const onTimeFilings = await db
      .select({ count: count() })
      .from(complianceFilings)
      .where(
        and(
          eq(complianceFilings.status, "completed"),
          sql`${complianceFilings.completedAt} <= ${complianceFilings.dueDate}`
        )
      );

    const complianceScore = totalFilings[0]?.count
      ? Math.round(
          ((onTimeFilings[0]?.count || 0) / totalFilings[0].count) * 100
        )
      : 100;

    // Get traffic light status (red: <70%, yellow: 70-89%, green: 90%+)
    const trafficLightStatus =
      complianceScore >= 90
        ? "green"
        : complianceScore >= 70
          ? "yellow"
          : "red";

    return {
      totalRequirements: totalRequirements[0]?.count || 0,
      activeFilings: activeFilings[0]?.count || 0,
      overdueFilings: overdueFilings[0]?.count || 0,
      upcomingDeadlines: upcomingDeadlines[0]?.count || 0,
      criticalAlerts: criticalAlerts[0]?.count || 0,
      completedThisMonth: completedThisMonth[0]?.count || 0,
      complianceScore,
      trafficLightStatus,
    };
  }),

  // Get compliance requirements
  getRequirements: protectedProcedure
    .input(
      complianceFiltersSchema.omit({ filingPeriod: true, isOverdue: true })
    )
    .handler(async ({ input }) => {
      const {
        clientId,
        complianceType,
        priority,
        assignedTo,
        dueDateFrom,
        dueDateTo,
        search,
        limit,
        offset,
        sortBy,
        sortOrder,
      } = input;

      let query = db
        .select({
          id: complianceRequirements.id,
          clientId: complianceRequirements.clientId,
          complianceType: complianceRequirements.complianceType,
          title: complianceRequirements.title,
          description: complianceRequirements.description,
          frequency: complianceRequirements.frequency,
          priority: complianceRequirements.priority,
          nextDueDate: complianceRequirements.nextDueDate,
          assignedTo: complianceRequirements.assignedTo,
          isActive: complianceRequirements.isActive,
          estimatedHours: complianceRequirements.estimatedHours,
          feeAmount: complianceRequirements.feeAmount,
          createdAt: complianceRequirements.createdAt,
          updatedAt: complianceRequirements.updatedAt,
          client: {
            id: clients.id,
            businessName: clients.businessName,
            contactPerson: clients.contactPerson,
          },
          assignedToUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(complianceRequirements)
        .leftJoin(clients, eq(complianceRequirements.clientId, clients.id))
        .leftJoin(users, eq(complianceRequirements.assignedTo, users.id));

      const conditions = [eq(complianceRequirements.isActive, true)];

      if (clientId)
        conditions.push(eq(complianceRequirements.clientId, clientId));
      if (complianceType?.length)
        conditions.push(
          inArray(complianceRequirements.complianceType, complianceType)
        );
      if (priority?.length)
        conditions.push(inArray(complianceRequirements.priority, priority));
      if (assignedTo)
        conditions.push(eq(complianceRequirements.assignedTo, assignedTo));
      if (dueDateFrom)
        conditions.push(gte(complianceRequirements.nextDueDate, dueDateFrom));
      if (dueDateTo)
        conditions.push(lte(complianceRequirements.nextDueDate, dueDateTo));
      if (search) {
        conditions.push(
          sql`${complianceRequirements.title} ILIKE ${`%${search}%`} OR ${complianceRequirements.description} ILIKE ${`%${search}%`}`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = {
        dueDate: complianceRequirements.nextDueDate,
        createdAt: complianceRequirements.createdAt,
        updatedAt: complianceRequirements.updatedAt,
        priority: complianceRequirements.priority,
        status: complianceRequirements.isActive,
      }[sortBy];

      query = query.orderBy(
        sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)
      );
      query = query.limit(limit).offset(offset);

      const results = await query;

      // Get total count for pagination
      const countQuery = db
        .select({ count: count() })
        .from(complianceRequirements);
      if (conditions.length > 0) {
        countQuery.where(and(...conditions));
      }
      const totalCount = await countQuery;

      return {
        requirements: results,
        totalCount: totalCount[0]?.count || 0,
        hasMore: offset + limit < (totalCount[0]?.count || 0),
      };
    }),

  // Get compliance filings
  getFilings: protectedProcedure
    .input(complianceFiltersSchema)
    .handler(async ({ input }) => {
      const {
        clientId,
        complianceType,
        status,
        priority,
        assignedTo,
        dueDateFrom,
        dueDateTo,
        filingPeriod,
        isOverdue,
        search,
        limit,
        offset,
        sortBy,
        sortOrder,
      } = input;

      let query = db
        .select({
          id: complianceFilings.id,
          requirementId: complianceFilings.requirementId,
          clientId: complianceFilings.clientId,
          filingPeriod: complianceFilings.filingPeriod,
          periodStartDate: complianceFilings.periodStartDate,
          periodEndDate: complianceFilings.periodEndDate,
          dueDate: complianceFilings.dueDate,
          status: complianceFilings.status,
          priority: complianceFilings.priority,
          assignedTo: complianceFilings.assignedTo,
          percentComplete: complianceFilings.percentComplete,
          actualHours: complianceFilings.actualHours,
          feeCharged: complianceFilings.feeCharged,
          referenceNumber: complianceFilings.referenceNumber,
          confirmationNumber: complianceFilings.confirmationNumber,
          filingMethod: complianceFilings.filingMethod,
          startedAt: complianceFilings.startedAt,
          completedAt: complianceFilings.completedAt,
          filedAt: complianceFilings.filedAt,
          createdAt: complianceFilings.createdAt,
          updatedAt: complianceFilings.updatedAt,
          requirement: {
            id: complianceRequirements.id,
            complianceType: complianceRequirements.complianceType,
            title: complianceRequirements.title,
            frequency: complianceRequirements.frequency,
          },
          client: {
            id: clients.id,
            businessName: clients.businessName,
            contactPerson: clients.contactPerson,
          },
          assignedToUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(complianceFilings)
        .leftJoin(
          complianceRequirements,
          eq(complianceFilings.requirementId, complianceRequirements.id)
        )
        .leftJoin(clients, eq(complianceFilings.clientId, clients.id))
        .leftJoin(users, eq(complianceFilings.assignedTo, users.id));

      const conditions = [];

      if (clientId) conditions.push(eq(complianceFilings.clientId, clientId));
      if (complianceType?.length)
        conditions.push(
          inArray(complianceRequirements.complianceType, complianceType)
        );
      if (status?.length)
        conditions.push(inArray(complianceFilings.status, status));
      if (priority?.length)
        conditions.push(inArray(complianceFilings.priority, priority));
      if (assignedTo)
        conditions.push(eq(complianceFilings.assignedTo, assignedTo));
      if (dueDateFrom)
        conditions.push(gte(complianceFilings.dueDate, dueDateFrom));
      if (dueDateTo) conditions.push(lte(complianceFilings.dueDate, dueDateTo));
      if (filingPeriod)
        conditions.push(eq(complianceFilings.filingPeriod, filingPeriod));
      if (isOverdue) {
        const today = new Date().toISOString().split("T")[0];
        conditions.push(
          and(
            lte(complianceFilings.dueDate, today),
            inArray(complianceFilings.status, [
              "not_started",
              "in_progress",
              "under_review",
            ])
          )
        );
      }
      if (search) {
        conditions.push(
          sql`${complianceRequirements.title} ILIKE ${`%${search}%`} OR ${complianceFilings.referenceNumber} ILIKE ${`%${search}%`} OR ${complianceFilings.confirmationNumber} ILIKE ${`%${search}%`}`
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Apply sorting
      const sortColumn = {
        dueDate: complianceFilings.dueDate,
        createdAt: complianceFilings.createdAt,
        updatedAt: complianceFilings.updatedAt,
        priority: complianceFilings.priority,
        status: complianceFilings.status,
      }[sortBy];

      query = query.orderBy(
        sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)
      );
      query = query.limit(limit).offset(offset);

      const results = await query;

      // Get total count for pagination
      let countQuery = db.select({ count: count() }).from(complianceFilings);
      if (complianceType?.length) {
        countQuery = countQuery.leftJoin(
          complianceRequirements,
          eq(complianceFilings.requirementId, complianceRequirements.id)
        );
      }
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const totalCount = await countQuery;

      return {
        filings: results,
        totalCount: totalCount[0]?.count || 0,
        hasMore: offset + limit < (totalCount[0]?.count || 0),
      };
    }),

  // Create compliance requirement
  createRequirement: protectedProcedure
    .input(createComplianceRequirementSchema)
    .handler(async ({ input, context }) => {
      const userId = context.user.id;
      const requirementId = generateId();

      const newRequirement = await db
        .insert(complianceRequirements)
        .values({
          id: requirementId,
          ...input,
          reminderDays: input.reminderDays
            ? JSON.stringify(input.reminderDays)
            : null,
          dependencies: input.dependencies
            ? JSON.stringify(input.dependencies)
            : null,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      // Log the action
      await db.insert(auditLogs).values({
        id: generateId(),
        entityType: "compliance_requirement",
        entityId: requirementId,
        action: "create",
        changes: JSON.stringify(input),
        performedBy: userId,
      });

      return newRequirement[0];
    }),

  // Update compliance requirement
  updateRequirement: protectedProcedure
    .input(
      z.object({ id: z.string(), data: updateComplianceRequirementSchema })
    )
    .handler(async ({ input, context }) => {
      const { id, data } = input;
      const userId = context.user.id;

      const existing = await db
        .select()
        .from(complianceRequirements)
        .where(eq(complianceRequirements.id, id))
        .limit(1);

      if (!existing.length) {
        throw new ORPCError("NOT_FOUND", "Compliance requirement not found");
      }

      const updatedRequirement = await db
        .update(complianceRequirements)
        .set({
          ...data,
          reminderDays: data.reminderDays
            ? JSON.stringify(data.reminderDays)
            : undefined,
          dependencies: data.dependencies
            ? JSON.stringify(data.dependencies)
            : undefined,
          updatedBy: userId,
        })
        .where(eq(complianceRequirements.id, id))
        .returning();

      // Log the action
      await db.insert(auditLogs).values({
        id: generateId(),
        entityType: "compliance_requirement",
        entityId: id,
        action: "update",
        changes: JSON.stringify(data),
        performedBy: userId,
      });

      return updatedRequirement[0];
    }),

  // Create compliance filing
  createFiling: protectedProcedure
    .input(createComplianceFilingSchema)
    .handler(async ({ input, context }) => {
      const userId = context.user.id;
      const filingId = generateId();

      const newFiling = await db
        .insert(complianceFilings)
        .values({
          id: filingId,
          ...input,
          createdBy: userId,
          updatedBy: userId,
        })
        .returning();

      // Log the action
      await db.insert(auditLogs).values({
        id: generateId(),
        entityType: "compliance_filing",
        entityId: filingId,
        action: "create",
        changes: JSON.stringify(input),
        performedBy: userId,
      });

      return newFiling[0];
    }),

  // Update compliance filing
  updateFiling: protectedProcedure
    .input(z.object({ id: z.string(), data: updateComplianceFilingSchema }))
    .handler(async ({ input, context }) => {
      const { id, data } = input;
      const userId = context.user.id;

      const existing = await db
        .select()
        .from(complianceFilings)
        .where(eq(complianceFilings.id, id))
        .limit(1);

      if (!existing.length) {
        throw new ORPCError("NOT_FOUND", "Compliance filing not found");
      }

      const updateData = {
        ...data,
        attachments: data.attachments
          ? JSON.stringify(data.attachments)
          : undefined,
        updatedBy: userId,
      };

      // Handle status-specific updates
      if (data.status === "in_progress" && !existing[0].startedAt) {
        updateData.startedAt = new Date().toISOString();
      }
      if (data.status === "completed" && !existing[0].completedAt) {
        updateData.completedAt = new Date().toISOString();
        updateData.percentComplete = "100";
      }
      if (data.status === "filed" && !existing[0].filedAt) {
        updateData.filedAt = new Date().toISOString();
      }

      const updatedFiling = await db
        .update(complianceFilings)
        .set(updateData)
        .where(eq(complianceFilings.id, id))
        .returning();

      // Log the action
      await db.insert(auditLogs).values({
        id: generateId(),
        entityType: "compliance_filing",
        entityId: id,
        action: "update",
        changes: JSON.stringify(data),
        performedBy: userId,
      });

      return updatedFiling[0];
    }),

  // Export GRA Form 7B CSV
  exportGraForm7B: protectedProcedure
    .input(graForm7BExportSchema)
    .handler(async ({ input }) => {
      const { clientId, periodStart, periodEnd, includeDetails } = input;

      // Get client information
      const client = await db
        .select()
        .from(clients)
        .where(eq(clients.id, clientId))
        .limit(1);

      if (!client.length) {
        throw new ORPCError("NOT_FOUND", "Client not found");
      }

      // Get VAT filings for the period
      const vatFilings = await db
        .select({
          id: complianceFilings.id,
          filingPeriod: complianceFilings.filingPeriod,
          periodStartDate: complianceFilings.periodStartDate,
          periodEndDate: complianceFilings.periodEndDate,
          dueDate: complianceFilings.dueDate,
          status: complianceFilings.status,
          referenceNumber: complianceFilings.referenceNumber,
          confirmationNumber: complianceFilings.confirmationNumber,
          filedAt: complianceFilings.filedAt,
          requirement: {
            complianceType: complianceRequirements.complianceType,
            title: complianceRequirements.title,
          },
        })
        .from(complianceFilings)
        .leftJoin(
          complianceRequirements,
          eq(complianceFilings.requirementId, complianceRequirements.id)
        )
        .where(
          and(
            eq(complianceFilings.clientId, clientId),
            eq(complianceRequirements.complianceType, "vat_return"),
            gte(complianceFilings.periodStartDate, periodStart),
            lte(complianceFilings.periodEndDate, periodEnd)
          )
        )
        .orderBy(asc(complianceFilings.periodStartDate));

      // Generate CSV data
      const headers = [
        "Business Name",
        "TIN",
        "Filing Period",
        "Period Start Date",
        "Period End Date",
        "Due Date",
        "Status",
        "Reference Number",
        "Confirmation Number",
        "Filed Date",
      ];

      if (includeDetails) {
        headers.push("Compliance Type", "Title");
      }

      const csvRows = [headers.join(",")];

      for (const filing of vatFilings) {
        const row = [
          `"${client[0].businessName}"`,
          `"${client[0].tin || ""}"`,
          `"${filing.filingPeriod}"`,
          `"${filing.periodStartDate || ""}"`,
          `"${filing.periodEndDate || ""}"`,
          `"${filing.dueDate}"`,
          `"${filing.status}"`,
          `"${filing.referenceNumber || ""}"`,
          `"${filing.confirmationNumber || ""}"`,
          `"${filing.filedAt || ""}"`,
        ];

        if (includeDetails) {
          row.push(`"${filing.requirement?.complianceType || ""}"`);
          row.push(`"${filing.requirement?.title || ""}"`);
        }

        csvRows.push(row.join(","));
      }

      const csvContent = csvRows.join("\n");
      const filename = `GRA_Form7B_${client[0].businessName}_${periodStart}_to_${periodEnd}.csv`;

      return {
        csvContent,
        filename,
        recordCount: vatFilings.length,
      };
    }),

  // Get alerts and upcoming deadlines
  getAlerts: protectedProcedure
    .input(
      z.object({
        daysAhead: z.number().min(1).max(90).default(30),
        priority: z.array(z.enum(priorityEnum.enumValues)).optional(),
        complianceType: z
          .array(z.enum(complianceTypeEnum.enumValues))
          .optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .handler(async ({ input }) => {
      const { daysAhead, priority, complianceType, limit } = input;
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysAhead);

      let query = db
        .select({
          id: complianceFilings.id,
          dueDate: complianceFilings.dueDate,
          status: complianceFilings.status,
          priority: complianceFilings.priority,
          filingPeriod: complianceFilings.filingPeriod,
          percentComplete: complianceFilings.percentComplete,
          requirement: {
            id: complianceRequirements.id,
            complianceType: complianceRequirements.complianceType,
            title: complianceRequirements.title,
          },
          client: {
            id: clients.id,
            businessName: clients.businessName,
            contactPerson: clients.contactPerson,
          },
          assignedToUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(complianceFilings)
        .leftJoin(
          complianceRequirements,
          eq(complianceFilings.requirementId, complianceRequirements.id)
        )
        .leftJoin(clients, eq(complianceFilings.clientId, clients.id))
        .leftJoin(users, eq(complianceFilings.assignedTo, users.id));

      const conditions = [
        inArray(complianceFilings.status, [
          "not_started",
          "in_progress",
          "under_review",
        ]),
        lte(complianceFilings.dueDate, futureDate.toISOString().split("T")[0]),
      ];

      if (priority?.length)
        conditions.push(inArray(complianceFilings.priority, priority));
      if (complianceType?.length)
        conditions.push(
          inArray(complianceRequirements.complianceType, complianceType)
        );

      query = query
        .where(and(...conditions))
        .orderBy(asc(complianceFilings.dueDate))
        .limit(limit);

      const alerts = await query;

      // Categorize alerts
      const overdueAlerts = alerts.filter(
        (alert) => new Date(alert.dueDate) < today
      );

      const urgentAlerts = alerts.filter((alert) => {
        const dueDate = new Date(alert.dueDate);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);
        return dueDate >= today && dueDate <= threeDaysFromNow;
      });

      const upcomingAlerts = alerts.filter((alert) => {
        const dueDate = new Date(alert.dueDate);
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(today.getDate() + 3);
        return dueDate > threeDaysFromNow;
      });

      return {
        overdue: overdueAlerts,
        urgent: urgentAlerts,
        upcoming: upcomingAlerts,
        total: alerts.length,
      };
    }),

  // Get audit trail
  getAuditTrail: protectedProcedure
    .input(
      z.object({
        entityType: z
          .enum(["compliance_requirement", "compliance_filing"])
          .optional(),
        entityId: z.string().optional(),
        action: z.enum(["create", "update", "delete"]).optional(),
        performedBy: z.string().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .handler(async ({ input }) => {
      const {
        entityType,
        entityId,
        action,
        performedBy,
        dateFrom,
        dateTo,
        limit,
        offset,
      } = input;

      let query = db
        .select({
          id: auditLogs.id,
          entityType: auditLogs.entityType,
          entityId: auditLogs.entityId,
          action: auditLogs.action,
          changes: auditLogs.changes,
          timestamp: auditLogs.timestamp,
          performedBy: auditLogs.performedBy,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.performedBy, users.id));

      const conditions = [
        inArray(auditLogs.entityType, [
          "compliance_requirement",
          "compliance_filing",
        ]),
      ];

      if (entityType) conditions.push(eq(auditLogs.entityType, entityType));
      if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
      if (action) conditions.push(eq(auditLogs.action, action));
      if (performedBy) conditions.push(eq(auditLogs.performedBy, performedBy));
      if (dateFrom)
        conditions.push(gte(auditLogs.timestamp, new Date(dateFrom)));
      if (dateTo) conditions.push(lte(auditLogs.timestamp, new Date(dateTo)));

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = query
        .orderBy(desc(auditLogs.timestamp))
        .limit(limit)
        .offset(offset);

      const results = await query;

      // Get total count
      let countQuery = db.select({ count: count() }).from(auditLogs);
      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
      }
      const totalCount = await countQuery;

      return {
        auditTrail: results,
        totalCount: totalCount[0]?.count || 0,
        hasMore: offset + limit < (totalCount[0]?.count || 0),
      };
    }),
};
