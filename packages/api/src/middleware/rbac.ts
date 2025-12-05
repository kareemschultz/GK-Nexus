import { ORPCError } from "@orpc/server";
import type { Role } from "../schemas";

export type Permission =
  // User management
  | "users.create"
  | "users.read"
  | "users.update"
  | "users.delete"
  | "users.manage_permissions"
  // Client management
  | "clients.create"
  | "clients.read"
  | "clients.update"
  | "clients.delete"
  | "clients.assign"
  // Tax calculations
  | "tax_calculations.create"
  | "tax_calculations.read"
  | "tax_calculations.update"
  | "tax_calculations.delete"
  | "tax_calculations.submit"
  // Compliance
  | "compliance.create"
  | "compliance.read"
  | "compliance.update"
  | "compliance.delete"
  | "compliance.approve"
  // Documents
  | "documents.create"
  | "documents.read"
  | "documents.update"
  | "documents.delete"
  | "documents.share"
  | "documents.approve"
  // Service Catalog - Services
  | "services.create"
  | "services.read"
  | "services.update"
  | "services.delete"
  // Service Catalog - Projects
  | "projects.create"
  | "projects.read"
  | "projects.update"
  | "projects.delete"
  // Service Catalog - Milestones
  | "milestones.create"
  | "milestones.read"
  | "milestones.update"
  | "milestones.delete"
  // Service Catalog - Time Entries
  | "timeEntries.create"
  | "timeEntries.read"
  | "timeEntries.update"
  | "timeEntries.delete"
  // Service Catalog - Packages
  | "packages.create"
  | "packages.read"
  | "packages.update"
  | "packages.delete"
  // Service Catalog - Templates
  | "templates.create"
  | "templates.read"
  | "templates.update"
  | "templates.delete"
  // Service Catalog - Communications
  | "communications.create"
  | "communications.read"
  | "communications.update"
  | "communications.delete"
  // Invoices
  | "invoices.create"
  | "invoices.read"
  | "invoices.update"
  | "invoices.delete"
  // Billing
  | "billing.create"
  | "billing.read"
  | "billing.update"
  | "billing.delete"
  // Dashboard & Reports
  | "dashboard.read"
  | "reports.read"
  | "reports.export"
  // System
  | "system.admin"
  // Immigration
  | "immigration.create"
  | "immigration.read"
  | "immigration.update"
  | "immigration.delete"
  // Expediting
  | "expediting.create"
  | "expediting.read"
  | "expediting.update"
  | "expediting.delete"
  // Property Management
  | "propertyManagement.create"
  | "propertyManagement.read"
  | "propertyManagement.update"
  | "propertyManagement.delete"
  // Training
  | "training.create"
  | "training.read"
  | "training.update"
  | "training.delete"
  // Local Content
  | "localContent.create"
  | "localContent.read"
  | "localContent.update"
  | "localContent.delete"
  // Partner Network
  | "partnerNetwork.create"
  | "partnerNetwork.read"
  | "partnerNetwork.update"
  | "partnerNetwork.delete"
  // Payroll
  | "payroll.create"
  | "payroll.read"
  | "payroll.update"
  | "payroll.delete"
  // Appointments
  | "appointments.create"
  | "appointments.read"
  | "appointments.update"
  | "appointments.delete"
  // AI
  | "ai.document.classify"
  | "ai.tax.validate"
  | "ai.risk.assess"
  | "ai.client.insights"
  | "ai.compliance.monitor"
  | "ai.gra.validate"
  | "ai.gra.submit"
  | "ai.analytics.tax"
  | "ai.analytics.clients"
  | "ai.analytics.executive"
  | "ai.analytics.metrics"
  | "ai.orchestration.execute"
  | "ai.orchestration.documents"
  | "ai.orchestration.filing"
  | "ai.orchestration.insights"
  | "ai.orchestration.models"
  | "ai.system.monitor"
  | "ai.system.metrics"
  // Audit
  | "audit.create"
  | "audit.read"
  | "audit.export"
  | "audit.archive"
  // Agreements
  | "agreements.create"
  | "agreements.read"
  | "agreements.update"
  | "agreements.delete"
  // Partners (alternative naming)
  | "partners.create"
  | "partners.read"
  | "partners.update"
  | "partners.delete"
  // Referrals
  | "referrals.create"
  | "referrals.read"
  | "referrals.update"
  | "referrals.delete"
  // Reviews
  | "reviews.create"
  | "reviews.read"
  | "reviews.update"
  | "reviews.delete"
  // Local Content (alternative naming)
  | "localcontent.create"
  | "localcontent.read"
  | "localcontent.update"
  // Additional tax/payroll
  | "taxes.read"
  | "taxes.calculate"
  | "taxes.file"
  | "payroll.calculate"
  // Reports
  | "reports.create"
  // Settings
  | "settings.read";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: [
    // User management
    "users.create",
    "users.read",
    "users.update",
    "users.delete",
    "users.manage_permissions",
    // Client management
    "clients.create",
    "clients.read",
    "clients.update",
    "clients.delete",
    "clients.assign",
    // Tax calculations
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.delete",
    "tax_calculations.submit",
    // Compliance
    "compliance.create",
    "compliance.read",
    "compliance.update",
    "compliance.delete",
    "compliance.approve",
    // Documents
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.delete",
    "documents.share",
    "documents.approve",
    // Service Catalog - Full access
    "services.create",
    "services.read",
    "services.update",
    "services.delete",
    "projects.create",
    "projects.read",
    "projects.update",
    "projects.delete",
    "milestones.create",
    "milestones.read",
    "milestones.update",
    "milestones.delete",
    "timeEntries.create",
    "timeEntries.read",
    "timeEntries.update",
    "timeEntries.delete",
    "packages.create",
    "packages.read",
    "packages.update",
    "packages.delete",
    "templates.create",
    "templates.read",
    "templates.update",
    "templates.delete",
    "communications.create",
    "communications.read",
    "communications.update",
    "communications.delete",
    // Invoices & Billing
    "invoices.create",
    "invoices.read",
    "invoices.update",
    "invoices.delete",
    "billing.create",
    "billing.read",
    "billing.update",
    "billing.delete",
    // Dashboard & Reports
    "dashboard.read",
    "reports.read",
    "reports.export",
    // System
    "system.admin",
    // Immigration
    "immigration.create",
    "immigration.read",
    "immigration.update",
    "immigration.delete",
    // Expediting
    "expediting.create",
    "expediting.read",
    "expediting.update",
    "expediting.delete",
    // Property Management
    "propertyManagement.create",
    "propertyManagement.read",
    "propertyManagement.update",
    "propertyManagement.delete",
    // Training
    "training.create",
    "training.read",
    "training.update",
    "training.delete",
    // Local Content
    "localContent.create",
    "localContent.read",
    "localContent.update",
    "localContent.delete",
    // Partner Network
    "partnerNetwork.create",
    "partnerNetwork.read",
    "partnerNetwork.update",
    "partnerNetwork.delete",
    // Payroll
    "payroll.create",
    "payroll.read",
    "payroll.update",
    "payroll.delete",
    // Appointments
    "appointments.create",
    "appointments.read",
    "appointments.update",
    "appointments.delete",
  ],
  admin: [
    // User management
    "users.create",
    "users.read",
    "users.update",
    "users.delete",
    // Client management
    "clients.create",
    "clients.read",
    "clients.update",
    "clients.delete",
    "clients.assign",
    // Tax calculations
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.delete",
    "tax_calculations.submit",
    // Compliance
    "compliance.create",
    "compliance.read",
    "compliance.update",
    "compliance.delete",
    "compliance.approve",
    // Documents
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.delete",
    "documents.share",
    "documents.approve",
    // Service Catalog - Full access
    "services.create",
    "services.read",
    "services.update",
    "services.delete",
    "projects.create",
    "projects.read",
    "projects.update",
    "projects.delete",
    "milestones.create",
    "milestones.read",
    "milestones.update",
    "milestones.delete",
    "timeEntries.create",
    "timeEntries.read",
    "timeEntries.update",
    "timeEntries.delete",
    "packages.create",
    "packages.read",
    "packages.update",
    "packages.delete",
    "templates.create",
    "templates.read",
    "templates.update",
    "templates.delete",
    "communications.create",
    "communications.read",
    "communications.update",
    "communications.delete",
    // Invoices & Billing
    "invoices.create",
    "invoices.read",
    "invoices.update",
    "invoices.delete",
    "billing.create",
    "billing.read",
    "billing.update",
    "billing.delete",
    // Dashboard & Reports
    "dashboard.read",
    "reports.read",
    "reports.export",
    // Immigration
    "immigration.create",
    "immigration.read",
    "immigration.update",
    "immigration.delete",
    // Expediting
    "expediting.create",
    "expediting.read",
    "expediting.update",
    "expediting.delete",
    // Property Management
    "propertyManagement.create",
    "propertyManagement.read",
    "propertyManagement.update",
    "propertyManagement.delete",
    // Training
    "training.create",
    "training.read",
    "training.update",
    "training.delete",
    // Local Content
    "localContent.create",
    "localContent.read",
    "localContent.update",
    "localContent.delete",
    // Partner Network
    "partnerNetwork.create",
    "partnerNetwork.read",
    "partnerNetwork.update",
    "partnerNetwork.delete",
    // Payroll
    "payroll.create",
    "payroll.read",
    "payroll.update",
    "payroll.delete",
    // Appointments
    "appointments.create",
    "appointments.read",
    "appointments.update",
    "appointments.delete",
  ],
  manager: [
    // User management
    "users.read",
    // Client management
    "clients.create",
    "clients.read",
    "clients.update",
    "clients.assign",
    // Tax calculations
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.submit",
    // Compliance
    "compliance.create",
    "compliance.read",
    "compliance.update",
    "compliance.approve",
    // Documents
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.share",
    "documents.approve",
    // Service Catalog - Full access (managers need full service access)
    "services.create",
    "services.read",
    "services.update",
    "services.delete",
    "projects.create",
    "projects.read",
    "projects.update",
    "projects.delete",
    "milestones.create",
    "milestones.read",
    "milestones.update",
    "milestones.delete",
    "timeEntries.create",
    "timeEntries.read",
    "timeEntries.update",
    "timeEntries.delete",
    "packages.create",
    "packages.read",
    "packages.update",
    "packages.delete",
    "templates.create",
    "templates.read",
    "templates.update",
    "templates.delete",
    "communications.create",
    "communications.read",
    "communications.update",
    "communications.delete",
    // Invoices & Billing
    "invoices.create",
    "invoices.read",
    "invoices.update",
    "billing.read",
    "billing.create",
    // Dashboard & Reports
    "dashboard.read",
    "reports.read",
    "reports.export",
    // Immigration
    "immigration.create",
    "immigration.read",
    "immigration.update",
    "immigration.delete",
    // Expediting
    "expediting.create",
    "expediting.read",
    "expediting.update",
    "expediting.delete",
    // Property Management
    "propertyManagement.create",
    "propertyManagement.read",
    "propertyManagement.update",
    "propertyManagement.delete",
    // Training
    "training.create",
    "training.read",
    "training.update",
    "training.delete",
    // Local Content
    "localContent.create",
    "localContent.read",
    "localContent.update",
    "localContent.delete",
    // Partner Network
    "partnerNetwork.create",
    "partnerNetwork.read",
    "partnerNetwork.update",
    "partnerNetwork.delete",
    // Payroll
    "payroll.create",
    "payroll.read",
    "payroll.update",
    "payroll.delete",
    // Appointments
    "appointments.create",
    "appointments.read",
    "appointments.update",
    "appointments.delete",
  ],
  accountant: [
    // Client management
    "clients.read",
    "clients.update",
    // Tax calculations
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.submit",
    // Compliance
    "compliance.create",
    "compliance.read",
    "compliance.update",
    // Documents
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.share",
    // Service Catalog - Read + create for work tracking
    "services.read",
    "projects.read",
    "projects.update",
    "milestones.read",
    "milestones.update",
    "timeEntries.create",
    "timeEntries.read",
    "timeEntries.update",
    "packages.read",
    "templates.read",
    "communications.create",
    "communications.read",
    // Invoices & Billing
    "invoices.create",
    "invoices.read",
    "invoices.update",
    "billing.read",
    // Dashboard & Reports
    "dashboard.read",
    "reports.read",
    // Immigration
    "immigration.read",
    // Expediting
    "expediting.read",
    // Property Management
    "propertyManagement.read",
    // Training
    "training.read",
    // Local Content
    "localContent.read",
    // Partner Network
    "partnerNetwork.read",
    // Payroll
    "payroll.read",
    "payroll.create",
    "payroll.update",
    // Appointments
    "appointments.read",
    "appointments.create",
    "appointments.update",
  ],
  client_service: [
    // Client management
    "clients.create",
    "clients.read",
    "clients.update",
    // Documents
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.share",
    // Service Catalog - Read access + communications
    "services.read",
    "projects.read",
    "milestones.read",
    "packages.read",
    "templates.read",
    "communications.create",
    "communications.read",
    // Invoices - Read only
    "invoices.read",
    "billing.read",
    // Dashboard
    "dashboard.read",
    // Immigration
    "immigration.read",
    // Expediting
    "expediting.read",
    // Property Management
    "propertyManagement.read",
    // Training
    "training.read",
    // Local Content
    "localContent.read",
    // Partner Network
    "partnerNetwork.read",
    // Payroll
    "payroll.read",
    // Appointments
    "appointments.read",
    "appointments.create",
  ],
  read_only: [
    // Client management
    "clients.read",
    // Tax calculations
    "tax_calculations.read",
    // Compliance
    "compliance.read",
    // Documents
    "documents.read",
    // Service Catalog - Read only
    "services.read",
    "projects.read",
    "milestones.read",
    "timeEntries.read",
    "packages.read",
    "templates.read",
    "communications.read",
    // Invoices - Read only
    "invoices.read",
    "billing.read",
    // Dashboard & Reports
    "dashboard.read",
    "reports.read",
    // Immigration
    "immigration.read",
    // Expediting
    "expediting.read",
    // Property Management
    "propertyManagement.read",
    // Training
    "training.read",
    // Local Content
    "localContent.read",
    // Partner Network
    "partnerNetwork.read",
    // Payroll
    "payroll.read",
    // Appointments
    "appointments.read",
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
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }

    const { role, permissions } = context.user;
    if (!hasPermission(role, permissions || null, permission)) {
      throw new ORPCError("FORBIDDEN", {
        message: `Permission ${permission} is required`,
      });
    }
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return (context: { user?: { role: Role; permissions?: Permission[] } }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }

    const { role, permissions: userPermissions } = context.user;
    const hasAnyPermission = permissions.some((permission) =>
      hasPermission(role, userPermissions || null, permission)
    );

    if (!hasAnyPermission) {
      throw new ORPCError("FORBIDDEN", {
        message: `One of the following permissions is required: ${permissions.join(", ")}`,
      });
    }
  };
}

export function requireRole(requiredRole: Role) {
  return (context: { user?: { role: Role } }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }

    if (context.user.role !== requiredRole) {
      throw new ORPCError("FORBIDDEN", {
        message: `Role ${requiredRole} is required`,
      });
    }
  };
}

export function requireAnyRole(...roles: Role[]) {
  return (context: { user?: { role: Role } }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }

    if (!roles.includes(context.user.role)) {
      throw new ORPCError("FORBIDDEN", {
        message: `One of the following roles is required: ${roles.join(", ")}`,
      });
    }
  };
}

export function canAccessClient(clientId: string) {
  return (context: { user?: { role: Role; assignedClients?: string[] } }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }

    const { role, assignedClients } = context.user;

    // Super admins and admins can access all clients
    if (role === "super_admin" || role === "admin") {
      return;
    }

    // Other users can only access their assigned clients
    if (!assignedClients?.includes(clientId)) {
      throw new ORPCError("FORBIDDEN", {
        message: "Access to this client is not permitted",
      });
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
