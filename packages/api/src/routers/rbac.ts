import { or } from "@orpc/server";
import { z } from "zod";
import { AuditService } from "../business-logic/audit-service";
import { RbacService } from "../business-logic/rbac-service";

// Validation schemas
const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  parentRoleId: z.string().nullable(),
  level: z.string(),
  isSystemRole: z.boolean(),
  isCustomRole: z.boolean(),
  isActive: z.boolean(),
  isTemplate: z.boolean(),
  maxUsers: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
  updatedBy: z.string().nullable(),
});

const permissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  resource: z.enum([
    "users",
    "clients",
    "documents",
    "tax_calculations",
    "compliance",
    "appointments",
    "reports",
    "audit_logs",
    "settings",
    "billing",
    "tasks",
    "communications",
  ]),
  action: z.enum([
    "create",
    "read",
    "update",
    "delete",
    "approve",
    "reject",
    "submit",
    "cancel",
    "archive",
    "restore",
    "export",
    "import",
    "share",
    "download",
    "manage_permissions",
    "view_sensitive",
  ]),
  scope: z.enum([
    "global",
    "department",
    "team",
    "personal",
    "client_specific",
  ]),
  isSystemPermission: z.boolean(),
  requiresApproval: z.boolean(),
  isSensitive: z.boolean(),
  conditions: z.string().nullable(),
  constraints: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const userRoleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  isActive: z.boolean(),
  isTemporary: z.boolean(),
  validFrom: z.date(),
  validUntil: z.date().nullable(),
  assignedBy: z.string(),
  assignmentReason: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  approvalRequired: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const userPermissionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  permissionId: z.string(),
  isGranted: z.boolean(),
  isDenied: z.boolean(),
  overridesRole: z.boolean(),
  reason: z.string(),
  conditions: z.string().nullable(),
  constraints: z.string().nullable(),
  validFrom: z.date(),
  validUntil: z.date().nullable(),
  assignedBy: z.string(),
  approvedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const permissionResultSchema = z.object({
  granted: z.boolean(),
  reason: z.string().optional(),
  source: z.enum(["role", "direct", "inherited", "denied"]).optional(),
  conditions: z.record(z.any()).optional(),
});

const userPermissionSummarySchema = z.object({
  userId: z.string(),
  roles: z.array(roleSchema),
  permissions: z.array(permissionSchema),
  effectivePermissions: z.record(permissionResultSchema),
});

// RBAC Router
export const rbacRouter = or
  .input(
    z.object({
      userId: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    // Basic auth check - extract from context
    const currentUser = context.user;
    if (!currentUser) {
      throw new Error("Authentication required");
    }

    return {
      currentUserId: currentUser.id,
      hasAdminAccess: false, // Will be determined by specific endpoints
    };
  })
  .router({
    // Permission checking
    checkPermission: or
      .input(
        z.object({
          userId: z.string(),
          resource: z.string(),
          action: z.string(),
          scope: z.string().optional().default("global"),
          conditions: z.record(z.any()).optional(),
        })
      )
      .output(permissionResultSchema)
      .handler(async ({ input, context }) => {
        const currentUser = context.user;

        // Check if user can check permissions for other users
        if (input.userId !== currentUser.id) {
          const canCheckOthers = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "manage_permissions",
            scope: "global",
          });

          if (!canCheckOthers.granted) {
            throw new Error(
              "Insufficient permissions to check permissions for other users"
            );
          }
        }

        const result = await RbacService.checkPermission({
          userId: input.userId,
          resource: input.resource,
          action: input.action,
          scope: input.scope,
          conditions: input.conditions,
        });

        // Log permission check
        await AuditService.logUserAction(
          currentUser.id,
          "permission_check",
          "permission",
          "",
          `Checked permission ${input.resource}:${input.action} for user ${input.userId}`,
          {},
          {
            metadata: {
              targetUserId: input.userId,
              resource: input.resource,
              action: input.action,
              scope: input.scope,
              result: result.granted,
            },
          }
        );

        return result;
      }),

    // Get user permission summary
    getUserPermissions: or
      .input(z.object({ userId: z.string() }))
      .output(userPermissionSummarySchema)
      .handler(async ({ input, context }) => {
        const currentUser = context.user;

        // Check if user can view permissions for other users
        if (input.userId !== currentUser.id) {
          const canViewOthers = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "view_sensitive",
            scope: "global",
          });

          if (!canViewOthers.granted) {
            throw new Error(
              "Insufficient permissions to view permissions for other users"
            );
          }
        }

        const summary = await RbacService.getUserPermissionSummary(
          input.userId
        );

        await AuditService.logUserAction(
          currentUser.id,
          "view",
          "user_permissions",
          input.userId,
          `Viewed permissions for user ${input.userId}`,
          {},
          { severity: "info" }
        );

        return summary;
      }),

    // Role management
    roles: or.router({
      list: or
        .input(
          z.object({ includeInactive: z.boolean().optional().default(false) })
        )
        .output(z.array(roleSchema))
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canViewRoles = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "read",
            scope: "global",
          });

          if (!canViewRoles.granted) {
            throw new Error("Insufficient permissions to view roles");
          }

          const roles = await RbacService.getAllRoles();

          await AuditService.logUserAction(
            currentUser.id,
            "read",
            "role",
            "",
            "Listed all roles",
            {},
            { severity: "info" }
          );

          return roles.filter((role) => input.includeInactive || role.isActive);
        }),

      create: or
        .input(
          z.object({
            name: z.string(),
            displayName: z.string(),
            description: z.string().optional(),
            parentRoleId: z.string().optional(),
            level: z.string().optional(),
          })
        )
        .output(roleSchema)
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canCreateRoles = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "manage_permissions",
            scope: "global",
          });

          if (!canCreateRoles.granted) {
            throw new Error("Insufficient permissions to create roles");
          }

          const newRole = await RbacService.createRole(input, currentUser.id);

          await AuditService.logUserAction(
            currentUser.id,
            "create",
            "role",
            newRole.id,
            `Created role: ${newRole.name}`,
            {},
            {
              metadata: {
                roleName: newRole.name,
                roleDisplayName: newRole.displayName,
              },
              severity: "info",
            }
          );

          return newRole;
        }),

      assignToUser: or
        .input(
          z.object({
            userId: z.string(),
            roleId: z.string(),
            isTemporary: z.boolean().optional().default(false),
            validUntil: z.date().optional(),
            reason: z.string().optional(),
            requiresApproval: z.boolean().optional().default(false),
          })
        )
        .output(userRoleSchema)
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canAssignRoles = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "manage_permissions",
            scope: "global",
          });

          if (!canAssignRoles.granted) {
            throw new Error("Insufficient permissions to assign roles");
          }

          const userRole = await RbacService.assignRoleToUser(
            input.userId,
            input.roleId,
            currentUser.id,
            {
              isTemporary: input.isTemporary,
              validUntil: input.validUntil,
              reason: input.reason,
              requiresApproval: input.requiresApproval,
            }
          );

          await AuditService.logUserAction(
            currentUser.id,
            "update",
            "user",
            input.userId,
            `Assigned role ${input.roleId} to user ${input.userId}`,
            {},
            {
              metadata: {
                targetUserId: input.userId,
                roleId: input.roleId,
                isTemporary: input.isTemporary,
                reason: input.reason,
              },
              severity: "info",
            }
          );

          return userRole;
        }),

      removeFromUser: or
        .input(
          z.object({
            userId: z.string(),
            roleId: z.string(),
            reason: z.string().optional(),
          })
        )
        .output(z.boolean())
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canRemoveRoles = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "manage_permissions",
            scope: "global",
          });

          if (!canRemoveRoles.granted) {
            throw new Error("Insufficient permissions to remove roles");
          }

          const result = await RbacService.removeRoleFromUser(
            input.userId,
            input.roleId,
            currentUser.id,
            input.reason
          );

          await AuditService.logUserAction(
            currentUser.id,
            "update",
            "user",
            input.userId,
            `Removed role ${input.roleId} from user ${input.userId}`,
            {},
            {
              metadata: {
                targetUserId: input.userId,
                roleId: input.roleId,
                reason: input.reason,
              },
              severity: "info",
            }
          );

          return result;
        }),
    }),

    // Permission management
    permissions: or.router({
      list: or
        .input(
          z.object({ includeInactive: z.boolean().optional().default(false) })
        )
        .output(z.array(permissionSchema))
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canViewPermissions = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "read",
            scope: "global",
          });

          if (!canViewPermissions.granted) {
            throw new Error("Insufficient permissions to view permissions");
          }

          const permissions = await RbacService.getAllPermissions();

          await AuditService.logUserAction(
            currentUser.id,
            "read",
            "permission",
            "",
            "Listed all permissions",
            {},
            { severity: "info" }
          );

          return permissions.filter(
            (permission) => input.includeInactive || permission.isActive
          );
        }),

      create: or
        .input(
          z.object({
            name: z.string(),
            displayName: z.string(),
            description: z.string().optional(),
            resource: z.enum([
              "users",
              "clients",
              "documents",
              "tax_calculations",
              "compliance",
              "appointments",
              "reports",
              "audit_logs",
              "settings",
              "billing",
              "tasks",
              "communications",
            ]),
            action: z.enum([
              "create",
              "read",
              "update",
              "delete",
              "approve",
              "reject",
              "submit",
              "cancel",
              "archive",
              "restore",
              "export",
              "import",
              "share",
              "download",
              "manage_permissions",
              "view_sensitive",
            ]),
            scope: z
              .enum([
                "global",
                "department",
                "team",
                "personal",
                "client_specific",
              ])
              .optional(),
            conditions: z.record(z.any()).optional(),
            isSensitive: z.boolean().optional(),
          })
        )
        .output(permissionSchema)
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canCreatePermissions = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "manage_permissions",
            scope: "global",
          });

          if (!canCreatePermissions.granted) {
            throw new Error("Insufficient permissions to create permissions");
          }

          const newPermission = await RbacService.createPermission(
            input,
            currentUser.id
          );

          await AuditService.logUserAction(
            currentUser.id,
            "create",
            "permission",
            newPermission.id,
            `Created permission: ${newPermission.name}`,
            {},
            {
              metadata: {
                permissionName: newPermission.name,
                resource: newPermission.resource,
                action: newPermission.action,
              },
              severity: "info",
            }
          );

          return newPermission;
        }),

      grantToUser: or
        .input(
          z.object({
            userId: z.string(),
            permissionId: z.string(),
            reason: z.string(),
            validUntil: z.date().optional(),
            conditions: z.record(z.any()).optional(),
            overridesRole: z.boolean().optional().default(false),
          })
        )
        .output(userPermissionSchema)
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canGrantPermissions = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "manage_permissions",
            scope: "global",
          });

          if (!canGrantPermissions.granted) {
            throw new Error("Insufficient permissions to grant permissions");
          }

          const userPermission = await RbacService.grantDirectPermission(
            input.userId,
            input.permissionId,
            currentUser.id,
            {
              reason: input.reason,
              validUntil: input.validUntil,
              conditions: input.conditions,
              overridesRole: input.overridesRole,
            }
          );

          await AuditService.logUserAction(
            currentUser.id,
            "update",
            "user",
            input.userId,
            `Granted permission ${input.permissionId} to user ${input.userId}`,
            {},
            {
              metadata: {
                targetUserId: input.userId,
                permissionId: input.permissionId,
                reason: input.reason,
                overridesRole: input.overridesRole,
              },
              severity: "info",
            }
          );

          return userPermission;
        }),

      denyToUser: or
        .input(
          z.object({
            userId: z.string(),
            permissionId: z.string(),
            reason: z.string(),
            validUntil: z.date().optional(),
            conditions: z.record(z.any()).optional(),
          })
        )
        .output(userPermissionSchema)
        .handler(async ({ input, context }) => {
          const currentUser = context.user;

          const canDenyPermissions = await RbacService.checkPermission({
            userId: currentUser.id,
            resource: "users",
            action: "manage_permissions",
            scope: "global",
          });

          if (!canDenyPermissions.granted) {
            throw new Error("Insufficient permissions to deny permissions");
          }

          const userPermission = await RbacService.denyDirectPermission(
            input.userId,
            input.permissionId,
            currentUser.id,
            {
              reason: input.reason,
              validUntil: input.validUntil,
              conditions: input.conditions,
            }
          );

          await AuditService.logUserAction(
            currentUser.id,
            "update",
            "user",
            input.userId,
            `Denied permission ${input.permissionId} to user ${input.userId}`,
            {},
            {
              metadata: {
                targetUserId: input.userId,
                permissionId: input.permissionId,
                reason: input.reason,
              },
              severity: "warning",
            }
          );

          return userPermission;
        }),
    }),
  });
