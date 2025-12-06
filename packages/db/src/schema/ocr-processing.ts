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
  unique,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { organizations } from "./organizations";
import { users } from "./users";

// OCR document processing status
export const ocrProcessingStatusEnum = pgEnum("ocr_processing_status", [
  "queued",
  "processing",
  "completed",
  "failed",
  "cancelled",
  "retry",
  "manual_review",
]);

// OCR document types for specialized processing
export const ocrDocumentTypeEnum = pgEnum("ocr_document_type", [
  "receipt",
  "invoice",
  "bank_statement",
  "payslip",
  "tax_certificate",
  "contract",
  "id_document",
  "passport",
  "drivers_license",
  "utility_bill",
  "financial_statement",
  "business_registration",
  "tax_return",
  "customs_declaration",
  "other",
]);

// OCR confidence levels
export const ocrConfidenceLevelEnum = pgEnum("ocr_confidence_level", [
  "very_high", // 95-100%
  "high", // 85-94%
  "medium", // 70-84%
  "low", // 50-69%
  "very_low", // < 50%
]);

// OCR extraction quality assessment
export const ocrQualityEnum = pgEnum("ocr_quality", [
  "excellent",
  "good",
  "acceptable",
  "poor",
  "unusable",
]);

// OCR processing queue for document processing pipeline
export const ocrProcessingQueue = pgTable(
  "ocr_processing_queue",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "cascade",
    }),

    // Document identification
    documentId: text("document_id").notNull(), // Reference to document in document management system
    originalFileName: text("original_file_name").notNull(),
    documentType: ocrDocumentTypeEnum("document_type").notNull(),
    fileSize: integer("file_size").notNull(), // Size in bytes
    fileFormat: text("file_format").notNull(), // pdf, jpg, png, tiff, etc.
    pageCount: integer("page_count").default(1).notNull(),

    // Processing configuration
    processingEngine: text("processing_engine").default("tesseract").notNull(), // tesseract, aws_textract, azure_ocr, etc.
    language: text("language").default("en").notNull(), // Language code for OCR
    enableStructuredExtraction: boolean("enable_structured_extraction")
      .default(true)
      .notNull(),
    extractionTemplateId: text("extraction_template_id"), // Template for structured extraction

    // Processing status and metadata
    status: ocrProcessingStatusEnum("status").default("queued").notNull(),
    priority: integer("priority").default(5).notNull(), // 1-10, 1 being highest
    maxRetries: integer("max_retries").default(3).notNull(),
    retryCount: integer("retry_count").default(0).notNull(),
    processingAttempts: integer("processing_attempts").default(0).notNull(),

    // Queue scheduling
    scheduledFor: timestamp("scheduled_for"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    lastAttemptAt: timestamp("last_attempt_at"),
    estimatedProcessingTime: integer("estimated_processing_time"), // Seconds

    // Processing results
    extractedText: text("extracted_text"),
    structuredData: jsonb("structured_data").$type<{
      // Common fields across document types
      date?: string;
      amount?: number;
      currency?: string;
      vendor?: string;
      description?: string;

      // Receipt/Invoice specific
      lineItems?: Array<{
        description: string;
        quantity?: number;
        unitPrice?: number;
        totalPrice?: number;
        taxRate?: number;
      }>;
      subtotal?: number;
      taxAmount?: number;
      total?: number;
      vatNumber?: string;

      // Bank statement specific
      transactions?: Array<{
        date: string;
        description: string;
        amount: number;
        balance?: number;
        reference?: string;
      }>;

      // ID document specific
      fullName?: string;
      dateOfBirth?: string;
      documentNumber?: string;
      expiryDate?: string;
      nationality?: string;

      // Additional structured fields
      [key: string]: any;
    }>(),

    // Quality and confidence metrics
    overallConfidence: integer("overall_confidence"), // 0-100
    confidenceLevel: ocrConfidenceLevelEnum("confidence_level"),
    qualityScore: integer("quality_score"), // 0-100
    quality: ocrQualityEnum("quality"),

    // Page-level results for multi-page documents
    pageResults:
      jsonb("page_results").$type<
        Array<{
          pageNumber: number;
          text: string;
          confidence: number;
          boundingBoxes: Array<{
            text: string;
            confidence: number;
            x: number;
            y: number;
            width: number;
            height: number;
          }>;
          processingTime: number;
        }>
      >(),

    // Error handling and debugging
    errorMessage: text("error_message"),
    errorCode: text("error_code"),
    errorDetails: jsonb("error_details"),
    debugInfo: jsonb("debug_info"), // Processing engine specific debug information

    // Manual review workflow
    requiresReview: boolean("requires_review").default(false).notNull(),
    reviewReason: text("review_reason"),
    reviewAssignedTo: text("review_assigned_to").references(() => users.id),
    reviewedAt: timestamp("reviewed_at"),
    reviewNotes: text("review_notes"),
    reviewApproved: boolean("review_approved"),

    // Processing costs and billing
    processingCost: integer("processing_cost"), // Cost in smallest currency unit
    engineUsage: jsonb("engine_usage").$type<{
      pagesProcessed: number;
      apiCalls: number;
      computeTime: number; // seconds
      engineSpecificMetrics?: any;
    }>(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    processedBy: text("processed_by").references(() => users.id), // System or user who processed
  },
  (table) => [
    index("ocr_queue_org_id_idx").on(table.organizationId),
    index("ocr_queue_client_id_idx").on(table.clientId),
    index("ocr_queue_status_idx").on(table.status),
    index("ocr_queue_priority_idx").on(table.priority),
    index("ocr_queue_document_type_idx").on(table.documentType),
    index("ocr_queue_scheduled_for_idx").on(table.scheduledFor),
    index("ocr_queue_requires_review_idx").on(table.requiresReview),
    index("ocr_queue_processing_engine_idx").on(table.processingEngine),
    index("ocr_queue_confidence_level_idx").on(table.confidenceLevel),
    index("ocr_queue_quality_idx").on(table.quality),
    index("ocr_queue_created_at_idx").on(table.createdAt),
  ]
);

// OCR extraction templates for structured data extraction
export const ocrExtractionTemplates = pgTable(
  "ocr_extraction_templates",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Template identification
    templateName: text("template_name").notNull(),
    description: text("description"),
    documentType: ocrDocumentTypeEnum("document_type").notNull(),
    version: text("version").default("1.0").notNull(),

    // Template configuration
    extractionRules: jsonb("extraction_rules").notNull().$type<{
      fields: Array<{
        name: string;
        type: string; // text, number, date, currency
        required: boolean;
        validation?: {
          pattern?: string;
          min?: number;
          max?: number;
          format?: string;
        };
        extraction: {
          method: string; // regex, position, ml_model, keyword_search
          parameters: any;
          fallback?: any;
        };
      }>;
      regions?: Array<{
        name: string;
        x: number;
        y: number;
        width: number;
        height: number;
        page?: number;
      }>;
      postProcessing?: Array<{
        type: string; // validation, transformation, enrichment
        parameters: any;
      }>;
    }>(),

    // Template usage and performance
    isActive: boolean("is_active").default(true).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    successRate: integer("success_rate"), // Percentage
    averageConfidence: integer("average_confidence"), // Percentage
    lastUsedAt: timestamp("last_used_at"),

    // Template training and improvement
    trainingDataCount: integer("training_data_count").default(0).notNull(),
    lastTrainedAt: timestamp("last_trained_at"),
    modelVersion: text("model_version"),

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
    unique("ocr_templates_org_name_version_unique").on(
      table.organizationId,
      table.templateName,
      table.version
    ),
    index("ocr_templates_org_id_idx").on(table.organizationId),
    index("ocr_templates_document_type_idx").on(table.documentType),
    index("ocr_templates_is_active_idx").on(table.isActive),
    index("ocr_templates_last_used_idx").on(table.lastUsedAt),
  ]
);

// OCR accuracy tracking and improvement system
export const ocrAccuracyTracking = pgTable(
  "ocr_accuracy_tracking",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    processingId: text("processing_id")
      .notNull()
      .references(() => ocrProcessingQueue.id, { onDelete: "cascade" }),

    // Ground truth data for accuracy measurement
    groundTruthText: text("ground_truth_text"),
    groundTruthData: jsonb("ground_truth_data"), // Manually verified structured data

    // Accuracy metrics
    textAccuracy: integer("text_accuracy"), // Percentage - character-level accuracy
    wordAccuracy: integer("word_accuracy"), // Percentage - word-level accuracy
    fieldAccuracy: jsonb("field_accuracy").$type<Record<string, number>>(), // Field-specific accuracy
    structuralAccuracy: integer("structural_accuracy"), // Layout/structure detection accuracy

    // Error analysis
    commonErrors:
      jsonb("common_errors").$type<
        Array<{
          errorType: string;
          frequency: number;
          examples: Array<{
            expected: string;
            actual: string;
            context: string;
          }>;
        }>
      >(),

    // Feedback and corrections
    correctionsMade: jsonb("corrections_made").$type<{
      textCorrections: Array<{
        field: string;
        original: string;
        corrected: string;
        confidence: number;
      }>;
      structureCorrections: Array<{
        field: string;
        original: any;
        corrected: any;
      }>;
    }>(),

    // Validation source
    validatedBy: text("validated_by").references(() => users.id),
    validationMethod: text("validation_method"), // manual, automated, crowd_sourced
    validationConfidence: integer("validation_confidence"), // Percentage

    // Learning and improvement
    usedForTraining: boolean("used_for_training").default(false).notNull(),
    trainingWeight: integer("training_weight").default(1).notNull(), // Importance weight for training
    feedbackIncorporated: boolean("feedback_incorporated")
      .default(false)
      .notNull(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    validatedAt: timestamp("validated_at"),
  },
  (table) => [
    unique("ocr_accuracy_processing_unique").on(table.processingId),
    index("ocr_accuracy_org_id_idx").on(table.organizationId),
    index("ocr_accuracy_processing_id_idx").on(table.processingId),
    index("ocr_accuracy_validated_by_idx").on(table.validatedBy),
    index("ocr_accuracy_used_for_training_idx").on(table.usedForTraining),
    index("ocr_accuracy_validation_method_idx").on(table.validationMethod),
    index("ocr_accuracy_created_at_idx").on(table.createdAt),
  ]
);

// OCR engine configurations and performance tracking
export const ocrEngineConfigurations = pgTable(
  "ocr_engine_configurations",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Engine identification
    engineName: text("engine_name").notNull(), // tesseract, aws_textract, azure_ocr, google_vision
    engineVersion: text("engine_version"),
    configurationName: text("configuration_name").notNull(),
    description: text("description"),

    // Engine configuration
    engineConfig: jsonb("engine_config").notNull().$type<{
      // Tesseract specific
      oem?: number; // OCR Engine Mode
      psm?: number; // Page Segmentation Mode
      tessdataPath?: string;
      whitelist?: string;
      blacklist?: string;

      // Cloud OCR specific
      apiEndpoint?: string;
      region?: string;
      credentials?: any; // Encrypted

      // Common parameters
      timeout?: number;
      maxPages?: number;
      imagePreprocessing?: {
        deskew?: boolean;
        denoise?: boolean;
        resize?: boolean;
        contrast?: number;
        brightness?: number;
      };

      // Output formatting
      outputFormat?: string;
      includeConfidence?: boolean;
      includeBoundingBoxes?: boolean;

      [key: string]: any;
    }>(),

    // Usage and performance metrics
    isActive: boolean("is_active").default(true).notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    usageCount: integer("usage_count").default(0).notNull(),
    averageProcessingTime: integer("average_processing_time"), // Milliseconds
    averageAccuracy: integer("average_accuracy"), // Percentage
    averageConfidence: integer("average_confidence"), // Percentage
    costPerPage: integer("cost_per_page"), // Cost in smallest currency unit

    // Engine limits and quotas
    dailyQuota: integer("daily_quota"),
    monthlyQuota: integer("monthly_quota"),
    currentDailyUsage: integer("current_daily_usage").default(0).notNull(),
    currentMonthlyUsage: integer("current_monthly_usage").default(0).notNull(),
    quotaResetDate: timestamp("quota_reset_date"),

    // Error tracking
    errorRate: integer("error_rate"), // Percentage
    lastError: text("last_error"),
    lastErrorAt: timestamp("last_error_at"),

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
    lastUsedAt: timestamp("last_used_at"),
  },
  (table) => [
    unique("ocr_engines_org_name_unique").on(
      table.organizationId,
      table.configurationName
    ),
    index("ocr_engines_org_id_idx").on(table.organizationId),
    index("ocr_engines_engine_name_idx").on(table.engineName),
    index("ocr_engines_is_active_idx").on(table.isActive),
    index("ocr_engines_is_default_idx").on(table.isDefault),
    index("ocr_engines_last_used_idx").on(table.lastUsedAt),
  ]
);

// Relations
export const ocrProcessingQueueRelations = relations(
  ocrProcessingQueue,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [ocrProcessingQueue.organizationId],
      references: [organizations.id],
    }),
    client: one(clients, {
      fields: [ocrProcessingQueue.clientId],
      references: [clients.id],
    }),
    createdByUser: one(users, {
      fields: [ocrProcessingQueue.createdBy],
      references: [users.id],
      relationName: "ocrProcessingCreatedBy",
    }),
    processedByUser: one(users, {
      fields: [ocrProcessingQueue.processedBy],
      references: [users.id],
      relationName: "ocrProcessingProcessedBy",
    }),
    reviewAssignedToUser: one(users, {
      fields: [ocrProcessingQueue.reviewAssignedTo],
      references: [users.id],
      relationName: "ocrProcessingReviewAssignedTo",
    }),
    accuracyTracking: one(ocrAccuracyTracking, {
      fields: [ocrProcessingQueue.id],
      references: [ocrAccuracyTracking.processingId],
    }),
  })
);

export const ocrExtractionTemplatesRelations = relations(
  ocrExtractionTemplates,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [ocrExtractionTemplates.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [ocrExtractionTemplates.createdBy],
      references: [users.id],
      relationName: "ocrTemplateCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [ocrExtractionTemplates.updatedBy],
      references: [users.id],
      relationName: "ocrTemplateUpdatedBy",
    }),
  })
);

export const ocrAccuracyTrackingRelations = relations(
  ocrAccuracyTracking,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [ocrAccuracyTracking.organizationId],
      references: [organizations.id],
    }),
    processing: one(ocrProcessingQueue, {
      fields: [ocrAccuracyTracking.processingId],
      references: [ocrProcessingQueue.id],
    }),
    validatedByUser: one(users, {
      fields: [ocrAccuracyTracking.validatedBy],
      references: [users.id],
    }),
  })
);

export const ocrEngineConfigurationsRelations = relations(
  ocrEngineConfigurations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [ocrEngineConfigurations.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [ocrEngineConfigurations.createdBy],
      references: [users.id],
      relationName: "ocrEngineCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [ocrEngineConfigurations.updatedBy],
      references: [users.id],
      relationName: "ocrEngineUpdatedBy",
    }),
  })
);

// Export types
export type OcrProcessingQueue = typeof ocrProcessingQueue.$inferSelect;
export type NewOcrProcessingQueue = typeof ocrProcessingQueue.$inferInsert;
export type OcrExtractionTemplate = typeof ocrExtractionTemplates.$inferSelect;
export type NewOcrExtractionTemplate =
  typeof ocrExtractionTemplates.$inferInsert;
export type OcrAccuracyTracking = typeof ocrAccuracyTracking.$inferSelect;
export type NewOcrAccuracyTracking = typeof ocrAccuracyTracking.$inferInsert;
export type OcrEngineConfiguration =
  typeof ocrEngineConfigurations.$inferSelect;
export type NewOcrEngineConfiguration =
  typeof ocrEngineConfigurations.$inferInsert;
