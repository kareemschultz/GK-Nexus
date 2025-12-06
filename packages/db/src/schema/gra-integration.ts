import { relations } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
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
import { organizations } from "./organizations";
import { users } from "./users";

// GRA submission status enum
export const graSubmissionStatusEnum = pgEnum("gra_submission_status", [
  "draft",
  "validating",
  "validated",
  "submitting",
  "submitted",
  "processing",
  "accepted",
  "rejected",
  "amended",
  "cancelled",
  "error",
]);

// GRA filing types
export const graFilingTypeEnum = pgEnum("gra_filing_type", [
  "paye_monthly",
  "paye_annual",
  "vat_monthly",
  "vat_quarterly",
  "vat_annual",
  "corporate_tax",
  "withholding_tax",
  "nis_monthly",
  "nis_annual",
  "stamp_duty",
  "land_tax",
  "customs_declaration",
  "excise_tax",
  "other",
]);

// API endpoint categories
export const graApiEndpointEnum = pgEnum("gra_api_endpoint", [
  "authentication",
  "taxpayer_info",
  "filing_submit",
  "filing_status",
  "payment_info",
  "tax_rates",
  "compliance_check",
  "document_upload",
  "amendment",
  "refund_request",
  "penalty_info",
  "certificate_request",
]);

// GRA API response cache for performance optimization
export const graApiCache = pgTable(
  "gra_api_cache",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Request identification
    endpoint: graApiEndpointEnum("endpoint").notNull(),
    requestMethod: text("request_method").notNull(), // GET, POST, PUT, DELETE
    requestUrl: text("request_url").notNull(),
    requestHash: text("request_hash").notNull(), // SHA-256 of request params

    // Request details
    requestHeaders: jsonb("request_headers").$type<Record<string, string>>(),
    requestBody: jsonb("request_body"),
    requestParams: jsonb("request_params").$type<Record<string, any>>(),

    // Response details
    responseStatus: integer("response_status").notNull(), // HTTP status code
    responseHeaders: jsonb("response_headers").$type<Record<string, string>>(),
    responseData: jsonb("response_data"),
    responseSize: integer("response_size"), // Size in bytes

    // Cache metadata
    cacheKey: text("cache_key").notNull(),
    ttl: integer("ttl").notNull(), // Time to live in seconds
    cachedAt: timestamp("cached_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
    accessCount: integer("access_count").default(0).notNull(),

    // Request context
    requestedBy: text("requested_by").references(() => users.id),
    clientId: text("client_id").references(() => clients.id), // Associated client if applicable

    // Error handling
    isError: boolean("is_error").default(false).notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique("gra_api_cache_org_hash_unique").on(
      table.organizationId,
      table.requestHash
    ),
    index("gra_api_cache_org_id_idx").on(table.organizationId),
    index("gra_api_cache_endpoint_idx").on(table.endpoint),
    index("gra_api_cache_cache_key_idx").on(table.cacheKey),
    index("gra_api_cache_expires_at_idx").on(table.expiresAt),
    index("gra_api_cache_created_at_idx").on(table.createdAt),
    index("gra_api_cache_is_error_idx").on(table.isError),
    index("gra_api_cache_client_id_idx").on(table.clientId),
  ]
);

// GRA submissions tracking for all filing types
export const graSubmissions = pgTable(
  "gra_submissions",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "cascade" }),

    // Filing identification
    filingType: graFilingTypeEnum("filing_type").notNull(),
    taxYear: integer("tax_year").notNull(),
    taxPeriod: text("tax_period"), // e.g., "2024-Q1", "2024-01", "2024"
    referenceNumber: text("reference_number"), // Internal reference
    graReferenceNumber: text("gra_reference_number"), // GRA-assigned reference

    // Submission data
    submissionData: jsonb("submission_data").notNull(), // Complete filing data
    originalData: jsonb("original_data"), // Pre-processed data for audit trail
    validationResults: jsonb("validation_results").$type<{
      isValid: boolean;
      errors: Array<{
        field: string;
        message: string;
        code: string;
      }>;
      warnings: Array<{
        field: string;
        message: string;
        code: string;
      }>;
    }>(),

    // Submission status and tracking
    status: graSubmissionStatusEnum("status").default("draft").notNull(),
    submissionAttempts: integer("submission_attempts").default(0).notNull(),
    lastSubmissionAttempt: timestamp("last_submission_attempt"),

    // Key timestamps
    submittedAt: timestamp("submitted_at"),
    processedAt: timestamp("processed_at"),
    acceptedAt: timestamp("accepted_at"),
    rejectedAt: timestamp("rejected_at"),

    // GRA response details
    graResponse: jsonb("gra_response").$type<{
      status: string;
      message?: string;
      errors?: Array<{
        code: string;
        message: string;
        field?: string;
      }>;
      warnings?: Array<{
        code: string;
        message: string;
        field?: string;
      }>;
      transactionId?: string;
      receiptNumber?: string;
      acknowledgmentPdf?: string;
    }>(),

    // Payment information
    paymentRequired: boolean("payment_required").default(false).notNull(),
    paymentAmount: text("payment_amount"), // Using text for high precision
    paymentDueDate: timestamp("payment_due_date"),
    paymentStatus: text("payment_status"), // pending, paid, overdue, waived
    paymentReference: text("payment_reference"),
    paymentConfirmation: jsonb("payment_confirmation"),

    // Amendment tracking
    isAmendment: boolean("is_amendment").default(false).notNull(),
    originalSubmissionId: text("original_submission_id").references(
      (): AnyPgColumn => graSubmissions.id
    ),
    amendmentReason: text("amendment_reason"),
    amendmentNotes: text("amendment_notes"),

    // Compliance and penalty tracking
    dueDate: timestamp("due_date"),
    isLate: boolean("is_late").default(false).notNull(),
    penaltyAmount: text("penalty_amount"),
    interestAmount: text("interest_amount"),
    penaltyWaived: boolean("penalty_waived").default(false).notNull(),
    waiver_reason: text("waiver_reason"),

    // Document attachments
    attachedDocuments:
      jsonb("attached_documents").$type<
        Array<{
          id: string;
          name: string;
          type: string;
          size: number;
          url?: string;
          required: boolean;
          graDocumentId?: string;
        }>
      >(),

    // Processing metadata
    processingNotes: text("processing_notes"),
    internalNotes: text("internal_notes"),
    reviewRequired: boolean("review_required").default(false).notNull(),
    reviewedBy: text("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),

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
    submittedBy: text("submitted_by").references(() => users.id),
  },
  (table) => [
    index("gra_submissions_org_id_idx").on(table.organizationId),
    index("gra_submissions_client_id_idx").on(table.clientId),
    index("gra_submissions_filing_type_idx").on(table.filingType),
    index("gra_submissions_status_idx").on(table.status),
    index("gra_submissions_tax_year_idx").on(table.taxYear),
    index("gra_submissions_reference_number_idx").on(table.referenceNumber),
    index("gra_submissions_gra_reference_idx").on(table.graReferenceNumber),
    index("gra_submissions_due_date_idx").on(table.dueDate),
    index("gra_submissions_submitted_at_idx").on(table.submittedAt),
    index("gra_submissions_is_amendment_idx").on(table.isAmendment),
    index("gra_submissions_payment_required_idx").on(table.paymentRequired),
    index("gra_submissions_review_required_idx").on(table.reviewRequired),
    index("gra_submissions_original_submission_idx").on(
      table.originalSubmissionId
    ),
    index("gra_submissions_created_at_idx").on(table.createdAt),
  ]
);

// GRA API credentials and connection management
export const graConnections = pgTable(
  "gra_connections",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Connection details
    connectionName: text("connection_name").notNull(),
    environment: text("environment").notNull(), // sandbox, production
    baseUrl: text("base_url").notNull(),

    // Authentication credentials (encrypted)
    clientId: text("client_id"),
    clientSecret: text("client_secret"), // Encrypted
    apiKey: text("api_key"), // Encrypted
    certificatePath: text("certificate_path"),

    // Connection status
    isActive: boolean("is_active").default(false).notNull(),
    connectionStatus: text("connection_status")
      .default("disconnected")
      .notNull(),
    lastConnectedAt: timestamp("last_connected_at"),
    lastConnectionAttempt: timestamp("last_connection_attempt"),
    connectionFailures: integer("connection_failures").default(0).notNull(),

    // Rate limiting and quotas
    rateLimitPerMinute: integer("rate_limit_per_minute").default(60),
    rateLimitPerDay: integer("rate_limit_per_day").default(1000),
    currentUsageToday: integer("current_usage_today").default(0),
    quotaResetDate: timestamp("quota_reset_date"),

    // Connection health monitoring
    healthCheckInterval: integer("health_check_interval").default(300), // seconds
    lastHealthCheck: timestamp("last_health_check"),
    healthStatus: text("health_status").default("unknown"), // healthy, degraded, down, unknown
    healthCheckFailures: integer("health_check_failures").default(0),

    // Configuration and metadata
    configuration: jsonb("configuration").$type<{
      timeout: number;
      retryAttempts: number;
      retryDelay: number;
      enableLogging: boolean;
      enableCaching: boolean;
      cacheTtl: number;
      enableWebhooks: boolean;
      webhookUrl?: string;
      enableValidation: boolean;
    }>(),

    // Error tracking
    lastError: text("last_error"),
    lastErrorAt: timestamp("last_error_at"),
    errorHistory:
      jsonb("error_history").$type<
        Array<{
          error: string;
          timestamp: string;
          endpoint?: string;
          statusCode?: number;
        }>
      >(),

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
    unique("gra_connections_org_name_unique").on(
      table.organizationId,
      table.connectionName
    ),
    index("gra_connections_org_id_idx").on(table.organizationId),
    index("gra_connections_is_active_idx").on(table.isActive),
    index("gra_connections_environment_idx").on(table.environment),
    index("gra_connections_connection_status_idx").on(table.connectionStatus),
    index("gra_connections_health_status_idx").on(table.healthStatus),
    index("gra_connections_last_health_check_idx").on(table.lastHealthCheck),
  ]
);

// GRA webhooks for real-time status updates
export const graWebhooks = pgTable(
  "gra_webhooks",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Webhook details
    eventType: text("event_type").notNull(), // submission_status, payment_received, etc.
    submissionId: text("submission_id").references(() => graSubmissions.id),

    // Payload data
    payload: jsonb("payload").notNull(),
    signature: text("signature"), // Webhook signature for verification
    headers: jsonb("headers").$type<Record<string, string>>(),

    // Processing status
    processed: boolean("processed").default(false).notNull(),
    processedAt: timestamp("processed_at"),
    processingError: text("processing_error"),
    retryCount: integer("retry_count").default(0).notNull(),

    // Webhook metadata
    sourceIp: text("source_ip"),
    userAgent: text("user_agent"),

    // Audit fields
    receivedAt: timestamp("received_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("gra_webhooks_org_id_idx").on(table.organizationId),
    index("gra_webhooks_event_type_idx").on(table.eventType),
    index("gra_webhooks_submission_id_idx").on(table.submissionId),
    index("gra_webhooks_processed_idx").on(table.processed),
    index("gra_webhooks_received_at_idx").on(table.receivedAt),
  ]
);

// Relations
export const graApiCacheRelations = relations(graApiCache, ({ one }) => ({
  organization: one(organizations, {
    fields: [graApiCache.organizationId],
    references: [organizations.id],
  }),
  requestedByUser: one(users, {
    fields: [graApiCache.requestedBy],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [graApiCache.clientId],
    references: [clients.id],
  }),
}));

export const graSubmissionsRelations = relations(
  graSubmissions,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [graSubmissions.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [graSubmissions.clientId],
      references: [clients.id],
    }),
    originalSubmission: one(graSubmissions, {
      fields: [graSubmissions.originalSubmissionId],
      references: [graSubmissions.id],
      relationName: "originalSubmission",
    }),
    amendments: many(graSubmissions, {
      relationName: "originalSubmission",
    }),
    createdByUser: one(users, {
      fields: [graSubmissions.createdBy],
      references: [users.id],
      relationName: "graSubmissionCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [graSubmissions.updatedBy],
      references: [users.id],
      relationName: "graSubmissionUpdatedBy",
    }),
    submittedByUser: one(users, {
      fields: [graSubmissions.submittedBy],
      references: [users.id],
      relationName: "graSubmissionSubmittedBy",
    }),
    reviewedByUser: one(users, {
      fields: [graSubmissions.reviewedBy],
      references: [users.id],
      relationName: "graSubmissionReviewedBy",
    }),
  })
);

export const graConnectionsRelations = relations(graConnections, ({ one }) => ({
  organization: one(organizations, {
    fields: [graConnections.organizationId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [graConnections.createdBy],
    references: [users.id],
    relationName: "graConnectionCreatedBy",
  }),
  updatedByUser: one(users, {
    fields: [graConnections.updatedBy],
    references: [users.id],
    relationName: "graConnectionUpdatedBy",
  }),
}));

export const graWebhooksRelations = relations(graWebhooks, ({ one }) => ({
  organization: one(organizations, {
    fields: [graWebhooks.organizationId],
    references: [organizations.id],
  }),
  submission: one(graSubmissions, {
    fields: [graWebhooks.submissionId],
    references: [graSubmissions.id],
  }),
}));

// GRA API Credentials Table
export const graApiCredential = pgTable(
  "gra_api_credential",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    apiKey: text("api_key").notNull(),
    apiSecret: text("api_secret"),
    environment: text("environment").default("sandbox").notNull(), // sandbox, production
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at"),
    expiresAt: timestamp("expires_at"),
    permissions: text("permissions"), // JSON array of permissions
    createdBy: text("created_by").references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("gra_api_credential_org_idx").on(table.organizationId),
    index("gra_api_credential_environment_idx").on(table.environment),
    index("gra_api_credential_active_idx").on(table.isActive),
  ]
);

// GRA API Sync Status Table
export const graApiSync = pgTable(
  "gra_api_sync",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    syncType: text("sync_type").notNull(), // submissions, taxpayer_info, filings
    status: text("status").default("pending").notNull(), // pending, in_progress, completed, failed
    lastSyncAt: timestamp("last_sync_at"),
    nextSyncAt: timestamp("next_sync_at"),
    recordsProcessed: integer("records_processed").default(0),
    recordsFailed: integer("records_failed").default(0),
    errorMessage: text("error_message"),
    metadata: text("metadata"), // JSON for additional sync details
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("gra_api_sync_org_idx").on(table.organizationId),
    index("gra_api_sync_type_idx").on(table.syncType),
    index("gra_api_sync_status_idx").on(table.status),
  ]
);

// Activity Log Table
export const activityLog = pgTable(
  "activity_log",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => users.id),
    actorType: text("actor_type").default("user").notNull(), // user, system, api
    action: text("action").notNull(), // created, updated, deleted, viewed, etc.
    entityType: text("entity_type").notNull(), // client, document, submission, etc.
    entityId: text("entity_id"),
    description: text("description"),
    oldData: text("old_data"), // JSON of previous values
    newData: text("new_data"), // JSON of new values
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: text("metadata"), // JSON for additional context
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("activity_log_org_idx").on(table.organizationId),
    index("activity_log_actor_idx").on(table.actorId),
    index("activity_log_entity_idx").on(table.entityType, table.entityId),
    index("activity_log_action_idx").on(table.action),
    index("activity_log_created_idx").on(table.createdAt),
  ]
);

// Relations for new tables
export const graApiCredentialRelations = relations(
  graApiCredential,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [graApiCredential.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [graApiCredential.createdBy],
      references: [users.id],
    }),
  })
);

export const graApiSyncRelations = relations(graApiSync, ({ one }) => ({
  organization: one(organizations, {
    fields: [graApiSync.organizationId],
    references: [organizations.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  organization: one(organizations, {
    fields: [activityLog.organizationId],
    references: [organizations.id],
  }),
  actor: one(users, {
    fields: [activityLog.actorId],
    references: [users.id],
  }),
}));
