import type { Context, HonoRequest, Next } from "hono";
import { AuditService } from "../business-logic/audit-service";
import {
  type PermissionContext,
  RbacService,
} from "../business-logic/rbac-service";

// Types for middleware configuration
export interface RbacConfig {
  resource: string;
  action: string;
  scope?: string;
  requireAuth?: boolean;
  skipPermissionCheck?: boolean;
  customPermissionCheck?: (context: PermissionContext) => Promise<boolean>;
}

export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
  user?: any;
}

/**
 * Extract user context from request
 */
function extractUserContext(c: Context): {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
} {
  // Extract user from session/JWT - this depends on your auth implementation
  const user = c.get("user");
  const session = c.get("session");

  return {
    userId: user?.id,
    sessionId: session?.id,
    ipAddress: getClientIpAddress(c.req),
    userAgent: c.req.header("user-agent"),
  };
}

/**
 * Extract client IP address from request
 */
function getClientIpAddress(req: HonoRequest): string {
  // Check various headers for client IP
  const headers = [
    "x-forwarded-for",
    "x-real-ip",
    "x-client-ip",
    "cf-connecting-ip",
  ];

  for (const header of headers) {
    const value = req.header(header);
    if (value) {
      // Take first IP if comma-separated list
      return value.split(",")[0].trim();
    }
  }

  // Fallback to connection remote address
  return "unknown";
}

/**
 * RBAC permission checking middleware
 */
export function requirePermission(config: RbacConfig) {
  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const userContext = extractUserContext(c);

    try {
      // Check if authentication is required
      if (config.requireAuth !== false && !userContext.userId) {
        await AuditService.logSecurityEvent(
          "access_denied",
          `Unauthenticated access attempt to ${config.resource}:${config.action}`,
          {
            ipAddress: userContext.ipAddress,
            userAgent: userContext.userAgent,
            endpoint: c.req.url,
            method: c.req.method,
          },
          {
            severity: "warning",
            metadata: {
              resource: config.resource,
              action: config.action,
              scope: config.scope,
            },
          }
        );

        return c.json(
          {
            error: "Authentication required",
            code: "UNAUTHENTICATED",
          },
          401
        );
      }

      // Skip permission check if configured
      if (config.skipPermissionCheck) {
        return next();
      }

      // Custom permission check
      if (config.customPermissionCheck && userContext.userId) {
        const permissionContext: PermissionContext = {
          userId: userContext.userId,
          resource: config.resource,
          action: config.action,
          scope: config.scope,
        };

        const hasPermission =
          await config.customPermissionCheck(permissionContext);

        if (!hasPermission) {
          await AuditService.logUserAction(
            userContext.userId,
            "access_denied",
            config.resource,
            "",
            `Access denied to ${config.resource}:${config.action} (custom check failed)`,
            {
              ipAddress: userContext.ipAddress,
              userAgent: userContext.userAgent,
              endpoint: c.req.url,
              method: c.req.method,
            },
            {
              severity: "warning",
              metadata: {
                resource: config.resource,
                action: config.action,
                scope: config.scope,
                checkType: "custom",
              },
            }
          );

          return c.json(
            {
              error: "Insufficient permissions",
              code: "FORBIDDEN",
            },
            403
          );
        }
      } else if (userContext.userId) {
        // Standard RBAC permission check
        const permissionResult = await RbacService.checkPermission({
          userId: userContext.userId,
          resource: config.resource,
          action: config.action,
          scope: config.scope,
        });

        if (!permissionResult.granted) {
          await AuditService.logUserAction(
            userContext.userId,
            "access_denied",
            config.resource,
            "",
            `Access denied to ${config.resource}:${config.action}: ${permissionResult.reason}`,
            {
              ipAddress: userContext.ipAddress,
              userAgent: userContext.userAgent,
              endpoint: c.req.url,
              method: c.req.method,
            },
            {
              severity: "warning",
              metadata: {
                resource: config.resource,
                action: config.action,
                scope: config.scope,
                reason: permissionResult.reason,
                source: permissionResult.source,
              },
            }
          );

          return c.json(
            {
              error: "Insufficient permissions",
              code: "FORBIDDEN",
              details: {
                resource: config.resource,
                action: config.action,
                reason: permissionResult.reason,
              },
            },
            403
          );
        }

        // Store permission result in context for use by handlers
        c.set("permissionResult", permissionResult);
      }

      // Log successful access
      if (userContext.userId) {
        await AuditService.logUserAction(
          userContext.userId,
          "access_granted",
          config.resource,
          "",
          `Access granted to ${config.resource}:${config.action}`,
          {
            ipAddress: userContext.ipAddress,
            userAgent: userContext.userAgent,
            endpoint: c.req.url,
            method: c.req.method,
          },
          {
            severity: "info",
            metadata: {
              resource: config.resource,
              action: config.action,
              scope: config.scope,
            },
          }
        );
      }

      await next();

      // Log successful completion
      const duration = Date.now() - startTime;
      if (userContext.userId) {
        await AuditService.logUserAction(
          userContext.userId,
          "operation_completed",
          config.resource,
          "",
          `Successfully completed ${config.resource}:${config.action}`,
          {
            ipAddress: userContext.ipAddress,
            userAgent: userContext.userAgent,
            endpoint: c.req.url,
            method: c.req.method,
          },
          {
            severity: "info",
            metadata: {
              resource: config.resource,
              action: config.action,
              scope: config.scope,
              duration,
              statusCode: c.res.status,
            },
          }
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      if (userContext.userId) {
        await AuditService.logUserAction(
          userContext.userId,
          "operation_failed",
          config.resource,
          "",
          `Operation failed for ${config.resource}:${config.action}: ${error instanceof Error ? error.message : "Unknown error"}`,
          {
            ipAddress: userContext.ipAddress,
            userAgent: userContext.userAgent,
            endpoint: c.req.url,
            method: c.req.method,
          },
          {
            severity: "error",
            metadata: {
              resource: config.resource,
              action: config.action,
              scope: config.scope,
              duration,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          }
        );
      }

      console.error("RBAC middleware error:", error);
      return c.json(
        {
          error: "Internal server error",
          code: "INTERNAL_ERROR",
        },
        500
      );
    }
  };
}

/**
 * Role-based access control middleware
 */
export function requireRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return requirePermission({
    resource: "system",
    action: "access",
    customPermissionCheck: async (context) => {
      const userSummary = await RbacService.getUserPermissionSummary(
        context.userId
      );
      const userRoles = userSummary.roles.map((role) => role.name);

      return roles.some((role) => userRoles.includes(role));
    },
  });
}

/**
 * Admin access middleware
 */
export const requireAdmin = requireRole(["admin", "super_admin"]);

/**
 * Manager or higher access middleware
 */
export const requireManager = requireRole(["manager", "admin", "super_admin"]);

/**
 * Audit logging middleware for all requests
 */
export function auditLogger(
  options: {
    logRequests?: boolean;
    logResponses?: boolean;
    skipPaths?: string[];
    sensitiveFields?: string[];
  } = {}
) {
  const {
    logRequests = true,
    logResponses = true,
    skipPaths = ["/health", "/metrics"],
    sensitiveFields = ["password", "token", "secret", "key"],
  } = options;

  return async (c: Context, next: Next) => {
    const startTime = Date.now();
    const userContext = extractUserContext(c);
    const correlationId = crypto.randomUUID();

    // Skip logging for certain paths
    if (skipPaths.some((path) => c.req.url.includes(path))) {
      return next();
    }

    try {
      // Log request
      if (logRequests) {
        const requestBody = await c.req.text();
        c.req = new Request(c.req.url, {
          method: c.req.method,
          headers: c.req.headers,
          body: requestBody || undefined,
        });

        // Sanitize sensitive fields from request body
        const sanitizedBody = sanitizeObject(
          requestBody ? JSON.parse(requestBody) : {},
          sensitiveFields
        );

        await AuditService.logAuditEvent({
          action: "api_request",
          entity: "system",
          description: `API request to ${c.req.method} ${c.req.url}`,
          context: {
            ...userContext,
            endpoint: c.req.url,
            method: c.req.method,
          },
          metadata: {
            requestBody: sanitizedBody,
            headers: Object.fromEntries(c.req.headers.entries()),
          },
          correlationId,
          severity: "info",
        });
      }

      await next();

      // Log response
      if (logResponses) {
        const duration = Date.now() - startTime;
        const statusCode = c.res.status;
        const isSuccess = statusCode < 400;

        await AuditService.logAuditEvent({
          action: "api_response",
          entity: "system",
          description: `API response ${statusCode} for ${c.req.method} ${c.req.url}`,
          context: {
            ...userContext,
            endpoint: c.req.url,
            method: c.req.method,
          },
          metadata: {
            statusCode,
            duration,
            responseHeaders: Object.fromEntries(c.res.headers.entries()),
          },
          correlationId,
          severity: isSuccess ? "info" : statusCode < 500 ? "warning" : "error",
          success: isSuccess,
          duration,
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;

      await AuditService.logAuditEvent({
        action: "api_error",
        entity: "system",
        description: `API error for ${c.req.method} ${c.req.url}: ${error instanceof Error ? error.message : "Unknown error"}`,
        context: {
          ...userContext,
          endpoint: c.req.url,
          method: c.req.method,
        },
        metadata: {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          duration,
        },
        correlationId,
        severity: "error",
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        duration,
      });

      throw error;
    }
  };
}

/**
 * Sanitize object by removing or masking sensitive fields
 */
function sanitizeObject(obj: any, sensitiveFields: string[]): any {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sensitiveFields));
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveFields.some((field) =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeObject(value, sensitiveFields);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Data change tracking middleware
 */
export function trackDataChanges(entityType: string) {
  return async (c: Context, next: Next) => {
    const userContext = extractUserContext(c);

    // Store original handler
    const originalJson = c.json.bind(c);

    // Override json method to capture response data
    c.json = (object: any, init?: ResponseInit) => {
      // Track data changes if this was a create/update/delete operation
      if (
        userContext.userId &&
        ["POST", "PUT", "PATCH", "DELETE"].includes(c.req.method)
      ) {
        const operation =
          c.req.method === "POST"
            ? "create"
            : c.req.method === "DELETE"
              ? "delete"
              : "update";

        // Extract entity ID from response or URL
        const entityId =
          object?.id || object?.data?.id || c.req.url.split("/").pop();

        if (entityId) {
          // This is a simplified implementation - in practice, you'd want to
          // capture the actual before/after values from your business logic
          AuditService.logDataChange(
            userContext.userId,
            entityType,
            entityId,
            operation,
            null, // oldValues - should be captured from business logic
            object, // newValues
            {
              ipAddress: userContext.ipAddress,
              userAgent: userContext.userAgent,
              endpoint: c.req.url,
              method: c.req.method,
            }
          ).catch((error) => {
            console.error("Error logging data change:", error);
          });
        }
      }

      return originalJson(object, init);
    };

    await next();
  };
}

/**
 * Rate limiting with audit logging
 */
export function rateLimit(options: {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (c: Context) => string;
}) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return async (c: Context, next: Next) => {
    const userContext = extractUserContext(c);
    const key = options.keyGenerator?.(c) || userContext.ipAddress || "unknown";
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < now) {
        requests.delete(k);
      }
    }

    const current = requests.get(key) || {
      count: 0,
      resetTime: now + options.windowMs,
    };

    if (current.count >= options.maxRequests) {
      await AuditService.logSecurityEvent(
        "rate_limit_exceeded",
        `Rate limit exceeded for key: ${key}`,
        {
          ipAddress: userContext.ipAddress,
          userAgent: userContext.userAgent,
          endpoint: c.req.url,
          method: c.req.method,
          userId: userContext.userId,
        },
        {
          severity: "warning",
          metadata: {
            key,
            requests: current.count,
            maxRequests: options.maxRequests,
            windowMs: options.windowMs,
          },
        }
      );

      return c.json(
        {
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((current.resetTime - now) / 1000),
        },
        429
      );
    }

    current.count++;
    requests.set(key, current);

    await next();
  };
}
