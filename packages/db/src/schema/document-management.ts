import { relations } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
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

// Extended document types for enhanced categorization
export const enhancedDocumentTypeEnum = pgEnum("enhanced_document_type", [
  // Tax documents
  "paye_certificate",
  "vat_return",
  "corporate_tax_return",
  "withholding_tax_certificate",
  "nis_contribution_record",
  "tax_assessment",
  "tax_clearance_certificate",

  // Financial documents
  "financial_statement",
  "balance_sheet",
  "income_statement",
  "cash_flow_statement",
  "bank_statement",
  "bank_reconciliation",
  "trial_balance",

  // Business documents
  "invoice",
  "receipt",
  "purchase_order",
  "delivery_note",
  "credit_note",
  "debit_note",
  "quotation",
  "contract",
  "agreement",

  // Compliance documents
  "audit_report",
  "compliance_certificate",
  "license",
  "permit",
  "registration_certificate",
  "incorporation_document",
  "memorandum_of_association",
  "articles_of_association",

  // Immigration documents
  "passport",
  "visa",
  "work_permit",
  "residence_permit",
  "birth_certificate",
  "marriage_certificate",
  "police_certificate",
  "medical_certificate",
  "educational_certificate",
  "employment_letter",

  // Legal documents
  "power_of_attorney",
  "affidavit",
  "statutory_declaration",
  "court_order",
  "legal_opinion",

  // Correspondence
  "email",
  "letter",
  "memo",
  "notice",
  "circular",

  // Working papers
  "audit_working_paper",
  "tax_working_paper",
  "analysis",
  "calculation",

  // Other
  "identification",
  "supporting_document",
  "miscellaneous",
]);

// OCR processing status
export const ocrStatusEnum = pgEnum("ocr_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "manual_review_required",
  "verified",
  "rejected",
]);

// Document processing priority levels
export const processingPriorityEnum = pgEnum("processing_priority", [
  "low",
  "normal",
  "high",
  "urgent",
  "critical",
]);

// Storage tiers for lifecycle management
export const storageTierEnum = pgEnum("storage_tier", [
  "hot", // Frequently accessed
  "warm", // Occasionally accessed
  "cold", // Rarely accessed
  "archive", // Long-term retention
  "glacier", // Deep archive
]);

// Enhanced documents table extending the base documents functionality
export const enhancedDocuments = pgTable(
  "enhanced_documents",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id),

    // Document identification and metadata
    fileName: text("file_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    documentNumber: text("document_number"), // Internal document number
    externalReference: text("external_reference"), // External reference number

    // Enhanced typing and categorization
    documentType: enhancedDocumentTypeEnum("document_type").notNull(),
    subCategory: text("sub_category"), // Fine-grained categorization
    businessContext: text("business_context"), // tax_filing, audit, compliance, etc.

    // File information
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(), // in bytes
    fileExtension: text("file_extension"),

    // Content and description
    title: text("title").notNull(),
    description: text("description"),
    summary: text("summary"), // AI-generated summary
    tags: jsonb("tags").$type<string[]>(), // Enhanced tags as JSON array

    // Date and period information
    documentDate: timestamp("document_date"), // Date the document relates to
    receivedDate: timestamp("received_date"), // When document was received
    issuedDate: timestamp("issued_date"), // When document was issued
    effectiveDate: timestamp("effective_date"), // When document becomes effective
    expirationDate: timestamp("expiration_date"), // When document expires
    fiscalYear: integer("fiscal_year"),
    fiscalPeriod: text("fiscal_period"), // Q1, Q2, Q3, Q4, or custom period
    taxYear: integer("tax_year"),

    // Storage and access
    storagePath: text("storage_path").notNull(),
    storageProvider: text("storage_provider").default("s3").notNull(),
    storageRegion: text("storage_region"),
    storageTier: storageTierEnum("storage_tier").default("hot").notNull(),
    contentUrl: text("content_url"), // Direct access URL
    thumbnailUrl: text("thumbnail_url"), // Thumbnail/preview URL

    // Security and integrity
    checksum: text("checksum").notNull(), // SHA-256 hash
    encryptionKey: text("encryption_key"), // Reference to encryption key
    isEncrypted: boolean("is_encrypted").default(true).notNull(),
    accessLevel: text("access_level").default("internal").notNull(),

    // Processing and workflow
    processingPriority: processingPriorityEnum("processing_priority")
      .default("normal")
      .notNull(),
    processingStatus: text("processing_status").default("pending").notNull(),
    workflowStage: text("workflow_stage"), // intake, review, approval, archive, etc.
    assignedTo: text("assigned_to").references(() => users.id),

    // Versioning and relationships
    version: text("version").default("1.0").notNull(),
    parentDocumentId: text("parent_document_id").references(
      (): AnyPgColumn => enhancedDocuments.id
    ),
    isLatestVersion: boolean("is_latest_version").default(true).notNull(),
    supersededBy: text("superseded_by").references(
      (): AnyPgColumn => enhancedDocuments.id
    ),

    // Compliance and retention
    retentionPeriod: integer("retention_period"), // Years to retain
    legalHold: boolean("legal_hold").default(false).notNull(),
    confidentialityLevel: text("confidentiality_level")
      .default("internal")
      .notNull(),

    // Business metadata
    amount: decimal("amount", { precision: 15, scale: 2 }), // For financial documents
    currency: text("currency").default("GYD"),
    counterparty: text("counterparty"), // Other party in transaction
    department: text("department"),
    project: text("project"),
    costCenter: text("cost_center"),

    // Additional structured data
    customFields: jsonb("custom_fields").$type<Record<string, any>>(),
    businessData: jsonb("business_data").$type<{
      vendor?: {
        name: string;
        tinNumber?: string;
        address?: string;
      };
      invoice?: {
        invoiceNumber: string;
        subtotal: number;
        vatAmount: number;
        total: number;
        dueDate?: string;
      };
      payment?: {
        method: string;
        reference: string;
        bankAccount?: string;
      };
      tax?: {
        taxType: string;
        taxYear: number;
        period: string;
        amount: number;
      };
    }>(),

    // Status tracking
    status: text("status").default("active").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),

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
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by").references(() => users.id),
  },
  (table) => [
    index("enhanced_documents_org_id_idx").on(table.organizationId),
    index("enhanced_documents_client_id_idx").on(table.clientId),
    index("enhanced_documents_type_idx").on(table.documentType),
    index("enhanced_documents_business_context_idx").on(table.businessContext),
    index("enhanced_documents_document_date_idx").on(table.documentDate),
    index("enhanced_documents_fiscal_year_idx").on(table.fiscalYear),
    index("enhanced_documents_tax_year_idx").on(table.taxYear),
    index("enhanced_documents_storage_tier_idx").on(table.storageTier),
    index("enhanced_documents_processing_status_idx").on(
      table.processingStatus
    ),
    index("enhanced_documents_assigned_to_idx").on(table.assignedTo),
    index("enhanced_documents_parent_id_idx").on(table.parentDocumentId),
    index("enhanced_documents_checksum_idx").on(table.checksum),
    index("enhanced_documents_status_idx").on(table.status),
    index("enhanced_documents_created_at_idx").on(table.createdAt),
    index("enhanced_documents_deleted_at_idx").on(table.deletedAt),
  ]
);

// OCR processing results and metadata
export const documentOcrResults = pgTable(
  "document_ocr_results",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => enhancedDocuments.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // OCR processing details
    ocrProvider: text("ocr_provider").notNull(), // tesseract, google_vision, aws_textract, azure_form_recognizer
    ocrModel: text("ocr_model"), // Specific model version used
    processingStarted: timestamp("processing_started").notNull(),
    processingCompleted: timestamp("processing_completed"),
    processingDuration: integer("processing_duration"), // milliseconds

    // OCR status and results
    status: ocrStatusEnum("status").default("pending").notNull(),
    confidenceScore: decimal("confidence_score", { precision: 5, scale: 4 }), // 0.0000 to 1.0000

    // Extracted content
    rawText: text("raw_text"), // Complete extracted text
    structuredData: jsonb("structured_data").$type<{
      // Common structured fields
      title?: string;
      documentNumber?: string;
      date?: string;
      amount?: number;
      currency?: string;

      // Tax document specific fields
      tinNumber?: string;
      taxYear?: number;
      taxType?: string;
      taxAmount?: number;

      // Invoice specific fields
      invoiceNumber?: string;
      vendor?: {
        name: string;
        address?: string;
        tinNumber?: string;
      };
      customer?: {
        name: string;
        address?: string;
      };
      lineItems?: Array<{
        description: string;
        quantity?: number;
        unitPrice?: number;
        amount: number;
      }>;

      // Bank statement specific fields
      accountNumber?: string;
      statementPeriod?: {
        start: string;
        end: string;
      };
      transactions?: Array<{
        date: string;
        description: string;
        amount: number;
        balance: number;
      }>;

      // Additional extracted fields
      customFields?: Record<string, any>;
    }>(),

    // Content analysis
    documentClass: text("document_class"), // Classified document type
    classificationConfidence: decimal("classification_confidence", {
      precision: 5,
      scale: 4,
    }),
    language: text("language").default("en"),
    pageCount: integer("page_count"),

    // Quality metrics
    textQuality: text("text_quality"), // poor, fair, good, excellent
    imageQuality: text("image_quality"), // poor, fair, good, excellent
    skewAngle: decimal("skew_angle", { precision: 5, scale: 2 }), // Document rotation angle

    // Processing configuration
    preprocessingSteps: jsonb("preprocessing_steps").$type<
      Array<{
        step: string;
        parameters: Record<string, any>;
        duration: number;
      }>
    >(),

    // Validation and verification
    isHumanVerified: boolean("is_human_verified").default(false).notNull(),
    verificationNotes: text("verification_notes"),
    correctionsMade:
      jsonb("corrections_made").$type<
        Array<{
          field: string;
          originalValue: string;
          correctedValue: string;
          correctedBy: string;
          correctedAt: string;
        }>
      >(),

    // Error handling
    errorMessage: text("error_message"),
    errorCode: text("error_code"),
    retryCount: integer("retry_count").default(0).notNull(),

    // Performance and cost tracking
    processingCost: decimal("processing_cost", { precision: 10, scale: 4 }),
    costCurrency: text("cost_currency").default("USD"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    processedBy: text("processed_by").references(() => users.id),
    verifiedBy: text("verified_by").references(() => users.id),
  },
  (table) => [
    index("document_ocr_results_document_id_idx").on(table.documentId),
    index("document_ocr_results_org_id_idx").on(table.organizationId),
    index("document_ocr_results_status_idx").on(table.status),
    index("document_ocr_results_provider_idx").on(table.ocrProvider),
    index("document_ocr_results_confidence_idx").on(table.confidenceScore),
    index("document_ocr_results_document_class_idx").on(table.documentClass),
    index("document_ocr_results_verification_idx").on(table.isHumanVerified),
    index("document_ocr_results_created_at_idx").on(table.createdAt),
    index("document_ocr_results_processing_completed_idx").on(
      table.processingCompleted
    ),
  ]
);

// Document templates for standardized document creation
export const documentTemplates = pgTable(
  "document_templates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),

    // Template identification
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    description: text("description"),
    category: text("category").notNull(), // tax, legal, financial, etc.
    documentType: enhancedDocumentTypeEnum("document_type").notNull(),

    // Template content
    templateContent: text("template_content"), // HTML or markdown template
    templateVariables:
      jsonb("template_variables").$type<
        Array<{
          name: string;
          type: "text" | "number" | "date" | "boolean" | "select";
          label: string;
          description?: string;
          required: boolean;
          defaultValue?: any;
          options?: string[]; // For select type
          validation?: {
            pattern?: string;
            min?: number;
            max?: number;
            minLength?: number;
            maxLength?: number;
          };
        }>
      >(),

    // GRA-specific template configuration
    graFormCode: text("gra_form_code"), // Official GRA form code
    graVersion: text("gra_version"), // GRA form version
    isGraApproved: boolean("is_gra_approved").default(false).notNull(),

    // Template metadata
    version: text("version").default("1.0").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),

    // Validation rules
    validationRules: jsonb("validation_rules").$type<{
      requiredFields: string[];
      businessRules: Array<{
        rule: string;
        condition: string;
        message: string;
      }>;
      calculations: Array<{
        field: string;
        formula: string;
        dependencies: string[];
      }>;
    }>(),

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
    unique("document_templates_org_name_unique").on(
      table.organizationId,
      table.name
    ),
    index("document_templates_org_id_idx").on(table.organizationId),
    index("document_templates_category_idx").on(table.category),
    index("document_templates_document_type_idx").on(table.documentType),
    index("document_templates_gra_form_code_idx").on(table.graFormCode),
    index("document_templates_is_active_idx").on(table.isActive),
    index("document_templates_is_public_idx").on(table.isPublic),
  ]
);

// Document workflow and approval processes
export const documentWorkflows = pgTable(
  "document_workflows",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => enhancedDocuments.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Workflow definition
    workflowName: text("workflow_name").notNull(),
    currentStage: text("current_stage").notNull(),
    previousStage: text("previous_stage"),
    nextStage: text("next_stage"),

    // Workflow status
    status: text("status").default("active").notNull(), // active, completed, cancelled, on_hold
    completedStages:
      jsonb("completed_stages").$type<
        Array<{
          stage: string;
          completedAt: string;
          completedBy: string;
          notes?: string;
          duration: number; // minutes
        }>
      >(),

    // Assignment and responsibility
    assignedTo: text("assigned_to").references(() => users.id),
    assignedRole: text("assigned_role"), // Role that can process this stage
    escalatedTo: text("escalated_to").references(() => users.id),
    escalationReason: text("escalation_reason"),

    // Timing and deadlines
    dueDate: timestamp("due_date"),
    escalationDate: timestamp("escalation_date"),
    completedAt: timestamp("completed_at"),
    totalProcessingTime: integer("total_processing_time"), // minutes

    // Workflow data and context
    workflowData: jsonb("workflow_data").$type<{
      approvals: Array<{
        stage: string;
        approver: string;
        approved: boolean;
        comments?: string;
        approvedAt: string;
      }>;
      rejections: Array<{
        stage: string;
        rejectedBy: string;
        reason: string;
        rejectedAt: string;
        canRetry: boolean;
      }>;
      comments: Array<{
        author: string;
        comment: string;
        timestamp: string;
        stage: string;
      }>;
      attachments: Array<{
        name: string;
        url: string;
        uploadedBy: string;
        uploadedAt: string;
      }>;
    }>(),

    // Workflow configuration
    autoAdvance: boolean("auto_advance").default(false).notNull(),
    requiresApproval: boolean("requires_approval").default(true).notNull(),
    notificationSettings: jsonb("notification_settings").$type<{
      emailNotifications: boolean;
      smsNotifications: boolean;
      reminderFrequency: number; // hours
      escalationNotifications: boolean;
    }>(),

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
    index("document_workflows_document_id_idx").on(table.documentId),
    index("document_workflows_org_id_idx").on(table.organizationId),
    index("document_workflows_current_stage_idx").on(table.currentStage),
    index("document_workflows_status_idx").on(table.status),
    index("document_workflows_assigned_to_idx").on(table.assignedTo),
    index("document_workflows_due_date_idx").on(table.dueDate),
    index("document_workflows_created_at_idx").on(table.createdAt),
  ]
);

// Relations
export const enhancedDocumentsRelations = relations(
  enhancedDocuments,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [enhancedDocuments.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [enhancedDocuments.clientId],
      references: [clients.id],
    }),
    parentDocument: one(enhancedDocuments, {
      fields: [enhancedDocuments.parentDocumentId],
      references: [enhancedDocuments.id],
      relationName: "parentDocument",
    }),
    childDocuments: many(enhancedDocuments, {
      relationName: "parentDocument",
    }),
    supersededByDocument: one(enhancedDocuments, {
      fields: [enhancedDocuments.supersededBy],
      references: [enhancedDocuments.id],
      relationName: "supersededDocument",
    }),
    assignedToUser: one(users, {
      fields: [enhancedDocuments.assignedTo],
      references: [users.id],
      relationName: "documentAssignedTo",
    }),
    createdByUser: one(users, {
      fields: [enhancedDocuments.createdBy],
      references: [users.id],
      relationName: "documentCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [enhancedDocuments.updatedBy],
      references: [users.id],
      relationName: "documentUpdatedBy",
    }),
    deletedByUser: one(users, {
      fields: [enhancedDocuments.deletedBy],
      references: [users.id],
      relationName: "documentDeletedBy",
    }),
    ocrResults: many(documentOcrResults),
    workflows: many(documentWorkflows),
  })
);

export const documentOcrResultsRelations = relations(
  documentOcrResults,
  ({ one }) => ({
    document: one(enhancedDocuments, {
      fields: [documentOcrResults.documentId],
      references: [enhancedDocuments.id],
    }),
    organization: one(organizations, {
      fields: [documentOcrResults.organizationId],
      references: [organizations.id],
    }),
    processedByUser: one(users, {
      fields: [documentOcrResults.processedBy],
      references: [users.id],
      relationName: "ocrProcessedBy",
    }),
    verifiedByUser: one(users, {
      fields: [documentOcrResults.verifiedBy],
      references: [users.id],
      relationName: "ocrVerifiedBy",
    }),
  })
);

export const documentTemplatesRelations = relations(
  documentTemplates,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [documentTemplates.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [documentTemplates.createdBy],
      references: [users.id],
      relationName: "templateCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [documentTemplates.updatedBy],
      references: [users.id],
      relationName: "templateUpdatedBy",
    }),
  })
);

export const documentWorkflowsRelations = relations(
  documentWorkflows,
  ({ one }) => ({
    document: one(enhancedDocuments, {
      fields: [documentWorkflows.documentId],
      references: [enhancedDocuments.id],
    }),
    organization: one(organizations, {
      fields: [documentWorkflows.organizationId],
      references: [organizations.id],
    }),
    assignedToUser: one(users, {
      fields: [documentWorkflows.assignedTo],
      references: [users.id],
      relationName: "workflowAssignedTo",
    }),
    escalatedToUser: one(users, {
      fields: [documentWorkflows.escalatedTo],
      references: [users.id],
      relationName: "workflowEscalatedTo",
    }),
    createdByUser: one(users, {
      fields: [documentWorkflows.createdBy],
      references: [users.id],
      relationName: "workflowCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [documentWorkflows.updatedBy],
      references: [users.id],
      relationName: "workflowUpdatedBy",
    }),
  })
);
