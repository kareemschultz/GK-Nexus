import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HelpCircle,
  MoreHorizontal,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Users,
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
import { queryClient } from "@/utils/orpc";

export const Route = createFileRoute("/local-content")({
  component: LocalContentPage,
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
    <ClipboardCheck className="mb-4 h-12 w-12 text-muted-foreground" />
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const industrySectors = [
  "OIL_GAS",
  "MINING",
  "CONSTRUCTION",
  "MANUFACTURING",
  "AGRICULTURE",
  "SERVICES",
  "TECHNOLOGY",
  "LOGISTICS",
  "MARITIME",
  "OTHER",
] as const;

const supplierCategories = [
  "TIER_1",
  "TIER_2",
  "TIER_3",
  "LOCAL_PREFERRED",
  "EMERGING",
] as const;

function LocalContentPage() {
  const [activeTab, setActiveTab] = useState("plans");
  const [searchTerm, setSearchTerm] = useState("");
  const [sectorFilter, setSectorFilter] = useState<string>("all");
  const [showNewPlanDialog, setShowNewPlanDialog] = useState(false);
  const [showNewSupplierDialog, setShowNewSupplierDialog] = useState(false);

  // Fetch plans
  const plansQuery = useQuery({
    queryKey: ["localContent", "plans"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.localContent.plans.list({
        page: 1,
        limit: 50,
      });
    },
  });

  // Fetch suppliers
  const suppliersQuery = useQuery({
    queryKey: ["localContent", "vendors"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.localContent.vendors.list({});
    },
  });

  // Fetch reports
  const reportsQuery = useQuery({
    queryKey: ["localContent", "reports"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.localContent.reports.list({
        page: 1,
        limit: 50,
      });
    },
  });

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: ["localContent", "stats"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.localContent.registrations.stats({});
    },
  });

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: {
      registrationId: string;
      planYear: number;
      planTitle: string;
      planDescription?: string;
      employmentTargets?: { targetPercent?: string };
      procurementTargets?: { targetPercent?: string };
      trainingTargets?: { totalTrainingHours?: number };
      notes?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.localContent.plans.create({
        registrationId: data.registrationId,
        planYear: data.planYear,
        planTitle: data.planTitle,
        planDescription: data.planDescription,
        employmentTargets: data.employmentTargets,
        procurementTargets: data.procurementTargets,
        trainingTargets: data.trainingTargets,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast.success("Local content plan created successfully");
      setShowNewPlanDialog(false);
      queryClient.invalidateQueries({ queryKey: ["localContent", "plans"] });
      queryClient.invalidateQueries({ queryKey: ["localContent", "stats"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create plan: ${error.message}`);
    },
  });

  // Create supplier mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (data: {
      vendorName: string;
      vendorType: string;
      tradingName?: string;
      email?: string;
      phone?: string;
      notes?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.localContent.vendors.create({
        vendorName: data.vendorName,
        vendorType: data.vendorType,
        tradingName: data.tradingName,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast.success("Supplier registered successfully");
      setShowNewSupplierDialog(false);
      queryClient.invalidateQueries({ queryKey: ["localContent", "vendors"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to register supplier: ${error.message}`);
    },
  });

  const handleCreatePlan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const employmentTargetPercent = formData.get(
      "employmentTargetPercent"
    ) as string;
    const procurementTargetPercent = formData.get(
      "procurementTargetPercent"
    ) as string;
    const trainingTargetHours = formData.get("trainingTargetHours") as string;

    createPlanMutation.mutate({
      registrationId: formData.get("companyId") as string,
      planYear: Number(formData.get("planYear")),
      planTitle: `${formData.get("planYear")} Local Content Plan`,
      employmentTargets: employmentTargetPercent
        ? {
            targetPercent: employmentTargetPercent,
          }
        : undefined,
      procurementTargets: procurementTargetPercent
        ? {
            targetPercent: procurementTargetPercent,
          }
        : undefined,
      trainingTargets: trainingTargetHours
        ? {
            totalTrainingHours: Number(trainingTargetHours),
          }
        : undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleCreateSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createSupplierMutation.mutate({
      vendorName: formData.get("companyName") as string,
      tradingName: (formData.get("tradeName") as string) || undefined,
      vendorType: formData.get("industrySector") as string,
      email: (formData.get("contactEmail") as string) || undefined,
      phone: (formData.get("contactPhone") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      DRAFT: "outline",
      SUBMITTED: "secondary",
      UNDER_REVIEW: "outline",
      APPROVED: "default",
      REJECTED: "destructive",
      EXPIRED: "destructive",
      ACTIVE: "default",
      SUSPENDED: "destructive",
      PENDING: "outline",
      CERTIFIED: "default",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getSectorBadge = (sector: string) => {
    const colors: Record<string, string> = {
      OIL_GAS: "bg-blue-100 text-blue-800",
      MINING: "bg-yellow-100 text-yellow-800",
      CONSTRUCTION: "bg-orange-100 text-orange-800",
      MANUFACTURING: "bg-purple-100 text-purple-800",
      AGRICULTURE: "bg-green-100 text-green-800",
      SERVICES: "bg-pink-100 text-pink-800",
      TECHNOLOGY: "bg-cyan-100 text-cyan-800",
      LOGISTICS: "bg-indigo-100 text-indigo-800",
      MARITIME: "bg-teal-100 text-teal-800",
      OTHER: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[sector] || "bg-gray-100 text-gray-800"}`}
      >
        {sector.replace(/_/g, " ")}
      </span>
    );
  };

  const stats = statsQuery.data?.data;
  const plans = plansQuery.data?.data?.items || [];
  const suppliers = suppliersQuery.data?.data || [];
  const reports = reportsQuery.data?.data?.items || [];

  const totalPlans = stats?.total || 0;
  const approvedPlans =
    stats?.byStatus?.find(
      (s: { complianceStatus: string; count: number }) =>
        s.complianceStatus === "COMPLIANT"
    )?.count || 0;
  const certifiedSuppliers = suppliers.filter(
    (s: { isActive: boolean }) => s.isActive
  ).length;
  const avgComplianceScore = 0;

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl tracking-tight">
                Local Content Compliance
              </h1>
              <p className="text-muted-foreground">
                Manage Local Content Act compliance, supplier registration, and
                reporting.
              </p>
            </div>
            <Dialog
              onOpenChange={setShowNewPlanDialog}
              open={showNewPlanDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Local Content Plan</DialogTitle>
                  <DialogDescription>
                    Create a new local content compliance plan. Fill in the
                    details below.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreatePlan}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyId">Company ID</Label>
                      <Input
                        id="companyId"
                        name="companyId"
                        placeholder="Enter company ID"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="planYear">Plan Year</Label>
                      <Input
                        defaultValue={new Date().getFullYear()}
                        id="planYear"
                        name="planYear"
                        required
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industrySector">Industry Sector</Label>
                    <Select defaultValue="OIL_GAS" name="industrySector">
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {industrySectors.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentTargetPercent">
                        Employment Target (%)
                      </Label>
                      <Input
                        id="employmentTargetPercent"
                        max="100"
                        min="0"
                        name="employmentTargetPercent"
                        placeholder="e.g., 75"
                        type="number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="procurementTargetPercent">
                        Procurement Target (%)
                      </Label>
                      <Input
                        id="procurementTargetPercent"
                        max="100"
                        min="0"
                        name="procurementTargetPercent"
                        placeholder="e.g., 50"
                        type="number"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trainingTargetHours">
                      Training Target (Hours)
                    </Label>
                    <Input
                      id="trainingTargetHours"
                      min="0"
                      name="trainingTargetHours"
                      placeholder="e.g., 1000"
                      type="number"
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
                      onClick={() => setShowNewPlanDialog(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={createPlanMutation.isPending}
                      type="submit"
                    >
                      {createPlanMutation.isPending
                        ? "Creating..."
                        : "Create Plan"}
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
                      Total Plans
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Total local content plans in the system
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{totalPlans}</p>
                  )}
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Approved Plans
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Plans that have been approved by regulators
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{approvedPlans}</p>
                  )}
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Active Suppliers
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Registered local suppliers with active status
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {suppliersQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{certifiedSuppliers}</p>
                  )}
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Avg. Compliance
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Average compliance score across all plans
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">
                      {avgComplianceScore.toFixed(0)}%
                    </p>
                  )}
                </div>
                <Percent className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Local Content Dashboard</CardTitle>
                <CardDescription>
                  Manage local content plans, supplier registrations, and
                  compliance reports.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="w-64 pl-9"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search plans..."
                    value={searchTerm}
                  />
                </div>
                <Select onValueChange={setSectorFilter} value={sectorFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {industrySectors.map((sector) => (
                      <SelectItem key={sector} value={sector}>
                        {sector.replace(/_/g, " ")}
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
                <TabsTrigger value="plans">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Content Plans
                </TabsTrigger>
                <TabsTrigger value="suppliers">
                  <Building2 className="mr-2 h-4 w-4" />
                  Suppliers
                </TabsTrigger>
                <TabsTrigger value="reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports
                </TabsTrigger>
                <TabsTrigger value="workforce">
                  <Users className="mr-2 h-4 w-4" />
                  Workforce
                </TabsTrigger>
              </TabsList>

              <TabsContent value="plans">
                {plansQuery.isLoading ? (
                  <TableSkeleton />
                ) : plansQuery.isError ? (
                  <ErrorDisplay
                    message={
                      plansQuery.error?.message || "Failed to load plans"
                    }
                    onRetry={() => plansQuery.refetch()}
                  />
                ) : plans.length === 0 ? (
                  <EmptyState
                    action={
                      <Button onClick={() => setShowNewPlanDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Plan
                      </Button>
                    }
                    description="Get started by creating your first local content plan."
                    title="No Local Content Plans"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plan Code</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Employment</TableHead>
                        <TableHead>Procurement</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">
                            {plan.planNumber}
                          </TableCell>
                          <TableCell>{plan.clientId}</TableCell>
                          <TableCell>
                            <Badge variant="outline">General</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(plan.periodStart).getFullYear()}
                          </TableCell>
                          <TableCell>{getStatusBadge(plan.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                className="w-16"
                                value={Number(plan.employmentTarget || 0)}
                              />
                              <span className="text-sm">
                                {plan.employmentTarget || 0}/
                                {plan.employmentTarget || 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress className="w-16" value={0} />
                              <span className="text-sm">0/0%</span>
                            </div>
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
                                <DropdownMenuItem>Edit Plan</DropdownMenuItem>
                                <DropdownMenuItem>
                                  Submit Report
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

              <TabsContent value="suppliers">
                <div className="mb-4 flex justify-end">
                  <Dialog
                    onOpenChange={setShowNewSupplierDialog}
                    open={showNewSupplierDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Register Supplier
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Register Local Supplier</DialogTitle>
                        <DialogDescription>
                          Register a new local supplier in the system.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        className="space-y-4"
                        onSubmit={handleCreateSupplier}
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name</Label>
                            <Input
                              id="companyName"
                              name="companyName"
                              placeholder="Legal company name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tradeName">Trade Name</Label>
                            <Input
                              id="tradeName"
                              name="tradeName"
                              placeholder="Doing business as"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="supplierSector">
                              Industry Sector
                            </Label>
                            <Select
                              defaultValue="SERVICES"
                              name="industrySector"
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select sector" />
                              </SelectTrigger>
                              <SelectContent>
                                {industrySectors.map((sector) => (
                                  <SelectItem key={sector} value={sector}>
                                    {sector.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select defaultValue="TIER_2" name="category">
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {supplierCategories.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="localOwnershipPercent">
                              Local Ownership (%)
                            </Label>
                            <Input
                              id="localOwnershipPercent"
                              max="100"
                              min="0"
                              name="localOwnershipPercent"
                              placeholder="e.g., 100"
                              required
                              type="number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="localEmploymentPercent">
                              Local Employment (%)
                            </Label>
                            <Input
                              id="localEmploymentPercent"
                              max="100"
                              min="0"
                              name="localEmploymentPercent"
                              placeholder="e.g., 95"
                              type="number"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactPerson">Contact Person</Label>
                          <Input
                            id="contactPerson"
                            name="contactPerson"
                            placeholder="Contact name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contactEmail">Email</Label>
                            <Input
                              id="contactEmail"
                              name="contactEmail"
                              placeholder="email@company.gy"
                              type="email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contactPhone">Phone</Label>
                            <Input
                              id="contactPhone"
                              name="contactPhone"
                              placeholder="+592 xxx-xxxx"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => setShowNewSupplierDialog(false)}
                            type="button"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={createSupplierMutation.isPending}
                            type="submit"
                          >
                            {createSupplierMutation.isPending
                              ? "Registering..."
                              : "Register Supplier"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                {suppliersQuery.isLoading ? (
                  <TableSkeleton />
                ) : suppliersQuery.isError ? (
                  <ErrorDisplay
                    message={
                      suppliersQuery.error?.message ||
                      "Failed to load suppliers"
                    }
                    onRetry={() => suppliersQuery.refetch()}
                  />
                ) : suppliers.length === 0 ? (
                  <EmptyState
                    action={
                      <Button onClick={() => setShowNewSupplierDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Register First Supplier
                      </Button>
                    }
                    description="Register local suppliers to track compliance."
                    title="No Suppliers"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Supplier Code</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Sector</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Local Ownership</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map(
                        (supplier: {
                          id: string;
                          vendorCode: string;
                          vendorName: string;
                          vendorType: string;
                          guyaneseOwnershipPercent: string | null;
                          isActive: boolean;
                        }) => (
                          <TableRow key={supplier.id}>
                            <TableCell className="font-medium">
                              {supplier.vendorCode}
                            </TableCell>
                            <TableCell>{supplier.vendorName}</TableCell>
                            <TableCell>
                              {getSectorBadge(supplier.vendorType)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">Local Vendor</Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(
                                supplier.isActive ? "ACTIVE" : "SUSPENDED"
                              )}
                            </TableCell>
                            <TableCell>
                              {supplier.guyaneseOwnershipPercent || 0}%
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
                                    View Profile
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Edit Supplier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Renew Certification
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="reports">
                {reportsQuery.isLoading ? (
                  <TableSkeleton />
                ) : reportsQuery.isError ? (
                  <ErrorDisplay
                    message={
                      reportsQuery.error?.message || "Failed to load reports"
                    }
                    onRetry={() => reportsQuery.refetch()}
                  />
                ) : reports.length === 0 ? (
                  <EmptyState
                    description="No compliance reports submitted yet."
                    title="No Reports"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Report Code</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Employment Score</TableHead>
                        <TableHead>Procurement Score</TableHead>
                        <TableHead>Training Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">
                            {report.reportNumber}
                          </TableCell>
                          <TableCell>{report.planId || "N/A"}</TableCell>
                          <TableCell>
                            {new Date(report.periodStart).toLocaleDateString()}{" "}
                            - {new Date(report.periodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                className="w-16"
                                value={Number(report.employmentActual || 0)}
                              />
                              <span className="font-medium">
                                {String(report.employmentActual || 0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                className="w-16"
                                value={Number(report.servicesActual || 0)}
                              />
                              <span className="font-medium">
                                {String(report.servicesActual || 0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress
                                className="w-16"
                                value={Number(report.trainingActual || 0)}
                              />
                              <span className="font-medium">
                                {String(report.trainingActual || 0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Report</DropdownMenuItem>
                                <DropdownMenuItem>
                                  Download PDF
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

              <TabsContent value="workforce">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">Workforce Analytics</h3>
                  <p className="text-muted-foreground">
                    Track Guyanese employment metrics and skills development
                    across operators.
                  </p>
                  <Button className="mt-4" variant="outline">
                    View Workforce Data
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
