import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { users } from "./users";

// Notification type enumeration
export const notificationTypeEnum = pgEnum("notification_type", [
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
]);

// Notification priority enumeration
export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

// Notification delivery method enumeration
export const deliveryMethodEnum = pgEnum("delivery_method", [
  "in_app",
  "email",
  "sms",
  "push",
  "webhook",
]);

// Notifications table
export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    priority: notificationPriorityEnum("priority").default("normal").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    readAt: timestamp("read_at"),
    archivedAt: timestamp("archived_at"),

    // Additional data for notification context
    metadata: jsonb("metadata"), // JSON object for additional data
    actionUrl: text("action_url"), // URL to navigate when clicked
    actionText: text("action_text"), // Text for action button

    // Related entity information
    relatedEntityType: text("related_entity_type"), // 'client', 'appointment', 'document', etc.
    relatedEntityId: text("related_entity_id"),

    // Scheduling and expiry
    scheduledFor: timestamp("scheduled_for"), // For future notifications
    expiresAt: timestamp("expires_at"), // When notification should expire

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_type_idx").on(table.type),
    index("notifications_priority_idx").on(table.priority),
    index("notifications_is_read_idx").on(table.isRead),
    index("notifications_created_at_idx").on(table.createdAt),
    index("notifications_scheduled_for_idx").on(table.scheduledFor),
    index("notifications_expires_at_idx").on(table.expiresAt),
    index("notifications_related_entity_idx").on(
      table.relatedEntityType,
      table.relatedEntityId
    ),
  ]
);

// Notification preferences table
export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),

    // General preferences
    enableEmailNotifications: boolean("enable_email_notifications")
      .default(true)
      .notNull(),
    enableInAppNotifications: boolean("enable_in_app_notifications")
      .default(true)
      .notNull(),
    enablePushNotifications: boolean("enable_push_notifications")
      .default(true)
      .notNull(),
    enableSmsNotifications: boolean("enable_sms_notifications")
      .default(false)
      .notNull(),

    // Notification type preferences (JSON object mapping types to delivery methods)
    typePreferences: jsonb("type_preferences").default({}), // { "appointment_reminder": ["email", "in_app"], ... }

    // Quiet hours
    quietHoursEnabled: boolean("quiet_hours_enabled").default(false).notNull(),
    quietHoursStart: text("quiet_hours_start"), // "22:00"
    quietHoursEnd: text("quiet_hours_end"), // "08:00"
    quietHoursTimezone: text("quiet_hours_timezone"), // "America/New_York"

    // Frequency settings
    digestEnabled: boolean("digest_enabled").default(false).notNull(),
    digestFrequency: text("digest_frequency").default("daily"), // "daily", "weekly"
    digestTime: text("digest_time").default("09:00"), // "09:00"

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("notification_preferences_user_id_idx").on(table.userId)]
);

// Notification delivery log for tracking sent notifications
export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: text("id").primaryKey(),
    notificationId: text("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),

    // Delivery status and details
    status: text("status").notNull(), // "pending", "sent", "delivered", "failed", "bounced"
    attemptCount: text("attempt_count").default("0").notNull(),
    maxAttempts: text("max_attempts").default("3").notNull(),

    // External provider details
    externalId: text("external_id"), // External provider message ID
    providerResponse: jsonb("provider_response"), // Provider response data

    // Delivery timing
    scheduledAt: timestamp("scheduled_at"),
    sentAt: timestamp("sent_at"),
    deliveredAt: timestamp("delivered_at"),
    failedAt: timestamp("failed_at"),

    // Error details
    errorCode: text("error_code"),
    errorMessage: text("error_message"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("notification_deliveries_notification_id_idx").on(
      table.notificationId
    ),
    index("notification_deliveries_status_idx").on(table.status),
    index("notification_deliveries_delivery_method_idx").on(
      table.deliveryMethod
    ),
    index("notification_deliveries_scheduled_at_idx").on(table.scheduledAt),
    index("notification_deliveries_sent_at_idx").on(table.sentAt),
  ]
);

// Notification templates for email and other delivery methods
export const notificationTemplates = pgTable(
  "notification_templates",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: notificationTypeEnum("type").notNull(),
    deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),

    // Template content
    subject: text("subject"), // For email templates
    htmlContent: text("html_content"), // HTML template
    textContent: text("text_content"), // Plain text template

    // Template variables and metadata
    variables: jsonb("variables"), // Available template variables
    metadata: jsonb("metadata"), // Additional template metadata

    // Template status
    isActive: boolean("is_active").default(true).notNull(),
    version: text("version").default("1.0").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdBy: text("created_by").references(() => users.id),
  },
  (table) => [
    index("notification_templates_type_idx").on(table.type),
    index("notification_templates_delivery_method_idx").on(
      table.deliveryMethod
    ),
    index("notification_templates_is_active_idx").on(table.isActive),
  ]
);

// Relations
export const notificationsRelations = relations(
  notifications,
  ({ one, many }) => ({
    user: one(users, {
      fields: [notifications.userId],
      references: [users.id],
    }),
    createdByUser: one(users, {
      fields: [notifications.createdBy],
      references: [users.id],
    }),
    deliveries: many(notificationDeliveries),
  })
);

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    user: one(users, {
      fields: [notificationPreferences.userId],
      references: [users.id],
    }),
  })
);

export const notificationDeliveriesRelations = relations(
  notificationDeliveries,
  ({ one }) => ({
    notification: one(notifications, {
      fields: [notificationDeliveries.notificationId],
      references: [notifications.id],
    }),
  })
);

export const notificationTemplatesRelations = relations(
  notificationTemplates,
  ({ one }) => ({
    createdByUser: one(users, {
      fields: [notificationTemplates.createdBy],
      references: [users.id],
    }),
  })
);
