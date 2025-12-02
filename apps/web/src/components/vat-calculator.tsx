"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Download, FileText, Info, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatGuyanacurrency } from "@/lib/tax-calculations";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

// VAT Configuration for Guyana (updated to 12.5%)
const GUYANA_VAT_CONFIG = {
  STANDARD_RATE: 0.125, // 12.5%
  REGISTRATION_THRESHOLD: 15_000_000, // GYD 15M annual revenue
  ZERO_RATED_CATEGORIES: [
    "BASIC_FOOD_ITEMS",
    "MEDICAL_SUPPLIES",
    "EDUCATIONAL_MATERIALS",
    "EXPORTS",
    "AGRICULTURAL_PRODUCTS",
  ],
  EXEMPT_CATEGORIES: [
    "FINANCIAL_SERVICES",
    "INSURANCE",
    "RESIDENTIAL_RENT",
    "MEDICAL_SERVICES",
    "EDUCATIONAL_SERVICES",
  ],
} as const;

// Validation schemas
const vatCalculationSchema = z.object({
  // Sales and Output VAT
  standardRatedSales: z
    .number()
    .min(0, "Standard rated sales must be positive"),
  zeroRatedSales: z.number().min(0, "Zero-rated sales must be positive"),
  exemptSales: z.number().min(0, "Exempt sales must be positive"),

  // Purchases and Input VAT
  standardRatedPurchases: z
    .number()
    .min(0, "Standard rated purchases must be positive"),
  zeroRatedPurchases: z
    .number()
    .min(0, "Zero-rated purchases must be positive"),
  exemptPurchases: z.number().min(0, "Exempt purchases must be positive"),

  // Period and business info
  vatPeriod: z.string().min(1, "VAT period is required"),
  businessName: z.string().min(1, "Business name is required"),
  vatRegistrationNumber: z.string().optional(),

  // Adjustments
  adjustments: z.number(),
  previousVatCredit: z.number().min(0, "Previous VAT credit must be positive"),

  // Notes
  notes: z.string().optional(),
});

const singleVatCalculationSchema = z.object({
  netAmount: z.number().min(0, "Net amount must be positive"),
  category: z.enum([
    "STANDARD",
    "ZERO_RATED",
    "EXEMPT",
    ...GUYANA_VAT_CONFIG.ZERO_RATED_CATEGORIES,
    ...GUYANA_VAT_CONFIG.EXEMPT_CATEGORIES,
  ]),
  vatInclusive: z.boolean(),
  description: z.string().optional(),
});

type VatCalculationFormData = z.infer<typeof vatCalculationSchema>;
type SingleVatCalculationFormData = z.infer<typeof singleVatCalculationSchema>;

interface VatCalculationResult {
  // Sales totals
  totalSales: number;
  totalOutputVat: number;

  // Purchase totals
  totalPurchases: number;
  totalInputVat: number;

  // VAT calculation
  netVat: number;
  adjustments: number;
  previousCredit: number;
  totalVatDue: number;

  // Breakdown
  breakdown: {
    outputVat: {
      standardRated: number;
      zeroRated: number;
      exempt: number;
    };
    inputVat: {
      standardRated: number;
      zeroRated: number;
      exempt: number;
    };
  };
}

interface SingleVatResult {
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
  category: string;
  isExempt: boolean;
  isZeroRated: boolean;
}

interface VatCalculatorProps {
  onSave?: (calculation: VatCalculationResult) => void;
}

export default function VatCalculator({ onSave }: VatCalculatorProps) {
  const [calculation, setCalculation] = useState<VatCalculationResult | null>(
    null
  );
  const [singleVatResult, setSingleVatResult] =
    useState<SingleVatResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("period");

  const form = useForm<VatCalculationFormData>({
    resolver: zodResolver(vatCalculationSchema),
    defaultValues: {
      standardRatedSales: 0,
      zeroRatedSales: 0,
      exemptSales: 0,
      standardRatedPurchases: 0,
      zeroRatedPurchases: 0,
      exemptPurchases: 0,
      adjustments: 0,
      previousVatCredit: 0,
      vatPeriod: "",
      businessName: "",
      vatRegistrationNumber: "",
      notes: "",
    },
  });

  const singleVatForm = useForm<SingleVatCalculationFormData>({
    resolver: zodResolver(singleVatCalculationSchema),
    defaultValues: {
      netAmount: 0,
      category: "STANDARD",
      vatInclusive: false,
      description: "",
    },
  });

  const calculateVatReturn = (
    data: VatCalculationFormData
  ): VatCalculationResult => {
    // Calculate Output VAT
    const outputVatStandard =
      data.standardRatedSales * GUYANA_VAT_CONFIG.STANDARD_RATE;
    const outputVatZeroRated = 0; // Always 0 for zero-rated
    const outputVatExempt = 0; // Always 0 for exempt
    const totalOutputVat =
      outputVatStandard + outputVatZeroRated + outputVatExempt;

    // Calculate Input VAT
    const inputVatStandard =
      data.standardRatedPurchases * GUYANA_VAT_CONFIG.STANDARD_RATE;
    const inputVatZeroRated = 0; // Always 0 for zero-rated
    const inputVatExempt = 0; // Always 0 for exempt
    const totalInputVat = inputVatStandard + inputVatZeroRated + inputVatExempt;

    // Net VAT calculation
    const netVat = totalOutputVat - totalInputVat;
    const totalVatDue = Math.max(
      0,
      netVat + data.adjustments - data.previousVatCredit
    );

    const totalSales =
      data.standardRatedSales + data.zeroRatedSales + data.exemptSales;
    const totalPurchases =
      data.standardRatedPurchases +
      data.zeroRatedPurchases +
      data.exemptPurchases;

    return {
      totalSales,
      totalOutputVat,
      totalPurchases,
      totalInputVat,
      netVat,
      adjustments: data.adjustments,
      previousCredit: data.previousVatCredit,
      totalVatDue,
      breakdown: {
        outputVat: {
          standardRated: outputVatStandard,
          zeroRated: outputVatZeroRated,
          exempt: outputVatExempt,
        },
        inputVat: {
          standardRated: inputVatStandard,
          zeroRated: inputVatZeroRated,
          exempt: inputVatExempt,
        },
      },
    };
  };

  const calculateSingleVat = (
    data: SingleVatCalculationFormData
  ): SingleVatResult => {
    const isZeroRated =
      GUYANA_VAT_CONFIG.ZERO_RATED_CATEGORIES.includes(data.category as any) ||
      data.category === "ZERO_RATED";
    const isExempt =
      GUYANA_VAT_CONFIG.EXEMPT_CATEGORIES.includes(data.category as any) ||
      data.category === "EXEMPT";

    let vatRate = 0;
    if (!(isZeroRated || isExempt)) {
      vatRate = GUYANA_VAT_CONFIG.STANDARD_RATE;
    }

    let vatAmount: number;
    let grossAmount: number;
    let adjustedNetAmount: number;

    if (data.vatInclusive) {
      // VAT is included in the amount
      grossAmount = data.netAmount;
      adjustedNetAmount = data.netAmount / (1 + vatRate);
      vatAmount = grossAmount - adjustedNetAmount;
    } else {
      // VAT to be added to the amount
      adjustedNetAmount = data.netAmount;
      vatAmount = data.netAmount * vatRate;
      grossAmount = data.netAmount + vatAmount;
    }

    return {
      netAmount: Math.round(adjustedNetAmount * 100) / 100,
      vatAmount: Math.round(vatAmount * 100) / 100,
      grossAmount: Math.round(grossAmount * 100) / 100,
      vatRate,
      category: data.category,
      isExempt,
      isZeroRated,
    };
  };

  const handleCalculateReturn = (data: VatCalculationFormData) => {
    setIsCalculating(true);

    setTimeout(() => {
      const result = calculateVatReturn(data);
      setCalculation(result);
      setIsCalculating(false);
    }, 500);
  };

  const handleCalculateSingle = (data: SingleVatCalculationFormData) => {
    const result = calculateSingleVat(data);
    setSingleVatResult(result);
  };

  const handleSave = () => {
    if (calculation) {
      onSave?.(calculation);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-3xl">
            <Calculator className="h-8 w-8" />
            VAT Calculator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Calculate VAT based on Guyana Revenue Authority 12.5% standard rate
          </p>
        </div>
        <Badge className="text-sm" variant="outline">
          Guyana VAT 12.5%
        </Badge>
      </div>

      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="period">VAT Return Calculator</TabsTrigger>
          <TabsTrigger value="single">Single Transaction VAT</TabsTrigger>
        </TabsList>

        {/* VAT Return Calculator */}
        <TabsContent value="period">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>VAT Return Information</CardTitle>
                <CardDescription>
                  Enter sales and purchases data for the VAT period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit(handleCalculateReturn)}
                >
                  {/* Business Information */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        {...form.register("businessName")}
                        placeholder="Your Business Ltd"
                      />
                      {form.formState.errors.businessName && (
                        <p className="mt-1 text-red-500 text-sm">
                          {form.formState.errors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vatRegistrationNumber">
                          VAT Registration Number
                        </Label>
                        <Input
                          id="vatRegistrationNumber"
                          {...form.register("vatRegistrationNumber")}
                          placeholder="VAT123456789"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vatPeriod">VAT Period</Label>
                        <Input
                          id="vatPeriod"
                          {...form.register("vatPeriod")}
                          placeholder="2024-Q1"
                        />
                        {form.formState.errors.vatPeriod && (
                          <p className="mt-1 text-red-500 text-sm">
                            {form.formState.errors.vatPeriod.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Sales and Output VAT */}
                  <h3 className="font-medium text-lg">Sales and Output VAT</h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="standardRatedSales">
                        Standard Rated Sales (12.5% VAT) - GYD
                      </Label>
                      <Input
                        id="standardRatedSales"
                        step="0.01"
                        type="number"
                        {...form.register("standardRatedSales", {
                          valueAsNumber: true,
                        })}
                        placeholder="500000"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zeroRatedSales">
                          Zero-Rated Sales - GYD
                        </Label>
                        <Input
                          id="zeroRatedSales"
                          step="0.01"
                          type="number"
                          {...form.register("zeroRatedSales", {
                            valueAsNumber: true,
                          })}
                          placeholder="100000"
                        />
                        <p className="mt-1 text-muted-foreground text-xs">
                          Exports, basic foods, etc.
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="exemptSales">Exempt Sales - GYD</Label>
                        <Input
                          id="exemptSales"
                          step="0.01"
                          type="number"
                          {...form.register("exemptSales", {
                            valueAsNumber: true,
                          })}
                          placeholder="50000"
                        />
                        <p className="mt-1 text-muted-foreground text-xs">
                          Financial services, rent, etc.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Purchases and Input VAT */}
                  <h3 className="font-medium text-lg">
                    Purchases and Input VAT
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="standardRatedPurchases">
                        Standard Rated Purchases (12.5% VAT) - GYD
                      </Label>
                      <Input
                        id="standardRatedPurchases"
                        step="0.01"
                        type="number"
                        {...form.register("standardRatedPurchases", {
                          valueAsNumber: true,
                        })}
                        placeholder="200000"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zeroRatedPurchases">
                          Zero-Rated Purchases - GYD
                        </Label>
                        <Input
                          id="zeroRatedPurchases"
                          step="0.01"
                          type="number"
                          {...form.register("zeroRatedPurchases", {
                            valueAsNumber: true,
                          })}
                          placeholder="50000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="exemptPurchases">
                          Exempt Purchases - GYD
                        </Label>
                        <Input
                          id="exemptPurchases"
                          step="0.01"
                          type="number"
                          {...form.register("exemptPurchases", {
                            valueAsNumber: true,
                          })}
                          placeholder="25000"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Adjustments */}
                  <h3 className="font-medium text-lg">Adjustments & Credits</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="adjustments">VAT Adjustments - GYD</Label>
                      <Input
                        id="adjustments"
                        step="0.01"
                        type="number"
                        {...form.register("adjustments", {
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                      />
                      <p className="mt-1 text-muted-foreground text-xs">
                        Positive for additional VAT due
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="previousVatCredit">
                        Previous VAT Credit - GYD
                      </Label>
                      <Input
                        id="previousVatCredit"
                        step="0.01"
                        type="number"
                        {...form.register("previousVatCredit", {
                          valueAsNumber: true,
                        })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      placeholder="Additional notes for this VAT return..."
                      rows={3}
                    />
                  </div>

                  <Button
                    className="w-full"
                    disabled={isCalculating}
                    type="submit"
                  >
                    {isCalculating ? "Calculating..." : "Calculate VAT Return"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-6">
              {/* VAT Rate Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Guyana VAT Rates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Standard Rate:</span>
                      <span className="font-mono text-sm">12.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Zero-Rated:</span>
                      <span className="font-mono text-sm">0%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Exempt:</span>
                      <span className="font-mono text-sm">No VAT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Registration Threshold:</span>
                      <span className="font-mono text-sm">
                        {formatGuyanacurrency(
                          GUYANA_VAT_CONFIG.REGISTRATION_THRESHOLD
                        )}
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
                      VAT Return Summary
                    </CardTitle>
                    <CardDescription>
                      Detailed breakdown of your VAT return
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Output VAT */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-muted-foreground text-sm">
                        OUTPUT VAT
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Sales:</span>
                          <span className="font-mono text-sm">
                            {formatGuyanacurrency(calculation.totalSales)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">
                            Output VAT (Standard Rated):
                          </span>
                          <span className="font-mono text-sm">
                            {formatGuyanacurrency(
                              calculation.breakdown.outputVat.standardRated
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-sm">Total Output VAT:</span>
                          <span className="font-mono text-sm">
                            {formatGuyanacurrency(calculation.totalOutputVat)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Input VAT */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-muted-foreground text-sm">
                        INPUT VAT
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total Purchases:</span>
                          <span className="font-mono text-sm">
                            {formatGuyanacurrency(calculation.totalPurchases)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">
                            Input VAT (Claimable):
                          </span>
                          <span className="font-mono text-sm">
                            {formatGuyanacurrency(
                              calculation.breakdown.inputVat.standardRated
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between font-medium">
                          <span className="text-sm">Total Input VAT:</span>
                          <span className="font-mono text-sm">
                            {formatGuyanacurrency(calculation.totalInputVat)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Net VAT Calculation */}
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">
                          Net VAT (Output - Input):
                        </span>
                        <span className="font-mono text-sm">
                          {formatGuyanacurrency(calculation.netVat)}
                        </span>
                      </div>
                      {calculation.adjustments !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm">Adjustments:</span>
                          <span className="font-mono text-sm">
                            {formatGuyanacurrency(calculation.adjustments)}
                          </span>
                        </div>
                      )}
                      {calculation.previousCredit > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm">
                            Previous Credit Applied:
                          </span>
                          <span className="font-mono text-sm">
                            -{formatGuyanacurrency(calculation.previousCredit)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Final Amount Due */}
                    <div
                      className={`rounded-lg p-4 ${calculation.totalVatDue > 0 ? "bg-red-50 dark:bg-red-950/20" : "bg-green-50 dark:bg-green-950/20"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-medium ${calculation.totalVatDue > 0 ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}`}
                        >
                          {calculation.totalVatDue > 0
                            ? "VAT Due to GRA"
                            : "VAT Credit from GRA"}
                        </span>
                        <span
                          className={`font-bold font-mono text-xl ${calculation.totalVatDue > 0 ? "text-red-800 dark:text-red-200" : "text-green-800 dark:text-green-200"}`}
                        >
                          {formatGuyanacurrency(
                            Math.abs(calculation.totalVatDue)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        className="flex items-center gap-2"
                        onClick={() => window.print()}
                        size="sm"
                        variant="outline"
                      >
                        <Download className="h-4 w-4" />
                        Print Return
                      </Button>
                      <Button
                        className="flex items-center gap-2"
                        onClick={() => {
                          /* TODO: Generate GRA form */
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4" />
                        Export for GRA
                      </Button>
                      {onSave && (
                        <Button
                          className="flex items-center gap-2"
                          onClick={handleSave}
                          size="sm"
                        >
                          <FileText className="h-4 w-4" />
                          Save Return
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
                    <h3 className="mb-2 font-medium text-lg">
                      Ready to Calculate
                    </h3>
                    <p className="text-muted-foreground">
                      Fill in your sales and purchase information to generate
                      your VAT return.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Single Transaction VAT Calculator */}
        <TabsContent value="single">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Single Transaction VAT</CardTitle>
                <CardDescription>
                  Calculate VAT for individual transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={singleVatForm.handleSubmit(handleCalculateSingle)}
                >
                  <div>
                    <Label htmlFor="singleNetAmount">Net Amount - GYD</Label>
                    <Input
                      id="singleNetAmount"
                      step="0.01"
                      type="number"
                      {...singleVatForm.register("netAmount", {
                        valueAsNumber: true,
                      })}
                      placeholder="1000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">VAT Category</Label>
                    <select
                      id="category"
                      {...singleVatForm.register("category")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      <option value="STANDARD">Standard Rated (12.5%)</option>
                      <option value="ZERO_RATED">Zero-Rated (0%)</option>
                      <option value="EXEMPT">Exempt</option>
                      <optgroup label="Zero-Rated Categories">
                        {GUYANA_VAT_CONFIG.ZERO_RATED_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.replace(/_/g, " ")}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Exempt Categories">
                        {GUYANA_VAT_CONFIG.EXEMPT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.replace(/_/g, " ")}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="vatInclusive"
                      type="checkbox"
                      {...singleVatForm.register("vatInclusive")}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="vatInclusive">VAT inclusive amount</Label>
                  </div>

                  <div>
                    <Label htmlFor="singleDescription">
                      Description (optional)
                    </Label>
                    <Input
                      id="singleDescription"
                      {...singleVatForm.register("description")}
                      placeholder="Office supplies, consulting services, etc."
                    />
                  </div>

                  <Button className="w-full" type="submit">
                    Calculate VAT
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Single VAT Results */}
            <Card>
              <CardHeader>
                <CardTitle>VAT Calculation Result</CardTitle>
              </CardHeader>
              <CardContent>
                {singleVatResult ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Net Amount:</span>
                        <span className="font-mono text-sm">
                          {formatGuyanacurrency(singleVatResult.netAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">
                          VAT ({(singleVatResult.vatRate * 100).toFixed(1)}%):
                        </span>
                        <span className="font-mono text-sm">
                          {formatGuyanacurrency(singleVatResult.vatAmount)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-medium">
                        <span>Gross Amount:</span>
                        <span className="font-mono">
                          {formatGuyanacurrency(singleVatResult.grossAmount)}
                        </span>
                      </div>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Category:</strong>{" "}
                        {singleVatResult.category.replace(/_/g, " ")}
                        <br />
                        {singleVatResult.isExempt && (
                          <span className="text-yellow-600">
                            This transaction is VAT exempt
                          </span>
                        )}
                        {singleVatResult.isZeroRated && (
                          <span className="text-blue-600">
                            This transaction is zero-rated for VAT
                          </span>
                        )}
                        {!(
                          singleVatResult.isExempt ||
                          singleVatResult.isZeroRated
                        ) && (
                          <span className="text-green-600">
                            Standard VAT rate applies
                          </span>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <Calculator className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Enter transaction details to calculate VAT
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
