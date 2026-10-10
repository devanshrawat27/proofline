# Proofline

> Every delivery. Every discrepancy. Proven.

Proofline is an AI-assisted **supplier delivery discrepancy and dispute-resolution**
platform for small and mid-sized wholesalers, distributors and procurement teams.
It compares what was ordered (purchase order), what actually arrived (receiving
records) and what was billed (supplier invoice), gathers evidence for every
mismatch, and tracks resolution through one auditable workflow.

- **AI assists** document extraction and explanation.
- **Deterministic code** controls all calculations, eligibility, permissions and approvals.
- **Humans decide** — the platform preserves evidence and never silently assumes supplier fault.

> “Production-ready” is a target, not a claim. This repository is being built
> incrementally. See **Status** and **Known limitations** below for exactly what is
> implemented and verified versus planned.

---

## Status (Phase 1 — Foundation)

### Implemented and verified

- pnpm monorepo: `apps/api` (NestJS), `apps/web` (Next.js App Router), `packages/shared-types` (Zod contracts), `packages/config`.
- PostgreSQL schema + Prisma migration for identity and tenancy: `Organization`, `User`, `OrganizationMember`, `Session`, `Invitation`.
- Authentication with server-side sessions in **HttpOnly cookies** (bcrypt password hashing, generic auth errors to reduce enumeration).
- Multi-tenant RBAC: role → permission policy (`OWNER`, `PROCUREMENT_MANAGER`, `RECEIVER`, `FINANCE`) enforced by **server-side guards** on every protected route.
- Organizations: read / update. Members: list, invite, accept invitation.
- Health (`/health`) and readiness (`/ready`) endpoints; request IDs; standard error shape; Helmet security headers; CORS allowlist; Origin check on state-changing requests.
- Proofline design system (light-first evergreen theme), app shell, landing page, sign-in / sign-up, overview, members, settings.
- Clearly-labelled **sample** organization seed (`isDemo = true`), separate from production data.
- CI workflow: install → prisma generate → `migrate deploy` on a clean DB → lint → typecheck → build → test.
- Unit tests (11 passing) for password hashing and the role/permission policy.

### Not implemented yet (later phases)

- Suppliers, Purchase Orders, Receiving, Documents/AI extraction, Discrepancy matching, Dispute cases, Resolutions, Notifications, Reports, Audit log UI.
- Email delivery, queue/worker, object storage wiring, AI (Gemini) extraction.
- Integration/E2E (Playwright) tests. See `docs/test-plan.md`.

---

## Tech stack

| Area | Choice |
| --- | --- |
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Backend | NestJS REST API, modular monolith |
| Database | PostgreSQL + Prisma |
| Auth | Self-hosted sessions (HttpOnly cookie) + bcrypt |
| Validation | Zod shared schemas (client + authoritative server) |
| Local infra | Docker Compose: Postgres, Redis, MinIO, Mailpit |
| CI | GitHub Actions |
| AI extraction (planned) | Provider-agnostic interface, default Google Gemini |

Rationale: a maintainable modular monolith with real server-side business rules,
avoiding premature microservices. See `docs/architecture.md`.

---

## Prerequisites

- Node.js ≥ 20.11
- pnpm ≥ 10 (`corepack enable`)
- Docker (for local Postgres/Redis/MinIO/Mailpit)

---

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start local infrastructure (Postgres, Redis, MinIO, Mailpit)
pnpm dev:infra

# 3. Create environment files
#    Copy the template to the API and web app:
copy .env.example apps\api\.env          # Windows
# cp .env.example apps/api/.env          # macOS / Linux
#    Create apps/web/.env.local with:
#      NEXT_PUBLIC_API_URL=http://localhost:4000
#      API_INTERNAL_URL=http://localhost:4000
#      SESSION_COOKIE_NAME=proofline_session

# 4. Apply database migrations and seed the sample data
pnpm db:migrate
pnpm db:seed

# 5. Run the apps (in two terminals)
pnpm --filter @proofline/api start:dev   # http://localhost:4000
pnpm --filter @proofline/web dev         # http://localhost:3000
```

### Sample accounts (non-production seeded environment only)

Organization: **Meridian Distributors** — password for all: `Proofline@123`

| Role | Email |
| --- | --- |
| Owner | `owner@meridian.local` |
| Procurement Manager | `manager@meridian.local` |
| Receiver | `receiver@meridian.local` |
| Finance | `finance@meridian.local` |

> These accounts exist only for the seeded, `isDemo` organization and must never be used in production.

---

## Environment variables

All variables are documented in [`.env.example`](./.env.example). Key ones:

- `DATABASE_URL` — PostgreSQL connection string.
- `SESSION_SECRET` — 32+ byte random secret (**required in production**; startup fails otherwise).
- `CORS_ALLOWED_ORIGINS` — comma-separated allowlist.
- `GEMINI_API_KEY` / `AI_PROVIDER` — AI extraction (used in a later phase).
- `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL` — web → API URLs.

Secrets are never committed. `.env`, `.env.*` and `.env.local` are gitignored.

---

## Database

```bash
pnpm db:migrate          # prisma migrate dev (create/apply migrations)
pnpm db:seed             # prisma db seed (loads apps/api/.env)
pnpm --filter @proofline/api prisma:deploy   # apply migrations in CI/production
```

Migrations live in `apps/api/prisma/migrations`.

---

## Checks

```bash
pnpm lint        # ESLint (api) + next lint (web)
pnpm typecheck   # builds shared-types, then tsc --noEmit for each app
pnpm test        # Jest unit tests
pnpm build       # nest build + next build
```

### Verified locally

```
$ pnpm typecheck   →  api: Done, web: Done
$ pnpm lint        →  No ESLint warnings or errors
$ pnpm build       →  Next.js compiled successfully, nest build Done
$ pnpm test        →  Test Suites: 2 passed; Tests: 11 passed
$ prisma migrate deploy on a clean DB  →  applied 1 migration
```

API smoke test (against the seeded DB): `/health` and `/ready` OK; unauthenticated
`/api/v1/auth/me` → 401; owner login → `/me`, `/members` (4), `/organization`;
invite created a token; receiver → `/members` → 403. Signup created an isolated
tenant (1 member); invitation acceptance created a user, session and membership.

---

## Repository structure

```text
apps/
  api/                 # NestJS REST API + Prisma
  web/                 # Next.js frontend
packages/
  shared-types/        # Zod schemas and contracts shared by api + web
  config/              # shared prettier / tsconfig
infra/
  docker-compose.yml   # Postgres, Redis, MinIO, Mailpit
docs/
  architecture.md  data-model.md  api-contracts.md  threat-model.md  test-plan.md
```

---

## Known limitations

- No supplier, PO, receiving, document, discrepancy, case or resolution features yet.
- Email, queues, object storage and AI extraction are not wired (infra exists in Compose).
- No integration/E2E tests yet; the CI pipeline runs unit tests.
- bcrypt is used for portability; Argon2id is a candidate hardening step.
- The name “Proofline” has had only a lightweight web check — **not** trademark,
  domain or company-name clearance.

## Roadmap

1. **Phase 2** — Suppliers CRUD, purchase orders (versioned terms), receiving with partial/damaged quantities and attachments, real dashboard queries.
2. **Phase 3** — Private uploads, background extraction worker (Gemini), review UI, deterministic matching and discrepancy rules.
3. **Phase 4** — Dispute case lifecycle, timeline with internal/supplier-visible messages, supplier portal, resolution approval + finance verification.
4. **Phase 5** — Notifications, reports, audit log, accessibility polish, Playwright end-to-end flow, security review, deployment/rollback docs.
