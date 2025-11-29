import { ORPCError } from "@orpc/server";
import type { Role } from "../schemas";

export type Permission =
  | "users.create"
  | "users.read"
  | "users.update"
  | "users.delete"
  | "users.manage_permissions"
  | "clients.create"
  | "clients.read"
  | "clients.update"
  | "clients.delete"
  | "clients.assign"
  | "tax_calculations.create"
  | "tax_calculations.read"
  | "tax_calculations.update"
  | "tax_calculations.delete"
  | "tax_calculations.submit"
  | "compliance.create"
  | "compliance.read"
  | "compliance.update"
  | "compliance.delete"
  | "compliance.approve"
  | "documents.create"
  | "documents.read"
  | "documents.update"
  | "documents.delete"
  | "documents.share"
  | "documents.approve"
  | "dashboard.read"
  | "reports.read"
  | "reports.export"
  | "system.admin";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    "users.create",
    "users.read",
    "users.update",
    "users.delete",
    "users.manage_permissions",
    "clients.create",
    "clients.read",
    "clients.update",
    "clients.delete",
    "clients.assign",
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.delete",
    "tax_calculations.submit",
    "compliance.create",
    "compliance.read",
    "compliance.update",
    "compliance.delete",
    "compliance.approve",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.delete",
    "documents.share",
    "documents.approve",
    "dashboard.read",
    "reports.read",
    "reports.export",
    "system.admin",
  ],
  admin: [
    "users.create",
    "users.read",
    "users.update",
    "users.delete",
    "clients.create",
    "clients.read",
    "clients.update",
    "clients.delete",
    "clients.assign",
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.delete",
    "tax_calculations.submit",
    "compliance.create",
    "compliance.read",
    "compliance.update",
    "compliance.delete",
    "compliance.approve",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.delete",
    "documents.share",
    "documents.approve",
    "dashboard.read",
    "reports.read",
    "reports.export",
  ],
  manager: [
    "users.read",
    "clients.create",
    "clients.read",
    "clients.update",
    "clients.assign",
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.submit",
    "compliance.create",
    "compliance.read",
    "compliance.update",
    "compliance.approve",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.share",
    "documents.approve",
    "dashboard.read",
    "reports.read",
    "reports.export",
  ],
  accountant: [
    "clients.read",
    "clients.update",
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.submit",
    "compliance.create",
    "compliance.read",
    "compliance.update",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.share",
    "dashboard.read",
    "reports.read",
  ],
  client_service: [
    "clients.create",
    "clients.read",
    "clients.update",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.share",
    "dashboard.read",
  ],
  read_only: [
    "clients.read",
    "tax_calculations.read",
    "compliance.read",
    "documents.read",
    "dashboard.read",
    "reports.read",
  ],
};

export function hasPermission(
  userRole: Role,
  userPermissions: Permission[] | null,
  requiredPermission: Permission
): boolean {
  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  if (rolePermissions.includes(requiredPermission)) {
    return true;
  }

  // Check custom user permissions
  if (userPermissions?.includes(requiredPermission)) {
    return true;
  }

  return false;
}

export function requirePermission(permission: Permission) {
  return (context: { user?: { role: Role; permissions?: Permission[] } }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", "Authentication required");
    }

    const { role, permissions } = context.user;
    if (!hasPermission(role, permissions || null, permission)) {
      throw new ORPCError("FORBIDDEN", `Permission ${permission} is required`);
    }
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return (context: { user?: { role: Role; permissions?: Permission[] } }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", "Authentication required");
    }

    const { role, permissions: userPermissions } = context.user;
    const hasAnyPermission = permissions.some((permission) =>
      hasPermission(role, userPermissions || null, permission)
    );

    if (!hasAnyPermission) {
      throw new ORPCError(
        "FORBIDDEN",
        `One of the following permissions is required: ${permissions.join(", ")}`
      );
    }
  };
}

export function requireRole(requiredRole: Role) {
  return (context: { user?: { role: Role } }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", "Authentication required");
    }

    if (context.user.role !== requiredRole) {
      throw new ORPCError("FORBIDDEN", `Role ${requiredRole} is required`);
    }
  };
}

export function requireAnyRole(...roles: Role[]) {
  return (context: { user?: { role: Role } }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", "Authentication required");
    }

    if (!roles.includes(context.user.role)) {
      throw new ORPCError(
        "FORBIDDEN",
        `One of the following roles is required: ${roles.join(", ")}`
      );
    }
  };
}

export function canAccessClient(clientId: string) {
  return (context: { user?: { role: Role; assignedClients?: string[] } }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", "Authentication required");
    }

    const { role, assignedClients } = context.user;

    // Super admins and admins can access all clients
    if (role === "super_admin" || role === "admin") {
      return;
    }

    // Other users can only access their assigned clients
    if (!assignedClients?.includes(clientId)) {
      throw new ORPCError(
        "FORBIDDEN",
        "Access to this client is not permitted"
      );
    }
  };
}

// Utility function to get user permissions
export function getUserPermissions(
  role: Role,
  customPermissions?: Permission[]
): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return [...new Set([...rolePermissions, ...(customPermissions || [])])];
}

// Check if user can perform action on resource
export function canAccessResource(
  resource: "client" | "user" | "document" | "calculation",
  action: "create" | "read" | "update" | "delete",
  context: {
    user?: {
      id: string;
      role: Role;
      permissions?: Permission[];
      assignedClients?: string[];
    };
    resourceOwnerId?: string;
    clientId?: string;
  }
): boolean {
  if (!context.user) {
    return false;
  }

  const { role, permissions, assignedClients, id: userId } = context.user;
  const { resourceOwnerId, clientId } = context;

  // Super admins can do everything
  if (role === "super_admin") {
    return true;
  }

  // Check if user is accessing their own resource
  if (resourceOwnerId === userId) {
    return true;
  }

  // Check client access for client-related resources
  if (clientId && resource !== "user") {
    // Admins can access all clients
    if (role === "admin") {
      return true;
    }

    // Other users can only access assigned clients
    if (!assignedClients?.includes(clientId)) {
      return false;
    }
  }

  // Check permission-based access
  const permissionMap: Record<string, Permission> = {
    [`${resource}.${action}`]: `${resource}s.${action}` as Permission,
  };

  const requiredPermission = permissionMap[`${resource}.${action}`];
  if (requiredPermission) {
    return hasPermission(role, permissions || null, requiredPermission);
  }

  return false;
}
