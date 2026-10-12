import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query } from "@nestjs/common";
import {
  createPurchaseOrderSchema,
  purchaseOrderListQuerySchema,
  updatePurchaseOrderSchema,
} from "@proofline/shared-types";
import type {
  CreatePurchaseOrderInput,
  PurchaseOrderListQuery,
  UpdatePurchaseOrderInput,
} from "@proofline/shared-types";
import { CurrentUser, RequirePermissions } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { PurchaseOrdersService } from "./purchase-orders.service";

@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrders: PurchaseOrdersService) {}

  @RequirePermissions("po:read")
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(purchaseOrderListQuerySchema)) query: PurchaseOrderListQuery,
  ) {
    return this.purchaseOrders.list(user.organizationId, query);
  }

  @RequirePermissions("po:read")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.purchaseOrders.get(user.organizationId, id);
  }

  @RequirePermissions("po:write")
  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createPurchaseOrderSchema)) input: CreatePurchaseOrderInput,
  ) {
    return this.purchaseOrders.create(user.organizationId, user.userId, input);
  }

  @RequirePermissions("po:write")
  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePurchaseOrderSchema)) input: UpdatePurchaseOrderInput,
  ) {
    return this.purchaseOrders.update(user.organizationId, id, input);
  }

  @RequirePermissions("po:write")
  @HttpCode(200)
  @Post(":id/issue")
  issue(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.purchaseOrders.issue(user.organizationId, user.userId, id);
  }

  @RequirePermissions("po:write")
  @HttpCode(200)
  @Post(":id/cancel")
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.purchaseOrders.cancel(user.organizationId, user.userId, id);
  }
}
