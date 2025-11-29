import { ORPCError, os } from "@orpc/server";
import type { Context } from "./context";
import type { Permission } from "./middleware/rbac";

export const o = os.$context<Context>();

export const publicProcedure = o;

const requireAuth = o.middleware(async ({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED", "Authentication required");
  }

  // Check if user is active
  if (context.user.status !== "active") {
    throw new ORPCError("FORBIDDEN", "Account is not active");
  }

  return next({
    context: {
      ...context,
      user: context.user,
    },
  });
});

const requirePermission = (permission: Permission) =>
  o.middleware(async ({ context, next }) => {
    if (!context.user) {
      throw new ORPCError("UNAUTHORIZED", "Authentication required");
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
      throw new ORPCError("FORBIDDEN", `Permission ${permission} is required`);
    }

    return next({ context });
  });

export const protectedProcedure = publicProcedure.use(requireAuth);

// Convenience procedures for common permission checks
export const adminProcedure = protectedProcedure.use(
  requirePermission("system.admin" as Permission)
);

export const managerProcedure = protectedProcedure.use(
  o.middleware(async ({ context, next }) => {
    if (
      !(
        context.user &&
        ["super_admin", "admin", "manager"].includes(context.user.role)
      )
    ) {
      throw new ORPCError("FORBIDDEN", "Manager role or higher required");
    }
    return next({ context });
  })
);

// Export middleware function for custom permission checks
export { requirePermission };
