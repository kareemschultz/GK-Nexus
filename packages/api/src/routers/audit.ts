import { z } from "zod";
import { AuditService } from "../business-logic/audit-service";
import { RbacService } from "../business-logic/rbac-service";
import { o } from "../index";

// Validation schemas
const auditLogSchema = z.object({
  id: z.string(),
  action: z.enum([
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
  ]),
  entity: z.enum([
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
  ]),
  entityId: z.string().nullable(),
  description: z.string(),
  userId: z.string().nullable(),
  clientId: z.string().nullable(),
  sessionId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  location: z.string().nullable(),
  endpoint: z.string().nullable(),
  method: z.string().nullable(),
  oldValues: z.string().nullable(),
  newValues: z.string().nullable(),
  changedFields: z.string().nullable(),
  severity: z.enum(["info", "warning", "error", "critical"]),
  success: z.boolean(),
  errorMessage: z.string().nullable(),
  duration: z.string().nullable(),
  metadata: z.string().nullable(),
  tags: z.string().nullable(),
  correlationId: z.string().nullable(),
  retentionPeriod: z.string().nullable(),
  isArchived: z.boolean(),
  createdAt: z.date(),
});

const systemEventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  eventName: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  severity: z.enum(["info", "warning", "error", "critical"]),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  duration: z.string().nullable(),
  details: z.string().nullable(),
  errorMessage: z.string().nullable(),
  errorCode: z.string().nullable(),
  relatedUserId: z.string().nullable(),
  relatedEntityType: z.string().nullable(),
  relatedEntityId: z.string().nullable(),
  serverName: z.string().nullable(),
  processId: z.string().nullable(),
  version: z.string().nullable(),
  environment: z.string().nullable(),
  createdAt: z.date(),
});

const loginAttemptSchema = z.object({
  id: z.string(),
  email: z.string(),
  success: z.boolean(),
  userId: z.string().nullable(),
  sessionId: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  location: z.string().nullable(),
  failureReason: z.string().nullable(),
  attempts: z.string().nullable(),
  isSuspicious: z.boolean(),
  blockedUntil: z.date().nullable(),
  createdAt: z.date(),
});

const auditSearchFiltersSchema = z.object({
  userId: z.string().optional(),
  clientId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  severity: z.enum(["info", "warning", "error", "critical"]).optional(),
  success: z.boolean().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  ipAddress: z.string().optional(),
  correlationId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(1000).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

const auditSummarySchema = z.object({
  group: z.any(),
  total: z.number(),
  successful: z.number(),
  failed: z.number(),
  critical: z.number(),
  errors: z.number(),
  warnings: z.number(),
});

// Audit Router
export const auditRouter = o
  .input(
    z.object({
      userId: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    // Basic auth check
    const currentUser = context.user;
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    return {
      currentUserId: currentUser.id,
    };
  })
  .router({
    // Audit log searching and viewing
    logs: o.router({
      search: o
        .input(auditSearchFiltersSchema)
        .output(
          z.object({
            logs: z.array(auditLogSchema),
            total: z.number(),
          })
        )
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          // Check if user can view audit logs
          const canViewAuditLogs = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "audit_logs",
            action: "read",
            scope: "global",
          });

          if (!canViewAuditLogs.granted) {
            throw new Error("Insufficient permissions to view audit logs");
          }

          const result = await AuditService.searchAuditLogs(input);

          // Log the audit log search
          await AuditService.logUserAction(
            currentUser.id,
            "read",
            "audit_logs",
            "",
            "Searched audit logs",
            {},
            {
              metadata: {
                filters: input,
                resultsCount: result.logs.length,
                totalCount: result.total,
              },
              severity: "info",
            }
          );

          return result;
        }),

      getById: o
        .input(z.object({ id: z.string() }))
        .output(auditLogSchema)
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canViewAuditLogs = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "audit_logs",
            action: "read",
            scope: "global",
          });

          if (!canViewAuditLogs.granted) {
            throw new Error("Insufficient permissions to view audit logs");
          }

          const result = await AuditService.searchAuditLogs({
            limit: 1,
            offset: 0,
            // Add filter by ID - this would need to be implemented in the service
          });

          if (!result.logs.length) {
            throw new Error("Audit log not found");
          }

          await AuditService.logUserAction(
            currentUser.id,
            "read",
            "audit_logs",
            input.id,
            `Viewed audit log ${input.id}`,
            {},
            { severity: "info" }
          );

          return result.logs[0];
        }),

      export: o
        .input(
          z.object({
            filters: auditSearchFiltersSchema,
            format: z.enum(["csv", "json"]).optional().default("csv"),
          })
        )
        .output(z.object({ data: z.string(), filename: z.string() }))
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canExportAuditLogs = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "audit_logs",
            action: "export",
            scope: "global",
          });

          if (!canExportAuditLogs.granted) {
            throw new Error("Insufficient permissions to export audit logs");
          }

          const data = await AuditService.exportAuditLogs(
            input.filters,
            input.format
          );

          const timestamp = new Date().toISOString().split("T")[0];
          const filename = `audit-logs-${timestamp}.${input.format}`;

          await AuditService.logUserAction(
            currentUser.id,
            "export",
            "audit_logs",
            "",
            "Exported audit logs",
            {},
            {
              metadata: {
                format: input.format,
                filters: input.filters,
                filename,
              },
              severity: "info",
            }
          );

          return { data, filename };
        }),

      summary: o
        .input(
          z.object({
            startDate: z.date(),
            endDate: z.date(),
            groupBy: z
              .enum(["action", "entity", "user", "day"])
              .optional()
              .default("action"),
            includeDetails: z.boolean().optional().default(false),
          })
        )
        .output(z.array(auditSummarySchema))
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canViewAuditSummary = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "audit_logs",
            action: "read",
            scope: "global",
          });

          if (!canViewAuditSummary.granted) {
            throw new Error("Insufficient permissions to view audit summary");
          }

          const summary = await AuditService.getAuditSummary(
            input.startDate,
            input.endDate,
            {
              groupBy: input.groupBy,
              includeDetails: input.includeDetails,
            }
          );

          await AuditService.logUserAction(
            currentUser.id,
            "read",
            "audit_logs",
            "",
            "Generated audit summary",
            {},
            {
              metadata: {
                startDate: input.startDate.toISOString(),
                endDate: input.endDate.toISOString(),
                groupBy: input.groupBy,
              },
              severity: "info",
            }
          );

          return summary;
        }),

      archive: o
        .input(
          z.object({
            daysToKeep: z.number().min(1).max(3650).optional().default(2555),
          })
        )
        .output(z.object({ archivedCount: z.number() }))
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canArchiveAuditLogs = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "audit_logs",
            action: "archive",
            scope: "global",
          });

          if (!canArchiveAuditLogs.granted) {
            throw new Error("Insufficient permissions to archive audit logs");
          }

          const archivedCount = await AuditService.archiveOldLogs(
            input.daysToKeep
          );

          await AuditService.logUserAction(
            currentUser.id,
            "archive",
            "audit_logs",
            "",
            `Archived ${archivedCount} audit logs`,
            {},
            {
              metadata: {
                daysToKeep: input.daysToKeep,
                archivedCount,
              },
              severity: "info",
            }
          );

          return { archivedCount };
        }),
    }),

    // System event monitoring
    systemEvents: o.router({
      list: o
        .input(
          z.object({
            eventType: z.string().optional(),
            status: z
              .enum(["success", "failed", "in_progress", "cancelled"])
              .optional(),
            severity: z
              .enum(["info", "warning", "error", "critical"])
              .optional(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
            limit: z.number().min(1).max(1000).optional().default(50),
            offset: z.number().min(0).optional().default(0),
          })
        )
        .output(z.array(systemEventSchema))
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canViewSystemEvents = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "audit_logs",
            action: "read",
            scope: "global",
          });

          if (!canViewSystemEvents.granted) {
            throw new Error("Insufficient permissions to view system events");
          }

          // This would need to be implemented in the AuditService
          // For now, return empty array
          const events: any[] = [];

          await AuditService.logUserAction(
            currentUser.id,
            "read",
            "system",
            "",
            "Viewed system events",
            {},
            {
              metadata: { filters: input, resultsCount: events.length },
              severity: "info",
            }
          );

          return events;
        }),

      create: o
        .input(
          z.object({
            eventType: z.string(),
            eventName: z.string(),
            description: z.string().optional(),
            status: z.enum(["success", "failed", "in_progress", "cancelled"]),
            severity: z
              .enum(["info", "warning", "error", "critical"])
              .optional(),
            details: z.record(z.any()).optional(),
            errorMessage: z.string().optional(),
            errorCode: z.string().optional(),
            relatedUserId: z.string().optional(),
            relatedEntityType: z.string().optional(),
            relatedEntityId: z.string().optional(),
            duration: z.number().optional(),
          })
        )
        .output(systemEventSchema)
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canCreateSystemEvents = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "system",
            action: "create",
            scope: "global",
          });

          if (!canCreateSystemEvents.granted) {
            throw new Error("Insufficient permissions to create system events");
          }

          const systemEvent = await AuditService.logSystemEvent(input);

          return systemEvent;
        }),
    }),

    // Login attempt monitoring
    loginAttempts: o.router({
      list: o
        .input(
          z.object({
            email: z.string().optional(),
            success: z.boolean().optional(),
            isSuspicious: z.boolean().optional(),
            startDate: z.date().optional(),
            endDate: z.date().optional(),
            limit: z.number().min(1).max(1000).optional().default(50),
            offset: z.number().min(0).optional().default(0),
          })
        )
        .output(z.array(loginAttemptSchema))
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canViewLoginAttempts = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "audit_logs",
            action: "read",
            scope: "global",
          });

          if (!canViewLoginAttempts.granted) {
            throw new Error("Insufficient permissions to view login attempts");
          }

          // This would need to be implemented in the AuditService
          // For now, return empty array
          const attempts: any[] = [];

          await AuditService.logUserAction(
            currentUser.id,
            "read",
            "session",
            "",
            "Viewed login attempts",
            {},
            {
              metadata: { filters: input, resultsCount: attempts.length },
              severity: "info",
            }
          );

          return attempts;
        }),

      getSuspiciousActivity: o
        .input(
          z.object({
            timeRange: z
              .enum(["1h", "24h", "7d", "30d"])
              .optional()
              .default("24h"),
            limit: z.number().min(1).max(100).optional().default(20),
          })
        )
        .output(
          z.object({
            suspiciousLogins: z.array(loginAttemptSchema),
            failedAttemptsByIp: z.array(
              z.object({
                ipAddress: z.string(),
                attemptCount: z.number(),
                lastAttempt: z.date(),
              })
            ),
            blockedIps: z.array(
              z.object({
                ipAddress: z.string(),
                blockedUntil: z.date(),
                reason: z.string(),
              })
            ),
          })
        )
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canViewSecurityEvents = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "audit_logs",
            action: "view_sensitive",
            scope: "global",
          });

          if (!canViewSecurityEvents.granted) {
            throw new Error("Insufficient permissions to view security events");
          }

          // This would need to be implemented in the AuditService
          // For now, return empty data
          const securityData = {
            suspiciousLogins: [],
            failedAttemptsByIp: [],
            blockedIps: [],
          };

          await AuditService.logUserAction(
            currentUser.id,
            "read",
            "system",
            "",
            "Viewed suspicious activity report",
            {},
            {
              metadata: { timeRange: input.timeRange },
              severity: "info",
            }
          );

          return securityData;
        }),
    }),

    // Compliance reporting
    compliance: o.router({
      generateReport: o
        .input(
          z.object({
            reportType: z.enum(["soc2", "gdpr", "hipaa", "custom"]),
            startDate: z.date(),
            endDate: z.date(),
            includeUserActivity: z.boolean().optional().default(true),
            includeDataChanges: z.boolean().optional().default(true),
            includeSecurityEvents: z.boolean().optional().default(true),
            format: z.enum(["pdf", "csv", "json"]).optional().default("pdf"),
          })
        )
        .output(
          z.object({
            reportId: z.string(),
            data: z.string(),
            filename: z.string(),
            generatedAt: z.date(),
          })
        )
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canGenerateComplianceReports =
            await RbacService.checkPermission({
              userId: currentUser.id,
              resource: "reports",
              action: "create",
              scope: "global",
            });

          if (!canGenerateComplianceReports.granted) {
            throw new Error(
              "Insufficient permissions to generate compliance reports"
            );
          }

          // This would generate a comprehensive compliance report
          const reportId = crypto.randomUUID();
          const timestamp = new Date();
          const filename = `${input.reportType}-compliance-report-${timestamp.toISOString().split("T")[0]}.${input.format}`;

          // Mock report data - in practice, this would query audit logs and format appropriately
          const reportData = "Mock compliance report data";

          await AuditService.logUserAction(
            currentUser.id,
            "create",
            "report",
            reportId,
            `Generated ${input.reportType} compliance report`,
            {},
            {
              metadata: {
                reportType: input.reportType,
                startDate: input.startDate.toISOString(),
                endDate: input.endDate.toISOString(),
                format: input.format,
                filename,
              },
              severity: "info",
            }
          );

          return {
            reportId,
            data: reportData,
            filename,
            generatedAt: timestamp,
          };
        }),

      getRetentionPolicy: o
        .output(
          z.object({
            policies: z.array(
              z.object({
                entityType: z.string(),
                severity: z.string(),
                retentionDays: z.number(),
                archiveAfterDays: z.number(),
                description: z.string(),
              })
            ),
          })
        )
        .handler(async ({ context }) => {
          const currentUser = context.user;

          const canViewRetentionPolicy = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "settings",
            action: "read",
            scope: "global",
          });

          if (!canViewRetentionPolicy.granted) {
            throw new Error(
              "Insufficient permissions to view retention policies"
            );
          }

          // Mock retention policies
          const policies = [
            {
              entityType: "critical_audit_logs",
              severity: "critical",
              retentionDays: 3650, // 10 years
              archiveAfterDays: 2555, // 7 years
              description: "Critical security and compliance events",
            },
            {
              entityType: "standard_audit_logs",
              severity: "info",
              retentionDays: 1095, // 3 years
              archiveAfterDays: 730, // 2 years
              description: "Standard user and system activity",
            },
            {
              entityType: "login_attempts",
              severity: "warning",
              retentionDays: 1825, // 5 years
              archiveAfterDays: 1095, // 3 years
              description: "Authentication attempts and security events",
            },
          ];

          await AuditService.logUserAction(
            currentUser.id,
            "read",
            "settings",
            "",
            "Viewed audit retention policies",
            {},
            { severity: "info" }
          );

          return { policies };
        }),
    }),
  });
