import type { Context } from "@GK-Nexus/api/context";
import { db } from "@GK-Nexus/db";
import type {
  GraConnection,
  GraSubmission,
} from "@GK-Nexus/db/schema/gra-integration";
import {
  graApiCache,
  graConnections,
  graSubmissions,
  graWebhooks,
} from "@GK-Nexus/db/schema/gra-integration";
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";

export interface GraApiOptions {
  timeout?: number;
  retries?: number;
  enableCache?: boolean;
  cacheTtl?: number;
}

export interface GraSubmissionRequest {
  filingType: string;
  taxYear: number;
  taxPeriod?: string;
  submissionData: any;
  clientId: string;
  attachedDocuments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
    required: boolean;
  }>;
}

export interface GraValidationResult {
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
}

export class GraIntegrationService {
  constructor(private ctx: Context) {}

  /**
   * Get active GRA connection for organization
   */
  async getActiveConnection(
    organizationId: string
  ): Promise<GraConnection | null> {
    const [connection] = await db
      .select()
      .from(graConnections)
      .where(
        and(
          eq(graConnections.organizationId, organizationId),
          eq(graConnections.isActive, true),
          eq(graConnections.healthStatus, "healthy")
        )
      )
      .limit(1);

    return connection || null;
  }

  /**
   * Create new GRA connection
   */
  async createConnection(data: {
    organizationId: string;
    connectionName: string;
    environment: "sandbox" | "production";
    baseUrl: string;
    clientId?: string;
    clientSecret?: string;
    apiKey?: string;
    certificatePath?: string;
    configuration?: any;
  }): Promise<string> {
    const connectionId = crypto.randomUUID();

    await db.insert(graConnections).values({
      id: connectionId,
      organizationId: data.organizationId,
      connectionName: data.connectionName,
      environment: data.environment,
      baseUrl: data.baseUrl,
      clientId: data.clientId,
      clientSecret: data.clientSecret
        ? this.encryptSecret(data.clientSecret)
        : null,
      apiKey: data.apiKey ? this.encryptSecret(data.apiKey) : null,
      certificatePath: data.certificatePath,
      configuration: data.configuration || {
        timeout: 30_000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableLogging: true,
        enableCaching: true,
        cacheTtl: 300,
        enableWebhooks: false,
        enableValidation: true,
      },
      createdBy: this.ctx.user?.id,
    });

    return connectionId;
  }

  /**
   * Test GRA connection
   */
  async testConnection(connectionId: string): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    const startTime = Date.now();

    try {
      const connection = await this.getConnectionById(connectionId);
      if (!connection) {
        throw new Error("Connection not found");
      }

      // Perform health check API call
      const response = await this.makeApiCall(connection, {
        endpoint: "authentication",
        method: "GET",
        url: `${connection.baseUrl}/health`,
      });

      const latency = Date.now() - startTime;

      // Update connection health status
      await db
        .update(graConnections)
        .set({
          lastHealthCheck: new Date(),
          healthStatus: "healthy",
          lastConnectedAt: new Date(),
          healthCheckFailures: 0,
        })
        .where(eq(graConnections.id, connectionId));

      return {
        success: true,
        message: "Connection successful",
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      // Update connection health status
      await db
        .update(graConnections)
        .set({
          lastHealthCheck: new Date(),
          healthStatus: "down",
          lastError: error instanceof Error ? error.message : "Unknown error",
          lastErrorAt: new Date(),
          healthCheckFailures: db.$count(),
        })
        .where(eq(graConnections.id, connectionId));

      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
        latency,
      };
    }
  }

  /**
   * Submit filing to GRA
   */
  async submitFiling(request: GraSubmissionRequest): Promise<{
    submissionId: string;
    status: string;
    graReferenceNumber?: string;
  }> {
    const connection = await this.getActiveConnection(this.ctx.organizationId);
    if (!connection) {
      throw new Error("No active GRA connection found");
    }

    // Validate submission data
    const validation = await this.validateSubmissionData(request);
    if (!validation.isValid) {
      throw new Error(
        `Validation failed: ${validation.errors.map((e) => e.message).join(", ")}`
      );
    }

    // Create submission record
    const submissionId = crypto.randomUUID();
    const referenceNumber = this.generateReferenceNumber(request.filingType);

    await db.insert(graSubmissions).values({
      id: submissionId,
      organizationId: this.ctx.organizationId,
      clientId: request.clientId,
      filingType: request.filingType as any,
      taxYear: request.taxYear,
      taxPeriod: request.taxPeriod,
      referenceNumber,
      submissionData: request.submissionData,
      validationResults: validation,
      attachedDocuments: request.attachedDocuments,
      status: "validated",
      createdBy: this.ctx.user?.id || "",
    });

    try {
      // Submit to GRA API
      const response = await this.makeApiCall(connection, {
        endpoint: "filing_submit",
        method: "POST",
        url: `${connection.baseUrl}/filings/submit`,
        data: {
          filing_type: request.filingType,
          tax_year: request.taxYear,
          tax_period: request.taxPeriod,
          data: request.submissionData,
          documents: request.attachedDocuments,
        },
      });

      // Update submission with GRA response
      await db
        .update(graSubmissions)
        .set({
          status: "submitted",
          submittedAt: new Date(),
          submittedBy: this.ctx.user?.id,
          graReferenceNumber: response.reference_number,
          graResponse: response,
          submissionAttempts: 1,
          lastSubmissionAttempt: new Date(),
        })
        .where(eq(graSubmissions.id, submissionId));

      return {
        submissionId,
        status: "submitted",
        graReferenceNumber: response.reference_number,
      };
    } catch (error) {
      // Update submission with error
      await db
        .update(graSubmissions)
        .set({
          status: "error",
          lastSubmissionAttempt: new Date(),
          submissionAttempts: db.$count(),
        })
        .where(eq(graSubmissions.id, submissionId));

      throw error;
    }
  }

  /**
   * Get submission status from GRA
   */
  async getSubmissionStatus(submissionId: string): Promise<{
    status: string;
    graResponse?: any;
    lastUpdated?: Date;
  }> {
    const submission = await this.getSubmissionById(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const connection = await this.getActiveConnection(
      submission.organizationId
    );
    if (!connection) {
      throw new Error("No active GRA connection found");
    }

    try {
      // Query GRA API for status
      const response = await this.makeApiCall(connection, {
        endpoint: "filing_status",
        method: "GET",
        url: `${connection.baseUrl}/filings/${submission.graReferenceNumber}/status`,
      });

      // Update submission with latest status
      await db
        .update(graSubmissions)
        .set({
          status: this.mapGraStatus(response.status),
          graResponse: response,
          processedAt: response.processed_at
            ? new Date(response.processed_at)
            : null,
          acceptedAt: response.accepted_at
            ? new Date(response.accepted_at)
            : null,
          rejectedAt: response.rejected_at
            ? new Date(response.rejected_at)
            : null,
        })
        .where(eq(graSubmissions.id, submissionId));

      return {
        status: response.status,
        graResponse: response,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error("Failed to get submission status:", error);
      return {
        status: submission.status,
        graResponse: submission.graResponse,
        lastUpdated: submission.updatedAt,
      };
    }
  }

  /**
   * Handle GRA webhook
   */
  async handleWebhook(
    payload: {
      event_type: string;
      submission_reference?: string;
      data: any;
      signature?: string;
    },
    headers: Record<string, string>
  ): Promise<void> {
    const webhookId = crypto.randomUUID();

    // Find submission by GRA reference
    const submission = payload.submission_reference
      ? await this.getSubmissionByGraReference(payload.submission_reference)
      : null;

    // Store webhook event
    await db.insert(graWebhooks).values({
      id: webhookId,
      organizationId: submission?.organizationId || this.ctx.organizationId,
      eventType: payload.event_type,
      submissionId: submission?.id,
      payload,
      signature: payload.signature,
      headers,
      sourceIp: this.getClientIp(),
    });

    try {
      // Process webhook based on event type
      await this.processWebhookEvent(payload, submission);

      // Mark webhook as processed
      await db
        .update(graWebhooks)
        .set({
          processed: true,
          processedAt: new Date(),
        })
        .where(eq(graWebhooks.id, webhookId));
    } catch (error) {
      // Mark webhook as failed
      await db
        .update(graWebhooks)
        .set({
          processingError:
            error instanceof Error ? error.message : "Unknown error",
          retryCount: db.$count(),
        })
        .where(eq(graWebhooks.id, webhookId));

      console.error("Failed to process webhook:", error);
    }
  }

  /**
   * Validate submission data
   */
  private async validateSubmissionData(
    request: GraSubmissionRequest
  ): Promise<GraValidationResult> {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Basic validation
    if (!request.filingType) {
      errors.push({
        field: "filingType",
        message: "Filing type is required",
        code: "REQUIRED_FIELD",
      });
    }

    if (
      !request.taxYear ||
      request.taxYear < 2000 ||
      request.taxYear > new Date().getFullYear() + 1
    ) {
      errors.push({
        field: "taxYear",
        message: "Valid tax year is required",
        code: "INVALID_TAX_YEAR",
      });
    }

    // TODO: Add specific validation rules based on filing type
    // This would include validation for PAYE, VAT, Corporate Tax, etc.

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Make API call with caching and error handling
   */
  private async makeApiCall(
    connection: GraConnection,
    request: {
      endpoint: string;
      method: string;
      url: string;
      data?: any;
      params?: Record<string, any>;
    },
    options: GraApiOptions = {}
  ): Promise<any> {
    const requestHash = crypto
      .createHash("sha256")
      .update(
        JSON.stringify({
          url: request.url,
          data: request.data,
          params: request.params,
        })
      )
      .digest("hex");

    // Check cache if enabled
    if (options.enableCache !== false && request.method === "GET") {
      const cached = await this.getCachedResponse(
        connection.organizationId,
        requestHash
      );
      if (cached && !this.isCacheExpired(cached)) {
        await this.updateCacheAccess(cached.id);
        return cached.responseData;
      }
    }

    try {
      // Make actual API call (implementation depends on GRA API specifics)
      const response = await this.performHttpRequest(
        connection,
        request,
        options
      );

      // Cache successful responses
      if (
        options.enableCache !== false &&
        request.method === "GET" &&
        response.status === 200
      ) {
        await this.cacheResponse(
          connection.organizationId,
          requestHash,
          request,
          response
        );
      }

      // Update connection health
      await this.updateConnectionHealth(connection.id, true);

      return response.data;
    } catch (error) {
      // Update connection health
      await this.updateConnectionHealth(connection.id, false, error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async getConnectionById(id: string): Promise<GraConnection | null> {
    const [connection] = await db
      .select()
      .from(graConnections)
      .where(eq(graConnections.id, id))
      .limit(1);
    return connection || null;
  }

  private async getSubmissionById(id: string): Promise<GraSubmission | null> {
    const [submission] = await db
      .select()
      .from(graSubmissions)
      .where(eq(graSubmissions.id, id))
      .limit(1);
    return submission || null;
  }

  private async getSubmissionByGraReference(
    reference: string
  ): Promise<GraSubmission | null> {
    const [submission] = await db
      .select()
      .from(graSubmissions)
      .where(eq(graSubmissions.graReferenceNumber, reference))
      .limit(1);
    return submission || null;
  }

  private generateReferenceNumber(filingType: string): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const typePrefix = filingType.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${typePrefix}-${timestamp}-${random}`;
  }

  private mapGraStatus(graStatus: string): any {
    const statusMap: Record<string, any> = {
      received: "submitted",
      processing: "processing",
      accepted: "accepted",
      rejected: "rejected",
      under_review: "processing",
    };
    return statusMap[graStatus] || "submitted";
  }

  private encryptSecret(secret: string): string {
    // TODO: Implement proper encryption
    // This should use a proper encryption library with environment-specific keys
    return Buffer.from(secret).toString("base64");
  }

  private getClientIp(): string {
    // TODO: Extract client IP from request context
    return "unknown";
  }

  private async getCachedResponse(organizationId: string, requestHash: string) {
    const [cached] = await db
      .select()
      .from(graApiCache)
      .where(
        and(
          eq(graApiCache.organizationId, organizationId),
          eq(graApiCache.requestHash, requestHash)
        )
      )
      .limit(1);
    return cached || null;
  }

  private isCacheExpired(cached: any): boolean {
    return new Date() > new Date(cached.expiresAt);
  }

  private async updateCacheAccess(cacheId: string): Promise<void> {
    await db
      .update(graApiCache)
      .set({
        lastAccessedAt: new Date(),
        accessCount: db.$count(),
      })
      .where(eq(graApiCache.id, cacheId));
  }

  private async cacheResponse(
    organizationId: string,
    requestHash: string,
    request: any,
    response: any
  ): Promise<void> {
    const ttl = 300; // 5 minutes default
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await db.insert(graApiCache).values({
      id: crypto.randomUUID(),
      organizationId,
      endpoint: request.endpoint as any,
      requestMethod: request.method,
      requestUrl: request.url,
      requestHash,
      requestBody: request.data,
      requestParams: request.params,
      responseStatus: response.status,
      responseHeaders: response.headers,
      responseData: response.data,
      responseSize: JSON.stringify(response.data).length,
      cacheKey: `${organizationId}:${requestHash}`,
      ttl,
      expiresAt,
      requestedBy: this.ctx.user?.id,
    });
  }

  private async performHttpRequest(
    connection: GraConnection,
    request: any,
    options: GraApiOptions
  ): Promise<any> {
    // TODO: Implement actual HTTP request logic
    // This would use fetch or axios with proper authentication, timeouts, retries, etc.
    throw new Error("HTTP request implementation pending");
  }

  private async updateConnectionHealth(
    connectionId: string,
    success: boolean,
    error?: any
  ): Promise<void> {
    if (success) {
      await db
        .update(graConnections)
        .set({
          lastConnectedAt: new Date(),
          connectionStatus: "connected",
          healthStatus: "healthy",
          connectionFailures: 0,
        })
        .where(eq(graConnections.id, connectionId));
    } else {
      await db
        .update(graConnections)
        .set({
          lastConnectionAttempt: new Date(),
          connectionStatus: "disconnected",
          healthStatus: "down",
          lastError: error instanceof Error ? error.message : "Unknown error",
          lastErrorAt: new Date(),
          connectionFailures: db.$count(),
        })
        .where(eq(graConnections.id, connectionId));
    }
  }

  private async processWebhookEvent(
    payload: any,
    submission: GraSubmission | null
  ): Promise<void> {
    if (!submission) return;

    switch (payload.event_type) {
      case "status_update":
        await db
          .update(graSubmissions)
          .set({
            status: this.mapGraStatus(payload.data.status),
            graResponse: payload.data,
            processedAt: payload.data.processed_at
              ? new Date(payload.data.processed_at)
              : null,
          })
          .where(eq(graSubmissions.id, submission.id));
        break;

      case "acknowledgment":
        await db
          .update(graSubmissions)
          .set({
            status: "accepted",
            acceptedAt: new Date(),
            graResponse: payload.data,
          })
          .where(eq(graSubmissions.id, submission.id));
        break;

      case "rejection":
        await db
          .update(graSubmissions)
          .set({
            status: "rejected",
            rejectedAt: new Date(),
            graResponse: payload.data,
          })
          .where(eq(graSubmissions.id, submission.id));
        break;

      case "payment_due":
        await db
          .update(graSubmissions)
          .set({
            paymentRequired: true,
            paymentAmount: payload.data.amount,
            paymentDueDate: new Date(payload.data.due_date),
            graResponse: payload.data,
          })
          .where(eq(graSubmissions.id, submission.id));
        break;
    }
  }
}
