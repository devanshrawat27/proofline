import { Controller, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { notificationListQuerySchema } from "@proofline/shared-types";
import type { NotificationListQuery } from "@proofline/shared-types";
import { Public } from "../../common/auth/auth.decorators";
import type { SupplierPrincipal } from "../../common/auth/supplier-auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { NotificationsService } from "../notifications/notifications.service";
import { SupplierAuthGuard, SupplierCurrent } from "./supplier-auth.guard";

@Public()
@UseGuards(SupplierAuthGuard)
@Controller("supplier/notifications")
export class SupplierNotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @SupplierCurrent() principal: SupplierPrincipal,
    @Query(new ZodValidationPipe(notificationListQuerySchema)) query: NotificationListQuery,
  ) {
    return this.notifications.listForSupplier(principal.organizationId, principal.supplierUserId, query);
  }

  @Get("unread-count")
  async unreadCount(@SupplierCurrent() principal: SupplierPrincipal) {
    return { count: await this.notifications.unreadCountForSupplier(principal.organizationId, principal.supplierUserId) };
  }

  @HttpCode(204)
  @Post(":id/read")
  async read(@SupplierCurrent() principal: SupplierPrincipal, @Param("id") id: string): Promise<void> {
    await this.notifications.markReadForSupplier(principal.organizationId, principal.supplierUserId, id);
  }

  @HttpCode(204)
  @Post("read-all")
  async readAll(@SupplierCurrent() principal: SupplierPrincipal): Promise<void> {
    await this.notifications.markAllReadForSupplier(principal.organizationId, principal.supplierUserId);
  }
}
