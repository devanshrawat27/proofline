/**
 * Proofline seed.
 *
 * Creates a sample workspace (isDemo = true) with one user per role so a fresh
 * install is usable immediately. This data is intentionally separate from
 * production and must never be seeded against a production database.
 */
import { PrismaClient, type OrgRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SEED_PASSWORD = "Proofline@123";

const SEED_USERS: Array<{ email: string; name: string; role: OrgRole }> = [
  { email: "owner@meridian.local", name: "Asha Owner", role: "OWNER" },
  { email: "manager@meridian.local", name: "Manish Procurement", role: "PROCUREMENT_MANAGER" },
  { email: "receiver@meridian.local", name: "Ravi Receiver", role: "RECEIVER" },
  { email: "finance@meridian.local", name: "Fatima Finance", role: "FINANCE" },
];

const SEED_ORGANIZATION = {
  name: "Meridian Distributors",
  slug: "meridian-distributors",
  timezone: "Asia/Kolkata",
  defaultCurrency: "INR",
  isDemo: true,
};

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed sample data in production.");
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const organization = await prisma.organization.upsert({
    where: { slug: SEED_ORGANIZATION.slug },
    create: SEED_ORGANIZATION,
    update: { isDemo: true },
  });

  for (const account of SEED_USERS) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      create: { email: account.email, name: account.name, passwordHash },
      update: { name: account.name },
    });

    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
      create: {
        organizationId: organization.id,
        userId: user.id,
        role: account.role,
        status: "ACTIVE",
      },
      update: { role: account.role, status: "ACTIVE" },
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed complete.");
  // eslint-disable-next-line no-console
  console.log(`  Organization: ${organization.name} (${organization.slug})`);
  // eslint-disable-next-line no-console
  console.log(`  Password for all seed users: ${SEED_PASSWORD}`);
  for (const account of SEED_USERS) {
    // eslint-disable-next-line no-console
    console.log(`  - ${account.role.padEnd(20)} ${account.email}`);
  }
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
