import { partnerNetworkSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { protectedProcedure, requirePermission } from "../index";

// ========================================
// PARTNER NETWORK API ROUTER
// ========================================
// Complete partner relationship management for professional services
// Includes: Partners, Referrals, Agreements, Reviews, Communications

// Partner types
const partnerTypes = [
  "LAW_FIRM",
  "ACCOUNTING_FIRM",
  "BANK",
  "INSURANCE_COMPANY",
  "REAL_ESTATE",
  "IMMIGRATION_CONSULTANT",
  "BUSINESS_CONSULTANT",
  "IT_SERVICES",
  "TRAINING_PROVIDER",
  "GOVERNMENT_LIAISON",
  "NOTARY_PUBLIC",
  "COURT_MARSHAL",
  "LAND_SURVEYOR",
  "VALUATOR",
  "CUSTOMS_BROKER",
  "SHIPPING_AGENT",
  "TRANSLATOR",
  "OTHER",
] as const;

const partnerStatuses = [
  "PROSPECT",
  "PENDING_VERIFICATION",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "TERMINATED",
] as const;

const referralStatuses = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
] as const;

const partnershipTiers = [
  "BASIC",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "STRATEGIC",
] as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

const generatePartnerCode = (): string => {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PTR-${year}-${randomPart}`;
};

const generateReferralNumber = (): string => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REF-${year}${month}-${randomPart}`;
};

const generateAgreementNumber = (): string => {
  const year = new Date().getFullYear();
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AGR-${year}-${randomPart}`;
};

// ========================================
// INPUT SCHEMAS
// ========================================

// Partner schemas
const partnerQuerySchema = z.object({
  organizationId: z.string().optional(),
  partnerType: z.enum(partnerTypes).optional(),
  status: z.enum(partnerStatuses).optional(),
  tier: z.enum(partnershipTiers).optional(),
  search: z.string().optional(),
  isVerified: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  acceptsReferrals: z.boolean().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

const createPartnerSchema = z.object({
  partnerType: z.enum(partnerTypes),
  companyName: z.string().min(1),
  tradingName: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  yearEstablished: z.number().optional(),
  primaryContactName: z.string().min(1),
  primaryContactTitle: z.string().optional(),
  primaryContactEmail: z.string().email(),
  primaryContactPhone: z.string().optional(),
  additionalContacts: z.any().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().default("Guyana"),
  postalCode: z.string().optional(),
  generalEmail: z.string().email().optional(),
  generalPhone: z.string().optional(),
  fax: z.string().optional(),
  website: z.string().url().optional(),
  linkedIn: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  servicesOffered: z.any().optional(),
  specializations: z.any().optional(),
  industriesServed: z.any().optional(),
  geographicCoverage: z.any().optional(),
  licenses: z.any().optional(),
  certifications: z.any().optional(),
  professionalBodies: z.any().optional(),
  insuranceCoverage: z.any().optional(),
  referralCommissionPercent: z.string().optional(),
  acceptsReferrals: z.boolean().default(true),
  referralCategories: z.any().optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().optional(),
  tagline: z.string().optional(),
  internalNotes: z.string().optional(),
  metadata: z.any().optional(),
});

const updatePartnerSchema = z.object({
  id: z.string(),
  partnerType: z.enum(partnerTypes).optional(),
  status: z.enum(partnerStatuses).optional(),
  tier: z.enum(partnershipTiers).optional(),
  companyName: z.string().min(1).optional(),
  tradingName: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  tinNumber: z.string().optional(),
  yearEstablished: z.number().optional(),
  primaryContactName: z.string().min(1).optional(),
  primaryContactTitle: z.string().optional(),
  primaryContactEmail: z.string().email().optional(),
  primaryContactPhone: z.string().optional(),
  additionalContacts: z.any().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  generalEmail: z.string().email().optional(),
  generalPhone: z.string().optional(),
  fax: z.string().optional(),
  website: z.string().url().optional(),
  linkedIn: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  servicesOffered: z.any().optional(),
  specializations: z.any().optional(),
  industriesServed: z.any().optional(),
  geographicCoverage: z.any().optional(),
  licenses: z.any().optional(),
  certifications: z.any().optional(),
  professionalBodies: z.any().optional(),
  insuranceCoverage: z.any().optional(),
  partnerSince: z.string().datetime().optional(),
  agreementDate: z.string().datetime().optional(),
  agreementExpiryDate: z.string().datetime().optional(),
  agreementDocumentUrl: z.string().url().optional(),
  referralCommissionPercent: z.string().optional(),
  acceptsReferrals: z.boolean().optional(),
  referralCategories: z.any().optional(),
  isVerified: z.boolean().optional(),
  verifiedDate: z.string().datetime().optional(),
  verifiedBy: z.string().optional(),
  logoUrl: z.string().url().optional(),
  description: z.string().optional(),
  tagline: z.string().optional(),
  isFeatured: z.boolean().optional(),
  displayOrder: z.number().optional(),
  internalNotes: z.string().optional(),
  metadata: z.any().optional(),
});

// Referral schemas
const referralQuerySchema = z.object({
  organizationId: z.string().optional(),
  referringPartnerId: z.string().optional(),
  receivingPartnerId: z.string().optional(),
  clientId: z.string().optional(),
  status: z.enum(referralStatuses).optional(),
  serviceCategory: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  commissionPaid: z.boolean().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

const createReferralSchema = z.object({
  referringPartnerId: z.string(),
  receivingPartnerId: z.string(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  clientContact: z.string().optional(),
  serviceCategory: z.string(),
  serviceDescription: z.string().optional(),
  requirements: z.string().optional(),
  urgency: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  deadline: z.string().datetime().optional(),
  estimatedValue: z.string().optional(),
  currency: z.string().default("GYD"),
  commissionPercent: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  metadata: z.any().optional(),
});

const updateReferralSchema = z.object({
  id: z.string(),
  status: z.enum(referralStatuses).optional(),
  serviceDescription: z.string().optional(),
  requirements: z.string().optional(),
  urgency: z.enum(["low", "normal", "high", "urgent"]).optional(),
  deadline: z.string().datetime().optional(),
  estimatedValue: z.string().optional(),
  actualValue: z.string().optional(),
  commissionPercent: z.string().optional(),
  commissionAmount: z.string().optional(),
  commissionPaid: z.boolean().optional(),
  commissionPaidDate: z.string().datetime().optional(),
  acceptedDate: z.string().datetime().optional(),
  completedDate: z.string().datetime().optional(),
  outcome: z.string().optional(),
  successfulConversion: z.boolean().optional(),
  referrerFeedback: z.string().optional(),
  referrerRating: z.number().min(1).max(5).optional(),
  receiverFeedback: z.string().optional(),
  receiverRating: z.number().min(1).max(5).optional(),
  clientFeedback: z.string().optional(),
  clientRating: z.number().min(1).max(5).optional(),
  communicationLog: z.any().optional(),
  documents: z.any().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  metadata: z.any().optional(),
});

// Agreement schemas
const agreementQuerySchema = z.object({
  organizationId: z.string().optional(),
  partnerId: z.string().optional(),
  agreementType: z.string().optional(),
  status: z
    .enum(["draft", "pending_signature", "active", "expired", "terminated"])
    .optional(),
  expiringBefore: z.string().datetime().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

const createAgreementSchema = z.object({
  partnerId: z.string(),
  agreementType: z.enum(["partnership", "referral", "joint_venture", "mou"]),
  title: z.string().min(1),
  description: z.string().optional(),
  effectiveDate: z.string().datetime(),
  expiryDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
  autoRenewal: z.boolean().default(false),
  termsAndConditions: z.string().optional(),
  commissionTerms: z.string().optional(),
  exclusivityTerms: z.string().optional(),
  terminationTerms: z.string().optional(),
  confidentialityTerms: z.string().optional(),
  ourSignatory: z.string().optional(),
  partnerSignatory: z.string().optional(),
  documentUrl: z.string().url().optional(),
  attachments: z.any().optional(),
  notes: z.string().optional(),
  metadata: z.any().optional(),
});

const updateAgreementSchema = z.object({
  id: z.string(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  effectiveDate: z.string().datetime().optional(),
  expiryDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
  autoRenewal: z.boolean().optional(),
  status: z
    .enum(["draft", "pending_signature", "active", "expired", "terminated"])
    .optional(),
  termsAndConditions: z.string().optional(),
  commissionTerms: z.string().optional(),
  exclusivityTerms: z.string().optional(),
  terminationTerms: z.string().optional(),
  confidentialityTerms: z.string().optional(),
  ourSignatory: z.string().optional(),
  ourSignatureDate: z.string().datetime().optional(),
  partnerSignatory: z.string().optional(),
  partnerSignatureDate: z.string().datetime().optional(),
  documentUrl: z.string().url().optional(),
  signedDocumentUrl: z.string().url().optional(),
  attachments: z.any().optional(),
  lastReviewDate: z.string().datetime().optional(),
  nextReviewDate: z.string().datetime().optional(),
  reviewNotes: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.any().optional(),
});

// Review schemas
const reviewQuerySchema = z.object({
  organizationId: z.string().optional(),
  partnerId: z.string().optional(),
  referralId: z.string().optional(),
  reviewerType: z.enum(["internal", "partner", "client"]).optional(),
  status: z.enum(["pending", "approved", "rejected", "hidden"]).optional(),
  minRating: z.number().min(1).max(5).optional(),
  isPublic: z.boolean().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

const createReviewSchema = z.object({
  partnerId: z.string(),
  referralId: z.string().optional(),
  reviewerType: z.enum(["internal", "partner", "client"]),
  reviewerName: z.string().optional(),
  reviewerClientId: z.string().optional(),
  overallRating: z.number().min(1).max(5),
  serviceQualityRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  timelinessRating: z.number().min(1).max(5).optional(),
  valueRating: z.number().min(1).max(5).optional(),
  title: z.string().optional(),
  review: z.string().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  isPublic: z.boolean().default(true),
  metadata: z.any().optional(),
});

// Communication schemas
const communicationQuerySchema = z.object({
  organizationId: z.string().optional(),
  partnerId: z.string().optional(),
  referralId: z.string().optional(),
  communicationType: z.enum(["email", "phone", "meeting", "portal"]).optional(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  requiresFollowUp: z.boolean().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.number().default(1),
  pageSize: z.number().default(20),
});

const createCommunicationSchema = z.object({
  partnerId: z.string(),
  referralId: z.string().optional(),
  communicationType: z.enum(["email", "phone", "meeting", "portal"]),
  direction: z.enum(["inbound", "outbound"]),
  subject: z.string().optional(),
  content: z.string().optional(),
  partnerContactName: z.string().optional(),
  partnerContactEmail: z.string().email().optional(),
  scheduledAt: z.string().datetime().optional(),
  duration: z.number().optional(),
  meetingLocation: z.string().optional(),
  requiresFollowUp: z.boolean().default(false),
  followUpDate: z.string().datetime().optional(),
  attachments: z.any().optional(),
  metadata: z.any().optional(),
});

// ========================================
// ROUTER DEFINITION
// ========================================

export const partnerNetworkRouter = {
  // ========================================
  // PARTNERS SUB-ROUTER
  // ========================================
  partners: {
    list: protectedProcedure
      .use(requirePermission("partners.read"))
      .input(partnerQuerySchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;
        const { page, pageSize, ...filters } = input;

        const conditions = [
          eq(
            partnerNetworkSchema.partners.organizationId,
            filters.organizationId || user?.organizationId || "default"
          ),
        ];

        if (filters.partnerType) {
          conditions.push(
            eq(partnerNetworkSchema.partners.partnerType, filters.partnerType)
          );
        }
        if (filters.status) {
          conditions.push(
            eq(partnerNetworkSchema.partners.status, filters.status)
          );
        }
        if (filters.tier) {
          conditions.push(eq(partnerNetworkSchema.partners.tier, filters.tier));
        }
        if (filters.isVerified !== undefined) {
          conditions.push(
            eq(partnerNetworkSchema.partners.isVerified, filters.isVerified)
          );
        }
        if (filters.isFeatured !== undefined) {
          conditions.push(
            eq(partnerNetworkSchema.partners.isFeatured, filters.isFeatured)
          );
        }
        if (filters.acceptsReferrals !== undefined) {
          conditions.push(
            eq(
              partnerNetworkSchema.partners.acceptsReferrals,
              filters.acceptsReferrals
            )
          );
        }
        if (filters.search) {
          conditions.push(
            or(
              ilike(
                partnerNetworkSchema.partners.companyName,
                `%${filters.search}%`
              ),
              ilike(
                partnerNetworkSchema.partners.primaryContactName,
                `%${filters.search}%`
              ),
              ilike(
                partnerNetworkSchema.partners.partnerCode,
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
            .from(partnerNetworkSchema.partners)
            .where(whereClause)
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(partnerNetworkSchema.partners.createdAt)),
          db
            .select({ count: count() })
            .from(partnerNetworkSchema.partners)
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

    getById: protectedProcedure
      .use(requirePermission("partners.read"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [partner] = await db
          .select()
          .from(partnerNetworkSchema.partners)
          .where(eq(partnerNetworkSchema.partners.id, input.id))
          .limit(1);

        if (!partner) {
          throw new ORPCError("NOT_FOUND", { message: "Partner not found" });
        }

        return { success: true, data: partner };
      }),

    create: protectedProcedure
      .use(requirePermission("partners.create"))
      .input(createPartnerSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const partnerData = {
          ...input,
          id: nanoid(),
          partnerCode: generatePartnerCode(),
          organizationId: user?.organizationId || "default",
          status: "PROSPECT" as const,
          tier: "BASIC" as const,
          createdBy: user?.id,
        };

        const [newPartner] = await db
          .insert(partnerNetworkSchema.partners)
          .values(partnerData)
          .returning();

        return {
          success: true,
          data: newPartner,
          message: "Partner created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("partners.update"))
      .input(updatePartnerSchema)
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, ...updateData } = input;

        const [existing] = await db
          .select()
          .from(partnerNetworkSchema.partners)
          .where(eq(partnerNetworkSchema.partners.id, id))
          .limit(1);

        if (!existing) {
          throw new ORPCError("NOT_FOUND", { message: "Partner not found" });
        }

        const [updatedPartner] = await db
          .update(partnerNetworkSchema.partners)
          .set(updateData)
          .where(eq(partnerNetworkSchema.partners.id, id))
          .returning();

        return {
          success: true,
          data: updatedPartner,
          message: "Partner updated successfully",
        };
      }),

    delete: protectedProcedure
      .use(requirePermission("partners.delete"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [existing] = await db
          .select()
          .from(partnerNetworkSchema.partners)
          .where(eq(partnerNetworkSchema.partners.id, input.id))
          .limit(1);

        if (!existing) {
          throw new ORPCError("NOT_FOUND", { message: "Partner not found" });
        }

        await db
          .delete(partnerNetworkSchema.partners)
          .where(eq(partnerNetworkSchema.partners.id, input.id));

        return {
          success: true,
          message: "Partner deleted successfully",
        };
      }),

    verify: protectedProcedure
      .use(requirePermission("partners.update"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const [updatedPartner] = await db
          .update(partnerNetworkSchema.partners)
          .set({
            isVerified: true,
            verifiedDate: new Date(),
            verifiedBy: user?.id,
            status: "ACTIVE" as const,
          })
          .where(eq(partnerNetworkSchema.partners.id, input.id))
          .returning();

        if (!updatedPartner) {
          throw new ORPCError("NOT_FOUND", { message: "Partner not found" });
        }

        return {
          success: true,
          data: updatedPartner,
          message: "Partner verified successfully",
        };
      }),

    updateTier: protectedProcedure
      .use(requirePermission("partners.update"))
      .input(z.object({ id: z.string(), tier: z.enum(partnershipTiers) }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [updatedPartner] = await db
          .update(partnerNetworkSchema.partners)
          .set({ tier: input.tier })
          .where(eq(partnerNetworkSchema.partners.id, input.id))
          .returning();

        if (!updatedPartner) {
          throw new ORPCError("NOT_FOUND", { message: "Partner not found" });
        }

        return {
          success: true,
          data: updatedPartner,
          message: `Partner tier updated to ${input.tier}`,
        };
      }),

    getStatistics: protectedProcedure
      .use(requirePermission("partners.read"))
      .input(z.object({ organizationId: z.string().optional() }))
      .handler(async ({ input, context }) => {
        const { db, user } = context;
        const orgId = input.organizationId || user?.organizationId || "default";

        const [stats] = await db
          .select({
            total: count(),
          })
          .from(partnerNetworkSchema.partners)
          .where(eq(partnerNetworkSchema.partners.organizationId, orgId));

        const [activeStats] = await db
          .select({
            count: count(),
          })
          .from(partnerNetworkSchema.partners)
          .where(
            and(
              eq(partnerNetworkSchema.partners.organizationId, orgId),
              eq(partnerNetworkSchema.partners.status, "ACTIVE")
            )
          );

        const [verifiedStats] = await db
          .select({
            count: count(),
          })
          .from(partnerNetworkSchema.partners)
          .where(
            and(
              eq(partnerNetworkSchema.partners.organizationId, orgId),
              eq(partnerNetworkSchema.partners.isVerified, true)
            )
          );

        return {
          success: true,
          data: {
            total: stats?.total || 0,
            active: activeStats?.count || 0,
            verified: verifiedStats?.count || 0,
          },
        };
      }),
  },

  // ========================================
  // REFERRALS SUB-ROUTER
  // ========================================
  referrals: {
    list: protectedProcedure
      .use(requirePermission("referrals.read"))
      .input(referralQuerySchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;
        const { page, pageSize, ...filters } = input;

        const conditions = [
          eq(
            partnerNetworkSchema.partnerReferrals.organizationId,
            filters.organizationId || user?.organizationId || "default"
          ),
        ];

        if (filters.referringPartnerId) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerReferrals.referringPartnerId,
              filters.referringPartnerId
            )
          );
        }
        if (filters.receivingPartnerId) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerReferrals.receivingPartnerId,
              filters.receivingPartnerId
            )
          );
        }
        if (filters.clientId) {
          conditions.push(
            eq(partnerNetworkSchema.partnerReferrals.clientId, filters.clientId)
          );
        }
        if (filters.status) {
          conditions.push(
            eq(partnerNetworkSchema.partnerReferrals.status, filters.status)
          );
        }
        if (filters.serviceCategory) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerReferrals.serviceCategory,
              filters.serviceCategory
            )
          );
        }
        if (filters.commissionPaid !== undefined) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerReferrals.commissionPaid,
              filters.commissionPaid
            )
          );
        }
        if (filters.dateFrom) {
          conditions.push(
            gte(
              partnerNetworkSchema.partnerReferrals.referralDate,
              new Date(filters.dateFrom)
            )
          );
        }
        if (filters.dateTo) {
          conditions.push(
            lte(
              partnerNetworkSchema.partnerReferrals.referralDate,
              new Date(filters.dateTo)
            )
          );
        }

        const whereClause = and(...conditions);
        const offset = (page - 1) * pageSize;

        const [items, totalResult] = await Promise.all([
          db
            .select()
            .from(partnerNetworkSchema.partnerReferrals)
            .where(whereClause)
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(partnerNetworkSchema.partnerReferrals.referralDate)),
          db
            .select({ count: count() })
            .from(partnerNetworkSchema.partnerReferrals)
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

    getById: protectedProcedure
      .use(requirePermission("referrals.read"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [referral] = await db
          .select()
          .from(partnerNetworkSchema.partnerReferrals)
          .where(eq(partnerNetworkSchema.partnerReferrals.id, input.id))
          .limit(1);

        if (!referral) {
          throw new ORPCError("NOT_FOUND", { message: "Referral not found" });
        }

        return { success: true, data: referral };
      }),

    create: protectedProcedure
      .use(requirePermission("referrals.create"))
      .input(createReferralSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const referralData = {
          ...input,
          id: nanoid(),
          referralNumber: generateReferralNumber(),
          organizationId: user?.organizationId || "default",
          status: "PENDING" as const,
          referralDate: new Date(),
          createdBy: user?.id,
        };

        const [newReferral] = await db
          .insert(partnerNetworkSchema.partnerReferrals)
          .values(referralData)
          .returning();

        return {
          success: true,
          data: newReferral,
          message: "Referral created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("referrals.update"))
      .input(updateReferralSchema)
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, ...updateData } = input;

        const [existing] = await db
          .select()
          .from(partnerNetworkSchema.partnerReferrals)
          .where(eq(partnerNetworkSchema.partnerReferrals.id, id))
          .limit(1);

        if (!existing) {
          throw new ORPCError("NOT_FOUND", { message: "Referral not found" });
        }

        const [updatedReferral] = await db
          .update(partnerNetworkSchema.partnerReferrals)
          .set(updateData)
          .where(eq(partnerNetworkSchema.partnerReferrals.id, id))
          .returning();

        return {
          success: true,
          data: updatedReferral,
          message: "Referral updated successfully",
        };
      }),

    accept: protectedProcedure
      .use(requirePermission("referrals.update"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [updatedReferral] = await db
          .update(partnerNetworkSchema.partnerReferrals)
          .set({
            status: "ACCEPTED" as const,
            acceptedDate: new Date(),
          })
          .where(eq(partnerNetworkSchema.partnerReferrals.id, input.id))
          .returning();

        if (!updatedReferral) {
          throw new ORPCError("NOT_FOUND", { message: "Referral not found" });
        }

        return {
          success: true,
          data: updatedReferral,
          message: "Referral accepted",
        };
      }),

    complete: protectedProcedure
      .use(requirePermission("referrals.update"))
      .input(
        z.object({
          id: z.string(),
          actualValue: z.string().optional(),
          outcome: z.string().optional(),
          successfulConversion: z.boolean().optional(),
        })
      )
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, ...completionData } = input;

        const [updatedReferral] = await db
          .update(partnerNetworkSchema.partnerReferrals)
          .set({
            ...completionData,
            status: "COMPLETED" as const,
            completedDate: new Date(),
          })
          .where(eq(partnerNetworkSchema.partnerReferrals.id, id))
          .returning();

        if (!updatedReferral) {
          throw new ORPCError("NOT_FOUND", { message: "Referral not found" });
        }

        return {
          success: true,
          data: updatedReferral,
          message: "Referral completed",
        };
      }),

    delete: protectedProcedure
      .use(requirePermission("referrals.delete"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [existing] = await db
          .select()
          .from(partnerNetworkSchema.partnerReferrals)
          .where(eq(partnerNetworkSchema.partnerReferrals.id, input.id))
          .limit(1);

        if (!existing) {
          throw new ORPCError("NOT_FOUND", { message: "Referral not found" });
        }

        await db
          .delete(partnerNetworkSchema.partnerReferrals)
          .where(eq(partnerNetworkSchema.partnerReferrals.id, input.id));

        return {
          success: true,
          message: "Referral deleted successfully",
        };
      }),
  },

  // ========================================
  // AGREEMENTS SUB-ROUTER
  // ========================================
  agreements: {
    list: protectedProcedure
      .use(requirePermission("agreements.read"))
      .input(agreementQuerySchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;
        const { page, pageSize, ...filters } = input;

        const conditions = [
          eq(
            partnerNetworkSchema.partnerAgreements.organizationId,
            filters.organizationId || user?.organizationId || "default"
          ),
        ];

        if (filters.partnerId) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerAgreements.partnerId,
              filters.partnerId
            )
          );
        }
        if (filters.agreementType) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerAgreements.agreementType,
              filters.agreementType
            )
          );
        }
        if (filters.status) {
          conditions.push(
            eq(partnerNetworkSchema.partnerAgreements.status, filters.status)
          );
        }
        if (filters.expiringBefore) {
          conditions.push(
            lte(
              partnerNetworkSchema.partnerAgreements.expiryDate,
              new Date(filters.expiringBefore)
            )
          );
        }

        const whereClause = and(...conditions);
        const offset = (page - 1) * pageSize;

        const [items, totalResult] = await Promise.all([
          db
            .select()
            .from(partnerNetworkSchema.partnerAgreements)
            .where(whereClause)
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(partnerNetworkSchema.partnerAgreements.createdAt)),
          db
            .select({ count: count() })
            .from(partnerNetworkSchema.partnerAgreements)
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

    getById: protectedProcedure
      .use(requirePermission("agreements.read"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [agreement] = await db
          .select()
          .from(partnerNetworkSchema.partnerAgreements)
          .where(eq(partnerNetworkSchema.partnerAgreements.id, input.id))
          .limit(1);

        if (!agreement) {
          throw new ORPCError("NOT_FOUND", { message: "Agreement not found" });
        }

        return { success: true, data: agreement };
      }),

    create: protectedProcedure
      .use(requirePermission("agreements.create"))
      .input(createAgreementSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const agreementData = {
          ...input,
          id: nanoid(),
          agreementNumber: generateAgreementNumber(),
          organizationId: user?.organizationId || "default",
          status: "draft" as const,
          effectiveDate: new Date(input.effectiveDate),
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
          renewalDate: input.renewalDate
            ? new Date(input.renewalDate)
            : undefined,
          createdBy: user?.id,
        };

        const [newAgreement] = await db
          .insert(partnerNetworkSchema.partnerAgreements)
          .values(agreementData)
          .returning();

        return {
          success: true,
          data: newAgreement,
          message: "Agreement created successfully",
        };
      }),

    update: protectedProcedure
      .use(requirePermission("agreements.update"))
      .input(updateAgreementSchema)
      .handler(async ({ input, context }) => {
        const { db } = context;
        const { id, ...updateData } = input;

        const [existing] = await db
          .select()
          .from(partnerNetworkSchema.partnerAgreements)
          .where(eq(partnerNetworkSchema.partnerAgreements.id, id))
          .limit(1);

        if (!existing) {
          throw new ORPCError("NOT_FOUND", { message: "Agreement not found" });
        }

        // Transform date strings to Date objects
        const transformedData = {
          ...updateData,
          effectiveDate: updateData.effectiveDate
            ? new Date(updateData.effectiveDate)
            : undefined,
          expiryDate: updateData.expiryDate
            ? new Date(updateData.expiryDate)
            : undefined,
          renewalDate: updateData.renewalDate
            ? new Date(updateData.renewalDate)
            : undefined,
          ourSignatureDate: updateData.ourSignatureDate
            ? new Date(updateData.ourSignatureDate)
            : undefined,
          partnerSignatureDate: updateData.partnerSignatureDate
            ? new Date(updateData.partnerSignatureDate)
            : undefined,
          lastReviewDate: updateData.lastReviewDate
            ? new Date(updateData.lastReviewDate)
            : undefined,
          nextReviewDate: updateData.nextReviewDate
            ? new Date(updateData.nextReviewDate)
            : undefined,
        };

        const [updatedAgreement] = await db
          .update(partnerNetworkSchema.partnerAgreements)
          .set(transformedData)
          .where(eq(partnerNetworkSchema.partnerAgreements.id, id))
          .returning();

        return {
          success: true,
          data: updatedAgreement,
          message: "Agreement updated successfully",
        };
      }),

    delete: protectedProcedure
      .use(requirePermission("agreements.delete"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [existing] = await db
          .select()
          .from(partnerNetworkSchema.partnerAgreements)
          .where(eq(partnerNetworkSchema.partnerAgreements.id, input.id))
          .limit(1);

        if (!existing) {
          throw new ORPCError("NOT_FOUND", { message: "Agreement not found" });
        }

        await db
          .delete(partnerNetworkSchema.partnerAgreements)
          .where(eq(partnerNetworkSchema.partnerAgreements.id, input.id));

        return {
          success: true,
          message: "Agreement deleted successfully",
        };
      }),

    activate: protectedProcedure
      .use(requirePermission("agreements.update"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [updatedAgreement] = await db
          .update(partnerNetworkSchema.partnerAgreements)
          .set({ status: "active" })
          .where(eq(partnerNetworkSchema.partnerAgreements.id, input.id))
          .returning();

        if (!updatedAgreement) {
          throw new ORPCError("NOT_FOUND", { message: "Agreement not found" });
        }

        return {
          success: true,
          data: updatedAgreement,
          message: "Agreement activated",
        };
      }),
  },

  // ========================================
  // REVIEWS SUB-ROUTER
  // ========================================
  reviews: {
    list: protectedProcedure
      .use(requirePermission("reviews.read"))
      .input(reviewQuerySchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;
        const { page, pageSize, ...filters } = input;

        const conditions = [
          eq(
            partnerNetworkSchema.partnerReviews.organizationId,
            filters.organizationId || user?.organizationId || "default"
          ),
        ];

        if (filters.partnerId) {
          conditions.push(
            eq(partnerNetworkSchema.partnerReviews.partnerId, filters.partnerId)
          );
        }
        if (filters.referralId) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerReviews.referralId,
              filters.referralId
            )
          );
        }
        if (filters.reviewerType) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerReviews.reviewerType,
              filters.reviewerType
            )
          );
        }
        if (filters.status) {
          conditions.push(
            eq(partnerNetworkSchema.partnerReviews.status, filters.status)
          );
        }
        if (filters.minRating) {
          conditions.push(
            gte(
              partnerNetworkSchema.partnerReviews.overallRating,
              filters.minRating
            )
          );
        }
        if (filters.isPublic !== undefined) {
          conditions.push(
            eq(partnerNetworkSchema.partnerReviews.isPublic, filters.isPublic)
          );
        }

        const whereClause = and(...conditions);
        const offset = (page - 1) * pageSize;

        const [items, totalResult] = await Promise.all([
          db
            .select()
            .from(partnerNetworkSchema.partnerReviews)
            .where(whereClause)
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(partnerNetworkSchema.partnerReviews.createdAt)),
          db
            .select({ count: count() })
            .from(partnerNetworkSchema.partnerReviews)
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

    getById: protectedProcedure
      .use(requirePermission("reviews.read"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [review] = await db
          .select()
          .from(partnerNetworkSchema.partnerReviews)
          .where(eq(partnerNetworkSchema.partnerReviews.id, input.id))
          .limit(1);

        if (!review) {
          throw new ORPCError("NOT_FOUND", { message: "Review not found" });
        }

        return { success: true, data: review };
      }),

    create: protectedProcedure
      .use(requirePermission("reviews.create"))
      .input(createReviewSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const reviewData = {
          ...input,
          id: nanoid(),
          organizationId: user?.organizationId || "default",
          reviewerUserId: user?.id,
          status: "pending" as const,
        };

        const [newReview] = await db
          .insert(partnerNetworkSchema.partnerReviews)
          .values(reviewData)
          .returning();

        return {
          success: true,
          data: newReview,
          message: "Review submitted successfully",
        };
      }),

    moderate: protectedProcedure
      .use(requirePermission("reviews.update"))
      .input(
        z.object({
          id: z.string(),
          status: z.enum(["approved", "rejected", "hidden"]),
        })
      )
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const [updatedReview] = await db
          .update(partnerNetworkSchema.partnerReviews)
          .set({
            status: input.status,
            moderatedBy: user?.id,
            moderatedDate: new Date(),
          })
          .where(eq(partnerNetworkSchema.partnerReviews.id, input.id))
          .returning();

        if (!updatedReview) {
          throw new ORPCError("NOT_FOUND", { message: "Review not found" });
        }

        return {
          success: true,
          data: updatedReview,
          message: `Review ${input.status}`,
        };
      }),

    addResponse: protectedProcedure
      .use(requirePermission("reviews.update"))
      .input(z.object({ id: z.string(), response: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [updatedReview] = await db
          .update(partnerNetworkSchema.partnerReviews)
          .set({
            partnerResponse: input.response,
            responseDate: new Date(),
          })
          .where(eq(partnerNetworkSchema.partnerReviews.id, input.id))
          .returning();

        if (!updatedReview) {
          throw new ORPCError("NOT_FOUND", { message: "Review not found" });
        }

        return {
          success: true,
          data: updatedReview,
          message: "Response added successfully",
        };
      }),

    delete: protectedProcedure
      .use(requirePermission("reviews.delete"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [existing] = await db
          .select()
          .from(partnerNetworkSchema.partnerReviews)
          .where(eq(partnerNetworkSchema.partnerReviews.id, input.id))
          .limit(1);

        if (!existing) {
          throw new ORPCError("NOT_FOUND", { message: "Review not found" });
        }

        await db
          .delete(partnerNetworkSchema.partnerReviews)
          .where(eq(partnerNetworkSchema.partnerReviews.id, input.id));

        return {
          success: true,
          message: "Review deleted successfully",
        };
      }),
  },

  // ========================================
  // COMMUNICATIONS SUB-ROUTER
  // ========================================
  communications: {
    list: protectedProcedure
      .use(requirePermission("communications.read"))
      .input(communicationQuerySchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;
        const { page, pageSize, ...filters } = input;

        const conditions = [
          eq(
            partnerNetworkSchema.partnerCommunications.organizationId,
            filters.organizationId || user?.organizationId || "default"
          ),
        ];

        if (filters.partnerId) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerCommunications.partnerId,
              filters.partnerId
            )
          );
        }
        if (filters.referralId) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerCommunications.referralId,
              filters.referralId
            )
          );
        }
        if (filters.communicationType) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerCommunications.communicationType,
              filters.communicationType
            )
          );
        }
        if (filters.direction) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerCommunications.direction,
              filters.direction
            )
          );
        }
        if (filters.requiresFollowUp !== undefined) {
          conditions.push(
            eq(
              partnerNetworkSchema.partnerCommunications.requiresFollowUp,
              filters.requiresFollowUp
            )
          );
        }
        if (filters.dateFrom) {
          conditions.push(
            gte(
              partnerNetworkSchema.partnerCommunications.createdAt,
              new Date(filters.dateFrom)
            )
          );
        }
        if (filters.dateTo) {
          conditions.push(
            lte(
              partnerNetworkSchema.partnerCommunications.createdAt,
              new Date(filters.dateTo)
            )
          );
        }

        const whereClause = and(...conditions);
        const offset = (page - 1) * pageSize;

        const [items, totalResult] = await Promise.all([
          db
            .select()
            .from(partnerNetworkSchema.partnerCommunications)
            .where(whereClause)
            .limit(pageSize)
            .offset(offset)
            .orderBy(
              desc(partnerNetworkSchema.partnerCommunications.createdAt)
            ),
          db
            .select({ count: count() })
            .from(partnerNetworkSchema.partnerCommunications)
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

    getById: protectedProcedure
      .use(requirePermission("communications.read"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [communication] = await db
          .select()
          .from(partnerNetworkSchema.partnerCommunications)
          .where(eq(partnerNetworkSchema.partnerCommunications.id, input.id))
          .limit(1);

        if (!communication) {
          throw new ORPCError("NOT_FOUND", {
            message: "Communication not found",
          });
        }

        return { success: true, data: communication };
      }),

    create: protectedProcedure
      .use(requirePermission("communications.create"))
      .input(createCommunicationSchema)
      .handler(async ({ input, context }) => {
        const { db, user } = context;

        const communicationData = {
          ...input,
          id: nanoid(),
          organizationId: user?.organizationId || "default",
          ourContactId: user?.id,
          scheduledAt: input.scheduledAt
            ? new Date(input.scheduledAt)
            : undefined,
          followUpDate: input.followUpDate
            ? new Date(input.followUpDate)
            : undefined,
        };

        const [newCommunication] = await db
          .insert(partnerNetworkSchema.partnerCommunications)
          .values(communicationData)
          .returning();

        return {
          success: true,
          data: newCommunication,
          message: "Communication logged successfully",
        };
      }),

    markFollowUpComplete: protectedProcedure
      .use(requirePermission("communications.update"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [updatedCommunication] = await db
          .update(partnerNetworkSchema.partnerCommunications)
          .set({ followUpCompleted: true })
          .where(eq(partnerNetworkSchema.partnerCommunications.id, input.id))
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

    getPendingFollowUps: protectedProcedure
      .use(requirePermission("communications.read"))
      .input(z.object({ organizationId: z.string().optional() }))
      .handler(async ({ input, context }) => {
        const { db, user } = context;
        const orgId = input.organizationId || user?.organizationId || "default";

        const pendingFollowUps = await db
          .select()
          .from(partnerNetworkSchema.partnerCommunications)
          .where(
            and(
              eq(
                partnerNetworkSchema.partnerCommunications.organizationId,
                orgId
              ),
              eq(
                partnerNetworkSchema.partnerCommunications.requiresFollowUp,
                true
              ),
              eq(
                partnerNetworkSchema.partnerCommunications.followUpCompleted,
                false
              )
            )
          )
          .orderBy(partnerNetworkSchema.partnerCommunications.followUpDate);

        return {
          success: true,
          data: pendingFollowUps,
        };
      }),

    delete: protectedProcedure
      .use(requirePermission("communications.delete"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input, context }) => {
        const { db } = context;

        const [existing] = await db
          .select()
          .from(partnerNetworkSchema.partnerCommunications)
          .where(eq(partnerNetworkSchema.partnerCommunications.id, input.id))
          .limit(1);

        if (!existing) {
          throw new ORPCError("NOT_FOUND", {
            message: "Communication not found",
          });
        }

        await db
          .delete(partnerNetworkSchema.partnerCommunications)
          .where(eq(partnerNetworkSchema.partnerCommunications.id, input.id));

        return {
          success: true,
          message: "Communication deleted successfully",
        };
      }),
  },
};
