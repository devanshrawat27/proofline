import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  CaseAssignInput,
  CaseDto,
  CaseListQuery,
  CaseMessageInput,
  CaseSummaryDto,
  CaseTransitionInput,
  CreateCaseInput,
  DiscrepancyDto,
  Paginated,
  ProposeResolutionInput,
} from "@proofline/shared-types";
import { canTransition } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { writeAudit } from "../../common/audit/audit";

const SUPPLIER_SELECT = { select: { id: true, name: true, code: true } } as const;
const USER_SELECT = { select: { id: true, name: true } } as const;

const DISCREPANCY_INCLUDE = {
  purchaseOrder: { select: { id: true, poNumber: true } },
  invoice: { select: { id: true, invoiceNumber: true } },
} as const;

const CASE_INCLUDE = {
  supplier: SUPPLIER_SELECT,
  assignee: USER_SELECT,
  items: { include: { discrepancy: { include: DISCREPANCY_INCLUDE } } },
  messages: { include: { author: USER_SELECT }, orderBy: { createdAt: "asc" } },
  events: { include: { actor: USER_SELECT }, orderBy: { createdAt: "asc" } },
  resolutions: {
    include: { proposedBy: USER_SELECT, approvedBy: USER_SELECT, verifiedBy: USER_SELECT },
    orderBy: { proposedAt: "desc" },
  },
} as const;

type CaseWithRelations = Prisma.DisputeCaseGetPayload<{ include: typeof CASE_INCLUDE }>;

function discrepancyDto(discrepancy: CaseWithRelations["items"][number]["discrepancy"]): DiscrepancyDto {
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

function toCase(item: CaseWithRelations): CaseDto {
  return {
    id: item.id,
    caseNumber: item.caseNumber,
    status: item.status,
    priority: item.priority,
    summary: item.summary,
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    openedAt: item.openedAt ? item.openedAt.toISOString() : null,
    closedAt: item.closedAt ? item.closedAt.toISOString() : null,
    supplier: item.supplier,
    assignee: item.assignee,
    items: item.items.map((caseItem) => ({
      id: caseItem.id,
      discrepancyId: caseItem.discrepancyId,
      discrepancy: discrepancyDto(caseItem.discrepancy),
    })),
    messages: item.messages.map((message) => ({
      id: message.id,
      visibility: message.visibility,
      body: message.body,
      author: message.author,
      createdAt: message.createdAt.toISOString(),
    })),
    events: item.events.map((event) => ({
      id: event.id,
      type: event.type,
      message: event.message,
      actorName: event.actor?.name ?? null,
      createdAt: event.createdAt.toISOString(),
    })),
    resolutions: item.resolutions.map((resolution) => ({
      id: resolution.id,
      type: resolution.type,
      status: resolution.status,
      proposedAmountMinor: resolution.proposedAmountMinor,
      reference: resolution.reference,
      notes: resolution.notes,
      proposedByName: resolution.proposedBy?.name ?? null,
      approvedByName: resolution.approvedBy?.name ?? null,
      verifiedByName: resolution.verifiedBy?.name ?? null,
      proposedAt: resolution.proposedAt.toISOString(),
      approvedAt: resolution.approvedAt ? resolution.approvedAt.toISOString() : null,
      verifiedAt: resolution.verifiedAt ? resolution.verifiedAt.toISOString() : null,
    })),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

type Tx = Prisma.TransactionClient;

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, query: CaseListQuery): Promise<Paginated<CaseSummaryDto>> {
    const { search, status, priority, page, pageSize } = query;
    const where = {
      organizationId,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(search
        ? {
            OR: [
              { caseNumber: { contains: search, mode: "insensitive" as const } },
              { summary: { contains: search, mode: "insensitive" as const } },
              { supplier: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [total, cases] = await this.prisma.$transaction([
      this.prisma.disputeCase.count({ where }),
      this.prisma.disputeCase.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { supplier: SUPPLIER_SELECT, assignee: USER_SELECT, _count: { select: { items: true } } },
      }),
    ]);

    const items: CaseSummaryDto[] = cases.map((item) => ({
      id: item.id,
      caseNumber: item.caseNumber,
      status: item.status,
      priority: item.priority,
      summary: item.summary,
      dueDate: item.dueDate ? item.dueDate.toISOString() : null,
      supplier: item.supplier,
      assignee: item.assignee,
      itemCount: item._count.items,
      createdAt: item.createdAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }

  async get(organizationId: string, id: string): Promise<CaseDto> {
    const item = await this.prisma.disputeCase.findFirst({
      where: { id, organizationId },
      include: CASE_INCLUDE,
    });
    if (!item) throw AppError.notFound("Case not found");
    return toCase(item);
  }

  async create(organizationId: string, actorUserId: string, input: CreateCaseInput): Promise<CaseDto> {
    const discrepancies = await this.prisma.discrepancy.findMany({
      where: { id: { in: input.discrepancyIds }, organizationId },
      include: { purchaseOrder: { select: { id: true, supplierId: true } } },
    });
    if (discrepancies.length !== input.discrepancyIds.length) {
      throw AppError.badRequest("INVALID_DISCREPANCY", "One or more discrepancies were not found.");
    }

    const supplierIds = new Set(discrepancies.map((d) => d.purchaseOrder.supplierId));
    if (supplierIds.size > 1) {
      throw AppError.badRequest("MIXED_SUPPLIERS", "A case can only combine discrepancies for a single supplier.");
    }
    const supplierId = discrepancies[0]!.purchaseOrder.supplierId;

    const alreadyCased = await this.prisma.disputeCaseItem.findFirst({
      where: { discrepancyId: { in: input.discrepancyIds } },
      select: { id: true },
    });
    if (alreadyCased) {
      throw AppError.conflict("DISCREPANCY_ALREADY_CASED", "A selected discrepancy is already part of a case.");
    }

    if (input.assigneeUserId) {
      await this.assertMember(organizationId, input.assigneeUserId);
    }

    const item = await this.prisma.$transaction(async (tx) => {
      const caseNumber = await this.nextCaseNumber(tx, organizationId);
      const created = await tx.disputeCase.create({
        data: {
          organizationId,
          supplierId,
          assigneeUserId: input.assigneeUserId ?? null,
          caseNumber,
          status: "OPEN",
          priority: input.priority,
          summary: input.summary,
          dueDate: input.dueDate ?? null,
          openedAt: new Date(),
          items: { create: input.discrepancyIds.map((discrepancyId) => ({ discrepancyId })) },
          events: { create: { actorUserId, type: "CASE_OPENED", message: "Case opened" } },
        },
        include: CASE_INCLUDE,
      });
      return created;
    });

    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: "case.created",
      entityType: "DisputeCase",
      entityId: item.id,
      summary: `Opened ${item.caseNumber} with ${input.discrepancyIds.length} discrepancy item(s)`,
    });

    return toCase(item);
  }

  async transition(
    organizationId: string,
    actorUserId: string,
    id: string,
    input: CaseTransitionInput,
  ): Promise<CaseDto> {
    const current = await this.prisma.disputeCase.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!current) throw AppError.notFound("Case not found");
    if (!canTransition(current.status, input.status)) {
      throw AppError.badRequest(
        "INVALID_TRANSITION",
        `Cannot move a case from ${current.status} to ${input.status}.`,
      );
    }

    const item = await this.prisma.disputeCase.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.status === "CLOSED" ? { closedAt: new Date() } : {}),
        events: {
          create: {
            actorUserId,
            type: input.status === "CLOSED" ? "CASE_CLOSED" : "STATUS_CHANGED",
            message: `${current.status} → ${input.status}${input.reason ? ` — ${input.reason}` : ""}`,
          },
        },
      },
      include: CASE_INCLUDE,
    });

    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: "case.status_changed",
      entityType: "DisputeCase",
      entityId: id,
      summary: `${current.status} → ${input.status}`,
    });

    return toCase(item);
  }

  async assign(
    organizationId: string,
    actorUserId: string,
    id: string,
    input: CaseAssignInput,
  ): Promise<CaseDto> {
    const current = await this.prisma.disputeCase.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });
    if (!current) throw AppError.notFound("Case not found");
    await this.assertMember(organizationId, input.assigneeUserId);

    const item = await this.prisma.disputeCase.update({
      where: { id },
      data: {
        assigneeUserId: input.assigneeUserId,
        events: { create: { actorUserId, type: "CASE_ASSIGNED", message: "Case reassigned" } },
      },
      include: CASE_INCLUDE,
    });
    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: "case.assigned",
      entityType: "DisputeCase",
      entityId: id,
      summary: "Assignee changed",
    });
    return toCase(item);
  }

  async addMessage(
    organizationId: string,
    actorUserId: string,
    id: string,
    input: CaseMessageInput,
  ): Promise<CaseDto> {
    const current = await this.prisma.disputeCase.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!current) throw AppError.notFound("Case not found");
    if (current.status === "CLOSED" || current.status === "CANCELLED") {
      throw AppError.badRequest("CASE_CLOSED", "This case is closed; it cannot receive new messages.");
    }

    const item = await this.prisma.disputeCase.update({
      where: { id },
      data: {
        messages: { create: { authorUserId: actorUserId, visibility: input.visibility, body: input.body } },
        events: {
          create: {
            actorUserId,
            type: "MESSAGE_ADDED",
            message: input.visibility === "SUPPLIER_VISIBLE" ? "Supplier-visible message added" : "Internal note added",
          },
        },
      },
      include: CASE_INCLUDE,
    });
    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: "case.message_added",
      entityType: "DisputeCase",
      entityId: id,
      summary: input.visibility === "SUPPLIER_VISIBLE" ? "Supplier-visible message" : "Internal note",
    });
    return toCase(item);
  }

  async proposeResolution(
    organizationId: string,
    actorUserId: string,
    id: string,
    input: ProposeResolutionInput,
  ): Promise<CaseDto> {
    const current = await this.prisma.disputeCase.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!current) throw AppError.notFound("Case not found");
    if (current.status !== "UNDER_REVIEW" && current.status !== "SUPPLIER_RESPONDED") {
      throw AppError.badRequest(
        "RESOLUTION_NOT_ALLOWED",
        "A resolution can only be proposed while a case is under review or after a supplier response.",
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
          proposedByUserId: actorUserId,
        },
      });
      return tx.disputeCase.update({
        where: { id },
        data: {
          status: "RESOLUTION_PROPOSED",
          events: {
            create: { actorUserId, type: "RESOLUTION_PROPOSED", message: `Resolution proposed: ${input.type}` },
          },
        },
        include: CASE_INCLUDE,
      });
    });
    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: "case.resolution_proposed",
      entityType: "DisputeCase",
      entityId: id,
      summary: `Proposed ${input.type}`,
    });
    return toCase(item);
  }

  async approveResolution(
    organizationId: string,
    actorUserId: string,
    id: string,
    resolutionId: string,
  ): Promise<CaseDto> {
    return this.decideResolution(organizationId, actorUserId, id, resolutionId, "approve");
  }

  async verifyResolution(
    organizationId: string,
    actorUserId: string,
    id: string,
    resolutionId: string,
  ): Promise<CaseDto> {
    return this.decideResolution(organizationId, actorUserId, id, resolutionId, "verify");
  }

  private async decideResolution(
    organizationId: string,
    actorUserId: string,
    id: string,
    resolutionId: string,
    action: "approve" | "verify",
  ): Promise<CaseDto> {
    const current = await this.prisma.disputeCase.findFirst({
      where: { id, organizationId },
      select: { id: true, status: true },
    });
    if (!current) throw AppError.notFound("Case not found");

    const resolution = await this.prisma.resolution.findFirst({
      where: { id: resolutionId, caseId: id },
      select: { id: true, status: true },
    });
    if (!resolution) throw AppError.notFound("Resolution not found");

    const now = new Date();
    const item = await this.prisma.$transaction(async (tx) => {
      if (action === "approve") {
        if (resolution.status !== "PROPOSED") {
          throw AppError.badRequest("RESOLUTION_NOT_PROPOSED", "Only a proposed resolution can be approved.");
        }
        await tx.resolution.update({
          where: { id: resolutionId },
          data: { status: "APPROVED", approvedByUserId: actorUserId, approvedAt: now },
        });
        return tx.disputeCase.update({
          where: { id },
          data: {
            ...(canTransition(current.status, "RESOLUTION_IN_PROGRESS")
              ? { status: "RESOLUTION_IN_PROGRESS" }
              : {}),
            events: {
              create: { actorUserId, type: "RESOLUTION_APPROVED", message: "Resolution approved" },
            },
          },
          include: CASE_INCLUDE,
        });
      }

      if (resolution.status !== "APPROVED") {
        throw AppError.badRequest("RESOLUTION_NOT_APPROVED", "Only an approved resolution can be verified.");
      }
      await tx.resolution.update({
        where: { id: resolutionId },
        data: { status: "VERIFIED", verifiedByUserId: actorUserId, verifiedAt: now },
      });
      return tx.disputeCase.update({
        where: { id },
        data: {
          ...(canTransition(current.status, "RESOLVED") ? { status: "RESOLVED" } : {}),
          events: {
            create: { actorUserId, type: "RESOLUTION_VERIFIED", message: "Resolution verified" },
          },
        },
        include: CASE_INCLUDE,
      });
    });

    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: action === "approve" ? "case.resolution_approved" : "case.resolution_verified",
      entityType: "DisputeCase",
      entityId: id,
      summary: action === "approve" ? "Resolution approved" : "Resolution verified",
    });

    return toCase(item);
  }

  private async assertMember(organizationId: string, userId: string): Promise<void> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!membership) {
      throw AppError.badRequest("INVALID_ASSIGNEE", "The assignee is not an active member of this organization.");
    }
  }

  private async nextCaseNumber(tx: Tx, organizationId: string): Promise<string> {
    const last = await tx.disputeCase.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { caseNumber: true },
    });
    const lastNumber = last ? Number.parseInt(last.caseNumber.replace(/\D/g, ""), 10) : 1000;
    const next = Number.isFinite(lastNumber) ? lastNumber + 1 : 1001;
    return `CASE-${next}`;
  }
}
