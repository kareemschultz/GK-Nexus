import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Mail,
  MapPin,
  Phone,
  Users,
} from "lucide-react";
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
};

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  // Mock client data - in a real app this would be fetched from an API
  const mockClients: Client[] = [
    {
      id: "1",
      name: "TechCorp Inc.",
      type: "enterprise",
      status: "active",
      industry: "Technology",
      contactPerson: "John Smith",
      email: "john.smith@techcorp.com",
      phone: "+1 (555) 123-4567",
      address: "123 Innovation Drive, Silicon Valley, CA 94025",
      revenue: 50_000_000,
      employees: 500,
      joinDate: "2023-01-15",
      lastActivity: "2024-11-27",
      complianceScore: 98,
      documents: 24,
      taxYear: "2024",
      filingStatus: "Filed",
      nextDeadline: "2025-03-15",
      riskLevel: "low",
      accountManager: "Sarah Williams",
    },
    {
      id: "2",
      name: "DataFlow Solutions",
      type: "mid-market",
      status: "onboarding",
      industry: "Data Analytics",
      contactPerson: "Sarah Johnson",
      email: "sarah@dataflow.com",
      phone: "+1 (555) 234-5678",
      address: "456 Analytics Blvd, Austin, TX 78701",
      revenue: 15_000_000,
      employees: 150,
      joinDate: "2024-11-20",
      lastActivity: "2024-11-28",
      complianceScore: 85,
      documents: 8,
      taxYear: "2024",
      filingStatus: "In Progress",
      nextDeadline: "2025-01-15",
      riskLevel: "medium",
      accountManager: "Mike Chen",
    },
    {
      id: "3",
      name: "Green Energy Co.",
      type: "enterprise",
      status: "active",
      industry: "Renewable Energy",
      contactPerson: "Michael Chen",
      email: "m.chen@greenenergy.com",
      phone: "+1 (555) 345-6789",
      address: "789 Sustainability St, Portland, OR 97201",
      revenue: 75_000_000,
      employees: 800,
      joinDate: "2022-06-10",
      lastActivity: "2024-11-26",
      complianceScore: 96,
      documents: 45,
      taxYear: "2024",
      filingStatus: "Filed",
      nextDeadline: "2025-03-15",
      riskLevel: "low",
      accountManager: "Jennifer Davis",
    },
    {
      id: "4",
      name: "Local Retail LLC",
      type: "smb",
      status: "suspended",
      industry: "Retail",
      contactPerson: "Emily Davis",
      email: "emily@localretail.com",
      phone: "+1 (555) 456-7890",
      address: "321 Main St, Springfield, IL 62701",
      revenue: 2_000_000,
      employees: 25,
      joinDate: "2023-08-22",
      lastActivity: "2024-10-15",
      complianceScore: 72,
      documents: 12,
      taxYear: "2024",
      filingStatus: "Overdue",
      nextDeadline: "2024-12-15",
      riskLevel: "high",
      accountManager: "Tom Wilson",
    },
    {
      id: "5",
      name: "Healthcare Plus",
      type: "mid-market",
      status: "active",
      industry: "Healthcare",
      contactPerson: "Dr. Robert Wilson",
      email: "r.wilson@healthcareplus.com",
      phone: "+1 (555) 567-8901",
      address: "654 Medical Center Dr, Boston, MA 02101",
      revenue: 25_000_000,
      employees: 300,
      joinDate: "2023-03-14",
      lastActivity: "2024-11-28",
      complianceScore: 94,
      documents: 38,
      taxYear: "2024",
      filingStatus: "Filed",
      nextDeadline: "2025-03-15",
      riskLevel: "low",
      accountManager: "Lisa Thompson",
    },
  ];

  const client = mockClients.find((c) => c.id === id);

  if (!client) {
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
        return <CheckCircle className="h-5 w-5 text-green-500" />;
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
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
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
            <div>
              <h1 className="font-bold text-3xl tracking-tight">
                {client.name}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                {getStatusIcon(client.status)}
                <span className="text-muted-foreground">
                  {client.industry} • {client.employees.toLocaleString()}{" "}
                  employees
                </span>
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

      <div className="grid gap-6">
        {/* Status Overview */}
        <div className="grid gap-4 md:grid-cols-4">
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
                    Type
                  </p>
                  <div className="mt-2">{getTypeBadge(client.type)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Risk Level
                  </p>
                  <div className="mt-2">{getRiskBadge(client.riskLevel)}</div>
                </div>
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

        {/* Main Content */}
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
                  <p className="text-muted-foreground text-sm">Email Address</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-muted p-2">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{client.phone}</p>
                  <p className="text-muted-foreground text-sm">Phone Number</p>
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
                  <p className="font-medium">{client.accountManager}</p>
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
                    Join Date
                  </p>
                  <p className="font-medium">{formatDate(client.joinDate)}</p>
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

        {/* Tax & Compliance Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tax & Compliance Overview
            </CardTitle>
            <CardDescription>
              Current tax filing status and compliance information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Tax Year
                  </p>
                  <p className="font-bold text-lg">{client.taxYear}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Filing Status
                  </p>
                  <div className="mt-1">
                    {getFilingBadge(client.filingStatus)}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Next Deadline
                  </p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <p className="font-medium">
                      {formatDate(client.nextDeadline)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Documents
                  </p>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <p className="font-bold text-lg">{client.documents}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Compliance Score
                  </p>
                  <div className="space-y-2">
                    <p
                      className={`font-bold text-2xl ${getComplianceColor(client.complianceScore)}`}
                    >
                      {client.complianceScore}%
                    </p>
                    <Progress
                      className="h-3"
                      indicatorClassName={getProgressColor(
                        client.complianceScore
                      )}
                      value={client.complianceScore}
                    />
                    <p className="text-muted-foreground text-xs">
                      {client.complianceScore >= 90
                        ? "Excellent"
                        : client.complianceScore >= 80
                          ? "Good"
                          : "Needs Attention"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
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
              <Button
                className="justify-start"
                onClick={() => navigate({ to: `/clients/${id}/documents` })}
                variant="outline"
              >
                <FileText className="mr-2 h-4 w-4" />
                View Documents
              </Button>
              <Button className="justify-start" variant="outline">
                <DollarSign className="mr-2 h-4 w-4" />
                Tax Calculations
              </Button>
              <Button className="justify-start" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Meeting
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
