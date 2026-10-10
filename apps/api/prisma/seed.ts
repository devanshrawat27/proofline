/**
 * Goodsignal demo seed.
 *
 * Creates a CLEARLY-LABELLED demo organization (isDemo = true) and one user per
 * role so the portfolio/demo environment is usable immediately. This data is
 * intentionally separate from production (never run against production).
 */
import { PrismaClient, type OrgRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo-password-123";

const DEMO_USERS: Array<{ email: string; name: string; role: OrgRole }> = [
  { email: "owner@demo.goodsignal.local", name: "Asha Owner", role: "OWNER" },
  { email: "manager@demo.goodsignal.local", name: "Manish Procurement", role: "PROCUREMENT_MANAGER" },
  { email: "receiver@demo.goodsignal.local", name: "Ravi Receiver", role: "RECEIVER" },
  { email: "finance@demo.goodsignal.local", name: "Fatima Finance", role: "FINANCE" },
];

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data in production.");
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const organization = await prisma.organization.upsert({
    where: { slug: "demo-distributors" },
    create: {
      name: "Demo Distributors (sample data)",
      slug: "demo-distributors",
      timezone: "Asia/Kolkata",
      defaultCurrency: "INR",
      isDemo: true,
    },
    update: { isDemo: true },
  });

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      create: { email: demo.email, name: demo.name, passwordHash },
      update: { name: demo.name },
    });

    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
      create: {
        organizationId: organization.id,
        userId: user.id,
        role: demo.role,
        status: "ACTIVE",
      },
      update: { role: demo.role, status: "ACTIVE" },
    });
  }

  // eslint-disable-next-line no-console
  console.log("Demo seed complete.");
  // eslint-disable-next-line no-console
  console.log(`  Organization: ${organization.name} (${organization.slug})`);
  // eslint-disable-next-line no-console
  console.log(`  Password for all demo users: ${DEMO_PASSWORD}`);
  for (const demo of DEMO_USERS) {
    // eslint-disable-next-line no-console
    console.log(`  - ${demo.role.padEnd(20)} ${demo.email}`);
  }
}

main()
  .catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error("Demo seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
