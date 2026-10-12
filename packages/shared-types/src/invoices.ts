import { z } from "zod";
import { currencyCodeSchema } from "./auth";

export const INVOICE_STATUSES = ["DRAFT", "REVIEWED"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export const invoiceStatusSchema = z.enum(INVOICE_STATUSES);

export const DISCREPANCY_TYPES = [
  "QUANTITY_MISMATCH",
  "OVER_DELIVERY",
  "UNIT_PRICE_MISMATCH",
  "DAMAGED_GOODS",
  "UNMATCHED_LINE",
] as const;
export type DiscrepancyType = (typeof DISCREPANCY_TYPES)[number];
export const discrepancyTypeSchema = z.enum(DISCREPANCY_TYPES);

export const DISCREPANCY_SEVERITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type DiscrepancySeverity = (typeof DISCREPANCY_SEVERITIES)[number];
export const discrepancySeveritySchema = z.enum(DISCREPANCY_SEVERITIES);

export const DISCREPANCY_STATUSES = ["OPEN", "DISMISSED", "RESOLVED"] as const;
export type DiscrepancyStatus = (typeof DISCREPANCY_STATUSES)[number];
export const discrepancyStatusSchema = z.enum(DISCREPANCY_STATUSES);

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const optionalDate = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.date().optional(),
);

const optionalUuid = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.string().uuid().optional(),
);

export const invoiceNumberSchema = z
  .string()
  .trim()
  .min(1, "Invoice number is required")
  .max(40, "Invoice number must be at most 40 characters")
  .transform((value) => value.toUpperCase());

export const invoiceLineSchema = z.object({
  poLineId: optionalUuid,
  description: z.string().trim().min(1, "Description is required").max(200),
  quantity: z.coerce.number().positive("Quantity must be greater than zero").max(1_000_000),
  unit: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().min(1).max(20).default("unit"),
  ),
  unitPriceMinor: z.coerce.number().int().min(0).max(1_000_000_000),
});
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;

export const createInvoiceSchema = z.object({
  supplierId: z.string().uuid("Choose a supplier"),
  poId: optionalUuid,
  invoiceNumber: invoiceNumberSchema,
  invoiceDate: optionalDate,
  currency: currencyCodeSchema.default("INR"),
  notes: optionalText(1000),
  lines: z.array(invoiceLineSchema).min(1, "Add at least one line").max(200),
});
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const updateInvoiceSchema = z
  .object({
    poId: optionalUuid,
    invoiceNumber: invoiceNumberSchema,
    invoiceDate: optionalDate,
    notes: optionalText(1000),
    lines: z.array(invoiceLineSchema).min(1).max(200),
  })
  .partial();
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export const invoiceListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: invoiceStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

export const discrepancyListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  type: discrepancyTypeSchema.optional(),
  severity: discrepancySeveritySchema.optional(),
  status: discrepancyStatusSchema.optional(),
  invoiceId: z.string().uuid().optional(),
  purchaseOrderId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type DiscrepancyListQuery = z.infer<typeof discrepancyListQuerySchema>;

export interface InvoiceLineDto {
  id: string;
  poLineId: string | null;
  description: string;
  quantity: string;
  unit: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
}

export interface InvoiceDto {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  invoiceDate: string | null;
  totalMinor: number;
  notes: string | null;
  supplier: { id: string; name: string; code: string };
  purchaseOrder: { id: string; poNumber: string } | null;
  lines: InvoiceLineDto[];
  discrepancyCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  invoiceDate: string | null;
  totalMinor: number;
  supplier: { id: string; name: string; code: string };
  purchaseOrder: { id: string; poNumber: string } | null;
  lineCount: number;
  createdAt: string;
}

export interface DiscrepancyDto {
  id: string;
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  status: DiscrepancyStatus;
  explanation: string;
  expectedValue: string | null;
  actualValue: string | null;
  purchaseOrder: { id: string; poNumber: string };
  invoice: { id: string; invoiceNumber: string } | null;
  createdAt: string;
}
