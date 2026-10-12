import { z } from "zod";
import { currencyCodeSchema } from "./auth";

export const PO_STATUSES = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_RECEIVED",
  "FULLY_RECEIVED",
  "CANCELLED",
  "CLOSED",
] as const;
export type PoStatus = (typeof PO_STATUSES)[number];
export const poStatusSchema = z.enum(PO_STATUSES);

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

export const poNumberSchema = z
  .string()
  .trim()
  .min(1, "PO number is required")
  .max(40, "PO number must be at most 40 characters")
  .transform((value) => value.toUpperCase());

export const purchaseOrderLineSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(200),
  sku: optionalText(60),
  orderedQuantity: z.coerce
    .number()
    .positive("Quantity must be greater than zero")
    .max(1_000_000, "Quantity is too large"),
  unit: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).max(20).default("unit"),
  ),
  unitPriceMinor: z.coerce
    .number()
    .int("Unit price must be a whole number of minor units")
    .min(0, "Unit price cannot be negative")
    .max(1_000_000_000, "Unit price is too large"),
});
export type PurchaseOrderLineInput = z.infer<typeof purchaseOrderLineSchema>;

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid("Choose a supplier"),
  poNumber: poNumberSchema,
  expectedDeliveryDate: optionalDate,
  currency: currencyCodeSchema.default("INR"),
  notes: optionalText(1000),
  lines: z.array(purchaseOrderLineSchema).min(1, "Add at least one line item").max(200),
});
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;

export const updatePurchaseOrderSchema = z
  .object({
    poNumber: poNumberSchema,
    expectedDeliveryDate: optionalDate,
    notes: optionalText(1000),
    lines: z.array(purchaseOrderLineSchema).min(1).max(200),
  })
  .partial();
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;

export const purchaseOrderListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: poStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type PurchaseOrderListQuery = z.infer<typeof purchaseOrderListQuerySchema>;

export interface PurchaseOrderLineDto {
  id: string;
  lineNumber: number;
  description: string;
  sku: string | null;
  orderedQuantity: string;
  unit: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface PurchaseOrderDto {
  id: string;
  poNumber: string;
  status: PoStatus;
  currency: string;
  issueDate: string | null;
  expectedDeliveryDate: string | null;
  notes: string | null;
  totalMinor: number;
  supplier: { id: string; name: string; code: string };
  lines: PurchaseOrderLineDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderSummaryDto {
  id: string;
  poNumber: string;
  status: PoStatus;
  currency: string;
  expectedDeliveryDate: string | null;
  totalMinor: number;
  lineCount: number;
  supplier: { id: string; name: string; code: string };
  createdAt: string;
}
