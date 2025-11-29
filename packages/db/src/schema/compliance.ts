import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  decimal,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { users } from "./users";

// Enums for compliance types and status
export const complianceTypeEnum = pgEnum("compliance_type", [
  "tax_filing",
  "vat_return",
  "paye_return",
  "nis_return",
  "annual_return",
  "audit",
  "review",
  "compilation",
  "regulatory_filing",
  "license_renewal",
]);

export const complianceStatusEnum = pgEnum("compliance_filing_status", [
  "not_started",
  "in_progress",
  "under_review",
  "completed",
  "filed",
  "overdue",
  "rejected",
  "amended",
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const taxPeriodEnum = pgEnum("tax_period", [
  "monthly",
  "quarterly",
  "semi_annually",
  "annually",
  "one_time",
]);

export const complianceRequirements = pgTable(
  "compliance_requirements",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    complianceType: complianceTypeEnum("compliance_type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    frequency: taxPeriodEnum("frequency").notNull(),
    priority: priorityEnum("priority").default("medium").notNull(),

    // Due dates and deadlines
    nextDueDate: date("next_due_date"),
    reminderDays: text("reminder_days"), // JSON array of days before due date to send reminders

    // Assignment and responsibility
    assignedTo: text("assigned_to").references(() => users.id),
    reviewedBy: text("reviewed_by").references(() => users.id),

    // Status tracking
    isActive: boolean("is_active").default(true).notNull(),
    isAutomatic: boolean("is_automatic").default(false).notNull(), // Auto-generated requirements

    // Additional configuration
    estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
    feeAmount: decimal("fee_amount", { precision: 10, scale: 2 }),
    notes: text("notes"),
    dependencies: text("dependencies"), // JSON array of requirement IDs this depends on

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("compliance_requirements_client_id_idx").on(table.clientId),
    index("compliance_requirements_type_idx").on(table.complianceType),
    index("compliance_requirements_due_date_idx").on(table.nextDueDate),
    index("compliance_requirements_assigned_to_idx").on(table.assignedTo),
    index("compliance_requirements_priority_idx").on(table.priority),
    index("compliance_requirements_status_idx").on(table.isActive),
  ]
);

export const complianceFilings = pgTable(
  "compliance_filings",
  {
    id: text("id").primaryKey(),
    requirementId: text("requirement_id")
      .notNull()
      .references(() => complianceRequirements.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    // Filing details
    filingPeriod: text("filing_period").notNull(), // e.g., "2024-Q1", "2024-12", "2024"
    periodStartDate: date("period_start_date"),
    periodEndDate: date("period_end_date"),
    dueDate: date("due_date").notNull(),

    // Status and tracking
    status: complianceStatusEnum("status").default("not_started").notNull(),
    priority: priorityEnum("priority").default("medium").notNull(),

    // Assignment
    assignedTo: text("assigned_to").references(() => users.id),
    reviewedBy: text("reviewed_by").references(() => users.id),
    preparedBy: text("prepared_by").references(() => users.id),

    // Progress tracking
    percentComplete: decimal("percent_complete", {
      precision: 5,
      scale: 2,
    }).default("0"),
    actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    filedAt: timestamp("filed_at"),

    // Financial information
    feeCharged: decimal("fee_charged", { precision: 10, scale: 2 }),
    penalties: decimal("penalties", { precision: 10, scale: 2 }),
    interest: decimal("interest", { precision: 10, scale: 2 }),

    // Filing information
    referenceNumber: text("reference_number"),
    confirmationNumber: text("confirmation_number"),
    filingMethod: text("filing_method"), // electronic, paper, online_portal

    // Additional details
    notes: text("notes"),
    internalNotes: text("internal_notes"),
    attachments: text("attachments"), // JSON array of document IDs

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("compliance_filings_requirement_id_idx").on(table.requirementId),
    index("compliance_filings_client_id_idx").on(table.clientId),
    index("compliance_filings_status_idx").on(table.status),
    index("compliance_filings_due_date_idx").on(table.dueDate),
    index("compliance_filings_assigned_to_idx").on(table.assignedTo),
    index("compliance_filings_period_idx").on(table.filingPeriod),
    index("compliance_filings_reference_number_idx").on(table.referenceNumber),
  ]
);

export const complianceReminders = pgTable(
  "compliance_reminders",
  {
    id: text("id").primaryKey(),
    filingId: text("filing_id")
      .notNull()
      .references(() => complianceFilings.id, { onDelete: "cascade" }),
    reminderType: text("reminder_type").notNull(), // email, sms, in_app
    reminderDate: timestamp("reminder_date").notNull(),
    message: text("message"),
    sentAt: timestamp("sent_at"),
    sentTo: text("sent_to"), // JSON array of user IDs or email addresses
    status: text("status").default("pending").notNull(), // pending, sent, failed
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("compliance_reminders_filing_id_idx").on(table.filingId),
    index("compliance_reminders_date_idx").on(table.reminderDate),
    index("compliance_reminders_status_idx").on(table.status),
  ]
);

// Relations
export const complianceRequirementsRelations = relations(
  complianceRequirements,
  ({ many, one }) => ({
    client: one(clients, {
      fields: [complianceRequirements.clientId],
      references: [clients.id],
    }),
    assignedToUser: one(users, {
      fields: [complianceRequirements.assignedTo],
      references: [users.id],
    }),
    reviewedByUser: one(users, {
      fields: [complianceRequirements.reviewedBy],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [complianceRequirements.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [complianceRequirements.updatedBy],
      references: [users.id],
    }),
    filings: many(complianceFilings),
  })
);

export const complianceFilingsRelations = relations(
  complianceFilings,
  ({ many, one }) => ({
    requirement: one(complianceRequirements, {
      fields: [complianceFilings.requirementId],
      references: [complianceRequirements.id],
    }),
    client: one(clients, {
      fields: [complianceFilings.clientId],
      references: [clients.id],
    }),
    assignedToUser: one(users, {
      fields: [complianceFilings.assignedTo],
      references: [users.id],
    }),
    reviewedByUser: one(users, {
      fields: [complianceFilings.reviewedBy],
      references: [users.id],
    }),
    preparedByUser: one(users, {
      fields: [complianceFilings.preparedBy],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [complianceFilings.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [complianceFilings.updatedBy],
      references: [users.id],
    }),
    reminders: many(complianceReminders),
  })
);

export const complianceRemindersRelations = relations(
  complianceReminders,
  ({ one }) => ({
    filing: one(complianceFilings, {
      fields: [complianceReminders.filingId],
      references: [complianceFilings.id],
    }),
  })
);
