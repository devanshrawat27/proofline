import { createPurchaseOrderSchema } from "@proofline/shared-types";
import type { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { PurchaseOrdersService } from "./purchase-orders.service";

describe("purchase order schema", () => {
  it("normalizes the PO number and applies line defaults", () => {
    const parsed = createPurchaseOrderSchema.parse({
      supplierId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      poNumber: " po-1 ",
      lines: [{ description: "  LED Driver  ", orderedQuantity: "100", unitPriceMinor: "50000" }],
    });
    expect(parsed.poNumber).toBe("PO-1");
    expect(parsed.currency).toBe("INR");
    expect(parsed.lines[0]?.unit).toBe("unit");
    expect(parsed.lines[0]?.orderedQuantity).toBe(100);
    expect(parsed.lines[0]?.unitPriceMinor).toBe(50000);
  });

  it("requires at least one line", () => {
    const result = createPurchaseOrderSchema.safeParse({
      supplierId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      poNumber: "PO-2",
      lines: [],
    });
    expect(result.success).toBe(false);
  });
});

interface MockedPrisma {
  supplier: { findFirst: jest.Mock };
  purchaseOrder: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  purchaseOrderLine: { deleteMany: jest.Mock };
  $transaction: jest.Mock;
}

function makePrisma(): MockedPrisma {
  const prisma: MockedPrisma = {
    supplier: { findFirst: jest.fn() },
    purchaseOrder: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    purchaseOrderLine: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: MockedPrisma) => unknown)(prisma)
      : Promise.all(arg as Promise<unknown>[]),
  );
  return prisma;
}

function service(mocked: MockedPrisma): PurchaseOrdersService {
  return new PurchaseOrdersService(mocked as unknown as PrismaService);
}

describe("PurchaseOrdersService", () => {
  it("computes line totals and the PO total on create", async () => {
    const prisma = makePrisma();
    prisma.supplier.findFirst.mockResolvedValue({ id: "sup-1", status: "ACTIVE" });
    prisma.purchaseOrder.findUnique.mockResolvedValue(null);
    prisma.purchaseOrder.create.mockImplementation((args: { data: unknown }) => ({
      ...(args.data as object),
      id: "po-1",
      supplier: { id: "sup-1", name: "Acme", code: "SUP-1" },
      lines: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await service(prisma).create("org-1", "user-1", {
      supplierId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      poNumber: "PO-1",
      currency: "INR",
      lines: [
        { description: "LED Driver", orderedQuantity: 100, unit: "piece", unitPriceMinor: 50000 },
        { description: "Cable Tie", orderedQuantity: 2, unit: "pack", unitPriceMinor: 12000 },
      ],
    });

    const data = prisma.purchaseOrder.create.mock.calls[0]?.[0]?.data as {
      totalMinor: number;
      lines: { create: { lineTotalMinor: number; lineNumber: number }[] };
    };
    expect(data.totalMinor).toBe(100 * 50000 + 2 * 12000);
    expect(data.lines.create[0]?.lineTotalMinor).toBe(5000000);
    expect(data.lines.create[1]?.lineNumber).toBe(2);
  });

  it("rejects a supplier outside the organization", async () => {
    const prisma = makePrisma();
    prisma.supplier.findFirst.mockResolvedValue(null);
    await expect(
      service(prisma).create("org-1", "user-1", {
        supplierId: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
        poNumber: "PO-1",
        currency: "INR",
        lines: [{ description: "X", orderedQuantity: 1, unit: "unit", unitPriceMinor: 100 }],
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("refuses to cancel a non-cancellable purchase order", async () => {
    const prisma = makePrisma();
    prisma.purchaseOrder.findFirst.mockResolvedValue({ id: "po-1", status: "FULLY_RECEIVED" });
    await expect(service(prisma).cancel("org-1", "user-1", "po-1")).rejects.toMatchObject({ statusCode: 400 });
  });
});
