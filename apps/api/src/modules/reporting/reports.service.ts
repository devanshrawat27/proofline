import { Injectable } from "@nestjs/common";
import type {
  CaseStatus,
  ReportDiscrepanciesDto,
  ReportSupplierRow,
  ReportSuppliersDto,
} from "@proofline/shared-types";
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
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async discrepancies(organizationId: string): Promise<ReportDiscrepanciesDto> {
    const [byTypeRaw, bySeverityRaw] = await Promise.all([
      this.prisma.discrepancy.groupBy({
        by: ["type"],
        where: { organizationId, status: "OPEN" },
        _count: { _all: true },
      }),
      this.prisma.discrepancy.groupBy({
        by: ["severity"],
        where: { organizationId, status: "OPEN" },
        _count: { _all: true },
      }),
    ]);

    const byType = byTypeRaw
      .map((row) => ({ type: row.type, count: row._count._all }))
      .sort((a, b) => b.count - a.count);
    const bySeverity = bySeverityRaw
      .map((row) => ({ severity: row.severity, count: row._count._all }))
      .sort((a, b) => b.count - a.count);

    const total = byType.reduce((sum, row) => sum + row.count, 0);
    return { total, byType, bySeverity };
  }

  async suppliers(organizationId: string): Promise<ReportSuppliersDto> {
    const [organization, caseCounts, openCaseCounts, invoicesWithOpen] = await Promise.all([
      this.prisma.organization.findUnique({
        where: { id: organizationId },
        select: { defaultCurrency: true },
      }),
      this.prisma.disputeCase.groupBy({
        by: ["supplierId"],
        where: { organizationId },
        _count: { _all: true },
      }),
      this.prisma.disputeCase.groupBy({
        by: ["supplierId"],
        where: { organizationId, status: { in: OPEN_CASE_STATUSES } },
        _count: { _all: true },
      }),
      this.prisma.invoice.findMany({
        where: { organizationId, discrepancies: { some: { status: "OPEN" } } },
        select: { supplierId: true, totalMinor: true },
      }),
    ]);

    const disputed = new Map<string, number>();
    for (const invoice of invoicesWithOpen) {
      disputed.set(invoice.supplierId, (disputed.get(invoice.supplierId) ?? 0) + invoice.totalMinor);
    }

    const caseBySupplier = new Map(caseCounts.map((row) => [row.supplierId, row._count._all]));
    const openBySupplier = new Map(openCaseCounts.map((row) => [row.supplierId, row._count._all]));

    const supplierIds = new Set<string>([
      ...caseBySupplier.keys(),
      ...disputed.keys(),
    ]);
    if (supplierIds.size === 0) {
      return { currency: organization?.defaultCurrency ?? "INR", rows: [] };
    }

    const suppliers = await this.prisma.supplier.findMany({
      where: { organizationId, id: { in: [...supplierIds] } },
      select: { id: true, name: true, code: true },
    });

    const rows: ReportSupplierRow[] = suppliers
      .map((supplier) => ({
        supplierId: supplier.id,
        name: supplier.name,
        code: supplier.code,
        caseCount: caseBySupplier.get(supplier.id) ?? 0,
        openCaseCount: openBySupplier.get(supplier.id) ?? 0,
        disputedValueMinor: disputed.get(supplier.id) ?? 0,
      }))
      .sort((a, b) => b.disputedValueMinor - a.disputedValueMinor || b.caseCount - a.caseCount);

    return { currency: organization?.defaultCurrency ?? "INR", rows };
  }
}
