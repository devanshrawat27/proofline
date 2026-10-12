import { createSupplierSchema, supplierListQuerySchema } from "@proofline/shared-types";
import type { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { SuppliersService } from "./suppliers.service";

describe("supplier schemas", () => {
  it("normalizes the code and treats empty optional fields as absent", () => {
    const parsed = createSupplierSchema.parse({
      code: " sup-01 ",
      name: "  Acme Components  ",
      email: "",
      contactName: "",
      country: "in",
    });
    expect(parsed.code).toBe("SUP-01");
    expect(parsed.name).toBe("Acme Components");
    expect(parsed.email).toBeUndefined();
    expect(parsed.contactName).toBeUndefined();
    expect(parsed.country).toBe("IN");
    expect(parsed.status).toBe("ACTIVE");
  });

  it("rejects an invalid supplier code", () => {
    expect(createSupplierSchema.safeParse({ code: "bad code!", name: "X" }).success).toBe(false);
  });

  it("coerces pagination in the list query", () => {
    const query = supplierListQuerySchema.parse({ page: "2", pageSize: "5" });
    expect(query.page).toBe(2);
    expect(query.pageSize).toBe(5);
  });
});

interface MockedPrisma {
  supplier: {
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  $transaction: jest.Mock;
}

function makePrisma(): MockedPrisma {
  return {
    supplier: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
}

function service(mocked: MockedPrisma): SuppliersService {
  return new SuppliersService(mocked as unknown as PrismaService);
}

describe("SuppliersService", () => {
  it("scopes listing by the caller's organization", async () => {
    const prisma = makePrisma();
    await service(prisma).list("org-1", { page: 1, pageSize: 20 });
    expect(prisma.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-1" }) }),
    );
  });

  it("rejects a duplicate supplier code", async () => {
    const prisma = makePrisma();
    prisma.supplier.findUnique.mockResolvedValue({ id: "existing" });
    await expect(
      service(prisma).create("org-1", { code: "SUP-1", name: "Acme", country: "IN", status: "ACTIVE" }),
    ).rejects.toBeInstanceOf(AppError);
  });

  it("returns not found when updating a supplier from another organization", async () => {
    const prisma = makePrisma();
    prisma.supplier.findFirst.mockResolvedValue(null);
    await expect(service(prisma).update("org-1", "sup-x", { name: "New" })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
