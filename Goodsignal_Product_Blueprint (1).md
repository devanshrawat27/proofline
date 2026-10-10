# Goodsignal — Product Blueprint & Production-Minded Engineering Specification
> **Purpose:** This document is the single source of truth for an AI-assisted supplier delivery discrepancy and dispute-resolution platform. Give it to the coding agent before asking it to implement anything.
>
> **Product ambition:** Production-minded, secure, polished, testable, and deployable—not a generic dashboard mockup.
>
> **Important:** “Production-ready” is a target, not a claim. The agent must implement incrementally, validate behavior, document limitations, and never claim features/tests/deployments succeeded unless verified.

---

## 1. Product Summary

**Product name:** Goodsignal  
**Tagline:** Every delivery. Every discrepancy. Proven.  
**Category:** B2B SaaS / supplier delivery exception management  
**Initial target market:** Small and mid-sized wholesalers, distributors, and procurement teams that coordinate purchase orders, receiving records, invoices, photos, and supplier follow-ups across spreadsheets, email, and messaging apps.

### One-line pitch
Goodsignal helps businesses record what they ordered, what actually arrived, what was billed, gather evidence for discrepancies, and resolve supplier cases through one auditable workflow—using AI to assist with document extraction and explanation, while deterministic code controls calculations and approvals.

### Example
A buyer orders 100 LED drivers at ₹500 each. A receiver records 94 received and marks 2 of those as damaged. The supplier invoice bills 100. Goodsignal compares the purchase order, receipt, and invoice, flags the quantity mismatch, keeps damage evidence attached, creates a case for review, and tracks whether the supplier proposes a replacement or credit.

**Do not silently assume all discrepancies are supplier fault.** Partial deliveries, receiving mistakes, invoice timing, unit-of-measure differences, substitutions, and damaged goods can have different explanations. The platform must preserve evidence and let authorized humans decide.

---

## 2. Market & Competition

The broad category is **not new**. Do not market Goodsignal as the first or only product to solve receiving discrepancies.

### Known adjacent / competing products to research
- **Kissflow — GRN Discrepancy & Exception Resolution:** Covers receiving discrepancy workflows, matching, vendor communication, resolution, and audit trails. This is a close functional competitor.
- **PODFY:** Adjacent delivery-proof / proof-of-delivery evidence workflows.
- **Dost:** Adjacent invoice and business-document workflows for Indian businesses.
- **Stockproof:** Inventory visibility, receiving, purchasing, and evidence-oriented inventory workflows; its name is a reason not to use “Stockproof” for this project.
- **Receivio:** Shopify app for purchase-order receiving and stock workflows; avoid “Receivio” as a product name.
- **ERP/procurement systems:** Products such as SAP, Oracle, Zoho Inventory and other procurement/inventory tools may already cover purchase orders, goods receipts, invoice matching, supplier management, or portions of exception workflows.
- **Spreadsheets, email, WhatsApp, accounting software:** Likely alternatives for smaller businesses, even where there is no dedicated dispute product.

### Research rules before making competitive claims
1. Verify current product pages and capabilities before claiming a competitor lacks a feature.
2. Build a competitor matrix: receiving workflow, PO/invoice/receipt matching, photo evidence, supplier portal, dispute lifecycle, Indian SMB fit, setup complexity, integrations, pricing if public.
3. Do not invent pricing, customer numbers, market size, or competitor gaps.
4. Treat differentiation as a **hypothesis to validate**, not established market truth.

### Brand direction and naming status
**Chosen working brand: Goodsignal** (wordmark may be styled as `goodsignal`). The name suggests a clear operational signal when a delivery, invoice, or receiving record does not line up. Avoid freight-port imagery; the product is an evidence and resolution workspace, not a shipping company.

**Tagline:** “Every delivery. Every discrepancy. Proven.”

A preliminary exact-name web search did not surface an obvious directly matching software product, while names such as Stockproof and Receivio already appear in adjacent inventory/receiving categories. This is only a lightweight web check—not trademark, company-name, domain, or app-store clearance. Do not claim the name is legally available; check those before public launch.

### Proposed positioning hypothesis
**A lightweight, mobile-first discrepancy-to-resolution workspace for small Indian distributors, with evidence-first cases and AI-assisted document matching, designed to work without a full ERP rollout.**

Potential differentiators to validate:
- Fast mobile receiving flow with minimal typing.
- Upload common PDFs/photos and map them to a PO.
- Explain every discrepancy with source evidence and confidence.
- Track case ownership, supplier response, deadlines, replacement/credit resolution, and closure.
- Simple setup and usable UX for teams that currently use spreadsheets and messaging.
- Explicit correction and review flows instead of pretending AI extraction is always right.

Do not build an enormous ERP. Focus on the delivery discrepancy workflow end-to-end.

---

## 3. Product Principles

1. **Evidence over guesses:** Every discrepancy should be traceable to source records, extracted fields, or user-entered receiving data.
2. **Deterministic business rules:** Calculations, eligibility, permissions, status transitions, and final approvals are code-enforced—not LLM-decided.
3. **Human review:** AI-extracted fields need confidence and correction paths. Low-confidence or conflicting values require review.
4. **Tenant isolation:** One organization must never access another organization's data.
5. **Auditable changes:** Record important actions and state changes with actor, timestamp, and relevant before/after values.
6. **Progressive disclosure:** Make common receiving tasks simple; keep detailed evidence and controls available without cluttering the UI.
7. **Accessible and responsive:** Mobile-first receiving, responsive admin views, keyboard accessibility, clear loading/empty/error states.
8. **No fake functionality:** Every visible button must work, or be explicitly marked as unavailable. No dead links, placeholder charts presented as real data, or mock success messages.
9. **Secure by default:** Least privilege, safe file handling, secrets outside source control, validated inputs, rate limiting, and secure authorization on the server.
10. **Measurable AI:** Evaluate extraction/matching quality against a labelled sample set; show limitations.

---

## 4. User Roles & Permissions

Support multiple organizations (tenants). A user may belong to one or more organizations in the future, but MVP can use one active organization per session while keeping the data model extensible.

### 4.1 Organization Owner / Admin
- Manage organization profile, locations, users, role assignments, suppliers, units of measure, and configuration.
- View all organization purchase orders, receipts, disputes, reports, and audit events.
- Configure notification preferences and basic discrepancy thresholds.
- Invite/deactivate users.
- Cannot access another tenant's records.

### 4.2 Procurement Manager
- Create/manage suppliers and purchase orders.
- Review receipts and discrepancies.
- Create, assign, approve, reject, reopen, or close dispute cases according to policy.
- Send supplier requests and select a proposed resolution.
- View supplier performance and unresolved exposure reports.
- Cannot alter immutable audit events or bypass server-side approval rules.

### 4.3 Warehouse Receiver
- View assigned/open purchase orders needed for receiving.
- Record full or partial receipt quantities, damaged quantities, photos, notes, and delivery documents.
- Save drafts and submit a receipt.
- View receipts they are authorized to access.
- Cannot approve financial settlements or manage roles.

### 4.4 Supplier User
- Access only their own supplier account and cases explicitly associated with it.
- View case evidence shared with the supplier.
- Respond to cases, add notes/documents, and propose replacement, credit, or another agreed resolution.
- View case status and their own historical responses.
- Cannot see internal notes, unrelated suppliers, other tenants, or internal financial analytics.

### 4.5 Finance / Accounts (recommended MVP role)
- Review invoice values, proposed credits, and settlement evidence.
- Record credit note/reference and mark financial resolution verified.
- Cannot edit original receiving evidence or assign admin roles.

### 4.6 Platform Super Admin (optional; do not prioritize)
- Internal platform operations only.
- Must be isolated from tenant business permissions, heavily audited, and omitted from normal customer UI unless needed.

### Permission implementation
- Use server-side RBAC plus tenant-scoped authorization checks on every protected API.
- Never rely on hidden frontend buttons for security.
- Supplier data access must be checked against the supplier identity linked to the authenticated user.
- Add automated tests that attempt cross-tenant and cross-supplier access and expect denial.
- Internal notes and supplier-visible messages must be separate fields/entities with explicit visibility.

---

## 5. Core Workflows

### Workflow A — Organization setup
1. User signs up and creates an organization.
2. Organization profile and timezone/currency are set (default currency INR; do not hard-code assumptions in calculations).
3. Owner invites team members and assigns roles.
4. Suppliers are created or imported from a validated CSV template.

### Workflow B — Purchase order
1. Procurement Manager creates a PO with supplier, PO number, issue date, expected delivery date, currency, line items, SKU/description, ordered quantity, unit, unit price, tax/discount if supported.
2. Validate quantities and prices; use decimal-safe money types.
3. PO can be Draft → Issued → Partially Received → Fully Received → Closed/Cancelled, subject to valid transitions.
4. Store an immutable snapshot of issued terms or version the PO so later edits do not rewrite history.

### Workflow C — Receiving
1. Receiver opens a PO and starts a receipt against it.
2. Record actual received quantity per line; allow multiple partial receipts.
3. Record damaged quantity as a subset of received quantity, never greater than received quantity.
4. Attach photos and delivery challan / proof-of-delivery files.
5. Capture notes, receiver, timestamps, and optional delivery reference.
6. Save Draft, then Submit. After submission, corrections must create a traceable amendment rather than silently overwrite history.
7. Update PO receipt status based on total accepted/received quantities and cancellation/over-delivery rules.

### Workflow D — Document intake & AI extraction
1. Upload an invoice, delivery challan, or other supported document.
2. Validate type/size; store privately; create a processing job.
3. Extract structured fields: document type, supplier, document number, date, currency, line descriptions, SKU if present, quantity, unit, unit price, tax, total, PO reference.
4. Store source file reference and extraction result; where possible store page number and bounding box/source span for each extracted field.
5. Display extracted fields for user review/edit before treating them as verified.
6. Show confidence per field and flag unknown/ambiguous values.
7. Reprocessing must be idempotent and preserve prior result versions.
8. If AI provider fails, job times out, or the document is unreadable, expose retry/manual entry—not a false success.

### Workflow E — Matching & discrepancy detection
Compare:
- PO vs receipt (ordered versus received; account for partial deliveries and over-delivery rules).
- PO vs invoice (quantity, unit price, line totals, tax, currency, supplier identity, PO reference).
- Receipt vs invoice (billed versus received; avoid assuming that invoice timing always matches a single receipt).

Potential discrepancy types:
- Missing quantity / short delivery
- Over-delivery
- Damaged quantity
- Unit-price mismatch
- Invoice quantity mismatch
- Duplicate invoice suspicion
- Supplier / PO reference mismatch
- Unit-of-measure mismatch
- Unmatched line item
- Tax/total mismatch
- Document unreadable / insufficient evidence

Rules:
- Matching must be explainable and deterministic where possible.
- AI may suggest candidate line-item matches, but user confirmation is required for ambiguous mappings.
- Normalize descriptions carefully; never auto-merge distinct SKUs solely from semantic similarity.
- Use tolerances configurable by organization for rounding/tax/price differences.
- Avoid double-counting the same quantity across multiple receipts or invoices.
- Distinguish “flagged” from “confirmed” discrepancies.
- Keep an explanation with values and source records, e.g. “PO line says 100; receipt totals 94; invoice line says 100.”

### Workflow F — Dispute case lifecycle
Recommended statuses:
`DRAFT → OPEN → UNDER_REVIEW → SENT_TO_SUPPLIER → SUPPLIER_RESPONDED → RESOLUTION_PROPOSED → AWAITING_INTERNAL_APPROVAL → RESOLUTION_IN_PROGRESS → RESOLVED → CLOSED`

Additional statuses where justified: `NEEDS_INFORMATION`, `REJECTED`, `CANCELLED`, `REOPENED`.

Rules:
- Define and enforce allowed transitions on the server.
- Each transition requires actor, timestamp, and optionally a reason.
- Support internal notes and supplier-visible messages with clear visibility.
- Support assignment, due dates, reminders, escalation, and case history.
- Resolution types: replacement, credit note, partial credit, refund, return, no adjustment/claim rejected, or mutually agreed alternative.
- Do not mark a case financially resolved merely because a supplier proposed a credit. Finance/authorized user must verify the evidence/reference.
- Cases may combine multiple related discrepancies but must retain line-level detail.
- Prevent duplicate active cases for the same issue where feasible, while allowing separate legitimate issues.

### Workflow G — Supplier collaboration
- Supplier receives a secure notification/link and signs in to its portal.
- Supplier sees only permitted case details and evidence.
- Supplier can accept, dispute, request more information, or propose a resolution.
- Every response is timestamped and attributable.
- Supplier-visible documents/messages must be explicitly selected; internal notes are never shared by default.

### Workflow H — Resolution & closure
1. Internal user accepts a proposed resolution or requests a change.
2. For replacement: track replacement reference and receiving confirmation.
3. For credit: record credit note number, amount, currency, date, and evidence; finance verifies it.
4. For rejected claims: require reason and record supporting evidence.
5. Close only when required resolution conditions are met or an authorized override with reason is logged.
6. Preserve full timeline and calculate aging from clear timestamps.

### Workflow I — Notifications
- In-app notifications first.
- Email notifications for invites, assigned cases, supplier responses, due reminders, and resolution updates.
- Use a queue with retries, idempotency, and delivery status.
- Email failure must not roll back the core business transaction.
- Avoid sending duplicate notifications on retries.

---

## 6. Main Screens / Information Architecture

### Public
- Landing page: value proposition, workflow, use cases, product screenshots from real UI, CTA.
- Login / signup / invite acceptance.
- Privacy, terms, and contact/support pages (do not invent legal guarantees).

### Authenticated app shell
- Organization switcher only if supported.
- Role-aware navigation.
- Global search for PO number, supplier, invoice number, and case ID.
- Notification center, user profile, help.

### Owner / Admin
- Overview dashboard
- Users & roles
- Suppliers
- Purchase orders
- Receipts
- Disputes
- Documents
- Reports
- Audit log
- Organization settings

### Receiver
- My receiving queue
- PO receiving detail
- Create/edit receipt
- Evidence upload/capture
- Receipt history

### Procurement Manager
- PO list/detail/create/edit
- Discrepancy inbox
- Case list/detail/workspace
- Supplier directory/detail
- Resolution approval
- Supplier performance / reports

### Supplier portal
- Supplier overview
- Assigned cases
- Case detail and permitted evidence
- Submit response / propose resolution
- Case history

### Finance
- Pending credit/settlement verification
- Credit note detail
- Resolution evidence
- Verified settlement history

### UX quality requirements
- Build loading, skeleton, empty, error, permission-denied, and success states.
- Tables must have search, filters, sorting, pagination, and useful empty states.
- Forms need inline validation, clear errors, unsaved-change protection where appropriate, and accessible labels.
- Confirm destructive actions.
- Use consistent date, currency, quantity, status, and terminology formatting.
- Provide responsive layouts, especially for warehouse receiving on mobile.
- Avoid excessive gradients/glassmorphism; prioritize legibility, hierarchy, spacing, and operational clarity.
- No fake charts, fake metrics, fake notifications, or hard-coded demo content in production mode. Provide a clearly labelled seeded demo organization for portfolio evaluation.

---

## 7. Dashboard Metrics & Reports

Use real database-derived values and document their definitions:
- Open cases by status and age
- Total disputed value (define whether tax is included)
- Cases overdue
- Average time to first supplier response
- Average time to resolution
- Discrepancy counts by type
- Discrepancy frequency/value by supplier
- Replacement vs credit vs rejected case outcomes
- PO receipt completion status
- AI extraction review/correction rate

Do not label “money saved” unless the calculation is defensible and explained. Separate claimed, approved, and verified credit values.

---

## 8. Technical Architecture

### Recommended stack
- **Frontend:** Next.js App Router, React, TypeScript
- **UI:** Tailwind CSS and a consistent component system (e.g. shadcn/ui); use accessible primitives
- **Forms & validation:** React Hook Form + Zod; validate again on the server
- **Backend:** NestJS REST API with modular architecture
- **Database:** PostgreSQL
- **ORM/migrations:** Prisma
- **Authentication:** Secure session or vetted auth provider; choose one approach and document it. Use secure, HttpOnly cookies where applicable; never store long-lived secrets in localStorage.
- **Authorization:** RBAC plus tenant-scoped service/query checks
- **Queue/cache:** Redis + BullMQ for document processing, email and reminders
- **File storage:** S3-compatible private object storage (local MinIO for development); signed URLs with short expiry
- **AI extraction:** Provider-agnostic service interface with structured JSON schema output; choose a reliable vision/document-capable model based on available credentials and cost
- **PDF/text parsing:** Use deterministic parsers/OCR where appropriate, AI for ambiguous extraction/normalization
- **Email:** SMTP/provider adapter; Mailpit locally
- **Testing:** Jest/Vitest as appropriate, Supertest for API, Playwright for end-to-end
- **Dev environment:** Docker Compose for PostgreSQL, Redis, object storage and Mailpit
- **CI:** GitHub Actions for lint, typecheck, unit/integration tests, build, and migration checks
- **Observability:** Structured logs, request IDs, job status, error tracking hook, health/readiness endpoints
- **API docs:** Swagger/OpenAPI for NestJS

Avoid adding microservices, Kubernetes, Kafka, or a vector database unless a demonstrated requirement justifies them. A modular monolith is preferred for the MVP.

### Suggested repository structure
```text
dockproof/
  apps/
    web/                 # Next.js frontend
    api/                 # NestJS REST API
    worker/              # Queue processors, or worker module within api initially
  packages/
    shared-types/        # Shared API contracts only if repo setup supports it
    config/              # Shared lint/tsconfig if appropriate
  infra/
    docker-compose.yml
  docs/
    architecture.md
    data-model.md
    api-contracts.md
    threat-model.md
    test-plan.md
    competitor-research.md
  .env.example
  README.md
```
Do not force a monorepo if the existing repository already has a sensible structure; inspect first and preserve existing conventions.

---

## 9. Core Data Model (initial proposal)

Use UUIDs, timestamps, indexes, foreign keys, and explicit tenant ownership. Finalize with a schema diagram before implementation.

- `Organization`: name, slug, timezone, default currency, settings
- `User`: identity/auth provider fields, profile, status
- `OrganizationMember`: organization, user, role, status
- `Supplier`: organization, supplier code, legal/display name, contacts, address, status
- `SupplierUser`: supplier, user, status, invitation metadata
- `PurchaseOrder`: organization, supplier, PO number, status, currency, dates, version
- `PurchaseOrderLine`: PO, SKU, description, ordered quantity, unit, unit price, tax/discount fields
- `Receipt`: organization, PO, receiver, status, received-at, delivery reference, notes
- `ReceiptLine`: receipt, PO line, received quantity, damaged quantity, accepted quantity, unit
- `Document`: organization, related entity references, type, storage key, MIME type, size, checksum, uploaded by, visibility, processing status
- `DocumentExtraction`: document, provider/model version, schema version, raw structured output, normalized output, confidence, review status, error details
- `Invoice`: organization, supplier, invoice number, date, currency, totals, status, source document
- `InvoiceLine`: invoice, matched PO line (nullable until confirmed), description, quantity, unit, unit price, tax, total
- `Discrepancy`: organization, PO/receipt/invoice references, type, severity, status, explanation, expected/actual values, source references
- `DisputeCase`: organization, supplier, case number, status, assignee, priority, due date, summary, opened/closed timestamps
- `DisputeCaseItem`: case, discrepancy, quantities/amounts in dispute
- `CaseMessage`: case, author, visibility (`INTERNAL` or `SUPPLIER_VISIBLE`), message, attachments
- `CaseEvent`: case, actor, event type, timestamp, safe metadata; append-only through application permissions
- `Resolution`: case, type, proposed amount/quantity, status, reference, evidence, proposed/approved/verified by and timestamps
- `Notification`: organization, recipient, type, payload reference, read status, delivery status
- `AuditEvent`: organization, actor, action, entity type/id, timestamp, request ID, redacted before/after metadata
- `IdempotencyKey` or equivalent for webhook/critical write idempotency if needed

### Data integrity rules
- Store money using integer minor units or a suitable decimal type; never use binary floating-point for financial arithmetic.
- Validate currency and units consistently.
- Quantities use suitable decimal precision when fractional units are allowed.
- Add unique constraints scoped by organization for supplier codes, PO numbers, and invoice numbers where business rules allow.
- Use transactions for related writes and state transitions.
- Use optimistic concurrency/versioning where concurrent edits could overwrite data.
- Use soft deletion only where appropriate; preserve financial and audit records.
- Ensure all tenant-owned records have an organization scope and every query enforces it.

---

## 10. API Design (initial route map)

Use versioned REST endpoints, consistent error shape, pagination, filtering, DTO validation, and Swagger.

### Auth & organization
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/me`
- `GET /api/v1/organization`
- `PATCH /api/v1/organization`
- `GET /api/v1/members`
- `POST /api/v1/members/invitations`

### Suppliers
- `GET /api/v1/suppliers`
- `POST /api/v1/suppliers`
- `GET /api/v1/suppliers/:id`
- `PATCH /api/v1/suppliers/:id`
- `POST /api/v1/suppliers/:id/invitations`

### Purchase orders & receiving
- `GET /api/v1/purchase-orders`
- `POST /api/v1/purchase-orders`
- `GET /api/v1/purchase-orders/:id`
- `PATCH /api/v1/purchase-orders/:id`
- `POST /api/v1/purchase-orders/:id/issue`
- `POST /api/v1/purchase-orders/:id/cancel`
- `POST /api/v1/purchase-orders/:id/receipts`
- `GET /api/v1/receipts`
- `GET /api/v1/receipts/:id`
- `POST /api/v1/receipts/:id/submit`
- `POST /api/v1/receipts/:id/amendments`

### Documents & matching
- `POST /api/v1/documents/upload-url` or secure multipart upload
- `POST /api/v1/documents/:id/process`
- `GET /api/v1/documents/:id`
- `POST /api/v1/documents/:id/review`
- `GET /api/v1/purchase-orders/:id/matches`
- `POST /api/v1/matches/:id/confirm`
- `POST /api/v1/matches/:id/reject`
- `GET /api/v1/discrepancies`

### Cases
- `GET /api/v1/cases`
- `POST /api/v1/cases`
- `GET /api/v1/cases/:id`
- `POST /api/v1/cases/:id/assign`
- `POST /api/v1/cases/:id/transitions`
- `POST /api/v1/cases/:id/messages`
- `POST /api/v1/cases/:id/resolutions`
- `POST /api/v1/resolutions/:id/approve`
- `POST /api/v1/resolutions/:id/verify`
- `POST /api/v1/cases/:id/close`

### Supplier portal
- Supplier-specific routes or shared routes with strict supplier-scoped authorization:
  - `GET /api/v1/supplier/cases`
  - `GET /api/v1/supplier/cases/:id`
  - `POST /api/v1/supplier/cases/:id/respond`
  - `POST /api/v1/supplier/cases/:id/proposals`

### Reporting & operations
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/reports/discrepancies`
- `GET /api/v1/reports/suppliers`
- `GET /api/v1/audit-events`
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/:id/read`
- `GET /health`
- `GET /ready`

This route map is a proposal, not permission to create endpoints without implementing and testing them. Adjust route details to the chosen auth approach and API conventions.

---

## 11. AI Design & Evaluation

### AI service contract
Implement AI behind a provider-independent interface. Return validated structured data, not arbitrary unvalidated strings. Record provider/model/version, schema version, latency, token/cost metadata when available, and errors without logging document contents or secrets.

### Extraction schema example
```json
{
  "documentType": "INVOICE",
  "supplierName": {
    "value": "Example Electricals",
    "confidence": 0.94,
    "sourcePage": 1
  },
  "invoiceNumber": {
    "value": "INV-204",
    "confidence": 0.97,
    "sourcePage": 1
  },
  "currency": {
    "value": "INR",
    "confidence": 0.99,
    "sourcePage": 1
  },
  "lines": [
    {
      "description": "LED Driver 12W",
      "sku": null,
      "quantity": 100,
      "unit": "piece",
      "unitPrice": 500,
      "lineTotal": 50000,
      "confidence": 0.91,
      "sourcePage": 1
    }
  ]
}
```
This is illustrative only. Enforce the actual schema with Zod/class-validator and use the selected provider's supported structured-output feature.

### AI safety / reliability
- Treat uploaded documents as untrusted data. Text in a document must never override system instructions or trigger tool execution.
- AI extraction has no permission to approve claims, send external messages, alter purchase orders, or execute payments.
- Validate all numbers, totals, currencies, and schema fields after model output.
- Preserve original files and extraction versions.
- Let users edit extracted fields and record corrections for evaluation.
- Do not expose one tenant's document or extracted content to another tenant.
- Add timeouts, retries with limits, backoff, queue dead-letter handling, and manual fallback.
- Redact sensitive data from logs; configure retention and deletion policies.
- Use a labelled synthetic/test dataset covering clean invoices, scanned/rotated docs, missing fields, duplicate invoices, similar product descriptions, inconsistent totals, and malicious embedded instructions.
- Track field-level extraction accuracy, line-match precision/recall where labelled, human correction rate, failure rate, and latency/cost. Do not claim accuracy until measured.
- Show a clear “AI-suggested / needs review / verified by user” state.

---

## 12. Security, Privacy & Reliability

Before calling the product production-ready, implement and verify:

### Authentication & access
- Secure password handling or vetted identity provider.
- Secure cookies/session lifecycle; CSRF protections where relevant.
- Server-side authorization on every read/write.
- Tenant isolation tests and supplier scoping tests.
- Rate limits for auth, uploads, AI processing, and public-facing endpoints.
- Account invitation expiry and single-use tokens.
- Avoid user enumeration where practical.

### Files
- Allowlist MIME types/extensions and validate actual content where feasible.
- Enforce file size limits.
- Generate random storage keys; never trust user-supplied path names.
- Store files privately; use short-lived signed URLs.
- Scan uploads where infrastructure supports it.
- Never execute uploaded files.
- Apply retention/deletion policy and avoid exposing private files through public static paths.

### API / database
- DTO validation, safe ORM queries, output filtering, security headers, CORS allowlist.
- Transactions for multi-step state changes.
- Idempotency for webhook and critical retryable operations.
- Audit important actions without storing passwords, tokens, or unnecessary personal data.
- Avoid leaking stack traces or internal provider errors to users.
- Backups and a documented restore procedure for a real deployment.

### Operational reliability
- Liveness and readiness health checks.
- Structured logs with request/job IDs.
- Queue retry and dead-letter handling.
- Graceful handling of provider outage, DB outage, upload failure, and email failure.
- Environment-specific configuration and validated startup config.
- CI required checks and dependency/security scanning where practical.
- Document backup, restore, migration, incident and rollback steps.

Do not claim compliance certifications or legal compliance without an actual review.

---

## 13. Testing & Acceptance Criteria

### Unit tests
- Quantity and money calculations
- Receipt status and partial-delivery calculations
- Discrepancy rules and tolerance boundaries
- Allowed/blocked case transitions
- Role permission policies
- AI output schema validation and normalization

### Integration tests
- Organization-scoped queries
- PO → receipt → invoice matching
- Duplicate invoice detection
- Case creation and state transitions
- Supplier responses and visibility rules
- Resolution approval and verification
- Queue retry/idempotency
- Notification delivery status
- Upload authorization and signed URL access

### End-to-end tests (Playwright)
1. Owner creates organization and supplier.
2. Manager creates and issues a PO for 100 units.
3. Receiver records 94 received and 2 damaged, then submits evidence.
4. User uploads invoice for 100 units.
5. AI extraction is reviewed; deterministic matcher flags discrepancy.
6. Manager opens case and sends supplier-visible message.
7. Supplier logs in and proposes replacement or credit.
8. Authorized user approves the resolution; finance records verification.
9. Case closes and dashboard/audit timeline updates.
10. A user from another tenant and an unrelated supplier are denied access.

### Minimum acceptance gates
- No known critical/high security issue left unresolved before public deployment.
- Lint, formatting, typecheck, unit tests, integration tests, production build all pass in CI.
- Database migrations work on a clean database and upgrade a previous version.
- Main E2E workflow passes in CI or documented supported environment.
- No route/page with fake data in production mode.
- All forms have validation and recoverable errors.
- Every interactive element has a real action or is clearly disabled with explanation.
- Loading, empty, error, permission-denied, and success states exist.
- README setup works from a fresh clone using documented commands.
- `.env.example` contains names and safe placeholders only—never real secrets.
- A seeded demo dataset is clearly separated from production data.

---

## 14. Build Plan (incremental; do not attempt a giant one-shot generation)

### Phase 0 — Repository & research
- Inspect the existing repo before changing anything.
- Read any `AGENTS.md`, `README.md`, package scripts, conventions, and existing design system.
- Produce a concise architecture proposal, data model diagram, screen map, API contract, competitor matrix, threat model, and implementation plan.
- Confirm exact framework/library versions and compatible APIs from official docs.
- Do not overwrite existing code or redesign unrelated features without permission.

### Phase 1 — Foundation
- App shell, design tokens, accessible components, auth, organization, membership, role guards.
- PostgreSQL schema and migrations.
- Docker Compose and environment validation.
- CI lint/typecheck/test/build.
- Seeded demo organization and sample users only for development/demo.

### Phase 2 — Core operations
- Supplier CRUD.
- PO create/edit/issue.
- Receiving with partial receipts, damaged quantities, attachments.
- Real dashboard queries and searchable/filterable tables.

### Phase 3 — Document & discrepancy engine
- Private file upload.
- Background extraction worker.
- Extraction review UI.
- Deterministic matching and discrepancy rules.
- Unit/integration tests.

### Phase 4 — Cases & supplier collaboration
- Case lifecycle and state machine.
- Case timeline, messages, internal/supplier visibility.
- Supplier portal and invitations.
- Resolution proposals, approvals, verification, closure.

### Phase 5 — Product polish & release
- Notifications, reports, audit log.
- Responsive polish, accessibility, loading/error/empty states.
- Playwright full workflow.
- Security review, backup/restore documentation, CI/deployment docs.
- Demo seed and short product walkthrough.
- Measure AI evaluation dataset and document results honestly.

At the end of every phase: run checks, fix failures, summarize changed files, list implemented vs not implemented, and propose the next phase. Do not skip tests to claim completion.

---

## 15. Brand, Visual Design System & Frontend Direction

### 15.1 Product experience concept
Design Goodsignal as an **evidence-first operations command center**. It should feel like a premium modern B2B SaaS product: confident, data-dense where needed, calm under pressure, and much more polished than a generic admin template.

The product must communicate three things visually:
1. **What does not match?** Make exceptions visible immediately without turning every page into a red-alert dashboard.
2. **What evidence supports the finding?** Connect every AI suggestion and discrepancy to the source document, receiving entry, or user action.
3. **What happens next?** Make ownership, due date, supplier response, and next allowed action unmistakable.

Avoid designing this as a generic “AI SaaS” site with a chatbot occupying the main screen, giant gradients, random glass cards, glowing orbs, or charts that do not answer a business question. The interface is an operational tool; clarity and trust come first.

### 15.2 Brand identity
- **Name:** Goodsignal (lowercase wordmark `goodsignal` is acceptable if it looks better in the header)
- **Tagline:** “Every delivery. Every discrepancy. Proven.”
- **Brand attributes:** precise, trustworthy, helpful, evidence-led, operational, modern.
- **Suggested logo direction:** a simple geometric mark combining a check/receipt corner with a small signal/ripple motif. It must work as a 16px sidebar icon, monochrome favicon, and full wordmark. Do not use trucks, ships, boxes-with-arrows, robots, or generic AI sparkles as the main logo.

### 15.3 Visual system
Use a **light-first interface** with deep ink typography and a controlled evergreen accent. The UI should feel distinctive without compromising contrast.

Suggested starting tokens (validate contrast and tune as needed):
- App background: `#F5F7F5` (soft neutral, not pure grey)
- Main surface: `#FFFFFF`
- Primary text: `#17211D`
- Secondary text: `#66736C`
- Brand evergreen: `#176B52`
- Deep evergreen: `#104B3B`
- Subtle accent tint: `#E8F4EE`
- Optional acid-lime highlight used sparingly: `#D6F36A`
- Standard border: `#E1E7E2`
- Warning: `#A85D10` on a light amber surface
- Critical: `#B42318` on a light red surface
- Success: `#18794E` on a light green surface
- Information: `#315E8A` on a light blue surface

Rules:
- Status colours must also use labels/icons; never rely on colour alone.
- Reserve red for actionable critical conditions, not generic decorations.
- Do not use purple/blue gradients as a default brand treatment.
- Use one spacing scale, one radius scale, and a small, consistent shadow system.
- Recommended typography: Geist or Inter for UI; tabular numerals for quantities, currency, and analytics. Load fonts responsibly and define good fallbacks.
- Recommended icons: Lucide with consistent stroke weights.
- Use subtle 120–180ms transitions for hover, drawer, and status changes; honour `prefers-reduced-motion`.

### 15.4 App shell and navigation
Desktop shell:
- Fixed/collapsible left sidebar around 248px when expanded, compact icon rail when collapsed.
- Top bar with workspace name, command/global search, keyboard shortcut hint, notification center, and profile menu.
- Main content area with a consistent max width, generous page gutters, and clear heading/action hierarchy.
- Breadcrumbs on nested records; sticky context/actions only when useful.

Suggested primary navigation:
- Overview
- Exceptions (the most important, visually prominent destination)
- Purchase Orders
- Receiving
- Suppliers
- Documents
- Reports
- Settings

Role-aware navigation must reflect server permissions. Hiding a menu item is not a substitute for API authorization.

### 15.5 High-impact screens (design these carefully)

#### A. Overview — “What needs attention?”
- Header with a clear greeting/workspace and primary CTA: `Record a delivery`.
- Four compact metric cards: Open exceptions, Disputed value, Awaiting supplier, Overdue cases. Show comparison only when it is meaningful and computed from real data.
- Main “Needs attention” table sorted by severity/due date, not by arbitrary recency.
- Small panels for recent activity and supplier response ageing.
- A compact “Receiving health” visualization only if it reveals a real pattern; never add charts just to fill empty space.
- Empty state should explain how the first PO/receipt creates useful data.

#### B. Exceptions inbox — the signature screen
This should be the product’s strongest desktop screen and the centre of the demo.
- Clear title and useful count; filter chips for Critical, Needs review, Awaiting supplier, Overdue, and Resolved.
- Search and filters for supplier, PO, discrepancy type, amount range, assignee, and date.
- Table rows should show case ID, supplier, PO, discrepancy summary, disputed amount/quantity, severity, owner, age/due date, and current status.
- Use a slim severity stripe/icon and tasteful status pill; avoid colouring whole rows.
- Row click opens the case workspace; keyboard and focus states must work.
- Support pagination, sorting, loading skeleton, empty state, and actionable errors.

#### C. Dispute workspace — the signature interaction
Design a high-quality three-zone layout at desktop sizes:
1. **Case summary rail:** case ID, status, priority, assignee, supplier, PO, due date, and next action.
2. **Evidence and discrepancy canvas:** side-by-side/stacked comparison of PO quantity, received quantity, damaged quantity, and invoiced quantity; show calculation and the source record for each value. Provide document preview with page navigation and highlighted extracted fields where technically available.
3. **Activity and resolution rail:** chronological case timeline, internal notes separated from supplier-visible messages, supplier response, proposed replacement/credit, approval and verification actions.

Key interaction: clicking any mismatched value reveals the exact source record/document field and extraction state (`AI suggested`, `Needs review`, `Verified`). Make corrections inline with validation and record who confirmed the value.

The primary CTA must be state-aware (e.g. `Review discrepancy`, `Send to supplier`, `Approve resolution`, `Verify credit`, `Close case`) based on permissions and valid transitions. Never show actions the current role cannot execute.

#### D. Record a delivery — mobile-first guided flow
Use a short stepper rather than an intimidating long form:
1. Select/open purchase order.
2. Record quantities received for each line; damaged quantity must be a subset of received quantity.
3. Add photos, delivery challan, and notes.
4. Review comparison and flagged differences.
5. Confirm and submit receipt.

Design for warehouse use on a phone: large tap targets, camera/file capture, inline quantity controls, sticky bottom action, resilient draft save, clear validation, and recovery from upload/network failure. Do not force the receiver to use the full desktop dashboard.

#### E. Document review
- Document preview on one side and extracted structured fields on the other at large screens; stack them on mobile.
- Every field shows its confidence/review state without pretending confidence is a guarantee of correctness.
- Highlight missing/ambiguous fields; make corrections quick.
- Show extraction progress, retry, failure, and manual entry fallback.
- Treat document contents as untrusted; never allow embedded text to trigger actions.

#### F. Supplier portal
A simple, focused portal rather than the full internal application:
- Cases awaiting supplier response
- Case detail with only explicitly supplier-visible evidence
- Respond / request information / propose replacement or credit
- Upload supporting files and inspect response history
- Clear status and next expected action

#### G. Admin, supplier, PO and report screens
- Shared table and form patterns, consistent filters, page titles, breadcrumbs, and action placement.
- Supplier detail page should show active cases, delivery history and discrepancy trends with definitions and links to source cases.
- PO details should show versioned terms, receipts, invoice links, remaining expected quantities and current status.
- Reports should clearly state date range and metric definitions; no fake analytics.

### 15.6 Marketing/landing page direction
Create a polished product landing page that explains the workflow in seconds:
- Hero headline: **“Know what arrived. Prove what needs resolving.”**
- Supporting copy: “Compare purchase orders, receiving records, and supplier invoices. Turn mismatches into evidence-backed cases your team can actually close.”
- Primary CTA: `Explore the demo`; secondary CTA: `See how it works`.
- Hero visual should be a real, carefully composed product UI preview: a delivery comparison panel with a quantity mismatch, source evidence, and case status. Do not use a generic AI orb or stock warehouse image as the only hero.
- Three-step explanation: Receive → Verify → Resolve.
- Show the evidence trail and AI review/correction workflow.
- Include a product UI preview, user-role/workflow section, security principles, and concise FAQ.
- Never invent customer logos, testimonials, savings percentages, accuracy claims, certifications, or live integrations.
- If there is no real customer data, mark the interactive example as sample/demo data.

### 15.7 Component and frontend implementation guidance
- Next.js App Router + TypeScript.
- Tailwind CSS and shadcn/ui (or the existing component system if repository already has one); use accessible primitives rather than rebuilding dialogs/menus from scratch.
- React Hook Form + Zod for client forms, plus authoritative server validation.
- TanStack Table for complex tables where it helps; do not over-engineer simple lists.
- Lucide icons; Recharts only for charts justified by real product questions.
- Use the existing project conventions after repository inspection; do not introduce a new UI library just for preference.
- Define reusable design tokens and semantic components: `PageHeader`, `MetricCard`, `StatusBadge`, `SeverityIndicator`, `DataTable`, `EmptyState`, `ErrorState`, `EvidenceField`, `DocumentPreview`, `ActivityTimeline`, `ConfirmDialog`, and `MobileStepper` as appropriate.
- Separate server state from local UI state. Use the project’s established fetching/cache approach; handle mutations, optimistic updates, and invalidation deliberately.
- Avoid large client components when server rendering is sufficient.
- Use semantic HTML, accessible labels, keyboard focus, contrast checks, and usable screen-reader announcements for status changes.

### 15.8 Frontend polish checklist
- Every button, row action, menu, tab, filter, modal, upload, and CTA must work or be explicitly disabled with a reason.
- Every page must support loading, empty, success, error, permission-denied, and not-found states where applicable.
- Prevent layout shift; use skeletons only where they map to real loading regions.
- Forms must show validation near the field and preserve entered values after recoverable errors.
- Tables need mobile behavior that is intentionally designed (responsive cards or controlled horizontal scrolling), not simply overflow hidden.
- Use consistent currency, decimal precision, date/timezone, quantity, and status formatting.
- Confirm destructive and high-impact actions; show a clear result afterward.
- Avoid dead links, placeholder chart series, lorem ipsum, random seeded metrics in production, and fake toast success.
- Provide a clearly labelled demo workspace with believable seeded records for recruiter evaluation. Keep demo data separate from production data.
- Add screenshots and a Playwright flow for the product’s most important journey.

### 15.9 Quality bar
Before declaring the frontend milestone complete, verify at common mobile/tablet/desktop breakpoints, test keyboard-only navigation, inspect console/network errors, verify all interactions and forms, check contrast, and run the main Playwright journey. The product should look intentionally designed—not like a starter template with a new colour palette.

## 16. Environment & Deployment Expectations

- Keep `.env.example` up to date.
- Validate required environment variables on startup and fail with a useful safe error.
- Separate development, test, and production settings.
- Never commit API keys, database passwords, private documents, or production data.
- Provide Docker-based local setup and documented production deployment.
- Include database migration/seed commands.
- Configure allowed origins, secure cookies, HTTPS assumptions, storage settings, email provider, AI provider, queue worker, and logging.
- Add a clear health/readiness endpoint.
- Document provider quotas, estimated cost drivers, and graceful AI-unavailable behavior.
- Do not promise a working external integration until credentials and end-to-end verification are available.

---

## 17. README & Portfolio Deliverables

The finished repo should include:
- Problem and target user
- Product workflow and screenshots
- Architecture diagram
- Tech stack and reason for major choices
- Local setup and `.env` instructions
- Database migration and demo seed instructions
- API documentation link
- Test commands and actual test results
- AI evaluation methodology and measured results
- Security/privacy design notes
- Known limitations and future roadmap
- Demo credentials only for a non-production seeded environment
- Deployment and rollback instructions

For portfolio presentation, demonstrate a complete case from purchase order to verified resolution, not just a dashboard tour.

---

## 18. Instructions to the Coding Agent

You are the senior full-stack engineer responsible for delivering Goodsignal.

1. Read this entire specification and inspect the repository before editing.
2. Treat this file as product requirements; if repository conventions conflict, explain the conflict and preserve working architecture unless a change is necessary.
3. First return a short audit and a phased implementation plan. Do not immediately generate the entire application in one pass.
4. Identify ambiguities, security risks, external credentials, and features that cannot be verified. Ask only blocking questions; otherwise state sensible assumptions.
5. Build end-to-end vertical slices. For each feature, implement UI, API, persistence, authorization, validation, error handling, and tests together.
6. Use real API/database data for implemented screens. Never fake success or hide failures.
7. Keep business rules in tested server-side services, not only in frontend logic or LLM prompts.
8. Verify tenant isolation, supplier scoping, file access, role permissions, and state transitions.
9. Run lint, typecheck, tests, migrations, and production build after meaningful changes. Report exact commands and outcomes.
10. Do not claim “production-ready,” “secure,” “fully tested,” or “deployed” unless the corresponding checks were actually completed; list remaining gaps explicitly.
11. Avoid unnecessary dependencies and premature microservices. Prefer a maintainable modular monolith for the MVP.
12. Preserve existing useful code and design conventions. Do not modify unrelated projects or features.
12a. Implement the Goodsignal visual system and signature screens in Section 15. Inspect existing UI before changes; do not settle for generic admin-template styling.
12b. Do not generate polished static screens that are disconnected from real APIs or backend state; wire each implemented workflow end-to-end.
13. At every milestone, report: **Done**, **Verified**, **Not done / blockers**, **Risks**, and **Next step**.
14. Prioritize a small, complete, reliable workflow over a large set of shallow or broken features.

### First task
Inspect the repository and report:
- Existing structure and conventions
- Recommended architecture based on the current repo
- Data model and state-machine concerns
- Security risks and tenant isolation plan
- Phase 1 implementation plan
- External services/credentials needed

Do not start broad implementation until this audit and plan are presented.
