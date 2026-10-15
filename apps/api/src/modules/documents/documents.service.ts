import { Injectable } from "@nestjs/common";
import type { Document } from "@prisma/client";
import type {
  DocumentDto,
  DocumentEntityType,
  DocumentListQuery,
  UploadDocumentInput,
} from "@proofline/shared-types";
import { MAX_DOCUMENT_BYTES } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import { writeAudit } from "../../common/audit/audit";
import { StorageService } from "./storage.service";

type DocumentRow = Document;

function toDto(document: DocumentRow, uploadedByName: string | null): DocumentDto {
  return {
    id: document.id,
    entityType: document.entityType,
    entityId: document.entityId,
    kind: document.kind,
    visibility: document.visibility,
    fileName: document.fileName,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    uploadedByName,
    extractionStatus: document.extractionStatus,
    createdAt: document.createdAt.toISOString(),
  };
}

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async assertEntity(organizationId: string, entityType: DocumentEntityType, entityId: string) {
    const scope = { id: entityId, organizationId };
    const found =
      entityType === "PURCHASE_ORDER"
        ? await this.prisma.purchaseOrder.findFirst({ where: scope, select: { id: true } })
        : entityType === "RECEIPT"
          ? await this.prisma.receipt.findFirst({ where: scope, select: { id: true } })
          : entityType === "INVOICE"
            ? await this.prisma.invoice.findFirst({ where: scope, select: { id: true } })
            : await this.prisma.disputeCase.findFirst({ where: scope, select: { id: true } });
    if (!found) throw AppError.badRequest("INVALID_ENTITY", "The linked record was not found.");
  }

  private async uploadedByName(document: DocumentRow): Promise<string | null> {
    if (!document.uploadedByUserId) return null;
    const user = await this.prisma.user.findUnique({
      where: { id: document.uploadedByUserId },
      select: { name: true },
    });
    return user?.name ?? null;
  }

  async list(organizationId: string, query: DocumentListQuery): Promise<DocumentDto[]> {
    const documents = await this.prisma.document.findMany({
      where: { organizationId, entityType: query.entityType, entityId: query.entityId },
      orderBy: { createdAt: "desc" },
    });
    const userIds = [...new Set(documents.map((d) => d.uploadedByUserId).filter((id): id is string => Boolean(id)))];
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(users.map((u) => [u.id, u.name]));
    return documents.map((d) => toDto(d, d.uploadedByUserId ? nameById.get(d.uploadedByUserId) ?? null : null));
  }

  async get(organizationId: string, id: string): Promise<DocumentDto> {
    const document = await this.prisma.document.findFirst({ where: { id, organizationId } });
    if (!document) throw AppError.notFound("Document not found");
    return toDto(document, await this.uploadedByName(document));
  }

  async create(organizationId: string, actorUserId: string, input: UploadDocumentInput): Promise<DocumentDto> {
    await this.assertEntity(organizationId, input.entityType, input.entityId);

    let data: Buffer;
    try {
      data = Buffer.from(input.dataBase64, "base64");
    } catch {
      throw AppError.badRequest("INVALID_FILE", "The file data could not be read.");
    }
    if (data.length === 0) throw AppError.badRequest("EMPTY_FILE", "The file is empty.");
    if (data.length > MAX_DOCUMENT_BYTES) {
      throw AppError.badRequest("FILE_TOO_LARGE", "The file exceeds the 10 MB limit.");
    }

    const stored = await this.storage.save(organizationId, data, input.mimeType);
    const document = await this.prisma.document.create({
      data: {
        organizationId,
        entityType: input.entityType,
        entityId: input.entityId,
        kind: input.kind,
        visibility: input.visibility,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: stored.sizeBytes,
        storageKey: stored.storageKey,
        checksum: stored.checksum,
        uploadedByUserId: actorUserId,
      },
    });

    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: "document.uploaded",
      entityType: input.entityType,
      entityId: input.entityId,
      summary: `${input.fileName} (${input.kind})`,
    });

    return toDto(document, await this.uploadedByName(document));
  }

  async getContent(organizationId: string, id: string): Promise<{ document: DocumentRow; data: Buffer }> {
    const document = await this.prisma.document.findFirst({ where: { id, organizationId } });
    if (!document) throw AppError.notFound("Document not found");
    const data = await this.storage.read(document.storageKey);
    return { document, data };
  }

  async remove(organizationId: string, actorUserId: string, id: string): Promise<void> {
    const document = await this.prisma.document.findFirst({ where: { id, organizationId } });
    if (!document) throw AppError.notFound("Document not found");
    await this.prisma.document.delete({ where: { id } });
    await this.storage.remove(document.storageKey);
    await writeAudit(this.prisma, {
      organizationId,
      actorUserId,
      action: "document.removed",
      entityType: document.entityType,
      entityId: document.entityId,
      summary: document.fileName,
    });
  }

  // ---- Supplier portal (only supplier-visible documents on their own cases) ----

  private async assertSupplierCase(principal: SupplierPrincipal, entityId: string) {
    if (!entityId) throw AppError.badRequest("INVALID_ENTITY", "A case is required.");
    const found = await this.prisma.disputeCase.findFirst({
      where: { id: entityId, organizationId: principal.organizationId, supplierId: principal.supplierId },
      select: { id: true },
    });
    if (!found) throw AppError.notFound("Case not found");
  }

  async listForSupplier(principal: SupplierPrincipal, entityId: string): Promise<DocumentDto[]> {
    await this.assertSupplierCase(principal, entityId);
    const documents = await this.prisma.document.findMany({
      where: {
        organizationId: principal.organizationId,
        entityType: "CASE",
        entityId,
        visibility: "SUPPLIER_VISIBLE",
      },
      orderBy: { createdAt: "desc" },
    });
    return documents.map((d) => toDto(d, d.uploadedByUserId ? null : "Supplier"));
  }

  async getContentForSupplier(
    principal: SupplierPrincipal,
    id: string,
  ): Promise<{ document: DocumentRow; data: Buffer }> {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        organizationId: principal.organizationId,
        entityType: "CASE",
        visibility: "SUPPLIER_VISIBLE",
      },
    });
    if (!document) throw AppError.notFound("Document not found");
    await this.assertSupplierCase(principal, document.entityId);
    const data = await this.storage.read(document.storageKey);
    return { document, data };
  }
}
