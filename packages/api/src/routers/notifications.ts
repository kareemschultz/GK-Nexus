import { db, notificationsSchema } from "@gk-nexus/db";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { z } from "zod";

import { protectedProcedure } from "../index";
import { generateId } from "../lib/id";

const {
  notifications,
  notificationPreferences,
  notificationDeliveries,
  notificationTemplates,
} = notificationsSchema;

// Input validation schemas
const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum([
    "appointment_reminder",
    "appointment_confirmed",
    "appointment_cancelled",
    "document_uploaded",
    "document_signed",
    "invoice_generated",
    "payment_received",
    "payment_overdue",
    "task_assigned",
    "task_completed",
    "compliance_alert",
    "system_maintenance",
    "user_welcome",
    "password_reset",
    "security_alert",
    "custom",
  ]),
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  metadata: z.record(z.any()).optional(),
  actionUrl: z.string().optional(),
  actionText: z.string().optional(),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

const updateNotificationSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  message: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  metadata: z.record(z.any()).optional(),
  actionUrl: z.string().optional(),
  actionText: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

const markReadSchema = z.object({
  id: z.string(),
  isRead: z.boolean().default(true),
});

const bulkMarkReadSchema = z.object({
  notificationIds: z.array(z.string()),
  isRead: z.boolean().default(true),
});

const getNotificationsSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  isRead: z.boolean().optional(),
  type: z.string().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

const notificationPreferencesSchema = z.object({
  enableEmailNotifications: z.boolean().default(true),
  enableInAppNotifications: z.boolean().default(true),
  enablePushNotifications: z.boolean().default(true),
  enableSmsNotifications: z.boolean().default(false),
  typePreferences: z.record(z.array(z.string())).optional(),
  quietHoursEnabled: z.boolean().default(false),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  quietHoursTimezone: z.string().optional(),
  digestEnabled: z.boolean().default(false),
  digestFrequency: z.enum(["daily", "weekly"]).default("daily"),
  digestTime: z.string().default("09:00"),
});

const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.enum([
    "appointment_reminder",
    "appointment_confirmed",
    "appointment_cancelled",
    "document_uploaded",
    "document_signed",
    "invoice_generated",
    "payment_received",
    "payment_overdue",
    "task_assigned",
    "task_completed",
    "compliance_alert",
    "system_maintenance",
    "user_welcome",
    "password_reset",
    "security_alert",
    "custom",
  ]),
  deliveryMethod: z.enum(["in_app", "email", "sms", "push", "webhook"]),
  subject: z.string().optional(),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  variables: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const notificationsRouter = {
  // Create a new notification
  create: protectedProcedure
    .input(createNotificationSchema)
    .handler(async ({ input, context }) => {
      try {
        const notificationId = generateId();

        const [notification] = await db
          .insert(notifications)
          .values({
            id: notificationId,
            userId: input.userId,
            type: input.type,
            title: input.title,
            message: input.message,
            priority: input.priority,
            metadata: input.metadata || null,
            actionUrl: input.actionUrl || null,
            actionText: input.actionText || null,
            relatedEntityType: input.relatedEntityType || null,
            relatedEntityId: input.relatedEntityId || null,
            scheduledFor: input.scheduledFor
              ? new Date(input.scheduledFor)
              : null,
            expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
            createdBy: context.user?.id,
          })
          .returning();

        return notification;
      } catch (error) {
        console.error("Error creating notification:", error);
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create notification"
        );
      }
    }),

  // Get notifications for current user
  getMyNotifications: protectedProcedure
    .input(getNotificationsSchema)
    .handler(async ({ input, context }) => {
      try {
        const userId = context.user?.id;
        if (!userId) {
          throw new ORPCError("UNAUTHORIZED", "User not authenticated");
        }

        const offset = (input.page - 1) * input.limit;
        const conditions = [eq(notifications.userId, userId)];

        // Add filters
        if (input.isRead !== undefined) {
          conditions.push(eq(notifications.isRead, input.isRead));
        }

        if (input.type) {
          conditions.push(eq(notifications.type, input.type as any));
        }

        if (input.priority) {
          conditions.push(eq(notifications.priority, input.priority));
        }

        if (input.dateFrom) {
          conditions.push(
            gte(notifications.createdAt, new Date(input.dateFrom))
          );
        }

        if (input.dateTo) {
          conditions.push(lte(notifications.createdAt, new Date(input.dateTo)));
        }

        // Add condition to exclude archived notifications unless explicitly requested
        conditions.push(eq(notifications.isArchived, false));

        // Add condition to exclude expired notifications
        conditions.push(
          or(
            isNull(notifications.expiresAt),
            gte(notifications.expiresAt, new Date())
          )
        );

        const whereClause = and(...conditions);

        // Get total count
        const [{ count: totalCount }] = await db
          .select({ count: count() })
          .from(notifications)
          .where(whereClause);

        // Get notifications
        const notificationList = await db
          .select()
          .from(notifications)
          .where(whereClause)
          .orderBy(desc(notifications.createdAt))
          .limit(input.limit)
          .offset(offset);

        return {
          notifications: notificationList,
          pagination: {
            page: input.page,
            limit: input.limit,
            total: totalCount,
            pages: Math.ceil(totalCount / input.limit),
          },
        };
      } catch (error) {
        console.error("Error getting notifications:", error);
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to get notifications"
        );
      }
    }),

  // Mark notification as read/unread
  markRead: protectedProcedure
    .input(markReadSchema)
    .handler(async ({ input, context }) => {
      try {
        const userId = context.user?.id;
        if (!userId) {
          throw new ORPCError("UNAUTHORIZED", "User not authenticated");
        }

        const [notification] = await db
          .update(notifications)
          .set({
            isRead: input.isRead,
            readAt: input.isRead ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notifications.id, input.id),
              eq(notifications.userId, userId)
            )
          )
          .returning();

        if (!notification) {
          throw new ORPCError("NOT_FOUND", "Notification not found");
        }

        return notification;
      } catch (error) {
        console.error("Error marking notification as read:", error);
        if (error instanceof ORPCError) throw error;
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to update notification"
        );
      }
    }),

  // Bulk mark notifications as read/unread
  bulkMarkRead: protectedProcedure
    .input(bulkMarkReadSchema)
    .handler(async ({ input, context }) => {
      try {
        const userId = context.user?.id;
        if (!userId) {
          throw new ORPCError("UNAUTHORIZED", "User not authenticated");
        }

        const updatedNotifications = await db
          .update(notifications)
          .set({
            isRead: input.isRead,
            readAt: input.isRead ? new Date() : null,
            updatedAt: new Date(),
          })
          .where(
            and(
              sql`${notifications.id} = ANY(${input.notificationIds})`,
              eq(notifications.userId, userId)
            )
          )
          .returning();

        return {
          updated: updatedNotifications.length,
          notifications: updatedNotifications,
        };
      } catch (error) {
        console.error("Error bulk marking notifications:", error);
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to update notifications"
        );
      }
    }),

  // Mark all notifications as read
  markAllRead: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.user?.id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", "User not authenticated");
      }

      const result = await db
        .update(notifications)
        .set({
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(eq(notifications.userId, userId), eq(notifications.isRead, false))
        );

      return { success: true };
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new ORPCError(
        "INTERNAL_SERVER_ERROR",
        "Failed to update notifications"
      );
    }
  }),

  // Archive notification
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      try {
        const userId = context.user?.id;
        if (!userId) {
          throw new ORPCError("UNAUTHORIZED", "User not authenticated");
        }

        const [notification] = await db
          .update(notifications)
          .set({
            isArchived: true,
            archivedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notifications.id, input.id),
              eq(notifications.userId, userId)
            )
          )
          .returning();

        if (!notification) {
          throw new ORPCError("NOT_FOUND", "Notification not found");
        }

        return notification;
      } catch (error) {
        console.error("Error archiving notification:", error);
        if (error instanceof ORPCError) throw error;
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to archive notification"
        );
      }
    }),

  // Get notification statistics
  getStats: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.user?.id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", "User not authenticated");
      }

      const [stats] = await db
        .select({
          total: count(),
          unread: count(
            sql`CASE WHEN ${notifications.isRead} = false THEN 1 END`
          ),
          archived: count(
            sql`CASE WHEN ${notifications.isArchived} = true THEN 1 END`
          ),
          high_priority: count(
            sql`CASE WHEN ${notifications.priority} = 'high' THEN 1 END`
          ),
          urgent: count(
            sql`CASE WHEN ${notifications.priority} = 'urgent' THEN 1 END`
          ),
        })
        .from(notifications)
        .where(eq(notifications.userId, userId));

      return stats;
    } catch (error) {
      console.error("Error getting notification stats:", error);
      throw new ORPCError(
        "INTERNAL_SERVER_ERROR",
        "Failed to get notification stats"
      );
    }
  }),

  // Get notification preferences
  getPreferences: protectedProcedure.handler(async ({ context }) => {
    try {
      const userId = context.user?.id;
      if (!userId) {
        throw new ORPCError("UNAUTHORIZED", "User not authenticated");
      }

      const [preferences] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId));

      // Return default preferences if none exist
      if (!preferences) {
        return {
          userId,
          enableEmailNotifications: true,
          enableInAppNotifications: true,
          enablePushNotifications: true,
          enableSmsNotifications: false,
          typePreferences: {},
          quietHoursEnabled: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          quietHoursTimezone: "UTC",
          digestEnabled: false,
          digestFrequency: "daily",
          digestTime: "09:00",
        };
      }

      return preferences;
    } catch (error) {
      console.error("Error getting notification preferences:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", "Failed to get preferences");
    }
  }),

  // Update notification preferences
  updatePreferences: protectedProcedure
    .input(notificationPreferencesSchema)
    .handler(async ({ input, context }) => {
      try {
        const userId = context.user?.id;
        if (!userId) {
          throw new ORPCError("UNAUTHORIZED", "User not authenticated");
        }

        // Check if preferences already exist
        const existingPrefs = await db
          .select()
          .from(notificationPreferences)
          .where(eq(notificationPreferences.userId, userId));

        let preferences;

        if (existingPrefs.length > 0) {
          // Update existing preferences
          [preferences] = await db
            .update(notificationPreferences)
            .set({
              enableEmailNotifications: input.enableEmailNotifications,
              enableInAppNotifications: input.enableInAppNotifications,
              enablePushNotifications: input.enablePushNotifications,
              enableSmsNotifications: input.enableSmsNotifications,
              typePreferences: input.typePreferences || null,
              quietHoursEnabled: input.quietHoursEnabled,
              quietHoursStart: input.quietHoursStart || null,
              quietHoursEnd: input.quietHoursEnd || null,
              quietHoursTimezone: input.quietHoursTimezone || null,
              digestEnabled: input.digestEnabled,
              digestFrequency: input.digestFrequency,
              digestTime: input.digestTime,
              updatedAt: new Date(),
            })
            .where(eq(notificationPreferences.userId, userId))
            .returning();
        } else {
          // Create new preferences
          [preferences] = await db
            .insert(notificationPreferences)
            .values({
              id: generateId(),
              userId,
              enableEmailNotifications: input.enableEmailNotifications,
              enableInAppNotifications: input.enableInAppNotifications,
              enablePushNotifications: input.enablePushNotifications,
              enableSmsNotifications: input.enableSmsNotifications,
              typePreferences: input.typePreferences || null,
              quietHoursEnabled: input.quietHoursEnabled,
              quietHoursStart: input.quietHoursStart || null,
              quietHoursEnd: input.quietHoursEnd || null,
              quietHoursTimezone: input.quietHoursTimezone || null,
              digestEnabled: input.digestEnabled,
              digestFrequency: input.digestFrequency,
              digestTime: input.digestTime,
            })
            .returning();
        }

        return preferences;
      } catch (error) {
        console.error("Error updating notification preferences:", error);
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to update preferences"
        );
      }
    }),

  // Create notification template (admin only)
  createTemplate: protectedProcedure
    .input(createTemplateSchema)
    .handler(async ({ input, context }) => {
      try {
        // Check if user has admin permissions
        const userRole = context.user?.role;
        if (!(userRole && ["super_admin", "admin"].includes(userRole))) {
          throw new ORPCError("FORBIDDEN", "Admin access required");
        }

        const templateId = generateId();

        const [template] = await db
          .insert(notificationTemplates)
          .values({
            id: templateId,
            name: input.name,
            type: input.type,
            deliveryMethod: input.deliveryMethod,
            subject: input.subject || null,
            htmlContent: input.htmlContent || null,
            textContent: input.textContent || null,
            variables: input.variables || null,
            metadata: input.metadata || null,
            createdBy: context.user?.id,
          })
          .returning();

        return template;
      } catch (error) {
        console.error("Error creating notification template:", error);
        if (error instanceof ORPCError) throw error;
        throw new ORPCError(
          "INTERNAL_SERVER_ERROR",
          "Failed to create template"
        );
      }
    }),

  // Get notification templates
  getTemplates: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        deliveryMethod: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      try {
        const conditions = [];

        if (input.type) {
          conditions.push(eq(notificationTemplates.type, input.type as any));
        }

        if (input.deliveryMethod) {
          conditions.push(
            eq(
              notificationTemplates.deliveryMethod,
              input.deliveryMethod as any
            )
          );
        }

        if (input.isActive !== undefined) {
          conditions.push(eq(notificationTemplates.isActive, input.isActive));
        }

        const whereClause =
          conditions.length > 0 ? and(...conditions) : undefined;

        const templates = await db
          .select()
          .from(notificationTemplates)
          .where(whereClause)
          .orderBy(desc(notificationTemplates.createdAt));

        return templates;
      } catch (error) {
        console.error("Error getting notification templates:", error);
        throw new ORPCError("INTERNAL_SERVER_ERROR", "Failed to get templates");
      }
    }),
};
