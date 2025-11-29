import { auth } from "@GK-Nexus/auth";
import { db, usersSchema } from "@GK-Nexus/db";
import { eq } from "drizzle-orm";
import type { Context as HonoContext } from "hono";
import type { Permission } from "./middleware/rbac";
import type { Role } from "./schemas";

export type CreateContextOptions = {
  context: HonoContext;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions?: Permission[];
  assignedClients?: string[];
  department?: string;
  status: "active" | "inactive" | "suspended" | "pending";
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await auth.api.getSession({
    headers: context.req.raw.headers,
  });

  let user: User | null = null;

  // If we have a session, fetch the user details
  if (session?.user) {
    try {
      const dbUser = await db
        .select({
          id: usersSchema.users.id,
          name: usersSchema.users.name,
          email: usersSchema.users.email,
          role: usersSchema.users.role,
          permissions: usersSchema.users.permissions,
          department: usersSchema.users.department,
          status: usersSchema.users.status,
        })
        .from(usersSchema.users)
        .where(eq(usersSchema.users.id, session.user.id))
        .limit(1);

      if (dbUser[0]) {
        const userData = dbUser[0];
        user = {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          permissions: userData.permissions
            ? JSON.parse(userData.permissions)
            : undefined,
          department: userData.department || undefined,
          status: userData.status,
          // TODO: Fetch assigned clients based on user role and assignments
          assignedClients: [],
        };
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  }

  return {
    session,
    user,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
