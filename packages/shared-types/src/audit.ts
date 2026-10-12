import { z } from "zod";

export const AUDIT_ACTOR_TYPES = ["USER", "SUPPLIER", "SYSTEM"] as const;
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];
export const auditActorTypeSchema = z.enum(AUDIT_ACTOR_TYPES);

export const auditListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  action: z.string().trim().max(60).optional(),
  entityType: z.string().trim().max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});
export type AuditListQuery = z.infer<typeof auditListQuerySchema>;

export interface AuditEventDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string | null;
  actorType: AuditActorType;
  summary: string | null;
  createdAt: string;
}
