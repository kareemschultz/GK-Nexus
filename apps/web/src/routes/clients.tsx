import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Edit,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/clients")({
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
};

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientDetails, setShowClientDetails] = useState(false);

  // Mock client data
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
      address: "123 Innovation Drive, Silicon Valley, CA",
      revenue: 50_000_000,
      employees: 500,
      joinDate: "2023-01-15",
      lastActivity: "2024-11-27",
      complianceScore: 98,
      documents: 24,
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
      address: "456 Analytics Blvd, Austin, TX",
      revenue: 15_000_000,
      employees: 150,
      joinDate: "2024-11-20",
      lastActivity: "2024-11-28",
      complianceScore: 85,
      documents: 8,
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
      address: "789 Sustainability St, Portland, OR",
      revenue: 75_000_000,
      employees: 800,
      joinDate: "2022-06-10",
      lastActivity: "2024-11-26",
      complianceScore: 96,
      documents: 45,
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
      address: "321 Main St, Springfield, IL",
      revenue: 2_000_000,
      employees: 25,
      joinDate: "2023-08-22",
      lastActivity: "2024-10-15",
      complianceScore: 72,
      documents: 12,
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
      address: "654 Medical Center Dr, Boston, MA",
      revenue: 25_000_000,
      employees: 300,
      joinDate: "2023-03-14",
      lastActivity: "2024-11-28",
      complianceScore: 94,
      documents: 38,
    },
  ];

  const filteredClients = mockClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.industry.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || client.status === statusFilter;
    const matchesType = typeFilter === "all" || client.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "onboarding":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "suspended":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

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

  const getComplianceColor = (score: number) => {
    if (score >= 90) {
      return "text-green-500";
    }
    if (score >= 80) {
      return "text-yellow-500";
    }
    return "text-red-500";
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
      month: "short",
      day: "numeric",
    });

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Client Management
            </h1>
            <p className="text-muted-foreground">
              Manage your client relationships and track their compliance
              status.
            </p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => navigate({ to: "/clients/new" })}
          >
            <Plus className="h-4 w-4" />
            Add New Client
          </Button>
        </div>
      </header>

      {/* Filters and Search */}
      <section aria-label="Client filters and search" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search clients by name, contact, or industry..."
                  value={searchTerm}
                />
              </div>
              <div className="flex gap-2">
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={setTypeFilter} value={typeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="mid-market">Mid-Market</SelectItem>
                    <SelectItem value="smb">SMB</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Client Overview Stats */}
      <section aria-label="Client overview statistics" className="mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Clients
                  </p>
                  <p className="font-bold text-2xl">{mockClients.length}</p>
                </div>
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Active Clients
                  </p>
                  <p className="font-bold text-2xl">
                    {mockClients.filter((c) => c.status === "active").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Revenue
                  </p>
                  <p className="font-bold text-2xl">
                    {formatCurrency(
                      mockClients.reduce((sum, c) => sum + c.revenue, 0)
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Avg Compliance
                  </p>
                  <p className="font-bold text-2xl">
                    {Math.round(
                      mockClients.reduce(
                        (sum, c) => sum + c.complianceScore,
                        0
                      ) / mockClients.length
                    )}
                    %
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Client Table */}
      <section aria-label="Client listing table">
        <Card>
          <CardHeader>
            <CardTitle>Clients ({filteredClients.length})</CardTitle>
            <CardDescription>
              Comprehensive view of all client accounts and their current
              status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow className="hover:bg-muted/50" key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {client.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {client.employees} employees
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(client.type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(client.status)}
                        {getStatusBadge(client.status)}
                      </div>
                    </TableCell>
                    <TableCell>{client.industry}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">
                          {client.contactPerson}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {client.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(client.revenue)}</TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${getComplianceColor(client.complianceScore)}`}
                      >
                        {client.complianceScore}%
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(client.lastActivity)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedClient(client);
                              setShowClientDetails(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Client
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredClients.length === 0 && (
              <div className="py-12 text-center">
                <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold text-lg">No clients found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Client Details Dialog */}
      <Dialog onOpenChange={setShowClientDetails} open={showClientDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedClient?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed information and compliance status for this client.
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="grid gap-6">
              {/* Client Overview */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {selectedClient.contactPerson}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <span>{selectedClient.address}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Business Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Industry:</span>
                      <span className="font-medium">
                        {selectedClient.industry}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      {getTypeBadge(selectedClient.type)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedClient.revenue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Employees:</span>
                      <span className="font-medium">
                        {selectedClient.employees.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Join Date:</span>
                      <span className="font-medium">
                        {formatDate(selectedClient.joinDate)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status and Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status & Compliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Current Status
                      </p>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedClient.status)}
                        {getStatusBadge(selectedClient.status)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">
                        Compliance Score
                      </p>
                      <p
                        className={`font-bold text-2xl ${getComplianceColor(selectedClient.complianceScore)}`}
                      >
                        {selectedClient.complianceScore}%
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-sm">Documents</p>
                      <p className="font-bold text-2xl">
                        {selectedClient.documents}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowClientDetails(false)}
                  variant="outline"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Client
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <Button onClick={() => navigate({ to: "/documents" })}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Documents
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
