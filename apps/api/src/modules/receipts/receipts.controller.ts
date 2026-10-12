import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createReceiptSchema,
  receiptListQuerySchema,
  updateReceiptSchema,
} from "@proofline/shared-types";
import type { CreateReceiptInput, ReceiptListQuery, UpdateReceiptInput } from "@proofline/shared-types";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { ReceiptsService } from "./receipts.service";

@Controller("receipts")
export class ReceiptsController {
  constructor(private readonly receipts: ReceiptsService) {}

  @RequirePermissions("receipt:read")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(receiptListQuerySchema)) query: ReceiptListQuery,
  ) {
    return this.receipts.list(user.organizationId, query);
  }

  @RequirePermissions("receipt:read")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.receipts.get(user.organizationId, id);
  }

  @RequirePermissions("receipt:write")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createReceiptSchema)) input: CreateReceiptInput,
  ) {
    return this.receipts.create(user.organizationId, user.userId, input);
  }

  @RequirePermissions("receipt:write")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateReceiptSchema)) input: UpdateReceiptInput,
  ) {
    return this.receipts.update(user.organizationId, id, input);
  }

  @RequirePermissions("receipt:write")
  @HttpCode(200)
  @Post(":id/submit")
  submit(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.receipts.submit(user.organizationId, id);
  }
}
