import { serviceCatalogSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, requirePermission } from "../index";

// ========================================
// SERVICE CATALOG API ROUTER
// ========================================
// Complete service catalog management for Green Crescent and KAJ Financial
// Includes: Services, Projects, Milestones, Time Entries, Packages, Templates, Communications

// Business entities
const businessEntities = ["GREEN_CRESCENT", "KAJ_FINANCIAL", "BOTH"] as const;

// Service categories
const serviceCategories = [
  "TRAINING",
  "CONSULTANCY",
  "PARALEGAL",
  "IMMIGRATION",
  "BUSINESS_PROPOSALS",
  "NETWORKING",
  "TAX_RETURNS",
  "COMPLIANCE",
  "PAYE_SERVICES",
  "FINANCIAL_STATEMENTS",
  "AUDIT_SERVICES",
  "NIS_SERVICES",
  "DOCUMENT_PREPARATION",
  "CLIENT_PORTAL",
] as const;

// Fee structures
const feeStructures = [
  "FIXED",
  "HOURLY",
  "PERCENTAGE",
  "MONTHLY",
  "QUARTERLY",
  "ANNUAL",
  "CUSTOM",
  "FREE",
] as const;

// Service statuses
const serviceStatuses = [
  "ACTIVE",
  "INACTIVE",
  "COMING_SOON",
  "DEPRECATED",
] as const;

// Project statuses
const projectStatuses = [
  "DRAFT",
  "PENDING_APPROVAL",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
] as const;

// Milestone statuses
const milestoneStatuses = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
  "BLOCKED",
] as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

const generateServiceCode = (entity: string, category: string): string => {
  const entityPrefix =
    entity === "GREEN_CRESCENT"
      ? "GC"
      : entity === "KAJ_FINANCIAL"
        ? "KAJ"
        : "GK";
  const categoryShort = category.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${entityPrefix}-${categoryShort}-${randomPart}`;
};

const generateProjectNumber = (): string => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRJ-${year}${month}-${randomPart}`;
};

const generatePackageCode = (entity: string): string => {
  const entityPrefix =
    entity === "GREEN_CRESCENT"
      ? "GC"
      : entity === "KAJ_FINANCIAL"
        ? "KAJ"
        : "GK";
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${entityPrefix}-PKG-${randomPart}`;
};

const generateTemplateCode = (entity: string, category: string): string => {
  const entityPrefix =
    entity === "GREEN_CRESCENT"
      ? "GC"
      : entity === "KAJ_FINANCIAL"
        ? "KAJ"
        : "GK";
  const categoryShort = category.substring(0, 3).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${entityPrefix}-TPL-${categoryShort}-${randomPart}`;
};

// ========================================
// INPUT SCHEMAS
// ========================================

// Service catalog schemas
const serviceQuerySchema = z.object({
  organizationId: z.string().optional(),
  businessEntity: z.enum(businessEntities).optional(),
  category: z.enum(serviceCategories).optional(),
  status: z.enum(serviceStatuses).optional(),
  search: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  graIntegration: z.boolean().optional(),
  nisIntegration: z.boolean().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

const createServiceSchema = z.object({
  name: z.string().min(1),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  businessEntity: z.enum(businessEntities),
  category: z.enum(serviceCategories),
  subcategory: z.string().optional(),
  feeStructure: z.enum(feeStructures).default("FIXED"),
  basePrice: z.string().optional(),
  currency: z.string().default("GYD"),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  estimatedDurationDays: z.number().optional(),
  estimatedHours: z.string().optional(),
  requiredDocuments: z.any().optional(),
  prerequisites: z.any().optional(),
  eligibilityCriteria: z.any().optional(),
  defaultWorkflowId: z.string().optional(),
  milestoneTemplates: z.any().optional(),
  graIntegration: z.boolean().default(false),
  nisIntegration: z.boolean().default(false),
  immigrationIntegration: z.boolean().default(false),
  displayOrder: z.number().default(0),
  iconName: z.string().optional(),
  colorCode: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  tags: z.any().optional(),
  metadata: z.any().optional(),
});

const updateServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  businessEntity: z.enum(businessEntities).optional(),
  category: z.enum(serviceCategories).optional(),
  subcategory: z.string().optional(),
  feeStructure: z.enum(feeStructures).optional(),
  basePrice: z.string().optional(),
  currency: z.string().optional(),
  minPrice: z.string().optional(),
  maxPrice: z.string().optional(),
  estimatedDurationDays: z.number().optional(),
  estimatedHours: z.string().optional(),
  requiredDocuments: z.any().optional(),
  prerequisites: z.any().optional(),
  eligibilityCriteria: z.any().optional(),
  defaultWorkflowId: z.string().optional(),
  milestoneTemplates: z.any().optional(),
  graIntegration: z.boolean().optional(),
  nisIntegration: z.boolean().optional(),
  immigrationIntegration: z.boolean().optional(),
  displayOrder: z.number().optional(),
  iconName: z.string().optional(),
  colorCode: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  status: z.enum(serviceStatuses).optional(),
  tags: z.any().optional(),
  metadata: z.any().optional(),
});

// Project schemas
const projectQuerySchema = z.object({
  organizationId: z.string().optional(),
  clientId: z.string().optional(),
  serviceCatalogId: z.string().optional(),
  businessEntity: z.enum(businessEntities).optional(),
  status: z.enum(projectStatuses).optional(),
  leadConsultantId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  billingStatus: z.enum(["pending", "partial", "paid", "overdue"]).optional(),
  search: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

const createProjectSchema = z.object({
  clientId: z.string(),
  serviceCatalogId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  businessEntity: z.enum(businessEntities),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  startDate: z.string().datetime().optional(),
  targetEndDate: z.string().datetime().optional(),
  agreedPrice: z.string().optional(),
  currency: z.string().default("GYD"),
  discountPercent: z.string().optional(),
  discountReason: z.string().optional(),
  leadConsultantId: z.string().optional(),
  teamMemberIds: z.any().optional(),
  relatedDocumentIds: z.any().optional(),
  parentProjectId: z.string().optional(),
  linkedProjectIds: z.any().optional(),
  internalNotes: z.string().optional(),
  clientVisibleNotes: z.string().optional(),
  metadata: z.any().optional(),
});

const updateProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(projectStatuses).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  startDate: z.string().datetime().optional(),
  targetEndDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),
  agreedPrice: z.string().optional(),
  discountPercent: z.string().optional(),
  discountReason: z.string().optional(),
  progressPercent: z.number().min(0).max(100).optional(),
  currentMilestoneId: z.string().optional(),
  leadConsultantId: z.string().optional(),
  teamMemberIds: z.any().optional(),
  relatedDocumentIds: z.any().optional(),
  linkedProjectIds: z.any().optional(),
  internalNotes: z.string().optional(),
  clientVisibleNotes: z.string().optional(),
  totalBilled: z.string().optional(),
  totalPaid: z.string().optional(),
  billingStatus: z.enum(["pending", "partial", "paid", "overdue"]).optional(),
  metadata: z.any().optional(),
});

// Milestone schemas
const milestoneQuerySchema = z.object({
  projectId: z.string(),
  status: z.enum(milestoneStatuses).optional(),
  assignedToId: z.string().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(50),
});

const createMilestoneSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().default(0),
  dueDate: z.string().datetime().optional(),
  requiredDocuments: z.any().optional(),
  requiredApprovals: z.any().optional(),
  dependsOnMilestones: z.any().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
  clientVisibleNotes: z.string().optional(),
  metadata: z.any().optional(),
});

const updateMilestoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  status: z.enum(milestoneStatuses).optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  requiredDocuments: z.any().optional(),
  requiredApprovals: z.any().optional(),
  dependsOnMilestones: z.any().optional(),
  assignedToId: z.string().optional(),
  notes: z.string().optional(),
  clientVisibleNotes: z.string().optional(),
  metadata: z.any().optional(),
});

// Time entry schemas
const timeEntryQuerySchema = z.object({
  organizationId: z.string().optional(),
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  userId: z.string().optional(),
  isBillable: z.boolean().optional(),
  isBilled: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(50),
});

const createTimeEntrySchema = z.object({
  projectId: z.string().optional(),
  milestoneId: z.string().optional(),
  date: z.string().datetime(),
  hours: z.string(),
  description: z.string().min(1),
  isBillable: z.boolean().default(true),
  hourlyRate: z.string().optional(),
  metadata: z.any().optional(),
});

const updateTimeEntrySchema = z.object({
  id: z.string(),
  date: z.string().datetime().optional(),
  hours: z.string().optional(),
  description: z.string().min(1).optional(),
  isBillable: z.boolean().optional(),
  hourlyRate: z.string().optional(),
  isBilled: z.boolean().optional(),
  invoiceId: z.string().optional(),
  metadata: z.any().optional(),
});

// Package schemas
const packageQuerySchema = z.object({
  organizationId: z.string().optional(),
  businessEntity: z.enum(businessEntities).optional(),
  status: z.enum(serviceStatuses).optional(),
  isFeatured: z.boolean().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

const createPackageSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  businessEntity: z.enum(businessEntities),
  includedServiceIds: z.array(z.string()),
  packagePrice: z.string(),
  currency: z.string().default("GYD"),
  savingsPercent: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  displayOrder: z.number().default(0),
  isFeatured: z.boolean().default(false),
  metadata: z.any().optional(),
});

const updatePackageSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  includedServiceIds: z.array(z.string()).optional(),
  packagePrice: z.string().optional(),
  savingsPercent: z.string().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  displayOrder: z.number().optional(),
  isFeatured: z.boolean().optional(),
  status: z.enum(serviceStatuses).optional(),
  metadata: z.any().optional(),
});

// Template schemas
const templateQuerySchema = z.object({
  organizationId: z.string().optional(),
  businessEntity: z.enum(businessEntities).optional(),
  category: z.enum(serviceCategories).optional(),
  templateType: z.string().optional(),
  status: z.enum(serviceStatuses).optional(),
  isLatest: z.boolean().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  businessEntity: z.enum(businessEntities),
  category: z.enum(serviceCategories),
  templateType: z.enum(["word", "pdf", "excel", "html"]),
  templateContent: z.string().optional(),
  templateFileUrl: z.string().url().optional(),
  variableDefinitions: z.any().optional(),
  applicableServices: z.any().optional(),
  metadata: z.any().optional(),
});

const updateTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  templateType: z.enum(["word", "pdf", "excel", "html"]).optional(),
  templateContent: z.string().optional(),
  templateFileUrl: z.string().url().optional(),
  variableDefinitions: z.any().optional(),
  applicableServices: z.any().optional(),
  status: z.enum(serviceStatuses).optional(),
  metadata: z.any().optional(),
});

// Communication log schemas
const communicationLogQuerySchema = z.object({
  organizationId: z.string().optional(),
  clientId: z.string().optional(),
  projectId: z.string().optional(),
  communicationType: z
    .enum(["email", "phone", "meeting", "portal", "sms"])
    .optional(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  requiresFollowUp: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(50),
});

const createCommunicationLogSchema = z.object({
  clientId: z.string(),
  projectId: z.string().optional(),
  communicationType: z.enum(["email", "phone", "meeting", "portal", "sms"]),
  direction: z.enum(["inbound", "outbound"]),
  subject: z.string().optional(),
  content: z.string().optional(),
  clientContactName: z.string().optional(),
  clientContactEmail: z.string().email().optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().optional(),
  requiresFollowUp: z.boolean().default(false),
  followUpDate: z.string().datetime().optional(),
  attachmentIds: z.any().optional(),
  metadata: z.any().optional(),
});

// ========================================
// ROUTER DEFINITION - FLAT STRUCTURE
// ========================================

export const serviceCatalogRouter = {
  // ========================================
  // SERVICES ENDPOINTS
  // ========================================
  servicesList: protectedProcedure
    .use(requirePermission("services.read"))
    .input(serviceQuerySchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { page, pageSize, ...filters } = input;

      const conditions = [
        eq(
          serviceCatalogSchema.serviceCatalog.organizationId,
          filters.organizationId || user?.organizationId || "default"
        ),
      ];

      if (filters.businessEntity) {
        conditions.push(
          eq(
            serviceCatalogSchema.serviceCatalog.businessEntity,
            filters.businessEntity
          )
        );
      }
      if (filters.category) {
        conditions.push(
          eq(serviceCatalogSchema.serviceCatalog.category, filters.category)
        );
      }
      if (filters.status) {
        conditions.push(
          eq(serviceCatalogSchema.serviceCatalog.status, filters.status)
        );
      }
      if (filters.isFeatured !== undefined) {
        conditions.push(
          eq(serviceCatalogSchema.serviceCatalog.isFeatured, filters.isFeatured)
        );
      }
      if (filters.isPopular !== undefined) {
        conditions.push(
          eq(serviceCatalogSchema.serviceCatalog.isPopular, filters.isPopular)
        );
      }
      if (filters.graIntegration !== undefined) {
        conditions.push(
          eq(
            serviceCatalogSchema.serviceCatalog.graIntegration,
            filters.graIntegration
          )
        );
      }
      if (filters.nisIntegration !== undefined) {
        conditions.push(
          eq(
            serviceCatalogSchema.serviceCatalog.nisIntegration,
            filters.nisIntegration
          )
        );
      }
      if (filters.search) {
        conditions.push(
          or(
            ilike(
              serviceCatalogSchema.serviceCatalog.name,
              `%${filters.search}%`
            ),
            ilike(
              serviceCatalogSchema.serviceCatalog.code,
              `%${filters.search}%`
            ),
            ilike(
              serviceCatalogSchema.serviceCatalog.shortDescription,
              `%${filters.search}%`
            )
          )!
        );
      }

      const whereClause = and(...conditions);
      const offset = (page - 1) * pageSize;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(serviceCatalogSchema.serviceCatalog)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(serviceCatalogSchema.serviceCatalog.displayOrder),
        db
          .select({ count: count() })
          .from(serviceCatalogSchema.serviceCatalog)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    }),

  servicesGetById: protectedProcedure
    .use(requirePermission("services.read"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [service] = await db
        .select()
        .from(serviceCatalogSchema.serviceCatalog)
        .where(eq(serviceCatalogSchema.serviceCatalog.id, input.id))
        .limit(1);

      if (!service) {
        throw new ORPCError("NOT_FOUND", { message: "Service not found" });
      }

      return { success: true, data: service };
    }),

  servicesCreate: protectedProcedure
    .use(requirePermission("services.create"))
    .input(createServiceSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const serviceData = {
        ...input,
        id: nanoid(),
        code: generateServiceCode(input.businessEntity, input.category),
        organizationId: user?.organizationId || "default",
        status: "ACTIVE" as const,
        createdBy: user?.id,
      };

      const [newService] = await db
        .insert(serviceCatalogSchema.serviceCatalog)
        .values(serviceData)
        .returning();

      return {
        success: true,
        data: newService,
        message: "Service created successfully",
      };
    }),

  servicesUpdate: protectedProcedure
    .use(requirePermission("services.update"))
    .input(updateServiceSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, ...updateData } = input;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.serviceCatalog)
        .where(eq(serviceCatalogSchema.serviceCatalog.id, id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Service not found" });
      }

      const [updatedService] = await db
        .update(serviceCatalogSchema.serviceCatalog)
        .set(updateData)
        .where(eq(serviceCatalogSchema.serviceCatalog.id, id))
        .returning();

      return {
        success: true,
        data: updatedService,
        message: "Service updated successfully",
      };
    }),

  servicesDelete: protectedProcedure
    .use(requirePermission("services.delete"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.serviceCatalog)
        .where(eq(serviceCatalogSchema.serviceCatalog.id, input.id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Service not found" });
      }

      await db
        .delete(serviceCatalogSchema.serviceCatalog)
        .where(eq(serviceCatalogSchema.serviceCatalog.id, input.id));

      return {
        success: true,
        message: "Service deleted successfully",
      };
    }),

  servicesGetByEntity: protectedProcedure
    .use(requirePermission("services.read"))
    .input(z.object({ businessEntity: z.enum(businessEntities) }))
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const services = await db
        .select()
        .from(serviceCatalogSchema.serviceCatalog)
        .where(
          and(
            eq(
              serviceCatalogSchema.serviceCatalog.organizationId,
              user?.organizationId || "default"
            ),
            eq(
              serviceCatalogSchema.serviceCatalog.businessEntity,
              input.businessEntity
            ),
            eq(serviceCatalogSchema.serviceCatalog.status, "ACTIVE")
          )
        )
        .orderBy(serviceCatalogSchema.serviceCatalog.displayOrder);

      return { success: true, data: services };
    }),

  servicesGetFeatured: protectedProcedure
    .use(requirePermission("services.read"))
    .handler(async ({ context }) => {
      const { db, user } = context;

      const services = await db
        .select()
        .from(serviceCatalogSchema.serviceCatalog)
        .where(
          and(
            eq(
              serviceCatalogSchema.serviceCatalog.organizationId,
              user?.organizationId || "default"
            ),
            eq(serviceCatalogSchema.serviceCatalog.isFeatured, true),
            eq(serviceCatalogSchema.serviceCatalog.status, "ACTIVE")
          )
        )
        .orderBy(serviceCatalogSchema.serviceCatalog.displayOrder);

      return { success: true, data: services };
    }),

  // ========================================
  // PROJECTS ENDPOINTS
  // ========================================
  projectsList: protectedProcedure
    .use(requirePermission("projects.read"))
    .input(projectQuerySchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { page, pageSize, ...filters } = input;

      const conditions = [
        eq(
          serviceCatalogSchema.clientProjects.organizationId,
          filters.organizationId || user?.organizationId || "default"
        ),
      ];

      if (filters.clientId) {
        conditions.push(
          eq(serviceCatalogSchema.clientProjects.clientId, filters.clientId)
        );
      }
      if (filters.serviceCatalogId) {
        conditions.push(
          eq(
            serviceCatalogSchema.clientProjects.serviceCatalogId,
            filters.serviceCatalogId
          )
        );
      }
      if (filters.businessEntity) {
        conditions.push(
          eq(
            serviceCatalogSchema.clientProjects.businessEntity,
            filters.businessEntity
          )
        );
      }
      if (filters.status) {
        conditions.push(
          eq(serviceCatalogSchema.clientProjects.status, filters.status)
        );
      }
      if (filters.leadConsultantId) {
        conditions.push(
          eq(
            serviceCatalogSchema.clientProjects.leadConsultantId,
            filters.leadConsultantId
          )
        );
      }
      if (filters.priority) {
        conditions.push(
          eq(serviceCatalogSchema.clientProjects.priority, filters.priority)
        );
      }
      if (filters.billingStatus) {
        conditions.push(
          eq(
            serviceCatalogSchema.clientProjects.billingStatus,
            filters.billingStatus
          )
        );
      }
      if (filters.search) {
        conditions.push(
          or(
            ilike(
              serviceCatalogSchema.clientProjects.name,
              `%${filters.search}%`
            ),
            ilike(
              serviceCatalogSchema.clientProjects.projectNumber,
              `%${filters.search}%`
            )
          )!
        );
      }
      if (filters.dateFrom) {
        conditions.push(
          gte(
            serviceCatalogSchema.clientProjects.startDate,
            new Date(filters.dateFrom)
          )
        );
      }
      if (filters.dateTo) {
        conditions.push(
          lte(
            serviceCatalogSchema.clientProjects.targetEndDate,
            new Date(filters.dateTo)
          )
        );
      }

      const whereClause = and(...conditions);
      const offset = (page - 1) * pageSize;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(serviceCatalogSchema.clientProjects)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(serviceCatalogSchema.clientProjects.createdAt)),
        db
          .select({ count: count() })
          .from(serviceCatalogSchema.clientProjects)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    }),

  projectsGetById: protectedProcedure
    .use(requirePermission("projects.read"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [project] = await db
        .select()
        .from(serviceCatalogSchema.clientProjects)
        .where(eq(serviceCatalogSchema.clientProjects.id, input.id))
        .limit(1);

      if (!project) {
        throw new ORPCError("NOT_FOUND", { message: "Project not found" });
      }

      return { success: true, data: project };
    }),

  projectsCreate: protectedProcedure
    .use(requirePermission("projects.create"))
    .input(createProjectSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const projectData = {
        ...input,
        id: nanoid(),
        projectNumber: generateProjectNumber(),
        organizationId: user?.organizationId || "default",
        status: "DRAFT" as const,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        targetEndDate: input.targetEndDate
          ? new Date(input.targetEndDate)
          : undefined,
        createdBy: user?.id,
      };

      const [newProject] = await db
        .insert(serviceCatalogSchema.clientProjects)
        .values(projectData)
        .returning();

      return {
        success: true,
        data: newProject,
        message: "Project created successfully",
      };
    }),

  projectsUpdate: protectedProcedure
    .use(requirePermission("projects.update"))
    .input(updateProjectSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { id, ...updateData } = input;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.clientProjects)
        .where(eq(serviceCatalogSchema.clientProjects.id, id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Project not found" });
      }

      const transformedData = {
        ...updateData,
        startDate: updateData.startDate
          ? new Date(updateData.startDate)
          : undefined,
        targetEndDate: updateData.targetEndDate
          ? new Date(updateData.targetEndDate)
          : undefined,
        actualEndDate: updateData.actualEndDate
          ? new Date(updateData.actualEndDate)
          : undefined,
        updatedBy: user?.id,
      };

      const [updatedProject] = await db
        .update(serviceCatalogSchema.clientProjects)
        .set(transformedData)
        .where(eq(serviceCatalogSchema.clientProjects.id, id))
        .returning();

      return {
        success: true,
        data: updatedProject,
        message: "Project updated successfully",
      };
    }),

  projectsUpdateStatus: protectedProcedure
    .use(requirePermission("projects.update"))
    .input(z.object({ id: z.string(), status: z.enum(projectStatuses) }))
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const updateData: Record<string, unknown> = {
        status: input.status,
        updatedBy: user?.id,
      };

      if (input.status === "COMPLETED") {
        updateData.actualEndDate = new Date();
        updateData.progressPercent = 100;
      }

      const [updatedProject] = await db
        .update(serviceCatalogSchema.clientProjects)
        .set(updateData)
        .where(eq(serviceCatalogSchema.clientProjects.id, input.id))
        .returning();

      if (!updatedProject) {
        throw new ORPCError("NOT_FOUND", { message: "Project not found" });
      }

      return {
        success: true,
        data: updatedProject,
        message: `Project status updated to ${input.status}`,
      };
    }),

  projectsDelete: protectedProcedure
    .use(requirePermission("projects.delete"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.clientProjects)
        .where(eq(serviceCatalogSchema.clientProjects.id, input.id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Project not found" });
      }

      await db
        .delete(serviceCatalogSchema.clientProjects)
        .where(eq(serviceCatalogSchema.clientProjects.id, input.id));

      return {
        success: true,
        message: "Project deleted successfully",
      };
    }),

  projectsGetByClient: protectedProcedure
    .use(requirePermission("projects.read"))
    .input(z.object({ clientId: z.string() }))
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const projects = await db
        .select()
        .from(serviceCatalogSchema.clientProjects)
        .where(
          and(
            eq(
              serviceCatalogSchema.clientProjects.organizationId,
              user?.organizationId || "default"
            ),
            eq(serviceCatalogSchema.clientProjects.clientId, input.clientId)
          )
        )
        .orderBy(desc(serviceCatalogSchema.clientProjects.createdAt));

      return { success: true, data: projects };
    }),

  // ========================================
  // MILESTONES ENDPOINTS
  // ========================================
  milestonesList: protectedProcedure
    .use(requirePermission("milestones.read"))
    .input(milestoneQuerySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { page, pageSize, ...filters } = input;

      const conditions = [
        eq(serviceCatalogSchema.projectMilestones.projectId, filters.projectId),
      ];

      if (filters.status) {
        conditions.push(
          eq(serviceCatalogSchema.projectMilestones.status, filters.status)
        );
      }
      if (filters.assignedToId) {
        conditions.push(
          eq(
            serviceCatalogSchema.projectMilestones.assignedToId,
            filters.assignedToId
          )
        );
      }

      const whereClause = and(...conditions);
      const offset = (page - 1) * pageSize;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(serviceCatalogSchema.projectMilestones)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(serviceCatalogSchema.projectMilestones.displayOrder),
        db
          .select({ count: count() })
          .from(serviceCatalogSchema.projectMilestones)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    }),

  milestonesGetById: protectedProcedure
    .use(requirePermission("milestones.read"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [milestone] = await db
        .select()
        .from(serviceCatalogSchema.projectMilestones)
        .where(eq(serviceCatalogSchema.projectMilestones.id, input.id))
        .limit(1);

      if (!milestone) {
        throw new ORPCError("NOT_FOUND", { message: "Milestone not found" });
      }

      return { success: true, data: milestone };
    }),

  milestonesCreate: protectedProcedure
    .use(requirePermission("milestones.create"))
    .input(createMilestoneSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;

      const milestoneData = {
        ...input,
        id: nanoid(),
        status: "PENDING" as const,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      };

      const [newMilestone] = await db
        .insert(serviceCatalogSchema.projectMilestones)
        .values(milestoneData)
        .returning();

      return {
        success: true,
        data: newMilestone,
        message: "Milestone created successfully",
      };
    }),

  milestonesUpdate: protectedProcedure
    .use(requirePermission("milestones.update"))
    .input(updateMilestoneSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, ...updateData } = input;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.projectMilestones)
        .where(eq(serviceCatalogSchema.projectMilestones.id, id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Milestone not found" });
      }

      const transformedData = {
        ...updateData,
        startDate: updateData.startDate
          ? new Date(updateData.startDate)
          : undefined,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        completedDate: updateData.completedDate
          ? new Date(updateData.completedDate)
          : undefined,
      };

      const [updatedMilestone] = await db
        .update(serviceCatalogSchema.projectMilestones)
        .set(transformedData)
        .where(eq(serviceCatalogSchema.projectMilestones.id, id))
        .returning();

      return {
        success: true,
        data: updatedMilestone,
        message: "Milestone updated successfully",
      };
    }),

  milestonesComplete: protectedProcedure
    .use(requirePermission("milestones.update"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [updatedMilestone] = await db
        .update(serviceCatalogSchema.projectMilestones)
        .set({
          status: "COMPLETED" as const,
          completedDate: new Date(),
        })
        .where(eq(serviceCatalogSchema.projectMilestones.id, input.id))
        .returning();

      if (!updatedMilestone) {
        throw new ORPCError("NOT_FOUND", { message: "Milestone not found" });
      }

      return {
        success: true,
        data: updatedMilestone,
        message: "Milestone completed",
      };
    }),

  milestonesDelete: protectedProcedure
    .use(requirePermission("milestones.delete"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.projectMilestones)
        .where(eq(serviceCatalogSchema.projectMilestones.id, input.id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Milestone not found" });
      }

      await db
        .delete(serviceCatalogSchema.projectMilestones)
        .where(eq(serviceCatalogSchema.projectMilestones.id, input.id));

      return {
        success: true,
        message: "Milestone deleted successfully",
      };
    }),

  // ========================================
  // TIME ENTRIES ENDPOINTS
  // ========================================
  timeEntriesList: protectedProcedure
    .use(requirePermission("timeEntries.read"))
    .input(timeEntryQuerySchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { page, pageSize, ...filters } = input;

      const conditions = [
        eq(
          serviceCatalogSchema.timeEntries.organizationId,
          filters.organizationId || user?.organizationId || "default"
        ),
      ];

      if (filters.projectId) {
        conditions.push(
          eq(serviceCatalogSchema.timeEntries.projectId, filters.projectId)
        );
      }
      if (filters.milestoneId) {
        conditions.push(
          eq(serviceCatalogSchema.timeEntries.milestoneId, filters.milestoneId)
        );
      }
      if (filters.userId) {
        conditions.push(
          eq(serviceCatalogSchema.timeEntries.userId, filters.userId)
        );
      }
      if (filters.isBillable !== undefined) {
        conditions.push(
          eq(serviceCatalogSchema.timeEntries.isBillable, filters.isBillable)
        );
      }
      if (filters.isBilled !== undefined) {
        conditions.push(
          eq(serviceCatalogSchema.timeEntries.isBilled, filters.isBilled)
        );
      }
      if (filters.dateFrom) {
        conditions.push(
          gte(serviceCatalogSchema.timeEntries.date, new Date(filters.dateFrom))
        );
      }
      if (filters.dateTo) {
        conditions.push(
          lte(serviceCatalogSchema.timeEntries.date, new Date(filters.dateTo))
        );
      }

      const whereClause = and(...conditions);
      const offset = (page - 1) * pageSize;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(serviceCatalogSchema.timeEntries)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(serviceCatalogSchema.timeEntries.date)),
        db
          .select({ count: count() })
          .from(serviceCatalogSchema.timeEntries)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    }),

  timeEntriesGetById: protectedProcedure
    .use(requirePermission("timeEntries.read"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [entry] = await db
        .select()
        .from(serviceCatalogSchema.timeEntries)
        .where(eq(serviceCatalogSchema.timeEntries.id, input.id))
        .limit(1);

      if (!entry) {
        throw new ORPCError("NOT_FOUND", { message: "Time entry not found" });
      }

      return { success: true, data: entry };
    }),

  timeEntriesCreate: protectedProcedure
    .use(requirePermission("timeEntries.create"))
    .input(createTimeEntrySchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const totalAmount = input.hourlyRate
        ? String(Number(input.hours) * Number(input.hourlyRate))
        : undefined;

      const entryData = {
        ...input,
        id: nanoid(),
        organizationId: user?.organizationId || "default",
        userId: user?.id || "",
        date: new Date(input.date),
        totalAmount,
      };

      const [newEntry] = await db
        .insert(serviceCatalogSchema.timeEntries)
        .values(entryData)
        .returning();

      return {
        success: true,
        data: newEntry,
        message: "Time entry created successfully",
      };
    }),

  timeEntriesUpdate: protectedProcedure
    .use(requirePermission("timeEntries.update"))
    .input(updateTimeEntrySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, ...updateData } = input;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.timeEntries)
        .where(eq(serviceCatalogSchema.timeEntries.id, id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Time entry not found" });
      }

      const transformedData = {
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined,
      };

      const [updatedEntry] = await db
        .update(serviceCatalogSchema.timeEntries)
        .set(transformedData)
        .where(eq(serviceCatalogSchema.timeEntries.id, id))
        .returning();

      return {
        success: true,
        data: updatedEntry,
        message: "Time entry updated successfully",
      };
    }),

  timeEntriesDelete: protectedProcedure
    .use(requirePermission("timeEntries.delete"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.timeEntries)
        .where(eq(serviceCatalogSchema.timeEntries.id, input.id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Time entry not found" });
      }

      await db
        .delete(serviceCatalogSchema.timeEntries)
        .where(eq(serviceCatalogSchema.timeEntries.id, input.id));

      return {
        success: true,
        message: "Time entry deleted successfully",
      };
    }),

  timeEntriesMarkAsBilled: protectedProcedure
    .use(requirePermission("timeEntries.update"))
    .input(z.object({ ids: z.array(z.string()), invoiceId: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      for (const entryId of input.ids) {
        await db
          .update(serviceCatalogSchema.timeEntries)
          .set({
            isBilled: true,
            invoiceId: input.invoiceId,
          })
          .where(eq(serviceCatalogSchema.timeEntries.id, entryId));
      }

      return {
        success: true,
        message: `${input.ids.length} time entries marked as billed`,
      };
    }),

  // ========================================
  // PACKAGES ENDPOINTS
  // ========================================
  packagesList: protectedProcedure
    .use(requirePermission("packages.read"))
    .input(packageQuerySchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { page, pageSize, ...filters } = input;

      const conditions = [
        eq(
          serviceCatalogSchema.servicePackages.organizationId,
          filters.organizationId || user?.organizationId || "default"
        ),
      ];

      if (filters.businessEntity) {
        conditions.push(
          eq(
            serviceCatalogSchema.servicePackages.businessEntity,
            filters.businessEntity
          )
        );
      }
      if (filters.status) {
        conditions.push(
          eq(serviceCatalogSchema.servicePackages.status, filters.status)
        );
      }
      if (filters.isFeatured !== undefined) {
        conditions.push(
          eq(
            serviceCatalogSchema.servicePackages.isFeatured,
            filters.isFeatured
          )
        );
      }

      const whereClause = and(...conditions);
      const offset = (page - 1) * pageSize;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(serviceCatalogSchema.servicePackages)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(serviceCatalogSchema.servicePackages.displayOrder),
        db
          .select({ count: count() })
          .from(serviceCatalogSchema.servicePackages)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    }),

  packagesGetById: protectedProcedure
    .use(requirePermission("packages.read"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [pkg] = await db
        .select()
        .from(serviceCatalogSchema.servicePackages)
        .where(eq(serviceCatalogSchema.servicePackages.id, input.id))
        .limit(1);

      if (!pkg) {
        throw new ORPCError("NOT_FOUND", { message: "Package not found" });
      }

      return { success: true, data: pkg };
    }),

  packagesCreate: protectedProcedure
    .use(requirePermission("packages.create"))
    .input(createPackageSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const packageData = {
        ...input,
        id: nanoid(),
        code: generatePackageCode(input.businessEntity),
        organizationId: user?.organizationId || "default",
        status: "ACTIVE" as const,
        validFrom: input.validFrom ? new Date(input.validFrom) : undefined,
        validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
        createdBy: user?.id,
      };

      const [newPackage] = await db
        .insert(serviceCatalogSchema.servicePackages)
        .values(packageData)
        .returning();

      return {
        success: true,
        data: newPackage,
        message: "Package created successfully",
      };
    }),

  packagesUpdate: protectedProcedure
    .use(requirePermission("packages.update"))
    .input(updatePackageSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, ...updateData } = input;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.servicePackages)
        .where(eq(serviceCatalogSchema.servicePackages.id, id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Package not found" });
      }

      const transformedData = {
        ...updateData,
        validFrom: updateData.validFrom
          ? new Date(updateData.validFrom)
          : undefined,
        validUntil: updateData.validUntil
          ? new Date(updateData.validUntil)
          : undefined,
      };

      const [updatedPackage] = await db
        .update(serviceCatalogSchema.servicePackages)
        .set(transformedData)
        .where(eq(serviceCatalogSchema.servicePackages.id, id))
        .returning();

      return {
        success: true,
        data: updatedPackage,
        message: "Package updated successfully",
      };
    }),

  packagesDelete: protectedProcedure
    .use(requirePermission("packages.delete"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.servicePackages)
        .where(eq(serviceCatalogSchema.servicePackages.id, input.id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Package not found" });
      }

      await db
        .delete(serviceCatalogSchema.servicePackages)
        .where(eq(serviceCatalogSchema.servicePackages.id, input.id));

      return {
        success: true,
        message: "Package deleted successfully",
      };
    }),

  // ========================================
  // TEMPLATES ENDPOINTS
  // ========================================
  templatesList: protectedProcedure
    .use(requirePermission("templates.read"))
    .input(templateQuerySchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { page, pageSize, ...filters } = input;

      const conditions = [
        eq(
          serviceCatalogSchema.serviceDocumentTemplates.organizationId,
          filters.organizationId || user?.organizationId || "default"
        ),
      ];

      if (filters.businessEntity) {
        conditions.push(
          eq(
            serviceCatalogSchema.serviceDocumentTemplates.businessEntity,
            filters.businessEntity
          )
        );
      }
      if (filters.category) {
        conditions.push(
          eq(
            serviceCatalogSchema.serviceDocumentTemplates.category,
            filters.category
          )
        );
      }
      if (filters.templateType) {
        conditions.push(
          eq(
            serviceCatalogSchema.serviceDocumentTemplates.templateType,
            filters.templateType
          )
        );
      }
      if (filters.status) {
        conditions.push(
          eq(
            serviceCatalogSchema.serviceDocumentTemplates.status,
            filters.status
          )
        );
      }
      if (filters.isLatest !== undefined) {
        conditions.push(
          eq(
            serviceCatalogSchema.serviceDocumentTemplates.isLatest,
            filters.isLatest
          )
        );
      }

      const whereClause = and(...conditions);
      const offset = (page - 1) * pageSize;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(serviceCatalogSchema.serviceDocumentTemplates)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(
            desc(serviceCatalogSchema.serviceDocumentTemplates.createdAt)
          ),
        db
          .select({ count: count() })
          .from(serviceCatalogSchema.serviceDocumentTemplates)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    }),

  templatesGetById: protectedProcedure
    .use(requirePermission("templates.read"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [template] = await db
        .select()
        .from(serviceCatalogSchema.serviceDocumentTemplates)
        .where(eq(serviceCatalogSchema.serviceDocumentTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new ORPCError("NOT_FOUND", { message: "Template not found" });
      }

      return { success: true, data: template };
    }),

  templatesCreate: protectedProcedure
    .use(requirePermission("templates.create"))
    .input(createTemplateSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const templateData = {
        ...input,
        id: nanoid(),
        code: generateTemplateCode(input.businessEntity, input.category),
        organizationId: user?.organizationId || "default",
        status: "ACTIVE" as const,
        version: 1,
        isLatest: true,
        createdBy: user?.id,
      };

      const [newTemplate] = await db
        .insert(serviceCatalogSchema.serviceDocumentTemplates)
        .values(templateData)
        .returning();

      return {
        success: true,
        data: newTemplate,
        message: "Template created successfully",
      };
    }),

  templatesUpdate: protectedProcedure
    .use(requirePermission("templates.update"))
    .input(updateTemplateSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, ...updateData } = input;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.serviceDocumentTemplates)
        .where(eq(serviceCatalogSchema.serviceDocumentTemplates.id, id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Template not found" });
      }

      const [updatedTemplate] = await db
        .update(serviceCatalogSchema.serviceDocumentTemplates)
        .set(updateData)
        .where(eq(serviceCatalogSchema.serviceDocumentTemplates.id, id))
        .returning();

      return {
        success: true,
        data: updatedTemplate,
        message: "Template updated successfully",
      };
    }),

  templatesDelete: protectedProcedure
    .use(requirePermission("templates.delete"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.serviceDocumentTemplates)
        .where(eq(serviceCatalogSchema.serviceDocumentTemplates.id, input.id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", { message: "Template not found" });
      }

      await db
        .delete(serviceCatalogSchema.serviceDocumentTemplates)
        .where(eq(serviceCatalogSchema.serviceDocumentTemplates.id, input.id));

      return {
        success: true,
        message: "Template deleted successfully",
      };
    }),

  // ========================================
  // COMMUNICATIONS ENDPOINTS
  // ========================================
  communicationsList: protectedProcedure
    .use(requirePermission("communications.read"))
    .input(communicationLogQuerySchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { page, pageSize, ...filters } = input;

      const conditions = [
        eq(
          serviceCatalogSchema.clientCommunicationLog.organizationId,
          filters.organizationId || user?.organizationId || "default"
        ),
      ];

      if (filters.clientId) {
        conditions.push(
          eq(
            serviceCatalogSchema.clientCommunicationLog.clientId,
            filters.clientId
          )
        );
      }
      if (filters.projectId) {
        conditions.push(
          eq(
            serviceCatalogSchema.clientCommunicationLog.projectId,
            filters.projectId
          )
        );
      }
      if (filters.communicationType) {
        conditions.push(
          eq(
            serviceCatalogSchema.clientCommunicationLog.communicationType,
            filters.communicationType
          )
        );
      }
      if (filters.direction) {
        conditions.push(
          eq(
            serviceCatalogSchema.clientCommunicationLog.direction,
            filters.direction
          )
        );
      }
      if (filters.requiresFollowUp !== undefined) {
        conditions.push(
          eq(
            serviceCatalogSchema.clientCommunicationLog.requiresFollowUp,
            filters.requiresFollowUp
          )
        );
      }
      if (filters.dateFrom) {
        conditions.push(
          gte(
            serviceCatalogSchema.clientCommunicationLog.createdAt,
            new Date(filters.dateFrom)
          )
        );
      }
      if (filters.dateTo) {
        conditions.push(
          lte(
            serviceCatalogSchema.clientCommunicationLog.createdAt,
            new Date(filters.dateTo)
          )
        );
      }

      const whereClause = and(...conditions);
      const offset = (page - 1) * pageSize;

      const [items, totalResult] = await Promise.all([
        db
          .select()
          .from(serviceCatalogSchema.clientCommunicationLog)
          .where(whereClause)
          .limit(pageSize)
          .offset(offset)
          .orderBy(desc(serviceCatalogSchema.clientCommunicationLog.createdAt)),
        db
          .select({ count: count() })
          .from(serviceCatalogSchema.clientCommunicationLog)
          .where(whereClause),
      ]);

      const total = totalResult[0]?.count || 0;

      return {
        success: true,
        data: {
          items,
          pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      };
    }),

  communicationsGetById: protectedProcedure
    .use(requirePermission("communications.read"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [communication] = await db
        .select()
        .from(serviceCatalogSchema.clientCommunicationLog)
        .where(eq(serviceCatalogSchema.clientCommunicationLog.id, input.id))
        .limit(1);

      if (!communication) {
        throw new ORPCError("NOT_FOUND", {
          message: "Communication not found",
        });
      }

      return { success: true, data: communication };
    }),

  communicationsCreate: protectedProcedure
    .use(requirePermission("communications.create"))
    .input(createCommunicationLogSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const communicationData = {
        ...input,
        id: nanoid(),
        organizationId: user?.organizationId || "default",
        staffUserId: user?.id,
        scheduledAt: input.scheduledAt
          ? new Date(input.scheduledAt)
          : undefined,
        followUpDate: input.followUpDate
          ? new Date(input.followUpDate)
          : undefined,
      };

      const [newCommunication] = await db
        .insert(serviceCatalogSchema.clientCommunicationLog)
        .values(communicationData)
        .returning();

      return {
        success: true,
        data: newCommunication,
        message: "Communication logged successfully",
      };
    }),

  communicationsMarkFollowUpComplete: protectedProcedure
    .use(requirePermission("communications.update"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [updatedCommunication] = await db
        .update(serviceCatalogSchema.clientCommunicationLog)
        .set({ followUpCompleted: true })
        .where(eq(serviceCatalogSchema.clientCommunicationLog.id, input.id))
        .returning();

      if (!updatedCommunication) {
        throw new ORPCError("NOT_FOUND", {
          message: "Communication not found",
        });
      }

      return {
        success: true,
        data: updatedCommunication,
        message: "Follow-up marked as complete",
      };
    }),

  communicationsGetPendingFollowUps: protectedProcedure
    .use(requirePermission("communications.read"))
    .input(z.object({ organizationId: z.string().optional() }))
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const orgId = input.organizationId || user?.organizationId || "default";

      const pendingFollowUps = await db
        .select()
        .from(serviceCatalogSchema.clientCommunicationLog)
        .where(
          and(
            eq(
              serviceCatalogSchema.clientCommunicationLog.organizationId,
              orgId
            ),
            eq(
              serviceCatalogSchema.clientCommunicationLog.requiresFollowUp,
              true
            ),
            eq(
              serviceCatalogSchema.clientCommunicationLog.followUpCompleted,
              false
            )
          )
        )
        .orderBy(serviceCatalogSchema.clientCommunicationLog.followUpDate);

      return {
        success: true,
        data: pendingFollowUps,
      };
    }),

  communicationsDelete: protectedProcedure
    .use(requirePermission("communications.delete"))
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [existing] = await db
        .select()
        .from(serviceCatalogSchema.clientCommunicationLog)
        .where(eq(serviceCatalogSchema.clientCommunicationLog.id, input.id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", {
          message: "Communication not found",
        });
      }

      await db
        .delete(serviceCatalogSchema.clientCommunicationLog)
        .where(eq(serviceCatalogSchema.clientCommunicationLog.id, input.id));

      return {
        success: true,
        message: "Communication deleted successfully",
      };
    }),
};
