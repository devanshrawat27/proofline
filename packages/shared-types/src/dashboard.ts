import type { CaseStatus } from "./cases";
import type { DiscrepancySeverity, DiscrepancyType } from "./invoices";
import type { PoStatus } from "./purchase-orders";

export interface DashboardSummaryDto {
  openCases: number;
  awaitingSupplier: number;
  overdueCases: number;
  /** Invoiced value (integer minor units) of invoices that produced open discrepancies. */
  disputedValueMinor: number;
  currency: string;
  /** Average days from open to close for closed cases; null when none are closed yet. */
  avgResolutionDays: number | null;
  casesByStatus: { status: CaseStatus; count: number }[];
  discrepanciesByType: { type: DiscrepancyType; count: number }[];
  poReceiptStatus: { status: PoStatus; count: number }[];
}

export interface ReportDiscrepanciesDto {
  total: number;
  byType: { type: DiscrepancyType; count: number }[];
  bySeverity: { severity: DiscrepancySeverity; count: number }[];
}

export interface ReportSupplierRow {
  supplierId: string;
  name: string;
  code: string;
  caseCount: number;
  openCaseCount: number;
  disputedValueMinor: number;
}

export interface ReportSuppliersDto {
  currency: string;
  rows: ReportSupplierRow[];
}
