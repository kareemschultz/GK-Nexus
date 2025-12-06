import { backupSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../index";
import { getBackupService } from "../services/backup-service";

// Input schemas
const createBackupSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  backupType: z
    .enum(["FULL", "INCREMENTAL", "DIFFERENTIAL", "SETTINGS", "SELECTIVE"])
    .default("FULL"),
  includeTables: z.array(z.string()).optional(),
  excludeTables: z.array(z.string()).optional(),
  includeDocuments: z.boolean().default(true),
  includeAuditLogs: z.boolean().default(true),
  isEncrypted: z.boolean().default(true),
  storageLocation: z
    .enum(["LOCAL", "S3", "GCS", "AZURE", "FTP"])
    .default("LOCAL"),
  storageConfig: z.record(z.string(), z.unknown()).optional(),
});

const createScheduleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  backupType: z
    .enum(["FULL", "INCREMENTAL", "DIFFERENTIAL", "SETTINGS", "SELECTIVE"])
    .default("FULL"),
  cronExpression: z.string().min(1),
  timezone: z.string().default("America/Guyana"),
  retentionDays: z.number().int().min(1).max(365).default(30),
  maxBackups: z.number().int().min(1).max(100).optional(),
  includeTables: z.array(z.string()).optional(),
  excludeTables: z.array(z.string()).optional(),
  includeDocuments: z.boolean().default(true),
  includeAuditLogs: z.boolean().default(true),
  isEncrypted: z.boolean().default(true),
  storageLocation: z
    .enum(["LOCAL", "S3", "GCS", "AZURE", "FTP"])
    .default("LOCAL"),
  storageConfig: z.record(z.string(), z.unknown()).optional(),
  notifyOnSuccess: z.boolean().default(false),
  notifyOnFailure: z.boolean().default(true),
  notificationEmails: z.array(z.string().email()).optional(),
});

const restoreBackupSchema = z.object({
  backupId: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  restoreType: z.enum(["full", "selective", "point_in_time"]).default("full"),
  selectedTables: z.array(z.string()).optional(),
  restoreDocuments: z.boolean().default(true),
  restoreAuditLogs: z.boolean().default(true),
  overwriteExisting: z.boolean().default(false),
  createPreRestoreBackup: z.boolean().default(true),
});

const listBackupsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      "PENDING",
      "IN_PROGRESS",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
      "EXPIRED",
    ])
    .optional(),
  backupType: z
    .enum(["FULL", "INCREMENTAL", "DIFFERENTIAL", "SETTINGS", "SELECTIVE"])
    .optional(),
  storageLocation: z.enum(["LOCAL", "S3", "GCS", "AZURE", "FTP"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z.enum(["createdAt", "sizeBytes", "name"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Helper functions
function getSystemSettings(): Record<string, unknown> {
  return {
    exportedAt: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
  };
}

function calculateNextRun(_cronExpression: string, _timezone: string): Date {
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 1);
  nextRun.setHours(2, 0, 0, 0);
  return nextRun;
}

// Create a new backup
export const backupCreate = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(createBackupSchema)
  .handler(async ({ input, context }) => {
    const { db } = context;
    const backupId = crypto.randomUUID();
    const backupService = getBackupService();

    try {
      // Create backup record
      await db
        .insert(backupSchema.backups)
        .values({
          id: backupId,
          name: input.name || `Backup ${new Date().toISOString()}`,
          description: input.description,
          backupType: input.backupType,
          status: "IN_PROGRESS",
          storageLocation: input.storageLocation,
          storageConfig: input.storageConfig,
          includedTables: input.includeTables,
          excludedTables: input.excludeTables,
          includesDocuments: input.includeDocuments,
          includesAuditLogs: input.includeAuditLogs,
          isEncrypted: input.isEncrypted,
          startedAt: new Date(),
          createdBy: context.user.id,
        })
        .returning();

      // Log audit
      await db.insert(backupSchema.backupAuditLog).values({
        id: crypto.randomUUID(),
        backupId,
        action: "create",
        actionDetails: { input },
        newStatus: "IN_PROGRESS",
        performedBy: context.user.id,
      });

      // Execute backup based on type
      let result;
      switch (input.backupType) {
        case "FULL":
          result = await backupService.createFullBackup({
            name: input.name,
            excludeTables: input.excludeTables,
            includeData: true,
          });
          break;
        case "SELECTIVE":
          if (!input.includeTables?.length) {
            throw new ORPCError("BAD_REQUEST", {
              message: "Selective backup requires includeTables",
            });
          }
          result = await backupService.createSelectiveBackup(
            input.includeTables,
            input.name
          );
          break;
        case "SETTINGS": {
          const settings = getSystemSettings();
          result = await backupService.createSettingsBackup(settings);
          break;
        }
        default:
          result = await backupService.createFullBackup({
            name: input.name,
            excludeTables: input.excludeTables,
          });
      }

      // Update backup record with results
      const newStatus = result.success ? "COMPLETED" : "FAILED";
      await db
        .update(backupSchema.backups)
        .set({
          status: newStatus,
          storagePath: result.filePath,
          sizeBytes: result.sizeBytes?.toString(),
          compressedSizeBytes: result.compressedSizeBytes?.toString(),
          checksum: result.checksum,
          completedAt: new Date(),
          durationMs: result.durationMs,
          tableCount: result.tablesBackedUp?.length,
          errorMessage: result.error,
        })
        .where(eq(backupSchema.backups.id, backupId));

      // Log completion
      await db.insert(backupSchema.backupAuditLog).values({
        id: crypto.randomUUID(),
        backupId,
        action: result.success ? "complete" : "fail",
        actionDetails: { result },
        previousStatus: "IN_PROGRESS",
        newStatus,
        performedBy: context.user.id,
      });

      // Add table details if available
      if (result.tablesBackedUp?.length) {
        await db.insert(backupSchema.backupTableDetails).values(
          result.tablesBackedUp.map((table) => ({
            id: crypto.randomUUID(),
            backupId,
            tableName: table,
            status: "completed",
          }))
        );
      }

      return {
        success: result.success,
        data: {
          backupId,
          filePath: result.filePath,
          sizeBytes: result.sizeBytes,
          compressedSizeBytes: result.compressedSizeBytes,
          checksum: result.checksum,
          durationMs: result.durationMs,
          tablesBackedUp: result.tablesBackedUp,
        },
        message: result.success
          ? "Backup created successfully"
          : `Backup failed: ${result.error}`,
      };
    } catch (error) {
      // Update backup status to failed
      await db
        .update(backupSchema.backups)
        .set({
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
        .where(eq(backupSchema.backups.id, backupId));

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          error instanceof Error ? error.message : "Failed to create backup",
      });
    }
  });

// List backups with filtering and pagination
export const backupList = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(listBackupsSchema)
  .handler(async ({ input, context }) => {
    const { db } = context;
    const {
      page,
      limit,
      status,
      backupType,
      storageLocation,
      startDate,
      endDate,
      sortOrder,
    } = input;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (status) conditions.push(eq(backupSchema.backups.status, status));
    if (backupType)
      conditions.push(eq(backupSchema.backups.backupType, backupType));
    if (storageLocation)
      conditions.push(
        eq(backupSchema.backups.storageLocation, storageLocation)
      );
    if (startDate)
      conditions.push(gte(backupSchema.backups.createdAt, new Date(startDate)));
    if (endDate)
      conditions.push(lte(backupSchema.backups.createdAt, new Date(endDate)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(backupSchema.backups)
      .where(whereClause);

    if (!countResult) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get backup count",
      });
    }

    // Get backups
    const backupListResult = await db
      .select()
      .from(backupSchema.backups)
      .where(whereClause)
      .orderBy(
        sortOrder === "desc"
          ? desc(backupSchema.backups.createdAt)
          : backupSchema.backups.createdAt
      )
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        backups: backupListResult,
        pagination: {
          page,
          limit,
          total: Number(countResult.count),
          totalPages: Math.ceil(Number(countResult.count) / limit),
        },
      },
    };
  });

// Get backup by ID
export const backupGetById = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { db } = context;

    const backup = await db
      .select()
      .from(backupSchema.backups)
      .where(eq(backupSchema.backups.id, input.id))
      .limit(1);

    if (!backup.length) {
      throw new ORPCError("NOT_FOUND", { message: "Backup not found" });
    }

    // Get table details
    const tableDetails = await db
      .select()
      .from(backupSchema.backupTableDetails)
      .where(eq(backupSchema.backupTableDetails.backupId, input.id));

    // Get audit log
    const auditLog = await db
      .select()
      .from(backupSchema.backupAuditLog)
      .where(eq(backupSchema.backupAuditLog.backupId, input.id))
      .orderBy(desc(backupSchema.backupAuditLog.createdAt));

    return {
      success: true,
      data: {
        ...backup[0],
        tableDetails,
        auditLog,
      },
    };
  });

// Delete a backup
export const backupDelete = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { db } = context;

    const backup = await db
      .select()
      .from(backupSchema.backups)
      .where(eq(backupSchema.backups.id, input.id))
      .limit(1);

    if (!backup.length) {
      throw new ORPCError("NOT_FOUND", { message: "Backup not found" });
    }

    const backupService = getBackupService();
    await backupService.deleteBackup(input.id);

    // Soft delete in database
    await db
      .update(backupSchema.backups)
      .set({ status: "EXPIRED", isExpired: true })
      .where(eq(backupSchema.backups.id, input.id));

    // Log deletion
    await db.insert(backupSchema.backupAuditLog).values({
      id: crypto.randomUUID(),
      backupId: input.id,
      action: "delete",
      previousStatus: backup[0]?.status,
      newStatus: "EXPIRED",
      performedBy: context.user.id,
    });

    return {
      success: true,
      message: "Backup deleted successfully",
    };
  });

// Verify backup integrity
export const backupVerify = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { db } = context;

    const backup = await db
      .select()
      .from(backupSchema.backups)
      .where(eq(backupSchema.backups.id, input.id))
      .limit(1);

    if (!backup.length) {
      throw new ORPCError("NOT_FOUND", { message: "Backup not found" });
    }

    const storagePath = backup[0]?.storagePath;
    if (!storagePath) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Backup file path not available",
      });
    }

    const backupService = getBackupService();
    const result = await backupService.verifyBackup(storagePath);

    return {
      success: true,
      data: {
        valid: result.valid,
        error: result.error,
      },
      message: result.valid
        ? "Backup integrity verified successfully"
        : `Backup verification failed: ${result.error}`,
    };
  });

// Restore from backup
export const backupRestore = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(restoreBackupSchema)
  .handler(async ({ input, context }) => {
    const { db } = context;

    const backup = await db
      .select()
      .from(backupSchema.backups)
      .where(eq(backupSchema.backups.id, input.backupId))
      .limit(1);

    if (!backup.length) {
      throw new ORPCError("NOT_FOUND", { message: "Backup not found" });
    }

    const backupData = backup[0];
    if (!backupData || backupData.status !== "COMPLETED") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot restore from incomplete backup",
      });
    }

    const restoreId = crypto.randomUUID();
    const backupService = getBackupService();

    try {
      // Create pre-restore backup if requested
      let preRestoreBackupId: string | undefined;
      if (input.createPreRestoreBackup) {
        const preBackupResult = await backupService.createFullBackup({
          name: `pre-restore-${restoreId}`,
        });
        preRestoreBackupId = preBackupResult.backupId;
      }

      // Create restore operation record
      await db.insert(backupSchema.restoreOperations).values({
        id: restoreId,
        backupId: input.backupId,
        name: input.name || `Restore from ${backupData.name}`,
        description: input.description,
        status: "IN_PROGRESS",
        restoreType: input.restoreType,
        selectedTables: input.selectedTables,
        restoreDocuments: input.restoreDocuments,
        restoreAuditLogs: input.restoreAuditLogs,
        overwriteExisting: input.overwriteExisting,
        createPreRestoreBackup: input.createPreRestoreBackup,
        preRestoreBackupId,
        startedAt: new Date(),
        initiatedBy: context.user.id,
      });

      // Log audit
      await db.insert(backupSchema.backupAuditLog).values({
        id: crypto.randomUUID(),
        backupId: input.backupId,
        restoreOperationId: restoreId,
        action: "restore_start",
        actionDetails: { input },
        performedBy: context.user.id,
      });

      // Execute restore
      const backupStoragePath = backupData.storagePath;
      if (!backupStoragePath) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Backup file path not available",
        });
      }

      const result = await backupService.restoreFromBackup(backupStoragePath, {
        selectedTables: input.selectedTables,
        dropExisting: input.overwriteExisting,
      });

      // Update restore operation status
      const newStatus = result.success ? "COMPLETED" : "FAILED";
      await db
        .update(backupSchema.restoreOperations)
        .set({
          status: newStatus,
          completedAt: new Date(),
          durationMs: result.durationMs,
          errorMessage: result.error,
        })
        .where(eq(backupSchema.restoreOperations.id, restoreId));

      // Log completion
      await db.insert(backupSchema.backupAuditLog).values({
        id: crypto.randomUUID(),
        backupId: input.backupId,
        restoreOperationId: restoreId,
        action: result.success ? "restore_complete" : "restore_fail",
        actionDetails: { result },
        performedBy: context.user.id,
      });

      return {
        success: result.success,
        data: {
          restoreId,
          durationMs: result.durationMs,
          tablesRestored: result.tablesRestored,
          preRestoreBackupId,
        },
        message: result.success
          ? "Restore completed successfully"
          : `Restore failed: ${result.error}`,
      };
    } catch (error) {
      await db
        .update(backupSchema.restoreOperations)
        .set({
          status: "FAILED",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          completedAt: new Date(),
        })
        .where(eq(backupSchema.restoreOperations.id, restoreId));

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          error instanceof Error ? error.message : "Failed to restore backup",
      });
    }
  });

// Create backup schedule
export const backupCreateSchedule = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(createScheduleSchema)
  .handler(async ({ input, context }) => {
    const { db } = context;
    const scheduleId = crypto.randomUUID();

    const [schedule] = await db
      .insert(backupSchema.backupSchedules)
      .values({
        id: scheduleId,
        name: input.name,
        description: input.description,
        backupType: input.backupType,
        cronExpression: input.cronExpression,
        timezone: input.timezone,
        retentionDays: input.retentionDays,
        maxBackups: input.maxBackups,
        includeTables: input.includeTables,
        excludeTables: input.excludeTables,
        includeDocuments: input.includeDocuments,
        includeAuditLogs: input.includeAuditLogs,
        isEncrypted: input.isEncrypted,
        storageLocation: input.storageLocation,
        storageConfig: input.storageConfig,
        notifyOnSuccess: input.notifyOnSuccess,
        notifyOnFailure: input.notifyOnFailure,
        notificationEmails: input.notificationEmails,
        isEnabled: true,
        nextRunAt: calculateNextRun(input.cronExpression, input.timezone),
        createdBy: context.user.id,
      })
      .returning();

    await db.insert(backupSchema.backupAuditLog).values({
      id: crypto.randomUUID(),
      scheduleId,
      action: "schedule_create",
      actionDetails: { input },
      performedBy: context.user.id,
    });

    return {
      success: true,
      data: schedule,
      message: "Backup schedule created successfully",
    };
  });

// List backup schedules
export const backupListSchedules = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(
    z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      isEnabled: z.boolean().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { page, limit, isEnabled } = input;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (isEnabled !== undefined) {
      conditions.push(eq(backupSchema.backupSchedules.isEnabled, isEnabled));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(backupSchema.backupSchedules)
      .where(whereClause);

    if (!countResult) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get schedule count",
      });
    }

    const schedules = await db
      .select()
      .from(backupSchema.backupSchedules)
      .where(whereClause)
      .orderBy(desc(backupSchema.backupSchedules.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        schedules,
        pagination: {
          page,
          limit,
          total: Number(countResult.count),
          totalPages: Math.ceil(Number(countResult.count) / limit),
        },
      },
    };
  });

// Update schedule
export const backupUpdateSchedule = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(1000).optional(),
      cronExpression: z.string().min(1).optional(),
      isEnabled: z.boolean().optional(),
      retentionDays: z.number().int().min(1).max(365).optional(),
      maxBackups: z.number().int().min(1).max(100).optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { id, ...updates } = input;

    const existing = await db
      .select()
      .from(backupSchema.backupSchedules)
      .where(eq(backupSchema.backupSchedules.id, id))
      .limit(1);

    if (!existing.length) {
      throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
    }

    const existingSchedule = existing[0];
    const [updated] = await db
      .update(backupSchema.backupSchedules)
      .set({
        ...updates,
        nextRunAt:
          updates.cronExpression && existingSchedule
            ? calculateNextRun(
                updates.cronExpression,
                existingSchedule.timezone
              )
            : undefined,
      })
      .where(eq(backupSchema.backupSchedules.id, id))
      .returning();

    await db.insert(backupSchema.backupAuditLog).values({
      id: crypto.randomUUID(),
      scheduleId: id,
      action: "schedule_update",
      actionDetails: { updates },
      performedBy: context.user.id,
    });

    return {
      success: true,
      data: updated,
      message: "Schedule updated successfully",
    };
  });

// Delete schedule
export const backupDeleteSchedule = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input, context }) => {
    const { db } = context;

    const existing = await db
      .select()
      .from(backupSchema.backupSchedules)
      .where(eq(backupSchema.backupSchedules.id, input.id))
      .limit(1);

    if (!existing.length) {
      throw new ORPCError("NOT_FOUND", { message: "Schedule not found" });
    }

    await db
      .delete(backupSchema.backupSchedules)
      .where(eq(backupSchema.backupSchedules.id, input.id));

    await db.insert(backupSchema.backupAuditLog).values({
      id: crypto.randomUUID(),
      scheduleId: input.id,
      action: "schedule_delete",
      performedBy: context.user.id,
    });

    return {
      success: true,
      message: "Schedule deleted successfully",
    };
  });

// Get storage statistics
export const backupGetStorageStats = protectedProcedure
  // .use(requirePermission("system.admin"))
  .handler(async ({ context }) => {
    const { db } = context;
    const backupService = getBackupService();
    const stats = await backupService.getStorageStats();

    // Get database stats
    const backupsByStatus = await db
      .select({
        status: backupSchema.backups.status,
        count: sql<number>`count(*)`,
      })
      .from(backupSchema.backups)
      .groupBy(backupSchema.backups.status);

    const backupsByType = await db
      .select({
        backupType: backupSchema.backups.backupType,
        count: sql<number>`count(*)`,
      })
      .from(backupSchema.backups)
      .groupBy(backupSchema.backups.backupType);

    return {
      success: true,
      data: {
        ...stats,
        backupsByStatus,
        backupsByType,
      },
    };
  });

// Get restore operations
export const backupListRestoreOperations = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(
    z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(20),
      status: z
        .enum([
          "PENDING",
          "VALIDATING",
          "IN_PROGRESS",
          "COMPLETED",
          "FAILED",
          "ROLLED_BACK",
        ])
        .optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { page, limit, status } = input;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (status)
      conditions.push(eq(backupSchema.restoreOperations.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(backupSchema.restoreOperations)
      .where(whereClause);

    if (!countResult) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get restore operation count",
      });
    }

    const operations = await db
      .select()
      .from(backupSchema.restoreOperations)
      .where(whereClause)
      .orderBy(desc(backupSchema.restoreOperations.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        operations,
        pagination: {
          page,
          limit,
          total: Number(countResult.count),
          totalPages: Math.ceil(Number(countResult.count) / limit),
        },
      },
    };
  });

// Export settings backup
export const backupExportSettings = protectedProcedure
  // .use(requirePermission("system.admin"))
  .handler(async () => {
    const backupService = getBackupService();
    const settings = getSystemSettings();
    const result = await backupService.createSettingsBackup(settings);

    return {
      success: result.success,
      data: {
        backupId: result.backupId,
        filePath: result.filePath,
        checksum: result.checksum,
      },
      message: result.success
        ? "Settings exported successfully"
        : `Export failed: ${result.error}`,
    };
  });

// Get audit log
export const backupGetAuditLog = protectedProcedure
  // .use(requirePermission("system.admin"))
  .input(
    z.object({
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
      backupId: z.string().uuid().optional(),
      restoreOperationId: z.string().uuid().optional(),
      action: z.string().optional(),
    })
  )
  .handler(async ({ input, context }) => {
    const { db } = context;
    const { page, limit, backupId, restoreOperationId, action } = input;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (backupId)
      conditions.push(eq(backupSchema.backupAuditLog.backupId, backupId));
    if (restoreOperationId)
      conditions.push(
        eq(backupSchema.backupAuditLog.restoreOperationId, restoreOperationId)
      );
    if (action) conditions.push(eq(backupSchema.backupAuditLog.action, action));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(backupSchema.backupAuditLog)
      .where(whereClause);

    if (!countResult) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get audit log count",
      });
    }

    const logs = await db
      .select()
      .from(backupSchema.backupAuditLog)
      .where(whereClause)
      .orderBy(desc(backupSchema.backupAuditLog.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total: Number(countResult.count),
          totalPages: Math.ceil(Number(countResult.count) / limit),
        },
      },
    };
  });
