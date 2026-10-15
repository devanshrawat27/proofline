import { z } from "zod";
import { emailSchema } from "./auth";
import {
  casePrioritySchema,
  caseStatusSchema,
  resolutionStatusSchema,
  resolutionTypeSchema,
} from "./cases";
import type { CasePriority, CaseStatus, ResolutionStatus, ResolutionType } from "./cases";
import type { DiscrepancyDto } from "./invoices";

export const supplierLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(128),
});
export type SupplierLoginInput = z.infer<typeof supplierLoginSchema>;

export const supplierRespondSchema = z.object({
  body: z.string().trim().min(1, "Message cannot be empty").max(5000),
});
export type SupplierRespondInput = z.infer<typeof supplierRespondSchema>;

export const supplierProposalSchema = z.object({
  type: resolutionTypeSchema,
  proposedAmountMinor: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  ),
  reference: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(120).optional(),
  ),
  notes: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(1000).optional(),
  ),
});
export type SupplierProposalInput = z.infer<typeof supplierProposalSchema>;

export const supplierCaseListQuerySchema = z.object({
  status: caseStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type SupplierCaseListQuery = z.infer<typeof supplierCaseListQuerySchema>;

export interface SupplierMeDto {
  user: { id: string; email: string; name: string };
  supplier: { id: string; name: string; code: string };
}

export interface SupplierCaseSummaryDto {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  priority: CasePriority;
  summary: string;
  dueDate: string | null;
  discrepancyCount: number;
  updatedAt: string;
}

export interface SupplierCaseMessageDto {
  id: string;
  body: string;
  authorName: string;
  createdAt: string;
}

export interface SupplierResolutionDto {
  id: string;
  type: ResolutionType;
  status: ResolutionStatus;
  proposedAmountMinor: number | null;
  reference: string | null;
  notes: string | null;
  proposedByName: string | null;
  proposedAt: string;
}

export interface SupplierCaseDto {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  priority: CasePriority;
  summary: string;
  dueDate: string | null;
  openedAt: string | null;
  closedAt: string | null;
  discrepancies: DiscrepancyDto[];
  messages: SupplierCaseMessageDto[];
  resolutions: SupplierResolutionDto[];
  updatedAt: string;
}
