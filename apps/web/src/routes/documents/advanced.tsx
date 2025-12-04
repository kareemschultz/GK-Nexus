import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  FileText,
  FolderOpen,
  FolderTree,
  GitBranch,
  Grid3X3,
  History,
  Layers,
  List,
  Loader2,
  MoreHorizontal,
  Move,
  Plus,
  Search,
  Share2,
  Star,
  Target,
  Trash2,
  Upload,
  User,
  Users,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-states";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents/advanced")({
  component: AdvancedDocumentManagementPage,
});

interface DocumentVersion {
  id: string;
  version: string;
  uploadDate: string;
  uploadedBy: string;
  changes: string;
  size: number;
  downloadUrl: string;
  isActive: boolean;
}

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  documentCount: number;
  lastUpdated: string;
  subcategories?: DocumentCategory[];
}

interface AdvancedDocument {
  id: string;
  name: string;
  description?: string;
  type: string;
  mimeType: string;
  size: number;
  categoryId: string;
  folderId?: string;
  tags: string[];
  status: "draft" | "review" | "approved" | "archived";
  isConfidential: boolean;
  isFavorite: boolean;
  uploadDate: string;
  lastModified: string;
  createdBy: string;
  lastModifiedBy: string;
  clientId?: string;
  versions: DocumentVersion[];
  shareSettings: {
    isShared: boolean;
    sharedWith: string[];
    permissions: "view" | "edit" | "admin";
  };
  metadata: {
    extractedText?: string;
    ocrProcessed: boolean;
    keywords: string[];
    language: string;
    pageCount?: number;
  };
  downloadCount: number;
  viewCount: number;
  collaborators: string[];
}

// Static category reference data
const defaultCategories: DocumentCategory[] = [
  {
    id: "cat-financial",
    name: "Financial Documents",
    description: "Financial reports, statements, and accounting documents",
    color: "bg-green-100 text-green-800",
    icon: "💰",
    documentCount: 0,
    lastUpdated: new Date().toISOString().split("T")[0],
    subcategories: [
      {
        id: "cat-financial-reports",
        name: "Financial Reports",
        description: "Annual, quarterly, and monthly financial reports",
        color: "bg-green-50 text-green-700",
        icon: "📊",
        documentCount: 0,
        lastUpdated: new Date().toISOString().split("T")[0],
      },
      {
        id: "cat-financial-statements",
        name: "Financial Statements",
        description: "Balance sheets, P&L statements, cash flow",
        color: "bg-green-50 text-green-700",
        icon: "📈",
        documentCount: 0,
        lastUpdated: new Date().toISOString().split("T")[0],
      },
    ],
  },
  {
    id: "cat-legal",
    name: "Legal & Compliance",
    description: "Legal documents, contracts, and compliance materials",
    color: "bg-blue-100 text-blue-800",
    icon: "⚖️",
    documentCount: 0,
    lastUpdated: new Date().toISOString().split("T")[0],
  },
  {
    id: "cat-immigration",
    name: "Immigration",
    description:
      "Visa applications, immigration forms, and supporting documents",
    color: "bg-purple-100 text-purple-800",
    icon: "🛂",
    documentCount: 0,
    lastUpdated: new Date().toISOString().split("T")[0],
    subcategories: [
      {
        id: "cat-immigration-visas",
        name: "Visa Applications",
        description: "Various types of visa application documents",
        color: "bg-purple-50 text-purple-700",
        icon: "📝",
        documentCount: 0,
        lastUpdated: new Date().toISOString().split("T")[0],
      },
      {
        id: "cat-immigration-supporting",
        name: "Supporting Documents",
        description: "Passport copies, photos, medical exams",
        color: "bg-purple-50 text-purple-700",
        icon: "📄",
        documentCount: 0,
        lastUpdated: new Date().toISOString().split("T")[0],
      },
    ],
  },
  {
    id: "cat-clients",
    name: "Client Documents",
    description: "Client-specific files and communications",
    color: "bg-orange-100 text-orange-800",
    icon: "👥",
    documentCount: 0,
    lastUpdated: new Date().toISOString().split("T")[0],
  },
];

const viewModes = [
  { value: "grid", label: "Grid", icon: Grid3X3 },
  { value: "list", label: "List", icon: List },
  { value: "category", label: "Category", icon: FolderTree },
] as const;

type ViewMode = (typeof viewModes)[number]["value"];

function AdvancedDocumentManagementPage() {
  const [activeTab, setActiveTab] = useState("documents");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("lastModified");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<AdvancedDocument | null>(null);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [draggedDocument, setDraggedDocument] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);

  // Fetch documents from API
  const { data: documentsResponse, isLoading } = useQuery({
    queryKey: ["documents", "list"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.documents.list({});
    },
  });

  // Map API response to component format
  const documents: AdvancedDocument[] = useMemo(() => {
    const apiDocs = documentsResponse?.data?.items || [];
    return apiDocs.map((doc: any) => ({
      id: doc.id,
      name: doc.name || doc.filename,
      description: doc.description,
      type: doc.type || "Document",
      mimeType: doc.mimeType || "application/pdf",
      size: doc.size || 0,
      categoryId: mapCategoryId(doc.category),
      folderId: doc.folderId,
      tags: doc.tags || [],
      status: doc.status || "draft",
      isConfidential: doc.isConfidential,
      isFavorite: doc.isFavorite,
      uploadDate: doc.uploadedAt || doc.createdAt || new Date().toISOString(),
      lastModified: doc.updatedAt || doc.createdAt || new Date().toISOString(),
      createdBy: doc.createdBy || "System",
      lastModifiedBy: doc.lastModifiedBy || doc.createdBy || "System",
      clientId: doc.clientId,
      versions: doc.versions || [
        {
          id: `ver-${doc.id}-1`,
          version: "1.0",
          uploadDate: doc.createdAt || new Date().toISOString(),
          uploadedBy: doc.createdBy || "System",
          changes: "Initial version",
          size: doc.size || 0,
          downloadUrl: `/documents/${doc.id}/download`,
          isActive: true,
        },
      ],
      shareSettings: doc.shareSettings || {
        isShared: false,
        sharedWith: [],
        permissions: "view",
      },
      metadata: {
        extractedText: doc.extractedText,
        ocrProcessed: doc.ocrProcessed,
        keywords: doc.keywords || [],
        language: doc.language || "en",
        pageCount: doc.pageCount,
      },
      downloadCount: doc.downloadCount || 0,
      viewCount: doc.viewCount || 0,
      collaborators: doc.collaborators || [],
    }));
  }, [documentsResponse]);

  // Calculate category counts from documents
  const categories: DocumentCategory[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doc of documents) {
      counts[doc.categoryId] = (counts[doc.categoryId] || 0) + 1;
    }

    return defaultCategories.map((cat) => ({
      ...cat,
      documentCount:
        counts[cat.id] ||
        (cat.subcategories?.reduce(
          (sum, sub) => sum + (counts[sub.id] || 0),
          0
        ) ??
          0),
      subcategories: cat.subcategories?.map((sub) => ({
        ...sub,
        documentCount: counts[sub.id] || 0,
      })),
    }));
  }, [documents]);

  function mapCategoryId(category?: string): string {
    if (!category) return "cat-clients";
    const catLower = category.toLowerCase();
    if (catLower.includes("financial") || catLower.includes("tax"))
      return "cat-financial";
    if (catLower.includes("legal") || catLower.includes("compliance"))
      return "cat-legal";
    if (catLower.includes("immigration") || catLower.includes("visa"))
      return "cat-immigration";
    return "cat-clients";
  }

  const handleDragStart = useCallback((documentId: string) => {
    setDraggedDocument(documentId);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, categoryId: string) => {
      e.preventDefault();
      setDragOverCategory(categoryId);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setDragOverCategory(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetCategoryId: string) => {
      e.preventDefault();
      if (draggedDocument && targetCategoryId !== dragOverCategory) {
        const { toast } = require("sonner");
        toast.success("Category updated", {
          description: "Document moved to new category",
        });
      }
      setDraggedDocument(null);
      setDragOverCategory(null);
    },
    [draggedDocument, dragOverCategory]
  );

  const filteredDocuments = useMemo(
    () =>
      documents
        .filter((doc) => {
          const matchesSearch =
            doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description
              ?.toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            doc.tags.some((tag) =>
              tag.toLowerCase().includes(searchQuery.toLowerCase())
            ) ||
            doc.metadata.keywords.some((keyword) =>
              keyword.toLowerCase().includes(searchQuery.toLowerCase())
            );

          const matchesCategory =
            selectedCategory === "all" || doc.categoryId === selectedCategory;

          const matchesStatus =
            selectedStatus === "all" || doc.status === selectedStatus;

          return matchesSearch && matchesCategory && matchesStatus;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "name":
              return a.name.localeCompare(b.name);
            case "lastModified":
              return (
                new Date(b.lastModified).getTime() -
                new Date(a.lastModified).getTime()
              );
            case "uploadDate":
              return (
                new Date(b.uploadDate).getTime() -
                new Date(a.uploadDate).getTime()
              );
            case "size":
              return b.size - a.size;
            case "downloads":
              return b.downloadCount - a.downloadCount;
            default:
              return 0;
          }
        }),
    [documents, searchQuery, selectedCategory, selectedStatus, sortBy]
  );

  const handleDocumentClick = (document: AdvancedDocument) => {
    setSelectedDocument(document);
    setIsDocumentDialogOpen(true);
  };

  const handleVersionHistoryClick = (document: AdvancedDocument) => {
    setSelectedDocument(document);
    setIsVersionHistoryOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleString();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "review":
        return "text-orange-600 bg-orange-100";
      case "draft":
        return "text-blue-600 bg-blue-100";
      case "archived":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = categories.find(
      (cat) =>
        cat.id === categoryId ||
        cat.subcategories?.some((sub) => sub.id === categoryId)
    );
    return category?.icon || "📄";
  };

  const DocumentCard = ({ document }: { document: AdvancedDocument }) => (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-lg",
        selectedDocuments.includes(document.id) && "ring-2 ring-blue-500",
        draggedDocument === document.id && "opacity-50"
      )}
      draggable
      onClick={() => handleDocumentClick(document)}
      onDragStart={() => handleDragStart(document.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {getCategoryIcon(document.categoryId)}
            </span>
            {document.isFavorite && (
              <Star className="h-4 w-4 fill-current text-yellow-500" />
            )}
            {document.isConfidential && (
              <Badge className="text-xs" variant="destructive">
                Confidential
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                size="sm"
                variant="ghost"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDocumentClick(document)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleVersionHistoryClick(document)}
              >
                <History className="mr-2 h-4 w-4" />
                Version History
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Move className="mr-2 h-4 w-4" />
                Move to Category
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          <CardTitle className="line-clamp-2 text-sm">
            {document.name}
          </CardTitle>
          {document.description && (
            <p className="line-clamp-2 text-muted-foreground text-xs">
              {document.description}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <Badge className={cn("text-xs", getStatusColor(document.status))}>
            {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
          </Badge>
          <span className="text-muted-foreground">
            v{document.versions[0]?.version}
          </span>
        </div>

        <div className="space-y-2 text-muted-foreground text-xs">
          <div className="flex items-center justify-between">
            <span>Size: {formatFileSize(document.size)}</span>
            <span>{document.downloadCount} downloads</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Modified: {formatDate(document.lastModified)}</span>
            <span>{document.viewCount} views</span>
          </div>
        </div>

        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {document.tags.slice(0, 3).map((tag) => (
              <Badge className="text-xs" key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
            {document.tags.length > 3 && (
              <Badge className="text-xs" variant="outline">
                +{document.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Users className="h-3 w-3" />
          <span>{document.collaborators.length} collaborators</span>
          {document.shareSettings.isShared && (
            <>
              <span>•</span>
              <Share2 className="h-3 w-3" />
              <span>Shared</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const CategorySection = ({ category }: { category: DocumentCategory }) => {
    const categoryDocs = filteredDocuments.filter(
      (doc) =>
        doc.categoryId === category.id ||
        category.subcategories?.some((sub) => sub.id === doc.categoryId)
    );

    return (
      <div
        className={cn(
          "space-y-4 rounded-lg border-2 border-dashed p-4 transition-colors",
          dragOverCategory === category.id
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200"
        )}
        onDragLeave={handleDragLeave}
        onDragOver={(e) => handleDragOver(e, category.id)}
        onDrop={(e) => handleDrop(e, category.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{category.icon}</span>
            <div>
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-muted-foreground text-sm">
                {category.description}
              </p>
            </div>
          </div>
          <Badge className={category.color}>
            {categoryDocs.length} documents
          </Badge>
        </div>

        {categoryDocs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryDocs.map((document) => (
              <DocumentCard document={document} key={document.id} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FolderOpen className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              No documents in this category
            </p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-full px-4 py-6">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button asChild size="sm" variant="ghost">
            <Link to="/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">
              Advanced Document Management
            </h1>
            <p className="text-muted-foreground">
              Organize, categorize, and track document versions with advanced
              features
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/documents/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Link>
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{documents.length}</div>
            <p className="text-muted-foreground text-xs">
              {documents.filter((d) => d.status === "approved").length} approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Categories</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {categories.length +
                categories.reduce(
                  (acc, cat) => acc + (cat.subcategories?.length || 0),
                  0
                )}
            </div>
            <p className="text-muted-foreground text-xs">
              Including subcategories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Storage Used</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatFileSize(
                documents.reduce((acc, doc) => acc + doc.size, 0)
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Across all documents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Versions
            </CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {documents.reduce((acc, doc) => acc + doc.versions.length, 0)}
            </div>
            <p className="text-muted-foreground text-xs">
              Version history entries
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        className="space-y-6"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                value={searchQuery}
              />
            </div>

            <Select
              onValueChange={setSelectedCategory}
              value={selectedCategory}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <div key={category.id}>
                    <SelectItem value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </div>
                    </SelectItem>
                    {category.subcategories?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        <div className="flex items-center gap-2 pl-4">
                          <span>{sub.icon}</span>
                          {sub.name}
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>

            <Select onValueChange={setSelectedStatus} value={selectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={setSortBy} value={sortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastModified">Last Modified</SelectItem>
                <SelectItem value="uploadDate">Upload Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="size">Size</SelectItem>
                <SelectItem value="downloads">Downloads</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border">
              {viewModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Button
                    className={cn(
                      "h-9 border-0 px-3",
                      viewMode === mode.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent"
                    )}
                    key={mode.value}
                    onClick={() => setViewMode(mode.value)}
                    size="sm"
                    variant="ghost"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="sr-only">{mode.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <TabsContent className="space-y-6" value="documents">
          {filteredDocuments.length === 0 ? (
            <EmptyState
              description="No documents found matching your criteria"
              icon={FileText}
              title="No Documents"
            />
          ) : (
            <>
              {viewMode === "category" ? (
                <div className="space-y-8">
                  {categories.map((category) => (
                    <CategorySection category={category} key={category.id} />
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    viewMode === "grid"
                      ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "space-y-4"
                  )}
                >
                  {filteredDocuments.map((document) => (
                    <DocumentCard document={document} key={document.id} />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent className="space-y-6" value="categories">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card
                className="group cursor-pointer transition-shadow hover:shadow-md"
                key={category.id}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <CardTitle className="text-lg">
                          {category.name}
                        </CardTitle>
                        <p className="text-muted-foreground text-sm">
                          {category.description}
                        </p>
                      </div>
                    </div>
                    <Button
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      size="sm"
                      variant="ghost"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge className={category.color}>
                      {category.documentCount} documents
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                      Updated {formatDate(category.lastUpdated)}
                    </span>
                  </div>

                  {category.subcategories &&
                    category.subcategories.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Subcategories</h4>
                        <div className="space-y-1">
                          {category.subcategories.map((sub) => (
                            <div
                              className="flex items-center justify-between rounded-lg bg-muted p-2"
                              key={sub.id}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{sub.icon}</span>
                                <span className="text-sm">{sub.name}</span>
                              </div>
                              <Badge className={sub.color} variant="outline">
                                {sub.documentCount}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent className="space-y-6" value="analytics">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Document Upload Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center text-muted-foreground">
                  Chart placeholder - Document uploads over time
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categories.map((category) => {
                    const percentage =
                      documents.length > 0
                        ? (category.documentCount / documents.length) * 100
                        : 0;
                    return (
                      <div className="space-y-1" key={category.id}>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                          </div>
                          <span>
                            {category.documentCount} docs (
                            {percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Detail Dialog */}
      <Dialog
        onOpenChange={setIsDocumentDialogOpen}
        open={isDocumentDialogOpen}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-lg">
                {selectedDocument &&
                  getCategoryIcon(selectedDocument.categoryId)}
              </span>
              {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.description}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm">
                      Document Information
                    </h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Size:</span>
                        <span>{formatFileSize(selectedDocument.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{selectedDocument.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge
                          className={cn(
                            "text-xs",
                            getStatusColor(selectedDocument.status)
                          )}
                        >
                          {selectedDocument.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Version:</span>
                        <span>v{selectedDocument.versions[0]?.version}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm">Activity</h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Downloads:
                        </span>
                        <span>{selectedDocument.downloadCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Views:</span>
                        <span>{selectedDocument.viewCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Collaborators:
                        </span>
                        <span>{selectedDocument.collaborators.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm">Metadata</h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Language:</span>
                        <span>
                          {selectedDocument.metadata.language.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          OCR Processed:
                        </span>
                        <span>
                          {selectedDocument.metadata.ocrProcessed
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                      {selectedDocument.metadata.pageCount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pages:</span>
                          <span>{selectedDocument.metadata.pageCount}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm">Sharing</h4>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shared:</span>
                        <span>
                          {selectedDocument.shareSettings.isShared
                            ? "Yes"
                            : "No"}
                        </span>
                      </div>
                      {selectedDocument.shareSettings.isShared && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Shared with:
                            </span>
                            <span>
                              {selectedDocument.shareSettings.sharedWith.length}{" "}
                              users
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Permissions:
                            </span>
                            <Badge variant="outline">
                              {selectedDocument.shareSettings.permissions}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm">Tags & Keywords</h4>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-muted-foreground text-xs">Tags:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedDocument.tags.map((tag) => (
                        <Badge
                          className="text-xs"
                          key={tag}
                          variant="secondary"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Keywords:
                    </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedDocument.metadata.keywords.map((keyword) => (
                        <Badge
                          className="text-xs"
                          key={keyword}
                          variant="outline"
                        >
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-medium text-sm">Recent Versions</h4>
                <div className="space-y-2">
                  {selectedDocument.versions.slice(0, 3).map((version) => (
                    <div
                      className="flex items-center justify-between rounded-lg border p-3"
                      key={version.id}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={version.isActive ? "default" : "secondary"}
                          >
                            v{version.version}
                          </Badge>
                          {version.isActive && (
                            <span className="text-green-600 text-xs">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {version.changes}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDateTime(version.uploadDate)} by{" "}
                          {version.uploadedBy}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {formatFileSize(version.size)}
                        </span>
                        <Button size="sm" variant="outline">
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {selectedDocument.versions.length > 3 && (
                    <Button
                      className="w-full"
                      onClick={() =>
                        handleVersionHistoryClick(selectedDocument)
                      }
                      variant="outline"
                    >
                      View All Versions ({selectedDocument.versions.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setIsDocumentDialogOpen(false)}
              variant="outline"
            >
              Close
            </Button>
            <Button
              onClick={() => handleVersionHistoryClick(selectedDocument!)}
            >
              <History className="mr-2 h-4 w-4" />
              Version History
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog
        onOpenChange={setIsVersionHistoryOpen}
        open={isVersionHistoryOpen}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History - {selectedDocument?.name}
            </DialogTitle>
            <DialogDescription>
              Complete version history with changes and download options
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="max-h-96 space-y-4 overflow-y-auto">
              {selectedDocument.versions.map((version, index) => (
                <div className="relative" key={version.id}>
                  {index < selectedDocument.versions.length - 1 && (
                    <div className="absolute top-12 left-6 h-full w-px bg-border" />
                  )}

                  <div className="flex items-start gap-4 rounded-lg border p-4">
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-full border-2",
                        version.isActive
                          ? "border-green-500 bg-green-100 text-green-700"
                          : "border-gray-300 bg-gray-100 text-gray-600"
                      )}
                    >
                      <GitBranch className="h-5 w-5" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={version.isActive ? "default" : "secondary"}
                          >
                            Version {version.version}
                          </Badge>
                          {version.isActive && (
                            <Badge className="text-green-600" variant="outline">
                              Current
                            </Badge>
                          )}
                        </div>
                        <span className="text-muted-foreground text-sm">
                          {formatFileSize(version.size)}
                        </span>
                      </div>

                      <p className="text-sm">{version.changes}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-muted-foreground text-xs">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{version.uploadedBy}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDateTime(version.uploadDate)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-3 w-3" />
                            Preview
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="mr-2 h-3 w-3" />
                            Download
                          </Button>
                          {!version.isActive && (
                            <Button size="sm" variant="outline">
                              Restore
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button
              onClick={() => setIsVersionHistoryOpen(false)}
              variant="outline"
            >
              Close
            </Button>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload New Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
