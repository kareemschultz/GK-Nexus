import { z } from "zod";

// Document processing schemas
export const documentTypeSchema = z.enum(
  [
    "INVOICE",
    "RECEIPT",
    "BANK_STATEMENT",
    "TAX_FORM",
    "PASSPORT",
    "BIRTH_CERTIFICATE",
    "DRIVER_LICENSE",
    "UTILITY_BILL",
    "FINANCIAL_STATEMENT",
    "CONTRACT",
    "OTHER",
  ],
  {
    errorMap: () => ({ message: "Invalid document type" }),
  }
);

export const prioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"], {
  errorMap: () => ({ message: "Invalid priority level" }),
});

export const processingStatusSchema = z.enum(
  ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "VALIDATED", "CANCELLED"],
  {
    errorMap: () => ({ message: "Invalid processing status" }),
  }
);

// OCR Processing schemas
export const ocrExtractionOptionsSchema = z.object({
  extractText: z.boolean().default(true),
  extractTables: z.boolean().default(false),
  extractSignatures: z.boolean().default(false),
  detectLanguage: z.boolean().default(true),
  confidenceThreshold: z.number().min(0).max(1).default(0.85),
});

export const ocrProcessRequestSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  documentType: documentTypeSchema,
  priority: prioritySchema.default("NORMAL"),
  extractionOptions: ocrExtractionOptionsSchema.optional(),
  clientId: z.string().uuid("Invalid client ID"),
});

export const ocrProcessResponseSchema = z.object({
  processingId: z.string(),
  status: processingStatusSchema,
  priority: prioritySchema,
  estimatedCompletion: z.date(),
  documentInfo: z.object({
    name: z.string(),
    type: documentTypeSchema,
    size: z.number(),
  }),
});

// OCR Status schemas
export const ocrStatusRequestSchema = z.object({
  processingId: z.string().min(1, "Processing ID is required"),
  includeResults: z.boolean().default(false),
});

export const ocrStatusResponseSchema = z.object({
  id: z.string(),
  documentId: z.string(),
  clientId: z.string(),
  documentType: documentTypeSchema,
  status: processingStatusSchema,
  priority: prioritySchema,
  confidenceScore: z.number().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.date(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  results: z
    .array(
      z.object({
        extractedText: z.string().nullable(),
        extractedData: z.any().nullable(),
        confidenceScore: z.number().nullable(),
        processingMetadata: z.any().nullable(),
      })
    )
    .nullable(),
  processingDuration: z.number().nullable(),
});

// OCR Data extraction schemas
export const dataTypeSchema = z.enum(
  ["ALL", "TEXT", "STRUCTURED", "TABLES", "METADATA"],
  {
    errorMap: () => ({ message: "Invalid data type" }),
  }
);

export const ocrDataRequestSchema = z.object({
  processingId: z.string().min(1, "Processing ID is required"),
  dataType: dataTypeSchema.default("ALL"),
});

export const ocrExtractedDataSchema = z.object({
  text: z.string().optional(),
  structured: z.record(z.any()).optional(),
  tables: z.array(z.any()).optional(),
  entities: z.array(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  overallConfidence: z.number().optional(),
});

// OCR Validation schemas
export const ocrValidationSchema = z.object({
  processingId: z.string().min(1, "Processing ID is required"),
  corrections: z.object({
    text: z.string().optional(),
    structuredData: z.record(z.any()).optional(),
    confidence: z.number().min(0).max(1).optional(),
  }),
  validatedBy: z.string().uuid().optional(),
  notes: z.string().max(1000).optional(),
});

export const ocrValidationResponseSchema = z.object({
  resultId: z.string(),
  newConfidenceScore: z.number().nullable(),
  validatedAt: z.date(),
});

// OCR Statistics schemas
export const ocrStatsRequestSchema = z.object({
  clientId: z.string().uuid().optional(),
  documentType: z.string().optional(),
  dateRange: z
    .object({
      startDate: z.string().datetime("Invalid start date"),
      endDate: z.string().datetime("Invalid end date"),
    })
    .optional(),
});

export const ocrStatsResponseSchema = z.object({
  overview: z.object({
    totalJobs: z.number(),
    completedJobs: z.number(),
    failedJobs: z.number(),
    avgConfidence: z.number().nullable(),
    avgProcessingTime: z.number().nullable(),
    successRate: z.number(),
    avgProcessingTimeMinutes: z.number(),
  }),
  statusBreakdown: z.array(
    z.object({
      status: processingStatusSchema,
      count: z.number(),
    })
  ),
  documentTypeBreakdown: z.array(
    z.object({
      documentType: documentTypeSchema,
      count: z.number(),
      avgConfidence: z.number().nullable(),
    })
  ),
  dailyVolume: z.array(
    z.object({
      date: z.string(),
      count: z.number(),
    })
  ),
});

// Batch processing schemas
export const batchDocumentSchema = z.object({
  documentId: z.string().uuid("Invalid document ID"),
  documentType: documentTypeSchema,
});

export const batchProcessRequestSchema = z.object({
  documents: z
    .array(batchDocumentSchema)
    .min(1, "At least one document required"),
  clientId: z.string().uuid("Invalid client ID"),
  priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
  extractionOptions: ocrExtractionOptionsSchema.optional(),
});

export const batchProcessResponseSchema = z.object({
  batchId: z.string(),
  totalDocuments: z.number(),
  processingJobs: z.array(
    z.object({
      id: z.string(),
      documentId: z.string(),
      documentType: documentTypeSchema,
      status: processingStatusSchema,
    })
  ),
  status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"]),
  estimatedCompletion: z.date(),
});

export const batchStatusSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
});

export const batchStatusResponseSchema = z.object({
  batchId: z.string(),
  status: z.enum(["QUEUED", "PROCESSING", "COMPLETED", "FAILED"]),
  summary: z.object({
    total: z.number(),
    completed: z.number(),
    failed: z.number(),
    processing: z.number(),
    queued: z.number(),
    completionRate: z.number(),
    avgConfidence: z.number(),
  }),
  jobs: z.array(
    z.object({
      id: z.string(),
      documentId: z.string(),
      documentType: documentTypeSchema,
      status: processingStatusSchema,
      confidenceScore: z.number().nullable(),
      createdAt: z.date(),
      startedAt: z.date().nullable(),
      completedAt: z.date().nullable(),
      errorMessage: z.string().nullable(),
    })
  ),
});

// Structured data schemas for specific document types
export const invoiceDataSchema = z.object({
  invoiceNumber: z.string().optional(),
  date: z.string().optional(),
  billTo: z.string().optional(),
  billFrom: z.string().optional(),
  subtotal: z.number().optional(),
  vat: z.number().optional(),
  total: z.number().optional(),
  currency: z.string().optional(),
  items: z
    .array(
      z.object({
        description: z.string(),
        quantity: z.number().optional(),
        unitPrice: z.number().optional(),
        amount: z.number().optional(),
      })
    )
    .optional(),
});

export const receiptDataSchema = z.object({
  store: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
        quantity: z.number().optional(),
      })
    )
    .optional(),
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
  paymentMethod: z.string().optional(),
});

export const passportDataSchema = z.object({
  passportNumber: z.string().optional(),
  surname: z.string().optional(),
  givenNames: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  sex: z.enum(["M", "F"]).optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  issuingCountry: z.string().optional(),
});

export const identityDocumentDataSchema = z.object({
  documentNumber: z.string().optional(),
  fullName: z.string().optional(),
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  address: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  issuingAuthority: z.string().optional(),
});

// Type exports
export type DocumentType = z.infer<typeof documentTypeSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type ProcessingStatus = z.infer<typeof processingStatusSchema>;
export type OCRExtractionOptions = z.infer<typeof ocrExtractionOptionsSchema>;
export type OCRProcessRequest = z.infer<typeof ocrProcessRequestSchema>;
export type OCRProcessResponse = z.infer<typeof ocrProcessResponseSchema>;
export type OCRStatusRequest = z.infer<typeof ocrStatusRequestSchema>;
export type OCRStatusResponse = z.infer<typeof ocrStatusResponseSchema>;
export type DataType = z.infer<typeof dataTypeSchema>;
export type OCRDataRequest = z.infer<typeof ocrDataRequestSchema>;
export type OCRExtractedData = z.infer<typeof ocrExtractedDataSchema>;
export type OCRValidation = z.infer<typeof ocrValidationSchema>;
export type OCRValidationResponse = z.infer<typeof ocrValidationResponseSchema>;
export type OCRStatsRequest = z.infer<typeof ocrStatsRequestSchema>;
export type OCRStatsResponse = z.infer<typeof ocrStatsResponseSchema>;
export type BatchDocument = z.infer<typeof batchDocumentSchema>;
export type BatchProcessRequest = z.infer<typeof batchProcessRequestSchema>;
export type BatchProcessResponse = z.infer<typeof batchProcessResponseSchema>;
export type BatchStatusRequest = z.infer<typeof batchStatusSchema>;
export type BatchStatusResponse = z.infer<typeof batchStatusResponseSchema>;
export type InvoiceData = z.infer<typeof invoiceDataSchema>;
export type ReceiptData = z.infer<typeof receiptDataSchema>;
export type PassportData = z.infer<typeof passportDataSchema>;
export type IdentityDocumentData = z.infer<typeof identityDocumentDataSchema>;
