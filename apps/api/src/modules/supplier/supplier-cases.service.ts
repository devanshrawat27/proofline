import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  DiscrepancyDto,
  Paginated,
  SupplierCaseDto,
  SupplierCaseListQuery,
  SupplierCaseSummaryDto,
  SupplierProposalInput,
  SupplierRespondInput,
} from "@proofline/shared-types";
import { canTransition } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import { writeAudit } from "../../common/audit/audit";
import { NotificationsService } from "../notifications/notifications.service";

const DISCREPANCY_INCLUDE = {
  purchaseOrder: { select: { id: true, poNumber: true } },
  invoice: { select: { id: true, invoiceNumber: true } },
} as const;

const SUPPLIER_CASE_INCLUDE = {
  items: { include: { discrepancy: { include: DISCREPANCY_INCLUDE } } },
  messages: { where: { visibility: "SUPPLIER_VISIBLE" as const }, orderBy: { createdAt: "asc" as const } },
  resolutions: { orderBy: { proposedAt: "desc" as const } },
} as const;

type SupplierCaseWithRelations = Prisma.DisputeCaseGetPayload<{ include: typeof SUPPLIER_CASE_INCLUDE }>;

function discrepancyDto(discrepancy: SupplierCaseWithRelations["items"][number]["discrepancy"]): DiscrepancyDto {
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

function toCase(item: SupplierCaseWithRelations): SupplierCaseDto {
  return {
    id: item.id,
    caseNumber: item.caseNumber,
    status: item.status,
    priority: item.priority,
    summary: item.summary,
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    openedAt: item.openedAt ? item.openedAt.toISOString() : null,
    closedAt: item.closedAt ? item.closedAt.toISOString() : null,
    discrepancies: item.items.map((caseItem) => discrepancyDto(caseItem.discrepancy)),
    messages: item.messages.map((message) => ({
      id: message.id,
      body: message.body,
      authorName: message.authorName ?? "Team",
      createdAt: message.createdAt.toISOString(),
    })),
    resolutions: item.resolutions.map((resolution) => ({
      id: resolution.id,
      type: resolution.type,
      status: resolution.status,
      proposedAmountMinor: resolution.proposedAmountMinor,
      reference: resolution.reference,
      notes: resolution.notes,
      proposedByName: resolution.proposedByName,
      proposedAt: resolution.proposedAt.toISOString(),
    })),
    updatedAt: item.updatedAt.toISOString(),
  };
}

@Injectable()
export class SupplierCasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  private scope(principal: SupplierPrincipal) {
    return { organizationId: principal.organizationId, supplierId: principal.supplierId };
  }

  async list(
    principal: SupplierPrincipal,
    query: SupplierCaseListQuery,
  ): Promise<Paginated<SupplierCaseSummaryDto>> {
    const { status, page, pageSize } = query;
    const where = { ...this.scope(principal), ...(status ? { status } : {}) };

    const [total, cases] = await this.prisma.$transaction([
      this.prisma.disputeCase.count({ where }),
      this.prisma.disputeCase.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { items: true } } },
      }),
    ]);

    const items: SupplierCaseSummaryDto[] = cases.map((item) => ({
      id: item.id,
      caseNumber: item.caseNumber,
      status: item.status,
      priority: item.priority,
      summary: item.summary,
      dueDate: item.dueDate ? item.dueDate.toISOString() : null,
      discrepancyCount: item._count.items,
      updatedAt: item.updatedAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async get(principal: SupplierPrincipal, id: string): Promise<SupplierCaseDto> {
    const item = await this.prisma.disputeCase.findFirst({
      where: { id, ...this.scope(principal) },
      include: SUPPLIER_CASE_INCLUDE,
    });
    if (!item) throw AppError.notFound("Case not found");
    return toCase(item);
  }

  async respond(
    principal: SupplierPrincipal,
    id: string,
    input: SupplierRespondInput,
  ): Promise<SupplierCaseDto> {
    const current = await this.prisma.disputeCase.findFirst({
      where: { id, ...this.scope(principal) },
      select: { id: true, status: true, caseNumber: true, assigneeUserId: true },
    });
    if (!current) throw AppError.notFound("Case not found");
    if (current.status === "CLOSED" || current.status === "CANCELLED") {
      throw AppError.badRequest("CASE_CLOSED", "This case is closed and cannot receive responses.");
    }

    const nextStatus = canTransition(current.status, "SUPPLIER_RESPONDED")
      ? "SUPPLIER_RESPONDED"
      : current.status;

    const item = await this.prisma.disputeCase.update({
      where: { id },
      data: {
        status: nextStatus,
        messages: {
          create: { authorName: principal.supplierUserName, visibility: "SUPPLIER_VISIBLE", body: input.body },
        },
        events: {
          create: { type: "SUPPLIER_RESPONDED", message: `Supplier response: ${principal.supplierName}` },
        },
      },
      include: SUPPLIER_CASE_INCLUDE,
    });

    await writeAudit(this.prisma, {
      organizationId: principal.organizationId,
      actorName: principal.supplierUserName,
      actorType: "SUPPLIER",
      action: "case.supplier_responded",
      entityType: "DisputeCase",
      entityId: id,
      summary: current.caseNumber,
    });

    await this.notifications.createForUser(current.assigneeUserId, {
      organizationId: principal.organizationId,
      type: "SUPPLIER_RESPONDED",
      title: `${principal.supplierName} responded to case ${current.caseNumber}`,
      entityType: "DisputeCase",
      entityId: id,
    });

    return toCase(item);
  }

  async propose(
    principal: SupplierPrincipal,
    id: string,
    input: SupplierProposalInput,
  ): Promise<SupplierCaseDto> {
    const current = await this.prisma.disputeCase.findFirst({
      where: { id, ...this.scope(principal) },
      select: { id: true, status: true, caseNumber: true, assigneeUserId: true },
    });
    if (!current) throw AppError.notFound("Case not found");
    if (current.status !== "SENT_TO_SUPPLIER" && current.status !== "SUPPLIER_RESPONDED") {
      throw AppError.badRequest(
        "PROPOSAL_NOT_ALLOWED",
        "A proposal can only be made while the case is with the supplier.",
      );
    }

    const item = await this.prisma.$transaction(async (tx) => {
      await tx.resolution.create({
        data: {
          caseId: id,
          type: input.type,
          status: "PROPOSED",
          proposedAmountMinor: input.proposedAmountMinor ?? null,
          reference: input.reference ?? null,
          notes: input.notes ?? null,
          proposedByName: principal.supplierName,
        },
      });
      return tx.disputeCase.update({
        where: { id },
        data: {
          status: "RESOLUTION_PROPOSED",
          events: {
            create: { type: "RESOLUTION_PROPOSED", message: `Supplier proposed ${input.type}` },
          },
        },
        include: SUPPLIER_CASE_INCLUDE,
      });
    });

    await writeAudit(this.prisma, {
      organizationId: principal.organizationId,
      actorName: principal.supplierUserName,
      actorType: "SUPPLIER",
      action: "case.resolution_proposed",
      entityType: "DisputeCase",
      entityId: id,
      summary: `${current.caseNumber}: ${input.type}`,
    });

    await this.notifications.createForUser(current.assigneeUserId, {
      organizationId: principal.organizationId,
      type: "RESOLUTION_PROPOSED",
      title: `${principal.supplierName} proposed a resolution on ${current.caseNumber}`,
      entityType: "DisputeCase",
      entityId: id,
    });

    return toCase(item);
  }
}
