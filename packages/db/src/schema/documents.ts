import { relations } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { complianceFilings } from "./compliance";
import { users } from "./users";

// Enums for document management
export const documentTypeEnum = pgEnum("document_type", [
  "tax_return",
  "financial_statement",
  "audit_report",
  "bank_statement",
  "invoice",
  "receipt",
  "contract",
  "legal_document",
  "compliance_certificate",
  "correspondence",
  "working_paper",
  "supporting_document",
  "identification",
  "incorporation_document",
  "license",
  "other",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "under_review",
  "approved",
  "rejected",
  "archived",
  "expired",
]);

export const accessLevelEnum = pgEnum("access_level", [
  "public",
  "internal",
  "restricted",
  "confidential",
  "top_secret",
]);

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    clientId: text("client_id").references(() => clients.id),
    complianceFilingId: text("compliance_filing_id").references(
      () => complianceFilings.id
    ),

    // Document metadata
    fileName: text("file_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(), // in bytes
    documentType: documentTypeEnum("document_type").notNull(),
    status: documentStatusEnum("status").default("draft").notNull(),

    // Content and organization
    title: text("title"),
    description: text("description"),
    category: text("category"),
    tags: text("tags"), // JSON array of tags
    documentDate: timestamp("document_date"), // Date the document relates to
    fiscalPeriod: text("fiscal_period"), // e.g., "2024-Q1", "2024"

    // Security and access
    accessLevel: accessLevelEnum("access_level").default("internal").notNull(),
    isEncrypted: boolean("is_encrypted").default(false).notNull(),
    encryptionKey: text("encryption_key"), // Reference to encryption key
    passwordProtected: boolean("password_protected").default(false).notNull(),

    // File storage
    storagePath: text("storage_path").notNull(),
    storageProvider: text("storage_provider").default("local").notNull(), // local, s3, azure, etc.
    checksum: text("checksum"), // MD5 or SHA256 hash for integrity verification

    // Versioning
    version: text("version").default("1.0").notNull(),
    parentDocumentId: text("parent_document_id").references(
      (): AnyPgColumn => documents.id
    ),
    isLatestVersion: boolean("is_latest_version").default(true).notNull(),

    // Review and approval
    reviewedBy: text("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    approvedBy: text("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    reviewNotes: text("review_notes"),

    // Retention and expiry
    retentionPeriod: integer("retention_period"), // in years
    expiryDate: timestamp("expiry_date"),
    archiveDate: timestamp("archive_date"),
    deleteAfterDate: timestamp("delete_after_date"),

    // Additional metadata
    customFields: text("custom_fields"), // JSON object for additional fields
    notes: text("notes"),

    // Audit fields
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("documents_client_id_idx").on(table.clientId),
    index("documents_filing_id_idx").on(table.complianceFilingId),
    index("documents_type_idx").on(table.documentType),
    index("documents_status_idx").on(table.status),
    index("documents_access_level_idx").on(table.accessLevel),
    index("documents_created_by_idx").on(table.createdBy),
    index("documents_document_date_idx").on(table.documentDate),
    index("documents_fiscal_period_idx").on(table.fiscalPeriod),
    index("documents_parent_id_idx").on(table.parentDocumentId),
    index("documents_storage_path_idx").on(table.storagePath),
    index("documents_expiry_date_idx").on(table.expiryDate),
  ]
);

export const documentShares = pgTable(
  "document_shares",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    sharedWithUserId: text("shared_with_user_id").references(() => users.id),
    sharedWithEmail: text("shared_with_email"), // For external sharing
    sharedByUserId: text("shared_by_user_id")
      .notNull()
      .references(() => users.id),

    // Permissions
    canView: boolean("can_view").default(true).notNull(),
    canDownload: boolean("can_download").default(false).notNull(),
    canEdit: boolean("can_edit").default(false).notNull(),
    canShare: boolean("can_share").default(false).notNull(),

    // Access control
    expiresAt: timestamp("expires_at"),
    passwordRequired: boolean("password_required").default(false).notNull(),
    shareToken: text("share_token").unique(),
    accessCount: integer("access_count").default(0).notNull(),
    maxAccessCount: integer("max_access_count"),

    // Tracking
    lastAccessedAt: timestamp("last_accessed_at"),
    notes: text("notes"),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("document_shares_document_id_idx").on(table.documentId),
    index("document_shares_shared_with_user_idx").on(table.sharedWithUserId),
    index("document_shares_shared_by_user_idx").on(table.sharedByUserId),
    index("document_shares_share_token_idx").on(table.shareToken),
    index("document_shares_expires_at_idx").on(table.expiresAt),
  ]
);

export const documentAccessLogs = pgTable(
  "document_access_logs",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id),
    shareId: text("share_id").references(() => documentShares.id),

    // Access details
    action: text("action").notNull(), // view, download, edit, delete, share
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    location: text("location"),

    // Additional context
    success: boolean("success").default(true).notNull(),
    errorMessage: text("error_message"),
    metadata: text("metadata"), // JSON object for additional details

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("document_access_logs_document_id_idx").on(table.documentId),
    index("document_access_logs_user_id_idx").on(table.userId),
    index("document_access_logs_action_idx").on(table.action),
    index("document_access_logs_created_at_idx").on(table.createdAt),
    index("document_access_logs_success_idx").on(table.success),
  ]
);

// Relations
export const documentsRelations = relations(documents, ({ many, one }) => ({
  client: one(clients, {
    fields: [documents.clientId],
    references: [clients.id],
  }),
  complianceFiling: one(complianceFilings, {
    fields: [documents.complianceFilingId],
    references: [complianceFilings.id],
  }),
  parentDocument: one(documents, {
    fields: [documents.parentDocumentId],
    references: [documents.id],
  }),
  childDocuments: many(documents),
  reviewedByUser: one(users, {
    fields: [documents.reviewedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [documents.approvedBy],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  updatedByUser: one(users, {
    fields: [documents.updatedBy],
    references: [users.id],
  }),
  shares: many(documentShares),
  accessLogs: many(documentAccessLogs),
}));

export const documentSharesRelations = relations(documentShares, ({ one }) => ({
  document: one(documents, {
    fields: [documentShares.documentId],
    references: [documents.id],
  }),
  sharedWithUser: one(users, {
    fields: [documentShares.sharedWithUserId],
    references: [users.id],
  }),
  sharedByUser: one(users, {
    fields: [documentShares.sharedByUserId],
    references: [users.id],
  }),
}));

export const documentAccessLogsRelations = relations(
  documentAccessLogs,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentAccessLogs.documentId],
      references: [documents.id],
    }),
    user: one(users, {
      fields: [documentAccessLogs.userId],
      references: [users.id],
    }),
    share: one(documentShares, {
      fields: [documentAccessLogs.shareId],
      references: [documentShares.id],
    }),
  })
);
