import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import {
  documentLibraryQuerySchema,
  documentListQuerySchema,
  extractionReviewSchema,
  uploadDocumentSchema,
} from "@proofline/shared-types";
import type {
  DocumentLibraryQuery,
  DocumentListQuery,
  ExtractionReviewInput,
  UploadDocumentInput,
} from "@proofline/shared-types";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { DocumentsService } from "./documents.service";
import { ExtractionService } from "./extraction.service";

function safeFileName(name: string): string {
  return name.replace(/[^\w.\- ]+/g, "_").slice(0, 180);
}

@Controller("documents")
export class DocumentsController {
  constructor(
    private readonly documents: DocumentsService,
    private readonly extraction: ExtractionService,
  ) {}

  @RequirePermissions("document:read")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(documentListQuerySchema)) query: DocumentListQuery,
  ) {
    return this.documents.list(user.organizationId, query);
  }

  @RequirePermissions("document:read")
  @Get("library")
  library(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(documentLibraryQuerySchema)) query: DocumentLibraryQuery,
  ) {
    return this.documents.listLibrary(user.organizationId, query);
  }

  @RequirePermissions("document:write")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(uploadDocumentSchema)) input: UploadDocumentInput,
  ) {
    return this.documents.create(user.organizationId, user.userId, input);
  }

  @RequirePermissions("document:read")
  @Get(":id/content")
  async content(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { document, data } = await this.documents.getContent(user.organizationId, id);
    res.setHeader("Content-Type", document.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName(document.fileName)}"`);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.send(data);
  }

  @RequirePermissions("document:write")
  @HttpCode(204)
  @Delete(":id")
  async remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.documents.remove(user.organizationId, user.userId, id);
  }

  @RequirePermissions("document:review")
  @HttpCode(200)
  @Post(":id/extract")
  extract(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.extraction.extract(user.organizationId, user.userId, id);
  }

  @RequirePermissions("document:read")
  @Get(":id/extraction")
  getExtraction(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.extraction.get(user.organizationId, id);
  }

  @RequirePermissions("document:read")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.documents.get(user.organizationId, id);
  }

  @RequirePermissions("document:review")
  @HttpCode(200)
  @Post(":id/review")
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(extractionReviewSchema)) input: ExtractionReviewInput,
  ) {
    return this.extraction.review(user.organizationId, user.userId, id, input);
  }
}
