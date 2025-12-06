import { businessSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";

// OCR Document Processing API - FLAT procedures

// Helper function for simulating OCR processing
async function simulateOcrProcessing(
  db: any,
  processingId: string,
  document: any,
  documentType: string
) {
  try {
    // Update status to processing
    await db
      .update(businessSchema.ocrProcessingJob)
      .set({
        status: "PROCESSING",
        startedAt: new Date(),
      })
      .where(eq(businessSchema.ocrProcessingJob.id, processingId));

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate mock extracted data based on document type
    let mockExtractedText = "";
    let mockStructuredData = {};

    switch (documentType) {
      case "INVOICE":
        mockExtractedText =
          "INVOICE\nInvoice #: INV-2024-001\nDate: 2024-01-15\nBill To: ABC Company Ltd.\nAmount: $1,250.00\nVAT: $175.00\nTotal: $1,425.00";
        mockStructuredData = {
          invoiceNumber: "INV-2024-001",
          date: "2024-01-15",
          billTo: "ABC Company Ltd.",
          subtotal: 1250.0,
          vat: 175.0,
          total: 1425.0,
          detectedLanguage: "en",
          structuredFields: {
            invoiceNumber: { value: "INV-2024-001", confidence: 0.98 },
            total: { value: 1425.0, confidence: 0.95 },
            date: { value: "2024-01-15", confidence: 0.92 },
          },
        };
        break;

      case "RECEIPT":
        mockExtractedText =
          "RECEIPT\nStore: Sample Store\nDate: 2024-01-15 14:30\nItems:\n- Coffee: $3.50\n- Sandwich: $8.00\nSubtotal: $11.50\nTax: $1.61\nTotal: $13.11";
        mockStructuredData = {
          store: "Sample Store",
          date: "2024-01-15",
          items: [
            { name: "Coffee", price: 3.5 },
            { name: "Sandwich", price: 8.0 },
          ],
          subtotal: 11.5,
          tax: 1.61,
          total: 13.11,
          detectedLanguage: "en",
        };
        break;

      default:
        mockExtractedText = `Document content extracted from ${document.fileName}`;
        mockStructuredData = {
          documentType,
          detectedLanguage: "en",
          extractedFields: {},
        };
    }

    const confidenceScore = 0.85 + Math.random() * 0.1; // Random confidence between 0.85-0.95

    // Save OCR results
    await db.insert(businessSchema.ocrResult).values({
      processingId,
      extractedText: mockExtractedText,
      extractedData: JSON.stringify(mockStructuredData),
      confidenceScore,
      processingMetadata: JSON.stringify({
        processingTime: 2000,
        ocrEngine: "MockOCR v1.0",
        imageQuality: "HIGH",
        textRegions: 5,
      }),
    });

    // Update job status to completed
    await db
      .update(businessSchema.ocrProcessingJob)
      .set({
        status: "COMPLETED",
        completedAt: new Date(),
        confidenceScore,
      })
      .where(eq(businessSchema.ocrProcessingJob.id, processingId));
  } catch (error) {
    // Update job status to failed
    await db
      .update(businessSchema.ocrProcessingJob)
      .set({
        status: "FAILED",
        completedAt: new Date(),
        errorMessage:
          error instanceof Error ? error.message : "Processing failed",
      })
      .where(eq(businessSchema.ocrProcessingJob.id, processingId));
  }
}

// Submit document for OCR processing
export const ocrProcessDocument = protectedProcedure
  // .use(requirePermission("documents.create"))
  .input(
    z.object({
      documentId: z.string().uuid(),
      documentType: z.enum([
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
      ]),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
      extractionOptions: z
        .object({
          extractText: z.boolean().default(true),
          extractTables: z.boolean().default(false),
          extractSignatures: z.boolean().default(false),
          detectLanguage: z.boolean().default(true),
          confidenceThreshold: z.number().min(0).max(1).default(0.85),
        })
        .optional(),
      clientId: z.string().uuid(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    const { documentId, documentType, priority, extractionOptions, clientId } =
      input;

    try {
      // Verify document exists
      const [document] = await db
        .select({
          id: businessSchema.document.id,
          name: businessSchema.document.name,
          fileName: businessSchema.document.fileName,
          fileUrl: businessSchema.document.fileUrl,
          mimeType: businessSchema.document.mimeType,
          fileSize: businessSchema.document.fileSize,
        })
        .from(businessSchema.document)
        .where(
          and(
            eq(businessSchema.document.id, documentId),
            eq(businessSchema.document.clientId, clientId)
          )
        )
        .limit(1);

      if (!document) {
        throw new ORPCError("NOT_FOUND", { message: "Document not found" });
      }

      // Check if document is supported for OCR
      const supportedMimeTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/tiff",
        "image/bmp",
      ];

      if (
        document.mimeType &&
        !supportedMimeTypes.includes(document.mimeType)
      ) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Document type not supported for OCR processing",
        });
      }

      // Create OCR processing job
      const processingId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

      const [ocrJob] = await db
        .insert(businessSchema.ocrProcessingJob)
        .values({
          id: processingId,
          documentId,
          clientId,
          documentType,
          priority,
          status: "QUEUED",
          extractionOptions: extractionOptions
            ? JSON.stringify(extractionOptions)
            : null,
          createdBy: user?.id!,
        })
        .returning({
          id: businessSchema.ocrProcessingJob.id,
          status: businessSchema.ocrProcessingJob.status,
          priority: businessSchema.ocrProcessingJob.priority,
          createdAt: businessSchema.ocrProcessingJob.createdAt,
        });

      // Simulate processing based on document type and priority
      const estimatedProcessingTime = {
        LOW: 300, // 5 minutes
        NORMAL: 180, // 3 minutes
        HIGH: 60, // 1 minute
        URGENT: 30, // 30 seconds
      }[priority];

      const estimatedCompletion = new Date(
        Date.now() + estimatedProcessingTime * 1000
      );

      // In a real implementation, this would trigger the OCR processing pipeline
      // For now, we'll simulate immediate processing for demonstration
      setTimeout(async () => {
        await simulateOcrProcessing(db, processingId, document, documentType);
      }, 1000);

      if (!ocrJob) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create OCR processing job",
        });
      }

      return {
        success: true,
        data: {
          processingId: ocrJob.id,
          status: ocrJob.status,
          priority: ocrJob.priority,
          estimatedCompletion,
          documentInfo: {
            name: document.name,
            type: documentType,
            size: document.fileSize,
          },
        },
        message: "Document submitted for OCR processing",
      };
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to submit document for OCR processing",
      });
    }
  });

// Get OCR processing status
export const ocrGetProcessingStatus = protectedProcedure
  // .use(requirePermission("documents.read"))
  .input(
    z.object({
      processingId: z.string().min(1),
      includeResults: z.boolean().default(false),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { processingId, includeResults } = input;

    try {
      const [ocrJob] = await db
        .select({
          id: businessSchema.ocrProcessingJob.id,
          documentId: businessSchema.ocrProcessingJob.documentId,
          clientId: businessSchema.ocrProcessingJob.clientId,
          documentType: businessSchema.ocrProcessingJob.documentType,
          status: businessSchema.ocrProcessingJob.status,
          priority: businessSchema.ocrProcessingJob.priority,
          confidenceScore: businessSchema.ocrProcessingJob.confidenceScore,
          errorMessage: businessSchema.ocrProcessingJob.errorMessage,
          createdAt: businessSchema.ocrProcessingJob.createdAt,
          startedAt: businessSchema.ocrProcessingJob.startedAt,
          completedAt: businessSchema.ocrProcessingJob.completedAt,
        })
        .from(businessSchema.ocrProcessingJob)
        .where(eq(businessSchema.ocrProcessingJob.id, processingId))
        .limit(1);

      if (!ocrJob) {
        throw new ORPCError("NOT_FOUND", {
          message: "OCR processing job not found",
        });
      }

      let results = null;
      if (includeResults && ocrJob.status === "COMPLETED") {
        const ocrResults = await db
          .select({
            extractedText: businessSchema.ocrResult.extractedText,
            extractedData: businessSchema.ocrResult.extractedData,
            confidenceScore: businessSchema.ocrResult.confidenceScore,
            processingMetadata: businessSchema.ocrResult.processingMetadata,
          })
          .from(businessSchema.ocrResult)
          .where(eq(businessSchema.ocrResult.processingId, processingId));

        results = ocrResults.map((result) => ({
          ...result,
          extractedData: result.extractedData
            ? JSON.parse(result.extractedData)
            : null,
          processingMetadata: result.processingMetadata
            ? JSON.parse(result.processingMetadata)
            : null,
        }));
      }

      return {
        success: true,
        data: {
          ...ocrJob,
          results,
          processingDuration:
            ocrJob.completedAt && ocrJob.startedAt
              ? ocrJob.completedAt.getTime() - ocrJob.startedAt.getTime()
              : null,
        },
      };
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get OCR processing status",
      });
    }
  });

// Get extracted data with confidence scores
export const ocrGetExtractedData = protectedProcedure
  // .use(requirePermission("documents.read"))
  .input(
    z.object({
      processingId: z.string().min(1),
      dataType: z
        .enum(["ALL", "TEXT", "STRUCTURED", "TABLES", "METADATA"])
        .default("ALL"),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { processingId, dataType } = input;

    try {
      const [ocrResult] = await db
        .select()
        .from(businessSchema.ocrResult)
        .where(eq(businessSchema.ocrResult.processingId, processingId))
        .limit(1);

      if (!ocrResult) {
        throw new ORPCError("NOT_FOUND", { message: "OCR results not found" });
      }

      const extractedData = ocrResult.extractedData
        ? JSON.parse(ocrResult.extractedData)
        : {};

      const processingMetadata = ocrResult.processingMetadata
        ? JSON.parse(ocrResult.processingMetadata)
        : {};

      let filteredData;
      switch (dataType) {
        case "TEXT":
          filteredData = {
            text: ocrResult.extractedText,
            language: extractedData.detectedLanguage,
            wordCount: ocrResult.extractedText?.split(" ").length || 0,
          };
          break;

        case "STRUCTURED":
          filteredData = {
            fields: extractedData.structuredFields || {},
            entities: extractedData.entities || [],
            keyValuePairs: extractedData.keyValuePairs || [],
          };
          break;

        case "TABLES":
          filteredData = {
            tables: extractedData.tables || [],
            tableCount: extractedData.tables?.length || 0,
          };
          break;

        case "METADATA":
          filteredData = {
            processingMetadata,
            confidenceBreakdown: extractedData.confidenceBreakdown || {},
            qualityMetrics: extractedData.qualityMetrics || {},
          };
          break;

        default:
          filteredData = {
            text: ocrResult.extractedText,
            structured: extractedData.structuredFields || {},
            tables: extractedData.tables || [],
            entities: extractedData.entities || [],
            metadata: processingMetadata,
            overallConfidence: ocrResult.confidenceScore,
          };
      }

      return {
        success: true,
        data: filteredData,
      };
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get extracted data",
      });
    }
  });

// Validate and correct OCR results
export const ocrValidateResults = protectedProcedure
  // .use(requirePermission("documents.update"))
  .input(
    z.object({
      processingId: z.string().min(1),
      corrections: z.object({
        text: z.string().optional(),
        structuredData: z.record(z.string(), z.any()).optional(),
        confidence: z.number().min(0).max(1).optional(),
      }),
      validatedBy: z.string().uuid().optional(),
      notes: z.string().max(1000).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    const { processingId, corrections, notes } = input;

    try {
      // Get current OCR result
      const [ocrResult] = await db
        .select()
        .from(businessSchema.ocrResult)
        .where(eq(businessSchema.ocrResult.processingId, processingId))
        .limit(1);

      if (!ocrResult) {
        throw new ORPCError("NOT_FOUND", { message: "OCR result not found" });
      }

      // Update with corrections
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
        validatedBy: user?.id || null,
        validationNotes: notes || null,
      };

      if (corrections.text) {
        updateData.extractedText = corrections.text;
      }

      if (corrections.structuredData) {
        const currentData = ocrResult.extractedData
          ? JSON.parse(ocrResult.extractedData)
          : {};
        updateData.extractedData = JSON.stringify({
          ...currentData,
          ...corrections.structuredData,
          validationHistory: [
            ...(currentData.validationHistory || []),
            {
              timestamp: new Date().toISOString(),
              validatedBy: user?.id || null,
              changes: corrections.structuredData,
              notes,
            },
          ],
        });
      }

      if (corrections.confidence !== undefined) {
        updateData.confidenceScore = corrections.confidence;
      }

      const updatedResultList = await db
        .update(businessSchema.ocrResult)
        .set(updateData as any)
        .where(eq(businessSchema.ocrResult.id, ocrResult.id))
        .returning({
          id: businessSchema.ocrResult.id,
          confidenceScore: businessSchema.ocrResult.confidenceScore,
          updatedAt: businessSchema.ocrResult.updatedAt,
        });

      const updatedResult = updatedResultList[0];
      if (!updatedResult) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to update OCR result",
        });
      }

      // Update processing job status
      await db
        .update(businessSchema.ocrProcessingJob)
        .set({
          status: "VALIDATED",
          confidenceScore: String(
            corrections.confidence ?? ocrResult.confidenceScore ?? 0
          ),
        })
        .where(eq(businessSchema.ocrProcessingJob.id, processingId));

      return {
        success: true,
        data: {
          resultId: updatedResult.id,
          newConfidenceScore: updatedResult.confidenceScore,
          validatedAt: updatedResult.updatedAt,
        },
        message: "OCR results validated and corrected successfully",
      };
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to validate OCR results",
      });
    }
  });

// Get processing statistics and analytics
export const ocrGetProcessingStats = protectedProcedure
  // .use(requirePermission("documents.read"))
  .input(
    z.object({
      clientId: z.string().uuid().optional(),
      documentType: z.string().optional(),
      dateRange: z
        .object({
          startDate: z.string().datetime(),
          endDate: z.string().datetime(),
        })
        .optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { clientId, documentType, dateRange } = input;

    try {
      const conditions = [];

      if (clientId) {
        conditions.push(eq(businessSchema.ocrProcessingJob.clientId, clientId));
      }

      if (documentType) {
        conditions.push(
          eq(businessSchema.ocrProcessingJob.documentType, documentType)
        );
      }

      if (dateRange) {
        conditions.push(
          sql`${businessSchema.ocrProcessingJob.createdAt} BETWEEN ${dateRange.startDate} AND ${dateRange.endDate}`
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

      // Overall statistics
      const overallStatsResult = await db
        .select({
          totalJobs: sql<number>`COUNT(*)`,
          completedJobs: sql<number>`COUNT(*) FILTER (WHERE ${businessSchema.ocrProcessingJob.status} = 'COMPLETED')`,
          failedJobs: sql<number>`COUNT(*) FILTER (WHERE ${businessSchema.ocrProcessingJob.status} = 'FAILED')`,
          avgConfidence: sql<number>`AVG(${businessSchema.ocrProcessingJob.confidenceScore})`,
          avgProcessingTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${businessSchema.ocrProcessingJob.completedAt} - ${businessSchema.ocrProcessingJob.startedAt})))`,
        })
        .from(businessSchema.ocrProcessingJob)
        .where(whereClause);

      const overallStats = overallStatsResult[0] || {
        totalJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        avgConfidence: 0,
        avgProcessingTime: 0,
      };

      // Status breakdown
      const statusBreakdown = await db
        .select({
          status: businessSchema.ocrProcessingJob.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(businessSchema.ocrProcessingJob)
        .where(whereClause)
        .groupBy(businessSchema.ocrProcessingJob.status);

      // Document type breakdown
      const documentTypeBreakdown = await db
        .select({
          documentType: businessSchema.ocrProcessingJob.documentType,
          count: sql<number>`COUNT(*)`,
          avgConfidence: sql<number>`AVG(${businessSchema.ocrProcessingJob.confidenceScore})`,
        })
        .from(businessSchema.ocrProcessingJob)
        .where(whereClause)
        .groupBy(businessSchema.ocrProcessingJob.documentType);

      // Daily processing volume (last 30 days)
      const dailyVolume = await db
        .select({
          date: sql<string>`DATE(${businessSchema.ocrProcessingJob.createdAt})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(businessSchema.ocrProcessingJob)
        .where(
          and(
            whereClause || sql`1=1`,
            sql`${businessSchema.ocrProcessingJob.createdAt} >= NOW() - INTERVAL '30 days'`
          )
        )
        .groupBy(sql`DATE(${businessSchema.ocrProcessingJob.createdAt})`)
        .orderBy(sql`DATE(${businessSchema.ocrProcessingJob.createdAt}) DESC`)
        .limit(30);

      return {
        success: true,
        data: {
          overview: {
            ...overallStats,
            successRate:
              overallStats.totalJobs > 0
                ? (overallStats.completedJobs / overallStats.totalJobs) * 100
                : 0,
            avgProcessingTimeMinutes: overallStats.avgProcessingTime
              ? Math.round(overallStats.avgProcessingTime / 60)
              : 0,
          },
          statusBreakdown,
          documentTypeBreakdown,
          dailyVolume,
        },
      };
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get processing statistics",
      });
    }
  });

// Batch process multiple documents
export const ocrBatchProcess = protectedProcedure
  // .use(requirePermission("documents.create"))
  .input(
    z.object({
      documents: z
        .array(
          z.object({
            documentId: z.string().uuid(),
            documentType: z.enum([
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
            ]),
          })
        )
        .min(1, "At least one document required"),
      clientId: z.string().uuid(),
      priority: z.enum(["LOW", "NORMAL", "HIGH"]).default("NORMAL"),
      extractionOptions: z
        .object({
          extractText: z.boolean().default(true),
          extractTables: z.boolean().default(false),
          extractSignatures: z.boolean().default(false),
          confidenceThreshold: z.number().min(0).max(1).default(0.85),
        })
        .optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db, user } = context;
    const { documents, clientId, priority, extractionOptions } = input;

    try {
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      const processingJobs = [];

      // Create processing jobs for each document
      for (const doc of documents) {
        const processingId = `ocr_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;

        const [ocrJob] = await db
          .insert(businessSchema.ocrProcessingJob)
          .values({
            id: processingId,
            documentId: doc.documentId,
            clientId,
            documentType: doc.documentType,
            priority,
            status: "QUEUED",
            batchId,
            extractionOptions: extractionOptions
              ? JSON.stringify(extractionOptions)
              : null,
            createdBy: user?.id!,
          })
          .returning({
            id: businessSchema.ocrProcessingJob.id,
            documentId: businessSchema.ocrProcessingJob.documentId,
            documentType: businessSchema.ocrProcessingJob.documentType,
            status: businessSchema.ocrProcessingJob.status,
          });

        processingJobs.push(ocrJob);
      }

      const estimatedCompletionTime = Math.max(30, documents.length * 10); // 10 seconds per document, min 30 seconds
      const estimatedCompletion = new Date(
        Date.now() + estimatedCompletionTime * 1000
      );

      return {
        success: true,
        data: {
          batchId,
          totalDocuments: documents.length,
          processingJobs,
          status: "QUEUED",
          estimatedCompletion,
        },
        message: `Batch processing initiated for ${documents.length} documents`,
      };
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to initiate batch processing",
      });
    }
  });

// Get batch processing status
export const ocrGetBatchStatus = protectedProcedure
  // .use(requirePermission("documents.read"))
  .input(
    z.object({
      batchId: z.string().min(1),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { batchId } = input;

    try {
      const batchJobs = await db
        .select({
          id: businessSchema.ocrProcessingJob.id,
          documentId: businessSchema.ocrProcessingJob.documentId,
          documentType: businessSchema.ocrProcessingJob.documentType,
          status: businessSchema.ocrProcessingJob.status,
          confidenceScore: businessSchema.ocrProcessingJob.confidenceScore,
          createdAt: businessSchema.ocrProcessingJob.createdAt,
          startedAt: businessSchema.ocrProcessingJob.startedAt,
          completedAt: businessSchema.ocrProcessingJob.completedAt,
          errorMessage: businessSchema.ocrProcessingJob.errorMessage,
        })
        .from(businessSchema.ocrProcessingJob)
        .where(eq(businessSchema.ocrProcessingJob.batchId, batchId))
        .orderBy(businessSchema.ocrProcessingJob.createdAt);

      if (batchJobs.length === 0) {
        throw new ORPCError("NOT_FOUND", { message: "Batch not found" });
      }

      const totalJobs = batchJobs.length;
      const completedJobs = batchJobs.filter(
        (job) => job.status === "COMPLETED"
      ).length;
      const failedJobs = batchJobs.filter(
        (job) => job.status === "FAILED"
      ).length;
      const processingJobs = batchJobs.filter(
        (job) => job.status === "PROCESSING"
      ).length;
      const queuedJobs = batchJobs.filter(
        (job) => job.status === "QUEUED"
      ).length;

      const batchStatus =
        completedJobs === totalJobs
          ? "COMPLETED"
          : failedJobs === totalJobs
            ? "FAILED"
            : processingJobs > 0
              ? "PROCESSING"
              : "QUEUED";

      const jobsWithConfidence = batchJobs.filter(
        (job) => job.confidenceScore !== null
      );
      const avgConfidence =
        jobsWithConfidence.length > 0
          ? jobsWithConfidence.reduce(
              (sum, job) => sum + Number(job.confidenceScore || 0),
              0
            ) / jobsWithConfidence.length
          : 0;

      return {
        success: true,
        data: {
          batchId,
          status: batchStatus,
          summary: {
            total: totalJobs,
            completed: completedJobs,
            failed: failedJobs,
            processing: processingJobs,
            queued: queuedJobs,
            completionRate: Math.round((completedJobs / totalJobs) * 100),
            avgConfidence: Math.round(avgConfidence * 100) / 100,
          },
          jobs: batchJobs,
        },
      };
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get batch status",
      });
    }
  });
