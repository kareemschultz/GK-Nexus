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

// Government agency enum
export const governmentAgencyEnum = pgEnum("government_agency", [
  "GRA", // Guyana Revenue Authority
  "NIS", // National Insurance Scheme
  "DEEDS_REGISTRY", // Deeds Registry
  "LANDS_SURVEYS", // Lands and Surveys Commission
  "BUSINESS_REGISTRY", // Business Registry
  "IMMIGRATION", // Immigration Department
  "MINISTRY_OF_LABOUR", // Ministry of Labour
  "MINISTRY_OF_LEGAL_AFFAIRS", // Ministry of Legal Affairs
  "MINISTRY_OF_HOME_AFFAIRS", // Ministry of Home Affairs
  "MINISTRY_OF_NATURAL_RESOURCES", // Ministry of Natural Resources
  "EPA", // Environmental Protection Agency
  "GUYANA_ENERGY", // Guyana Energy Agency
  "GNBS", // Guyana National Bureau of Standards
  "GPL", // Guyana Power & Light
  "GWI", // Guyana Water Inc
  "GTT", // Guyana Telephone & Telegraph
  "OTHER",
]);

// Expediting request type enum
export const expeditingRequestTypeEnum = pgEnum("expediting_request_type", [
  "DOCUMENT_SUBMISSION",
  "DOCUMENT_COLLECTION",
  "APPLICATION_FOLLOW_UP",
  "CERTIFICATE_RENEWAL",
  "COMPLIANCE_CLEARANCE",
  "PERMIT_APPLICATION",
  "LICENSE_APPLICATION",
  "TAX_CLEARANCE",
  "REGISTRATION",
  "INQUIRY",
  "GENERAL_EXPEDITING",
]);

// Expediting status enum
export const expeditingStatusEnum = pgEnum("expediting_status", [
  "PENDING",
  "ASSIGNED",
  "IN_QUEUE",
  "AT_AGENCY",
  "PROCESSING",
  "AWAITING_RESPONSE",
  "DOCUMENTS_READY",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "ON_HOLD",
]);

// Priority enum
export const expeditingPriorityEnum = pgEnum("expediting_priority", [
  "STANDARD",
  "PRIORITY",
  "URGENT",
  "RUSH",
]);

// Expediting service requests
export const expeditingRequests = pgTable(
  "expediting_requests",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id),

    // Request identification
    requestNumber: text("request_number").notNull(),
    requestType: expeditingRequestTypeEnum("request_type").notNull(),
    agency: governmentAgencyEnum("agency").notNull(),
    status: expeditingStatusEnum("status").default("PENDING").notNull(),
    priority: expeditingPriorityEnum("priority").default("STANDARD").notNull(),

    // Request details
    title: text("title").notNull(),
    description: text("description"),
    instructions: text("instructions"),

    // Agency-specific reference
    agencyReferenceNumber: text("agency_reference_number"),
    agencyDepartment: text("agency_department"),
    agencyContactPerson: text("agency_contact_person"),
    agencyContactPhone: text("agency_contact_phone"),

    // Documents
    documentsRequired: jsonb("documents_required"),
    documentsProvided: jsonb("documents_provided"),
    documentsReceived: jsonb("documents_received"),

    // Timeline
    requestedDate: timestamp("requested_date").defaultNow().notNull(),
    targetCompletionDate: timestamp("target_completion_date"),
    actualCompletionDate: timestamp("actual_completion_date"),
    estimatedProcessingDays: integer("estimated_processing_days"),

    // Assignment
    assignedToId: text("assigned_to_id").references(() => users.id),
    expeditorName: text("expeditor_name"),
    expeditorPhone: text("expeditor_phone"),

    // Fees
    governmentFee: decimal("government_fee", { precision: 15, scale: 2 }),
    serviceFee: decimal("service_fee", { precision: 15, scale: 2 }),
    totalFee: decimal("total_fee", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),
    isPaid: boolean("is_paid").default(false),
    paymentReference: text("payment_reference"),

    // Result
    outcome: text("outcome"),
    resultDocuments: jsonb("result_documents"),

    // Metadata
    metadata: jsonb("metadata"),
    notes: text("notes"),
    internalNotes: text("internal_notes"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("expediting_requests_org_idx").on(table.organizationId),
    index("expediting_requests_client_idx").on(table.clientId),
    index("expediting_requests_status_idx").on(table.status),
    index("expediting_requests_agency_idx").on(table.agency),
    index("expediting_requests_type_idx").on(table.requestType),
    index("expediting_requests_number_idx").on(table.requestNumber),
    index("expediting_requests_assigned_idx").on(table.assignedToId),
    index("expediting_requests_priority_idx").on(table.priority),
  ]
);

// Expediting activity log (track each visit/action)
export const expeditingActivities = pgTable(
  "expediting_activities",
  {
    id: text("id").primaryKey(),
    requestId: text("request_id")
      .notNull()
      .references(() => expeditingRequests.id, { onDelete: "cascade" }),

    // Activity details
    activityType: text("activity_type").notNull(), // visit, call, submission, collection, follow_up
    activityDate: timestamp("activity_date").notNull(),
    description: text("description").notNull(),

    // Location/agency visit details
    agencyVisited: governmentAgencyEnum("agency_visited"),
    departmentVisited: text("department_visited"),
    officerMet: text("officer_met"),
    queueNumber: text("queue_number"),
    waitTime: integer("wait_time"), // minutes

    // Status update
    previousStatus: expeditingStatusEnum("previous_status"),
    newStatus: expeditingStatusEnum("new_status"),

    // Documents
    documentsSubmitted: jsonb("documents_submitted"),
    documentsCollected: jsonb("documents_collected"),
    receiptsObtained: jsonb("receipts_obtained"),

    // Expenses
    expenseAmount: decimal("expense_amount", { precision: 15, scale: 2 }),
    expenseType: text("expense_type"),
    expenseReceipt: text("expense_receipt"),

    // Follow-up
    followUpRequired: boolean("follow_up_required").default(false),
    followUpDate: timestamp("follow_up_date"),
    followUpNotes: text("follow_up_notes"),

    // Images/attachments
    images: jsonb("images"),
    attachments: jsonb("attachments"),

    // Audit
    performedBy: text("performed_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("expediting_activities_request_idx").on(table.requestId),
    index("expediting_activities_date_idx").on(table.activityDate),
    index("expediting_activities_type_idx").on(table.activityType),
    index("expediting_activities_performed_by_idx").on(table.performedBy),
  ]
);

// Government agency contacts directory
export const agencyContacts = pgTable(
  "agency_contacts",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Agency details
    agency: governmentAgencyEnum("agency").notNull(),
    departmentName: text("department_name"),
    officeName: text("office_name"),

    // Location
    address: text("address"),
    city: text("city"),
    region: text("region"),
    gpsCoordinates: jsonb("gps_coordinates"),

    // Contact information
    contactName: text("contact_name"),
    contactTitle: text("contact_title"),
    phone: text("phone"),
    alternatePhone: text("alternate_phone"),
    email: text("email"),
    website: text("website"),

    // Operating hours
    operatingHours: jsonb("operating_hours"),
    publicDays: jsonb("public_days"),

    // Services provided
    servicesOffered: jsonb("services_offered"),
    documentsProcessed: jsonb("documents_processed"),
    processingTimes: jsonb("processing_times"),
    fees: jsonb("fees"),

    // Tips and notes
    tips: text("tips"),
    commonIssues: jsonb("common_issues"),
    notes: text("notes"),

    // Status
    isActive: boolean("is_active").default(true).notNull(),
    lastVerified: timestamp("last_verified"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("agency_contacts_org_idx").on(table.organizationId),
    index("agency_contacts_agency_idx").on(table.agency),
    index("agency_contacts_active_idx").on(table.isActive),
    index("agency_contacts_city_idx").on(table.city),
  ]
);

// Expediting queue management
export const expeditingQueue = pgTable(
  "expediting_queue",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Queue details
    queueDate: timestamp("queue_date").notNull(),
    agency: governmentAgencyEnum("agency").notNull(),
    expeditorId: text("expeditor_id")
      .notNull()
      .references(() => users.id),

    // Assigned requests for this trip
    requestIds: jsonb("request_ids").notNull(),
    requestCount: integer("request_count").default(0),

    // Planning
    plannedStartTime: timestamp("planned_start_time"),
    plannedEndTime: timestamp("planned_end_time"),
    actualStartTime: timestamp("actual_start_time"),
    actualEndTime: timestamp("actual_end_time"),

    // Status
    status: text("status").default("planned"), // planned, in_progress, completed, cancelled

    // Route and notes
    routeNotes: text("route_notes"),
    completionNotes: text("completion_notes"),

    // Results summary
    requestsCompleted: integer("requests_completed").default(0),
    requestsPending: integer("requests_pending").default(0),

    // Expenses
    transportExpense: decimal("transport_expense", { precision: 15, scale: 2 }),
    otherExpenses: decimal("other_expenses", { precision: 15, scale: 2 }),
    totalExpenses: decimal("total_expenses", { precision: 15, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("expediting_queue_org_idx").on(table.organizationId),
    index("expediting_queue_date_idx").on(table.queueDate),
    index("expediting_queue_agency_idx").on(table.agency),
    index("expediting_queue_expeditor_idx").on(table.expeditorId),
    index("expediting_queue_status_idx").on(table.status),
  ]
);

// Relations
export const expeditingRequestsRelations = relations(
  expeditingRequests,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [expeditingRequests.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [expeditingRequests.clientId],
      references: [clients.id],
    }),
    assignedTo: one(users, {
      fields: [expeditingRequests.assignedToId],
      references: [users.id],
    }),
    activities: many(expeditingActivities),
  })
);

export const expeditingActivitiesRelations = relations(
  expeditingActivities,
  ({ one }) => ({
    request: one(expeditingRequests, {
      fields: [expeditingActivities.requestId],
      references: [expeditingRequests.id],
    }),
    performedByUser: one(users, {
      fields: [expeditingActivities.performedBy],
      references: [users.id],
    }),
  })
);

export const agencyContactsRelations = relations(agencyContacts, ({ one }) => ({
  organization: one(organizations, {
    fields: [agencyContacts.organizationId],
    references: [organizations.id],
  }),
}));

export const expeditingQueueRelations = relations(
  expeditingQueue,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [expeditingQueue.organizationId],
      references: [organizations.id],
    }),
    expeditor: one(users, {
      fields: [expeditingQueue.expeditorId],
      references: [users.id],
    }),
  })
);
