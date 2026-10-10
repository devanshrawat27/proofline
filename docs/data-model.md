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

## Planned (later phases)

Supplier, SupplierUser, PurchaseOrder, PurchaseOrderLine, Receipt, ReceiptLine,
Document, DocumentExtraction, Invoice, InvoiceLine, Discrepancy, DisputeCase,
DisputeCaseItem, CaseMessage, CaseEvent, Resolution, Notification, AuditEvent.

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
