import { z } from "zod";

// Base schemas for tax calculations
export const PayeInputSchema = z.object({
  monthlyGrossSalary: z.number().min(0, "Gross salary must be positive"),
  personalAllowances: z.number().min(0).optional(),
  dependentAllowances: z.number().min(0).optional(),
  pensionContributions: z.number().min(0).optional(),
  insurancePremiums: z.number().min(0).optional(),
});

export const NisInputSchema = z.object({
  grossWages: z.number().min(0, "Gross wages must be positive"),
  frequency: z.enum(["weekly", "monthly"]),
  employeeOnly: z.boolean().optional(),
});

export const VatInputSchema = z.object({
  netAmount: z.number().min(0, "Net amount must be positive"),
  category: z.string().optional(),
  isExport: z.boolean().optional(),
  vatInclusive: z.boolean().optional(),
});

export const PayrollInputSchema = z.object({
  monthlyGrossSalary: z.number().min(0, "Gross salary must be positive"),
  personalAllowances: z.number().min(0).optional(),
  dependentAllowances: z.number().min(0).optional(),
  pensionContributions: z.number().min(0).optional(),
  insurancePremiums: z.number().min(0).optional(),
});

export const QuarterlyTaxInputSchema = z.object({
  quarterlyRevenue: z.number().min(0, "Revenue must be positive"),
  quarterlyExpenses: z.number().min(0, "Expenses must be positive"),
  payrollTaxPaid: z.number().min(0, "Payroll tax must be positive"),
  vatCollected: z.number().min(0, "VAT collected must be positive"),
  vatPaid: z.number().min(0, "VAT paid must be positive"),
});

export const GraTaxFormDataInputSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  period: z.string().min(1, "Period is required"),
  businessRevenue: z.number().min(0, "Business revenue must be positive"),
  businessExpenses: z.number().min(0, "Business expenses must be positive"),
  payrollCalculations: z.array(z.any()).optional(), // Will be calculated internally
  vatTransactions: z.array(z.any()).optional(), // Will be calculated internally
});

// Response schemas
export const PayeTaxBracketSchema = z.object({
  bracket: z.string(),
  taxableAmount: z.number(),
  rate: z.number(),
  tax: z.number(),
});

export const PayeResultSchema = z.object({
  grossSalary: z.number(),
  totalAllowances: z.number(),
  taxableIncome: z.number(),
  payeTax: z.number(),
  netSalary: z.number(),
  breakdown: z.array(PayeTaxBracketSchema),
});

export const NisResultSchema = z.object({
  grossWages: z.number(),
  cappedWages: z.number(),
  employeeContribution: z.number(),
  employerContribution: z.number(),
  totalContribution: z.number(),
  frequency: z.enum(["weekly", "monthly"]),
});

export const VatResultSchema = z.object({
  netAmount: z.number(),
  vatAmount: z.number(),
  grossAmount: z.number(),
  vatRate: z.number(),
  category: z.string(),
  isExempt: z.boolean(),
  isZeroRated: z.boolean(),
});

export const PayrollResultSchema = z.object({
  gross: z.number(),
  paye: PayeResultSchema,
  nis: NisResultSchema,
  totalDeductions: z.number(),
  netPay: z.number(),
  employerCosts: z.object({
    salary: z.number(),
    nisContribution: z.number(),
    total: z.number(),
  }),
});

export const QuarterlyTaxResultSchema = z.object({
  revenue: z.number(),
  expenses: z.number(),
  taxableProfit: z.number(),
  corporateTax: z.number(),
  corporateTaxRate: z.number(),
  vatBalance: z.number(),
  payrollTaxPaid: z.number(),
  totalQuarterlyTax: z.number(),
});

export const GraTaxFormResultSchema = z.object({
  clientId: z.string(),
  period: z.string(),
  payrollSummary: z.object({
    totalPayroll: z.number(),
    totalEmployees: z.number(),
    totalPayeTax: z.number(),
    totalNisEmployee: z.number(),
    totalNisEmployer: z.number(),
  }),
  businessSummary: z.object({
    revenue: z.number(),
    expenses: z.number(),
    profit: z.number(),
  }),
  vatSummary: z.object({
    totalVatCollected: z.number(),
    totalTransactions: z.number(),
    registrationRequired: z.boolean(),
  }),
  formattedForGra: z.object({
    tin: z.string(),
    period: z.string(),
    income: z.number(),
    deductions: z.number(),
    taxPayable: z.number(),
    vatPayable: z.number(),
    nisContributions: z.number(),
    payeTax: z.number(),
  }),
});

// Export type definitions
export type PayeInput = z.infer<typeof PayeInputSchema>;
export type NisInput = z.infer<typeof NisInputSchema>;
export type VatInput = z.infer<typeof VatInputSchema>;
export type PayrollInput = z.infer<typeof PayrollInputSchema>;
export type QuarterlyTaxInput = z.infer<typeof QuarterlyTaxInputSchema>;
export type GraTaxFormDataInput = z.infer<typeof GraTaxFormDataInputSchema>;

export type PayeResult = z.infer<typeof PayeResultSchema>;
export type NisResult = z.infer<typeof NisResultSchema>;
export type VatResult = z.infer<typeof VatResultSchema>;
export type PayrollResult = z.infer<typeof PayrollResultSchema>;
export type QuarterlyTaxResult = z.infer<typeof QuarterlyTaxResultSchema>;
export type GraTaxFormResult = z.infer<typeof GraTaxFormResultSchema>;
