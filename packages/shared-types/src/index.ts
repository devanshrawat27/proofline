export * from "./roles";
export * from "./auth";
export * from "./suppliers";
export * from "./purchase-orders";
export * from "./receipts";
export * from "./invoices";
export * from "./cases";
export * from "./dashboard";
export * from "./audit";
export * from "./supplier-portal";
export * from "./notifications";
export * from "./documents";

/** Standard API error shape returned by the Nest API. */
export interface ApiErrorBody {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
