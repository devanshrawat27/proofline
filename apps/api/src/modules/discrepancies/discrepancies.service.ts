import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { DiscrepancyDto, DiscrepancyListQuery, Paginated } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";

const DISCREPANCY_INCLUDE = {
  purchaseOrder: { select: { id: true, poNumber: true } },
  invoice: { select: { id: true, invoiceNumber: true } },
} as const;

type DiscrepancyWithRelations = Prisma.DiscrepancyGetPayload<{ include: typeof DISCREPANCY_INCLUDE }>;

function toDto(discrepancy: DiscrepancyWithRelations): DiscrepancyDto {
  return {
    id: discrepancy.id,
    type: discrepancy.type,
    severity: discrepancy.severity,
    status: discrepancy.status,
    explanation: discrepancy.explanation,
    expectedValue: discrepancy.expectedValue,
    actualValue: discrepancy.actualValue,
    purchaseOrder: discrepancy.purchaseOrder,
    invoice: discrepancy.invoice,
    createdAt: discrepancy.createdAt.toISOString(),
  };
}

@Injectable()
export class DiscrepanciesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, query: DiscrepancyListQuery): Promise<Paginated<DiscrepancyDto>> {
    const { search, type, severity, status, invoiceId, purchaseOrderId, page, pageSize } = query;
    const where = {
      organizationId,
      ...(type ? { type } : {}),
      ...(severity ? { severity } : {}),
      ...(status ? { status } : {}),
      ...(invoiceId ? { invoiceId } : {}),
      ...(purchaseOrderId ? { purchaseOrderId } : {}),
      ...(search
        ? {
            OR: [
              { explanation: { contains: search, mode: "insensitive" as const } },
              { purchaseOrder: { poNumber: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [total, discrepancies] = await this.prisma.$transaction([
      this.prisma.discrepancy.count({ where }),
      this.prisma.discrepancy.findMany({
        where,
        orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: DISCREPANCY_INCLUDE,
      }),
    ]);

    return { items: discrepancies.map(toDto), total, page, pageSize };
  }

  async get(organizationId: string, id: string): Promise<DiscrepancyDto> {
    const discrepancy = await this.prisma.discrepancy.findFirst({
      where: { id, organizationId },
      include: DISCREPANCY_INCLUDE,
    });
    if (!discrepancy) throw AppError.notFound("Discrepancy not found");
    return toDto(discrepancy);
  }
}
