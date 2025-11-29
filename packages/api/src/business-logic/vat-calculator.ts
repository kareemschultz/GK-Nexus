import { VAT_CONSTANTS } from "./tax-constants";

/**
 * Value Added Tax (VAT) Calculator for Guyana
 * Implements 14% VAT calculations with exemptions and zero-ratings
 */

export type VatCategory = "standard" | "zero-rated" | "exempt";
export type VatTransactionType = "sale" | "purchase" | "import" | "export";

export type VatInput = {
  amount: number;
  category: VatCategory;
  transactionType: VatTransactionType;
  description?: string;
  includesVat?: boolean;
  customRate?: number;
};

export type VatCalculation = {
  grossAmount: number;
  netAmount: number;
  vatAmount: number;
  vatRate: number;
  category: VatCategory;
  transactionType: VatTransactionType;
  includesVat: boolean;
  isRegisterable: boolean;
  description?: string;
  metadata: {
    calculatedAt: Date;
    standardRate: number;
    registrationThreshold: number;
  };
};

export type VatReturn = {
  period: {
    startDate: Date;
    endDate: Date;
  };
  outputVat: number;
  inputVat: number;
  netVat: number;
  turnover: number;
  purchases: number;
  transactions: VatCalculation[];
  isRefundDue: boolean;
  penaltiesAndInterest: number;
  totalDue: number;
  metadata: {
    calculatedAt: Date;
    dueDate: Date;
    isLate: boolean;
  };
};

/**
 * Calculate VAT on a single transaction
 */
export function calculateVat(input: VatInput): VatCalculation {
  const {
    amount,
    category,
    transactionType,
    description,
    includesVat = false,
    customRate,
  } = input;

  // Determine VAT rate
  let vatRate: number;
  if (customRate !== undefined) {
    vatRate = customRate;
  } else {
    vatRate = getVatRate(category);
  }

  // Calculate amounts
  let grossAmount: number;
  let netAmount: number;
  let vatAmount: number;

  if (includesVat) {
    // Amount includes VAT - extract it
    grossAmount = amount;
    netAmount = amount / (1 + vatRate);
    vatAmount = grossAmount - netAmount;
  } else {
    // Amount excludes VAT - add it
    netAmount = amount;
    vatAmount = amount * vatRate;
    grossAmount = netAmount + vatAmount;
  }

  // Check if transaction qualifies for VAT registration
  const isRegisterable = netAmount >= VAT_CONSTANTS.REGISTRATION_THRESHOLD / 12; // Monthly check

  return {
    grossAmount: Math.round(grossAmount * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    vatRate,
    category,
    transactionType,
    includesVat,
    isRegisterable,
    description,
    metadata: {
      calculatedAt: new Date(),
      standardRate: VAT_CONSTANTS.STANDARD_RATE,
      registrationThreshold: VAT_CONSTANTS.REGISTRATION_THRESHOLD,
    },
  };
}

/**
 * Get VAT rate based on category
 */
function getVatRate(category: VatCategory): number {
  switch (category) {
    case "standard":
      return VAT_CONSTANTS.STANDARD_RATE;
    case "zero-rated":
      return 0;
    case "exempt":
      return 0;
    default:
      throw new Error(`Unknown VAT category: ${category}`);
  }
}

/**
 * Calculate VAT return for a period
 */
export function calculateVatReturn(
  transactions: VatCalculation[],
  periodStart: Date,
  periodEnd: Date,
  previousBalance = 0
): VatReturn {
  let outputVat = 0;
  let inputVat = 0;
  let turnover = 0;
  let purchases = 0;

  // Filter transactions by period
  const periodTransactions = transactions.filter(
    (transaction) =>
      transaction.metadata.calculatedAt >= periodStart &&
      transaction.metadata.calculatedAt <= periodEnd
  );

  // Calculate totals
  for (const transaction of periodTransactions) {
    if (
      transaction.transactionType === "sale" ||
      transaction.transactionType === "export"
    ) {
      outputVat += transaction.vatAmount;
      turnover += transaction.netAmount;
    } else if (
      transaction.transactionType === "purchase" ||
      transaction.transactionType === "import"
    ) {
      inputVat += transaction.vatAmount;
      purchases += transaction.netAmount;
    }
  }

  const netVat = outputVat - inputVat + previousBalance;
  const isRefundDue = netVat < 0;

  // Calculate due date (21st of following month)
  const dueDate = new Date(periodEnd);
  dueDate.setMonth(dueDate.getMonth() + 1);
  dueDate.setDate(21);

  const isLate = new Date() > dueDate;

  // Calculate penalties and interest (simplified)
  let penaltiesAndInterest = 0;
  if (isLate && netVat > 0) {
    const daysLate = Math.ceil(
      (Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const monthsLate = Math.ceil(daysLate / 30);
    penaltiesAndInterest = netVat * 0.05 * monthsLate; // 5% per month penalty
  }

  const totalDue = Math.max(0, netVat + penaltiesAndInterest);

  return {
    period: {
      startDate: periodStart,
      endDate: periodEnd,
    },
    outputVat: Math.round(outputVat * 100) / 100,
    inputVat: Math.round(inputVat * 100) / 100,
    netVat: Math.round(netVat * 100) / 100,
    turnover: Math.round(turnover * 100) / 100,
    purchases: Math.round(purchases * 100) / 100,
    transactions: periodTransactions,
    isRefundDue,
    penaltiesAndInterest: Math.round(penaltiesAndInterest * 100) / 100,
    totalDue: Math.round(totalDue * 100) / 100,
    metadata: {
      calculatedAt: new Date(),
      dueDate,
      isLate,
    },
  };
}

/**
 * Calculate VAT on multiple line items
 */
export function calculateVatMultipleItems(items: VatInput[]): {
  items: VatCalculation[];
  totals: {
    grossTotal: number;
    netTotal: number;
    vatTotal: number;
    standardRateVat: number;
    zeroRatedAmount: number;
    exemptAmount: number;
  };
} {
  const itemCalculations = items.map((item) => calculateVat(item));

  const totals = itemCalculations.reduce(
    (acc, calc) => {
      acc.grossTotal += calc.grossAmount;
      acc.netTotal += calc.netAmount;
      acc.vatTotal += calc.vatAmount;

      if (calc.category === "standard") {
        acc.standardRateVat += calc.vatAmount;
      } else if (calc.category === "zero-rated") {
        acc.zeroRatedAmount += calc.netAmount;
      } else if (calc.category === "exempt") {
        acc.exemptAmount += calc.netAmount;
      }

      return acc;
    },
    {
      grossTotal: 0,
      netTotal: 0,
      vatTotal: 0,
      standardRateVat: 0,
      zeroRatedAmount: 0,
      exemptAmount: 0,
    }
  );

  return {
    items: itemCalculations,
    totals: {
      grossTotal: Math.round(totals.grossTotal * 100) / 100,
      netTotal: Math.round(totals.netTotal * 100) / 100,
      vatTotal: Math.round(totals.vatTotal * 100) / 100,
      standardRateVat: Math.round(totals.standardRateVat * 100) / 100,
      zeroRatedAmount: Math.round(totals.zeroRatedAmount * 100) / 100,
      exemptAmount: Math.round(totals.exemptAmount * 100) / 100,
    },
  };
}

/**
 * Check if business needs to register for VAT
 */
export function checkVatRegistrationRequirement(
  annualTurnover: number,
  _transactions: VatCalculation[]
): {
  requiresRegistration: boolean;
  annualTurnover: number;
  threshold: number;
  excessAmount: number;
  recommendation: string;
} {
  const requiresRegistration =
    annualTurnover >= VAT_CONSTANTS.REGISTRATION_THRESHOLD;
  const excessAmount = Math.max(
    0,
    annualTurnover - VAT_CONSTANTS.REGISTRATION_THRESHOLD
  );

  let recommendation: string;
  if (requiresRegistration) {
    recommendation =
      "Must register for VAT immediately. Registration is mandatory.";
  } else if (annualTurnover >= VAT_CONSTANTS.REGISTRATION_THRESHOLD * 0.8) {
    recommendation =
      "Consider voluntary VAT registration as you are approaching the threshold.";
  } else {
    recommendation = "VAT registration not required at current turnover level.";
  }

  return {
    requiresRegistration,
    annualTurnover,
    threshold: VAT_CONSTANTS.REGISTRATION_THRESHOLD,
    excessAmount,
    recommendation,
  };
}

/**
 * Validate VAT calculation inputs
 */
export function validateVatInput(input: VatInput): string[] {
  const errors: string[] = [];

  if (input.amount < 0) {
    errors.push("Amount cannot be negative");
  }

  const validCategories: VatCategory[] = ["standard", "zero-rated", "exempt"];
  if (!validCategories.includes(input.category)) {
    errors.push("Invalid VAT category");
  }

  const validTransactionTypes: VatTransactionType[] = [
    "sale",
    "purchase",
    "import",
    "export",
  ];
  if (!validTransactionTypes.includes(input.transactionType)) {
    errors.push("Invalid transaction type");
  }

  if (
    input.customRate !== undefined &&
    (input.customRate < 0 || input.customRate > 1)
  ) {
    errors.push("Custom VAT rate must be between 0 and 100%");
  }

  return errors;
}

/**
 * Calculate VAT-inclusive price from VAT-exclusive price
 */
export function addVat(
  netAmount: number,
  category: VatCategory = "standard"
): VatCalculation {
  return calculateVat({
    amount: netAmount,
    category,
    transactionType: "sale",
    includesVat: false,
  });
}

/**
 * Calculate VAT-exclusive price from VAT-inclusive price
 */
export function removeVat(
  grossAmount: number,
  category: VatCategory = "standard"
): VatCalculation {
  return calculateVat({
    amount: grossAmount,
    category,
    transactionType: "sale",
    includesVat: true,
  });
}

/**
 * Calculate VAT for import transactions with additional duties
 */
export function calculateImportVat(
  goodsValue: number,
  dutyRate = 0,
  shippingCost = 0,
  insuranceCost = 0
): VatCalculation {
  const dutyAmount = goodsValue * dutyRate;
  const dutiableValue = goodsValue + dutyAmount + shippingCost + insuranceCost;

  return calculateVat({
    amount: dutiableValue,
    category: "standard",
    transactionType: "import",
    includesVat: false,
    description: `Import VAT on goods value ${goodsValue}, duty ${dutyAmount}, shipping ${shippingCost}, insurance ${insuranceCost}`,
  });
}

/**
 * Calculate partial exemption for mixed supply businesses
 */
export function calculatePartialExemption(
  exemptSupplies: number,
  totalSupplies: number,
  inputVat: number
): {
  exemptPercentage: number;
  recoverableInputVat: number;
  nonRecoverableInputVat: number;
  deMinimisLimit: number;
  isDeMinimis: boolean;
} {
  const exemptPercentage =
    totalSupplies > 0 ? exemptSupplies / totalSupplies : 0;
  const deMinimisLimit = 7500; // GYD per month
  const nonRecoverableInputVat = inputVat * exemptPercentage;
  const isDeMinimis = nonRecoverableInputVat <= deMinimisLimit;

  // If de minimis, all input VAT is recoverable
  const recoverableInputVat = isDeMinimis
    ? inputVat
    : inputVat - nonRecoverableInputVat;
  const finalNonRecoverable = isDeMinimis ? 0 : nonRecoverableInputVat;

  return {
    exemptPercentage: Math.round(exemptPercentage * 10_000) / 100, // Percentage with 2 decimal places
    recoverableInputVat: Math.round(recoverableInputVat * 100) / 100,
    nonRecoverableInputVat: Math.round(finalNonRecoverable * 100) / 100,
    deMinimisLimit,
    isDeMinimis,
  };
}
