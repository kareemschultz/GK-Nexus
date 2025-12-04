/**
 * Guyana Tax Rates for 2025
 * Based on GRA (Guyana Revenue Authority) regulations
 * Updated: January 2025 Budget
 * Sources:
 * - https://www.gra.gov.gy/income-tax-rates-threshold/
 * - https://www.nis.org.gy/
 * - https://www.gra.gov.gy/tax-services/vat-services/
 */

export const GUYANA_TAX_RATES_2025 = {
  // PAYE - Pay As You Earn (Income Tax)
  // Updated per 2025 Budget: Reduced from 28% to 25%
  paye: {
    // Tax-free threshold (monthly personal allowance)
    threshold: 130_000, // GYD 130,000 per month (GYD 1,560,000 annually)
    // Or 1/3 of gross income, whichever is greater
    thresholdAnnual: 1_560_000,
    // First band rate (reduced from 28% to 25% in 2025)
    firstBandRate: 0.25, // 25%
    // Second band rate (reduced from 40% to 35% in 2025)
    secondBandRate: 0.35, // 35%
    // Second band threshold (annual)
    secondBandThreshold: 3_120_000, // GYD 3,120,000 annually (260,000 monthly)
    // Overtime exemption - first GYD 50,000 from overtime/second job
    overtimeExemption: 50_000,
    // Child allowance (annual per child)
    childAllowance: 120_000,
    // Medical/Life insurance deduction (10% of gross or max)
    insuranceDeductionRate: 0.1,
    insuranceDeductionMax: 600_000,
    // Progressive brackets for reference
    brackets: [
      { min: 0, max: 130_000, rate: 0, label: "Personal allowance (tax-free)" },
      {
        min: 130_001,
        max: 260_000,
        rate: 0.25,
        label: "25% (first band)",
      },
      {
        min: 260_001,
        max: Number.POSITIVE_INFINITY,
        rate: 0.35,
        label: "35% (second band)",
      },
    ],
  },

  // NIS - National Insurance Scheme
  nis: {
    employeeRate: 0.056, // 5.6% employee contribution
    employerRate: 0.084, // 8.4% employer contribution
    totalRate: 0.14, // 14% total (5.6% + 8.4%)
    ceilingMonthly: 280_000, // GYD 280,000 monthly insurable earnings ceiling
    ceilingWeekly: 64_615, // GYD 64,615 weekly ceiling
    // Maximum contributions per month
    maxEmployeeMonthly: 15_680, // GYD 15,680
    maxEmployerMonthly: 23_520, // GYD 23,520
    // Maximum contributions per week
    maxEmployeeWeekly: 3618, // GYD 3,618
    maxEmployerWeekly: 5427, // GYD 5,427
    // Due date: 15th of following month
    dueDay: 15,
  },

  // VAT - Value Added Tax
  vat: {
    standardRate: 0.14, // 14%
    zeroRated: 0, // Exports, electricity (GPL), water (GWI), international travel
    registrationThreshold: 15_000_000, // GYD 15M annual turnover
    // Exempt: educational services, residential rent, financial services
  },

  // Corporation Tax
  corporationTax: {
    nonCommercialRate: 0.25, // 25% for non-commercial companies
    commercialRate: 0.4, // 40% for commercial companies (banks, insurance, retail)
    telephoneRate: 0.45, // 45% for telephone companies
    // Minimum corporation tax: 2% of turnover for commercial companies
    minimumTaxRate: 0.02,
  },

  // Property Tax
  propertyTax: {
    residentialRate: 0.005, // 0.5% of net property value
    commercialRate: 0.0075, // 0.75% of net property value
  },

  // Withholding Tax (7B)
  withholdingTax: {
    dividends: 0.2, // 20%
    interest: 0.2, // 20%
    royalties: 0.2, // 20%
    contractPayments: 0.2, // 20%
    // Specific 7B rates
    "7B1": 0.2, // 20% for most services
    "7B2": 0.1, // 10% for certain professional services
    "7B3": 0.14, // 14% for specific categories
  },

  // Capital Gains Tax
  capitalGains: {
    rate: 0.2, // 20%
  },

  // Excise Tax (varies by product)
  exciseTax: {
    alcohol: 0.4, // 40%
    tobacco: 0.5, // 50%
    fuel: 0.1, // 10%
  },
} as const;

// Currency Information
export const GYD = {
  code: "GYD",
  symbol: "$",
  name: "Guyanese Dollar",
  decimals: 2,
  locale: "en-GY",
} as const;

// Filing frequencies
export const FILING_FREQUENCIES = {
  MONTHLY: "monthly",
  QUARTERLY: "quarterly",
  ANNUAL: "annual",
  AS_NEEDED: "as_needed",
} as const;

// Tax form references
export const TAX_FORMS = {
  PAYE: "Form 5",
  VAT: "VAT-3",
  INCOME_TAX: "Form 2",
  CORPORATION_TAX: "CT-1",
  PROPERTY_TAX: "PT-1",
  CAPITAL_GAINS: "CGT-1",
  EXCISE: "EX-1",
  NIS_CONTRIBUTION: "NIS-C",
  NIS_COMPLIANCE: "C100F72/A",
} as const;

export type TaxRates = typeof GUYANA_TAX_RATES_2025;
export type FilingFrequency =
  (typeof FILING_FREQUENCIES)[keyof typeof FILING_FREQUENCIES];
