import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Maximize,
  MessageCircle,
  Printer,
  RotateCw,
  Send,
  Share2,
  Shield,
  Tag,
  User,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { type Document, useDocuments } from "@/hooks/useDocuments";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/documents/$id")({
  component: DocumentViewerPage,
});

type DocumentComment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  isResolved: boolean;
};

type DocumentVersion = {
  id: string;
  version: number;
  uploadDate: string;
  uploadedBy: string;
  changes: string;
  fileSize: number;
};

function DocumentViewerPage() {
  const { id } = useParams({ from: "/documents/$id" });
  const { getDocument, updateDocument } = useDocuments();

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Document>>({});
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<DocumentComment[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);

  const formatFileSize = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex += 1;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getStatusIcon = (status: Document["status"]) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "review":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "draft":
        return <Edit className="h-4 w-4 text-blue-600" />;
      case "archived":
        return <Archive className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const doc = await getDocument(id);
        if (doc) {
          setDocument(doc);
          setEditForm(doc);

          // Mock versions data
          setVersions([
            {
              id: "1",
              version: 2,
              uploadDate: new Date().toISOString(),
              uploadedBy: "John Doe",
              changes: "Updated financial figures for Q4",
              fileSize: doc.size,
            },
            {
              id: "2",
              version: 1,
              uploadDate: doc.uploadDate,
              uploadedBy: doc.createdBy,
              changes: "Initial upload",
              fileSize: doc.size * 0.9,
            },
          ]);

          // Mock comments data
          setComments([
            {
              id: "1",
              author: "Jane Smith",
              content: "Please review the calculations on page 3.",
              createdAt: new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000
              ).toISOString(),
              isResolved: false,
            },
            {
              id: "2",
              author: "Bob Johnson",
              content: "Approved for publication.",
              createdAt: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000
              ).toISOString(),
              isResolved: true,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to load document:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [id, getDocument]);

  const handleSaveEdit = async () => {
    if (!(document && editForm)) {
      return;
    }

    try {
      const updatedDoc = await updateDocument(document.id, editForm);
      setDocument(updatedDoc);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update document:", error);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      return;
    }

    const comment: DocumentComment = {
      id: Date.now().toString(),
      author: "Current User",
      content: newComment,
      createdAt: new Date().toISOString(),
      isResolved: false,
    };

    setComments([comment, ...comments]);
    setNewComment("");
  };

  const handleResolveComment = (commentId: string) => {
    setComments(
      comments.map((comment) =>
        comment.id === commentId
          ? { ...comment, isResolved: !comment.isResolved }
          : comment
      )
    );
  };

  const handleDownload = () => {
    if (!document) {
      return;
    }
    // Simulate file download
    const link = window.document.createElement("a");
    link.href = document.downloadUrl || "#";
    link.download = document.name || "document";
    link.click();
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 25));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/4 rounded bg-muted" />
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-96 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <div className="space-y-4 text-center">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
          <h1 className="font-bold text-2xl">Document Not Found</h1>
          <p className="text-muted-foreground">
            The document you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/documents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Documents
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
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

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-3xl tracking-tight">
                {document.name}
              </h1>
              {document.isConfidential && (
                <Shield className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <div className="flex items-center gap-1">
                {getStatusIcon(document.status)}
                <span className="capitalize">{document.status}</span>
              </div>
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {document.createdBy}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(document.uploadDate)}
              </div>
              <div>Version {document.version}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowComments(!showComments)}
              size="sm"
              variant="outline"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Comments ({comments.filter((c) => !c.isResolved).length})
            </Button>

            <Button
              onClick={() => setShowVersions(!showVersions)}
              size="sm"
              variant="outline"
            >
              <Clock className="mr-2 h-4 w-4" />
              Versions
            </Button>

            <Button onClick={handleDownload} size="sm" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            {document.permissions.write && (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                variant="outline"
              >
                <Edit className="mr-2 h-4 w-4" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            )}

            <Button size="sm" variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-3">
          {/* Document Viewer */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Document Preview</CardTitle>
                <div className="flex items-center gap-2">
                  <Button onClick={handleZoomOut} size="sm" variant="ghost">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium text-sm">
                    {zoomLevel}%
                  </span>
                  <Button onClick={handleZoomIn} size="sm" variant="ghost">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Separator className="h-6" orientation="vertical" />
                  <Button onClick={handleRotate} size="sm" variant="ghost">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-96 items-center justify-center rounded-lg border-2 border-dashed bg-muted/20">
                <div
                  className="space-y-4 text-center"
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s ease",
                  }}
                >
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Document Preview</p>
                    <p className="text-muted-foreground text-sm">
                      {document.type} • {formatFileSize(document.size)}
                    </p>
                    <p className="mt-2 text-muted-foreground text-xs">
                      Preview for {document.mimeType} files would appear here
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OCR Text Content */}
          {document.ocrText && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Extracted Text (OCR)</CardTitle>
                <CardDescription>
                  Searchable text content extracted from the document
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="whitespace-pre-wrap text-muted-foreground text-sm">
                    {document.ocrText}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Document Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing && document ? (
                <div className="space-y-4">
                  <div>
                    <Label>Document Type</Label>
                    <Select
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, type: value })
                      }
                      value={editForm.type || document.type}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Financial Report">
                          Financial Report
                        </SelectItem>
                        <SelectItem value="Tax Document">
                          Tax Document
                        </SelectItem>
                        <SelectItem value="Payroll">Payroll</SelectItem>
                        <SelectItem value="Audit Document">
                          Audit Document
                        </SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      className="mt-1"
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      value={editForm.description || ""}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={
                        editForm.isConfidential ?? document.isConfidential
                      }
                      id="edit-confidential"
                      onCheckedChange={(checked) =>
                        setEditForm({ ...editForm, isConfidential: !!checked })
                      }
                    />
                    <Label
                      className="flex items-center gap-2"
                      htmlFor="edit-confidential"
                    >
                      <Shield className="h-4 w-4 text-red-500" />
                      Confidential
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} size="sm">
                      Save Changes
                    </Button>
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm(document);
                      }}
                      size="sm"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Type
                    </Label>
                    <p className="font-medium text-sm">{document.type}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Size
                    </Label>
                    <p className="text-sm">{formatFileSize(document.size)}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Client
                    </Label>
                    <p className="text-sm">
                      {document.client || "Not assigned"}
                    </p>
                  </div>

                  {document.description && (
                    <div>
                      <Label className="text-muted-foreground text-xs">
                        Description
                      </Label>
                      <p className="text-sm">{document.description}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Last Modified
                    </Label>
                    <p className="text-sm">
                      {formatDate(document.lastModified)}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-xs">
                      Checksum
                    </Label>
                    <p className="font-mono text-muted-foreground text-xs">
                      {document.checksum}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag) => (
                  <Badge className="text-xs" key={tag} variant="secondary">
                    <Tag className="mr-1 h-2 w-2" />
                    {tag}
                  </Badge>
                ))}
                {document.tags.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No tags assigned
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Read</span>
                  <CheckCircle2
                    className={cn(
                      "h-4 w-4",
                      document.permissions.read
                        ? "text-green-600"
                        : "text-gray-300"
                    )}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Write</span>
                  <CheckCircle2
                    className={cn(
                      "h-4 w-4",
                      document.permissions.write
                        ? "text-green-600"
                        : "text-gray-300"
                    )}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Delete</span>
                  <CheckCircle2
                    className={cn(
                      "h-4 w-4",
                      document.permissions.delete
                        ? "text-green-600"
                        : "text-gray-300"
                    )}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Share</span>
                  <CheckCircle2
                    className={cn(
                      "h-4 w-4",
                      document.permissions.share
                        ? "text-green-600"
                        : "text-gray-300"
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comments Sidebar */}
      <Dialog onOpenChange={setShowComments} open={showComments}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Comments & Reviews</DialogTitle>
            <DialogDescription>
              Collaborate on document reviews and feedback
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add Comment */}
            <div className="space-y-2">
              <Textarea
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                value={newComment}
              />
              <Button
                className="w-full"
                disabled={!newComment.trim()}
                onClick={handleAddComment}
                size="sm"
              >
                <Send className="mr-2 h-4 w-4" />
                Add Comment
              </Button>
            </div>

            <Separator />

            {/* Comments List */}
            <ScrollArea className="h-64">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    className={cn(
                      "rounded-lg border p-3",
                      comment.isResolved ? "bg-muted/50" : "bg-background"
                    )}
                    key={comment.id}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {comment.author}
                          </span>
                          {comment.isResolved && (
                            <Badge className="text-xs" variant="outline">
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">
                          {comment.content}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(comment.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={() => handleResolveComment(comment.id)}
                        size="sm"
                        variant="ghost"
                      >
                        {comment.isResolved ? "Unresolve" : "Resolve"}
                      </Button>
                    </div>
                  </div>
                ))}
                {comments.length === 0 && (
                  <div className="py-8 text-center">
                    <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      No comments yet
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Versions Sidebar */}
      <Dialog onOpenChange={setShowVersions} open={showVersions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              View and compare document versions
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-64">
            <div className="space-y-3">
              {versions.map((version) => (
                <div className="rounded-lg border p-3" key={version.id}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          Version {version.version}
                        </span>
                        {version.version === document.version && (
                          <Badge className="text-xs" variant="default">
                            Current
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {version.changes}
                      </p>
                      <div className="space-y-1 text-muted-foreground text-xs">
                        <p>By {version.uploadedBy}</p>
                        <p>{formatDate(version.uploadDate)}</p>
                        <p>{formatFileSize(version.fileSize)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
