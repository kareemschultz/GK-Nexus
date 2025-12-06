import {
  AlertTriangle,
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Eye,
  FileIcon,
  FileSpreadsheet,
  FileText,
  Image,
  MoreHorizontal,
  Share2,
  Shield,
  Tag,
  Trash2,
  User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Document } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";

interface DocumentListProps {
  documents: Document[];
  viewMode: "grid" | "list";
  selectedDocuments: string[];
  onDocumentSelect: (documentId: string) => void;
  onSelectAll: (selected: boolean) => void;
  onDocumentAction: (action: string, documentId: string) => void;
  isLoading?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-4 w-4 text-purple-600" />;
  }
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  }
  if (mimeType.includes("pdf")) {
    return <FileText className="h-4 w-4 text-red-600" />;
  }
  return <FileIcon className="h-4 w-4 text-blue-600" />;
};

const getStatusIcon = (status: Document["status"]) => {
  switch (status) {
    case "approved":
      return <CheckCircle2 className="h-3 w-3 text-green-600" />;
    case "review":
      return <Clock className="h-3 w-3 text-yellow-600" />;
    case "draft":
      return <Edit className="h-3 w-3 text-blue-600" />;
    case "archived":
      return <Archive className="h-3 w-3 text-gray-600" />;
    default:
      return <AlertTriangle className="h-3 w-3 text-red-600" />;
  }
};

const DocumentActions = ({
  document,
  onAction,
}: {
  document: Document;
  onAction: (action: string) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Open menu</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onAction("view")}>
        <Eye className="mr-2 h-4 w-4" />
        View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onAction("download")}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </DropdownMenuItem>
      {document.permissions.write && (
        <DropdownMenuItem onClick={() => onAction("edit")}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
      )}
      {document.permissions.share && (
        <DropdownMenuItem onClick={() => onAction("share")}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      {document.permissions.delete && (
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => onAction("delete")}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);

const GridViewCard = ({
  document,
  isSelected,
  onSelect,
  onAction,
}: {
  document: Document;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: string) => void;
}) => (
  <div
    className={cn(
      "group relative cursor-pointer rounded-lg border p-4 transition-all hover:shadow-md",
      isSelected && "bg-blue-50/50 ring-2 ring-blue-500"
    )}
    onClick={onSelect}
  >
    <div className="absolute top-3 left-3">
      <Checkbox
        checked={isSelected}
        onChange={onSelect}
        onClick={(e) => e.stopPropagation()}
      />
    </div>

    <div className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100">
      <DocumentActions document={document} onAction={onAction} />
    </div>

    <div className="mt-8 flex flex-col items-center space-y-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
        {getFileIcon(document.mimeType)}
      </div>

      <div className="w-full space-y-1 text-center">
        <div className="flex items-center justify-center gap-2">
          <h3
            className="max-w-[150px] truncate font-medium text-sm"
            title={document.name}
          >
            {document.name}
          </h3>
          {document.isConfidential && (
            <Shield className="h-3 w-3 flex-shrink-0 text-red-500" />
          )}
        </div>

        <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs">
          {getStatusIcon(document.status)}
          <span className="capitalize">{document.status}</span>
        </div>

        <p className="text-muted-foreground text-xs">
          {formatFileSize(document.size)}
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-1">
        {document.tags.slice(0, 2).map((tag) => (
          <Badge className="text-xs" key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
        {document.tags.length > 2 && (
          <Badge className="text-xs" variant="secondary">
            +{document.tags.length - 2}
          </Badge>
        )}
      </div>
    </div>
  </div>
);

export const DocumentList = ({
  documents,
  viewMode,
  selectedDocuments,
  onDocumentSelect,
  onSelectAll,
  onDocumentAction,
  isLoading,
  className,
}: DocumentListProps) => {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    if (!sortConfig) return 0;

    const aValue = a[sortConfig.key as keyof Document];
    const bValue = b[sortConfig.key as keyof Document];

    if (aValue === undefined || bValue === undefined) return 0;

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  const allSelected =
    documents.length > 0 && selectedDocuments.length === documents.length;
  const someSelected =
    selectedDocuments.length > 0 && selectedDocuments.length < documents.length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: viewMode === "grid" ? 8 : 5 }).map((_, i) => (
          <div
            className={cn(
              "animate-pulse rounded-lg bg-muted",
              viewMode === "grid" ? "h-48" : "h-16"
            )}
            key={i}
          />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="font-medium text-lg">No documents found</h3>
        <p className="text-muted-foreground">
          Upload some documents to get started
        </p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-4">
          <Checkbox
            checked={
              allSelected ? true : someSelected ? "indeterminate" : false
            }
            onCheckedChange={(checked) => onSelectAll(!!checked)}
          />
          <span className="text-muted-foreground text-sm">
            {selectedDocuments.length} of {documents.length} selected
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {sortedDocuments.map((document) => (
            <GridViewCard
              document={document}
              isSelected={selectedDocuments.includes(document.id)}
              key={document.id}
              onAction={(action) => onDocumentAction(action, document.id)}
              onSelect={() => onDocumentSelect(document.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-4">
        <Checkbox
          checked={allSelected ? true : someSelected ? "indeterminate" : false}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
        />
        <span className="text-muted-foreground text-sm">
          {selectedDocuments.length} of {documents.length} selected
        </span>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]" />
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-2">
                Name
                {sortConfig?.key === "name" && (
                  <span className="text-xs">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("type")}
            >
              <div className="flex items-center gap-2">
                Type
                {sortConfig?.key === "type" && (
                  <span className="text-xs">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("size")}
            >
              <div className="flex items-center gap-2">
                Size
                {sortConfig?.key === "size" && (
                  <span className="text-xs">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Client</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("uploadDate")}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Upload Date
                {sortConfig?.key === "uploadDate" && (
                  <span className="text-xs">
                    {sortConfig.direction === "asc" ? "↑" : "↓"}
                  </span>
                )}
              </div>
            </TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDocuments.map((document) => (
            <TableRow
              className={cn(
                "cursor-pointer",
                selectedDocuments.includes(document.id) && "bg-muted/50"
              )}
              key={document.id}
            >
              <TableCell>
                <Checkbox
                  checked={selectedDocuments.includes(document.id)}
                  onChange={() => onDocumentSelect(document.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  {getFileIcon(document.mimeType)}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">
                        {document.name}
                      </span>
                      {document.isConfidential && (
                        <Shield className="h-3 w-3 flex-shrink-0 text-red-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <User className="h-3 w-3" />
                      {document.createdBy}
                      <span>•</span>
                      <span>v{document.version}</span>
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {document.type}
              </TableCell>
              <TableCell className="text-sm">
                {formatFileSize(document.size)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(document.status)}
                  <Badge
                    className="capitalize"
                    variant={
                      document.status === "approved"
                        ? "default"
                        : document.status === "review"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {document.status}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {document.client || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatDate(document.uploadDate)}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {document.tags.slice(0, 2).map((tag) => (
                    <Badge className="text-xs" key={tag} variant="outline">
                      <Tag className="mr-1 h-2 w-2" />
                      {tag}
                    </Badge>
                  ))}
                  {document.tags.length > 2 && (
                    <Badge className="text-xs" variant="outline">
                      +{document.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DocumentActions
                  document={document}
                  onAction={(action) => onDocumentAction(action, document.id)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
