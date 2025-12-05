import type { Context } from "@GK-Nexus/api/context";
import { db } from "@GK-Nexus/db";
import type {
  OcrEngineConfiguration,
  OcrExtractionTemplate,
  OcrProcessingQueue,
} from "@GK-Nexus/db/schema/ocr-processing";
import {
  ocrAccuracyTracking,
  ocrEngineConfigurations,
  ocrExtractionTemplates,
  ocrProcessingQueue,
} from "@GK-Nexus/db/schema/ocr-processing";
import crypto from "node:crypto";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

export interface OcrProcessingRequest {
  documentId: string;
  originalFileName: string;
  documentType: string;
  fileSize: number;
  fileFormat: string;
  pageCount?: number;
  clientId?: string;
  language?: string;
  processingEngine?: string;
  extractionTemplateId?: string;
  priority?: number;
  scheduledFor?: Date;
}

export interface OcrProcessingResult {
  processingId: string;
  status: string;
  extractedText?: string;
  structuredData?: any;
  confidence?: number;
  quality?: string;
  processingTime?: number;
  errorMessage?: string;
}

export interface OcrExtractionRule {
  fields: Array<{
    name: string;
    type: string;
    required: boolean;
    validation?: {
      pattern?: string;
      min?: number;
      max?: number;
      format?: string;
    };
    extraction: {
      method: string;
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
    type: string;
    parameters: any;
  }>;
}

export class OcrProcessingService {
  constructor(private ctx: Context) {}

  /**
   * Get organization ID from context (defaults to "default" if not available)
   */
  private getOrganizationId(): string {
    // In a real implementation, this would fetch the organization from user data
    // For now, return a default organization ID
    return "default";
  }

  /**
   * Queue document for OCR processing
   */
  async queueDocument(request: OcrProcessingRequest): Promise<string> {
    const processingId = crypto.randomUUID();

    // Get default engine configuration if none specified
    const engineConfig = request.processingEngine
      ? await this.getEngineConfiguration(request.processingEngine)
      : await this.getDefaultEngineConfiguration();

    if (!engineConfig) {
      throw new Error("No OCR engine configuration available");
    }

    // Estimate processing time based on document size and type
    const estimatedTime = this.estimateProcessingTime(request);

    await db.insert(ocrProcessingQueue).values({
      id: processingId,
      organizationId: this.getOrganizationId(),
      clientId: request.clientId,
      documentId: request.documentId,
      originalFileName: request.originalFileName,
      documentType: request.documentType as any,
      fileSize: request.fileSize,
      fileFormat: request.fileFormat,
      pageCount: request.pageCount || 1,
      processingEngine: request.processingEngine || engineConfig.engineName,
      language: request.language || "en",
      extractionTemplateId: request.extractionTemplateId,
      priority: request.priority || 5,
      scheduledFor: request.scheduledFor,
      estimatedProcessingTime: estimatedTime,
      createdBy: this.ctx.user?.id || "",
    });

    // If high priority or scheduled for immediate processing, trigger processing
    if ((request.priority || 5) <= 3 || !request.scheduledFor) {
      await this.triggerProcessing(processingId);
    }

    return processingId;
  }

  /**
   * Process document with OCR
   */
  async processDocument(processingId: string): Promise<OcrProcessingResult> {
    const processing = await this.getProcessingById(processingId);
    if (!processing) {
      throw new Error("Processing job not found");
    }

    if (processing.status !== "queued" && processing.status !== "retry") {
      throw new Error(`Document is already ${processing.status}`);
    }

    try {
      // Update status to processing
      await this.updateProcessingStatus(processingId, "processing", {
        startedAt: new Date(),
        processingAttempts: processing.processingAttempts + 1,
      });

      // Get engine configuration
      const engineConfig = await this.getEngineConfigurationByName(
        processing.processingEngine
      );
      if (!engineConfig) {
        throw new Error("OCR engine configuration not found");
      }

      // Get extraction template if specified
      const extractionTemplate = processing.extractionTemplateId
        ? await this.getExtractionTemplate(processing.extractionTemplateId)
        : null;

      // Process with OCR engine
      const ocrResult = await this.performOcrProcessing(
        processing,
        engineConfig,
        extractionTemplate
      );

      // Determine quality and confidence levels
      const qualityAssessment = this.assessQuality(ocrResult);

      // Check if manual review is required
      const requiresReview = this.shouldRequireReview(
        ocrResult,
        qualityAssessment
      );

      // Update processing record with results
      await this.updateProcessingStatus(
        processingId,
        requiresReview ? "manual_review" : "completed",
        {
          completedAt: new Date(),
          extractedText: ocrResult.text,
          structuredData: ocrResult.structuredData,
          overallConfidence: ocrResult.confidence,
          confidenceLevel: this.getConfidenceLevel(ocrResult.confidence),
          qualityScore: qualityAssessment.score,
          quality: qualityAssessment.level,
          pageResults: ocrResult.pageResults,
          requiresReview,
          reviewReason: requiresReview ? qualityAssessment.reviewReason : null,
          processingCost: this.calculateProcessingCost(
            processing,
            engineConfig
          ),
          engineUsage: ocrResult.engineUsage,
          processedBy: "system", // Could be user ID if manual processing
        }
      );

      // Update engine usage statistics
      await this.updateEngineUsage(engineConfig.id, processing.pageCount);

      // Update template usage if used
      if (extractionTemplate) {
        await this.updateTemplateUsage(
          extractionTemplate.id,
          ocrResult.confidence
        );
      }

      return {
        processingId,
        status: requiresReview ? "manual_review" : "completed",
        extractedText: ocrResult.text,
        structuredData: ocrResult.structuredData,
        confidence: ocrResult.confidence,
        quality: qualityAssessment.level,
        processingTime: ocrResult.processingTime,
      };
    } catch (error) {
      // Update status to failed
      await this.updateProcessingStatus(processingId, "failed", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorCode: "OCR_PROCESSING_FAILED",
        errorDetails: {
          error: error instanceof Error ? error.stack : error,
          timestamp: new Date().toISOString(),
        },
      });

      // Check if retry is possible
      if (processing.retryCount < processing.maxRetries) {
        setTimeout(() => this.retryProcessing(processingId), 5000);
      }

      throw error;
    }
  }

  /**
   * Get processing status and results
   */
  async getProcessingStatus(
    processingId: string
  ): Promise<OcrProcessingResult> {
    const processing = await this.getProcessingById(processingId);
    if (!processing) {
      throw new Error("Processing job not found");
    }

    return {
      processingId,
      status: processing.status,
      extractedText: processing.extractedText || undefined,
      structuredData: processing.structuredData,
      confidence: processing.overallConfidence || undefined,
      quality: processing.quality || undefined,
      errorMessage: processing.errorMessage || undefined,
    };
  }

  /**
   * Create extraction template
   */
  async createExtractionTemplate(data: {
    templateName: string;
    description?: string;
    documentType: string;
    extractionRules: OcrExtractionRule;
    version?: string;
  }): Promise<string> {
    const templateId = crypto.randomUUID();

    await db.insert(ocrExtractionTemplates).values({
      id: templateId,
      organizationId: this.getOrganizationId(),
      templateName: data.templateName,
      description: data.description,
      documentType: data.documentType as any,
      version: data.version || "1.0",
      extractionRules: data.extractionRules,
      createdBy: this.ctx.user?.id || "",
    });

    return templateId;
  }

  /**
   * Update extraction template
   */
  async updateExtractionTemplate(
    templateId: string,
    data: Partial<{
      templateName: string;
      description: string;
      extractionRules: OcrExtractionRule;
      isActive: boolean;
    }>
  ): Promise<void> {
    await db
      .update(ocrExtractionTemplates)
      .set({
        ...data,
        updatedBy: this.ctx.user?.id,
      })
      .where(eq(ocrExtractionTemplates.id, templateId));
  }

  /**
   * Create engine configuration
   */
  async createEngineConfiguration(data: {
    engineName: string;
    engineVersion?: string;
    configurationName: string;
    description?: string;
    engineConfig: any;
    isDefault?: boolean;
  }): Promise<string> {
    const configId = crypto.randomUUID();

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await db
        .update(ocrEngineConfigurations)
        .set({ isDefault: false })
        .where(
          and(
            eq(
              ocrEngineConfigurations.organizationId,
              this.getOrganizationId()
            ),
            eq(ocrEngineConfigurations.isDefault, true)
          )
        );
    }

    await db.insert(ocrEngineConfigurations).values({
      id: configId,
      organizationId: this.getOrganizationId(),
      engineName: data.engineName,
      engineVersion: data.engineVersion,
      configurationName: data.configurationName,
      description: data.description,
      engineConfig: data.engineConfig,
      isDefault: data.isDefault,
      createdBy: this.ctx.user?.id || "",
    });

    return configId;
  }

  /**
   * Submit accuracy feedback
   */
  async submitAccuracyFeedback(
    processingId: string,
    feedback: {
      groundTruthText?: string;
      groundTruthData?: any;
      correctionsMade?: any;
      validationMethod: string;
    }
  ): Promise<void> {
    const processing = await this.getProcessingById(processingId);
    if (!processing) {
      throw new Error("Processing job not found");
    }

    // Calculate accuracy metrics
    const accuracyMetrics = this.calculateAccuracyMetrics(
      processing,
      feedback.groundTruthText,
      feedback.groundTruthData
    );

    const trackingId = crypto.randomUUID();

    await db.insert(ocrAccuracyTracking).values({
      id: trackingId,
      organizationId: this.getOrganizationId(),
      processingId,
      groundTruthText: feedback.groundTruthText,
      groundTruthData: feedback.groundTruthData,
      textAccuracy: accuracyMetrics.textAccuracy,
      wordAccuracy: accuracyMetrics.wordAccuracy,
      fieldAccuracy: accuracyMetrics.fieldAccuracy,
      structuralAccuracy: accuracyMetrics.structuralAccuracy,
      correctionsMade: feedback.correctionsMade,
      validatedBy: this.ctx.user?.id,
      validationMethod: feedback.validationMethod,
      validationConfidence: 100, // Assuming manual validation is 100% confident
      validatedAt: new Date(),
    });

    // Update template and engine accuracy if applicable
    await this.updateAccuracyMetrics(processing, accuracyMetrics);
  }

  /**
   * Get processing queue for organization
   */
  async getProcessingQueue(
    filters: {
      status?: string[];
      documentType?: string;
      priority?: number;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    items: OcrProcessingQueue[];
    total: number;
  }> {
    // Build where conditions
    const conditions = [
      eq(ocrProcessingQueue.organizationId, this.getOrganizationId()),
    ];

    if (filters.status?.length) {
      conditions.push(eq(ocrProcessingQueue.status, filters.status[0] as any));
    }

    if (filters.documentType) {
      conditions.push(
        eq(ocrProcessingQueue.documentType, filters.documentType as any)
      );
    }

    if (filters.dateFrom) {
      conditions.push(gte(ocrProcessingQueue.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      conditions.push(lte(ocrProcessingQueue.createdAt, filters.dateTo));
    }

    const items = await db
      .select()
      .from(ocrProcessingQueue)
      .where(and(...conditions))
      .orderBy(
        asc(ocrProcessingQueue.priority),
        desc(ocrProcessingQueue.createdAt)
      )
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    // Get total count (would need a separate query in real implementation)
    const total = items.length;

    return { items, total };
  }

  /**
   * Private helper methods
   */
  private async getProcessingById(
    id: string
  ): Promise<OcrProcessingQueue | null> {
    const [processing] = await db
      .select()
      .from(ocrProcessingQueue)
      .where(eq(ocrProcessingQueue.id, id))
      .limit(1);
    return processing || null;
  }

  private async getEngineConfiguration(
    engineName: string
  ): Promise<OcrEngineConfiguration | null> {
    const [config] = await db
      .select()
      .from(ocrEngineConfigurations)
      .where(
        and(
          eq(ocrEngineConfigurations.organizationId, this.getOrganizationId()),
          eq(ocrEngineConfigurations.engineName, engineName),
          eq(ocrEngineConfigurations.isActive, true)
        )
      )
      .limit(1);
    return config || null;
  }

  private async getDefaultEngineConfiguration(): Promise<OcrEngineConfiguration | null> {
    const [config] = await db
      .select()
      .from(ocrEngineConfigurations)
      .where(
        and(
          eq(ocrEngineConfigurations.organizationId, this.getOrganizationId()),
          eq(ocrEngineConfigurations.isDefault, true),
          eq(ocrEngineConfigurations.isActive, true)
        )
      )
      .limit(1);
    return config || null;
  }

  private async getEngineConfigurationByName(
    engineName: string
  ): Promise<OcrEngineConfiguration | null> {
    return this.getEngineConfiguration(engineName);
  }

  private async getExtractionTemplate(
    templateId: string
  ): Promise<OcrExtractionTemplate | null> {
    const [template] = await db
      .select()
      .from(ocrExtractionTemplates)
      .where(
        and(
          eq(ocrExtractionTemplates.id, templateId),
          eq(ocrExtractionTemplates.organizationId, this.getOrganizationId()),
          eq(ocrExtractionTemplates.isActive, true)
        )
      )
      .limit(1);
    return template || null;
  }

  private async updateProcessingStatus(
    processingId: string,
    status: string,
    updates: any = {}
  ): Promise<void> {
    await db
      .update(ocrProcessingQueue)
      .set({
        status: status as any,
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(ocrProcessingQueue.id, processingId));
  }

  private estimateProcessingTime(request: OcrProcessingRequest): number {
    // Base time per page in seconds
    const baseTimePerPage = 30;

    // Adjust based on file size (larger files take longer)
    const sizeMultiplier = Math.max(1, request.fileSize / (1024 * 1024)); // Per MB

    // Adjust based on document type
    const typeMultipliers: Record<string, number> = {
      receipt: 0.8,
      invoice: 1.2,
      bank_statement: 1.5,
      contract: 2.0,
      financial_statement: 2.5,
    };

    const typeMultiplier = typeMultipliers[request.documentType] || 1.0;

    return Math.ceil(
      baseTimePerPage *
        (request.pageCount || 1) *
        sizeMultiplier *
        typeMultiplier
    );
  }

  private async triggerProcessing(processingId: string): Promise<void> {
    // In a real implementation, this would trigger background processing
    // For now, we'll just log that processing should be triggered
    console.log(`Triggering OCR processing for ${processingId}`);
  }

  private async performOcrProcessing(
    processing: OcrProcessingQueue,
    _engineConfig: OcrEngineConfiguration,
    extractionTemplate: OcrExtractionTemplate | null
  ): Promise<{
    text: string;
    structuredData?: any;
    confidence: number;
    pageResults: any[];
    processingTime: number;
    engineUsage: any;
  }> {
    // TODO: Implement actual OCR processing based on engine type
    // This is a placeholder that would integrate with real OCR engines

    const startTime = Date.now();

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const processingTime = Date.now() - startTime;

    // Placeholder results
    const result = {
      text: "Sample extracted text from OCR processing...",
      structuredData: extractionTemplate
        ? {
            date: "2024-01-15",
            amount: 125.5,
            vendor: "Sample Vendor",
            description: "Sample transaction",
          }
        : undefined,
      confidence: 85,
      pageResults: [
        {
          pageNumber: 1,
          text: "Sample extracted text...",
          confidence: 85,
          boundingBoxes: [],
          processingTime,
        },
      ],
      processingTime,
      engineUsage: {
        pagesProcessed: processing.pageCount,
        apiCalls: 1,
        computeTime: processingTime / 1000,
      },
    };

    return result;
  }

  private assessQuality(ocrResult: any): {
    score: number;
    level: string;
    reviewReason?: string;
  } {
    const confidence = ocrResult.confidence;

    if (confidence >= 90) {
      return { score: 95, level: "excellent" };
    }
    if (confidence >= 80) {
      return { score: 85, level: "good" };
    }
    if (confidence >= 70) {
      return { score: 75, level: "acceptable" };
    }
    if (confidence >= 50) {
      return {
        score: 60,
        level: "poor",
        reviewReason: "Low confidence score requires manual review",
      };
    }
    return {
      score: 30,
      level: "unusable",
      reviewReason: "Very low confidence score requires manual review",
    };
  }

  private shouldRequireReview(ocrResult: any, qualityAssessment: any): boolean {
    return qualityAssessment.score < 70 || ocrResult.confidence < 70;
  }

  private getConfidenceLevel(confidence: number): string {
    if (confidence >= 95) return "very_high";
    if (confidence >= 85) return "high";
    if (confidence >= 70) return "medium";
    if (confidence >= 50) return "low";
    return "very_low";
  }

  private calculateProcessingCost(
    processing: OcrProcessingQueue,
    engineConfig: OcrEngineConfiguration
  ): number {
    const costPerPage = engineConfig.costPerPage || 10; // Default 10 cents per page
    return costPerPage * processing.pageCount;
  }

  private async updateEngineUsage(
    configId: string,
    _pagesProcessed: number
  ): Promise<void> {
    // Note: usage count increments should use SQL expressions
    // For now, we just update lastUsedAt
    await db
      .update(ocrEngineConfigurations)
      .set({
        lastUsedAt: new Date(),
        // TODO: Increment usageCount, currentDailyUsage, currentMonthlyUsage using SQL
      })
      .where(eq(ocrEngineConfigurations.id, configId));
  }

  private async updateTemplateUsage(
    templateId: string,
    _confidence: number
  ): Promise<void> {
    // Note: usage count increments should use SQL expressions
    // For now, we just update lastUsedAt
    await db
      .update(ocrExtractionTemplates)
      .set({
        lastUsedAt: new Date(),
        // TODO: Increment usageCount and update average confidence
      })
      .where(eq(ocrExtractionTemplates.id, templateId));
  }

  private async retryProcessing(processingId: string): Promise<void> {
    const processing = await this.getProcessingById(processingId);
    if (!processing) return;

    await db
      .update(ocrProcessingQueue)
      .set({
        status: "retry",
        retryCount: processing.retryCount + 1,
        scheduledFor: new Date(Date.now() + 60_000), // Retry in 1 minute
      })
      .where(eq(ocrProcessingQueue.id, processingId));
  }

  private calculateAccuracyMetrics(
    _processing: OcrProcessingQueue,
    _groundTruthText?: string,
    _groundTruthData?: any
  ): {
    textAccuracy: number;
    wordAccuracy: number;
    fieldAccuracy: Record<string, number>;
    structuralAccuracy: number;
  } {
    // TODO: Implement proper accuracy calculation algorithms
    // This would compare extracted text/data with ground truth

    return {
      textAccuracy: 85,
      wordAccuracy: 90,
      fieldAccuracy: {
        date: 95,
        amount: 90,
        vendor: 85,
      },
      structuralAccuracy: 88,
    };
  }

  private async updateAccuracyMetrics(
    processing: OcrProcessingQueue,
    metrics: any
  ): Promise<void> {
    // Update template accuracy if applicable
    if (processing.extractionTemplateId) {
      await db
        .update(ocrExtractionTemplates)
        .set({
          // TODO: Update running averages of accuracy metrics
          averageConfidence: metrics.textAccuracy,
        })
        .where(eq(ocrExtractionTemplates.id, processing.extractionTemplateId));
    }

    // Update engine accuracy
    const engineConfig = await this.getEngineConfigurationByName(
      processing.processingEngine
    );
    if (engineConfig) {
      await db
        .update(ocrEngineConfigurations)
        .set({
          averageAccuracy: metrics.textAccuracy,
        })
        .where(eq(ocrEngineConfigurations.id, engineConfig.id));
    }
  }
}
