import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  FileText,
  History,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ClientStatus = "active" | "inactive" | "onboarding" | "suspended";
type EntityType =
  | "INDIVIDUAL"
  | "COMPANY"
  | "PARTNERSHIP"
  | "SOLE_PROPRIETORSHIP";
type ComplianceStatus =
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "PENDING_REVIEW"
  | "WARNING";
type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

interface Client {
  id: string;
  clientNumber: string;
  name: string;
  entityType: EntityType;
  status: ClientStatus;
  complianceStatus: ComplianceStatus;
  riskLevel: RiskLevel;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  taxIdNumber: string;
  businessRegistrationNumber: string | null;
  assignedAccountant: string | null;
  assignedManager: string | null;
  clientSince: Date;
  lastActivity: Date | null;
  tags: string[];
  customFields: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ClientContact {
  id: string;
  name: string;
  title: string | null;
  email: string;
  phoneNumber: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

interface ClientService {
  id: string;
  serviceName: string;
  serviceType: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  startDate: Date;
  endDate: Date | null;
  monthlyFee: number | null;
  annualFee: number | null;
}

interface ImmigrationStatus {
  currentStatus: string;
  visaType: string;
  applicationDate: Date;
  expiryDate: Date | null;
  documents: any[];
  timeline: any[];
  daysUntilExpiry: number | null;
}

interface ClientProfileProps {
  client: Client;
  contacts?: ClientContact[];
  services?: ClientService[];
  immigrationStatus?: ImmigrationStatus;
  onEdit?: (client: Client) => void;
  onDelete?: (clientId: string) => void;
  onContactClient?: (client: Client) => void;
}

const getStatusBadge = (status: ClientStatus) => {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "inactive":
      return <Badge variant="secondary">Inactive</Badge>;
    case "onboarding":
      return <Badge className="bg-blue-100 text-blue-800">Onboarding</Badge>;
    case "suspended":
      return <Badge variant="destructive">Suspended</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getComplianceBadge = (status: ComplianceStatus) => {
  switch (status) {
    case "COMPLIANT":
      return <Badge className="bg-green-100 text-green-800">Compliant</Badge>;
    case "NON_COMPLIANT":
      return <Badge variant="destructive">Non-Compliant</Badge>;
    case "PENDING_REVIEW":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      );
    case "WARNING":
      return <Badge className="bg-orange-100 text-orange-800">Warning</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getRiskBadge = (level: RiskLevel) => {
  switch (level) {
    case "LOW":
      return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
    case "MEDIUM":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>
      );
    case "HIGH":
      return <Badge variant="destructive">High Risk</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getEntityTypeIcon = (type: EntityType) => {
  switch (type) {
    case "INDIVIDUAL":
      return <Users className="h-4 w-4" />;
    case "COMPANY":
    case "PARTNERSHIP":
    case "SOLE_PROPRIETORSHIP":
      return <Building2 className="h-4 w-4" />;
    default:
      return <Building2 className="h-4 w-4" />;
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

export function ClientProfile({
  client,
  contacts = [],
  services = [],
  immigrationStatus,
  onEdit,
  onDelete,
  onContactClient,
}: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const primaryContact = useMemo(
    () => contacts.find((c) => c.isPrimary) || contacts[0],
    [contacts]
  );

  const activeServices = useMemo(
    () => services.filter((s) => s.status === "ACTIVE"),
    [services]
  );

  const totalServiceRevenue = useMemo(
    () =>
      activeServices.reduce(
        (sum, s) => sum + (s.monthlyFee || 0) * 12 + (s.annualFee || 0),
        0
      ),
    [activeServices]
  );

  const complianceScore = useMemo(() => {
    // Calculate compliance score based on various factors
    let score = 100;

    if (client.complianceStatus === "NON_COMPLIANT") score -= 50;
    else if (client.complianceStatus === "WARNING") score -= 20;
    else if (client.complianceStatus === "PENDING_REVIEW") score -= 10;

    if (client.riskLevel === "HIGH") score -= 20;
    else if (client.riskLevel === "MEDIUM") score -= 10;

    if (!client.taxIdNumber) score -= 15;
    if (!client.phoneNumber) score -= 5;
    if (!client.address) score -= 10;

    return Math.max(score, 0);
  }, [client]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${client.name}`}
            />
            <AvatarFallback>
              {client.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-2xl">{client.name}</h1>
              {getEntityTypeIcon(client.entityType)}
              <Badge variant="outline">{client.clientNumber}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-4">
              {getStatusBadge(client.status)}
              {getComplianceBadge(client.complianceStatus)}
              {getRiskBadge(client.riskLevel)}
            </div>
            <div className="mt-3 flex items-center gap-4 text-muted-foreground text-sm">
              <span>Client since {formatDate(client.clientSince)}</span>
              {client.lastActivity && (
                <span>Last activity {formatDate(client.lastActivity)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => onContactClient?.(client)}
            size="sm"
            variant="outline"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Contact
          </Button>
          <Button onClick={() => onEdit?.(client)} size="sm" variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                More
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link to={`/clients/${client.id}/documents`}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/clients/${client.id}/history`}>
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Compliance Score
                </p>
                <p
                  className={`font-bold text-2xl ${
                    complianceScore >= 90
                      ? "text-green-600"
                      : complianceScore >= 70
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {complianceScore}%
                </p>
              </div>
              <CheckCircle
                className={`h-8 w-8 ${
                  complianceScore >= 90
                    ? "text-green-500"
                    : complianceScore >= 70
                      ? "text-yellow-500"
                      : "text-red-500"
                }`}
              />
            </div>
            <Progress className="mt-2" value={complianceScore} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Active Services
                </p>
                <p className="font-bold text-2xl">{activeServices.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Annual Revenue
                </p>
                <p className="font-bold text-2xl">
                  {formatCurrency(totalServiceRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
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
                <p className="font-bold text-2xl">
                  {immigrationStatus ? 1 : 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="immigration">Immigration</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-6" value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-muted-foreground text-sm">
                      Entity Type
                    </label>
                    <p className="mt-1">
                      {client.entityType.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <label className="font-medium text-muted-foreground text-sm">
                      TIN Number
                    </label>
                    <p className="mt-1 font-mono text-sm">
                      {client.taxIdNumber}
                    </p>
                  </div>
                </div>

                {client.businessRegistrationNumber && (
                  <div>
                    <label className="font-medium text-muted-foreground text-sm">
                      Business Registration Number
                    </label>
                    <p className="mt-1 font-mono text-sm">
                      {client.businessRegistrationNumber}
                    </p>
                  </div>
                )}

                <div>
                  <label className="font-medium text-muted-foreground text-sm">
                    Address
                  </label>
                  <p className="mt-1">
                    {client.address && client.city && client.region
                      ? `${client.address}, ${client.city}, ${client.region}`
                      : "No address provided"}
                  </p>
                </div>

                {client.tags.length > 0 && (
                  <div>
                    <label className="font-medium text-muted-foreground text-sm">
                      Tags
                    </label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {client.tags.map((tag) => (
                        <Badge
                          className="text-xs"
                          key={tag}
                          variant="secondary"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Email</p>
                    <p className="text-muted-foreground text-sm">
                      {client.email}
                    </p>
                  </div>
                </div>

                {client.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Phone</p>
                      <p className="text-muted-foreground text-sm">
                        {client.phoneNumber}
                      </p>
                    </div>
                  </div>
                )}

                {client.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">Address</p>
                      <p className="text-muted-foreground text-sm">
                        {client.address}, {client.city}, {client.region}
                      </p>
                    </div>
                  </div>
                )}

                {primaryContact && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium text-sm">Primary Contact</p>
                      <p className="text-muted-foreground text-sm">
                        {primaryContact.name}
                      </p>
                      {primaryContact.title && (
                        <p className="text-muted-foreground text-xs">
                          {primaryContact.title}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Team Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {client.assignedAccountant
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">Assigned Accountant</p>
                    <p className="text-muted-foreground text-sm">
                      {client.assignedAccountant || "Not assigned"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {client.assignedManager
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">Assigned Manager</p>
                    <p className="text-muted-foreground text-sm">
                      {client.assignedManager || "Not assigned"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="contacts">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Client Contacts</h3>
              <p className="text-muted-foreground text-sm">
                Manage contact persons for this client
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>

          {contacts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-medium text-lg">
                    No contacts found
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Add contact persons to manage communications with this
                    client.
                  </p>
                  <Button className="mt-4" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {contact.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{contact.name}</h4>
                            {contact.isPrimary && (
                              <Badge className="text-xs" variant="secondary">
                                Primary
                              </Badge>
                            )}
                          </div>
                          {contact.title && (
                            <p className="text-muted-foreground text-sm">
                              {contact.title}
                            </p>
                          )}
                          <div className="mt-2 flex items-center gap-4 text-muted-foreground text-xs">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </span>
                            {contact.phoneNumber && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {contact.phoneNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="services">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Client Services</h3>
              <p className="text-muted-foreground text-sm">
                Accounting and compliance services for this client
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </div>

          {services.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-medium text-lg">
                    No services configured
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                    Add accounting and compliance services for this client.
                  </p>
                  <Button className="mt-4" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Service
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`rounded-full p-2 ${
                            service.status === "ACTIVE"
                              ? "bg-green-100 text-green-600"
                              : service.status === "SUSPENDED"
                                ? "bg-red-100 text-red-600"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-medium">{service.serviceName}</h4>
                          <p className="text-muted-foreground text-sm">
                            {service.serviceType}
                          </p>
                          <p className="mt-1 text-muted-foreground text-xs">
                            Started {formatDate(service.startDate)}
                            {service.endDate &&
                              ` • Ends ${formatDate(service.endDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {service.monthlyFee
                            ? formatCurrency(service.monthlyFee) + "/month"
                            : service.annualFee
                              ? formatCurrency(service.annualFee) + "/year"
                              : "Custom pricing"}
                        </p>
                        <Badge
                          variant={
                            service.status === "ACTIVE"
                              ? "default"
                              : service.status === "SUSPENDED"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="immigration">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Immigration Status</h3>
              <p className="text-muted-foreground text-sm">
                Track visa applications and immigration workflow
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Application
            </Button>
          </div>

          {immigrationStatus ? (
            <div className="space-y-6">
              {/* Current Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Current Application
                    </span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {immigrationStatus.currentStatus}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="font-medium text-muted-foreground text-sm">
                        Visa Type
                      </label>
                      <p className="mt-1">{immigrationStatus.visaType}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground text-sm">
                        Application Date
                      </label>
                      <p className="mt-1">
                        {formatDate(immigrationStatus.applicationDate)}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground text-sm">
                        Expiry Date
                      </label>
                      <p className="mt-1">
                        {immigrationStatus.expiryDate
                          ? formatDate(immigrationStatus.expiryDate)
                          : "N/A"}
                      </p>
                      {immigrationStatus.daysUntilExpiry && (
                        <p
                          className={`mt-1 text-xs ${
                            immigrationStatus.daysUntilExpiry < 30
                              ? "text-red-600"
                              : immigrationStatus.daysUntilExpiry < 90
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        >
                          {immigrationStatus.daysUntilExpiry} days until expiry
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline */}
              {immigrationStatus.timeline.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Application Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {immigrationStatus.timeline.map((event, index) => (
                        <div className="flex gap-4" key={index}>
                          <div className="flex flex-col items-center">
                            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
                              <Clock className="h-4 w-4" />
                            </div>
                            {index < immigrationStatus.timeline.length - 1 && (
                              <div className="mt-2 h-8 w-0.5 bg-border" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">
                                {event.status}
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
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 font-medium text-lg">
                    No immigration cases
                  </h3>
                  <p className="mt-1 text-muted-foreground text-sm">
                    This client has no active immigration applications.
                  </p>
                  <Button className="mt-4" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Start Immigration Case
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent className="space-y-4" value="documents">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">Client Documents</h3>
              <p className="text-muted-foreground text-sm">
                Manage documents and files for this client
              </p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-medium text-lg">
                  Document management
                </h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Advanced document management features will be implemented
                  here.
                </p>
                <Button className="mt-4" size="sm" variant="outline">
                  <Link to={`/clients/${client.id}/documents`}>
                    <FileText className="mr-2 h-4 w-4" />
                    Go to Documents
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="activity">
          <div>
            <h3 className="font-semibold text-lg">Recent Activity</h3>
            <p className="text-muted-foreground text-sm">
              Track interactions and updates for this client
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-medium text-lg">Activity tracking</h3>
                <p className="mt-1 text-muted-foreground text-sm">
                  Client activity history and audit trail will be displayed
                  here.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog onOpenChange={setShowDeleteDialog} open={showDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Client
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {client.name}? This action cannot
              be undone. All client data, documents, and history will be
              permanently removed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowDeleteDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onDelete?.(client.id);
                setShowDeleteDialog(false);
              }}
              variant="destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
