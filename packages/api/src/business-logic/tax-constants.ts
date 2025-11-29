/**
 * Guyana Tax System Constants for 2025
 * Contains all current tax rates, thresholds, and regulatory parameters
 */

export const TAX_YEAR = 2025;

/**
 * PAYE (Pay As You Earn) Income Tax Constants
 */
export const PAYE_CONSTANTS = {
  STATUTORY_FREE_PAY: 130_000, // GYD per month
  ANNUAL_STATUTORY_FREE_PAY: 130_000 * 12, // GYD per year

  // Income tax brackets (monthly)
  BRACKETS: [
    { min: 0, max: 130_000, rate: 0 }, // Tax-free threshold
    { min: 130_000, max: 200_000, rate: 0.28 }, // 28%
    { min: 200_000, max: 300_000, rate: 0.3 }, // 30%
    { min: 300_000, max: 400_000, rate: 0.32 }, // 32%
    { min: 400_000, max: Number.POSITIVE_INFINITY, rate: 0.4 }, // 40%
  ],

  // Annual brackets
  ANNUAL_BRACKETS: [
    { min: 0, max: 1_560_000, rate: 0 },
    { min: 1_560_000, max: 2_400_000, rate: 0.28 },
    { min: 2_400_000, max: 3_600_000, rate: 0.3 },
    { min: 3_600_000, max: 4_800_000, rate: 0.32 },
    { min: 4_800_000, max: Number.POSITIVE_INFINITY, rate: 0.4 },
  ],
} as const;

/**
 * National Insurance Scheme (NIS) Constants
 */
export const NIS_CONSTANTS = {
  EMPLOYEE_RATE: 0.056, // 5.6%
  EMPLOYER_RATE: 0.084, // 8.4%
  TOTAL_RATE: 0.14, // 14.0%
  WEEKLY_CEILING: 65_384, // GYD per week
  MONTHLY_CEILING: 280_000, // GYD per month (approx 4.28 weeks)
  ANNUAL_CEILING: 3_360_000, // GYD per year
  MINIMUM_WAGE: 80_000, // GYD per month
} as const;

/**
 * Value Added Tax (VAT) Constants
 */
export const VAT_CONSTANTS = {
  STANDARD_RATE: 0.14, // 14%
  ZERO_RATED_CATEGORIES: [
    "basic_food_items",
    "medical_supplies",
    "educational_materials",
    "exports",
  ],
  EXEMPT_CATEGORIES: [
    "financial_services",
    "insurance",
    "medical_services",
    "educational_services",
  ],
  REGISTRATION_THRESHOLD: 15_000_000, // GYD per year
} as const;

/**
 * Corporate Tax Constants
 */
export const CORPORATE_TAX_CONSTANTS = {
  STANDARD_RATE: 0.27, // 27%
  SMALL_BUSINESS_RATE: 0.25, // 25% for qualifying small businesses
  SMALL_BUSINESS_THRESHOLD: 50_000_000, // GYD annual turnover
  MANUFACTURING_RATE: 0.25, // 25% for manufacturing companies
  MINING_RATE: 0.4, // 40% for mining companies
  BANKING_RATE: 0.3, // 30% for banking institutions
} as const;

/**
 * Withholding Tax (7B) Constants
 */
export const WITHHOLDING_TAX_CONSTANTS = {
  STANDARD_RATE: 0.2, // 20%
  DIVIDEND_RATE: 0.2, // 20%
  INTEREST_RATE: 0.2, // 20%
  ROYALTY_RATE: 0.25, // 25%
  RENT_RATE: 0.2, // 20%
  PROFESSIONAL_SERVICES_RATE: 0.1, // 10%
  THRESHOLD: 100_000, // GYD - minimum amount subject to withholding
} as const;

/**
 * Property Tax Constants
 */
export const PROPERTY_TAX_CONSTANTS = {
  RESIDENTIAL_RATE: 0.0075, // 0.75% of assessed value
  COMMERCIAL_RATE: 0.01, // 1.0% of assessed value
  INDUSTRIAL_RATE: 0.012, // 1.2% of assessed value
  AGRICULTURAL_RATE: 0.005, // 0.5% of assessed value
} as const;

/**
 * Excise Tax Constants
 */
export const EXCISE_TAX_CONSTANTS = {
  ALCOHOL: {
    BEER: 0.25, // 25%
    SPIRITS: 1.0, // 100%
    WINE: 0.4, // 40%
  },
  TOBACCO: 1.5, // 150%
  FUEL: {
    GASOLINE: 50, // GYD per litre
    DIESEL: 40, // GYD per litre
  },
  LUXURY_VEHICLES: 0.3, // 30% above $8M GYD value
  LUXURY_THRESHOLD: 8_000_000, // GYD
} as const;

/**
 * Filing and Penalty Constants
 */
export const COMPLIANCE_CONSTANTS = {
  PAYE_DUE_DATE: 15, // 15th of following month
  VAT_DUE_DATE: 21, // 21st of following month
  CORPORATE_TAX_DUE_MONTHS: 6, // 6 months after year-end

  PENALTIES: {
    LATE_FILING_RATE: 0.05, // 5% per month
    LATE_PAYMENT_RATE: 0.02, // 2% per month
    MAXIMUM_PENALTY_RATE: 1.0, // 100% of tax owed
  },

  INTEREST_RATES: {
    LATE_PAYMENT: 0.12, // 12% per annum
    REFUND: 0.06, // 6% per annum
  },
} as const;

/**
 * Common utility types for tax calculations
 */
export type TaxBracket = {
  readonly min: number;
  readonly max: number;
  readonly rate: number;
};

export type TaxYear = typeof TAX_YEAR;

export type PaymentFrequency = "weekly" | "bi-weekly" | "monthly" | "annual";

export type TaxType =
  | "paye"
  | "nis"
  | "vat"
  | "corporate"
  | "withholding"
  | "property"
  | "excise";

export type ComplianceStatus =
  | "compliant"
  | "overdue"
  | "delinquent"
  | "under_review";

/**
 * Currency formatting for Guyana Dollars
 */
export const formatGYD = (amount: number): string =>
  new Intl.NumberFormat("en-GY", {
    style: "currency",
    currency: "GYD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

/**
 * Convert between different payment frequencies
 */
export const convertToAnnual = (
  amount: number,
  frequency: PaymentFrequency
): number => {
  switch (frequency) {
    case "weekly":
      return amount * 52;
    case "bi-weekly":
      return amount * 26;
    case "monthly":
      return amount * 12;
    case "annual":
      return amount;
    default:
      throw new Error(`Unknown payment frequency: ${frequency}`);
  }
};

export const convertToMonthly = (
  amount: number,
  frequency: PaymentFrequency
): number => {
  switch (frequency) {
    case "weekly":
      return (amount * 52) / 12;
    case "bi-weekly":
      return (amount * 26) / 12;
    case "monthly":
      return amount;
    case "annual":
      return amount / 12;
    default:
      throw new Error(`Unknown payment frequency: ${frequency}`);
  }
};
