import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  Briefcase,
  Clock,
  DollarSign,
  FolderOpen,
  HelpCircle,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Search,
  Target,
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
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// Loading skeleton component
const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton className="h-12 w-full" key={`skeleton-${i}`} />
    ))}
  </div>
);

// Error display component
const ErrorDisplay = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
    <h3 className="font-semibold text-lg">Error Loading Data</h3>
    <p className="text-muted-foreground">{message}</p>
    <Button className="mt-4" onClick={onRetry} variant="outline">
      <RefreshCw className="mr-2 h-4 w-4" />
      Try Again
    </Button>
  </div>
);

// Empty state component
const EmptyState = ({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const serviceCategories = [
  "TAX_RETURNS",
  "COMPLIANCE",
  "CONSULTANCY",
  "TRAINING",
  "IMMIGRATION",
  "ACCOUNTING",
  "PAYROLL",
  "LEGAL",
  "OTHER",
] as const;

const pricingModels = [
  "FIXED",
  "HOURLY",
  "PROJECT_BASED",
  "RETAINER",
  "SUBSCRIPTION",
] as const;

function ServiceCatalogPage() {
  const [activeTab, setActiveTab] = useState("services");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false);
  const [showAddPackageDialog, setShowAddPackageDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch services
  const servicesQuery = useQuery({
    queryKey: [
      "services",
      {
        search: searchTerm,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
      },
    ],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.serviceCatalog.servicesList({
        search: searchTerm || undefined,
        category:
          categoryFilter !== "all"
            ? (categoryFilter as (typeof serviceCategories)[number])
            : undefined,
        page: 1,
        limit: 50,
      });
    },
  });

  // Fetch projects
  const projectsQuery = useQuery({
    queryKey: ["serviceProjects"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.serviceCatalog.projectsList({
        page: 1,
        limit: 50,
      });
    },
  });

  // Fetch packages
  const packagesQuery = useQuery({
    queryKey: ["servicePackages"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.serviceCatalog.packagesList({
        page: 1,
        limit: 50,
      });
    },
  });

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: ["serviceStats"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.serviceCatalog.servicesStats();
    },
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      category: (typeof serviceCategories)[number];
      pricingModel: (typeof pricingModels)[number];
      basePrice?: string;
      estimatedDurationHours?: number;
      notes?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.serviceCatalog.servicesCreate(data);
    },
    onSuccess: () => {
      toast.success("Service created successfully");
      setShowAddServiceDialog(false);
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["serviceStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to create service: ${error.message}`);
    },
  });

  // Create package mutation
  const createPackageMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      price?: string;
      discountPercent?: string;
      validFrom?: string;
      validUntil?: string;
      notes?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.serviceCatalog.packagesCreate(data);
    },
    onSuccess: () => {
      toast.success("Package created successfully");
      setShowAddPackageDialog(false);
      queryClient.invalidateQueries({ queryKey: ["servicePackages"] });
    },
    onError: (error) => {
      toast.error(`Failed to create package: ${error.message}`);
    },
  });

  // Publish service mutation
  const publishServiceMutation = useMutation({
    mutationFn: async (id: string) => {
      const { client } = await import("@/utils/orpc");
      return client.serviceCatalog.servicesPublish({ id });
    },
    onSuccess: () => {
      toast.success("Service published successfully");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      queryClient.invalidateQueries({ queryKey: ["serviceStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to publish service: ${error.message}`);
    },
  });

  const handleCreateService = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createServiceMutation.mutate({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      category: formData.get("category") as (typeof serviceCategories)[number],
      pricingModel: formData.get(
        "pricingModel"
      ) as (typeof pricingModels)[number],
      basePrice: (formData.get("basePrice") as string) || undefined,
      estimatedDurationHours: formData.get("estimatedDurationHours")
        ? Number(formData.get("estimatedDurationHours"))
        : undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleCreatePackage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createPackageMutation.mutate({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      price: (formData.get("price") as string) || undefined,
      discountPercent: (formData.get("discountPercent") as string) || undefined,
      validFrom: (formData.get("validFrom") as string) || undefined,
      validUntil: (formData.get("validUntil") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

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
      ARCHIVED: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      TAX_RETURNS: "bg-blue-100 text-blue-800",
      COMPLIANCE: "bg-green-100 text-green-800",
      TRAINING: "bg-purple-100 text-purple-800",
      CONSULTANCY: "bg-orange-100 text-orange-800",
      IMMIGRATION: "bg-cyan-100 text-cyan-800",
      ACCOUNTING: "bg-indigo-100 text-indigo-800",
      PAYROLL: "bg-pink-100 text-pink-800",
      LEGAL: "bg-red-100 text-red-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[category] || "bg-gray-100 text-gray-800"}`}
      >
        {category.replace(/_/g, " ")}
      </span>
    );
  };

  const getPricingBadge = (model: string) => {
    const colors: Record<string, string> = {
      FIXED: "bg-blue-100 text-blue-800",
      HOURLY: "bg-green-100 text-green-800",
      PROJECT_BASED: "bg-purple-100 text-purple-800",
      RETAINER: "bg-orange-100 text-orange-800",
      SUBSCRIPTION: "bg-cyan-100 text-cyan-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[model] || "bg-gray-100 text-gray-800"}`}
      >
        {model.replace(/_/g, " ")}
      </span>
    );
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = typeof amount === "string" ? Number(amount) : amount || 0;
    return new Intl.NumberFormat("en-GY", {
      style: "currency",
      currency: "GYD",
      minimumFractionDigits: 0,
    }).format(numAmount);
  };

  const stats = statsQuery.data?.data;
  const services = servicesQuery.data?.data?.items || [];
  const projects = projectsQuery.data?.data?.items || [];
  const packages = packagesQuery.data?.data?.items || [];

  // Calculate stats from the data
  const totalActiveServices =
    stats?.byStatus?.find((s) => s.status === "ACTIVE")?.count || 0;
  const activeProjects = projects.filter(
    (p) => p.status === "IN_PROGRESS"
  ).length;
  const activePackages = packages.filter((p) => p.status === "ACTIVE").length;
  const projectValue = projects
    .filter((p) => p.status === "IN_PROGRESS")
    .reduce((sum, p) => sum + Number(p.totalValue || 0), 0);

  return (
    <TooltipProvider>
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
            <Dialog
              onOpenChange={setShowAddServiceDialog}
              open={showAddServiceDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add Service</DialogTitle>
                  <DialogDescription>
                    Add a new service to the catalog. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateService}>
                  <div className="space-y-2">
                    <Label htmlFor="name">Service Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter service name"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select defaultValue="CONSULTANCY" name="category">
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricingModel">Pricing Model</Label>
                      <Select defaultValue="FIXED" name="pricingModel">
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {pricingModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basePrice">Base Price (GYD)</Label>
                      <Input
                        id="basePrice"
                        name="basePrice"
                        placeholder="e.g., 150000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estimatedDurationHours">
                        Est. Duration (Hours)
                      </Label>
                      <Input
                        id="estimatedDurationHours"
                        min="0.5"
                        name="estimatedDurationHours"
                        placeholder="e.g., 8"
                        step="0.5"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe the service..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      placeholder="Additional notes..."
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => setShowAddServiceDialog(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={createServiceMutation.isPending}
                      type="submit"
                    >
                      {createServiceMutation.isPending
                        ? "Adding..."
                        : "Add Service"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Active Services
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Services available for clients
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{totalActiveServices}</p>
                  )}
                </div>
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Active Projects
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Projects currently in progress
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {projectsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{activeProjects}</p>
                  )}
                </div>
                <FolderOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Service Packages
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Bundled service offerings</TooltipContent>
                    </Tooltip>
                  </div>
                  {packagesQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{activePackages}</p>
                  )}
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Project Value
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Total value of active projects
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {projectsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">
                      {formatCurrency(projectValue)}
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Service Management</CardTitle>
                <CardDescription>
                  Manage all services, track client projects, and configure
                  service packages.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="w-64 pl-9"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search services..."
                    value={searchTerm}
                  />
                </div>
                <Select
                  onValueChange={setCategoryFilter}
                  value={categoryFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {serviceCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
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
                {servicesQuery.isLoading ? (
                  <TableSkeleton />
                ) : servicesQuery.isError ? (
                  <ErrorDisplay
                    message={
                      servicesQuery.error?.message || "Failed to load services"
                    }
                    onRetry={() => servicesQuery.refetch()}
                  />
                ) : services.length === 0 ? (
                  <EmptyState
                    action={
                      <Button onClick={() => setShowAddServiceDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Service
                      </Button>
                    }
                    description="Get started by adding services to your catalog."
                    title="No Services"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Pricing</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">
                            {service.serviceCode}
                          </TableCell>
                          <TableCell>{service.name}</TableCell>
                          <TableCell>
                            {getCategoryBadge(service.category)}
                          </TableCell>
                          <TableCell>
                            {getPricingBadge(service.pricingModel)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(service.basePrice)}
                          </TableCell>
                          <TableCell>
                            {service.estimatedDurationHours
                              ? `${service.estimatedDurationHours} hours`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(service.status)}
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
                                  Edit Service
                                </DropdownMenuItem>
                                {service.status === "DRAFT" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      publishServiceMutation.mutate(service.id)
                                    }
                                  >
                                    Publish Service
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  Create Project
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

              <TabsContent value="projects">
                {projectsQuery.isLoading ? (
                  <TableSkeleton />
                ) : projectsQuery.isError ? (
                  <ErrorDisplay
                    message={
                      projectsQuery.error?.message || "Failed to load projects"
                    }
                    onRetry={() => projectsQuery.refetch()}
                  />
                ) : projects.length === 0 ? (
                  <EmptyState
                    description="No projects created yet."
                    title="No Projects"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">
                            {project.projectCode}
                          </TableCell>
                          <TableCell>{project.name}</TableCell>
                          <TableCell>{project.clientId || "N/A"}</TableCell>
                          <TableCell>
                            {getStatusBadge(project.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                className="w-16"
                                value={Number(project.progressPercent || 0)}
                              />
                              <span className="text-sm">
                                {project.progressPercent || 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {project.dueDate
                              ? new Date(project.dueDate).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(project.totalValue)}
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
                                  View Project
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Update Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem>Log Time</DropdownMenuItem>
                                <DropdownMenuItem>
                                  View Milestones
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

              <TabsContent value="packages">
                <div className="mb-4 flex justify-end">
                  <Dialog
                    onOpenChange={setShowAddPackageDialog}
                    open={showAddPackageDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Package
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Service Package</DialogTitle>
                        <DialogDescription>
                          Create a bundle of services with special pricing.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        className="space-y-4"
                        onSubmit={handleCreatePackage}
                      >
                        <div className="space-y-2">
                          <Label htmlFor="pkg-name">Package Name</Label>
                          <Input
                            id="pkg-name"
                            name="name"
                            placeholder="e.g., Business Starter Bundle"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="price">Price (GYD)</Label>
                            <Input
                              id="price"
                              name="price"
                              placeholder="e.g., 400000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="discountPercent">
                              Discount (%)
                            </Label>
                            <Input
                              id="discountPercent"
                              max="100"
                              min="0"
                              name="discountPercent"
                              placeholder="e.g., 15"
                              type="number"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="validFrom">Valid From</Label>
                            <Input
                              id="validFrom"
                              name="validFrom"
                              type="date"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="validUntil">Valid Until</Label>
                            <Input
                              id="validUntil"
                              name="validUntil"
                              type="date"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="pkg-description">Description</Label>
                          <Textarea
                            id="pkg-description"
                            name="description"
                            placeholder="Describe the package..."
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => setShowAddPackageDialog(false)}
                            type="button"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={createPackageMutation.isPending}
                            type="submit"
                          >
                            {createPackageMutation.isPending
                              ? "Creating..."
                              : "Create Package"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                {packagesQuery.isLoading ? (
                  <TableSkeleton />
                ) : packagesQuery.isError ? (
                  <ErrorDisplay
                    message={
                      packagesQuery.error?.message || "Failed to load packages"
                    }
                    onRetry={() => packagesQuery.refetch()}
                  />
                ) : packages.length === 0 ? (
                  <EmptyState
                    action={
                      <Button onClick={() => setShowAddPackageDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Package
                      </Button>
                    }
                    description="Bundle services together with special pricing."
                    title="No Packages"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Package Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">
                            {pkg.packageCode}
                          </TableCell>
                          <TableCell>{pkg.name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {pkg.description || "N/A"}
                          </TableCell>
                          <TableCell>{formatCurrency(pkg.price)}</TableCell>
                          <TableCell>
                            {pkg.discountPercent ? (
                              <Badge variant="outline">
                                {pkg.discountPercent}% OFF
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(pkg.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  View Package
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Edit Package
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Create Proposal
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
    </TooltipProvider>
  );
}
