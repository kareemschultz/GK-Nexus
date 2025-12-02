import { propertyManagementSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, requirePermission } from "../index";

// Helper functions
function generatePropertyCode(): string {
  const prefix = "PROP";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = nanoid(4).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

function generateTenantCode(): string {
  const prefix = "TEN";
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  const random = nanoid(4).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
}

function generateLeaseNumber(): string {
  const prefix = "LSE";
  const year = new Date().getFullYear();
  const random = nanoid(6).toUpperCase();
  return `${prefix}-${year}-${random}`;
}

function generatePaymentNumber(): string {
  const prefix = "PAY";
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

function generateRequestNumber(): string {
  const prefix = "MNT";
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

function generateInspectionNumber(): string {
  const prefix = "INS";
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}`;
}

// Zod schemas for input validation
const propertyQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  propertyType: z
    .enum([
      "RESIDENTIAL",
      "COMMERCIAL",
      "INDUSTRIAL",
      "LAND",
      "MIXED_USE",
      "AGRICULTURAL",
    ])
    .optional(),
  status: z
    .enum([
      "AVAILABLE",
      "OCCUPIED",
      "UNDER_MAINTENANCE",
      "PENDING_LEASE",
      "SOLD",
      "INACTIVE",
    ])
    .optional(),
  city: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const createPropertySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  propertyType: z.enum([
    "RESIDENTIAL",
    "COMMERCIAL",
    "INDUSTRIAL",
    "LAND",
    "MIXED_USE",
    "AGRICULTURAL",
  ]),
  ownerId: z.string().optional(),
  addressLine1: z.string().min(1),
  addressLine2: z.string().optional(),
  city: z.string().min(1),
  region: z.string().optional(),
  country: z.string().default("Guyana"),
  postalCode: z.string().optional(),
  totalArea: z.string().optional(),
  usableArea: z.string().optional(),
  areaUnit: z.string().default("sq_ft"),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  floors: z.number().optional(),
  yearBuilt: z.number().optional(),
  purchasePrice: z.string().optional(),
  currentValue: z.string().optional(),
  monthlyRent: z.string().optional(),
  currency: z.string().default("GYD"),
  amenities: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  titleDeedNumber: z.string().optional(),
  transportNumber: z.string().optional(),
  managerId: z.string().optional(),
  managementFeePercent: z.string().optional(),
  notes: z.string().optional(),
});

const updatePropertySchema = createPropertySchema.partial();

const createTenantSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  clientId: z.string().optional(),
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  tin: z.string().optional(),
  employer: z.string().optional(),
  employerAddress: z.string().optional(),
  jobTitle: z.string().optional(),
  monthlyIncome: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  notes: z.string().optional(),
});

const createLeaseSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().optional(),
  tenantId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  monthlyRent: z.string().min(1),
  securityDeposit: z.string().optional(),
  currency: z.string().default("GYD"),
  paymentDueDay: z.number().min(1).max(31).default(1),
  gracePeriodDays: z.number().default(5),
  lateFeeAmount: z.string().optional(),
  lateFeePercent: z.string().optional(),
  rentEscalationPercent: z.string().optional(),
  utilitiesIncluded: z.array(z.string()).optional(),
  parkingIncluded: z.boolean().default(false),
  petsAllowed: z.boolean().default(false),
  terms: z.string().optional(),
  specialConditions: z.string().optional(),
  notes: z.string().optional(),
});

const createMaintenanceRequestSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().optional(),
  tenantId: z.string().optional(),
  leaseId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().optional(),
  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "URGENT", "EMERGENCY"])
    .default("MEDIUM"),
  location: z.string().optional(),
  accessInstructions: z.string().optional(),
  estimatedCost: z.string().optional(),
});

const createInspectionSchema = z.object({
  propertyId: z.string().min(1),
  unitId: z.string().optional(),
  leaseId: z.string().optional(),
  inspectionType: z.enum(["move_in", "move_out", "routine", "maintenance"]),
  scheduledDate: z.string().datetime(),
  notes: z.string().optional(),
});

// ========================================
// ROUTER DEFINITION - FLAT STRUCTURE
// ========================================

export const propertyManagementRouter = {
  // ===== PROPERTIES =====
  propertiesList: protectedProcedure
    .use(requirePermission("properties.read"))
    .input(propertyQuerySchema)
    .handler(async ({ input, context }) => {
      const {
        page,
        limit,
        search,
        propertyType,
        status,
        city,
        sortBy,
        sortOrder,
      } = input;
      const { db } = context;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (search) {
        conditions.push(
          sql`(
            ${ilike(propertyManagementSchema.properties.name, `%${search}%`)} OR
            ${ilike(propertyManagementSchema.properties.propertyCode, `%${search}%`)} OR
            ${ilike(propertyManagementSchema.properties.addressLine1, `%${search}%`)}
          )`
        );
      }

      if (propertyType) {
        conditions.push(
          eq(propertyManagementSchema.properties.propertyType, propertyType)
        );
      }

      if (status) {
        conditions.push(eq(propertyManagementSchema.properties.status, status));
      }

      if (city) {
        conditions.push(
          ilike(propertyManagementSchema.properties.city, `%${city}%`)
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(propertyManagementSchema.properties)
        .where(whereClause);

      const sortColumn =
        propertyManagementSchema.properties[
          sortBy as keyof typeof propertyManagementSchema.properties
        ] || propertyManagementSchema.properties.createdAt;
      const orderClause =
        sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      const properties = await db
        .select()
        .from(propertyManagementSchema.properties)
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: {
          items: properties,
          pagination: {
            page,
            limit,
            total: totalResult.count,
            pages: Math.ceil(totalResult.count / limit),
          },
        },
      };
    }),

  propertiesGetById: protectedProcedure
    .use(requirePermission("properties.read"))
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id } = input;

      const [property] = await db
        .select()
        .from(propertyManagementSchema.properties)
        .where(eq(propertyManagementSchema.properties.id, id))
        .limit(1);

      if (!property) {
        throw new ORPCError("NOT_FOUND", "Property not found");
      }

      return { success: true, data: property };
    }),

  propertiesCreate: protectedProcedure
    .use(requirePermission("properties.create"))
    .input(createPropertySchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const propertyData = {
        ...input,
        id: nanoid(),
        propertyCode: generatePropertyCode(),
        organizationId: user?.organizationId || "default",
        amenities: input.amenities ? JSON.stringify(input.amenities) : null,
        features: input.features ? JSON.stringify(input.features) : null,
        createdBy: user?.id,
      };

      const [newProperty] = await db
        .insert(propertyManagementSchema.properties)
        .values(propertyData)
        .returning();

      return {
        success: true,
        data: newProperty,
        message: "Property created successfully",
      };
    }),

  propertiesUpdate: protectedProcedure
    .use(requirePermission("properties.update"))
    .input(z.object({ id: z.string().min(1), data: updatePropertySchema }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, data } = input;

      const updateData = {
        ...data,
        amenities: data.amenities ? JSON.stringify(data.amenities) : undefined,
        features: data.features ? JSON.stringify(data.features) : undefined,
      };

      const [updatedProperty] = await db
        .update(propertyManagementSchema.properties)
        .set(updateData)
        .where(eq(propertyManagementSchema.properties.id, id))
        .returning();

      if (!updatedProperty) {
        throw new ORPCError("NOT_FOUND", "Property not found");
      }

      return {
        success: true,
        data: updatedProperty,
        message: "Property updated successfully",
      };
    }),

  propertiesDelete: protectedProcedure
    .use(requirePermission("properties.delete"))
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id } = input;

      const [deleted] = await db
        .update(propertyManagementSchema.properties)
        .set({ status: "INACTIVE" })
        .where(eq(propertyManagementSchema.properties.id, id))
        .returning();

      if (!deleted) {
        throw new ORPCError("NOT_FOUND", "Property not found");
      }

      return { success: true, message: "Property deleted successfully" };
    }),

  propertiesStats: protectedProcedure
    .use(requirePermission("properties.read"))
    .handler(async ({ context }) => {
      const { db } = context;

      const statusStats = await db
        .select({
          status: propertyManagementSchema.properties.status,
          count: count(),
        })
        .from(propertyManagementSchema.properties)
        .groupBy(propertyManagementSchema.properties.status);

      const typeStats = await db
        .select({
          propertyType: propertyManagementSchema.properties.propertyType,
          count: count(),
        })
        .from(propertyManagementSchema.properties)
        .groupBy(propertyManagementSchema.properties.propertyType);

      const [totalResult] = await db
        .select({ total: count() })
        .from(propertyManagementSchema.properties);

      return {
        success: true,
        data: {
          total: totalResult.total,
          byStatus: statusStats,
          byType: typeStats,
        },
      };
    }),

  // ===== TENANTS =====
  tenantsList: protectedProcedure
    .use(requirePermission("tenants.read"))
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { page, limit, search, isActive } = input;
      const { db } = context;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (search) {
        conditions.push(
          sql`(
            ${ilike(propertyManagementSchema.tenants.firstName, `%${search}%`)} OR
            ${ilike(propertyManagementSchema.tenants.lastName, `%${search}%`)} OR
            ${ilike(propertyManagementSchema.tenants.email, `%${search}%`)} OR
            ${ilike(propertyManagementSchema.tenants.tenantCode, `%${search}%`)}
          )`
        );
      }

      if (isActive !== undefined) {
        conditions.push(
          eq(propertyManagementSchema.tenants.isActive, isActive)
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(propertyManagementSchema.tenants)
        .where(whereClause);

      const tenants = await db
        .select()
        .from(propertyManagementSchema.tenants)
        .where(whereClause)
        .orderBy(desc(propertyManagementSchema.tenants.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: {
          items: tenants,
          pagination: {
            page,
            limit,
            total: totalResult.count,
            pages: Math.ceil(totalResult.count / limit),
          },
        },
      };
    }),

  tenantsGetById: protectedProcedure
    .use(requirePermission("tenants.read"))
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id } = input;

      const [tenant] = await db
        .select()
        .from(propertyManagementSchema.tenants)
        .where(eq(propertyManagementSchema.tenants.id, id))
        .limit(1);

      if (!tenant) {
        throw new ORPCError("NOT_FOUND", "Tenant not found");
      }

      return { success: true, data: tenant };
    }),

  tenantsCreate: protectedProcedure
    .use(requirePermission("tenants.create"))
    .input(createTenantSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const tenantData = {
        ...input,
        id: nanoid(),
        tenantCode: generateTenantCode(),
        organizationId: user?.organizationId || "default",
        createdBy: user?.id,
      };

      const [newTenant] = await db
        .insert(propertyManagementSchema.tenants)
        .values(tenantData)
        .returning();

      return {
        success: true,
        data: newTenant,
        message: "Tenant created successfully",
      };
    }),

  tenantsUpdate: protectedProcedure
    .use(requirePermission("tenants.update"))
    .input(
      z.object({ id: z.string().min(1), data: createTenantSchema.partial() })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, data } = input;

      const [updatedTenant] = await db
        .update(propertyManagementSchema.tenants)
        .set(data)
        .where(eq(propertyManagementSchema.tenants.id, id))
        .returning();

      if (!updatedTenant) {
        throw new ORPCError("NOT_FOUND", "Tenant not found");
      }

      return {
        success: true,
        data: updatedTenant,
        message: "Tenant updated successfully",
      };
    }),

  tenantsDelete: protectedProcedure
    .use(requirePermission("tenants.delete"))
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id } = input;

      const [deleted] = await db
        .update(propertyManagementSchema.tenants)
        .set({ isActive: false })
        .where(eq(propertyManagementSchema.tenants.id, id))
        .returning();

      if (!deleted) {
        throw new ORPCError("NOT_FOUND", "Tenant not found");
      }

      return { success: true, message: "Tenant deleted successfully" };
    }),

  // ===== LEASES =====
  leasesList: protectedProcedure
    .use(requirePermission("leases.read"))
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        propertyId: z.string().optional(),
        tenantId: z.string().optional(),
        status: z
          .enum([
            "DRAFT",
            "PENDING_SIGNATURE",
            "ACTIVE",
            "EXPIRING_SOON",
            "EXPIRED",
            "TERMINATED",
            "RENEWED",
          ])
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { page, limit, propertyId, tenantId, status } = input;
      const { db } = context;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (propertyId) {
        conditions.push(
          eq(propertyManagementSchema.leases.propertyId, propertyId)
        );
      }

      if (tenantId) {
        conditions.push(eq(propertyManagementSchema.leases.tenantId, tenantId));
      }

      if (status) {
        conditions.push(eq(propertyManagementSchema.leases.status, status));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(propertyManagementSchema.leases)
        .where(whereClause);

      const leases = await db
        .select()
        .from(propertyManagementSchema.leases)
        .where(whereClause)
        .orderBy(desc(propertyManagementSchema.leases.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: {
          items: leases,
          pagination: {
            page,
            limit,
            total: totalResult.count,
            pages: Math.ceil(totalResult.count / limit),
          },
        },
      };
    }),

  leasesGetById: protectedProcedure
    .use(requirePermission("leases.read"))
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id } = input;

      const [lease] = await db
        .select()
        .from(propertyManagementSchema.leases)
        .where(eq(propertyManagementSchema.leases.id, id))
        .limit(1);

      if (!lease) {
        throw new ORPCError("NOT_FOUND", "Lease not found");
      }

      return { success: true, data: lease };
    }),

  leasesCreate: protectedProcedure
    .use(requirePermission("leases.create"))
    .input(createLeaseSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const leaseData = {
        ...input,
        id: nanoid(),
        leaseNumber: generateLeaseNumber(),
        organizationId: user?.organizationId || "default",
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        utilitiesIncluded: input.utilitiesIncluded
          ? JSON.stringify(input.utilitiesIncluded)
          : null,
        createdBy: user?.id,
      };

      const [newLease] = await db
        .insert(propertyManagementSchema.leases)
        .values(leaseData)
        .returning();

      // Update property status to OCCUPIED
      await db
        .update(propertyManagementSchema.properties)
        .set({ status: "OCCUPIED" })
        .where(eq(propertyManagementSchema.properties.id, input.propertyId));

      return {
        success: true,
        data: newLease,
        message: "Lease created successfully",
      };
    }),

  leasesUpdate: protectedProcedure
    .use(requirePermission("leases.update"))
    .input(
      z.object({ id: z.string().min(1), data: createLeaseSchema.partial() })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, data } = input;

      const updateData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        utilitiesIncluded: data.utilitiesIncluded
          ? JSON.stringify(data.utilitiesIncluded)
          : undefined,
      };

      const [updatedLease] = await db
        .update(propertyManagementSchema.leases)
        .set(updateData)
        .where(eq(propertyManagementSchema.leases.id, id))
        .returning();

      if (!updatedLease) {
        throw new ORPCError("NOT_FOUND", "Lease not found");
      }

      return {
        success: true,
        data: updatedLease,
        message: "Lease updated successfully",
      };
    }),

  leasesTerminate: protectedProcedure
    .use(requirePermission("leases.update"))
    .input(
      z.object({
        id: z.string().min(1),
        terminationDate: z.string().datetime(),
        reason: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, terminationDate, reason } = input;

      const [lease] = await db
        .select()
        .from(propertyManagementSchema.leases)
        .where(eq(propertyManagementSchema.leases.id, id))
        .limit(1);

      if (!lease) {
        throw new ORPCError("NOT_FOUND", "Lease not found");
      }

      const [updatedLease] = await db
        .update(propertyManagementSchema.leases)
        .set({
          status: "TERMINATED",
          moveOutDate: new Date(terminationDate),
          notes: reason ? `Termination reason: ${reason}` : undefined,
        })
        .where(eq(propertyManagementSchema.leases.id, id))
        .returning();

      // Update property status to AVAILABLE
      await db
        .update(propertyManagementSchema.properties)
        .set({ status: "AVAILABLE" })
        .where(eq(propertyManagementSchema.properties.id, lease.propertyId));

      return {
        success: true,
        data: updatedLease,
        message: "Lease terminated successfully",
      };
    }),

  leasesGetExpiring: protectedProcedure
    .use(requirePermission("leases.read"))
    .input(z.object({ daysAhead: z.number().default(30) }))
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { daysAhead } = input;

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const expiringLeases = await db
        .select()
        .from(propertyManagementSchema.leases)
        .where(
          and(
            eq(propertyManagementSchema.leases.status, "ACTIVE"),
            lte(propertyManagementSchema.leases.endDate, futureDate),
            gte(propertyManagementSchema.leases.endDate, new Date())
          )
        )
        .orderBy(asc(propertyManagementSchema.leases.endDate));

      return { success: true, data: expiringLeases };
    }),

  // ===== RENT PAYMENTS =====
  paymentsList: protectedProcedure
    .use(requirePermission("payments.read"))
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        leaseId: z.string().optional(),
        tenantId: z.string().optional(),
        status: z
          .enum(["PENDING", "PAID", "PARTIAL", "OVERDUE", "WAIVED", "REFUNDED"])
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { page, limit, leaseId, tenantId, status } = input;
      const { db } = context;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (leaseId) {
        conditions.push(
          eq(propertyManagementSchema.rentPayments.leaseId, leaseId)
        );
      }

      if (tenantId) {
        conditions.push(
          eq(propertyManagementSchema.rentPayments.tenantId, tenantId)
        );
      }

      if (status) {
        conditions.push(
          eq(propertyManagementSchema.rentPayments.status, status)
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(propertyManagementSchema.rentPayments)
        .where(whereClause);

      const payments = await db
        .select()
        .from(propertyManagementSchema.rentPayments)
        .where(whereClause)
        .orderBy(desc(propertyManagementSchema.rentPayments.dueDate))
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: {
          items: payments,
          pagination: {
            page,
            limit,
            total: totalResult.count,
            pages: Math.ceil(totalResult.count / limit),
          },
        },
      };
    }),

  paymentsRecordPayment: protectedProcedure
    .use(requirePermission("payments.create"))
    .input(
      z.object({
        leaseId: z.string().min(1),
        tenantId: z.string().min(1),
        rentAmount: z.string().min(1),
        periodStart: z.string().datetime(),
        periodEnd: z.string().datetime(),
        dueDate: z.string().datetime(),
        amountPaid: z.string().optional(),
        paymentMethod: z.string().optional(),
        paymentReference: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const rentAmount = Number.parseFloat(input.rentAmount);
      const amountPaid = input.amountPaid
        ? Number.parseFloat(input.amountPaid)
        : 0;
      const balance = rentAmount - amountPaid;

      let status: "PENDING" | "PAID" | "PARTIAL" = "PENDING";
      if (amountPaid >= rentAmount) {
        status = "PAID";
      } else if (amountPaid > 0) {
        status = "PARTIAL";
      }

      const paymentData = {
        id: nanoid(),
        paymentNumber: generatePaymentNumber(),
        organizationId: user?.organizationId || "default",
        leaseId: input.leaseId,
        tenantId: input.tenantId,
        rentAmount: input.rentAmount,
        totalAmount: input.rentAmount,
        amountPaid: input.amountPaid || "0",
        balance: balance.toString(),
        status,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        dueDate: new Date(input.dueDate),
        paidDate: amountPaid > 0 ? new Date() : null,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference,
        notes: input.notes,
        processedBy: user?.id,
      };

      const [newPayment] = await db
        .insert(propertyManagementSchema.rentPayments)
        .values(paymentData)
        .returning();

      return {
        success: true,
        data: newPayment,
        message: "Payment recorded successfully",
      };
    }),

  paymentsUpdatePayment: protectedProcedure
    .use(requirePermission("payments.update"))
    .input(
      z.object({
        id: z.string().min(1),
        amountPaid: z.string().min(1),
        paymentMethod: z.string().optional(),
        paymentReference: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { id, amountPaid, paymentMethod, paymentReference, notes } = input;

      const [payment] = await db
        .select()
        .from(propertyManagementSchema.rentPayments)
        .where(eq(propertyManagementSchema.rentPayments.id, id))
        .limit(1);

      if (!payment) {
        throw new ORPCError("NOT_FOUND", "Payment not found");
      }

      const totalPaid =
        Number.parseFloat(payment.amountPaid || "0") +
        Number.parseFloat(amountPaid);
      const totalAmount = Number.parseFloat(payment.totalAmount);
      const balance = totalAmount - totalPaid;

      let status: "PENDING" | "PAID" | "PARTIAL" = "PENDING";
      if (totalPaid >= totalAmount) {
        status = "PAID";
      } else if (totalPaid > 0) {
        status = "PARTIAL";
      }

      const [updatedPayment] = await db
        .update(propertyManagementSchema.rentPayments)
        .set({
          amountPaid: totalPaid.toString(),
          balance: balance.toString(),
          status,
          paidDate: new Date(),
          paymentMethod,
          paymentReference,
          notes,
          processedBy: user?.id,
        })
        .where(eq(propertyManagementSchema.rentPayments.id, id))
        .returning();

      return {
        success: true,
        data: updatedPayment,
        message: "Payment updated successfully",
      };
    }),

  paymentsGetOverdue: protectedProcedure
    .use(requirePermission("payments.read"))
    .handler(async ({ context }) => {
      const { db } = context;

      const overduePayments = await db
        .select()
        .from(propertyManagementSchema.rentPayments)
        .where(
          and(
            eq(propertyManagementSchema.rentPayments.status, "PENDING"),
            lte(propertyManagementSchema.rentPayments.dueDate, new Date())
          )
        )
        .orderBy(asc(propertyManagementSchema.rentPayments.dueDate));

      // Update status to OVERDUE
      for (const payment of overduePayments) {
        await db
          .update(propertyManagementSchema.rentPayments)
          .set({ status: "OVERDUE" })
          .where(eq(propertyManagementSchema.rentPayments.id, payment.id));
      }

      return { success: true, data: overduePayments };
    }),

  // ===== MAINTENANCE =====
  maintenanceList: protectedProcedure
    .use(requirePermission("maintenance.read"))
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        propertyId: z.string().optional(),
        status: z
          .enum([
            "REPORTED",
            "ASSIGNED",
            "IN_PROGRESS",
            "PENDING_PARTS",
            "COMPLETED",
            "CLOSED",
            "CANCELLED",
          ])
          .optional(),
        priority: z
          .enum(["LOW", "MEDIUM", "HIGH", "URGENT", "EMERGENCY"])
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { page, limit, propertyId, status, priority } = input;
      const { db } = context;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (propertyId) {
        conditions.push(
          eq(
            propertyManagementSchema.maintenanceRequests.propertyId,
            propertyId
          )
        );
      }

      if (status) {
        conditions.push(
          eq(propertyManagementSchema.maintenanceRequests.status, status)
        );
      }

      if (priority) {
        conditions.push(
          eq(propertyManagementSchema.maintenanceRequests.priority, priority)
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(propertyManagementSchema.maintenanceRequests)
        .where(whereClause);

      const requests = await db
        .select()
        .from(propertyManagementSchema.maintenanceRequests)
        .where(whereClause)
        .orderBy(
          desc(propertyManagementSchema.maintenanceRequests.reportedDate)
        )
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

  maintenanceCreate: protectedProcedure
    .use(requirePermission("maintenance.create"))
    .input(createMaintenanceRequestSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const requestData = {
        ...input,
        id: nanoid(),
        requestNumber: generateRequestNumber(),
        organizationId: user?.organizationId || "default",
        reportedBy: user?.id,
      };

      const [newRequest] = await db
        .insert(propertyManagementSchema.maintenanceRequests)
        .values(requestData)
        .returning();

      return {
        success: true,
        data: newRequest,
        message: "Maintenance request created successfully",
      };
    }),

  maintenanceUpdate: protectedProcedure
    .use(requirePermission("maintenance.update"))
    .input(
      z.object({
        id: z.string().min(1),
        status: z
          .enum([
            "REPORTED",
            "ASSIGNED",
            "IN_PROGRESS",
            "PENDING_PARTS",
            "COMPLETED",
            "CLOSED",
            "CANCELLED",
          ])
          .optional(),
        priority: z
          .enum(["LOW", "MEDIUM", "HIGH", "URGENT", "EMERGENCY"])
          .optional(),
        assignedToId: z.string().optional(),
        assignedVendor: z.string().optional(),
        scheduledDate: z.string().datetime().optional(),
        actualCost: z.string().optional(),
        resolution: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, scheduledDate, ...data } = input;

      const updateData = {
        ...data,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
        completedDate: data.status === "COMPLETED" ? new Date() : undefined,
      };

      const [updatedRequest] = await db
        .update(propertyManagementSchema.maintenanceRequests)
        .set(updateData)
        .where(eq(propertyManagementSchema.maintenanceRequests.id, id))
        .returning();

      if (!updatedRequest) {
        throw new ORPCError("NOT_FOUND", "Maintenance request not found");
      }

      return {
        success: true,
        data: updatedRequest,
        message: "Maintenance request updated successfully",
      };
    }),

  // ===== INSPECTIONS =====
  inspectionsList: protectedProcedure
    .use(requirePermission("inspections.read"))
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        propertyId: z.string().optional(),
        inspectionType: z
          .enum(["move_in", "move_out", "routine", "maintenance"])
          .optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { page, limit, propertyId, inspectionType } = input;
      const { db } = context;
      const offset = (page - 1) * limit;

      const conditions = [];

      if (propertyId) {
        conditions.push(
          eq(
            propertyManagementSchema.propertyInspections.propertyId,
            propertyId
          )
        );
      }

      if (inspectionType) {
        conditions.push(
          eq(
            propertyManagementSchema.propertyInspections.inspectionType,
            inspectionType
          )
        );
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      const [totalResult] = await db
        .select({ count: count() })
        .from(propertyManagementSchema.propertyInspections)
        .where(whereClause);

      const inspections = await db
        .select()
        .from(propertyManagementSchema.propertyInspections)
        .where(whereClause)
        .orderBy(
          desc(propertyManagementSchema.propertyInspections.scheduledDate)
        )
        .limit(limit)
        .offset(offset);

      return {
        success: true,
        data: {
          items: inspections,
          pagination: {
            page,
            limit,
            total: totalResult.count,
            pages: Math.ceil(totalResult.count / limit),
          },
        },
      };
    }),

  inspectionsCreate: protectedProcedure
    .use(requirePermission("inspections.create"))
    .input(createInspectionSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      const inspectionData = {
        ...input,
        id: nanoid(),
        inspectionNumber: generateInspectionNumber(),
        organizationId: user?.organizationId || "default",
        scheduledDate: new Date(input.scheduledDate),
        inspectorId: user?.id || "default",
      };

      const [newInspection] = await db
        .insert(propertyManagementSchema.propertyInspections)
        .values(inspectionData)
        .returning();

      return {
        success: true,
        data: newInspection,
        message: "Inspection scheduled successfully",
      };
    }),

  inspectionsComplete: protectedProcedure
    .use(requirePermission("inspections.update"))
    .input(
      z.object({
        id: z.string().min(1),
        overallCondition: z.enum(["excellent", "good", "fair", "poor"]),
        checklist: z.record(z.boolean()).optional(),
        findings: z.array(z.string()).optional(),
        followUpRequired: z.boolean().default(false),
        followUpNotes: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { id, checklist, findings, ...data } = input;

      const [updatedInspection] = await db
        .update(propertyManagementSchema.propertyInspections)
        .set({
          ...data,
          completedDate: new Date(),
          checklist: checklist ? JSON.stringify(checklist) : undefined,
          findings: findings ? JSON.stringify(findings) : undefined,
        })
        .where(eq(propertyManagementSchema.propertyInspections.id, id))
        .returning();

      if (!updatedInspection) {
        throw new ORPCError("NOT_FOUND", "Inspection not found");
      }

      return {
        success: true,
        data: updatedInspection,
        message: "Inspection completed successfully",
      };
    }),
};
