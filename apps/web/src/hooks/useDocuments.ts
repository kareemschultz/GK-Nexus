import { useCallback, useMemo, useState } from "react";

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  lastModified: string;
  isConfidential: boolean;
  client?: string;
  clientId?: string;
  folderId?: string;
  tags: string[];
  version: number;
  status: "draft" | "review" | "approved" | "archived";
  createdBy: string;
  description?: string;
  ocrText?: string;
  checksum: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  downloadUrl: string;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  path: string;
  description?: string;
  isConfidential: boolean;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
  createdDate: string;
  documentCount: number;
  subfolderCount: number;
}

export interface DocumentFilter {
  search?: string;
  type?: string[];
  clientId?: string;
  folderId?: string;
  isConfidential?: boolean;
  status?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  tags?: string[];
  size?: {
    min: number;
    max: number;
  };
}

export interface DocumentSort {
  field: "name" | "type" | "size" | "uploadDate" | "lastModified";
  direction: "asc" | "desc";
}

const mockDocuments: Document[] = [
  {
    id: "1",
    name: "Q4_Financial_Report.pdf",
    type: "Financial Report",
    size: 2_048_576,
    mimeType: "application/pdf",
    uploadDate: "2024-01-15T10:30:00Z",
    lastModified: "2024-01-15T10:30:00Z",
    isConfidential: true,
    client: "Acme Corp",
    clientId: "client_1",
    folderId: "folder_1",
    tags: ["financial", "quarterly", "report"],
    version: 1,
    status: "approved",
    createdBy: "John Doe",
    description: "Q4 2023 Financial Report for Acme Corp",
    checksum: "abc123def456",
    downloadUrl: "/api/documents/1/download",
    previewUrl: "/api/documents/1/preview",
    thumbnailUrl: "/api/documents/1/thumbnail",
    permissions: {
      read: true,
      write: true,
      delete: true,
      share: true,
    },
  },
  {
    id: "2",
    name: "Tax_Returns_2023.xlsx",
    type: "Tax Document",
    size: 1_024_000,
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    uploadDate: "2024-01-14T14:20:00Z",
    lastModified: "2024-01-14T14:20:00Z",
    isConfidential: true,
    client: "TechStart Inc",
    clientId: "client_2",
    folderId: "folder_2",
    tags: ["tax", "returns", "2023"],
    version: 1,
    status: "review",
    createdBy: "Jane Smith",
    description: "2023 Tax Returns for TechStart Inc",
    checksum: "def456ghi789",
    downloadUrl: "/api/documents/2/download",
    permissions: {
      read: true,
      write: true,
      delete: false,
      share: true,
    },
  },
  {
    id: "3",
    name: "Payroll_Summary_Dec.pdf",
    type: "Payroll",
    size: 512_000,
    mimeType: "application/pdf",
    uploadDate: "2024-01-13T09:15:00Z",
    lastModified: "2024-01-13T09:15:00Z",
    isConfidential: false,
    client: "Local Business Ltd",
    clientId: "client_3",
    folderId: "folder_1",
    tags: ["payroll", "december", "summary"],
    version: 2,
    status: "approved",
    createdBy: "Bob Johnson",
    description: "December 2023 Payroll Summary",
    checksum: "ghi789jkl012",
    downloadUrl: "/api/documents/3/download",
    previewUrl: "/api/documents/3/preview",
    permissions: {
      read: true,
      write: false,
      delete: false,
      share: true,
    },
  },
];

const mockFolders: Folder[] = [
  {
    id: "folder_1",
    name: "Financial Reports",
    path: "/Financial Reports",
    description: "All financial reports and statements",
    isConfidential: true,
    permissions: {
      read: true,
      write: true,
      delete: true,
      share: true,
    },
    createdDate: "2024-01-01T00:00:00Z",
    documentCount: 15,
    subfolderCount: 3,
  },
  {
    id: "folder_2",
    name: "Tax Documents",
    path: "/Tax Documents",
    description: "Tax related documents and filings",
    isConfidential: true,
    permissions: {
      read: true,
      write: true,
      delete: false,
      share: true,
    },
    createdDate: "2024-01-01T00:00:00Z",
    documentCount: 8,
    subfolderCount: 2,
  },
  {
    id: "folder_3",
    name: "Contracts",
    parentId: "folder_1",
    path: "/Financial Reports/Contracts",
    description: "Client contracts and agreements",
    isConfidential: false,
    permissions: {
      read: true,
      write: true,
      delete: true,
      share: true,
    },
    createdDate: "2024-01-01T00:00:00Z",
    documentCount: 5,
    subfolderCount: 0,
  },
];

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [folders, setFolders] = useState<Folder[]>(mockFolders);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDocument = useCallback(
    async (id: string): Promise<Document | null> => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        const document = documents.find((doc) => doc.id === id) || null;
        return document;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch document";
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [documents]
  );

  const getDocuments = useCallback(
    async (
      filter?: DocumentFilter,
      sort?: DocumentSort
    ): Promise<Document[]> => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 300));

        let filteredDocs = [...documents];

        if (filter) {
          if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            filteredDocs = filteredDocs.filter(
              (doc) =>
                doc.name.toLowerCase().includes(searchLower) ||
                doc.description?.toLowerCase().includes(searchLower) ||
                doc.ocrText?.toLowerCase().includes(searchLower)
            );
          }

          if (filter.type && filter.type.length > 0) {
            filteredDocs = filteredDocs.filter((doc) =>
              filter.type!.includes(doc.type)
            );
          }

          if (filter.clientId) {
            filteredDocs = filteredDocs.filter(
              (doc) => doc.clientId === filter.clientId
            );
          }

          if (filter.folderId) {
            filteredDocs = filteredDocs.filter(
              (doc) => doc.folderId === filter.folderId
            );
          }

          if (filter.isConfidential !== undefined) {
            filteredDocs = filteredDocs.filter(
              (doc) => doc.isConfidential === filter.isConfidential
            );
          }

          if (filter.status && filter.status.length > 0) {
            filteredDocs = filteredDocs.filter((doc) =>
              filter.status!.includes(doc.status)
            );
          }

          if (filter.tags && filter.tags.length > 0) {
            filteredDocs = filteredDocs.filter((doc) =>
              filter.tags!.some((tag) => doc.tags.includes(tag))
            );
          }

          if (filter.size) {
            filteredDocs = filteredDocs.filter(
              (doc) =>
                doc.size >= filter.size!.min && doc.size <= filter.size!.max
            );
          }

          if (filter.dateRange) {
            filteredDocs = filteredDocs.filter((doc) => {
              const uploadDate = new Date(doc.uploadDate);
              return (
                uploadDate >= filter.dateRange!.from &&
                uploadDate <= filter.dateRange!.to
              );
            });
          }
        }

        if (sort) {
          filteredDocs.sort((a, b) => {
            let comparison = 0;

            switch (sort.field) {
              case "name":
                comparison = a.name.localeCompare(b.name);
                break;
              case "type":
                comparison = a.type.localeCompare(b.type);
                break;
              case "size":
                comparison = a.size - b.size;
                break;
              case "uploadDate":
                comparison =
                  new Date(a.uploadDate).getTime() -
                  new Date(b.uploadDate).getTime();
                break;
              case "lastModified":
                comparison =
                  new Date(a.lastModified).getTime() -
                  new Date(b.lastModified).getTime();
                break;
            }

            return sort.direction === "asc" ? comparison : -comparison;
          });
        }

        return filteredDocs;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch documents";
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [documents]
  );

  const getFolders = useCallback(
    async (parentId?: string): Promise<Folder[]> => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 200));
        const filteredFolders = folders.filter(
          (folder) => folder.parentId === parentId
        );
        return filteredFolders;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch folders";
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [folders]
  );

  const createFolder = useCallback(
    async (name: string, parentId?: string): Promise<Folder> => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        const newFolder: Folder = {
          id: `folder_${Date.now()}`,
          name,
          parentId,
          path: parentId
            ? `${folders.find((f) => f.id === parentId)?.path}/${name}`
            : `/${name}`,
          isConfidential: false,
          permissions: {
            read: true,
            write: true,
            delete: true,
            share: true,
          },
          createdDate: new Date().toISOString(),
          documentCount: 0,
          subfolderCount: 0,
        };

        setFolders((prev) => [...prev, newFolder]);
        return newFolder;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create folder";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [folders]
  );

  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete document";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateDocument = useCallback(
    async (id: string, updates: Partial<Document>): Promise<Document> => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === id
              ? { ...doc, ...updates, lastModified: new Date().toISOString() }
              : doc
          )
        );

        const updatedDoc = documents.find((doc) => doc.id === id);
        if (!updatedDoc) {
          throw new Error("Document not found");
        }

        return { ...updatedDoc, ...updates };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update document";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [documents]
  );

  const folderTree = useMemo(() => {
    const buildTree = (parentId?: string): (Folder & { children: any[] })[] =>
      folders
        .filter((folder) => folder.parentId === parentId)
        .map((folder) => ({
          ...folder,
          children: buildTree(folder.id),
        }));

    return buildTree();
  }, [folders]);

  return {
    documents,
    folders,
    folderTree,
    isLoading,
    error,
    getDocument,
    getDocuments,
    getFolders,
    createFolder,
    deleteDocument,
    updateDocument,
  };
};
