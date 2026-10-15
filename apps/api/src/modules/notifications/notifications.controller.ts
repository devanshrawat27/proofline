import { Controller, Get, HttpCode, Param, Post, Query } from "@nestjs/common";
import { notificationListQuerySchema } from "@proofline/shared-types";
import type { NotificationListQuery } from "@proofline/shared-types";
import { CurrentUser } from "../../common/auth/auth.decorators";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { ZodValidationPipe } from "../../common/http/zod-validation.pipe";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query(new ZodValidationPipe(notificationListQuerySchema)) query: NotificationListQuery,
  ) {
    return this.notifications.listForUser(user.organizationId, user.userId, query);
  }

  @Get("unread-count")
  async unreadCount(@CurrentUser() user: AuthenticatedUser) {
    return { count: await this.notifications.unreadCountForUser(user.organizationId, user.userId) };
  }

  @HttpCode(204)
  @Post(":id/read")
  async read(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.notifications.markReadForUser(user.organizationId, user.userId, id);
  }

  @HttpCode(204)
  @Post("read-all")
  async readAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.notifications.markAllReadForUser(user.organizationId, user.userId);
  }
}
