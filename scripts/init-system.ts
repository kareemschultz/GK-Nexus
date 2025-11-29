#!/usr/bin/env tsx

/**
 * GK-Nexus System Initialization Script
 *
 * This script initializes the GK-Nexus system with:
 * - Super admin user
 * - Default system roles
 * - Default permissions
 * - Initial system configuration
 */

import { hash } from "bcryptjs";
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";

// Import database connection and schemas
import { db } from "../packages/db/src/index";
import {
  permissionGroupMemberships,
  permissionGroups,
  permissions,
  roles,
  userRoles,
} from "../packages/db/src/schema/rbac";
import { users } from "../packages/db/src/schema/users";

// Environment variables
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "admin@gk-nexus.com";
const SUPER_ADMIN_PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD || "SuperSecure123!";
const SUPER_ADMIN_NAME = process.env.SUPER_ADMIN_NAME || "Super Administrator";

/**
 * Default system roles with descriptions
 */
const SYSTEM_ROLES = [
  {
    name: "super_admin",
    displayName: "Super Administrator",
    description: "Full system access with all permissions",
    level: "0",
    isSystemRole: true,
    isCustomRole: false,
  },
  {
    name: "admin",
    displayName: "Administrator",
    description: "Administrative access to most system features",
    level: "1",
    isSystemRole: true,
    isCustomRole: false,
  },
  {
    name: "manager",
    displayName: "Manager",
    description: "Management access to team and client operations",
    level: "2",
    isSystemRole: true,
    isCustomRole: false,
  },
  {
    name: "senior_accountant",
    displayName: "Senior Accountant",
    description: "Advanced accounting and tax preparation capabilities",
    level: "3",
    isSystemRole: true,
    isCustomRole: false,
  },
  {
    name: "accountant",
    displayName: "Accountant",
    description: "Standard accounting and tax preparation access",
    level: "4",
    isSystemRole: true,
    isCustomRole: false,
  },
  {
    name: "client_service",
    displayName: "Client Service Representative",
    description: "Client communication and basic document management",
    level: "5",
    isSystemRole: true,
    isCustomRole: false,
  },
  {
    name: "read_only",
    displayName: "Read Only",
    description: "View-only access to assigned client data",
    level: "6",
    isSystemRole: true,
    isCustomRole: false,
  },
] as const;

/**
 * Permission groups for organization
 */
const PERMISSION_GROUPS = [
  {
    name: "user_management",
    displayName: "User Management",
    description: "User and role management permissions",
    sortOrder: "1",
  },
  {
    name: "client_management",
    displayName: "Client Management",
    description: "Client data and relationship management",
    sortOrder: "2",
  },
  {
    name: "document_management",
    displayName: "Document Management",
    description: "Document creation, editing, and sharing",
    sortOrder: "3",
  },
  {
    name: "tax_calculations",
    displayName: "Tax Calculations",
    description: "Tax preparation and calculation tools",
    sortOrder: "4",
  },
  {
    name: "compliance_reporting",
    displayName: "Compliance & Reporting",
    description: "Regulatory compliance and reporting features",
    sortOrder: "5",
  },
  {
    name: "financial_management",
    displayName: "Financial Management",
    description: "Billing, payments, and financial tracking",
    sortOrder: "6",
  },
  {
    name: "system_administration",
    displayName: "System Administration",
    description: "System configuration and maintenance",
    sortOrder: "7",
  },
] as const;

/**
 * Default system permissions
 */
const SYSTEM_PERMISSIONS = [
  // User Management
  {
    name: "users.create",
    displayName: "Create Users",
    description: "Create new user accounts",
    resource: "users",
    action: "create",
    scope: "global",
    group: "user_management",
  },
  {
    name: "users.read",
    displayName: "View Users",
    description: "View user accounts and profiles",
    resource: "users",
    action: "read",
    scope: "global",
    group: "user_management",
  },
  {
    name: "users.update",
    displayName: "Update Users",
    description: "Edit user accounts and profiles",
    resource: "users",
    action: "update",
    scope: "global",
    group: "user_management",
  },
  {
    name: "users.delete",
    displayName: "Delete Users",
    description: "Delete user accounts",
    resource: "users",
    action: "delete",
    scope: "global",
    group: "user_management",
  },
  {
    name: "users.manage_permissions",
    displayName: "Manage User Permissions",
    description: "Assign roles and permissions to users",
    resource: "users",
    action: "manage_permissions",
    scope: "global",
    group: "user_management",
    isSensitive: true,
  },

  // Client Management
  {
    name: "clients.create",
    displayName: "Create Clients",
    description: "Add new client accounts",
    resource: "clients",
    action: "create",
    scope: "global",
    group: "client_management",
  },
  {
    name: "clients.read",
    displayName: "View Clients",
    description: "View client information and data",
    resource: "clients",
    action: "read",
    scope: "global",
    group: "client_management",
  },
  {
    name: "clients.update",
    displayName: "Update Clients",
    description: "Edit client information and settings",
    resource: "clients",
    action: "update",
    scope: "global",
    group: "client_management",
  },
  {
    name: "clients.delete",
    displayName: "Delete Clients",
    description: "Remove client accounts",
    resource: "clients",
    action: "delete",
    scope: "global",
    group: "client_management",
  },
  {
    name: "clients.view_sensitive",
    displayName: "View Sensitive Client Data",
    description: "Access sensitive client information",
    resource: "clients",
    action: "view_sensitive",
    scope: "global",
    group: "client_management",
    isSensitive: true,
  },

  // Document Management
  {
    name: "documents.create",
    displayName: "Create Documents",
    description: "Create and upload new documents",
    resource: "documents",
    action: "create",
    scope: "global",
    group: "document_management",
  },
  {
    name: "documents.read",
    displayName: "View Documents",
    description: "View and download documents",
    resource: "documents",
    action: "read",
    scope: "global",
    group: "document_management",
  },
  {
    name: "documents.update",
    displayName: "Update Documents",
    description: "Edit document content and metadata",
    resource: "documents",
    action: "update",
    scope: "global",
    group: "document_management",
  },
  {
    name: "documents.delete",
    displayName: "Delete Documents",
    description: "Remove documents from system",
    resource: "documents",
    action: "delete",
    scope: "global",
    group: "document_management",
  },
  {
    name: "documents.share",
    displayName: "Share Documents",
    description: "Share documents with clients and team members",
    resource: "documents",
    action: "share",
    scope: "global",
    group: "document_management",
  },
  {
    name: "documents.download",
    displayName: "Download Documents",
    description: "Download documents to local storage",
    resource: "documents",
    action: "download",
    scope: "global",
    group: "document_management",
  },

  // Tax Calculations
  {
    name: "tax_calculations.create",
    displayName: "Create Tax Calculations",
    description: "Perform tax calculations and estimates",
    resource: "tax_calculations",
    action: "create",
    scope: "global",
    group: "tax_calculations",
  },
  {
    name: "tax_calculations.read",
    displayName: "View Tax Calculations",
    description: "View tax calculation results and history",
    resource: "tax_calculations",
    action: "read",
    scope: "global",
    group: "tax_calculations",
  },
  {
    name: "tax_calculations.update",
    displayName: "Update Tax Calculations",
    description: "Modify tax calculations and parameters",
    resource: "tax_calculations",
    action: "update",
    scope: "global",
    group: "tax_calculations",
  },
  {
    name: "tax_calculations.approve",
    displayName: "Approve Tax Calculations",
    description: "Approve tax calculations for submission",
    resource: "tax_calculations",
    action: "approve",
    scope: "global",
    group: "tax_calculations",
  },

  // Compliance & Reporting
  {
    name: "compliance.create",
    displayName: "Create Compliance Reports",
    description: "Generate compliance reports and filings",
    resource: "compliance",
    action: "create",
    scope: "global",
    group: "compliance_reporting",
  },
  {
    name: "compliance.read",
    displayName: "View Compliance Data",
    description: "View compliance status and reports",
    resource: "compliance",
    action: "read",
    scope: "global",
    group: "compliance_reporting",
  },
  {
    name: "compliance.submit",
    displayName: "Submit Compliance Reports",
    description: "Submit compliance reports to authorities",
    resource: "compliance",
    action: "submit",
    scope: "global",
    group: "compliance_reporting",
    requiresApproval: true,
  },

  // Appointments & Scheduling
  {
    name: "appointments.create",
    displayName: "Create Appointments",
    description: "Schedule client appointments",
    resource: "appointments",
    action: "create",
    scope: "global",
    group: "client_management",
  },
  {
    name: "appointments.read",
    displayName: "View Appointments",
    description: "View appointment schedules",
    resource: "appointments",
    action: "read",
    scope: "global",
    group: "client_management",
  },
  {
    name: "appointments.update",
    displayName: "Update Appointments",
    description: "Modify appointment details",
    resource: "appointments",
    action: "update",
    scope: "global",
    group: "client_management",
  },
  {
    name: "appointments.cancel",
    displayName: "Cancel Appointments",
    description: "Cancel client appointments",
    resource: "appointments",
    action: "cancel",
    scope: "global",
    group: "client_management",
  },

  // Reports & Analytics
  {
    name: "reports.create",
    displayName: "Generate Reports",
    description: "Create business and financial reports",
    resource: "reports",
    action: "create",
    scope: "global",
    group: "compliance_reporting",
  },
  {
    name: "reports.read",
    displayName: "View Reports",
    description: "Access reports and analytics",
    resource: "reports",
    action: "read",
    scope: "global",
    group: "compliance_reporting",
  },
  {
    name: "reports.export",
    displayName: "Export Reports",
    description: "Export reports to external formats",
    resource: "reports",
    action: "export",
    scope: "global",
    group: "compliance_reporting",
  },

  // System Administration
  {
    name: "settings.read",
    displayName: "View System Settings",
    description: "View system configuration",
    resource: "settings",
    action: "read",
    scope: "global",
    group: "system_administration",
  },
  {
    name: "settings.update",
    displayName: "Update System Settings",
    description: "Modify system configuration",
    resource: "settings",
    action: "update",
    scope: "global",
    group: "system_administration",
    isSensitive: true,
  },
  {
    name: "audit_logs.read",
    displayName: "View Audit Logs",
    description: "Access system audit logs",
    resource: "audit_logs",
    action: "read",
    scope: "global",
    group: "system_administration",
    isSensitive: true,
  },
] as const;

/**
 * Role-Permission mappings
 */
const ROLE_PERMISSIONS = {
  super_admin: "ALL", // Super admin gets all permissions
  admin: [
    "users.create",
    "users.read",
    "users.update",
    "users.manage_permissions",
    "clients.create",
    "clients.read",
    "clients.update",
    "clients.view_sensitive",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.delete",
    "documents.share",
    "documents.download",
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.approve",
    "compliance.create",
    "compliance.read",
    "compliance.submit",
    "appointments.create",
    "appointments.read",
    "appointments.update",
    "appointments.cancel",
    "reports.create",
    "reports.read",
    "reports.export",
    "settings.read",
    "audit_logs.read",
  ],
  manager: [
    "users.read",
    "clients.create",
    "clients.read",
    "clients.update",
    "clients.view_sensitive",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.share",
    "documents.download",
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.approve",
    "compliance.create",
    "compliance.read",
    "appointments.create",
    "appointments.read",
    "appointments.update",
    "appointments.cancel",
    "reports.create",
    "reports.read",
    "reports.export",
  ],
  senior_accountant: [
    "clients.read",
    "clients.update",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.share",
    "documents.download",
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "tax_calculations.approve",
    "compliance.create",
    "compliance.read",
    "appointments.read",
    "appointments.update",
    "reports.create",
    "reports.read",
  ],
  accountant: [
    "clients.read",
    "clients.update",
    "documents.create",
    "documents.read",
    "documents.update",
    "documents.download",
    "tax_calculations.create",
    "tax_calculations.read",
    "tax_calculations.update",
    "compliance.read",
    "appointments.read",
    "reports.read",
  ],
  client_service: [
    "clients.read",
    "documents.read",
    "documents.download",
    "appointments.create",
    "appointments.read",
    "appointments.update",
  ],
  read_only: ["clients.read", "documents.read", "appointments.read"],
} as const;

async function initializeSystem() {
  console.log("🚀 Starting GK-Nexus system initialization...");

  try {
    // 1. Create permission groups
    console.log("📁 Creating permission groups...");
    const createdGroups = new Map();

    for (const group of PERMISSION_GROUPS) {
      const [existingGroup] = await db
        .select()
        .from(permissionGroups)
        .where(eq(permissionGroups.name, group.name))
        .limit(1);

      if (existingGroup) {
        createdGroups.set(group.name, existingGroup);
        console.log(
          `  ⏭️  Permission group already exists: ${group.displayName}`
        );
      } else {
        const [createdGroup] = await db
          .insert(permissionGroups)
          .values({
            id: generateId(),
            ...group,
            isSystemGroup: true,
          })
          .returning();
        createdGroups.set(group.name, createdGroup);
        console.log(`  ✅ Created permission group: ${group.displayName}`);
      }
    }

    // 2. Create system permissions
    console.log("🔐 Creating system permissions...");
    const createdPermissions = new Map();

    for (const permission of SYSTEM_PERMISSIONS) {
      const [existingPermission] = await db
        .select()
        .from(permissions)
        .where(eq(permissions.name, permission.name))
        .limit(1);

      if (existingPermission) {
        createdPermissions.set(permission.name, existingPermission);
        console.log(
          `  ⏭️  Permission already exists: ${permission.displayName}`
        );
      } else {
        const [createdPermission] = await db
          .insert(permissions)
          .values({
            id: generateId(),
            name: permission.name,
            displayName: permission.displayName,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            scope: permission.scope,
            isSystemPermission: true,
            isSensitive: permission.isSensitive,
            requiresApproval: permission.requiresApproval,
          })
          .returning();
        createdPermissions.set(permission.name, createdPermission);

        // Link permission to group
        if (permission.group && createdGroups.has(permission.group)) {
          await db.insert(permissionGroupMemberships).values({
            id: generateId(),
            permissionId: createdPermission.id,
            groupId: createdGroups.get(permission.group)!.id,
          });
        }

        console.log(`  ✅ Created permission: ${permission.displayName}`);
      }
    }

    // 3. Create system roles
    console.log("👥 Creating system roles...");
    const createdRoles = new Map();

    for (const role of SYSTEM_ROLES) {
      const [existingRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, role.name))
        .limit(1);

      if (existingRole) {
        createdRoles.set(role.name, existingRole);
        console.log(`  ⏭️  Role already exists: ${role.displayName}`);
      } else {
        const [createdRole] = await db
          .insert(roles)
          .values({
            id: generateId(),
            ...role,
          })
          .returning();
        createdRoles.set(role.name, createdRole);
        console.log(`  ✅ Created role: ${role.displayName}`);
      }
    }

    // 4. Assign permissions to roles
    console.log("🔗 Assigning permissions to roles...");

    for (const [roleName, rolePermissions] of Object.entries(
      ROLE_PERMISSIONS
    )) {
      const role = createdRoles.get(roleName);
      if (!role) continue;

      if (rolePermissions === "ALL") {
        // Super admin gets all permissions
        for (const [permissionName, permission] of createdPermissions) {
          const [existing] = await db
            .select()
            .from(rolePermissions)
            .where(
              and(
                eq(rolePermissions.roleId, role.id),
                eq(rolePermissions.permissionId, permission.id)
              )
            )
            .limit(1);

          if (!existing) {
            await db.insert(rolePermissions).values({
              id: generateId(),
              roleId: role.id,
              permissionId: permission.id,
              isGranted: true,
            });
          }
        }
        console.log(`  ✅ Assigned ALL permissions to: ${role.displayName}`);
      } else {
        // Assign specific permissions
        for (const permissionName of rolePermissions) {
          const permission = createdPermissions.get(permissionName);
          if (!permission) continue;

          const [existing] = await db
            .select()
            .from(rolePermissions)
            .where(
              and(
                eq(rolePermissions.roleId, role.id),
                eq(rolePermissions.permissionId, permission.id)
              )
            )
            .limit(1);

          if (!existing) {
            await db.insert(rolePermissions).values({
              id: generateId(),
              roleId: role.id,
              permissionId: permission.id,
              isGranted: true,
            });
          }
        }
        console.log(
          `  ✅ Assigned ${rolePermissions.length} permissions to: ${role.displayName}`
        );
      }
    }

    // 5. Create super admin user
    console.log("👤 Creating super admin user...");

    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, SUPER_ADMIN_EMAIL))
      .limit(1);

    if (existingAdmin) {
      console.log(`  ⏭️  Super admin already exists: ${SUPER_ADMIN_EMAIL}`);
    } else {
      const hashedPassword = await hash(SUPER_ADMIN_PASSWORD, 12);

      const [superAdmin] = await db
        .insert(users)
        .values({
          id: generateId(),
          name: SUPER_ADMIN_NAME,
          email: SUPER_ADMIN_EMAIL,
          emailVerified: true,
          role: "super_admin",
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Assign super admin role
      const superAdminRole = createdRoles.get("super_admin");
      if (superAdminRole) {
        await db.insert(userRoles).values({
          id: generateId(),
          userId: superAdmin.id,
          roleId: superAdminRole.id,
          assignedBy: superAdmin.id, // Self-assigned
          isActive: true,
          validFrom: new Date(),
        });
      }

      console.log(`  ✅ Created super admin user: ${SUPER_ADMIN_EMAIL}`);
      console.log(`  🔑 Super admin password: ${SUPER_ADMIN_PASSWORD}`);
      console.log("  ⚠️  Please change the default password after first login!");
    }

    console.log("✅ GK-Nexus system initialization completed successfully!");
    console.log("");
    console.log("📋 Next steps:");
    console.log("1. Copy .env.example to .env and configure your environment");
    console.log("2. Run database migrations: bun run db:push");
    console.log("3. Start the application: bun run dev");
    console.log(`4. Login with super admin credentials: ${SUPER_ADMIN_EMAIL}`);
    console.log("");
  } catch (error) {
    console.error("❌ System initialization failed:", error);
    process.exit(1);
  }
}

// Run initialization if called directly
if (import.meta.main) {
  initializeSystem()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

export { initializeSystem };
