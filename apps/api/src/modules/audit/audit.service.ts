import { Injectable } from "@nestjs/common";
import type { AuditEventDto, AuditListQuery, Paginated } from "@proofline/shared-types";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string, query: AuditListQuery): Promise<Paginated<AuditEventDto>> {
    const { search, action, entityType, page, pageSize } = query;
    const where = {
      organizationId,
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(search ? { summary: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [total, events] = await this.prisma.$transaction([
      this.prisma.auditEvent.count({ where }),
      this.prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const userIds = [...new Set(events.map((e) => e.actorUserId).filter((id): id is string => Boolean(id)))];
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const nameById = new Map(users.map((u) => [u.id, u.name]));

    const items: AuditEventDto[] = events.map((event) => ({
      id: event.id,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId,
      actorName:
        event.actorName ??
        (event.actorType === "USER" && event.actorUserId ? nameById.get(event.actorUserId) ?? null : null),
      actorType: event.actorType,
      summary: event.summary,
      createdAt: event.createdAt.toISOString(),
    }));

    return { items, total, page, pageSize };
  }
}
