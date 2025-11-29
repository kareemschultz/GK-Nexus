import { auth } from "@GK-Nexus/auth";
import { usersSchema } from "@GK-Nexus/db";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, ilike, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  adminProcedure,
  protectedProcedure,
  requirePermission,
} from "../index";
import { getUserPermissions } from "../middleware/rbac";
import {
  bulkUserActionSchema,
  changePasswordSchema,
  createUserSchema,
  resetPasswordSchema,
  updatePermissionsSchema,
  updateUserSchema,
  userQuerySchema,
} from "../schemas";

export const usersRouter = {
  // Get all users with filtering and pagination
  list: protectedProcedure
    .use(requirePermission("users.read"))
    .input(userQuerySchema)
    .handler(async ({ input, context }) => {
      const {
        page,
        limit,
        search,
        role,
        status,
        department,
        sortBy,
        sortOrder,
      } = input;

      const { db } = context;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];

      if (search) {
        conditions.push(
          sql`(
            ${ilike(usersSchema.users.name, `%${search}%`)} OR
            ${ilike(usersSchema.users.email, `%${search}%`)} OR
            ${ilike(usersSchema.users.department, `%${search}%`)}
          )`
        );
      }

      if (role) {
        conditions.push(eq(usersSchema.users.role, role));
      }

      if (status) {
        conditions.push(eq(usersSchema.users.status, status));
      }

      if (department) {
        conditions.push(eq(usersSchema.users.department, department));
      }

      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [totalResult] = await db
        .select({ count: count() })
        .from(usersSchema.users)
        .where(whereClause);

      // Get users with sorting
      const sortColumn =
        usersSchema.users[sortBy as keyof typeof usersSchema.users];
      const orderClause =
        sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

      const users = await db
        .select({
          id: usersSchema.users.id,
          name: usersSchema.users.name,
          email: usersSchema.users.email,
          role: usersSchema.users.role,
          status: usersSchema.users.status,
          department: usersSchema.users.department,
          phoneNumber: usersSchema.users.phoneNumber,
          lastLoginAt: usersSchema.users.lastLoginAt,
          createdAt: usersSchema.users.createdAt,
          updatedAt: usersSchema.users.updatedAt,
          // Don't expose sensitive information like permissions in list view
        })
        .from(usersSchema.users)
        .where(whereClause)
        .orderBy(orderClause)
        .limit(limit)
        .offset(offset);

      const total = totalResult.count;
      const pages = Math.ceil(total / limit);

      return {
        success: true,
        data: {
          items: users,
          pagination: {
            page,
            limit,
            total,
            pages,
          },
        },
      };
    }),

  // Get user by ID
  getById: protectedProcedure
    .use(requirePermission("users.read"))
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const { db, user: currentUser } = context;
      const { id } = input;

      // Users can always view their own profile
      if (currentUser?.id !== id) {
        // Check if user has permission to read other users
        const canReadOthers = getUserPermissions(
          currentUser?.role!,
          currentUser?.permissions
        ).includes("users.read");
        if (!canReadOthers) {
          throw new ORPCError(
            "FORBIDDEN",
            "You can only view your own profile"
          );
        }
      }

      const [user] = await db
        .select({
          id: usersSchema.users.id,
          name: usersSchema.users.name,
          email: usersSchema.users.email,
          emailVerified: usersSchema.users.emailVerified,
          image: usersSchema.users.image,
          role: usersSchema.users.role,
          status: usersSchema.users.status,
          permissions: usersSchema.users.permissions,
          department: usersSchema.users.department,
          phoneNumber: usersSchema.users.phoneNumber,
          lastLoginAt: usersSchema.users.lastLoginAt,
          passwordChangedAt: usersSchema.users.passwordChangedAt,
          createdAt: usersSchema.users.createdAt,
          updatedAt: usersSchema.users.updatedAt,
          createdBy: usersSchema.users.createdBy,
          updatedBy: usersSchema.users.updatedBy,
        })
        .from(usersSchema.users)
        .where(eq(usersSchema.users.id, id))
        .limit(1);

      if (!user) {
        throw new ORPCError("NOT_FOUND", "User not found");
      }

      // Parse permissions from JSON
      const userData = {
        ...user,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      };

      return {
        success: true,
        data: userData,
      };
    }),

  // Get current user's profile
  me: protectedProcedure.handler(async ({ context }) => {
    const { user } = context;

    if (!user) {
      throw new ORPCError("UNAUTHORIZED", "Authentication required");
    }

    return {
      success: true,
      data: {
        ...user,
        permissions: getUserPermissions(user.role, user.permissions),
      },
    };
  }),

  // Create new user
  create: protectedProcedure
    .use(requirePermission("users.create"))
    .input(createUserSchema)
    .handler(async ({ input, context }) => {
      const { db, user: currentUser } = context;

      // Check if email already exists
      const [existingUser] = await db
        .select()
        .from(usersSchema.users)
        .where(eq(usersSchema.users.email, input.email))
        .limit(1);

      if (existingUser) {
        throw new ORPCError("CONFLICT", "User with this email already exists");
      }

      const userData = {
        ...input,
        id: nanoid(),
        emailVerified: false,
        permissions: input.permissions
          ? JSON.stringify(input.permissions)
          : null,
        createdBy: currentUser?.id,
        updatedBy: currentUser?.id,
      };

      const [newUser] = await db
        .insert(usersSchema.users)
        .values(userData)
        .returning({
          id: usersSchema.users.id,
          name: usersSchema.users.name,
          email: usersSchema.users.email,
          role: usersSchema.users.role,
          status: usersSchema.users.status,
          department: usersSchema.users.department,
          phoneNumber: usersSchema.users.phoneNumber,
          createdAt: usersSchema.users.createdAt,
        });

      return {
        success: true,
        data: newUser,
        message: "User created successfully",
      };
    }),

  // Update user
  update: protectedProcedure
    .use(requirePermission("users.update"))
    .input(z.object({ id: z.string().min(1), data: updateUserSchema }))
    .handler(async ({ input, context }) => {
      const { db, user: currentUser } = context;
      const { id, data } = input;

      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(usersSchema.users)
        .where(eq(usersSchema.users.id, id))
        .limit(1);

      if (!existingUser) {
        throw new ORPCError("NOT_FOUND", "User not found");
      }

      // Users can update their own basic profile
      const isOwnProfile = currentUser?.id === id;
      const canUpdateOthers = getUserPermissions(
        currentUser?.role!,
        currentUser?.permissions
      ).includes("users.update");

      if (!(isOwnProfile || canUpdateOthers)) {
        throw new ORPCError(
          "FORBIDDEN",
          "You can only update your own profile"
        );
      }

      // Prevent non-admins from updating sensitive fields
      const updateData: any = { ...data };
      if (!canUpdateOthers || isOwnProfile) {
        updateData.role = undefined;
        updateData.status = undefined;
        updateData.permissions = undefined;
      }

      // Check email uniqueness if email is being updated
      if (data.email && data.email !== existingUser.email) {
        const [emailExists] = await db
          .select()
          .from(usersSchema.users)
          .where(eq(usersSchema.users.email, data.email))
          .limit(1);

        if (emailExists) {
          throw new ORPCError(
            "CONFLICT",
            "User with this email already exists"
          );
        }
      }

      updateData.updatedBy = currentUser?.id;
      updateData.permissions = data.permissions
        ? JSON.stringify(data.permissions)
        : undefined;

      const [updatedUser] = await db
        .update(usersSchema.users)
        .set(updateData)
        .where(eq(usersSchema.users.id, id))
        .returning({
          id: usersSchema.users.id,
          name: usersSchema.users.name,
          email: usersSchema.users.email,
          role: usersSchema.users.role,
          status: usersSchema.users.status,
          department: usersSchema.users.department,
          phoneNumber: usersSchema.users.phoneNumber,
          updatedAt: usersSchema.users.updatedAt,
        });

      return {
        success: true,
        data: updatedUser,
        message: "User updated successfully",
      };
    }),

  // Delete user (deactivate)
  delete: protectedProcedure
    .use(requirePermission("users.delete"))
    .input(z.object({ id: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      const { db, user: currentUser } = context;
      const { id } = input;

      // Prevent users from deleting themselves
      if (currentUser?.id === id) {
        throw new ORPCError(
          "BAD_REQUEST",
          "You cannot delete your own account"
        );
      }

      const [deletedUser] = await db
        .update(usersSchema.users)
        .set({
          status: "inactive",
          updatedBy: currentUser?.id,
        })
        .where(eq(usersSchema.users.id, id))
        .returning({
          id: usersSchema.users.id,
          name: usersSchema.users.name,
          status: usersSchema.users.status,
        });

      if (!deletedUser) {
        throw new ORPCError("NOT_FOUND", "User not found");
      }

      return {
        success: true,
        message: "User deactivated successfully",
      };
    }),

  // Change password
  changePassword: protectedProcedure
    .input(changePasswordSchema)
    .handler(async ({ input, context }) => {
      const { user } = context;
      const { currentPassword, newPassword } = input;

      if (!user) {
        throw new ORPCError("UNAUTHORIZED", "Authentication required");
      }

      try {
        // Use Better Auth to change password
        await auth.api.changePassword({
          body: {
            currentPassword,
            newPassword,
            revokeOtherSessions: true,
          },
          headers: context.session?.token
            ? { Authorization: `Bearer ${context.session.token}` }
            : {},
        });

        return {
          success: true,
          message: "Password changed successfully",
        };
      } catch (_error) {
        throw new ORPCError("BAD_REQUEST", "Failed to change password");
      }
    }),

  // Reset password (admin only)
  resetPassword: adminProcedure
    .input(resetPasswordSchema)
    .handler(async ({ input }) => {
      const { email } = input;

      try {
        await auth.api.forgetPassword({
          body: { email },
        });

        return {
          success: true,
          message: "Password reset email sent successfully",
        };
      } catch (_error) {
        throw new ORPCError(
          "BAD_REQUEST",
          "Failed to send password reset email"
        );
      }
    }),

  // Update user permissions
  updatePermissions: protectedProcedure
    .use(requirePermission("users.manage_permissions"))
    .input(updatePermissionsSchema)
    .handler(async ({ input, context }) => {
      const { db, user: currentUser } = context;
      const { userId, permissions, role } = input;

      const updateData: any = {
        permissions: JSON.stringify(permissions),
        updatedBy: currentUser?.id,
      };

      if (role) {
        updateData.role = role;
      }

      const [updatedUser] = await db
        .update(usersSchema.users)
        .set(updateData)
        .where(eq(usersSchema.users.id, userId))
        .returning({
          id: usersSchema.users.id,
          name: usersSchema.users.name,
          role: usersSchema.users.role,
          permissions: usersSchema.users.permissions,
        });

      if (!updatedUser) {
        throw new ORPCError("NOT_FOUND", "User not found");
      }

      return {
        success: true,
        data: {
          ...updatedUser,
          permissions: JSON.parse(updatedUser.permissions || "[]"),
        },
        message: "User permissions updated successfully",
      };
    }),

  // Bulk user actions
  bulkAction: adminProcedure
    .input(bulkUserActionSchema)
    .handler(async ({ input, context }) => {
      const { db, user: currentUser } = context;
      const { userIds, action, reason } = input;

      // Prevent bulk actions on current user
      if (userIds.includes(currentUser?.id!)) {
        throw new ORPCError(
          "BAD_REQUEST",
          "You cannot perform bulk actions on your own account"
        );
      }

      const updateData: any = {
        updatedBy: currentUser?.id,
      };

      switch (action) {
        case "activate":
          updateData.status = "active";
          break;
        case "deactivate":
          updateData.status = "inactive";
          break;
        case "suspend":
          updateData.status = "suspended";
          break;
        case "delete":
          updateData.status = "inactive";
          break;
        default:
          throw new ORPCError("BAD_REQUEST", "Invalid action");
      }

      const updatedUsers = await db
        .update(usersSchema.users)
        .set(updateData)
        .where(sql`${usersSchema.users.id} = ANY(${userIds})`)
        .returning({
          id: usersSchema.users.id,
          name: usersSchema.users.name,
          status: usersSchema.users.status,
        });

      return {
        success: true,
        data: {
          updatedUsers,
          action,
          reason,
        },
        message: `Bulk ${action} completed for ${updatedUsers.length} users`,
      };
    }),

  // Get user statistics
  stats: adminProcedure.handler(async ({ context }) => {
    const { db } = context;

    const statusStats = await db
      .select({
        status: usersSchema.users.status,
        count: count(),
      })
      .from(usersSchema.users)
      .groupBy(usersSchema.users.status);

    const roleStats = await db
      .select({
        role: usersSchema.users.role,
        count: count(),
      })
      .from(usersSchema.users)
      .groupBy(usersSchema.users.role);

    const departmentStats = await db
      .select({
        department: usersSchema.users.department,
        count: count(),
      })
      .from(usersSchema.users)
      .where(sql`${usersSchema.users.department} IS NOT NULL`)
      .groupBy(usersSchema.users.department);

    const [totalResult] = await db
      .select({ total: count() })
      .from(usersSchema.users);

    return {
      success: true,
      data: {
        total: totalResult.total,
        byStatus: statusStats,
        byRole: roleStats,
        byDepartment: departmentStats,
      },
    };
  }),

  // Get available roles and permissions
  rolesAndPermissions: protectedProcedure
    .use(requirePermission("users.read"))
    .handler(async () => {
      const { ROLE_PERMISSIONS } = await import("../middleware/rbac");

      return {
        success: true,
        data: {
          roles: Object.keys(ROLE_PERMISSIONS),
          rolePermissions: ROLE_PERMISSIONS,
        },
      };
    }),
};
