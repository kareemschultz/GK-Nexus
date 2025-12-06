import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  Building,
  DollarSign,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Users,
  Wrench,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

function PropertyManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("properties");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddPropertyDialog, setShowAddPropertyDialog] = useState(false);

  // API Queries
  const propertiesQuery = useQuery({
    queryKey: [
      "properties",
      {
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : undefined,
      },
    ],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.propertyManagementPropertiesList({
        search: searchTerm || undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as
                | "AVAILABLE"
                | "OCCUPIED"
                | "UNDER_MAINTENANCE"
                | "PENDING_LEASE"
                | "SOLD"
                | "INACTIVE")
            : undefined,
        page: 1,
        limit: 50,
      });
    },
  });

  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.propertyManagementTenantsList({
        page: 1,
        limit: 50,
      });
    },
  });

  const statsQuery = useQuery({
    queryKey: ["propertyStats"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.propertyManagementPropertiesStats({});
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      propertyType:
        | "RESIDENTIAL"
        | "COMMERCIAL"
        | "INDUSTRIAL"
        | "LAND"
        | "MIXED_USE"
        | "AGRICULTURAL";
      addressLine1: string;
      city: string;
      region: string;
      monthlyRent?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.propertyManagementPropertiesCreate(data);
    },
    onSuccess: () => {
      toast.success("Property created successfully");
      setShowAddPropertyDialog(false);
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["propertyStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to create property: ${error.message}`);
    },
  });

  const properties = propertiesQuery.data?.data?.items || [];
  const tenants = tenantsQuery.data?.data?.items || [];
  const rawStats = statsQuery.data?.data;

  const stats = rawStats
    ? {
        totalProperties: rawStats.total,
        activeTenants: tenants.length,
        occupiedProperties:
          rawStats.byStatus.find(
            (s: { status: string }) => s.status === "OCCUPIED"
          )?.count || 0,
        monthlyRevenue: properties.reduce(
          (sum: number, p: { monthlyRent: string | null }) =>
            sum + (p.monthlyRent ? Number(p.monthlyRent) : 0),
          0
        ),
      }
    : undefined;

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

  // Loading skeleton
  const TableSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton className="h-12 w-full" key={`skeleton-${i}`} />
      ))}
    </div>
  );

  // Error display
  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
      <h3 className="font-semibold text-lg">Error Loading Data</h3>
      <p className="text-muted-foreground">{message}</p>
      <Button
        className="mt-4"
        onClick={() => {
          propertiesQuery.refetch();
          tenantsQuery.refetch();
          statsQuery.refetch();
        }}
        variant="outline"
      >
        Try Again
      </Button>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl tracking-tight">
                Property Management
              </h1>
              <p className="text-muted-foreground">
                Manage properties, tenants, leases, and maintenance requests for
                your real estate portfolio.
              </p>
            </div>
            <Dialog
              onOpenChange={setShowAddPropertyDialog}
              open={showAddPropertyDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Add New Property</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new property. All fields marked
                    with * are required.
                  </DialogDescription>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    createPropertyMutation.mutate({
                      name: formData.get("name") as string,
                      propertyType: formData.get("propertyType") as
                        | "RESIDENTIAL"
                        | "COMMERCIAL"
                        | "INDUSTRIAL"
                        | "LAND"
                        | "MIXED_USE"
                        | "AGRICULTURAL",
                      addressLine1: formData.get("address") as string,
                      city: formData.get("city") as string,
                      region: formData.get("region") as string,
                      monthlyRent: formData.get("rent")
                        ? (formData.get("rent") as string)
                        : undefined,
                    });
                  }}
                >
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Property Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Sunrise Apartments Unit 4A"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="propertyType">Property Type *</Label>
                      <Select defaultValue="RESIDENTIAL" name="propertyType">
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RESIDENTIAL">
                            Residential
                          </SelectItem>
                          <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                          <SelectItem value="INDUSTRIAL">Industrial</SelectItem>
                          <SelectItem value="LAND">Land</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Street address"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          placeholder="Georgetown"
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="region">Region *</Label>
                        <Input
                          id="region"
                          name="region"
                          placeholder="Demerara-Mahaica"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="rent">Monthly Rent (GYD)</Label>
                      <Input
                        id="rent"
                        min="0"
                        name="rent"
                        placeholder="150000"
                        type="number"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setShowAddPropertyDialog(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={createPropertyMutation.isPending}
                      type="submit"
                    >
                      {createPropertyMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Create Property
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Properties
                  </p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">
                      {stats?.totalProperties || 0}
                    </p>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Building className="h-8 w-8 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Total number of properties in your portfolio
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Active Tenants
                  </p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">
                      {stats?.activeTenants || 0}
                    </p>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Users className="h-8 w-8 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Number of tenants with active leases
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Occupied Units
                  </p>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">
                      {stats?.occupiedProperties || 0}
                    </p>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <FileText className="h-8 w-8 text-green-500" />
                  </TooltipTrigger>
                  <TooltipContent>Properties currently occupied</TooltipContent>
                </Tooltip>
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
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-24" />
                  ) : (
                    <p className="font-bold text-2xl">
                      {formatCurrency(stats?.monthlyRevenue || 0)}
                    </p>
                  )}
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <DollarSign className="h-8 w-8 text-yellow-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Total expected monthly rental income
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Property Portfolio</CardTitle>
            <CardDescription>
              View and manage all properties, tenants, and related activities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs onValueChange={setActiveTab} value={activeTab}>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
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

                {/* Search and Filters */}
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="w-[200px] pl-9"
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      value={searchTerm}
                    />
                  </div>
                  <Select onValueChange={setStatusFilter} value={statusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="AVAILABLE">Available</SelectItem>
                      <SelectItem value="OCCUPIED">Occupied</SelectItem>
                      <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                      <SelectItem value="RESERVED">Reserved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="properties">
                {propertiesQuery.isError ? (
                  <ErrorDisplay message={propertiesQuery.error.message} />
                ) : propertiesQuery.isLoading ? (
                  <TableSkeleton />
                ) : properties.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">
                      No Properties Found
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "Get started by adding your first property"}
                    </p>
                    {!searchTerm && statusFilter === "all" && (
                      <Button
                        className="mt-4"
                        onClick={() => setShowAddPropertyDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Property
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Monthly Rent</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell className="font-medium">
                            {property.propertyCode}
                          </TableCell>
                          <TableCell>{property.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {property.propertyType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(property.status)}
                          </TableCell>
                          <TableCell>
                            {property.addressLine1}, {property.city}
                          </TableCell>
                          <TableCell>
                            {property.monthlyRent
                              ? formatCurrency(Number(property.monthlyRent))
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Edit Property
                                </DropdownMenuItem>
                                <DropdownMenuItem>View Lease</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="tenants">
                {tenantsQuery.isError ? (
                  <ErrorDisplay message={tenantsQuery.error.message} />
                ) : tenantsQuery.isLoading ? (
                  <TableSkeleton />
                ) : tenants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="font-semibold text-lg">No Tenants Found</h3>
                    <p className="text-muted-foreground">
                      Tenants will appear here once properties are leased.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">
                            {tenant.tenantCode}
                          </TableCell>
                          <TableCell>
                            {tenant.firstName} {tenant.lastName}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{tenant.email}</div>
                              <div className="text-muted-foreground">
                                {tenant.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                tenant.isActive ? "default" : "secondary"
                              }
                            >
                              {tenant.isActive ? "ACTIVE" : "INACTIVE"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>Edit Tenant</DropdownMenuItem>
                                <DropdownMenuItem>
                                  Payment History
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                  <h3 className="font-semibold text-lg">
                    Maintenance Requests
                  </h3>
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
    </TooltipProvider>
  );
}
