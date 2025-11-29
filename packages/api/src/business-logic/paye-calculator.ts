import {
  convertToAnnual,
  convertToMonthly,
  PAYE_CONSTANTS,
  type PaymentFrequency,
  type TaxBracket,
} from "./tax-constants";

/**
 * PAYE (Pay As You Earn) Tax Calculator for Guyana
 * Implements the 2025 tax brackets and calculations
 */

export type PayeInput = {
  grossIncome: number;
  frequency: PaymentFrequency;
  allowableDeductions?: number;
  taxCredits?: number;
  previousTaxPaid?: number;
};

export type PayeCalculation = {
  grossIncome: number;
  monthlyGrossIncome: number;
  annualGrossIncome: number;
  allowableDeductions: number;
  taxableIncome: number;
  monthlyTaxableIncome: number;
  annualTaxableIncome: number;
  monthlyTax: number;
  annualTax: number;
  effectiveRate: number;
  marginalRate: number;
  taxCredits: number;
  netTaxOwed: number;
  netMonthlyIncome: number;
  netAnnualIncome: number;
  bracketBreakdown: TaxBracketCalculation[];
  metadata: {
    calculatedAt: Date;
    taxYear: number;
    statutoryFreePay: number;
  };
};

export type TaxBracketCalculation = {
  bracket: TaxBracket;
  taxableAmount: number;
  taxOwed: number;
};

/**
 * Calculate PAYE tax based on gross income and frequency
 */
export function calculatePaye(input: PayeInput): PayeCalculation {
  const {
    grossIncome,
    frequency,
    allowableDeductions = 0,
    taxCredits = 0,
    previousTaxPaid = 0,
  } = input;

  // Convert all amounts to monthly and annual for consistent calculations
  const monthlyGrossIncome = convertToMonthly(grossIncome, frequency);
  const annualGrossIncome = convertToAnnual(grossIncome, frequency);
  const monthlyAllowableDeductions = convertToMonthly(
    allowableDeductions,
    frequency
  );
  const annualAllowableDeductions = convertToAnnual(
    allowableDeductions,
    frequency
  );

  // Calculate taxable income after deductions
  const monthlyTaxableIncome = Math.max(
    0,
    monthlyGrossIncome - monthlyAllowableDeductions
  );
  const annualTaxableIncome = Math.max(
    0,
    annualGrossIncome - annualAllowableDeductions
  );

  // Calculate tax using annual brackets (more accurate)
  const annualTaxCalculation = calculateTaxFromBrackets(
    annualTaxableIncome,
    PAYE_CONSTANTS.ANNUAL_BRACKETS
  );

  const annualTax = annualTaxCalculation.totalTax;
  const monthlyTax = annualTax / 12;

  // Calculate effective and marginal rates
  const effectiveRate =
    annualTaxableIncome > 0 ? annualTax / annualTaxableIncome : 0;
  const marginalRate = getMarginalRate(
    annualTaxableIncome,
    PAYE_CONSTANTS.ANNUAL_BRACKETS
  );

  // Apply tax credits and previous payments
  const netTaxOwed = Math.max(0, annualTax - taxCredits - previousTaxPaid);
  const netMonthlyIncome = monthlyGrossIncome - (monthlyTax - taxCredits / 12);
  const netAnnualIncome = annualGrossIncome - netTaxOwed;

  return {
    grossIncome,
    monthlyGrossIncome,
    annualGrossIncome,
    allowableDeductions,
    taxableIncome:
      frequency === "annual" ? annualTaxableIncome : monthlyTaxableIncome,
    monthlyTaxableIncome,
    annualTaxableIncome,
    monthlyTax,
    annualTax,
    effectiveRate,
    marginalRate,
    taxCredits,
    netTaxOwed,
    netMonthlyIncome,
    netAnnualIncome,
    bracketBreakdown: annualTaxCalculation.bracketBreakdown,
    metadata: {
      calculatedAt: new Date(),
      taxYear: 2025,
      statutoryFreePay: PAYE_CONSTANTS.ANNUAL_STATUTORY_FREE_PAY,
    },
  };
}

/**
 * Calculate tax from progressive tax brackets
 */
function calculateTaxFromBrackets(
  taxableIncome: number,
  brackets: readonly TaxBracket[]
): { totalTax: number; bracketBreakdown: TaxBracketCalculation[] } {
  let totalTax = 0;
  const bracketBreakdown: TaxBracketCalculation[] = [];

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) {
      // Income is below this bracket
      bracketBreakdown.push({
        bracket,
        taxableAmount: 0,
        taxOwed: 0,
      });
      continue;
    }

    // Calculate taxable amount in this bracket
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    const taxInBracket = taxableInBracket * bracket.rate;

    totalTax += taxInBracket;
    bracketBreakdown.push({
      bracket,
      taxableAmount: taxableInBracket,
      taxOwed: taxInBracket,
    });

    if (taxableIncome <= bracket.max) {
      break; // We've covered all the income
    }
  }

  return { totalTax, bracketBreakdown };
}

/**
 * Get the marginal tax rate for a given income level
 */
function getMarginalRate(
  taxableIncome: number,
  brackets: readonly TaxBracket[]
): number {
  for (const bracket of brackets) {
    if (taxableIncome >= bracket.min && taxableIncome < bracket.max) {
      return bracket.rate;
    }
  }

  // If income exceeds all brackets, return the highest rate
  return brackets.at(-1)?.rate ?? 0;
}

/**
 * Calculate monthly PAYE withholding for payroll processing
 */
export function calculateMonthlyPayeWithholding(
  monthlyGrossIncome: number,
  allowableDeductions = 0
): number {
  const calculation = calculatePaye({
    grossIncome: monthlyGrossIncome,
    frequency: "monthly",
    allowableDeductions,
  });

  return calculation.monthlyTax;
}

/**
 * Calculate annual PAYE liability for tax filing
 */
export function calculateAnnualPayeLiability(
  annualGrossIncome: number,
  allowableDeductions = 0,
  taxCredits = 0,
  previousTaxPaid = 0
): PayeCalculation {
  return calculatePaye({
    grossIncome: annualGrossIncome,
    frequency: "annual",
    allowableDeductions,
    taxCredits,
    previousTaxPaid,
  });
}

/**
 * Validate PAYE calculation inputs
 */
export function validatePayeInput(input: PayeInput): string[] {
  const errors: string[] = [];

  if (input.grossIncome < 0) {
    errors.push("Gross income cannot be negative");
  }

  if (input.allowableDeductions && input.allowableDeductions < 0) {
    errors.push("Allowable deductions cannot be negative");
  }

  if (input.taxCredits && input.taxCredits < 0) {
    errors.push("Tax credits cannot be negative");
  }

  if (input.previousTaxPaid && input.previousTaxPaid < 0) {
    errors.push("Previous tax paid cannot be negative");
  }

  const validFrequencies: PaymentFrequency[] = [
    "weekly",
    "bi-weekly",
    "monthly",
    "annual",
  ];
  if (!validFrequencies.includes(input.frequency)) {
    errors.push("Invalid payment frequency");
  }

  return errors;
}

/**
 * Calculate PAYE for multiple income sources
 */
export function calculatePayeMultipleIncome(
  incomes: PayeInput[]
): PayeCalculation {
  // Convert all to annual and sum
  let totalAnnualGross = 0;
  let totalAnnualDeductions = 0;
  let totalTaxCredits = 0;
  let totalPreviousTaxPaid = 0;

  for (const income of incomes) {
    totalAnnualGross += convertToAnnual(income.grossIncome, income.frequency);
    totalAnnualDeductions += convertToAnnual(
      income.allowableDeductions || 0,
      income.frequency
    );
    totalTaxCredits += income.taxCredits || 0;
    totalPreviousTaxPaid += income.previousTaxPaid || 0;
  }

  return calculatePaye({
    grossIncome: totalAnnualGross,
    frequency: "annual",
    allowableDeductions: totalAnnualDeductions,
    taxCredits: totalTaxCredits,
    previousTaxPaid: totalPreviousTaxPaid,
  });
}

/**
 * Calculate tax savings from additional deductions
 */
export function calculateTaxSavings(
  grossIncome: number,
  frequency: PaymentFrequency,
  currentDeductions: number,
  additionalDeductions: number
): {
  currentTax: number;
  newTax: number;
  savings: number;
  effectiveReduction: number;
} {
  const currentCalc = calculatePaye({
    grossIncome,
    frequency,
    allowableDeductions: currentDeductions,
  });

  const newCalc = calculatePaye({
    grossIncome,
    frequency,
    allowableDeductions: currentDeductions + additionalDeductions,
  });

  const annualCurrentTax =
    frequency === "annual" ? currentCalc.annualTax : currentCalc.annualTax;
  const annualNewTax =
    frequency === "annual" ? newCalc.annualTax : newCalc.annualTax;
  const savings = annualCurrentTax - annualNewTax;
  const effectiveReduction =
    additionalDeductions > 0 ? savings / additionalDeductions : 0;

  return {
    currentTax: annualCurrentTax,
    newTax: annualNewTax,
    savings,
    effectiveReduction,
  };
}
