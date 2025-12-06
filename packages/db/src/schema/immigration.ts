import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { enhancedDocuments } from "./document-management";
import { organizations } from "./organizations";
import { users } from "./users";

// Immigration case types for Guyana
export const immigrationCaseTypeEnum = pgEnum("immigration_case_type", [
  // Work permits and employment
  "work_permit_initial",
  "work_permit_renewal",
  "work_permit_extension",
  "work_permit_amendment",

  // Residency applications
  "temporary_residence",
  "permanent_residence",
  "residence_renewal",
  "residence_extension",

  // Business and investment
  "investor_visa",
  "business_permit",
  "entrepreneur_permit",
  "business_registration",

  // Family-based applications
  "family_reunification",
  "spousal_visa",
  "dependent_visa",
  "adoption_visa",

  // Citizenship applications
  "naturalization",
  "citizenship_by_descent",
  "citizenship_certificate",

  // Special categories
  "student_visa",
  "research_permit",
  "volunteer_permit",
  "diplomatic_visa",
  "transit_visa",

  // Status changes and appeals
  "status_change",
  "appeal",
  "judicial_review",
  "reactivation",

  // Other services
  "document_authentication",
  "verification_service",
  "travel_document",
  "other",
]);

// Case status tracking
export const immigrationCaseStatusEnum = pgEnum("immigration_case_status", [
  "draft",
  "submitted",
  "under_review",
  "additional_docs_required",
  "interview_scheduled",
  "interview_completed",
  "decision_pending",
  "approved",
  "approved_with_conditions",
  "refused",
  "withdrawn",
  "cancelled",
  "expired",
  "appealed",
  "appeal_pending",
  "appeal_approved",
  "appeal_refused",
  "reactivated",
  "transferred",
]);

// Priority levels for case processing
export const casePriorityEnum = pgEnum("case_priority", [
  "routine",
  "expedited",
  "urgent",
  "emergency",
]);

// Document requirement status
export const documentRequirementStatusEnum = pgEnum(
  "document_requirement_status",
  [
    "not_required",
    "required",
    "submitted",
    "verified",
    "rejected",
    "expired",
    "waived",
  ]
);

// Interview types and outcomes
export const interviewTypeEnum = pgEnum("interview_type", [
  "eligibility_assessment",
  "background_verification",
  "document_verification",
  "compliance_check",
  "appeal_hearing",
  "follow_up",
  "virtual",
  "in_person",
]);

// Main immigration cases table
export const immigrationCases = pgTable(
  "immigration_cases",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    // Case identification
    caseNumber: text("case_number").unique().notNull(),
    internalReference: text("internal_reference"),
    governmentFileNumber: text("government_file_number"),
    previousCaseId: text("previous_case_id"),

    // Case details
    caseType: immigrationCaseTypeEnum("case_type").notNull(),
    subCategory: text("sub_category"), // Specific subcategory within case type
    priority: casePriorityEnum("priority").default("routine").notNull(),
    status: immigrationCaseStatusEnum("status").default("draft").notNull(),

    // Case description and context
    title: text("title").notNull(),
    description: text("description"),
    summary: text("summary"),
    objectives: text("objectives"),

    // Applicant information
    primaryApplicantId: text("primary_applicant_id").references(
      () => clients.id
    ),
    dependentApplicants: jsonb("dependent_applicants").$type<
      Array<{
        id?: string; // Reference to clients table if they are also clients
        name: string;
        relationship: string;
        passportNumber: string;
        nationality: string;
        dateOfBirth: string;
        includeInApplication: boolean;
      }>
    >(),

    // Application details
    purposeOfApplication: text("purpose_of_application"),
    intendedStayDuration: text("intended_stay_duration"),
    employerInformation: jsonb("employer_information").$type<{
      companyName: string;
      businessRegistrationNumber: string;
      address: string;
      contactPerson: string;
      phoneNumber: string;
      email: string;
      jobTitle: string;
      salaryOffered: number;
      currency: string;
      startDate: string;
    }>(),

    // Key dates
    applicationDate: date("application_date"),
    submissionDate: date("submission_date"),
    acknowledgmentDate: date("acknowledgment_date"),
    targetDecisionDate: date("target_decision_date"),
    actualDecisionDate: date("actual_decision_date"),
    visaExpiryDate: date("visa_expiry_date"),
    passportExpiryDate: date("passport_expiry_date"),

    // Processing timeline
    processingTime: integer("processing_time"), // Days from submission to decision
    standardProcessingTime: integer("standard_processing_time"), // Expected processing time
    isExpedited: boolean("is_expedited").default(false).notNull(),
    expeditionReason: text("expedition_reason"),

    // Government department handling the case
    governmentDepartment: text("government_department"), // Ministry of Home Affairs, etc.
    processingOffice: text("processing_office"),
    assignedOfficer: text("assigned_officer"),
    officerContactInfo: text("officer_contact_info"),

    // Decision information
    decisionMade: boolean("decision_made").default(false).notNull(),
    decisionType: text("decision_type"), // approved, refused, withdrawn, etc.
    decisionReason: text("decision_reason"),
    decisionNotes: text("decision_notes"),
    conditions:
      jsonb("conditions").$type<
        Array<{
          condition: string;
          description: string;
          mustComplyBy: string;
          isComplied: boolean;
          complianceNotes?: string;
        }>
      >(),

    // Appeal information
    isAppealable: boolean("is_appealable").default(false).notNull(),
    appealDeadline: date("appeal_deadline"),
    appealFiled: boolean("appeal_filed").default(false).notNull(),
    appealCaseId: text("appeal_case_id"),

    // Fees and payments
    applicationFee: text("application_fee"), // Using text for high precision
    expediteFee: text("expedite_fee"),
    additionalFees:
      jsonb("additional_fees").$type<
        Array<{
          description: string;
          amount: string;
          currency: string;
          dueDate?: string;
          paidDate?: string;
          paymentReference?: string;
        }>
      >(),
    totalFeesPaid: text("total_fees_paid"),
    currency: text("currency").default("GYD"),

    // Case management
    assignedTo: text("assigned_to").references(() => users.id),
    assignedTeam: text("assigned_team"),
    consultingLawyer: text("consulting_lawyer"),
    isActive: boolean("is_active").default(true).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),

    // Communication and notes
    internalNotes: text("internal_notes"),
    clientCommunication: text("client_communication"),
    governmentCorrespondence: text("government_correspondence"),

    // Compliance and monitoring
    complianceChecks:
      jsonb("compliance_checks").$type<
        Array<{
          checkType: string;
          dueDate: string;
          completed: boolean;
          completedDate?: string;
          notes?: string;
        }>
      >(),
    monitoringRequired: boolean("monitoring_required").default(false).notNull(),
    nextMonitoringDate: date("next_monitoring_date"),

    // Risk assessment
    riskLevel: text("risk_level").default("low").notNull(),
    riskFactors:
      jsonb("risk_factors").$type<
        Array<{
          factor: string;
          severity: "low" | "medium" | "high";
          description: string;
          mitigation?: string;
        }>
      >(),

    // Additional metadata
    customFields: jsonb("custom_fields").$type<Record<string, any>>(),
    tags: jsonb("tags").$type<string[]>(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
    archivedAt: timestamp("archived_at"),
    archivedBy: text("archived_by").references(() => users.id),
  },
  (table) => [
    index("immigration_cases_org_id_idx").on(table.organizationId),
    index("immigration_cases_client_id_idx").on(table.clientId),
    index("immigration_cases_case_number_idx").on(table.caseNumber),
    index("immigration_cases_case_type_idx").on(table.caseType),
    index("immigration_cases_status_idx").on(table.status),
    index("immigration_cases_priority_idx").on(table.priority),
    index("immigration_cases_assigned_to_idx").on(table.assignedTo),
    index("immigration_cases_application_date_idx").on(table.applicationDate),
    index("immigration_cases_submission_date_idx").on(table.submissionDate),
    index("immigration_cases_target_decision_date_idx").on(
      table.targetDecisionDate
    ),
    index("immigration_cases_visa_expiry_date_idx").on(table.visaExpiryDate),
    index("immigration_cases_government_file_idx").on(
      table.governmentFileNumber
    ),
    index("immigration_cases_previous_case_idx").on(table.previousCaseId),
    index("immigration_cases_primary_applicant_idx").on(
      table.primaryApplicantId
    ),
    index("immigration_cases_is_active_idx").on(table.isActive),
    index("immigration_cases_is_archived_idx").on(table.isArchived),
    index("immigration_cases_created_at_idx").on(table.createdAt),
  ]
);

// Document requirements and checklist for each case
export const immigrationDocumentRequirements = pgTable(
  "immigration_document_requirements",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => immigrationCases.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Document requirement details
    documentType: text("document_type").notNull(), // passport, birth_certificate, etc.
    displayName: text("display_name").notNull(),
    description: text("description"),
    instructions: text("instructions"), // Specific instructions for this document

    // Requirement status
    isRequired: boolean("is_required").default(true).notNull(),
    isConditional: boolean("is_conditional").default(false).notNull(),
    conditionalLogic: text("conditional_logic"), // Conditions under which this is required
    status: documentRequirementStatusEnum("status")
      .default("required")
      .notNull(),

    // Associated documents
    submittedDocumentId: text("submitted_document_id").references(
      () => enhancedDocuments.id
    ),
    alternateDocuments: jsonb("alternate_documents").$type<string[]>(), // Array of document IDs

    // Validation and verification
    verifiedBy: text("verified_by").references(() => users.id),
    verifiedAt: timestamp("verified_at"),
    verificationNotes: text("verification_notes"),
    rejectionReason: text("rejection_reason"),

    // Document specifications
    acceptedFormats: jsonb("accepted_formats").$type<string[]>(), // pdf, jpg, png, etc.
    maxFileSize: integer("max_file_size"), // in MB
    expiryValidationRequired: boolean("expiry_validation_required").default(
      false
    ),
    minimumValidityPeriod: integer("minimum_validity_period"), // months

    // Timestamps and deadlines
    dueDate: date("due_date"),
    submittedAt: timestamp("submitted_at"),
    lastRequestDate: date("last_request_date"),
    reminderSentAt: timestamp("reminder_sent_at"),

    // Priority and ordering
    sortOrder: integer("sort_order").default(0).notNull(),
    isUrgent: boolean("is_urgent").default(false).notNull(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    unique("immigration_doc_req_case_type_unique").on(
      table.caseId,
      table.documentType
    ),
    index("immigration_doc_req_case_id_idx").on(table.caseId),
    index("immigration_doc_req_org_id_idx").on(table.organizationId),
    index("immigration_doc_req_status_idx").on(table.status),
    index("immigration_doc_req_document_id_idx").on(table.submittedDocumentId),
    index("immigration_doc_req_verified_by_idx").on(table.verifiedBy),
    index("immigration_doc_req_due_date_idx").on(table.dueDate),
    index("immigration_doc_req_sort_order_idx").on(table.sortOrder),
    index("immigration_doc_req_is_urgent_idx").on(table.isUrgent),
  ]
);

// Case timeline and status history
export const immigrationTimeline = pgTable(
  "immigration_timeline",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => immigrationCases.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Timeline event details
    eventType: text("event_type").notNull(), // status_change, document_submitted, interview, etc.
    eventTitle: text("event_title").notNull(),
    eventDescription: text("event_description"),

    // Status tracking
    previousStatus: immigrationCaseStatusEnum("previous_status"),
    newStatus: immigrationCaseStatusEnum("new_status"),
    statusReason: text("status_reason"),

    // Event metadata
    eventDate: timestamp("event_date").defaultNow().notNull(),
    scheduledDate: timestamp("scheduled_date"), // For future events
    isScheduled: boolean("is_scheduled").default(false).notNull(),
    isCompleted: boolean("is_completed").default(true).notNull(),
    isMilestone: boolean("is_milestone").default(false).notNull(),

    // Associated data
    documentIds: jsonb("document_ids").$type<string[]>(), // Related documents
    relatedCommunication: text("related_communication"),
    externalReference: text("external_reference"), // Government reference

    // People involved
    performedBy: text("performed_by").references(() => users.id),
    involvedParties:
      jsonb("involved_parties").$type<
        Array<{
          name: string;
          role: string;
          organization?: string;
          contactInfo?: string;
        }>
      >(),

    // Impact and consequences
    impact: text("impact"), // Description of impact on the case
    nextSteps: text("next_steps"),
    actionRequired: boolean("action_required").default(false).notNull(),
    actionDueDate: date("action_due_date"),
    responsiblePerson: text("responsible_person").references(() => users.id),

    // Additional context
    governmentCorrespondence: boolean("government_correspondence").default(
      false
    ),
    clientNotified: boolean("client_notified").default(false).notNull(),
    clientNotifiedAt: timestamp("client_notified_at"),
    internalNote: text("internal_note"),
    publicNote: text("public_note"), // Visible to client

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    index("immigration_timeline_case_id_idx").on(table.caseId),
    index("immigration_timeline_org_id_idx").on(table.organizationId),
    index("immigration_timeline_event_type_idx").on(table.eventType),
    index("immigration_timeline_event_date_idx").on(table.eventDate),
    index("immigration_timeline_scheduled_date_idx").on(table.scheduledDate),
    index("immigration_timeline_is_milestone_idx").on(table.isMilestone),
    index("immigration_timeline_action_required_idx").on(table.actionRequired),
    index("immigration_timeline_responsible_person_idx").on(
      table.responsiblePerson
    ),
    index("immigration_timeline_client_notified_idx").on(table.clientNotified),
    index("immigration_timeline_created_at_idx").on(table.createdAt),
  ]
);

// Interview scheduling and management
export const immigrationInterviews = pgTable(
  "immigration_interviews",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => immigrationCases.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Interview details
    interviewType: interviewTypeEnum("interview_type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    purpose: text("purpose"),

    // Scheduling
    scheduledDateTime: timestamp("scheduled_date_time").notNull(),
    duration: integer("duration").default(60).notNull(), // minutes
    location: text("location"),
    isVirtual: boolean("is_virtual").default(false).notNull(),
    meetingLink: text("meeting_link"),
    meetingPassword: text("meeting_password"),

    // Participants
    interviewer: text("interviewer"),
    interviewerTitle: text("interviewer_title"),
    interviewerContact: text("interviewer_contact"),
    attendees:
      jsonb("attendees").$type<
        Array<{
          name: string;
          role: string;
          attendance: "required" | "optional";
          confirmed: boolean;
          actualAttendance?: "attended" | "absent" | "late";
        }>
      >(),

    // Preparation and requirements
    requiredDocuments: jsonb("required_documents").$type<string[]>(), // Document types to bring
    preparationInstructions: text("preparation_instructions"),
    languageSupport: text("language_support"), // Interpreter requirements
    specialAccommodations: text("special_accommodations"),

    // Interview outcomes
    isCompleted: boolean("is_completed").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    actualDuration: integer("actual_duration"), // minutes
    outcome: text("outcome"), // passed, failed, requires_followup, etc.
    interviewNotes: text("interview_notes"),
    interviewerRecommendation: text("interviewer_recommendation"),

    // Follow-up actions
    followUpRequired: boolean("follow_up_required").default(false).notNull(),
    followUpDate: date("follow_up_date"),
    followUpNotes: text("follow_up_notes"),
    additionalDocsRequired: jsonb("additional_docs_required").$type<string[]>(),

    // Status tracking
    status: text("status").default("scheduled").notNull(), // scheduled, confirmed, completed, cancelled, rescheduled
    cancellationReason: text("cancellation_reason"),
    rescheduledFromId: text("rescheduled_from_id"),
    rescheduledToId: text("rescheduled_to_id"),

    // Notifications
    reminderSent: boolean("reminder_sent").default(false).notNull(),
    reminderSentAt: timestamp("reminder_sent_at"),
    confirmationReceived: boolean("confirmation_received")
      .default(false)
      .notNull(),
    confirmationReceivedAt: timestamp("confirmation_received_at"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("immigration_interviews_case_id_idx").on(table.caseId),
    index("immigration_interviews_org_id_idx").on(table.organizationId),
    index("immigration_interviews_type_idx").on(table.interviewType),
    index("immigration_interviews_scheduled_datetime_idx").on(
      table.scheduledDateTime
    ),
    index("immigration_interviews_status_idx").on(table.status),
    index("immigration_interviews_is_completed_idx").on(table.isCompleted),
    index("immigration_interviews_follow_up_required_idx").on(
      table.followUpRequired
    ),
    index("immigration_interviews_rescheduled_from_idx").on(
      table.rescheduledFromId
    ),
    index("immigration_interviews_created_at_idx").on(table.createdAt),
  ]
);

// Case communication and correspondence tracking
export const immigrationCorrespondence = pgTable(
  "immigration_correspondence",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id")
      .notNull()
      .references(() => immigrationCases.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Correspondence details
    correspondenceType: text("correspondence_type").notNull(), // email, letter, phone, fax, in_person
    direction: text("direction").notNull(), // inbound, outbound
    subject: text("subject").notNull(),
    content: text("content"),
    summary: text("summary"),

    // Parties involved
    fromParty: text("from_party").notNull(),
    toParty: text("to_party").notNull(),
    ccParties: jsonb("cc_parties").$type<string[]>(),
    isGovernmentCorrespondence: boolean("is_government_correspondence").default(
      false
    ),
    governmentOfficer: text("government_officer"),

    // Message details
    sentDateTime: timestamp("sent_date_time"),
    receivedDateTime: timestamp("received_date_time"),
    deliveryMethod: text("delivery_method"), // email, mail, hand_delivered, fax
    trackingNumber: text("tracking_number"), // For postal/courier deliveries

    // Associated documents and attachments
    attachmentIds: jsonb("attachment_ids").$type<string[]>(), // References to documents
    hasAttachments: boolean("has_attachments").default(false).notNull(),

    // Response and follow-up
    requiresResponse: boolean("requires_response").default(false).notNull(),
    responseDeadline: date("response_deadline"),
    hasBeenResponded: boolean("has_been_responded").default(false).notNull(),
    responseId: text("response_id"),
    inResponseToId: text("in_response_to_id"),

    // Priority and urgency
    isUrgent: boolean("is_urgent").default(false).notNull(),
    priority: text("priority").default("normal").notNull(),

    // Status and processing
    status: text("status").default("received").notNull(), // received, read, processed, archived
    readBy: text("read_by").references(() => users.id),
    readAt: timestamp("read_at"),
    processedBy: text("processed_by").references(() => users.id),
    processedAt: timestamp("processed_at"),

    // Impact on case
    impactOnCase: text("impact_on_case"),
    actionRequired: boolean("action_required").default(false).notNull(),
    actionTaken: text("action_taken"),

    // Tags and classification
    tags: jsonb("tags").$type<string[]>(),
    isConfidential: boolean("is_confidential").default(false).notNull(),
    isClientVisible: boolean("is_client_visible").default(true).notNull(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("immigration_correspondence_case_id_idx").on(table.caseId),
    index("immigration_correspondence_org_id_idx").on(table.organizationId),
    index("immigration_correspondence_type_idx").on(table.correspondenceType),
    index("immigration_correspondence_direction_idx").on(table.direction),
    index("immigration_correspondence_sent_datetime_idx").on(
      table.sentDateTime
    ),
    index("immigration_correspondence_requires_response_idx").on(
      table.requiresResponse
    ),
    index("immigration_correspondence_is_urgent_idx").on(table.isUrgent),
    index("immigration_correspondence_status_idx").on(table.status),
    index("immigration_correspondence_action_required_idx").on(
      table.actionRequired
    ),
    index("immigration_correspondence_response_id_idx").on(table.responseId),
    index("immigration_correspondence_in_response_to_idx").on(
      table.inResponseToId
    ),
    index("immigration_correspondence_created_at_idx").on(table.createdAt),
  ]
);

// Relations
export const immigrationCasesRelations = relations(
  immigrationCases,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [immigrationCases.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [immigrationCases.clientId],
      references: [clients.id],
    }),
    primaryApplicant: one(clients, {
      fields: [immigrationCases.primaryApplicantId],
      references: [clients.id],
      relationName: "primaryApplicant",
    }),
    previousCase: one(immigrationCases, {
      fields: [immigrationCases.previousCaseId],
      references: [immigrationCases.id],
      relationName: "previousCase",
    }),
    subsequentCases: many(immigrationCases, {
      relationName: "previousCase",
    }),
    appealCase: one(immigrationCases, {
      fields: [immigrationCases.appealCaseId],
      references: [immigrationCases.id],
      relationName: "appealCase",
    }),
    assignedToUser: one(users, {
      fields: [immigrationCases.assignedTo],
      references: [users.id],
      relationName: "caseAssignedTo",
    }),
    createdByUser: one(users, {
      fields: [immigrationCases.createdBy],
      references: [users.id],
      relationName: "caseCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [immigrationCases.updatedBy],
      references: [users.id],
      relationName: "caseUpdatedBy",
    }),
    archivedByUser: one(users, {
      fields: [immigrationCases.archivedBy],
      references: [users.id],
      relationName: "caseArchivedBy",
    }),
    documentRequirements: many(immigrationDocumentRequirements),
    timeline: many(immigrationTimeline),
    interviews: many(immigrationInterviews),
    correspondence: many(immigrationCorrespondence),
  })
);

export const immigrationDocumentRequirementsRelations = relations(
  immigrationDocumentRequirements,
  ({ one }) => ({
    case: one(immigrationCases, {
      fields: [immigrationDocumentRequirements.caseId],
      references: [immigrationCases.id],
    }),
    organization: one(organizations, {
      fields: [immigrationDocumentRequirements.organizationId],
      references: [organizations.id],
    }),
    submittedDocument: one(enhancedDocuments, {
      fields: [immigrationDocumentRequirements.submittedDocumentId],
      references: [enhancedDocuments.id],
    }),
    verifiedByUser: one(users, {
      fields: [immigrationDocumentRequirements.verifiedBy],
      references: [users.id],
      relationName: "docRequirementVerifiedBy",
    }),
    createdByUser: one(users, {
      fields: [immigrationDocumentRequirements.createdBy],
      references: [users.id],
      relationName: "docRequirementCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [immigrationDocumentRequirements.updatedBy],
      references: [users.id],
      relationName: "docRequirementUpdatedBy",
    }),
  })
);

export const immigrationTimelineRelations = relations(
  immigrationTimeline,
  ({ one }) => ({
    case: one(immigrationCases, {
      fields: [immigrationTimeline.caseId],
      references: [immigrationCases.id],
    }),
    organization: one(organizations, {
      fields: [immigrationTimeline.organizationId],
      references: [organizations.id],
    }),
    performedByUser: one(users, {
      fields: [immigrationTimeline.performedBy],
      references: [users.id],
      relationName: "timelinePerformedBy",
    }),
    responsiblePersonUser: one(users, {
      fields: [immigrationTimeline.responsiblePerson],
      references: [users.id],
      relationName: "timelineResponsiblePerson",
    }),
    createdByUser: one(users, {
      fields: [immigrationTimeline.createdBy],
      references: [users.id],
      relationName: "timelineCreatedBy",
    }),
  })
);

export const immigrationInterviewsRelations = relations(
  immigrationInterviews,
  ({ one }) => ({
    case: one(immigrationCases, {
      fields: [immigrationInterviews.caseId],
      references: [immigrationCases.id],
    }),
    organization: one(organizations, {
      fields: [immigrationInterviews.organizationId],
      references: [organizations.id],
    }),
    rescheduledFromInterview: one(immigrationInterviews, {
      fields: [immigrationInterviews.rescheduledFromId],
      references: [immigrationInterviews.id],
      relationName: "rescheduledFrom",
    }),
    rescheduledToInterview: one(immigrationInterviews, {
      fields: [immigrationInterviews.rescheduledToId],
      references: [immigrationInterviews.id],
      relationName: "rescheduledTo",
    }),
    createdByUser: one(users, {
      fields: [immigrationInterviews.createdBy],
      references: [users.id],
      relationName: "interviewCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [immigrationInterviews.updatedBy],
      references: [users.id],
      relationName: "interviewUpdatedBy",
    }),
  })
);

export const immigrationCorrespondenceRelations = relations(
  immigrationCorrespondence,
  ({ one }) => ({
    case: one(immigrationCases, {
      fields: [immigrationCorrespondence.caseId],
      references: [immigrationCases.id],
    }),
    organization: one(organizations, {
      fields: [immigrationCorrespondence.organizationId],
      references: [organizations.id],
    }),
    response: one(immigrationCorrespondence, {
      fields: [immigrationCorrespondence.responseId],
      references: [immigrationCorrespondence.id],
      relationName: "response",
    }),
    inResponseTo: one(immigrationCorrespondence, {
      fields: [immigrationCorrespondence.inResponseToId],
      references: [immigrationCorrespondence.id],
      relationName: "inResponseTo",
    }),
    readByUser: one(users, {
      fields: [immigrationCorrespondence.readBy],
      references: [users.id],
      relationName: "correspondenceReadBy",
    }),
    processedByUser: one(users, {
      fields: [immigrationCorrespondence.processedBy],
      references: [users.id],
      relationName: "correspondenceProcessedBy",
    }),
    createdByUser: one(users, {
      fields: [immigrationCorrespondence.createdBy],
      references: [users.id],
      relationName: "correspondenceCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [immigrationCorrespondence.updatedBy],
      references: [users.id],
      relationName: "correspondenceUpdatedBy",
    }),
  })
);
