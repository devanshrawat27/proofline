import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  CreateReceiptInput,
  Paginated,
  ReceiptDto,
  ReceiptListQuery,
  ReceiptSummaryDto,
  UpdateReceiptInput,
} from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { writeAudit } from "../../common/audit/audit";

const SUPPLIER_SELECT = { select: { id: true, name: true, code: true } } as const;

const RECEIPT_INCLUDE = {
  purchaseOrder: { select: { id: true, poNumber: true, status: true, supplier: SUPPLIER_SELECT } },
  lines: { include: { purchaseOrderLine: true } },
} as const;

type ReceiptWithRelations = Prisma.ReceiptGetPayload<{ include: typeof RECEIPT_INCLUDE }>;

function lineDto(line: ReceiptWithRelations["lines"][number]): ReceiptDto["lines"][number] {
  const received = Number(line.receivedQuantity);
  const damaged = Number(line.damagedQuantity);
  return {
    id: line.id,
    purchaseOrderLineId: line.purchaseOrderLineId,
    description: line.purchaseOrderLine.description,
    unit: line.purchaseOrderLine.unit,
    orderedQuantity: line.purchaseOrderLine.orderedQuantity.toString(),
    receivedQuantity: line.receivedQuantity.toString(),
    damagedQuantity: line.damagedQuantity.toString(),
    acceptedQuantity: (received - damaged).toString(),
  };
}

function toDto(receipt: ReceiptWithRelations): ReceiptDto {
  return {
    id: receipt.id,
    status: receipt.status,
    reference: receipt.reference,
    notes: receipt.notes,
    receivedAt: receipt.receivedAt ? receipt.receivedAt.toISOString() : null,
    submittedAt: receipt.submittedAt ? receipt.submittedAt.toISOString() : null,
    purchaseOrder: receipt.purchaseOrder,
    lines: receipt.lines.map(lineDto),
    createdAt: receipt.createdAt.toISOString(),
    updatedAt: receipt.updatedAt.toISOString(),
  };
}

@Injectable()
export class ReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    organizationId: string,
    query: ReceiptListQuery,
  ): Promise<Paginated<ReceiptSummaryDto>> {
    const { search, status, purchaseOrderId, page, pageSize } = query;
    const where = {
      organizationId,
      ...(status ? { status } : {}),
      ...(purchaseOrderId ? { purchaseOrderId } : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search, mode: "insensitive" as const } },
              { purchaseOrder: { poNumber: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [total, receipts] = await this.prisma.$transaction([
      this.prisma.receipt.count({ where }),
      this.prisma.receipt.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          purchaseOrder: { select: { id: true, poNumber: true } },
          _count: { select: { lines: true } },
        },
      }),
    ]);

    const items: ReceiptSummaryDto[] = receipts.map((receipt) => ({
      id: receipt.id,
      status: receipt.status,
      reference: receipt.reference,
      receivedAt: receipt.receivedAt ? receipt.receivedAt.toISOString() : null,
      purchaseOrder: receipt.purchaseOrder,
      lineCount: receipt._count.lines,
      createdAt: receipt.createdAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async get(organizationId: string, id: string): Promise<ReceiptDto> {
    const receipt = await this.prisma.receipt.findFirst({
      where: { id, organizationId },
      include: RECEIPT_INCLUDE,
    });
    if (!receipt) throw AppError.notFound("Receipt not found");
    return toDto(receipt);
  }

  async create(
    organizationId: string,
    actorUserId: string,
    input: CreateReceiptInput,
  ): Promise<ReceiptDto> {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id: input.purchaseOrderId, organizationId },
      include: { lines: { select: { id: true } } },
    });
    if (!po) throw AppError.badRequest("INVALID_PO", "The selected purchase order is not available.");
    if (po.status !== "ISSUED" && po.status !== "PARTIALLY_RECEIVED") {
      throw AppError.badRequest("PO_NOT_RECEIVABLE", "Only issued purchase orders can be received against.");
    }

    const poLineIds = new Set(po.lines.map((line) => line.id));
    const seen = new Set<string>();
    for (const line of input.lines) {
      if (!poLineIds.has(line.purchaseOrderLineId)) {
        throw AppError.badRequest("INVALID_PO_LINE", "A line does not belong to this purchase order.");
      }
      if (seen.has(line.purchaseOrderLineId)) {
        throw AppError.badRequest("DUPLICATE_PO_LINE", "Each purchase order line can only be recorded once.");
      }
      seen.add(line.purchaseOrderLineId);
    }

    const receipt = await this.prisma.receipt.create({
      data: {
        organizationId,
        purchaseOrderId: input.purchaseOrderId,
        receivedByUserId: actorUserId,
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        lines: {
          create: input.lines.map((line) => ({
            purchaseOrderLineId: line.purchaseOrderLineId,
            receivedQuantity: line.receivedQuantity,
            damagedQuantity: line.damagedQuantity,
          })),
        },
      },
      include: RECEIPT_INCLUDE,
    });

    return toDto(receipt);
  }

  async update(
    organizationId: string,
    id: string,
    input: UpdateReceiptInput,
  ): Promise<ReceiptDto> {
    const current = await this.prisma.receipt.findFirst({
      where: { id, organizationId },
      include: { purchaseOrder: { include: { lines: { select: { id: true } } } } },
    });
    if (!current) throw AppError.notFound("Receipt not found");
    if (current.status !== "DRAFT") {
      throw AppError.badRequest("RECEIPT_NOT_EDITABLE", "Only draft receipts can be edited.");
    }

    if (input.lines) {
      const poLineIds = new Set(current.purchaseOrder.lines.map((line) => line.id));
      const seen = new Set<string>();
      for (const line of input.lines) {
        if (!poLineIds.has(line.purchaseOrderLineId)) {
          throw AppError.badRequest("INVALID_PO_LINE", "A line does not belong to this purchase order.");
        }
        if (seen.has(line.purchaseOrderLineId)) {
          throw AppError.badRequest("DUPLICATE_PO_LINE", "Each purchase order line can only be recorded once.");
        }
        seen.add(line.purchaseOrderLineId);
      }
    }

    const receipt = await this.prisma.$transaction(async (tx) => {
      if (input.lines) {
        await tx.receiptLine.deleteMany({ where: { receiptId: id } });
      }
      return tx.receipt.update({
        where: { id },
        data: {
          ...(input.reference !== undefined ? { reference: input.reference ?? null } : {}),
          ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
          ...(input.lines
            ? {
                lines: {
                  create: input.lines.map((line) => ({
                    purchaseOrderLineId: line.purchaseOrderLineId,
                    receivedQuantity: line.receivedQuantity,
                    damagedQuantity: line.damagedQuantity,
                  })),
                },
              }
            : {}),
        },
        include: RECEIPT_INCLUDE,
      });
    });

    return toDto(receipt);
  }

  async submit(organizationId: string, actorUserId: string, id: string): Promise<ReceiptDto> {
    const current = await this.prisma.receipt.findFirst({
      where: { id, organizationId },
      include: { lines: { select: { receivedQuantity: true } } },
    });
    if (!current) throw AppError.notFound("Receipt not found");
    if (current.status !== "DRAFT") {
      throw AppError.badRequest("RECEIPT_NOT_SUBMITTABLE", "Only draft receipts can be submitted.");
    }
    const hasReceived = current.lines.some((line) => Number(line.receivedQuantity) > 0);
    if (!hasReceived) {
      throw AppError.badRequest("RECEIPT_EMPTY", "Record at least one received quantity before submitting.");
    }

    const receipt = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.receipt.update({
        where: { id },
        data: { status: "SUBMITTED", submittedAt: new Date(), receivedAt: new Date() },
        include: RECEIPT_INCLUDE,
      });
      await this.recomputePoStatus(tx, current.purchaseOrderId);
      return updated;
    });

    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: "receipt.submitted",
      entityType: "Receipt",
      entityId: id,
      summary: `Against ${receipt.purchaseOrder.poNumber}`,
    });

    return toDto(receipt);
  }

  private async recomputePoStatus(tx: Prisma.TransactionClient, purchaseOrderId: string) {
    const po = await tx.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { lines: { select: { id: true, orderedQuantity: true } } },
    });
    if (!po) return;
    if (po.status !== "ISSUED" && po.status !== "PARTIALLY_RECEIVED" && po.status !== "FULLY_RECEIVED") {
      return;
    }

    const rows = await tx.receiptLine.findMany({
      where: { receipt: { purchaseOrderId, status: "SUBMITTED" } },
      select: { purchaseOrderLineId: true, receivedQuantity: true },
    });
    const receivedByLine = new Map<string, number>();
    for (const row of rows) {
      const prev = receivedByLine.get(row.purchaseOrderLineId) ?? 0;
      receivedByLine.set(row.purchaseOrderLineId, prev + Number(row.receivedQuantity));
    }

    const fully = po.lines.every(
      (line) => (receivedByLine.get(line.id) ?? 0) >= Number(line.orderedQuantity),
    );
    const anyReceived = po.lines.some((line) => (receivedByLine.get(line.id) ?? 0) > 0);
    const nextStatus = fully ? "FULLY_RECEIVED" : anyReceived ? "PARTIALLY_RECEIVED" : po.status;

    if (nextStatus !== po.status) {
      await tx.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: nextStatus } });
    }
  }
}
