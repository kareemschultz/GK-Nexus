"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileText,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { type UseFormReturn, useFieldArray, useForm } from "react-hook-form";
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
  formatGuyanacurrency,
  GUYANA_TAX_CONFIG_2025,
} from "@/lib/tax-calculations";
import { cn } from "@/lib/utils";

// Client type for invoicing
type InvoiceClient = {
  id: string;
  name: string;
  email: string;
  address: string;
};

// Service catalog for line items
const SERVICE_CATALOG = [
  {
    id: "1",
    name: "Tax Consultation",
    description: "General tax advisory services",
    rate: 25_000,
    unit: "hour",
  },
  {
    id: "2",
    name: "PAYE Filing",
    description: "Monthly PAYE return preparation and filing",
    rate: 50_000,
    unit: "filing",
  },
  {
    id: "3",
    name: "VAT Return",
    description: "Quarterly VAT return preparation",
    rate: 75_000,
    unit: "filing",
  },
  {
    id: "4",
    name: "Annual Tax Return",
    description: "Annual income tax preparation and filing",
    rate: 150_000,
    unit: "return",
  },
  {
    id: "5",
    name: "Bookkeeping",
    description: "Monthly bookkeeping services",
    rate: 80_000,
    unit: "month",
  },
  {
    id: "6",
    name: "Audit Support",
    description: "GRA audit support services",
    rate: 40_000,
    unit: "hour",
  },
];

// Payment terms options
const PAYMENT_TERMS = [
  { value: "due_on_receipt", label: "Due on Receipt", days: 0 },
  { value: "net_7", label: "Net 7", days: 7 },
  { value: "net_15", label: "Net 15", days: 15 },
  { value: "net_30", label: "Net 30", days: 30 },
  { value: "net_60", label: "Net 60", days: 60 },
];

// Line item schema
const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be positive"),
  amount: z.number(),
  isFromCatalog: z.boolean(),
});

// Validation schemas for each step
const step1Schema = z.object({
  clientId: z.string().min(1, "Please select a client"),
  clientName: z.string(),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional(),
});

const step2Schema = z.object({
  lineItems: z
    .array(lineItemSchema)
    .min(1, "At least one line item is required"),
});

const step3Schema = z.object({
  applyVAT: z.boolean().default(true),
  vatRate: z.number().default(0.14),
  discountType: z.enum(["none", "percentage", "fixed"]).default("none"),
  discountValue: z.number().min(0).default(0),
});

const step4Schema = z.object({
  paymentTerms: z.string(),
  dueDate: z.string(),
  paymentMethods: z
    .array(z.string())
    .min(1, "Select at least one payment method"),
  notes: z.string().optional(),
});

const step5Schema = z.object({
  invoiceNumber: z.string(),
  issueDate: z.string(),
});

const invoiceSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step5Schema);

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type LineItem = z.infer<typeof lineItemSchema>;

// Generate invoice number
const generateInvoiceNumber = () => {
  const prefix = "INV";
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10_000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${year}-${random}`;
};

// Step 1: Select Client
function ClientSelectionStep({
  form,
  onNext,
}: {
  form: UseFormReturn<InvoiceFormData, any, any>;
  onNext: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const selectedClientId = form.watch("clientId");

  // Fetch clients from API
  const clientsQuery = useQuery({
    queryKey: ["clients", "invoicing"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      const result = await client.clients.list({
        page: 1,
        limit: 100,
        status: "active",
      });
      return result.data.items.map((c) => ({
        id: c.id,
        name: c.name || "Unknown Client",
        email: "",
        address: "",
      })) as InvoiceClient[];
    },
  });

  const clients = clientsQuery.data || [];
  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientSelect = (client: InvoiceClient) => {
    form.setValue("clientId", client.id);
    form.setValue("clientName", client.name);
    form.setValue("clientEmail", client.email);
    form.setValue("clientAddress", client.address);
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
            placeholder="Search clients by name or email..."
            value={searchTerm}
          />
        </div>

        <div className="mb-4">
          <h4 className="mb-2 text-muted-foreground text-sm">Recent Clients</h4>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {clientsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-muted-foreground">
                  Loading clients...
                </span>
              </div>
            ) : clientsQuery.error ? (
              <div className="py-8 text-center text-destructive">
                Failed to load clients. Please try again.
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No clients found.
              </div>
            ) : (
              filteredClients.map((client) => (
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
                    <h4 className="font-medium">{client.name}</h4>
                    <p className="text-muted-foreground text-sm">
                      {client.email || "No email"}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {client.address || "No address"}
                    </p>
                  </div>
                  {selectedClientId === client.id && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Button className="w-full" disabled={!selectedClientId} onClick={onNext}>
        Continue to Line Items
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// Step 2: Add Line Items
function LineItemsStep({
  form,
  onNext,
  onBack,
}: {
  form: UseFormReturn<InvoiceFormData, any, any>;
  onNext: () => void;
  onBack: () => void;
}) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const [showCatalog, setShowCatalog] = useState(false);

  const addFromCatalog = (service: (typeof SERVICE_CATALOG)[0]) => {
    append({
      id: `item-${Date.now()}`,
      description: `${service.name} - ${service.description}`,
      quantity: 1,
      rate: service.rate,
      amount: service.rate,
      isFromCatalog: true,
    });
    setShowCatalog(false);
  };

  const addCustomItem = () => {
    append({
      id: `item-${Date.now()}`,
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
      isFromCatalog: false,
    });
  };

  const updateAmount = (index: number) => {
    const quantity = form.watch(`lineItems.${index}.quantity`) || 0;
    const rate = form.watch(`lineItems.${index}.rate`) || 0;
    form.setValue(`lineItems.${index}.amount`, quantity * rate);
  };

  const subtotal = fields.reduce((sum, _, index) => {
    const amount = form.watch(`lineItems.${index}.amount`) || 0;
    return sum + amount;
  }, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium text-lg">Line Items</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCatalog(!showCatalog)}
              size="sm"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              From Catalog
            </Button>
            <Button onClick={addCustomItem} size="sm" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Custom Item
            </Button>
          </div>
        </div>

        {/* Service Catalog Dropdown */}
        {showCatalog && (
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Service Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {SERVICE_CATALOG.map((service) => (
                  <div
                    className="flex cursor-pointer items-center justify-between rounded border p-3 hover:bg-muted/50"
                    key={service.id}
                    onClick={() => addFromCatalog(service)}
                  >
                    <div>
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatGuyanacurrency(service.rate)} / {service.unit}
                      </p>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Line Items Table */}
        <div className="space-y-3">
          {fields.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No items added yet. Add items from the catalog or create custom
              items.
            </div>
          ) : (
            fields.map((field, index) => (
              <div
                className="flex items-start gap-3 rounded-lg border p-4"
                key={field.id}
              >
                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor={`lineItems.${index}.description`}>
                      Description
                    </Label>
                    <Input
                      {...form.register(`lineItems.${index}.description`)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor={`lineItems.${index}.quantity`}>Qty</Label>
                      <Input
                        type="number"
                        {...form.register(`lineItems.${index}.quantity`, {
                          valueAsNumber: true,
                          onChange: () => updateAmount(index),
                        })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lineItems.${index}.rate`}>
                        Rate (GYD)
                      </Label>
                      <Input
                        type="number"
                        {...form.register(`lineItems.${index}.rate`, {
                          valueAsNumber: true,
                          onChange: () => updateAmount(index),
                        })}
                        min="0"
                      />
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <div className="flex h-10 items-center rounded-md border bg-muted px-3 font-mono text-sm">
                        {formatGuyanacurrency(
                          form.watch(`lineItems.${index}.amount`) || 0
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => remove(index)}
                  size="icon"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>

        {/* Subtotal */}
        {fields.length > 0 && (
          <div className="mt-4 flex justify-end border-t pt-4">
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Subtotal</p>
              <p className="font-mono font-semibold text-lg">
                {formatGuyanacurrency(subtotal)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={fields.length === 0}
          onClick={onNext}
        >
          Continue to Tax & Discounts
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 3: Apply Tax & Discounts
function TaxDiscountStep({
  form,
  onNext,
  onBack,
}: {
  form: UseFormReturn<InvoiceFormData, any, any>;
  onNext: () => void;
  onBack: () => void;
}) {
  const lineItems = form.watch("lineItems") || [];
  const applyVAT = form.watch("applyVAT");
  const vatRate =
    form.watch("vatRate") || GUYANA_TAX_CONFIG_2025.VAT.STANDARD_RATE;
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue") || 0;

  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  let discount = 0;
  if (discountType === "percentage") {
    discount = subtotal * (discountValue / 100);
  } else if (discountType === "fixed") {
    discount = discountValue;
  }

  const afterDiscount = subtotal - discount;
  const vatAmount = applyVAT ? afterDiscount * vatRate : 0;
  const total = afterDiscount + vatAmount;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Tax & Discounts</h3>

        {/* VAT Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">VAT Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="applyVAT"
                type="checkbox"
                {...form.register("applyVAT")}
                className="h-4 w-4"
              />
              <Label htmlFor="applyVAT">Apply VAT (14%)</Label>
            </div>
            {applyVAT && (
              <Alert>
                <AlertDescription>
                  VAT will be calculated at the standard Guyana rate of 14%
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Discount Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Discount</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="discountType">Discount Type</Label>
              <Select
                onValueChange={(val: "none" | "percentage" | "fixed") =>
                  form.setValue("discountType", val)
                }
                value={discountType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discount type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Discount</SelectItem>
                  <SelectItem value="percentage">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount (GYD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {discountType !== "none" && (
              <div>
                <Label htmlFor="discountValue">
                  {discountType === "percentage"
                    ? "Discount %"
                    : "Discount Amount (GYD)"}
                </Label>
                <Input
                  type="number"
                  {...form.register("discountValue", { valueAsNumber: true })}
                  min="0"
                  placeholder={discountType === "percentage" ? "10" : "10000"}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calculation Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">
                  {formatGuyanacurrency(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-mono">
                    -{formatGuyanacurrency(discount)}
                  </span>
                </div>
              )}
              {applyVAT && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (14%)</span>
                  <span className="font-mono">
                    {formatGuyanacurrency(vatAmount)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="font-mono">{formatGuyanacurrency(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button className="flex-1" onClick={onNext}>
          Continue to Payment Terms
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 4: Payment Terms
function PaymentTermsStep({
  form,
  onNext,
  onBack,
}: {
  form: UseFormReturn<InvoiceFormData, any, any>;
  onNext: () => void;
  onBack: () => void;
}) {
  const paymentTerms = form.watch("paymentTerms");
  const paymentMethods = form.watch("paymentMethods") || [];

  const handleTermsChange = (value: string) => {
    form.setValue("paymentTerms", value);
    const term = PAYMENT_TERMS.find((t) => t.value === value);
    if (term) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + term.days);
      form.setValue("dueDate", dueDate.toISOString().split("T")[0]);
    }
  };

  const togglePaymentMethod = (method: string) => {
    const current = paymentMethods || [];
    if (current.includes(method)) {
      form.setValue(
        "paymentMethods",
        current.filter((m) => m !== method)
      );
    } else {
      form.setValue("paymentMethods", [...current, method]);
    }
  };

  const availableMethods = [
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "cash", label: "Cash" },
    { value: "mobile_money", label: "Mobile Money" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Payment Terms</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Select onValueChange={handleTermsChange} value={paymentTerms}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_TERMS.map((term) => (
                  <SelectItem key={term.value} value={term.value}>
                    {term.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <div className="relative">
              <Calendar className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                type="date"
                {...form.register("dueDate")}
              />
            </div>
          </div>

          <div>
            <Label>Accepted Payment Methods</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {availableMethods.map((method) => (
                <div
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-all",
                    paymentMethods?.includes(method.value)
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/50"
                  )}
                  key={method.value}
                  onClick={() => togglePaymentMethod(method.value)}
                >
                  <input
                    checked={paymentMethods?.includes(method.value)}
                    className="h-4 w-4"
                    onChange={() => togglePaymentMethod(method.value)}
                    type="checkbox"
                  />
                  <span className="text-sm">{method.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Invoice Notes (Optional)</Label>
            <Textarea
              {...form.register("notes")}
              placeholder="Add any notes or special instructions..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={!paymentTerms || paymentMethods.length === 0}
          onClick={onNext}
        >
          Continue to Review
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Step 5: Review & Generate
function ReviewGenerateStep({
  form,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  form: UseFormReturn<InvoiceFormData, any, any>;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const formData = form.getValues();
  // Client info is stored in the form when selected
  const client = {
    id: formData.clientId,
    name: formData.clientName,
    email: formData.clientEmail,
    address: formData.clientAddress,
  };

  const lineItems = formData.lineItems || [];
  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);

  let discount = 0;
  if (formData.discountType === "percentage") {
    discount = subtotal * ((formData.discountValue || 0) / 100);
  } else if (formData.discountType === "fixed") {
    discount = formData.discountValue || 0;
  }

  const afterDiscount = subtotal - discount;
  const vatAmount = formData.applyVAT
    ? afterDiscount *
      (formData.vatRate || GUYANA_TAX_CONFIG_2025.VAT.STANDARD_RATE)
    : 0;
  const total = afterDiscount + vatAmount;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Review Invoice</h3>

        {/* Invoice Preview */}
        <Card className="mb-4">
          <CardHeader className="border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">INVOICE</CardTitle>
                <CardDescription className="font-mono">
                  {formData.invoiceNumber}
                </CardDescription>
              </div>
              <Badge variant="outline">Draft</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="mb-6 grid grid-cols-2 gap-6">
              <div>
                <h4 className="mb-2 font-medium text-muted-foreground text-sm">
                  Bill To
                </h4>
                <p className="font-medium">{client?.name}</p>
                <p className="text-muted-foreground text-sm">{client?.email}</p>
                <p className="text-muted-foreground text-sm">
                  {client?.address}
                </p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className="text-muted-foreground text-sm">
                    Issue Date:{" "}
                  </span>
                  <span className="font-medium">{formData.issueDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-sm">
                    Due Date:{" "}
                  </span>
                  <span className="font-medium">{formData.dueDate}</span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Line Items */}
            <div className="mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Description</th>
                    <th className="py-2 text-right">Qty</th>
                    <th className="py-2 text-right">Rate</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => (
                    <tr className="border-b" key={index}>
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">
                        {formatGuyanacurrency(item.rate)}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {formatGuyanacurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">
                  {formatGuyanacurrency(subtotal)}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-mono">
                    -{formatGuyanacurrency(discount)}
                  </span>
                </div>
              )}
              {formData.applyVAT && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (14%)</span>
                  <span className="font-mono">
                    {formatGuyanacurrency(vatAmount)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total Due</span>
                <span className="font-mono">{formatGuyanacurrency(total)}</span>
              </div>
            </div>

            {formData.notes && (
              <>
                <Separator className="my-4" />
                <div>
                  <h4 className="mb-1 font-medium text-sm">Notes</h4>
                  <p className="text-muted-foreground text-sm">
                    {formData.notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button className="flex-1" onClick={onBack} variant="outline">
          Back
        </Button>
        <Button className="flex-1" disabled={isSubmitting} onClick={onSubmit}>
          {isSubmitting ? "Generating..." : "Generate Invoice"}
        </Button>
      </div>

      <div className="flex justify-center gap-2">
        <Button size="sm" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button size="sm" variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Send to Client
        </Button>
      </div>
    </div>
  );
}

// Main Invoice Wizard Component
export default function InvoiceWizard({
  onComplete,
  onCancel,
}: {
  onComplete?: (data: InvoiceFormData) => void;
  onCancel?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      clientId: "",
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      lineItems: [],
      applyVAT: true,
      vatRate: GUYANA_TAX_CONFIG_2025.VAT.STANDARD_RATE,
      discountType: "none",
      discountValue: 0,
      paymentTerms: "net_30",
      paymentMethods: [],
      invoiceNumber: generateInvoiceNumber(),
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      notes: "",
    },
  });

  const steps = [
    { title: "Client", description: "Select client" },
    { title: "Items", description: "Add line items" },
    { title: "Tax", description: "Apply VAT & discounts" },
    { title: "Terms", description: "Set payment terms" },
    { title: "Review", description: "Generate invoice" },
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

      // Simulate API call - invoice creation would be implemented here
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const { toast } = await import("sonner");
      toast.success("Invoice created successfully!");
      onComplete?.(data);
    } catch {
      const { toast } = await import("sonner");
      toast.error("Failed to create invoice. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepComponents = [
    <ClientSelectionStep form={form} key="step1" onNext={handleNext} />,
    <LineItemsStep
      form={form}
      key="step2"
      onBack={handleBack}
      onNext={handleNext}
    />,
    <TaxDiscountStep
      form={form}
      key="step3"
      onBack={handleBack}
      onNext={handleNext}
    />,
    <PaymentTermsStep
      form={form}
      key="step4"
      onBack={handleBack}
      onNext={handleNext}
    />,
    <ReviewGenerateStep
      form={form}
      isSubmitting={isSubmitting}
      key="step5"
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
            <h1 className="font-bold text-2xl">Create Invoice</h1>
            <p className="text-muted-foreground">
              Generate a professional invoice for your client
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
