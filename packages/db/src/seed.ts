import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { users } from "./schema/users";
import { userAccounts } from "./schema/users";
import { hashPassword } from "./utils";

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Starting database seed...");

  // Check if super admin already exists
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.role, "super_admin"))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log("Super admin already exists, skipping seed");
    await client.end();
    return;
  }

  // Create super admin user
  const superAdminId = crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const superAdminEmail =
    process.env.SUPER_ADMIN_EMAIL || "admin@gk-nexus.com";
  const superAdminPassword =
    process.env.SUPER_ADMIN_PASSWORD || "Admin123!@#";
  const superAdminName = process.env.SUPER_ADMIN_NAME || "Super Admin";

  // Hash password using the same method as better-auth
  const hashedPassword = await hashPassword(superAdminPassword);

  try {
    // Insert super admin user
    await db.insert(users).values({
      id: superAdminId,
      name: superAdminName,
      email: superAdminEmail,
      emailVerified: true,
      role: "super_admin",
      status: "active",
      permissions: JSON.stringify([
        "users.create",
        "users.read",
        "users.update",
        "users.delete",
        "users.manage_permissions",
        "clients.create",
        "clients.read",
        "clients.update",
        "clients.delete",
        "clients.assign",
        "tax_calculations.create",
        "tax_calculations.read",
        "tax_calculations.update",
        "tax_calculations.delete",
        "tax_calculations.submit",
        "compliance.create",
        "compliance.read",
        "compliance.update",
        "compliance.delete",
        "compliance.approve",
        "documents.create",
        "documents.read",
        "documents.update",
        "documents.delete",
        "documents.share",
        "documents.approve",
        "dashboard.read",
        "reports.read",
        "reports.export",
        "system.admin",
      ]),
      department: "Administration",
    });

    // Insert account record for password login
    await db.insert(userAccounts).values({
      id: accountId,
      accountId: superAdminId,
      providerId: "credential",
      userId: superAdminId,
      password: hashedPassword,
    });

    console.log("Super admin user created successfully!");
    console.log(`Email: ${superAdminEmail}`);
    console.log(`Password: ${superAdminPassword}`);
    console.log(
      "\nIMPORTANT: Please change this password immediately after first login!"
    );
  } catch (error) {
    console.error("Error creating super admin:", error);
    throw error;
  }

  await client.end();
  console.log("Seed completed successfully!");
}

seed().catch(console.error);
