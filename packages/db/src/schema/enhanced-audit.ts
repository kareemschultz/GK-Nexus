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
  unique,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { organizations } from "./organizations";
import { users } from "./users";

// Enhanced audit action types for comprehensive tracking
export const enhancedAuditActionEnum = pgEnum("enhanced_audit_action", [
  // Standard CRUD operations
  "create",
  "read",
  "update",
  "delete",
  "bulk_update",
  "bulk_delete",

  // Authentication and authorization
  "login",
  "logout",
  "failed_login",
  "password_change",
  "password_reset_request",
  "password_reset",
  "mfa_enable",
  "mfa_disable",
  "mfa_verify",
  "session_expire",
  "session_terminate",

  // Permission and role management
  "role_assign",
  "role_revoke",
  "permission_grant",
  "permission_revoke",
  "access_denied",
  "privilege_escalation",

  // Document operations
  "document_upload",
  "document_download",
  "document_view",
  "document_share",
  "document_unshare",
  "document_version_create",
  "document_archive",
  "document_restore",
  "document_encrypt",
  "document_decrypt",

  // Financial and tax operations
  "tax_calculate",
  "tax_submit",
  "tax_approve",
  "tax_reject",
  "payment_process",
  "payment_refund",
  "invoice_generate",
  "invoice_send",

  // GRA integration operations
  "gra_submit",
  "gra_status_check",
  "gra_response_receive",
  "gra_amendment",
  "gra_appeal",

  // Immigration operations
  "case_create",
  "case_update_status",
  "case_assign",
  "interview_schedule",
  "interview_complete",
  "document_verify",
  "document_reject",

  // System operations
  "backup_create",
  "backup_restore",
  "system_maintenance",
  "configuration_change",
  "integration_sync",
  "cache_clear",

  // Data operations
  "export",
  "import",
  "migrate",
  "purge",
  "anonymize",

  // Workflow operations
  "workflow_start",
  "workflow_advance",
  "workflow_complete",
  "workflow_cancel",
  "approve",
  "reject",

  // Communication operations
  "email_send",
  "notification_send",
  "alert_trigger",
  "reminder_send",

  // Compliance operations
  "compliance_check",
  "audit_trail_access",
  "data_retention_policy_apply",
  "privacy_request_process",

  // API operations
  "api_key_create",
  "api_key_revoke",
  "api_rate_limit_exceed",
  "webhook_trigger",

  // Other
  "custom",
  "unknown",
]);

// Enhanced entity types for comprehensive tracking
export const enhancedAuditEntityEnum = pgEnum("enhanced_audit_entity", [
  // Core entities
  "organization",
  "user",
  "client",
  "client_contact",
  "client_service",

  // Document entities
  "document",
  "document_template",
  "document_workflow",
  "ocr_result",

  // Tax entities
  "tax_calculation",
  "paye_calculation",
  "nis_calculation",
  "vat_calculation",
  "tax_rate",

  // GRA entities
  "gra_submission",
  "gra_connection",
  "gra_webhook",
  "gra_api_cache",

  // Immigration entities
  "immigration_case",
  "immigration_interview",
  "immigration_correspondence",
  "immigration_document_requirement",
  "immigration_timeline",

  // RBAC entities
  "role",
  "permission",
  "user_role",
  "user_permission",

  // System entities
  "session",
  "audit_log",
  "system_event",
  "notification",
  "setting",
  "backup",

  // Compliance entities
  "compliance_requirement",
  "compliance_filing",
  "audit_trail",

  // Other
  "api_key",
  "webhook",
  "integration",
  "report",
  "dashboard",
  "custom",
]);

// Risk levels for audit events
export const auditRiskLevelEnum = pgEnum("audit_risk_level", [
  "very_low",
  "low",
  "medium",
  "high",
  "very_high",
  "critical",
]);

// Compliance frameworks
export const complianceFrameworkEnum = pgEnum("compliance_framework", [
  "sox", // Sarbanes-Oxley
  "gdpr", // General Data Protection Regulation
  "iso_27001",
  "nist",
  "coso",
  "gra_compliance", // Guyana Revenue Authority
  "internal_controls",
  "data_retention",
  "privacy",
  "security",
  "custom",
]);

// Enhanced audit logs with multi-tenant support and detailed tracking
export const enhancedAuditLogs = pgTable(
  "enhanced_audit_logs",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Event identification and correlation
    eventId: text("event_id").unique().notNull(), // Unique event identifier for correlation
    parentEventId: text("parent_event_id"), // For tracking related events
    correlationId: text("correlation_id"), // For tracing related operations across services
    transactionId: text("transaction_id"), // For database transaction tracking

    // Action and entity details
    action: enhancedAuditActionEnum("action").notNull(),
    entity: enhancedAuditEntityEnum("entity").notNull(),
    entityId: text("entity_id"), // ID of the affected entity
    entityName: text("entity_name"), // Human-readable name of the entity
    description: text("description").notNull(),
    summary: text("summary"), // Short summary for dashboards

    // User and session context
    userId: text("user_id").references(() => users.id),
    clientId: text("client_id").references(() => clients.id),
    sessionId: text("session_id"),
    impersonatedBy: text("impersonated_by").references(() => users.id), // If user is impersonating

    // Technical context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    requestId: text("request_id"), // Request ID for tracing
    endpoint: text("endpoint"), // API endpoint or page accessed
    httpMethod: text("http_method"), // GET, POST, PUT, DELETE, etc.
    httpStatusCode: integer("http_status_code"), // HTTP response status
    referer: text("referer"), // HTTP referer header

    // Geographic and device context
    location: jsonb("location").$type<{
      country?: string;
      region?: string;
      city?: string;
      timezone?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    }>(),
    deviceInfo: jsonb("device_info").$type<{
      deviceType?: "desktop" | "mobile" | "tablet" | "api" | "system";
      operatingSystem?: string;
      browser?: string;
      browserVersion?: string;
      screenResolution?: string;
      isMobile?: boolean;
    }>(),

    // Data change tracking (detailed)
    oldValues: jsonb("old_values").$type<Record<string, any>>(), // Previous values
    newValues: jsonb("new_values").$type<Record<string, any>>(), // New values
    changedFields: jsonb("changed_fields").$type<string[]>(), // Fields that changed
    changeSize: integer("change_size"), // Number of fields changed
    dataClassification: text("data_classification"), // sensitive, internal, public, restricted

    // Business context
    businessProcess: text("business_process"), // tax_filing, client_onboarding, etc.
    workflowStage: text("workflow_stage"), // Current stage in workflow
    businessImpact: text("business_impact"), // Description of business impact
    complianceFrameworks: jsonb("compliance_frameworks").$type<
      complianceFrameworkEnum[]
    >(),

    // Risk and security assessment
    riskLevel: auditRiskLevelEnum("risk_level").default("low").notNull(),
    securityFlags: jsonb("security_flags").$type<{
      potentialDataBreach?: boolean;
      unauthorizedAccess?: boolean;
      privilegeEscalation?: boolean;
      anomalousActivity?: boolean;
      suspiciousPattern?: boolean;
      policyViolation?: boolean;
      fraudRisk?: boolean;
    }>(),
    sensitiveDataAccessed: boolean("sensitive_data_accessed")
      .default(false)
      .notNull(),
    sensitiveFields: jsonb("sensitive_fields").$type<string[]>(), // List of sensitive fields accessed

    // Status and outcome
    success: boolean("success").default(true).notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details").$type<{
      stackTrace?: string;
      errorType?: string;
      context?: Record<string, any>;
    }>(),

    // Performance metrics
    duration: integer("duration"), // Milliseconds
    responseSize: integer("response_size"), // Response size in bytes
    resourcesUsed: jsonb("resources_used").$type<{
      cpuTime?: number;
      memoryUsed?: number;
      diskOperations?: number;
      networkCalls?: number;
    }>(),

    // Compliance and retention
    retentionPeriod: integer("retention_period"), // Days to retain
    legalHold: boolean("legal_hold").default(false).notNull(),
    privacyImpact: boolean("privacy_impact").default(false).notNull(),
    regulatoryRelevance: jsonb("regulatory_relevance").$type<string[]>(), // Applicable regulations

    // Workflow and approval tracking
    requiresReview: boolean("requires_review").default(false).notNull(),
    reviewedBy: text("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    escalationLevel: integer("escalation_level").default(0),

    // Additional metadata and custom fields
    metadata: jsonb("metadata").$type<Record<string, any>>(), // Flexible metadata
    tags: jsonb("tags").$type<string[]>(), // Tags for categorization
    customFields: jsonb("custom_fields").$type<Record<string, any>>(),

    // External system correlation
    externalReferences: jsonb("external_references").$type<
      Array<{
        system: string;
        referenceId: string;
        referenceType: string;
      }>
    >(),

    // Alert and notification flags
    alertTriggered: boolean("alert_triggered").default(false).notNull(),
    notificationSent: boolean("notification_sent").default(false).notNull(),
    alertReason: text("alert_reason"),

    // Archival and lifecycle
    isArchived: boolean("is_archived").default(false).notNull(),
    archivedAt: timestamp("archived_at"),
    archiveReason: text("archive_reason"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    occurredAt: timestamp("occurred_at").defaultNow().notNull(), // When the actual event occurred (may differ from created_at)
  },
  (table) => [
    index("enhanced_audit_logs_org_id_idx").on(table.organizationId),
    index("enhanced_audit_logs_user_id_idx").on(table.userId),
    index("enhanced_audit_logs_client_id_idx").on(table.clientId),
    index("enhanced_audit_logs_action_idx").on(table.action),
    index("enhanced_audit_logs_entity_idx").on(table.entity),
    index("enhanced_audit_logs_entity_id_idx").on(table.entityId),
    index("enhanced_audit_logs_event_id_idx").on(table.eventId),
    index("enhanced_audit_logs_correlation_id_idx").on(table.correlationId),
    index("enhanced_audit_logs_parent_event_id_idx").on(table.parentEventId),
    index("enhanced_audit_logs_risk_level_idx").on(table.riskLevel),
    index("enhanced_audit_logs_sensitive_data_idx").on(
      table.sensitiveDataAccessed
    ),
    index("enhanced_audit_logs_business_process_idx").on(table.businessProcess),
    index("enhanced_audit_logs_success_idx").on(table.success),
    index("enhanced_audit_logs_ip_address_idx").on(table.ipAddress),
    index("enhanced_audit_logs_session_id_idx").on(table.sessionId),
    index("enhanced_audit_logs_created_at_idx").on(table.createdAt),
    index("enhanced_audit_logs_occurred_at_idx").on(table.occurredAt),
    index("enhanced_audit_logs_alert_triggered_idx").on(table.alertTriggered),
    index("enhanced_audit_logs_requires_review_idx").on(table.requiresReview),
    index("enhanced_audit_logs_legal_hold_idx").on(table.legalHold),
    index("enhanced_audit_logs_is_archived_idx").on(table.isArchived),
    // Composite indexes for audit analysis and reporting
    index("enhanced_audit_logs_org_action_idx").on(
      table.organizationId,
      table.action
    ),
    index("enhanced_audit_logs_org_entity_idx").on(
      table.organizationId,
      table.entity
    ),
    index("enhanced_audit_logs_user_action_idx").on(table.userId, table.action),
    index("enhanced_audit_logs_risk_alert_idx").on(
      table.riskLevel,
      table.alertTriggered
    ),
    index("enhanced_audit_logs_time_range_idx").on(
      table.organizationId,
      table.occurredAt
    ),
    index("enhanced_audit_logs_entity_action_time_idx").on(
      table.entity,
      table.action,
      table.occurredAt
    ),
  ]
);

// Audit trail patterns for detecting suspicious activities
export const auditPatterns = pgTable(
  "audit_patterns",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),

    // Pattern identification
    patternName: text("pattern_name").notNull(),
    patternType: text("pattern_type").notNull(), // anomaly, fraud, security_violation, etc.
    description: text("description"),

    // Pattern configuration
    conditions: jsonb("conditions").$type<{
      timeWindow: number; // minutes
      threshold: number; // number of events
      actions?: enhancedAuditActionEnum[];
      entities?: enhancedAuditEntityEnum[];
      userIds?: string[];
      riskLevels?: auditRiskLevelEnum[];
      customConditions?: Array<{
        field: string;
        operator: "equals" | "contains" | "greater_than" | "less_than" | "in";
        value: any;
      }>;
    }>(),

    // Alert configuration
    isActive: boolean("is_active").default(true).notNull(),
    alertEnabled: boolean("alert_enabled").default(true).notNull(),
    alertThreshold: integer("alert_threshold").default(1).notNull(),
    escalationEnabled: boolean("escalation_enabled").default(false).notNull(),
    escalationThreshold: integer("escalation_threshold"),

    // Notification settings
    notifyUsers: jsonb("notify_users").$type<string[]>(), // User IDs to notify
    notifyRoles: jsonb("notify_roles").$type<string[]>(), // Roles to notify
    notificationChannels: jsonb("notification_channels").$type<
      Array<"email" | "sms" | "slack" | "webhook">
    >(),

    // Pattern statistics
    totalMatches: integer("total_matches").default(0).notNull(),
    lastMatchAt: timestamp("last_match_at"),
    falsePositiveRate: decimal("false_positive_rate", {
      precision: 5,
      scale: 4,
    }),

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
    unique("audit_patterns_org_name_unique").on(
      table.organizationId,
      table.patternName
    ),
    index("audit_patterns_org_id_idx").on(table.organizationId),
    index("audit_patterns_pattern_type_idx").on(table.patternType),
    index("audit_patterns_is_active_idx").on(table.isActive),
    index("audit_patterns_alert_enabled_idx").on(table.alertEnabled),
    index("audit_patterns_last_match_at_idx").on(table.lastMatchAt),
  ]
);

// Pattern matches for tracking detected patterns
export const auditPatternMatches = pgTable(
  "audit_pattern_matches",
  {
    id: text("id").primaryKey(),
    patternId: text("pattern_id")
      .notNull()
      .references(() => auditPatterns.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Match details
    matchedEvents: jsonb("matched_events").$type<string[]>(), // Array of audit log IDs
    matchScore: decimal("match_score", { precision: 5, scale: 4 }), // Confidence score
    matchReason: text("match_reason"),

    // Alert and response
    alertTriggered: boolean("alert_triggered").default(false).notNull(),
    alertSentAt: timestamp("alert_sent_at"),
    responseRequired: boolean("response_required").default(false).notNull(),
    responseStatus: text("response_status"), // pending, investigating, resolved, false_positive

    // Investigation tracking
    investigatedBy: text("investigated_by").references(() => users.id),
    investigatedAt: timestamp("investigated_at"),
    investigationNotes: text("investigation_notes"),
    resolution: text("resolution"),
    actionTaken: text("action_taken"),

    // Pattern match context
    affectedUsers: jsonb("affected_users").$type<string[]>(),
    affectedEntities:
      jsonb("affected_entities").$type<
        Array<{
          entityType: string;
          entityId: string;
          entityName?: string;
        }>
      >(),
    timeWindow: jsonb("time_window").$type<{
      startTime: string;
      endTime: string;
      duration: number; // minutes
    }>(),

    // Risk assessment
    riskLevel: auditRiskLevelEnum("risk_level").notNull(),
    potentialImpact: text("potential_impact"),
    businessImpact: text("business_impact"),

    // Follow-up tracking
    followUpRequired: boolean("follow_up_required").default(false).notNull(),
    followUpDate: timestamp("follow_up_date"),
    followUpAssignedTo: text("follow_up_assigned_to").references(
      () => users.id
    ),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    index("audit_pattern_matches_pattern_id_idx").on(table.patternId),
    index("audit_pattern_matches_org_id_idx").on(table.organizationId),
    index("audit_pattern_matches_alert_triggered_idx").on(table.alertTriggered),
    index("audit_pattern_matches_response_status_idx").on(table.responseStatus),
    index("audit_pattern_matches_risk_level_idx").on(table.riskLevel),
    index("audit_pattern_matches_investigated_by_idx").on(table.investigatedBy),
    index("audit_pattern_matches_follow_up_required_idx").on(
      table.followUpRequired
    ),
    index("audit_pattern_matches_created_at_idx").on(table.createdAt),
    index("audit_pattern_matches_resolved_at_idx").on(table.resolvedAt),
  ]
);

// Data retention policies for audit compliance
export const auditRetentionPolicies = pgTable(
  "audit_retention_policies",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),

    // Policy identification
    policyName: text("policy_name").notNull(),
    description: text("description"),
    complianceFramework: complianceFrameworkEnum("compliance_framework"),

    // Retention rules
    retentionPeriod: integer("retention_period").notNull(), // Days
    archivePeriod: integer("archive_period"), // Days before archival
    purgeAfter: integer("purge_after"), // Days before permanent deletion

    // Policy scope
    appliesTo: jsonb("applies_to").$type<{
      actions?: enhancedAuditActionEnum[];
      entities?: enhancedAuditEntityEnum[];
      riskLevels?: auditRiskLevelEnum[];
      dataClassifications?: string[];
      customConditions?: Array<{
        field: string;
        operator: string;
        value: any;
      }>;
    }>(),

    // Exception handling
    legalHoldOverride: boolean("legal_hold_override").default(true).notNull(),
    complianceOverride: boolean("compliance_override").default(true).notNull(),
    exceptions:
      jsonb("exceptions").$type<
        Array<{
          condition: string;
          retentionPeriod: number;
          reason: string;
        }>
      >(),

    // Policy status and execution
    isActive: boolean("is_active").default(true).notNull(),
    lastExecuted: timestamp("last_executed"),
    nextExecution: timestamp("next_execution"),
    recordsProcessed: integer("records_processed").default(0),
    recordsArchived: integer("records_archived").default(0),
    recordsPurged: integer("records_purged").default(0),

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
    unique("audit_retention_policies_org_name_unique").on(
      table.organizationId,
      table.policyName
    ),
    index("audit_retention_policies_org_id_idx").on(table.organizationId),
    index("audit_retention_policies_compliance_framework_idx").on(
      table.complianceFramework
    ),
    index("audit_retention_policies_is_active_idx").on(table.isActive),
    index("audit_retention_policies_next_execution_idx").on(
      table.nextExecution
    ),
  ]
);

// Relations
export const enhancedAuditLogsRelations = relations(
  enhancedAuditLogs,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [enhancedAuditLogs.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [enhancedAuditLogs.userId],
      references: [users.id],
      relationName: "auditUser",
    }),
    client: one(clients, {
      fields: [enhancedAuditLogs.clientId],
      references: [clients.id],
    }),
    impersonatedByUser: one(users, {
      fields: [enhancedAuditLogs.impersonatedBy],
      references: [users.id],
      relationName: "auditImpersonatedBy",
    }),
    reviewedByUser: one(users, {
      fields: [enhancedAuditLogs.reviewedBy],
      references: [users.id],
      relationName: "auditReviewedBy",
    }),
  })
);

export const auditPatternsRelations = relations(
  auditPatterns,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [auditPatterns.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [auditPatterns.createdBy],
      references: [users.id],
      relationName: "patternCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [auditPatterns.updatedBy],
      references: [users.id],
      relationName: "patternUpdatedBy",
    }),
    matches: many(auditPatternMatches),
  })
);

export const auditPatternMatchesRelations = relations(
  auditPatternMatches,
  ({ one }) => ({
    pattern: one(auditPatterns, {
      fields: [auditPatternMatches.patternId],
      references: [auditPatterns.id],
    }),
    organization: one(organizations, {
      fields: [auditPatternMatches.organizationId],
      references: [organizations.id],
    }),
    investigatedByUser: one(users, {
      fields: [auditPatternMatches.investigatedBy],
      references: [users.id],
      relationName: "matchInvestigatedBy",
    }),
    followUpAssignedToUser: one(users, {
      fields: [auditPatternMatches.followUpAssignedTo],
      references: [users.id],
      relationName: "matchFollowUpAssignedTo",
    }),
  })
);

export const auditRetentionPoliciesRelations = relations(
  auditRetentionPolicies,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [auditRetentionPolicies.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [auditRetentionPolicies.createdBy],
      references: [users.id],
      relationName: "retentionPolicyCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [auditRetentionPolicies.updatedBy],
      references: [users.id],
      relationName: "retentionPolicyUpdatedBy",
    }),
  })
);
