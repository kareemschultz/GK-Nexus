"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calculator,
  Download,
  FileText,
  Info,
  Printer,
  Save,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  calculatePAYE,
  formatGuyanacurrency,
  GUYANA_TAX_CONFIG_2025,
  type PayeCalculationResult,
  type PayrollEmployee,
  validateNISNumber,
} from "@/lib/tax-calculations";

// Validation schema
const employeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  nisNumber: z
    .string()
    .min(1, "NIS number is required")
    .refine(validateNISNumber, "Invalid NIS number format"),
  basicSalary: z.number().min(0, "Basic salary must be positive"),
  overtime: z.number().min(0).default(0),
  allowances: z.number().min(0).default(0),
  bonuses: z.number().min(0).default(0),
  dependents: z.number().min(0).max(10).default(0),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EnhancedPayeCalculatorProps {
  onSave?: (
    employee: PayrollEmployee,
    calculation: PayeCalculationResult
  ) => void;
  enablePDFExport?: boolean;
  showAdvancedFeatures?: boolean;
}

export function EnhancedPayeCalculator({
  onSave,
  enablePDFExport = true,
  showAdvancedFeatures = true,
}: EnhancedPayeCalculatorProps) {
  const [calculation, setCalculation] = useState<PayeCalculationResult | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState(false);

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

      toast.success("PAYE calculation completed", {
        description: `Net pay: ${formatGuyanacurrency(result.netPay)}`,
      });
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

      toast.success("Calculation saved", {
        description: "PAYE calculation has been saved to your records",
      });
    }
  };

  const generatePDFReport = async () => {
    if (!calculation) return;

    setIsGeneratingPDF(true);

    try {
      // Simulate PDF generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const data = form.getValues();
      const reportData = {
        employee: data,
        calculation,
        generatedAt: new Date().toISOString(),
        reportNumber: `PAYE-${Date.now()}`,
      };

      // Create PDF content as HTML
      const pdfContent = generatePDFContent(reportData);

      // In a real implementation, you would use a library like jsPDF or Puppeteer
      // For demo, we'll create a downloadable HTML file
      const blob = new Blob([pdfContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PAYE_Report_${data.firstName}_${data.lastName}_${new Date().toISOString().split("T")[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("PDF report generated", {
        description: "PAYE tax report has been downloaded",
      });
    } catch (error) {
      toast.error("Failed to generate PDF", {
        description: "There was an error generating the PDF report",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const generatePDFContent = (reportData: any) => {
    const { employee, calculation } = reportData;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PAYE Tax Calculation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
        .section { margin-bottom: 30px; }
        .section-title { font-size: 18px; font-weight: bold; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .row strong { font-weight: bold; }
        .highlight { background-color: #f0f9ff; padding: 10px; border-left: 4px solid #2563eb; }
        .tax-breakdown { background-color: #f9fafb; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; color: #666; font-size: 12px; }
        @media print { body { margin: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">GK-Nexus Suite</div>
        <h1>PAYE Tax Calculation Report</h1>
        <p>Generated on: ${new Date(reportData.generatedAt).toLocaleDateString(
          "en-GY",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        )}</p>
        <p>Report Number: ${reportData.reportNumber}</p>
    </div>

    <div class="section">
        <h2 class="section-title">Employee Information</h2>
        <div class="row"><span>Name:</span><strong>${employee.firstName} ${employee.lastName}</strong></div>
        <div class="row"><span>NIS Number:</span><strong>${employee.nisNumber}</strong></div>
        <div class="row"><span>Number of Dependents:</span><strong>${employee.dependents}</strong></div>
    </div>

    <div class="section">
        <h2 class="section-title">Earnings Breakdown</h2>
        <div class="row"><span>Basic Salary:</span><strong>${formatGuyanacurrency(employee.basicSalary)}</strong></div>
        <div class="row"><span>Overtime:</span><strong>${formatGuyanacurrency(employee.overtime)}</strong></div>
        <div class="row"><span>Allowances:</span><strong>${formatGuyanacurrency(employee.allowances)}</strong></div>
        <div class="row"><span>Bonuses:</span><strong>${formatGuyanacurrency(employee.bonuses)}</strong></div>
        <div class="row"><span><strong>Gross Earnings:</strong></span><strong>${formatGuyanacurrency(calculation.grossEarnings)}</strong></div>
    </div>

    <div class="section">
        <h2 class="section-title">Tax Calculation (Guyana 2025)</h2>
        <div class="tax-breakdown">
            <div class="row"><span>Statutory Free Pay:</span><strong>${formatGuyanacurrency(calculation.statutoryFreePay)}</strong></div>
            <div class="row"><span>Child Allowance:</span><strong>${formatGuyanacurrency(calculation.childAllowance)}</strong></div>
            <div class="row"><span>Tax-Free Overtime:</span><strong>${formatGuyanacurrency(calculation.overtimeTaxFree)}</strong></div>
            <div class="row"><span>Taxable Income:</span><strong>${formatGuyanacurrency(calculation.taxableIncome)}</strong></div>

            ${
              calculation.taxBand1Tax > 0
                ? `
            <div style="margin-top: 15px; margin-bottom: 10px;"><strong>Tax Bands Applied:</strong></div>
            <div class="row"><span>• Band 1 (25%) on first ${formatGuyanacurrency(GUYANA_TAX_CONFIG_2025.PAYE.TAX_BAND_1_LIMIT)}:</span><strong>${formatGuyanacurrency(calculation.taxBand1Tax)}</strong></div>
            `
                : ""
            }

            ${
              calculation.taxBand2Tax > 0
                ? `
            <div class="row"><span>• Band 2 (35%) on amount above ${formatGuyanacurrency(GUYANA_TAX_CONFIG_2025.PAYE.TAX_BAND_1_LIMIT)}:</span><strong>${formatGuyanacurrency(calculation.taxBand2Tax)}</strong></div>
            `
                : ""
            }

            <div class="row"><span><strong>Total PAYE Tax:</strong></span><strong>${formatGuyanacurrency(calculation.totalPAYETax)}</strong></div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">NIS Contributions</h2>
        <div class="row"><span>NIS-able Earnings:</span><strong>${formatGuyanacurrency(calculation.nisableEarnings)}</strong></div>
        <div class="row"><span>Employee NIS (5.6%):</span><strong>${formatGuyanacurrency(calculation.employeeNISContribution)}</strong></div>
        <div class="row"><span>Employer NIS (8.4%):</span><strong>${formatGuyanacurrency(calculation.employerNISContribution)}</strong></div>
    </div>

    <div class="section">
        <h2 class="section-title">Final Summary</h2>
        <div class="highlight">
            <div class="row"><span>Gross Earnings:</span><strong>${formatGuyanacurrency(calculation.grossEarnings)}</strong></div>
            <div class="row"><span>Total Deductions:</span><strong>${formatGuyanacurrency(calculation.totalDeductions)}</strong></div>
            <div class="row" style="font-size: 18px; margin-top: 10px;"><span><strong>NET PAY:</strong></span><strong style="color: #059669;">${formatGuyanacurrency(calculation.netPay)}</strong></div>
        </div>

        <div style="margin-top: 20px;">
            <div class="row"><span><strong>Total Employment Cost (Employer):</strong></span><strong>${formatGuyanacurrency(calculation.grossEarnings + calculation.employerNISContribution)}</strong></div>
        </div>
    </div>

    <div class="footer">
        <p>This report was generated by GK-Nexus Suite using Guyana Revenue Authority (GRA) approved tax rates for 2025.</p>
        <p>For questions about this calculation, please contact your tax advisor.</p>
        <p><strong>Disclaimer:</strong> This calculation is for informational purposes only. Please verify with current GRA regulations.</p>
    </div>
</body>
</html>`;
  };

  const { PAYE, NIS } = GUYANA_TAX_CONFIG_2025;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-3xl">
            <Calculator className="h-8 w-8" />
            Enhanced PAYE Calculator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Calculate PAYE tax with advanced features and PDF export capability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-sm" variant="outline">
            Guyana Budget 2025
          </Badge>
          {enablePDFExport && (
            <Badge className="text-sm" variant="secondary">
              PDF Export
            </Badge>
          )}
        </div>
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...form.register("firstName")}
                    aria-describedby={
                      form.formState.errors.firstName
                        ? "firstName-error"
                        : undefined
                    }
                    aria-invalid={!!form.formState.errors.firstName}
                    autoComplete="given-name"
                    placeholder="John"
                  />
                  {form.formState.errors.firstName && (
                    <p
                      className="mt-1 text-destructive text-sm"
                      id="firstName-error"
                      role="alert"
                    >
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...form.register("lastName")}
                    aria-describedby={
                      form.formState.errors.lastName
                        ? "lastName-error"
                        : undefined
                    }
                    aria-invalid={!!form.formState.errors.lastName}
                    autoComplete="family-name"
                    placeholder="Doe"
                  />
                  {form.formState.errors.lastName && (
                    <p
                      className="mt-1 text-destructive text-sm"
                      id="lastName-error"
                      role="alert"
                    >
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
                  aria-describedby={
                    form.formState.errors.nisNumber
                      ? "nisNumber-error nisNumber-help"
                      : "nisNumber-help"
                  }
                  aria-invalid={!!form.formState.errors.nisNumber}
                  inputMode="text"
                  placeholder="123456789 or A-123456-B"
                />
                <p
                  className="mt-1 text-muted-foreground text-xs"
                  id="nisNumber-help"
                >
                  Enter your National Insurance Scheme number
                </p>
                {form.formState.errors.nisNumber && (
                  <p
                    className="mt-1 text-destructive text-sm"
                    id="nisNumber-error"
                    role="alert"
                  >
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
                  inputMode="decimal"
                  step="0.01"
                  type="number"
                  {...form.register("basicSalary", { valueAsNumber: true })}
                  aria-describedby={
                    form.formState.errors.basicSalary
                      ? "basicSalary-error basicSalary-help"
                      : "basicSalary-help"
                  }
                  aria-invalid={!!form.formState.errors.basicSalary}
                  placeholder="150000"
                />
                <p
                  className="mt-1 text-muted-foreground text-xs"
                  id="basicSalary-help"
                >
                  Enter monthly basic salary amount
                </p>
                {form.formState.errors.basicSalary && (
                  <p
                    className="mt-1 text-destructive text-sm"
                    id="basicSalary-error"
                    role="alert"
                  >
                    {form.formState.errors.basicSalary.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {isCalculating ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                    Calculating...
                  </div>
                ) : (
                  "Calculate PAYE & NIS"
                )}
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
          {isCalculating ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Calculating Results...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-16" />
                <Skeleton className="h-24" />
                <Skeleton className="h-16" />
              </CardContent>
            </Card>
          ) : calculation ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Calculation Results
                  </CardTitle>
                  {showAdvancedFeatures && (
                    <Button
                      onClick={() => setShowTaxBreakdown(!showTaxBreakdown)}
                      size="sm"
                      variant="ghost"
                    >
                      {showTaxBreakdown ? "Hide" : "Show"} Breakdown
                    </Button>
                  )}
                </div>
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

                    {showTaxBreakdown && calculation.totalPAYETax > 0 && (
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
                        <div className="flex justify-between">
                          <span>• Taxable Income:</span>
                          <span>
                            {formatGuyanacurrency(calculation.taxableIncome)}
                          </span>
                        </div>
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
                <div className="flex flex-col gap-2 pt-4 sm:flex-row">
                  <Button
                    className="flex items-center gap-2"
                    onClick={() => window.print()}
                    size="sm"
                    variant="outline"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>

                  {enablePDFExport && (
                    <Button
                      className="flex items-center gap-2"
                      disabled={isGeneratingPDF}
                      onClick={generatePDFReport}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="h-4 w-4" />
                      {isGeneratingPDF ? "Generating..." : "Export PDF"}
                    </Button>
                  )}

                  {onSave && (
                    <Button
                      className="flex items-center gap-2"
                      onClick={handleSave}
                      size="sm"
                    >
                      <Save className="h-4 w-4" />
                      Save to Payroll
                    </Button>
                  )}

                  {showAdvancedFeatures && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="flex items-center gap-2"
                          size="sm"
                          variant="outline"
                        >
                          <FileText className="h-4 w-4" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Detailed Tax Calculation</DialogTitle>
                          <DialogDescription>
                            Complete breakdown of PAYE tax calculation
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>Statutory Free Pay:</strong>
                              <br />
                              {formatGuyanacurrency(
                                calculation.statutoryFreePay
                              )}
                            </div>
                            <div>
                              <strong>Child Allowance:</strong>
                              <br />
                              {formatGuyanacurrency(calculation.childAllowance)}
                            </div>
                            <div>
                              <strong>Tax-Free Overtime:</strong>
                              <br />
                              {formatGuyanacurrency(
                                calculation.overtimeTaxFree
                              )}
                            </div>
                            <div>
                              <strong>NIS-able Earnings:</strong>
                              <br />
                              {formatGuyanacurrency(
                                calculation.nisableEarnings
                              )}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
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
