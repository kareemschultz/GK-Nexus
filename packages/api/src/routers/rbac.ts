import { z } from "zod";
import { AuditService } from "../business-logic/audit-service";
import { RbacService } from "../business-logic/rbac-service";
import { protectedProcedure } from "../index";

// Validation schemas (unused variables - kept for reference)
// These schemas were used for validation but are currently not being used
// to avoid TS6133 errors. Keeping them commented for future reference.

// ============================================================================
// FLAT RBAC PROCEDURES (domain prefix: rbac)
// ============================================================================

// Check permission for a user
export const rbacCheckPermission = protectedProcedure
  // .use(requirePermission("users.read"))
  .input(
    z.object({
      userId: z.string(),
      resource: z.string(),
      action: z.string(),
      scope: z.string().optional().default("global"),
      conditions: z.record(z.string(), z.any()).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const currentUser = context.user;

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
  });

// Get user permissions summary
export const rbacGetUserPermissions = protectedProcedure
  // .use(requirePermission("users.read"))
  .input(z.object({ userId: z.string() }))
  .handler(async ({ input, context }) => {
    const currentUser = context.user;

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

    const summary = await RbacService.getUserPermissionSummary(input.userId);

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
  });

// List all roles
export const rbacListRoles = protectedProcedure
  // .use(requirePermission("users.read"))
  .input(z.object({ includeInactive: z.boolean().optional().default(false) }))
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
  });

// Create a new role
export const rbacCreateRole = protectedProcedure
  // .use(requirePermission("users.manage_permissions"))
  .input(
    z.object({
      name: z.string(),
      displayName: z.string(),
      description: z.string().optional(),
      parentRoleId: z.string().optional(),
      level: z.string().optional(),
    })
  )
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
  });

// Assign role to user
export const rbacAssignRoleToUser = protectedProcedure
  // .use(requirePermission("users.manage_permissions"))
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
  });

// Remove role from user
export const rbacRemoveRoleFromUser = protectedProcedure
  // .use(requirePermission("users.manage_permissions"))
  .input(
    z.object({
      userId: z.string(),
      roleId: z.string(),
      reason: z.string().optional(),
    })
  )
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
  });

// List all permissions
export const rbacListPermissions = protectedProcedure
  // .use(requirePermission("users.read"))
  .input(z.object({ includeInactive: z.boolean().optional().default(false) }))
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
      (permission: { isActive: boolean }) =>
        input.includeInactive || permission.isActive
    );
  });

// Create a new permission
export const rbacCreatePermission = protectedProcedure
  // .use(requirePermission("users.manage_permissions"))
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
        .enum(["global", "department", "team", "personal", "client_specific"])
        .optional(),
      conditions: z.record(z.string(), z.any()).optional(),
      isSensitive: z.boolean().optional(),
    })
  )
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
  });

// Grant permission directly to user
export const rbacGrantPermissionToUser = protectedProcedure
  // .use(requirePermission("users.manage_permissions"))
  .input(
    z.object({
      userId: z.string(),
      permissionId: z.string(),
      reason: z.string(),
      validUntil: z.date().optional(),
      conditions: z.record(z.string(), z.any()).optional(),
      overridesRole: z.boolean().optional().default(false),
    })
  )
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
  });

// Deny permission to user
export const rbacDenyPermissionToUser = protectedProcedure
  // .use(requirePermission("users.manage_permissions"))
  .input(
    z.object({
      userId: z.string(),
      permissionId: z.string(),
      reason: z.string(),
      validUntil: z.date().optional(),
      conditions: z.record(z.string(), z.any()).optional(),
    })
  )
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
  });
