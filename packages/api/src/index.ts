import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";
import type { Permission } from "./middleware/rbac";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" });
  }

  // Check if user is active
  if (context.user.status !== "active") {
    throw new ORPCError("FORBIDDEN", { message: "Account is not active" });
  }

  return next({
    context: {
      ...context,
      user: context.user,
    },
  });
});

// Type-safe middleware for permission checking
const createPermissionMiddleware = (permission: Permission) =>
  o.middleware(async ({ context, next }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }

    const { role, permissions } = context.user;
    const hasPermission =
      permissions?.includes(permission) ||
      (await import("./middleware/rbac")).hasPermission(
        role,
        permissions || null,
        permission
      );

    if (!hasPermission) {
      throw new ORPCError("FORBIDDEN", {
        message: `Permission ${permission} is required`,
      });
    }

    return next({ context });
  });

export const protectedProcedure = publicProcedure.use(requireAuth);

// Convenience procedures for common permission checks
export const adminProcedure = protectedProcedure.use(
  createPermissionMiddleware("system.admin" as Permission)
);

const requireManagerRole = o.middleware(({ context, next }) => {
  if (
    !(
      context.user &&
      ["super_admin", "admin", "manager"].includes(context.user.role)
    )
  ) {
    throw new ORPCError("FORBIDDEN", {
      message: "Manager role or higher required",
    });
  }
  return next({ context });
});

export const managerProcedure = protectedProcedure.use(requireManagerRole);

// Export function for creating permission middleware
export const requirePermission = createPermissionMiddleware;
