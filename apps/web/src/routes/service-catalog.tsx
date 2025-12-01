import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Briefcase,
  Clock,
  DollarSign,
  FolderOpen,
  MoreHorizontal,
  Package,
  Plus,
  Target,
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
import { Progress } from "@/components/ui/progress";
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

export const Route = createFileRoute("/service-catalog")({
  component: ServiceCatalogPage,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
});

type Service = {
  id: string;
  serviceCode: string;
  name: string;
  category: string;
  businessEntity: "GREEN_CRESCENT" | "KAJ_FINANCIAL" | "BOTH";
  basePrice: number;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  deliveryDays: number;
  popularity: number;
};

type Project = {
  id: string;
  projectCode: string;
  clientName: string;
  serviceName: string;
  status: "PLANNING" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
  progress: number;
  startDate: string;
  dueDate: string;
  value: number;
  assignedTo: string;
};

type ServicePackage = {
  id: string;
  packageCode: string;
  name: string;
  description: string;
  includedServices: number;
  price: number;
  discount: number;
  status: "ACTIVE" | "INACTIVE";
  salesCount: number;
};

const mockServices: Service[] = [
  {
    id: "1",
    serviceCode: "SVC-TAX-001",
    name: "Corporate Tax Return Filing",
    category: "TAX_RETURNS",
    businessEntity: "KAJ_FINANCIAL",
    basePrice: 250_000,
    status: "ACTIVE",
    deliveryDays: 14,
    popularity: 95,
  },
  {
    id: "2",
    serviceCode: "SVC-COM-001",
    name: "Local Content Plan Preparation",
    category: "COMPLIANCE",
    businessEntity: "GREEN_CRESCENT",
    basePrice: 500_000,
    status: "ACTIVE",
    deliveryDays: 21,
    popularity: 88,
  },
  {
    id: "3",
    serviceCode: "SVC-TRN-001",
    name: "Tax Compliance Training Workshop",
    category: "TRAINING",
    businessEntity: "BOTH",
    basePrice: 150_000,
    status: "ACTIVE",
    deliveryDays: 1,
    popularity: 72,
  },
  {
    id: "4",
    serviceCode: "SVC-CON-001",
    name: "Business Registration Consultancy",
    category: "CONSULTANCY",
    businessEntity: "GREEN_CRESCENT",
    basePrice: 180_000,
    status: "ACTIVE",
    deliveryDays: 7,
    popularity: 85,
  },
  {
    id: "5",
    serviceCode: "SVC-TAX-002",
    name: "Personal Income Tax Filing",
    category: "TAX_RETURNS",
    businessEntity: "KAJ_FINANCIAL",
    basePrice: 75_000,
    status: "ACTIVE",
    deliveryDays: 7,
    popularity: 90,
  },
  {
    id: "6",
    serviceCode: "SVC-IMM-001",
    name: "Work Permit Application",
    category: "IMMIGRATION",
    businessEntity: "GREEN_CRESCENT",
    basePrice: 350_000,
    status: "DRAFT",
    deliveryDays: 30,
    popularity: 0,
  },
];

const mockProjects: Project[] = [
  {
    id: "1",
    projectCode: "PRJ-2024-001",
    clientName: "Guyana Mining Corp",
    serviceName: "Local Content Plan Preparation",
    status: "IN_PROGRESS",
    progress: 65,
    startDate: "2024-11-01",
    dueDate: "2024-12-15",
    value: 500_000,
    assignedTo: "Sarah Williams",
  },
  {
    id: "2",
    projectCode: "PRJ-2024-002",
    clientName: "Atlantic Trading Ltd",
    serviceName: "Corporate Tax Return Filing",
    status: "IN_PROGRESS",
    progress: 40,
    startDate: "2024-11-15",
    dueDate: "2024-12-30",
    value: 250_000,
    assignedTo: "Michael Brown",
  },
  {
    id: "3",
    projectCode: "PRJ-2024-003",
    clientName: "Green Energy Guyana",
    serviceName: "Business Registration Consultancy",
    status: "COMPLETED",
    progress: 100,
    startDate: "2024-10-01",
    dueDate: "2024-10-15",
    value: 180_000,
    assignedTo: "James Singh",
  },
  {
    id: "4",
    projectCode: "PRJ-2024-004",
    clientName: "Demerara Timber Inc",
    serviceName: "Tax Compliance Training Workshop",
    status: "PLANNING",
    progress: 10,
    startDate: "2024-12-01",
    dueDate: "2024-12-02",
    value: 150_000,
    assignedTo: "Patricia Torres",
  },
  {
    id: "5",
    projectCode: "PRJ-2024-005",
    clientName: "Berbice Sugar Ltd",
    serviceName: "Corporate Tax Return Filing",
    status: "ON_HOLD",
    progress: 25,
    startDate: "2024-10-15",
    dueDate: "2024-11-30",
    value: 250_000,
    assignedTo: "Michael Brown",
  },
];

const mockPackages: ServicePackage[] = [
  {
    id: "1",
    packageCode: "PKG-001",
    name: "Business Starter Bundle",
    description: "Registration + Tax Setup + Compliance Review",
    includedServices: 3,
    price: 400_000,
    discount: 15,
    status: "ACTIVE",
    salesCount: 28,
  },
  {
    id: "2",
    packageCode: "PKG-002",
    name: "Oil & Gas Compliance Package",
    description: "Local Content + Environmental + Tax Compliance",
    includedServices: 5,
    price: 1_200_000,
    discount: 20,
    status: "ACTIVE",
    salesCount: 12,
  },
  {
    id: "3",
    packageCode: "PKG-003",
    name: "Annual Tax Package",
    description: "Corporate + Personal + VAT Filing",
    includedServices: 3,
    price: 450_000,
    discount: 10,
    status: "ACTIVE",
    salesCount: 45,
  },
  {
    id: "4",
    packageCode: "PKG-004",
    name: "Immigration Complete",
    description: "Work Permit + Visa + Compliance",
    includedServices: 4,
    price: 800_000,
    discount: 12,
    status: "INACTIVE",
    salesCount: 8,
  },
];

function ServiceCatalogPage() {
  const [activeTab, setActiveTab] = useState("services");

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      DRAFT: "outline",
      PLANNING: "outline",
      IN_PROGRESS: "default",
      ON_HOLD: "secondary",
      COMPLETED: "secondary",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      TAX_RETURNS: "bg-blue-100 text-blue-800",
      COMPLIANCE: "bg-green-100 text-green-800",
      TRAINING: "bg-purple-100 text-purple-800",
      CONSULTANCY: "bg-orange-100 text-orange-800",
      IMMIGRATION: "bg-cyan-100 text-cyan-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[category] || "bg-gray-100 text-gray-800"}`}
      >
        {category.replace("_", " ")}
      </span>
    );
  };

  const getEntityBadge = (entity: string) => {
    const labels: Record<string, string> = {
      GREEN_CRESCENT: "GC",
      KAJ_FINANCIAL: "KAJ",
      BOTH: "Both",
    };
    const colors: Record<string, string> = {
      GREEN_CRESCENT: "bg-emerald-100 text-emerald-800",
      KAJ_FINANCIAL: "bg-indigo-100 text-indigo-800",
      BOTH: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[entity]}`}
      >
        {labels[entity]}
      </span>
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
    }).format(amount);

  const totalServices = mockServices.filter(
    (s) => s.status === "ACTIVE"
  ).length;
  const activeProjects = mockProjects.filter(
    (p) => p.status === "IN_PROGRESS"
  ).length;
  const activePackages = mockPackages.filter(
    (p) => p.status === "ACTIVE"
  ).length;
  const projectValue = mockProjects
    .filter((p) => p.status === "IN_PROGRESS")
    .reduce((sum, p) => sum + p.value, 0);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Service Catalog
            </h1>
            <p className="text-muted-foreground">
              Manage service offerings, client projects, and service packages.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Active Services
                </p>
                <p className="font-bold text-2xl">{totalServices}</p>
              </div>
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Active Projects
                </p>
                <p className="font-bold text-2xl">{activeProjects}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Service Packages
                </p>
                <p className="font-bold text-2xl">{activePackages}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Project Value
                </p>
                <p className="font-bold text-2xl">
                  {formatCurrency(projectValue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Service Management</CardTitle>
          <CardDescription>
            Manage all services, track client projects, and configure service
            packages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs onValueChange={setActiveTab} value={activeTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="services">
                <Briefcase className="mr-2 h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="projects">
                <FolderOpen className="mr-2 h-4 w-4" />
                Projects
              </TabsTrigger>
              <TabsTrigger value="packages">
                <Package className="mr-2 h-4 w-4" />
                Packages
              </TabsTrigger>
              <TabsTrigger value="timetracking">
                <Clock className="mr-2 h-4 w-4" />
                Time Tracking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="services">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Base Price</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Popularity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">
                        {service.serviceCode}
                      </TableCell>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>
                        {getCategoryBadge(service.category)}
                      </TableCell>
                      <TableCell>
                        {getEntityBadge(service.businessEntity)}
                      </TableCell>
                      <TableCell>{formatCurrency(service.basePrice)}</TableCell>
                      <TableCell>{service.deliveryDays} days</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            className="w-16"
                            value={service.popularity}
                          />
                          <span className="text-sm">{service.popularity}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(service.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Service</DropdownMenuItem>
                            <DropdownMenuItem>Create Project</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="projects">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Code</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.projectCode}
                      </TableCell>
                      <TableCell>{project.clientName}</TableCell>
                      <TableCell>{project.serviceName}</TableCell>
                      <TableCell>{getStatusBadge(project.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress className="w-16" value={project.progress} />
                          <span className="text-sm">{project.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{project.dueDate}</TableCell>
                      <TableCell>{formatCurrency(project.value)}</TableCell>
                      <TableCell>{project.assignedTo}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Project</DropdownMenuItem>
                            <DropdownMenuItem>Update Progress</DropdownMenuItem>
                            <DropdownMenuItem>Log Time</DropdownMenuItem>
                            <DropdownMenuItem>View Milestones</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="packages">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPackages.map((pkg) => (
                    <TableRow key={pkg.id}>
                      <TableCell className="font-medium">
                        {pkg.packageCode}
                      </TableCell>
                      <TableCell>{pkg.name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {pkg.description}
                      </TableCell>
                      <TableCell>{pkg.includedServices}</TableCell>
                      <TableCell>{formatCurrency(pkg.price)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{pkg.discount}% OFF</Badge>
                      </TableCell>
                      <TableCell>{pkg.salesCount}</TableCell>
                      <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Package</DropdownMenuItem>
                            <DropdownMenuItem>Edit Package</DropdownMenuItem>
                            <DropdownMenuItem>Create Proposal</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="timetracking">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="font-semibold text-lg">Time Tracking</h3>
                <p className="text-muted-foreground">
                  Track time entries and billable hours across all projects.
                </p>
                <Button className="mt-4" variant="outline">
                  View Time Entries
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
