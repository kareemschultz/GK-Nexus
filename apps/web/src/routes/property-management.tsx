import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Building,
  DollarSign,
  FileText,
  MoreHorizontal,
  Plus,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export const Route = createFileRoute("/property-management")({
  component: PropertyManagementPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

type Property = {
  id: string;
  propertyCode: string;
  name: string;
  propertyType: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";
  address: string;
  monthlyRent: number;
  tenantName?: string;
};

type Tenant = {
  id: string;
  tenantCode: string;
  name: string;
  email: string;
  phone: string;
  propertyName: string;
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  leaseEnd: string;
};

const mockProperties: Property[] = [
  {
    id: "1",
    propertyCode: "PROP-2024-001",
    name: "Sunrise Apartments Unit 4A",
    propertyType: "RESIDENTIAL",
    status: "OCCUPIED",
    address: "45 Main Street, Georgetown",
    monthlyRent: 150_000,
    tenantName: "John Smith",
  },
  {
    id: "2",
    propertyCode: "PROP-2024-002",
    name: "Commercial Plaza Suite 12",
    propertyType: "COMMERCIAL",
    status: "AVAILABLE",
    address: "78 Regent Street, Georgetown",
    monthlyRent: 350_000,
  },
  {
    id: "3",
    propertyCode: "PROP-2024-003",
    name: "Industrial Warehouse B",
    propertyType: "INDUSTRIAL",
    status: "MAINTENANCE",
    address: "Industrial Site, Ruimveldt",
    monthlyRent: 500_000,
  },
  {
    id: "4",
    propertyCode: "PROP-2024-004",
    name: "Ocean View Condo 7B",
    propertyType: "RESIDENTIAL",
    status: "OCCUPIED",
    address: "12 Seawall Road, Georgetown",
    monthlyRent: 200_000,
    tenantName: "Sarah Johnson",
  },
];

const mockTenants: Tenant[] = [
  {
    id: "1",
    tenantCode: "TEN-2024-001",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+592 600-1234",
    propertyName: "Sunrise Apartments Unit 4A",
    status: "ACTIVE",
    leaseEnd: "2025-06-30",
  },
  {
    id: "2",
    tenantCode: "TEN-2024-002",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+592 600-5678",
    propertyName: "Ocean View Condo 7B",
    status: "ACTIVE",
    leaseEnd: "2025-12-31",
  },
  {
    id: "3",
    tenantCode: "TEN-2024-003",
    name: "Tech Solutions Ltd",
    email: "info@techsol.gy",
    phone: "+592 600-9012",
    propertyName: "Commercial Plaza Suite 12",
    status: "PENDING",
    leaseEnd: "2026-01-15",
  },
];

function PropertyManagementPage() {
  const [activeTab, setActiveTab] = useState("properties");

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      AVAILABLE: "default",
      OCCUPIED: "secondary",
      MAINTENANCE: "destructive",
      RESERVED: "outline",
      ACTIVE: "default",
      INACTIVE: "secondary",
      PENDING: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
    }).format(amount);

  const totalProperties = mockProperties.length;
  const totalTenants = mockTenants.filter((t) => t.status === "ACTIVE").length;
  const activeLeases = mockProperties.filter(
    (p) => p.status === "OCCUPIED"
  ).length;
  const monthlyRevenue = mockProperties
    .filter((p) => p.status === "OCCUPIED")
    .reduce((sum, p) => sum + p.monthlyRent, 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Property Management
            </h1>
            <p className="text-muted-foreground">
              Manage properties, tenants, leases, and maintenance requests.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Properties
                </p>
                <p className="font-bold text-2xl">{totalProperties}</p>
              </div>
              <Building className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Tenants
                </p>
                <p className="font-bold text-2xl">{totalTenants}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Active Leases
                </p>
                <p className="font-bold text-2xl">{activeLeases}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Monthly Revenue
                </p>
                <p className="font-bold text-2xl">
                  {formatCurrency(monthlyRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Property Portfolio</CardTitle>
          <CardDescription>
            View and manage all properties, tenants, and related activities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="properties">
                <Building className="mr-2 h-4 w-4" />
                Properties
              </TabsTrigger>
              <TabsTrigger value="tenants">
                <Users className="mr-2 h-4 w-4" />
                Tenants
              </TabsTrigger>
              <TabsTrigger value="leases">
                <FileText className="mr-2 h-4 w-4" />
                Leases
              </TabsTrigger>
              <TabsTrigger value="maintenance">
                <Wrench className="mr-2 h-4 w-4" />
                Maintenance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="properties">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProperties.map((property) => (
                    <TableRow key={property.id}>
                      <TableCell className="font-medium">
                        {property.propertyCode}
                      </TableCell>
                      <TableCell>{property.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{property.propertyType}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(property.status)}</TableCell>
                      <TableCell>{property.address}</TableCell>
                      <TableCell>
                        {formatCurrency(property.monthlyRent)}
                      </TableCell>
                      <TableCell>{property.tenantName || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Property</DropdownMenuItem>
                            <DropdownMenuItem>View Lease</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="tenants">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Lease End</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell className="font-medium">
                        {tenant.tenantCode}
                      </TableCell>
                      <TableCell>{tenant.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{tenant.email}</div>
                          <div className="text-muted-foreground">
                            {tenant.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{tenant.propertyName}</TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>{tenant.leaseEnd}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Tenant</DropdownMenuItem>
                            <DropdownMenuItem>Payment History</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="leases">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Lease Management</h3>
                <p className="text-muted-foreground">
                  View and manage all property lease agreements.
                </p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Lease
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="maintenance">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Wrench className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Maintenance Requests</h3>
                <p className="text-muted-foreground">
                  Track and manage property maintenance and repairs.
                </p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
