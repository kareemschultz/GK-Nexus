import { db } from "@gknexus/db";
import {
  type AuditLog,
  auditLogs,
  type LoginAttempt,
  loginAttempts,
  type SystemEvent,
  systemEvents,
} from "@gknexus/db/schema/audit-logs";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

// Types for audit logging
export interface AuditLogContext {
  userId?: string;
  clientId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  endpoint?: string;
  method?: string;
}

export interface AuditLogData {
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  context?: AuditLogContext;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  changedFields?: string[];
  metadata?: Record<string, any>;
  tags?: string[];
  severity?: "info" | "warning" | "error" | "critical";
  success?: boolean;
  errorMessage?: string;
  duration?: number;
  correlationId?: string;
}

export interface AuditSearchFilters {
  userId?: string;
  clientId?: string;
  action?: string;
  entity?: string;
  entityId?: string;
  severity?: string;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  correlationId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface SystemEventData {
  eventType: string;
  eventName: string;
  description?: string;
  status: "success" | "failed" | "in_progress" | "cancelled";
  severity?: "info" | "warning" | "error" | "critical";
  details?: Record<string, any>;
  errorMessage?: string;
  errorCode?: string;
  relatedUserId?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  serverName?: string;
  processId?: string;
  version?: string;
  environment?: string;
  startedAt?: Date;
  duration?: number;
}

export interface LoginAttemptData {
  email: string;
  success: boolean;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  failureReason?: string;
  attempts?: number;
  isSuspicious?: boolean;
}

export class AuditService {
  /**
   * Log an audit event
   */
  static async logAuditEvent(data: AuditLogData): Promise<AuditLog> {
    const auditLogData = {
      id: crypto.randomUUID(),
      action: data.action as any,
      entity: data.entity as any,
      entityId: data.entityId,
      description: data.description,

      // Context
      userId: data.context?.userId,
      clientId: data.context?.clientId,
      sessionId: data.context?.sessionId,
      ipAddress: data.context?.ipAddress,
      userAgent: data.context?.userAgent,
      location: data.context?.location,
      endpoint: data.context?.endpoint,
      method: data.context?.method,

      // Change tracking
      oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
      newValues: data.newValues ? JSON.stringify(data.newValues) : null,
      changedFields: data.changedFields
        ? JSON.stringify(data.changedFields)
        : null,

      // Status and metadata
      severity: (data.severity || "info") as any,
      success: data.success !== false, // Default to true unless explicitly false
      errorMessage: data.errorMessage,
      duration: data.duration ? data.duration.toString() : null,

      // Additional context
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      correlationId: data.correlationId,

      // Retention
      retentionPeriod: AuditService.calculateRetentionPeriod(
        data.severity,
        data.entity
      ),
      isArchived: false,
    };

    const [auditLog] = await db
      .insert(auditLogs)
      .values(auditLogData)
      .returning();

    return auditLog;
  }

  /**
   * Log user action with automatic context detection
   */
  static async logUserAction(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    description: string,
    context?: Partial<AuditLogContext>,
    options?: {
      oldValues?: Record<string, any>;
      newValues?: Record<string, any>;
      metadata?: Record<string, any>;
      severity?: "info" | "warning" | "error" | "critical";
      correlationId?: string;
    }
  ): Promise<AuditLog> {
    return AuditService.logAuditEvent({
      action,
      entity,
      entityId,
      description,
      context: {
        userId,
        ...context,
      },
      ...options,
    });
  }

  /**
   * Log data change with before/after tracking
   */
  static async logDataChange(
    userId: string,
    entity: string,
    entityId: string,
    action: "create" | "update" | "delete",
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null,
    context?: Partial<AuditLogContext>
  ): Promise<AuditLog> {
    const changedFields = AuditService.getChangedFields(oldValues, newValues);
    const description = AuditService.generateChangeDescription(
      action,
      entity,
      changedFields
    );

    return AuditService.logAuditEvent({
      action,
      entity,
      entityId,
      description,
      context: { userId, ...context },
      oldValues: oldValues || undefined,
      newValues: newValues || undefined,
      changedFields,
      tags: ["data_change"],
    });
  }

  /**
   * Log security event
   */
  static async logSecurityEvent(
    action: string,
    description: string,
    context: AuditLogContext,
    options?: {
      severity?: "warning" | "error" | "critical";
      metadata?: Record<string, any>;
      correlationId?: string;
    }
  ): Promise<AuditLog> {
    return AuditService.logAuditEvent({
      action,
      entity: "system",
      description,
      context,
      severity: options?.severity || "warning",
      metadata: options?.metadata,
      correlationId: options?.correlationId,
      tags: ["security"],
    });
  }

  /**
   * Log system event
   */
  static async logSystemEvent(data: SystemEventData): Promise<SystemEvent> {
    const systemEventData = {
      id: crypto.randomUUID(),
      eventType: data.eventType,
      eventName: data.eventName,
      description: data.description,
      status: data.status,
      severity: (data.severity || "info") as any,

      // Timing
      startedAt: data.startedAt || new Date(),
      completedAt:
        data.status === "success" ||
        data.status === "failed" ||
        data.status === "cancelled"
          ? new Date()
          : null,
      duration: data.duration ? data.duration.toString() : null,

      // Details and error information
      details: data.details ? JSON.stringify(data.details) : null,
      errorMessage: data.errorMessage,
      errorCode: data.errorCode,

      // Related entities
      relatedUserId: data.relatedUserId,
      relatedEntityType: data.relatedEntityType,
      relatedEntityId: data.relatedEntityId,

      // System information
      serverName: data.serverName || process.env.SERVER_NAME || "unknown",
      processId: data.processId || process.pid.toString(),
      version: data.version || process.env.APP_VERSION || "unknown",
      environment: data.environment || process.env.NODE_ENV || "development",
    };

    const [systemEvent] = await db
      .insert(systemEvents)
      .values(systemEventData)
      .returning();

    return systemEvent;
  }

  /**
   * Log login attempt
   */
  static async logLoginAttempt(data: LoginAttemptData): Promise<LoginAttempt> {
    const loginAttemptData = {
      id: crypto.randomUUID(),
      email: data.email,
      success: data.success,
      userId: data.userId,
      sessionId: data.sessionId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      location: data.location,
      failureReason: data.failureReason,
      attempts: data.attempts ? data.attempts.toString() : null,
      isSuspicious: data.isSuspicious,
    };

    const [loginAttempt] = await db
      .insert(loginAttempts)
      .values(loginAttemptData)
      .returning();

    // If login failed, also log as security event
    if (!data.success) {
      await AuditService.logSecurityEvent(
        "login_failed",
        `Failed login attempt for ${data.email}: ${data.failureReason}`,
        {
          userId: data.userId,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          location: data.location,
        },
        {
          severity: data.isSuspicious ? "error" : "warning",
          metadata: {
            email: data.email,
            failureReason: data.failureReason,
            attempts: data.attempts,
          },
        }
      );
    }

    return loginAttempt;
  }

  /**
   * Search audit logs with filters
   */
  static async searchAuditLogs(filters: AuditSearchFilters): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    const conditions = [];

    if (filters.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }

    if (filters.clientId) {
      conditions.push(eq(auditLogs.clientId, filters.clientId));
    }

    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action as any));
    }

    if (filters.entity) {
      conditions.push(eq(auditLogs.entity, filters.entity as any));
    }

    if (filters.entityId) {
      conditions.push(eq(auditLogs.entityId, filters.entityId));
    }

    if (filters.severity) {
      conditions.push(eq(auditLogs.severity, filters.severity as any));
    }

    if (filters.success !== undefined) {
      conditions.push(eq(auditLogs.success, filters.success));
    }

    if (filters.ipAddress) {
      conditions.push(eq(auditLogs.ipAddress, filters.ipAddress));
    }

    if (filters.correlationId) {
      conditions.push(eq(auditLogs.correlationId, filters.correlationId));
    }

    if (filters.startDate) {
      conditions.push(gte(auditLogs.createdAt, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(auditLogs.createdAt, filters.endDate));
    }

    // Build the where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    const total = countResult?.count || 0;

    // Get paginated results
    const logs = await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(filters.limit || 50)
      .offset(filters.offset || 0);

    return { logs, total };
  }

  /**
   * Get audit summary for compliance reporting
   */
  static async getAuditSummary(
    startDate: Date,
    endDate: Date,
    options?: {
      groupBy?: "action" | "entity" | "user" | "day";
      includeDetails?: boolean;
    }
  ) {
    const groupBy = options?.groupBy || "action";

    let groupByField: any;
    switch (groupBy) {
      case "action":
        groupByField = auditLogs.action;
        break;
      case "entity":
        groupByField = auditLogs.entity;
        break;
      case "user":
        groupByField = auditLogs.userId;
        break;
      case "day":
        groupByField = sql`DATE(${auditLogs.createdAt})`;
        break;
      default:
        groupByField = auditLogs.action;
    }

    const summary = await db
      .select({
        group: groupByField,
        total: sql<number>`count(*)`,
        successful: sql<number>`count(*) FILTER (WHERE ${auditLogs.success} = true)`,
        failed: sql<number>`count(*) FILTER (WHERE ${auditLogs.success} = false)`,
        critical: sql<number>`count(*) FILTER (WHERE ${auditLogs.severity} = 'critical')`,
        errors: sql<number>`count(*) FILTER (WHERE ${auditLogs.severity} = 'error')`,
        warnings: sql<number>`count(*) FILTER (WHERE ${auditLogs.severity} = 'warning')`,
      })
      .from(auditLogs)
      .where(
        and(
          gte(auditLogs.createdAt, startDate),
          lte(auditLogs.createdAt, endDate)
        )
      )
      .groupBy(groupByField)
      .orderBy(desc(sql`count(*)`));

    return summary;
  }

  /**
   * Export audit logs for compliance
   */
  static async exportAuditLogs(
    filters: AuditSearchFilters,
    format: "csv" | "json" = "csv"
  ): Promise<string> {
    const { logs } = await AuditService.searchAuditLogs({
      ...filters,
      limit: 10_000,
    });

    if (format === "json") {
      return JSON.stringify(logs, null, 2);
    }

    // CSV format
    const headers = [
      "Timestamp",
      "User ID",
      "Action",
      "Entity",
      "Entity ID",
      "Description",
      "Success",
      "Severity",
      "IP Address",
      "User Agent",
      "Changes",
    ];

    const csvRows = [
      headers.join(","),
      ...logs.map((log) =>
        [
          log.createdAt.toISOString(),
          log.userId || "",
          log.action,
          log.entity,
          log.entityId || "",
          `"${log.description.replace(/"/g, '""')}"`,
          log.success,
          log.severity,
          log.ipAddress || "",
          log.userAgent ? `"${log.userAgent.replace(/"/g, '""')}"` : "",
          log.changedFields ? `"${log.changedFields.replace(/"/g, '""')}"` : "",
        ].join(",")
      ),
    ];

    return csvRows.join("\n");
  }

  /**
   * Archive old audit logs based on retention policy
   */
  static async archiveOldLogs(daysToKeep = 2555): Promise<number> {
    // 7 years default
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await db
      .update(auditLogs)
      .set({
        isArchived: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          lte(auditLogs.createdAt, cutoffDate),
          eq(auditLogs.isArchived, false)
        )
      );

    return result.length;
  }

  /**
   * Calculate retention period based on severity and entity type
   */
  private static calculateRetentionPeriod(
    severity?: string,
    entity?: string
  ): string {
    // Default retention periods (in days)
    const retentionPolicies = {
      critical: "3650", // 10 years
      error: "2555", // 7 years
      warning: "1825", // 5 years
      info: "1095", // 3 years
    };

    // Sensitive entities get longer retention
    const sensitiveEntities = ["user", "client", "permission", "role"];
    const isSensitive = sensitiveEntities.includes(entity || "");

    const basePeriod =
      retentionPolicies[severity as keyof typeof retentionPolicies] ||
      retentionPolicies.info;

    if (isSensitive) {
      // Extend retention by 2 years for sensitive entities
      return (Number.parseInt(basePeriod) + 730).toString();
    }

    return basePeriod;
  }

  /**
   * Get changed fields between old and new values
   */
  private static getChangedFields(
    oldValues: Record<string, any> | null,
    newValues: Record<string, any> | null
  ): string[] {
    if (!(oldValues && newValues)) return [];

    const changes: string[] = [];
    const allKeys = new Set([
      ...Object.keys(oldValues),
      ...Object.keys(newValues),
    ]);

    for (const key of allKeys) {
      if (oldValues[key] !== newValues[key]) {
        changes.push(key);
      }
    }

    return changes;
  }

  /**
   * Generate human-readable change description
   */
  private static generateChangeDescription(
    action: string,
    entity: string,
    changedFields: string[]
  ): string {
    switch (action) {
      case "create":
        return `Created new ${entity}`;
      case "update":
        if (changedFields.length > 0) {
          return `Updated ${entity}: ${changedFields.join(", ")}`;
        }
        return `Updated ${entity}`;
      case "delete":
        return `Deleted ${entity}`;
      default:
        return `${action} on ${entity}`;
    }
  }
}
