import { z } from "zod";

// Enum schemas
export const roleSchema = z.enum([
  "super_admin",
  "admin",
  "manager",
  "accountant",
  "client_service",
  "read_only",
]);

export const userStatusSchema = z.enum([
  "active",
  "inactive",
  "suspended",
  "pending",
]);

// Base user schema
export const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  emailVerified: z.boolean().default(false),
  image: z.string().url().nullable().optional(),
  role: roleSchema.default("read_only"),
  status: userStatusSchema.default("active"),
  permissions: z.string().nullable().optional(), // JSON array of permissions
  department: z.string().max(100).nullable().optional(),
  phoneNumber: z.string().max(20).nullable().optional(),
  lastLoginAt: z.date().nullable().optional(),
  passwordChangedAt: z.date().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable().optional(),
  updatedBy: z.string().nullable().optional(),
});

// Schemas for API operations
export const createUserSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  role: roleSchema.default("read_only"),
  status: userStatusSchema.default("active"),
  permissions: z.array(z.string()).optional(),
  department: z.string().max(100).optional(),
  phoneNumber: z.string().max(20).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  role: roleSchema.optional(),
  status: userStatusSchema.optional(),
  permissions: z.array(z.string()).optional(),
  department: z.string().max(100).optional(),
  phoneNumber: z.string().max(20).optional(),
  image: z.string().url().optional(),
});

export const userQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().nullish(),
  role: roleSchema.nullish(),
  status: userStatusSchema.nullish(),
  department: z.string().nullish(),
  sortBy: z
    .enum(["name", "email", "role", "status", "createdAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(255),
    confirmPassword: z.string().min(8).max(255),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email(),
});

export const updatePermissionsSchema = z.object({
  userId: z.string().min(1),
  permissions: z.array(z.string()),
  role: roleSchema.optional(),
});

export const bulkUserActionSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1),
  action: z.enum(["activate", "deactivate", "suspend", "delete"]),
  reason: z.string().optional(),
});

// User session schema
export const userSessionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  expiresAt: z.date(),
  token: z.string().min(1),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Export types
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
export type UpdatePermissions = z.infer<typeof updatePermissionsSchema>;
export type BulkUserAction = z.infer<typeof bulkUserActionSchema>;
export type UserSession = z.infer<typeof userSessionSchema>;
export type Role = z.infer<typeof roleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;
