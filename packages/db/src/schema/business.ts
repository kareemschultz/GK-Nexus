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

// Enums - Using unique names to avoid conflicts with other schema files
export const businessRoleEnum = pgEnum("business_role", [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "STAFF",
  "CLIENT",
  "DEPARTMENT_HEAD",
  "ANALYST",
  "VIEWER",
]);

export const businessEntityTypeEnum = pgEnum("business_entity_type", [
  "INDIVIDUAL",
  "COMPANY",
  "PARTNERSHIP",
  "SOLE_TRADER",
  "TRUST",
  "NON_PROFIT",
]);

export const businessComplianceStatusEnum = pgEnum(
  "business_compliance_status",
  ["GOOD", "WARNING", "EXPIRED", "PENDING"]
);

export const complianceAlertTypeEnum = pgEnum("compliance_alert_type", [
  "TAX_DEADLINE",
  "LICENSE_RENEWAL",
  "DOCUMENT_EXPIRY",
  "REGULATORY_CHANGE",
  "FILING_REMINDER",
  "COMPLIANCE_REVIEW",
  "OTHER",
]);

export const complianceAlertSeverityEnum = pgEnum("compliance_alert_severity", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
]);

export const complianceAlertStatusEnum = pgEnum("compliance_alert_status", [
  "ACTIVE",
  "ACKNOWLEDGED",
  "RESOLVED",
  "DISMISSED",
]);

export const businessDocumentTypeEnum = pgEnum("business_document_type", [
  "IDENTIFICATION",
  "TAX_COMPLIANCE",
  "NIS_COMPLIANCE",
  "BUSINESS_REGISTRATION",
  "FINANCIAL_STATEMENT",
  "LEGAL_DOCUMENT",
  "IMMIGRATION",
  "OTHER",
]);

export const businessAppointmentStatusEnum = pgEnum(
  "business_appointment_status",
  ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]
);

export const businessTaxTypeEnum = pgEnum("business_tax_type", [
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
    role: businessRoleEnum("role").notNull().default("CLIENT"),
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

// Client Status Enum - using lowercase to match clients.ts
export const clientStatusEnum = pgEnum("client_status", [
  "active",
  "inactive",
  "suspended",
  "pending_approval",
  "archived",
]);

// Clients
export const client = pgTable(
  "client",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    entityType: businessEntityTypeEnum("entity_type").notNull(),
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
    status: clientStatusEnum("status").default("active").notNull(),
    complianceStatus:
      businessComplianceStatusEnum("compliance_status").default("GOOD"),
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
    index("client_status_idx").on(table.status),
    index("client_compliance_status_idx").on(table.complianceStatus),
    index("client_assigned_staff_idx").on(table.assignedStaffId),
    index("client_tin_idx").on(table.tinNumber),
    index("client_email_idx").on(table.email),
  ]
);

// Business Document Status Enum (separate from documents.ts)
export const businessDocStatusEnum = pgEnum("business_doc_status", [
  "active",
  "archived",
  "deleted",
  "pending",
]);

// Documents
export const document = pgTable(
  "document",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id"), // Reference to document folder
    name: varchar("name", { length: 255 }).notNull(),
    type: businessDocumentTypeEnum("type").notNull(),
    description: text("description"),
    fileName: varchar("file_name", { length: 255 }),
    filePath: text("file_path"),
    fileUrl: text("file_url"), // Public URL for the document
    fileSize: integer("file_size"),
    mimeType: varchar("mime_type", { length: 100 }),
    referenceNumber: varchar("reference_number", { length: 100 }),
    status: businessDocStatusEnum("status").default("active").notNull(),
    isConfidential: boolean("is_confidential").default(false),
    issueDate: timestamp("issue_date"),
    expiryDate: timestamp("expiry_date"),
    isRequired: boolean("is_required").default(false),
    isVerified: boolean("is_verified").default(false),
    verifiedBy: text("verified_by").references(() => user.id),
    verifiedAt: timestamp("verified_at"),
    uploadedBy: text("uploaded_by")
      .notNull()
      .references(() => user.id),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("document_client_idx").on(table.clientId),
    index("document_folder_idx").on(table.folderId),
    index("document_type_idx").on(table.type),
    index("document_status_idx").on(table.status),
    index("document_confidential_idx").on(table.isConfidential),
    index("document_expiry_idx").on(table.expiryDate),
    index("document_reference_idx").on(table.referenceNumber),
    index("document_uploaded_at_idx").on(table.uploadedAt),
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
    status: businessAppointmentStatusEnum("status").default("SCHEDULED"),
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
    taxType: businessTaxTypeEnum("tax_type"),
    calculationType: varchar("calculation_type", { length: 50 }), // PAYE, NIS, VAT, PAYROLL, QUARTERLY
    calculationPeriod: varchar("calculation_period", { length: 50 }), // e.g., "2024-Q1", "2024-01"
    period: varchar("period", { length: 50 }), // Alias for calculationPeriod used by router
    grossAmount: numeric("gross_amount", { precision: 15, scale: 2 }),
    taxableAmount: numeric("taxable_amount", { precision: 15, scale: 2 }),
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 }), // 0.14 for 14%
    taxAmount: numeric("tax_amount", { precision: 15, scale: 2 }),
    netAmount: numeric("net_amount", { precision: 15, scale: 2 }),
    deductions: numeric("deductions", { precision: 15, scale: 2 }).default("0"),
    allowances: numeric("allowances", { precision: 15, scale: 2 }).default("0"),
    metadata: text("metadata"), // JSON for additional calculation details
    inputData: text("input_data"), // JSON input for calculation
    resultData: text("result_data"), // JSON result from calculation
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
    index("tax_calculation_calc_type_idx").on(table.calculationType),
    index("tax_calculation_period_idx").on(table.calculationPeriod),
    index("tax_calculation_period2_idx").on(table.period),
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
    status: businessComplianceStatusEnum("status").default("PENDING"),
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

// Compliance Alerts
export const complianceAlert = pgTable(
  "compliance_alert",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id").references(() => client.id, {
      onDelete: "cascade",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    type: complianceAlertTypeEnum("type").notNull(),
    severity: complianceAlertSeverityEnum("severity").default("MEDIUM"),
    status: complianceAlertStatusEnum("status").default("ACTIVE"),
    dueDate: timestamp("due_date"),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by").references(() => user.id),
    metadata: text("metadata"), // JSON for additional data
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("compliance_alert_client_idx").on(table.clientId),
    index("compliance_alert_type_idx").on(table.type),
    index("compliance_alert_severity_idx").on(table.severity),
    index("compliance_alert_status_idx").on(table.status),
    index("compliance_alert_due_date_idx").on(table.dueDate),
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

// OCR Processing Job Status
export const ocrJobStatusEnum = pgEnum("ocr_job_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

// OCR Job Status Enum (updated)
export const ocrJobStatusExtendedEnum = pgEnum("ocr_job_status_extended", [
  "QUEUED",
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "VALIDATED",
  "FAILED",
  "CANCELLED",
]);

// OCR Processing Job
export const ocrProcessingJob = pgTable(
  "ocr_processing_job",
  {
    id: text("id").primaryKey(), // Changed to text to allow custom IDs like ocr_xxx
    documentId: uuid("document_id")
      .notNull()
      .references(() => document.id, { onDelete: "cascade" }),
    clientId: uuid("client_id").references(() => client.id, {
      onDelete: "cascade",
    }),
    batchId: text("batch_id"), // For batch processing
    documentType: varchar("document_type", { length: 50 }), // INVOICE, RECEIPT, etc.
    status: varchar("status", { length: 20 }).default("QUEUED").notNull(),
    priority: varchar("priority", { length: 20 }).default("NORMAL"), // LOW, NORMAL, HIGH, URGENT
    extractedText: text("extracted_text"),
    confidence: numeric("confidence", { precision: 5, scale: 4 }),
    confidenceScore: numeric("confidence_score", { precision: 5, scale: 4 }), // Alias
    extractionOptions: text("extraction_options"), // JSON
    metadata: text("metadata"), // JSON metadata
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    processedBy: text("processed_by").references(() => user.id),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ocr_job_document_idx").on(table.documentId),
    index("ocr_job_client_idx").on(table.clientId),
    index("ocr_job_batch_idx").on(table.batchId),
    index("ocr_job_status_idx").on(table.status),
    index("ocr_job_priority_idx").on(table.priority),
    index("ocr_job_created_idx").on(table.createdAt),
  ]
);

// Document Folder for organizing documents
export const documentFolder = pgTable(
  "document_folder",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    parentFolderId: uuid("parent_folder_id"),
    path: text("path"), // Full path like /root/subfolder/folder
    color: varchar("color", { length: 7 }), // Hex color for UI
    icon: varchar("icon", { length: 50 }),
    isSystemFolder: boolean("is_system_folder").default(false),
    sortOrder: integer("sort_order").default(0),
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
    index("document_folder_client_idx").on(table.clientId),
    index("document_folder_parent_idx").on(table.parentFolderId),
    index("document_folder_path_idx").on(table.path),
    index("document_folder_name_idx").on(table.name),
  ]
);

// Add folderId to document table - we need to handle this separately

// Relations for OCR and Folder
export const ocrProcessingJobRelations = relations(
  ocrProcessingJob,
  ({ one }) => ({
    document: one(document, {
      fields: [ocrProcessingJob.documentId],
      references: [document.id],
    }),
    processedByUser: one(user, {
      fields: [ocrProcessingJob.processedBy],
      references: [user.id],
    }),
  })
);

export const documentFolderRelations = relations(
  documentFolder,
  ({ one, many }) => ({
    client: one(client, {
      fields: [documentFolder.clientId],
      references: [client.id],
    }),
    parentFolder: one(documentFolder, {
      fields: [documentFolder.parentFolderId],
      references: [documentFolder.id],
    }),
    childFolders: many(documentFolder),
    createdByUser: one(user, {
      fields: [documentFolder.createdBy],
      references: [user.id],
    }),
  })
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

// Invoice Status Enum
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "PENDING",
  "SENT",
  "PAID",
  "OVERDUE",
  "CANCELLED",
  "REFUNDED",
]);

// Invoice Table
export const invoice = pgTable(
  "invoice",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
    issueDate: timestamp("issue_date").notNull(),
    dueDate: timestamp("due_date").notNull(),
    subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
    vatAmount: numeric("vat_amount", { precision: 15, scale: 2 }).default("0"),
    total: numeric("total", { precision: 15, scale: 2 }).notNull(),
    status: invoiceStatusEnum("status").default("DRAFT").notNull(),
    currency: varchar("currency", { length: 3 }).default("GYD").notNull(),
    notes: text("notes"),
    termsAndConditions: text("terms_and_conditions"),
    paidAt: timestamp("paid_at"),
    paidAmount: numeric("paid_amount", { precision: 15, scale: 2 }),
    paymentMethod: varchar("payment_method", { length: 50 }),
    paymentReference: varchar("payment_reference", { length: 100 }),
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
    index("invoice_client_idx").on(table.clientId),
    index("invoice_number_idx").on(table.invoiceNumber),
    index("invoice_status_idx").on(table.status),
    index("invoice_issue_date_idx").on(table.issueDate),
    index("invoice_due_date_idx").on(table.dueDate),
  ]
);

// Payroll Record Table
export const payrollRecord = pgTable(
  "payroll_record",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id").notNull(),
    period: varchar("period", { length: 20 }).notNull(), // e.g., "2024-01"
    grossSalary: numeric("gross_salary", { precision: 15, scale: 2 }).notNull(),
    allowances: numeric("allowances", { precision: 15, scale: 2 }).default("0"),
    deductions: numeric("deductions", { precision: 15, scale: 2 }).default("0"),
    payeTax: numeric("paye_tax", { precision: 15, scale: 2 }).default("0"),
    nisEmployee: numeric("nis_employee", { precision: 15, scale: 2 }).default(
      "0"
    ),
    nisEmployer: numeric("nis_employer", { precision: 15, scale: 2 }).default(
      "0"
    ),
    netSalary: numeric("net_salary", { precision: 15, scale: 2 }).notNull(),
    paymentDate: timestamp("payment_date"),
    paymentStatus: varchar("payment_status", { length: 20 }).default("PENDING"),
    metadata: text("metadata"), // JSON for additional payroll details
    processedBy: text("processed_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payroll_record_client_idx").on(table.clientId),
    index("payroll_record_employee_idx").on(table.employeeId),
    index("payroll_record_period_idx").on(table.period),
    index("payroll_record_payment_status_idx").on(table.paymentStatus),
  ]
);

// OCR Result Table
export const ocrResult = pgTable(
  "ocr_result",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    processingId: text("processing_id")
      .notNull()
      .references(() => ocrProcessingJob.id, { onDelete: "cascade" }),
    extractedText: text("extracted_text"),
    extractedData: text("extracted_data"), // JSON for structured data
    confidenceScore: numeric("confidence_score", { precision: 5, scale: 4 }),
    processingMetadata: text("processing_metadata"), // JSON for processing details
    validatedBy: text("validated_by").references(() => user.id),
    validationNotes: text("validation_notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ocr_result_processing_idx").on(table.processingId),
    index("ocr_result_confidence_idx").on(table.confidenceScore),
  ]
);

// GRA Submission Table (for tax filings)
export const graSubmission = pgTable(
  "gra_submission",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => client.id, { onDelete: "cascade" }),
    formType: varchar("form_type", { length: 50 }).notNull(), // VAT_RETURN, PAYE_RETURN, CORPORATE_TAX
    period: varchar("period", { length: 20 }).notNull(),
    submissionData: text("submission_data"), // JSON with form data
    graReference: varchar("gra_reference", { length: 100 }),
    status: varchar("status", { length: 30 }).default("DRAFT"),
    submittedAt: timestamp("submitted_at"),
    processedAt: timestamp("processed_at"),
    errorMessage: text("error_message"),
    createdBy: text("created_by").references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("gra_submission_client_idx").on(table.clientId),
    index("gra_submission_form_type_idx").on(table.formType),
    index("gra_submission_period_idx").on(table.period),
    index("gra_submission_status_idx").on(table.status),
    index("gra_submission_gra_ref_idx").on(table.graReference),
  ]
);

// Relations for new tables
export const invoiceRelations = relations(invoice, ({ one }) => ({
  client: one(client, {
    fields: [invoice.clientId],
    references: [client.id],
  }),
  createdByUser: one(user, {
    fields: [invoice.createdBy],
    references: [user.id],
  }),
}));

export const payrollRecordRelations = relations(payrollRecord, ({ one }) => ({
  client: one(client, {
    fields: [payrollRecord.clientId],
    references: [client.id],
  }),
  processedByUser: one(user, {
    fields: [payrollRecord.processedBy],
    references: [user.id],
  }),
}));

export const ocrResultRelations = relations(ocrResult, ({ one }) => ({
  processingJob: one(ocrProcessingJob, {
    fields: [ocrResult.processingId],
    references: [ocrProcessingJob.id],
  }),
  validatedByUser: one(user, {
    fields: [ocrResult.validatedBy],
    references: [user.id],
  }),
}));

export const graSubmissionRelations = relations(graSubmission, ({ one }) => ({
  client: one(client, {
    fields: [graSubmission.clientId],
    references: [client.id],
  }),
  createdByUser: one(user, {
    fields: [graSubmission.createdBy],
    references: [user.id],
  }),
}));
