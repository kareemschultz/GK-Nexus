import { z } from "zod";

// Enterprise Role-Based Access Control System
// Inspired by GK-Enterprise-Suite but adapted for GK-Nexus architecture

export const RoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "STAFF",
  "CLIENT",
  "DEPARTMENT_HEAD",
  "ANALYST",
  "VIEWER",
]);

export type Role = z.infer<typeof RoleSchema>;

export const PermissionSchema = z.enum([
  // Client permissions
  "clients:read",
  "clients:write",
  "clients:delete",
  "clients:export",
  "clients:manage",

  // User management permissions
  "users:read",
  "users:write",
  "users:delete",
  "users:manage_roles",
  "users:invite",

  // Document permissions
  "documents:read",
  "documents:write",
  "documents:delete",
  "documents:generate",
  "documents:download",

  // Financial permissions
  "financials:read",
  "financials:write",
  "financials:delete",
  "financials:audit",

  // System permissions
  "system:read",
  "system:admin",
  "system:audit",
  "system:settings",
  "system:monitor",

  // Reports permissions
  "reports:read",
  "reports:generate",
  "reports:export",
  "reports:schedule",

  // Analytics permissions
  "analytics:read",
  "analytics:advanced",

  // Workflow permissions
  "workflow:read",
  "workflow:write",
  "workflow:manage",

  // Compliance permissions
  "compliance:read",
  "compliance:write",
  "compliance:audit",
]);

export type Permission = z.infer<typeof PermissionSchema>;

// Enterprise Permission Matrix
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    // All permissions for super admin
    "clients:read",
    "clients:write",
    "clients:delete",
    "clients:export",
    "clients:manage",
    "users:read",
    "users:write",
    "users:delete",
    "users:manage_roles",
    "users:invite",
    "documents:read",
    "documents:write",
    "documents:delete",
    "documents:generate",
    "documents:download",
    "financials:read",
    "financials:write",
    "financials:delete",
    "financials:audit",
    "system:read",
    "system:admin",
    "system:audit",
    "system:settings",
    "system:monitor",
    "reports:read",
    "reports:generate",
    "reports:export",
    "reports:schedule",
    "analytics:read",
    "analytics:advanced",
    "workflow:read",
    "workflow:write",
    "workflow:manage",
    "compliance:read",
    "compliance:write",
    "compliance:audit",
  ],

  ADMIN: [
    "clients:read",
    "clients:write",
    "clients:delete",
    "clients:export",
    "clients:manage",
    "users:read",
    "users:write",
    "users:delete",
    "users:manage_roles",
    "users:invite",
    "documents:read",
    "documents:write",
    "documents:delete",
    "documents:generate",
    "documents:download",
    "financials:read",
    "financials:write",
    "financials:delete",
    "financials:audit",
    "system:read",
    "system:admin",
    "system:audit",
    "system:settings",
    "reports:read",
    "reports:generate",
    "reports:export",
    "reports:schedule",
    "analytics:read",
    "analytics:advanced",
    "workflow:read",
    "workflow:write",
    "workflow:manage",
    "compliance:read",
    "compliance:write",
    "compliance:audit",
  ],

  DEPARTMENT_HEAD: [
    "clients:read",
    "clients:write",
    "clients:export",
    "clients:manage",
    "users:read",
    "users:write",
    "users:invite",
    "documents:read",
    "documents:write",
    "documents:generate",
    "documents:download",
    "financials:read",
    "financials:write",
    "financials:audit",
    "system:read",
    "system:audit",
    "reports:read",
    "reports:generate",
    "reports:export",
    "reports:schedule",
    "analytics:read",
    "analytics:advanced",
    "workflow:read",
    "workflow:write",
    "workflow:manage",
    "compliance:read",
    "compliance:write",
  ],

  MANAGER: [
    "clients:read",
    "clients:write",
    "clients:export",
    "users:read",
    "users:write",
    "documents:read",
    "documents:write",
    "documents:generate",
    "documents:download",
    "financials:read",
    "financials:write",
    "system:read",
    "system:audit",
    "reports:read",
    "reports:generate",
    "reports:export",
    "analytics:read",
    "workflow:read",
    "workflow:write",
    "compliance:read",
    "compliance:write",
  ],

  STAFF: [
    "clients:read",
    "clients:write",
    "documents:read",
    "documents:write",
    "documents:generate",
    "documents:download",
    "financials:read",
    "financials:write",
    "system:read",
    "reports:read",
    "reports:generate",
    "analytics:read",
    "workflow:read",
    "workflow:write",
    "compliance:read",
  ],

  ANALYST: [
    "clients:read",
    "documents:read",
    "documents:download",
    "financials:read",
    "system:read",
    "reports:read",
    "reports:generate",
    "reports:export",
    "analytics:read",
    "analytics:advanced",
    "workflow:read",
    "compliance:read",
  ],

  VIEWER: [
    "clients:read",
    "documents:read",
    "financials:read",
    "system:read",
    "reports:read",
    "analytics:read",
    "workflow:read",
    "compliance:read",
  ],

  CLIENT: [
    "clients:read", // Can read own client data
    "documents:read",
    "documents:download", // Can read own documents
    "financials:read", // Can read own financial data
    "reports:read", // Can read own reports
    "workflow:read", // Can read own workflow status
  ],
};

// Core RBAC Functions
export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions.includes(permission);
}

export function hasAnyPermission(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

export function hasAllPermissions(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function checkPermission(
  userRole: Role,
  requiredPermission: Permission
): void {
  if (!hasPermission(userRole, requiredPermission)) {
    throw new Error(
      `Access denied. Required permission: ${requiredPermission}`
    );
  }
}

// Role Hierarchy for Enterprise
export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 90,
  DEPARTMENT_HEAD: 80,
  MANAGER: 70,
  ANALYST: 60,
  STAFF: 50,
  VIEWER: 40,
  CLIENT: 10,
};

export function isRoleHigherThan(role1: Role, role2: Role): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  return isRoleHigherThan(managerRole, targetRole);
}

// Permission Groups for UI
export const PERMISSION_GROUPS = {
  CLIENT_MANAGEMENT: [
    "clients:read",
    "clients:write",
    "clients:delete",
    "clients:export",
    "clients:manage",
  ],
  USER_MANAGEMENT: [
    "users:read",
    "users:write",
    "users:delete",
    "users:manage_roles",
    "users:invite",
  ],
  DOCUMENT_MANAGEMENT: [
    "documents:read",
    "documents:write",
    "documents:delete",
    "documents:generate",
    "documents:download",
  ],
  FINANCIAL_MANAGEMENT: [
    "financials:read",
    "financials:write",
    "financials:delete",
    "financials:audit",
  ],
  SYSTEM_ADMINISTRATION: [
    "system:read",
    "system:admin",
    "system:audit",
    "system:settings",
    "system:monitor",
  ],
  REPORTING_ANALYTICS: [
    "reports:read",
    "reports:generate",
    "reports:export",
    "reports:schedule",
    "analytics:read",
    "analytics:advanced",
  ],
  WORKFLOW_MANAGEMENT: ["workflow:read", "workflow:write", "workflow:manage"],
  COMPLIANCE: ["compliance:read", "compliance:write", "compliance:audit"],
} as const;

export function getPermissionGroup(
  permission: Permission
): keyof typeof PERMISSION_GROUPS | null {
  for (const [group, permissions] of Object.entries(PERMISSION_GROUPS)) {
    if (permissions.includes(permission)) {
      return group as keyof typeof PERMISSION_GROUPS;
    }
  }
  return null;
}

// Resource-based permissions for API endpoints
export const RESOURCE_PATTERNS = {
  CLIENTS: /^\/api\/clients/,
  USERS: /^\/api\/users/,
  DOCUMENTS: /^\/api\/documents/,
  FINANCIALS: /^\/api\/financials/,
  REPORTS: /^\/api\/reports/,
  DASHBOARD: /^\/api\/dashboard/,
  SYSTEM: /^\/api\/system/,
  WORKFLOW: /^\/api\/workflow/,
  COMPLIANCE: /^\/api\/compliance/,
  ANALYTICS: /^\/api\/analytics/,
} as const;

export function getRequiredPermissionForEndpoint(
  method: string,
  pathname: string
): Permission | null {
  const httpMethod = method.toUpperCase();

  // Clients endpoints
  if (RESOURCE_PATTERNS.CLIENTS.test(pathname)) {
    switch (httpMethod) {
      case "GET":
        return "clients:read";
      case "POST":
        return "clients:write";
      case "PUT":
        return "clients:write";
      case "PATCH":
        return "clients:write";
      case "DELETE":
        return "clients:delete";
    }
  }

  // Users endpoints
  if (RESOURCE_PATTERNS.USERS.test(pathname)) {
    switch (httpMethod) {
      case "GET":
        return "users:read";
      case "POST":
        return "users:write";
      case "PUT":
        return "users:write";
      case "PATCH":
        return "users:write";
      case "DELETE":
        return "users:delete";
    }
  }

  // Documents endpoints
  if (RESOURCE_PATTERNS.DOCUMENTS.test(pathname)) {
    switch (httpMethod) {
      case "GET":
        return "documents:read";
      case "POST":
        return "documents:write";
      case "PUT":
        return "documents:write";
      case "PATCH":
        return "documents:write";
      case "DELETE":
        return "documents:delete";
    }
  }

  // Financial endpoints
  if (RESOURCE_PATTERNS.FINANCIALS.test(pathname)) {
    switch (httpMethod) {
      case "GET":
        return "financials:read";
      case "POST":
        return "financials:write";
      case "PUT":
        return "financials:write";
      case "PATCH":
        return "financials:write";
      case "DELETE":
        return "financials:delete";
    }
  }

  // Reports endpoints
  if (RESOURCE_PATTERNS.REPORTS.test(pathname)) {
    switch (httpMethod) {
      case "GET":
        return "reports:read";
      case "POST":
        return "reports:generate";
    }
  }

  // Analytics endpoints
  if (RESOURCE_PATTERNS.ANALYTICS.test(pathname)) {
    return "analytics:read";
  }

  // Workflow endpoints
  if (RESOURCE_PATTERNS.WORKFLOW.test(pathname)) {
    switch (httpMethod) {
      case "GET":
        return "workflow:read";
      case "POST":
        return "workflow:write";
      case "PUT":
        return "workflow:write";
      case "PATCH":
        return "workflow:write";
      case "DELETE":
        return "workflow:manage";
    }
  }

  // Compliance endpoints
  if (RESOURCE_PATTERNS.COMPLIANCE.test(pathname)) {
    switch (httpMethod) {
      case "GET":
        return "compliance:read";
      case "POST":
        return "compliance:write";
      case "PUT":
        return "compliance:write";
      case "PATCH":
        return "compliance:write";
    }
  }

  // Dashboard endpoints
  if (RESOURCE_PATTERNS.DASHBOARD.test(pathname)) {
    return "system:read";
  }

  // System endpoints
  if (RESOURCE_PATTERNS.SYSTEM.test(pathname)) {
    return "system:admin";
  }

  return null;
}

// Authorization decorator for API methods
export function authorize(requiredPermission: Permission) {
  return (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) => {
    const method = descriptor.value;

    descriptor.value = function (this: any, ...args: any[]) {
      const userRole = this.user?.role as Role;
      if (!userRole) {
        throw new Error("Authentication required");
      }

      checkPermission(userRole, requiredPermission);
      return method.apply(this, args);
    };
  };
}

// Enterprise-grade role utilities
export function getRoleDisplayName(role: Role): string {
  const roleNames: Record<Role, string> = {
    SUPER_ADMIN: "Super Administrator",
    ADMIN: "Administrator",
    DEPARTMENT_HEAD: "Department Head",
    MANAGER: "Manager",
    STAFF: "Staff Member",
    ANALYST: "Business Analyst",
    VIEWER: "Viewer",
    CLIENT: "Client",
  };
  return roleNames[role];
}

export function getRoleDescription(role: Role): string {
  const descriptions: Record<Role, string> = {
    SUPER_ADMIN: "Full system access with all administrative privileges",
    ADMIN: "Administrative access to most system functions",
    DEPARTMENT_HEAD: "Departmental management with team oversight",
    MANAGER: "Team management with operational control",
    STAFF: "Day-to-day operations and client management",
    ANALYST: "Data analysis and reporting capabilities",
    VIEWER: "Read-only access to assigned areas",
    CLIENT: "Access to personal account and documents",
  };
  return descriptions[role];
}
