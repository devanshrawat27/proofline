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

const SEED_SUPPLIERS: Array<{
  code: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  gstin: string;
  city: string;
  state: string;
}> = [
  {
    code: "SUP-BRIGHTTECH",
    name: "BrightTech Components",
    contactName: "Nisha Rao",
    email: "sales@brighttech.example",
    phone: "+91 98200 11223",
    gstin: "27ABCDE1234F1Z5",
    city: "Pune",
    state: "Maharashtra",
  },
  {
    code: "SUP-ELECTROLAB",
    name: "ElectroLab Traders",
    contactName: "Imran Sheikh",
    email: "orders@electrolab.example",
    phone: "+91 79400 55667",
    gstin: "24ABCDE5678G1Z2",
    city: "Ahmedabad",
    state: "Gujarat",
  },
  {
    code: "SUP-LUMENIX",
    name: "Lumenix Lighting",
    contactName: "Divya Menon",
    email: "hello@lumenix.example",
    phone: "+91 80400 88990",
    gstin: "29ABCDE9012H1Z8",
    city: "Bengaluru",
    state: "Karnataka",
  },
  {
    code: "SUP-VOLTEDGE",
    name: "VoltEdge Supplies",
    contactName: "Karthik Iyer",
    email: "dispatch@voltedge.example",
    phone: "+91 44400 33221",
    gstin: "33ABCDE3456J1Z1",
    city: "Chennai",
    state: "Tamil Nadu",
  },
];

const SEED_PURCHASE_ORDERS: Array<{
  poNumber: string;
  supplierCode: string;
  status: "DRAFT" | "ISSUED";
  expectedInDays: number;
  lines: Array<{
    description: string;
    sku?: string;
    orderedQuantity: number;
    unit: string;
    unitPriceMinor: number;
  }>;
}> = [
  {
    poNumber: "PO-1042",
    supplierCode: "SUP-BRIGHTTECH",
    status: "ISSUED",
    expectedInDays: 5,
    lines: [
      {
        description: "LED Driver 12W",
        sku: "LED-12W",
        orderedQuantity: 100,
        unit: "piece",
        unitPriceMinor: 50000,
      },
    ],
  },
  {
    poNumber: "PO-1043",
    supplierCode: "SUP-ELECTROLAB",
    status: "DRAFT",
    expectedInDays: 10,
    lines: [
      {
        description: "Cable Tie 200mm",
        sku: "CT-200",
        orderedQuantity: 500,
        unit: "pack",
        unitPriceMinor: 12000,
      },
      { description: "Heat Shrink Tubing", orderedQuantity: 50, unit: "metre", unitPriceMinor: 8000 },
    ],
  },
];

const SEED_SUPPLIER_USER = {
  supplierCode: "SUP-BRIGHTTECH",
  email: "supplier@brighttech.local",
  name: "Nisha Rao (BrightTech)",
  password: "Supplier@123",
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

  for (const supplier of SEED_SUPPLIERS) {
    await prisma.supplier.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: supplier.code } },
      create: { organizationId: organization.id, country: "IN", ...supplier },
      update: { name: supplier.name, email: supplier.email, phone: supplier.phone },
    });
  }

  const supplierIds = new Map<string, string>();
  for (const supplier of SEED_SUPPLIERS) {
    const record = await prisma.supplier.findUnique({
      where: { organizationId_code: { organizationId: organization.id, code: supplier.code } },
      select: { id: true },
    });
    if (record) supplierIds.set(supplier.code, record.id);
  }

  const creator = await prisma.user.findUnique({
    where: { email: "manager@meridian.local" },
    select: { id: true },
  });

  if (creator) {
    for (const po of SEED_PURCHASE_ORDERS) {
      const supplierId = supplierIds.get(po.supplierCode);
      if (!supplierId) continue;
      const existing = await prisma.purchaseOrder.findUnique({
        where: { organizationId_poNumber: { organizationId: organization.id, poNumber: po.poNumber } },
        select: { id: true },
      });
      if (existing) continue;

      const lines = po.lines.map((line, index) => ({
        lineNumber: index + 1,
        description: line.description,
        sku: line.sku ?? null,
        orderedQuantity: line.orderedQuantity,
        unit: line.unit,
        unitPriceMinor: line.unitPriceMinor,
        lineTotalMinor: Math.round(line.orderedQuantity * line.unitPriceMinor),
      }));

      await prisma.purchaseOrder.create({
        data: {
          organizationId: organization.id,
          supplierId,
          createdByUserId: creator.id,
          poNumber: po.poNumber,
          status: po.status,
          currency: "INR",
          issueDate: po.status === "ISSUED" ? new Date() : null,
          expectedDeliveryDate: new Date(Date.now() + po.expectedInDays * 24 * 60 * 60 * 1000),
          totalMinor: lines.reduce((sum, line) => sum + line.lineTotalMinor, 0),
          lines: { create: lines },
        },
      });
    }
  }

  const receiver = await prisma.user.findUnique({
    where: { email: "receiver@meridian.local" },
    select: { id: true },
  });
  const po1042 = await prisma.purchaseOrder.findUnique({
    where: { organizationId_poNumber: { organizationId: organization.id, poNumber: "PO-1042" } },
    include: { lines: { orderBy: { lineNumber: "asc" } } },
  });

  if (receiver && po1042 && po1042.lines.length > 0) {
    const existingReceipt = await prisma.receipt.findFirst({
      where: { purchaseOrderId: po1042.id, status: "SUBMITTED" },
      select: { id: true },
    });
    if (!existingReceipt) {
      await prisma.receipt.create({
        data: {
          organizationId: organization.id,
          purchaseOrderId: po1042.id,
          receivedByUserId: receiver.id,
          reference: "DC-7781",
          status: "SUBMITTED",
          receivedAt: new Date(),
          submittedAt: new Date(),
          lines: {
            create: [
              {
                purchaseOrderLineId: po1042.lines[0]!.id,
                receivedQuantity: 94,
                damagedQuantity: 2,
              },
            ],
          },
        },
      });
      await prisma.purchaseOrder.update({
        where: { id: po1042.id },
        data: { status: "PARTIALLY_RECEIVED" },
      });
    }
  }

  const brightTechId = supplierIds.get("SUP-BRIGHTTECH");
  if (po1042 && brightTechId && po1042.lines.length > 0) {
    const existingInvoice = await prisma.invoice.findFirst({
      where: { organizationId: organization.id, invoiceNumber: "INV-5562" },
      select: { id: true },
    });
    if (!existingInvoice) {
      await prisma.invoice.create({
        data: {
          organizationId: organization.id,
          supplierId: brightTechId,
          purchaseOrderId: po1042.id,
          invoiceNumber: "INV-5562",
          invoiceDate: new Date(),
          currency: "INR",
          totalMinor: 5_000_000,
          lines: {
            create: [
              {
                purchaseOrderLineId: po1042.lines[0]!.id,
                description: "LED Driver 12W",
                quantity: 100,
                unit: "piece",
                unitPriceMinor: 50_000,
                lineTotalMinor: 5_000_000,
              },
            ],
          },
        },
      });
    }
  }

  const supplierUserSupplierId = supplierIds.get(SEED_SUPPLIER_USER.supplierCode);
  if (supplierUserSupplierId) {
    const supplierUserPasswordHash = await bcrypt.hash(SEED_SUPPLIER_USER.password, 12);
    await prisma.supplierUser.upsert({
      where: { email: SEED_SUPPLIER_USER.email },
      create: {
        supplierId: supplierUserSupplierId,
        email: SEED_SUPPLIER_USER.email,
        name: SEED_SUPPLIER_USER.name,
        passwordHash: supplierUserPasswordHash,
      },
      update: { name: SEED_SUPPLIER_USER.name },
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
  // eslint-disable-next-line no-console
  console.log(`  Suppliers seeded: ${SEED_SUPPLIERS.length}`);
  // eslint-disable-next-line no-console
  console.log(`  Purchase orders seeded: ${SEED_PURCHASE_ORDERS.length}`);
  // eslint-disable-next-line no-console
  console.log("  Invoice seeded: INV-5562 (review it to generate discrepancies)");
  // eslint-disable-next-line no-console
  console.log(`  Supplier portal user: ${SEED_SUPPLIER_USER.email} / ${SEED_SUPPLIER_USER.password}`);
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
