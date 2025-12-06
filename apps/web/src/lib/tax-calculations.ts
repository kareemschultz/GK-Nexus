/**
 * Guyana Tax Calculation Engine (2025 Budget Rules)
 * Implementation based on GK-Enterprise-Suite specifications
 */

// Guyana 2025 Tax Configuration Constants
export const GUYANA_TAX_CONFIG_2025 = {
  // PAYE Configuration
  PAYE: {
    STATUTORY_FREE_PAY: 130_000, // $130,000 GYD monthly (increased from $65k)
    TAX_BAND_1_LIMIT: 260_000, // First $260,000 of chargeable income
    TAX_BAND_1_RATE: 0.25, // 25% on first band
    TAX_BAND_2_RATE: 0.35, // 35% on remaining income above $260k
    CHILD_ALLOWANCE_PER_CHILD: 10_000, // $10,000 per child
    MAX_CHILD_ALLOWANCE_CHILDREN: 3, // Maximum 3 children
    OVERTIME_TAX_FREE_LIMIT: 50_000, // First $50k overtime monthly is tax-free
  },
  // NIS Configuration
  NIS: {
    EARNINGS_CEILING: 280_000, // $280,000 GYD monthly ceiling
    EMPLOYEE_RATE: 0.056, // 5.6% employee contribution
    EMPLOYER_RATE: 0.084, // 8.4% employer contribution
    MAX_EMPLOYEE_CONTRIBUTION: 15_680, // 5.6% of $280k
    MAX_EMPLOYER_CONTRIBUTION: 23_520, // 8.4% of $280k
  },
  // VAT Configuration (Updated Dec 2025 - verified against GRA)
  VAT: {
    STANDARD_RATE: 0.14, // 14% VAT rate for Guyana (official GRA rate)
  },
} as const;

export interface PayrollEmployee {
  id: string;
  firstName: string;
  lastName: string;
  nisNumber: string;
  basicSalary: number;
  overtime: number;
  allowances: number;
  bonuses: number;
  dependents: number; // Number of children for allowance
}

export interface PayeCalculationResult {
  employeeId: string;
  grossEarnings: number;
  statutoryFreePay: number;
  childAllowance: number;
  overtimeTaxFree: number;
  taxableIncome: number;
  taxBand1Amount: number;
  taxBand1Tax: number;
  taxBand2Amount: number;
  taxBand2Tax: number;
  totalPAYETax: number;
  nisableEarnings: number;
  employeeNISContribution: number;
  employerNISContribution: number;
  totalDeductions: number;
  netPay: number;
}

export interface PayrollRunSummary {
  employees: PayeCalculationResult[];
  totals: {
    totalGrossPay: number;
    totalNetPay: number;
    totalPAYE: number;
    totalEmployeeNIS: number;
    totalEmployerNIS: number;
    employeeCount: number;
  };
  generatedAt: Date;
}

/**
 * Calculate PAYE tax for an individual employee based on Guyana 2025 rates
 */
export function calculatePAYE(
  employee: PayrollEmployee
): PayeCalculationResult {
  const { PAYE, NIS } = GUYANA_TAX_CONFIG_2025;

  // Calculate gross earnings
  const grossEarnings =
    employee.basicSalary +
    employee.overtime +
    employee.allowances +
    employee.bonuses;

  // Calculate NIS-able earnings (capped at ceiling)
  const nisableEarnings = Math.min(grossEarnings, NIS.EARNINGS_CEILING);

  // Calculate NIS contributions
  const employeeNISContribution = Math.min(
    nisableEarnings * NIS.EMPLOYEE_RATE,
    NIS.MAX_EMPLOYEE_CONTRIBUTION
  );
  const employerNISContribution = Math.min(
    nisableEarnings * NIS.EMPLOYER_RATE,
    NIS.MAX_EMPLOYER_CONTRIBUTION
  );

  // Calculate child allowance (max 3 children)
  const eligibleChildren = Math.min(
    employee.dependents,
    PAYE.MAX_CHILD_ALLOWANCE_CHILDREN
  );
  const childAllowance = eligibleChildren * PAYE.CHILD_ALLOWANCE_PER_CHILD;

  // Calculate tax-free overtime portion
  const overtimeTaxFree = Math.min(
    employee.overtime,
    PAYE.OVERTIME_TAX_FREE_LIMIT
  );
  const taxableOvertime = employee.overtime - overtimeTaxFree;

  // Calculate taxable income
  // Formula: Gross - (Employee NIS + Statutory Free Pay + Child Allowance + Tax-free Overtime)
  const deductions =
    employeeNISContribution + PAYE.STATUTORY_FREE_PAY + childAllowance;
  const taxableIncome = Math.max(
    0,
    grossEarnings - deductions - overtimeTaxFree
  );

  // Calculate tax by bands
  let taxBand1Amount = 0;
  let taxBand1Tax = 0;
  let taxBand2Amount = 0;
  let taxBand2Tax = 0;

  if (taxableIncome > 0) {
    // Band 1: First $260,000 at 25%
    taxBand1Amount = Math.min(taxableIncome, PAYE.TAX_BAND_1_LIMIT);
    taxBand1Tax = taxBand1Amount * PAYE.TAX_BAND_1_RATE;

    // Band 2: Remaining amount above $260,000 at 35%
    if (taxableIncome > PAYE.TAX_BAND_1_LIMIT) {
      taxBand2Amount = taxableIncome - PAYE.TAX_BAND_1_LIMIT;
      taxBand2Tax = taxBand2Amount * PAYE.TAX_BAND_2_RATE;
    }
  }

  const totalPAYETax = taxBand1Tax + taxBand2Tax;
  const totalDeductions = employeeNISContribution + totalPAYETax;
  const netPay = grossEarnings - totalDeductions;

  return {
    employeeId: employee.id,
    grossEarnings,
    statutoryFreePay: PAYE.STATUTORY_FREE_PAY,
    childAllowance,
    overtimeTaxFree,
    taxableIncome,
    taxBand1Amount,
    taxBand1Tax,
    taxBand2Amount,
    taxBand2Tax,
    totalPAYETax,
    nisableEarnings,
    employeeNISContribution,
    employerNISContribution,
    totalDeductions,
    netPay,
  };
}

/**
 * Process payroll for multiple employees
 */
export function processPayroll(
  employees: PayrollEmployee[]
): PayrollRunSummary {
  const results = employees.map((employee) => calculatePAYE(employee));

  const totals = results.reduce(
    (acc, result) => ({
      totalGrossPay: acc.totalGrossPay + result.grossEarnings,
      totalNetPay: acc.totalNetPay + result.netPay,
      totalPAYE: acc.totalPAYE + result.totalPAYETax,
      totalEmployeeNIS: acc.totalEmployeeNIS + result.employeeNISContribution,
      totalEmployerNIS: acc.totalEmployerNIS + result.employerNISContribution,
      employeeCount: acc.employeeCount + 1,
    }),
    {
      totalGrossPay: 0,
      totalNetPay: 0,
      totalPAYE: 0,
      totalEmployeeNIS: 0,
      totalEmployerNIS: 0,
      employeeCount: 0,
    }
  );

  return {
    employees: results,
    totals,
    generatedAt: new Date(),
  };
}

/**
 * Validate NIS number format (Guyana requirements)
 * Format: 9 digits (A-1234567-B or 1234567)
 */
export function validateNISNumber(nisNumber: string): boolean {
  if (!nisNumber) return false;

  // Remove any spaces, hyphens, or non-alphanumeric characters for validation
  const cleaned = nisNumber.replace(/[^A-Z0-9]/gi, "");

  // Should be 9 characters after cleaning
  if (cleaned.length !== 9) return false;

  // Should be all numeric or alphanumeric
  return /^[A-Z0-9]{9}$/i.test(cleaned);
}

/**
 * Validate TIN number format (9 digits)
 */
export function validateTINNumber(tinNumber: string): boolean {
  if (!tinNumber) return false;

  // Remove any spaces, hyphens, or non-numeric characters
  const cleaned = tinNumber.replace(/\D/g, "");

  // Should be exactly 9 digits
  return cleaned.length === 9 && /^\d{9}$/.test(cleaned);
}

/**
 * Format currency for Guyana (GYD)
 */
export function formatGuyanacurrency(amount: number): string {
  return new Intl.NumberFormat("en-GY", {
    style: "currency",
    currency: "GYD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generate CSV data for GRA Form 7B (Year End Payroll)
 * Format: TIN, Last_Name, First_Name, Gross_Earnings, Tax_Deducted, NIS_Employee
 */
export function generateGRAForm7BCSV(
  payrollResults: PayeCalculationResult[],
  employees: PayrollEmployee[],
  employerTIN: string,
  year: number
): string {
  const headers = [
    "TIN",
    "Last_Name",
    "First_Name",
    "Gross_Earnings",
    "Tax_Deducted",
    "NIS_Employee",
  ];

  const rows = payrollResults
    .map((result) => {
      const employee = employees.find((emp) => emp.id === result.employeeId);
      if (!employee) return "";

      return [
        employerTIN,
        employee.lastName,
        employee.firstName,
        result.grossEarnings.toFixed(2),
        result.totalPAYETax.toFixed(2),
        result.employeeNISContribution.toFixed(2),
      ].join(",");
    })
    .filter((row) => row !== "");

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Generate NIS CS3 Schedule data (fixed-width format)
 */
export function generateNISCS3Schedule(
  payrollResults: PayeCalculationResult[],
  employees: PayrollEmployee[],
  employerNISNumber: string,
  periodMonth: number,
  periodYear: number
): string {
  // This would generate the fixed-width format required by esched.nis.org.gy
  // Implementation would depend on specific NIS formatting requirements

  const lines: string[] = [];

  // Header line (example format)
  lines.push(
    `NIS${employerNISNumber}${periodMonth.toString().padStart(2, "0")}${periodYear}`
  );

  // Employee lines
  payrollResults.forEach((result) => {
    const employee = employees.find((emp) => emp.id === result.employeeId);
    if (!employee) return;

    // Format: NIS_Number, Earnings, Employee_Contribution, Employer_Contribution
    const line = [
      employee.nisNumber.padEnd(15),
      result.nisableEarnings.toFixed(2).padStart(12),
      result.employeeNISContribution.toFixed(2).padStart(10),
      result.employerNISContribution.toFixed(2).padStart(10),
    ].join("");

    lines.push(line);
  });

  return lines.join("\n");
}

/**
 * Calculate VAT for Guyana (14% standard rate per GRA)
 */
export interface VATCalculation {
  totalSales: number;
  standardRatedSales: number;
  zeroRatedSales: number;
  exemptSales: number;
  outputVAT: number;
  totalPurchases: number;
  standardRatedPurchases: number;
  inputVAT: number;
  netVAT: number;
  adjustments?: number;
  totalVATDue: number;
}

export function calculateVAT(
  standardRatedSales: number,
  zeroRatedSales = 0,
  exemptSales = 0,
  standardRatedPurchases = 0,
  adjustments = 0
): VATCalculation {
  const { VAT } = GUYANA_TAX_CONFIG_2025;

  const totalSales = standardRatedSales + zeroRatedSales + exemptSales;
  const outputVAT = standardRatedSales * VAT.STANDARD_RATE;

  const totalPurchases = standardRatedPurchases; // Simplified for this example
  const inputVAT = standardRatedPurchases * VAT.STANDARD_RATE;

  const netVAT = outputVAT - inputVAT;
  const totalVATDue = netVAT + adjustments;

  return {
    totalSales,
    standardRatedSales,
    zeroRatedSales,
    exemptSales,
    outputVAT,
    totalPurchases,
    standardRatedPurchases,
    inputVAT,
    netVAT,
    adjustments,
    totalVATDue,
  };
}
