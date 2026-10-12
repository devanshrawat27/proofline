# API contracts

Base path: `/api/v1`. Health endpoints are unprefixed.

All responses use a consistent error shape:

```json
{ "statusCode": 403, "code": "FORBIDDEN", "message": "…", "details": null, "requestId": "…" }
```

Errors never include stack traces or provider internals.

## Implemented (Phase 1)

### Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | public | Liveness: `{ status: "ok", uptime }` |
| GET | `/ready` | public | Readiness: checks DB, `{ status: "ready" }` or 503 |

### Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/signup` | public | Creates user + organization (owner). Sets session cookie. |
| POST | `/api/v1/auth/login` | public | Sets session cookie. |
| POST | `/api/v1/auth/logout` | session | Revokes session, clears cookie. `204`. |
| GET | `/api/v1/auth/me` | session | `{ user, organization, membership }`. |

### Organizations

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/v1/organization` | `org:read` |
| PATCH | `/api/v1/organization` | `org:update` |

### Members

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/v1/members` | `member:read` |
| GET | `/api/v1/members/invitations` | `member:read` |
| POST | `/api/v1/members/invitations` | `member:invite` |
| POST | `/api/v1/members/invitations/accept` | public | Accepts a token; creates/links a user and session. |

Request/response bodies are defined by Zod schemas in
[`packages/shared-types`](../packages/shared-types/src) and reused by the frontend.

## Implemented (Phase 2, in progress)

### Suppliers

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/suppliers` | `supplier:read` | Paginated list. Query: `search`, `status`, `page`, `pageSize` (max 100). |
| POST | `/api/v1/suppliers` | `supplier:write` | Creates a supplier. `code` is unique per organization (409 `DUPLICATE_SUPPLIER_CODE`). |
| GET | `/api/v1/suppliers/:id` | `supplier:read` | Single supplier (404 if outside the caller's organization). |
| PATCH | `/api/v1/suppliers/:id` | `supplier:write` | Partial update; `code` changes are uniqueness-checked. |

All endpoints are tenant-scoped: the organization comes from the session, never the
request. Response bodies match `SupplierDto` / `Paginated<SupplierDto>` in
`packages/shared-types`.

### Purchase orders

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/purchase-orders` | `po:read` | Paginated list. Query: `search`, `status`, `page`, `pageSize`. |
| POST | `/api/v1/purchase-orders` | `po:write` | Creates a draft PO with line items. `poNumber` unique per org (409 `DUPLICATE_PO_NUMBER`). |
| GET | `/api/v1/purchase-orders/:id` | `po:read` | PO with supplier and lines. |
| PATCH | `/api/v1/purchase-orders/:id` | `po:write` | Partial update; drafts only (400 `PO_NOT_EDITABLE`). Replaces lines when provided. |
| POST | `/api/v1/purchase-orders/:id/issue` | `po:write` | `DRAFT → ISSUED`. Requires ≥1 line (400 `PO_EMPTY`). |
| POST | `/api/v1/purchase-orders/:id/cancel` | `po:write` | Cancels a `DRAFT`/`ISSUED` PO (400 `PO_NOT_CANCELLABLE` otherwise). |

Bodies match `CreatePurchaseOrderInput` / `PurchaseOrderDto` /
`PurchaseOrderSummaryDto`. Line totals and the PO total are computed on the server from
integer minor units.

### Receipts

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/receipts` | `receipt:read` | Paginated list. Query: `search`, `status`, `purchaseOrderId`, `page`, `pageSize`. |
| POST | `/api/v1/receipts` | `receipt:write` | Records a draft receipt against an issued/partially-received PO. |
| GET | `/api/v1/receipts/:id` | `receipt:read` | Receipt with PO context and lines. |
| PATCH | `/api/v1/receipts/:id` | `receipt:write` | Partial update; drafts only (400 `RECEIPT_NOT_EDITABLE`). |
| POST | `/api/v1/receipts/:id/submit` | `receipt:write` | `DRAFT → SUBMITTED`; recomputes the PO status. |

Validations: `damagedQuantity ≤ receivedQuantity` (400 `VALIDATION_ERROR`), PO must be
`ISSUED`/`PARTIALLY_RECEIVED` (400 `PO_NOT_RECEIVABLE`), each PO line recorded once
(400 `DUPLICATE_PO_LINE`).

### Invoices

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/invoices` | `invoice:read` | Paginated list. Query: `search`, `status`, `page`, `pageSize`. |
| POST | `/api/v1/invoices` | `invoice:write` | Creates a draft invoice with optional PO link and line matching. `invoiceNumber` unique per org (409 `DUPLICATE_INVOICE_NUMBER`). |
| GET | `/api/v1/invoices/:id` | `invoice:read` | Invoice with lines and discrepancy count. |
| PATCH | `/api/v1/invoices/:id` | `invoice:write` | Partial update; drafts only (400 `INVOICE_NOT_EDITABLE`). |
| POST | `/api/v1/invoices/:id/review` | `invoice:write` | Runs the deterministic discrepancy engine and sets `REVIEWED`. Requires a linked PO (400 `INVOICE_NO_PO`). |

### Discrepancies (exceptions)

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/discrepancies` | `discrepancy:read` | Paginated list. Query: `search`, `type`, `severity`, `status`, `invoiceId`, `purchaseOrderId`, `page`, `pageSize`. |
| GET | `/api/v1/discrepancies/:id` | `discrepancy:read` | Single discrepancy. |

Detection is deterministic and explainable; each row keeps its expected/actual values and a
source-link to the PO and invoice. AI never approves or mutates records.

### Cases

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/cases` | `case:read` | Paginated list. Query: `search`, `status`, `priority`, `page`, `pageSize`. |
| POST | `/api/v1/cases` | `case:write` | Opens a case from one or more discrepancies (single supplier; not already cased). |
| GET | `/api/v1/cases/:id` | `case:read` | Case with items, messages, events and resolutions. |
| POST | `/api/v1/cases/:id/transitions` | `case:write` | State-machine transition (400 `INVALID_TRANSITION`). |
| POST | `/api/v1/cases/:id/assign` | `case:write` | Assign to an active member (400 `INVALID_ASSIGNEE`). |
| POST | `/api/v1/cases/:id/messages` | `case:write` | Adds an `INTERNAL` or `SUPPLIER_VISIBLE` message. |
| POST | `/api/v1/cases/:id/resolutions` | `case:write` | Proposes a resolution (only while `UNDER_REVIEW`/`SUPPLIER_RESPONDED`). |
| POST | `/api/v1/cases/:id/resolutions/:resolutionId/approve` | `case:approve` | Approves a proposed resolution. |
| POST | `/api/v1/cases/:id/resolutions/:resolutionId/verify` | `resolution:verify` | Verifies an approved resolution; case becomes `RESOLVED`. |

The allowed case transitions live in `packages/shared-types` (`CASE_TRANSITIONS`) and are
enforced on the server. Every status change, assignment, message and resolution decision is
recorded as an append-only `CaseEvent`.

### Dashboard & reports

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/dashboard/summary` | authenticated | Open cases, awaiting supplier, overdue, disputed value, avg resolution days, plus breakdowns by case status, discrepancy type and PO status. |
| GET | `/api/v1/reports/discrepancies` | `report:read` | Open discrepancies grouped by type and severity. |
| GET | `/api/v1/reports/suppliers` | `report:read` | Per-supplier case counts, open cases and disputed value. |

All metrics are computed from real records (no placeholder data). "Disputed value" is the
invoiced value (integer minor units) of invoices that produced open discrepancies.

### Audit log

| Method | Path | Permission | Description |
| --- | --- | --- | --- |
| GET | `/api/v1/audit-events` | `audit:read` | Paginated, append-only events. Query: `search`, `action`, `entityType`, `page`, `pageSize`. |

Events are written for key actions: `po.issued`/`po.cancelled`, `receipt.submitted`,
`invoice.reviewed`, and all case actions (`case.created`, `case.status_changed`,
`case.assigned`, `case.message_added`, `case.resolution_proposed`/`_approved`/`_verified`).

## Planned (later phases)

Document upload/processing/review, AI extraction, supplier portal (separate supplier identity),
notifications. These are design targets only — they will be added with implementation and tests
together.
