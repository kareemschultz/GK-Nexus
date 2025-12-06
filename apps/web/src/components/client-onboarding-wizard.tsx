"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileText,
  Info,
  Users,
  X,
} from "lucide-react";
import React, { useState } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
import {
  countRequiredDocuments,
  getRequiredDocuments,
} from "@/lib/document-requirements";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

// Regex patterns for validation (moved to top level for performance)
const TIN_REGEX = /^\d{9}$/;
const NIS_REGEX = /^[A-Z]\d{6}$/;

// Entity types based on GK-Enterprise-Suite requirements
export const ENTITY_TYPES = [
  { value: "INDIVIDUAL", label: "Individual", icon: Users },
  { value: "COMPANY", label: "Company", icon: Building2 },
  { value: "PARTNERSHIP", label: "Partnership", icon: Users },
  { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship", icon: Users },
] as const;

// Import comprehensive service catalog
import { BUSINESS_UNITS, SERVICE_TYPES } from "@/lib/service-catalog";

// Validation schemas for each step - Updated with proper Guyana formats
const step1Schema = z
  .object({
    entityType: z.enum([
      "INDIVIDUAL",
      "COMPANY",
      "PARTNERSHIP",
      "SOLE_PROPRIETORSHIP",
    ]),
    businessName: z.string().optional(),
    firstName: z.string().optional(),
    middleName: z.string().optional(), // Added middle name support
    lastName: z.string().optional(),
    tinNumber: z
      .string()
      .min(1, "TIN is required")
      .refine(
        (val) => {
          const cleaned = val.replace(/[-\s]/g, "");
          return TIN_REGEX.test(cleaned);
        },
        { message: "TIN must be 9 digits (format: XXX-XXX-XXX)" }
      ),
    nisNumber: z // Added NIS number field
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) {
            return true; // Optional
          }
          const cleaned = val.replace(/[-\s]/g, "").toUpperCase();
          return NIS_REGEX.test(cleaned);
        },
        { message: "NIS format: A-123456 (1 letter + 6 digits)" }
      ),
    passportNumber: z.string().optional(),
    isLocalContentQualified: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.entityType === "INDIVIDUAL") {
        return data.firstName && data.lastName;
      }
      return data.businessName;
    },
    {
      message:
        "First name and last name are required for individuals, business name for companies",
      path: ["businessName"],
    }
  );

const step2Schema = z.object({
  email: z.string().email("Invalid email address"),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      /^(\+592[-\s]?)?\d{3}[-\s]?\d{4}$|^\d{7}$|^\d{10,11}$/,
      "Enter a valid Guyana phone number (e.g., +592-XXX-XXXX or 592XXXXXXX)"
    ),
  address: z.string().min(1, "Address is required").min(5, "Address too short"),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "Region is required"),
});

const step3Schema = z.object({
  identificationFile: z.any().optional(),
  incorporationFile: z.any().optional(),
  hasUploadedDocs: z.boolean(),
});

const step4Schema = z.object({
  selectedServices: z
    .array(z.string())
    .min(1, "Please select at least one service"),
  additionalNotes: z.string().optional(),
});

// Combined schema for final submission
const clientSchema = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema);

type ClientFormData = z.infer<typeof clientSchema>;
type ClientForm = UseFormReturn<ClientFormData>;

type StepProps = {
  form: ClientForm;
  onNext: () => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
};

type OnboardingStep = {
  title: string;
  description: string;
  component: React.ComponentType<StepProps>;
};

// Helper function to format client display name
const formatClientName = (data: {
  entityType: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  businessName?: string;
}) => {
  if (data.entityType === "INDIVIDUAL") {
    if (data.middleName) {
      return `${data.firstName} ${data.middleName} ${data.lastName}`;
    }
    return `${data.firstName} ${data.lastName}`;
  }
  return data.businessName || "";
};

// Step 1: Entity Structure
function EntityStructureStep({ form, onNext, isSubmitting }: StepProps) {
  const entityType = form.watch("entityType");
  const isLocalContentQualified = form.watch("isLocalContentQualified");

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="font-medium text-base" htmlFor="entityType">
            Entity Type <span className="text-red-500">*</span>
          </Label>
          <p className="mb-3 text-muted-foreground text-sm">
            Select the type of entity you're registering
          </p>
          <Select
            onValueChange={(value) =>
              form.setValue(
                "entityType",
                value as
                  | "INDIVIDUAL"
                  | "COMPANY"
                  | "PARTNERSHIP"
                  | "SOLE_PROPRIETORSHIP"
              )
            }
            value={entityType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select entity type" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.entityType && (
            <p className="mt-1 text-red-500 text-sm">
              {form.formState.errors.entityType.message}
            </p>
          )}
        </div>

        {/* Conditional fields based on entity type */}
        {entityType === "INDIVIDUAL" ? (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="Enter first name"
              />
              {form.formState.errors.firstName && (
                <p className="mt-1 text-red-500 text-sm">
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                {...form.register("middleName")}
                placeholder="Enter middle name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Enter last name"
              />
              {form.formState.errors.lastName && (
                <p className="mt-1 text-red-500 text-sm">
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="businessName">
              Business Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="businessName"
              {...form.register("businessName")}
              placeholder="Enter business name"
            />
            {form.formState.errors.businessName && (
              <p className="mt-1 text-red-500 text-sm">
                {form.formState.errors.businessName.message}
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="tinNumber">
              Tax Identification Number (TIN){" "}
              <span className="text-red-500">*</span>
            </Label>
            <p className="mb-2 text-muted-foreground text-sm">
              9-digit TIN (format: XXX-XXX-XXX)
            </p>
            <Input
              id="tinNumber"
              {...form.register("tinNumber")}
              maxLength={11}
              onChange={(e) => {
                // Auto-format TIN as user types
                const value = e.target.value.replace(/\D/g, "");
                let formatted = value;
                if (value.length > 6) {
                  formatted = `${value.slice(0, 3)}-${value.slice(3, 6)}-${value.slice(6, 9)}`;
                } else if (value.length > 3) {
                  formatted = `${value.slice(0, 3)}-${value.slice(3)}`;
                }
                form.setValue("tinNumber", formatted);
              }}
              placeholder="123-456-789"
            />
            {form.formState.errors.tinNumber && (
              <p className="mt-1 text-red-500 text-sm">
                {form.formState.errors.tinNumber.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="nisNumber">NIS Number</Label>
            <p className="mb-2 text-muted-foreground text-sm">
              National Insurance Scheme (format: A-XXXXXX)
            </p>
            <Input
              id="nisNumber"
              {...form.register("nisNumber")}
              maxLength={8}
              onChange={(e) => {
                // Auto-format NIS as user types
                const value = e.target.value
                  .replace(/[^A-Za-z0-9]/g, "")
                  .toUpperCase();
                let formatted = value;
                if (value.length > 1) {
                  formatted = `${value.charAt(0)}-${value.slice(1, 7)}`;
                }
                form.setValue("nisNumber", formatted);
              }}
              placeholder="A-123456"
            />
            {form.formState.errors.nisNumber && (
              <p className="mt-1 text-red-500 text-sm">
                {form.formState.errors.nisNumber.message}
              </p>
            )}
          </div>
        </div>

        {entityType === "INDIVIDUAL" && (
          <div>
            <Label htmlFor="passportNumber">Passport/National ID Number</Label>
            <p className="mb-2 text-muted-foreground text-sm">
              For individuals: passport or national ID
            </p>
            <Input
              id="passportNumber"
              {...form.register("passportNumber")}
              placeholder="Enter ID number"
            />
          </div>
        )}

        <div className="flex items-start space-x-3 rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/20">
          <Checkbox
            checked={isLocalContentQualified}
            id="isLocalContentQualified"
            onCheckedChange={(checked) =>
              form.setValue("isLocalContentQualified", Boolean(checked))
            }
          />
          <div className="space-y-1">
            <Label
              className="cursor-pointer font-medium text-sm"
              htmlFor="isLocalContentQualified"
            >
              Local Content Qualified Entity
            </Label>
            <p className="text-muted-foreground text-xs">
              Check this if your entity qualifies under Guyana's Local Content
              Policy (applicable for Oil & Gas sector participants)
            </p>
          </div>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={isSubmitting}
        onClick={onNext}
        type="button"
      >
        Continue to Contact Information
      </Button>
    </div>
  );
}

// Step 2: Contact Information
function ContactInformationStep({
  form,
  onNext,
  onBack,
  isSubmitting,
}: StepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="email">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder="contact@example.com"
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-red-500 text-sm">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phoneNumber">
            Phone Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            {...form.register("phoneNumber")}
            placeholder="+592-xxx-xxxx"
          />
          {form.formState.errors.phoneNumber && (
            <p className="mt-1 text-red-500 text-sm">
              {form.formState.errors.phoneNumber.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="address">
          Business Address <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="address"
          {...form.register("address")}
          placeholder="Enter complete business address"
          rows={3}
        />
        {form.formState.errors.address && (
          <p className="mt-1 text-red-500 text-sm">
            {form.formState.errors.address.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="city">
            City <span className="text-red-500">*</span>
          </Label>
          <Input
            id="city"
            {...form.register("city")}
            placeholder="Georgetown"
          />
          {form.formState.errors.city && (
            <p className="mt-1 text-red-500 text-sm">
              {form.formState.errors.city.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="region">
            Region <span className="text-red-500">*</span>
          </Label>
          <Select onValueChange={(value) => form.setValue("region", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="region-1">Region 1 - Barima-Waini</SelectItem>
              <SelectItem value="region-2">
                Region 2 - Pomeroon-Supenaam
              </SelectItem>
              <SelectItem value="region-3">
                Region 3 - Essequibo Islands-West Demerara
              </SelectItem>
              <SelectItem value="region-4">
                Region 4 - Demerara-Mahaica
              </SelectItem>
              <SelectItem value="region-5">
                Region 5 - Mahaica-Berbice
              </SelectItem>
              <SelectItem value="region-6">
                Region 6 - East Berbice-Corentyne
              </SelectItem>
              <SelectItem value="region-7">
                Region 7 - Cuyuni-Mazaruni
              </SelectItem>
              <SelectItem value="region-8">
                Region 8 - Potaro-Siparuni
              </SelectItem>
              <SelectItem value="region-9">
                Region 9 - Upper Takutu-Upper Essequibo
              </SelectItem>
              <SelectItem value="region-10">
                Region 10 - Upper Demerara-Berbice
              </SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.region && (
            <p className="mt-1 text-red-500 text-sm">
              {form.formState.errors.region.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={onBack}
          type="button"
          variant="outline"
        >
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={isSubmitting}
          onClick={onNext}
          type="button"
        >
          Continue to Service Selection
        </Button>
      </div>
    </div>
  );
}

// Step 3: Document Upload - Dynamic based on entity type and selected services
function DocumentUploadStep({ form, onNext, onBack, isSubmitting }: StepProps) {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const entityType = form.watch("entityType");
  const selectedServices = form.watch("selectedServices") || [];

  // Get dynamic document requirements GROUPED by entity type and selected services
  const { entityDocuments, serviceDocuments } = getRequiredDocuments(
    entityType,
    selectedServices
  );
  const stats = countRequiredDocuments(entityDocuments, serviceDocuments);

  // Helper: count uploaded required docs for entity
  const countEntityUploads = () => {
    if (!entityDocuments) {
      return 0;
    }
    return entityDocuments.documents.filter(
      (doc) => doc.required && uploadedFiles[doc.id]
    ).length;
  };

  // Helper: count uploaded required docs for services
  const countServiceUploads = () =>
    serviceDocuments.reduce((total, service) => {
      const uploaded = service.documents.filter((doc) => {
        const docKey = `${service.serviceId}-${doc.id}`;
        return doc.required && uploadedFiles[docKey];
      }).length;
      return total + uploaded;
    }, 0);

  const uploadedRequiredCount = countEntityUploads() + countServiceUploads();

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    docId: string
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFiles((prev) => ({ ...prev, [docId]: file }));
      form.setValue("hasUploadedDocs", true);
    }
  };

  const removeFile = (docId: string) => {
    setUploadedFiles((prev) => {
      const updated = { ...prev };
      delete updated[docId];
      return updated;
    });
    // Update hasUploadedDocs if no files remain
    if (Object.keys(uploadedFiles).length <= 1) {
      form.setValue("hasUploadedDocs", false);
    }
  };

  // Helper function to get document border class
  const getDocumentBorderClass = (docId: string, isRequired: boolean) => {
    if (uploadedFiles[docId]) {
      return "border-green-500 bg-green-50 dark:bg-green-950/20";
    }
    if (isRequired) {
      return "border-orange-300 bg-orange-50/50 dark:bg-orange-950/10";
    }
    return "border-muted";
  };

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Document Upload Progress</h4>
            <p className="text-muted-foreground text-sm">
              {uploadedRequiredCount} of {stats.required} required documents
              uploaded
            </p>
          </div>
          <div className="text-right">
            <div className="font-bold text-2xl text-primary">
              {stats.required > 0
                ? Math.round((uploadedRequiredCount / stats.required) * 100)
                : 0}
              %
            </div>
            <p className="text-muted-foreground text-xs">
              {stats.optional} optional
            </p>
          </div>
        </div>
        <Progress
          className="mt-3 h-2"
          value={
            stats.required > 0
              ? (uploadedRequiredCount / stats.required) * 100
              : 0
          }
        />
      </div>

      {/* Entity Documents Section */}
      {entityDocuments && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 rounded bg-blue-500" />
            <h3 className="font-semibold">
              {entityDocuments.entityName} Documents
            </h3>
          </div>
          <p className="text-muted-foreground text-sm">
            {entityDocuments.description}
          </p>

          <div className="grid gap-3">
            {entityDocuments.documents.map((doc) => (
              <div
                className={cn(
                  "rounded-lg border p-4 transition-all",
                  getDocumentBorderClass(doc.id, doc.required)
                )}
                key={doc.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{doc.name}</span>
                      {doc.required ? (
                        <Badge className="text-xs" variant="destructive">
                          Required
                        </Badge>
                      ) : (
                        <Badge className="text-xs" variant="secondary">
                          Optional
                        </Badge>
                      )}
                    </div>
                    <p className="mb-2 text-muted-foreground text-sm">
                      {doc.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
                      <span>Formats: {doc.acceptedFormats.join(", ")}</span>
                      <span>Max: {doc.maxSizeMB}MB</span>
                      {doc.validityPeriod && (
                        <span>Valid: {doc.validityPeriod}</span>
                      )}
                      {doc.source && <span>From: {doc.source}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {uploadedFiles[doc.id] ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <Button
                          onClick={() => removeFile(doc.id)}
                          size="icon"
                          type="button"
                          variant="ghost"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <AlertCircle
                        className={cn(
                          "h-5 w-5",
                          doc.required
                            ? "text-orange-500"
                            : "text-muted-foreground"
                        )}
                      />
                    )}
                  </div>
                </div>

                {uploadedFiles[doc.id] ? (
                  <div className="mt-3 flex items-center gap-2 rounded bg-green-100 p-2 text-green-700 text-sm dark:bg-green-900/30 dark:text-green-300">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="truncate">
                      {uploadedFiles[doc.id].name}
                    </span>
                    <span className="text-xs">
                      ({(uploadedFiles[doc.id].size / 1024 / 1024).toFixed(2)}
                      MB)
                    </span>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Input
                      accept={doc.acceptedFormats.join(",")}
                      onChange={(e) => handleFileUpload(e, doc.id)}
                      type="file"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No services selected message */}
      {serviceDocuments.length === 0 && (
        <div className="rounded-lg border border-muted-foreground/25 border-dashed p-6 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <h4 className="mt-2 font-medium text-muted-foreground">
            No service-specific documents
          </h4>
          <p className="mt-1 text-muted-foreground/75 text-sm">
            Select services in the previous step to see additional required
            documents.
          </p>
        </div>
      )}

      {/* Service-Specific Documents - Each service gets its own section */}
      {serviceDocuments.map((service) => (
        <div className="space-y-3" key={service.serviceId}>
          <div className="flex items-center gap-2">
            <div className="h-1 w-4 rounded bg-green-500" />
            <h3 className="font-semibold">{service.serviceName}</h3>
            <Badge className="text-xs" variant="outline">
              {service.documents.filter((d) => d.required).length} required
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">{service.description}</p>

          <div className="grid gap-3">
            {service.documents.map((doc) => {
              const docKey = `${service.serviceId}-${doc.id}`;
              return (
                <div
                  className={cn(
                    "rounded-lg border p-4 transition-all",
                    getDocumentBorderClass(docKey, doc.required)
                  )}
                  key={docKey}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{doc.name}</span>
                        {doc.required ? (
                          <Badge className="text-xs" variant="destructive">
                            Required
                          </Badge>
                        ) : (
                          <Badge className="text-xs" variant="secondary">
                            Optional
                          </Badge>
                        )}
                      </div>
                      <p className="mb-2 text-muted-foreground text-sm">
                        {doc.description}
                      </p>
                      <div className="flex flex-wrap gap-2 text-muted-foreground text-xs">
                        <span>Formats: {doc.acceptedFormats.join(", ")}</span>
                        <span>Max: {doc.maxSizeMB}MB</span>
                        {doc.validityPeriod && (
                          <span>Valid: {doc.validityPeriod}</span>
                        )}
                        {doc.source && <span>From: {doc.source}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {uploadedFiles[docKey] ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <Button
                            onClick={() => removeFile(docKey)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <AlertCircle
                          className={cn(
                            "h-5 w-5",
                            doc.required
                              ? "text-orange-500"
                              : "text-muted-foreground"
                          )}
                        />
                      )}
                    </div>
                  </div>

                  {uploadedFiles[docKey] ? (
                    <div className="mt-3 flex items-center gap-2 rounded bg-green-100 p-2 text-green-700 text-sm dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="truncate">
                        {uploadedFiles[docKey].name}
                      </span>
                      <span className="text-xs">
                        ({(uploadedFiles[docKey].size / 1024 / 1024).toFixed(2)}
                        MB)
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Input
                        accept={doc.acceptedFormats.join(",")}
                        onChange={(e) => handleFileUpload(e, docKey)}
                        type="file"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* OCR Notice */}
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              OCR Processing Available
            </h4>
            <p className="text-blue-700 text-sm dark:text-blue-200">
              Our system will automatically extract TIN, NIS, and registration
              numbers from your uploaded documents to speed up the onboarding
              process.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={onBack}
          type="button"
          variant="outline"
        >
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={isSubmitting}
          onClick={onNext}
          type="button"
        >
          Continue to Review
        </Button>
      </div>
    </div>
  );
}

// Step 4: Service Selection
function ServiceSelectionStep({
  form,
  onNext,
  onBack,
  isSubmitting,
}: StepProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleService = (serviceValue: string) => {
    const newSelection = selectedServices.includes(serviceValue)
      ? selectedServices.filter((s) => s !== serviceValue)
      : [...selectedServices, serviceValue];

    setSelectedServices(newSelection);
    form.setValue("selectedServices", newSelection);
  };

  const kajServices = SERVICE_TYPES.filter((s) => s.business === "kaj");
  const gcmcServices = SERVICE_TYPES.filter((s) => s.business === "gcmc");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-medium text-lg">Select Required Services</h3>
        <p className="mb-6 text-muted-foreground text-sm">
          Choose the accounting and compliance services you need. Services are
          organized by business unit.
        </p>

        {/* KAJ Financial Services */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-4 w-1 rounded bg-blue-500" />
            <h4 className="font-semibold text-blue-600 dark:text-blue-400">
              {BUSINESS_UNITS.KAJ.name}
            </h4>
          </div>
          <p className="mb-4 text-muted-foreground text-sm">
            {BUSINESS_UNITS.KAJ.description}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {kajServices.map((service) => (
              <button
                className={cn(
                  "cursor-pointer rounded-lg border p-3 text-left transition-all",
                  selectedServices.includes(service.value)
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-muted hover:border-blue-300"
                )}
                key={service.value}
                onClick={() => toggleService(service.value)}
                type="button"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {service.label}
                      </span>
                      {service.agency && (
                        <Badge className="text-xs" variant="outline">
                          {service.agency}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {service.description}
                    </p>
                  </div>
                  <Checkbox
                    checked={selectedServices.includes(service.value)}
                    onChange={() => toggleService(service.value)}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* GCMC Consultancy */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-4 w-1 rounded bg-green-500" />
            <h4 className="font-semibold text-green-600 dark:text-green-400">
              {BUSINESS_UNITS.GCMC.name}
            </h4>
          </div>
          <p className="mb-4 text-muted-foreground text-sm">
            {BUSINESS_UNITS.GCMC.description}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {gcmcServices.map((service) => (
              <button
                className={cn(
                  "cursor-pointer rounded-lg border p-3 text-left transition-all",
                  selectedServices.includes(service.value)
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                    : "border-muted hover:border-green-300"
                )}
                key={service.value}
                onClick={() => toggleService(service.value)}
                type="button"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {service.label}
                      </span>
                      {service.agency && (
                        <Badge className="text-xs" variant="outline">
                          {service.agency}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {service.description}
                    </p>
                  </div>
                  <Checkbox
                    checked={selectedServices.includes(service.value)}
                    onChange={() => toggleService(service.value)}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected count */}
        {selectedServices.length > 0 && (
          <div className="rounded-lg bg-primary/10 p-3">
            <p className="font-medium text-sm">
              {selectedServices.length} service
              {selectedServices.length > 1 ? "s" : ""} selected
            </p>
          </div>
        )}

        {form.formState.errors.selectedServices && (
          <p className="mt-2 text-red-500 text-sm">
            {form.formState.errors.selectedServices.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
        <Textarea
          id="additionalNotes"
          {...form.register("additionalNotes")}
          placeholder="Any additional information or special requirements..."
          rows={4}
        />
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={onBack}
          type="button"
          variant="outline"
        >
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={isSubmitting || selectedServices.length === 0}
          onClick={onNext}
          type="button"
        >
          Continue to Document Upload
        </Button>
      </div>
    </div>
  );
}

// Step 5: Review & Confirmation
function ReviewStep({ form, onSubmit, onBack, isSubmitting }: StepProps) {
  const formData = form.getValues();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 font-medium text-lg">Review Your Information</h3>
        <p className="mb-6 text-muted-foreground text-sm">
          Please review all information before submitting your application.
        </p>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entity Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{formData.entityType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">
                  {formatClientName(formData)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TIN:</span>
                <span className="font-medium font-mono">
                  {formData.tinNumber}
                </span>
              </div>
              {formData.nisNumber && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NIS Number:</span>
                  <span className="font-medium font-mono">
                    {formData.nisNumber}
                  </span>
                </div>
              )}
              {formData.passportNumber &&
                formData.entityType === "INDIVIDUAL" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passport/ID:</span>
                    <span className="font-medium">
                      {formData.passportNumber}
                    </span>
                  </div>
                )}
              {formData.isLocalContentQualified && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Local Content:</span>
                  <Badge variant="secondary">Qualified</Badge>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{formData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-medium">{formData.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">
                  {formData.city}, {formData.region}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Selected Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {formData.selectedServices?.map((serviceValue: string) => {
                  const service = SERVICE_TYPES.find(
                    (s) => s.value === serviceValue
                  );
                  return (
                    <Badge key={serviceValue} variant="outline">
                      {service?.label}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1"
          onClick={onBack}
          type="button"
          variant="outline"
        >
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={isSubmitting}
          onClick={onSubmit}
          type="button"
        >
          {isSubmitting ? "Submitting..." : "Create Client"}
        </Button>
      </div>
    </div>
  );
}

// Main wizard component
export default function ClientOnboardingWizard({
  onComplete,
  onCancel,
}: {
  onComplete?: (data: ClientFormData) => void;
  onCancel?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      entityType: "COMPANY",
      isLocalContentQualified: false,
      hasUploadedDocs: false,
      selectedServices: [],
      middleName: "",
      nisNumber: "",
    },
  });

  const steps: OnboardingStep[] = [
    {
      title: "Entity Structure",
      description: "Basic business information and legal structure",
      component: EntityStructureStep,
    },
    {
      title: "Contact Information",
      description: "Address and communication details",
      component: ContactInformationStep,
    },
    {
      title: "Service Selection",
      description: "Choose required accounting and compliance services",
      component: ServiceSelectionStep,
    },
    {
      title: "Document Upload",
      description: "Dynamic requirements based on entity & services",
      component: DocumentUploadStep,
    },
    {
      title: "Review & Submit",
      description: "Confirm all information before creating client",
      component: ReviewStep,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Helper to get step indicator styles
  const getStepIndicatorClass = (index: number) => {
    if (index < currentStep) {
      return "bg-primary text-primary-foreground";
    }
    if (index === currentStep) {
      return "border-2 border-primary bg-primary/20 text-primary";
    }
    return "bg-muted text-muted-foreground";
  };

  const handleNext = async () => {
    // Validate current step
    let isValid = false;
    const { toast } = await import("sonner");

    try {
      // Order: Entity, Contact, Services, Documents (services before docs for dynamic requirements)
      const stepSchemas = [step1Schema, step2Schema, step4Schema, step3Schema];
      const schema = stepSchemas[currentStep];

      if (schema) {
        await schema.parseAsync(form.getValues());
        isValid = true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set errors in the form
        for (const issue of error.issues) {
          const field = issue.path[0] as keyof ClientFormData;
          form.setError(field, { type: "manual", message: issue.message });
        }

        // Show toast with first error
        const firstError = error.issues[0];
        toast.error("Validation Error", {
          description:
            firstError?.message || "Please check the required fields",
        });
      }
      return;
    }

    if (isValid && currentStep < steps.length - 1) {
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
      const formData = form.getValues();
      const validatedData = clientSchema.parse(formData);

      // Map wizard entity types to API entity types (lowercase)
      const entityTypeMap: Record<string, string> = {
        INDIVIDUAL: "individual",
        COMPANY: "corporation",
        PARTNERSHIP: "partnership",
        SOLE_PROPRIETORSHIP: "sole_proprietorship",
      };

      // Build the display name based on entity type (include middle name if present)
      const clientName = formatClientName(validatedData);

      // Call the actual API to create the client
      const { client: orpcClient } = await import("@/utils/orpc");
      const { toast } = await import("sonner");

      const result = await orpcClient.clientCreate({
        // Computed display name
        name: clientName,
        entityType: entityTypeMap[validatedData.entityType] as
          | "individual"
          | "sole_proprietorship"
          | "partnership"
          | "limited_liability_company"
          | "corporation"
          | "trust"
          | "estate"
          | "non_profit"
          | "government",
        // Guyana-specific fields
        businessName:
          validatedData.entityType !== "INDIVIDUAL"
            ? validatedData.businessName
            : undefined,
        firstName:
          validatedData.entityType === "INDIVIDUAL"
            ? validatedData.firstName
            : undefined,
        middleName:
          validatedData.entityType === "INDIVIDUAL"
            ? validatedData.middleName
            : undefined,
        lastName:
          validatedData.entityType === "INDIVIDUAL"
            ? validatedData.lastName
            : undefined,
        tinNumber: validatedData.tinNumber,
        nisNumber: validatedData.nisNumber || undefined,
        passportNumber: validatedData.passportNumber || undefined,
        isLocalContentQualified: validatedData.isLocalContentQualified,
        // Contact info
        email: validatedData.email,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.region, // Region maps to state field
        country: "Guyana",
        // Status
        status: "pending_approval",
        complianceStatus: "pending_review",
        riskLevel: "medium",
        // Additional
        notes: validatedData.additionalNotes || undefined,
        tags: validatedData.selectedServices,
      });

      if (result.success) {
        toast.success("Client created successfully!", {
          description: `${clientName} has been added to GK-Nexus`,
        });
        onComplete?.(validatedData);
      } else {
        throw new Error("Failed to create client");
      }
    } catch (error) {
      const { toast } = await import("sonner");
      toast.error("Failed to create client", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepComponent = steps[currentStep].component;

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-2xl">New Client Onboarding</h1>
            <p className="text-muted-foreground">
              Complete the following steps to add a new client to GK-Nexus
            </p>
          </div>
          {onCancel && (
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          )}
        </div>

        {/* Progress bar */}
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
                "flex max-w-xs flex-col items-center text-center",
                index <= currentStep
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
              key={step.title}
            >
              <div
                className={cn(
                  "mb-2 flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm",
                  getStepIndicatorClass(index)
                )}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="font-medium text-xs">{step.title}</div>
              <div className="hidden text-muted-foreground text-xs sm:block">
                {step.description}
              </div>
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
        <CardContent>
          {React.createElement(currentStepComponent, {
            form,
            onNext: handleNext,
            onBack: handleBack,
            onSubmit: handleSubmit,
            isSubmitting,
          })}
        </CardContent>
      </Card>
    </div>
  );
}
