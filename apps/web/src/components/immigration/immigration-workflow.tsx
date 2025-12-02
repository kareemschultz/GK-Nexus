import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  ExternalLink,
  FileText,
  Plus,
  Upload,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type VisaStatus =
  | "APPLICATION_SUBMITTED"
  | "UNDER_REVIEW"
  | "ADDITIONAL_DOCS_REQUESTED"
  | "INTERVIEW_SCHEDULED"
  | "APPROVED"
  | "REJECTED"
  | "APPEAL_IN_PROGRESS"
  | "VISA_ISSUED"
  | "RENEWAL_REQUIRED"
  | "EXPIRED";

type VisaType =
  | "WORK_PERMIT"
  | "STUDENT_VISA"
  | "BUSINESS_VISA"
  | "INVESTOR_VISA"
  | "FAMILY_REUNIFICATION"
  | "PERMANENT_RESIDENCE"
  | "CITIZENSHIP"
  | "OTHER";

type DocumentType =
  | "PASSPORT"
  | "BIRTH_CERTIFICATE"
  | "MARRIAGE_CERTIFICATE"
  | "EDUCATIONAL_CREDENTIALS"
  | "EMPLOYMENT_LETTER"
  | "FINANCIAL_STATEMENTS"
  | "MEDICAL_EXAMINATION"
  | "POLICE_CLEARANCE"
  | "SPONSOR_DOCUMENTS"
  | "OTHER";

interface ImmigrationCase {
  id: string;
  clientId: string;
  clientName: string;
  currentStatus: VisaStatus;
  visaType: VisaType;
  applicationDate: Date;
  expiryDate: Date | null;
  nextAction: string | null;
  nextActionDate: Date | null;
  assignedOfficer: string | null;
  documents: ImmigrationDocument[];
  timeline: TimelineEvent[];
  daysUntilExpiry: number | null;
  progress: number;
  notes: string[];
}

interface ImmigrationDocument {
  id: string;
  documentId: string;
  documentType: DocumentType;
  isRequired: boolean;
  submittedAt: Date | null;
  notes: string | null;
  status: "MISSING" | "SUBMITTED" | "APPROVED" | "REJECTED";
}

interface TimelineEvent {
  id: string;
  status: VisaStatus;
  changedAt: Date;
  changedBy: string;
  notes: string | null;
}

interface WorkflowTemplate {
  name: string;
  requiredDocuments: DocumentType[];
  workflow: WorkflowStep[];
  totalEstimatedDays: number;
  fees: {
    applicationFee: number;
    processingFee: number;
    consultationFee: number;
  };
}

interface WorkflowStep {
  step: number;
  name: string;
  estimatedDays: number;
  isCompleted?: boolean;
}

interface ImmigrationWorkflowProps {
  cases?: ImmigrationCase[];
  onCreateCase?: (caseData: Partial<ImmigrationCase>) => void;
  onUpdateCase?: (caseId: string, updates: Partial<ImmigrationCase>) => void;
  onSubmitDocuments?: (caseId: string, documents: File[]) => void;
}

const getStatusBadge = (status: VisaStatus) => {
  switch (status) {
    case "APPLICATION_SUBMITTED":
      return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
    case "UNDER_REVIEW":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
      );
    case "ADDITIONAL_DOCS_REQUESTED":
      return (
        <Badge className="bg-orange-100 text-orange-800">Docs Requested</Badge>
      );
    case "INTERVIEW_SCHEDULED":
      return (
        <Badge className="bg-purple-100 text-purple-800">
          Interview Scheduled
        </Badge>
      );
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    case "APPEAL_IN_PROGRESS":
      return (
        <Badge className="bg-red-100 text-red-800">Appeal in Progress</Badge>
      );
    case "VISA_ISSUED":
      return <Badge className="bg-green-100 text-green-800">Visa Issued</Badge>;
    case "RENEWAL_REQUIRED":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          Renewal Required
        </Badge>
      );
    case "EXPIRED":
      return <Badge variant="destructive">Expired</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getDocumentStatusBadge = (status: string) => {
  switch (status) {
    case "MISSING":
      return <Badge variant="destructive">Missing</Badge>;
    case "SUBMITTED":
      return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-GY", {
    style: "currency",
    currency: "GYD",
    minimumFractionDigits: 0,
  }).format(amount);

const workflowTemplates: Record<VisaType, WorkflowTemplate> = {
  WORK_PERMIT: {
    name: "Work Permit Application",
    requiredDocuments: [
      "PASSPORT",
      "EDUCATIONAL_CREDENTIALS",
      "EMPLOYMENT_LETTER",
      "MEDICAL_EXAMINATION",
      "POLICE_CLEARANCE",
    ],
    workflow: [
      { step: 1, name: "Document Collection", estimatedDays: 14 },
      { step: 2, name: "Application Submission", estimatedDays: 1 },
      { step: 3, name: "Initial Review", estimatedDays: 30 },
      { step: 4, name: "Interview (if required)", estimatedDays: 14 },
      { step: 5, name: "Decision", estimatedDays: 30 },
      { step: 6, name: "Visa Issuance", estimatedDays: 7 },
    ],
    totalEstimatedDays: 96,
    fees: {
      applicationFee: 50_000,
      processingFee: 25_000,
      consultationFee: 15_000,
    },
  },
  STUDENT_VISA: {
    name: "Student Visa Application",
    requiredDocuments: [
      "PASSPORT",
      "EDUCATIONAL_CREDENTIALS",
      "FINANCIAL_STATEMENTS",
      "MEDICAL_EXAMINATION",
      "SPONSOR_DOCUMENTS",
    ],
    workflow: [
      { step: 1, name: "Document Collection", estimatedDays: 21 },
      { step: 2, name: "Application Submission", estimatedDays: 1 },
      { step: 3, name: "Initial Review", estimatedDays: 21 },
      { step: 4, name: "Financial Verification", estimatedDays: 14 },
      { step: 5, name: "Decision", estimatedDays: 21 },
      { step: 6, name: "Visa Issuance", estimatedDays: 7 },
    ],
    totalEstimatedDays: 85,
    fees: {
      applicationFee: 35_000,
      processingFee: 20_000,
      consultationFee: 10_000,
    },
  },
  BUSINESS_VISA: {
    name: "Business Visa Application",
    requiredDocuments: [
      "PASSPORT",
      "FINANCIAL_STATEMENTS",
      "EMPLOYMENT_LETTER",
      "MEDICAL_EXAMINATION",
      "POLICE_CLEARANCE",
    ],
    workflow: [
      { step: 1, name: "Document Collection", estimatedDays: 14 },
      { step: 2, name: "Business Plan Review", estimatedDays: 7 },
      { step: 3, name: "Application Submission", estimatedDays: 1 },
      { step: 4, name: "Initial Review", estimatedDays: 30 },
      { step: 5, name: "Interview", estimatedDays: 14 },
      { step: 6, name: "Decision", estimatedDays: 21 },
      { step: 7, name: "Visa Issuance", estimatedDays: 7 },
    ],
    totalEstimatedDays: 94,
    fees: {
      applicationFee: 75_000,
      processingFee: 30_000,
      consultationFee: 20_000,
    },
  },
  // Add other visa types with similar structure
  INVESTOR_VISA: {
    name: "Investor Visa Application",
    requiredDocuments: ["PASSPORT", "FINANCIAL_STATEMENTS", "OTHER"],
    workflow: [
      { step: 1, name: "Document Collection", estimatedDays: 30 },
      { step: 2, name: "Investment Verification", estimatedDays: 21 },
      { step: 3, name: "Application Submission", estimatedDays: 1 },
      { step: 4, name: "Review Process", estimatedDays: 45 },
      { step: 5, name: "Decision", estimatedDays: 30 },
    ],
    totalEstimatedDays: 127,
    fees: {
      applicationFee: 100_000,
      processingFee: 50_000,
      consultationFee: 30_000,
    },
  },
  FAMILY_REUNIFICATION: {
    name: "Family Reunification",
    requiredDocuments: [
      "PASSPORT",
      "BIRTH_CERTIFICATE",
      "MARRIAGE_CERTIFICATE",
    ],
    workflow: [
      { step: 1, name: "Document Collection", estimatedDays: 21 },
      { step: 2, name: "Relationship Verification", estimatedDays: 14 },
      { step: 3, name: "Application Submission", estimatedDays: 1 },
      { step: 4, name: "Review Process", estimatedDays: 35 },
      { step: 5, name: "Decision", estimatedDays: 21 },
    ],
    totalEstimatedDays: 92,
    fees: {
      applicationFee: 40_000,
      processingFee: 20_000,
      consultationFee: 12_000,
    },
  },
  PERMANENT_RESIDENCE: {
    name: "Permanent Residence Application",
    requiredDocuments: [
      "PASSPORT",
      "FINANCIAL_STATEMENTS",
      "POLICE_CLEARANCE",
      "MEDICAL_EXAMINATION",
    ],
    workflow: [
      { step: 1, name: "Document Collection", estimatedDays: 45 },
      { step: 2, name: "Eligibility Assessment", estimatedDays: 30 },
      { step: 3, name: "Application Submission", estimatedDays: 1 },
      { step: 4, name: "Review Process", estimatedDays: 60 },
      { step: 5, name: "Interview", estimatedDays: 21 },
      { step: 6, name: "Final Decision", estimatedDays: 30 },
    ],
    totalEstimatedDays: 187,
    fees: {
      applicationFee: 150_000,
      processingFee: 75_000,
      consultationFee: 40_000,
    },
  },
  CITIZENSHIP: {
    name: "Citizenship Application",
    requiredDocuments: [
      "PASSPORT",
      "BIRTH_CERTIFICATE",
      "EDUCATIONAL_CREDENTIALS",
      "FINANCIAL_STATEMENTS",
    ],
    workflow: [
      { step: 1, name: "Eligibility Verification", estimatedDays: 30 },
      { step: 2, name: "Document Collection", estimatedDays: 60 },
      { step: 3, name: "Application Submission", estimatedDays: 1 },
      { step: 4, name: "Background Check", estimatedDays: 90 },
      { step: 5, name: "Citizenship Test", estimatedDays: 30 },
      { step: 6, name: "Final Decision", estimatedDays: 45 },
    ],
    totalEstimatedDays: 256,
    fees: {
      applicationFee: 200_000,
      processingFee: 100_000,
      consultationFee: 50_000,
    },
  },
  OTHER: {
    name: "Other Visa Application",
    requiredDocuments: ["PASSPORT", "OTHER"],
    workflow: [
      { step: 1, name: "Document Collection", estimatedDays: 21 },
      { step: 2, name: "Application Submission", estimatedDays: 1 },
      { step: 3, name: "Review Process", estimatedDays: 30 },
      { step: 4, name: "Decision", estimatedDays: 21 },
    ],
    totalEstimatedDays: 73,
    fees: {
      applicationFee: 30_000,
      processingFee: 15_000,
      consultationFee: 8000,
    },
  },
};

export function ImmigrationWorkflow({
  cases = [],
  onCreateCase,
  onUpdateCase,
  onSubmitDocuments,
}: ImmigrationWorkflowProps) {
  const [selectedCase, setSelectedCase] = useState<ImmigrationCase | null>(
    null
  );
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [newCaseData, setNewCaseData] = useState<Partial<ImmigrationCase>>({
    visaType: "WORK_PERMIT",
  });

  const caseStats = useMemo(() => {
    const stats = {
      total: cases.length,
      active: 0,
      pending: 0,
      approved: 0,
      expired: 0,
    };

    for (const case_ of cases) {
      if (
        [
          "APPLICATION_SUBMITTED",
          "UNDER_REVIEW",
          "ADDITIONAL_DOCS_REQUESTED",
          "INTERVIEW_SCHEDULED",
        ].includes(case_.currentStatus)
      ) {
        stats.pending++;
      } else if (["APPROVED", "VISA_ISSUED"].includes(case_.currentStatus)) {
        stats.approved++;
      } else if (case_.currentStatus === "EXPIRED") {
        stats.expired++;
      } else {
        stats.active++;
      }
    }

    return stats;
  }, [cases]);

  const urgentCases = useMemo(
    () =>
      cases
        .filter(
          (case_) =>
            case_.daysUntilExpiry !== null && case_.daysUntilExpiry <= 30
        )
        .sort((a, b) => (a.daysUntilExpiry || 0) - (b.daysUntilExpiry || 0)),
    [cases]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Immigration Workflow
          </h1>
          <p className="text-muted-foreground">
            Manage visa applications, track document requirements, and monitor
            immigration cases.
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Immigration Case
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Cases
                </p>
                <p className="font-bold text-2xl">{caseStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Pending
                </p>
                <p className="font-bold text-2xl">{caseStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Approved
                </p>
                <p className="font-bold text-2xl">{caseStats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Urgent
                </p>
                <p className="font-bold text-2xl">{urgentCases.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Expired
                </p>
                <p className="font-bold text-2xl">{caseStats.expired}</p>
              </div>
              <X className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Cases Alert */}
      {urgentCases.length > 0 && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Urgent Cases Requiring Attention
            </CardTitle>
            <CardDescription>
              These cases have expiry dates within 30 days and require immediate
              action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentCases.slice(0, 3).map((case_) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-3"
                  key={case_.id}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {case_.clientName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{case_.clientName}</p>
                      <p className="text-muted-foreground text-xs">
                        {case_.visaType.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-destructive text-sm">
                      {case_.daysUntilExpiry} days left
                    </p>
                    <Badge className="text-xs" variant="destructive">
                      {case_.currentStatus.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs className="w-full" defaultValue="cases">
        <TabsList>
          <TabsTrigger value="cases">All Cases</TabsTrigger>
          <TabsTrigger value="templates">Workflow Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="cases">
          {cases.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-medium text-lg">
                    No immigration cases
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Start managing immigration workflows by creating your first
                    case.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Case
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((case_) => (
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  key={case_.id}
                  onClick={() => setSelectedCase(case_)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {case_.clientName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {case_.clientName}
                          </CardTitle>
                          <CardDescription>
                            {case_.visaType.replace("_", " ")}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(case_.currentStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Progress
                      </span>
                      <span className="font-medium text-sm">
                        {case_.progress}%
                      </span>
                    </div>
                    <Progress value={case_.progress} />

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm">
                        Application Date
                      </span>
                      <span className="text-sm">
                        {formatDate(case_.applicationDate)}
                      </span>
                    </div>

                    {case_.expiryDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-sm">
                          Expiry Date
                        </span>
                        <span
                          className={`text-sm ${
                            case_.daysUntilExpiry && case_.daysUntilExpiry < 30
                              ? "font-medium text-destructive"
                              : ""
                          }`}
                        >
                          {formatDate(case_.expiryDate)}
                        </span>
                      </div>
                    )}

                    {case_.nextAction && (
                      <div className="rounded-lg bg-muted p-2">
                        <p className="font-medium text-xs">Next Action:</p>
                        <p className="text-xs">{case_.nextAction}</p>
                        {case_.nextActionDate && (
                          <p className="text-muted-foreground text-xs">
                            Due: {formatDate(case_.nextActionDate)}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="templates">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(workflowTemplates).map(([visaType, template]) => (
              <Card key={visaType}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{template.name}</span>
                    <Badge variant="outline">
                      {visaType.replace("_", " ")}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Estimated duration: {template.totalEstimatedDays} days
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-2 font-medium text-sm">
                      Required Documents:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.requiredDocuments.slice(0, 3).map((doc) => (
                        <Badge
                          className="text-xs"
                          key={doc}
                          variant="secondary"
                        >
                          {doc.replace("_", " ")}
                        </Badge>
                      ))}
                      {template.requiredDocuments.length > 3 && (
                        <Badge className="text-xs" variant="secondary">
                          +{template.requiredDocuments.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 font-medium text-sm">Workflow Steps:</p>
                    <div className="space-y-1">
                      {template.workflow.slice(0, 3).map((step) => (
                        <div
                          className="flex items-center justify-between text-xs"
                          key={step.step}
                        >
                          <span>{step.name}</span>
                          <span className="text-muted-foreground">
                            {step.estimatedDays}d
                          </span>
                        </div>
                      ))}
                      {template.workflow.length > 3 && (
                        <p className="text-muted-foreground text-xs">
                          +{template.workflow.length - 3} more steps
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <p className="font-medium text-sm">Total Fees:</p>
                    <p className="font-bold">
                      {formatCurrency(
                        template.fees.applicationFee +
                          template.fees.processingFee +
                          template.fees.consultationFee
                      )}
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      setNewCaseData({ visaType: visaType as VisaType });
                      setShowCreateDialog(true);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="analytics">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-sm">
                  Total Cases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl">{cases.length}</div>
                <p className="text-muted-foreground text-xs">All time</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-sm">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-amber-500">
                  {cases.filter((c) => c.status === "IN_PROGRESS").length}
                </div>
                <p className="text-muted-foreground text-xs">Active cases</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-sm">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-green-600">
                  {cases.filter((c) => c.status === "APPROVED").length}
                </div>
                <p className="text-muted-foreground text-xs">Successful</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="font-medium text-sm">
                  Pending Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-bold text-2xl text-blue-500">
                  {cases.filter((c) => c.status === "PENDING_REVIEW").length}
                </div>
                <p className="text-muted-foreground text-xs">Awaiting action</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Case Distribution by Type</CardTitle>
              <CardDescription>
                Breakdown of immigration cases by visa/permit type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  "Work Permit",
                  "Visitor Visa",
                  "Residency",
                  "Business Visa",
                  "Student Visa",
                ].map((type) => {
                  const count = cases.filter((c) => c.type === type).length;
                  const percentage =
                    cases.length > 0 ? (count / cases.length) * 100 : 0;
                  return (
                    <div className="space-y-2" key={type}>
                      <div className="flex items-center justify-between text-sm">
                        <span>{type}</span>
                        <span className="font-medium">
                          {count} cases ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Processing Time Metrics</CardTitle>
              <CardDescription>
                Average processing times and case duration statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <div className="font-bold text-2xl">14</div>
                  <p className="text-muted-foreground text-sm">
                    Avg. Days to Approval
                  </p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="font-bold text-2xl">98%</div>
                  <p className="text-muted-foreground text-sm">Approval Rate</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <div className="font-bold text-2xl">3</div>
                  <p className="text-muted-foreground text-sm">
                    Cases This Month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Case Detail Dialog */}
      {selectedCase && (
        <Dialog
          onOpenChange={() => setSelectedCase(null)}
          open={!!selectedCase}
        >
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {selectedCase.clientName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl">{selectedCase.clientName}</h2>
                  <p className="font-normal text-muted-foreground text-sm">
                    {selectedCase.visaType.replace("_", " ")} •{" "}
                    {selectedCase.currentStatus.replace("_", " ")}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="mt-6 space-y-6">
              {/* Case Overview */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Application Date</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(selectedCase.applicationDate)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Progress</p>
                        <p className="text-muted-foreground text-xs">
                          {selectedCase.progress}% Complete
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <User className="h-8 w-8 text-purple-500" />
                      <div>
                        <p className="font-medium text-sm">Assigned Officer</p>
                        <p className="text-muted-foreground text-xs">
                          {selectedCase.assignedOfficer || "Not assigned"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Document Checklist */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document Checklist
                    </CardTitle>
                    <Button
                      onClick={() => setShowDocumentDialog(true)}
                      size="sm"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Documents
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedCase.documents.map((doc) => (
                      <div
                        className="flex items-center justify-between rounded-lg border p-3"
                        key={doc.id}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`rounded-full p-1 ${
                              doc.status === "APPROVED"
                                ? "bg-green-100 text-green-600"
                                : doc.status === "SUBMITTED"
                                  ? "bg-blue-100 text-blue-600"
                                  : doc.status === "REJECTED"
                                    ? "bg-red-100 text-red-600"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {doc.status === "APPROVED" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : doc.status === "SUBMITTED" ? (
                              <Clock className="h-4 w-4" />
                            ) : doc.status === "REJECTED" ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {doc.documentType.replace("_", " ")}
                              {doc.isRequired && (
                                <span className="ml-1 text-red-500">*</span>
                              )}
                            </p>
                            {doc.submittedAt && (
                              <p className="text-muted-foreground text-xs">
                                Submitted {formatDate(doc.submittedAt)}
                              </p>
                            )}
                            {doc.notes && (
                              <p className="text-muted-foreground text-xs">
                                {doc.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDocumentStatusBadge(doc.status)}
                          <Button size="icon" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Application Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedCase.timeline.map((event, index) => (
                      <div className="flex gap-4" key={event.id}>
                        <div className="flex flex-col items-center">
                          <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                            <Clock className="h-4 w-4" />
                          </div>
                          {index < selectedCase.timeline.length - 1 && (
                            <div className="mt-2 h-8 w-0.5 bg-border" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">
                              {event.status.replace("_", " ")}
                            </h4>
                            <span className="text-muted-foreground text-xs">
                              {formatDate(event.changedAt)}
                            </span>
                          </div>
                          {event.notes && (
                            <p className="mt-1 text-muted-foreground text-sm">
                              {event.notes}
                            </p>
                          )}
                          <p className="text-muted-foreground text-xs">
                            Updated by {event.changedBy}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button onClick={() => setSelectedCase(null)} variant="outline">
                Close
              </Button>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Update Status
              </Button>
              <Button>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Client Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Case Dialog */}
      <Dialog onOpenChange={setShowCreateDialog} open={showCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Immigration Case</DialogTitle>
            <DialogDescription>
              Start a new immigration case and workflow for a client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="visaType">Visa Type</Label>
              <Select
                onValueChange={(value) =>
                  setNewCaseData({
                    ...newCaseData,
                    visaType: value as VisaType,
                  })
                }
                value={newCaseData.visaType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visa type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(workflowTemplates).map(
                    ([value, template]) => (
                      <SelectItem key={value} value={value}>
                        {template.name}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                onChange={(e) =>
                  setNewCaseData({ ...newCaseData, clientName: e.target.value })
                }
                placeholder="Enter client name"
                value={newCaseData.clientName || ""}
              />
            </div>

            <div>
              <Label htmlFor="notes">Initial Notes</Label>
              <Textarea
                id="notes"
                onChange={(e) =>
                  setNewCaseData({
                    ...newCaseData,
                    notes: e.target.value.split("\n"),
                  })
                }
                placeholder="Add any initial notes or observations..."
                rows={3}
                value={newCaseData.notes?.join("\n") || ""}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowCreateDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onCreateCase?.(newCaseData);
                setShowCreateDialog(false);
                setNewCaseData({ visaType: "WORK_PERMIT" });
              }}
            >
              Create Case
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog onOpenChange={setShowDocumentDialog} open={showDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload required documents for {selectedCase?.clientName}'s
              immigration case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-muted border-dashed p-6 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-muted-foreground text-sm">
                Supports PDF, JPG, PNG up to 10MB each
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowDocumentDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={() => setShowDocumentDialog(false)}>
              Upload Documents
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
