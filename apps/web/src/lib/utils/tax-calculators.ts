/**
 * Tax Calculation Utilities for Guyana Tax System
 * Implements VAT, PAYE, NIS, and Corporate Tax calculations
 */

import { GUYANA_TAX_RATES_2025 } from "../constants/tax-rates";

// ============================================
// PAYE (Pay As You Earn) Calculator
// ============================================

export interface PAYEResult {
  grossIncome: number;
  taxableIncome: number;
  tax: number;
  netIncome: number;
  effectiveRate: number;
  breakdown: Array<{ bracket: string; amount: number }>;
}

export function calculatePAYE(
  grossMonthlyIncome: number,
  period: "monthly" | "annual" = "monthly"
): PAYEResult {
  const { threshold, firstBandRate, secondBandRate, secondBandThreshold } =
    GUYANA_TAX_RATES_2025.paye;

  // Convert to monthly if annual
  const monthlyIncome =
    period === "annual" ? grossMonthlyIncome / 12 : grossMonthlyIncome;

  // Monthly second band threshold (260,000)
  const monthlySecondBandThreshold = secondBandThreshold / 12;

  // Calculate taxable income (amount above personal allowance threshold)
  const taxableIncome = Math.max(0, monthlyIncome - threshold);

  // Calculate tax using 2025 tiered system
  let tax = 0;
  let firstBandTax = 0;
  let secondBandTax = 0;

  if (taxableIncome > 0) {
    // Income in the first band (130,001 to 260,000)
    const firstBandIncome = Math.min(
      taxableIncome,
      monthlySecondBandThreshold - threshold
    );
    firstBandTax = Math.max(0, firstBandIncome) * firstBandRate;

    // Income in the second band (above 260,000)
    const secondBandIncome = Math.max(
      0,
      monthlyIncome - monthlySecondBandThreshold
    );
    secondBandTax = secondBandIncome * secondBandRate;

    tax = firstBandTax + secondBandTax;
  }

  // Calculate net income
  const netIncome = monthlyIncome - tax;

  // Calculate effective rate
  const effectiveRate = monthlyIncome > 0 ? (tax / monthlyIncome) * 100 : 0;

  // Build breakdown
  const breakdown: Array<{ bracket: string; amount: number }> = [];

  // Personal allowance (tax-free)
  breakdown.push({
    bracket: `GYD 0 - ${threshold.toLocaleString()} @ 0% (Personal allowance)`,
    amount: 0,
  });

  if (firstBandTax > 0) {
    breakdown.push({
      bracket: `GYD ${(threshold + 1).toLocaleString()} - ${monthlySecondBandThreshold.toLocaleString()} @ 25%`,
      amount: firstBandTax,
    });
  }

  if (secondBandTax > 0) {
    breakdown.push({
      bracket: `GYD ${(monthlySecondBandThreshold + 1).toLocaleString()}+ @ 35%`,
      amount: secondBandTax,
    });
  }

  // Convert back to annual if needed
  const multiplier = period === "annual" ? 12 : 1;

  return {
    grossIncome: monthlyIncome * multiplier,
    taxableIncome: taxableIncome * multiplier,
    tax: Math.round(tax * multiplier * 100) / 100,
    netIncome: Math.round(netIncome * multiplier * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    breakdown,
  };
}

// ============================================
// NIS (National Insurance Scheme) Calculator
// ============================================

export interface NISResult {
  grossIncome: number;
  insurableEarnings: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  netAfterNIS: number;
}

export function calculateNIS(
  grossIncome: number,
  period: "monthly" | "weekly" = "monthly"
): NISResult {
  const { employeeRate, employerRate, ceilingMonthly, ceilingWeekly } =
    GUYANA_TAX_RATES_2025.nis;

  // Apply ceiling
  const ceiling = period === "weekly" ? ceilingWeekly : ceilingMonthly;
  const insurableEarnings = Math.min(grossIncome, ceiling);

  // Calculate contributions
  const employeeContribution = insurableEarnings * employeeRate;
  const employerContribution = insurableEarnings * employerRate;
  const totalContribution = employeeContribution + employerContribution;

  return {
    grossIncome,
    insurableEarnings,
    employeeContribution: Math.round(employeeContribution * 100) / 100,
    employerContribution: Math.round(employerContribution * 100) / 100,
    totalContribution: Math.round(totalContribution * 100) / 100,
    netAfterNIS: Math.round((grossIncome - employeeContribution) * 100) / 100,
  };
}

// ============================================
// VAT (Value Added Tax) Calculator
// ============================================

export interface VATResult {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
}

export function calculateVAT(amount: number, isInclusive = false): VATResult {
  const rate = GUYANA_TAX_RATES_2025.vat.standardRate;

  if (isInclusive) {
    // VAT-inclusive price - extract VAT
    const netAmount = amount / (1 + rate);
    const vatAmount = amount - netAmount;
    return {
      netAmount: Math.round(netAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossAmount: amount,
      vatRate: rate * 100,
    };
  }

  // VAT-exclusive price - add VAT
  const vatAmount = amount * rate;
  return {
    netAmount: amount,
    vatAmount: Math.round(vatAmount * 100) / 100,
    grossAmount: Math.round((amount + vatAmount) * 100) / 100,
    vatRate: rate * 100,
  };
}

// ============================================
// Corporation Tax Calculator
// ============================================

export interface CorporateTaxResult {
  profitBeforeTax: number;
  deductions: number;
  taxableIncome: number;
  taxRate: number;
  corporateTax: number;
  profitAfterTax: number;
}

export function calculateCorporationTax(
  profitBeforeTax: number,
  companyType: "commercial" | "non-commercial" | "telephone" = "non-commercial",
  deductions = 0,
  turnover = 0
): CorporateTaxResult {
  const { commercialRate, nonCommercialRate, telephoneRate, minimumTaxRate } =
    GUYANA_TAX_RATES_2025.corporationTax;

  const taxableIncome = Math.max(0, profitBeforeTax - deductions);

  // Determine tax rate based on company type
  let taxRate: number;
  if (companyType === "telephone") {
    taxRate = telephoneRate; // 45%
  } else if (companyType === "commercial") {
    taxRate = commercialRate; // 40%
  } else {
    taxRate = nonCommercialRate; // 25%
  }

  let corporateTax = taxableIncome * taxRate;

  // Apply minimum corporation tax (2% of turnover) for commercial companies
  if (companyType === "commercial" && turnover > 0) {
    const minimumTax = turnover * minimumTaxRate;
    if (corporateTax < minimumTax) {
      corporateTax = minimumTax;
    }
  }

  return {
    profitBeforeTax,
    deductions,
    taxableIncome,
    taxRate: taxRate * 100,
    corporateTax: Math.round(corporateTax * 100) / 100,
    profitAfterTax: Math.round((profitBeforeTax - corporateTax) * 100) / 100,
  };
}

// ============================================
// Withholding Tax (7B) Calculator
// ============================================

export interface WithholdingTaxResult {
  grossAmount: number;
  withholdingRate: number;
  withholdingTax: number;
  netAmount: number;
}

export function calculateWithholdingTax(
  amount: number,
  serviceType: "7B1" | "7B2" | "7B3" = "7B1"
): WithholdingTaxResult {
  const rate = GUYANA_TAX_RATES_2025.withholdingTax[serviceType];
  const withholdingTax = amount * rate;

  return {
    grossAmount: amount,
    withholdingRate: rate * 100,
    withholdingTax: Math.round(withholdingTax * 100) / 100,
    netAmount: Math.round((amount - withholdingTax) * 100) / 100,
  };
}

// ============================================
// Capital Gains Tax Calculator
// ============================================

export interface CapitalGainsResult {
  salePrice: number;
  costBasis: number;
  capitalGain: number;
  taxRate: number;
  tax: number;
  netProceeds: number;
}

export function calculateCapitalGainsTax(
  salePrice: number,
  costBasis: number,
  improvements = 0
): CapitalGainsResult {
  const adjustedCostBasis = costBasis + improvements;
  const capitalGain = Math.max(0, salePrice - adjustedCostBasis);
  const taxRate = GUYANA_TAX_RATES_2025.capitalGains.rate;
  const tax = capitalGain * taxRate;

  return {
    salePrice,
    costBasis: adjustedCostBasis,
    capitalGain,
    taxRate: taxRate * 100,
    tax: Math.round(tax * 100) / 100,
    netProceeds: Math.round((salePrice - tax) * 100) / 100,
  };
}

// ============================================
// Property Tax Calculator
// ============================================

export interface PropertyTaxResult {
  propertyValue: number;
  liabilities: number;
  netValue: number;
  taxRate: number;
  propertyTax: number;
}

export function calculatePropertyTax(
  propertyValue: number,
  liabilities = 0,
  propertyType: "residential" | "commercial" = "residential"
): PropertyTaxResult {
  const { residentialRate, commercialRate } = GUYANA_TAX_RATES_2025.propertyTax;

  const taxRate =
    propertyType === "residential" ? residentialRate : commercialRate;
  const netValue = Math.max(0, propertyValue - liabilities);
  const propertyTax = netValue * taxRate;

  return {
    propertyValue,
    liabilities,
    netValue,
    taxRate: taxRate * 100,
    propertyTax: Math.round(propertyTax * 100) / 100,
  };
}

// ============================================
// Complete Employee Tax Summary
// ============================================

export interface EmployeeTaxSummary {
  gross: number;
  paye: number;
  nisEmployee: number;
  nisEmployer: number;
  totalDeductions: number;
  netTakeHome: number;
  employerCost: number;
}

export function calculateEmployeeTaxes(
  grossSalary: number,
  period: "monthly" | "weekly" = "monthly"
): EmployeeTaxSummary {
  // Calculate PAYE (monthly basis)
  const payeCalc = calculatePAYE(grossSalary, "monthly");

  // Calculate NIS
  const nisCalc = calculateNIS(grossSalary, period);

  const totalDeductions = payeCalc.tax + nisCalc.employeeContribution;
  const netTakeHome = grossSalary - totalDeductions;
  const employerCost = grossSalary + nisCalc.employerContribution;

  return {
    gross: grossSalary,
    paye: payeCalc.tax,
    nisEmployee: nisCalc.employeeContribution,
    nisEmployer: nisCalc.employerContribution,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netTakeHome: Math.round(netTakeHome * 100) / 100,
    employerCost: Math.round(employerCost * 100) / 100,
  };
}

// ============================================
// Currency Formatting
// ============================================

export function formatGYD(amount: number, includeSymbol = true): string {
  const formatted = new Intl.NumberFormat("en-GY", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return includeSymbol ? `GYD ${formatted}` : formatted;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
