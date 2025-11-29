import {
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  MapPin,
  Settings,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  component: React.ComponentType<StepProps>;
}

interface StepProps {
  data: SetupData;
  onDataChange: (data: Partial<SetupData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

interface SetupData {
  // Organization Info
  organizationName: string;
  organizationType:
    | "sole_proprietor"
    | "partnership"
    | "corporation"
    | "llc"
    | "other";
  industry: string;
  description: string;

  // Contact Details
  address: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;

  // Tax Configuration
  taxId: string;
  vatRegistered: boolean;
  vatNumber?: string;
  taxYear: "calendar" | "april_march";

  // Features & Preferences
  features: string[];
  timezone: string;
  currency: string;

  // User Role
  userRole: "owner" | "accountant" | "bookkeeper" | "admin";
}

const steps: WizardStep[] = [
  {
    id: "organization",
    title: "Organization Details",
    description: "Tell us about your organization",
    icon: Building2,
    component: OrganizationStep,
  },
  {
    id: "contact",
    title: "Contact Information",
    description: "How can we reach you?",
    icon: MapPin,
    component: ContactStep,
  },
  {
    id: "tax-config",
    title: "Tax Configuration",
    description: "Set up your tax preferences",
    icon: CreditCard,
    component: TaxConfigStep,
  },
  {
    id: "features",
    title: "Features & Preferences",
    description: "Choose what works for you",
    icon: Settings,
    component: FeaturesStep,
  },
  {
    id: "user-role",
    title: "Your Role",
    description: "Define your access level",
    icon: Users,
    component: UserRoleStep,
  },
];

function OrganizationStep({
  data,
  onDataChange,
  onNext,
  isFirstStep,
}: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name *</Label>
          <Input
            className="w-full"
            id="orgName"
            onChange={(e) => onDataChange({ organizationName: e.target.value })}
            placeholder="Enter your organization name"
            value={data.organizationName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgType">Organization Type *</Label>
          <Select
            onValueChange={(value: SetupData["organizationType"]) =>
              onDataChange({ organizationType: value })
            }
            value={data.organizationType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select organization type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sole_proprietor">
                Sole Proprietorship
              </SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="corporation">Corporation</SelectItem>
              <SelectItem value="llc">Limited Liability Company</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            onChange={(e) => onDataChange({ industry: e.target.value })}
            placeholder="e.g., Retail, Consulting, Manufacturing"
            value={data.industry}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            onChange={(e) => onDataChange({ description: e.target.value })}
            placeholder="Brief description of your business"
            rows={3}
            value={data.description}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <div />
        <Button
          className="flex items-center gap-2"
          disabled={!(data.organizationName && data.organizationType)}
          onClick={onNext}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ContactStep({ data, onDataChange, onNext, onPrevious }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Business Address *</Label>
          <Input
            id="address"
            onChange={(e) => onDataChange({ address: e.target.value })}
            placeholder="Street address"
            value={data.address}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            onChange={(e) => onDataChange({ city: e.target.value })}
            placeholder="City"
            value={data.city}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Region *</Label>
          <Select
            onValueChange={(value) => onDataChange({ region: value })}
            value={data.region}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="region-1">Region 1 (Barima-Waini)</SelectItem>
              <SelectItem value="region-2">
                Region 2 (Pomeroon-Supenaam)
              </SelectItem>
              <SelectItem value="region-3">
                Region 3 (Essequibo Islands-West Demerara)
              </SelectItem>
              <SelectItem value="region-4">
                Region 4 (Demerara-Mahaica)
              </SelectItem>
              <SelectItem value="region-5">
                Region 5 (Mahaica-Berbice)
              </SelectItem>
              <SelectItem value="region-6">
                Region 6 (East Berbice-Corentyne)
              </SelectItem>
              <SelectItem value="region-7">
                Region 7 (Cuyuni-Mazaruni)
              </SelectItem>
              <SelectItem value="region-8">
                Region 8 (Potaro-Siparuni)
              </SelectItem>
              <SelectItem value="region-9">
                Region 9 (Upper Takutu-Upper Essequibo)
              </SelectItem>
              <SelectItem value="region-10">
                Region 10 (Upper Demerara-Berbice)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal Code</Label>
          <Input
            id="postalCode"
            onChange={(e) => onDataChange({ postalCode: e.target.value })}
            placeholder="Postal code"
            value={data.postalCode}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            onChange={(e) => onDataChange({ phone: e.target.value })}
            placeholder="+592-XXX-XXXX"
            value={data.phone}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            onChange={(e) => onDataChange({ email: e.target.value })}
            placeholder="business@example.com"
            type="email"
            value={data.email}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="website">Website (Optional)</Label>
          <Input
            id="website"
            onChange={(e) => onDataChange({ website: e.target.value })}
            placeholder="https://yourwebsite.com"
            value={data.website}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          className="flex items-center gap-2"
          onClick={onPrevious}
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button
          className="flex items-center gap-2"
          disabled={
            !(
              data.address &&
              data.city &&
              data.region &&
              data.phone &&
              data.email
            )
          }
          onClick={onNext}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function TaxConfigStep({ data, onDataChange, onNext, onPrevious }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="taxId">Tax Identification Number (TIN) *</Label>
          <Input
            id="taxId"
            onChange={(e) => onDataChange({ taxId: e.target.value })}
            placeholder="Enter your TIN"
            value={data.taxId}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={data.vatRegistered}
            id="vatRegistered"
            onCheckedChange={(checked) =>
              onDataChange({ vatRegistered: !!checked })
            }
          />
          <Label htmlFor="vatRegistered">VAT Registered</Label>
        </div>

        {data.vatRegistered && (
          <div className="space-y-2">
            <Label htmlFor="vatNumber">VAT Number *</Label>
            <Input
              id="vatNumber"
              onChange={(e) => onDataChange({ vatNumber: e.target.value })}
              placeholder="Enter your VAT number"
              value={data.vatNumber || ""}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Tax Year *</Label>
          <Select
            onValueChange={(value: SetupData["taxYear"]) =>
              onDataChange({ taxYear: value })
            }
            value={data.taxYear}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calendar">
                Calendar Year (Jan - Dec)
              </SelectItem>
              <SelectItem value="april_march">
                Financial Year (Apr - Mar)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Currency *</Label>
          <Select
            onValueChange={(value) => onDataChange({ currency: value })}
            value={data.currency}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GYD">Guyanese Dollar (GYD)</SelectItem>
              <SelectItem value="USD">US Dollar (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          className="flex items-center gap-2"
          onClick={onPrevious}
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button
          className="flex items-center gap-2"
          disabled={
            !(data.taxId && data.currency) ||
            (data.vatRegistered && !data.vatNumber)
          }
          onClick={onNext}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function FeaturesStep({ data, onDataChange, onNext, onPrevious }: StepProps) {
  const availableFeatures = [
    {
      id: "invoicing",
      label: "Invoicing & Billing",
      description: "Create and manage invoices",
    },
    {
      id: "payroll",
      label: "Payroll Management",
      description: "Manage employee payroll",
    },
    {
      id: "tax-calculations",
      label: "Tax Calculations",
      description: "VAT, PAYE, and other taxes",
    },
    {
      id: "time-tracking",
      label: "Time Tracking",
      description: "Track billable hours",
    },
    {
      id: "client-portal",
      label: "Client Portal",
      description: "Client self-service portal",
    },
    {
      id: "document-management",
      label: "Document Management",
      description: "Organize business documents",
    },
    {
      id: "compliance",
      label: "Compliance Tracking",
      description: "Stay compliant with regulations",
    },
    {
      id: "automation",
      label: "Workflow Automation",
      description: "Automate repetitive tasks",
    },
  ];

  const toggleFeature = (featureId: string) => {
    const currentFeatures = data.features || [];
    const newFeatures = currentFeatures.includes(featureId)
      ? currentFeatures.filter((f) => f !== featureId)
      : [...currentFeatures, featureId];
    onDataChange({ features: newFeatures });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 font-medium text-lg">Choose Features</h3>
          <p className="text-muted-foreground text-sm">
            Select the features you want to enable. You can change these later.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {availableFeatures.map((feature) => (
            <Card
              className={`cursor-pointer transition-colors ${
                (data.features || []).includes(feature.id)
                  ? "ring-2 ring-primary"
                  : ""
              }`}
              key={feature.id}
              onClick={() => toggleFeature(feature.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{feature.label}</h4>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                  <Checkbox
                    checked={(data.features || []).includes(feature.id)}
                    onChange={() => toggleFeature(feature.id)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Timezone *</Label>
          <Select
            onValueChange={(value) => onDataChange({ timezone: value })}
            value={data.timezone}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/Guyana">Guyana Time (GYT)</SelectItem>
              <SelectItem value="America/New_York">
                Eastern Time (EST/EDT)
              </SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          className="flex items-center gap-2"
          onClick={onPrevious}
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button
          className="flex items-center gap-2"
          disabled={!data.timezone}
          onClick={onNext}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function UserRoleStep({
  data,
  onDataChange,
  onNext,
  onPrevious,
  isLastStep,
}: StepProps) {
  const roles = [
    {
      value: "owner" as const,
      label: "Business Owner",
      description: "Full access to all features and settings",
      permissions: ["All Features", "User Management", "Billing", "Settings"],
    },
    {
      value: "accountant" as const,
      label: "Accountant",
      description: "Access to financial features and client management",
      permissions: [
        "Financial Reports",
        "Tax Management",
        "Client Data",
        "Invoicing",
      ],
    },
    {
      value: "bookkeeper" as const,
      label: "Bookkeeper",
      description: "Access to day-to-day financial operations",
      permissions: ["Data Entry", "Basic Reports", "Transaction Management"],
    },
    {
      value: "admin" as const,
      label: "Administrator",
      description: "Technical administration and user management",
      permissions: [
        "User Management",
        "System Settings",
        "Security",
        "Integrations",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h3 className="mb-2 font-medium text-lg">Select Your Role</h3>
          <p className="text-muted-foreground text-sm">
            Choose the role that best describes your position and
            responsibilities.
          </p>
        </div>

        <div className="space-y-4">
          {roles.map((role) => (
            <Card
              className={`cursor-pointer transition-colors ${
                data.userRole === role.value ? "ring-2 ring-primary" : ""
              }`}
              key={role.value}
              onClick={() => onDataChange({ userRole: role.value })}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="flex items-center gap-2 font-medium">
                      {role.label}
                      {data.userRole === role.value && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </h4>
                    <p className="mb-2 text-muted-foreground text-sm">
                      {role.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.map((permission) => (
                        <Badge
                          className="text-xs"
                          key={permission}
                          variant="secondary"
                        >
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button
          className="flex items-center gap-2"
          onClick={onPrevious}
          variant="outline"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Button>
        <Button
          className="flex items-center gap-2"
          disabled={!data.userRole}
          onClick={onNext}
        >
          {isLastStep ? "Complete Setup" : "Next"}
          {!isLastStep && <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

interface SetupWizardProps {
  onComplete: (data: SetupData) => void;
  onCancel?: () => void;
}

export function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<SetupData>({
    organizationName: "",
    organizationType: "corporation",
    industry: "",
    description: "",
    address: "",
    city: "",
    region: "",
    postalCode: "",
    phone: "",
    email: "",
    website: "",
    taxId: "",
    vatRegistered: false,
    taxYear: "calendar",
    features: [],
    timezone: "America/Guyana",
    currency: "GYD",
    userRole: "owner",
  });

  const handleDataChange = (newData: Partial<SetupData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete(data);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const StepComponent = currentStepData.component;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl">
        <div className="fade-in slide-in-from-bottom-4 animate-in duration-500">
          <Card>
            <CardHeader className="pb-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <currentStepData.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{currentStepData.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">
                      {currentStepData.description}
                    </p>
                  </div>
                </div>
                {onCancel && (
                  <Button onClick={onCancel} size="sm" variant="ghost">
                    Cancel
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <Progress className="w-full" value={progress} />
              </div>

              {/* Step indicators */}
              <div className="mt-4 flex justify-center space-x-2">
                {steps.map((step, index) => (
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full font-medium text-sm transition-colors ${
                      index < currentStep
                        ? "bg-primary text-primary-foreground"
                        : index === currentStep
                          ? "border-2 border-primary bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                    key={step.id}
                  >
                    {index < currentStep ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <div className="fade-in animate-in duration-300">
                <StepComponent
                  data={data}
                  isFirstStep={currentStep === 0}
                  isLastStep={currentStep === steps.length - 1}
                  onDataChange={handleDataChange}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
