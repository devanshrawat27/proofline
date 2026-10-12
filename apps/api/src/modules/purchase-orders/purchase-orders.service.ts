import { Injectable } from "@nestjs/common";
import type { PurchaseOrder, PurchaseOrderLine } from "@prisma/client";
import type {
  CreatePurchaseOrderInput,
  Paginated,
  PurchaseOrderDto,
  PurchaseOrderLineInput,
  PurchaseOrderListQuery,
  PurchaseOrderSummaryDto,
  UpdatePurchaseOrderInput,
} from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";

type PoWithSupplier = PurchaseOrder & {
  supplier: { id: string; name: string; code: string };
};

type PoWithRelations = PoWithSupplier & { lines: PurchaseOrderLine[] };

function computeLineTotal(quantity: number, unitPriceMinor: number): number {
  return Math.round(quantity * unitPriceMinor);
}

function lineData(line: PurchaseOrderLineInput, index: number) {
  return {
    lineNumber: index + 1,
    description: line.description,
    sku: line.sku ?? null,
    orderedQuantity: line.orderedQuantity,
    unit: line.unit,
    unitPriceMinor: line.unitPriceMinor,
    lineTotalMinor: computeLineTotal(line.orderedQuantity, line.unitPriceMinor),
  };
}

function toSummary(po: PoWithSupplier & { _count: { lines: number } }): PurchaseOrderSummaryDto {
  return {
    id: po.id,
    poNumber: po.poNumber,
    status: po.status,
    currency: po.currency,
    expectedDeliveryDate: po.expectedDeliveryDate ? po.expectedDeliveryDate.toISOString() : null,
    totalMinor: po.totalMinor,
    lineCount: po._count.lines,
    supplier: po.supplier,
    createdAt: po.createdAt.toISOString(),
  };
}

function toDto(po: PoWithRelations): PurchaseOrderDto {
  return {
    id: po.id,
    poNumber: po.poNumber,
    status: po.status,
    currency: po.currency,
    issueDate: po.issueDate ? po.issueDate.toISOString() : null,
    expectedDeliveryDate: po.expectedDeliveryDate ? po.expectedDeliveryDate.toISOString() : null,
    notes: po.notes,
    totalMinor: po.totalMinor,
    supplier: po.supplier,
    lines: po.lines
      .slice()
      .sort((a, b) => a.lineNumber - b.lineNumber)
      .map((line) => ({
        id: line.id,
        lineNumber: line.lineNumber,
        description: line.description,
        sku: line.sku,
        orderedQuantity: line.orderedQuantity.toString(),
        unit: line.unit,
        unitPriceMinor: line.unitPriceMinor,
        lineTotalMinor: line.lineTotalMinor,
      })),
    createdAt: po.createdAt.toISOString(),
    updatedAt: po.updatedAt.toISOString(),
  };
}

const SUPPLIER_SELECT = { select: { id: true, name: true, code: true } } as const;

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    organizationId: string,
    query: PurchaseOrderListQuery,
  ): Promise<Paginated<PurchaseOrderSummaryDto>> {
    const { search, status, page, pageSize } = query;
    const where = {
      organizationId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { poNumber: { contains: search, mode: "insensitive" as const } },
              { supplier: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.count({ where }),
      this.prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { supplier: SUPPLIER_SELECT, _count: { select: { lines: true } } },
      }),
    ]);

    return { items: orders.map(toSummary), total, page, pageSize };
  }

  async get(organizationId: string, id: string): Promise<PurchaseOrderDto> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: { supplier: SUPPLIER_SELECT, lines: true },
    });
    if (!po) throw AppError.notFound("Purchase order not found");
    return toDto(po);
  }

  async create(
    organizationId: string,
    actorUserId: string,
    input: CreatePurchaseOrderInput,
  ): Promise<PurchaseOrderDto> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: input.supplierId, organizationId },
      select: { id: true, status: true },
    });
    if (!supplier) throw AppError.badRequest("INVALID_SUPPLIER", "The selected supplier is not available.");

    const existing = await this.prisma.purchaseOrder.findUnique({
      where: { organizationId_poNumber: { organizationId, poNumber: input.poNumber } },
      select: { id: true },
    });
    if (existing) {
      throw AppError.conflict("DUPLICATE_PO_NUMBER", "A purchase order with this number already exists.");
    }

    const lines = input.lines.map(lineData);
    const totalMinor = lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);

    const po = await this.prisma.purchaseOrder.create({
      data: {
        organizationId,
        supplierId: input.supplierId,
        createdByUserId: actorUserId,
        poNumber: input.poNumber,
        currency: input.currency,
        expectedDeliveryDate: input.expectedDeliveryDate ?? null,
        notes: input.notes ?? null,
        totalMinor,
        lines: { create: lines },
      },
      include: { supplier: SUPPLIER_SELECT, lines: true },
    });

    return toDto(po);
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdatePurchaseOrderInput,
  ): Promise<PurchaseOrderDto> {
    const current = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true, poNumber: true },
    });
    if (!current) throw AppError.notFound("Purchase order not found");
    if (current.status !== "DRAFT") {
      throw AppError.badRequest("PO_NOT_EDITABLE", "Only draft purchase orders can be edited.");
    }

    if (input.poNumber && input.poNumber !== current.poNumber) {
      const clash = await this.prisma.purchaseOrder.findUnique({
        where: { organizationId_poNumber: { organizationId, poNumber: input.poNumber } },
        select: { id: true },
      });
      if (clash) {
        throw AppError.conflict("DUPLICATE_PO_NUMBER", "A purchase order with this number already exists.");
      }
    }

    const lineRows = input.lines?.map(lineData);
    const totalMinor = lineRows ? lineRows.reduce((sum, line) => sum + line.lineTotalMinor, 0) : undefined;

    const po = await this.prisma.$transaction(async (tx) => {
      if (lineRows) {
        await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          ...(input.poNumber !== undefined ? { poNumber: input.poNumber } : {}),
          ...(input.expectedDeliveryDate !== undefined
            ? { expectedDeliveryDate: input.expectedDeliveryDate ?? null }
            : {}),
          ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
          ...(totalMinor !== undefined ? { totalMinor } : {}),
          version: { increment: 1 },
          ...(lineRows ? { lines: { create: lineRows } } : {}),
        },
        include: { supplier: SUPPLIER_SELECT, lines: true },
      });
    });

    return toDto(po);
  }

  async issue(organizationId: string, id: string): Promise<PurchaseOrderDto> {
    const current = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: { _count: { select: { lines: true } } },
    });
    if (!current) throw AppError.notFound("Purchase order not found");
    if (current.status !== "DRAFT") {
      throw AppError.badRequest("PO_NOT_ISSUABLE", "Only draft purchase orders can be issued.");
    }
    if (current._count.lines === 0) {
      throw AppError.badRequest("PO_EMPTY", "Add at least one line item before issuing.");
    }

    const po = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: "ISSUED", issueDate: current.issueDate ?? new Date() },
      include: { supplier: SUPPLIER_SELECT, lines: true },
    });
    return toDto(po);
  }

  async cancel(organizationId: string, id: string): Promise<PurchaseOrderDto> {
    const current = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!current) throw AppError.notFound("Purchase order not found");
    if (current.status !== "DRAFT" && current.status !== "ISSUED") {
      throw AppError.badRequest("PO_NOT_CANCELLABLE", "This purchase order can no longer be cancelled.");
    }

    const po = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: { supplier: SUPPLIER_SELECT, lines: true },
    });
    return toDto(po);
  }
}
