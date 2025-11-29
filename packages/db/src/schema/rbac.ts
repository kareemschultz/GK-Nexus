import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// Enums for permissions and scopes
export const permissionScopeEnum = pgEnum("permission_scope", [
  "global",
  "department",
  "team",
  "personal",
  "client_specific",
]);

export const resourceTypeEnum = pgEnum("resource_type", [
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
]);

export const actionTypeEnum = pgEnum("action_type", [
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
]);

// Roles table with hierarchical structure
export const roles = pgTable(
  "roles",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
    description: text("description"),

    // Hierarchy and inheritance
    parentRoleId: text("parent_role_id").references(() => roles.id),
    level: text("level").notNull().default("0"), // For role hierarchy ordering
    isSystemRole: boolean("is_system_role").default(false).notNull(),
    isCustomRole: boolean("is_custom_role").default(true).notNull(),

    // Status and metadata
    isActive: boolean("is_active").default(true).notNull(),
    isTemplate: boolean("is_template").default(false).notNull(),
    maxUsers: text("max_users"), // Maximum users that can have this role

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),
  },
  (table) => [
    index("roles_name_idx").on(table.name),
    index("roles_parent_role_id_idx").on(table.parentRoleId),
    index("roles_is_active_idx").on(table.isActive),
    index("roles_is_system_role_idx").on(table.isSystemRole),
    index("roles_level_idx").on(table.level),
  ]
);

// Permissions table for granular access control
export const permissions = pgTable(
  "permissions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
    description: text("description"),

    // Permission classification
    resource: resourceTypeEnum("resource").notNull(),
    action: actionTypeEnum("action").notNull(),
    scope: permissionScopeEnum("scope").default("global").notNull(),

    // Permission metadata
    isSystemPermission: boolean("is_system_permission")
      .default(false)
      .notNull(),
    requiresApproval: boolean("requires_approval").default(false).notNull(),
    isSensitive: boolean("is_sensitive").default(false).notNull(),

    // Conditions and constraints
    conditions: text("conditions"), // JSON object with permission conditions
    constraints: text("constraints"), // JSON object with permission constraints

    // Status
    isActive: boolean("is_active").default(true).notNull(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("permissions_name_idx").on(table.name),
    index("permissions_resource_idx").on(table.resource),
    index("permissions_action_idx").on(table.action),
    index("permissions_scope_idx").on(table.scope),
    index("permissions_is_active_idx").on(table.isActive),
    index("permissions_is_sensitive_idx").on(table.isSensitive),
    unique("permissions_resource_action_scope_unique").on(
      table.resource,
      table.action,
      table.scope
    ),
  ]
);

// Role-Permission relationships
export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: text("id").primaryKey(),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    // Permission modifiers
    isGranted: boolean("is_granted").default(true).notNull(),
    isInherited: boolean("is_inherited").default(false).notNull(),
    isDenied: boolean("is_denied").default(false).notNull(), // Explicit deny

    // Conditions and constraints specific to this role-permission
    conditions: text("conditions"), // JSON object with specific conditions
    constraints: text("constraints"), // JSON object with specific constraints

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("role_permissions_role_id_idx").on(table.roleId),
    index("role_permissions_permission_id_idx").on(table.permissionId),
    index("role_permissions_is_granted_idx").on(table.isGranted),
    index("role_permissions_is_inherited_idx").on(table.isInherited),
    unique("role_permissions_role_permission_unique").on(
      table.roleId,
      table.permissionId
    ),
  ]
);

// User-Role relationships
export const userRoles = pgTable(
  "user_roles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),

    // Assignment metadata
    isActive: boolean("is_active").default(true).notNull(),
    isTemporary: boolean("is_temporary").default(false).notNull(),

    // Temporal assignment
    validFrom: timestamp("valid_from").defaultNow().notNull(),
    validUntil: timestamp("valid_until"), // For temporary assignments

    // Assignment context
    assignedBy: text("assigned_by")
      .notNull()
      .references(() => users.id),
    assignmentReason: text("assignment_reason"),

    // Approval workflow
    approvedBy: text("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),
    approvalRequired: boolean("approval_required").default(false).notNull(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_roles_user_id_idx").on(table.userId),
    index("user_roles_role_id_idx").on(table.roleId),
    index("user_roles_is_active_idx").on(table.isActive),
    index("user_roles_valid_from_idx").on(table.validFrom),
    index("user_roles_valid_until_idx").on(table.validUntil),
    index("user_roles_assigned_by_idx").on(table.assignedBy),
    unique("user_roles_user_role_unique").on(table.userId, table.roleId),
  ]
);

// User-specific permission overrides
export const userPermissions = pgTable(
  "user_permissions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),

    // Permission override type
    isGranted: boolean("is_granted").default(true).notNull(),
    isDenied: boolean("is_denied").default(false).notNull(), // Explicit deny
    overridesRole: boolean("overrides_role").default(false).notNull(),

    // Override metadata
    reason: text("reason").notNull(),
    conditions: text("conditions"), // JSON object with specific conditions
    constraints: text("constraints"), // JSON object with specific constraints

    // Temporal override
    validFrom: timestamp("valid_from").defaultNow().notNull(),
    validUntil: timestamp("valid_until"), // For temporary overrides

    // Approval workflow
    assignedBy: text("assigned_by")
      .notNull()
      .references(() => users.id),
    approvedBy: text("approved_by").references(() => users.id),
    approvedAt: timestamp("approved_at"),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("user_permissions_user_id_idx").on(table.userId),
    index("user_permissions_permission_id_idx").on(table.permissionId),
    index("user_permissions_is_granted_idx").on(table.isGranted),
    index("user_permissions_is_denied_idx").on(table.isDenied),
    index("user_permissions_valid_from_idx").on(table.validFrom),
    index("user_permissions_valid_until_idx").on(table.validUntil),
    index("user_permissions_assigned_by_idx").on(table.assignedBy),
    unique("user_permissions_user_permission_unique").on(
      table.userId,
      table.permissionId
    ),
  ]
);

// Permission groups for organizing permissions
export const permissionGroups = pgTable(
  "permission_groups",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    displayName: text("display_name").notNull(),
    description: text("description"),

    // Group metadata
    isSystemGroup: boolean("is_system_group").default(false).notNull(),
    sortOrder: text("sort_order").default("0").notNull(),

    // Status
    isActive: boolean("is_active").default(true).notNull(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("permission_groups_name_idx").on(table.name),
    index("permission_groups_is_active_idx").on(table.isActive),
    index("permission_groups_sort_order_idx").on(table.sortOrder),
  ]
);

// Permission-Group relationships
export const permissionGroupMemberships = pgTable(
  "permission_group_memberships",
  {
    id: text("id").primaryKey(),
    permissionId: text("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    groupId: text("group_id")
      .notNull()
      .references(() => permissionGroups.id, { onDelete: "cascade" }),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("permission_group_memberships_permission_id_idx").on(
      table.permissionId
    ),
    index("permission_group_memberships_group_id_idx").on(table.groupId),
    unique("permission_group_memberships_permission_group_unique").on(
      table.permissionId,
      table.groupId
    ),
  ]
);

// Relations
export const rolesRelations = relations(roles, ({ one, many }) => ({
  parentRole: one(roles, {
    fields: [roles.parentRoleId],
    references: [roles.id],
    relationName: "parentRole",
  }),
  childRoles: many(roles, {
    relationName: "parentRole",
  }),
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
  createdByUser: one(users, {
    fields: [roles.createdBy],
    references: [users.id],
    relationName: "roleCreatedBy",
  }),
  updatedByUser: one(users, {
    fields: [roles.updatedBy],
    references: [users.id],
    relationName: "roleUpdatedBy",
  }),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissions: many(userPermissions),
  permissionGroupMemberships: many(permissionGroupMemberships),
  createdByUser: one(users, {
    fields: [permissions.createdBy],
    references: [users.id],
    relationName: "permissionCreatedBy",
  }),
}));

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
    createdByUser: one(users, {
      fields: [rolePermissions.createdBy],
      references: [users.id],
    }),
  })
);

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
    relationName: "userRoleAssignedBy",
  }),
  approvedByUser: one(users, {
    fields: [userRoles.approvedBy],
    references: [users.id],
    relationName: "userRoleApprovedBy",
  }),
}));

export const userPermissionsRelations = relations(
  userPermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [userPermissions.userId],
      references: [users.id],
    }),
    permission: one(permissions, {
      fields: [userPermissions.permissionId],
      references: [permissions.id],
    }),
    assignedByUser: one(users, {
      fields: [userPermissions.assignedBy],
      references: [users.id],
      relationName: "userPermissionAssignedBy",
    }),
    approvedByUser: one(users, {
      fields: [userPermissions.approvedBy],
      references: [users.id],
      relationName: "userPermissionApprovedBy",
    }),
  })
);

export const permissionGroupsRelations = relations(
  permissionGroups,
  ({ one, many }) => ({
    permissionGroupMemberships: many(permissionGroupMemberships),
    createdByUser: one(users, {
      fields: [permissionGroups.createdBy],
      references: [users.id],
    }),
  })
);

export const permissionGroupMembershipsRelations = relations(
  permissionGroupMemberships,
  ({ one }) => ({
    permission: one(permissions, {
      fields: [permissionGroupMemberships.permissionId],
      references: [permissions.id],
    }),
    group: one(permissionGroups, {
      fields: [permissionGroupMemberships.groupId],
      references: [permissionGroups.id],
    }),
    createdByUser: one(users, {
      fields: [permissionGroupMemberships.createdBy],
      references: [users.id],
    }),
  })
);
