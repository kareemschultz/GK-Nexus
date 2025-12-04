import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Download,
  FileText,
  Filter,
  FolderPlus,
  Grid3X3,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";
import { DocumentList } from "@/components/documents/document-list";
import { FolderTree } from "@/components/documents/folder-tree";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useDocuments } from "@/hooks/useDocuments";

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
});

function DocumentsPage() {
  const {
    documents: allDocuments,
    folderTree,
    isLoading,
    error,
    getDocuments,
    createFolder,
  } = useDocuments();

  const [documents, setDocuments] = useState(allDocuments);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentFolderParent, setCurrentFolderParent] = useState<string>();

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

  useEffect(() => {
    const loadDocuments = async () => {
      const filter = {
        search: searchQuery,
        folderId: selectedFolderId,
      };
      const filteredDocs = await getDocuments(filter);
      setDocuments(filteredDocs);
    };

    loadDocuments();
  }, [searchQuery, selectedFolderId, getDocuments]);

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = (selected: boolean) => {
    setSelectedDocuments(selected ? documents.map((doc) => doc.id) : []);
  };

  const handleDocumentAction = (action: string, documentId: string) => {
    const { toast } = require("sonner");
    toast.success(`${action} completed`, {
      description: `Document action "${action}" has been applied`,
    });
  };

  const handleBulkAction = (action: string) => {
    const { toast } = require("sonner");
    toast.success(`Bulk ${action} completed`, {
      description: `${action} applied to ${selectedDocuments.length} documents`,
    });
  };

  const handleCreateFolder = async (parentId?: string) => {
    setCurrentFolderParent(parentId);
    setIsCreateFolderOpen(true);
  };

  const handleSubmitFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder(newFolderName, currentFolderParent);
      setNewFolderName("");
      setIsCreateFolderOpen(false);
      setCurrentFolderParent(undefined);
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  return (
    <div className="container mx-auto max-w-full px-4 py-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold text-3xl tracking-tight">Documents</h1>
            <p className="text-muted-foreground">
              Manage and organize all your business documents
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link to="/documents/search">
                <Search className="mr-2 h-4 w-4" />
                Advanced Search
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleCreateFolder()}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Folder
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/documents/upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Documents
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/documents/templates">
                    <FileText className="mr-2 h-4 w-4" />
                    Document Templates
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button asChild>
              <Link to="/documents/upload">
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{allDocuments.length}</div>
            <p className="text-muted-foreground text-xs">All files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Confidential</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {allDocuments.filter((doc) => doc.isConfidential).length}
            </div>
            <p className="text-muted-foreground text-xs">Secure files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Storage Used</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {formatFileSize(
                allDocuments.reduce((total, doc) => total + doc.size, 0)
              )}
            </div>
            <p className="text-muted-foreground text-xs">Total size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Pending Review
            </CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">
              {allDocuments.filter((doc) => doc.status === "review").length}
            </div>
            <p className="text-muted-foreground text-xs">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute top-2.5 left-2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              value={searchQuery}
            />
          </div>

          {/* Folder Tree */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Folders</CardTitle>
            </CardHeader>
            <CardContent>
              <FolderTree
                folders={folderTree}
                onCreateFolder={handleCreateFolder}
                onFolderSelect={setSelectedFolderId}
                selectedFolderId={selectedFolderId}
              />
            </CardContent>
          </Card>

          {/* Quick Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="h-8 w-full justify-start text-sm"
                onClick={() => setSearchQuery("")}
                variant="ghost"
              >
                <FileText className="mr-2 h-4 w-4" />
                All Documents
              </Button>
              <Button
                className="h-8 w-full justify-start text-sm"
                onClick={() => setSearchQuery("status:review")}
                variant="ghost"
              >
                <Shield className="mr-2 h-4 w-4" />
                Needs Review
              </Button>
              <Button
                className="h-8 w-full justify-start text-sm"
                onClick={() => setSearchQuery("confidential:true")}
                variant="ghost"
              >
                <Shield className="mr-2 h-4 w-4 text-red-500" />
                Confidential
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold text-lg">
                {selectedFolderId ? "Folder Documents" : "All Documents"}
              </h2>
              <Badge variant="secondary">{documents.length} documents</Badge>
            </div>

            <div className="flex items-center gap-2">
              {selectedDocuments.length > 0 && (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline">
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                        Actions ({selectedDocuments.length})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleBulkAction("download")}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleBulkAction("move")}
                      >
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Move to Folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleBulkAction("delete")}
                      >
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Separator className="h-6" orientation="vertical" />
                </>
              )}

              <Button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                size="sm"
                variant="outline"
              >
                {viewMode === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid3X3 className="h-4 w-4" />
                )}
              </Button>

              <Button asChild size="sm" variant="outline">
                <Link to="/documents/search">
                  <Filter className="mr-2 h-4 w-4" />
                  Advanced Filters
                </Link>
              </Button>
            </div>
          </div>

          {/* Document List */}
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            onDocumentAction={handleDocumentAction}
            onDocumentSelect={handleDocumentSelect}
            onSelectAll={handleSelectAll}
            selectedDocuments={selectedDocuments}
            viewMode={viewMode}
          />
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog onOpenChange={setIsCreateFolderOpen} open={isCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder. It will be created in the
              selected location.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="font-medium text-sm">Folder Name</label>
              <Input
                className="mt-1"
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmitFolder();
                  }
                }}
                placeholder="Enter folder name"
                value={newFolderName}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setIsCreateFolderOpen(false);
                  setNewFolderName("");
                  setCurrentFolderParent(undefined);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                disabled={!newFolderName.trim()}
                onClick={handleSubmitFolder}
              >
                Create Folder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {error && (
        <div className="fixed right-4 bottom-4 rounded-lg bg-destructive p-4 text-destructive-foreground shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
}
