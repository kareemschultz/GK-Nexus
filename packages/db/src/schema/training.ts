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

// Training category enum
export const trainingCategoryEnum = pgEnum("training_category", [
  "FINANCIAL_LITERACY",
  "TAX_COMPLIANCE",
  "BUSINESS_REGISTRATION",
  "PAYROLL_MANAGEMENT",
  "NIS_COMPLIANCE",
  "IMMIGRATION_PROCEDURES",
  "PARALEGAL",
  "COMPUTER_APPLICATIONS",
  "PROFESSIONAL_DEVELOPMENT",
  "LEADERSHIP",
  "CUSTOMER_SERVICE",
  "WORKPLACE_SAFETY",
  "INDUSTRY_SPECIFIC",
  "OTHER",
]);

// Delivery mode enum
export const deliveryModeEnum = pgEnum("delivery_mode", [
  "IN_PERSON",
  "VIRTUAL",
  "HYBRID",
  "SELF_PACED",
  "WORKSHOP",
  "WEBINAR",
  "CONFERENCE",
]);

// Course status enum
export const courseStatusEnum = pgEnum("course_status", [
  "DRAFT",
  "PUBLISHED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]);

// Registration status enum
export const registrationStatusEnum = pgEnum("registration_status", [
  "PENDING",
  "CONFIRMED",
  "WAITLISTED",
  "CANCELLED",
  "COMPLETED",
  "NO_SHOW",
]);

// Certificate status enum
export const certificateStatusEnum = pgEnum("certificate_status", [
  "PENDING",
  "ISSUED",
  "EXPIRED",
  "REVOKED",
]);

// Training courses/programs
export const trainingCourses = pgTable(
  "training_courses",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Course identification
    courseCode: text("course_code").notNull(),
    title: text("title").notNull(),
    shortDescription: text("short_description"),
    fullDescription: text("full_description"),
    category: trainingCategoryEnum("category").notNull(),
    status: courseStatusEnum("status").default("DRAFT").notNull(),

    // Course details
    deliveryMode: deliveryModeEnum("delivery_mode").notNull(),
    durationHours: decimal("duration_hours", { precision: 10, scale: 2 }),
    durationDays: integer("duration_days"),
    maxParticipants: integer("max_participants"),
    minParticipants: integer("min_participants"),

    // Objectives and outcomes
    learningObjectives: jsonb("learning_objectives"),
    targetAudience: text("target_audience"),
    prerequisites: text("prerequisites"),
    skillsGained: jsonb("skills_gained"),

    // Pricing
    price: decimal("price", { precision: 15, scale: 2 }),
    earlyBirdPrice: decimal("early_bird_price", { precision: 15, scale: 2 }),
    groupDiscountPercent: decimal("group_discount_percent", {
      precision: 5,
      scale: 2,
    }),
    currency: text("currency").default("GYD").notNull(),

    // Content
    syllabus: jsonb("syllabus"),
    materials: jsonb("materials"),
    resources: jsonb("resources"),
    assessmentMethods: jsonb("assessment_methods"),

    // Certification
    certificateAwarded: boolean("certificate_awarded").default(true),
    certificateTemplate: text("certificate_template"),
    certificateValidityMonths: integer("certificate_validity_months"),
    cpdPoints: integer("cpd_points"),

    // Instructor
    defaultInstructorId: text("default_instructor_id").references(
      () => users.id
    ),
    instructorRequirements: text("instructor_requirements"),

    // Display
    thumbnailUrl: text("thumbnail_url"),
    featuredImage: text("featured_image"),
    isPublic: boolean("is_public").default(true),
    isFeatured: boolean("is_featured").default(false),
    displayOrder: integer("display_order").default(0),

    // Metadata
    tags: jsonb("tags"),
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
    index("training_courses_org_idx").on(table.organizationId),
    index("training_courses_code_idx").on(table.courseCode),
    index("training_courses_category_idx").on(table.category),
    index("training_courses_status_idx").on(table.status),
    index("training_courses_mode_idx").on(table.deliveryMode),
    index("training_courses_public_idx").on(table.isPublic),
  ]
);

// Course sessions/instances
export const trainingSessions = pgTable(
  "training_sessions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => trainingCourses.id),

    // Session identification
    sessionCode: text("session_code").notNull(),
    title: text("title"),
    status: courseStatusEnum("status").default("SCHEDULED").notNull(),

    // Schedule
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    timezone: text("timezone").default("America/Guyana").notNull(),
    scheduleNotes: text("schedule_notes"),

    // Location
    deliveryMode: deliveryModeEnum("delivery_mode").notNull(),
    venueName: text("venue_name"),
    venueAddress: text("venue_address"),
    roomNumber: text("room_number"),
    virtualMeetingUrl: text("virtual_meeting_url"),
    virtualPlatform: text("virtual_platform"),
    meetingId: text("meeting_id"),
    meetingPassword: text("meeting_password"),

    // Capacity
    maxParticipants: integer("max_participants"),
    minParticipants: integer("min_participants"),
    currentEnrollment: integer("current_enrollment").default(0),
    waitlistCount: integer("waitlist_count").default(0),

    // Registration
    registrationOpens: timestamp("registration_opens"),
    registrationCloses: timestamp("registration_closes"),
    earlyBirdDeadline: timestamp("early_bird_deadline"),
    isRegistrationOpen: boolean("is_registration_open").default(true),

    // Pricing override
    priceOverride: decimal("price_override", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),

    // Instructor
    instructorId: text("instructor_id").references(() => users.id),
    coInstructorIds: jsonb("co_instructor_ids"),

    // Materials
    sessionMaterials: jsonb("session_materials"),
    recordingUrl: text("recording_url"),

    // Notes
    internalNotes: text("internal_notes"),
    publicNotes: text("public_notes"),

    // Metadata
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
    index("training_sessions_org_idx").on(table.organizationId),
    index("training_sessions_course_idx").on(table.courseId),
    index("training_sessions_code_idx").on(table.sessionCode),
    index("training_sessions_status_idx").on(table.status),
    index("training_sessions_start_date_idx").on(table.startDate),
    index("training_sessions_instructor_idx").on(table.instructorId),
    index("training_sessions_registration_idx").on(table.isRegistrationOpen),
  ]
);

// Training registrations
export const trainingRegistrations = pgTable(
  "training_registrations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    sessionId: text("session_id")
      .notNull()
      .references(() => trainingSessions.id),
    clientId: text("client_id").references(() => clients.id),

    // Registration identification
    registrationNumber: text("registration_number").notNull(),
    status: registrationStatusEnum("status").default("PENDING").notNull(),

    // Participant details (can be different from client)
    participantName: text("participant_name").notNull(),
    participantEmail: text("participant_email").notNull(),
    participantPhone: text("participant_phone"),
    participantOrganization: text("participant_organization"),
    participantTitle: text("participant_title"),

    // Dietary and accessibility
    dietaryRequirements: text("dietary_requirements"),
    accessibilityRequirements: text("accessibility_requirements"),
    specialRequests: text("special_requests"),

    // Payment
    amountDue: decimal("amount_due", { precision: 15, scale: 2 }).notNull(),
    amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }).default(
      "0"
    ),
    discountApplied: decimal("discount_applied", {
      precision: 15,
      scale: 2,
    }).default("0"),
    discountReason: text("discount_reason"),
    currency: text("currency").default("GYD").notNull(),
    paymentStatus: text("payment_status").default("pending"),
    paymentReference: text("payment_reference"),
    invoiceNumber: text("invoice_number"),

    // Attendance
    attendanceStatus: text("attendance_status"),
    checkInTime: timestamp("check_in_time"),
    checkOutTime: timestamp("check_out_time"),
    attendancePercentage: decimal("attendance_percentage", {
      precision: 5,
      scale: 2,
    }),

    // Assessment
    assessmentScore: decimal("assessment_score", { precision: 5, scale: 2 }),
    assessmentPassed: boolean("assessment_passed"),
    assessmentNotes: text("assessment_notes"),

    // Certificate
    certificateIssued: boolean("certificate_issued").default(false),
    certificateId: text("certificate_id"),
    certificateIssuedDate: timestamp("certificate_issued_date"),

    // Feedback
    feedbackProvided: boolean("feedback_provided").default(false),
    feedbackRating: integer("feedback_rating"),
    feedbackComments: text("feedback_comments"),

    // Group booking
    groupBookingId: text("group_booking_id"),
    isGroupLeader: boolean("is_group_leader").default(false),

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
    registeredBy: text("registered_by").references(() => users.id),
  },
  (table) => [
    index("training_registrations_org_idx").on(table.organizationId),
    index("training_registrations_session_idx").on(table.sessionId),
    index("training_registrations_client_idx").on(table.clientId),
    index("training_registrations_status_idx").on(table.status),
    index("training_registrations_number_idx").on(table.registrationNumber),
    index("training_registrations_email_idx").on(table.participantEmail),
    index("training_registrations_payment_idx").on(table.paymentStatus),
  ]
);

// Training certificates
export const trainingCertificates = pgTable(
  "training_certificates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    registrationId: text("registration_id")
      .notNull()
      .references(() => trainingRegistrations.id),
    courseId: text("course_id")
      .notNull()
      .references(() => trainingCourses.id),
    sessionId: text("session_id")
      .notNull()
      .references(() => trainingSessions.id),

    // Certificate identification
    certificateNumber: text("certificate_number").notNull(),
    status: certificateStatusEnum("status").default("PENDING").notNull(),

    // Recipient details
    recipientName: text("recipient_name").notNull(),
    recipientEmail: text("recipient_email"),
    recipientOrganization: text("recipient_organization"),

    // Certificate details
    courseTitle: text("course_title").notNull(),
    completionDate: timestamp("completion_date").notNull(),
    issueDate: timestamp("issue_date"),
    expiryDate: timestamp("expiry_date"),

    // Achievement
    finalScore: decimal("final_score", { precision: 5, scale: 2 }),
    grade: text("grade"),
    cpdPoints: integer("cpd_points"),
    hoursCompleted: decimal("hours_completed", { precision: 10, scale: 2 }),

    // Signatures
    instructorName: text("instructor_name"),
    instructorSignature: text("instructor_signature"),
    authorizedSignatory: text("authorized_signatory"),
    authorizedSignature: text("authorized_signature"),

    // Document
    certificateUrl: text("certificate_url"),
    verificationUrl: text("verification_url"),
    verificationCode: text("verification_code"),

    // Metadata
    metadata: jsonb("metadata"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    issuedBy: text("issued_by").references(() => users.id),
  },
  (table) => [
    index("training_certificates_org_idx").on(table.organizationId),
    index("training_certificates_registration_idx").on(table.registrationId),
    index("training_certificates_course_idx").on(table.courseId),
    index("training_certificates_status_idx").on(table.status),
    index("training_certificates_number_idx").on(table.certificateNumber),
    index("training_certificates_verification_idx").on(table.verificationCode),
    index("training_certificates_expiry_idx").on(table.expiryDate),
  ]
);

// Training instructors
export const trainingInstructors = pgTable(
  "training_instructors",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id),

    // Instructor details
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),

    // Professional details
    title: text("title"),
    biography: text("biography"),
    specializations: jsonb("specializations"),
    qualifications: jsonb("qualifications"),
    certifications: jsonb("certifications"),
    yearsExperience: integer("years_experience"),

    // Categories they can teach
    teachingCategories: jsonb("teaching_categories"),

    // Profile
    profileImageUrl: text("profile_image_url"),
    linkedInUrl: text("linkedin_url"),

    // Rates
    hourlyRate: decimal("hourly_rate", { precision: 15, scale: 2 }),
    dailyRate: decimal("daily_rate", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),

    // Availability
    isAvailable: boolean("is_available").default(true).notNull(),
    availabilityNotes: text("availability_notes"),

    // Performance
    totalSessionsTaught: integer("total_sessions_taught").default(0),
    averageRating: decimal("average_rating", { precision: 3, scale: 2 }),
    totalReviews: integer("total_reviews").default(0),

    // Status
    isActive: boolean("is_active").default(true).notNull(),
    isExternal: boolean("is_external").default(false),

    // Metadata
    metadata: jsonb("metadata"),
    notes: text("notes"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("training_instructors_org_idx").on(table.organizationId),
    index("training_instructors_user_idx").on(table.userId),
    index("training_instructors_email_idx").on(table.email),
    index("training_instructors_active_idx").on(table.isActive),
    index("training_instructors_available_idx").on(table.isAvailable),
  ]
);

// Relations
export const trainingCoursesRelations = relations(
  trainingCourses,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [trainingCourses.organizationId],
      references: [organizations.id],
    }),
    defaultInstructor: one(users, {
      fields: [trainingCourses.defaultInstructorId],
      references: [users.id],
    }),
    sessions: many(trainingSessions),
    certificates: many(trainingCertificates),
  })
);

export const trainingSessionsRelations = relations(
  trainingSessions,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [trainingSessions.organizationId],
      references: [organizations.id],
    }),
    course: one(trainingCourses, {
      fields: [trainingSessions.courseId],
      references: [trainingCourses.id],
    }),
    instructor: one(users, {
      fields: [trainingSessions.instructorId],
      references: [users.id],
    }),
    registrations: many(trainingRegistrations),
    certificates: many(trainingCertificates),
  })
);

export const trainingRegistrationsRelations = relations(
  trainingRegistrations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [trainingRegistrations.organizationId],
      references: [organizations.id],
    }),
    session: one(trainingSessions, {
      fields: [trainingRegistrations.sessionId],
      references: [trainingSessions.id],
    }),
    client: one(clients, {
      fields: [trainingRegistrations.clientId],
      references: [clients.id],
    }),
  })
);

export const trainingCertificatesRelations = relations(
  trainingCertificates,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [trainingCertificates.organizationId],
      references: [organizations.id],
    }),
    registration: one(trainingRegistrations, {
      fields: [trainingCertificates.registrationId],
      references: [trainingRegistrations.id],
    }),
    course: one(trainingCourses, {
      fields: [trainingCertificates.courseId],
      references: [trainingCourses.id],
    }),
    session: one(trainingSessions, {
      fields: [trainingCertificates.sessionId],
      references: [trainingSessions.id],
    }),
  })
);

export const trainingInstructorsRelations = relations(
  trainingInstructors,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [trainingInstructors.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [trainingInstructors.userId],
      references: [users.id],
    }),
  })
);
