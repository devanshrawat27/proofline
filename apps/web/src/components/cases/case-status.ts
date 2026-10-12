import type { CasePriority, CaseStatus, MessageVisibility, ResolutionStatus, ResolutionType } from "@proofline/shared-types";

export const CASE_STATUS_TONE: Record<
  CaseStatus,
  "success" | "info" | "warning" | "critical" | "neutral"
> = {
  OPEN: "info",
  UNDER_REVIEW: "info",
  SENT_TO_SUPPLIER: "warning",
  SUPPLIER_RESPONDED: "warning",
  RESOLUTION_PROPOSED: "warning",
  AWAITING_INTERNAL_APPROVAL: "warning",
  RESOLUTION_IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
  CANCELLED: "neutral",
};

export const CASE_PRIORITY_TONE: Record<CasePriority, "critical" | "warning" | "neutral"> = {
  URGENT: "critical",
  HIGH: "warning",
  NORMAL: "neutral",
  LOW: "neutral",
};

export const RESOLUTION_STATUS_TONE: Record<
  ResolutionStatus,
  "success" | "info" | "warning" | "critical" | "neutral"
> = {
  PROPOSED: "warning",
  APPROVED: "info",
  VERIFIED: "success",
  REJECTED: "critical",
};

export function humanize(value: string): string {
  return value.replace(/_/g, " ").toLowerCase();
}

export function statusLabel(status: CaseStatus): string {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function resolutionTypeLabel(type: ResolutionType): string {
  return type
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function visibilityLabel(visibility: MessageVisibility): string {
  return visibility === "SUPPLIER_VISIBLE" ? "Supplier visible" : "Internal";
}
