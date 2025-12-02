import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

// Enums for client entity types and status (Guyana-specific)
export const entityTypeEnum = pgEnum("entity_type", [
  "INDIVIDUAL",
  "COMPANY",
  "PARTNERSHIP",
  "SOLE_PROPRIETORSHIP",
  "LIMITED_LIABILITY_COMPANY",
  "CORPORATION",
  "TRUST",
  "ESTATE",
  "NON_PROFIT",
  "GOVERNMENT",
]);

export const clientStatusEnum = pgEnum("client_status", [
  "active",
  "inactive",
  "suspended",
  "pending_approval",
  "archived",
]);

export const complianceStatusEnum = pgEnum("compliance_status", [
  "GOOD",
  "WARNING",
  "CRITICAL",
  "PENDING_REVIEW",
  "OVERDUE",
  "EXEMPT",
]);

export const riskLevelEnum = pgEnum("risk_level", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const clients = pgTable(
  "clients",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientNumber: text("client_number").unique().notNull(),

    // Basic entity information
    businessName: text("business_name"), // For COMPANY types
    firstName: text("first_name"), // For INDIVIDUAL types
    lastName: text("last_name"), // For INDIVIDUAL types
    entityType: entityTypeEnum("entity_type").notNull(),

    // Guyana Government Numbers (essential)
    tinNumber: text("tin_number").unique(), // 9 digits, required for tax
    nisNumber: text("nis_number").unique(), // For NIS contributions
    registrationNumber: text("registration_number"), // Company registration
    passportNumber: text("passport_number"), // For individuals

    // Local content qualification (Oil & Gas sector)
    isLocalContentQualified: boolean("is_local_content_qualified").default(
      false
    ),

    // Legacy field for compatibility
    name: text("name").notNull(), // Computed from businessName or firstName+lastName
    email: text("email"),
    phoneNumber: text("phone_number"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country").default("Guyana").notNull(),

    // Status and compliance
    status: clientStatusEnum("status").default("pending_approval").notNull(),
    complianceStatus: complianceStatusEnum("compliance_status")
      .default("PENDING_REVIEW")
      .notNull(),
    riskLevel: riskLevelEnum("risk_level").default("medium").notNull(),

    // Financial information
    estimatedAnnualRevenue: decimal("estimated_annual_revenue", {
      precision: 15,
      scale: 2,
    }),
    employeeCount: integer("employee_count"),

    // Key dates
    incorporationDate: timestamp("incorporation_date"),
    fiscalYearEnd: text("fiscal_year_end"), // Format: MM-DD
    clientSince: timestamp("client_since"),
    lastReviewDate: timestamp("last_review_date"),
    nextReviewDate: timestamp("next_review_date"),

    // Assigned personnel
    assignedAccountant: text("assigned_accountant").references(() => users.id),
    assignedManager: text("assigned_manager").references(() => users.id),
    primaryContact: text("primary_contact"),

    // Additional information
    notes: text("notes"),
    tags: text("tags"), // JSON array of tags
    customFields: text("custom_fields"), // JSON object for additional fields

    // Audit fields
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("clients_organization_id_idx").on(table.organizationId),
    index("clients_client_number_idx").on(table.clientNumber),
    index("clients_entity_type_idx").on(table.entityType),
    index("clients_status_idx").on(table.status),
    index("clients_compliance_status_idx").on(table.complianceStatus),
    index("clients_risk_level_idx").on(table.riskLevel),
    index("clients_assigned_accountant_idx").on(table.assignedAccountant),
    index("clients_assigned_manager_idx").on(table.assignedManager),
    index("clients_created_by_idx").on(table.createdBy),
    index("clients_name_idx").on(table.name),
    index("clients_tin_number_idx").on(table.tinNumber),
    index("clients_nis_number_idx").on(table.nisNumber),
    index("clients_business_name_idx").on(table.businessName),
    index("clients_first_name_idx").on(table.firstName),
    index("clients_last_name_idx").on(table.lastName),
    index("clients_local_content_qualified_idx").on(
      table.isLocalContentQualified
    ),
    // Composite indexes for common query patterns
    index("clients_org_status_idx").on(table.organizationId, table.status),
    index("clients_org_entity_type_idx").on(
      table.organizationId,
      table.entityType
    ),
    index("clients_status_compliance_idx").on(
      table.status,
      table.complianceStatus
    ),
    index("clients_entity_local_content_idx").on(
      table.entityType,
      table.isLocalContentQualified
    ),
  ]
);

export const clientContacts = pgTable(
  "client_contacts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    email: text("email"),
    phoneNumber: text("phone_number"),
    mobileNumber: text("mobile_number"),
    department: text("department"),
    isPrimary: boolean("is_primary").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("client_contacts_organization_id_idx").on(table.organizationId),
    index("client_contacts_client_id_idx").on(table.clientId),
    index("client_contacts_email_idx").on(table.email),
    index("client_contacts_is_primary_idx").on(table.isPrimary),
  ]
);

export const clientServices = pgTable(
  "client_services",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    serviceName: text("service_name").notNull(),
    serviceType: text("service_type").notNull(), // tax_prep, bookkeeping, audit, consulting
    description: text("description"),
    frequency: text("frequency"), // monthly, quarterly, annually, one-time
    feeStructure: text("fee_structure"), // fixed, hourly, percentage
    feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }),
    currency: text("currency").default("BBD").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    isActive: boolean("is_active").default(true).notNull(),
    assignedTo: text("assigned_to").references(() => users.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("client_services_organization_id_idx").on(table.organizationId),
    index("client_services_client_id_idx").on(table.clientId),
    index("client_services_service_type_idx").on(table.serviceType),
    index("client_services_assigned_to_idx").on(table.assignedTo),
    index("client_services_is_active_idx").on(table.isActive),
  ]
);

// Immigration Status enum
export const immigrationStatusTypeEnum = pgEnum("immigration_status_type", [
  "PENDING",
  "IN_PROGRESS",
  "APPROVED",
  "DENIED",
  "EXPIRED",
  "RENEWAL_REQUIRED",
]);

// Visa Type enum
export const visaTypeEnum = pgEnum("visa_type", [
  "H1B",
  "L1",
  "O1",
  "EB1",
  "EB2",
  "EB3",
  "F1",
  "J1",
  "B1",
  "B2",
  "E2",
  "TN",
  "PERM",
  "GREEN_CARD",
  "CITIZENSHIP",
  "OTHER",
]);

// Immigration Status tracking for clients
export const immigrationStatus = pgTable(
  "immigration_status",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    currentStatus: immigrationStatusTypeEnum("current_status")
      .default("PENDING")
      .notNull(),
    visaType: visaTypeEnum("visa_type"),
    applicationDate: timestamp("application_date"),
    expiryDate: timestamp("expiry_date"),
    documents: text("documents"), // JSON array of document references
    notes: text("notes"), // JSON array of notes
    nextAction: text("next_action"),
    nextActionDate: timestamp("next_action_date"),
    assignedOfficer: text("assigned_officer").references(() => users.id),
    caseNumber: text("case_number"),
    priority: text("priority").default("medium"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("immigration_status_organization_id_idx").on(table.organizationId),
    index("immigration_status_client_id_idx").on(table.clientId),
    index("immigration_status_current_status_idx").on(table.currentStatus),
    index("immigration_status_visa_type_idx").on(table.visaType),
    index("immigration_status_expiry_date_idx").on(table.expiryDate),
    index("immigration_status_assigned_officer_idx").on(table.assignedOfficer),
  ]
);

// Relations
export const immigrationStatusRelations = relations(
  immigrationStatus,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [immigrationStatus.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [immigrationStatus.clientId],
      references: [clients.id],
    }),
    assignedOfficerUser: one(users, {
      fields: [immigrationStatus.assignedOfficer],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [immigrationStatus.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [immigrationStatus.updatedBy],
      references: [users.id],
    }),
  })
);

// Immigration Status History tracking
export const immigrationStatusHistory = pgTable(
  "immigration_status_history",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    status: immigrationStatusTypeEnum("status").notNull(),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
    changedBy: text("changed_by").references(() => users.id),
    notes: text("notes"),
  },
  (table) => [
    index("immigration_status_history_client_id_idx").on(table.clientId),
    index("immigration_status_history_changed_at_idx").on(table.changedAt),
  ]
);

export const immigrationStatusHistoryRelations = relations(
  immigrationStatusHistory,
  ({ one }) => ({
    client: one(clients, {
      fields: [immigrationStatusHistory.clientId],
      references: [clients.id],
    }),
    changedByUser: one(users, {
      fields: [immigrationStatusHistory.changedBy],
      references: [users.id],
    }),
  })
);

// Relations
export const clientsRelations = relations(clients, ({ many, one }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  contacts: many(clientContacts),
  services: many(clientServices),
  assignedAccountantUser: one(users, {
    fields: [clients.assignedAccountant],
    references: [users.id],
  }),
  assignedManagerUser: one(users, {
    fields: [clients.assignedManager],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [clients.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [clients.updatedBy],
    references: [users.id],
  }),
}));

export const clientContactsRelations = relations(clientContacts, ({ one }) => ({
  organization: one(organizations, {
    fields: [clientContacts.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [clientContacts.clientId],
    references: [clients.id],
  }),
  createdByUser: one(users, {
    fields: [clientContacts.createdBy],
    references: [users.id],
  }),
}));

export const clientServicesRelations = relations(clientServices, ({ one }) => ({
  organization: one(organizations, {
    fields: [clientServices.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [clientServices.clientId],
    references: [clients.id],
  }),
  assignedToUser: one(users, {
    fields: [clientServices.assignedTo],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [clientServices.createdBy],
    references: [users.id],
  }),
}));
