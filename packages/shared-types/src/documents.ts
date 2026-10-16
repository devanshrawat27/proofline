import { z } from "zod";

export const DOCUMENT_ENTITY_TYPES = ["PURCHASE_ORDER", "RECEIPT", "INVOICE", "CASE"] as const;
export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];
export const documentEntityTypeSchema = z.enum(DOCUMENT_ENTITY_TYPES);

export const DOCUMENT_KINDS = ["PHOTO", "CHALLAN", "INVOICE_FILE", "OTHER"] as const;
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
export const documentKindSchema = z.enum(DOCUMENT_KINDS);

export const DOCUMENT_VISIBILITIES = ["INTERNAL", "SUPPLIER_VISIBLE"] as const;
export type DocumentVisibility = (typeof DOCUMENT_VISIBILITIES)[number];
export const documentVisibilitySchema = z.enum(DOCUMENT_VISIBILITIES);

export const DOCUMENT_EXTRACTION_STATUSES = ["NOT_REQUESTED", "PENDING", "DONE", "FAILED"] as const;
export type DocumentExtractionStatus = (typeof DOCUMENT_EXTRACTION_STATUSES)[number];

export const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

/** 10 MB. Enforced on the server; the client checks the same limit for UX. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const maxBase64Length = Math.ceil(MAX_DOCUMENT_BYTES * (4 / 3)) + 128;

export const uploadDocumentSchema = z.object({
  entityType: documentEntityTypeSchema,
  entityId: z.string().uuid("Invalid entity"),
  kind: documentKindSchema.default("OTHER"),
  visibility: documentVisibilitySchema.default("INTERNAL"),
  fileName: z.string().trim().min(1, "File name is required").max(200),
  mimeType: z.enum(ALLOWED_MIME_TYPES, { errorMap: () => ({ message: "Unsupported file type" }) }),
  dataBase64: z.string().min(1, "File data is required").max(maxBase64Length, "File is too large"),
});
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

export const documentListQuerySchema = z.object({
  entityType: documentEntityTypeSchema,
  entityId: z.string().uuid(),
});
export type DocumentListQuery = z.infer<typeof documentListQuerySchema>;

export const supplierDocumentListQuerySchema = z.object({
  entityId: z.string().uuid(),
});
export type SupplierDocumentListQuery = z.infer<typeof supplierDocumentListQuerySchema>;

export const documentLibraryQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  entityType: documentEntityTypeSchema.optional(),
  kind: documentKindSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type DocumentLibraryQuery = z.infer<typeof documentLibraryQuerySchema>;

export interface DocumentDto {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  kind: DocumentKind;
  visibility: DocumentVisibility;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedByName: string | null;
  extractionStatus: DocumentExtractionStatus;
  createdAt: string;
}

export interface ExtractedField {
  value: string | null;
  confidence: number | null;
}

export interface ExtractedLine {
  description: string;
  quantity: string | null;
  unit: string | null;
  unitPrice: string | null;
  lineTotal: string | null;
  confidence: number | null;
}

export interface ExtractionFields {
  documentType: ExtractedField;
  supplierName: ExtractedField;
  documentNumber: ExtractedField;
  documentDate: ExtractedField;
  currency: ExtractedField;
  poReference: ExtractedField;
  total: ExtractedField;
  lines: ExtractedLine[];
}

export const EXTRACTION_REVIEW_STATUSES = ["PENDING", "CORRECTED", "CONFIRMED", "REJECTED"] as const;
export type ExtractionReviewStatus = (typeof EXTRACTION_REVIEW_STATUSES)[number];
export const extractionReviewStatusSchema = z.enum(EXTRACTION_REVIEW_STATUSES);

export const extractionReviewSchema = z.object({
  decision: z.enum(["CONFIRM", "CORRECT"]),
  correctedFields: z.unknown().optional(),
});
export type ExtractionReviewInput = z.infer<typeof extractionReviewSchema>;

export interface DocumentExtractionDto {
  id: string;
  documentId: string;
  provider: string;
  model: string;
  schemaVersion: string;
  fields: ExtractionFields;
  confidence: number | null;
  reviewStatus: ExtractionReviewStatus;
  correctedFields: ExtractionFields | null;
  error: string | null;
  createdAt: string;
  reviewedAt: string | null;
}
