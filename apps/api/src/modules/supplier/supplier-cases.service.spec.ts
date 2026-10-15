import type { PrismaService } from "../../common/prisma/prisma.service";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import type { NotificationsService } from "../notifications/notifications.service";
import { AppError } from "../../common/errors/app-error";
import { SupplierCasesService } from "./supplier-cases.service";

const PRINCIPAL: SupplierPrincipal = {
  supplierUserId: "su-1",
  supplierUserEmail: "supplier@example.com",
  supplierUserName: "Nisha",
  supplierId: "sup-1",
  supplierName: "BrightTech",
  supplierCode: "SUP-1",
  organizationId: "org-1",
};

interface MockedPrisma {
  disputeCase: { count: jest.Mock; findMany: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
  resolution: { create: jest.Mock };
  auditEvent: { create: jest.Mock };
  $transaction: jest.Mock;
}

function makePrisma(): MockedPrisma {
  const prisma: MockedPrisma = {
    disputeCase: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    resolution: { create: jest.fn() },
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

function service(mocked: MockedPrisma): SupplierCasesService {
  const notifications = { createForUser: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService;
  return new SupplierCasesService(mocked as unknown as PrismaService, notifications);
}

describe("SupplierCasesService", () => {
  it("scopes case listing by the supplier's organization and supplier", async () => {
    const prisma = makePrisma();
    await service(prisma).list(PRINCIPAL, { page: 1, pageSize: 20 });
    expect(prisma.disputeCase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1", supplierId: "sup-1" }),
      }),
    );
  });

  it("advances a case to SUPPLIER_RESPONDED on a reply", async () => {
    const prisma = makePrisma();
    prisma.disputeCase.findFirst.mockResolvedValue({
      id: "case-1",
      status: "SENT_TO_SUPPLIER",
      caseNumber: "CASE-1",
    });
    prisma.disputeCase.update.mockResolvedValue({
      id: "case-1",
      caseNumber: "CASE-1",
      status: "SUPPLIER_RESPONDED",
      priority: "NORMAL",
      summary: "Short delivery",
      dueDate: null,
      openedAt: new Date(),
      closedAt: null,
      items: [],
      messages: [],
      resolutions: [],
      updatedAt: new Date(),
    });

    const result = await service(prisma).respond(PRINCIPAL, "case-1", { body: "We will ship the rest." });

    expect(result.status).toBe("SUPPLIER_RESPONDED");
    expect(prisma.disputeCase.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "SUPPLIER_RESPONDED" }) }),
    );
    expect(prisma.auditEvent.create).toHaveBeenCalled();
  });

  it("refuses responses on closed cases", async () => {
    const prisma = makePrisma();
    prisma.disputeCase.findFirst.mockResolvedValue({ id: "case-1", status: "CLOSED", caseNumber: "CASE-1" });
    await expect(service(prisma).respond(PRINCIPAL, "case-1", { body: "hi" })).rejects.toBeInstanceOf(AppError);
  });
});
