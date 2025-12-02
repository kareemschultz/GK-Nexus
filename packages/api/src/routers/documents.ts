import { businessSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import { z } from "zod";
import {
  adminProcedure,
  protectedProcedure,
  requirePermission,
} from "../index";

// Input schemas
const createDocumentSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1, "Document name is required").max(255),
  description: z.string().max(1000).optional(),
  category: z.enum([
    "TAX_RETURN",
    "FINANCIAL_STATEMENT",
    "CONTRACT",
    "INVOICE",
    "RECEIPT",
    "LEGAL_DOCUMENT",
    "COMPLIANCE_REPORT",
    "PAYROLL_RECORD",
    "BANK_STATEMENT",
    "AUDIT_REPORT",
    "OTHER",
  ]),
  subcategory: z.string().max(100).optional(),
  fileName: z.string().min(1, "File name is required").max(255),
  fileSize: z.number().min(1, "File size must be specified"),
  mimeType: z.string().min(1, "MIME type is required"),
  fileUrl: z.string().url("Valid file URL is required"),
  tags: z.array(z.string().max(50)).optional().default([]),
  isConfidential: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const updateDocumentSchema = createDocumentSchema.partial().extend({
  id: z.string().uuid(),
  version: z.string().optional(),
  previousVersionId: z.string().uuid().optional(),
  isLatestVersion: z.boolean().optional(),
});

const createDocumentVersionSchema = z.object({
  documentId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().min(1),
  mimeType: z.string().min(1),
  fileUrl: z.string().url(),
  versionNotes: z.string().max(500).optional(),
  metadata: z.record(z.any()).optional(),
});

const documentSearchSchema = z.object({
  query: z.string().min(1),
  clientId: z.string().uuid().optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  fileTypes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  includeContent: z.boolean().default(false),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

const documentQuerySchema = z.object({
  clientId: z.string().uuid().optional(),
  category: z
    .enum([
      "TAX_RETURN",
      "FINANCIAL_STATEMENT",
      "CONTRACT",
      "INVOICE",
      "RECEIPT",
      "LEGAL_DOCUMENT",
      "COMPLIANCE_REPORT",
      "PAYROLL_RECORD",
      "BANK_STATEMENT",
      "AUDIT_REPORT",
      "OTHER",
    ])
    .optional(),
  subcategory: z.string().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isConfidential: z.boolean().optional(),
  uploadedBy: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z
    .enum(["name", "uploadedAt", "fileSize", "category"])
    .default("uploadedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

const shareDocumentSchema = z.object({
  documentId: z.string().uuid(),
  shareWith: z
    .array(z.string().uuid())
    .min(1, "Must specify at least one user"),
  permissions: z.enum(["VIEW", "DOWNLOAD", "EDIT"]).default("VIEW"),
  expiresAt: z.string().datetime().optional(),
  message: z.string().max(500).optional(),
});

const createFolderSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().min(1, "Folder name is required").max(255),
  description: z.string().max(1000).optional(),
  parentId: z.string().uuid().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .optional(),
  isPrivate: z.boolean().default(false),
});

const moveDocumentSchema = z.object({
  documentId: z.string().uuid(),
  folderId: z.string().uuid().optional(), // null for root folder
});

// Helper functions
function generateDocumentVersion(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = nanoid(4).toUpperCase();
  return `v${timestamp}-${random}`;
}

function getDocumentHash(content: string): string {
  // Simple hash function - in production, use crypto.createHash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

export const documentsRouter = {
  // Create new document record
  create: protectedProcedure
    .use(requirePermission("documents.create"))
    .input(createDocumentSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      // Validate file size (max 50MB)
      const maxFileSize = 50 * 1024 * 1024; // 50MB
      if (input.fileSize > maxFileSize) {
        throw new ORPCError(
          "BAD_REQUEST",
          "File size exceeds maximum limit of 50MB"
        );
      }

      // Validate MIME type
      const allowedMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "image/jpeg",
        "image/png",
        "image/gif",
        "text/plain",
        "text/csv",
      ];

      if (!allowedMimeTypes.includes(input.mimeType)) {
        throw new ORPCError("BAD_REQUEST", "Unsupported file type");
      }

      try {
        // Check for duplicate documents by content hash
        const contentHash = getDocumentHash(
          input.fileUrl + input.fileName + input.fileSize
        );

        // Check if similar document exists for the same client
        const [existingDoc] = await db
          .select({
            id: businessSchema.document.id,
            name: businessSchema.document.name,
          })
          .from(businessSchema.document)
          .where(
            and(
              eq(businessSchema.document.clientId, input.clientId),
              eq(businessSchema.document.fileName, input.fileName),
              eq(businessSchema.document.fileSize, input.fileSize),
              eq(businessSchema.document.status, "ACTIVE")
            )
          )
          .limit(1);

        if (existingDoc) {
          throw new ORPCError(
            "CONFLICT",
            `A document with the same name and size already exists: ${existingDoc.name}`
          );
        }

        const [document] = await db
          .insert(businessSchema.document)
          .values({
            id: nanoid(),
            ...input,
            version: "v1.0",
            contentHash,
            isLatestVersion: true,
            tags: input.tags ? JSON.stringify(input.tags) : null,
            metadata: input.metadata ? JSON.stringify(input.metadata) : null,
            uploadedBy: user?.id!,
            status: "ACTIVE",
          })
          .returning({
            id: businessSchema.document.id,
            name: businessSchema.document.name,
            category: businessSchema.document.category,
            fileName: businessSchema.document.fileName,
            fileSize: businessSchema.document.fileSize,
            version: businessSchema.document.version,
            uploadedAt: businessSchema.document.uploadedAt,
            status: businessSchema.document.status,
          });

        return {
          success: true,
          data: document,
          message: "Document uploaded successfully",
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create document record"
        );
      }
    }),

  // List documents with filtering and search
  list: protectedProcedure
    .use(requirePermission("documents.read"))
    .input(documentQuerySchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const {
        page,
        limit,
        clientId,
        category,
        subcategory,
        search,
        tags,
        isConfidential,
        uploadedBy,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      } = input;

      const offset = (page - 1) * limit;
      const conditions = [eq(businessSchema.document.status, "ACTIVE")];

      if (clientId) {
        conditions.push(eq(businessSchema.document.clientId, clientId));
      }

      if (category) {
        conditions.push(eq(businessSchema.document.category, category));
      }

      if (subcategory) {
        conditions.push(eq(businessSchema.document.subcategory, subcategory));
      }

      if (isConfidential !== undefined) {
        conditions.push(
          eq(businessSchema.document.isConfidential, isConfidential)
        );
      }

      if (uploadedBy) {
        conditions.push(eq(businessSchema.document.uploadedBy, uploadedBy));
      }

      if (search) {
        conditions.push(
          sql`(
            ${ilike(businessSchema.document.name, `%${search}%`)} OR
            ${ilike(businessSchema.document.description, `%${search}%`)} OR
            ${ilike(businessSchema.document.fileName, `%${search}%`)}
          )`
        );
      }

      if (startDate) {
        conditions.push(
          sql`${businessSchema.document.uploadedAt} >= ${startDate}`
        );
      }

      if (endDate) {
        conditions.push(
          sql`${businessSchema.document.uploadedAt} <= ${endDate}`
        );
      }

      if (tags && tags.length > 0) {
        const tagConditions = tags.map(
          (tag) => sql`${businessSchema.document.tags} LIKE ${`%"${tag}"%`}`
        );
        conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`);
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(businessSchema.document)
        .where(whereClause);

      // Get documents with sorting
      const sortColumn =
        businessSchema.document[sortBy as keyof typeof businessSchema.document];
      const orderClause =
        sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      const documents = await db
        .select({
          id: businessSchema.document.id,
          name: businessSchema.document.name,
          description: businessSchema.document.description,
          category: businessSchema.document.category,
          subcategory: businessSchema.document.subcategory,
          fileName: businessSchema.document.fileName,
          fileSize: businessSchema.document.fileSize,
          mimeType: businessSchema.document.mimeType,
          tags: businessSchema.document.tags,
          isConfidential: businessSchema.document.isConfidential,
          clientId: businessSchema.document.clientId,
          folderId: businessSchema.document.folderId,
          uploadedBy: businessSchema.document.uploadedBy,
          uploadedAt: businessSchema.document.uploadedAt,
          updatedAt: businessSchema.document.updatedAt,
          status: businessSchema.document.status,
          expiresAt: businessSchema.document.expiresAt,
        })
        .from(businessSchema.document)
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset);

      // Parse JSON fields
      const parsedDocuments = documents.map((doc) => ({
        ...doc,
        tags: doc.tags ? JSON.parse(doc.tags) : [],
      }));

      const total = totalResult.count;
      const pages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          items: parsedDocuments,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        },
      };
    }),

  // Get document versions
  getVersions: protectedProcedure
    .use(requirePermission("documents.read"))
    .input(z.object({ documentId: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      // Get the original document to find all versions
      const [originalDoc] = await db
        .select({
          id: businessSchema.document.id,
          name: businessSchema.document.name,
          rootDocumentId: businessSchema.document.rootDocumentId,
        })
        .from(businessSchema.document)
        .where(eq(businessSchema.document.id, input.documentId))
        .limit(1);

      if (!originalDoc) {
        throw new ORPCError("NOT_FOUND", "Document not found");
      }

      // Find all versions of this document
      const rootId = originalDoc.rootDocumentId || originalDoc.id;
      const versions = await db
        .select({
          id: businessSchema.document.id,
          name: businessSchema.document.name,
          version: businessSchema.document.version,
          fileName: businessSchema.document.fileName,
          fileSize: businessSchema.document.fileSize,
          mimeType: businessSchema.document.mimeType,
          isLatestVersion: businessSchema.document.isLatestVersion,
          uploadedBy: businessSchema.document.uploadedBy,
          uploadedAt: businessSchema.document.uploadedAt,
          status: businessSchema.document.status,
        })
        .from(businessSchema.document)
        .where(
          sql`(
            ${businessSchema.document.id} = ${rootId} OR
            ${businessSchema.document.rootDocumentId} = ${rootId}
          ) AND ${businessSchema.document.status} = 'ACTIVE'`
        )
        .orderBy(desc(businessSchema.document.uploadedAt));

      return {
        success: true,
        data: {
          rootDocumentId: rootId,
          versions,
          totalVersions: versions.length,
        },
      };
    }),

  // Get document by ID
  getById: protectedProcedure
    .use(requirePermission("documents.read"))
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db } = context;

      const [document] = await db
        .select()
        .from(businessSchema.document)
        .where(
          and(
            eq(businessSchema.document.id, input.id),
            eq(businessSchema.document.status, "ACTIVE")
          )
        )
        .limit(1);

      if (!document) {
        throw new ORPCError("NOT_FOUND", "Document not found");
      }

      // Parse JSON fields
      const parsedDocument = {
        ...document,
        tags: document.tags ? JSON.parse(document.tags) : [],
        metadata: document.metadata ? JSON.parse(document.metadata) : {},
      };

      return {
        success: true,
        data: parsedDocument,
      };
    }),

  // Update document
  update: protectedProcedure
    .use(requirePermission("documents.update"))
    .input(updateDocumentSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { id, ...updateData } = input;

      // Check if document exists
      const [existing] = await db
        .select()
        .from(businessSchema.document)
        .where(eq(businessSchema.document.id, id))
        .limit(1);

      if (!existing) {
        throw new ORPCError("NOT_FOUND", "Document not found");
      }

      // Prepare update data
      const processedUpdateData: any = { ...updateData };
      if (updateData.tags) {
        processedUpdateData.tags = JSON.stringify(updateData.tags);
      }
      if (updateData.metadata) {
        processedUpdateData.metadata = JSON.stringify(updateData.metadata);
      }
      processedUpdateData.updatedBy = user?.id;

      try {
        const [updatedDocument] = await db
          .update(businessSchema.document)
          .set(processedUpdateData)
          .where(eq(businessSchema.document.id, id))
          .returning({
            id: businessSchema.document.id,
            name: businessSchema.document.name,
            category: businessSchema.document.category,
            updatedAt: businessSchema.document.updatedAt,
          });

        return {
          success: true,
          data: updatedDocument,
          message: "Document updated successfully",
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to update document"
        );
      }
    }),

  // Create new document version
  createVersion: protectedProcedure
    .use(requirePermission("documents.update"))
    .input(createDocumentVersionSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { documentId, versionNotes, ...versionData } = input;

      try {
        // Get the original document
        const [originalDoc] = await db
          .select()
          .from(businessSchema.document)
          .where(eq(businessSchema.document.id, documentId))
          .limit(1);

        if (!originalDoc) {
          throw new ORPCError("NOT_FOUND", "Original document not found");
        }

        // Mark previous version as not latest
        await db
          .update(businessSchema.document)
          .set({ isLatestVersion: false })
          .where(
            sql`(
              ${businessSchema.document.id} = ${originalDoc.rootDocumentId || documentId} OR
              ${businessSchema.document.rootDocumentId} = ${originalDoc.rootDocumentId || documentId}
            )`
          );

        // Generate new version number
        const newVersion = generateDocumentVersion();
        const contentHash = getDocumentHash(
          versionData.fileUrl + versionData.fileName + versionData.fileSize
        );

        // Create new version
        const [newVersionDoc] = await db
          .insert(businessSchema.document)
          .values({
            id: nanoid(),
            clientId: originalDoc.clientId,
            name: versionData.name || originalDoc.name,
            description: versionData.description || originalDoc.description,
            category: originalDoc.category,
            subcategory: originalDoc.subcategory,
            ...versionData,
            version: newVersion,
            rootDocumentId: originalDoc.rootDocumentId || documentId,
            previousVersionId: documentId,
            isLatestVersion: true,
            contentHash,
            tags: originalDoc.tags,
            isConfidential: originalDoc.isConfidential,
            folderId: originalDoc.folderId,
            metadata: versionData.metadata
              ? JSON.stringify(versionData.metadata)
              : originalDoc.metadata,
            uploadedBy: user?.id!,
            status: "ACTIVE",
          })
          .returning({
            id: businessSchema.document.id,
            name: businessSchema.document.name,
            version: businessSchema.document.version,
            fileName: businessSchema.document.fileName,
            fileSize: businessSchema.document.fileSize,
            uploadedAt: businessSchema.document.uploadedAt,
          });

        return {
          success: true,
          data: newVersionDoc,
          message: "Document version created successfully",
        };
      } catch (error) {
        if (error instanceof ORPCError) throw error;
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create document version"
        );
      }
    }),

  // Delete document (soft delete)
  delete: protectedProcedure
    .use(requirePermission("documents.delete"))
    .input(z.object({ id: z.string().uuid() }))
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      try {
        const [deletedDocument] = await db
          .update(businessSchema.document)
          .set({
            status: "DELETED",
            updatedBy: user?.id,
          })
          .where(eq(businessSchema.document.id, input.id))
          .returning({
            id: businessSchema.document.id,
            name: businessSchema.document.name,
            status: businessSchema.document.status,
          });

        if (!deletedDocument) {
          throw new ORPCError("NOT_FOUND", "Document not found");
        }

        return {
          success: true,
          data: deletedDocument,
          message: "Document deleted successfully",
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to delete document"
        );
      }
    }),

  // Share document with users
  share: protectedProcedure
    .use(requirePermission("documents.share"))
    .input(shareDocumentSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { documentId, shareWith, permissions, expiresAt, message } = input;

      // Check if document exists
      const [document] = await db
        .select()
        .from(businessSchema.document)
        .where(eq(businessSchema.document.id, documentId))
        .limit(1);

      if (!document) {
        throw new ORPCError("NOT_FOUND", "Document not found");
      }

      try {
        // Create share records for each user
        const shareRecords = shareWith.map((userId) => ({
          documentId,
          sharedWith: userId,
          permissions,
          expiresAt: expiresAt || null,
          message: message || null,
          sharedBy: user?.id!,
        }));

        const shares = await db
          .insert(businessSchema.documentShare)
          .values(shareRecords)
          .returning({
            id: businessSchema.documentShare.id,
            sharedWith: businessSchema.documentShare.sharedWith,
            permissions: businessSchema.documentShare.permissions,
            sharedAt: businessSchema.documentShare.sharedAt,
          });

        return {
          success: true,
          data: shares,
          message: `Document shared with ${shareWith.length} user(s)`,
        };
      } catch (_error) {
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to share document"
        );
      }
    }),

  // Create folder
  createFolder: protectedProcedure
    .use(requirePermission("documents.create"))
    .input(createFolderSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;

      try {
        const [folder] = await db
          .insert(businessSchema.documentFolder)
          .values({
            ...input,
            createdBy: user?.id!,
          })
          .returning({
            id: businessSchema.documentFolder.id,
            name: businessSchema.documentFolder.name,
            description: businessSchema.documentFolder.description,
            parentId: businessSchema.documentFolder.parentId,
            createdAt: businessSchema.documentFolder.createdAt,
          });

        return {
          success: true,
          data: folder,
          message: "Folder created successfully",
        };
      } catch (_error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", "Failed to create folder");
      }
    }),

  // List folders for a client
  listFolders: protectedProcedure
    .use(requirePermission("documents.read"))
    .input(
      z.object({
        clientId: z.string().uuid(),
        parentId: z.string().uuid().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { clientId, parentId } = input;

      const whereConditions = [
        eq(businessSchema.documentFolder.clientId, clientId),
      ];

      if (parentId) {
        whereConditions.push(
          eq(businessSchema.documentFolder.parentId, parentId)
        );
      } else {
        whereConditions.push(
          sql`${businessSchema.documentFolder.parentId} IS NULL`
        );
      }

      const folders = await db
        .select({
          id: businessSchema.documentFolder.id,
          name: businessSchema.documentFolder.name,
          description: businessSchema.documentFolder.description,
          color: businessSchema.documentFolder.color,
          isPrivate: businessSchema.documentFolder.isPrivate,
          parentId: businessSchema.documentFolder.parentId,
          createdAt: businessSchema.documentFolder.createdAt,
          // Count documents in folder
          documentCount: sql<number>`(
            SELECT COUNT(*)
            FROM ${businessSchema.document}
            WHERE ${businessSchema.document.folderId} = ${businessSchema.documentFolder.id}
            AND ${businessSchema.document.status} = 'ACTIVE'
          )`,
        })
        .from(businessSchema.documentFolder)
        .where(and(...whereConditions))
        .orderBy(asc(businessSchema.documentFolder.name));

      return {
        success: true,
        data: folders,
      };
    }),

  // Move document to folder
  moveDocument: protectedProcedure
    .use(requirePermission("documents.update"))
    .input(moveDocumentSchema)
    .handler(async ({ input, context }) => {
      const { db, user } = context;
      const { documentId, folderId } = input;

      // Verify document exists
      const [document] = await db
        .select()
        .from(businessSchema.document)
        .where(eq(businessSchema.document.id, documentId))
        .limit(1);

      if (!document) {
        throw new ORPCError("NOT_FOUND", "Document not found");
      }

      // Verify folder exists if specified
      if (folderId) {
        const [folder] = await db
          .select()
          .from(businessSchema.documentFolder)
          .where(eq(businessSchema.documentFolder.id, folderId))
          .limit(1);

        if (!folder) {
          throw new ORPCError("NOT_FOUND", "Folder not found");
        }

        // Check if folder belongs to same client
        if (folder.clientId !== document.clientId) {
          throw new ORPCError(
            "BAD_REQUEST",
            "Cannot move document to folder of different client"
          );
        }
      }

      try {
        const [movedDocument] = await db
          .update(businessSchema.document)
          .set({
            folderId: folderId || null,
            updatedBy: user?.id,
          })
          .where(eq(businessSchema.document.id, documentId))
          .returning({
            id: businessSchema.document.id,
            name: businessSchema.document.name,
            folderId: businessSchema.document.folderId,
          });

        return {
          success: true,
          data: movedDocument,
          message: "Document moved successfully",
        };
      } catch (_error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", "Failed to move document");
      }
    }),

  // Get document statistics
  getStats: adminProcedure
    .input(
      z.object({
        clientId: z.string().uuid().optional(),
        category: z.string().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { db } = context;
      const { clientId, category } = input;

      let whereClause = eq(businessSchema.document.status, "ACTIVE");
      if (clientId) {
        whereClause = and(
          whereClause,
          eq(businessSchema.document.clientId, clientId)
        );
      }

      const [overallStats] = await db
        .select({
          total: count(),
          totalSize: sql<number>`SUM(${businessSchema.document.fileSize})`,
          avgSize: sql<number>`AVG(${businessSchema.document.fileSize})`,
          confidential: sql<number>`COUNT(*) FILTER (WHERE ${businessSchema.document.isConfidential} = true)`,
        })
        .from(businessSchema.document)
        .where(whereClause);

      const categoryStats = await db
        .select({
          category: businessSchema.document.category,
          count: count(),
          totalSize: sql<number>`SUM(${businessSchema.document.fileSize})`,
        })
        .from(businessSchema.document)
        .where(whereClause)
        .groupBy(businessSchema.document.category);

      const monthlyStats = await db
        .select({
          month: sql<string>`TO_CHAR(${businessSchema.document.uploadedAt}, 'YYYY-MM')`,
          count: count(),
          size: sql<number>`SUM(${businessSchema.document.fileSize})`,
        })
        .from(businessSchema.document)
        .where(whereClause)
        .groupBy(sql`TO_CHAR(${businessSchema.document.uploadedAt}, 'YYYY-MM')`)
        .orderBy(
          sql`TO_CHAR(${businessSchema.document.uploadedAt}, 'YYYY-MM') DESC`
        )
        .limit(12);

      return {
        success: true,
        data: {
          overview: overallStats,
          byCategory: categoryStats,
          byMonth: monthlyStats,
        },
      };
    }),

  // Advanced document search
  search: protectedProcedure
    .use(requirePermission("documents.read"))
    .input(documentSearchSchema)
    .handler(async ({ input, context }) => {
      const { db } = context;
      const {
        query,
        clientId,
        category,
        startDate,
        endDate,
        fileTypes,
        tags,
        includeContent,
        page,
        limit,
      } = input;

      const offset = (page - 1) * limit;
      const conditions = [eq(businessSchema.document.status, "ACTIVE")];

      // Add search conditions
      if (query) {
        conditions.push(
          sql`(
            ${ilike(businessSchema.document.name, `%${query}%`)} OR
            ${ilike(businessSchema.document.description, `%${query}%`)} OR
            ${ilike(businessSchema.document.fileName, `%${query}%`)}
          )`
        );
      }

      if (clientId) {
        conditions.push(eq(businessSchema.document.clientId, clientId));
      }

      if (category) {
        conditions.push(eq(businessSchema.document.category, category));
      }

      if (startDate) {
        conditions.push(
          gte(businessSchema.document.uploadedAt, new Date(startDate))
        );
      }

      if (endDate) {
        conditions.push(
          lte(businessSchema.document.uploadedAt, new Date(endDate))
        );
      }

      if (fileTypes && fileTypes.length > 0) {
        const mimeTypeConditions = fileTypes.map(
          (type) => sql`${businessSchema.document.mimeType} LIKE ${`%${type}%`}`
        );
        conditions.push(sql`(${sql.join(mimeTypeConditions, sql` OR `)})`);
      }

      if (tags && tags.length > 0) {
        const tagConditions = tags.map(
          (tag) => sql`${businessSchema.document.tags} LIKE ${`%"${tag}"%`}`
        );
        conditions.push(sql`(${sql.join(tagConditions, sql` OR `)})`);
      }

      const whereClause = and(...conditions);

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(businessSchema.document)
        .where(whereClause);

      // Get search results
      const searchResults = await db
        .select({
          id: businessSchema.document.id,
          name: businessSchema.document.name,
          description: businessSchema.document.description,
          category: businessSchema.document.category,
          subcategory: businessSchema.document.subcategory,
          fileName: businessSchema.document.fileName,
          fileSize: businessSchema.document.fileSize,
          mimeType: businessSchema.document.mimeType,
          tags: businessSchema.document.tags,
          version: businessSchema.document.version,
          isLatestVersion: businessSchema.document.isLatestVersion,
          clientId: businessSchema.document.clientId,
          uploadedBy: businessSchema.document.uploadedBy,
          uploadedAt: businessSchema.document.uploadedAt,
        })
        .from(businessSchema.document)
        .where(whereClause)
        .orderBy(desc(businessSchema.document.uploadedAt))
        .limit(limit)
        .offset(offset);

      // Parse JSON fields and calculate relevance scores
      const parsedResults = searchResults.map((doc) => ({
        ...doc,
        tags: doc.tags ? JSON.parse(doc.tags) : [],
        relevanceScore: query
          ? (doc.name.toLowerCase().includes(query.toLowerCase()) ? 50 : 0) +
            (doc.fileName.toLowerCase().includes(query.toLowerCase())
              ? 30
              : 0) +
            (doc.description?.toLowerCase().includes(query.toLowerCase())
              ? 20
              : 0)
          : 0,
      }));

      // Sort by relevance if there's a query
      if (query) {
        parsedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      }

      const total = totalResult.count;
      const pages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          query,
          results: parsedResults,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
          searchMetadata: {
            totalMatches: total,
            searchTime: new Date().toISOString(),
            includesContent: includeContent,
          },
        },
      };
    }),

  // Document templates - static reference data
  templates: {
    list: protectedProcedure
      .use(requirePermission("documents.read"))
      .input(
        z.object({
          category: z.string().nullish(),
          search: z.string().nullish(),
        })
      )
      .handler(async ({ input }) => {
        // Static reference templates - no templates table in schema
        const templates = [
          {
            id: "tpl-001",
            name: "Tax Return - Individual",
            category: "tax",
            description:
              "Standard individual tax return template for GRA filing",
            fileType: "pdf",
            version: "2024",
          },
          {
            id: "tpl-002",
            name: "Tax Return - Corporate",
            category: "tax",
            description: "Corporate tax filing template with schedules",
            fileType: "pdf",
            version: "2024",
          },
          {
            id: "tpl-003",
            name: "VAT Return Form",
            category: "tax",
            description: "Quarterly VAT return form for GRA submission",
            fileType: "pdf",
            version: "2024",
          },
          {
            id: "tpl-004",
            name: "Work Permit Application",
            category: "immigration",
            description: "Work permit application form for Ministry of Labour",
            fileType: "pdf",
            version: "2024",
          },
          {
            id: "tpl-005",
            name: "Business Registration",
            category: "compliance",
            description: "New business registration form for Deeds Registry",
            fileType: "pdf",
            version: "2024",
          },
          {
            id: "tpl-006",
            name: "NIS Employer Registration",
            category: "payroll",
            description: "NIS employer registration form",
            fileType: "pdf",
            version: "2024",
          },
          {
            id: "tpl-007",
            name: "Employee Contract",
            category: "hr",
            description: "Standard employment contract template",
            fileType: "docx",
            version: "2024",
          },
          {
            id: "tpl-008",
            name: "Invoice Template",
            category: "invoice",
            description: "Professional service invoice template",
            fileType: "xlsx",
            version: "2024",
          },
          {
            id: "tpl-009",
            name: "PAYE Monthly Return",
            category: "payroll",
            description: "Monthly PAYE return form for GRA",
            fileType: "pdf",
            version: "2024",
          },
          {
            id: "tpl-010",
            name: "Annual Compliance Checklist",
            category: "compliance",
            description: "Annual business compliance checklist",
            fileType: "pdf",
            version: "2024",
          },
        ];

        let filtered = templates;

        if (input.category) {
          filtered = filtered.filter(
            (t) => t.category.toLowerCase() === input.category!.toLowerCase()
          );
        }

        if (input.search) {
          const searchLower = input.search.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.name.toLowerCase().includes(searchLower) ||
              t.description.toLowerCase().includes(searchLower)
          );
        }

        return {
          success: true,
          data: {
            items: filtered,
            total: filtered.length,
          },
        };
      }),

    getById: protectedProcedure
      .use(requirePermission("documents.read"))
      .input(z.object({ id: z.string() }))
      .handler(async ({ input }) => {
        const templates: Record<string, any> = {
          "tpl-001": {
            id: "tpl-001",
            name: "Tax Return - Individual",
            category: "tax",
            description:
              "Standard individual tax return template for GRA filing",
            fileType: "pdf",
            version: "2024",
            fields: ["tin", "income", "deductions", "dependents"],
            instructions: "Complete all sections. Attach supporting documents.",
          },
        };

        const template = templates[input.id];
        if (!template) {
          return { success: false, data: null, message: "Template not found" };
        }

        return { success: true, data: template };
      }),

    categories: protectedProcedure
      .use(requirePermission("documents.read"))
      .handler(async () => ({
        success: true,
        data: [
          { id: "tax", name: "Tax", count: 3 },
          { id: "immigration", name: "Immigration", count: 1 },
          { id: "compliance", name: "Compliance", count: 2 },
          { id: "payroll", name: "Payroll", count: 2 },
          { id: "hr", name: "HR", count: 1 },
          { id: "invoice", name: "Invoice", count: 1 },
        ],
      })),
  },

  // Document requirements by service type
  requirements: {
    list: protectedProcedure
      .use(requirePermission("documents.read"))
      .input(
        z.object({
          serviceType: z.string().nullish(),
        })
      )
      .handler(async ({ input }) => {
        // Static reference data for document requirements
        const requirements = [
          {
            id: "req-001",
            serviceType: "work_permit",
            document: "Valid Passport",
            required: true,
            description:
              "Must be valid for at least 6 months beyond intended stay",
          },
          {
            id: "req-002",
            serviceType: "work_permit",
            document: "Passport Photos",
            required: true,
            description: "2 recent photos, white background, 2x2 inches",
          },
          {
            id: "req-003",
            serviceType: "work_permit",
            document: "Employment Contract",
            required: true,
            description: "Signed by employer, stating position and salary",
          },
          {
            id: "req-004",
            serviceType: "work_permit",
            document: "Police Clearance",
            required: true,
            description: "From country of origin, not older than 6 months",
          },
          {
            id: "req-005",
            serviceType: "work_permit",
            document: "Medical Certificate",
            required: true,
            description: "Recent health examination from approved facility",
          },
          {
            id: "req-006",
            serviceType: "business_registration",
            document: "National ID",
            required: true,
            description: "Valid national ID card for all directors",
          },
          {
            id: "req-007",
            serviceType: "business_registration",
            document: "Proof of Address",
            required: true,
            description:
              "Utility bill or bank statement (not older than 3 months)",
          },
          {
            id: "req-008",
            serviceType: "business_registration",
            document: "Business Plan",
            required: false,
            description: "Required for certain business types",
          },
          {
            id: "req-009",
            serviceType: "tax_filing",
            document: "TIN Certificate",
            required: true,
            description: "Tax Identification Number certificate",
          },
          {
            id: "req-010",
            serviceType: "tax_filing",
            document: "Financial Statements",
            required: true,
            description: "Audited financial statements for corporate filings",
          },
          {
            id: "req-011",
            serviceType: "tax_filing",
            document: "Bank Statements",
            required: false,
            description: "Last 12 months of bank statements",
          },
          {
            id: "req-012",
            serviceType: "vat_registration",
            document: "Business Registration",
            required: true,
            description: "Certificate of incorporation or business name",
          },
          {
            id: "req-013",
            serviceType: "vat_registration",
            document: "Proof of Revenue",
            required: true,
            description: "Evidence of annual revenue exceeding threshold",
          },
        ];

        let filtered = requirements;

        if (input.serviceType) {
          filtered = filtered.filter(
            (r) => r.serviceType === input.serviceType
          );
        }

        return {
          success: true,
          data: {
            items: filtered,
            total: filtered.length,
          },
        };
      }),

    serviceTypes: protectedProcedure
      .use(requirePermission("documents.read"))
      .handler(async () => ({
        success: true,
        data: [
          {
            id: "work_permit",
            name: "Work Permit Application",
            documentCount: 5,
          },
          {
            id: "business_registration",
            name: "Business Registration",
            documentCount: 3,
          },
          { id: "tax_filing", name: "Tax Filing", documentCount: 3 },
          {
            id: "vat_registration",
            name: "VAT Registration",
            documentCount: 2,
          },
        ],
      })),

    checklists: protectedProcedure
      .use(requirePermission("documents.read"))
      .input(
        z.object({
          serviceType: z.string().nullish(),
        })
      )
      .handler(async ({ input }) => {
        const checklists = [
          {
            id: "chk-001",
            serviceType: "work_permit",
            name: "Work Permit Application Checklist",
            items: [
              { document: "Valid Passport", checked: false },
              { document: "Passport Photos", checked: false },
              { document: "Employment Contract", checked: false },
              { document: "Police Clearance", checked: false },
              { document: "Medical Certificate", checked: false },
            ],
          },
          {
            id: "chk-002",
            serviceType: "business_registration",
            name: "Business Registration Checklist",
            items: [
              { document: "National ID", checked: false },
              { document: "Proof of Address", checked: false },
              { document: "Business Plan", checked: false },
            ],
          },
          {
            id: "chk-003",
            serviceType: "tax_filing",
            name: "Tax Filing Checklist",
            items: [
              { document: "TIN Certificate", checked: false },
              { document: "Financial Statements", checked: false },
              { document: "Bank Statements", checked: false },
            ],
          },
        ];

        let filtered = checklists;

        if (input.serviceType) {
          filtered = filtered.filter(
            (c) => c.serviceType === input.serviceType
          );
        }

        return {
          success: true,
          data: {
            items: filtered,
            total: filtered.length,
          },
        };
      }),
  },
};
