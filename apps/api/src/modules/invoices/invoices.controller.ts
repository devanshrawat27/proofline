import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import { createInvoiceSchema, invoiceListQuerySchema, updateInvoiceSchema } from "@proofline/shared-types";
import type { CreateInvoiceInput, InvoiceListQuery, UpdateInvoiceInput } from "@proofline/shared-types";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { InvoicesService } from "./invoices.service";

@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @RequirePermissions("invoice:read")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(invoiceListQuerySchema)) query: InvoiceListQuery,
  ) {
    return this.invoices.list(user.organizationId, query);
  }

  @RequirePermissions("invoice:read")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.invoices.get(user.organizationId, id);
  }

  @RequirePermissions("invoice:write")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createInvoiceSchema)) input: CreateInvoiceInput,
  ) {
    return this.invoices.create(user.organizationId, input);
  }

  @RequirePermissions("invoice:write")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateInvoiceSchema)) input: UpdateInvoiceInput,
  ) {
    return this.invoices.update(user.organizationId, id, input);
  }

  @RequirePermissions("invoice:write")
  @HttpCode(200)
  @Post(":id/review")
  review(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.invoices.review(user.organizationId, user.userId, id);
  }
}
