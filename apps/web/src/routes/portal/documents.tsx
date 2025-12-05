import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Download,
  Eye,
  File,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder,
  Grid,
  Image,
  List,
  Loader2,
  MoreVertical,
  Search,
  Share2,
  SortAsc,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export const Route = createFileRoute("/portal/documents")({
  component: DocumentsPage,
});

interface DocumentView {
  id: string;
  name: string;
  type: string;
  fileType: string;
  size: string;
  uploadDate: string;
  status: string;
  category: string;
  description: string;
}

function getFileIcon(fileType: string) {
  switch (fileType?.toLowerCase()) {
    case "pdf":
      return <File aria-hidden="true" className="h-5 w-5 text-red-600" />;
    case "xlsx":
    case "xls":
      return (
        <FileSpreadsheet
          aria-hidden="true"
          className="h-5 w-5 text-green-600"
        />
      );
    case "jpg":
    case "jpeg":
    case "png":
      return <Image aria-hidden="true" className="h-5 w-5 text-blue-600" />;
    default:
      return <FileIcon aria-hidden="true" className="h-5 w-5 text-gray-600" />;
  }
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case "filed":
    case "active":
    case "current":
    case "approved":
      return "default";
    case "reviewed":
    case "reconciled":
      return "secondary";
    case "in progress":
    case "draft":
      return "outline";
    default:
      return "secondary";
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("uploadDate");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // Fetch documents from API
  const { data: documentsResponse, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.documentList({ page: 1, limit: 100 });
    },
  });

  // Map API response to component format
  const documents: DocumentView[] = useMemo(
    () =>
      (documentsResponse?.data?.items || []).map((doc: any) => {
        const extension =
          doc.fileName?.split(".").pop()?.toLowerCase() || "pdf";
        return {
          id: doc.id,
          name: doc.fileName || doc.title || "Untitled Document",
          type: doc.documentType || "Document",
          fileType: extension,
          size: formatFileSize(doc.fileSize || 0),
          uploadDate:
            doc.createdAt || doc.uploadDate || new Date().toISOString(),
          status: doc.status || "active",
          category: doc.category?.toLowerCase() || "other",
          description: doc.description || "",
        };
      }),
    [documentsResponse]
  );

  // Build categories from documents data
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    categoryMap.set("all", documents.length);

    for (const doc of documents) {
      const cat = doc.category;
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }

    const result = [
      { value: "all", label: "All Categories", count: documents.length },
    ];

    const categoryLabels: Record<string, string> = {
      tax: "Tax Documents",
      financial: "Financial",
      legal: "Legal",
      hr: "HR Documents",
      compliance: "Compliance",
      insurance: "Insurance",
      other: "Other",
    };

    for (const [value, count] of categoryMap) {
      if (value !== "all" && count > 0) {
        result.push({
          value,
          label: categoryLabels[value] || value,
          count,
        });
      }
    }

    return result;
  }, [documents]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "type":
        return a.type.localeCompare(b.type);
      case "uploadDate":
        return (
          new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
        );
      case "size": {
        const aSize = Number.parseFloat(a.size.split(" ")[0]);
        const bSize = Number.parseFloat(b.size.split(" ")[0]);
        return bSize - aSize;
      }
      default:
        return 0;
    }
  });

  const handleDownload = (document: DocumentView) => {
    const { toast } = require("sonner");
    toast.success("Download started", {
      description: `Downloading ${document.name}`,
    });
  };

  const handleView = (document: DocumentView) => {
    const { toast } = require("sonner");
    toast.info("Opening document", {
      description: `Opening ${document.name} in viewer`,
    });
  };

  // Calculate stats
  const totalSize = documents.reduce((sum, doc) => {
    const size = Number.parseFloat(doc.size.split(" ")[0]);
    const unit = doc.size.split(" ")[1];
    let bytes = size;
    if (unit === "KB") bytes = size * 1024;
    if (unit === "MB") bytes = size * 1024 * 1024;
    return sum + bytes;
  }, 0);

  const thisMonth = documents.filter((doc) => {
    const docDate = new Date(doc.uploadDate);
    const now = new Date();
    return (
      docDate.getMonth() === now.getMonth() &&
      docDate.getFullYear() === now.getFullYear()
    );
  }).length;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <h1 className="font-bold text-3xl text-foreground">
            Document Library
          </h1>
          <p className="text-muted-foreground">
            Access and manage your files, tax documents, and important papers
          </p>
        </div>
        <Button aria-label="Upload new document">
          <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-blue-50 p-2 dark:bg-blue-950">
                <FileText
                  aria-hidden="true"
                  className="h-4 w-4 text-blue-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {documents.length}
                </p>
                <p className="text-muted-foreground text-xs">Total Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-green-50 p-2 dark:bg-green-950">
                <Folder aria-hidden="true" className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {categories.length - 1}
                </p>
                <p className="text-muted-foreground text-xs">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-amber-50 p-2 dark:bg-amber-950">
                <Calendar
                  aria-hidden="true"
                  className="h-4 w-4 text-amber-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {thisMonth}
                </p>
                <p className="text-muted-foreground text-xs">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="rounded-full bg-purple-50 p-2 dark:bg-purple-950">
                <Download
                  aria-hidden="true"
                  className="h-4 w-4 text-purple-600"
                />
              </div>
              <div>
                <p className="font-semibold text-2xl text-foreground">
                  {formatFileSize(totalSize)}
                </p>
                <p className="text-muted-foreground text-xs">Total Size</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle>Documents</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                aria-label="Grid view"
                onClick={() => setViewMode("grid")}
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
              >
                <Grid aria-hidden="true" className="h-4 w-4" />
              </Button>
              <Button
                aria-label="List view"
                onClick={() => setViewMode("list")}
                size="sm"
                variant={viewMode === "list" ? "default" : "ghost"}
              >
                <List aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground"
              />
              <Input
                aria-label="Search documents"
                className="pl-10"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                value={searchQuery}
              />
            </div>
            <Select
              onValueChange={setSelectedCategory}
              value={selectedCategory}
            >
              <SelectTrigger
                aria-label="Filter by category"
                className="w-full sm:w-48"
              >
                <Filter aria-hidden="true" className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={setSortBy} value={sortBy}>
              <SelectTrigger
                aria-label="Sort documents"
                className="w-full sm:w-48"
              >
                <SortAsc aria-hidden="true" className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uploadDate">Latest First</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="type">Type</SelectItem>
                <SelectItem value="size">Size</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewMode === "list" ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDocuments.map((document) => (
                    <TableRow className="hover:bg-muted/50" key={document.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {getFileIcon(document.fileType)}
                          <div>
                            <p className="font-medium text-foreground">
                              {document.name}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {document.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{document.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {document.size}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(document.uploadDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            aria-label={`View ${document.name}`}
                            onClick={() => handleView(document)}
                            size="sm"
                            variant="ghost"
                          >
                            <Eye aria-hidden="true" className="h-4 w-4" />
                          </Button>
                          <Button
                            aria-label={`Download ${document.name}`}
                            onClick={() => handleDownload(document)}
                            size="sm"
                            variant="ghost"
                          >
                            <Download aria-hidden="true" className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-label={`More actions for ${document.name}`}
                                size="sm"
                                variant="ghost"
                              >
                                <MoreVertical
                                  aria-hidden="true"
                                  className="h-4 w-4"
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleView(document)}
                              >
                                <Eye
                                  aria-hidden="true"
                                  className="mr-2 h-4 w-4"
                                />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDownload(document)}
                              >
                                <Download
                                  aria-hidden="true"
                                  className="mr-2 h-4 w-4"
                                />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2
                                  aria-hidden="true"
                                  className="mr-2 h-4 w-4"
                                />
                                Share
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2
                                  aria-hidden="true"
                                  className="mr-2 h-4 w-4"
                                />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sortedDocuments.map((document) => (
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  key={document.id}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(document.fileType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-medium text-foreground text-sm">
                          {document.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                          {document.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className="text-xs" variant="outline">
                              {document.type}
                            </Badge>
                            <Badge
                              className="text-xs"
                              variant={getStatusColor(document.status)}
                            >
                              {document.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              aria-label={`View ${document.name}`}
                              onClick={() => handleView(document)}
                              size="sm"
                              variant="ghost"
                            >
                              <Eye aria-hidden="true" className="h-4 w-4" />
                            </Button>
                            <Button
                              aria-label={`Download ${document.name}`}
                              onClick={() => handleDownload(document)}
                              size="sm"
                              variant="ghost"
                            >
                              <Download
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-muted-foreground text-xs">
                          <span>{document.size}</span>
                          <span>
                            {new Date(document.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {sortedDocuments.length === 0 && (
            <div className="py-12 text-center">
              <FileText
                aria-hidden="true"
                className="mx-auto mb-4 h-12 w-12 text-muted-foreground"
              />
              <h3 className="mb-2 font-medium text-foreground text-lg">
                No documents found
              </h3>
              <p className="mb-4 text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Upload your first document to get started."}
              </p>
              <Button>
                <Upload aria-hidden="true" className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Uploads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Uploads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documents.slice(0, 3).map((document) => (
              <div
                className="flex items-center space-x-4 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                key={document.id}
              >
                {getFileIcon(document.fileType)}
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm">
                    {document.name}
                  </h4>
                  <p className="text-muted-foreground text-xs">
                    Uploaded{" "}
                    {new Date(document.uploadDate).toLocaleDateString()} •{" "}
                    {document.size}
                  </p>
                </div>
                <Badge variant={getStatusColor(document.status)}>
                  {document.status}
                </Badge>
                <div className="flex items-center space-x-1">
                  <Button
                    aria-label={`View ${document.name}`}
                    onClick={() => handleView(document)}
                    size="sm"
                    variant="ghost"
                  >
                    <Eye aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <Button
                    aria-label={`Download ${document.name}`}
                    onClick={() => handleDownload(document)}
                    size="sm"
                    variant="ghost"
                  >
                    <Download aria-hidden="true" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
