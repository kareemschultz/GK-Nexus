"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Download, FileText, Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import {
  calculatePAYE,
  formatGuyanacurrency,
  GUYANA_TAX_CONFIG_2025,
  type PayeCalculationResult,
  type PayrollEmployee,
  validateNISNumber,
} from "@/lib/tax-calculations";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

// Validation schema
const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  nisNumber: z
    .string()
    .min(1, "NIS number is required")
    .refine(validateNISNumber, "Invalid NIS number format"),
  basicSalary: z.number().min(0, "Basic salary must be positive"),
  overtime: z.number().min(0),
  allowances: z.number().min(0),
  bonuses: z.number().min(0),
  dependents: z.number().min(0).max(10),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface PayeCalculatorProps {
  onSave?: (
    employee: PayrollEmployee,
    calculation: PayeCalculationResult
  ) => void;
}

export default function PayeCalculator({ onSave }: PayeCalculatorProps) {
  const [calculation, setCalculation] = useState<PayeCalculationResult | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      nisNumber: "",
      basicSalary: 0,
      overtime: 0,
      allowances: 0,
      bonuses: 0,
      dependents: 0,
    },
  });

  const handleCalculate = (data: EmployeeFormData) => {
    setIsCalculating(true);

    // Simulate calculation delay for UX
    setTimeout(() => {
      const employee: PayrollEmployee = {
        id: Date.now().toString(),
        ...data,
      };

      const result = calculatePAYE(employee);
      setCalculation(result);
      setIsCalculating(false);
    }, 500);
  };

  const handleSave = () => {
    if (calculation) {
      const data = form.getValues();
      const employee: PayrollEmployee = {
        id: Date.now().toString(),
        ...data,
      };
      onSave?.(employee, calculation);
    }
  };

  const { PAYE, NIS } = GUYANA_TAX_CONFIG_2025;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-3xl">
            <Calculator className="h-8 w-8" />
            PAYE Calculator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Calculate PAYE tax based on Guyana 2025 tax rates and regulations
          </p>
        </div>
        <Badge className="text-sm" variant="outline">
          Guyana Budget 2025
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>
              Enter employee details to calculate PAYE tax and NIS contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handleCalculate)}
            >
              {/* Personal Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    placeholder="John"
                  />
                  {form.formState.errors.firstName && (
                    <p className="mt-1 text-red-500 text-sm">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    placeholder="Doe"
                  />
                  {form.formState.errors.lastName && (
                    <p className="mt-1 text-red-500 text-sm">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="nisNumber">NIS Number</Label>
                <Input
                  id="nisNumber"
                  {...form.register("nisNumber")}
                  placeholder="123456789 or A-123456-B"
                />
                {form.formState.errors.nisNumber && (
                  <p className="mt-1 text-red-500 text-sm">
                    {form.formState.errors.nisNumber.message}
                  </p>
                )}
              </div>

              {/* Earnings */}
              <Separator />
              <h3 className="font-medium text-lg">Monthly Earnings</h3>

              <div>
                <Label htmlFor="basicSalary">Basic Salary (GYD)</Label>
                <Input
                  id="basicSalary"
                  step="0.01"
                  type="number"
                  {...form.register("basicSalary", { valueAsNumber: true })}
                  placeholder="150000"
                />
                {form.formState.errors.basicSalary && (
                  <p className="mt-1 text-red-500 text-sm">
                    {form.formState.errors.basicSalary.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="overtime">Overtime (GYD)</Label>
                  <Input
                    id="overtime"
                    step="0.01"
                    type="number"
                    {...form.register("overtime", { valueAsNumber: true })}
                    placeholder="25000"
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    First {formatGuyanacurrency(PAYE.OVERTIME_TAX_FREE_LIMIT)}{" "}
                    is tax-free
                  </p>
                </div>
                <div>
                  <Label htmlFor="allowances">Allowances (GYD)</Label>
                  <Input
                    id="allowances"
                    step="0.01"
                    type="number"
                    {...form.register("allowances", { valueAsNumber: true })}
                    placeholder="10000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bonuses">Bonuses (GYD)</Label>
                  <Input
                    id="bonuses"
                    step="0.01"
                    type="number"
                    {...form.register("bonuses", { valueAsNumber: true })}
                    placeholder="15000"
                  />
                </div>
                <div>
                  <Label htmlFor="dependents">Number of Children</Label>
                  <Input
                    id="dependents"
                    max="10"
                    min="0"
                    type="number"
                    {...form.register("dependents", { valueAsNumber: true })}
                    placeholder="2"
                  />
                  <p className="mt-1 text-muted-foreground text-xs">
                    Max 3 children for allowance (
                    {formatGuyanacurrency(PAYE.CHILD_ALLOWANCE_PER_CHILD)} each)
                  </p>
                </div>
              </div>

              <Button className="w-full" disabled={isCalculating} type="submit">
                {isCalculating ? "Calculating..." : "Calculate PAYE & NIS"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          {/* Tax Rate Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                2025 Tax Rates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Statutory Free Pay:</span>
                  <span className="font-mono text-sm">
                    {formatGuyanacurrency(PAYE.STATUTORY_FREE_PAY)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Tax Band 1 (25%):</span>
                  <span className="font-mono text-sm">
                    First {formatGuyanacurrency(PAYE.TAX_BAND_1_LIMIT)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Tax Band 2 (35%):</span>
                  <span className="font-mono text-sm">
                    Above {formatGuyanacurrency(PAYE.TAX_BAND_1_LIMIT)}
                  </span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">NIS Employee Rate:</span>
                  <span className="font-mono text-sm">
                    {(NIS.EMPLOYEE_RATE * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">NIS Employer Rate:</span>
                  <span className="font-mono text-sm">
                    {(NIS.EMPLOYER_RATE * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">NIS Earnings Ceiling:</span>
                  <span className="font-mono text-sm">
                    {formatGuyanacurrency(NIS.EARNINGS_CEILING)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calculation Results */}
          {calculation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Calculation Results
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of PAYE tax and NIS contributions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Gross Earnings */}
                <div className="rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Gross Earnings</span>
                    <span className="font-bold font-mono text-lg">
                      {formatGuyanacurrency(calculation.grossEarnings)}
                    </span>
                  </div>
                </div>

                {/* Deductions Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-medium text-muted-foreground text-sm">
                    DEDUCTIONS
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">
                        NIS Employee Contribution:
                      </span>
                      <span className="font-mono text-sm">
                        {formatGuyanacurrency(
                          calculation.employeeNISContribution
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">PAYE Tax:</span>
                      <span className="font-mono text-sm">
                        {formatGuyanacurrency(calculation.totalPAYETax)}
                      </span>
                    </div>
                    {calculation.totalPAYETax > 0 && (
                      <div className="ml-4 space-y-1 text-muted-foreground text-xs">
                        {calculation.taxBand1Tax > 0 && (
                          <div className="flex justify-between">
                            <span>• Band 1 (25%):</span>
                            <span>
                              {formatGuyanacurrency(calculation.taxBand1Tax)}
                            </span>
                          </div>
                        )}
                        {calculation.taxBand2Tax > 0 && (
                          <div className="flex justify-between">
                            <span>• Band 2 (35%):</span>
                            <span>
                              {formatGuyanacurrency(calculation.taxBand2Tax)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between">
                    <span className="font-medium text-sm">
                      Total Deductions:
                    </span>
                    <span className="font-medium font-mono text-sm">
                      {formatGuyanacurrency(calculation.totalDeductions)}
                    </span>
                  </div>
                </div>

                {/* Net Pay */}
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Net Pay
                    </span>
                    <span className="font-bold font-mono text-green-800 text-xl dark:text-green-200">
                      {formatGuyanacurrency(calculation.netPay)}
                    </span>
                  </div>
                </div>

                {/* Employer Costs */}
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Employer NIS Contribution:</strong>{" "}
                    {formatGuyanacurrency(calculation.employerNISContribution)}
                    <br />
                    <strong>Total Employment Cost:</strong>{" "}
                    {formatGuyanacurrency(
                      calculation.grossEarnings +
                        calculation.employerNISContribution
                    )}
                  </AlertDescription>
                </Alert>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button
                    className="flex items-center gap-2"
                    onClick={() => window.print()}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4" />
                    Print
                  </Button>
                  {onSave && (
                    <Button
                      className="flex items-center gap-2"
                      onClick={handleSave}
                      size="sm"
                    >
                      <FileText className="h-4 w-4" />
                      Save to Payroll
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No calculation state */}
          {!calculation && (
            <Card>
              <CardContent className="p-8 text-center">
                <Calculator className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 font-medium text-lg">Ready to Calculate</h3>
                <p className="text-muted-foreground">
                  Fill in the employee information and click "Calculate" to see
                  the PAYE tax and NIS breakdown.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
