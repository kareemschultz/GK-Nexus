import { WITHHOLDING_TAX_CONSTANTS } from "./tax-constants";

/**
 * Withholding Tax (7B Form) Calculator for Guyana
 * Implements withholding tax calculations on various payment types
 */

export type WithholdingTaxType =
  | "dividend"
  | "interest"
  | "royalty"
  | "rent"
  | "professional_services"
  | "management_fees"
  | "technical_services"
  | "commission"
  | "other";

export type PayeeType = "resident" | "non_resident" | "company" | "individual";

export type WithholdingTaxInput = {
  grossAmount: number;
  taxType: WithholdingTaxType;
  payeeType: PayeeType;
  payeeName: string;
  payeeTin?: string;
  paymentDate: Date;
  customRate?: number;
  treatyCountry?: string;
  isExempt?: boolean;
  exemptionReason?: string;
};

export type WithholdingTaxCalculation = {
  grossAmount: number;
  witholdingTaxRate: number;
  withholdingTax: number;
  netAmount: number;
  taxType: WithholdingTaxType;
  payeeType: PayeeType;
  payeeName: string;
  payeeTin?: string;
  paymentDate: Date;
  isSubjectToWithholding: boolean;
  isExempt: boolean;
  exemptionReason?: string;
  treatyReduction?: number;
  formRequired: boolean;
  dueDate: Date;
  metadata: {
    calculatedAt: Date;
    threshold: number;
    standardRates: Record<WithholdingTaxType, number>;
  };
};

export type MonthlyWithholdingReturn = {
  month: number;
  year: number;
  transactions: WithholdingTaxCalculation[];
  totalGrossPayments: number;
  totalWithholdingTax: number;
  totalNetPayments: number;
  dueDate: Date;
  isLate: boolean;
  penalties: number;
  totalDue: number;
  exemptTransactions: WithholdingTaxCalculation[];
  payeeBreakdown: Array<{
    payeeName: string;
    payeeTin?: string;
    totalGross: number;
    totalWithholding: number;
    transactionCount: number;
  }>;
};

/**
 * Calculate withholding tax on a single payment
 */
export function calculateWithholdingTax(
  input: WithholdingTaxInput
): WithholdingTaxCalculation {
  const {
    grossAmount,
    taxType,
    payeeType,
    payeeName,
    payeeTin,
    paymentDate,
    customRate,
    treatyCountry,
    isExempt = false,
    exemptionReason,
  } = input;

  // Check if payment is subject to withholding
  const isSubjectToWithholding =
    grossAmount >= WITHHOLDING_TAX_CONSTANTS.THRESHOLD && !isExempt;

  // Determine withholding rate
  let withholdingTaxRate = 0;
  if (isSubjectToWithholding) {
    if (customRate !== undefined) {
      withholdingTaxRate = customRate;
    } else {
      withholdingTaxRate = getWithholdingTaxRate(taxType, payeeType);

      // Apply treaty reduction if applicable
      const treatyReduction = getTreatyReduction(treatyCountry, taxType);
      withholdingTaxRate = Math.max(0, withholdingTaxRate - treatyReduction);
    }
  }

  // Calculate withholding tax
  const withholdingTax = isSubjectToWithholding
    ? grossAmount * withholdingTaxRate
    : 0;
  const netAmount = grossAmount - withholdingTax;

  // Determine if form is required (always required if withholding applies)
  const formRequired =
    isSubjectToWithholding ||
    grossAmount >= WITHHOLDING_TAX_CONSTANTS.THRESHOLD;

  // Calculate due date (15th of following month)
  const dueDate = new Date(paymentDate);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(15);

  return {
    grossAmount: Math.round(grossAmount * 100) / 100,
    witholdingTaxRate: Math.round(withholdingTaxRate * 10_000) / 100, // Percentage with 2 decimal places
    withholdingTax: Math.round(withholdingTax * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    taxType,
    payeeType,
    payeeName,
    payeeTin,
    paymentDate,
    isSubjectToWithholding,
    isExempt,
    exemptionReason,
    treatyReduction: treatyCountry
      ? getTreatyReduction(treatyCountry, taxType)
      : undefined,
    formRequired,
    dueDate,
    metadata: {
      calculatedAt: new Date(),
      threshold: WITHHOLDING_TAX_CONSTANTS.THRESHOLD,
      standardRates: {
        dividend: WITHHOLDING_TAX_CONSTANTS.DIVIDEND_RATE,
        interest: WITHHOLDING_TAX_CONSTANTS.INTEREST_RATE,
        royalty: WITHHOLDING_TAX_CONSTANTS.ROYALTY_RATE,
        rent: WITHHOLDING_TAX_CONSTANTS.RENT_RATE,
        professional_services:
          WITHHOLDING_TAX_CONSTANTS.PROFESSIONAL_SERVICES_RATE,
        management_fees: WITHHOLDING_TAX_CONSTANTS.STANDARD_RATE,
        technical_services: WITHHOLDING_TAX_CONSTANTS.STANDARD_RATE,
        commission: WITHHOLDING_TAX_CONSTANTS.STANDARD_RATE,
        other: WITHHOLDING_TAX_CONSTANTS.STANDARD_RATE,
      },
    },
  };
}

/**
 * Get withholding tax rate based on payment type and payee type
 */
function getWithholdingTaxRate(
  taxType: WithholdingTaxType,
  payeeType: PayeeType
): number {
  // Non-residents generally have higher rates
  const nonResidentMultiplier = payeeType === "non_resident" ? 1.25 : 1; // 25% increase for non-residents

  let baseRate: number;
  switch (taxType) {
    case "dividend":
      baseRate = WITHHOLDING_TAX_CONSTANTS.DIVIDEND_RATE;
      break;
    case "interest":
      baseRate = WITHHOLDING_TAX_CONSTANTS.INTEREST_RATE;
      break;
    case "royalty":
      baseRate = WITHHOLDING_TAX_CONSTANTS.ROYALTY_RATE;
      break;
    case "rent":
      baseRate = WITHHOLDING_TAX_CONSTANTS.RENT_RATE;
      break;
    case "professional_services":
      baseRate = WITHHOLDING_TAX_CONSTANTS.PROFESSIONAL_SERVICES_RATE;
      break;
    case "management_fees":
    case "technical_services":
    case "commission":
    case "other":
      baseRate = WITHHOLDING_TAX_CONSTANTS.STANDARD_RATE;
      break;
    default:
      baseRate = WITHHOLDING_TAX_CONSTANTS.STANDARD_RATE;
  }

  return Math.min(0.4, baseRate * nonResidentMultiplier); // Cap at 40%
}

/**
 * Get treaty reduction for specific countries and payment types
 */
function getTreatyReduction(
  treatyCountry?: string,
  taxType?: WithholdingTaxType
): number {
  if (!treatyCountry) {
    return 0;
  }

  // Simplified treaty reductions - actual treaties would have specific provisions
  const treatyReductions: Record<
    string,
    Partial<Record<WithholdingTaxType, number>>
  > = {
    canada: {
      dividend: 0.05, // 5% reduction
      interest: 0.1, // 10% reduction
      royalty: 0.05,
    },
    united_kingdom: {
      dividend: 0.05,
      interest: 0.1,
      royalty: 0.05,
    },
    barbados: {
      dividend: 0.1,
      interest: 0.15,
      royalty: 0.1,
    },
    trinidad_tobago: {
      dividend: 0.1,
      interest: 0.1,
      royalty: 0.1,
    },
  };

  const countryReductions = treatyReductions[treatyCountry.toLowerCase()];
  if (!(countryReductions && taxType)) {
    return 0;
  }

  return countryReductions[taxType] || 0;
}

/**
 * Calculate monthly withholding tax return
 */
export function calculateMonthlyWithholdingReturn(
  transactions: WithholdingTaxCalculation[],
  month: number,
  year: number
): MonthlyWithholdingReturn {
  // Filter transactions for the specific month
  const monthTransactions = transactions.filter((transaction) => {
    const transactionMonth = transaction.paymentDate.getMonth() + 1;
    const transactionYear = transaction.paymentDate.getFullYear();
    return transactionMonth === month && transactionYear === year;
  });

  // Separate exempt and taxable transactions
  const exemptTransactions = monthTransactions.filter((t) => t.isExempt);
  const taxableTransactions = monthTransactions.filter((t) => !t.isExempt);

  // Calculate totals
  const totalGrossPayments = monthTransactions.reduce(
    (sum, t) => sum + t.grossAmount,
    0
  );
  const totalWithholdingTax = taxableTransactions.reduce(
    (sum, t) => sum + t.withholdingTax,
    0
  );
  const totalNetPayments = monthTransactions.reduce(
    (sum, t) => sum + t.netAmount,
    0
  );

  // Calculate due date (15th of following month)
  const dueDate = new Date(year, month, 15);

  // Check if late
  const isLate = new Date() > dueDate;

  // Calculate penalties (simplified)
  let penalties = 0;
  if (isLate && totalWithholdingTax > 0) {
    const daysLate = Math.ceil(
      (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const monthsLate = Math.ceil(daysLate / 30);
    penalties = totalWithholdingTax * 0.05 * monthsLate; // 5% per month
  }

  const totalDue = totalWithholdingTax + penalties;

  // Create payee breakdown
  const payeeMap = new Map<
    string,
    {
      payeeName: string;
      payeeTin?: string;
      totalGross: number;
      totalWithholding: number;
      transactionCount: number;
    }
  >();

  for (const transaction of monthTransactions) {
    const key = `${transaction.payeeName}-${transaction.payeeTin || "no-tin"}`;
    const existing = payeeMap.get(key);

    if (existing) {
      existing.totalGross += transaction.grossAmount;
      existing.totalWithholding += transaction.withholdingTax;
      existing.transactionCount++;
    } else {
      payeeMap.set(key, {
        payeeName: transaction.payeeName,
        payeeTin: transaction.payeeTin,
        totalGross: transaction.grossAmount,
        totalWithholding: transaction.withholdingTax,
        transactionCount: 1,
      });
    }
  }

  const payeeBreakdown = Array.from(payeeMap.values()).map((payee) => ({
    ...payee,
    totalGross: Math.round(payee.totalGross * 100) / 100,
    totalWithholding: Math.round(payee.totalWithholding * 100) / 100,
  }));

  return {
    month,
    year,
    transactions: monthTransactions,
    totalGrossPayments: Math.round(totalGrossPayments * 100) / 100,
    totalWithholdingTax: Math.round(totalWithholdingTax * 100) / 100,
    totalNetPayments: Math.round(totalNetPayments * 100) / 100,
    dueDate,
    isLate,
    penalties: Math.round(penalties * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    exemptTransactions,
    payeeBreakdown,
  };
}

/**
 * Calculate withholding tax on multiple payments
 */
export function calculateBulkWithholdingTax(inputs: WithholdingTaxInput[]): {
  calculations: WithholdingTaxCalculation[];
  summary: {
    totalGrossPayments: number;
    totalWithholdingTax: number;
    totalNetPayments: number;
    exemptPayments: number;
    subjectToWithholding: number;
    averageWithholdingRate: number;
  };
} {
  const calculations = inputs.map((input) => calculateWithholdingTax(input));

  const subjectToWithholding = calculations.filter(
    (c) => c.isSubjectToWithholding
  );
  const exemptPayments = calculations.filter((c) => c.isExempt);

  const totalGrossPayments = calculations.reduce(
    (sum, c) => sum + c.grossAmount,
    0
  );
  const totalWithholdingTax = calculations.reduce(
    (sum, c) => sum + c.withholdingTax,
    0
  );
  const totalNetPayments = calculations.reduce(
    (sum, c) => sum + c.netAmount,
    0
  );

  const averageWithholdingRate =
    totalGrossPayments > 0 ? totalWithholdingTax / totalGrossPayments : 0;

  return {
    calculations,
    summary: {
      totalGrossPayments: Math.round(totalGrossPayments * 100) / 100,
      totalWithholdingTax: Math.round(totalWithholdingTax * 100) / 100,
      totalNetPayments: Math.round(totalNetPayments * 100) / 100,
      exemptPayments: exemptPayments.length,
      subjectToWithholding: subjectToWithholding.length,
      averageWithholdingRate: Math.round(averageWithholdingRate * 10_000) / 100,
    },
  };
}

/**
 * Validate withholding tax calculation inputs
 */
export function validateWithholdingTaxInput(
  input: WithholdingTaxInput
): string[] {
  const errors: string[] = [];

  if (input.grossAmount < 0) {
    errors.push("Gross amount cannot be negative");
  }

  if (!input.payeeName || input.payeeName.trim().length === 0) {
    errors.push("Payee name is required");
  }

  const validTaxTypes: WithholdingTaxType[] = [
    "dividend",
    "interest",
    "royalty",
    "rent",
    "professional_services",
    "management_fees",
    "technical_services",
    "commission",
    "other",
  ];
  if (!validTaxTypes.includes(input.taxType)) {
    errors.push("Invalid withholding tax type");
  }

  const validPayeeTypes: PayeeType[] = [
    "resident",
    "non_resident",
    "company",
    "individual",
  ];
  if (!validPayeeTypes.includes(input.payeeType)) {
    errors.push("Invalid payee type");
  }

  if (
    input.customRate !== undefined &&
    (input.customRate < 0 || input.customRate > 1)
  ) {
    errors.push("Custom withholding rate must be between 0 and 100%");
  }

  if (input.paymentDate > new Date()) {
    errors.push("Payment date cannot be in the future");
  }

  return errors;
}

/**
 * Generate withholding tax certificate
 */
export function generateWithholdingTaxCertificate(
  calculation: WithholdingTaxCalculation,
  payerDetails: {
    name: string;
    tin: string;
    address: string;
  }
): {
  certificateNumber: string;
  issueDate: Date;
  payerDetails: typeof payerDetails;
  payeeDetails: {
    name: string;
    tin?: string;
  };
  paymentDetails: {
    date: Date;
    grossAmount: number;
    withholdingTax: number;
    netAmount: number;
    taxType: WithholdingTaxType;
    rate: number;
  };
  declaration: string;
} {
  const certificateNumber = `WHT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  return {
    certificateNumber,
    issueDate: new Date(),
    payerDetails,
    payeeDetails: {
      name: calculation.payeeName,
      tin: calculation.payeeTin,
    },
    paymentDetails: {
      date: calculation.paymentDate,
      grossAmount: calculation.grossAmount,
      withholdingTax: calculation.withholdingTax,
      netAmount: calculation.netAmount,
      taxType: calculation.taxType,
      rate: calculation.witholdingTaxRate,
    },
    declaration:
      "This certificate confirms that withholding tax has been deducted from the above payment in accordance with the Income Tax Act of Guyana.",
  };
}

/**
 * Check compliance status for withholding tax filings
 */
export function checkWithholdingTaxCompliance(
  transactions: WithholdingTaxCalculation[],
  currentDate: Date = new Date()
): {
  totalOverdue: number;
  overdueMonths: Array<{
    month: number;
    year: number;
    dueDate: Date;
    daysOverdue: number;
    amount: number;
  }>;
  complianceScore: number;
  recommendations: string[];
} {
  const monthlyReturns = new Map<string, MonthlyWithholdingReturn>();

  // Group transactions by month
  for (const transaction of transactions) {
    const month = transaction.paymentDate.getMonth() + 1;
    const year = transaction.paymentDate.getFullYear();
    const key = `${year}-${month.toString().padStart(2, "0")}`;

    if (!monthlyReturns.has(key)) {
      const monthlyReturn = calculateMonthlyWithholdingReturn(
        transactions,
        month,
        year
      );
      monthlyReturns.set(key, monthlyReturn);
    }
  }

  const overdueMonths = Array.from(monthlyReturns.values())
    .filter(
      (monthlyReturn) =>
        monthlyReturn.dueDate < currentDate &&
        monthlyReturn.totalWithholdingTax > 0
    )
    .map((monthlyReturn) => {
      const daysOverdue = Math.ceil(
        (currentDate.getTime() - monthlyReturn.dueDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return {
        month: monthlyReturn.month,
        year: monthlyReturn.year,
        dueDate: monthlyReturn.dueDate,
        daysOverdue,
        amount: monthlyReturn.totalDue,
      };
    });

  const totalOverdue = overdueMonths.reduce(
    (sum, month) => sum + month.amount,
    0
  );

  // Calculate compliance score (0-100)
  const totalMonths = monthlyReturns.size;
  const overdueCount = overdueMonths.length;
  const complianceScore =
    totalMonths > 0
      ? Math.max(0, 100 - (overdueCount / totalMonths) * 100)
      : 100;

  // Generate recommendations
  const recommendations: string[] = [];
  if (overdueCount > 0) {
    recommendations.push(
      `File ${overdueCount} overdue withholding tax return(s) immediately.`
    );
    recommendations.push(
      "Set up automatic reminders for monthly filing deadlines."
    );
  }
  if (complianceScore < 80) {
    recommendations.push(
      "Implement better record-keeping and filing procedures."
    );
  }
  if (totalOverdue > 0) {
    recommendations.push(
      `Pay outstanding withholding tax liability of ${totalOverdue.toFixed(2)} GYD.`
    );
  }

  return {
    totalOverdue: Math.round(totalOverdue * 100) / 100,
    overdueMonths,
    complianceScore: Math.round(complianceScore),
    recommendations,
  };
}
