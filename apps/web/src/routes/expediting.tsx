import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Timer,
  TrendingUp,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/expediting")({
  component: ExpeditingPage,
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
    <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const serviceTypes = [
  "DOCUMENT_SUBMISSION",
  "DOCUMENT_COLLECTION",
  "APPLICATION_FOLLOW_UP",
  "CERTIFICATE_RENEWAL",
  "COMPLIANCE_CLEARANCE",
  "PERMIT_APPLICATION",
  "LICENSE_APPLICATION",
  "TAX_CLEARANCE",
  "REGISTRATION",
  "INQUIRY",
  "GENERAL_EXPEDITING",
] as const;

const priorities = ["STANDARD", "PRIORITY", "URGENT", "RUSH"] as const;

function ExpeditingPage() {
  const [activeTab, setActiveTab] = useState("requests");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showNewAgencyDialog, setShowNewAgencyDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch expedite requests
  const requestsQuery = useQuery({
    queryKey: [
      "expediteRequests",
      {
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : undefined,
      },
    ],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.expediting.requests.list({
        search: searchTerm || undefined,
        status:
          statusFilter !== "all"
            ? (statusFilter as
                | "PENDING"
                | "ASSIGNED"
                | "IN_QUEUE"
                | "AT_AGENCY"
                | "PROCESSING"
                | "AWAITING_RESPONSE"
                | "DOCUMENTS_READY"
                | "COMPLETED"
                | "FAILED"
                | "CANCELLED"
                | "ON_HOLD")
            : undefined,
        page: 1,
        limit: 50,
      });
    },
  });

  // Fetch agencies
  const agenciesQuery = useQuery({
    queryKey: ["expediteAgencies"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.expediting.agencyContacts.list({});
    },
  });

  // Fetch stats
  const statsQuery = useQuery({
    queryKey: ["expediteStats"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.expediting.requests.stats();
    },
  });

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: {
      clientId: string;
      agency: string;
      requestType: (typeof serviceTypes)[number];
      title: string;
      description: string;
      priority: (typeof priorities)[number];
      targetCompletionDate?: string;
      notes?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.expediting.requests.create(
        data as Parameters<typeof client.expediting.requests.create>[0]
      );
    },
    onSuccess: () => {
      toast.success("Expedite request created successfully");
      setShowNewRequestDialog(false);
      queryClient.invalidateQueries({ queryKey: ["expediteRequests"] });
      queryClient.invalidateQueries({ queryKey: ["expediteStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to create request: ${error.message}`);
    },
  });

  // Create agency mutation
  const createAgencyMutation = useMutation({
    mutationFn: async (data: {
      agency: string;
      departmentName?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
      notes?: string;
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.expediting.agencyContacts.create(
        data as Parameters<typeof client.expediting.agencyContacts.create>[0]
      );
    },
    onSuccess: () => {
      toast.success("Agency created successfully");
      setShowNewAgencyDialog(false);
      queryClient.invalidateQueries({ queryKey: ["expediteAgencies"] });
    },
    onError: (error) => {
      toast.error(`Failed to create agency: ${error.message}`);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      status:
        | "PENDING"
        | "ASSIGNED"
        | "IN_QUEUE"
        | "AT_AGENCY"
        | "PROCESSING"
        | "AWAITING_RESPONSE"
        | "DOCUMENTS_READY"
        | "COMPLETED"
        | "FAILED"
        | "CANCELLED"
        | "ON_HOLD";
    }) => {
      const { client } = await import("@/utils/orpc");
      return client.expediting.requests.update({
        id: data.id,
        data: { status: data.status },
      });
    },
    onSuccess: () => {
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["expediteRequests"] });
      queryClient.invalidateQueries({ queryKey: ["expediteStats"] });
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const handleCreateRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRequestMutation.mutate({
      clientId: formData.get("clientId") as string,
      agency: formData.get("agency") as string,
      requestType: formData.get("requestType") as (typeof serviceTypes)[number],
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      priority: formData.get("priority") as (typeof priorities)[number],
      targetCompletionDate:
        (formData.get("targetCompletionDate") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const handleCreateAgency = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAgencyMutation.mutate({
      agency: formData.get("agency") as string,
      departmentName: (formData.get("departmentName") as string) || undefined,
      contactName: (formData.get("contactName") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      PENDING: "outline",
      ASSIGNED: "default",
      IN_QUEUE: "default",
      AT_AGENCY: "default",
      PROCESSING: "default",
      AWAITING_RESPONSE: "default",
      DOCUMENTS_READY: "default",
      COMPLETED: "secondary",
      FAILED: "destructive",
      CANCELLED: "destructive",
      ON_HOLD: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      STANDARD: "bg-gray-100 text-gray-800",
      PRIORITY: "bg-blue-100 text-blue-800",
      URGENT: "bg-orange-100 text-orange-800",
      RUSH: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 font-medium text-xs ${colors[priority] || "bg-gray-100 text-gray-800"}`}
      >
        {priority}
      </span>
    );
  };

  const stats = statsQuery.data?.data;
  const requests = requestsQuery.data?.data?.items || [];
  const agencies = agenciesQuery.data?.data || [];

  // Calculate stats from the data
  const totalRequests = stats?.total || 0;
  const inProgressRequests =
    stats?.byStatus?.find((s) => s.status === "PROCESSING")?.count || 0;
  const completedRequests =
    stats?.byStatus?.find((s) => s.status === "COMPLETED")?.count || 0;
  const delayedRequests =
    stats?.byStatus?.find((s) => s.status === "ON_HOLD")?.count || 0;

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl tracking-tight">
                Government Expediting Services
              </h1>
              <p className="text-muted-foreground">
                Manage and track government application expediting requests
                across agencies.
              </p>
            </div>
            <Dialog
              onOpenChange={setShowNewRequestDialog}
              open={showNewRequestDialog}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Expedite Request</DialogTitle>
                  <DialogDescription>
                    Submit a new government expediting request. Fill in the
                    details below.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreateRequest}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="clientId">Client ID</Label>
                      <Input
                        id="clientId"
                        name="clientId"
                        placeholder="Enter client ID"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agency">Agency</Label>
                      <Select name="agency" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select agency" />
                        </SelectTrigger>
                        <SelectContent>
                          {agencies.map(
                            (agency: {
                              id: string;
                              agency: string;
                              departmentName?: string | null;
                            }) => (
                              <SelectItem key={agency.id} value={agency.agency}>
                                {agency.agency}{" "}
                                {agency.departmentName &&
                                  `(${agency.departmentName})`}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Request title"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="requestType">Request Type</Label>
                      <Select
                        defaultValue="LICENSE_APPLICATION"
                        name="requestType"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select defaultValue="PRIORITY" name="priority">
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {priorities.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe the expediting request..."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetCompletionDate">
                      Expected Completion Date
                    </Label>
                    <Input
                      id="targetCompletionDate"
                      name="targetCompletionDate"
                      type="date"
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
                      onClick={() => setShowNewRequestDialog(false)}
                      type="button"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={createRequestMutation.isPending}
                      type="submit"
                    >
                      {createRequestMutation.isPending
                        ? "Creating..."
                        : "Create Request"}
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
                      Total Requests
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Total number of expediting requests in the system
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{totalRequests}</p>
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
                      In Progress
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Requests currently being processed with government
                        agencies
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{inProgressRequests}</p>
                  )}
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-medium text-muted-foreground text-sm">
                      Completed
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Successfully expedited requests
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{completedRequests}</p>
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
                      Delayed
                    </p>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Requests that have exceeded their expected completion
                        date
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {statsQuery.isLoading ? (
                    <Skeleton className="mt-1 h-8 w-16" />
                  ) : (
                    <p className="font-bold text-2xl">{delayedRequests}</p>
                  )}
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Expediting Dashboard</CardTitle>
                <CardDescription>
                  Track all government expediting requests and agency
                  relationships.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="w-64 pl-9"
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search requests..."
                    value={searchTerm}
                  />
                </div>
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DELAYED">Delayed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="requests">
                  <FileText className="mr-2 h-4 w-4" />
                  Requests
                </TabsTrigger>
                <TabsTrigger value="agencies">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Agencies
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <Timer className="mr-2 h-4 w-4" />
                  Timeline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="requests">
                {requestsQuery.isLoading ? (
                  <TableSkeleton />
                ) : requestsQuery.isError ? (
                  <ErrorDisplay
                    message={
                      requestsQuery.error?.message ||
                      "Failed to load expedite requests"
                    }
                    onRetry={() => requestsQuery.refetch()}
                  />
                ) : requests.length === 0 ? (
                  <EmptyState
                    action={
                      <Button onClick={() => setShowNewRequestDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Request
                      </Button>
                    }
                    description="Get started by creating your first expediting request."
                    title="No Expedite Requests"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Request #</TableHead>
                        <TableHead>Service Type</TableHead>
                        <TableHead>Agency</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Expected Date</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">
                            {request.requestNumber}
                          </TableCell>
                          <TableCell>
                            {request.requestType.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {request.agency || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(request.status)}
                          </TableCell>
                          <TableCell>
                            {getPriorityBadge(request.priority)}
                          </TableCell>
                          <TableCell>
                            {request.targetCompletionDate
                              ? new Date(
                                  request.targetCompletionDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {request.assignedToId || "Unassigned"}
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
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: request.id,
                                      status: "PROCESSING",
                                    })
                                  }
                                >
                                  Mark In Progress
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: request.id,
                                      status: "COMPLETED",
                                    })
                                  }
                                >
                                  Mark Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: request.id,
                                      status: "ON_HOLD",
                                    })
                                  }
                                >
                                  Mark On Hold
                                </DropdownMenuItem>
                                <DropdownMenuItem>Add Note</DropdownMenuItem>
                                <DropdownMenuItem>
                                  View Documents
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

              <TabsContent value="agencies">
                <div className="mb-4 flex justify-end">
                  <Dialog
                    onOpenChange={setShowNewAgencyDialog}
                    open={showNewAgencyDialog}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Agency
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Government Agency</DialogTitle>
                        <DialogDescription>
                          Add a new government agency to the system.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4" onSubmit={handleCreateAgency}>
                        <div className="space-y-2">
                          <Label htmlFor="agency">Agency</Label>
                          <Select name="agency" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select agency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GRA">
                                GRA - Guyana Revenue Authority
                              </SelectItem>
                              <SelectItem value="NIS">
                                NIS - National Insurance Scheme
                              </SelectItem>
                              <SelectItem value="DEEDS_REGISTRY">
                                Deeds Registry
                              </SelectItem>
                              <SelectItem value="LANDS_SURVEYS">
                                Lands & Surveys
                              </SelectItem>
                              <SelectItem value="BUSINESS_REGISTRY">
                                Business Registry
                              </SelectItem>
                              <SelectItem value="IMMIGRATION">
                                Immigration
                              </SelectItem>
                              <SelectItem value="MINISTRY_OF_LABOUR">
                                Ministry of Labour
                              </SelectItem>
                              <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="departmentName">Department</Label>
                          <Input
                            id="departmentName"
                            name="departmentName"
                            placeholder="Department name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contactName">Contact Person</Label>
                            <Input
                              id="contactName"
                              name="contactName"
                              placeholder="Contact name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              name="phone"
                              placeholder="+592 xxx-xxxx"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            placeholder="email@agency.gov.gy"
                            type="email"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="agency-address">Address</Label>
                          <Textarea
                            id="agency-address"
                            name="address"
                            placeholder="Agency address"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => setShowNewAgencyDialog(false)}
                            type="button"
                            variant="outline"
                          >
                            Cancel
                          </Button>
                          <Button
                            disabled={createAgencyMutation.isPending}
                            type="submit"
                          >
                            {createAgencyMutation.isPending
                              ? "Adding..."
                              : "Add Agency"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                {agenciesQuery.isLoading ? (
                  <TableSkeleton />
                ) : agenciesQuery.isError ? (
                  <ErrorDisplay
                    message={
                      agenciesQuery.error?.message || "Failed to load agencies"
                    }
                    onRetry={() => agenciesQuery.refetch()}
                  />
                ) : agencies.length === 0 ? (
                  <EmptyState
                    action={
                      <Button onClick={() => setShowNewAgencyDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add First Agency
                      </Button>
                    }
                    description="Add government agencies to track expediting requests."
                    title="No Agencies"
                  />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agency Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="w-[50px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agencies.map(
                        (agency: {
                          id: string;
                          agency: string;
                          departmentName?: string | null;
                          contactName?: string | null;
                          phone?: string | null;
                        }) => (
                          <TableRow key={agency.id}>
                            <TableCell className="font-medium">
                              {agency.agency}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{agency.agency}</Badge>
                            </TableCell>
                            <TableCell>
                              {agency.departmentName || "N/A"}
                            </TableCell>
                            <TableCell>{agency.contactName || "N/A"}</TableCell>
                            <TableCell>{agency.phone || "N/A"}</TableCell>
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
                                    View Requests
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    Edit Agency
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

              <TabsContent value="timeline">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Timer className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">Request Timeline</h3>
                  <p className="text-muted-foreground">
                    View the timeline and milestones for all expediting
                    requests.
                  </p>
                  <Button className="mt-4" variant="outline">
                    View Full Timeline
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
