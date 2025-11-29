import { CORPORATE_TAX_CONSTANTS } from "./tax-constants";

/**
 * Corporate Tax Calculator for Guyana
 * Implements various corporate tax rates based on business type and size
 */

export type BusinessType =
  | "standard"
  | "small_business"
  | "manufacturing"
  | "mining"
  | "banking"
  | "insurance"
  | "telecommunications";

export type AccountingPeriod = {
  startDate: Date;
  endDate: Date;
  isFirstYear: boolean;
};

export type CorporateTaxInput = {
  grossIncome: number;
  allowableDeductions: number;
  businessType: BusinessType;
  accountingPeriod: AccountingPeriod;
  previousYearLosses?: number;
  capitalAllowances?: number;
  donationsToCharity?: number;
  advancePayments?: number;
  withholdingTaxCredits?: number;
};

export type CorporateTaxCalculation = {
  grossIncome: number;
  allowableDeductions: number;
  adjustedIncome: number;
  capitalAllowances: number;
  charitableDonations: number;
  taxableIncome: number;
  lossCarryforward: number;
  finalTaxableIncome: number;
  taxRate: number;
  grossTax: number;
  taxCredits: number;
  netTax: number;
  advancePayments: number;
  balanceDue: number;
  isRefundDue: boolean;
  effectiveRate: number;
  businessType: BusinessType;
  qualifiesForSmallBusiness: boolean;
  metadata: {
    calculatedAt: Date;
    accountingPeriod: AccountingPeriod;
    dueDate: Date;
    standardRate: number;
  };
};

export type QuarterlyReturn = {
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  estimatedAnnualIncome: number;
  quarterlyTaxDue: number;
  cumulativePayments: number;
  balanceRemaining: number;
  dueDate: Date;
};

/**
 * Calculate corporate tax liability
 */
export function calculateCorporateTax(
  input: CorporateTaxInput
): CorporateTaxCalculation {
  const {
    grossIncome,
    allowableDeductions,
    businessType,
    accountingPeriod,
    previousYearLosses = 0,
    capitalAllowances = 0,
    donationsToCharity = 0,
    advancePayments = 0,
    withholdingTaxCredits = 0,
  } = input;

  // Calculate adjusted income
  const adjustedIncome = Math.max(0, grossIncome - allowableDeductions);

  // Apply capital allowances (limited to 50% of adjusted income for most businesses)
  const maxCapitalAllowances =
    businessType === "manufacturing"
      ? adjustedIncome // Manufacturing can claim full capital allowances
      : adjustedIncome * 0.5;
  const claimableCapitalAllowances = Math.min(
    capitalAllowances,
    maxCapitalAllowances
  );

  // Limit charitable donations (10% of adjusted income)
  const maxCharitableDonations = adjustedIncome * 0.1;
  const claimableCharitableDonations = Math.min(
    donationsToCharity,
    maxCharitableDonations
  );

  // Calculate taxable income before loss carryforward
  const taxableBeforeLosses = Math.max(
    0,
    adjustedIncome - claimableCapitalAllowances - claimableCharitableDonations
  );

  // Apply loss carryforward (limited to 50% of current year income)
  const maxLossOffset = taxableBeforeLosses * 0.5;
  const appliedLosses = Math.min(previousYearLosses, maxLossOffset);
  const finalTaxableIncome = Math.max(0, taxableBeforeLosses - appliedLosses);
  const remainingLosses = previousYearLosses - appliedLosses;

  // Determine tax rate and qualifications
  const qualifiesForSmallBusiness = isSmallBusiness(grossIncome, businessType);
  const taxRate = getCorporateTaxRate(businessType, qualifiesForSmallBusiness);

  // Calculate tax
  const grossTax = finalTaxableIncome * taxRate;

  // Apply tax credits
  const totalTaxCredits = withholdingTaxCredits;
  const netTax = Math.max(0, grossTax - totalTaxCredits);

  // Calculate balance due or refund
  const balanceDue = netTax - advancePayments;
  const isRefundDue = balanceDue < 0;

  // Calculate effective rate
  const effectiveRate = grossIncome > 0 ? grossTax / grossIncome : 0;

  // Calculate due date (6 months after year end)
  const dueDate = new Date(accountingPeriod.endDate);
  dueDate.setMonth(dueDate.getMonth() + 6);

  return {
    grossIncome,
    allowableDeductions,
    adjustedIncome,
    capitalAllowances: claimableCapitalAllowances,
    charitableDonations: claimableCharitableDonations,
    taxableIncome: taxableBeforeLosses,
    lossCarryforward: remainingLosses,
    finalTaxableIncome,
    taxRate,
    grossTax: Math.round(grossTax * 100) / 100,
    taxCredits: totalTaxCredits,
    netTax: Math.round(netTax * 100) / 100,
    advancePayments,
    balanceDue: Math.round(balanceDue * 100) / 100,
    isRefundDue,
    effectiveRate: Math.round(effectiveRate * 10_000) / 100, // Percentage with 2 decimal places
    businessType,
    qualifiesForSmallBusiness,
    metadata: {
      calculatedAt: new Date(),
      accountingPeriod,
      dueDate,
      standardRate: CORPORATE_TAX_CONSTANTS.STANDARD_RATE,
    },
  };
}

/**
 * Determine if business qualifies as small business
 */
function isSmallBusiness(
  grossIncome: number,
  businessType: BusinessType
): boolean {
  if (
    businessType === "banking" ||
    businessType === "mining" ||
    businessType === "insurance"
  ) {
    return false; // These sectors don't qualify for small business rates
  }

  return grossIncome <= CORPORATE_TAX_CONSTANTS.SMALL_BUSINESS_THRESHOLD;
}

/**
 * Get corporate tax rate based on business type and qualifications
 */
function getCorporateTaxRate(
  businessType: BusinessType,
  qualifiesForSmallBusiness: boolean
): number {
  if (qualifiesForSmallBusiness && businessType === "standard") {
    return CORPORATE_TAX_CONSTANTS.SMALL_BUSINESS_RATE;
  }

  switch (businessType) {
    case "standard":
    case "small_business":
      return CORPORATE_TAX_CONSTANTS.STANDARD_RATE;
    case "manufacturing":
      return CORPORATE_TAX_CONSTANTS.MANUFACTURING_RATE;
    case "mining":
      return CORPORATE_TAX_CONSTANTS.MINING_RATE;
    case "banking":
    case "insurance":
    case "telecommunications":
      return CORPORATE_TAX_CONSTANTS.BANKING_RATE;
    default:
      return CORPORATE_TAX_CONSTANTS.STANDARD_RATE;
  }
}

/**
 * Calculate quarterly advance payments
 */
export function calculateQuarterlyPayments(
  estimatedAnnualIncome: number,
  businessType: BusinessType,
  previousYearTax = 0
): QuarterlyReturn[] {
  const currentYear = new Date().getFullYear();
  const quarters: QuarterlyReturn[] = [];

  // Estimate current year tax
  const qualifiesForSmallBusiness = isSmallBusiness(
    estimatedAnnualIncome,
    businessType
  );
  const taxRate = getCorporateTaxRate(businessType, qualifiesForSmallBusiness);
  const estimatedTax = estimatedAnnualIncome * taxRate;

  // Use higher of current year estimate or 110% of previous year
  const requiredAnnualPayment = Math.max(estimatedTax, previousYearTax * 1.1);
  const quarterlyPayment = requiredAnnualPayment / 4;

  for (let quarter = 1; quarter <= 4; quarter++) {
    const quarterName = `Q${quarter}` as "Q1" | "Q2" | "Q3" | "Q4";

    // Calculate due dates (15th of 4th, 7th, 10th, and 1st months)
    const dueDateMonth =
      quarter === 1 ? 4 : quarter === 2 ? 7 : quarter === 3 ? 10 : 1;
    const dueDateYear = quarter === 4 ? currentYear + 1 : currentYear;
    const dueDate = new Date(dueDateYear, dueDateMonth - 1, 15);

    const cumulativePayments = quarterlyPayment * quarter;
    const balanceRemaining = requiredAnnualPayment - cumulativePayments;

    quarters.push({
      quarter: quarterName,
      year: currentYear,
      estimatedAnnualIncome,
      quarterlyTaxDue: Math.round(quarterlyPayment * 100) / 100,
      cumulativePayments: Math.round(cumulativePayments * 100) / 100,
      balanceRemaining: Math.round(balanceRemaining * 100) / 100,
      dueDate,
    });
  }

  return quarters;
}

/**
 * Calculate minimum tax for certain businesses
 */
export function calculateMinimumTax(
  grossIncome: number,
  businessType: BusinessType
): number {
  // Minimum tax applies to certain large businesses
  if (businessType === "banking" || businessType === "telecommunications") {
    return grossIncome * 0.002; // 0.2% of gross income
  }

  if (businessType === "mining") {
    return grossIncome * 0.001; // 0.1% of gross income
  }

  return 0; // No minimum tax for other businesses
}

/**
 * Calculate capital gains tax on asset disposals
 */
export function calculateCapitalGainsTax(
  salePrice: number,
  originalCost: number,
  improvementCosts,
  holdingPeriodYears: number,
  businessType: BusinessType
): {
  capitalGain: number;
  taxableGain: number;
  capitalGainsTax: number;
  exemption: number;
  effectiveRate: number;
} {
  const totalCost = originalCost + improvementCosts;
  const capitalGain = Math.max(0, salePrice - totalCost);

  // Apply holding period exemption (50% if held > 3 years for certain assets)
  let exemption = 0;
  if (holdingPeriodYears > 3 && businessType !== "mining") {
    exemption = capitalGain * 0.5;
  }

  const taxableGain = capitalGain - exemption;
  const taxRate = getCorporateTaxRate(businessType, false); // Use standard rate for capital gains
  const capitalGainsTax = taxableGain * taxRate;

  const effectiveRate = capitalGain > 0 ? capitalGainsTax / capitalGain : 0;

  return {
    capitalGain: Math.round(capitalGain * 100) / 100,
    taxableGain: Math.round(taxableGain * 100) / 100,
    capitalGainsTax: Math.round(capitalGainsTax * 100) / 100,
    exemption: Math.round(exemption * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 10_000) / 100,
  };
}

/**
 * Validate corporate tax calculation inputs
 */
export function validateCorporateTaxInput(input: CorporateTaxInput): string[] {
  const errors: string[] = [];

  if (input.grossIncome < 0) {
    errors.push("Gross income cannot be negative");
  }

  if (input.allowableDeductions < 0) {
    errors.push("Allowable deductions cannot be negative");
  }

  if (input.previousYearLosses && input.previousYearLosses < 0) {
    errors.push("Previous year losses cannot be negative");
  }

  if (input.capitalAllowances && input.capitalAllowances < 0) {
    errors.push("Capital allowances cannot be negative");
  }

  if (input.donationsToCharity && input.donationsToCharity < 0) {
    errors.push("Charitable donations cannot be negative");
  }

  if (input.advancePayments && input.advancePayments < 0) {
    errors.push("Advance payments cannot be negative");
  }

  if (input.withholdingTaxCredits && input.withholdingTaxCredits < 0) {
    errors.push("Withholding tax credits cannot be negative");
  }

  const validBusinessTypes: BusinessType[] = [
    "standard",
    "small_business",
    "manufacturing",
    "mining",
    "banking",
    "insurance",
    "telecommunications",
  ];
  if (!validBusinessTypes.includes(input.businessType)) {
    errors.push("Invalid business type");
  }

  if (input.accountingPeriod.startDate >= input.accountingPeriod.endDate) {
    errors.push("Accounting period start date must be before end date");
  }

  return errors;
}

/**
 * Calculate installment payment schedule
 */
export function calculateInstallmentSchedule(
  taxOwed: number,
  installments = 12,
  startDate: Date = new Date()
): Array<{
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  cumulativeAmount: number;
  balance: number;
}> {
  const monthlyAmount = taxOwed / installments;
  const schedule = [];

  for (let i = 1; i <= installments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    const cumulativeAmount = monthlyAmount * i;
    const balance = taxOwed - cumulativeAmount;

    schedule.push({
      installmentNumber: i,
      dueDate,
      amount: Math.round(monthlyAmount * 100) / 100,
      cumulativeAmount: Math.round(cumulativeAmount * 100) / 100,
      balance: Math.round(balance * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Compare tax liability across different business structures
 */
export function compareTaxStructures(
  income: number,
  deductions: number
): {
  corporation: CorporateTaxCalculation;
  smallBusiness: CorporateTaxCalculation;
  manufacturing: CorporateTaxCalculation;
  comparison: {
    bestOption: BusinessType;
    savings: number;
    effectiveRates: Record<BusinessType, number>;
  };
} {
  const baseInput = {
    grossIncome: income,
    allowableDeductions: deductions,
    accountingPeriod: {
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(new Date().getFullYear(), 11, 31),
      isFirstYear: false,
    },
  };

  const corporation = calculateCorporateTax({
    ...baseInput,
    businessType: "standard",
  });

  const smallBusiness = calculateCorporateTax({
    ...baseInput,
    businessType: "small_business",
  });

  const manufacturing = calculateCorporateTax({
    ...baseInput,
    businessType: "manufacturing",
  });

  const options = {
    standard: corporation,
    small_business: smallBusiness,
    manufacturing,
  };

  // Find the option with lowest tax
  const bestOption = Object.entries(options).reduce(
    (best, [type, calc]) =>
      calc.netTax < best.calc.netTax
        ? { type: type as BusinessType, calc }
        : best,
    { type: "standard" as BusinessType, calc: corporation }
  );

  const savings = corporation.netTax - bestOption.calc.netTax;

  const effectiveRates = Object.fromEntries(
    Object.entries(options).map(([type, calc]) => [type, calc.effectiveRate])
  ) as Record<BusinessType, number>;

  return {
    corporation,
    smallBusiness,
    manufacturing,
    comparison: {
      bestOption: bestOption.type,
      savings: Math.round(savings * 100) / 100,
      effectiveRates,
    },
  };
}
