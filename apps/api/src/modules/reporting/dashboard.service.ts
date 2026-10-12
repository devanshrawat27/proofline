import { Injectable } from "@nestjs/common";
import type { CaseStatus, DashboardSummaryDto, PoStatus } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";

const OPEN_CASE_STATUSES: CaseStatus[] = [
  "OPEN",
  "UNDER_REVIEW",
  "SENT_TO_SUPPLIER",
  "SUPPLIER_RESPONDED",
  "RESOLUTION_PROPOSED",
  "AWAITING_INTERNAL_APPROVAL",
  "RESOLUTION_IN_PROGRESS",
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(organizationId: string): Promise<DashboardSummaryDto> {
    const now = new Date();

    const [organization, casesByStatus, discrepanciesByTypeRaw, poStatusRaw, invoicesWithOpen, closedCases] =
      await Promise.all([
        this.prisma.organization.findUnique({
          where: { id: organizationId },
          select: { defaultCurrency: true },
        }),
        this.prisma.disputeCase.groupBy({
          by: ["status"],
          where: { organizationId },
          _count: { _all: true },
        }),
        this.prisma.discrepancy.groupBy({
          by: ["type"],
          where: { organizationId, status: "OPEN" },
          _count: { _all: true },
        }),
        this.prisma.purchaseOrder.groupBy({
          by: ["status"],
          where: { organizationId },
          _count: { _all: true },
        }),
        this.prisma.invoice.findMany({
          where: { organizationId, discrepancies: { some: { status: "OPEN" } } },
          select: { totalMinor: true },
        }),
        this.prisma.disputeCase.findMany({
          where: { organizationId, status: "CLOSED", openedAt: { not: null }, closedAt: { not: null } },
          select: { openedAt: true, closedAt: true },
        }),
      ]);

    const statusCount = new Map(casesByStatus.map((row) => [row.status, row._count._all]));
    const openCases = OPEN_CASE_STATUSES.reduce((sum, status) => sum + (statusCount.get(status) ?? 0), 0);
    const awaitingSupplier = statusCount.get("SENT_TO_SUPPLIER") ?? 0;

    const overdueCases = await this.prisma.disputeCase.count({
      where: { organizationId, status: { in: OPEN_CASE_STATUSES }, dueDate: { lt: now } },
    });

    const disputedValueMinor = invoicesWithOpen.reduce((sum, invoice) => sum + invoice.totalMinor, 0);

    const avgResolutionDays =
      closedCases.length > 0
        ? Math.round(
            (closedCases.reduce(
              (sum, item) =>
                sum + (item.closedAt!.getTime() - item.openedAt!.getTime()) / (1000 * 60 * 60 * 24),
              0,
            ) /
              closedCases.length) *
              10,
          ) / 10
        : null;

    return {
      openCases,
      awaitingSupplier,
      overdueCases,
      disputedValueMinor,
      currency: organization?.defaultCurrency ?? "INR",
      avgResolutionDays,
      casesByStatus: casesByStatus
        .map((row) => ({ status: row.status, count: row._count._all }))
        .sort((a, b) => b.count - a.count),
      discrepanciesByType: discrepanciesByTypeRaw
        .map((row) => ({ type: row.type, count: row._count._all }))
        .sort((a, b) => b.count - a.count),
      poReceiptStatus: poStatusRaw
        .map((row) => ({ status: row.status as PoStatus, count: row._count._all }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
