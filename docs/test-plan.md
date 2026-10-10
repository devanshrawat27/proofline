# Test plan

## Current (Phase 1)

Unit tests live beside their sources (`*.spec.ts`), run with Jest:

```bash
pnpm test
```

Covered today:

- **PasswordService** — hashing produces a non-plaintext value; verification succeeds/fails correctly; malformed hashes fail closed; short passwords rejected.
- **Role/permission policy** — owner is fully privileged; receiver and finance are correctly restricted.
- **PermissionsGuard** — public routes pass; routes without declared permissions pass; missing permission → 403; held permission → allowed.

Current result:

```
Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
```

## Planned

### Unit

- Quantity and money calculations (integer minor units).
- Receipt status and partial-delivery calculations.
- Discrepancy rules and tolerance boundaries.
- Allowed/blocked case transitions.
- AI output schema validation and normalization (Phase 3).

### Integration

- Organization-scoped queries; cross-tenant and cross-supplier denial.
- PO → receipt → invoice matching; duplicate-invoice detection.
- Case creation and state transitions; internal vs supplier-visible visibility.
- Resolution approval and finance verification.
- Queue retry/idempotency; notification delivery status.
- Upload authorization and signed-URL access.

### End-to-end (Playwright)

The full journey from `docs/` specification: owner creates org + supplier → manager
issues a PO for 100 units → receiver records 94 received / 2 damaged with evidence →
invoice uploaded → extraction reviewed and deterministic matcher flags the
discrepancy → manager opens a case and messages the supplier → supplier proposes a
replacement/credit → internal approval + finance verification → case closes and the
dashboard/audit updates → cross-tenant and unrelated-supplier access is denied.

## Acceptance gates (project-wide)

- Lint, typecheck, unit tests, production build pass in CI.
- Migrations apply on a clean database (verified in CI via `migrate deploy`).
- No route/page with fake data in production mode.
- Every interactive element works or is clearly disabled with a reason.
- Loading, empty, error, permission-denied and success states exist.
- `.env.example` contains only safe placeholders.
- Demo dataset is clearly separated from production.
