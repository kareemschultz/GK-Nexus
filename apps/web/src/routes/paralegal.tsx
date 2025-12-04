import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  AlertCircle,
  Calendar,
  Clock,
  Download,
  FileText,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Scale,
  Search,
  User,
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
import { authClient } from "@/lib/auth-client";

// Define the route with authentication
export const Route = createFileRoute("/paralegal")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({ to: "/login", throw: true });
    }
    return { session };
  },
  component: ParalegalPage,
});

// Document types for paralegal services
const DOCUMENT_TYPES = [
  {
    id: "affidavit",
    name: "Affidavit",
    description: "Sworn written statement for legal purposes",
    basePrice: 5000,
    estimatedDays: 2,
  },
  {
    id: "agreement_of_sale",
    name: "Agreement of Sale & Purchase",
    description: "Property sale and purchase agreements",
    basePrice: 15_000,
    estimatedDays: 3,
  },
  {
    id: "will",
    name: "Will / Last Testament",
    description: "Legal will and testament preparation",
    basePrice: 20_000,
    estimatedDays: 5,
  },
  {
    id: "settlement_agreement",
    name: "Settlement Agreement",
    description: "Legal settlement documentation",
    basePrice: 25_000,
    estimatedDays: 5,
  },
  {
    id: "separation_agreement",
    name: "Separation Agreement",
    description: "Marital separation agreements",
    basePrice: 30_000,
    estimatedDays: 7,
  },
  {
    id: "partnership_agreement",
    name: "Investment & Partnership Agreement",
    description: "Business partnership and investment agreements",
    basePrice: 35_000,
    estimatedDays: 7,
  },
  {
    id: "power_of_attorney",
    name: "Power of Attorney",
    description: "Legal authorization documents",
    basePrice: 10_000,
    estimatedDays: 3,
  },
  {
    id: "statutory_declaration",
    name: "Statutory Declaration",
    description: "Official declarations under oath",
    basePrice: 5000,
    estimatedDays: 2,
  },
] as const;

// Status options for documents
const STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-gray-500" },
  { value: "in_review", label: "In Review", color: "bg-yellow-500" },
  {
    value: "pending_signature",
    label: "Pending Signature",
    color: "bg-blue-500",
  },
  { value: "notarized", label: "Notarized", color: "bg-purple-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
] as const;

// Loading skeleton component - consistent with other pages
const TableSkeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        className="h-12 w-full animate-pulse rounded bg-muted"
        key={`skeleton-${i}`}
      />
    ))}
  </div>
);

// Error display component - consistent with other pages
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

// Empty state component - consistent with other pages
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
    <Scale className="mb-4 h-12 w-12 text-muted-foreground" />
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Mock data for paralegal documents
const MOCK_DOCUMENTS = [
  {
    id: "1",
    documentType: "affidavit",
    clientName: "John Smith",
    clientId: "client-1",
    title: "Affidavit of Residence",
    status: "completed",
    createdAt: "2024-11-15",
    dueDate: "2024-11-17",
    completedAt: "2024-11-16",
    price: 5000,
    notes: "Standard residence affidavit",
  },
  {
    id: "2",
    documentType: "agreement_of_sale",
    clientName: "ABC Company Ltd",
    clientId: "client-2",
    title: "Property Sale Agreement - Lot 45 Eccles",
    status: "pending_signature",
    createdAt: "2024-11-20",
    dueDate: "2024-11-25",
    price: 15_000,
    notes: "Commercial property sale",
  },
  {
    id: "3",
    documentType: "will",
    clientName: "Mary Williams",
    clientId: "client-3",
    title: "Last Will and Testament",
    status: "in_review",
    createdAt: "2024-11-22",
    dueDate: "2024-11-30",
    price: 20_000,
    notes: "Includes property and savings distribution",
  },
  {
    id: "4",
    documentType: "partnership_agreement",
    clientName: "Tech Startup Inc",
    clientId: "client-4",
    title: "Investment Partnership Agreement",
    status: "draft",
    createdAt: "2024-11-25",
    dueDate: "2024-12-05",
    price: 35_000,
    notes: "Multi-party investment agreement",
  },
];

function ParalegalPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<
    (typeof MOCK_DOCUMENTS)[0] | null
  >(null);

  // New document form state
  const [newDocument, setNewDocument] = useState({
    documentType: "",
    clientName: "",
    title: "",
    dueDate: "",
    notes: "",
  });

  const queryClient = useQueryClient();

  // Query for documents
  const {
    data: documents,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["paralegal-documents", statusFilter, documentTypeFilter],
    queryFn: async () => {
      // Mock API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_DOCUMENTS;
    },
  });

  // Create document mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof newDocument) => {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { id: Date.now().toString(), ...data };
    },
    onSuccess: () => {
      toast.success("Document request created successfully");
      setIsCreateDialogOpen(false);
      setNewDocument({
        documentType: "",
        clientName: "",
        title: "",
        dueDate: "",
        notes: "",
      });
      queryClient.invalidateQueries({ queryKey: ["paralegal-documents"] });
    },
    onError: () => {
      toast.error("Failed to create document request");
    },
  });

  // Filter documents
  const filteredDocuments = documents?.filter((doc) => {
    const matchesSearch =
      doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType =
      documentTypeFilter === "all" || doc.documentType === documentTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Statistics
  const stats = {
    total: documents?.length || 0,
    draft: documents?.filter((d) => d.status === "draft").length || 0,
    inProgress:
      documents?.filter((d) =>
        ["in_review", "pending_signature"].includes(d.status)
      ).length || 0,
    completed: documents?.filter((d) => d.status === "completed").length || 0,
    revenue:
      documents
        ?.filter((d) => d.status === "completed")
        .reduce((acc, d) => acc + d.price, 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_OPTIONS.find((s) => s.value === status);
    return (
      <Badge className="flex items-center gap-1" variant="outline">
        <span
          className={`h-2 w-2 rounded-full ${statusConfig?.color || "bg-gray-500"}`}
        />
        {statusConfig?.label || status}
      </Badge>
    );
  };

  const getDocumentTypeName = (type: string) =>
    DOCUMENT_TYPES.find((t) => t.id === type)?.name || type;

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Paralegal Services
          </h1>
          <p className="text-muted-foreground">
            Legal document preparation, notarization, and filing services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} size="icon" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Dialog
            onOpenChange={setIsCreateDialogOpen}
            open={isCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Document Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Document Request</DialogTitle>
                <DialogDescription>
                  Request a new paralegal document preparation service
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type *</Label>
                  <Select
                    onValueChange={(value) =>
                      setNewDocument({ ...newDocument, documentType: value })
                    }
                    value={newDocument.documentType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex flex-col">
                            <span>{type.name}</span>
                            <span className="text-muted-foreground text-xs">
                              GYD {type.basePrice.toLocaleString()} -{" "}
                              {type.estimatedDays} days
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        clientName: e.target.value,
                      })
                    }
                    placeholder="Enter client name"
                    value={newDocument.clientName}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title *</Label>
                  <Input
                    id="title"
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, title: e.target.value })
                    }
                    placeholder="Enter document title"
                    value={newDocument.title}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    onChange={(e) =>
                      setNewDocument({
                        ...newDocument,
                        dueDate: e.target.value,
                      })
                    }
                    type="date"
                    value={newDocument.dueDate}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, notes: e.target.value })
                    }
                    placeholder="Any special instructions or details..."
                    rows={3}
                    value={newDocument.notes}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => setIsCreateDialogOpen(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    !(
                      newDocument.documentType &&
                      newDocument.clientName &&
                      newDocument.title
                    ) || createMutation.isPending
                  }
                  onClick={() => createMutation.mutate(newDocument)}
                >
                  {createMutation.isPending ? "Creating..." : "Create Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.total}</div>
            <p className="text-muted-foreground text-xs">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.inProgress}</div>
            <p className="text-muted-foreground text-xs">
              {stats.draft} drafts
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Completed</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{stats.completed}</div>
            <p className="text-muted-foreground text-xs">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Revenue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              GYD {stats.revenue.toLocaleString()}
            </div>
            <p className="text-muted-foreground text-xs">From completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs className="space-y-4" defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="services">Service Catalog</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="documents">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by client or title..."
                    value={searchQuery}
                  />
                </div>
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={setDocumentTypeFilter}
                  value={documentTypeFilter}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Document Types</SelectItem>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Document Requests</CardTitle>
              <CardDescription>
                Manage paralegal document preparation requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <TableSkeleton />
              ) : isError ? (
                <ErrorDisplay
                  message={error?.message || "Failed to load documents"}
                  onRetry={() => refetch()}
                />
              ) : filteredDocuments?.length === 0 ? (
                <EmptyState
                  action={
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Document
                    </Button>
                  }
                  description="Get started by creating your first paralegal document request."
                  title="No Documents Found"
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="w-[50px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments?.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Scale className="h-4 w-4 text-indigo-500" />
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-muted-foreground text-xs">
                                Created: {doc.createdAt}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {doc.clientName}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getDocumentTypeName(doc.documentType)}
                        </TableCell>
                        <TableCell>{getStatusBadge(doc.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {doc.dueDate}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          GYD {doc.price.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedDocument(doc)}
                              >
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="mr-2 h-4 w-4" />
                                Download Document
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                Cancel Request
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="services">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DOCUMENT_TYPES.map((type) => (
              <Card className="transition-shadow hover:shadow-md" key={type.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Scale className="h-8 w-8 text-indigo-500" />
                    <Badge variant="outline">
                      GYD {type.basePrice.toLocaleString()}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                  <CardDescription>{type.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <Clock className="h-4 w-4" />
                      Est. {type.estimatedDays} days
                    </div>
                    <Button
                      onClick={() => {
                        setNewDocument({
                          ...newDocument,
                          documentType: type.id,
                        });
                        setIsCreateDialogOpen(true);
                      }}
                      size="sm"
                    >
                      Request
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Detail Dialog */}
      {selectedDocument && (
        <Dialog
          onOpenChange={(open) => !open && setSelectedDocument(null)}
          open={!!selectedDocument}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedDocument.title}</DialogTitle>
              <DialogDescription>Document request details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Document Type</Label>
                  <p className="font-medium">
                    {getDocumentTypeName(selectedDocument.documentType)}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedDocument.status)}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Client</Label>
                  <p className="font-medium">{selectedDocument.clientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="font-medium">
                    GYD {selectedDocument.price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="font-medium">{selectedDocument.createdAt}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{selectedDocument.dueDate}</p>
                </div>
              </div>
              {selectedDocument.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedDocument.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                onClick={() => setSelectedDocument(null)}
                variant="outline"
              >
                Close
              </Button>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
