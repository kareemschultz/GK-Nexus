import { auth } from "@GK-Nexus/auth";
import { db, usersSchema } from "@GK-Nexus/db";
import { count, eq } from "drizzle-orm";
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

  // If we have a session, fetch or create the user details
  if (session?.user) {
    try {
      // First, try to find user by session ID
      let dbUser = await db
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

      // If not found by ID, check by email (user might exist with different ID)
      if (!dbUser[0]) {
        dbUser = await db
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
          .where(eq(usersSchema.users.email, session.user.email))
          .limit(1);
      }

      // If user doesn't exist by ID or email, create them
      if (!dbUser[0]) {
        // Check if this is the first user - if so, make them super_admin
        const [userCount] = await db
          .select({ count: count() })
          .from(usersSchema.users);

        const isFirstUser = userCount.count === 0;
        const defaultRole: Role = isFirstUser ? "super_admin" : "admin";

        // Create user record synced from auth
        const newUserData = {
          id: session.user.id,
          name: session.user.name || session.user.email.split("@")[0],
          email: session.user.email,
          emailVerified: session.user.emailVerified ?? false,
          image: session.user.image || null,
          role: defaultRole,
          status: "active" as const,
          permissions: null,
          department: null,
          phoneNumber: null,
        };

        await db.insert(usersSchema.users).values(newUserData);

        dbUser = await db
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
      }

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
      console.error("Error fetching/creating user details:", error);
    }
  }

  return {
    session,
    user,
    db,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
