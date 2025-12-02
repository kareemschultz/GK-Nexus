import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Grid3X3,
  History,
  List,
  MoreHorizontal,
  Search,
  Share,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type DocumentStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION";
type DocumentType =
  | "TAX_RETURN"
  | "FINANCIAL_STATEMENT"
  | "IMMIGRATION_DOC"
  | "LEGAL_DOC"
  | "COMPLIANCE_DOC"
  | "OTHER";
type DocumentCategory =
  | "CLIENT_DOCS"
  | "INTERNAL_DOCS"
  | "TEMPLATES"
  | "REPORTS";

interface Document {
  id: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  documentType: DocumentType;
  status: DocumentStatus;
  clientId?: string;
  clientName?: string;
  tags: string[];
  description: string | null;
  version: number;
  isLatest: boolean;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
  downloadCount: number;
  isStarred: boolean;
  accessLevel: "PUBLIC" | "RESTRICTED" | "CONFIDENTIAL";
  metadata?: Record<string, any>;
  parentDocumentId?: string;
  checksum: string;
}

interface DocumentVersion {
  id: string;
  version: number;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: Date;
  changeNotes: string | null;
  isLatest: boolean;
}

interface ApprovalWorkflow {
  id: string;
  documentId: string;
  approvers: string[];
  currentApprover: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  comments: ApprovalComment[];
  createdAt: Date;
}

interface ApprovalComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  action: "APPROVE" | "REJECT" | "REQUEST_CHANGES";
  createdAt: Date;
}

interface DocumentManagerProps {
  documents?: Document[];
  onUpload?: (files: FileList, metadata: Partial<Document>) => void;
  onDownload?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
  onApprove?: (documentId: string, comments: string) => void;
  onReject?: (documentId: string, reason: string) => void;
  onShare?: (documentId: string, recipients: string[]) => void;
  clientId?: string;
  showClientFilter?: boolean;
}

const getStatusBadge = (status: DocumentStatus) => {
  switch (status) {
    case "PENDING":
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    case "APPROVED":
      return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
    case "REJECTED":
      return <Badge variant="destructive">Rejected</Badge>;
    case "NEEDS_REVISION":
      return (
        <Badge className="bg-orange-100 text-orange-800">Needs Revision</Badge>
      );
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getAccessLevelBadge = (level: string) => {
  switch (level) {
    case "PUBLIC":
      return <Badge variant="secondary">Public</Badge>;
    case "RESTRICTED":
      return (
        <Badge className="bg-yellow-100 text-yellow-800">Restricted</Badge>
      );
    case "CONFIDENTIAL":
      return <Badge variant="destructive">Confidential</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/"))
    return <FileText className="h-4 w-4 text-blue-500" />;
  if (mimeType.includes("pdf"))
    return <FileText className="h-4 w-4 text-red-500" />;
  if (mimeType.includes("word"))
    return <FileText className="h-4 w-4 text-blue-700" />;
  if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
    return <FileText className="h-4 w-4 text-green-600" />;
  return <FileText className="h-4 w-4 text-gray-500" />;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / k ** i).toFixed(2)) + " " + sizes[i];
};

const formatDate = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export function DocumentManager({
  documents = [],
  onUpload,
  onDownload,
  onDelete,
  onApprove,
  onReject,
  onShare,
  clientId,
  showClientFilter = true,
}: DocumentManagerProps) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | "ALL">(
    "ALL"
  );
  const [filterType, setFilterType] = useState<DocumentType | "ALL">("ALL");
  const [filterCategory, setFilterCategory] = useState<
    DocumentCategory | "ALL"
  >("ALL");
  const [uploadMetadata, setUploadMetadata] = useState<Partial<Document>>({
    category: "CLIENT_DOCS",
    documentType: "OTHER",
    accessLevel: "RESTRICTED",
    tags: [],
  });

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      // Status filter
      const matchesStatus =
        filterStatus === "ALL" || doc.status === filterStatus;

      // Type filter
      const matchesType =
        filterType === "ALL" || doc.documentType === filterType;

      // Category filter
      const matchesCategory =
        filterCategory === "ALL" || doc.category === filterCategory;

      // Client filter (if specified)
      const matchesClient = !clientId || doc.clientId === clientId;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesCategory &&
        matchesClient
      );
    });
  }, [
    documents,
    searchQuery,
    filterStatus,
    filterType,
    filterCategory,
    clientId,
  ]);

  const documentStats = useMemo(() => {
    const stats = {
      total: documents.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalSize: 0,
    };

    for (const doc of documents) {
      stats.totalSize += doc.fileSize;
      switch (doc.status) {
        case "PENDING":
        case "NEEDS_REVISION":
          stats.pending++;
          break;
        case "APPROVED":
          stats.approved++;
          break;
        case "REJECTED":
          stats.rejected++;
          break;
      }
    }

    return stats;
  }, [documents]);

  const recentDocuments = useMemo(
    () =>
      documents
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
        .slice(0, 5),
    [documents]
  );

  const pendingApprovals = useMemo(
    () =>
      documents.filter(
        (doc) => doc.status === "PENDING" || doc.status === "NEEDS_REVISION"
      ),
    [documents]
  );

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const metadata: Partial<Document> = {
        ...uploadMetadata,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date(),
        lastModified: new Date(),
        version: 1,
        isLatest: true,
        downloadCount: 0,
        isStarred: false,
      };

      onUpload?.(files, metadata);
    }
    setShowUploadDialog(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">
            Document Management
          </h1>
          <p className="text-muted-foreground">
            Upload, organize, and manage client documents with approval
            workflows.
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className="mr-2 h-4 w-4" />
          Upload Documents
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Documents
                </p>
                <p className="font-bold text-2xl">{documentStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Pending Approval
                </p>
                <p className="font-bold text-2xl">{documentStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
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
                <p className="font-bold text-2xl">{documentStats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-muted-foreground text-sm">
                  Total Size
                </p>
                <p className="font-bold text-2xl">
                  {formatFileSize(documentStats.totalSize)}
                </p>
              </div>
              <FolderOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovals.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Documents Pending Approval ({pendingApprovals.length})
            </CardTitle>
            <CardDescription>
              These documents require review and approval before they can be
              finalized.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApprovals.slice(0, 3).map((doc) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-3"
                  key={doc.id}
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.mimeType)}
                    <div>
                      <p className="font-medium text-sm">{doc.originalName}</p>
                      <p className="text-muted-foreground text-xs">
                        {doc.clientName && `${doc.clientName} • `}
                        Uploaded {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    <Button
                      onClick={() => {
                        setSelectedDocument(doc);
                        setShowApprovalDialog(true);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Review
                    </Button>
                  </div>
                </div>
              ))}
              {pendingApprovals.length > 3 && (
                <p className="text-center text-muted-foreground text-sm">
                  +{pendingApprovals.length - 3} more documents pending approval
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative max-w-sm flex-1">
                <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  value={searchQuery}
                />
              </div>

              <Select
                onValueChange={(value) =>
                  setFilterStatus(value as DocumentStatus | "ALL")
                }
                value={filterStatus}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="NEEDS_REVISION">Needs Revision</SelectItem>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) =>
                  setFilterType(value as DocumentType | "ALL")
                }
                value={filterType}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="TAX_RETURN">Tax Returns</SelectItem>
                  <SelectItem value="FINANCIAL_STATEMENT">
                    Financial Statements
                  </SelectItem>
                  <SelectItem value="IMMIGRATION_DOC">Immigration</SelectItem>
                  <SelectItem value="LEGAL_DOC">Legal Documents</SelectItem>
                  <SelectItem value="COMPLIANCE_DOC">Compliance</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>

              {showClientFilter && (
                <Select
                  onValueChange={(value) =>
                    setFilterCategory(value as DocumentCategory | "ALL")
                  }
                  value={filterCategory}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    <SelectItem value="CLIENT_DOCS">
                      Client Documents
                    </SelectItem>
                    <SelectItem value="INTERNAL_DOCS">Internal</SelectItem>
                    <SelectItem value="TEMPLATES">Templates</SelectItem>
                    <SelectItem value="REPORTS">Reports</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => setViewMode("list")}
                size="sm"
                variant={viewMode === "list" ? "default" : "outline"}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setViewMode("grid")}
                size="sm"
                variant={viewMode === "grid" ? "default" : "outline"}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List/Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export List
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-medium text-lg">No documents found</h3>
              <p className="mt-1 text-muted-foreground text-sm">
                {documents.length === 0
                  ? "Start by uploading your first document."
                  : "Try adjusting your search or filter criteria."}
              </p>
              {documents.length === 0 && (
                <Button
                  className="mt-4"
                  onClick={() => setShowUploadDialog(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Document
                </Button>
              )}
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-3">
              {filteredDocuments.map((doc) => (
                <div
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent/50"
                  key={doc.id}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getFileIcon(doc.mimeType)}
                      {doc.isStarred && (
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-sm">
                          {doc.originalName}
                        </p>
                        {!doc.isLatest && (
                          <Badge className="text-xs" variant="secondary">
                            v{doc.version}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground text-xs">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{doc.clientName || "Internal"}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                        <span>•</span>
                        <span>{doc.downloadCount} downloads</span>
                      </div>
                      {doc.description && (
                        <p className="mt-1 truncate text-muted-foreground text-xs">
                          {doc.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(doc.status)}
                      {getAccessLevelBadge(doc.accessLevel)}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setSelectedDocument(doc)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDownload?.(doc.id)}>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        {doc.status === "PENDING" && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowApprovalDialog(true);
                            }}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Review
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem>
                          <Share className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowVersionDialog(true);
                          }}
                        >
                          <History className="mr-2 h-4 w-4" />
                          Version History
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete?.(doc.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDocuments.map((doc) => (
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  key={doc.id}
                  onClick={() => setSelectedDocument(doc)}
                >
                  <CardContent className="pt-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getFileIcon(doc.mimeType)}
                        {doc.isStarred && (
                          <Star className="h-3 w-3 fill-current text-yellow-500" />
                        )}
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    <h4
                      className="mb-2 truncate font-medium text-sm"
                      title={doc.originalName}
                    >
                      {doc.originalName}
                    </h4>

                    <div className="space-y-2 text-muted-foreground text-xs">
                      <div className="flex justify-between">
                        <span>Size</span>
                        <span>{formatFileSize(doc.fileSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Client</span>
                        <span className="truncate">
                          {doc.clientName || "Internal"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uploaded</span>
                        <span>
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      {getAccessLevelBadge(doc.accessLevel)}
                      <span className="text-muted-foreground text-xs">
                        v{doc.version}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Detail Dialog */}
      {selectedDocument && (
        <Dialog
          onOpenChange={() => setSelectedDocument(null)}
          open={!!selectedDocument}
        >
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getFileIcon(selectedDocument.mimeType)}
                <div>
                  <h2 className="text-xl">{selectedDocument.originalName}</h2>
                  <p className="font-normal text-muted-foreground text-sm">
                    {selectedDocument.clientName &&
                      `${selectedDocument.clientName} • `}
                    Version {selectedDocument.version}
                    {!selectedDocument.isLatest && " (not latest)"}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <Tabs className="w-full" defaultValue="details">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="versions">Versions</TabsTrigger>
                <TabsTrigger value="approval">Approval</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent className="space-y-6" value="details">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Document Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          File Name
                        </span>
                        <span className="text-sm">
                          {selectedDocument.fileName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Size
                        </span>
                        <span className="text-sm">
                          {formatFileSize(selectedDocument.fileSize)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Type
                        </span>
                        <span className="text-sm">
                          {selectedDocument.mimeType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Category
                        </span>
                        <span className="text-sm">
                          {selectedDocument.category.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Document Type
                        </span>
                        <span className="text-sm">
                          {selectedDocument.documentType.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Access Level
                        </span>
                        {getAccessLevelBadge(selectedDocument.accessLevel)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Status & Metadata
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Status
                        </span>
                        {getStatusBadge(selectedDocument.status)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Uploaded By
                        </span>
                        <span className="text-sm">
                          {selectedDocument.uploadedBy}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Upload Date
                        </span>
                        <span className="text-sm">
                          {formatDate(selectedDocument.uploadedAt)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Last Modified
                        </span>
                        <span className="text-sm">
                          {formatDate(selectedDocument.lastModified)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Downloads
                        </span>
                        <span className="text-sm">
                          {selectedDocument.downloadCount}
                        </span>
                      </div>
                      {selectedDocument.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-sm">
                            Approved
                          </span>
                          <span className="text-sm">
                            {formatDate(selectedDocument.approvedAt)}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {selectedDocument.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedDocument.description}</p>
                    </CardContent>
                  </Card>
                )}

                {selectedDocument.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tags</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocument.tags.map((tag) => (
                          <Badge
                            className="text-xs"
                            key={tag}
                            variant="secondary"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="versions">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Version History</CardTitle>
                    <CardDescription>
                      Track changes and manage document versions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="py-8 text-center">
                      <History className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground text-sm">
                        Version history will be displayed here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="approval">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Approval Workflow
                    </CardTitle>
                    <CardDescription>
                      Review and manage document approval process.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="py-8 text-center">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground text-sm">
                        Approval workflow details will be displayed here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Activity Log</CardTitle>
                    <CardDescription>
                      Track all actions performed on this document.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="py-8 text-center">
                      <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground text-sm">
                        Activity log will be displayed here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button
                onClick={() => setSelectedDocument(null)}
                variant="outline"
              >
                Close
              </Button>
              <Button
                onClick={() => onDownload?.(selectedDocument.id)}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              {selectedDocument.status === "PENDING" && (
                <Button onClick={() => setShowApprovalDialog(true)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Review Document
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog */}
      <Dialog onOpenChange={setShowUploadDialog} open={showUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
            <DialogDescription>
              Upload new documents with metadata and categorization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  onValueChange={(value) =>
                    setUploadMetadata({
                      ...uploadMetadata,
                      category: value as DocumentCategory,
                    })
                  }
                  value={uploadMetadata.category}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT_DOCS">
                      Client Documents
                    </SelectItem>
                    <SelectItem value="INTERNAL_DOCS">
                      Internal Documents
                    </SelectItem>
                    <SelectItem value="TEMPLATES">Templates</SelectItem>
                    <SelectItem value="REPORTS">Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documentType">Document Type</Label>
                <Select
                  onValueChange={(value) =>
                    setUploadMetadata({
                      ...uploadMetadata,
                      documentType: value as DocumentType,
                    })
                  }
                  value={uploadMetadata.documentType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TAX_RETURN">Tax Return</SelectItem>
                    <SelectItem value="FINANCIAL_STATEMENT">
                      Financial Statement
                    </SelectItem>
                    <SelectItem value="IMMIGRATION_DOC">
                      Immigration Document
                    </SelectItem>
                    <SelectItem value="LEGAL_DOC">Legal Document</SelectItem>
                    <SelectItem value="COMPLIANCE_DOC">
                      Compliance Document
                    </SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="accessLevel">Access Level</Label>
              <Select
                onValueChange={(value) =>
                  setUploadMetadata({
                    ...uploadMetadata,
                    accessLevel: value as
                      | "PUBLIC"
                      | "RESTRICTED"
                      | "CONFIDENTIAL",
                  })
                }
                value={uploadMetadata.accessLevel}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="RESTRICTED">Restricted</SelectItem>
                  <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                onChange={(e) =>
                  setUploadMetadata({
                    ...uploadMetadata,
                    description: e.target.value,
                  })
                }
                placeholder="Enter document description..."
                rows={3}
                value={uploadMetadata.description || ""}
              />
            </div>

            <div className="rounded-lg border-2 border-muted border-dashed p-8 text-center">
              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 font-medium">
                Drop files here or click to upload
              </p>
              <p className="text-muted-foreground text-sm">
                Supports PDF, DOC, XLS, JPG, PNG up to 25MB each
              </p>
              <input
                className="hidden"
                id="file-upload"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                type="file"
              />
              <label htmlFor="file-upload">
                <Button className="mt-4" variant="outline">
                  Choose Files
                </Button>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => setShowUploadDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog onOpenChange={setShowApprovalDialog} open={showApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Document</DialogTitle>
            <DialogDescription>
              Review and approve or reject the uploaded document.
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedDocument.mimeType)}
                  <div>
                    <p className="font-medium">
                      {selectedDocument.originalName}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formatFileSize(selectedDocument.fileSize)} • Uploaded by{" "}
                      {selectedDocument.uploadedBy}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="reviewComments">Review Comments</Label>
                <Textarea
                  id="reviewComments"
                  placeholder="Add your review comments..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowApprovalDialog(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    onReject?.(selectedDocument.id, "Document rejected");
                    setShowApprovalDialog(false);
                  }}
                  variant="destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    onApprove?.(selectedDocument.id, "Document approved");
                    setShowApprovalDialog(false);
                  }}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
