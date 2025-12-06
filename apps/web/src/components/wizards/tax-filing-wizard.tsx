"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  calculateVAT,
  formatGuyanacurrency,
  GUYANA_TAX_CONFIG_2025,
  validateTINNumber,
} from "@/lib/tax-calculations";
import { cn } from "@/lib/utils";

// Filing types based on GRA requirements
const FILING_TYPES = [
  {
    value: "PAYE_MONTHLY",
    label: "PAYE Monthly Return",
    description: "Monthly Pay-As-You-Earn tax return",
    icon: Users,
    deadline: "14th of following month",
  },
  {
    value: "VAT_QUARTERLY",
    label: "VAT Quarterly Return",
    description: "Form C-104 VAT submission",
    icon: Calculator,
    deadline: "21st of month after quarter end",
  },
  {
    value: "INCOME_TAX_ANNUAL",
    label: "Annual Income Tax",
    description: "Annual income tax return filing",
    icon: FileText,
    deadline: "April 30th",
  },
  {
    value: "NIS_MONTHLY",
    label: "NIS Contribution",
    description: "National Insurance monthly submission",
    icon: Users,
    deadline: "14th of following month",
  },
] as const;

// Mock clients for demo - in production this would come from API
const MOCK_CLIENTS = [
  {
    id: "1",
    name: "Demerara Sugar Company Ltd",
    tin: "123456789",
    type: "COMPANY",
  },
  {
    id: "2",
    name: "John Smith",
    tin: "987654321",
    type: "INDIVIDUAL",
  },
  {
    id: "3",
    name: "Georgetown Traders Inc",
    tin: "456789123",
    type: "COMPANY",
  },
  {
    id: "4",
    name: "Caribbean Tech Solutions",
    tin: "789123456",
    type: "COMPANY",
  },
];

// Validation schemas for each step
const step1Schema = z.object({
  filingType: z.enum([
    "PAYE_MONTHLY",
    "VAT_QUARTERLY",
    "INCOME_TAX_ANNUAL",
    "NIS_MONTHLY",
  ]),
});

const step2Schema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  clientTIN: z.string().refine(validateTINNumber, "Invalid TIN format"),
});

const step3Schema = z.object({
  taxYear: z.number().min(2020).max(2030),
  taxMonth: z.number().min(1).max(12).optional(),
  taxQuarter: z.number().min(1).max(4).optional(),
});

const step4Schema = z.object({
  // PAYE fields
  totalGrossPay: z.number().min(0).optional(),
  totalEmployees: z.number().min(0).optional(),
  totalNISEmployee: z.number().min(0).optional(),
  totalNISEmployer: z.number().min(0).optional(),
  // VAT fields
  standardRatedSales: z.number().min(0).optional(),
  zeroRatedSales: z.number().min(0).optional(),
  exemptSales: z.number().min(0).optional(),
  standardRatedPurchases: z.number().min(0).optional(),
  // Income Tax fields
  grossIncome: z.number().min(0).optional(),
  allowableDeductions: z.number().min(0).optional(),
});

const step5Schema = z.object({
  calculatedTax: z.number(),
  penaltiesInterest: z.number().min(0),
  previousCredits: z.number().min(0),
  totalDue: z.number(),
});

const step6Schema = z.object({
  declarationConfirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm the declaration",
  }),
  notes: z.string().optional(),
});

const taxFilingSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema)
  .merge(step6Schema);

type TaxFilingFormData = z.infer<typeof taxFilingSchema>;

// Step 1: Select Filing Type
function FilingTypeStep({
  form,
  onNext,
}: {
  form: UseFormReturn<TaxFilingFormData>;
  onNext: () => void;
}) {
  const selectedType = form.watch("filingType");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Select Filing Type</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FILING_TYPES.map((type) => (
            <div
              className={cn(
                "cursor-pointer rounded-lg border p-4 transition-all hover:border-primary/50",
                selectedType === type.value
                  ? "border-primary bg-primary/5"
                  : "border-muted"
              )}
              key={type.value}
              onClick={() => form.setValue("filingType", type.value)}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    selectedType === type.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <type.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{type.label}</h4>
                    {selectedType === type.value && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground text-sm">
                    {type.description}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs">
                    <Calendar className="h-3 w-3" />
                    <span>Deadline: {type.deadline}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        disabled={!selectedType}
        onClick={onNext}
        type="button"
      >
        Continue to Client Selection
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// Step 2: Select Client
function ClientSelectionStep({
  form,
  onNext,
  onBack,
}: {
  form: UseFormReturn<TaxFilingFormData>;
  onNext: () => void;
  onBack: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const selectedClientId = form.watch("clientId");

  const filteredClients = MOCK_CLIENTS.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.tin.includes(searchTerm)
  );

  const handleClientSelect = (client: (typeof MOCK_CLIENTS)[0]) => {
    form.setValue("clientId", client.id);
    form.setValue("clientTIN", client.tin);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Select Client</h3>

        <div className="relative mb-4">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or TIN..."
            value={searchTerm}
          />
        </div>

        <div className="max-h-[300px] space-y-2 overflow-y-auto">
          {filteredClients.map((client) => (
            <div
              className={cn(
                "flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all hover:border-primary/50",
                selectedClientId === client.id
                  ? "border-primary bg-primary/5"
                  : "border-muted"
              )}
              key={client.id}
              onClick={() => handleClientSelect(client)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{client.name}</h4>
                  <Badge variant="outline">{client.type}</Badge>
                </div>
                <p className="mt-1 text-muted-foreground text-sm">
                  TIN: {client.tin}
                </p>
              </div>
              {selectedClientId === client.id && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </div>
          ))}

          {filteredClients.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No clients found matching your search.
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={!selectedClientId}
          onClick={onNext}
        >
          Continue to Tax Period
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Select Tax Period
function TaxPeriodStep({
  form,
  onNext,
  onBack,
}: {
  form: UseFormReturn<TaxFilingFormData>;
  onNext: () => void;
  onBack: () => void;
}) {
  const filingType = form.watch("filingType");
  const currentYear = new Date().getFullYear();

  const showMonthSelector =
    filingType === "PAYE_MONTHLY" || filingType === "NIS_MONTHLY";
  const showQuarterSelector = filingType === "VAT_QUARTERLY";

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const quarters = [
    { value: 1, label: "Q1 (Jan-Mar)" },
    { value: 2, label: "Q2 (Apr-Jun)" },
    { value: 3, label: "Q3 (Jul-Sep)" },
    { value: 4, label: "Q4 (Oct-Dec)" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Select Tax Period</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="taxYear">Tax Year</Label>
            <Select
              onValueChange={(val) => form.setValue("taxYear", Number(val))}
              value={form.watch("taxYear")?.toString()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showMonthSelector && (
            <div>
              <Label htmlFor="taxMonth">Tax Month</Label>
              <Select
                onValueChange={(val) => form.setValue("taxMonth", Number(val))}
                value={form.watch("taxMonth")?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, index) => (
                    <SelectItem key={month} value={(index + 1).toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showQuarterSelector && (
            <div>
              <Label htmlFor="taxQuarter">Tax Quarter</Label>
              <Select
                onValueChange={(val) =>
                  form.setValue("taxQuarter", Number(val))
                }
                value={form.watch("taxQuarter")?.toString()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((quarter) => (
                    <SelectItem
                      key={quarter.value}
                      value={quarter.value.toString()}
                    >
                      {quarter.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Alert className="mt-4">
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            {filingType === "PAYE_MONTHLY" &&
              "PAYE returns must be filed by the 14th of the following month."}
            {filingType === "VAT_QUARTERLY" &&
              "VAT returns must be filed by the 21st of the month following the quarter end."}
            {filingType === "INCOME_TAX_ANNUAL" &&
              "Annual income tax returns must be filed by April 30th of the following year."}
            {filingType === "NIS_MONTHLY" &&
              "NIS contributions must be submitted by the 14th of the following month."}
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Continue to Data Entry
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 4: Enter/Review Data
function DataEntryStep({
  form,
  onNext,
  onBack,
}: {
  form: UseFormReturn<TaxFilingFormData>;
  onNext: () => void;
  onBack: () => void;
}) {
  const filingType = form.watch("filingType");

  const renderPAYEForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totalEmployees">Number of Employees</Label>
          <Input
            id="totalEmployees"
            type="number"
            {...form.register("totalEmployees", { valueAsNumber: true })}
            placeholder="0"
          />
        </div>
        <div>
          <Label htmlFor="totalGrossPay">Total Gross Pay (GYD)</Label>
          <Input
            id="totalGrossPay"
            type="number"
            {...form.register("totalGrossPay", { valueAsNumber: true })}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="totalNISEmployee">Employee NIS Contributions</Label>
          <Input
            id="totalNISEmployee"
            type="number"
            {...form.register("totalNISEmployee", { valueAsNumber: true })}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="totalNISEmployer">Employer NIS Contributions</Label>
          <Input
            id="totalNISEmployer"
            type="number"
            {...form.register("totalNISEmployer", { valueAsNumber: true })}
            placeholder="0.00"
          />
        </div>
      </div>
    </div>
  );

  const renderVATForm = () => (
    <div className="space-y-4">
      <h4 className="font-medium">Sales/Output VAT</h4>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="standardRatedSales">Standard Rated Sales</Label>
          <Input
            id="standardRatedSales"
            type="number"
            {...form.register("standardRatedSales", { valueAsNumber: true })}
            placeholder="0.00"
          />
          <p className="mt-1 text-muted-foreground text-xs">
            14% VAT applies
          </p>
        </div>
        <div>
          <Label htmlFor="zeroRatedSales">Zero-Rated Sales</Label>
          <Input
            id="zeroRatedSales"
            type="number"
            {...form.register("zeroRatedSales", { valueAsNumber: true })}
            placeholder="0.00"
          />
          <p className="mt-1 text-muted-foreground text-xs">Exports, etc.</p>
        </div>
        <div>
          <Label htmlFor="exemptSales">Exempt Sales</Label>
          <Input
            id="exemptSales"
            type="number"
            {...form.register("exemptSales", { valueAsNumber: true })}
            placeholder="0.00"
          />
          <p className="mt-1 text-muted-foreground text-xs">
            Financial services
          </p>
        </div>
      </div>

      <Separator />

      <h4 className="font-medium">Purchases/Input VAT</h4>
      <div>
        <Label htmlFor="standardRatedPurchases">Standard Rated Purchases</Label>
        <Input
          id="standardRatedPurchases"
          type="number"
          {...form.register("standardRatedPurchases", { valueAsNumber: true })}
          placeholder="0.00"
        />
      </div>
    </div>
  );

  const renderIncomeTaxForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="grossIncome">Gross Income (GYD)</Label>
        <Input
          id="grossIncome"
          type="number"
          {...form.register("grossIncome", { valueAsNumber: true })}
          placeholder="0.00"
        />
      </div>
      <div>
        <Label htmlFor="allowableDeductions">Allowable Deductions (GYD)</Label>
        <Input
          id="allowableDeductions"
          type="number"
          {...form.register("allowableDeductions", { valueAsNumber: true })}
          placeholder="0.00"
        />
        <p className="mt-1 text-muted-foreground text-xs">
          Include NIS contributions, statutory deductions, etc.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Enter Tax Data</h3>

        {filingType === "PAYE_MONTHLY" && renderPAYEForm()}
        {filingType === "VAT_QUARTERLY" && renderVATForm()}
        {filingType === "INCOME_TAX_ANNUAL" && renderIncomeTaxForm()}
        {filingType === "NIS_MONTHLY" && renderPAYEForm()}
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Calculate & Validate
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 5: Calculate & Validate
function CalculationStep({
  form,
  onNext,
  onBack,
}: {
  form: UseFormReturn<TaxFilingFormData>;
  onNext: () => void;
  onBack: () => void;
}) {
  const filingType = form.watch("filingType");
  const formData = form.getValues();

  // Calculate taxes based on filing type
  let calculatedTax = 0;
  let breakdown: { label: string; amount: number }[] = [];

  if (filingType === "PAYE_MONTHLY") {
    const grossPay = formData.totalGrossPay || 0;
    // Simplified PAYE calculation - in production would use full calculation
    const taxable = Math.max(
      0,
      grossPay - GUYANA_TAX_CONFIG_2025.PAYE.STATUTORY_FREE_PAY
    );
    const band1 = Math.min(
      taxable,
      GUYANA_TAX_CONFIG_2025.PAYE.TAX_BAND_1_LIMIT
    );
    const band2 = Math.max(
      0,
      taxable - GUYANA_TAX_CONFIG_2025.PAYE.TAX_BAND_1_LIMIT
    );

    const band1Tax = band1 * GUYANA_TAX_CONFIG_2025.PAYE.TAX_BAND_1_RATE;
    const band2Tax = band2 * GUYANA_TAX_CONFIG_2025.PAYE.TAX_BAND_2_RATE;
    calculatedTax = band1Tax + band2Tax;

    breakdown = [
      { label: "Total Gross Pay", amount: grossPay },
      {
        label: "Statutory Free Pay",
        amount: GUYANA_TAX_CONFIG_2025.PAYE.STATUTORY_FREE_PAY,
      },
      { label: "Taxable Income", amount: taxable },
      { label: "Band 1 Tax (25%)", amount: band1Tax },
      { label: "Band 2 Tax (35%)", amount: band2Tax },
      { label: "Total PAYE Due", amount: calculatedTax },
    ];
  } else if (filingType === "VAT_QUARTERLY") {
    const vatCalc = calculateVAT(
      formData.standardRatedSales || 0,
      formData.zeroRatedSales || 0,
      formData.exemptSales || 0,
      formData.standardRatedPurchases || 0
    );
    calculatedTax = vatCalc.totalVATDue;

    breakdown = [
      { label: "Total Sales", amount: vatCalc.totalSales },
      { label: "Output VAT (14%)", amount: vatCalc.outputVAT },
      { label: "Total Purchases", amount: vatCalc.totalPurchases },
      { label: "Input VAT (Claimable)", amount: vatCalc.inputVAT },
      { label: "Net VAT Due", amount: vatCalc.netVAT },
    ];
  } else if (filingType === "INCOME_TAX_ANNUAL") {
    const gross = formData.grossIncome || 0;
    const deductions = formData.allowableDeductions || 0;
    const taxable = Math.max(0, gross - deductions);
    calculatedTax = taxable * 0.25; // Simplified

    breakdown = [
      { label: "Gross Income", amount: gross },
      { label: "Allowable Deductions", amount: deductions },
      { label: "Taxable Income", amount: taxable },
      { label: "Income Tax Due", amount: calculatedTax },
    ];
  }

  // Store calculated values
  form.setValue("calculatedTax", calculatedTax);
  form.setValue("totalDue", calculatedTax);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Calculation Summary</h3>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="h-5 w-5" />
              Tax Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {breakdown.map((item, index) => (
                <div
                  className={cn(
                    "flex justify-between",
                    index === breakdown.length - 1 &&
                      "border-t pt-3 font-semibold"
                  )}
                  key={item.label}
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono">
                    {formatGuyanacurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="penaltiesInterest">
              Penalties & Interest (if any)
            </Label>
            <Input
              id="penaltiesInterest"
              type="number"
              {...form.register("penaltiesInterest", { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="previousCredits">Previous Credits</Label>
            <Input
              id="previousCredits"
              type="number"
              {...form.register("previousCredits", { valueAsNumber: true })}
              placeholder="0.00"
            />
          </div>
        </div>

        <Alert className="mt-4 border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Calculation validated successfully. Please review the summary before
            proceeding.
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Review & Submit
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 6: Review & Submit
function ReviewSubmitStep({
  form,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  form: UseFormReturn<TaxFilingFormData>;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const formData = form.getValues();
  const filingType = FILING_TYPES.find((t) => t.value === formData.filingType);
  const client = MOCK_CLIENTS.find((c) => c.id === formData.clientId);

  const totalDue =
    (formData.calculatedTax || 0) +
    (formData.penaltiesInterest || 0) -
    (formData.previousCredits || 0);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Review & Submit</h3>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filing Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filing Type:</span>
                <Badge>{filingType?.label}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Client:</span>
                <span className="font-medium">{client?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TIN:</span>
                <span className="font-mono">{formData.clientTIN}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period:</span>
                <span>
                  {formData.taxMonth && `Month ${formData.taxMonth}, `}
                  {formData.taxQuarter && `Q${formData.taxQuarter}, `}
                  {formData.taxYear}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-base">Amount Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Calculated Tax:</span>
                  <span className="font-mono">
                    {formatGuyanacurrency(formData.calculatedTax || 0)}
                  </span>
                </div>
                {(formData.penaltiesInterest || 0) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Penalties & Interest:</span>
                    <span className="font-mono">
                      +{formatGuyanacurrency(formData.penaltiesInterest || 0)}
                    </span>
                  </div>
                )}
                {(formData.previousCredits || 0) > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Previous Credits:</span>
                    <span className="font-mono">
                      -{formatGuyanacurrency(formData.previousCredits || 0)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Due:</span>
                  <span className="font-mono">
                    {formatGuyanacurrency(totalDue)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <div className="flex items-start gap-2 rounded-lg border p-4">
              <input
                className="mt-1"
                id="declarationConfirmed"
                type="checkbox"
                {...form.register("declarationConfirmed")}
              />
              <Label className="cursor-pointer" htmlFor="declarationConfirmed">
                I declare that the information provided in this return is true,
                complete, and correct to the best of my knowledge. I understand
                that false declarations may result in penalties.
              </Label>
            </div>
            {form.formState.errors.declarationConfirmed && (
              <p className="text-red-500 text-sm">
                {form.formState.errors.declarationConfirmed.message}
              </p>
            )}

            <div>
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                placeholder="Any additional notes for this filing..."
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button className="flex-1" disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? "Submitting..." : "Submit Filing"}
        </Button>
      </div>

      <div className="flex justify-center gap-2">
        <Button size="sm" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button size="sm" variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Preview GRA Form
        </Button>
      </div>
    </div>
  );
}

// Main Tax Filing Wizard Component
export default function TaxFilingWizard({
  onComplete,
  onCancel,
}: {
  onComplete?: (data: TaxFilingFormData) => void;
  onCancel?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TaxFilingFormData>({
    resolver: zodResolver(taxFilingSchema),
    defaultValues: {
      clientId: "",
      clientTIN: "",
      taxYear: new Date().getFullYear(),
      penaltiesInterest: 0,
      previousCredits: 0,
      declarationConfirmed: false,
    } as Partial<TaxFilingFormData>,
  });

  const steps = [
    { title: "Filing Type", description: "Select the type of tax filing" },
    { title: "Client", description: "Choose the client for this filing" },
    { title: "Tax Period", description: "Select the tax period" },
    { title: "Data Entry", description: "Enter tax data" },
    { title: "Calculate", description: "Review calculations" },
    { title: "Submit", description: "Review and submit" },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const data = form.getValues();

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      onComplete?.(data);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepComponents = [
    <FilingTypeStep form={form} key="step1" onNext={handleNext} />,
    <ClientSelectionStep
      form={form}
      key="step2"
      onBack={handleBack}
      onNext={handleNext}
    />,
    <TaxPeriodStep
      form={form}
      key="step3"
      onBack={handleBack}
      onNext={handleNext}
    />,
    <DataEntryStep
      form={form}
      key="step4"
      onBack={handleBack}
      onNext={handleNext}
    />,
    <CalculationStep
      form={form}
      key="step5"
      onBack={handleBack}
      onNext={handleNext}
    />,
    <ReviewSubmitStep
      form={form}
      isSubmitting={isSubmitting}
      key="step6"
      onBack={handleBack}
      onSubmit={handleSubmit}
    />,
  ];

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl">Tax Filing Wizard</h1>
            <p className="text-muted-foreground">
              Complete your GRA tax filing in a few simple steps
            </p>
          </div>
          {onCancel && (
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>
              Step {currentStep + 1} of {steps.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress className="h-2" value={progress} />
        </div>

        {/* Step indicators */}
        <div className="mt-6 flex items-center justify-between">
          {steps.map((step, index) => (
            <div
              className={cn(
                "flex flex-col items-center text-center",
                index <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
              key={index}
            >
              <div
                className={cn(
                  "mb-2 flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm",
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                      ? "border-2 border-primary bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="hidden text-xs sm:block">{step.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Current step content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>{stepComponents[currentStep]}</CardContent>
      </Card>
    </div>
  );
}
