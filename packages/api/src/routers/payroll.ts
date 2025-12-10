import { z } from "zod";
import { protectedProcedure, requirePermission } from "../index";

// Note: No dedicated employee table exists in the schema.
// This router returns static reference data for the payroll UI.
// When an employee management feature is implemented, this can be extended
// to query from a real database table.

// ========================================
// PAYROLL (FLAT PROCEDURES)
// ========================================

// Employee management - returns static reference data
export const payrollEmployeeList = protectedProcedure
  .use(requirePermission("payroll.read"))
  .input(
    z.object({
      search: z.string().nullish(),
      department: z.string().nullish(),
      status: z.string().nullish(),
      limit: z.number().default(50),
    })
  )
  .handler(async ({ input }) => {
    // Static reference data - no employee table in schema yet
    const employees = [
      {
        id: "emp-001",
        name: "John Smith",
        email: "john.smith@company.gy",
        department: "Accounting",
        position: "Senior Accountant",
        salary: 850_000,
        status: "active",
        startDate: "2020-03-15",
        tinNumber: "TIN-12345678",
        nisNumber: "NIS-87654321",
      },
      {
        id: "emp-002",
        name: "Sarah Johnson",
        email: "sarah.johnson@company.gy",
        department: "Tax",
        position: "Tax Consultant",
        salary: 920_000,
        status: "active",
        startDate: "2019-07-01",
        tinNumber: "TIN-23456789",
        nisNumber: "NIS-98765432",
      },
      {
        id: "emp-003",
        name: "Michael Brown",
        email: "michael.brown@company.gy",
        department: "Immigration",
        position: "Immigration Specialist",
        salary: 780_000,
        status: "active",
        startDate: "2021-01-10",
        tinNumber: "TIN-34567890",
        nisNumber: "NIS-09876543",
      },
      {
        id: "emp-004",
        name: "Emily Davis",
        email: "emily.davis@company.gy",
        department: "Administration",
        position: "Office Manager",
        salary: 650_000,
        status: "active",
        startDate: "2018-11-20",
        tinNumber: "TIN-45678901",
        nisNumber: "NIS-10987654",
      },
      {
        id: "emp-005",
        name: "David Wilson",
        email: "david.wilson@company.gy",
        department: "Compliance",
        position: "Compliance Officer",
        salary: 880_000,
        status: "on_leave",
        startDate: "2022-04-05",
        tinNumber: "TIN-56789012",
        nisNumber: "NIS-21098765",
      },
    ];

    // Apply filters
    let filtered = employees;

    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchLower) ||
          emp.email.toLowerCase().includes(searchLower) ||
          emp.position.toLowerCase().includes(searchLower)
      );
    }

    if (input.department) {
      filtered = filtered.filter(
        (emp) =>
          emp.department.toLowerCase() === input.department!.toLowerCase()
      );
    }

    if (input.status) {
      filtered = filtered.filter((emp) => emp.status === input.status);
    }

    return {
      success: true,
      data: {
        items: filtered.slice(0, input.limit),
        total: filtered.length,
      },
    };
  });

export const payrollEmployeeGetById = protectedProcedure
  .use(requirePermission("payroll.read"))
  .input(z.object({ id: z.string() }))
  .handler(async ({ input }) => {
    const employees: Record<string, any> = {
      "emp-001": {
        id: "emp-001",
        name: "John Smith",
        email: "john.smith@company.gy",
        department: "Accounting",
        position: "Senior Accountant",
        salary: 850_000,
        status: "active",
        startDate: "2020-03-15",
        tinNumber: "TIN-12345678",
        nisNumber: "NIS-87654321",
        bankAccount: "XXXX-XXXX-1234",
        emergencyContact: "Jane Smith - 555-0123",
      },
    };

    const employee = employees[input.id];
    if (!employee) {
      return { success: false, data: null, message: "Employee not found" };
    }

    return { success: true, data: employee };
  });

export const payrollEmployeeCreate = protectedProcedure
  .use(requirePermission("payroll.create"))
  .input(
    z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      email: z.string().email(),
      department: z.string().optional(),
      position: z.string().optional(),
      salary: z.number().optional(),
      startDate: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    // Note: No database table - returns mock created employee
    return {
      success: true,
      data: {
        id: `emp-${Date.now()}`,
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        department: input.department || "General",
        position: input.position || "Staff",
        salary: input.salary || 0,
        status: "active",
        startDate: input.startDate || new Date().toISOString().split("T")[0],
        tinNumber: "",
        nisNumber: "",
      },
      message:
        "Employee created (Note: Employee management requires database table setup)",
    };
  });

export const payrollEmployeeUpdate = protectedProcedure
  .use(requirePermission("payroll.update"))
  .input(
    z.object({
      id: z.string(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email().optional(),
      department: z.string().optional(),
      position: z.string().optional(),
      salary: z.number().optional(),
      status: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    return {
      success: true,
      data: { id, ...data, updatedAt: new Date().toISOString() },
      message: "Employee updated",
    };
  });

export const payrollEmployeeDelete = protectedProcedure
  .use(requirePermission("payroll.delete"))
  .input(z.object({ id: z.string() }))
  .handler(async () => ({ success: true, message: "Employee deleted" }));

// Payroll calculation for a single employee
export const payrollCalculate = protectedProcedure
  .use(requirePermission("payroll.calculate"))
  .input(
    z.object({
      employeeId: z.string(),
      grossSalary: z.number().min(0),
      allowances: z.number().default(0),
      deductions: z.number().default(0),
      period: z.string().optional(),
    })
  )
  .handler(async ({ input }) => {
    const { grossSalary, allowances, deductions } = input;

    // Guyana 2025 tax constants
    const PAYE_THRESHOLD = 130_000; // Tax-free threshold
    const PAYE_SECOND_BAND = 260_000; // Second band threshold
    const PAYE_FIRST_RATE = 0.25; // 25% for first band (reduced from 28%)
    const PAYE_SECOND_RATE = 0.35; // 35% for second band (reduced from 40%)
    const NIS_CEILING = 280_000;

    const taxableIncome = grossSalary + allowances - deductions;

    // PAYE calculation using 2025 progressive rates
    let payeTax = 0;
    if (taxableIncome > PAYE_THRESHOLD) {
      if (taxableIncome <= PAYE_SECOND_BAND) {
        // First band: 25% on amount above threshold
        payeTax = (taxableIncome - PAYE_THRESHOLD) * PAYE_FIRST_RATE;
      } else {
        // First band: 25% on $130,001 - $260,000
        payeTax = (PAYE_SECOND_BAND - PAYE_THRESHOLD) * PAYE_FIRST_RATE;
        // Second band: 35% on amount above $260,000
        payeTax += (taxableIncome - PAYE_SECOND_BAND) * PAYE_SECOND_RATE;
      }
    }

    // NIS calculation (5.6% employee, 8.4% employer) - capped at ceiling
    const nisEmployee = Math.min(grossSalary, NIS_CEILING) * 0.056;
    const nisEmployer = Math.min(grossSalary, NIS_CEILING) * 0.084;

    const netSalary =
      grossSalary + allowances - deductions - payeTax - nisEmployee;

    return {
      success: true,
      data: {
        employeeId: input.employeeId,
        period: input.period || new Date().toISOString().slice(0, 7),
        grossSalary,
        allowances,
        deductions,
        taxableIncome,
        payeTax,
        nisEmployee,
        nisEmployer,
        totalDeductions: payeTax + nisEmployee,
        netSalary,
        employerCosts: {
          salary: grossSalary,
          nisContribution: nisEmployer,
          total: grossSalary + nisEmployer,
        },
      },
    };
  });

// Payroll runs
export const payrollRunsList = protectedProcedure
  .use(requirePermission("payroll.read"))
  .input(
    z.object({
      year: z.number().optional(),
      month: z.number().optional(),
      status: z.string().optional(),
    })
  )
  .handler(async () => {
    // Static reference data for payroll runs
    return {
      success: true,
      data: {
        items: [
          {
            id: "run-001",
            period: "2024-11",
            payDate: "2024-11-30",
            status: "completed",
            employeeCount: 5,
            totalGross: 4_080_000,
            totalNet: 2_936_000,
            totalTax: 892_400,
            totalNis: 251_600,
          },
          {
            id: "run-002",
            period: "2024-10",
            payDate: "2024-10-31",
            status: "completed",
            employeeCount: 5,
            totalGross: 4_080_000,
            totalNet: 2_936_000,
            totalTax: 892_400,
            totalNis: 251_600,
          },
        ],
        total: 2,
      },
    };
  });

export const payrollRunsCreate = protectedProcedure
  .use(requirePermission("payroll.create"))
  .input(
    z.object({
      payPeriodStart: z.string(),
      payPeriodEnd: z.string(),
      payDate: z.string(),
    })
  )
  .handler(async ({ input }) => ({
    success: true,
    data: {
      id: `run-${Date.now()}`,
      ...input,
      status: "draft",
      employeeCount: 0,
      totalGross: 0,
      totalNet: 0,
      createdAt: new Date().toISOString(),
    },
    message: "Payroll run created",
  }));

// Get departments list
export const payrollDepartments = protectedProcedure
  .use(requirePermission("payroll.read"))
  .handler(async () => ({
    success: true,
    data: [
      "Accounting",
      "Tax",
      "Immigration",
      "Compliance",
      "Administration",
      "Legal",
      "HR",
    ],
  }));
