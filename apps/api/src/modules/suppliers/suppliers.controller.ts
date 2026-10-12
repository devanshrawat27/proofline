import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createSupplierSchema,
  supplierListQuerySchema,
  updateSupplierSchema,
} from "@proofline/shared-types";
import type {
  CreateSupplierInput,
  SupplierListQuery,
  UpdateSupplierInput,
} from "@proofline/shared-types";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { SuppliersService } from "./suppliers.service";

@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @RequirePermissions("supplier:read")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(supplierListQuerySchema)) query: SupplierListQuery,
  ) {
    return this.suppliers.list(user.organizationId, query);
  }

  @RequirePermissions("supplier:read")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.suppliers.get(user.organizationId, id);
  }

  @RequirePermissions("supplier:write")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createSupplierSchema)) input: CreateSupplierInput,
  ) {
    return this.suppliers.create(user.organizationId, input);
  }

  @RequirePermissions("supplier:write")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateSupplierSchema)) input: UpdateSupplierInput,
  ) {
    return this.suppliers.update(user.organizationId, id, input);
  }
}
