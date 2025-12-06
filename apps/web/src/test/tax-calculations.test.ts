/**
 * Comprehensive unit tests for Guyana Tax Calculation Engine
 */

import { describe, expect, it } from "vitest";
import {
  calculatePAYE,
  calculateVAT,
  formatGuyanacurrency,
  GUYANA_TAX_CONFIG_2025,
  generateGRAForm7BCSV,
  generateNISCS3Schedule,
  processPayroll,
  validateNISNumber,
  validateTINNumber,
} from "@/lib/tax-calculations";
import {
  createTestEmployee,
  createTestEmployees,
  TAX_TEST_SCENARIOS,
} from "../../../../packages/api/src/test/test-helpers";

// Add custom Vitest matchers for Guyana currency validation
declare module "vitest" {
  interface Assertion<T = unknown> {
    toBeValidGuyanaAmount(): T;
  }
  interface AsymmetricMatchersContaining {
    toBeValidGuyanaAmount(): unknown;
  }
}

// Custom matcher for validating Guyana currency amounts
expect.extend({
  toBeValidGuyanaAmount(received: number) {
    const pass =
      typeof received === "number" &&
      Number.isFinite(received) &&
      received >= 0 &&
      Number.isInteger(received * 100); // Validates to 2 decimal places

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid Guyana currency amount`
          : `Expected ${received} to be a valid Guyana currency amount (non-negative number with max 2 decimal places)`,
    };
  },
});

describe("Guyana Tax Calculations", () => {
  describe("PAYE Tax Calculation", () => {
    describe("Basic scenarios", () => {
      it("should calculate correctly for low income employee under statutory threshold", () => {
        const employee = TAX_TEST_SCENARIOS.LOW_INCOME.employee;
        const result = calculatePAYE(employee);

        expect(result).toEqual(
          expect.objectContaining({
            employeeId: employee.id,
            grossEarnings: 100_000,
            statutoryFreePay: 130_000, // 2025 rate
            childAllowance: 0, // No dependents
            overtimeTaxFree: 0, // No overtime
            taxableIncome: 0, // Below threshold
            totalPAYETax: 0,
            employeeNISContribution: 5600, // 5.6% of 100k
            netPay: 94_400, // 100k - 5.6k NIS
          })
        );

        // Validate amounts are proper currency format
        expect(result.grossEarnings).toBeValidGuyanaAmount();
        expect(result.netPay).toBeValidGuyanaAmount();
        expect(result.totalPAYETax).toBeValidGuyanaAmount();
      });

      it("should calculate correctly for middle income employee", () => {
        const employee = createTestEmployee({
          basicSalary: 200_000,
          overtime: 30_000,
          allowances: 20_000,
          bonuses: 0,
          dependents: 2,
        });

        const result = calculatePAYE(employee);

        expect(result.grossEarnings).toBe(250_000); // 200k + 30k + 20k
        expect(result.childAllowance).toBe(20_000); // 2 children × 10k
        expect(result.overtimeTaxFree).toBe(30_000); // All overtime under 50k limit
        expect(result.employeeNISContribution).toBe(14_000); // 5.6% of 250k

        // Taxable income calculation:
        // Gross (250k) - Employee NIS (14k) - Statutory Free Pay (130k) - Child Allowance (20k) - Tax-free overtime (30k)
        // = 250k - 194k = 56k
        expect(result.taxableIncome).toBe(56_000);

        // Tax: 56k @ 25% = 14k
        expect(result.totalPAYETax).toBe(14_000);
        expect(result.netPay).toBe(222_000); // 250k - 14k NIS - 14k tax
      });

      it("should calculate correctly for high income employee with multiple tax bands", () => {
        const employee = createTestEmployee({
          basicSalary: 400_000,
          overtime: 100_000,
          allowances: 50_000,
          bonuses: 50_000,
          dependents: 3,
        });

        const result = calculatePAYE(employee);

        expect(result.grossEarnings).toBe(600_000);
        expect(result.childAllowance).toBe(30_000); // 3 children (max) × 10k
        expect(result.overtimeTaxFree).toBe(50_000); // First 50k tax-free
        expect(result.employeeNISContribution).toBe(15_680); // Max NIS (5.6% of 280k ceiling)

        // Taxable income: 600k - 15.68k - 130k - 30k - 50k = 374.32k
        const expectedTaxableIncome =
          600_000 - 15_680 - 130_000 - 30_000 - 50_000;
        expect(result.taxableIncome).toBe(expectedTaxableIncome);

        // Tax bands:
        // Band 1: First 260k @ 25% = 65k
        // Band 2: Remaining (374.32k - 260k = 114.32k) @ 35% = 40.01k
        expect(result.taxBand1Amount).toBe(260_000);
        expect(result.taxBand1Tax).toBe(65_000);
        expect(result.taxBand2Amount).toBe(expectedTaxableIncome - 260_000);
        expect(result.taxBand2Tax).toBeCloseTo(40_012, 2);
      });

      it("should handle employee with significant overtime correctly", () => {
        const employee = createTestEmployee({
          basicSalary: 180_000,
          overtime: 80_000, // 50k tax-free, 30k taxable
          allowances: 10_000,
          bonuses: 0,
          dependents: 1,
        });

        const result = calculatePAYE(employee);

        expect(result.grossEarnings).toBe(270_000);
        expect(result.overtimeTaxFree).toBe(50_000); // Limited to 50k
        expect(result.childAllowance).toBe(10_000); // 1 child

        // Taxable overtime should be 30k (80k - 50k free portion)
        const taxableOvertimeAmount = 30_000;

        // Taxable income: 270k - 15.12k - 130k - 10k - 50k = 64.88k
        const expectedNIS = 270_000 * 0.056;
        const expectedTaxableIncome =
          270_000 - expectedNIS - 130_000 - 10_000 - 50_000;

        expect(result.taxableIncome).toBe(expectedTaxableIncome);
        expect(result.totalPAYETax).toBe(expectedTaxableIncome * 0.25); // All in band 1
      });
    });

    describe("Edge cases and validation", () => {
      it("should handle zero income employee", () => {
        const employee = createTestEmployee({
          basicSalary: 0,
          overtime: 0,
          allowances: 0,
          bonuses: 0,
          dependents: 0,
        });

        const result = calculatePAYE(employee);

        expect(result.grossEarnings).toBe(0);
        expect(result.taxableIncome).toBe(0);
        expect(result.totalPAYETax).toBe(0);
        expect(result.employeeNISContribution).toBe(0);
        expect(result.netPay).toBe(0);
      });

      it("should respect NIS earnings ceiling", () => {
        const employee = createTestEmployee({
          basicSalary: 500_000, // Above NIS ceiling
          overtime: 0,
          allowances: 0,
          bonuses: 0,
          dependents: 0,
        });

        const result = calculatePAYE(employee);

        expect(result.nisableEarnings).toBe(
          GUYANA_TAX_CONFIG_2025.NIS.EARNINGS_CEILING
        );
        expect(result.employeeNISContribution).toBe(
          GUYANA_TAX_CONFIG_2025.NIS.MAX_EMPLOYEE_CONTRIBUTION
        );
        expect(result.employerNISContribution).toBe(
          GUYANA_TAX_CONFIG_2025.NIS.MAX_EMPLOYER_CONTRIBUTION
        );
      });

      it("should limit child allowance to maximum 3 children", () => {
        const employee = createTestEmployee({
          basicSalary: 200_000,
          dependents: 5, // More than max
        });

        const result = calculatePAYE(employee);

        expect(result.childAllowance).toBe(
          GUYANA_TAX_CONFIG_2025.PAYE.MAX_CHILD_ALLOWANCE_CHILDREN *
            GUYANA_TAX_CONFIG_2025.PAYE.CHILD_ALLOWANCE_PER_CHILD
        );
      });

      it("should handle negative calculated values gracefully", () => {
        // Edge case where deductions exceed gross earnings
        const employee = createTestEmployee({
          basicSalary: 50_000, // Very low salary
          overtime: 0,
          allowances: 0,
          bonuses: 0,
          dependents: 0,
        });

        const result = calculatePAYE(employee);

        expect(result.taxableIncome).toBeGreaterThanOrEqual(0);
        expect(result.totalPAYETax).toBeGreaterThanOrEqual(0);
      });
    });

    describe("Accuracy validation", () => {
      it("should maintain mathematical precision for currency calculations", () => {
        const employee = createTestEmployee({
          basicSalary: 123_456.78, // With cents
          overtime: 0,
          allowances: 0,
          bonuses: 0,
          dependents: 1,
        });

        const result = calculatePAYE(employee);

        // All monetary values should be precise to 2 decimal places
        expect(result.grossEarnings).toBeValidGuyanaAmount();
        expect(result.employeeNISContribution).toBeValidGuyanaAmount();
        expect(result.totalPAYETax).toBeValidGuyanaAmount();
        expect(result.netPay).toBeValidGuyanaAmount();
      });

      it("should calculate employer and employee NIS correctly", () => {
        const employee = createTestEmployee({
          basicSalary: 200_000,
          overtime: 0,
          allowances: 0,
          bonuses: 0,
          dependents: 0,
        });

        const result = calculatePAYE(employee);

        expect(result.employeeNISContribution).toBe(200_000 * 0.056);
        expect(result.employerNISContribution).toBe(200_000 * 0.084);

        // Employee pays 5.6%, employer pays 8.4%
        expect(
          result.employerNISContribution / result.employeeNISContribution
        ).toBeCloseTo(1.5, 2);
      });
    });
  });

  describe("Payroll Processing", () => {
    it("should process multiple employees correctly", () => {
      const employees = createTestEmployees(3, {
        basicSalary: 150_000,
        overtime: 20_000,
        allowances: 10_000,
        dependents: 1,
      });

      const payrollSummary = processPayroll(employees);

      expect(payrollSummary.employees).toHaveLength(3);
      expect(payrollSummary.totals.employeeCount).toBe(3);

      // Each employee should have same gross pay
      const expectedGross = 150_000 + 20_000 + 10_000;
      expect(payrollSummary.totals.totalGrossPay).toBe(expectedGross * 3);

      // Verify summary calculations
      const manualTotalPAYE = payrollSummary.employees.reduce(
        (sum, emp) => sum + emp.totalPAYETax,
        0
      );
      expect(payrollSummary.totals.totalPAYE).toBe(manualTotalPAYE);

      const manualTotalNIS = payrollSummary.employees.reduce(
        (sum, emp) => sum + emp.employeeNISContribution,
        0
      );
      expect(payrollSummary.totals.totalEmployeeNIS).toBe(manualTotalNIS);
    });

    it("should handle empty employee list", () => {
      const payrollSummary = processPayroll([]);

      expect(payrollSummary.employees).toHaveLength(0);
      expect(payrollSummary.totals.employeeCount).toBe(0);
      expect(payrollSummary.totals.totalGrossPay).toBe(0);
      expect(payrollSummary.totals.totalPAYE).toBe(0);
    });

    it("should include generation timestamp", () => {
      const employees = [createTestEmployee()];
      const payrollSummary = processPayroll(employees);

      expect(payrollSummary.generatedAt).toBeInstanceOf(Date);
      expect(payrollSummary.generatedAt.getTime()).toBeCloseTo(Date.now(), -3);
    });
  });

  describe("Validation Functions", () => {
    describe("NIS Number Validation", () => {
      it("should validate correct NIS numbers", () => {
        const validNumbers = [
          "123456789",
          "A12345678",
          "A-1234567-B",
          "12-345-6789",
          "a1b2c3d4e", // Case insensitive
        ];

        for (const nisNumber of validNumbers) {
          expect(validateNISNumber(nisNumber)).toBe(true);
        }
      });

      it("should reject invalid NIS numbers", () => {
        const invalidNumbers = [
          "",
          "12345", // Too short
          "1234567890", // Too long
          "12345678A", // Wrong format
          "ABC-DEF-GHI", // No numbers
          null,
          undefined,
        ];

        for (const nisNumber of invalidNumbers) {
          expect(validateNISNumber(nisNumber as any)).toBe(false);
        }
      });

      it("should properly format and clean NIS numbers", () => {
        expect(validateNISNumber("A-1234567-B")).toBe(true);
        expect(validateNISNumber("A 1234567 B")).toBe(true);
        expect(validateNISNumber("  A1234567B  ")).toBe(true);
      });
    });

    describe("TIN Number Validation", () => {
      it("should validate correct TIN numbers", () => {
        const validNumbers = [
          "123456789",
          "987654321",
          "1-2-3-4-5-6-7-8-9", // With separators
          " 123 456 789 ", // With spaces
        ];

        for (const tinNumber of validNumbers) {
          expect(validateTINNumber(tinNumber)).toBe(true);
        }
      });

      it("should reject invalid TIN numbers", () => {
        const invalidNumbers = [
          "",
          "12345", // Too short
          "1234567890", // Too long
          "12345678A", // Contains letters
          "ABC123DEF", // Mixed alphanumeric
          null,
          undefined,
        ];

        for (const tinNumber of invalidNumbers) {
          expect(validateTINNumber(tinNumber as any)).toBe(false);
        }
      });
    });
  });

  describe("Currency Formatting", () => {
    it("should format Guyana currency correctly", () => {
      expect(formatGuyanacurrency(1000)).toMatch(/GY\$1,000\.00/);
      expect(formatGuyanacurrency(1234.56)).toMatch(/GY\$1,234\.56/);
      expect(formatGuyanacurrency(0)).toMatch(/GY\$0\.00/);
      expect(formatGuyanacurrency(1_000_000)).toMatch(/GY\$1,000,000\.00/);
    });

    it("should handle edge cases in currency formatting", () => {
      expect(formatGuyanacurrency(0.01)).toMatch(/GY\$0\.01/);
      expect(formatGuyanacurrency(999_999_999.99)).toBeTruthy();
    });
  });

  describe("VAT Calculations", () => {
    it("should calculate VAT correctly for standard rates", () => {
      const result = calculateVAT(
        100_000, // Standard rated sales
        20_000, // Zero rated sales
        10_000, // Exempt sales
        60_000 // Standard rated purchases
      );

      expect(result.totalSales).toBe(130_000);
      expect(result.outputVAT).toBe(100_000 * 0.125); // 12.5%
      expect(result.inputVAT).toBe(60_000 * 0.125);
      expect(result.netVAT).toBe(result.outputVAT - result.inputVAT);
      expect(result.totalVATDue).toBe(result.netVAT);
    });

    it("should handle VAT with adjustments", () => {
      const adjustments = 5000;
      const result = calculateVAT(80_000, 0, 0, 40_000, adjustments);

      expect(result.totalVATDue).toBe(result.netVAT + adjustments);
    });

    it("should calculate zero VAT for zero-rated and exempt sales", () => {
      const result = calculateVAT(
        0, // No standard rated sales
        50_000, // Zero rated sales
        25_000 // Exempt sales
      );

      expect(result.outputVAT).toBe(0);
      expect(result.totalSales).toBe(75_000);
    });
  });

  describe("GRA Form 7B CSV Generation", () => {
    it("should generate correct CSV format", () => {
      const employees = [
        createTestEmployee({
          firstName: "John",
          lastName: "Doe",
          basicSalary: 200_000,
        }),
      ];

      const payrollResults = employees.map((emp) => calculatePAYE(emp));
      const csv = generateGRAForm7BCSV(
        payrollResults,
        employees,
        "123456789",
        2025
      );

      const lines = csv.split("\n");
      expect(lines[0]).toBe(
        "TIN,Last_Name,First_Name,Gross_Earnings,Tax_Deducted,NIS_Employee"
      );

      const dataLine = lines[1].split(",");
      expect(dataLine[0]).toBe("123456789"); // Employer TIN
      expect(dataLine[1]).toBe("Doe"); // Last name
      expect(dataLine[2]).toBe("John"); // First name
      expect(Number(dataLine[3])).toBeValidGuyanaAmount(); // Gross earnings
      expect(Number(dataLine[4])).toBeValidGuyanaAmount(); // Tax deducted
      expect(Number(dataLine[5])).toBeValidGuyanaAmount(); // NIS employee
    });

    it("should handle empty payroll results", () => {
      const csv = generateGRAForm7BCSV([], [], "123456789", 2025);
      const lines = csv.split("\n");

      expect(lines).toHaveLength(1); // Only header
      expect(lines[0]).toBe(
        "TIN,Last_Name,First_Name,Gross_Earnings,Tax_Deducted,NIS_Employee"
      );
    });
  });

  describe("NIS CS3 Schedule Generation", () => {
    it("should generate correct fixed-width format", () => {
      const employees = [createTestEmployee()];
      const payrollResults = employees.map((emp) => calculatePAYE(emp));

      const schedule = generateNISCS3Schedule(
        payrollResults,
        employees,
        "EMP123456789",
        12,
        2025
      );

      const lines = schedule.split("\n");
      expect(lines[0]).toMatch(/^NIS.*12.*2025$/); // Header format
      expect(lines.length).toBeGreaterThan(1); // Has employee data
    });
  });
});
