"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  Building2,
  CheckCircle,
  FileText,
  Upload,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Textarea } from "@/components/ui/textarea";
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

// Entity types based on GK-Enterprise-Suite requirements
export const ENTITY_TYPES = [
  { value: "INDIVIDUAL", label: "Individual", icon: Users },
  { value: "COMPANY", label: "Company", icon: Building2 },
  { value: "PARTNERSHIP", label: "Partnership", icon: Users },
  { value: "SOLE_PROPRIETORSHIP", label: "Sole Proprietorship", icon: Users },
] as const;

// Service types based on Guyana compliance requirements
export const SERVICE_TYPES = [
  {
    value: "PAYE_FILING",
    label: "PAYE Filing",
    description: "Monthly/Annual PAYE tax returns",
  },
  {
    value: "VAT_RETURN",
    label: "VAT Returns",
    description: "Monthly VAT Form C-104 submissions",
  },
  {
    value: "INCOME_TAX_RETURN",
    label: "Income Tax Returns",
    description: "Annual income tax filing",
  },
  {
    value: "NIS_SUBMISSION",
    label: "NIS Contributions",
    description: "National Insurance Scheme submissions",
  },
  {
    value: "BUSINESS_REGISTRATION",
    label: "Business Registration",
    description: "Company incorporation and setup",
  },
  {
    value: "TAX_CONSULTATION",
    label: "Tax Advisory",
    description: "General tax consultation services",
  },
  {
    value: "COMPLIANCE_REVIEW",
    label: "Compliance Review",
    description: "Regulatory compliance audits",
  },
] as const;

// Validation schemas for each step
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
    lastName: z.string().optional(),
    tinNumber: z
      .string()
      .min(9, "TIN must be 9 digits")
      .max(9, "TIN must be 9 digits"),
    passportNumber: z.string().optional(),
    isLocalContentQualified: z.boolean().default(false),
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
  phoneNumber: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
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

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type ClientFormData = z.infer<typeof clientSchema>;

interface OnboardingStep {
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

// Step 1: Entity Structure
function EntityStructureStep({
  form,
  onNext,
  isSubmitting,
}: {
  form: any;
  onNext: () => void;
  isSubmitting: boolean;
}) {
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
            onValueChange={(value) => form.setValue("entityType", value)}
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
          <div className="grid grid-cols-2 gap-4">
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

        <div>
          <Label htmlFor="tinNumber">
            Tax Identification Number (TIN){" "}
            <span className="text-red-500">*</span>
          </Label>
          <p className="mb-2 text-muted-foreground text-sm">
            9-digit TIN number issued by Guyana Revenue Authority
          </p>
          <Input
            id="tinNumber"
            {...form.register("tinNumber")}
            maxLength={9}
            pattern="[0-9]{9}"
            placeholder="123456789"
          />
          {form.formState.errors.tinNumber && (
            <p className="mt-1 text-red-500 text-sm">
              {form.formState.errors.tinNumber.message}
            </p>
          )}
        </div>

        {entityType === "INDIVIDUAL" && (
          <div>
            <Label htmlFor="passportNumber">Passport/National ID Number</Label>
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
              form.setValue("isLocalContentQualified", checked)
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
}: {
  form: any;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
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
              <SelectItem value="demerara-mahaica">Demerara-Mahaica</SelectItem>
              <SelectItem value="berbice">East Berbice-Corentyne</SelectItem>
              <SelectItem value="essequibo">
                Essequibo Islands-West Demerara
              </SelectItem>
              <SelectItem value="mahaica-berbice">Mahaica-Berbice</SelectItem>
              <SelectItem value="potaro-siparuni">Potaro-Siparuni</SelectItem>
              <SelectItem value="barima-waini">Barima-Waini</SelectItem>
              <SelectItem value="cuyuni-mazaruni">Cuyuni-Mazaruni</SelectItem>
              <SelectItem value="pomeroon-supenaam">
                Pomeroon-Supenaam
              </SelectItem>
              <SelectItem value="upper-demerara-berbice">
                Upper Demerara-Berbice
              </SelectItem>
              <SelectItem value="upper-takutu-essequibo">
                Upper Takutu-Upper Essequibo
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
          Continue to Document Upload
        </Button>
      </div>
    </div>
  );
}

// Step 3: Document Upload
function DocumentUploadStep({
  form,
  onNext,
  onBack,
  isSubmitting,
}: {
  form: any;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const entityType = form.watch("entityType");

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    fileType: string
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFiles((prev) => [...prev, fileType]);
      form.setValue("hasUploadedDocs", true);
      // In a real implementation, you would upload the file to your server here
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-muted border-dashed p-6 text-center">
        <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-medium text-lg">Upload Required Documents</h3>
        <p className="mb-6 text-muted-foreground text-sm">
          Please upload the required identification and registration documents
        </p>

        <div className="space-y-4">
          {entityType === "INDIVIDUAL" ? (
            <div className="rounded-lg border p-4 text-left">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">National ID or Passport</span>
                </div>
                {uploadedFiles.includes("identification") ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
              </div>
              <p className="mb-3 text-muted-foreground text-sm">
                Upload a clear copy of your National ID card or passport
              </p>
              <Input
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, "identification")}
                type="file"
              />
            </div>
          ) : (
            <div className="rounded-lg border p-4 text-left">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">
                    Certificate of Incorporation
                  </span>
                </div>
                {uploadedFiles.includes("incorporation") ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                )}
              </div>
              <p className="mb-3 text-muted-foreground text-sm">
                Upload your Certificate of Incorporation or business
                registration document
              </p>
              <Input
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, "incorporation")}
                type="file"
              />
            </div>
          )}

          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
            <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
              OCR Processing Available
            </h4>
            <p className="text-blue-700 text-sm dark:text-blue-200">
              Our system will automatically extract TIN and registration numbers
              from your uploaded documents to speed up the onboarding process.
            </p>
          </div>
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
          Continue to Services
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
}: {
  form: any;
  onNext: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleService = (serviceValue: string) => {
    const newSelection = selectedServices.includes(serviceValue)
      ? selectedServices.filter((s) => s !== serviceValue)
      : [...selectedServices, serviceValue];

    setSelectedServices(newSelection);
    form.setValue("selectedServices", newSelection);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 font-medium text-lg">Select Required Services</h3>
        <p className="mb-6 text-muted-foreground text-sm">
          Choose the accounting and compliance services you need. You can modify
          these later.
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {SERVICE_TYPES.map((service) => (
            <div
              className={cn(
                "cursor-pointer rounded-lg border p-4 transition-all",
                selectedServices.includes(service.value)
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-muted-foreground/50"
              )}
              key={service.value}
              onClick={() => toggleService(service.value)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <h4 className="font-medium">{service.label}</h4>
                    {selectedServices.includes(service.value) && (
                      <Badge className="text-xs" variant="secondary">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {service.description}
                  </p>
                </div>
                <Checkbox
                  checked={selectedServices.includes(service.value)}
                  className="mt-1"
                  onChange={() => toggleService(service.value)}
                />
              </div>
            </div>
          ))}
        </div>

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
          Review & Submit
        </Button>
      </div>
    </div>
  );
}

// Step 5: Review & Confirmation
function ReviewStep({
  form,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  form: any;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
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
                  {formData.entityType === "INDIVIDUAL"
                    ? `${formData.firstName} ${formData.lastName}`
                    : formData.businessName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TIN:</span>
                <span className="font-medium">{formData.tinNumber}</span>
              </div>
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
      title: "Document Upload",
      description: "Required identification and business documents",
      component: DocumentUploadStep,
    },
    {
      title: "Service Selection",
      description: "Choose required accounting and compliance services",
      component: ServiceSelectionStep,
    },
    {
      title: "Review & Submit",
      description: "Confirm all information before creating client",
      component: ReviewStep,
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    // Validate current step
    let isValid = false;

    try {
      switch (currentStep) {
        case 0:
          await step1Schema.parseAsync(form.getValues());
          isValid = true;
          break;
        case 1:
          await step2Schema.parseAsync(form.getValues());
          isValid = true;
          break;
        case 2:
          await step3Schema.parseAsync(form.getValues());
          isValid = true;
          break;
        case 3:
          await step4Schema.parseAsync(form.getValues());
          isValid = true;
          break;
      }
    } catch (error) {
      console.error("Validation error:", error);
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

      // Here you would call your API to create the client
      console.log("Creating client:", validatedData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      onComplete?.(validatedData);
    } catch (error) {
      console.error("Submission error:", error);
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
                  <CheckCircle className="h-4 w-4" />
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
