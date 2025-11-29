import { z } from "zod";

// Enum schemas
export const entityTypeSchema = z.enum([
  "individual",
  "sole_proprietorship",
  "partnership",
  "limited_liability_company",
  "corporation",
  "trust",
  "estate",
  "non_profit",
  "government",
]);

export const clientStatusSchema = z.enum([
  "active",
  "inactive",
  "suspended",
  "pending_approval",
  "archived",
]);

export const complianceStatusSchema = z.enum([
  "compliant",
  "non_compliant",
  "pending_review",
  "overdue",
  "exempt",
]);

export const riskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

// Base client schema
export const clientSchema = z.object({
  id: z.string().min(1),
  clientNumber: z.string().min(1),
  name: z.string().min(1).max(255),
  entityType: entityTypeSchema,
  registrationNumber: z.string().nullable().optional(),
  taxIdNumber: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phoneNumber: z.string().max(20).nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  state: z.string().max(100).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  country: z.string().max(100).default("Barbados"),

  // Status and compliance
  status: clientStatusSchema.default("pending_approval"),
  complianceStatus: complianceStatusSchema.default("pending_review"),
  riskLevel: riskLevelSchema.default("medium"),

  // Financial information
  estimatedAnnualRevenue: z.number().positive().nullable().optional(),
  employeeCount: z.number().int().min(0).nullable().optional(),

  // Key dates
  incorporationDate: z.date().nullable().optional(),
  fiscalYearEnd: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .nullable()
    .optional(), // MM-DD format
  clientSince: z.date().nullable().optional(),
  lastReviewDate: z.date().nullable().optional(),
  nextReviewDate: z.date().nullable().optional(),

  // Assigned personnel
  assignedAccountant: z.string().nullable().optional(),
  assignedManager: z.string().nullable().optional(),
  primaryContact: z.string().nullable().optional(),

  // Additional information
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  customFields: z.record(z.any()).nullable().optional(),

  // Audit fields
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

// Client creation wizard schemas
export const clientWizardStep1Schema = z.object({
  name: z.string().min(1).max(255),
  entityType: entityTypeSchema,
  registrationNumber: z.string().optional(),
  taxIdNumber: z.string().optional(),
});

export const clientWizardStep2Schema = z.object({
  email: z.string().email().optional(),
  phoneNumber: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default("Barbados"),
});

export const clientWizardStep3Schema = z.object({
  estimatedAnnualRevenue: z.number().positive().optional(),
  employeeCount: z.number().int().min(0).optional(),
  incorporationDate: z.date().optional(),
  fiscalYearEnd: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .optional(),
});

export const clientWizardStep4Schema = z.object({
  assignedAccountant: z.string().optional(),
  assignedManager: z.string().optional(),
  primaryContact: z.string().optional(),
  riskLevel: riskLevelSchema.default("medium"),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const createClientSchema = z.object({
  name: z.string().min(1).max(255),
  entityType: entityTypeSchema,
  registrationNumber: z.string().optional(),
  taxIdNumber: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().max(20).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).default("Barbados"),
  estimatedAnnualRevenue: z.number().positive().optional(),
  employeeCount: z.number().int().min(0).optional(),
  incorporationDate: z.date().optional(),
  fiscalYearEnd: z
    .string()
    .regex(/^\d{2}-\d{2}$/)
    .optional(),
  assignedAccountant: z.string().optional(),
  assignedManager: z.string().optional(),
  primaryContact: z.string().optional(),
  riskLevel: riskLevelSchema.default("medium"),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

export const updateClientSchema = createClientSchema.partial().extend({
  status: clientStatusSchema.optional(),
  complianceStatus: complianceStatusSchema.optional(),
});

export const clientQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  entityType: entityTypeSchema.optional(),
  status: clientStatusSchema.optional(),
  complianceStatus: complianceStatusSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
  assignedAccountant: z.string().optional(),
  assignedManager: z.string().optional(),
  tags: z.string().optional(), // Single tag to filter by
  sortBy: z
    .enum([
      "name",
      "clientNumber",
      "entityType",
      "status",
      "complianceStatus",
      "createdAt",
      "clientSince",
    ])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Client contact schemas
export const clientContactSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  name: z.string().min(1).max(255),
  title: z.string().max(100).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phoneNumber: z.string().max(20).nullable().optional(),
  mobileNumber: z.string().max(20).nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  isPrimary: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
});

export const createClientContactSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1).max(255),
  title: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().max(20).optional(),
  mobileNumber: z.string().max(20).optional(),
  department: z.string().max(100).optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

export const updateClientContactSchema = createClientContactSchema
  .partial()
  .omit({ clientId: true });

// Client service schemas
export const clientServiceSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  serviceName: z.string().min(1).max(255),
  serviceType: z.string().min(1).max(100), // tax_prep, bookkeeping, audit, consulting
  description: z.string().nullable().optional(),
  frequency: z
    .enum(["monthly", "quarterly", "annually", "one_time"])
    .nullable()
    .optional(),
  feeStructure: z.enum(["fixed", "hourly", "percentage"]).nullable().optional(),
  feeAmount: z.number().positive().nullable().optional(),
  currency: z.string().max(3).default("BBD"),
  startDate: z.date().nullable().optional(),
  endDate: z.date().nullable().optional(),
  isActive: z.boolean().default(true),
  assignedTo: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
});

export const createClientServiceSchema = z.object({
  clientId: z.string().min(1),
  serviceName: z.string().min(1).max(255),
  serviceType: z.string().min(1).max(100),
  description: z.string().optional(),
  frequency: z
    .enum(["monthly", "quarterly", "annually", "one_time"])
    .optional(),
  feeStructure: z.enum(["fixed", "hourly", "percentage"]).optional(),
  feeAmount: z.number().positive().optional(),
  currency: z.string().max(3).default("BBD"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientServiceSchema = createClientServiceSchema
  .partial()
  .omit({ clientId: true })
  .extend({
    isActive: z.boolean().optional(),
  });

// Bulk operations
export const bulkClientActionSchema = z.object({
  clientIds: z.array(z.string().min(1)).min(1),
  action: z.enum([
    "activate",
    "deactivate",
    "archive",
    "delete",
    "assign_accountant",
    "assign_manager",
  ]),
  assignedUserId: z.string().optional(), // Required for assign actions
  reason: z.string().optional(),
});

// Export types
export type Client = z.infer<typeof clientSchema>;
export type CreateClient = z.infer<typeof createClientSchema>;
export type UpdateClient = z.infer<typeof updateClientSchema>;
export type ClientQuery = z.infer<typeof clientQuerySchema>;
export type ClientWizardStep1 = z.infer<typeof clientWizardStep1Schema>;
export type ClientWizardStep2 = z.infer<typeof clientWizardStep2Schema>;
export type ClientWizardStep3 = z.infer<typeof clientWizardStep3Schema>;
export type ClientWizardStep4 = z.infer<typeof clientWizardStep4Schema>;
export type ClientContact = z.infer<typeof clientContactSchema>;
export type CreateClientContact = z.infer<typeof createClientContactSchema>;
export type UpdateClientContact = z.infer<typeof updateClientContactSchema>;
export type ClientService = z.infer<typeof clientServiceSchema>;
export type CreateClientService = z.infer<typeof createClientServiceSchema>;
export type UpdateClientService = z.infer<typeof updateClientServiceSchema>;
export type BulkClientAction = z.infer<typeof bulkClientActionSchema>;
export type EntityType = z.infer<typeof entityTypeSchema>;
export type ClientStatus = z.infer<typeof clientStatusSchema>;
export type ComplianceStatus = z.infer<typeof complianceStatusSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;
