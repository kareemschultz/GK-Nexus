import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Star,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authClient } from "@/lib/auth-client";
export const Route = createFileRoute("/clients/$id")({
  component: RouteComponent,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

type Client = {
  id: string;
  name: string;
  type: "enterprise" | "mid-market" | "smb";
  status: "active" | "inactive" | "onboarding" | "suspended";
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  revenue: number;
  employees: number;
  joinDate: string;
  lastActivity: string;
  complianceScore: number;
  documents: number;
  taxYear: string;
  filingStatus: string;
  nextDeadline: string;
  riskLevel: "low" | "medium" | "high";
  accountManager: string;
  tags: string[];
  priority: "high" | "medium" | "low";
  immigrationCases: number;
  lastContact: string;
  nextFollowUp?: string;
  relationshipManager: string;
  communicationPreference: "email" | "phone" | "in-person" | "video";
  avatar?: string;
  notes?: string;
  totalBilled: number;
  outstandingAmount: number;
  clientSince: string;
  referralSource: string;
  lifetimeValue: number;
};

type CommunicationRecord = {
  id: string;
  type: "email" | "phone" | "meeting" | "video" | "document";
  subject: string;
  date: string;
  duration?: string;
  participants: string[];
  summary: string;
  followUpRequired: boolean;
  attachments?: string[];
};

type ImmigrationCase = {
  id: string;
  petitionType: string;
  beneficiaryName: string;
  status: "pending" | "approved" | "denied" | "in-review" | "submitted";
  filingDate: string;
  priority: "normal" | "premium";
  currentStep: string;
  nextAction: string;
  nextActionDate: string;
  attorney: string;
  estimatedCompletion: string;
};

type Relationship = {
  id: string;
  type: "subsidiary" | "parent" | "partner" | "vendor" | "customer";
  relatedClientId: string;
  relatedClientName: string;
  relationshipDetails: string;
  startDate: string;
  status: "active" | "inactive";
};

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch client data from API
  const {
    data: clientResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clients.getById({ id });
    },
  });

  // Fetch immigration status from API
  const { data: immigrationResponse } = useQuery({
    queryKey: ["clientImmigration", id],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clients.getImmigrationStatus({ clientId: id });
    },
    enabled: !!id,
  });

  // Fetch client contacts from API
  const { data: contactsResponse } = useQuery({
    queryKey: ["clientContacts", id],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clients.contacts.list({ clientId: id });
    },
    enabled: !!id,
  });

  // Map API response to Client type - API returns flat structure, we map to expected type
  const client: Client | null = clientResponse?.data
    ? {
        id: clientResponse.data.id,
        name: clientResponse.data.name || "",
        type: (clientResponse.data.entityType?.toLowerCase() === "individual"
          ? "smb"
          : clientResponse.data.entityType?.toLowerCase() === "corporation"
            ? "enterprise"
            : "mid-market") as Client["type"],
        status: (clientResponse.data.status?.toLowerCase() ||
          "active") as Client["status"],
        industry: clientResponse.data.industry || "General",
        contactPerson:
          clientResponse.data.contactPerson || clientResponse.data.name || "",
        email: clientResponse.data.email || "",
        phone: clientResponse.data.phoneNumber || "",
        address: clientResponse.data.address || "",
        revenue: 0,
        employees: 0,
        joinDate:
          clientResponse.data.clientSince?.toString() ||
          new Date().toISOString(),
        lastActivity:
          clientResponse.data.updatedAt?.toString() || new Date().toISOString(),
        complianceScore:
          clientResponse.data.complianceStatus === "compliant"
            ? 98
            : clientResponse.data.complianceStatus === "pending"
              ? 75
              : 50,
        documents: 0,
        taxYear: new Date().getFullYear().toString(),
        filingStatus: "Filed",
        nextDeadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        riskLevel: (clientResponse.data.riskLevel?.toLowerCase() ||
          "medium") as Client["riskLevel"],
        accountManager: clientResponse.data.assignedManager || "Unassigned",
        tags: Array.isArray(clientResponse.data.tags)
          ? clientResponse.data.tags
          : typeof clientResponse.data.tags === "string"
            ? JSON.parse(clientResponse.data.tags || "[]")
            : [],
        priority: "medium" as const,
        immigrationCases: 0,
        lastContact:
          clientResponse.data.updatedAt?.toString() || new Date().toISOString(),
        nextFollowUp: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        relationshipManager:
          clientResponse.data.assignedManager || "Unassigned",
        communicationPreference: "email" as const,
        avatar: undefined,
        notes: clientResponse.data.notes || undefined,
        totalBilled: 0,
        outstandingAmount: 0,
        clientSince:
          clientResponse.data.clientSince?.toString() ||
          new Date().toISOString(),
        referralSource: clientResponse.data.referralSource || "Direct",
        lifetimeValue: 0,
      }
    : null;

  // Map immigration data to ImmigrationCase type
  const immigrationCases: ImmigrationCase[] = immigrationResponse?.data
    ? [
        {
          id: immigrationResponse.data.id || "1",
          petitionType:
            immigrationResponse.data.visaType?.replace(/_/g, " ") ||
            "Work Permit",
          beneficiaryName: client?.name || "Beneficiary",
          status: (immigrationResponse.data.currentStatus
            ?.toLowerCase()
            .includes("approved")
            ? "approved"
            : immigrationResponse.data.currentStatus
                  ?.toLowerCase()
                  .includes("submitted")
              ? "submitted"
              : immigrationResponse.data.currentStatus
                    ?.toLowerCase()
                    .includes("review")
                ? "in-review"
                : immigrationResponse.data.currentStatus
                      ?.toLowerCase()
                      .includes("denied")
                  ? "denied"
                  : "pending") as ImmigrationCase["status"],
          filingDate:
            immigrationResponse.data.applicationDate?.toString() ||
            new Date().toISOString().split("T")[0],
          priority: "normal" as const,
          currentStep:
            immigrationResponse.data.currentStatus?.replace(/_/g, " ") ||
            "Processing",
          nextAction: immigrationResponse.data.nextAction || "Review case",
          nextActionDate:
            immigrationResponse.data.nextActionDate?.toString() ||
            new Date().toISOString().split("T")[0],
          attorney: immigrationResponse.data.assignedOfficer || "Unassigned",
          estimatedCompletion:
            immigrationResponse.data.expiryDate?.toString() || "TBD",
        },
      ]
    : [];

  // Communications - no direct API, will be empty for now
  const communications: CommunicationRecord[] = [];

  // Relationships - no direct API, will be empty for now
  const relationships: Relationship[] = [];

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3">Loading client details...</span>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-bold text-2xl">Client Not Found</h1>
          <p className="text-muted-foreground">
            The client you're looking for doesn't exist or has been removed.
          </p>
          <Button
            className="mt-4"
            onClick={() => navigate({ to: "/clients" })}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>;
      case "inactive":
        return <Badge variant="secondary">Inactive</Badge>;
      case "onboarding":
        return <Badge variant="outline">Onboarding</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "enterprise":
        return <Badge variant="default">Enterprise</Badge>;
      case "mid-market":
        return <Badge variant="outline">Mid-Market</Badge>;
      case "smb":
        return <Badge variant="secondary">SMB</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>;
      case "medium":
        return <Badge variant="outline">Medium Priority</Badge>;
      case "low":
        return <Badge variant="secondary">Low Priority</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case "low":
        return <Badge variant="default">Low Risk</Badge>;
      case "medium":
        return <Badge variant="outline">Medium Risk</Badge>;
      case "high":
        return <Badge variant="destructive">High Risk</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getFilingBadge = (status: string) => {
    switch (status) {
      case "Filed":
        return <Badge variant="default">Filed</Badge>;
      case "In Progress":
        return <Badge variant="outline">In Progress</Badge>;
      case "Overdue":
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getCaseStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "denied":
        return <Badge variant="destructive">Denied</Badge>;
      case "in-review":
        return <Badge variant="secondary">In Review</Badge>;
      case "submitted":
        return <Badge>Submitted</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getCommunicationIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "meeting":
        return <Users className="h-4 w-4" />;
      case "video":
        return <Video className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getRelationshipIcon = (type: string) => {
    switch (type) {
      case "subsidiary":
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case "parent":
        return <Building2 className="h-4 w-4 text-purple-500" />;
      case "partner":
        return <Users className="h-4 w-4 text-green-500" />;
      case "vendor":
        return <Zap className="h-4 w-4 text-orange-500" />;
      case "customer":
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) {
      return "text-green-500";
    }
    if (score >= 80) {
      return "text-yellow-500";
    }
    return "text-red-500";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "inactive":
        return <Clock className="h-5 w-5 text-gray-500" />;
      case "onboarding":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "suspended":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formatShortDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getProgressColor = (score: number) => {
    if (score >= 90) {
      return "bg-green-500";
    }
    if (score >= 80) {
      return "bg-yellow-500";
    }
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate({ to: "/clients" })}
              size="icon"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={client.avatar} />
                <AvatarFallback className="text-lg">
                  {client.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-bold text-3xl tracking-tight">
                  {client.name}
                </h1>
                <div className="mt-1 flex items-center gap-3">
                  {getStatusIcon(client.status)}
                  <span className="text-muted-foreground">
                    {client.industry} • {client.employees.toLocaleString()}{" "}
                    employees • Client since{" "}
                    {formatShortDate(client.clientSince)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {client.tags.slice(0, 3).map((tag) => (
                    <Badge className="text-xs" key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  {client.tags.length > 3 && (
                    <Badge className="text-xs" variant="outline">
                      +{client.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ to: `/clients/${id}/edit` })}
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Client
            </Button>
            <Button
              onClick={() => navigate({ to: `/clients/${id}/documents` })}
            >
              <FileText className="mr-2 h-4 w-4" />
              Documents
            </Button>
          </div>
        </div>
      </header>

      {/* Key Metrics Overview */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Status
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {getStatusIcon(client.status)}
                  {getStatusBadge(client.status)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Priority
                </p>
                <div className="mt-2">{getPriorityBadge(client.priority)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Immigration Cases
                </p>
                <p className="font-bold text-2xl">{client.immigrationCases}</p>
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
                  Lifetime Value
                </p>
                <p className="font-bold text-2xl">
                  {formatCurrency(client.lifetimeValue)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Compliance Score
                </p>
                <div className="mt-2">
                  <p
                    className={`font-bold text-2xl ${getComplianceColor(client.complianceScore)}`}
                  >
                    {client.complianceScore}%
                  </p>
                  <Progress
                    className="mt-1 h-2"
                    indicatorClassName={getProgressColor(
                      client.complianceScore
                    )}
                    value={client.complianceScore}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="immigration">Immigration Cases</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  Primary contact details and communication preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{client.contactPerson}</p>
                    <p className="text-muted-foreground text-sm">
                      Primary Contact
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{client.email}</p>
                    <p className="text-muted-foreground text-sm">
                      Email Address
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{client.phone}</p>
                    <p className="text-muted-foreground text-sm">
                      Phone Number
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{client.address}</p>
                    <p className="text-muted-foreground text-sm">
                      Business Address
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-muted p-2">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium capitalize">
                      {client.communicationPreference}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Preferred Communication
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Details
                </CardTitle>
                <CardDescription>
                  Company information and business metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Industry
                    </p>
                    <p className="font-medium">{client.industry}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Account Manager
                    </p>
                    <p className="font-medium">{client.relationshipManager}</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Annual Revenue
                    </p>
                    <p className="font-bold text-xl">
                      {formatCurrency(client.revenue)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Employees
                    </p>
                    <p className="font-bold text-xl">
                      {client.employees.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Client Type
                    </p>
                    {getTypeBadge(client.type)}
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Risk Level
                    </p>
                    {getRiskBadge(client.riskLevel)}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Referral Source
                    </p>
                    <p className="font-medium">{client.referralSource}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Last Activity
                    </p>
                    <p className="font-medium">
                      {formatDate(client.lastActivity)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes and Additional Information */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Client Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent className="space-y-6" value="immigration">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Immigration Cases</CardTitle>
                  <CardDescription>
                    Active and pending immigration petitions for {client.name}
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Case
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Petition Type</TableHead>
                    <TableHead>Beneficiary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Step</TableHead>
                    <TableHead>Next Action</TableHead>
                    <TableHead>Attorney</TableHead>
                    <TableHead>Est. Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {immigrationCases.map((case_) => (
                    <TableRow key={case_.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{case_.petitionType}</Badge>
                          {case_.priority === "premium" && (
                            <Badge className="text-xs" variant="destructive">
                              Premium
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {case_.beneficiaryName}
                      </TableCell>
                      <TableCell>{getCaseStatusBadge(case_.status)}</TableCell>
                      <TableCell>{case_.currentStep}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {case_.nextAction}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            Due: {formatShortDate(case_.nextActionDate)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{case_.attorney}</TableCell>
                      <TableCell>
                        {formatShortDate(case_.estimatedCompletion)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="communications">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Communication History</CardTitle>
                  <CardDescription>
                    Recent interactions and correspondence with {client.name}
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Log Communication
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communications.map((comm, index) => (
                  <div key={comm.id}>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          {getCommunicationIcon(comm.type)}
                        </div>
                        {index < communications.length - 1 && (
                          <div className="mt-2 h-16 w-0.5 bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{comm.subject}</h4>
                            <p className="text-muted-foreground text-sm">
                              {formatDate(comm.date)}
                              {comm.duration && ` • ${comm.duration}`}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className="capitalize" variant="outline">
                              {comm.type}
                            </Badge>
                            {comm.followUpRequired && (
                              <Badge className="text-xs" variant="destructive">
                                Follow-up Required
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="mt-2 text-sm">{comm.summary}</p>
                        <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
                          <Users className="h-3 w-3" />
                          <span>
                            Participants: {comm.participants.join(", ")}
                          </span>
                        </div>
                        {comm.attachments && comm.attachments.length > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
                            <FileText className="h-3 w-3" />
                            <span>
                              Attachments: {comm.attachments.join(", ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="relationships">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Business Relationships</CardTitle>
                  <CardDescription>
                    Connected entities and business relationships
                  </CardDescription>
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Relationship
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {relationships.map((relationship) => (
                  <div
                    className="flex items-center justify-between rounded-lg border p-4"
                    key={relationship.id}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {getRelationshipIcon(relationship.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {relationship.relatedClientName}
                          </h4>
                          <Badge className="capitalize" variant="outline">
                            {relationship.type}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {relationship.relationshipDetails}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          Since: {formatDate(relationship.startDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          relationship.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {relationship.status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-6" value="financials">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Total Billed
                    </p>
                    <p className="font-bold text-xl">
                      {formatCurrency(client.totalBilled)}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground text-sm">
                      Outstanding
                    </p>
                    <p className="font-bold text-orange-500 text-xl">
                      {formatCurrency(client.outstandingAmount)}
                    </p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Lifetime Value
                  </p>
                  <p className="font-bold text-2xl text-green-600">
                    {formatCurrency(client.lifetimeValue)}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Payment Terms
                  </p>
                  <p className="font-medium">Net 30 days</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Latest billing activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">INV-2024-001</p>
                      <p className="text-muted-foreground text-xs">
                        Nov 1, 2024
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">$15,000</p>
                      <Badge className="text-xs" variant="destructive">
                        Overdue
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">INV-2024-002</p>
                      <p className="text-muted-foreground text-xs">
                        Oct 1, 2024
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">$22,500</p>
                      <Badge className="text-xs" variant="default">
                        Paid
                      </Badge>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">INV-2024-003</p>
                      <p className="text-muted-foreground text-xs">
                        Sep 1, 2024
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">$18,750</p>
                      <Badge className="text-xs" variant="default">
                        Paid
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="documents">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Document Library</CardTitle>
                  <CardDescription>
                    All documents and files associated with {client.name}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => navigate({ to: `/clients/${id}/documents` })}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Manage Documents
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <Badge variant="outline">PDF</Badge>
                  </div>
                  <h4 className="font-medium">H-1B Filing Package</h4>
                  <p className="text-muted-foreground text-sm">
                    Updated Nov 25, 2024
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <FileText className="h-8 w-8 text-green-500" />
                    <Badge variant="outline">Excel</Badge>
                  </div>
                  <h4 className="font-medium">Compliance Checklist</h4>
                  <p className="text-muted-foreground text-sm">
                    Updated Nov 20, 2024
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <FileText className="h-8 w-8 text-purple-500" />
                    <Badge variant="outline">Word</Badge>
                  </div>
                  <h4 className="font-medium">Service Agreement</h4>
                  <p className="text-muted-foreground text-sm">
                    Updated Jan 15, 2023
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and operations for this client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button
              className="justify-start"
              onClick={() => navigate({ to: `/clients/${id}/edit` })}
              variant="outline"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Client Info
            </Button>
            <Button className="justify-start" variant="outline">
              <MessageCircle className="mr-2 h-4 w-4" />
              Send Message
            </Button>
            <Button className="justify-start" variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Meeting
            </Button>
            <Button className="justify-start" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Immigration Case
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
