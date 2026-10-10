# Architecture

## Shape

Proofline is a **modular monolith**. One deployable API process hosts cohesive
modules; a background worker will be added later for document processing and
email. This favours a small, complete, reliable workflow over microservices.

```text
Browser (Next.js App Router)
        │  fetch (credentials: include -> HttpOnly session cookie)
        ▼
NestJS REST API  (/api/v1/*)
  ├─ AuthModule          sessions, password hashing, guards
  ├─ OrganizationsModule org profile
  ├─ MembersModule       membership + invitations
  └─ HealthModule        /health, /ready
        │
        ├─ PostgreSQL (Prisma)
        ├─ Redis (planned: BullMQ)
        └─ S3/MinIO (planned: private documents)
```

## Request lifecycle

1. `helmet` security headers.
2. `cookie-parser`.
3. `requestIdMiddleware` — attaches `x-request-id`.
4. Origin check for non-idempotent methods (CSRF defence in depth).
5. CORS with an origin allowlist and credentials.
6. **Global guards** (in order):
   - `SessionAuthGuard` — resolves the session cookie to an `AuthenticatedUser`; routes marked `@Public()` skip it.
   - `PermissionsGuard` — enforces `@RequirePermissions(...)` against the role policy.
7. Controller (Zod-validated input via `ZodValidationPipe`).
8. `ApiExceptionFilter` — consistent error body, no leaked internals.

## Tenancy

Every tenant-owned row carries `organizationId`. The authenticated user carries a
resolved `organizationId` and `role`. Services scope queries by the caller's
organization; controllers never accept an organization id from the client for
tenant data. Cross-tenant and cross-supplier negative tests are part of the
test plan.

## Configuration

`src/common/config/env.ts` validates `process.env` with Zod at startup and fails
fast with a safe message listing the offending variable names only. In production,
`SESSION_SECRET` must be non-default or startup is refused.

## Frontend

- Next.js App Router; server components fetch via a cookie-forwarding helper
  (`lib/server-api.ts`), client mutations via `lib/api.ts`.
- An edge `middleware.ts` does a cheap cookie-presence redirect; authoritative
  validation is always server-side.
- Design tokens live in `tailwind.config.ts` (evergreen brand, light-first).
