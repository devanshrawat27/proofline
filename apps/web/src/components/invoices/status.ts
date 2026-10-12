import type { DiscrepancySeverity, DiscrepancyType, InvoiceStatus } from "@proofline/shared-types";

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, "info" | "neutral"> = {
  DRAFT: "neutral",
  REVIEWED: "info",
};

export const SEVERITY_TONE: Record<
  DiscrepancySeverity,
  "critical" | "warning" | "neutral"
> = {
  HIGH: "critical",
  MEDIUM: "warning",
  LOW: "neutral",
};

const TYPE_LABELS: Record<DiscrepancyType, string> = {
  QUANTITY_MISMATCH: "Quantity mismatch",
  OVER_DELIVERY: "Over-delivery",
  UNIT_PRICE_MISMATCH: "Unit price mismatch",
  DAMAGED_GOODS: "Damaged goods",
  UNMATCHED_LINE: "Unmatched line",
};

export function discrepancyTypeLabel(type: DiscrepancyType): string {
  return TYPE_LABELS[type];
}

export function humanize(value: string): string {
  return value.replace(/_/g, " ").toLowerCase();
}
