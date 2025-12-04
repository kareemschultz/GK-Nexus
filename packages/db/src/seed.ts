import { hashPassword } from "better-auth/crypto";
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { resolve } from "path";
import postgres from "postgres";
import { account, user } from "./schema/auth";

// Load environment variables from root .env file
config({ path: resolve(__dirname, "../../../.env") });

async function seed() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL environment variable is not set.");
    console.error("Please create a .env file in the project root with:");
    console.error(
      'DATABASE_URL="postgresql://username:password@localhost:5432/gk_nexus"'
    );
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Starting database seed...");

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@gk-nexus.com";

  // Check if super admin already exists in the user table
  const existingAdmin = await db
    .select()
    .from(user)
    .where(eq(user.email, superAdminEmail))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log("Super admin already exists, skipping seed");
    await client.end();
    return;
  }

  // Create super admin user
  const superAdminId = crypto.randomUUID();
  const superAdminAccountId = crypto.randomUUID();
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin123!@#";
  const superAdminName = process.env.SUPER_ADMIN_NAME || "Super Admin";

  // Hash password using the same method as better-auth
  const hashedPassword = await hashPassword(superAdminPassword);

  try {
    // Insert super admin user into the auth user table
    await db.insert(user).values({
      id: superAdminId,
      name: superAdminName,
      email: superAdminEmail,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert account record for password login into the auth account table
    await db.insert(account).values({
      id: superAdminAccountId,
      accountId: superAdminId,
      providerId: "credential",
      userId: superAdminId,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
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
