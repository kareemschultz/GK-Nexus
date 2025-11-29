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
        const [document] = await db
          .insert(businessSchema.document)
          .values({
            ...input,
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
};
