import { z } from "zod";
import { emailSchema } from "./auth";

export const SUPPLIER_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];
export const supplierStatusSchema = z.enum(SUPPLIER_STATUSES);

/** Treat empty form strings as "not provided" so optional fields stay clean. */
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  emailSchema.optional(),
);

export const supplierCodeSchema = z
  .string()
  .trim()
  .min(1, "Supplier code is required")
  .max(40, "Supplier code must be at most 40 characters")
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Use letters, numbers, dots, dashes or underscores")
  .transform((value) => value.toUpperCase());

const countrySchema = z
  .string()
  .trim()
  .length(2, "Use a 2-letter country code")
  .transform((value) => value.toUpperCase());

const supplierFields = {
  code: supplierCodeSchema,
  name: z.string().trim().min(1, "Supplier name is required").max(160),
  contactName: optionalText(120),
  email: optionalEmail,
  phone: optionalText(32),
  gstin: optionalText(20),
  addressLine1: optionalText(160),
  city: optionalText(80),
  state: optionalText(80),
  postalCode: optionalText(16),
  country: countrySchema,
  notes: optionalText(1000),
};

export const createSupplierSchema = z.object({
  ...supplierFields,
  country: countrySchema.default("IN"),
  status: supplierStatusSchema.default("ACTIVE"),
});
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = z
  .object({
    ...supplierFields,
    status: supplierStatusSchema,
  })
  .partial();
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export const supplierListQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: supplierStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SupplierListQuery = z.infer<typeof supplierListQuerySchema>;

export interface SupplierDto {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  gstin: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string;
  notes: string | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}
