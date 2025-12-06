/**
 * Guyana Tax Calculation Engines
 * Implements PAYE, NIS, and VAT calculations based on Guyana Revenue Authority (GRA) guidelines
 * and National Insurance Scheme (NIS) requirements
 *
 * Updated for 2025 Budget:
 * - PAYE rates reduced from 28%/40% to 25%/35%
 * - Tax-free threshold increased to GYD 130,000/month
 * - Second band threshold at GYD 260,000/month
 */

// PAYE Tax Brackets for 2025 (GYD) - Monthly
export const PAYE_TAX_BRACKETS = [
  { min: 0, max: 130_000, rate: 0 }, // Tax-free threshold (personal allowance)
  { min: 130_001, max: 260_000, rate: 0.25 }, // 25% first band (reduced from 28%)
  { min: 260_001, max: Number.POSITIVE_INFINITY, rate: 0.35 }, // 35% second band (reduced from 40%)
] as const;

// NIS Contribution Rates (2025)
export const NIS_RATES = {
  EMPLOYEE_RATE: 0.056, // 5.6%
  EMPLOYER_RATE: 0.084, // 8.4%
  TOTAL_RATE: 0.14, // 14% combined
  WEEKLY_CEILING: 64_615, // GYD weekly ceiling
  MONTHLY_CEILING: 280_000, // GYD monthly ceiling (increased for 2025)
} as const;

// VAT Configuration
export const VAT_CONFIG = {
  STANDARD_RATE: 0.14, // 14%
  REGISTRATION_THRESHOLD: 15_000_000, // GYD 15M annual revenue
  ZERO_RATED_CATEGORIES: [
    "BASIC_FOOD_ITEMS",
    "MEDICAL_SUPPLIES",
    "EDUCATIONAL_MATERIALS",
    "EXPORTS",
  ],
  EXEMPT_CATEGORIES: [
    "FINANCIAL_SERVICES",
    "INSURANCE",
    "RESIDENTIAL_RENT",
    "MEDICAL_SERVICES",
    "EDUCATIONAL_SERVICES",
  ],
} as const;

export type PayeCalculationInput = {
  monthlyGrossSalary: number;
  personalAllowances?: number;
  dependentAllowances?: number;
  pensionContributions?: number;
  insurancePremiums?: number;
};

export type PayeCalculationResult = {
  grossSalary: number;
  totalAllowances: number;
  taxableIncome: number;
  payeTax: number;
  netSalary: number;
  breakdown: Array<{
    bracket: string;
    taxableAmount: number;
    rate: number;
    tax: number;
  }>;
};

export type NisCalculationInput = {
  grossWages: number;
  frequency: "weekly" | "monthly";
  employeeOnly?: boolean;
};

export type NisCalculationResult = {
  grossWages: number;
  cappedWages: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  frequency: "weekly" | "monthly";
};

export type VatCalculationInput = {
  netAmount: number;
  category?: string;
  isExport?: boolean;
  vatInclusive?: boolean;
};

export type VatCalculationResult = {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
  category: string;
  isExempt: boolean;
  isZeroRated: boolean;
};

/**
 * Calculate PAYE tax based on Guyana tax brackets
 */
export function calculatePaye(
  input: PayeCalculationInput
): PayeCalculationResult {
  const {
    monthlyGrossSalary,
    personalAllowances = 0,
    dependentAllowances = 0,
    pensionContributions = 0,
    insurancePremiums = 0,
  } = input;

  const totalAllowances =
    personalAllowances +
    dependentAllowances +
    pensionContributions +
    insurancePremiums;
  const taxableIncome = Math.max(0, monthlyGrossSalary - totalAllowances);

  let payeTax = 0;
  const breakdown: PayeCalculationResult["breakdown"] = [];

  for (const bracket of PAYE_TAX_BRACKETS) {
    if (taxableIncome <= bracket.min) {
      break;
    }

    const taxableInBracket = Math.min(
      taxableIncome - bracket.min,
      bracket.max === Number.POSITIVE_INFINITY
        ? taxableIncome - bracket.min
        : bracket.max - bracket.min
    );

    if (taxableInBracket > 0) {
      const taxInBracket = taxableInBracket * bracket.rate;
      payeTax += taxInBracket;

      breakdown.push({
        bracket:
          bracket.max === Number.POSITIVE_INFINITY
            ? `Over GYD ${bracket.min.toLocaleString()}`
            : `GYD ${bracket.min.toLocaleString()} - ${bracket.max.toLocaleString()}`,
        taxableAmount: taxableInBracket,
        rate: bracket.rate,
        tax: taxInBracket,
      });
    }
  }

  const netSalary = monthlyGrossSalary - payeTax;

  return {
    grossSalary: monthlyGrossSalary,
    totalAllowances,
    taxableIncome,
    payeTax: Math.round(payeTax),
    netSalary: Math.round(netSalary),
    breakdown,
  };
}

/**
 * Calculate NIS contributions for employee and employer
 */
export function calculateNis(input: NisCalculationInput): NisCalculationResult {
  const { grossWages, frequency, employeeOnly = false } = input;

  const ceiling =
    frequency === "weekly"
      ? NIS_RATES.WEEKLY_CEILING
      : NIS_RATES.MONTHLY_CEILING;
  const cappedWages = Math.min(grossWages, ceiling);

  const employeeContribution = Math.round(
    cappedWages * NIS_RATES.EMPLOYEE_RATE
  );
  const employerContribution = employeeOnly
    ? 0
    : Math.round(cappedWages * NIS_RATES.EMPLOYER_RATE);
  const totalContribution = employeeContribution + employerContribution;

  return {
    grossWages,
    cappedWages,
    employeeContribution,
    employerContribution,
    totalContribution,
    frequency,
  };
}

/**
 * Calculate VAT based on Guyana VAT rules
 */
export function calculateVat(input: VatCalculationInput): VatCalculationResult {
  const {
    netAmount,
    category = "STANDARD",
    isExport = false,
    vatInclusive = false,
  } = input;

  const isZeroRated =
    isExport || VAT_CONFIG.ZERO_RATED_CATEGORIES.includes(category as any);
  const isExempt = VAT_CONFIG.EXEMPT_CATEGORIES.includes(category as any);

  let vatRate = 0;
  if (!(isZeroRated || isExempt)) {
    vatRate = VAT_CONFIG.STANDARD_RATE;
  }

  let vatAmount: number;
  let grossAmount: number;
  let adjustedNetAmount: number;

  if (vatInclusive) {
    // VAT is included in the amount
    grossAmount = netAmount;
    adjustedNetAmount = netAmount / (1 + vatRate);
    vatAmount = grossAmount - adjustedNetAmount;
  } else {
    // VAT to be added to the amount
    adjustedNetAmount = netAmount;
    vatAmount = netAmount * vatRate;
    grossAmount = netAmount + vatAmount;
  }

  return {
    netAmount: Math.round(adjustedNetAmount),
    vatAmount: Math.round(vatAmount),
    grossAmount: Math.round(grossAmount),
    vatRate,
    category,
    isExempt,
    isZeroRated,
  };
}

/**
 * Check if a business needs to register for VAT
 */
export function checkVatRegistrationRequired(annualRevenue: number): boolean {
  return annualRevenue >= VAT_CONFIG.REGISTRATION_THRESHOLD;
}

/**
 * Calculate comprehensive payroll for an employee
 */
export function calculatePayroll(input: {
  monthlyGrossSalary: number;
  personalAllowances?: number;
  dependentAllowances?: number;
  pensionContributions?: number;
  insurancePremiums?: number;
}) {
  const payeResult = calculatePaye(input);
  const nisResult = calculateNis({
    grossWages: input.monthlyGrossSalary,
    frequency: "monthly",
  });

  const totalDeductions = payeResult.payeTax + nisResult.employeeContribution;
  const netPay = input.monthlyGrossSalary - totalDeductions;

  return {
    gross: input.monthlyGrossSalary,
    paye: payeResult,
    nis: nisResult,
    totalDeductions,
    netPay: Math.round(netPay),
    employerCosts: {
      salary: input.monthlyGrossSalary,
      nisContribution: nisResult.employerContribution,
      total: input.monthlyGrossSalary + nisResult.employerContribution,
    },
  };
}

/**
 * Estimate quarterly tax obligations for businesses
 */
export function calculateQuarterlyTax(input: {
  quarterlyRevenue: number;
  quarterlyExpenses: number;
  payrollTaxPaid: number;
  vatCollected: number;
  vatPaid: number;
}) {
  const {
    quarterlyRevenue,
    quarterlyExpenses,
    payrollTaxPaid,
    vatCollected,
    vatPaid,
  } = input;

  // Corporate tax calculation (simplified - actual rates may vary)
  const corporateTaxRate = quarterlyRevenue > 2_000_000 ? 0.3 : 0.25; // Simplified rates
  const taxableProfit = Math.max(0, quarterlyRevenue - quarterlyExpenses);
  const corporateTax = taxableProfit * corporateTaxRate;

  // VAT balance
  const vatBalance = vatCollected - vatPaid;

  // Total quarterly obligation
  const totalQuarterlyTax = corporateTax + Math.max(0, vatBalance);

  return {
    revenue: quarterlyRevenue,
    expenses: quarterlyExpenses,
    taxableProfit,
    corporateTax: Math.round(corporateTax),
    corporateTaxRate,
    vatBalance: Math.round(vatBalance),
    payrollTaxPaid,
    totalQuarterlyTax: Math.round(totalQuarterlyTax),
  };
}

/**
 * Generate tax form data compatible with GRA e-services
 */
export function generateGraTaxFormData(input: {
  clientId: string;
  period: string;
  payrollCalculations: ReturnType<typeof calculatePayroll>[];
  businessRevenue: number;
  businessExpenses: number;
  vatTransactions: VatCalculationResult[];
}) {
  const {
    clientId,
    period,
    payrollCalculations,
    businessRevenue,
    businessExpenses,
    vatTransactions,
  } = input;

  const totalPayroll = payrollCalculations.reduce(
    (sum, calc) => sum + calc.gross,
    0
  );
  const totalPayeTax = payrollCalculations.reduce(
    (sum, calc) => sum + calc.paye.payeTax,
    0
  );
  const totalNisEmployee = payrollCalculations.reduce(
    (sum, calc) => sum + calc.nis.employeeContribution,
    0
  );
  const totalNisEmployer = payrollCalculations.reduce(
    (sum, calc) => sum + calc.nis.employerContribution,
    0
  );

  const totalVatCollected = vatTransactions
    .filter((vat) => vat.vatAmount > 0)
    .reduce((sum, vat) => sum + vat.vatAmount, 0);

  return {
    clientId,
    period,
    payrollSummary: {
      totalPayroll,
      totalEmployees: payrollCalculations.length,
      totalPayeTax,
      totalNisEmployee,
      totalNisEmployer,
    },
    businessSummary: {
      revenue: businessRevenue,
      expenses: businessExpenses,
      profit: businessRevenue - businessExpenses,
    },
    vatSummary: {
      totalVatCollected,
      totalTransactions: vatTransactions.length,
      registrationRequired: checkVatRegistrationRequired(businessRevenue * 4), // Quarterly to annual
    },
    formattedForGra: {
      // Format compatible with GRA e-services portal
      tin: clientId,
      period,
      income: businessRevenue,
      deductions: businessExpenses,
      taxPayable: Math.round((businessRevenue - businessExpenses) * 0.25), // Simplified
      vatPayable: Math.round(totalVatCollected),
      nisContributions: Math.round(totalNisEmployee + totalNisEmployer),
      payeTax: Math.round(totalPayeTax),
    },
  };
}
