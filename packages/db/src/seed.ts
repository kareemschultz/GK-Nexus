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
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!superAdminPassword) {
    console.error(
      "SUPER_ADMIN_PASSWORD environment variable is required for seeding."
    );
    console.error("Please set SUPER_ADMIN_PASSWORD in your .env file.");
    process.exit(1);
  }
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
    console.log(
      "Password was set from SUPER_ADMIN_PASSWORD environment variable."
    );
    console.log(
      "\nIMPORTANT: Please change this password immediately after first login!"
    );

    // Seed businesses (KAJ Financial Services & GCMC)
    console.log("\nSeeding businesses...");

    // Check if businesses already exist
    const existingBusinesses = await db.select().from(businesses).limit(1);

    if (existingBusinesses.length === 0) {
      const [kajBusiness] = await db
        .insert(businesses)
        .values({
          name: "KAJ Financial Services",
          code: "KAJ",
          type: "tax_accounting",
          description:
            "GRA Licensed Accountant Practice - Tax, NIS, Compliance, Audits",
          isActive: true,
          settings: JSON.stringify({
            primaryColor: "#1a365d",
            logo: "/logos/kaj.png",
          }),
        })
        .returning();

      const [gcmcBusiness] = await db
        .insert(businesses)
        .values({
          name: "Green Crescent Management Consultancy",
          code: "GCMC",
          type: "business_consulting",
          description:
            "Training, Incorporation, Paralegal, Immigration, Business Proposals",
          isActive: true,
          settings: JSON.stringify({
            primaryColor: "#276749",
            logo: "/logos/gcmc.png",
          }),
        })
        .returning();

      console.log(
        `Businesses seeded: ${kajBusiness.code}, ${gcmcBusiness.code}`
      );

      // Assign super admin to both businesses
      await db.insert(userBusinesses).values([
        {
          userId: superAdminId,
          businessId: kajBusiness.id,
          role: "super_admin",
        },
        {
          userId: superAdminId,
          businessId: gcmcBusiness.id,
          role: "super_admin",
        },
      ]);

      console.log("Super admin assigned to both businesses");
    } else {
      console.log("Businesses already exist, skipping business seed");
    }
  } catch (error) {
    console.error("Error creating super admin:", error);
    throw error;
  }

  await client.end();
  console.log("Seed completed successfully!");
}

seed().catch(console.error);
