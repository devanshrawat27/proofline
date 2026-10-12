# Data model

Source of truth: [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma).

## Implemented (Phase 1)

- **Organization** — name, unique slug, timezone, default currency, `isDemo` flag (separates demo from production data), timestamps.
- **User** — email (unique), name, `passwordHash`, status, `lastLoginAt`.
- **OrganizationMember** — `(organizationId, userId)` unique; role (`OWNER | PROCUREMENT_MANAGER | RECEIVER | FINANCE`), status (`INVITED | ACTIVE | DEACTIVATED`).
- **Session** — `tokenHash` (unique), optional `activeOrganizationId`, expiry, audit fields, `revokedAt`. The raw token is only ever in the HttpOnly cookie.
- **Invitation** — organization, email, role, `tokenHash`, inviter, expiry, `acceptedAt`.

Conventions: UUID primary keys (`@db.Uuid`), timestamps, foreign keys with
explicit `onDelete`, indexes on tenant and lookup columns, `snake_case` table names.

## Implemented (Phase 2, in progress)

- **Supplier** — organization, `code` (unique per organization, stored uppercase), display name,
  optional contact person/email/phone, GSTIN/tax id, address fields, country (default `IN`),
  notes, status (`ACTIVE | INACTIVE`), timestamps.
- **PurchaseOrder** — organization, supplier, `poNumber` (unique per organization, uppercase),
  status (`DRAFT | ISSUED | PARTIALLY_RECEIVED | FULLY_RECEIVED | CANCELLED | CLOSED`), currency,
  issue/expected dates, notes, `totalMinor` (integer paise), `version`, timestamps.
- **PurchaseOrderLine** — PO, `lineNumber` (unique per PO), optional SKU, description,
  `orderedQuantity` (Decimal(14,3)), unit, `unitPriceMinor` (integer paise), `lineTotalMinor`.
- **Receipt** — organization, PO, receiver, optional delivery reference, notes, status
  (`DRAFT | SUBMITTED`), received/submitted timestamps.
- **ReceiptLine** — receipt, PO line (unique per receipt), `receivedQuantity` and
  `damagedQuantity` (Decimal(14,3)). Accepted quantity is computed as received − damaged;
  damaged must never exceed received (validated by the shared schema).
- **Invoice** — organization, supplier, optional PO, `invoiceNumber` (unique per organization,
  uppercase), status (`DRAFT | REVIEWED`), currency, date, notes, `totalMinor` (integer paise).
- **InvoiceLine** — invoice, optional matched PO line, description, `quantity` (Decimal(14,3)),
  unit, `unitPriceMinor`, `lineTotalMinor`.
- **Discrepancy** — organization, PO, optional invoice and PO line, `type`
  (`QUANTITY_MISMATCH | OVER_DELIVERY | UNIT_PRICE_MISMATCH | DAMAGED_GOODS | UNMATCHED_LINE`),
  `severity` (`LOW | MEDIUM | HIGH`), `status` (`OPEN | DISMISSED | RESOLVED`), `explanation`,
  `expectedValue`, `actualValue`.
- **DisputeCase** — organization, supplier, optional assignee, `caseNumber` (unique per org),
  `status` (state machine, see `cases.ts`), `priority`, `summary`, due/opened/closed timestamps.
- **DisputeCaseItem** — case ↔ discrepancy (unique per pair).
- **CaseMessage** — case, author, `visibility` (`INTERNAL | SUPPLIER_VISIBLE`), body.
- **CaseEvent** — append-only case timeline (type, actor, message).
- **Resolution** — case, `type` (replacement/credit/refund/…), `status`
  (`PROPOSED | APPROVED | VERIFIED | REJECTED`), optional amount, reference, notes, proposer and
  approver/verifier actor + timestamps.

Money is stored as integer minor units (paise); quantities use a decimal type. Line totals are
computed deterministically on the server (`round(quantity × unitPriceMinor)`). On receipt
submission the server recomputes the PO status (`PARTIALLY_RECEIVED` / `FULLY_RECEIVED`) from
the sum of submitted receipts. On invoice review the server recomputes the invoice's
discrepancies deterministically (no AI): billed vs received quantity, over-delivery, unit-price
deltas, damaged goods and unmatched lines. Case status changes are guarded by a server-side
state machine; a resolution must be approved before it can be verified.

## Planned (later phases)

SupplierUser, Document, DocumentExtraction, Notification, AuditEvent.

## Integrity rules (applied now and enforced going forward)

- Money is stored as integer minor units (or a decimal type) — never binary floating point.
- Quantities use decimal precision where fractional units are allowed.
- Unique constraints are scoped by organization where the business rule allows
  (e.g. supplier code, PO number, invoice number).
- Related writes and state transitions use transactions.
- Optimistic concurrency / versioning where concurrent edits could overwrite data.
- Financial and audit records are preserved; soft deletion only where appropriate.

## State machines (planned)

- **PurchaseOrder**: `DRAFT → ISSUED → PARTIALLY_RECEIVED → FULLY_RECEIVED → CLOSED/CANCELLED`.
- **Receipt**: `DRAFT → SUBMITTED`, corrections via traceable amendments (append-only).
- **DisputeCase**: `DRAFT → OPEN → UNDER_REVIEW → SENT_TO_SUPPLIER → SUPPLIER_RESPONDED → RESOLUTION_PROPOSED → AWAITING_INTERNAL_APPROVAL → RESOLUTION_IN_PROGRESS → RESOLVED → CLOSED` (plus `NEEDS_INFORMATION`, `REJECTED`, `CANCELLED`, `REOPENED`).

All transitions are validated server-side with actor, timestamp and optional reason.
