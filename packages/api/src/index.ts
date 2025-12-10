import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";
import { hasPermission, type Permission } from "./middleware/rbac";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" });
  }

  // Type assertion: context.user is now non-null
  const authenticatedUser = context.user;

  // Check if user is active
  if (authenticatedUser.status !== "active") {
    throw new ORPCError("FORBIDDEN", { message: "Account is not active" });
  }

  return next({
    context: {
      ...context,
      user: authenticatedUser,
    },
  });
});

export const protectedProcedure = publicProcedure.use(requireAuth);

// Permission check middleware - returns a middleware that can be used with .use()
// Note: This middleware should only be used after protectedProcedure which guarantees user is non-null
// The 'as any' cast is needed due to oRPC type inference limitations with chained middlewares
export const requirePermission = (permission: Permission) =>
  o.middleware(async ({ context, next }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "Authentication required",
      });
    }

    const { role, permissions } = context.user;
    const allowed =
      permissions?.includes(permission) ||
      hasPermission(role, permissions || null, permission);

    if (!allowed) {
      throw new ORPCError("FORBIDDEN", {
        message: `Permission ${permission} is required`,
      });
    }

    return next({ context });
  }) as any;

// Convenience procedures for common permission checks
export const adminProcedure = protectedProcedure.use(
  requirePermission("system.admin") as any
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

export const managerProcedure = protectedProcedure.use(
  requireManagerRole as any
);
