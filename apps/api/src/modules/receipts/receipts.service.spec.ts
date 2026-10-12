import { receiptLineSchema } from "@proofline/shared-types";
import type { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ReceiptsService } from "./receipts.service";

const LINE_ID = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

describe("receipt schema", () => {
  it("defaults damaged quantity to zero", () => {
    const parsed = receiptLineSchema.parse({ purchaseOrderLineId: LINE_ID, receivedQuantity: 3 });
    expect(parsed.damagedQuantity).toBe(0);
  });

  it("rejects damaged greater than received", () => {
    const result = receiptLineSchema.safeParse({
      purchaseOrderLineId: LINE_ID,
      receivedQuantity: 3,
      damagedQuantity: 5,
    });
    expect(result.success).toBe(false);
  });
});

interface MockedPrisma {
  receipt: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  receiptLine: { deleteMany: jest.Mock; findMany: jest.Mock };
  purchaseOrder: { findFirst: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
  auditEvent: { create: jest.Mock };
  $transaction: jest.Mock;
}

function makePrisma(): MockedPrisma {
  const prisma: MockedPrisma = {
    receipt: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    receiptLine: { deleteMany: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
    purchaseOrder: { findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
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

function service(mocked: MockedPrisma): ReceiptsService {
  return new ReceiptsService(mocked as unknown as PrismaService);
}

describe("ReceiptsService", () => {
  it("refuses to receive against a draft purchase order", async () => {
    const prisma = makePrisma();
    prisma.purchaseOrder.findFirst.mockResolvedValue({ id: "po-1", status: "DRAFT", lines: [] });
    await expect(
      service(prisma).create("org-1", "user-1", {
        purchaseOrderId: "11111111-1111-1111-1111-111111111111",
        lines: [{ purchaseOrderLineId: LINE_ID, receivedQuantity: 1, damagedQuantity: 0 }],
      }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("marks the purchase order partially received on submit", async () => {
    const prisma = makePrisma();
    prisma.receipt.findFirst.mockResolvedValue({
      id: "rec-1",
      organizationId: "org-1",
      status: "DRAFT",
      purchaseOrderId: "po-1",
      lines: [{ receivedQuantity: 94 }],
    });
    prisma.receipt.update.mockResolvedValue({
      id: "rec-1",
      status: "SUBMITTED",
      reference: null,
      notes: null,
      receivedAt: new Date(),
      submittedAt: new Date(),
      purchaseOrder: {
        id: "po-1",
        poNumber: "PO-1",
        status: "PARTIALLY_RECEIVED",
        supplier: { id: "sup-1", name: "Acme", code: "SUP-1" },
      },
      lines: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prisma.purchaseOrder.findUnique.mockResolvedValue({
      id: "po-1",
      status: "ISSUED",
      lines: [{ id: "l1", orderedQuantity: 100 }],
    });
    prisma.receiptLine.findMany.mockResolvedValue([{ purchaseOrderLineId: "l1", receivedQuantity: 94 }]);

    await service(prisma).submit("org-1", "user-1", "rec-1");

    expect(prisma.purchaseOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "po-1" }, data: { status: "PARTIALLY_RECEIVED" } }),
    );
  });
});
