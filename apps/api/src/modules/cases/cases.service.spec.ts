import { canTransition } from "@proofline/shared-types";
import type { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import type { NotificationsService } from "../notifications/notifications.service";
import { CasesService } from "./cases.service";

describe("case state machine", () => {
  it("allows valid transitions and blocks invalid ones", () => {
    expect(canTransition("OPEN", "UNDER_REVIEW")).toBe(true);
    expect(canTransition("UNDER_REVIEW", "SENT_TO_SUPPLIER")).toBe(true);
    expect(canTransition("RESOLVED", "CLOSED")).toBe(true);
    expect(canTransition("OPEN", "CLOSED")).toBe(false);
    expect(canTransition("CLOSED", "OPEN")).toBe(false);
  });
});

interface MockedPrisma {
  disputeCase: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  disputeCaseItem: { findFirst: jest.Mock };
  discrepancy: { findMany: jest.Mock };
  organizationMember: { findFirst: jest.Mock };
  resolution: { findFirst: jest.Mock; update: jest.Mock };
  $transaction: jest.Mock;
}

function makePrisma(): MockedPrisma {
  const prisma: MockedPrisma = {
    disputeCase: {
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    disputeCaseItem: { findFirst: jest.fn().mockResolvedValue(null) },
    discrepancy: { findMany: jest.fn().mockResolvedValue([]) },
    organizationMember: { findFirst: jest.fn() },
    resolution: { findFirst: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: MockedPrisma) => unknown)(prisma)
      : Promise.all(arg as Promise<unknown>[]),
  );
  return prisma;
}

function service(mocked: MockedPrisma): CasesService {
  const notifications = {
    createForUser: jest.fn().mockResolvedValue(undefined),
    createForSupplierUsers: jest.fn().mockResolvedValue(undefined),
  } as unknown as NotificationsService;
  return new CasesService(mocked as unknown as PrismaService, notifications);
}

describe("CasesService", () => {
  it("rejects an invalid status transition", async () => {
    const prisma = makePrisma();
    prisma.disputeCase.findFirst.mockResolvedValue({ id: "case-1", status: "OPEN" });
    await expect(
      service(prisma).transition("org-1", "user-1", "case-1", { status: "CLOSED" }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("refuses to combine discrepancies from different suppliers", async () => {
    const prisma = makePrisma();
    prisma.discrepancy.findMany.mockResolvedValue([
      { id: "d1", purchaseOrder: { id: "po-1", supplierId: "sup-a" } },
      { id: "d2", purchaseOrder: { id: "po-2", supplierId: "sup-b" } },
    ]);
    await expect(
      service(prisma).create("org-1", "user-1", {
        discrepancyIds: [
          "11111111-1111-1111-1111-111111111111",
          "22222222-2222-2222-2222-222222222222",
        ],
        summary: "Mixed",
        priority: "NORMAL",
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("only allows proposing a resolution while under review or after a supplier response", async () => {
    const prisma = makePrisma();
    prisma.disputeCase.findFirst.mockResolvedValue({ id: "case-1", status: "OPEN" });
    await expect(
      service(prisma).proposeResolution("org-1", "user-1", "case-1", { type: "CREDIT_NOTE" }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
