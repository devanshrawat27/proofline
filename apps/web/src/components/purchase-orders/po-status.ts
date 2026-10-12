import type { PoStatus } from "@proofline/shared-types";

export const PO_STATUS_TONE: Record<
  PoStatus,
  "success" | "info" | "warning" | "critical" | "neutral"
> = {
  DRAFT: "neutral",
  ISSUED: "info",
  PARTIALLY_RECEIVED: "warning",
  FULLY_RECEIVED: "success",
  CLOSED: "neutral",
  CANCELLED: "critical",
};

export function poStatusLabel(status: PoStatus): string {
  return status.replace(/_/g, " ").toLowerCase();
}
