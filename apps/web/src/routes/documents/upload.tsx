import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  FolderOpen,
  Loader2,
  Shield,
  Tags,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { FileUploadZone } from "@/components/documents/file-upload-zone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useDocuments } from "@/hooks/useDocuments";

export const Route = createFileRoute("/documents/upload")({
  component: DocumentUploadPage,
});

interface ClientOption {
  id: string;
  name: string;
}

function DocumentUploadPage() {
  const navigate = useNavigate();
  const { folderTree } = useDocuments();

  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    completed: number;
    total: number;
    currentFile?: string;
  }>({ completed: 0, total: 0 });

  // Fetch clients from API
  const { data: clientsResponse, isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { client } = await import("@/utils/orpc");
      return client.clientList({ page: 1, limit: 100 });
    },
  });

  const clients: ClientOption[] = (clientsResponse?.data?.items || []).map(
    (client: { id: string; name: string }) => ({
      id: client.id,
      name: client.name,
    })
  );

  const documentTypes = [
    "Financial Report",
    "Tax Document",
    "Payroll",
    "Audit Document",
    "Contract",
    "Invoice",
    "Receipt",
    "Legal Document",
    "Insurance",
    "Government Filing",
    "Other",
  ];

  const commonTags = [
    "quarterly",
    "annual",
    "monthly",
    "urgent",
    "pending-review",
    "approved",
    "financial",
    "tax",
    "payroll",
    "legal",
    "compliance",
    "client",
    "internal",
  ];

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleUploadComplete = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleUploadError = (error: string) => {
    const { toast } = require("sonner");
    toast.error("Upload failed", {
      description: error,
    });
  };

  const handleStartProcessing = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setUploadProgress({ completed: 0, total: uploadedFiles.length });

    try {
      for (const [index, file] of uploadedFiles.entries()) {
        setUploadProgress({
          completed: index,
          total: uploadedFiles.length,
          currentFile: file.name,
        });

        // Simulate processing time (in production, this would call backend API)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Backend integration point: document processing (OCR, metadata extraction)
      }

      setUploadProgress({
        completed: uploadedFiles.length,
        total: uploadedFiles.length,
      });

      // Navigate back to documents page after successful upload
      setTimeout(() => {
        navigate({ to: "/documents" });
      }, 1500);
    } catch {
      const { toast } = require("sonner");
      toast.error("Processing failed", {
        description: "An error occurred while processing documents",
      });
      setIsProcessing(false);
    }
  };

  const renderFolderOptions = (folders: any[], level = 0) =>
    folders.map((folder) => (
      <div key={folder.id}>
        <SelectItem value={folder.id}>
          {"  ".repeat(level)}📁 {folder.name}
        </SelectItem>
        {folder.children && renderFolderOptions(folder.children, level + 1)}
      </div>
    ));

  if (isProcessing) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Upload className="h-8 w-8 animate-pulse text-blue-600" />
          </div>

          <div>
            <h1 className="font-bold text-2xl">Processing Documents</h1>
            <p className="mt-2 text-muted-foreground">
              Please wait while we process your documents...
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {uploadProgress.completed} of {uploadProgress.total} files
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${(uploadProgress.completed / uploadProgress.total) * 100}%`,
                    }}
                  />
                </div>

                {uploadProgress.currentFile && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <FileText className="h-4 w-4" />
                    Processing: {uploadProgress.currentFile}
                  </div>
                )}

                {uploadProgress.completed === uploadProgress.total && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    All documents processed successfully! Redirecting...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button asChild size="sm" variant="ghost">
            <Link to="/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
        </div>

        <div className="mt-4">
          <h1 className="font-bold text-3xl tracking-tight">
            Upload Documents
          </h1>
          <p className="text-muted-foreground">
            Upload and organize your business documents with metadata and OCR
            processing
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Zone */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Files</CardTitle>
              <CardDescription>
                Choose documents to upload. Supported formats: PDF, Word, Excel,
                Images
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                maxFileSize={100 * 1024 * 1024}
                maxFiles={20}
                onUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError} // 100MB
              />

              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 font-medium text-sm">
                    Ready to Process ({uploadedFiles.length} files)
                  </h3>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        className="flex items-center gap-3 rounded-lg border bg-green-50 p-3 dark:bg-green-950/20"
                        key={index}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">
                            {file.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metadata Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Information
              </CardTitle>
              <CardDescription>
                Add metadata that will be applied to all uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="folder">Destination Folder</Label>
                <Select
                  onValueChange={setSelectedFolder}
                  value={selectedFolder}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select folder (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" />
                        Root Folder
                      </div>
                    </SelectItem>
                    {renderFolderOptions(folderTree)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Document Type</Label>
                <Select onValueChange={setDocumentType} value={documentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="client">Client (Optional)</Label>
                <Select onValueChange={setClientId} value={clientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {isLoadingClients ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description for these documents..."
                  rows={3}
                  value={description}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isConfidential}
                  id="confidential"
                  onCheckedChange={setIsConfidential}
                />
                <Label
                  className="flex items-center gap-2"
                  htmlFor="confidential"
                >
                  <Shield className="h-4 w-4 text-red-500" />
                  Mark as Confidential
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Tags
              </CardTitle>
              <CardDescription>
                Add tags to help organize and find documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Quick Tags</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {commonTags.map((tag) => (
                    <Badge
                      className="cursor-pointer"
                      key={tag}
                      onClick={() => {
                        if (tags.includes(tag)) {
                          handleRemoveTag(tag);
                        } else {
                          setTags([...tags, tag]);
                        }
                      }}
                      variant={tags.includes(tag) ? "default" : "outline"}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="custom-tag">Custom Tags</Label>
                <div className="mt-1 flex gap-2">
                  <Input
                    id="custom-tag"
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add custom tag..."
                    value={newTag}
                  />
                  <Button
                    disabled={!newTag.trim()}
                    onClick={handleAddTag}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {tags.length > 0 && (
                <div>
                  <Label>Selected Tags</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        className="cursor-pointer"
                        key={tag}
                        variant="secondary"
                      >
                        {tag}
                        <button
                          className="ml-1 hover:text-destructive"
                          onClick={() => handleRemoveTag(tag)}
                          type="button"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <Button
              className="w-full"
              disabled={uploadedFiles.length === 0 || isProcessing}
              onClick={handleStartProcessing}
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              Process {uploadedFiles.length} Document
              {uploadedFiles.length !== 1 ? "s" : ""}
            </Button>

            {uploadedFiles.length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <AlertTriangle className="h-4 w-4" />
                Please upload files before processing
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
