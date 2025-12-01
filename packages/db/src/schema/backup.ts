import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// Backup type enum
export const backupTypeEnum = pgEnum("backup_type", [
  "FULL", // Complete database backup
  "INCREMENTAL", // Changes since last backup
  "DIFFERENTIAL", // Changes since last full backup
  "SETTINGS", // Only settings and configurations
  "DOCUMENTS", // Only documents and files
  "SELECTIVE", // User-selected tables only
]);

// Backup status enum
export const backupStatusEnum = pgEnum("backup_status", [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "EXPIRED",
]);

// Backup storage location enum
export const backupStorageEnum = pgEnum("backup_storage", [
  "LOCAL", // Local filesystem
  "S3", // AWS S3 or compatible
  "GCS", // Google Cloud Storage
  "AZURE", // Azure Blob Storage
  "FTP", // FTP/SFTP server
]);

// Restore status enum
export const restoreStatusEnum = pgEnum("restore_status", [
  "PENDING",
  "VALIDATING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "ROLLED_BACK",
]);

// Backup schedules for automated backups
export const backupSchedules = pgTable(
  "backup_schedules",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),

    // Schedule configuration
    isEnabled: boolean("is_enabled").default(true).notNull(),
    backupType: backupTypeEnum("backup_type").default("FULL").notNull(),
    storageLocation: backupStorageEnum("storage_location")
      .default("LOCAL")
      .notNull(),

    // Cron schedule (e.g., "0 2 * * *" for 2 AM daily)
    cronExpression: text("cron_expression").notNull(),
    timezone: text("timezone").default("America/Guyana").notNull(),

    // Retention policy
    retentionDays: integer("retention_days").default(30).notNull(),
    maxBackups: integer("max_backups").default(10),

    // What to backup
    includeTables: jsonb("include_tables"), // null = all tables
    excludeTables: jsonb("exclude_tables"),
    includeDocuments: boolean("include_documents").default(true).notNull(),
    includeAuditLogs: boolean("include_audit_logs").default(true).notNull(),

    // Encryption
    isEncrypted: boolean("is_encrypted").default(true).notNull(),
    encryptionKeyId: text("encryption_key_id"),

    // Compression
    compressionEnabled: boolean("compression_enabled").default(true).notNull(),
    compressionLevel: integer("compression_level").default(6), // 1-9

    // Storage configuration (JSON with credentials/paths)
    storageConfig: jsonb("storage_config"),

    // Notification settings
    notifyOnSuccess: boolean("notify_on_success").default(false).notNull(),
    notifyOnFailure: boolean("notify_on_failure").default(true).notNull(),
    notificationEmails: jsonb("notification_emails"), // Array of emails

    // Execution tracking
    lastRunAt: timestamp("last_run_at"),
    nextRunAt: timestamp("next_run_at"),
    lastBackupId: text("last_backup_id"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("backup_schedules_enabled_idx").on(table.isEnabled),
    index("backup_schedules_next_run_idx").on(table.nextRunAt),
    index("backup_schedules_type_idx").on(table.backupType),
  ]
);

// Individual backup records
export const backups = pgTable(
  "backups",
  {
    id: text("id").primaryKey(),
    scheduleId: text("schedule_id").references(() => backupSchedules.id),

    // Backup metadata
    name: text("name").notNull(),
    description: text("description"),
    backupType: backupTypeEnum("backup_type").notNull(),
    status: backupStatusEnum("status").default("PENDING").notNull(),

    // Storage details
    storageLocation: backupStorageEnum("storage_location").notNull(),
    storagePath: text("storage_path"), // Full path to backup file
    storageConfig: jsonb("storage_config"),

    // Backup content
    includedTables: jsonb("included_tables"), // Array of table names
    excludedTables: jsonb("excluded_tables"),
    includesDocuments: boolean("includes_documents").default(false).notNull(),
    includesAuditLogs: boolean("includes_audit_logs").default(false).notNull(),

    // Size and metrics
    sizeBytes: text("size_bytes"), // Store as text for large numbers
    compressedSizeBytes: text("compressed_size_bytes"),
    recordCount: integer("record_count"),
    tableCount: integer("table_count"),

    // Integrity
    checksum: text("checksum"), // SHA-256 hash
    checksumAlgorithm: text("checksum_algorithm").default("SHA-256"),
    isEncrypted: boolean("is_encrypted").default(false).notNull(),
    encryptionKeyId: text("encryption_key_id"),

    // Timing
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    durationMs: integer("duration_ms"),

    // For incremental backups
    parentBackupId: text("parent_backup_id"),
    baseBackupId: text("base_backup_id"), // For differential backups

    // Error handling
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),
    retryCount: integer("retry_count").default(0),

    // Expiration
    expiresAt: timestamp("expires_at"),
    isExpired: boolean("is_expired").default(false).notNull(),

    // Metadata
    metadata: jsonb("metadata"), // Additional backup metadata
    databaseVersion: text("database_version"),
    applicationVersion: text("application_version"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("backups_schedule_idx").on(table.scheduleId),
    index("backups_status_idx").on(table.status),
    index("backups_type_idx").on(table.backupType),
    index("backups_created_at_idx").on(table.createdAt),
    index("backups_expires_at_idx").on(table.expiresAt),
    index("backups_parent_idx").on(table.parentBackupId),
    index("backups_storage_idx").on(table.storageLocation),
  ]
);

// Backup table details - tracks what was backed up
export const backupTableDetails = pgTable(
  "backup_table_details",
  {
    id: text("id").primaryKey(),
    backupId: text("backup_id")
      .notNull()
      .references(() => backups.id, { onDelete: "cascade" }),

    tableName: text("table_name").notNull(),
    schemaName: text("schema_name").default("public").notNull(),
    recordCount: integer("record_count"),
    sizeBytes: text("size_bytes"),

    // For incremental backups
    changedRecords: integer("changed_records"),
    deletedRecords: integer("deleted_records"),
    insertedRecords: integer("inserted_records"),

    // Timing
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    // Status
    status: text("status").default("pending"),
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("backup_table_details_backup_idx").on(table.backupId),
    index("backup_table_details_table_idx").on(table.tableName),
  ]
);

// Restore operations
export const restoreOperations = pgTable(
  "restore_operations",
  {
    id: text("id").primaryKey(),
    backupId: text("backup_id")
      .notNull()
      .references(() => backups.id),

    // Restore configuration
    name: text("name").notNull(),
    description: text("description"),
    status: restoreStatusEnum("status").default("PENDING").notNull(),

    // What to restore
    restoreType: text("restore_type").default("full").notNull(), // full, selective, point_in_time
    selectedTables: jsonb("selected_tables"), // null = all tables from backup
    restoreDocuments: boolean("restore_documents").default(true).notNull(),
    restoreAuditLogs: boolean("restore_audit_logs").default(true).notNull(),

    // Target configuration
    targetDatabase: text("target_database"), // null = same database
    targetSchema: text("target_schema"),
    overwriteExisting: boolean("overwrite_existing").default(false).notNull(),

    // Pre-restore backup (safety)
    preRestoreBackupId: text("pre_restore_backup_id"),
    createPreRestoreBackup: boolean("create_pre_restore_backup")
      .default(true)
      .notNull(),

    // Validation
    validationStatus: text("validation_status"),
    validationErrors: jsonb("validation_errors"),
    checksumVerified: boolean("checksum_verified").default(false),

    // Progress tracking
    totalTables: integer("total_tables"),
    restoredTables: integer("restored_tables").default(0),
    totalRecords: integer("total_records"),
    restoredRecords: integer("restored_records").default(0),
    progressPercent: integer("progress_percent").default(0),

    // Timing
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    durationMs: integer("duration_ms"),

    // Error handling
    errorMessage: text("error_message"),
    errorDetails: jsonb("error_details"),
    rollbackReason: text("rollback_reason"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    initiatedBy: text("initiated_by")
      .notNull()
      .references(() => users.id),
    approvedBy: text("approved_by").references(() => users.id),
  },
  (table) => [
    index("restore_operations_backup_idx").on(table.backupId),
    index("restore_operations_status_idx").on(table.status),
    index("restore_operations_created_at_idx").on(table.createdAt),
    index("restore_operations_initiated_by_idx").on(table.initiatedBy),
  ]
);

// Restore table details
export const restoreTableDetails = pgTable(
  "restore_table_details",
  {
    id: text("id").primaryKey(),
    restoreOperationId: text("restore_operation_id")
      .notNull()
      .references(() => restoreOperations.id, { onDelete: "cascade" }),

    tableName: text("table_name").notNull(),
    schemaName: text("schema_name").default("public").notNull(),

    // Progress
    status: text("status").default("pending"),
    recordCount: integer("record_count"),
    restoredCount: integer("restored_count").default(0),

    // Timing
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),

    // Error handling
    errorMessage: text("error_message"),
    skippedRecords: integer("skipped_records").default(0),
    conflictRecords: integer("conflict_records").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("restore_table_details_operation_idx").on(table.restoreOperationId),
    index("restore_table_details_table_idx").on(table.tableName),
  ]
);

// System settings backup - stores application configuration
export const systemSettingsBackup = pgTable(
  "system_settings_backup",
  {
    id: text("id").primaryKey(),
    backupId: text("backup_id").references(() => backups.id),

    // Settings categories
    category: text("category").notNull(), // auth, email, storage, etc.
    settingsData: jsonb("settings_data").notNull(),

    // Versioning
    version: integer("version").default(1).notNull(),
    previousVersion: integer("previous_version"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("system_settings_backup_backup_idx").on(table.backupId),
    index("system_settings_backup_category_idx").on(table.category),
  ]
);

// Backup encryption keys (encrypted storage)
export const backupEncryptionKeys = pgTable(
  "backup_encryption_keys",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),

    // Key metadata (NOT the actual key - that's stored securely elsewhere)
    algorithm: text("algorithm").default("AES-256-GCM").notNull(),
    keyFingerprint: text("key_fingerprint").notNull(), // For verification
    keyVersion: integer("key_version").default(1).notNull(),

    // Status
    isActive: boolean("is_active").default(true).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),

    // Rotation
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    rotatedAt: timestamp("rotated_at"),
    previousKeyId: text("previous_key_id"),

    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("backup_encryption_keys_active_idx").on(table.isActive),
    index("backup_encryption_keys_default_idx").on(table.isDefault),
  ]
);

// Backup audit log - detailed logging of all backup operations
export const backupAuditLog = pgTable(
  "backup_audit_log",
  {
    id: text("id").primaryKey(),

    // Reference to backup or restore
    backupId: text("backup_id").references(() => backups.id),
    restoreOperationId: text("restore_operation_id").references(
      () => restoreOperations.id
    ),
    scheduleId: text("schedule_id").references(() => backupSchedules.id),

    // Action details
    action: text("action").notNull(), // create, start, complete, fail, delete, restore, etc.
    actionDetails: jsonb("action_details"),

    // Status change
    previousStatus: text("previous_status"),
    newStatus: text("new_status"),

    // Actor
    performedBy: text("performed_by").references(() => users.id),
    performedBySystem: boolean("performed_by_system").default(false).notNull(),

    // Context
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("backup_audit_log_backup_idx").on(table.backupId),
    index("backup_audit_log_restore_idx").on(table.restoreOperationId),
    index("backup_audit_log_action_idx").on(table.action),
    index("backup_audit_log_created_at_idx").on(table.createdAt),
  ]
);

// Relations
export const backupSchedulesRelations = relations(
  backupSchedules,
  ({ many, one }) => ({
    backups: many(backups),
    createdByUser: one(users, {
      fields: [backupSchedules.createdBy],
      references: [users.id],
    }),
  })
);

export const backupsRelations = relations(backups, ({ one, many }) => ({
  schedule: one(backupSchedules, {
    fields: [backups.scheduleId],
    references: [backupSchedules.id],
  }),
  parentBackup: one(backups, {
    fields: [backups.parentBackupId],
    references: [backups.id],
  }),
  tableDetails: many(backupTableDetails),
  restoreOperations: many(restoreOperations),
  settingsBackups: many(systemSettingsBackup),
  createdByUser: one(users, {
    fields: [backups.createdBy],
    references: [users.id],
  }),
}));

export const backupTableDetailsRelations = relations(
  backupTableDetails,
  ({ one }) => ({
    backup: one(backups, {
      fields: [backupTableDetails.backupId],
      references: [backups.id],
    }),
  })
);

export const restoreOperationsRelations = relations(
  restoreOperations,
  ({ one, many }) => ({
    backup: one(backups, {
      fields: [restoreOperations.backupId],
      references: [backups.id],
    }),
    tableDetails: many(restoreTableDetails),
    initiatedByUser: one(users, {
      fields: [restoreOperations.initiatedBy],
      references: [users.id],
    }),
    approvedByUser: one(users, {
      fields: [restoreOperations.approvedBy],
      references: [users.id],
    }),
  })
);

export const restoreTableDetailsRelations = relations(
  restoreTableDetails,
  ({ one }) => ({
    restoreOperation: one(restoreOperations, {
      fields: [restoreTableDetails.restoreOperationId],
      references: [restoreOperations.id],
    }),
  })
);
