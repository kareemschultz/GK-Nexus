import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { users } from "./users";

// Enums for audit log actions and entities
export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "read",
  "update",
  "delete",
  "login",
  "logout",
  "password_change",
  "permission_change",
  "export",
  "import",
  "approve",
  "reject",
  "submit",
  "cancel",
  "archive",
  "restore",
  "share",
  "download",
]);

export const auditEntityEnum = pgEnum("audit_entity", [
  "user",
  "client",
  "document",
  "compliance_requirement",
  "compliance_filing",
  "tax_calculation",
  "session",
  "system",
  "report",
  "setting",
  "permission",
  "role",
]);

export const auditSeverityEnum = pgEnum("audit_severity", [
  "info",
  "warning",
  "error",
  "critical",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),

    // Action details
    action: auditActionEnum("action").notNull(),
    entity: auditEntityEnum("entity").notNull(),
    entityId: text("entity_id"), // ID of the affected entity
    description: text("description").notNull(),

    // User and context
    userId: text("user_id").references(() => users.id),
    clientId: text("client_id").references(() => clients.id), // If action relates to a specific client
    sessionId: text("session_id"),

    // Technical details
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    location: text("location"),
    endpoint: text("endpoint"), // API endpoint or page accessed
    method: text("method"), // HTTP method or action type

    // Change tracking
    oldValues: text("old_values"), // JSON object of previous values
    newValues: text("new_values"), // JSON object of new values
    changedFields: text("changed_fields"), // JSON array of field names that changed

    // Status and metadata
    severity: auditSeverityEnum("severity").default("info").notNull(),
    success: boolean("success").default(true).notNull(),
    errorMessage: text("error_message"),
    duration: text("duration"), // Time taken for the operation

    // Additional context
    metadata: text("metadata"), // JSON object for any additional data
    tags: text("tags"), // JSON array of tags for categorization
    correlationId: text("correlation_id"), // For tracing related operations

    // Retention and archiving
    retentionPeriod: text("retention_period"), // How long to keep this log
    isArchived: boolean("is_archived").default(false).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_client_id_idx").on(table.clientId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_entity_idx").on(table.entity),
    index("audit_logs_entity_id_idx").on(table.entityId),
    index("audit_logs_severity_idx").on(table.severity),
    index("audit_logs_success_idx").on(table.success),
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_ip_address_idx").on(table.ipAddress),
    index("audit_logs_correlation_id_idx").on(table.correlationId),
    index("audit_logs_is_archived_idx").on(table.isArchived),
    index("audit_logs_session_id_idx").on(table.sessionId),
  ]
);

export const systemEvents = pgTable(
  "system_events",
  {
    id: text("id").primaryKey(),

    // Event details
    eventType: text("event_type").notNull(), // backup_completed, system_startup, etc.
    eventName: text("event_name").notNull(),
    description: text("description"),

    // Status and results
    status: text("status").notNull(), // success, failed, in_progress, cancelled
    severity: auditSeverityEnum("severity").default("info").notNull(),

    // Timing
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    duration: text("duration"),

    // Details and metadata
    details: text("details"), // JSON object with event-specific data
    errorMessage: text("error_message"),
    errorCode: text("error_code"),

    // Related entities
    relatedUserId: text("related_user_id").references(() => users.id),
    relatedEntityType: text("related_entity_type"),
    relatedEntityId: text("related_entity_id"),

    // System information
    serverName: text("server_name"),
    processId: text("process_id"),
    version: text("version"),
    environment: text("environment"), // development, staging, production

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("system_events_event_type_idx").on(table.eventType),
    index("system_events_status_idx").on(table.status),
    index("system_events_severity_idx").on(table.severity),
    index("system_events_created_at_idx").on(table.createdAt),
    index("system_events_related_user_id_idx").on(table.relatedUserId),
    index("system_events_environment_idx").on(table.environment),
  ]
);

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: text("id").primaryKey(),

    // Attempt details
    email: text("email").notNull(),
    success: boolean("success").notNull(),

    // User and session
    userId: text("user_id").references(() => users.id), // Only set if successful
    sessionId: text("session_id"),

    // Technical details
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    location: text("location"),

    // Failure details
    failureReason: text("failure_reason"), // invalid_password, user_not_found, account_locked, etc.
    attempts: text("attempts"), // Number of consecutive failed attempts from this IP/user

    // Security metadata
    isSuspicious: boolean("is_suspicious").default(false).notNull(),
    blockedUntil: timestamp("blocked_until"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("login_attempts_email_idx").on(table.email),
    index("login_attempts_user_id_idx").on(table.userId),
    index("login_attempts_ip_address_idx").on(table.ipAddress),
    index("login_attempts_success_idx").on(table.success),
    index("login_attempts_created_at_idx").on(table.createdAt),
    index("login_attempts_is_suspicious_idx").on(table.isSuspicious),
    index("login_attempts_blocked_until_idx").on(table.blockedUntil),
  ]
);

// Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [auditLogs.clientId],
    references: [clients.id],
  }),
}));

export const systemEventsRelations = relations(systemEvents, ({ one }) => ({
  relatedUser: one(users, {
    fields: [systemEvents.relatedUserId],
    references: [users.id],
  }),
}));

export const loginAttemptsRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, {
    fields: [loginAttempts.userId],
    references: [users.id],
  }),
}));
