import { useCallback, useState } from "react";

export interface FileUploadProgress {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error" | "cancelled";
  error?: string;
}

export interface UseFileUploadOptions {
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  onUploadComplete?: (file: File, result: any) => void;
  onUploadError?: (file: File, error: string) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    maxFiles = 10,
    maxFileSize = 100 * 1024 * 1024, // 100MB
    acceptedTypes = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".png",
      ".jpg",
      ".jpeg",
    ],
    onUploadComplete,
    onUploadError,
  } = options;

  const [uploads, setUploads] = useState<FileUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `File size must be less than ${Math.round(maxFileSize / (1024 * 1024))}MB`;
      }

      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (acceptedTypes.length > 0 && !acceptedTypes.includes(fileExtension)) {
        return `File type not supported. Accepted types: ${acceptedTypes.join(", ")}`;
      }

      return null;
    },
    [maxFileSize, acceptedTypes]
  );

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      const validation = validateFile(file);
      if (validation) {
        onUploadError?.(file, validation);
        return;
      }

      const uploadId = crypto.randomUUID();

      setUploads((prev) => [
        ...prev,
        {
          id: uploadId,
          file,
          progress: 0,
          status: "uploading",
        },
      ]);

      try {
        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === uploadId ? { ...upload, progress } : upload
            )
          );
        }

        // Mark as completed
        setUploads((prev) =>
          prev.map((upload) =>
            upload.id === uploadId
              ? { ...upload, status: "completed" as const }
              : upload
          )
        );

        onUploadComplete?.(file, { id: uploadId, url: "#" });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        setUploads((prev) =>
          prev.map((upload) =>
            upload.id === uploadId
              ? { ...upload, status: "error" as const, error: errorMessage }
              : upload
          )
        );
        onUploadError?.(file, errorMessage);
      }
    },
    [validateFile, onUploadComplete, onUploadError]
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      if (fileArray.length > maxFiles) {
        onUploadError?.(fileArray[0], `Maximum ${maxFiles} files allowed`);
        return;
      }

      setIsUploading(true);

      try {
        await Promise.all(fileArray.map(uploadFile));
      } finally {
        setIsUploading(false);
      }
    },
    [maxFiles, uploadFile, onUploadError]
  );

  const cancelUpload = useCallback((uploadId: string) => {
    setUploads((prev) =>
      prev.map((upload) =>
        upload.id === uploadId
          ? { ...upload, status: "cancelled" as const }
          : upload
      )
    );
  }, []);

  const clearUploads = useCallback(() => {
    setUploads([]);
  }, []);

  const removeUpload = useCallback((uploadId: string) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== uploadId));
  }, []);

  return {
    uploads,
    isUploading,
    uploadFiles,
    uploadFile,
    cancelUpload,
    clearUploads,
    removeUpload,
    validateFile,
  };
};
