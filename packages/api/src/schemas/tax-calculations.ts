import { z } from "zod";

// Enum schemas
export const taxTypeSchema = z.enum([
  "paye",
  "nis",
  "vat",
  "corporate_tax",
  "withholding_tax",
  "land_tax",
  "stamp_duty",
  "customs_duty",
  "excise_tax",
]);

export const calculationStatusSchema = z.enum([
  "draft",
  "calculated",
  "verified",
  "submitted",
  "paid",
  "overdue",
  "amended",
]);

export const payeFrequencySchema = z.enum([
  "weekly",
  "bi_weekly",
  "monthly",
  "annually",
]);

export const nisClassSchema = z.enum([
  "class_1", // Employed persons
  "class_2", // Self-employed persons
  "class_3", // Voluntary contributors
]);

export const vatRateTypeSchema = z.enum(["standard", "zero_rated", "exempt"]);

export const taxPeriodTypeSchema = z.enum([
  "monthly",
  "quarterly",
  "annually",
  "one_time",
]);

// PAYE (Pay As You Earn) Calculation schemas
export const payeCalculationSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  taxYear: z.number().int().min(2020).max(2050),
  taxMonth: z.number().int().min(1).max(12).nullable().optional(),
  payPeriod: z.string().nullable().optional(), // e.g., "2024-01"
  frequency: payeFrequencySchema,
  employeeCount: z.number().int().min(0),
  totalGrossPay: z.number().positive(),
  totalTaxableIncome: z.number().positive(),
  personalAllowances: z.number().min(0).default(0),
  pensionContributions: z.number().min(0).default(0),
  otherDeductions: z.number().min(0).default(0),
  taxableAmount: z.number().min(0),
  taxRate: z.number().min(0).max(1).nullable().optional(), // e.g., 0.175 for 17.5%
  taxCalculated: z.number().min(0),
  previouslyPaid: z.number().min(0).default(0),
  taxDue: z.number().min(0),
  status: calculationStatusSchema.default("draft"),
  submissionDate: z.date().nullable().optional(),
  paymentDate: z.date().nullable().optional(),
  dueDate: z.date(),
  notes: z.string().nullable().optional(),
  calculationDetails: z.record(z.string(), z.any()).nullable().optional(),
  amendments: z.array(z.record(z.string(), z.any())).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

export const createPayeCalculationSchema = z.object({
  clientId: z.string().min(1),
  taxYear: z.number().int().min(2020).max(2050),
  taxMonth: z.number().int().min(1).max(12).optional(),
  payPeriod: z.string().optional(),
  frequency: payeFrequencySchema,
  employeeCount: z.number().int().min(0),
  totalGrossPay: z.number().positive(),
  totalTaxableIncome: z.number().positive(),
  personalAllowances: z.number().min(0).default(0),
  pensionContributions: z.number().min(0).default(0),
  otherDeductions: z.number().min(0).default(0),
  dueDate: z.date(),
  notes: z.string().optional(),
});

export const updatePayeCalculationSchema = createPayeCalculationSchema
  .partial()
  .extend({
    status: calculationStatusSchema.optional(),
    submissionDate: z.date().optional(),
    paymentDate: z.date().optional(),
    calculationDetails: z.record(z.string(), z.any()).optional(),
    amendments: z.array(z.record(z.string(), z.any())).optional(),
  });

// NIS (National Insurance Scheme) Calculation schemas
export const nisCalculationSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  contributionYear: z.number().int().min(2020).max(2050),
  contributionMonth: z.number().int().min(1).max(12).nullable().optional(),
  payPeriod: z.string().nullable().optional(),
  nisClass: nisClassSchema,
  totalEarnings: z.number().positive(),
  insutableEarnings: z.number().positive(),
  contributionRate: z.number().min(0).max(1).nullable().optional(),
  employeeContribution: z.number().min(0),
  employerContribution: z.number().min(0),
  totalContribution: z.number().min(0),
  previouslyPaid: z.number().min(0).default(0),
  contributionDue: z.number().min(0),
  status: calculationStatusSchema.default("draft"),
  submissionDate: z.date().nullable().optional(),
  paymentDate: z.date().nullable().optional(),
  dueDate: z.date(),
  employeeCount: z.number().int().min(0).nullable().optional(),
  notes: z.string().nullable().optional(),
  calculationDetails: z.record(z.string(), z.any()).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

export const createNisCalculationSchema = z.object({
  clientId: z.string().min(1),
  contributionYear: z.number().int().min(2020).max(2050),
  contributionMonth: z.number().int().min(1).max(12).optional(),
  payPeriod: z.string().optional(),
  nisClass: nisClassSchema,
  totalEarnings: z.number().positive(),
  insutableEarnings: z.number().positive(),
  dueDate: z.date(),
  employeeCount: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const updateNisCalculationSchema = createNisCalculationSchema
  .partial()
  .extend({
    status: calculationStatusSchema.optional(),
    submissionDate: z.date().optional(),
    paymentDate: z.date().optional(),
    calculationDetails: z.record(z.string(), z.any()).optional(),
  });

// VAT (Value Added Tax) Calculation schemas
export const vatCalculationSchema = z.object({
  id: z.string().min(1),
  clientId: z.string().min(1),
  taxYear: z.number().int().min(2020).max(2050),
  taxQuarter: z.number().int().min(1).max(4).nullable().optional(),
  taxMonth: z.number().int().min(1).max(12).nullable().optional(),
  periodStart: z.date(),
  periodEnd: z.date(),
  totalSales: z.number().min(0),
  standardRatedSales: z.number().min(0).default(0),
  zeroRatedSales: z.number().min(0).default(0),
  exemptSales: z.number().min(0).default(0),
  outputVat: z.number().min(0),
  totalPurchases: z.number().min(0),
  standardRatedPurchases: z.number().min(0).default(0),
  zeroRatedPurchases: z.number().min(0).default(0),
  exemptPurchases: z.number().min(0).default(0),
  inputVat: z.number().min(0),
  netVat: z.number(),
  vatRate: z.number().min(0).max(1).default(0.175),
  adjustments: z.number().default(0),
  penaltiesInterest: z.number().min(0).default(0),
  totalVatDue: z.number().min(0),
  status: calculationStatusSchema.default("draft"),
  submissionDate: z.date().nullable().optional(),
  paymentDate: z.date().nullable().optional(),
  dueDate: z.date(),
  vatRegistrationNumber: z.string().nullable().optional(),
  returnType: z.enum(["standard", "cash_basis", "annual"]).default("standard"),
  notes: z.string().nullable().optional(),
  calculationDetails: z.record(z.string(), z.any()).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

export const createVatCalculationSchema = z.object({
  clientId: z.string().min(1),
  taxYear: z.number().int().min(2020).max(2050),
  taxQuarter: z.number().int().min(1).max(4).optional(),
  taxMonth: z.number().int().min(1).max(12).optional(),
  periodStart: z.date(),
  periodEnd: z.date(),
  totalSales: z.number().min(0),
  standardRatedSales: z.number().min(0).default(0),
  zeroRatedSales: z.number().min(0).default(0),
  exemptSales: z.number().min(0).default(0),
  totalPurchases: z.number().min(0),
  standardRatedPurchases: z.number().min(0).default(0),
  zeroRatedPurchases: z.number().min(0).default(0),
  exemptPurchases: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(1).default(0.175),
  adjustments: z.number().default(0),
  penaltiesInterest: z.number().min(0).default(0),
  dueDate: z.date(),
  vatRegistrationNumber: z.string().optional(),
  returnType: z.enum(["standard", "cash_basis", "annual"]).default("standard"),
  notes: z.string().optional(),
});

export const updateVatCalculationSchema = createVatCalculationSchema
  .partial()
  .extend({
    status: calculationStatusSchema.optional(),
    submissionDate: z.date().optional(),
    paymentDate: z.date().optional(),
    calculationDetails: z.record(z.string(), z.any()).optional(),
  });

// Tax rates configuration schema
export const taxRateSchema = z.object({
  id: z.string().min(1),
  taxType: taxTypeSchema,
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  rate: z.number().min(0).max(1),
  minIncome: z.number().min(0).nullable().optional(),
  maxIncome: z.number().min(0).nullable().optional(),
  fixedAmount: z.number().min(0).nullable().optional(),
  effectiveFrom: z.date(),
  effectiveTo: z.date().nullable().optional(),
  taxYear: z.number().int().min(2020).max(2050).nullable().optional(),
  isActive: z.boolean().default(true),
  country: z.string().max(100).default("Barbados"),
  notes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
});

export const createTaxRateSchema = z.object({
  taxType: taxTypeSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  rate: z.number().min(0).max(1),
  minIncome: z.number().min(0).optional(),
  maxIncome: z.number().min(0).optional(),
  fixedAmount: z.number().min(0).optional(),
  effectiveFrom: z.date(),
  effectiveTo: z.date().optional(),
  taxYear: z.number().int().min(2020).max(2050).optional(),
  country: z.string().max(100).default("Barbados"),
  notes: z.string().optional(),
});

export const updateTaxRateSchema = createTaxRateSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Query schemas
export const taxCalculationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  clientId: z.string().nullish(),
  taxType: taxTypeSchema.nullish(),
  status: calculationStatusSchema.nullish(),
  taxYear: z.coerce.number().int().min(2020).max(2050).nullish(),
  taxMonth: z.coerce.number().int().min(1).max(12).nullish(),
  taxQuarter: z.coerce.number().int().min(1).max(4).nullish(),
  dueDateFrom: z.date().nullish(),
  dueDateTo: z.date().nullish(),
  sortBy: z
    .enum(["dueDate", "taxYear", "status", "taxDue", "createdAt"])
    .default("dueDate"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// Bulk calculation operations
export const bulkCalculationActionSchema = z.object({
  calculationIds: z.array(z.string().min(1)).min(1),
  action: z.enum(["submit", "approve", "reject", "calculate", "delete"]),
  reason: z.string().optional(),
});

// Tax calculation summary schema
export const taxCalculationSummarySchema = z.object({
  totalCalculations: z.number().int().min(0),
  draftCalculations: z.number().int().min(0),
  submittedCalculations: z.number().int().min(0),
  overdueCalculations: z.number().int().min(0),
  totalTaxDue: z.number().min(0),
  totalPaid: z.number().min(0),
  outstandingAmount: z.number().min(0),
});

// Export types
export type PayeCalculation = z.infer<typeof payeCalculationSchema>;
export type CreatePayeCalculation = z.infer<typeof createPayeCalculationSchema>;
export type UpdatePayeCalculation = z.infer<typeof updatePayeCalculationSchema>;
export type NisCalculation = z.infer<typeof nisCalculationSchema>;
export type CreateNisCalculation = z.infer<typeof createNisCalculationSchema>;
export type UpdateNisCalculation = z.infer<typeof updateNisCalculationSchema>;
export type VatCalculation = z.infer<typeof vatCalculationSchema>;
export type CreateVatCalculation = z.infer<typeof createVatCalculationSchema>;
export type UpdateVatCalculation = z.infer<typeof updateVatCalculationSchema>;
export type TaxRate = z.infer<typeof taxRateSchema>;
export type CreateTaxRate = z.infer<typeof createTaxRateSchema>;
export type UpdateTaxRate = z.infer<typeof updateTaxRateSchema>;
export type TaxCalculationQuery = z.infer<typeof taxCalculationQuerySchema>;
export type BulkCalculationAction = z.infer<typeof bulkCalculationActionSchema>;
export type TaxCalculationSummary = z.infer<typeof taxCalculationSummarySchema>;
export type TaxType = z.infer<typeof taxTypeSchema>;
export type CalculationStatus = z.infer<typeof calculationStatusSchema>;
export type PayeFrequency = z.infer<typeof payeFrequencySchema>;
export type NisClass = z.infer<typeof nisClassSchema>;
export type VatRateType = z.infer<typeof vatRateTypeSchema>;
export type TaxPeriodType = z.infer<typeof taxPeriodTypeSchema>;
