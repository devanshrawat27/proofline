import { z } from "zod";
import type { PoStatus } from "./purchase-orders";

export const RECEIPT_STATUSES = ["DRAFT", "SUBMITTED"] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];
export const receiptStatusSchema = z.enum(RECEIPT_STATUSES);

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

export const receiptLineSchema = z
  .object({
    purchaseOrderLineId: z.string().uuid("Invalid purchase order line"),
    receivedQuantity: z.coerce
      .number()
      .min(0, "Received quantity cannot be negative")
      .max(1_000_000, "Received quantity is too large"),
    damagedQuantity: z.coerce
      .number()
      .min(0, "Damaged quantity cannot be negative")
      .max(1_000_000, "Damaged quantity is too large")
      .default(0),
  })
  .refine((line) => line.damagedQuantity <= line.receivedQuantity, {
    message: "Damaged quantity cannot exceed received quantity",
    path: ["damagedQuantity"],
  });
export type ReceiptLineInput = z.infer<typeof receiptLineSchema>;

export const createReceiptSchema = z.object({
  purchaseOrderId: z.string().uuid("Choose a purchase order"),
  reference: optionalText(80),
  notes: optionalText(1000),
  lines: z.array(receiptLineSchema).min(1, "Record at least one line").max(200),
});
export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;

export const updateReceiptSchema = z
  .object({
    reference: optionalText(80),
    notes: optionalText(1000),
    lines: z.array(receiptLineSchema).min(1).max(200),
  })
  .partial();
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;

export const receiptListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: receiptStatusSchema.optional(),
  purchaseOrderId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ReceiptListQuery = z.infer<typeof receiptListQuerySchema>;

export interface ReceiptLineDto {
  id: string;
  purchaseOrderLineId: string;
  description: string;
  unit: string;
  orderedQuantity: string;
  receivedQuantity: string;
  damagedQuantity: string;
  acceptedQuantity: string;
}

export interface ReceiptDto {
  id: string;
  status: ReceiptStatus;
  reference: string | null;
  notes: string | null;
  receivedAt: string | null;
  submittedAt: string | null;
  purchaseOrder: {
    id: string;
    poNumber: string;
    status: PoStatus;
    supplier: { id: string; name: string; code: string };
  };
  lines: ReceiptLineDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptSummaryDto {
  id: string;
  status: ReceiptStatus;
  reference: string | null;
  receivedAt: string | null;
  purchaseOrder: { id: string; poNumber: string };
  lineCount: number;
  createdAt: string;
}
