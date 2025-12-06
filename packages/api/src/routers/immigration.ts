import { immigrationSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { adminProcedure, protectedProcedure } from "../index";

// Helper function to generate case number
function generateCaseNumber(): string {
  const prefix = "IMM";
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
  const random = nanoid(6).toUpperCase();
  return `${prefix}${year}${month}${random}`;
}

// Input schemas
const createImmigrationCaseSchema = z.object({
  clientId: z.string().uuid(),
  caseType: z.enum([
    "work_permit_initial",
    "work_permit_renewal",
    "work_permit_extension",
    "temporary_residence",
    "permanent_residence",
    "investor_visa",
    "family_reunification",
    "naturalization",
    "student_visa",
    "other",
  ]),
  priority: z
    .enum(["routine", "expedited", "urgent", "emergency"])
    .default("routine"),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  applicationDate: z.string().date().optional(),
  targetDecisionDate: z.string().date().optional(),
  isExpedited: z.boolean().default(false),
  governmentDepartment: z.string().optional(),
});

const updateImmigrationCaseSchema = createImmigrationCaseSchema
  .partial()
  .extend({
    id: z.string().uuid(),
    status: z
      .enum([
        "draft",
        "submitted",
        "under_review",
        "additional_docs_required",
        "approved",
        "refused",
        "withdrawn",
        "cancelled",
      ])
      .optional(),
    assignedTo: z.string().uuid().optional(),
  });

const immigrationCaseQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  clientId: z.string().uuid().optional(),
  caseType: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  sortBy: z
    .enum(["caseNumber", "title", "status", "priority", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createDocumentRequirementSchema = z.object({
  caseId: z.string().uuid(),
  documentType: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().optional(),
  isRequired: z.boolean().default(true),
  dueDate: z.string().date().optional(),
  sortOrder: z.number().default(0),
});

const createTimelineEventSchema = z.object({
  caseId: z.string().uuid(),
  eventType: z.string().min(1),
  eventTitle: z.string().min(1),
  eventDescription: z.string().optional(),
  previousStatus: z.string().optional(),
  newStatus: z.string().optional(),
  isMilestone: z.boolean().default(false),
});

// ============================================================================
// FLAT IMMIGRATION PROCEDURES
// ============================================================================

// Create new immigration case
export const immigrationCreateCase = protectedProcedure
  .input(createImmigrationCaseSchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const caseId = nanoid();
    const caseNumber = generateCaseNumber();

    const [newCase] = await db
      .insert(immigrationSchema.immigrationCases)
      .values({
        id: caseId,
        organizationId: "default-org",
        caseNumber,
        internalReference: `INT-${nanoid(8).toUpperCase()}`,
        clientId: input.clientId,
        caseType: input.caseType,
        priority: input.priority,
        title: input.title,
        description: input.description ?? null,
        applicationDate: input.applicationDate ?? null,
        targetDecisionDate: input.targetDecisionDate ?? null,
        isExpedited: input.isExpedited,
        governmentDepartment: input.governmentDepartment ?? null,
        status: "draft",
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning();

    if (!newCase) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create case",
      });
    }

    // Create initial timeline event
    await db.insert(immigrationSchema.immigrationTimeline).values({
      id: nanoid(),
      caseId,
      organizationId: "default-org",
      eventType: "case_created",
      eventTitle: "Immigration Case Created",
      eventDescription: `New ${input.caseType} case created`,
      newStatus: "draft",
      isMilestone: true,
      clientNotified: true,
      publicNote: "Your immigration case has been created.",
      createdBy: user.id,
    });

    return {
      success: true,
      data: {
        id: newCase.id,
        caseNumber: newCase.caseNumber,
        title: newCase.title,
        caseType: newCase.caseType,
        status: newCase.status,
        priority: newCase.priority,
        createdAt: newCase.createdAt,
      },
      message: "Immigration case created successfully",
    };
  });

// List immigration cases
export const immigrationListCases = protectedProcedure
  .input(immigrationCaseQuerySchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const {
      page,
      limit,
      clientId,
      caseType,
      status,
      priority,
      sortBy,
      sortOrder,
    } = input;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (clientId) {
      conditions.push(
        eq(immigrationSchema.immigrationCases.clientId, clientId)
      );
    }
    if (caseType) {
      conditions.push(
        eq(immigrationSchema.immigrationCases.caseType, caseType as any)
      );
    }
    if (status) {
      conditions.push(
        eq(immigrationSchema.immigrationCases.status, status as any)
      );
    }
    if (priority) {
      conditions.push(
        eq(immigrationSchema.immigrationCases.priority, priority as any)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ value: count() })
      .from(immigrationSchema.immigrationCases)
      .where(whereClause);

    const total = countResult[0]?.value ?? 0;

    // Get cases
    const cases = await db
      .select({
        id: immigrationSchema.immigrationCases.id,
        caseNumber: immigrationSchema.immigrationCases.caseNumber,
        title: immigrationSchema.immigrationCases.title,
        caseType: immigrationSchema.immigrationCases.caseType,
        status: immigrationSchema.immigrationCases.status,
        priority: immigrationSchema.immigrationCases.priority,
        clientId: immigrationSchema.immigrationCases.clientId,
        applicationDate: immigrationSchema.immigrationCases.applicationDate,
        targetDecisionDate:
          immigrationSchema.immigrationCases.targetDecisionDate,
        isExpedited: immigrationSchema.immigrationCases.isExpedited,
        createdAt: immigrationSchema.immigrationCases.createdAt,
        updatedAt: immigrationSchema.immigrationCases.updatedAt,
      })
      .from(immigrationSchema.immigrationCases)
      .where(whereClause)
      .orderBy(
        sortOrder === "asc"
          ? asc(immigrationSchema.immigrationCases[sortBy])
          : desc(immigrationSchema.immigrationCases[sortBy])
      )
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        items: cases,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  });

// Get immigration case by ID
export const immigrationGetCaseById = protectedProcedure
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const [immigrationCase] = await db
      .select()
      .from(immigrationSchema.immigrationCases)
      .where(eq(immigrationSchema.immigrationCases.id, input.id))
      .limit(1);

    if (!immigrationCase) {
      throw new ORPCError("NOT_FOUND", {
        message: "Immigration case not found",
      });
    }

    return {
      success: true,
      data: immigrationCase,
    };
  });

// Update immigration case
export const immigrationUpdateCase = protectedProcedure
  .input(updateImmigrationCaseSchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const { id, ...updateData } = input;

    // Check if case exists
    const [existingCase] = await db
      .select()
      .from(immigrationSchema.immigrationCases)
      .where(eq(immigrationSchema.immigrationCases.id, id))
      .limit(1);

    if (!existingCase) {
      throw new ORPCError("NOT_FOUND", {
        message: "Immigration case not found",
      });
    }

    const [updatedCase] = await db
      .update(immigrationSchema.immigrationCases)
      .set({
        ...updateData,
        updatedBy: user.id,
      })
      .where(eq(immigrationSchema.immigrationCases.id, id))
      .returning();

    // Create timeline event if status changed
    if (updateData.status && updateData.status !== existingCase.status) {
      await db.insert(immigrationSchema.immigrationTimeline).values({
        id: nanoid(),
        caseId: id,
        organizationId: "default-org",
        eventType: "status_change",
        eventTitle: "Case Status Updated",
        eventDescription: `Status changed from ${existingCase.status} to ${updateData.status}`,
        previousStatus: existingCase.status as any,
        newStatus: updateData.status as any,
        isMilestone: true,
        clientNotified: true,
        publicNote: `Your case status has been updated to: ${updateData.status}`,
        createdBy: user.id,
      });
    }

    if (!updatedCase) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update case",
      });
    }

    return {
      success: true,
      data: {
        id: updatedCase.id,
        caseNumber: updatedCase.caseNumber,
        title: updatedCase.title,
        status: updatedCase.status,
        updatedAt: updatedCase.updatedAt,
      },
      message: "Immigration case updated successfully",
    };
  });

// Archive immigration case
export const immigrationArchiveCase = protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      reason: z.string().max(500).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const [archivedCase] = await db
      .update(immigrationSchema.immigrationCases)
      .set({
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: user.id,
        updatedBy: user.id,
      })
      .where(eq(immigrationSchema.immigrationCases.id, input.id))
      .returning();

    if (!archivedCase) {
      throw new ORPCError("NOT_FOUND", {
        message: "Immigration case not found",
      });
    }

    // Create timeline event
    await db.insert(immigrationSchema.immigrationTimeline).values({
      id: nanoid(),
      caseId: input.id,
      organizationId: "default-org",
      eventType: "case_archived",
      eventTitle: "Case Archived",
      eventDescription: `Case archived${input.reason ? `: ${input.reason}` : ""}`,
      isMilestone: true,
      clientNotified: true,
      publicNote: "Your case has been archived.",
      createdBy: user.id,
    });

    return {
      success: true,
      data: {
        id: archivedCase.id,
        caseNumber: archivedCase.caseNumber,
        isArchived: archivedCase.isArchived,
      },
      message: "Immigration case archived successfully",
    };
  });

// Get document requirements for a case
export const immigrationGetDocumentRequirements = protectedProcedure
  .input(z.object({ caseId: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const requirements = await db
      .select()
      .from(immigrationSchema.immigrationDocumentRequirements)
      .where(
        eq(
          immigrationSchema.immigrationDocumentRequirements.caseId,
          input.caseId
        )
      )
      .orderBy(
        asc(immigrationSchema.immigrationDocumentRequirements.sortOrder),
        asc(immigrationSchema.immigrationDocumentRequirements.displayName)
      );

    return {
      success: true,
      data: requirements,
    };
  });

// Create document requirement
export const immigrationCreateDocumentRequirement = protectedProcedure
  .input(createDocumentRequirementSchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const [requirement] = await db
      .insert(immigrationSchema.immigrationDocumentRequirements)
      .values({
        id: nanoid(),
        organizationId: "default-org",
        caseId: input.caseId,
        documentType: input.documentType,
        displayName: input.displayName,
        description: input.description ?? null,
        isRequired: input.isRequired,
        dueDate: input.dueDate ?? null,
        sortOrder: input.sortOrder,
        createdBy: user.id,
      })
      .returning();

    return {
      success: true,
      data: requirement,
      message: "Document requirement created successfully",
    };
  });

// Update document requirement
export const immigrationUpdateDocumentRequirement = protectedProcedure
  .input(
    z.object({
      id: z.string().uuid(),
      status: z
        .enum(["not_required", "required", "submitted", "verified", "rejected"])
        .optional(),
      verificationNotes: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const { id, ...updateData } = input;

    const updateValues: Record<string, unknown> = {
      ...updateData,
      updatedBy: user.id,
    };

    if (updateData.status === "verified") {
      updateValues.verifiedBy = user.id;
      updateValues.verifiedAt = new Date();
    }

    const [updated] = await db
      .update(immigrationSchema.immigrationDocumentRequirements)
      .set(updateValues)
      .where(eq(immigrationSchema.immigrationDocumentRequirements.id, id))
      .returning();

    if (!updated) {
      throw new ORPCError("NOT_FOUND", {
        message: "Document requirement not found",
      });
    }

    return {
      success: true,
      data: updated,
      message: "Document requirement updated successfully",
    };
  });

// Get case timeline
export const immigrationGetCaseTimeline = protectedProcedure
  .input(
    z.object({
      caseId: z.string().uuid(),
      includeInternal: z.boolean().default(false),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const conditions = [
      eq(immigrationSchema.immigrationTimeline.caseId, input.caseId),
    ];

    if (!input.includeInternal) {
      conditions.push(
        isNull(immigrationSchema.immigrationTimeline.internalNote)
      );
    }

    const timeline = await db
      .select()
      .from(immigrationSchema.immigrationTimeline)
      .where(and(...conditions))
      .orderBy(desc(immigrationSchema.immigrationTimeline.eventDate));

    return {
      success: true,
      data: timeline,
    };
  });

// Create timeline event
export const immigrationCreateTimelineEvent = protectedProcedure
  .input(createTimelineEventSchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const [event] = await db
      .insert(immigrationSchema.immigrationTimeline)
      .values({
        id: nanoid(),
        organizationId: "default-org",
        caseId: input.caseId,
        eventType: input.eventType,
        eventTitle: input.eventTitle,
        eventDescription: input.eventDescription ?? null,
        previousStatus: (input.previousStatus as any) ?? null,
        newStatus: (input.newStatus as any) ?? null,
        isMilestone: input.isMilestone,
        createdBy: user.id,
      })
      .returning();

    return {
      success: true,
      data: event,
      message: "Timeline event created successfully",
    };
  });

// Get immigration statistics
export const immigrationGetStats = adminProcedure
  .input(
    z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { startDate, endDate } = input;

    const conditions = [eq(immigrationSchema.immigrationCases.isActive, true)];

    if (startDate) {
      conditions.push(
        gte(immigrationSchema.immigrationCases.createdAt, new Date(startDate))
      );
    }
    if (endDate) {
      conditions.push(
        lte(immigrationSchema.immigrationCases.createdAt, new Date(endDate))
      );
    }

    const whereClause = and(...conditions);

    // Get overall stats
    const totalResult = await db
      .select({ value: count() })
      .from(immigrationSchema.immigrationCases)
      .where(whereClause);

    const total = totalResult[0]?.value ?? 0;

    // Get status breakdown
    const statusStats = await db
      .select({
        status: immigrationSchema.immigrationCases.status,
        count: count(),
      })
      .from(immigrationSchema.immigrationCases)
      .where(whereClause)
      .groupBy(immigrationSchema.immigrationCases.status);

    // Get priority breakdown
    const priorityStats = await db
      .select({
        priority: immigrationSchema.immigrationCases.priority,
        count: count(),
      })
      .from(immigrationSchema.immigrationCases)
      .where(whereClause)
      .groupBy(immigrationSchema.immigrationCases.priority);

    return {
      success: true,
      data: {
        overview: { total },
        byStatus: statusStats,
        byPriority: priorityStats,
      },
    };
  });

// Get upcoming deadlines
export const immigrationGetUpcomingDeadlines = protectedProcedure
  .input(
    z.object({
      daysAhead: z.number().min(1).max(365).default(30),
      clientId: z.string().uuid().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    if (!user?.id) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "User not authenticated",
      });
    }

    const { daysAhead, clientId } = input;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);
    const todayStr = new Date().toISOString().split("T")[0] as string;
    const futureStr = futureDate.toISOString().split("T")[0] as string;

    const conditions = [
      eq(immigrationSchema.immigrationCases.isActive, true),
      gte(
        immigrationSchema.immigrationCases.targetDecisionDate,
        todayStr as any
      ),
      lte(
        immigrationSchema.immigrationCases.targetDecisionDate,
        futureStr as any
      ),
    ];

    if (clientId) {
      conditions.push(
        eq(immigrationSchema.immigrationCases.clientId, clientId)
      );
    }

    const deadlines = await db
      .select({
        id: immigrationSchema.immigrationCases.id,
        caseNumber: immigrationSchema.immigrationCases.caseNumber,
        title: immigrationSchema.immigrationCases.title,
        caseType: immigrationSchema.immigrationCases.caseType,
        priority: immigrationSchema.immigrationCases.priority,
        clientId: immigrationSchema.immigrationCases.clientId,
        targetDecisionDate:
          immigrationSchema.immigrationCases.targetDecisionDate,
        status: immigrationSchema.immigrationCases.status,
      })
      .from(immigrationSchema.immigrationCases)
      .where(and(...conditions))
      .orderBy(asc(immigrationSchema.immigrationCases.targetDecisionDate));

    const deadlinesWithDays = deadlines.map((deadline) => {
      const targetDate = deadline.targetDecisionDate
        ? new Date(deadline.targetDecisionDate)
        : new Date();
      const daysUntil = Math.ceil(
        (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...deadline,
        daysUntilDeadline: daysUntil,
        urgencyLevel:
          daysUntil <= 7
            ? "critical"
            : daysUntil <= 14
              ? "high"
              : daysUntil <= 30
                ? "medium"
                : "low",
      };
    });

    return {
      success: true,
      data: deadlinesWithDays,
    };
  });
