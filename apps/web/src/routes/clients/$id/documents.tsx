import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  Upload,
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
export const Route = createFileRoute("/clients/$id/documents")({
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

type Document = {
  id: string;
  clientId: string;
  name: string;
  type:
    | "tax-return"
    | "financial-statement"
    | "audit-report"
    | "contract"
    | "invoice"
    | "other";
  category: "tax" | "financial" | "legal" | "operational" | "compliance";
  uploadDate: string;
  lastModified: string;
  size: number;
  status: "uploaded" | "processing" | "reviewed" | "approved" | "rejected";
  uploadedBy: string;
  description: string;
  tags: string[];
  confidential: boolean;
};

function RouteComponent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [showDocumentDetails, setShowDocumentDetails] = useState(false);

  // Mock client data

  // Fetch client data from API
  const { data: clientResponse, isLoading: clientLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clients.getById({ id });
    },
  });

  // Fetch documents for this client from API
  const { data: documentsResponse, isLoading: docsLoading } = useQuery({
    queryKey: ["clientDocuments", id],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.documents.list({ clientId: id, page: 1, limit: 100 });
    },
    enabled: !!id,
  });

  // Map client API response
  const client: Client | null = clientResponse?.data
    ? {
        id: clientResponse.data.id,
        name: clientResponse.data.name || "",
        type: (clientResponse.data.entityType?.toLowerCase() === "individual"
          ? "smb"
          : clientResponse.data.entityType?.toLowerCase() === "corporation"
            ? "enterprise"
            : "mid-market") as Client["type"],
        status: (clientResponse.data.status?.toLowerCase() ||
          "active") as Client["status"],
        industry: clientResponse.data.industry || "General",
        contactPerson: clientResponse.data.contactPerson || "",
        email: clientResponse.data.email || "",
        phone: clientResponse.data.phoneNumber || "",
        address: clientResponse.data.address || "",
        revenue: 0,
        employees: 0,
        joinDate:
          clientResponse.data.clientSince?.toString() ||
          new Date().toISOString(),
        lastActivity:
          clientResponse.data.updatedAt?.toString() || new Date().toISOString(),
        complianceScore: 0,
        documents: documentsResponse?.data?.items?.length || 0,
      }
    : null;

  // Map documents API response
  const documents: Document[] = (documentsResponse?.data?.items || []).map(
    (doc: {
      id: string;
      clientId: string;
      name: string;
      category: string;
      subcategory: string | null;
      fileName: string;
      fileSize: number;
      status: string;
      uploadedBy: string | null;
      description: string | null;
      tags: string[] | null;
      isConfidential: boolean;
      createdAt: string | Date | null;
      updatedAt: string | Date | null;
    }) => ({
      id: doc.id,
      clientId: doc.clientId,
      name: doc.name || doc.fileName,
      type: (doc.category?.toLowerCase().includes("tax")
        ? "tax-return"
        : doc.category?.toLowerCase().includes("financial")
          ? "financial-statement"
          : doc.category?.toLowerCase().includes("audit")
            ? "audit-report"
            : doc.category?.toLowerCase().includes("contract")
              ? "contract"
              : "other") as Document["type"],
      category: (doc.category?.toLowerCase() ||
        "other") as Document["category"],
      uploadDate:
        doc.createdAt?.toString().split("T")[0] ||
        new Date().toISOString().split("T")[0],
      lastModified:
        doc.updatedAt?.toString().split("T")[0] ||
        new Date().toISOString().split("T")[0],
      size: doc.fileSize || 0,
      status: (doc.status?.toLowerCase() || "uploaded") as Document["status"],
      uploadedBy: doc.uploadedBy || "Unknown",
      description: doc.description || "",
      tags: doc.tags || [],
      confidential: doc.isConfidential,
    })
  );

  const isLoading = clientLoading || docsLoading;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <span className="ml-3">Loading documents...</span>
        </div>
      </div>
    );
  }

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

  const filteredDocuments = clientDocuments.filter((document) => {
    const matchesSearch =
      document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      document.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesType = typeFilter === "all" || document.type === typeFilter;
    const matchesStatus =
      statusFilter === "all" || document.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "uploaded":
        return <Badge variant="outline">Uploaded</Badge>;
      case "processing":
        return <Badge variant="secondary">Processing</Badge>;
      case "reviewed":
        return <Badge variant="default">Reviewed</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "tax-return":
        return <Badge variant="default">Tax Return</Badge>;
      case "financial-statement":
        return <Badge variant="outline">Financial Statement</Badge>;
      case "audit-report":
        return <Badge variant="secondary">Audit Report</Badge>;
      case "contract":
        return <Badge variant="outline">Contract</Badge>;
      case "invoice":
        return <Badge variant="secondary">Invoice</Badge>;
      case "other":
        return <Badge variant="outline">Other</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "tax":
        return <Badge variant="default">Tax</Badge>;
      case "financial":
        return <Badge variant="outline">Financial</Badge>;
      case "legal":
        return <Badge variant="secondary">Legal</Badge>;
      case "operational":
        return <Badge variant="outline">Operational</Badge>;
      case "compliance":
        return <Badge variant="default">Compliance</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "tax-return":
      case "financial-statement":
      case "audit-report":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "contract":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "invoice":
        return <FileText className="h-4 w-4 text-purple-500" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate({ to: `/clients/${id}` })}
              size="icon"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="font-bold text-3xl tracking-tight">
                {client.name} - Documents
              </h1>
              <p className="text-muted-foreground">
                Manage and organize all documents for this client
              </p>
            </div>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </header>

      {/* Document Stats */}
      <section aria-label="Document statistics" className="mb-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Total Documents
                  </p>
                  <p className="font-bold text-2xl">{clientDocuments.length}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Approved
                  </p>
                  <p className="font-bold text-2xl">
                    {
                      clientDocuments.filter((d) => d.status === "approved")
                        .length
                    }
                  </p>
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
                    Processing
                  </p>
                  <p className="font-bold text-2xl">
                    {
                      clientDocuments.filter((d) => d.status === "processing")
                        .length
                    }
                  </p>
                </div>
                <FileText className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-muted-foreground text-sm">
                    Confidential
                  </p>
                  <p className="font-bold text-2xl">
                    {clientDocuments.filter((d) => d.confidential).length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Filters and Search */}
      <section aria-label="Document filters and search" className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search documents by name, description, or tags..."
                  value={searchTerm}
                />
              </div>
              <div className="flex gap-2">
                <Select onValueChange={setTypeFilter} value={typeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Document Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tax-return">Tax Returns</SelectItem>
                    <SelectItem value="financial-statement">
                      Financial Statements
                    </SelectItem>
                    <SelectItem value="audit-report">Audit Reports</SelectItem>
                    <SelectItem value="contract">Contracts</SelectItem>
                    <SelectItem value="invoice">Invoices</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="uploaded">Uploaded</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="outline">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Documents Table */}
      <section aria-label="Documents listing table">
        <Card>
          <CardHeader>
            <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
            <CardDescription>
              All documents uploaded and managed for this client
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow className="hover:bg-muted/50" key={document.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getDocumentIcon(document.type)}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{document.name}</p>
                            {document.confidential && (
                              <Badge className="text-xs" variant="destructive">
                                Confidential
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {document.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(document.type)}</TableCell>
                    <TableCell>{getCategoryBadge(document.category)}</TableCell>
                    <TableCell>{getStatusBadge(document.status)}</TableCell>
                    <TableCell>{formatFileSize(document.size)}</TableCell>
                    <TableCell>{formatDate(document.uploadDate)}</TableCell>
                    <TableCell>{document.uploadedBy}</TableCell>
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
                              setSelectedDocument(document);
                              setShowDocumentDetails(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Metadata
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

            {filteredDocuments.length === 0 && (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold text-lg">
                  No documents found
                </h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filter criteria, or upload a new
                  document.
                </p>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload First Document
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Document Details Dialog */}
      <Dialog onOpenChange={setShowDocumentDetails} open={showDocumentDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocument && getDocumentIcon(selectedDocument.type)}
              {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed information about this document
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="grid gap-6">
              {/* Document Overview */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Document Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      {getTypeBadge(selectedDocument.type)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      {getCategoryBadge(selectedDocument.category)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      {getStatusBadge(selectedDocument.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span className="font-medium">
                        {formatFileSize(selectedDocument.size)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Confidential:
                      </span>
                      {selectedDocument.confidential ? (
                        <Badge variant="destructive">Yes</Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Upload Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Uploaded:</span>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">
                          {formatDate(selectedDocument.uploadDate)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Last Modified:
                      </span>
                      <span className="font-medium">
                        {formatDate(selectedDocument.lastModified)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Uploaded By:
                      </span>
                      <span className="font-medium">
                        {selectedDocument.uploadedBy}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description and Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Description & Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium text-sm">Description</p>
                    <p className="text-muted-foreground">
                      {selectedDocument.description}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tags</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedDocument.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowDocumentDetails(false)}
                  variant="outline"
                >
                  Close
                </Button>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Metadata
                </Button>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
