import { Injectable } from "@nestjs/common";
import type {
  NotificationDto,
  NotificationListQuery,
  NotificationType,
  Paginated,
} from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { env } from "../../common/config/env";
import { MailQueueService } from "../mail/mail-queue.service";
import { renderNotificationEmail } from "../mail/templates";

interface CreateNotification {
  organizationId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  entityType: string;
  entityId?: string | null;
}

function toDto(item: {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: string;
  entityId: string | null;
  readAt: Date | null;
  createdAt: Date;
}): NotificationDto {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    entityType: item.entityType,
    entityId: item.entityId,
    readAt: item.readAt ? item.readAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
  };
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailQueueService,
  ) {}

  private async list(
    baseWhere: Record<string, unknown>,
    query: NotificationListQuery,
  ): Promise<Paginated<NotificationDto>> {
    const { unreadOnly, page, pageSize } = query;
    const where = { ...baseWhere, ...(unreadOnly ? { readAt: null } : {}) };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items: items.map(toDto), total, page, pageSize };
  }

  listForUser(organizationId: string, userId: string, query: NotificationListQuery) {
    return this.list({ organizationId, recipientUserId: userId }, query);
  }

  async unreadCountForUser(organizationId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { organizationId, recipientUserId: userId, readAt: null },
    });
  }

  async markReadForUser(organizationId: string, userId: string, id: string): Promise<void> {
    const found = await this.prisma.notification.findFirst({
      where: { id, organizationId, recipientUserId: userId },
      select: { id: true },
    });
    if (!found) throw AppError.notFound("Notification not found");
    await this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllReadForUser(organizationId: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { organizationId, recipientUserId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  listForSupplier(organizationId: string, supplierUserId: string, query: NotificationListQuery) {
    return this.list({ organizationId, recipientSupplierUserId: supplierUserId }, query);
  }

  async unreadCountForSupplier(organizationId: string, supplierUserId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { organizationId, recipientSupplierUserId: supplierUserId, readAt: null },
    });
  }

  async markReadForSupplier(organizationId: string, supplierUserId: string, id: string): Promise<void> {
    const found = await this.prisma.notification.findFirst({
      where: { id, organizationId, recipientSupplierUserId: supplierUserId },
      select: { id: true },
    });
    if (!found) throw AppError.notFound("Notification not found");
    await this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllReadForSupplier(organizationId: string, supplierUserId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { organizationId, recipientSupplierUserId: supplierUserId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /** Best-effort; never fails the caller's business transaction. */
  async createForUser(recipientUserId: string | null, input: CreateNotification): Promise<void> {
    if (!recipientUserId) return;
    await this.prisma.notification.create({
      data: {
        organizationId: input.organizationId,
        recipientUserId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: recipientUserId },
      select: { email: true },
    });
    if (user) {
      const email = renderNotificationEmail({
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        url: `${env.WEB_PUBLIC_URL}${this.link(input, "internal")}`,
      });
      await this.mail.enqueue({ to: user.email, subject: email.subject, text: email.text, html: email.html });
    }
  }

  async createForSupplierUsers(supplierId: string, input: CreateNotification): Promise<void> {
    const users = await this.prisma.supplierUser.findMany({
      where: { supplierId, status: "ACTIVE" },
      select: { id: true, email: true },
    });
    if (users.length === 0) return;
    await this.prisma.notification.createMany({
      data: users.map((user) => ({
        organizationId: input.organizationId,
        recipientSupplierUserId: user.id,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
      })),
    });
    for (const user of users) {
      const email = renderNotificationEmail({
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        url: `${env.WEB_PUBLIC_URL}${this.link(input, "supplier")}`,
      });
      await this.mail.enqueue({ to: user.email, subject: email.subject, text: email.text, html: email.html });
    }
  }

  private link(input: CreateNotification, audience: "internal" | "supplier"): string {
    const id = input.entityId ?? "";
    if (input.entityType === "DisputeCase") {
      return audience === "supplier" ? `/supplier/cases/${id}` : `/cases/${id}`;
    }
    return audience === "supplier" ? "/supplier" : "/overview";
  }
}
