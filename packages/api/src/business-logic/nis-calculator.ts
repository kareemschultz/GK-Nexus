import {
  convertToAnnual,
  convertToMonthly,
  NIS_CONSTANTS,
  type PaymentFrequency,
} from "./tax-constants";

/**
 * National Insurance Scheme (NIS) Calculator for Guyana
 * Implements contribution calculations with ceiling limits
 */

export type NisInput = {
  grossIncome: number;
  frequency: PaymentFrequency;
  isEmployer?: boolean;
  includeEmployerContribution?: boolean;
};

export type NisCalculation = {
  grossIncome: number;
  contributoryIncome: number;
  weeklyContributoryIncome: number;
  monthlyContributoryIncome: number;
  annualContributoryIncome: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  weeklyEmployeeContribution: number;
  monthlyEmployeeContribution: number;
  annualEmployeeContribution: number;
  weeklyEmployerContribution: number;
  monthlyEmployerContribution: number;
  annualEmployerContribution: number;
  exceedsWeeklyCeiling: boolean;
  exceededAmount: number;
  effectiveRate: number;
  metadata: {
    calculatedAt: Date;
    weeklyCeiling: number;
    monthlyCeiling: number;
    annualCeiling: number;
    employeeRate: number;
    employerRate: number;
  };
};

/**
 * Calculate NIS contributions based on gross income and frequency
 */
export function calculateNis(input: NisInput): NisCalculation {
  const {
    grossIncome,
    frequency,
    isEmployer = false,
    includeEmployerContribution = true,
  } = input;

  // Convert to all frequencies for comprehensive calculation
  const weeklyGrossIncome = convertToWeekly(grossIncome, frequency);
  const _monthlyGrossIncome = convertToMonthly(grossIncome, frequency);
  const _annualGrossIncome = convertToAnnual(grossIncome, frequency);

  // Apply weekly ceiling (NIS is calculated weekly)
  const weeklyContributoryIncome = Math.min(
    weeklyGrossIncome,
    NIS_CONSTANTS.WEEKLY_CEILING
  );
  const monthlyContributoryIncome = weeklyContributoryIncome * (52 / 12); // Convert to monthly
  const annualContributoryIncome = weeklyContributoryIncome * 52;

  // Check if income exceeds ceiling
  const exceedsWeeklyCeiling = weeklyGrossIncome > NIS_CONSTANTS.WEEKLY_CEILING;
  const exceededAmount = Math.max(
    0,
    weeklyGrossIncome - NIS_CONSTANTS.WEEKLY_CEILING
  );

  // Calculate contributions
  const weeklyEmployeeContribution =
    weeklyContributoryIncome * NIS_CONSTANTS.EMPLOYEE_RATE;
  const weeklyEmployerContribution =
    weeklyContributoryIncome * NIS_CONSTANTS.EMPLOYER_RATE;

  const monthlyEmployeeContribution = weeklyEmployeeContribution * (52 / 12);
  const monthlyEmployerContribution = weeklyEmployerContribution * (52 / 12);

  const annualEmployeeContribution = weeklyEmployeeContribution * 52;
  const annualEmployerContribution = weeklyEmployerContribution * 52;

  // Determine which contributions to include based on user type
  let employeeContribution: number;
  let employerContribution: number;
  let totalContribution: number;

  if (frequency === "weekly") {
    employeeContribution = weeklyEmployeeContribution;
    employerContribution = includeEmployerContribution
      ? weeklyEmployerContribution
      : 0;
  } else if (frequency === "monthly") {
    employeeContribution = monthlyEmployeeContribution;
    employerContribution = includeEmployerContribution
      ? monthlyEmployerContribution
      : 0;
  } else {
    employeeContribution = annualEmployeeContribution;
    employerContribution = includeEmployerContribution
      ? annualEmployerContribution
      : 0;
  }

  totalContribution = employeeContribution + employerContribution;

  // Calculate effective rate
  const contributoryIncomeForFrequency =
    frequency === "weekly"
      ? weeklyContributoryIncome
      : frequency === "monthly"
        ? monthlyContributoryIncome
        : annualContributoryIncome;

  const effectiveRate =
    contributoryIncomeForFrequency > 0
      ? totalContribution / contributoryIncomeForFrequency
      : 0;

  return {
    grossIncome,
    contributoryIncome: contributoryIncomeForFrequency,
    weeklyContributoryIncome,
    monthlyContributoryIncome,
    annualContributoryIncome,
    employeeContribution,
    employerContribution,
    totalContribution,
    weeklyEmployeeContribution,
    monthlyEmployeeContribution,
    annualEmployeeContribution,
    weeklyEmployerContribution,
    monthlyEmployerContribution,
    annualEmployerContribution,
    exceedsWeeklyCeiling,
    exceededAmount,
    effectiveRate,
    metadata: {
      calculatedAt: new Date(),
      weeklyCeiling: NIS_CONSTANTS.WEEKLY_CEILING,
      monthlyCeiling: NIS_CONSTANTS.MONTHLY_CEILING,
      annualCeiling: NIS_CONSTANTS.ANNUAL_CEILING,
      employeeRate: NIS_CONSTANTS.EMPLOYEE_RATE,
      employerRate: NIS_CONSTANTS.EMPLOYER_RATE,
    },
  };
}

/**
 * Convert amount to weekly frequency
 */
function convertToWeekly(amount: number, frequency: PaymentFrequency): number {
  switch (frequency) {
    case "weekly":
      return amount;
    case "bi-weekly":
      return amount / 2;
    case "monthly":
      return (amount * 12) / 52;
    case "annual":
      return amount / 52;
    default:
      throw new Error(`Unknown payment frequency: ${frequency}`);
  }
}

/**
 * Calculate employee-only NIS contribution
 */
export function calculateEmployeeNis(
  grossIncome: number,
  frequency: PaymentFrequency
): number {
  const calculation = calculateNis({
    grossIncome,
    frequency,
    isEmployer: false,
    includeEmployerContribution: false,
  });

  return calculation.employeeContribution;
}

/**
 * Calculate employer NIS contribution
 */
export function calculateEmployerNis(
  grossIncome: number,
  frequency: PaymentFrequency
): number {
  const calculation = calculateNis({
    grossIncome,
    frequency,
    isEmployer: true,
    includeEmployerContribution: false,
  });

  return calculation.employerContribution;
}

/**
 * Calculate total payroll NIS cost (employee + employer)
 */
export function calculateTotalPayrollNis(
  grossIncome: number,
  frequency: PaymentFrequency
): {
  employeeContribution: number;
  employerContribution: number;
  totalCost: number;
  employeeNetIncome: number;
} {
  const calculation = calculateNis({
    grossIncome,
    frequency,
    includeEmployerContribution: true,
  });

  return {
    employeeContribution: calculation.employeeContribution,
    employerContribution: calculation.employerContribution,
    totalCost: calculation.totalContribution,
    employeeNetIncome: grossIncome - calculation.employeeContribution,
  };
}

/**
 * Calculate NIS for self-employed person (pays both portions)
 */
export function calculateSelfEmployedNis(
  grossIncome: number,
  frequency: PaymentFrequency
): NisCalculation {
  const calculation = calculateNis({
    grossIncome,
    frequency,
    includeEmployerContribution: true,
  });

  // Self-employed pays both employee and employer portions
  const totalSelfEmployedContribution =
    calculation.employeeContribution + calculation.employerContribution;

  return {
    ...calculation,
    employeeContribution: totalSelfEmployedContribution,
    employerContribution: 0,
    totalContribution: totalSelfEmployedContribution,
  };
}

/**
 * Validate NIS calculation inputs
 */
export function validateNisInput(input: NisInput): string[] {
  const errors: string[] = [];

  if (input.grossIncome < 0) {
    errors.push("Gross income cannot be negative");
  }

  if (
    input.grossIncome > 0 &&
    input.grossIncome < convertToWeekly(NIS_CONSTANTS.MINIMUM_WAGE, "monthly")
  ) {
    errors.push(
      `Income is below minimum wage of ${NIS_CONSTANTS.MINIMUM_WAGE} GYD per month`
    );
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
 * Calculate annual NIS contribution summary for tax filing
 */
export function calculateAnnualNisSummary(
  payrollRecords: Array<{
    grossIncome: number;
    frequency: PaymentFrequency;
    payPeriod: Date;
  }>
): {
  totalGrossIncome: number;
  totalContributoryIncome: number;
  totalEmployeeContributions: number;
  totalEmployerContributions: number;
  totalContributions: number;
  averageWeeklyIncome: number;
  periodsExceedingCeiling: number;
  creditableYears: number;
} {
  let totalGrossIncome = 0;
  let totalContributoryIncome = 0;
  let totalEmployeeContributions = 0;
  let totalEmployerContributions = 0;
  let periodsExceedingCeiling = 0;

  for (const record of payrollRecords) {
    const calculation = calculateNis({
      grossIncome: record.grossIncome,
      frequency: record.frequency,
      includeEmployerContribution: true,
    });

    totalGrossIncome += convertToAnnual(record.grossIncome, record.frequency);
    totalContributoryIncome += calculation.annualContributoryIncome;
    totalEmployeeContributions += calculation.annualEmployeeContribution;
    totalEmployerContributions += calculation.annualEmployerContribution;

    if (calculation.exceedsWeeklyCeiling) {
      periodsExceedingCeiling++;
    }
  }

  const totalContributions =
    totalEmployeeContributions + totalEmployerContributions;
  const averageWeeklyIncome =
    payrollRecords.length > 0 ? totalGrossIncome / 52 : 0;

  // Creditable years calculation (simplified)
  const creditableYears =
    totalEmployeeContributions >=
    NIS_CONSTANTS.MINIMUM_WAGE * 12 * NIS_CONSTANTS.EMPLOYEE_RATE
      ? 1
      : 0;

  return {
    totalGrossIncome,
    totalContributoryIncome,
    totalEmployeeContributions,
    totalEmployerContributions,
    totalContributions,
    averageWeeklyIncome,
    periodsExceedingCeiling,
    creditableYears,
  };
}

/**
 * Calculate projected retirement benefits (simplified calculation)
 */
export function calculateProjectedRetirementBenefit(
  averageAnnualIncome: number,
  yearsOfContribution: number,
  _retirementAge = 65
): {
  monthlyPension: number;
  annualPension: number;
  totalContributions: number;
  replacementRatio: number;
} {
  // Simplified benefit formula - actual calculation is more complex
  const baseMonthlyIncome = Math.min(
    averageAnnualIncome / 12,
    NIS_CONSTANTS.MONTHLY_CEILING
  );
  const benefitPercentage = Math.min(0.6, 0.3 + yearsOfContribution * 0.01); // Max 60%

  const monthlyPension = baseMonthlyIncome * benefitPercentage;
  const annualPension = monthlyPension * 12;
  const totalContributions =
    averageAnnualIncome * NIS_CONSTANTS.EMPLOYEE_RATE * yearsOfContribution;
  const replacementRatio =
    averageAnnualIncome > 0 ? annualPension / averageAnnualIncome : 0;

  return {
    monthlyPension,
    annualPension,
    totalContributions,
    replacementRatio,
  };
}
