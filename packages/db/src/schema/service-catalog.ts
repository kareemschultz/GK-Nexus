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

// Business Entity enum - the two main companies
export const businessEntityEnum = pgEnum("business_entity", [
  "GREEN_CRESCENT", // Green Crescent Management Consultancy
  "KAJ_FINANCIAL", // KAJ Financial Services
  "BOTH", // Services offered by both entities
]);

// Service Category enum - main service groupings
export const serviceCategoryEnum = pgEnum("service_category", [
  // Green Crescent Categories
  "TRAINING",
  "CONSULTANCY",
  "PARALEGAL",
  "IMMIGRATION",
  "BUSINESS_PROPOSALS",
  "NETWORKING",
  // KAJ Financial Categories
  "TAX_RETURNS",
  "COMPLIANCE",
  "PAYE_SERVICES",
  "FINANCIAL_STATEMENTS",
  "AUDIT_SERVICES",
  "NIS_SERVICES",
  // Shared Categories
  "DOCUMENT_PREPARATION",
  "CLIENT_PORTAL",
]);

// Service status enum
export const serviceStatusEnum = pgEnum("service_offering_status", [
  "ACTIVE",
  "INACTIVE",
  "COMING_SOON",
  "DEPRECATED",
]);

// Fee structure enum
export const feeStructureTypeEnum = pgEnum("fee_structure_type", [
  "FIXED", // One-time fixed fee
  "HOURLY", // Hourly rate
  "PERCENTAGE", // Percentage of amount
  "MONTHLY", // Monthly retainer
  "QUARTERLY", // Quarterly fee
  "ANNUAL", // Annual fee
  "CUSTOM", // Custom pricing
  "FREE", // Complimentary service
]);

// Project status enum
export const projectStatusEnum = pgEnum("project_status", [
  "DRAFT",
  "PENDING_APPROVAL",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]);

// Milestone status enum
export const milestoneStatusEnum = pgEnum("milestone_status", [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
  "BLOCKED",
]);

// Service Catalog - Master list of all services offered
export const serviceCatalog = pgTable(
  "service_catalog",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Service identification
    code: text("code").notNull(), // e.g., "GC-TRN-001", "KAJ-TAX-001"
    name: text("name").notNull(),
    shortDescription: text("short_description"),
    fullDescription: text("full_description"),

    // Categorization
    businessEntity: businessEntityEnum("business_entity").notNull(),
    category: serviceCategoryEnum("category").notNull(),
    subcategory: text("subcategory"), // More specific grouping

    // Pricing
    feeStructure: feeStructureTypeEnum("fee_structure")
      .default("FIXED")
      .notNull(),
    basePrice: decimal("base_price", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),
    minPrice: decimal("min_price", { precision: 15, scale: 2 }),
    maxPrice: decimal("max_price", { precision: 15, scale: 2 }),

    // Time estimates
    estimatedDurationDays: integer("estimated_duration_days"),
    estimatedHours: decimal("estimated_hours", { precision: 10, scale: 2 }),

    // Requirements
    requiredDocuments: jsonb("required_documents"), // Array of document types needed
    prerequisites: jsonb("prerequisites"), // Other services that must be completed first
    eligibilityCriteria: jsonb("eligibility_criteria"), // Who can use this service

    // Workflow
    defaultWorkflowId: text("default_workflow_id"),
    milestoneTemplates: jsonb("milestone_templates"), // Default milestones for this service

    // Government integrations
    graIntegration: boolean("gra_integration").default(false),
    nisIntegration: boolean("nis_integration").default(false),
    immigrationIntegration: boolean("immigration_integration").default(false),

    // Display
    displayOrder: integer("display_order").default(0),
    iconName: text("icon_name"), // Lucide icon name
    colorCode: text("color_code"), // Hex color for UI
    isFeatured: boolean("is_featured").default(false),
    isPopular: boolean("is_popular").default(false),

    // Status
    status: serviceStatusEnum("status").default("ACTIVE").notNull(),

    // Metadata
    tags: jsonb("tags"), // Array of searchable tags
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
    index("service_catalog_org_idx").on(table.organizationId),
    index("service_catalog_entity_idx").on(table.businessEntity),
    index("service_catalog_category_idx").on(table.category),
    index("service_catalog_status_idx").on(table.status),
    index("service_catalog_code_idx").on(table.code),
    index("service_catalog_featured_idx").on(table.isFeatured),
  ]
);

// Client Projects - Active service engagements
export const clientProjects = pgTable(
  "client_projects",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    serviceCatalogId: text("service_catalog_id")
      .notNull()
      .references(() => serviceCatalog.id),

    // Project details
    projectNumber: text("project_number").notNull(), // e.g., "PRJ-2025-001"
    name: text("name").notNull(),
    description: text("description"),
    businessEntity: businessEntityEnum("business_entity").notNull(),

    // Status and dates
    status: projectStatusEnum("status").default("DRAFT").notNull(),
    priority: text("priority").default("medium"), // low, medium, high, urgent
    startDate: timestamp("start_date"),
    targetEndDate: timestamp("target_end_date"),
    actualEndDate: timestamp("actual_end_date"),

    // Pricing
    agreedPrice: decimal("agreed_price", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),
    discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }),
    discountReason: text("discount_reason"),

    // Progress tracking
    progressPercent: integer("progress_percent").default(0),
    currentMilestoneId: text("current_milestone_id"),

    // Assignment
    leadConsultantId: text("lead_consultant_id").references(() => users.id),
    teamMemberIds: jsonb("team_member_ids"), // Array of user IDs

    // Related data
    relatedDocumentIds: jsonb("related_document_ids"), // Array of document IDs
    parentProjectId: text("parent_project_id"), // For sub-projects
    linkedProjectIds: jsonb("linked_project_ids"), // Related projects

    // Notes and communication
    internalNotes: text("internal_notes"),
    clientVisibleNotes: text("client_visible_notes"),

    // Billing
    totalBilled: decimal("total_billed", { precision: 15, scale: 2 }).default(
      "0"
    ),
    totalPaid: decimal("total_paid", { precision: 15, scale: 2 }).default("0"),
    billingStatus: text("billing_status").default("pending"), // pending, partial, paid, overdue

    // Metadata
    metadata: jsonb("metadata"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("client_projects_org_idx").on(table.organizationId),
    index("client_projects_client_idx").on(table.clientId),
    index("client_projects_service_idx").on(table.serviceCatalogId),
    index("client_projects_status_idx").on(table.status),
    index("client_projects_entity_idx").on(table.businessEntity),
    index("client_projects_lead_idx").on(table.leadConsultantId),
    index("client_projects_number_idx").on(table.projectNumber),
  ]
);

// Project Milestones - Tracking progress through service delivery
export const projectMilestones = pgTable(
  "project_milestones",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => clientProjects.id, { onDelete: "cascade" }),

    // Milestone details
    name: text("name").notNull(),
    description: text("description"),
    displayOrder: integer("display_order").default(0),

    // Status and dates
    status: milestoneStatusEnum("status").default("PENDING").notNull(),
    startDate: timestamp("start_date"),
    dueDate: timestamp("due_date"),
    completedDate: timestamp("completed_date"),

    // Requirements
    requiredDocuments: jsonb("required_documents"),
    requiredApprovals: jsonb("required_approvals"),
    dependsOnMilestones: jsonb("depends_on_milestones"), // Array of milestone IDs

    // Assignment
    assignedToId: text("assigned_to_id").references(() => users.id),

    // Notes
    notes: text("notes"),
    clientVisibleNotes: text("client_visible_notes"),

    // Metadata
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("project_milestones_project_idx").on(table.projectId),
    index("project_milestones_status_idx").on(table.status),
    index("project_milestones_assigned_idx").on(table.assignedToId),
  ]
);

// Time Entries - Track time spent on projects
export const timeEntries = pgTable(
  "time_entries",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => clientProjects.id),
    milestoneId: text("milestone_id").references(() => projectMilestones.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),

    // Time details
    date: timestamp("date").notNull(),
    hours: decimal("hours", { precision: 10, scale: 2 }).notNull(),
    description: text("description").notNull(),

    // Billing
    isBillable: boolean("is_billable").default(true).notNull(),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    totalAmount: decimal("total_amount", { precision: 15, scale: 2 }),
    isBilled: boolean("is_billed").default(false).notNull(),
    invoiceId: text("invoice_id"),

    // Metadata
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("time_entries_org_idx").on(table.organizationId),
    index("time_entries_project_idx").on(table.projectId),
    index("time_entries_user_idx").on(table.userId),
    index("time_entries_date_idx").on(table.date),
    index("time_entries_billable_idx").on(table.isBillable),
  ]
);

// Service Packages - Bundled service offerings
export const servicePackages = pgTable(
  "service_packages",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Package details
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    businessEntity: businessEntityEnum("business_entity").notNull(),

    // Included services
    includedServiceIds: jsonb("included_service_ids").notNull(), // Array of service catalog IDs

    // Pricing
    packagePrice: decimal("package_price", {
      precision: 15,
      scale: 2,
    }).notNull(),
    currency: text("currency").default("GYD").notNull(),
    savingsPercent: decimal("savings_percent", { precision: 5, scale: 2 }),

    // Validity
    validFrom: timestamp("valid_from"),
    validUntil: timestamp("valid_until"),

    // Display
    displayOrder: integer("display_order").default(0),
    isFeatured: boolean("is_featured").default(false),
    status: serviceStatusEnum("status").default("ACTIVE").notNull(),

    // Metadata
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("service_packages_org_idx").on(table.organizationId),
    index("service_packages_entity_idx").on(table.businessEntity),
    index("service_packages_status_idx").on(table.status),
  ]
);

// Service Document Templates - Templates for various service offerings
export const serviceDocumentTemplates = pgTable(
  "service_document_templates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Template details
    code: text("code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    businessEntity: businessEntityEnum("business_entity").notNull(),
    category: serviceCategoryEnum("category").notNull(),

    // Template content
    templateType: text("template_type").notNull(), // word, pdf, excel, html
    templateContent: text("template_content"), // HTML/Markdown content
    templateFileUrl: text("template_file_url"), // URL to template file
    variableDefinitions: jsonb("variable_definitions"), // Placeholders in template

    // Usage
    applicableServices: jsonb("applicable_services"), // Array of service IDs

    // Versioning
    version: integer("version").default(1).notNull(),
    isLatest: boolean("is_latest").default(true).notNull(),

    // Status
    status: serviceStatusEnum("status").default("ACTIVE").notNull(),

    // Metadata
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("svc_doc_templates_org_idx").on(table.organizationId),
    index("svc_doc_templates_entity_idx").on(table.businessEntity),
    index("svc_doc_templates_category_idx").on(table.category),
    index("svc_doc_templates_status_idx").on(table.status),
  ]
);

// Client Communication Log - Track all client interactions
export const clientCommunicationLog = pgTable(
  "client_communication_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => clientProjects.id),

    // Communication details
    communicationType: text("communication_type").notNull(), // email, phone, meeting, portal, sms
    direction: text("direction").notNull(), // inbound, outbound
    subject: text("subject"),
    content: text("content"),

    // Participants
    staffUserId: text("staff_user_id").references(() => users.id),
    clientContactName: text("client_contact_name"),
    clientContactEmail: text("client_contact_email"),

    // Scheduling (for meetings)
    scheduledAt: timestamp("scheduled_at"),
    duration: integer("duration"), // minutes

    // Follow-up
    requiresFollowUp: boolean("requires_follow_up").default(false),
    followUpDate: timestamp("follow_up_date"),
    followUpCompleted: boolean("follow_up_completed").default(false),

    // Attachments
    attachmentIds: jsonb("attachment_ids"),

    // Metadata
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("client_comm_org_idx").on(table.organizationId),
    index("client_comm_client_idx").on(table.clientId),
    index("client_comm_project_idx").on(table.projectId),
    index("client_comm_type_idx").on(table.communicationType),
    index("client_comm_followup_idx").on(table.requiresFollowUp),
  ]
);

// Relations
export const serviceCatalogRelations = relations(
  serviceCatalog,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [serviceCatalog.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [serviceCatalog.createdBy],
      references: [users.id],
    }),
    projects: many(clientProjects),
  })
);

export const clientProjectsRelations = relations(
  clientProjects,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [clientProjects.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [clientProjects.clientId],
      references: [clients.id],
    }),
    service: one(serviceCatalog, {
      fields: [clientProjects.serviceCatalogId],
      references: [serviceCatalog.id],
    }),
    leadConsultant: one(users, {
      fields: [clientProjects.leadConsultantId],
      references: [users.id],
    }),
    milestones: many(projectMilestones),
    timeEntries: many(timeEntries),
    communications: many(clientCommunicationLog),
  })
);

export const projectMilestonesRelations = relations(
  projectMilestones,
  ({ one }) => ({
    project: one(clientProjects, {
      fields: [projectMilestones.projectId],
      references: [clientProjects.id],
    }),
    assignedTo: one(users, {
      fields: [projectMilestones.assignedToId],
      references: [users.id],
    }),
  })
);

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  organization: one(organizations, {
    fields: [timeEntries.organizationId],
    references: [organizations.id],
  }),
  project: one(clientProjects, {
    fields: [timeEntries.projectId],
    references: [clientProjects.id],
  }),
  milestone: one(projectMilestones, {
    fields: [timeEntries.milestoneId],
    references: [projectMilestones.id],
  }),
  user: one(users, {
    fields: [timeEntries.userId],
    references: [users.id],
  }),
}));

export const clientCommunicationLogRelations = relations(
  clientCommunicationLog,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [clientCommunicationLog.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [clientCommunicationLog.clientId],
      references: [clients.id],
    }),
    project: one(clientProjects, {
      fields: [clientCommunicationLog.projectId],
      references: [clientProjects.id],
    }),
    staffUser: one(users, {
      fields: [clientCommunicationLog.staffUserId],
      references: [users.id],
    }),
  })
);
