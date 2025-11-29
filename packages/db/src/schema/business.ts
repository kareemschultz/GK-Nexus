import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Enums
export const roleEnum = pgEnum("role", [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "STAFF",
  "CLIENT",
  "DEPARTMENT_HEAD",
  "ANALYST",
  "VIEWER",
]);

export const entityTypeEnum = pgEnum("entity_type", [
  "INDIVIDUAL",
  "COMPANY",
  "PARTNERSHIP",
  "SOLE_TRADER",
  "TRUST",
  "NON_PROFIT",
]);

export const complianceStatusEnum = pgEnum("compliance_status", [
  "GOOD",
  "WARNING",
  "EXPIRED",
  "PENDING",
]);

export const documentTypeEnum = pgEnum("document_type", [
  "IDENTIFICATION",
  "TAX_COMPLIANCE",
  "NIS_COMPLIANCE",
  "BUSINESS_REGISTRATION",
  "FINANCIAL_STATEMENT",
  "LEGAL_DOCUMENT",
  "IMMIGRATION",
  "OTHER",
]);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const taxTypeEnum = pgEnum("tax_type", [
  "VAT",
  "PAYE",
  "NIS",
  "CORPORATE_TAX",
  "WITHHOLDING_TAX",
]);

// Enhanced User Profile
export const userProfile = pgTable(
  "user_profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull().default("CLIENT"),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    department: varchar("department", { length: 100 }),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    invitedBy: text("invited_by").references(() => user.id),
    inviteToken: varchar("invite_token", { length: 255 }),
    inviteExpiresAt: timestamp("invite_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_profile_role_idx").on(table.role),
    index("user_profile_department_idx").on(table.department),
  ]
);

// Clients
export const client = pgTable(
  "client",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    entityType: entityTypeEnum("entity_type").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    phone: varchar("phone", { length: 20 }),
    address: text("address"),
    tinNumber: varchar("tin_number", { length: 20 }),
    nisNumber: varchar("nis_number", { length: 20 }),
    vatNumber: varchar("vat_number", { length: 20 }),
    businessRegistrationNumber: varchar("business_registration_number", {
      length: 50,
    }),
    isLocalContentQualified: boolean("is_local_content_qualified").default(
      false
    ),
    complianceStatus: complianceStatusEnum("compliance_status").default("GOOD"),
    complianceScore: integer("compliance_score").default(100),
    assignedStaffId: text("assigned_staff_id").references(() => user.id),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("client_entity_type_idx").on(table.entityType),
    index("client_compliance_status_idx").on(table.complianceStatus),
    index("client_assigned_staff_idx").on(table.assignedStaffId),
    index("client_tin_idx").on(table.tinNumber),
    index("client_email_idx").on(table.email),
  ]
);

// Documents
export const document = pgTable(
  "document",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    type: documentTypeEnum("type").notNull(),
    description: text("description"),
    fileName: varchar("file_name", { length: 255 }),
    filePath: text("file_path"),
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 100 }),
    referenceNumber: varchar("reference_number", { length: 100 }),
    issueDate: timestamp("issue_date"),
    expiryDate: timestamp("expiry_date"),
    isRequired: boolean("is_required").default(false),
    isVerified: boolean("is_verified").default(false),
    verifiedBy: text("verified_by").references(() => user.id),
    verifiedAt: timestamp("verified_at"),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("document_client_idx").on(table.clientId),
    index("document_type_idx").on(table.type),
    index("document_expiry_idx").on(table.expiryDate),
    index("document_reference_idx").on(table.referenceNumber),
  ]
);

// Appointments
export const appointment = pgTable(
  "appointment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    staffId: text("staff_id")
      .notNull()
      .references(() => user.id),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    scheduledDate: timestamp("scheduled_date").notNull(),
    duration: integer("duration").default(60), // minutes
    location: varchar("location", { length: 255 }),
    meetingLink: text("meeting_link"),
    status: appointmentStatusEnum("status").default("SCHEDULED"),
    notes: text("notes"),
    reminderSent: boolean("reminder_sent").default(false),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("appointment_client_idx").on(table.clientId),
    index("appointment_staff_idx").on(table.staffId),
    index("appointment_date_idx").on(table.scheduledDate),
    index("appointment_status_idx").on(table.status),
  ]
);

// Tax Calculations
export const taxCalculation = pgTable(
  "tax_calculation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    taxType: taxTypeEnum("tax_type").notNull(),
    calculationPeriod: varchar("calculation_period", { length: 50 }), // e.g., "2024-Q1", "2024-01"
    grossAmount: numeric("gross_amount", { precision: 15, scale: 2 }),
    taxableAmount: numeric("taxable_amount", { precision: 15, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 }), // 0.14 for 14%
    taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }),
    netAmount: numeric("net_amount", { precision: 15, scale: 2 }),
    deductions: numeric("deductions", { precision: 15, scale: 2 }).default("0"),
    allowances: numeric("allowances", { precision: 15, scale: 2 }).default("0"),
    metadata: text("metadata"), // JSON for additional calculation details
    calculatedBy: text("calculated_by")
      .notNull()
      .references(() => user.id),
    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
    isSubmitted: boolean("is_submitted").default(false),
    submittedAt: timestamp("submitted_at"),
    submittedBy: text("submitted_by").references(() => user.id),
  },
  (table) => [
    index("tax_calculation_client_idx").on(table.clientId),
    index("tax_calculation_type_idx").on(table.taxType),
    index("tax_calculation_period_idx").on(table.calculationPeriod),
    index("tax_calculation_submitted_idx").on(table.isSubmitted),
  ]
);

// Compliance Tracking
export const complianceItem = pgTable(
  "compliance_item",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }), // e.g., "GRA", "NIS", "Business Registration"
    dueDate: timestamp("due_date"),
    renewalDate: timestamp("renewal_date"),
    status: complianceStatusEnum("status").default("PENDING"),
    isRecurring: boolean("is_recurring").default(false),
    recurringInterval: varchar("recurring_interval", { length: 50 }), // "monthly", "quarterly", "annually"
    lastUpdatedBy: text("last_updated_by").references(() => user.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("compliance_item_client_idx").on(table.clientId),
    index("compliance_item_category_idx").on(table.category),
    index("compliance_item_due_date_idx").on(table.dueDate),
    index("compliance_item_status_idx").on(table.status),
  ]
);

// Audit Logs
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id),
    action: varchar("action", { length: 100 }).notNull(), // "CREATE", "UPDATE", "DELETE", "LOGIN", etc.
    targetEntity: varchar("target_entity", { length: 100 }).notNull(), // "client", "document", "appointment"
    targetId: varchar("target_id", { length: 255 }), // ID of the affected entity
    oldValues: text("old_values"), // JSON of previous values
    newValues: text("new_values"), // JSON of new values
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => [
    index("audit_log_actor_idx").on(table.actorId),
    index("audit_log_action_idx").on(table.action),
    index("audit_log_target_idx").on(table.targetEntity, table.targetId),
    index("audit_log_timestamp_idx").on(table.timestamp),
  ]
);

// Services Offered
export const service = pgTable(
  "service",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    category: varchar("category", { length: 100 }), // "TAX", "LEGAL", "IMMIGRATION", "TRAINING"
    price: numeric("price", { precision: 10, scale: 2 }),
    duration: integer("duration"), // in minutes
    isActive: boolean("is_active").default(true),
    requiresDocuments: boolean("requires_documents").default(false),
    requiredDocumentTypes: text("required_document_types"), // JSON array of document types
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("service_category_idx").on(table.category),
    index("service_active_idx").on(table.isActive),
  ]
);

// Client Services (many-to-many relationship)
export const clientService = pgTable(
  "client_service",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => service.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    status: varchar("status", { length: 50 }).default("ACTIVE"), // "ACTIVE", "COMPLETED", "CANCELLED"
    assignedStaffId: text("assigned_staff_id").references(() => user.id),
    notes: text("notes"),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("client_service_client_idx").on(table.clientId),
    index("client_service_service_idx").on(table.serviceId),
    index("client_service_staff_idx").on(table.assignedStaffId),
    index("client_service_status_idx").on(table.status),
  ]
);

// Relations
export const userProfileRelations = relations(userProfile, ({ one, many }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
  invitedByUser: one(user, {
    fields: [userProfile.invitedBy],
    references: [user.id],
  }),
  assignedClients: many(client),
  createdClients: many(client),
  appointments: many(appointment),
  taxCalculations: many(taxCalculation),
  auditLogs: many(auditLog),
}));

export const clientRelations = relations(client, ({ one, many }) => ({
  assignedStaff: one(user, {
    fields: [client.assignedStaffId],
    references: [user.id],
  }),
  createdBy: one(user, {
    fields: [client.createdBy],
    references: [user.id],
  }),
  documents: many(document),
  appointments: many(appointment),
  taxCalculations: many(taxCalculation),
  complianceItems: many(complianceItem),
  clientServices: many(clientService),
}));

export const documentRelations = relations(document, ({ one }) => ({
  client: one(client, {
    fields: [document.clientId],
    references: [client.id],
  }),
  uploadedBy: one(user, {
    fields: [document.uploadedBy],
    references: [user.id],
  }),
  verifiedBy: one(user, {
    fields: [document.verifiedBy],
    references: [user.id],
  }),
}));

export const appointmentRelations = relations(appointment, ({ one }) => ({
  client: one(client, {
    fields: [appointment.clientId],
    references: [client.id],
  }),
  staff: one(user, {
    fields: [appointment.staffId],
    references: [user.id],
  }),
  createdBy: one(user, {
    fields: [appointment.createdBy],
    references: [user.id],
  }),
}));

export const taxCalculationRelations = relations(taxCalculation, ({ one }) => ({
  client: one(client, {
    fields: [taxCalculation.clientId],
    references: [client.id],
  }),
  calculatedBy: one(user, {
    fields: [taxCalculation.calculatedBy],
    references: [user.id],
  }),
  submittedBy: one(user, {
    fields: [taxCalculation.submittedBy],
    references: [user.id],
  }),
}));

export const complianceItemRelations = relations(complianceItem, ({ one }) => ({
  client: one(client, {
    fields: [complianceItem.clientId],
    references: [client.id],
  }),
  lastUpdatedBy: one(user, {
    fields: [complianceItem.lastUpdatedBy],
    references: [user.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(user, {
    fields: [auditLog.actorId],
    references: [user.id],
  }),
}));

export const serviceRelations = relations(service, ({ many }) => ({
  clientServices: many(clientService),
}));

export const clientServiceRelations = relations(clientService, ({ one }) => ({
  client: one(client, {
    fields: [clientService.clientId],
    references: [client.id],
  }),
  service: one(service, {
    fields: [clientService.serviceId],
    references: [service.id],
  }),
  assignedStaff: one(user, {
    fields: [clientService.assignedStaffId],
    references: [user.id],
  }),
  createdBy: one(user, {
    fields: [clientService.createdBy],
    references: [user.id],
  }),
}));
