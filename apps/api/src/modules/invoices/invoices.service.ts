import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  CreateInvoiceInput,
  DiscrepancySeverity,
  DiscrepancyType,
  InvoiceDto,
  InvoiceListQuery,
  InvoiceSummaryDto,
  Paginated,
  UpdateInvoiceInput,
} from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { writeAudit } from "../../common/audit/audit";

const SUPPLIER_SELECT = { select: { id: true, name: true, code: true } } as const;
const PO_SELECT = { select: { id: true, poNumber: true } } as const;

const INVOICE_INCLUDE = {
  supplier: SUPPLIER_SELECT,
  purchaseOrder: PO_SELECT,
  lines: true,
  _count: { select: { discrepancies: true } },
} as const;

type InvoiceWithRelations = Prisma.InvoiceGetPayload<{ include: typeof INVOICE_INCLUDE }>;

function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

function computeLineTotal(quantity: number, unitPriceMinor: number): number {
  return Math.round(quantity * unitPriceMinor);
}

function toDto(invoice: InvoiceWithRelations): InvoiceDto {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.toISOString() : null,
    totalMinor: invoice.totalMinor,
    notes: invoice.notes,
    supplier: invoice.supplier,
    purchaseOrder: invoice.purchaseOrder,
    lines: invoice.lines.map((line) => ({
      id: line.id,
      poLineId: line.purchaseOrderLineId,
      description: line.description,
      quantity: line.quantity.toString(),
      unit: line.unit,
      unitPriceMinor: line.unitPriceMinor,
      lineTotalMinor: line.lineTotalMinor,
    })),
    discrepancyCount: invoice._count.discrepancies,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
  };
}

interface NewDiscrepancy {
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  explanation: string;
  expectedValue: string | null;
  actualValue: string | null;
  purchaseOrderLineId: string | null;
}

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, query: InvoiceListQuery): Promise<Paginated<InvoiceSummaryDto>> {
    const { search, status, page, pageSize } = query;
    const where = {
      organizationId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: "insensitive" as const } },
              { supplier: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [total, invoices] = await this.prisma.$transaction([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          supplier: SUPPLIER_SELECT,
          purchaseOrder: PO_SELECT,
          _count: { select: { lines: true } },
        },
      }),
    ]);

    const items: InvoiceSummaryDto[] = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      currency: invoice.currency,
      invoiceDate: invoice.invoiceDate ? invoice.invoiceDate.toISOString() : null,
      totalMinor: invoice.totalMinor,
      supplier: invoice.supplier,
      purchaseOrder: invoice.purchaseOrder,
      lineCount: invoice._count.lines,
      createdAt: invoice.createdAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async get(organizationId: string, id: string): Promise<InvoiceDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: INVOICE_INCLUDE,
    });
    if (!invoice) throw AppError.notFound("Invoice not found");
    return toDto(invoice);
  }

  async create(organizationId: string, input: CreateInvoiceInput): Promise<InvoiceDto> {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: input.supplierId, organizationId },
      select: { id: true },
    });
    if (!supplier) throw AppError.badRequest("INVALID_SUPPLIER", "The selected supplier is not available.");

    if (input.poId) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: { id: input.poId, organizationId },
        select: { id: true },
      });
      if (!po) throw AppError.badRequest("INVALID_PO", "The selected purchase order is not available.");
    }

    const existing = await this.prisma.invoice.findUnique({
      where: { organizationId_invoiceNumber: { organizationId, invoiceNumber: input.invoiceNumber } },
      select: { id: true },
    });
    if (existing) {
      throw AppError.conflict("DUPLICATE_INVOICE_NUMBER", "An invoice with this number already exists.");
    }

    const lines = input.lines.map((line) => ({
      purchaseOrderLineId: line.poLineId ?? null,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPriceMinor: line.unitPriceMinor,
      lineTotalMinor: computeLineTotal(line.quantity, line.unitPriceMinor),
    }));

    const invoice = await this.prisma.invoice.create({
      data: {
        organizationId,
        supplierId: input.supplierId,
        purchaseOrderId: input.poId ?? null,
        invoiceNumber: input.invoiceNumber,
        invoiceDate: input.invoiceDate ?? null,
        currency: input.currency,
        notes: input.notes ?? null,
        totalMinor: lines.reduce((sum, line) => sum + line.lineTotalMinor, 0),
        lines: { create: lines },
      },
      include: INVOICE_INCLUDE,
    });

    return toDto(invoice);
  }

  async update(organizationId: string, id: string, input: UpdateInvoiceInput): Promise<InvoiceDto> {
    const current = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true, invoiceNumber: true },
    });
    if (!current) throw AppError.notFound("Invoice not found");
    if (current.status !== "DRAFT") {
      throw AppError.badRequest("INVOICE_NOT_EDITABLE", "Only draft invoices can be edited.");
    }

    if (input.invoiceNumber && input.invoiceNumber !== current.invoiceNumber) {
      const clash = await this.prisma.invoice.findUnique({
        where: { organizationId_invoiceNumber: { organizationId, invoiceNumber: input.invoiceNumber } },
        select: { id: true },
      });
      if (clash) {
        throw AppError.conflict("DUPLICATE_INVOICE_NUMBER", "An invoice with this number already exists.");
      }
    }

    if (input.poId) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: { id: input.poId, organizationId },
        select: { id: true },
      });
      if (!po) throw AppError.badRequest("INVALID_PO", "The selected purchase order is not available.");
    }

    const lineRows = input.lines?.map((line) => ({
      purchaseOrderLineId: line.poLineId ?? null,
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPriceMinor: line.unitPriceMinor,
      lineTotalMinor: computeLineTotal(line.quantity, line.unitPriceMinor),
    }));
    const totalMinor = lineRows ? lineRows.reduce((sum, line) => sum + line.lineTotalMinor, 0) : undefined;

    const invoice = await this.prisma.$transaction(async (tx) => {
      if (lineRows) {
        await tx.invoiceLine.deleteMany({ where: { invoiceId: id } });
      }
      return tx.invoice.update({
        where: { id },
        data: {
          ...(input.invoiceNumber !== undefined ? { invoiceNumber: input.invoiceNumber } : {}),
          ...(input.poId !== undefined ? { purchaseOrderId: input.poId ?? null } : {}),
          ...(input.invoiceDate !== undefined ? { invoiceDate: input.invoiceDate ?? null } : {}),
          ...(input.notes !== undefined ? { notes: input.notes ?? null } : {}),
          ...(totalMinor !== undefined ? { totalMinor } : {}),
          ...(lineRows ? { lines: { create: lineRows } } : {}),
        },
        include: INVOICE_INCLUDE,
      });
    });

    return toDto(invoice);
  }

  async review(organizationId: string, actorUserId: string, id: string): Promise<InvoiceDto> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, organizationId },
      include: {
        lines: true,
        purchaseOrder: { include: { lines: true } },
        supplier: SUPPLIER_SELECT,
        _count: { select: { discrepancies: true } },
      },
    });
    if (!invoice) throw AppError.notFound("Invoice not found");
    const po = invoice.purchaseOrder;
    if (!po) {
      throw AppError.badRequest("INVOICE_NO_PO", "Link the invoice to a purchase order before reviewing.");
    }

    const receiptRows = await this.prisma.receiptLine.findMany({
      where: { receipt: { purchaseOrderId: po.id, status: "SUBMITTED" } },
      select: { purchaseOrderLineId: true, receivedQuantity: true, damagedQuantity: true },
    });
    const receivedByLine = new Map<string, number>();
    const damagedByLine = new Map<string, number>();
    for (const row of receiptRows) {
      receivedByLine.set(
        row.purchaseOrderLineId,
        (receivedByLine.get(row.purchaseOrderLineId) ?? 0) + Number(row.receivedQuantity),
      );
      damagedByLine.set(
        row.purchaseOrderLineId,
        (damagedByLine.get(row.purchaseOrderLineId) ?? 0) + Number(row.damagedQuantity),
      );
    }

    const poLineById = new Map(po.lines.map((line) => [line.id, line]));
    const discrepancies: NewDiscrepancy[] = [];
    const damagedReported = new Set<string>();

    for (const line of invoice.lines) {
      const invoiced = Number(line.quantity);
      const poLine = line.purchaseOrderLineId ? poLineById.get(line.purchaseOrderLineId) : undefined;

      if (!poLine) {
        discrepancies.push({
          type: "UNMATCHED_LINE",
          severity: "LOW",
          explanation: "Invoice line is not matched to a purchase order line.",
          expectedValue: null,
          actualValue: `${invoiced} ${line.unit}`,
          purchaseOrderLineId: null,
        });
        continue;
      }

      const ordered = Number(poLine.orderedQuantity);
      const received = receivedByLine.get(poLine.id) ?? 0;
      const damaged = damagedByLine.get(poLine.id) ?? 0;

      if (invoiced > received) {
        discrepancies.push({
          type: "QUANTITY_MISMATCH",
          severity: "HIGH",
          explanation: `PO ordered ${ordered}; received ${received}; invoiced ${invoiced}.`,
          expectedValue: `${received} ${poLine.unit}`,
          actualValue: `${invoiced} ${line.unit}`,
          purchaseOrderLineId: poLine.id,
        });
      }

      if (invoiced > ordered) {
        discrepancies.push({
          type: "OVER_DELIVERY",
          severity: "MEDIUM",
          explanation: `Invoiced quantity ${invoiced} exceeds the ordered quantity ${ordered}.`,
          expectedValue: `${ordered} ${poLine.unit}`,
          actualValue: `${invoiced} ${line.unit}`,
          purchaseOrderLineId: poLine.id,
        });
      }

      if (line.unitPriceMinor !== poLine.unitPriceMinor) {
        discrepancies.push({
          type: "UNIT_PRICE_MISMATCH",
          severity: "MEDIUM",
          explanation: "Purchase order unit price and invoice unit price differ.",
          expectedValue: formatMoney(poLine.unitPriceMinor, invoice.currency),
          actualValue: formatMoney(line.unitPriceMinor, invoice.currency),
          purchaseOrderLineId: poLine.id,
        });
      }

      if (damaged > 0 && !damagedReported.has(poLine.id)) {
        damagedReported.add(poLine.id);
        discrepancies.push({
          type: "DAMAGED_GOODS",
          severity: "MEDIUM",
          explanation: `${damaged} ${poLine.unit} of the received quantity was reported damaged.`,
          expectedValue: "0",
          actualValue: `${damaged} ${poLine.unit}`,
          purchaseOrderLineId: poLine.id,
        });
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.discrepancy.deleteMany({ where: { invoiceId: id } });
      if (discrepancies.length > 0) {
        await tx.discrepancy.createMany({
          data: discrepancies.map((item) => ({
            organizationId,
            purchaseOrderId: po.id,
            invoiceId: id,
            purchaseOrderLineId: item.purchaseOrderLineId,
            type: item.type,
            severity: item.severity,
            explanation: item.explanation,
            expectedValue: item.expectedValue,
            actualValue: item.actualValue,
          })),
        });
      }
      return tx.invoice.update({
        where: { id },
        data: { status: "REVIEWED" },
        include: INVOICE_INCLUDE,
      });
    });

    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: "invoice.reviewed",
      entityType: "Invoice",
      entityId: id,
      summary: `${discrepancies.length} discrepancy(ies) detected`,
    });

    return toDto(updated);
  }
}
