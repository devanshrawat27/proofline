import type { AuditActorType } from "@proofline/shared-types";

/** Structural type satisfied by both PrismaService and a Prisma transaction client. */
interface AuditClient {
  auditEvent: { create(args: { data: Record<string, unknown> }): Promise<unknown> };
}

export interface AuditInput {
  organizationId: string;
  actorUserId?: string | null;
  actorName?: string | null;
  actorType?: AuditActorType;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
}

/**
 * Appends an audit event. Best-effort: callers should not fail the business
 * transaction if audit persistence fails, but the event is written with the
 * same tenant scope as the record it describes.
 */
export async function writeAudit(db: AuditClient, event: AuditInput): Promise<void> {
  await db.auditEvent.create({
    data: {
      organizationId: event.organizationId,
      actorUserId: event.actorUserId ?? null,
      actorName: event.actorName ?? null,
      actorType: event.actorType ?? "USER",
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      summary: event.summary ?? null,
    },
  });
}
