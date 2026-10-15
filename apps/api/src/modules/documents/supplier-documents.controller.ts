import { Controller, Get, Param, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { supplierDocumentListQuerySchema } from "@proofline/shared-types";
import type { SupplierDocumentListQuery } from "@proofline/shared-types";
import { Public } from "../../common/auth/auth.decorators";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { SupplierAuthGuard, SupplierCurrent } from "../supplier/supplier-auth.guard";
import { DocumentsService } from "./documents.service";

function safeFileName(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 180);
}

@Public()
@UseGuards(SupplierAuthGuard)
@Controller("supplier/documents")
export class SupplierDocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(
    @SupplierCurrent() principal: SupplierPrincipal,
    @Query(new ZodValidationPipe(supplierDocumentListQuerySchema)) query: SupplierDocumentListQuery,
  ) {
    return this.documents.listForSupplier(principal, query.entityId);
  }

  @Get(":id/content")
  async content(
    @SupplierCurrent() principal: SupplierPrincipal,
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { document, data } = await this.documents.getContentForSupplier(principal, id);
    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName(document.fileName)}"`);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.send(data);
  }
}
