import { createInvoiceSchema } from "@proofline/shared-types";
import type { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { InvoicesService } from "./invoices.service";

describe("invoice schema", () => {
  it("normalizes the invoice number and defaults line fields", () => {
    const parsed = createInvoiceSchema.parse({
      supplierId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      invoiceNumber: " inv-9 ",
      lines: [{ description: "LED Driver", quantity: "100", unitPriceMinor: "50000" }],
    });
    expect(parsed.invoiceNumber).toBe("INV-9");
    expect(parsed.currency).toBe("INR");
    expect(parsed.lines[0]?.unit).toBe("unit");
    expect(parsed.lines[0]?.poLineId).toBeUndefined();
  });
});

interface MockedPrisma {
  invoice: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  invoiceLine: { deleteMany: jest.Mock };
  discrepancy: { deleteMany: jest.Mock; createMany: jest.Mock };
  receiptLine: { findMany: jest.Mock };
  auditEvent: { create: jest.Mock };
  $transaction: jest.Mock;
}

function makePrisma(): MockedPrisma {
  const prisma: MockedPrisma = {
    invoice: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    invoiceLine: { deleteMany: jest.fn() },
    discrepancy: { deleteMany: jest.fn(), createMany: jest.fn() },
    receiptLine: { findMany: jest.fn().mockResolvedValue([]) },
    auditEvent: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: MockedPrisma) => unknown)(prisma)
      : Promise.all(arg as Promise<unknown>[]),
  );
  return prisma;
}

function service(mocked: MockedPrisma): InvoicesService {
  return new InvoicesService(mocked as unknown as PrismaService);
}

describe("InvoicesService review", () => {
  it("detects quantity, price and damage discrepancies deterministically", async () => {
    const prisma = makePrisma();
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      organizationId: "org-1",
      status: "DRAFT",
      currency: "INR",
      supplier: { id: "sup-1", name: "BrightTech", code: "SUP-1" },
      purchaseOrder: {
        id: "po-1",
        poNumber: "PO-1",
        lines: [{ id: "l1", orderedQuantity: 100, unit: "piece", unitPriceMinor: 50000 }],
      },
      lines: [
        { id: "il1", purchaseOrderLineId: "l1", quantity: 100, unit: "piece", unitPriceMinor: 52000 },
      ],
      _count: { discrepancies: 3 },
    });
    prisma.receiptLine.findMany.mockResolvedValue([
      { purchaseOrderLineId: "l1", receivedQuantity: 94, damagedQuantity: 2 },
    ]);
    prisma.invoice.update.mockResolvedValue({
      id: "inv-1",
      invoiceNumber: "INV-1",
      status: "REVIEWED",
      currency: "INR",
      invoiceDate: null,
      totalMinor: 5200000,
      notes: null,
      supplier: { id: "sup-1", name: "BrightTech", code: "SUP-1" },
      purchaseOrder: { id: "po-1", poNumber: "PO-1" },
      lines: [],
      _count: { discrepancies: 3 },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service(prisma).review("org-1", "user-1", "inv-1");

    const created = prisma.discrepancy.createMany.mock.calls[0]?.[0]?.data as { type: string }[];
    const types = created.map((row) => row.type).sort();
    expect(types).toEqual(["DAMAGED_GOODS", "QUANTITY_MISMATCH", "UNIT_PRICE_MISMATCH"]);
    expect(prisma.discrepancy.deleteMany).toHaveBeenCalledWith({ where: { invoiceId: "inv-1" } });
  });

  it("requires a linked purchase order before review", async () => {
    const prisma = makePrisma();
    prisma.invoice.findFirst.mockResolvedValue({
      id: "inv-1",
      organizationId: "org-1",
      status: "DRAFT",
      currency: "INR",
      supplier: { id: "sup-1", name: "Acme", code: "SUP-1" },
      purchaseOrder: null,
      lines: [],
      _count: { discrepancies: 0 },
    });
    await expect(service(prisma).review("org-1", "user-1", "inv-1")).rejects.toBeInstanceOf(AppError);
  });
});
