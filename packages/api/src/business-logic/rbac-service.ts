import { db } from "@gknexus/db";
import {
  type Permission,
  permissions,
  type Role,
  rolePermissions,
  roles,
  type UserPermission,
  type UserRole,
  userPermissions,
  userRoles,
} from "@gknexus/db/schema/rbac";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";

// Types for permission checking
export interface PermissionContext {
  userId: string;
  resource: string;
  action: string;
  scope?: string;
  conditions?: Record<string, any>;
}

export interface PermissionResult {
  granted: boolean;
  reason?: string;
  source?: "role" | "direct" | "inherited" | "denied";
  conditions?: Record<string, any>;
}

export interface UserPermissionSummary {
  userId: string;
  roles: Role[];
  permissions: Permission[];
  effectivePermissions: {
    [key: string]: PermissionResult;
  };
}

export class RbacService {
  /**
   * Check if a user has a specific permission
   */
  static async checkPermission(
    context: PermissionContext
  ): Promise<PermissionResult> {
    const { userId, resource, action, scope = "global", conditions } = context;

    try {
      // Get user's direct permission overrides first (highest priority)
      const directPermission = await RbacService.getUserDirectPermission(
        userId,
        resource,
        action,
        scope
      );

      if (directPermission) {
        return {
          granted: directPermission.isGranted && !directPermission.isDenied,
          reason: directPermission.isDenied
            ? "Explicitly denied by direct permission"
            : "Granted by direct permission",
          source: "direct",
          conditions: directPermission.conditions
            ? JSON.parse(directPermission.conditions)
            : undefined,
        };
      }

      // Get permissions from roles (lower priority)
      const rolePermissions = await RbacService.getUserRolePermissions(
        userId,
        resource,
        action,
        scope
      );

      if (rolePermissions.length > 0) {
        // Check for any explicit denies first
        const explicitDeny = rolePermissions.find((rp) => rp.isDenied);
        if (explicitDeny) {
          return {
            granted: false,
            reason: "Explicitly denied by role permission",
            source: "role",
          };
        }

        // Check for grants
        const grantedPermission = rolePermissions.find((rp) => rp.isGranted);
        if (grantedPermission) {
          return {
            granted: true,
            reason: "Granted by role permission",
            source: "role",
            conditions: grantedPermission.conditions
              ? JSON.parse(grantedPermission.conditions)
              : undefined,
          };
        }
      }

      // Check inherited permissions from parent roles
      const inheritedPermissions = await RbacService.getInheritedPermissions(
        userId,
        resource,
        action,
        scope
      );
      if (inheritedPermissions.length > 0) {
        const grantedPermission = inheritedPermissions.find(
          (ip) => ip.isGranted && !ip.isDenied
        );
        if (grantedPermission) {
          return {
            granted: true,
            reason: "Granted by inherited role permission",
            source: "inherited",
            conditions: grantedPermission.conditions
              ? JSON.parse(grantedPermission.conditions)
              : undefined,
          };
        }
      }

      return {
        granted: false,
        reason: "No matching permissions found",
      };
    } catch (error) {
      console.error("Error checking permission:", error);
      return {
        granted: false,
        reason: "Error checking permission",
      };
    }
  }

  /**
   * Get user's direct permission override for a specific resource/action
   */
  private static async getUserDirectPermission(
    userId: string,
    resource: string,
    action: string,
    scope: string
  ) {
    const result = await db
      .select()
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(permissions.resource, resource as any),
          eq(permissions.action, action as any),
          eq(permissions.scope, scope as any),
          or(
            isNull(userPermissions.validUntil),
            desc(userPermissions.validUntil)
          )
        )
      )
      .limit(1);

    return result[0]?.user_permissions;
  }

  /**
   * Get permissions from user's active roles
   */
  private static async getUserRolePermissions(
    userId: string,
    resource: string,
    action: string,
    scope: string
  ) {
    const result = await db
      .select({
        rolePermission: rolePermissions,
        permission: permissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(roles.isActive, true),
          eq(permissions.resource, resource as any),
          eq(permissions.action, action as any),
          eq(permissions.scope, scope as any),
          or(isNull(userRoles.validUntil), desc(userRoles.validUntil))
        )
      );

    return result.map((r) => r.rolePermission);
  }

  /**
   * Get inherited permissions from parent roles
   */
  private static async getInheritedPermissions(
    userId: string,
    resource: string,
    action: string,
    scope: string
  ) {
    // This is a simplified implementation. In practice, you might want to
    // implement a recursive CTE query for deep role hierarchies
    const result = await db
      .select({
        rolePermission: rolePermissions,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .innerJoin(roles as any, eq(roles.parentRoleId, roles.id), "parentRoles")
      .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(roles.isActive, true),
          eq(permissions.resource, resource as any),
          eq(permissions.action, action as any),
          eq(permissions.scope, scope as any),
          eq(rolePermissions.isInherited, true)
        )
      );

    return result.map((r) => r.rolePermission);
  }

  /**
   * Get comprehensive permission summary for a user
   */
  static async getUserPermissionSummary(
    userId: string
  ): Promise<UserPermissionSummary> {
    // Get user's active roles
    const userRoleData = await db
      .select({
        role: roles,
        userRole: userRoles,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.isActive, true),
          eq(roles.isActive, true),
          or(isNull(userRoles.validUntil), desc(userRoles.validUntil))
        )
      );

    const userRoleList = userRoleData.map((ur) => ur.role);

    // Get all permissions from roles
    const rolePermissionData = await db
      .select({
        permission: permissions,
        rolePermission: rolePermissions,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(
        and(
          inArray(
            rolePermissions.roleId,
            userRoleList.map((r) => r.id)
          ),
          eq(permissions.isActive, true)
        )
      );

    // Get direct user permissions
    const directPermissionData = await db
      .select({
        permission: permissions,
        userPermission: userPermissions,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(permissions.isActive, true),
          or(
            isNull(userPermissions.validUntil),
            desc(userPermissions.validUntil)
          )
        )
      );

    // Build effective permissions map
    const effectivePermissions: { [key: string]: PermissionResult } = {};

    // Process role permissions first
    for (const { permission, rolePermission } of rolePermissionData) {
      const key = `${permission.resource}:${permission.action}:${permission.scope}`;

      if (!effectivePermissions[key]) {
        effectivePermissions[key] = {
          granted: rolePermission.isGranted && !rolePermission.isDenied,
          source: rolePermission.isInherited ? "inherited" : "role",
          conditions: rolePermission.conditions
            ? JSON.parse(rolePermission.conditions)
            : undefined,
        };
      }
    }

    // Override with direct permissions (highest priority)
    for (const { permission, userPermission } of directPermissionData) {
      const key = `${permission.resource}:${permission.action}:${permission.scope}`;

      effectivePermissions[key] = {
        granted: userPermission.isGranted && !userPermission.isDenied,
        source: "direct",
        conditions: userPermission.conditions
          ? JSON.parse(userPermission.conditions)
          : undefined,
      };
    }

    const allPermissions = [
      ...rolePermissionData.map((rp) => rp.permission),
      ...directPermissionData.map((dp) => dp.permission),
    ];

    // Remove duplicates
    const uniquePermissions = allPermissions.filter(
      (permission, index, self) =>
        index === self.findIndex((p) => p.id === permission.id)
    );

    return {
      userId,
      roles: userRoleList,
      permissions: uniquePermissions,
      effectivePermissions,
    };
  }

  /**
   * Assign role to user
   */
  static async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string,
    options: {
      isTemporary?: boolean;
      validUntil?: Date;
      reason?: string;
      requiresApproval?: boolean;
    } = {}
  ): Promise<UserRole> {
    const userRoleData = {
      id: crypto.randomUUID(),
      userId,
      roleId,
      assignedBy,
      assignmentReason: options.reason,
      isTemporary: options.isTemporary,
      validUntil: options.validUntil,
      approvalRequired: options.requiresApproval,
      isActive: !options.requiresApproval, // Active immediately unless approval required
    };

    const [newUserRole] = await db
      .insert(userRoles)
      .values(userRoleData)
      .returning();

    return newUserRole;
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(
    userId: string,
    roleId: string,
    removedBy: string,
    reason?: string
  ): Promise<boolean> {
    const result = await db
      .update(userRoles)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(userRoles.userId, userId),
          eq(userRoles.roleId, roleId),
          eq(userRoles.isActive, true)
        )
      );

    return true;
  }

  /**
   * Grant direct permission to user
   */
  static async grantDirectPermission(
    userId: string,
    permissionId: string,
    assignedBy: string,
    options: {
      reason: string;
      validUntil?: Date;
      conditions?: Record<string, any>;
      overridesRole?: boolean;
    }
  ): Promise<UserPermission> {
    const userPermissionData = {
      id: crypto.randomUUID(),
      userId,
      permissionId,
      assignedBy,
      reason: options.reason,
      isGranted: true,
      isDenied: false,
      overridesRole: options.overridesRole,
      validUntil: options.validUntil,
      conditions: options.conditions
        ? JSON.stringify(options.conditions)
        : null,
    };

    const [newUserPermission] = await db
      .insert(userPermissions)
      .values(userPermissionData)
      .returning();

    return newUserPermission;
  }

  /**
   * Deny direct permission to user
   */
  static async denyDirectPermission(
    userId: string,
    permissionId: string,
    assignedBy: string,
    options: {
      reason: string;
      validUntil?: Date;
      conditions?: Record<string, any>;
    }
  ): Promise<UserPermission> {
    const userPermissionData = {
      id: crypto.randomUUID(),
      userId,
      permissionId,
      assignedBy,
      reason: options.reason,
      isGranted: false,
      isDenied: true,
      overridesRole: true, // Denies always override role permissions
      validUntil: options.validUntil,
      conditions: options.conditions
        ? JSON.stringify(options.conditions)
        : null,
    };

    const [newUserPermission] = await db
      .insert(userPermissions)
      .values(userPermissionData)
      .returning();

    return newUserPermission;
  }

  /**
   * Get all active roles
   */
  static async getAllRoles(): Promise<Role[]> {
    return await db
      .select()
      .from(roles)
      .where(eq(roles.isActive, true))
      .orderBy(roles.level, roles.name);
  }

  /**
   * Get all active permissions grouped by resource
   */
  static async getAllPermissions(): Promise<Permission[]> {
    return await db
      .select()
      .from(permissions)
      .where(eq(permissions.isActive, true))
      .orderBy(permissions.resource, permissions.action);
  }

  /**
   * Create a new role
   */
  static async createRole(
    roleData: {
      name: string;
      displayName: string;
      description?: string;
      parentRoleId?: string;
      level?: string;
    },
    createdBy: string
  ): Promise<Role> {
    const newRoleData = {
      id: crypto.randomUUID(),
      ...roleData,
      level: roleData.level || "0",
      createdBy,
    };

    const [newRole] = await db.insert(roles).values(newRoleData).returning();

    return newRole;
  }

  /**
   * Create a new permission
   */
  static async createPermission(
    permissionData: {
      name: string;
      displayName: string;
      description?: string;
      resource: string;
      action: string;
      scope?: string;
      conditions?: Record<string, any>;
      isSensitive?: boolean;
    },
    createdBy: string
  ): Promise<Permission> {
    const newPermissionData = {
      id: crypto.randomUUID(),
      ...permissionData,
      scope: (permissionData.scope || "global") as any,
      resource: permissionData.resource as any,
      action: permissionData.action as any,
      conditions: permissionData.conditions
        ? JSON.stringify(permissionData.conditions)
        : null,
      isSensitive: permissionData.isSensitive,
      createdBy,
    };

    const [newPermission] = await db
      .insert(permissions)
      .values(newPermissionData)
      .returning();

    return newPermission;
  }
}
