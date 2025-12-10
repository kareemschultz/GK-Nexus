import { localContentSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, requirePermission } from "../index";

// Helper functions
function generateRegistrationNumber(): string {
  const prefix = "LCR";
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

function generatePlanNumber(): string {
  const prefix = "LCP";
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

function generateReportNumber(): string {
  const prefix = "RPT";
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

// Enums based on Guyana's Local Content Act
const localContentCategories = [
  "OIL_AND_GAS",
  "MINING",
  "FORESTRY",
  "AGRICULTURE",
  "MANUFACTURING",
  "CONSTRUCTION",
  "SERVICES",
  "TECHNOLOGY",
  "OTHER",
] as const;

const complianceStatuses = [
  "PENDING_REGISTRATION",
  "REGISTERED",
  "COMPLIANT",
  "NON_COMPLIANT",
  "UNDER_REVIEW",
  "SUSPENDED",
  "REVOKED",
] as const;

const reportPeriodTypes = [
  "MONTHLY",
  "QUARTERLY",
  "SEMI_ANNUAL",
  "ANNUAL",
] as const;

// Zod schemas
const registrationQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.enum(localContentCategories).optional(),
  complianceStatus: z.enum(complianceStatuses).optional(),
  clientId: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createRegistrationSchema = z.object({
  clientId: z.string().min(1),
  companyName: z.string().min(1),
  category: z.enum(localContentCategories),
  businessRegistrationNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  nisNumber: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  guyaneseOwnershipPercent: z.string().optional(),
  guyaneseEmploymentPercent: z.string().optional(),
  guyaneseManagementPercent: z.string().optional(),
  hasTaxClearance: z.boolean().default(false),
  hasNisClearance: z.boolean().default(false),
  hasBusinessRegistration: z.boolean().default(false),
  requiredDocuments: z.array(z.string()).optional(),
  submittedDocuments: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const createPlanSchema = z.object({
  registrationId: z.string().min(1),
  planYear: z.number().min(2020).max(2100),
  planTitle: z.string().min(1),
  planDescription: z.string().optional(),
  employmentTargets: z
    .object({
      totalJobs: z.number().optional(),
      guyaneseJobs: z.number().optional(),
      targetPercent: z.string().optional(),
    })
    .optional(),
  procurementTargets: z
    .object({
      totalSpend: z.string().optional(),
      localSpend: z.string().optional(),
      targetPercent: z.string().optional(),
    })
    .optional(),
  trainingTargets: z
    .object({
      totalTrainingHours: z.number().optional(),
      guyaneseParticipants: z.number().optional(),
      trainingBudget: z.string().optional(),
    })
    .optional(),
  technologyTransferTargets: z
    .object({
      initiatives: z.array(z.string()).optional(),
      budget: z.string().optional(),
    })
    .optional(),
  submissionDate: z.string().datetime().optional(),
  approvalDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const createReportSchema = z.object({
  registrationId: z.string().min(1),
  planId: z.string().optional(),
  reportPeriodType: z.enum(reportPeriodTypes),
  periodStartDate: z.string().datetime(),
  periodEndDate: z.string().datetime(),
  reportTitle: z.string().min(1),
  employmentData: z
    .object({
      totalEmployees: z.number().optional(),
      guyaneseEmployees: z.number().optional(),
      newHires: z.number().optional(),
      guyaneseNewHires: z.number().optional(),
      managementTotal: z.number().optional(),
      guyaneseManagement: z.number().optional(),
    })
    .optional(),
  procurementData: z
    .object({
      totalProcurement: z.string().optional(),
      localProcurement: z.string().optional(),
      currency: z.string().default("GYD"),
      vendorCount: z.number().optional(),
      localVendorCount: z.number().optional(),
    })
    .optional(),
  trainingData: z
    .object({
      trainingHours: z.number().optional(),
      participantsCount: z.number().optional(),
      guyaneseParticipants: z.number().optional(),
      trainingExpenditure: z.string().optional(),
    })
    .optional(),
  executiveSummary: z.string().optional(),
  challenges: z.string().optional(),
  achievements: z.string().optional(),
  nextPeriodPlans: z.string().optional(),
  notes: z.string().optional(),
});

// ========================================
// LOCAL CONTENT REGISTRATIONS (FLAT PROCEDURES)
// ========================================

export const localContentRegistrationsList = protectedProcedure
  .use(requirePermission("localcontent.read"))
  .input(registrationQuerySchema)
  .handler(async ({ input, context }) => {
    const {
      page,
      limit,
      search,
      category,
      complianceStatus,
      clientId,
      sortBy,
      sortOrder,
    } = input;
    const { db } = context;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(
          ${ilike(localContentSchema.localContentRegistrations.companyName, `%${search}%`)} OR
          ${ilike(localContentSchema.localContentRegistrations.registrationNumber, `%${search}%`)} OR
          ${ilike(localContentSchema.localContentRegistrations.tinNumber, `%${search}%`)}
        )`
      );
    }

    if (category) {
      conditions.push(
        eq(
          localContentSchema.localContentRegistrations.registrationType as any,
          category
        )
      );
    }

    if (complianceStatus) {
      conditions.push(
        eq(
          localContentSchema.localContentRegistrations.status as any,
          complianceStatus
        )
      );
    }

    if (clientId) {
      conditions.push(
        eq(localContentSchema.localContentRegistrations.clientId, clientId)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResults = await db
      .select({ count: count() })
      .from(localContentSchema.localContentRegistrations)
      .where(whereClause);

    const totalResult = totalResults[0];
    if (!totalResult) {
      return {
        success: true,
        data: {
          items: [],
          pagination: { page, limit, total: 0, pages: 0 },
        },
      };
    }

    const sortCol =
      localContentSchema.localContentRegistrations[
        sortBy as keyof typeof localContentSchema.localContentRegistrations
      ] || localContentSchema.localContentRegistrations.createdAt;
    const orderClause =
      sortOrder === "asc" ? asc(sortCol as any) : desc(sortCol as any);

    const registrations = await db
      .select()
      .from(localContentSchema.localContentRegistrations)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        items: registrations,
        pagination: {
          page,
          limit,
          total: totalResult.count,
          pages: Math.ceil(totalResult.count / limit),
        },
      },
    };
  });

export const localContentRegistrationsGetById = protectedProcedure
  .use(requirePermission("localcontent.read"))
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { id } = input;

    const [registration] = await db
      .select()
      .from(localContentSchema.localContentRegistrations)
      .where(eq(localContentSchema.localContentRegistrations.id, id))
      .limit(1);

    if (!registration) {
      throw new ORPCError("NOT_FOUND", { message: "Registration not found" });
    }

    const plans = await db
      .select()
      .from(localContentSchema.localContentPlans)
      .where(eq(localContentSchema.localContentPlans.registrationId, id))
      .orderBy(desc(localContentSchema.localContentPlans.periodStart));

    const reports = await db
      .select()
      .from(localContentSchema.localContentReports)
      .where(eq(localContentSchema.localContentReports.registrationId, id))
      .orderBy(desc(localContentSchema.localContentReports.periodEnd))
      .limit(10);

    return {
      success: true,
      data: {
        ...registration,
        plans,
        recentReports: reports,
      },
    };
  });

export const localContentRegistrationsCreate = protectedProcedure
  .use(requirePermission("localcontent.create"))
  .input(createRegistrationSchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;

    const registrationData = {
      ...input,
      id: nanoid(),
      registrationNumber: generateRegistrationNumber(),
      organizationId: "default", // TODO: Get from user context when organization support is added
      registrationDate: new Date(),
      status: "IN_PROGRESS" as const,
      requiredDocuments: input.requiredDocuments
        ? JSON.stringify(input.requiredDocuments)
        : null,
      submittedDocuments: input.submittedDocuments
        ? JSON.stringify(input.submittedDocuments)
        : null,
      createdBy: user?.id,
    };

    const [newRegistration] = await db
      .insert(localContentSchema.localContentRegistrations)
      .values(registrationData as any)
      .returning();

    return {
      success: true,
      data: newRegistration,
      message: "Local content registration created successfully",
    };
  });

export const localContentRegistrationsUpdate = protectedProcedure
  .use(requirePermission("localcontent.update"))
  .input(
    z.object({
      id: z.string().min(1),
      data: createRegistrationSchema.partial().extend({
        complianceStatus: z.enum(complianceStatuses).optional(),
        registrationDate: z.string().datetime().optional(),
        expiryDate: z.string().datetime().optional(),
      }),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { id, data } = input;

    const updateData = {
      ...data,
      requiredDocuments: data.requiredDocuments
        ? JSON.stringify(data.requiredDocuments)
        : undefined,
      submittedDocuments: data.submittedDocuments
        ? JSON.stringify(data.submittedDocuments)
        : undefined,
      registrationDate: data.registrationDate
        ? new Date(data.registrationDate)
        : undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
    };

    const [updatedRegistration] = await db
      .update(localContentSchema.localContentRegistrations)
      .set(updateData)
      .where(eq(localContentSchema.localContentRegistrations.id, id))
      .returning();

    if (!updatedRegistration) {
      throw new ORPCError("NOT_FOUND", { message: "Registration not found" });
    }

    return {
      success: true,
      data: updatedRegistration,
      message: "Registration updated successfully",
    };
  });

export const localContentRegistrationsApprove = protectedProcedure
  .use(requirePermission("localcontent.update"))
  .input(
    z.object({
      id: z.string().min(1),
      expiryDate: z.string().datetime().optional(),
      notes: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user: _user } = context;
    const { id, expiryDate, notes } = input;

    const [updatedRegistration] = await db
      .update(localContentSchema.localContentRegistrations)
      .set({
        status: "COMPLIANT",
        registrationDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes,
      })
      .where(eq(localContentSchema.localContentRegistrations.id, id))
      .returning();

    if (!updatedRegistration) {
      throw new ORPCError("NOT_FOUND", { message: "Registration not found" });
    }

    return {
      success: true,
      data: updatedRegistration,
      message: "Registration approved successfully",
    };
  });

export const localContentRegistrationsStats = protectedProcedure
  .use(requirePermission("localcontent.read"))
  .handler(async ({ context }) => {
    const { db } = context;

    const statusStats = await db
      .select({
        complianceStatus: localContentSchema.localContentRegistrations.status,
        count: count(),
      })
      .from(localContentSchema.localContentRegistrations)
      .groupBy(localContentSchema.localContentRegistrations.status);

    const categoryStats = await db
      .select({
        category: localContentSchema.localContentRegistrations.registrationType,
        count: count(),
      })
      .from(localContentSchema.localContentRegistrations)
      .groupBy(localContentSchema.localContentRegistrations.registrationType);

    const totalResults = await db
      .select({ total: count() })
      .from(localContentSchema.localContentRegistrations);

    const totalResult = totalResults[0];

    return {
      success: true,
      data: {
        total: totalResult?.total || 0,
        byStatus: statusStats,
        byCategory: categoryStats,
      },
    };
  });

// ========================================
// LOCAL CONTENT PLANS (FLAT PROCEDURES)
// ========================================

export const localContentPlansList = protectedProcedure
  .use(requirePermission("localcontent.read"))
  .input(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      registrationId: z.string().optional(),
      planYear: z.number().optional(),
      status: z
        .enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"])
        .optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { page, limit, registrationId, status } = input;
    const { db } = context;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (registrationId) {
      conditions.push(
        eq(localContentSchema.localContentPlans.registrationId, registrationId)
      );
    }

    // Note: planYear removed - use periodStart/periodEnd instead
    // if (planYear) {
    //   conditions.push(
    //     eq(localContentSchema.localContentPlans.fiscalYear, planYear)
    //   );
    // }

    if (status) {
      conditions.push(
        eq(localContentSchema.localContentPlans.status as any, status)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResults = await db
      .select({ count: count() })
      .from(localContentSchema.localContentPlans)
      .where(whereClause);

    const totalResult = totalResults[0];
    if (!totalResult) {
      return {
        success: true,
        data: {
          items: [],
          pagination: { page, limit, total: 0, pages: 0 },
        },
      };
    }

    const plans = await db
      .select()
      .from(localContentSchema.localContentPlans)
      .where(whereClause)
      .orderBy(desc(localContentSchema.localContentPlans.periodStart))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        items: plans,
        pagination: {
          page,
          limit,
          total: totalResult.count,
          pages: Math.ceil(totalResult.count / limit),
        },
      },
    };
  });

export const localContentPlansCreate = protectedProcedure
  .use(requirePermission("localcontent.create"))
  .input(createPlanSchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;

    // Get clientId from registration
    const [registration] = await db
      .select()
      .from(localContentSchema.localContentRegistrations)
      .where(
        eq(
          localContentSchema.localContentRegistrations.id,
          input.registrationId
        )
      )
      .limit(1);

    if (!registration) {
      throw new ORPCError("NOT_FOUND", { message: "Registration not found" });
    }

    const planData = {
      id: nanoid(),
      registrationId: input.registrationId,
      clientId: registration.clientId,
      planNumber: generatePlanNumber(),
      planTitle: input.planTitle,
      organizationId: "default", // TODO: Get from user context when organization support is added
      status: "IN_PROGRESS" as const,
      periodStart: input.submissionDate
        ? new Date(input.submissionDate)
        : new Date(),
      periodEnd: input.approvalDate ? new Date(input.approvalDate) : new Date(),
      employmentPlan: input.employmentTargets
        ? JSON.stringify(input.employmentTargets)
        : null,
      procurementPlan: input.procurementTargets
        ? JSON.stringify(input.procurementTargets)
        : null,
      trainingPlan: input.trainingTargets
        ? JSON.stringify(input.trainingTargets)
        : null,
      technologyTransferPlan: input.technologyTransferTargets
        ? JSON.stringify(input.technologyTransferTargets)
        : null,
      submittedDate: input.submissionDate
        ? new Date(input.submissionDate)
        : null,
      approvedDate: input.approvalDate ? new Date(input.approvalDate) : null,
      notes: input.notes || null,
      currency: "GYD",
      createdBy: user?.id,
    };

    const [newPlan] = await db
      .insert(localContentSchema.localContentPlans)
      .values(planData as any)
      .returning();

    return {
      success: true,
      data: newPlan,
      message: "Local content plan created successfully",
    };
  });

export const localContentPlansUpdate = protectedProcedure
  .use(requirePermission("localcontent.update"))
  .input(
    z.object({
      id: z.string().min(1),
      data: createPlanSchema.partial().extend({
        status: z
          .enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"])
          .optional(),
      }),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { id, data } = input;

    const updateData: Record<string, unknown> = {};

    if (data.planTitle) updateData.planTitle = data.planTitle;
    if (data.planDescription) updateData.notes = data.planDescription;
    if (data.status) updateData.status = data.status;
    if (data.employmentTargets)
      updateData.employmentPlan = JSON.stringify(data.employmentTargets);
    if (data.procurementTargets)
      updateData.procurementPlan = JSON.stringify(data.procurementTargets);
    if (data.trainingTargets)
      updateData.trainingPlan = JSON.stringify(data.trainingTargets);
    if (data.technologyTransferTargets)
      updateData.technologyTransferPlan = JSON.stringify(
        data.technologyTransferTargets
      );
    if (data.submissionDate)
      updateData.submittedDate = new Date(data.submissionDate);
    if (data.approvalDate)
      updateData.approvedDate = new Date(data.approvalDate);
    if (data.notes) updateData.notes = data.notes;

    const [updatedPlan] = await db
      .update(localContentSchema.localContentPlans)
      .set(updateData)
      .where(eq(localContentSchema.localContentPlans.id, id))
      .returning();

    if (!updatedPlan) {
      throw new ORPCError("NOT_FOUND", { message: "Plan not found" });
    }

    return {
      success: true,
      data: updatedPlan,
      message: "Plan updated successfully",
    };
  });

export const localContentPlansSubmit = protectedProcedure
  .use(requirePermission("localcontent.update"))
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { id } = input;

    const [updatedPlan] = await db
      .update(localContentSchema.localContentPlans)
      .set({
        status: "UNDER_REVIEW",
        submittedDate: new Date(),
      })
      .where(eq(localContentSchema.localContentPlans.id, id))
      .returning();

    if (!updatedPlan) {
      throw new ORPCError("NOT_FOUND", { message: "Plan not found" });
    }

    return {
      success: true,
      data: updatedPlan,
      message: "Plan submitted for review",
    };
  });

// ========================================
// LOCAL CONTENT REPORTS (FLAT PROCEDURES)
// ========================================

export const localContentReportsList = protectedProcedure
  .use(requirePermission("localcontent.read"))
  .input(
    z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      registrationId: z.string().optional(),
      reportPeriodType: z.enum(reportPeriodTypes).optional(),
      status: z
        .enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED"])
        .optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { page, limit, registrationId, reportPeriodType, status } = input;
    const { db } = context;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (registrationId) {
      conditions.push(
        eq(
          localContentSchema.localContentReports.registrationId,
          registrationId
        )
      );
    }

    if (reportPeriodType) {
      conditions.push(
        eq(
          localContentSchema.localContentReports.reportPeriodType as any,
          reportPeriodType
        )
      );
    }

    if (status) {
      conditions.push(
        eq(localContentSchema.localContentReports.status as any, status)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const totalResults = await db
      .select({ count: count() })
      .from(localContentSchema.localContentReports)
      .where(whereClause);

    const totalResult = totalResults[0];
    if (!totalResult) {
      return {
        success: true,
        data: {
          items: [],
          pagination: { page, limit, total: 0, pages: 0 },
        },
      };
    }

    const reports = await db
      .select()
      .from(localContentSchema.localContentReports)
      .where(whereClause)
      .orderBy(desc(localContentSchema.localContentReports.periodEnd))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        items: reports,
        pagination: {
          page,
          limit,
          total: totalResult.count,
          pages: Math.ceil(totalResult.count / limit),
        },
      },
    };
  });

export const localContentReportsCreate = protectedProcedure
  .use(requirePermission("localcontent.create"))
  .input(createReportSchema)
  .handler(async ({ input, context }) => {
    const { db, user } = context;

    // Get clientId from registration
    const [registration] = await db
      .select()
      .from(localContentSchema.localContentRegistrations)
      .where(
        eq(
          localContentSchema.localContentRegistrations.id,
          input.registrationId
        )
      )
      .limit(1);

    if (!registration) {
      throw new ORPCError("NOT_FOUND", { message: "Registration not found" });
    }

    const reportData = {
      id: nanoid(),
      registrationId: input.registrationId,
      planId: input.planId || null,
      clientId: registration.clientId,
      reportNumber: generateReportNumber(),
      reportTitle: input.reportTitle,
      reportPeriodType: input.reportPeriodType,
      organizationId: "default", // TODO: Get from user context when organization support is added
      status: "IN_PROGRESS" as const,
      periodStart: new Date(input.periodStartDate),
      periodEnd: new Date(input.periodEndDate),
      employmentReport: input.employmentData
        ? JSON.stringify(input.employmentData)
        : null,
      procurementReport: input.procurementData
        ? JSON.stringify(input.procurementData)
        : null,
      trainingReport: input.trainingData
        ? JSON.stringify(input.trainingData)
        : null,
      notes: input.notes || null,
      currency: "GYD",
      createdBy: user?.id,
    };

    const [newReport] = await db
      .insert(localContentSchema.localContentReports)
      .values(reportData as any)
      .returning();

    return {
      success: true,
      data: newReport,
      message: "Report created successfully",
    };
  });

export const localContentReportsUpdate = protectedProcedure
  .use(requirePermission("localcontent.update"))
  .input(
    z.object({
      id: z.string().min(1),
      data: createReportSchema.partial().extend({
        status: z
          .enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED"])
          .optional(),
      }),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { id, data } = input;

    const updateData: Record<string, unknown> = {};

    if (data.reportTitle) updateData.reportTitle = data.reportTitle;
    if (data.reportPeriodType)
      updateData.reportPeriodType = data.reportPeriodType;
    if (data.status) updateData.status = data.status;
    if (data.periodStartDate)
      updateData.periodStart = new Date(data.periodStartDate);
    if (data.periodEndDate) updateData.periodEnd = new Date(data.periodEndDate);
    if (data.employmentData)
      updateData.employmentReport = JSON.stringify(data.employmentData);
    if (data.procurementData)
      updateData.procurementReport = JSON.stringify(data.procurementData);
    if (data.trainingData)
      updateData.trainingReport = JSON.stringify(data.trainingData);
    if (data.executiveSummary) updateData.notes = data.executiveSummary;
    if (data.notes) updateData.notes = data.notes;

    const [updatedReport] = await db
      .update(localContentSchema.localContentReports)
      .set(updateData)
      .where(eq(localContentSchema.localContentReports.id, id))
      .returning();

    if (!updatedReport) {
      throw new ORPCError("NOT_FOUND", { message: "Report not found" });
    }

    return {
      success: true,
      data: updatedReport,
      message: "Report updated successfully",
    };
  });

export const localContentReportsSubmit = protectedProcedure
  .use(requirePermission("localcontent.update"))
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { id } = input;

    const [updatedReport] = await db
      .update(localContentSchema.localContentReports)
      .set({
        status: "UNDER_REVIEW",
        submittedDate: new Date(),
      })
      .where(eq(localContentSchema.localContentReports.id, id))
      .returning();

    if (!updatedReport) {
      throw new ORPCError("NOT_FOUND", { message: "Report not found" });
    }

    return {
      success: true,
      data: updatedReport,
      message: "Report submitted for review",
    };
  });

// ========================================
// LOCAL CONTENT VENDORS (FLAT PROCEDURES)
// ========================================

export const localContentVendorsList = protectedProcedure
  .use(requirePermission("localcontent.read"))
  .input(
    z.object({
      search: z.string().optional(),
      vendorType: z.string().optional(),
      isGuyanese: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { search, vendorType, isGuyanese, isActive } = input;
    const { db } = context;

    const conditions = [];

    if (search) {
      conditions.push(
        sql`(
          ${ilike(localContentSchema.localContentVendors.vendorName, `%${search}%`)} OR
          ${ilike(localContentSchema.localContentVendors.tinNumber, `%${search}%`)}
        )`
      );
    }

    if (vendorType) {
      conditions.push(
        eq(localContentSchema.localContentVendors.vendorType, vendorType)
      );
    }

    if (isGuyanese !== undefined) {
      conditions.push(
        eq(localContentSchema.localContentVendors.isGuyaneseOwned, isGuyanese)
      );
    }

    if (isActive !== undefined) {
      conditions.push(
        eq(localContentSchema.localContentVendors.isActive, isActive)
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const vendors = await db
      .select()
      .from(localContentSchema.localContentVendors)
      .where(whereClause)
      .orderBy(asc(localContentSchema.localContentVendors.vendorName));

    return { success: true, data: vendors };
  });

export const localContentVendorsCreate = protectedProcedure
  .use(requirePermission("localcontent.create"))
  .input(
    z.object({
      vendorName: z.string().min(1),
      vendorType: z.string().min(1),
      tradingName: z.string().optional(),
      tinNumber: z.string().optional(),
      businessRegistrationNumber: z.string().optional(),
      localContentCertificateNumber: z.string().optional(),
      contactName: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      region: z.string().optional(),
      isGuyaneseOwned: z.boolean().default(false),
      guyaneseOwnershipPercent: z.string().optional(),
      productsServices: z.array(z.string()).optional(),
      industries: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;

    const vendorData = {
      id: nanoid(),
      vendorCode: `VND-${nanoid(6).toUpperCase()}`,
      vendorName: input.vendorName,
      vendorType: input.vendorType,
      tradingName: input.tradingName || null,
      tinNumber: input.tinNumber || null,
      businessRegistrationNumber: input.businessRegistrationNumber || null,
      localContentCertificateNumber:
        input.localContentCertificateNumber || null,
      contactName: input.contactName || null,
      email: input.email || null,
      phone: input.phone || null,
      address: input.address || null,
      region: input.region || null,
      organizationId: "default", // TODO: Get from user context when organization support is added
      isGuyaneseOwned: input.isGuyaneseOwned,
      guyaneseOwnershipPercent: input.guyaneseOwnershipPercent || null,
      productsServices: input.productsServices
        ? JSON.stringify(input.productsServices)
        : null,
      industries: input.industries ? JSON.stringify(input.industries) : null,
      notes: input.notes || null,
      isActive: true,
      isApproved: false,
      isVerified: false,
      createdBy: user?.id,
    };

    const [newVendor] = await db
      .insert(localContentSchema.localContentVendors)
      .values(vendorData)
      .returning();

    return {
      success: true,
      data: newVendor,
      message: "Vendor created successfully",
    };
  });

export const localContentVendorsUpdate = protectedProcedure
  .use(requirePermission("localcontent.update"))
  .input(
    z.object({
      id: z.string().min(1),
      data: z.object({
        vendorName: z.string().min(1).optional(),
        vendorType: z.string().optional(),
        tradingName: z.string().optional(),
        tinNumber: z.string().optional(),
        contactName: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        region: z.string().optional(),
        isGuyaneseOwned: z.boolean().optional(),
        guyaneseOwnershipPercent: z.string().optional(),
        productsServices: z.array(z.string()).optional(),
        industries: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        isVerified: z.boolean().optional(),
        notes: z.string().optional(),
      }),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { id, data } = input;

    const updateData: Record<string, unknown> = {};

    if (data.vendorName) updateData.vendorName = data.vendorName;
    if (data.vendorType) updateData.vendorType = data.vendorType;
    if (data.tradingName !== undefined)
      updateData.tradingName = data.tradingName;
    if (data.tinNumber !== undefined) updateData.tinNumber = data.tinNumber;
    if (data.contactName !== undefined)
      updateData.contactName = data.contactName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.region !== undefined) updateData.region = data.region;
    if (data.isGuyaneseOwned !== undefined)
      updateData.isGuyaneseOwned = data.isGuyaneseOwned;
    if (data.guyaneseOwnershipPercent !== undefined)
      updateData.guyaneseOwnershipPercent = data.guyaneseOwnershipPercent;
    if (data.productsServices)
      updateData.productsServices = JSON.stringify(data.productsServices);
    if (data.industries)
      updateData.industries = JSON.stringify(data.industries);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isVerified !== undefined) updateData.isVerified = data.isVerified;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedVendor] = await db
      .update(localContentSchema.localContentVendors)
      .set(updateData)
      .where(eq(localContentSchema.localContentVendors.id, id))
      .returning();

    if (!updatedVendor) {
      throw new ORPCError("NOT_FOUND", { message: "Vendor not found" });
    }

    return {
      success: true,
      data: updatedVendor,
      message: "Vendor updated successfully",
    };
  });

// ========================================
// LOCAL CONTENT CHECKLISTS (FLAT PROCEDURES)
// ========================================

export const localContentChecklistsList = protectedProcedure
  .use(requirePermission("localcontent.read"))
  .input(z.object({ registrationId: z.string().min(1) }))
  .handler(async ({ input, context }) => {
    const { registrationId } = input;
    const { db } = context;

    const checklists = await db
      .select()
      .from(localContentSchema.localContentChecklists)
      .where(
        eq(
          localContentSchema.localContentChecklists.registrationId,
          registrationId
        )
      )
      .orderBy(asc(localContentSchema.localContentChecklists.category));

    return { success: true, data: checklists };
  });

export const localContentChecklistsCreate = protectedProcedure
  .use(requirePermission("localcontent.create"))
  .input(
    z.object({
      registrationId: z.string().min(1),
      category: z.enum([
        "GOODS",
        "SERVICES",
        "EMPLOYMENT",
        "TRAINING",
        "TECHNOLOGY_TRANSFER",
        "MANAGEMENT",
        "OWNERSHIP",
        "FINANCING",
        "INSURANCE",
        "LEGAL_SERVICES",
        "RESEARCH_DEVELOPMENT",
      ]),
      itemCode: z.string().min(1),
      itemDescription: z.string().min(1),
      requirement: z.string().optional(),
      legalReference: z.string().optional(),
      targetValue: z.string().optional(),
      targetPercent: z.string().optional(),
      targetUnit: z.string().optional(),
      isMandatory: z.boolean().default(true),
      priority: z.string().default("medium"),
      notes: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;

    const checklistData = {
      id: nanoid(),
      registrationId: input.registrationId,
      category: input.category,
      itemCode: input.itemCode,
      itemDescription: input.itemDescription,
      requirement: input.requirement || null,
      legalReference: input.legalReference || null,
      targetValue: input.targetValue || null,
      targetPercent: input.targetPercent || null,
      targetUnit: input.targetUnit || null,
      isMandatory: input.isMandatory,
      priority: input.priority,
      notes: input.notes || null,
      organizationId: "default", // TODO: Get from user context when organization support is added
      evidenceProvided: false,
      updatedBy: user?.id,
    };

    const [newChecklist] = await db
      .insert(localContentSchema.localContentChecklists)
      .values(checklistData)
      .returning();

    return {
      success: true,
      data: newChecklist,
      message: "Checklist created successfully",
    };
  });

export const localContentChecklistsUpdate = protectedProcedure
  .use(requirePermission("localcontent.update"))
  .input(
    z.object({
      id: z.string().min(1),
      actualValue: z.string().optional(),
      actualPercent: z.string().optional(),
      isCompliant: z.boolean().optional(),
      complianceNotes: z.string().optional(),
      evidenceProvided: z.boolean().optional(),
      evidenceDocuments: z.array(z.string()).optional(),
      completedDate: z.string().datetime().optional(),
      notes: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    const { id, ...data } = input;

    const updateData: Record<string, unknown> = {};

    if (data.actualValue !== undefined)
      updateData.actualValue = data.actualValue;
    if (data.actualPercent !== undefined)
      updateData.actualPercent = data.actualPercent;
    if (data.isCompliant !== undefined)
      updateData.isCompliant = data.isCompliant;
    if (data.complianceNotes !== undefined)
      updateData.complianceNotes = data.complianceNotes;
    if (data.evidenceProvided !== undefined)
      updateData.evidenceProvided = data.evidenceProvided;
    if (data.evidenceDocuments)
      updateData.evidenceDocuments = JSON.stringify(data.evidenceDocuments);
    if (data.completedDate)
      updateData.completedDate = new Date(data.completedDate);
    if (data.notes !== undefined) updateData.notes = data.notes;
    updateData.updatedBy = user?.id;

    const [updatedChecklist] = await db
      .update(localContentSchema.localContentChecklists)
      .set(updateData)
      .where(eq(localContentSchema.localContentChecklists.id, id))
      .returning();

    if (!updatedChecklist) {
      throw new ORPCError("NOT_FOUND", { message: "Checklist not found" });
    }

    return {
      success: true,
      data: updatedChecklist,
      message: "Checklist item updated",
    };
  });
