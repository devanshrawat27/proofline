import { z } from "zod";

export const NOTIFICATION_TYPES = [
  "CASE_ASSIGNED",
  "CASE_SENT_TO_SUPPLIER",
  "SUPPLIER_RESPONDED",
  "RESOLUTION_PROPOSED",
  "RESOLUTION_APPROVED",
  "CASE_CLOSED",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);

export const notificationListQuerySchema = z.object({
  unreadOnly: z
    .preprocess((value) => (value === "true" ? true : value === "false" ? false : value), z.boolean().optional())
    .default(false),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

export interface NotificationDto {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  entityType: string;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}
