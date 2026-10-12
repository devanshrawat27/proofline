import { z } from "zod";
import type { DiscrepancyDto } from "./invoices";

export const CASE_STATUSES = [
  "OPEN",
  "UNDER_REVIEW",
  "SENT_TO_SUPPLIER",
  "SUPPLIER_RESPONDED",
  "RESOLUTION_PROPOSED",
  "AWAITING_INTERNAL_APPROVAL",
  "RESOLUTION_IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];
export const caseStatusSchema = z.enum(CASE_STATUSES);

export const CASE_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type CasePriority = (typeof CASE_PRIORITIES)[number];
export const casePrioritySchema = z.enum(CASE_PRIORITIES);

export const MESSAGE_VISIBILITIES = ["INTERNAL", "SUPPLIER_VISIBLE"] as const;
export type MessageVisibility = (typeof MESSAGE_VISIBILITIES)[number];
export const messageVisibilitySchema = z.enum(MESSAGE_VISIBILITIES);

export const RESOLUTION_TYPES = [
  "REPLACEMENT",
  "CREDIT_NOTE",
  "PARTIAL_CREDIT",
  "REFUND",
  "RETURN",
  "NO_ADJUSTMENT",
  "OTHER",
] as const;
export type ResolutionType = (typeof RESOLUTION_TYPES)[number];
export const resolutionTypeSchema = z.enum(RESOLUTION_TYPES);

export const RESOLUTION_STATUSES = ["PROPOSED", "APPROVED", "VERIFIED", "REJECTED"] as const;
export type ResolutionStatus = (typeof RESOLUTION_STATUSES)[number];
export const resolutionStatusSchema = z.enum(RESOLUTION_STATUSES);

/** Server-enforced state machine. The UI reads this to render only valid actions. */
export const CASE_TRANSITIONS: Record<CaseStatus, readonly CaseStatus[]> = {
  OPEN: ["UNDER_REVIEW", "SENT_TO_SUPPLIER", "CANCELLED"],
  UNDER_REVIEW: ["SENT_TO_SUPPLIER", "RESOLUTION_PROPOSED", "CANCELLED"],
  SENT_TO_SUPPLIER: ["SUPPLIER_RESPONDED", "CANCELLED"],
  SUPPLIER_RESPONDED: ["UNDER_REVIEW", "RESOLUTION_PROPOSED"],
  RESOLUTION_PROPOSED: ["AWAITING_INTERNAL_APPROVAL", "RESOLUTION_IN_PROGRESS", "CANCELLED"],
  AWAITING_INTERNAL_APPROVAL: ["RESOLUTION_IN_PROGRESS", "RESOLVED"],
  RESOLUTION_IN_PROGRESS: ["RESOLVED"],
  RESOLVED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return CASE_TRANSITIONS[from].includes(to);
}

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

export const createCaseSchema = z.object({
  discrepancyIds: z.array(z.string().uuid()).min(1, "Select at least one discrepancy").max(50),
  summary: z.string().trim().min(1, "Summary is required").max(500),
  priority: casePrioritySchema.default("NORMAL"),
  assigneeUserId: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().uuid().optional(),
  ),
  dueDate: optionalDate,
});
export type CreateCaseInput = z.infer<typeof createCaseSchema>;

export const caseTransitionSchema = z.object({
  status: caseStatusSchema,
  reason: optionalText(500),
});
export type CaseTransitionInput = z.infer<typeof caseTransitionSchema>;

export const caseAssignSchema = z.object({ assigneeUserId: z.string().uuid() });
export type CaseAssignInput = z.infer<typeof caseAssignSchema>;

export const caseMessageSchema = z.object({
  visibility: messageVisibilitySchema.default("INTERNAL"),
  body: z.string().trim().min(1, "Message cannot be empty").max(5000),
});
export type CaseMessageInput = z.infer<typeof caseMessageSchema>;

export const proposeResolutionSchema = z.object({
  type: resolutionTypeSchema,
  proposedAmountMinor: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  ),
  reference: optionalText(120),
  notes: optionalText(1000),
});
export type ProposeResolutionInput = z.infer<typeof proposeResolutionSchema>;

export const caseListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: caseStatusSchema.optional(),
  priority: casePrioritySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type CaseListQuery = z.infer<typeof caseListQuerySchema>;

export interface CaseItemDto {
  id: string;
  discrepancyId: string;
  discrepancy: DiscrepancyDto | null;
}

export interface CaseMessageDto {
  id: string;
  visibility: MessageVisibility;
  body: string;
  author: { id: string; name: string } | null;
  createdAt: string;
}

export interface CaseEventDto {
  id: string;
  type: string;
  message: string | null;
  actorName: string | null;
  createdAt: string;
}

export interface ResolutionDto {
  id: string;
  type: ResolutionType;
  status: ResolutionStatus;
  proposedAmountMinor: number | null;
  reference: string | null;
  notes: string | null;
  proposedByName: string | null;
  approvedByName: string | null;
  verifiedByName: string | null;
  proposedAt: string;
  approvedAt: string | null;
  verifiedAt: string | null;
}

export interface CaseDto {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  priority: CasePriority;
  summary: string;
  dueDate: string | null;
  openedAt: string | null;
  closedAt: string | null;
  supplier: { id: string; name: string; code: string };
  assignee: { id: string; name: string } | null;
  items: CaseItemDto[];
  messages: CaseMessageDto[];
  events: CaseEventDto[];
  resolutions: ResolutionDto[];
  createdAt: string;
  updatedAt: string;
}

export interface CaseSummaryDto {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  priority: CasePriority;
  summary: string;
  dueDate: string | null;
  supplier: { id: string; name: string; code: string };
  assignee: { id: string; name: string } | null;
  itemCount: number;
  createdAt: string;
}
