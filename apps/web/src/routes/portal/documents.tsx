import { createFileRoute } from "@tanstack/react-router";
import {
  Calendar,
  Download,
  Eye,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Filter,
  Folder,
  Grid,
  Image,
  List,
  MoreVertical,
  Search,
  Share2,
  SortAsc,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
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

const mockDocuments = [
  {
    id: 1,
    name: "Q3 2024 Tax Return",
    type: "Tax Filing",
    fileType: "pdf",
    size: "2.4 MB",
    uploadDate: "2024-10-15",
    status: "Filed",
    category: "tax",
    description: "Quarterly tax return submission for Q3 2024",
  },
  {
    id: 2,
    name: "Business Registration Certificate",
    type: "Legal Document",
    fileType: "pdf",
    size: "850 KB",
    uploadDate: "2024-08-01",
    status: "Active",
    category: "legal",
    description: "Official business registration certificate",
  },
  {
    id: 3,
    name: "October 2024 Financial Statements",
    type: "Financial Report",
    fileType: "xlsx",
    size: "1.8 MB",
    uploadDate: "2024-11-05",
    status: "Reviewed",
    category: "financial",
    description: "Monthly financial statements and P&L",
  },
  {
    id: 4,
    name: "VAT Registration Documents",
    type: "Tax Registration",
    fileType: "pdf",
    size: "1.2 MB",
    uploadDate: "2024-07-20",
    status: "Approved",
    category: "tax",
    description: "VAT registration application and approval",
  },
  {
    id: 5,
    name: "Employee Handbook 2024",
    type: "HR Document",
    fileType: "pdf",
    size: "3.1 MB",
    uploadDate: "2024-01-15",
    status: "Current",
    category: "hr",
    description: "Updated employee handbook and policies",
  },
  {
    id: 6,
    name: "Insurance Policy Documentation",
    type: "Insurance",
    fileType: "pdf",
    size: "920 KB",
    uploadDate: "2024-06-10",
    status: "Active",
    category: "insurance",
    description: "Business insurance policy documents",
  },
  {
    id: 7,
    name: "Compliance Checklist Q4",
    type: "Compliance",
    fileType: "xlsx",
    size: "650 KB",
    uploadDate: "2024-11-01",
    status: "In Progress",
    category: "compliance",
    description: "Q4 2024 compliance requirements checklist",
  },
  {
    id: 8,
    name: "Bank Statements October 2024",
    type: "Banking",
    fileType: "pdf",
    size: "1.5 MB",
    uploadDate: "2024-11-02",
    status: "Reconciled",
    category: "financial",
    description: "Business bank statements for October 2024",
  },
];

const categories = [
  { value: "all", label: "All Categories", count: mockDocuments.length },
  {
    value: "tax",
    label: "Tax Documents",
    count: mockDocuments.filter((d) => d.category === "tax").length,
  },
  {
    value: "financial",
    label: "Financial",
    count: mockDocuments.filter((d) => d.category === "financial").length,
  },
  {
    value: "legal",
    label: "Legal",
    count: mockDocuments.filter((d) => d.category === "legal").length,
  },
  {
    value: "hr",
    label: "HR Documents",
    count: mockDocuments.filter((d) => d.category === "hr").length,
  },
  {
    value: "compliance",
    label: "Compliance",
    count: mockDocuments.filter((d) => d.category === "compliance").length,
  },
  {
    value: "insurance",
    label: "Insurance",
    count: mockDocuments.filter((d) => d.category === "insurance").length,
  },
];

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "pdf":
      return <FileType aria-hidden="true" className="h-5 w-5 text-red-600" />;
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
  switch (status.toLowerCase()) {
    case "filed":
    case "active":
    case "current":
    case "approved":
      return "default";
    case "reviewed":
    case "reconciled":
      return "secondary";
    case "in progress":
      return "outline";
    default:
      return "secondary";
  }
}

function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("uploadDate");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const filteredDocuments = mockDocuments.filter((doc) => {
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

  const handleDownload = (document: (typeof mockDocuments)[0]) => {
    // In real app, this would trigger actual download
    console.log(`Downloading ${document.name}`);
  };

  const handleView = (document: (typeof mockDocuments)[0]) => {
    // In real app, this would open document viewer
    console.log(`Viewing ${document.name}`);
  };

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
                  {mockDocuments.length}
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
                <p className="font-semibold text-2xl text-foreground">6</p>
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
                <p className="font-semibold text-2xl text-foreground">3</p>
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
                  12.8 MB
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
            {mockDocuments.slice(0, 3).map((document) => (
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
