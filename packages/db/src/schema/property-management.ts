import { relations } from "drizzle-orm";
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { clients } from "./clients";
import { organizations } from "./organizations";
import { users } from "./users";

// Property type enum
export const propertyTypeEnum = pgEnum("property_type", [
  "RESIDENTIAL",
  "COMMERCIAL",
  "INDUSTRIAL",
  "LAND",
  "MIXED_USE",
  "AGRICULTURAL",
]);

// Property status enum
export const propertyStatusEnum = pgEnum("property_status", [
  "AVAILABLE",
  "OCCUPIED",
  "UNDER_MAINTENANCE",
  "PENDING_LEASE",
  "SOLD",
  "INACTIVE",
]);

// Lease status enum
export const leaseStatusEnum = pgEnum("lease_status", [
  "DRAFT",
  "PENDING_SIGNATURE",
  "ACTIVE",
  "EXPIRING_SOON",
  "EXPIRED",
  "TERMINATED",
  "RENEWED",
]);

// Payment status enum
export const rentPaymentStatusEnum = pgEnum("rent_payment_status", [
  "PENDING",
  "PAID",
  "PARTIAL",
  "OVERDUE",
  "WAIVED",
  "REFUNDED",
]);

// Maintenance priority enum
export const maintenancePriorityEnum = pgEnum("maintenance_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
  "EMERGENCY",
]);

// Maintenance status enum
export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "REPORTED",
  "ASSIGNED",
  "IN_PROGRESS",
  "PENDING_PARTS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
]);

// Properties table
export const properties = pgTable(
  "properties",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").references(() => clients.id),

    // Property identification
    propertyCode: text("property_code").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    propertyType: propertyTypeEnum("property_type").notNull(),
    status: propertyStatusEnum("status").default("AVAILABLE").notNull(),

    // Address
    addressLine1: text("address_line_1").notNull(),
    addressLine2: text("address_line_2"),
    city: text("city").notNull(),
    region: text("region"),
    country: text("country").default("Guyana").notNull(),
    postalCode: text("postal_code"),
    gpsCoordinates: jsonb("gps_coordinates"),

    // Property details
    totalArea: decimal("total_area", { precision: 15, scale: 2 }),
    usableArea: decimal("usable_area", { precision: 15, scale: 2 }),
    areaUnit: text("area_unit").default("sq_ft"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    floors: integer("floors"),
    yearBuilt: integer("year_built"),

    // Financial
    purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }),
    currentValue: decimal("current_value", { precision: 15, scale: 2 }),
    monthlyRent: decimal("monthly_rent", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),

    // Features and amenities
    amenities: jsonb("amenities"),
    features: jsonb("features"),
    images: jsonb("images"),

    // Documents
    titleDeedNumber: text("title_deed_number"),
    transportNumber: text("transport_number"),

    // Management
    managerId: text("manager_id").references(() => users.id),
    managementFeePercent: decimal("management_fee_percent", {
      precision: 5,
      scale: 2,
    }),

    // Metadata
    metadata: jsonb("metadata"),
    notes: text("notes"),

    // Audit
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("properties_org_idx").on(table.organizationId),
    index("properties_owner_idx").on(table.ownerId),
    index("properties_status_idx").on(table.status),
    index("properties_type_idx").on(table.propertyType),
    index("properties_code_idx").on(table.propertyCode),
    index("properties_city_idx").on(table.city),
  ]
);

// Property units (for multi-unit properties)
export const propertyUnits = pgTable(
  "property_units",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),

    unitNumber: text("unit_number").notNull(),
    unitName: text("unit_name"),
    floor: integer("floor"),
    status: propertyStatusEnum("status").default("AVAILABLE").notNull(),

    area: decimal("area", { precision: 15, scale: 2 }),
    areaUnit: text("area_unit").default("sq_ft"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),

    monthlyRent: decimal("monthly_rent", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),

    amenities: jsonb("amenities"),
    features: jsonb("features"),
    images: jsonb("images"),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("property_units_property_idx").on(table.propertyId),
    index("property_units_status_idx").on(table.status),
  ]
);

// Tenants
export const tenants = pgTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    clientId: text("client_id").references(() => clients.id),

    // Tenant identification
    tenantCode: text("tenant_code").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email"),
    phone: text("phone"),
    alternatePhone: text("alternate_phone"),

    // Identification
    idType: text("id_type"),
    idNumber: text("id_number"),
    tin: text("tin"),

    // Employment
    employer: text("employer"),
    employerAddress: text("employer_address"),
    jobTitle: text("job_title"),
    monthlyIncome: decimal("monthly_income", { precision: 15, scale: 2 }),

    // Emergency contact
    emergencyContactName: text("emergency_contact_name"),
    emergencyContactPhone: text("emergency_contact_phone"),
    emergencyContactRelation: text("emergency_contact_relation"),

    // Status
    isActive: boolean("is_active").default(true).notNull(),
    rating: integer("rating"),

    // Notes
    notes: text("notes"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("tenants_org_idx").on(table.organizationId),
    index("tenants_client_idx").on(table.clientId),
    index("tenants_code_idx").on(table.tenantCode),
    index("tenants_email_idx").on(table.email),
    index("tenants_active_idx").on(table.isActive),
  ]
);

// Leases
export const leases = pgTable(
  "leases",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    unitId: text("unit_id").references(() => propertyUnits.id),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),

    // Lease identification
    leaseNumber: text("lease_number").notNull(),
    status: leaseStatusEnum("status").default("DRAFT").notNull(),

    // Lease term
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    renewalDate: timestamp("renewal_date"),
    moveInDate: timestamp("move_in_date"),
    moveOutDate: timestamp("move_out_date"),

    // Rent details
    monthlyRent: decimal("monthly_rent", { precision: 15, scale: 2 }).notNull(),
    securityDeposit: decimal("security_deposit", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),
    paymentDueDay: integer("payment_due_day").default(1).notNull(),
    gracePeriodDays: integer("grace_period_days").default(5),
    lateFeeAmount: decimal("late_fee_amount", { precision: 15, scale: 2 }),
    lateFeePercent: decimal("late_fee_percent", { precision: 5, scale: 2 }),

    // Rent escalation
    rentEscalationPercent: decimal("rent_escalation_percent", {
      precision: 5,
      scale: 2,
    }),
    nextEscalationDate: timestamp("next_escalation_date"),

    // Inclusions
    utilitiesIncluded: jsonb("utilities_included"),
    parkingIncluded: boolean("parking_included").default(false),
    petsAllowed: boolean("pets_allowed").default(false),

    // Terms and conditions
    terms: text("terms"),
    specialConditions: text("special_conditions"),

    // Documents
    leaseDocumentUrl: text("lease_document_url"),
    signedDocumentUrl: text("signed_document_url"),
    signedDate: timestamp("signed_date"),

    // Previous lease (for renewals)
    previousLeaseId: text("previous_lease_id"),

    // Metadata
    metadata: jsonb("metadata"),
    notes: text("notes"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("leases_org_idx").on(table.organizationId),
    index("leases_property_idx").on(table.propertyId),
    index("leases_tenant_idx").on(table.tenantId),
    index("leases_status_idx").on(table.status),
    index("leases_number_idx").on(table.leaseNumber),
    index("leases_end_date_idx").on(table.endDate),
  ]
);

// Rent payments
export const rentPayments = pgTable(
  "rent_payments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    leaseId: text("lease_id")
      .notNull()
      .references(() => leases.id),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id),

    // Payment details
    paymentNumber: text("payment_number").notNull(),
    status: rentPaymentStatusEnum("status").default("PENDING").notNull(),

    // Amount
    rentAmount: decimal("rent_amount", { precision: 15, scale: 2 }).notNull(),
    lateFee: decimal("late_fee", { precision: 15, scale: 2 }).default("0"),
    otherCharges: decimal("other_charges", { precision: 15, scale: 2 }).default(
      "0"
    ),
    totalAmount: decimal("total_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    amountPaid: decimal("amount_paid", { precision: 15, scale: 2 }).default(
      "0"
    ),
    balance: decimal("balance", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),

    // Period
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    dueDate: timestamp("due_date").notNull(),
    paidDate: timestamp("paid_date"),

    // Payment method
    paymentMethod: text("payment_method"),
    paymentReference: text("payment_reference"),
    receiptNumber: text("receipt_number"),
    receiptUrl: text("receipt_url"),

    // Notes
    notes: text("notes"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    processedBy: text("processed_by").references(() => users.id),
  },
  (table) => [
    index("rent_payments_org_idx").on(table.organizationId),
    index("rent_payments_lease_idx").on(table.leaseId),
    index("rent_payments_tenant_idx").on(table.tenantId),
    index("rent_payments_status_idx").on(table.status),
    index("rent_payments_due_date_idx").on(table.dueDate),
  ]
);

// Maintenance requests
export const maintenanceRequests = pgTable(
  "maintenance_requests",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    unitId: text("unit_id").references(() => propertyUnits.id),
    tenantId: text("tenant_id").references(() => tenants.id),
    leaseId: text("lease_id").references(() => leases.id),

    // Request details
    requestNumber: text("request_number").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    category: text("category"),
    priority: maintenancePriorityEnum("priority").default("MEDIUM").notNull(),
    status: maintenanceStatusEnum("status").default("REPORTED").notNull(),

    // Location
    location: text("location"),
    accessInstructions: text("access_instructions"),

    // Assignment
    assignedToId: text("assigned_to_id").references(() => users.id),
    assignedVendor: text("assigned_vendor"),
    vendorContact: text("vendor_contact"),

    // Scheduling
    reportedDate: timestamp("reported_date").defaultNow().notNull(),
    scheduledDate: timestamp("scheduled_date"),
    completedDate: timestamp("completed_date"),

    // Cost
    estimatedCost: decimal("estimated_cost", { precision: 15, scale: 2 }),
    actualCost: decimal("actual_cost", { precision: 15, scale: 2 }),
    currency: text("currency").default("GYD").notNull(),
    chargeToTenant: boolean("charge_to_tenant").default(false),

    // Images/attachments
    images: jsonb("images"),
    attachments: jsonb("attachments"),

    // Resolution
    resolution: text("resolution"),
    tenantFeedback: text("tenant_feedback"),
    tenantRating: integer("tenant_rating"),

    // Notes
    notes: text("notes"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    reportedBy: text("reported_by").references(() => users.id),
  },
  (table) => [
    index("maintenance_requests_org_idx").on(table.organizationId),
    index("maintenance_requests_property_idx").on(table.propertyId),
    index("maintenance_requests_tenant_idx").on(table.tenantId),
    index("maintenance_requests_status_idx").on(table.status),
    index("maintenance_requests_priority_idx").on(table.priority),
    index("maintenance_requests_number_idx").on(table.requestNumber),
  ]
);

// Property inspections
export const propertyInspections = pgTable(
  "property_inspections",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    unitId: text("unit_id").references(() => propertyUnits.id),
    leaseId: text("lease_id").references(() => leases.id),

    // Inspection details
    inspectionType: text("inspection_type").notNull(), // move_in, move_out, routine, maintenance
    inspectionNumber: text("inspection_number").notNull(),
    scheduledDate: timestamp("scheduled_date").notNull(),
    completedDate: timestamp("completed_date"),

    // Inspector
    inspectorId: text("inspector_id")
      .notNull()
      .references(() => users.id),
    tenantPresent: boolean("tenant_present").default(false),

    // Results
    overallCondition: text("overall_condition"), // excellent, good, fair, poor
    checklist: jsonb("checklist"),
    findings: jsonb("findings"),
    images: jsonb("images"),

    // Follow-up
    followUpRequired: boolean("follow_up_required").default(false),
    followUpNotes: text("follow_up_notes"),

    // Signatures
    inspectorSignature: text("inspector_signature"),
    tenantSignature: text("tenant_signature"),
    reportUrl: text("report_url"),

    // Notes
    notes: text("notes"),
    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("property_inspections_org_idx").on(table.organizationId),
    index("property_inspections_property_idx").on(table.propertyId),
    index("property_inspections_lease_idx").on(table.leaseId),
    index("property_inspections_type_idx").on(table.inspectionType),
    index("property_inspections_date_idx").on(table.scheduledDate),
  ]
);

// Relations
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [properties.organizationId],
    references: [organizations.id],
  }),
  owner: one(clients, {
    fields: [properties.ownerId],
    references: [clients.id],
  }),
  manager: one(users, {
    fields: [properties.managerId],
    references: [users.id],
  }),
  units: many(propertyUnits),
  leases: many(leases),
  maintenanceRequests: many(maintenanceRequests),
  inspections: many(propertyInspections),
}));

export const propertyUnitsRelations = relations(propertyUnits, ({ one }) => ({
  property: one(properties, {
    fields: [propertyUnits.propertyId],
    references: [properties.id],
  }),
}));

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [tenants.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [tenants.clientId],
    references: [clients.id],
  }),
  leases: many(leases),
  payments: many(rentPayments),
  maintenanceRequests: many(maintenanceRequests),
}));

export const leasesRelations = relations(leases, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [leases.organizationId],
    references: [organizations.id],
  }),
  property: one(properties, {
    fields: [leases.propertyId],
    references: [properties.id],
  }),
  unit: one(propertyUnits, {
    fields: [leases.unitId],
    references: [propertyUnits.id],
  }),
  tenant: one(tenants, {
    fields: [leases.tenantId],
    references: [tenants.id],
  }),
  payments: many(rentPayments),
  maintenanceRequests: many(maintenanceRequests),
  inspections: many(propertyInspections),
}));

export const rentPaymentsRelations = relations(rentPayments, ({ one }) => ({
  organization: one(organizations, {
    fields: [rentPayments.organizationId],
    references: [organizations.id],
  }),
  lease: one(leases, {
    fields: [rentPayments.leaseId],
    references: [leases.id],
  }),
  tenant: one(tenants, {
    fields: [rentPayments.tenantId],
    references: [tenants.id],
  }),
}));

export const maintenanceRequestsRelations = relations(
  maintenanceRequests,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [maintenanceRequests.organizationId],
      references: [organizations.id],
    }),
    property: one(properties, {
      fields: [maintenanceRequests.propertyId],
      references: [properties.id],
    }),
    unit: one(propertyUnits, {
      fields: [maintenanceRequests.unitId],
      references: [propertyUnits.id],
    }),
    tenant: one(tenants, {
      fields: [maintenanceRequests.tenantId],
      references: [tenants.id],
    }),
    lease: one(leases, {
      fields: [maintenanceRequests.leaseId],
      references: [leases.id],
    }),
  })
);

export const propertyInspectionsRelations = relations(
  propertyInspections,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [propertyInspections.organizationId],
      references: [organizations.id],
    }),
    property: one(properties, {
      fields: [propertyInspections.propertyId],
      references: [properties.id],
    }),
    unit: one(propertyUnits, {
      fields: [propertyInspections.unitId],
      references: [propertyUnits.id],
    }),
    lease: one(leases, {
      fields: [propertyInspections.leaseId],
      references: [leases.id],
    }),
    inspector: one(users, {
      fields: [propertyInspections.inspectorId],
      references: [users.id],
    }),
  })
);
