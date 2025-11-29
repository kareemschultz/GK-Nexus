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
import { clients } from "./clients";
import { users } from "./users";

// Service departments based on GK-Enterprise-Suite
export const serviceDepartmentEnum = pgEnum("service_department", [
  "GCMC", // Visa, Legal services
  "KAJ", // Tax, Accounting services
  "COMPLIANCE", // Regulatory compliance
  "ADVISORY", // Business advisory
]);

// Appointment status
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
  "RESCHEDULED",
]);

// Service types
export const serviceTypeEnum = pgEnum("service_type", [
  "PAYE_FILING",
  "VAT_RETURN",
  "INCOME_TAX_RETURN",
  "NIS_SUBMISSION",
  "BUSINESS_REGISTRATION",
  "TAX_CONSULTATION",
  "COMPLIANCE_REVIEW",
  "DOCUMENT_PREPARATION",
  "AUDIT_SUPPORT",
  "ADVISORY_MEETING",
  "VISA_APPLICATION",
  "LEGAL_CONSULTATION",
]);

// Priority levels
export const priorityEnum = pgEnum("priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

// Services catalog table
export const services = pgTable(
  "services",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    department: serviceDepartmentEnum("department").notNull(),
    serviceType: serviceTypeEnum("service_type").notNull(),

    // Pricing
    basePrice: decimal("base_price", { precision: 10, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),

    // Duration and scheduling
    estimatedDurationMinutes: integer("estimated_duration_minutes").default(60),
    bufferTimeMinutes: integer("buffer_time_minutes").default(15),

    // Availability
    isActive: boolean("is_active").default(true).notNull(),
    requiresApproval: boolean("requires_approval").default(false),
    maxAdvanceBookingDays: integer("max_advance_booking_days").default(30),

    // Requirements
    requiredDocuments: text("required_documents"), // JSON array
    prerequisites: text("prerequisites"), // JSON array

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("services_department_idx").on(table.department),
    index("services_service_type_idx").on(table.serviceType),
    index("services_is_active_idx").on(table.isActive),
    index("services_created_by_idx").on(table.createdBy),
  ]
);

// Appointments table
export const appointments = pgTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    appointmentNumber: text("appointment_number").unique().notNull(),

    // Parties involved
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),
    serviceId: text("service_id")
      .notNull()
      .references(() => services.id),
    assignedTo: text("assigned_to").references(() => users.id),

    // Scheduling
    scheduledAt: timestamp("scheduled_at").notNull(),
    estimatedEndTime: timestamp("estimated_end_time").notNull(),
    actualStartTime: timestamp("actual_start_time"),
    actualEndTime: timestamp("actual_end_time"),

    // Status and priority
    status: appointmentStatusEnum("status").default("SCHEDULED").notNull(),
    priority: priorityEnum("priority").default("MEDIUM").notNull(),

    // Details
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"), // Office, Online, Client site
    meetingLink: text("meeting_link"), // For virtual meetings

    // Client information
    clientNotes: text("client_notes"),
    internalNotes: text("internal_notes"),

    // Follow-up
    requiresFollowUp: boolean("requires_follow_up").default(false),
    followUpDate: timestamp("follow_up_date"),
    followUpCompleted: boolean("follow_up_completed").default(false),

    // Billing
    isChargeable: boolean("is_chargeable").default(true),
    chargedAmount: decimal("charged_amount", { precision: 10, scale: 2 }),
    paymentStatus: text("payment_status").default("PENDING"), // PENDING, PAID, OVERDUE

    // Reminders
    reminderSent: boolean("reminder_sent").default(false),
    reminderSentAt: timestamp("reminder_sent_at"),
    confirmationSent: boolean("confirmation_sent").default(false),

    // Cancellation
    cancellationReason: text("cancellation_reason"),
    cancelledAt: timestamp("cancelled_at"),
    cancelledBy: text("cancelled_by").references(() => users.id),

    // Metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("appointments_client_id_idx").on(table.clientId),
    index("appointments_service_id_idx").on(table.serviceId),
    index("appointments_assigned_to_idx").on(table.assignedTo),
    index("appointments_scheduled_at_idx").on(table.scheduledAt),
    index("appointments_status_idx").on(table.status),
    index("appointments_priority_idx").on(table.priority),
    index("appointments_appointment_number_idx").on(table.appointmentNumber),
    index("appointments_payment_status_idx").on(table.paymentStatus),
    index("appointments_follow_up_date_idx").on(table.followUpDate),
  ]
);

// Appointment documents/attachments
export const appointmentDocuments = pgTable(
  "appointment_documents",
  {
    id: text("id").primaryKey(),
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointments.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    documentType: text("document_type"), // ID, INCORPORATION_CERT, TAX_RETURN, etc.
    description: text("description"),
    isClientAccessible: boolean("is_client_accessible").default(false),
    uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
    uploadedBy: text("uploaded_by").references(() => users.id),
  },
  (table) => [
    index("appointment_documents_appointment_id_idx").on(table.appointmentId),
    index("appointment_documents_document_type_idx").on(table.documentType),
    index("appointment_documents_uploaded_by_idx").on(table.uploadedBy),
  ]
);

// Relations
export const servicesRelations = relations(services, ({ many, one }) => ({
  appointments: many(appointments),
  createdByUser: one(users, {
    fields: [services.createdBy],
    references: [users.id],
  }),
}));

export const appointmentsRelations = relations(
  appointments,
  ({ many, one }) => ({
    client: one(clients, {
      fields: [appointments.clientId],
      references: [clients.id],
    }),
    service: one(services, {
      fields: [appointments.serviceId],
      references: [services.id],
    }),
    assignedToUser: one(users, {
      fields: [appointments.assignedTo],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [appointments.createdBy],
      references: [users.id],
    }),
    updatedByUser: one(users, {
      fields: [appointments.updatedBy],
      references: [users.id],
    }),
    cancelledByUser: one(users, {
      fields: [appointments.cancelledBy],
      references: [users.id],
    }),
    documents: many(appointmentDocuments),
  })
);

export const appointmentDocumentsRelations = relations(
  appointmentDocuments,
  ({ one }) => ({
    appointment: one(appointments, {
      fields: [appointmentDocuments.appointmentId],
      references: [appointments.id],
    }),
    uploadedByUser: one(users, {
      fields: [appointmentDocuments.uploadedBy],
      references: [users.id],
    }),
  })
);
