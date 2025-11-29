import {
  AlertCircle,
  CheckCircle,
  File,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { type FileUploadProgress, useFileUpload } from "@/hooks/useFileUpload";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  onUploadComplete?: (files: File[]) => void;
  onUploadError?: (error: string) => void;
  accept?: string;
  maxFiles?: number;
  maxFileSize?: number;
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

const FileProgressItem = ({
  upload,
  onCancel,
  onRemove,
}: {
  upload: FileUploadProgress;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
}) => {
  const getStatusIcon = () => {
    switch (upload.status) {
      case "uploading":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case "cancelled":
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <File className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (upload.status) {
      case "uploading":
        return `Uploading... ${upload.progress}%`;
      case "completed":
        return "Upload complete";
      case "error":
        return upload.error || "Upload failed";
      case "cancelled":
        return "Upload cancelled";
      default:
        return "Pending";
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className="flex-shrink-0">{getStatusIcon()}</div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{upload.file.name}</p>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <span>{formatFileSize(upload.file.size)}</span>
          <span>•</span>
          <span
            className={cn(
              upload.status === "error" && "text-red-600",
              upload.status === "completed" && "text-green-600"
            )}
          >
            {getStatusText()}
          </span>
        </div>

        {upload.status === "uploading" && (
          <Progress className="mt-2" value={upload.progress} />
        )}
      </div>

      <div className="flex-shrink-0">
        {upload.status === "uploading" && (
          <Button
            onClick={() => onCancel(upload.id)}
            size="sm"
            variant="outline"
          >
            Cancel
          </Button>
        )}

        {(upload.status === "completed" ||
          upload.status === "error" ||
          upload.status === "cancelled") && (
          <Button onClick={() => onRemove(upload.id)} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export const FileUploadZone = ({
  onUploadComplete,
  onUploadError,
  accept = ".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg",
  maxFiles = 10,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  className,
}: FileUploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    uploads,
    isUploading,
    uploadFiles,
    cancelUpload,
    removeUpload,
    clearUploads,
  } = useFileUpload({
    maxFiles,
    maxFileSize,
    acceptedTypes: accept.split(",").map((type) => type.trim()),
    onUploadComplete: (file) => {
      onUploadComplete?.([file]);
    },
    onUploadError: (file, error) => {
      onUploadError?.(error);
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        uploadFiles(files);
      }
    },
    [uploadFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        uploadFiles(files);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [uploadFiles]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          isDragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          isUploading && "pointer-events-none opacity-50"
        )}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={isUploading}
          multiple
          onChange={handleFileSelect}
          type="file"
        />

        <div className="flex flex-col items-center gap-3">
          <Upload className="h-10 w-10 text-muted-foreground" />

          <div className="space-y-1">
            <p className="font-medium">
              Drag and drop files here, or{" "}
              <span className="cursor-pointer text-blue-600 underline hover:text-blue-500">
                browse
              </span>
            </p>
            <p className="text-muted-foreground text-sm">
              Supports: {accept.replace(/\./g, "").toUpperCase()} files up to{" "}
              {formatFileSize(maxFileSize)}
            </p>
            <p className="text-muted-foreground text-sm">
              Maximum {maxFiles} files at once
            </p>
          </div>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">
              Uploads ({uploads.length}/{maxFiles})
            </h3>

            {uploads.some(
              (u) =>
                u.status === "completed" ||
                u.status === "error" ||
                u.status === "cancelled"
            ) && (
              <Button
                className="text-muted-foreground hover:text-foreground"
                onClick={clearUploads}
                size="sm"
                variant="ghost"
              >
                Clear completed
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {uploads.map((upload) => (
              <FileProgressItem
                key={upload.id}
                onCancel={cancelUpload}
                onRemove={removeUpload}
                upload={upload}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
