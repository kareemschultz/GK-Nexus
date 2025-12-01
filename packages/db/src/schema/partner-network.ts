import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { organizations } from "./organizations";
import { users } from "./users";

// Partner type enum
export const partnerTypeEnum = pgEnum("partner_type", [
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
]);

// Partner status enum
export const partnerStatusEnum = pgEnum("partner_status", [
  "PROSPECT",
  "PENDING_VERIFICATION",
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "TERMINATED",
]);

// Referral status enum
export const referralStatusEnum = pgEnum("referral_status", [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
]);

// Partnership tier enum
export const partnershipTierEnum = pgEnum("partnership_tier", [
  "BASIC",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "STRATEGIC",
]);

// Partners directory
export const partners = pgTable(
  "partners",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Partner identification
    partnerCode: text("partner_code").notNull(),
    partnerType: partnerTypeEnum("partner_type").notNull(),
    status: partnerStatusEnum("status").default("PROSPECT").notNull(),
    tier: partnershipTierEnum("tier").default("BASIC").notNull(),

    // Company details
    companyName: text("company_name").notNull(),
    tradingName: text("trading_name"),
    businessRegistrationNumber: text("business_registration_number"),
    tinNumber: text("tin_number"),
    yearEstablished: integer("year_established"),

    // Primary contact
    primaryContactName: text("primary_contact_name").notNull(),
    primaryContactTitle: text("primary_contact_title"),
    primaryContactEmail: text("primary_contact_email").notNull(),
    primaryContactPhone: text("primary_contact_phone"),

    // Additional contacts
    additionalContacts: jsonb("additional_contacts"),

    // Address
    addressLine1: text("address_line_1"),
    addressLine2: text("address_line_2"),
    city: text("city"),
    region: text("region"),
    country: text("country").default("Guyana"),
    postalCode: text("postal_code"),

    // Communication
    generalEmail: text("general_email"),
    generalPhone: text("general_phone"),
    fax: text("fax"),
    website: text("website"),

    // Social media
    linkedIn: text("linkedin"),
    facebook: text("facebook"),
    instagram: text("instagram"),

    // Services offered
    servicesOffered: jsonb("services_offered"),
    specializations: jsonb("specializations"),
    industriesServed: jsonb("industries_served"),
    geographicCoverage: jsonb("geographic_coverage"),

    // Credentials
    licenses: jsonb("licenses"),
    certifications: jsonb("certifications"),
    professionalBodies: jsonb("professional_bodies"),
    insuranceCoverage: jsonb("insurance_coverage"),

    // Partnership details
    partnerSince: timestamp("partner_since"),
    agreementDate: timestamp("agreement_date"),
    agreementExpiryDate: timestamp("agreement_expiry_date"),
    agreementDocumentUrl: text("agreement_document_url"),

    // Referral settings
    referralCommissionPercent: decimal("referral_commission_percent", {
      precision: 5,
      scale: 2,
    }),
    acceptsReferrals: boolean("accepts_referrals").default(true),
    referralCategories: jsonb("referral_categories"),

    // Performance
    totalReferralsSent: integer("total_referrals_sent").default(0),
    totalReferralsReceived: integer("total_referrals_received").default(0),
    totalReferralValue: decimal("total_referral_value", {
      precision: 15,
      scale: 2,
    }).default("0"),
    averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
    totalReviews: integer("total_reviews").default(0),

    // Verification
    isVerified: boolean("is_verified").default(false),
    verifiedDate: timestamp("verified_date"),
    verifiedBy: text("verified_by"),

    // Display
    logoUrl: text("logo_url"),
    description: text("description"),
    tagline: text("tagline"),
    isFeatured: boolean("is_featured").default(false),
    displayOrder: integer("display_order").default(0),

    // Notes
    internalNotes: text("internal_notes"),
    metadata: jsonb("metadata"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("partners_org_idx").on(table.organizationId),
    index("partners_code_idx").on(table.partnerCode),
    index("partners_type_idx").on(table.partnerType),
    index("partners_status_idx").on(table.status),
    index("partners_tier_idx").on(table.tier),
    index("partners_name_idx").on(table.companyName),
    index("partners_verified_idx").on(table.isVerified),
    index("partners_featured_idx").on(table.isFeatured),
  ]
);

// Partner referrals
export const partnerReferrals = pgTable(
  "partner_referrals",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Referral identification
    referralNumber: text("referral_number").notNull(),
    status: referralStatusEnum("status").default("PENDING").notNull(),

    // Direction
    referringPartnerId: text("referring_partner_id")
      .notNull()
      .references(() => partners.id),
    receivingPartnerId: text("receiving_partner_id")
      .notNull()
      .references(() => partners.id),

    // Client (if applicable)
    clientId: text("client_id").references(() => clients.id),
    clientName: text("client_name"),
    clientContact: text("client_contact"),

    // Referral details
    serviceCategory: text("service_category").notNull(),
    serviceDescription: text("service_description"),
    requirements: text("requirements"),
    urgency: text("urgency").default("normal"),
    deadline: timestamp("deadline"),

    // Value
    estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
    actualValue: decimal("actual_value", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),

    // Commission
    commissionPercent: decimal("commission_percent", {
      precision: 5,
      scale: 2,
    }),
    commissionAmount: decimal("commission_amount", { precision: 15, scale: 2 }),
    commissionPaid: boolean("commission_paid").default(false),
    commissionPaidDate: timestamp("commission_paid_date"),

    // Timeline
    referralDate: timestamp("referral_date").defaultNow().notNull(),
    acceptedDate: timestamp("accepted_date"),
    completedDate: timestamp("completed_date"),

    // Outcome
    outcome: text("outcome"),
    successfulConversion: boolean("successful_conversion"),

    // Feedback
    referrerFeedback: text("referrer_feedback"),
    referrerRating: integer("referrer_rating"),
    receiverFeedback: text("receiver_feedback"),
    receiverRating: integer("receiver_rating"),
    clientFeedback: text("client_feedback"),
    clientRating: integer("client_rating"),

    // Communication
    communicationLog: jsonb("communication_log"),

    // Documents
    documents: jsonb("documents"),

    // Notes
    notes: text("notes"),
    internalNotes: text("internal_notes"),
    metadata: jsonb("metadata"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("partner_referrals_org_idx").on(table.organizationId),
    index("partner_referrals_number_idx").on(table.referralNumber),
    index("partner_referrals_status_idx").on(table.status),
    index("partner_referrals_referring_idx").on(table.referringPartnerId),
    index("partner_referrals_receiving_idx").on(table.receivingPartnerId),
    index("partner_referrals_client_idx").on(table.clientId),
    index("partner_referrals_date_idx").on(table.referralDate),
  ]
);

// Partner agreements/MOUs
export const partnerAgreements = pgTable(
  "partner_agreements",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id),

    // Agreement details
    agreementNumber: text("agreement_number").notNull(),
    agreementType: text("agreement_type").notNull(), // partnership, referral, joint_venture, mou
    title: text("title").notNull(),
    description: text("description"),

    // Dates
    effectiveDate: timestamp("effective_date").notNull(),
    expiryDate: timestamp("expiry_date"),
    renewalDate: timestamp("renewal_date"),
    autoRenewal: boolean("auto_renewal").default(false),

    // Status
    status: text("status").default("draft"), // draft, pending_signature, active, expired, terminated

    // Terms
    termsAndConditions: text("terms_and_conditions"),
    commissionTerms: text("commission_terms"),
    exclusivityTerms: text("exclusivity_terms"),
    terminationTerms: text("termination_terms"),
    confidentialityTerms: text("confidentiality_terms"),

    // Signatories
    ourSignatory: text("our_signatory"),
    ourSignatureDate: timestamp("our_signature_date"),
    partnerSignatory: text("partner_signatory"),
    partnerSignatureDate: timestamp("partner_signature_date"),

    // Documents
    documentUrl: text("document_url"),
    signedDocumentUrl: text("signed_document_url"),
    attachments: jsonb("attachments"),

    // Review
    lastReviewDate: timestamp("last_review_date"),
    nextReviewDate: timestamp("next_review_date"),
    reviewNotes: text("review_notes"),

    // Notes
    notes: text("notes"),
    metadata: jsonb("metadata"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("partner_agreements_org_idx").on(table.organizationId),
    index("partner_agreements_partner_idx").on(table.partnerId),
    index("partner_agreements_number_idx").on(table.agreementNumber),
    index("partner_agreements_type_idx").on(table.agreementType),
    index("partner_agreements_status_idx").on(table.status),
    index("partner_agreements_expiry_idx").on(table.expiryDate),
  ]
);

// Partner reviews and ratings
export const partnerReviews = pgTable(
  "partner_reviews",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id),
    referralId: text("referral_id").references(() => partnerReferrals.id),

    // Reviewer
    reviewerType: text("reviewer_type").notNull(), // internal, partner, client
    reviewerName: text("reviewer_name"),
    reviewerUserId: text("reviewer_user_id").references(() => users.id),
    reviewerClientId: text("reviewer_client_id").references(() => clients.id),

    // Rating
    overallRating: integer("overall_rating").notNull(),
    serviceQualityRating: integer("service_quality_rating"),
    communicationRating: integer("communication_rating"),
    timelinessRating: integer("timelines_rating"),
    valueRating: integer("value_rating"),

    // Review content
    title: text("title"),
    review: text("review"),
    pros: text("pros"),
    cons: text("cons"),

    // Visibility
    isPublic: boolean("is_public").default(true),
    isVerified: boolean("is_verified").default(false),

    // Response
    partnerResponse: text("partner_response"),
    responseDate: timestamp("response_date"),

    // Status
    status: text("status").default("pending"), // pending, approved, rejected, hidden
    moderatedBy: text("moderated_by"),
    moderatedDate: timestamp("moderated_date"),

    // Notes
    metadata: jsonb("metadata"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("partner_reviews_org_idx").on(table.organizationId),
    index("partner_reviews_partner_idx").on(table.partnerId),
    index("partner_reviews_referral_idx").on(table.referralId),
    index("partner_reviews_rating_idx").on(table.overallRating),
    index("partner_reviews_status_idx").on(table.status),
    index("partner_reviews_public_idx").on(table.isPublic),
  ]
);

// Partner communication log
export const partnerCommunications = pgTable(
  "partner_communications",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id),
    referralId: text("referral_id").references(() => partnerReferrals.id),

    // Communication details
    communicationType: text("communication_type").notNull(), // email, phone, meeting, portal
    direction: text("direction").notNull(), // inbound, outbound
    subject: text("subject"),
    content: text("content"),

    // Participants
    ourContactId: text("our_contact_id").references(() => users.id),
    partnerContactName: text("partner_contact_name"),
    partnerContactEmail: text("partner_contact_email"),

    // Scheduling (for meetings)
    scheduledAt: timestamp("scheduled_at"),
    duration: integer("duration"),
    meetingLocation: text("meeting_location"),

    // Follow-up
    requiresFollowUp: boolean("requires_follow_up").default(false),
    followUpDate: timestamp("follow_up_date"),
    followUpCompleted: boolean("follow_up_completed").default(false),

    // Attachments
    attachments: jsonb("attachments"),

    // Notes
    metadata: jsonb("metadata"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("partner_comms_org_idx").on(table.organizationId),
    index("partner_comms_partner_idx").on(table.partnerId),
    index("partner_comms_referral_idx").on(table.referralId),
    index("partner_comms_type_idx").on(table.communicationType),
    index("partner_comms_date_idx").on(table.createdAt),
    index("partner_comms_followup_idx").on(table.requiresFollowUp),
  ]
);

// Relations
export const partnersRelations = relations(partners, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [partners.organizationId],
    references: [organizations.id],
  }),
  sentReferrals: many(partnerReferrals, { relationName: "referringSent" }),
  receivedReferrals: many(partnerReferrals, {
    relationName: "referralsReceived",
  }),
  agreements: many(partnerAgreements),
  reviews: many(partnerReviews),
  communications: many(partnerCommunications),
}));

export const partnerReferralsRelations = relations(
  partnerReferrals,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [partnerReferrals.organizationId],
      references: [organizations.id],
    }),
    referringPartner: one(partners, {
      fields: [partnerReferrals.referringPartnerId],
      references: [partners.id],
      relationName: "referringSent",
    }),
    receivingPartner: one(partners, {
      fields: [partnerReferrals.receivingPartnerId],
      references: [partners.id],
      relationName: "referralsReceived",
    }),
    client: one(clients, {
      fields: [partnerReferrals.clientId],
      references: [clients.id],
    }),
  })
);

export const partnerAgreementsRelations = relations(
  partnerAgreements,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [partnerAgreements.organizationId],
      references: [organizations.id],
    }),
    partner: one(partners, {
      fields: [partnerAgreements.partnerId],
      references: [partners.id],
    }),
  })
);

export const partnerReviewsRelations = relations(partnerReviews, ({ one }) => ({
  organization: one(organizations, {
    fields: [partnerReviews.organizationId],
    references: [organizations.id],
  }),
  partner: one(partners, {
    fields: [partnerReviews.partnerId],
    references: [partners.id],
  }),
  referral: one(partnerReferrals, {
    fields: [partnerReviews.referralId],
    references: [partnerReferrals.id],
  }),
}));

export const partnerCommunicationsRelations = relations(
  partnerCommunications,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [partnerCommunications.organizationId],
      references: [organizations.id],
    }),
    partner: one(partners, {
      fields: [partnerCommunications.partnerId],
      references: [partners.id],
    }),
    referral: one(partnerReferrals, {
      fields: [partnerCommunications.referralId],
      references: [partnerReferrals.id],
    }),
    ourContact: one(users, {
      fields: [partnerCommunications.ourContactId],
      references: [users.id],
    }),
  })
);
