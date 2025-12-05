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

// ============================================================================
// FLAT COMPLIANCE PROCEDURES (domain prefix: compliance)
// ============================================================================

// Dashboard overview
export const complianceGetDashboardOverview = protectedProcedure.handler(
  async () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const [
      totalRequirements,
      activeFilings,
      overdueFilings,
      upcomingDeadlines,
      criticalAlerts,
      completedThisMonth,
    ] = await Promise.all([
      db
        .select({ count: count() })
        .from(complianceRequirements)
        .where(eq(complianceRequirements.isActive, true)),

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

      db
        .select({ count: count() })
        .from(complianceFilings)
        .where(
          sql`${complianceFilings.status} = 'overdue' AND ${complianceFilings.dueDate} <= ${today.toISOString().split("T")[0]}`
        ),

      db
        .select({ count: count() })
        .from(complianceFilings)
        .where(
          sql`${complianceFilings.status} IN ('not_started', 'in_progress', 'under_review') AND ${complianceFilings.dueDate} >= ${today.toISOString().split("T")[0]} AND ${complianceFilings.dueDate} <= ${thirtyDaysFromNow.toISOString().split("T")[0]}`
        ),

      db
        .select({ count: count() })
        .from(complianceFilings)
        .where(
          sql`${complianceFilings.priority} = 'critical' AND ${complianceFilings.status} IN ('not_started', 'in_progress', 'under_review')`
        ),

      db
        .select({ count: count() })
        .from(complianceFilings)
        .where(
          sql`${complianceFilings.status} = 'completed' AND ${complianceFilings.completedAt} >= ${new Date(today.getFullYear(), today.getMonth(), 1).toISOString()}`
        ),
    ]);

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

    const getTrafficLightStatus = (score: number) => {
      if (score >= 90) return "green";
      if (score >= 70) return "yellow";
      return "red";
    };

    const trafficLightStatus = getTrafficLightStatus(complianceScore);

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
  }
);

// Get compliance requirements
export const complianceGetRequirements = protectedProcedure
  .input(complianceFiltersSchema.omit({ filingPeriod: true, isOverdue: true }))
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

    const baseQuery = db
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
          name: clients.name,
        },
        assignedToUser: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(complianceRequirements)
      .leftJoin(clients, eq(complianceRequirements.clientId, clients.id))
      .leftJoin(users, eq(complianceRequirements.assignedTo, users.id))
      .$dynamic();

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

    const sortColumn = {
      dueDate: complianceRequirements.nextDueDate,
      createdAt: complianceRequirements.createdAt,
      updatedAt: complianceRequirements.updatedAt,
      priority: complianceRequirements.priority,
      status: complianceRequirements.isActive,
    }[sortBy];

    const results = await baseQuery
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn))
      .limit(limit)
      .offset(offset);

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
  });

// Get compliance filings
export const complianceGetFilings = protectedProcedure
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

    const baseQuery = db
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
          name: clients.name,
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
      .leftJoin(users, eq(complianceFilings.assignedTo, users.id))
      .$dynamic();

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
      conditions.push(sql`${complianceFilings.dueDate} <= ${today}`);
      conditions.push(
        inArray(complianceFilings.status, [
          "not_started",
          "in_progress",
          "under_review",
        ])
      );
    }
    if (search) {
      conditions.push(
        sql`${complianceRequirements.title} ILIKE ${`%${search}%`} OR ${complianceFilings.referenceNumber} ILIKE ${`%${search}%`} OR ${complianceFilings.confirmationNumber} ILIKE ${`%${search}%`}`
      );
    }

    const sortColumn = {
      dueDate: complianceFilings.dueDate,
      createdAt: complianceFilings.createdAt,
      updatedAt: complianceFilings.updatedAt,
      priority: complianceFilings.priority,
      status: complianceFilings.status,
    }[sortBy];

    const results = await baseQuery
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn))
      .limit(limit)
      .offset(offset);

    let countBaseQuery = db
      .select({ count: count() })
      .from(complianceFilings)
      .$dynamic();

    if (complianceType?.length) {
      countBaseQuery = countBaseQuery.leftJoin(
        complianceRequirements,
        eq(complianceFilings.requirementId, complianceRequirements.id)
      );
    }

    const totalCount = await countBaseQuery.where(
      conditions.length > 0 ? and(...conditions) : undefined
    );

    return {
      filings: results,
      totalCount: totalCount[0]?.count || 0,
      hasMore: offset + limit < (totalCount[0]?.count || 0),
    };
  });

// Create compliance requirement
export const complianceCreateRequirement = protectedProcedure
  .input(createComplianceRequirementSchema)
  .handler(async ({ input, context }) => {
    const userId = context.user.id;
    const requirementId = generateId();

    const insertData = {
      id: requirementId,
      clientId: input.clientId,
      complianceType: input.complianceType,
      title: input.title,
      description: input.description || null,
      frequency: input.frequency,
      priority: input.priority,
      nextDueDate: input.nextDueDate || null,
      assignedTo: input.assignedTo || null,
      estimatedHours:
        input.estimatedHours !== undefined
          ? String(input.estimatedHours)
          : null,
      feeAmount: input.feeAmount !== undefined ? String(input.feeAmount) : null,
      notes: input.notes || null,
      reminderDays: input.reminderDays
        ? JSON.stringify(input.reminderDays)
        : null,
      dependencies: input.dependencies
        ? JSON.stringify(input.dependencies)
        : null,
      createdBy: userId,
      updatedBy: userId,
    };

    const newRequirement = await db
      .insert(complianceRequirements)
      .values(insertData)
      .returning();

    await db.insert(auditLogs).values({
      id: generateId(),
      entity: "compliance_requirement",
      entityId: requirementId,
      action: "create",
      description: "Created compliance requirement",
      userId,
      oldValues: null,
      newValues: JSON.stringify(input),
    });

    return newRequirement[0];
  });

// Update compliance requirement
export const complianceUpdateRequirement = protectedProcedure
  .input(z.object({ id: z.string(), data: updateComplianceRequirementSchema }))
  .handler(async ({ input, context }) => {
    const { id, data } = input;
    const userId = context.user.id;

    const existing = await db
      .select()
      .from(complianceRequirements)
      .where(eq(complianceRequirements.id, id))
      .limit(1);

    if (!existing.length) {
      throw new ORPCError("NOT_FOUND", {
        message: "Compliance requirement not found",
      });
    }

    const updatePayload: Record<string, unknown> = {
      ...data,
      updatedBy: userId,
    };

    if (data.reminderDays) {
      updatePayload.reminderDays = JSON.stringify(data.reminderDays);
    }
    if (data.dependencies) {
      updatePayload.dependencies = JSON.stringify(data.dependencies);
    }

    const updatedRequirement = await db
      .update(complianceRequirements)
      .set(updatePayload)
      .where(eq(complianceRequirements.id, id))
      .returning();

    await db.insert(auditLogs).values({
      id: generateId(),
      entity: "compliance_requirement",
      entityId: id,
      action: "update",
      description: "Updated compliance requirement",
      userId,
      oldValues: JSON.stringify(existing[0]),
      newValues: JSON.stringify(data),
    });

    return updatedRequirement[0];
  });

// Create compliance filing
export const complianceCreateFiling = protectedProcedure
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

    await db.insert(auditLogs).values({
      id: generateId(),
      entity: "compliance_filing",
      entityId: filingId,
      action: "create",
      description: "Created compliance filing",
      userId,
      oldValues: null,
      newValues: JSON.stringify(input),
    });

    return newFiling[0];
  });

// Update compliance filing
export const complianceUpdateFiling = protectedProcedure
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
      throw new ORPCError("NOT_FOUND", {
        message: "Compliance filing not found",
      });
    }

    const existingRecord = existing[0];
    if (!existingRecord) {
      throw new ORPCError("NOT_FOUND", {
        message: "Compliance filing not found",
      });
    }

    const updateData: Record<string, unknown> = {
      ...data,
      attachments: data.attachments
        ? JSON.stringify(data.attachments)
        : undefined,
      updatedBy: userId,
    };

    if (data.status === "in_progress" && !existingRecord.startedAt) {
      updateData.startedAt = new Date().toISOString();
    }
    if (data.status === "completed" && !existingRecord.completedAt) {
      updateData.completedAt = new Date().toISOString();
      updateData.percentComplete = "100";
    }
    if (data.status === "filed" && !existingRecord.filedAt) {
      updateData.filedAt = new Date().toISOString();
    }

    const updatedFiling = await db
      .update(complianceFilings)
      .set(updateData)
      .where(eq(complianceFilings.id, id))
      .returning();

    await db.insert(auditLogs).values({
      id: generateId(),
      entity: "compliance_filing",
      entityId: id,
      action: "update",
      description: "Updated compliance filing",
      userId,
      oldValues: JSON.stringify(existing[0]),
      newValues: JSON.stringify(data),
    });

    return updatedFiling[0];
  });

// Export GRA Form 7B CSV
export const complianceExportGraForm7B = protectedProcedure
  .input(graForm7BExportSchema)
  .handler(async ({ input }) => {
    const { clientId, periodStart, periodEnd, includeDetails } = input;

    const client = await db
      .select()
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    if (!client.length) {
      throw new ORPCError("NOT_FOUND", { message: "Client not found" });
    }

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
        `"${client[0]?.businessName || ""}"`,
        `"${client[0]?.tinNumber || ""}"`,
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
    const filename = `GRA_Form7B_${client[0]?.businessName || "Client"}_${periodStart}_to_${periodEnd}.csv`;

    return {
      csvContent,
      filename,
      recordCount: vatFilings.length,
    };
  });

// Get alerts and upcoming deadlines
export const complianceGetAlerts = protectedProcedure
  .input(
    z.object({
      daysAhead: z.number().min(1).max(90).default(30),
      priority: z.array(z.enum(priorityEnum.enumValues)).optional(),
      complianceType: z.array(z.enum(complianceTypeEnum.enumValues)).optional(),
      limit: z.number().min(1).max(100).default(50),
    })
  )
  .handler(async ({ input }) => {
    const { daysAhead, priority, complianceType, limit } = input;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const baseQuery = db
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
          name: clients.name,
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
      .leftJoin(users, eq(complianceFilings.assignedTo, users.id))
      .$dynamic();

    const futureDateStr = futureDate.toISOString().split("T")[0];
    const conditions = [
      inArray(complianceFilings.status, [
        "not_started",
        "in_progress",
        "under_review",
      ]),
      sql`${complianceFilings.dueDate} <= ${futureDateStr}`,
    ];

    if (priority?.length)
      conditions.push(inArray(complianceFilings.priority, priority));
    if (complianceType?.length)
      conditions.push(
        inArray(complianceRequirements.complianceType, complianceType)
      );

    const alerts = await baseQuery
      .where(and(...conditions))
      .orderBy(asc(complianceFilings.dueDate))
      .limit(limit);

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
  });

// Get audit trail
export const complianceGetAuditTrail = protectedProcedure
  .input(
    z.object({
      entity: z
        .enum(["compliance_requirement", "compliance_filing"])
        .optional(),
      entityId: z.string().optional(),
      action: z.enum(["create", "update", "delete"]).optional(),
      userId: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    })
  )
  .handler(async ({ input }) => {
    const {
      entity,
      entityId,
      action,
      userId,
      dateFrom,
      dateTo,
      limit,
      offset,
    } = input;

    const baseQuery = db
      .select({
        id: auditLogs.id,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        action: auditLogs.action,
        description: auditLogs.description,
        oldValues: auditLogs.oldValues,
        newValues: auditLogs.newValues,
        createdAt: auditLogs.createdAt,
        userId: auditLogs.userId,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .$dynamic();

    const conditions = [
      inArray(auditLogs.entity, [
        "compliance_requirement",
        "compliance_filing",
      ]),
    ];

    if (entity) conditions.push(eq(auditLogs.entity, entity));
    if (entityId) conditions.push(eq(auditLogs.entityId, entityId));
    if (action) conditions.push(eq(auditLogs.action, action));
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (dateFrom) conditions.push(gte(auditLogs.createdAt, new Date(dateFrom)));
    if (dateTo) conditions.push(lte(auditLogs.createdAt, new Date(dateTo)));

    const results = await baseQuery
      .where(and(...conditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);

    const countBaseQuery = db
      .select({ count: count() })
      .from(auditLogs)
      .$dynamic();

    const totalCount = await countBaseQuery.where(and(...conditions));

    return {
      auditTrail: results,
      totalCount: totalCount[0]?.count || 0,
      hasMore: offset + limit < (totalCount[0]?.count || 0),
    };
  });
