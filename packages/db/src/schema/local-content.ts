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

// Local content category enum (based on Guyana's Local Content Act)
export const localContentCategoryEnum = pgEnum("local_content_category", [
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
]);

// Compliance status enum
export const lcComplianceStatusEnum = pgEnum("lc_compliance_status", [
  "NOT_STARTED",
  "IN_PROGRESS",
  "UNDER_REVIEW",
  "COMPLIANT",
  "NON_COMPLIANT",
  "EXEMPTION_REQUESTED",
  "EXEMPTION_GRANTED",
  "REMEDIATION_REQUIRED",
]);

// Report period type enum
export const reportPeriodTypeEnum = pgEnum("report_period_type", [
  "QUARTERLY",
  "SEMI_ANNUAL",
  "ANNUAL",
  "PROJECT_BASED",
]);

// Registration type enum
export const lcRegistrationTypeEnum = pgEnum("lc_registration_type", [
  "CONTRACTOR",
  "SUBCONTRACTOR",
  "SERVICE_PROVIDER",
  "SUPPLIER",
  "JOINT_VENTURE",
]);

// Local content registrations
export const localContentRegistrations = pgTable(
  "local_content_registrations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id),

    // Registration details
    registrationNumber: text("registration_number").notNull(),
    registrationType: lcRegistrationTypeEnum("registration_type").notNull(),
    registrationDate: timestamp("registration_date").notNull(),
    expiryDate: timestamp("expiry_date"),
    status: lcComplianceStatusEnum("status").default("IN_PROGRESS").notNull(),

    // Company details
    companyName: text("company_name").notNull(),
    tradingName: text("trading_name"),
    businessRegistrationNumber: text("business_registration_number"),
    tinNumber: text("tin_number"),
    nisNumber: text("nis_number"),

    // Ownership details
    guyaneseOwnershipPercent: decimal("guyanese_ownership_percent", {
      precision: 5,
      scale: 2,
    }),
    ownershipDetails: jsonb("ownership_details"),
    directors: jsonb("directors"),
    shareholders: jsonb("shareholders"),

    // Operations
    industryCategory: text("industry_category"),
    primaryServices: jsonb("primary_services"),
    operatingRegions: jsonb("operating_regions"),
    yearsInOperation: integer("years_in_operation"),

    // Employment
    totalEmployees: integer("total_employees"),
    guyaneseEmployees: integer("guyanese_employees"),
    localEmploymentPercent: decimal("local_employment_percent", {
      precision: 5,
      scale: 2,
    }),

    // Certifications
    localContentCertificateNumber: text("local_content_certificate_number"),
    certificateIssueDate: timestamp("certificate_issue_date"),
    certificateExpiryDate: timestamp("certificate_expiry_date"),
    certificateDocumentUrl: text("certificate_document_url"),

    // Additional documents
    supportingDocuments: jsonb("supporting_documents"),

    // Ministry reference
    ministryReferenceNumber: text("ministry_reference_number"),
    assignedOfficer: text("assigned_officer"),

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
    index("lc_registrations_org_idx").on(table.organizationId),
    index("lc_registrations_client_idx").on(table.clientId),
    index("lc_registrations_number_idx").on(table.registrationNumber),
    index("lc_registrations_type_idx").on(table.registrationType),
    index("lc_registrations_status_idx").on(table.status),
    index("lc_registrations_expiry_idx").on(table.expiryDate),
  ]
);

// Local content compliance plans
export const localContentPlans = pgTable(
  "local_content_plans",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    registrationId: text("registration_id")
      .notNull()
      .references(() => localContentRegistrations.id),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id),

    // Plan identification
    planNumber: text("plan_number").notNull(),
    planTitle: text("plan_title").notNull(),
    status: lcComplianceStatusEnum("status").default("IN_PROGRESS").notNull(),

    // Plan period
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    submissionDeadline: timestamp("submission_deadline"),
    submittedDate: timestamp("submitted_date"),

    // Overall targets
    overallLocalContentTarget: decimal("overall_local_content_target", {
      precision: 5,
      scale: 2,
    }),

    // Category targets (JSON with category-specific percentages)
    goodsTarget: decimal("goods_target", { precision: 5, scale: 2 }),
    servicesTarget: decimal("services_target", { precision: 5, scale: 2 }),
    employmentTarget: decimal("employment_target", { precision: 5, scale: 2 }),
    trainingTarget: decimal("training_target", { precision: 5, scale: 2 }),

    // Budget allocations
    totalBudget: decimal("total_budget", { precision: 15, scale: 2 }),
    localBudgetAllocation: decimal("local_budget_allocation", {
      precision: 15,
      scale: 2,
    }),
    currency: text("currency").default("GYD").notNull(),

    // Detailed plans (JSON structure)
    procurementPlan: jsonb("procurement_plan"),
    employmentPlan: jsonb("employment_plan"),
    trainingPlan: jsonb("training_plan"),
    technologyTransferPlan: jsonb("technology_transfer_plan"),
    successionPlan: jsonb("succession_plan"),

    // Ministry review
    ministryStatus: text("ministry_status"),
    ministryComments: text("ministry_comments"),
    approvedDate: timestamp("approved_date"),
    approvedBy: text("approved_by"),

    // Documents
    planDocumentUrl: text("plan_document_url"),
    supportingDocuments: jsonb("supporting_documents"),

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
    index("lc_plans_org_idx").on(table.organizationId),
    index("lc_plans_registration_idx").on(table.registrationId),
    index("lc_plans_client_idx").on(table.clientId),
    index("lc_plans_number_idx").on(table.planNumber),
    index("lc_plans_status_idx").on(table.status),
    index("lc_plans_period_idx").on(table.periodStart, table.periodEnd),
  ]
);

// Local content compliance reports
export const localContentReports = pgTable(
  "local_content_reports",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    registrationId: text("registration_id")
      .notNull()
      .references(() => localContentRegistrations.id),
    planId: text("plan_id").references(() => localContentPlans.id),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id),

    // Report identification
    reportNumber: text("report_number").notNull(),
    reportTitle: text("report_title").notNull(),
    reportPeriodType: reportPeriodTypeEnum("report_period_type").notNull(),
    status: lcComplianceStatusEnum("status").default("IN_PROGRESS").notNull(),

    // Report period
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    submissionDeadline: timestamp("submission_deadline"),
    submittedDate: timestamp("submitted_date"),

    // Actual performance
    actualLocalContentPercent: decimal("actual_local_content_percent", {
      precision: 5,
      scale: 2,
    }),

    // Category actuals
    goodsActual: decimal("goods_actual", { precision: 5, scale: 2 }),
    servicesActual: decimal("services_actual", { precision: 5, scale: 2 }),
    employmentActual: decimal("employment_actual", { precision: 5, scale: 2 }),
    trainingActual: decimal("training_actual", { precision: 5, scale: 2 }),

    // Expenditure
    totalExpenditure: decimal("total_expenditure", { precision: 15, scale: 2 }),
    localExpenditure: decimal("local_expenditure", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),

    // Detailed reports (JSON structure)
    procurementReport: jsonb("procurement_report"),
    employmentReport: jsonb("employment_report"),
    trainingReport: jsonb("training_report"),
    vendorPayments: jsonb("vendor_payments"),
    employeeDetails: jsonb("employee_details"),

    // Variance analysis
    varianceAnalysis: jsonb("variance_analysis"),
    correctionActions: jsonb("correction_actions"),

    // Ministry review
    ministryStatus: text("ministry_status"),
    ministryComments: text("ministry_comments"),
    reviewedDate: timestamp("reviewed_date"),
    reviewedBy: text("reviewed_by"),
    complianceScore: decimal("compliance_score", { precision: 5, scale: 2 }),

    // Documents
    reportDocumentUrl: text("report_document_url"),
    supportingDocuments: jsonb("supporting_documents"),
    evidenceDocuments: jsonb("evidence_documents"),

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
    index("lc_reports_org_idx").on(table.organizationId),
    index("lc_reports_registration_idx").on(table.registrationId),
    index("lc_reports_plan_idx").on(table.planId),
    index("lc_reports_client_idx").on(table.clientId),
    index("lc_reports_number_idx").on(table.reportNumber),
    index("lc_reports_status_idx").on(table.status),
    index("lc_reports_period_type_idx").on(table.reportPeriodType),
  ]
);

// Local content checklist items (compliance checklist)
export const localContentChecklists = pgTable(
  "local_content_checklists",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    registrationId: text("registration_id")
      .notNull()
      .references(() => localContentRegistrations.id),

    // Checklist details
    category: localContentCategoryEnum("category").notNull(),
    itemCode: text("item_code").notNull(),
    itemDescription: text("item_description").notNull(),
    requirement: text("requirement"),
    legalReference: text("legal_reference"),

    // Target
    targetValue: decimal("target_value", { precision: 15, scale: 2 }),
    targetPercent: decimal("target_percent", { precision: 5, scale: 2 }),
    targetUnit: text("target_unit"),

    // Actual
    actualValue: decimal("actual_value", { precision: 15, scale: 2 }),
    actualPercent: decimal("actual_percent", { precision: 5, scale: 2 }),

    // Compliance
    isCompliant: boolean("is_compliant"),
    complianceNotes: text("compliance_notes"),

    // Evidence
    evidenceProvided: boolean("evidence_provided").default(false),
    evidenceDocuments: jsonb("evidence_documents"),

    // Due date
    dueDate: timestamp("due_date"),
    completedDate: timestamp("completed_date"),

    // Priority
    priority: text("priority").default("medium"),
    isMandatory: boolean("is_mandatory").default(true),

    // Notes
    notes: text("notes"),
    metadata: jsonb("metadata"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("lc_checklists_org_idx").on(table.organizationId),
    index("lc_checklists_registration_idx").on(table.registrationId),
    index("lc_checklists_category_idx").on(table.category),
    index("lc_checklists_compliant_idx").on(table.isCompliant),
    index("lc_checklists_due_date_idx").on(table.dueDate),
  ]
);

// Partner/vendor registry for local content tracking
export const localContentVendors = pgTable(
  "local_content_vendors",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Vendor details
    vendorCode: text("vendor_code").notNull(),
    vendorName: text("vendor_name").notNull(),
    tradingName: text("trading_name"),
    vendorType: text("vendor_type").notNull(),

    // Registration details
    businessRegistrationNumber: text("business_registration_number"),
    tinNumber: text("tin_number"),
    localContentCertificateNumber: text("local_content_certificate_number"),
    certificateExpiryDate: timestamp("certificate_expiry_date"),

    // Guyanese ownership
    isGuyaneseOwned: boolean("is_guyanese_owned").default(false),
    guyaneseOwnershipPercent: decimal("guyanese_ownership_percent", {
      precision: 5,
      scale: 2,
    }),
    ownershipEvidence: jsonb("ownership_evidence"),

    // Contact
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    region: text("region"),

    // Services/products
    productsServices: jsonb("products_services"),
    industries: jsonb("industries"),

    // Capacity
    employeeCount: integer("employee_count"),
    guyaneseEmployeeCount: integer("guyanese_employee_count"),
    annualCapacity: text("annual_capacity"),

    // Verification
    isVerified: boolean("is_verified").default(false),
    verifiedDate: timestamp("verified_date"),
    verifiedBy: text("verified_by"),
    verificationNotes: text("verification_notes"),

    // Status
    isActive: boolean("is_active").default(true).notNull(),
    isApproved: boolean("is_approved").default(false),

    // Documents
    supportingDocuments: jsonb("supporting_documents"),

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
    index("lc_vendors_org_idx").on(table.organizationId),
    index("lc_vendors_code_idx").on(table.vendorCode),
    index("lc_vendors_name_idx").on(table.vendorName),
    index("lc_vendors_guyanese_idx").on(table.isGuyaneseOwned),
    index("lc_vendors_verified_idx").on(table.isVerified),
    index("lc_vendors_active_idx").on(table.isActive),
  ]
);

// Relations
export const localContentRegistrationsRelations = relations(
  localContentRegistrations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [localContentRegistrations.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [localContentRegistrations.clientId],
      references: [clients.id],
    }),
    plans: many(localContentPlans),
    reports: many(localContentReports),
    checklists: many(localContentChecklists),
  })
);

export const localContentPlansRelations = relations(
  localContentPlans,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [localContentPlans.organizationId],
      references: [organizations.id],
    }),
    registration: one(localContentRegistrations, {
      fields: [localContentPlans.registrationId],
      references: [localContentRegistrations.id],
    }),
    client: one(clients, {
      fields: [localContentPlans.clientId],
      references: [clients.id],
    }),
    reports: many(localContentReports),
  })
);

export const localContentReportsRelations = relations(
  localContentReports,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [localContentReports.organizationId],
      references: [organizations.id],
    }),
    registration: one(localContentRegistrations, {
      fields: [localContentReports.registrationId],
      references: [localContentRegistrations.id],
    }),
    plan: one(localContentPlans, {
      fields: [localContentReports.planId],
      references: [localContentPlans.id],
    }),
    client: one(clients, {
      fields: [localContentReports.clientId],
      references: [clients.id],
    }),
  })
);

export const localContentChecklistsRelations = relations(
  localContentChecklists,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [localContentChecklists.organizationId],
      references: [organizations.id],
    }),
    registration: one(localContentRegistrations, {
      fields: [localContentChecklists.registrationId],
      references: [localContentRegistrations.id],
    }),
  })
);

export const localContentVendorsRelations = relations(
  localContentVendors,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [localContentVendors.organizationId],
      references: [organizations.id],
    }),
  })
);
