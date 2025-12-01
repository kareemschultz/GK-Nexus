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
  // Local ownership details
  guyaneseOwnershipPercent: z.string().optional(),
  guyaneseEmploymentPercent: z.string().optional(),
  guyaneseManagementPercent: z.string().optional(),
  // Certifications
  hasTaxClearance: z.boolean().default(false),
  hasNisClearance: z.boolean().default(false),
  hasBusinessRegistration: z.boolean().default(false),
  // Documents
  requiredDocuments: z.array(z.string()).optional(),
  submittedDocuments: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const createPlanSchema = z.object({
  registrationId: z.string().min(1),
  planYear: z.number().min(2020).max(2100),
  planTitle: z.string().min(1),
  planDescription: z.string().optional(),
  // Targets
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
  // Employment data
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
  // Procurement data
  procurementData: z
    .object({
      totalProcurement: z.string().optional(),
      localProcurement: z.string().optional(),
      currency: z.string().default("GYD"),
      vendorCount: z.number().optional(),
      localVendorCount: z.number().optional(),
    })
    .optional(),
  // Training data
  trainingData: z
    .object({
      trainingHours: z.number().optional(),
      participantsCount: z.number().optional(),
      guyaneseParticipants: z.number().optional(),
      trainingExpenditure: z.string().optional(),
    })
    .optional(),
  // Summary
  executiveSummary: z.string().optional(),
  challenges: z.string().optional(),
  achievements: z.string().optional(),
  nextPeriodPlans: z.string().optional(),
  notes: z.string().optional(),
});

export const localContentRouter = {
  // ===== REGISTRATIONS =====
  registrations: {
    list: protectedProcedure
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
            eq(localContentSchema.localContentRegistrations.category, category)
          );
        }

        if (complianceStatus) {
          conditions.push(
            eq(
              localContentSchema.localContentRegistrations.complianceStatus,
              complianceStatus
            )
          );
        }

        if (clientId) {
          conditions.push(
            eq(localContentSchema.localContentRegistrations.clientId, clientId)
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [totalResult] = await db
          .select({ count: count() })
          .from(localContentSchema.localContentRegistrations)
          .where(whereClause);

        const sortColumn =
          localContentSchema.localContentRegistrations[
            sortBy as keyof typeof localContentSchema.localContentRegistrations
          ] || localContentSchema.localContentRegistrations.createdAt;
        const orderClause =
          sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

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
      }),

    getById: protectedProcedure
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
          throw new ORPCError("NOT_FOUND", "Registration not found");
        }

        // Get plans and reports
        const plans = await db
          .select()
          .from(localContentSchema.localContentPlans)
          .where(eq(localContentSchema.localContentPlans.registrationId, id))
          .orderBy(desc(localContentSchema.localContentPlans.planYear));

        const reports = await db
          .select()
          .from(localContentSchema.localContentReports)
          .where(eq(localContentSchema.localContentReports.registrationId, id))
          .orderBy(desc(localContentSchema.localContentReports.periodEndDate))
          .limit(10);

        return {
          success: true,
          data: {
            ...registration,
            plans,
            recentReports: reports,
          },
        };
      }),

    create: protectedProcedure
      .use(requirePermission("localcontent.create"))
      .input(createRegistrationSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const registrationData = {
          ...input,
          id: nanoid(),
          registrationNumber: generateRegistrationNumber(),
          organizationId: user?.organizationId || "default",
          complianceStatus: "PENDING_REGISTRATION" as const,
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
          .values(registrationData)
          .returning();

        return {
          success: true,
          data: newRegistration,
          message: "Local content registration created successfully",
        };
      }),

    update: protectedProcedure
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
          throw new ORPCError("NOT_FOUND", "Registration not found");
        }

        return {
          success: true,
          data: updatedRegistration,
          message: "Registration updated successfully",
        };
      }),

    approve: protectedProcedure
      .use(requirePermission("localcontent.update"))
      .input(
        z.object({
          id: z.string().min(1),
          expiryDate: z.string().datetime().optional(),
          notes: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user } = context;
        const { id, expiryDate, notes } = input;

        const [updatedRegistration] = await db
          .update(localContentSchema.localContentRegistrations)
          .set({
            complianceStatus: "REGISTERED",
            registrationDate: new Date(),
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            notes,
            approvedBy: user?.id,
          })
          .where(eq(localContentSchema.localContentRegistrations.id, id))
          .returning();

        if (!updatedRegistration) {
          throw new ORPCError("NOT_FOUND", "Registration not found");
        }

        return {
          success: true,
          data: updatedRegistration,
          message: "Registration approved successfully",
        };
      }),

    stats: protectedProcedure
      .use(requirePermission("localcontent.read"))
      .handler(async ({ context }) => {
        const { db } = context;

        const statusStats = await db
          .select({
            complianceStatus:
              localContentSchema.localContentRegistrations.complianceStatus,
            count: count(),
          })
          .from(localContentSchema.localContentRegistrations)
          .groupBy(
            localContentSchema.localContentRegistrations.complianceStatus
          );

        const categoryStats = await db
          .select({
            category: localContentSchema.localContentRegistrations.category,
            count: count(),
          })
          .from(localContentSchema.localContentRegistrations)
          .groupBy(localContentSchema.localContentRegistrations.category);

        const [totalResult] = await db
          .select({ total: count() })
          .from(localContentSchema.localContentRegistrations);

        return {
          success: true,
          data: {
            total: totalResult.total,
            byStatus: statusStats,
            byCategory: categoryStats,
          },
        };
      }),
  },

  // ===== PLANS =====
  plans: {
    list: protectedProcedure
      .use(requirePermission("localcontent.read"))
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          registrationId: z.string().optional(),
          planYear: z.number().optional(),
          status: z
            .enum([
              "DRAFT",
              "SUBMITTED",
              "UNDER_REVIEW",
              "APPROVED",
              "REJECTED",
            ])
            .optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { page, limit, registrationId, planYear, status } = input;
        const { db } = context;
        const offset = (page - 1) * limit;

        const conditions = [];

        if (registrationId) {
          conditions.push(
            eq(
              localContentSchema.localContentPlans.registrationId,
              registrationId
            )
          );
        }

        if (planYear) {
          conditions.push(
            eq(localContentSchema.localContentPlans.planYear, planYear)
          );
        }

        if (status) {
          conditions.push(
            eq(localContentSchema.localContentPlans.status, status)
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [totalResult] = await db
          .select({ count: count() })
          .from(localContentSchema.localContentPlans)
          .where(whereClause);

        const plans = await db
          .select()
          .from(localContentSchema.localContentPlans)
          .where(whereClause)
          .orderBy(desc(localContentSchema.localContentPlans.planYear))
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
      }),

    create: protectedProcedure
      .use(requirePermission("localcontent.create"))
      .input(createPlanSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const planData = {
          ...input,
          id: nanoid(),
          planNumber: generatePlanNumber(),
          organizationId: user?.organizationId || "default",
          status: "DRAFT" as const,
          employmentTargets: input.employmentTargets
            ? JSON.stringify(input.employmentTargets)
            : null,
          procurementTargets: input.procurementTargets
            ? JSON.stringify(input.procurementTargets)
            : null,
          trainingTargets: input.trainingTargets
            ? JSON.stringify(input.trainingTargets)
            : null,
          technologyTransferTargets: input.technologyTransferTargets
            ? JSON.stringify(input.technologyTransferTargets)
            : null,
          submissionDate: input.submissionDate
            ? new Date(input.submissionDate)
            : null,
          approvalDate: input.approvalDate
            ? new Date(input.approvalDate)
            : null,
          createdBy: user?.id,
        };

        const [newPlan] = await db
          .insert(localContentSchema.localContentPlans)
          .values(planData)
          .returning();

        return {
          success: true,
          data: newPlan,
          message: "Local content plan created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("localcontent.update"))
      .input(
        z.object({
          id: z.string().min(1),
          data: createPlanSchema.partial().extend({
            status: z
              .enum([
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "APPROVED",
                "REJECTED",
              ])
              .optional(),
          }),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, data } = input;

        const updateData = {
          ...data,
          employmentTargets: data.employmentTargets
            ? JSON.stringify(data.employmentTargets)
            : undefined,
          procurementTargets: data.procurementTargets
            ? JSON.stringify(data.procurementTargets)
            : undefined,
          trainingTargets: data.trainingTargets
            ? JSON.stringify(data.trainingTargets)
            : undefined,
          technologyTransferTargets: data.technologyTransferTargets
            ? JSON.stringify(data.technologyTransferTargets)
            : undefined,
          submissionDate: data.submissionDate
            ? new Date(data.submissionDate)
            : undefined,
          approvalDate: data.approvalDate
            ? new Date(data.approvalDate)
            : undefined,
        };

        const [updatedPlan] = await db
          .update(localContentSchema.localContentPlans)
          .set(updateData)
          .where(eq(localContentSchema.localContentPlans.id, id))
          .returning();

        if (!updatedPlan) {
          throw new ORPCError("NOT_FOUND", "Plan not found");
        }

        return {
          success: true,
          data: updatedPlan,
          message: "Plan updated successfully",
        };
      }),

    submit: protectedProcedure
      .use(requirePermission("localcontent.update"))
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id } = input;

        const [updatedPlan] = await db
          .update(localContentSchema.localContentPlans)
          .set({
            status: "SUBMITTED",
            submissionDate: new Date(),
          })
          .where(eq(localContentSchema.localContentPlans.id, id))
          .returning();

        if (!updatedPlan) {
          throw new ORPCError("NOT_FOUND", "Plan not found");
        }

        return {
          success: true,
          data: updatedPlan,
          message: "Plan submitted for review",
        };
      }),
  },

  // ===== REPORTS =====
  reports: {
    list: protectedProcedure
      .use(requirePermission("localcontent.read"))
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          registrationId: z.string().optional(),
          reportPeriodType: z.enum(reportPeriodTypes).optional(),
          status: z
            .enum([
              "DRAFT",
              "SUBMITTED",
              "UNDER_REVIEW",
              "ACCEPTED",
              "REJECTED",
            ])
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
              localContentSchema.localContentReports.reportPeriodType,
              reportPeriodType
            )
          );
        }

        if (status) {
          conditions.push(
            eq(localContentSchema.localContentReports.status, status)
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const [totalResult] = await db
          .select({ count: count() })
          .from(localContentSchema.localContentReports)
          .where(whereClause);

        const reports = await db
          .select()
          .from(localContentSchema.localContentReports)
          .where(whereClause)
          .orderBy(desc(localContentSchema.localContentReports.periodEndDate))
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
      }),

    create: protectedProcedure
      .use(requirePermission("localcontent.create"))
      .input(createReportSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const reportData = {
          ...input,
          id: nanoid(),
          reportNumber: generateReportNumber(),
          organizationId: user?.organizationId || "default",
          status: "DRAFT" as const,
          periodStartDate: new Date(input.periodStartDate),
          periodEndDate: new Date(input.periodEndDate),
          employmentData: input.employmentData
            ? JSON.stringify(input.employmentData)
            : null,
          procurementData: input.procurementData
            ? JSON.stringify(input.procurementData)
            : null,
          trainingData: input.trainingData
            ? JSON.stringify(input.trainingData)
            : null,
          createdBy: user?.id,
        };

        const [newReport] = await db
          .insert(localContentSchema.localContentReports)
          .values(reportData)
          .returning();

        return {
          success: true,
          data: newReport,
          message: "Report created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("localcontent.update"))
      .input(
        z.object({
          id: z.string().min(1),
          data: createReportSchema.partial().extend({
            status: z
              .enum([
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "ACCEPTED",
                "REJECTED",
              ])
              .optional(),
          }),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, data } = input;

        const updateData = {
          ...data,
          periodStartDate: data.periodStartDate
            ? new Date(data.periodStartDate)
            : undefined,
          periodEndDate: data.periodEndDate
            ? new Date(data.periodEndDate)
            : undefined,
          employmentData: data.employmentData
            ? JSON.stringify(data.employmentData)
            : undefined,
          procurementData: data.procurementData
            ? JSON.stringify(data.procurementData)
            : undefined,
          trainingData: data.trainingData
            ? JSON.stringify(data.trainingData)
            : undefined,
        };

        const [updatedReport] = await db
          .update(localContentSchema.localContentReports)
          .set(updateData)
          .where(eq(localContentSchema.localContentReports.id, id))
          .returning();

        if (!updatedReport) {
          throw new ORPCError("NOT_FOUND", "Report not found");
        }

        return {
          success: true,
          data: updatedReport,
          message: "Report updated successfully",
        };
      }),

    submit: protectedProcedure
      .use(requirePermission("localcontent.update"))
      .input(z.object({ id: z.string().min(1) }))
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id } = input;

        const [updatedReport] = await db
          .update(localContentSchema.localContentReports)
          .set({
            status: "SUBMITTED",
            submissionDate: new Date(),
          })
          .where(eq(localContentSchema.localContentReports.id, id))
          .returning();

        if (!updatedReport) {
          throw new ORPCError("NOT_FOUND", "Report not found");
        }

        return {
          success: true,
          data: updatedReport,
          message: "Report submitted for review",
        };
      }),
  },

  // ===== VENDORS =====
  vendors: {
    list: protectedProcedure
      .use(requirePermission("localcontent.read"))
      .input(
        z.object({
          search: z.string().optional(),
          category: z.string().optional(),
          isGuyanese: z.boolean().optional(),
          isActive: z.boolean().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { search, category, isGuyanese, isActive } = input;
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

        if (category) {
          conditions.push(
            ilike(
              localContentSchema.localContentVendors.category,
              `%${category}%`
            )
          );
        }

        if (isGuyanese !== undefined) {
          conditions.push(
            eq(
              localContentSchema.localContentVendors.isGuyaneseOwned,
              isGuyanese
            )
          );
        }

        if (isActive !== undefined) {
          conditions.push(
            eq(localContentSchema.localContentVendors.isActive, isActive)
          );
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const vendors = await db
          .select()
          .from(localContentSchema.localContentVendors)
          .where(whereClause)
          .orderBy(asc(localContentSchema.localContentVendors.vendorName));

        return { success: true, data: vendors };
      }),

    create: protectedProcedure
      .use(requirePermission("localcontent.create"))
      .input(
        z.object({
          registrationId: z.string().min(1),
          vendorName: z.string().min(1),
          category: z.string().optional(),
          tinNumber: z.string().optional(),
          nisNumber: z.string().optional(),
          contactPerson: z.string().optional(),
          contactEmail: z.string().email().optional(),
          contactPhone: z.string().optional(),
          address: z.string().optional(),
          isGuyaneseOwned: z.boolean().default(false),
          guyaneseOwnershipPercent: z.string().optional(),
          servicesProvided: z.array(z.string()).optional(),
          productsSupplied: z.array(z.string()).optional(),
          notes: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const vendorData = {
          ...input,
          id: nanoid(),
          organizationId: user?.organizationId || "default",
          servicesProvided: input.servicesProvided
            ? JSON.stringify(input.servicesProvided)
            : null,
          productsSupplied: input.productsSupplied
            ? JSON.stringify(input.productsSupplied)
            : null,
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
      }),

    update: protectedProcedure
      .use(requirePermission("localcontent.update"))
      .input(
        z.object({
          id: z.string().min(1),
          data: z.object({
            vendorName: z.string().min(1).optional(),
            category: z.string().optional(),
            tinNumber: z.string().optional(),
            contactPerson: z.string().optional(),
            contactEmail: z.string().email().optional(),
            contactPhone: z.string().optional(),
            address: z.string().optional(),
            isGuyaneseOwned: z.boolean().optional(),
            guyaneseOwnershipPercent: z.string().optional(),
            servicesProvided: z.array(z.string()).optional(),
            productsSupplied: z.array(z.string()).optional(),
            isActive: z.boolean().optional(),
            notes: z.string().optional(),
          }),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, data } = input;

        const updateData = {
          ...data,
          servicesProvided: data.servicesProvided
            ? JSON.stringify(data.servicesProvided)
            : undefined,
          productsSupplied: data.productsSupplied
            ? JSON.stringify(data.productsSupplied)
            : undefined,
        };

        const [updatedVendor] = await db
          .update(localContentSchema.localContentVendors)
          .set(updateData)
          .where(eq(localContentSchema.localContentVendors.id, id))
          .returning();

        if (!updatedVendor) {
          throw new ORPCError("NOT_FOUND", "Vendor not found");
        }

        return {
          success: true,
          data: updatedVendor,
          message: "Vendor updated successfully",
        };
      }),
  },

  // ===== CHECKLISTS =====
  checklists: {
    list: protectedProcedure
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
          .orderBy(
            asc(localContentSchema.localContentChecklists.checklistType)
          );

        return { success: true, data: checklists };
      }),

    create: protectedProcedure
      .use(requirePermission("localcontent.create"))
      .input(
        z.object({
          registrationId: z.string().min(1),
          checklistType: z.string().min(1),
          checklistName: z.string().min(1),
          items: z.array(
            z.object({
              item: z.string(),
              required: z.boolean(),
              completed: z.boolean().default(false),
              notes: z.string().optional(),
            })
          ),
          notes: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const checklistData = {
          ...input,
          id: nanoid(),
          organizationId: user?.organizationId || "default",
          items: JSON.stringify(input.items),
          createdBy: user?.id,
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
      }),

    updateItem: protectedProcedure
      .use(requirePermission("localcontent.update"))
      .input(
        z.object({
          id: z.string().min(1),
          itemIndex: z.number().min(0),
          completed: z.boolean(),
          notes: z.string().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, itemIndex, completed, notes } = input;

        const [checklist] = await db
          .select()
          .from(localContentSchema.localContentChecklists)
          .where(eq(localContentSchema.localContentChecklists.id, id))
          .limit(1);

        if (!checklist) {
          throw new ORPCError("NOT_FOUND", "Checklist not found");
        }

        const items = JSON.parse((checklist.items as string) || "[]");
        if (itemIndex >= items.length) {
          throw new ORPCError("BAD_REQUEST", "Invalid item index");
        }

        items[itemIndex].completed = completed;
        if (notes) {
          items[itemIndex].notes = notes;
        }

        const [updatedChecklist] = await db
          .update(localContentSchema.localContentChecklists)
          .set({ items: JSON.stringify(items) })
          .where(eq(localContentSchema.localContentChecklists.id, id))
          .returning();

        return {
          success: true,
          data: updatedChecklist,
          message: "Checklist item updated",
        };
      }),
  },
};
