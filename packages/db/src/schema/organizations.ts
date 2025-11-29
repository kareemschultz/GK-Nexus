import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { users } from "./users";

// Organization subscription tiers
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "basic",
  "professional",
  "enterprise",
  "custom",
]);

// Organization status
export const organizationStatusEnum = pgEnum("organization_status", [
  "active",
  "inactive",
  "suspended",
  "pending_setup",
  "trial",
  "cancelled",
]);

// Business sectors for Guyana market
export const businessSectorEnum = pgEnum("business_sector", [
  "agriculture",
  "mining",
  "oil_and_gas",
  "forestry",
  "manufacturing",
  "construction",
  "retail",
  "hospitality",
  "healthcare",
  "education",
  "financial_services",
  "professional_services",
  "technology",
  "transportation",
  "utilities",
  "government",
  "non_profit",
  "other",
]);

// Main organizations table - foundation for multi-tenancy
export const organizations = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    displayName: text("display_name"), // Public facing name
    slug: text("slug").unique().notNull(), // URL-friendly identifier

    // Guyana-specific business identifiers
    graTinNumber: text("gra_tin_number").unique(), // Required for GRA integration
    nisEmployerNumber: text("nis_employer_number").unique(),
    companyRegistrationNumber: text("company_registration_number").unique(),

    // Business information
    businessSector: businessSectorEnum("business_sector"),
    entityType: text("entity_type"), // Reference to client entityTypeEnum values
    establishedDate: timestamp("established_date"),
    fiscalYearEnd: text("fiscal_year_end"), // MM-DD format

    // Contact information
    primaryEmail: text("primary_email"),
    secondaryEmail: text("secondary_email"),
    phoneNumber: text("phone_number"),
    faxNumber: text("fax_number"),

    // Address information
    streetAddress: text("street_address"),
    city: text("city"),
    region: text("region"), // Guyana regions: Demerara-Mahaica, Berbice, etc.
    postalCode: text("postal_code"),
    country: text("country").default("Guyana").notNull(),

    // Subscription and billing
    subscriptionTier: subscriptionTierEnum("subscription_tier")
      .default("basic")
      .notNull(),
    subscriptionStartDate: timestamp("subscription_start_date"),
    subscriptionEndDate: timestamp("subscription_end_date"),
    billingEmail: text("billing_email"),
    paymentTerms: integer("payment_terms").default(30), // Days

    // Organization limits and quotas
    maxUsers: integer("max_users").default(5).notNull(),
    maxClients: integer("max_clients").default(100).notNull(),
    maxStorageGb: integer("max_storage_gb").default(10).notNull(),

    // Feature flags
    features: jsonb("features").$type<{
      taxCalculations: boolean;
      documentManagement: boolean;
      immigrationWorkflow: boolean;
      graIntegration: boolean;
      auditTrail: boolean;
      advancedReporting: boolean;
      apiAccess: boolean;
      customBranding: boolean;
    }>(),

    // GRA integration settings
    graIntegrationEnabled: boolean("gra_integration_enabled").default(false),
    graApiCredentials: jsonb("gra_api_credentials").$type<{
      clientId?: string;
      sandbox: boolean;
      lastConnected?: string;
      connectionStatus?: "connected" | "disconnected" | "error";
    }>(),

    // Branding and customization
    logoUrl: text("logo_url"),
    primaryColor: text("primary_color"), // Hex color code
    secondaryColor: text("secondary_color"),
    customDomain: text("custom_domain"),

    // Compliance and security
    dataRetentionYears: integer("data_retention_years").default(7).notNull(),
    encryptionEnabled: boolean("encryption_enabled").default(true).notNull(),
    twoFactorRequired: boolean("two_factor_required").default(false).notNull(),
    ipWhitelist: jsonb("ip_whitelist").$type<string[]>(),

    // Status and metadata
    status: organizationStatusEnum("status").default("pending_setup").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    timezone: text("timezone").default("America/Guyana").notNull(),
    locale: text("locale").default("en-GY").notNull(),
    currency: text("currency").default("GYD").notNull(),

    // Relationships
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    parentOrganizationId: text("parent_organization_id").references(
      () => organizations.id
    ),

    // Additional settings
    settings: jsonb("settings").$type<{
      autoBackup: boolean;
      notificationPreferences: {
        email: boolean;
        sms: boolean;
        dashboard: boolean;
      };
      workingHours: {
        start: string; // HH:MM format
        end: string;
        timezone: string;
        workingDays: number[]; // 0-6, Sunday=0
      };
      reportingPreferences: {
        defaultPeriod: "monthly" | "quarterly" | "annually";
        autoGenerate: boolean;
        recipients: string[];
      };
    }>(),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
    updatedBy: text("updated_by").references(() => users.id),

    // Soft delete
    deletedAt: timestamp("deleted_at"),
    deletedBy: text("deleted_by").references(() => users.id),
  },
  (table) => [
    index("organizations_slug_idx").on(table.slug),
    index("organizations_gra_tin_idx").on(table.graTinNumber),
    index("organizations_status_idx").on(table.status),
    index("organizations_subscription_tier_idx").on(table.subscriptionTier),
    index("organizations_owner_id_idx").on(table.ownerId),
    index("organizations_parent_id_idx").on(table.parentOrganizationId),
    index("organizations_business_sector_idx").on(table.businessSector),
    index("organizations_region_idx").on(table.region),
    index("organizations_created_at_idx").on(table.createdAt),
    index("organizations_deleted_at_idx").on(table.deletedAt),
  ]
);

// Organization users for managing team members and access
export const organizationUsers = pgTable(
  "organization_users",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Role within organization
    role: text("role").notNull(), // admin, manager, staff, read_only
    title: text("title"), // Job title within organization
    department: text("department"),

    // Access permissions
    permissions: jsonb("permissions").$type<{
      canManageUsers: boolean;
      canManageSettings: boolean;
      canManageBilling: boolean;
      canAccessReports: boolean;
      canManageClients: boolean;
      canProcessTax: boolean;
      canManageDocuments: boolean;
      restrictedClients?: string[]; // Client IDs user can access
    }>(),

    // Status and validity
    status: text("status").default("active").notNull(), // active, inactive, pending
    isActive: boolean("is_active").default(true).notNull(),
    validFrom: timestamp("valid_from").defaultNow().notNull(),
    validUntil: timestamp("valid_until"),

    // Invitation and onboarding
    inviteToken: text("invite_token"),
    inviteExpiresAt: timestamp("invite_expires_at"),
    invitedBy: text("invited_by").references(() => users.id),
    joinedAt: timestamp("joined_at"),
    onboardingCompleted: boolean("onboarding_completed").default(false),

    // Audit fields
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    unique("organization_users_org_user_unique").on(
      table.organizationId,
      table.userId
    ),
    index("organization_users_org_id_idx").on(table.organizationId),
    index("organization_users_user_id_idx").on(table.userId),
    index("organization_users_role_idx").on(table.role),
    index("organization_users_status_idx").on(table.status),
    index("organization_users_invited_by_idx").on(table.invitedBy),
    index("organization_users_invite_token_idx").on(table.inviteToken),
  ]
);

// Organization settings and configuration
export const organizationSettings = pgTable(
  "organization_settings",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // Setting configuration
    category: text("category").notNull(), // tax, document, notification, integration, etc.
    key: text("key").notNull(),
    value: jsonb("value"), // Flexible JSON value
    dataType: text("data_type").notNull(), // string, number, boolean, object, array

    // Setting metadata
    displayName: text("display_name"),
    description: text("description"),
    isRequired: boolean("is_required").default(false),
    isEncrypted: boolean("is_encrypted").default(false),
    validationRules: jsonb("validation_rules").$type<{
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      enum?: string[];
      min?: number;
      max?: number;
    }>(),

    // Environment and feature gating
    environment: text("environment").default("production"), // production, staging, development
    featureFlag: text("feature_flag"), // Associated feature flag

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
    unique("organization_settings_org_category_key_unique").on(
      table.organizationId,
      table.category,
      table.key
    ),
    index("organization_settings_org_id_idx").on(table.organizationId),
    index("organization_settings_category_idx").on(table.category),
    index("organization_settings_key_idx").on(table.key),
    index("organization_settings_feature_flag_idx").on(table.featureFlag),
  ]
);

// Relations
export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [organizations.ownerId],
      references: [users.id],
      relationName: "organizationOwner",
    }),
    parentOrganization: one(organizations, {
      fields: [organizations.parentOrganizationId],
      references: [organizations.id],
      relationName: "parentOrganization",
    }),
    childOrganizations: many(organizations, {
      relationName: "parentOrganization",
    }),
    organizationUsers: many(organizationUsers),
    organizationSettings: many(organizationSettings),
    createdByUser: one(users, {
      fields: [organizations.createdBy],
      references: [users.id],
      relationName: "organizationCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [organizations.updatedBy],
      references: [users.id],
      relationName: "organizationUpdatedBy",
    }),
    deletedByUser: one(users, {
      fields: [organizations.deletedBy],
      references: [users.id],
      relationName: "organizationDeletedBy",
    }),
  })
);

export const organizationUsersRelations = relations(
  organizationUsers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationUsers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationUsers.userId],
      references: [users.id],
    }),
    invitedByUser: one(users, {
      fields: [organizationUsers.invitedBy],
      references: [users.id],
      relationName: "organizationUserInvitedBy",
    }),
    createdByUser: one(users, {
      fields: [organizationUsers.createdBy],
      references: [users.id],
      relationName: "organizationUserCreatedBy",
    }),
  })
);

export const organizationSettingsRelations = relations(
  organizationSettings,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationSettings.organizationId],
      references: [organizations.id],
    }),
    createdByUser: one(users, {
      fields: [organizationSettings.createdBy],
      references: [users.id],
      relationName: "organizationSettingCreatedBy",
    }),
    updatedByUser: one(users, {
      fields: [organizationSettings.updatedBy],
      references: [users.id],
      relationName: "organizationSettingUpdatedBy",
    }),
  })
);
