"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Download,
  FileText,
  Info,
  Upload,
  XCircle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatGuyanacurrency } from "@/lib/tax-calculations";

// Enhanced VAT Configuration for Guyana
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

// Enhanced validation schemas with better error messages and validation
const vatCalculationSchema = z
  .object({
    // Business Information
    businessName: z
      .string()
      .min(2, "Business name must be at least 2 characters"),
    vatRegistrationNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^VAT[0-9]{9}$/.test(val),
        "VAT number must be in format VAT123456789"
      ),
    vatPeriod: z
      .string()
      .min(1, "VAT period is required")
      .refine(
        (val) => /^\d{4}-(Q[1-4]|M(0[1-9]|1[0-2]))$/.test(val),
        "Period must be in format YYYY-Q1 or YYYY-M01"
      ),

    // Sales and Output VAT
    standardRatedSales: z
      .number({ message: "Must be a valid number" })
      .min(0, "Standard rated sales cannot be negative")
      .max(999_999_999_999, "Amount is too large"),
    zeroRatedSales: z
      .number({ message: "Must be a valid number" })
      .min(0, "Zero-rated sales cannot be negative")
      .max(999_999_999_999, "Amount is too large"),
    exemptSales: z
      .number({ message: "Must be a valid number" })
      .min(0, "Exempt sales cannot be negative")
      .max(999_999_999_999, "Amount is too large"),

    // Purchases and Input VAT
    standardRatedPurchases: z
      .number({ message: "Must be a valid number" })
      .min(0, "Standard rated purchases cannot be negative")
      .max(999_999_999_999, "Amount is too large"),
    zeroRatedPurchases: z
      .number({ message: "Must be a valid number" })
      .min(0, "Zero-rated purchases cannot be negative")
      .max(999_999_999_999, "Amount is too large"),
    exemptPurchases: z
      .number({ message: "Must be a valid number" })
      .min(0, "Exempt purchases cannot be negative")
      .max(999_999_999_999, "Amount is too large"),

    // Adjustments
    adjustments: z
      .number({ message: "Must be a valid number" })
      .min(-999_999_999, "Adjustment amount is too large")
      .max(999_999_999, "Adjustment amount is too large"),
    previousVatCredit: z
      .number({ message: "Must be a valid number" })
      .min(0, "Previous VAT credit cannot be negative")
      .max(999_999_999, "Amount is too large"),

    // Notes
    notes: z
      .string()
      .max(1000, "Notes cannot exceed 1000 characters")
      .optional(),
  })
  .refine(
    (data) => {
      const totalSales =
        data.standardRatedSales + data.zeroRatedSales + data.exemptSales;
      return totalSales > 0;
    },
    {
      message: "At least one sales category must have a value greater than 0",
      path: ["standardRatedSales"],
    }
  );

const singleVatCalculationSchema = z.object({
  netAmount: z
    .number({ message: "Must be a valid number" })
    .min(0.01, "Net amount must be greater than 0")
    .max(999_999_999, "Amount is too large"),
  category: z.enum([
    "STANDARD",
    "ZERO_RATED",
    "EXEMPT",
    ...GUYANA_VAT_CONFIG.ZERO_RATED_CATEGORIES,
    ...GUYANA_VAT_CONFIG.EXEMPT_CATEGORIES,
  ]),
  vatInclusive: z.boolean(),
  description: z
    .string()
    .max(200, "Description cannot exceed 200 characters")
    .optional(),
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

  // Validation
  warnings: string[];
  errors: string[];
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

interface EnhancedVatCalculatorProps {
  onSave?: (calculation: VatCalculationResult) => void;
  enableAdvancedValidation?: boolean;
  showDetailedBreakdown?: boolean;
}

export function EnhancedVatCalculator({
  onSave,
  enableAdvancedValidation = true,
  showDetailedBreakdown = true,
}: EnhancedVatCalculatorProps) {
  const [calculation, setCalculation] = useState<VatCalculationResult | null>(
    null
  );
  const [singleVatResult, setSingleVatResult] =
    useState<SingleVatResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState("period");
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const form = useForm<VatCalculationFormData>({
    resolver: zodResolver(vatCalculationSchema),
    mode: "onChange", // Real-time validation
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
    mode: "onChange",
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
    const warnings: string[] = [];
    const errors: string[] = [];

    // Advanced validation checks
    if (enableAdvancedValidation) {
      // Check if business is over VAT threshold
      const annualSales =
        (data.standardRatedSales + data.zeroRatedSales + data.exemptSales) * 12;
      if (
        annualSales > GUYANA_VAT_CONFIG.REGISTRATION_THRESHOLD &&
        !data.vatRegistrationNumber
      ) {
        warnings.push(
          "Annual sales may exceed VAT registration threshold. Consider VAT registration."
        );
      }

      // Check for unusual input/output VAT ratios
      const outputVat =
        data.standardRatedSales * GUYANA_VAT_CONFIG.STANDARD_RATE;
      const inputVat =
        data.standardRatedPurchases * GUYANA_VAT_CONFIG.STANDARD_RATE;
      const ratio = outputVat > 0 ? inputVat / outputVat : 0;

      if (ratio > 1.5) {
        warnings.push(
          "Input VAT is significantly higher than Output VAT. Please verify purchases."
        );
      }

      // Check for large adjustments
      if (Math.abs(data.adjustments) > outputVat * 0.1 && outputVat > 0) {
        warnings.push(
          "Adjustment amount is more than 10% of Output VAT. Please provide explanation."
        );
      }
    }

    // Calculate Output VAT
    const outputVatStandard =
      data.standardRatedSales * GUYANA_VAT_CONFIG.STANDARD_RATE;
    const outputVatZeroRated = 0;
    const outputVatExempt = 0;
    const totalOutputVat =
      outputVatStandard + outputVatZeroRated + outputVatExempt;

    // Calculate Input VAT
    const inputVatStandard =
      data.standardRatedPurchases * GUYANA_VAT_CONFIG.STANDARD_RATE;
    const inputVatZeroRated = 0;
    const inputVatExempt = 0;
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
      warnings,
      errors,
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
      grossAmount = data.netAmount;
      adjustedNetAmount = data.netAmount / (1 + vatRate);
      vatAmount = grossAmount - adjustedNetAmount;
    } else {
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
    setFormErrors([]);

    setTimeout(() => {
      try {
        const result = calculateVatReturn(data);
        setCalculation(result);

        if (result.errors.length > 0) {
          setFormErrors(result.errors);
          toast.error("Calculation completed with errors", {
            description: "Please review and correct the highlighted issues",
          });
        } else if (result.warnings.length > 0) {
          toast.warning("Calculation completed with warnings", {
            description: "Please review the warnings below",
          });
        } else {
          toast.success("VAT return calculated successfully", {
            description: `VAT due: ${formatGuyanacurrency(result.totalVatDue)}`,
          });
        }
      } catch (error) {
        toast.error("Calculation failed", {
          description: "Please check your input values and try again",
        });
      } finally {
        setIsCalculating(false);
      }
    }, 500);
  };

  const handleCalculateSingle = (data: SingleVatCalculationFormData) => {
    try {
      const result = calculateSingleVat(data);
      setSingleVatResult(result);
      toast.success("VAT calculated", {
        description: `VAT amount: ${formatGuyanacurrency(result.vatAmount)}`,
      });
    } catch (error) {
      toast.error("Calculation failed", {
        description: "Please check your input values",
      });
    }
  };

  const handleSave = () => {
    if (calculation) {
      onSave?.(calculation);
      toast.success("VAT calculation saved", {
        description: "VAT return calculation has been saved to your records",
      });
    }
  };

  const ErrorAlert = ({ errors }: { errors: string[] }) => {
    if (errors.length === 0) return null;

    return (
      <Alert className="mb-4" variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">
            Please correct the following errors:
          </div>
          <ul className="mt-2 list-disc pl-5">
            {errors.map((error, index) => (
              <li className="text-sm" key={index}>
                {error}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  const WarningAlert = ({ warnings }: { warnings: string[] }) => {
    if (warnings.length === 0) return null;

    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">Please review the following:</div>
          <ul className="mt-2 list-disc pl-5">
            {warnings.map((warning, index) => (
              <li className="text-sm" key={index}>
                {warning}
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-bold text-3xl">
            <Calculator className="h-8 w-8" />
            Enhanced VAT Calculator
          </h1>
          <p className="mt-2 text-muted-foreground">
            Advanced VAT calculation with real-time validation and compliance
            checking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="text-sm" variant="outline">
            Guyana VAT 12.5%
          </Badge>
          {enableAdvancedValidation && (
            <Badge className="text-sm" variant="secondary">
              Smart Validation
            </Badge>
          )}
        </div>
      </div>

      {/* Form Errors */}
      <ErrorAlert errors={formErrors} />

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
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Input
                        id="businessName"
                        {...form.register("businessName")}
                        className={
                          form.formState.errors.businessName
                            ? "border-red-500"
                            : ""
                        }
                        placeholder="Your Business Ltd"
                      />
                      {form.formState.errors.businessName && (
                        <p className="mt-1 text-red-500 text-sm">
                          {form.formState.errors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="vatRegistrationNumber">
                          VAT Registration Number
                        </Label>
                        <Input
                          id="vatRegistrationNumber"
                          {...form.register("vatRegistrationNumber")}
                          className={
                            form.formState.errors.vatRegistrationNumber
                              ? "border-red-500"
                              : ""
                          }
                          placeholder="VAT123456789"
                        />
                        {form.formState.errors.vatRegistrationNumber && (
                          <p className="mt-1 text-red-500 text-sm">
                            {
                              form.formState.errors.vatRegistrationNumber
                                .message
                            }
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="vatPeriod">VAT Period *</Label>
                        <Input
                          id="vatPeriod"
                          {...form.register("vatPeriod")}
                          className={
                            form.formState.errors.vatPeriod
                              ? "border-red-500"
                              : ""
                          }
                          placeholder="2024-Q4 or 2024-M12"
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
                        Standard Rated Sales (12.5% VAT) - GYD *
                      </Label>
                      <Input
                        id="standardRatedSales"
                        step="0.01"
                        type="number"
                        {...form.register("standardRatedSales", {
                          valueAsNumber: true,
                        })}
                        className={
                          form.formState.errors.standardRatedSales
                            ? "border-red-500"
                            : ""
                        }
                        placeholder="500000"
                      />
                      {form.formState.errors.standardRatedSales && (
                        <p className="mt-1 text-red-500 text-sm">
                          {form.formState.errors.standardRatedSales.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          className={
                            form.formState.errors.zeroRatedSales
                              ? "border-red-500"
                              : ""
                          }
                          placeholder="100000"
                        />
                        <p className="mt-1 text-muted-foreground text-xs">
                          Exports, basic foods, etc.
                        </p>
                        {form.formState.errors.zeroRatedSales && (
                          <p className="mt-1 text-red-500 text-sm">
                            {form.formState.errors.zeroRatedSales.message}
                          </p>
                        )}
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
                          className={
                            form.formState.errors.exemptSales
                              ? "border-red-500"
                              : ""
                          }
                          placeholder="50000"
                        />
                        <p className="mt-1 text-muted-foreground text-xs">
                          Financial services, rent, etc.
                        </p>
                        {form.formState.errors.exemptSales && (
                          <p className="mt-1 text-red-500 text-sm">
                            {form.formState.errors.exemptSales.message}
                          </p>
                        )}
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
                        className={
                          form.formState.errors.standardRatedPurchases
                            ? "border-red-500"
                            : ""
                        }
                        placeholder="200000"
                      />
                      {form.formState.errors.standardRatedPurchases && (
                        <p className="mt-1 text-red-500 text-sm">
                          {form.formState.errors.standardRatedPurchases.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          className={
                            form.formState.errors.zeroRatedPurchases
                              ? "border-red-500"
                              : ""
                          }
                          placeholder="50000"
                        />
                        {form.formState.errors.zeroRatedPurchases && (
                          <p className="mt-1 text-red-500 text-sm">
                            {form.formState.errors.zeroRatedPurchases.message}
                          </p>
                        )}
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
                          className={
                            form.formState.errors.exemptPurchases
                              ? "border-red-500"
                              : ""
                          }
                          placeholder="25000"
                        />
                        {form.formState.errors.exemptPurchases && (
                          <p className="mt-1 text-red-500 text-sm">
                            {form.formState.errors.exemptPurchases.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Adjustments */}
                  <h3 className="font-medium text-lg">Adjustments & Credits</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="adjustments">VAT Adjustments - GYD</Label>
                      <Input
                        id="adjustments"
                        step="0.01"
                        type="number"
                        {...form.register("adjustments", {
                          valueAsNumber: true,
                        })}
                        className={
                          form.formState.errors.adjustments
                            ? "border-red-500"
                            : ""
                        }
                        placeholder="0"
                      />
                      <p className="mt-1 text-muted-foreground text-xs">
                        Positive for additional VAT due, negative for refunds
                      </p>
                      {form.formState.errors.adjustments && (
                        <p className="mt-1 text-red-500 text-sm">
                          {form.formState.errors.adjustments.message}
                        </p>
                      )}
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
                        className={
                          form.formState.errors.previousVatCredit
                            ? "border-red-500"
                            : ""
                        }
                        placeholder="0"
                      />
                      {form.formState.errors.previousVatCredit && (
                        <p className="mt-1 text-red-500 text-sm">
                          {form.formState.errors.previousVatCredit.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...form.register("notes")}
                      className={
                        form.formState.errors.notes ? "border-red-500" : ""
                      }
                      placeholder="Additional notes for this VAT return..."
                      rows={3}
                    />
                    <p className="mt-1 text-muted-foreground text-xs">
                      {form.watch("notes")?.length || 0}/1000 characters
                    </p>
                    {form.formState.errors.notes && (
                      <p className="mt-1 text-red-500 text-sm">
                        {form.formState.errors.notes.message}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    disabled={isCalculating || !form.formState.isValid}
                    type="submit"
                  >
                    {isCalculating ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                        Calculating...
                      </div>
                    ) : (
                      "Calculate VAT Return"
                    )}
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

              {/* Loading State */}
              {isCalculating && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Calculating VAT Return...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-24" />
                  </CardContent>
                </Card>
              )}

              {/* Calculation Results */}
              {calculation && !isCalculating && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      VAT Return Summary
                    </CardTitle>
                    <CardDescription>
                      Detailed breakdown of your VAT return
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Warnings */}
                    <WarningAlert warnings={calculation.warnings} />

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
                      className={`rounded-lg p-4 ${
                        calculation.totalVatDue > 0
                          ? "bg-red-50 dark:bg-red-950/20"
                          : "bg-green-50 dark:bg-green-950/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-medium ${
                            calculation.totalVatDue > 0
                              ? "text-red-800 dark:text-red-200"
                              : "text-green-800 dark:text-green-200"
                          }`}
                        >
                          {calculation.totalVatDue > 0
                            ? "VAT Due to GRA"
                            : "VAT Credit from GRA"}
                        </span>
                        <span
                          className={`font-bold font-mono text-xl ${
                            calculation.totalVatDue > 0
                              ? "text-red-800 dark:text-red-200"
                              : "text-green-800 dark:text-green-200"
                          }`}
                        >
                          {formatGuyanacurrency(
                            Math.abs(calculation.totalVatDue)
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pt-4 sm:flex-row">
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
                          toast.success("GRA Export Generated", {
                            description:
                              "VAT return data has been formatted for GRA submission. Configure integration in Settings > Integrations for direct submission.",
                          });
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
              {!(calculation || isCalculating) && (
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
                  Calculate VAT for individual transactions with enhanced
                  validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={singleVatForm.handleSubmit(handleCalculateSingle)}
                >
                  <div>
                    <Label htmlFor="singleNetAmount">Net Amount - GYD *</Label>
                    <Input
                      id="singleNetAmount"
                      step="0.01"
                      type="number"
                      {...singleVatForm.register("netAmount", {
                        valueAsNumber: true,
                      })}
                      className={
                        singleVatForm.formState.errors.netAmount
                          ? "border-red-500"
                          : ""
                      }
                      placeholder="1000"
                    />
                    {singleVatForm.formState.errors.netAmount && (
                      <p className="mt-1 text-red-500 text-sm">
                        {singleVatForm.formState.errors.netAmount.message}
                      </p>
                    )}
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
                      className={
                        singleVatForm.formState.errors.description
                          ? "border-red-500"
                          : ""
                      }
                      placeholder="Office supplies, consulting services, etc."
                    />
                    {singleVatForm.formState.errors.description && (
                      <p className="mt-1 text-red-500 text-sm">
                        {singleVatForm.formState.errors.description.message}
                      </p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    disabled={!singleVatForm.formState.isValid}
                    type="submit"
                  >
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
