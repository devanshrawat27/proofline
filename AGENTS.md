# AGENTS.md

Guidance for AI coding agents (and humans) working in this repository.

Goodsignal is an AI-assisted **supplier delivery discrepancy and dispute-resolution**
platform. See [`README.md`](./README.md) and the product blueprint
[`Goodsignal_Product_Blueprint (1).md`](./Goodsignal_Product_Blueprint%20(1).md).

**Core rule:** this is built incrementally. Never claim a feature, test, migration
or deployment works unless it was actually run and verified. Report exact commands
and outcomes, and list remaining gaps.

## Repository layout

```text
apps/
  api/                 # NestJS REST API + Prisma (modular monolith)
  web/                 # Next.js App Router frontend
packages/
  shared-types/        # Zod schemas + TS contracts shared by api and web
  config/              # shared prettier / tsconfig
infra/docker-compose.yml   # Postgres, Redis, MinIO, Mailpit
docs/                      # architecture, data-model, api-contracts, threat-model, test-plan
```

## Commands (run from the repo root)

```bash
pnpm install                 # install (do NOT use --frozen-lockfile locally unless lock is current)
pnpm dev:infra               # start Postgres, Redis, MinIO, Mailpit
pnpm dev:infra:down          # stop infra

pnpm lint                    # ESLint (api) + next lint (web)
pnpm typecheck               # builds shared-types first, then tsc --noEmit per app
pnpm test                    # Jest unit tests
pnpm build                   # nest build + next build

pnpm db:migrate              # prisma migrate dev (api)
pnpm db:seed                 # prisma db seed (demo data)

pnpm --filter @goodsignal/api start:dev   # API on :4000
pnpm --filter @goodsignal/web dev         # web on :3000
```

Always run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` before
declaring work complete, and report the results.

## Environment

- Single documented template: [`.env.example`](./.env.example). Never commit real secrets.
- Local files (gitignored): `apps/api/.env` and `apps/web/.env.local`.
  - `apps/api/.env` — copy of `.env.example`. Loaded via Prisma and `dotenv`.
  - `apps/web/.env.local` — `NEXT_PUBLIC_API_URL`, `API_INTERNAL_URL`, `SESSION_COOKIE_NAME`.
- `env.ts` validates configuration with Zod at startup and fails fast. In production,
  a default `SESSION_SECRET` is rejected.

## Conventions

- TypeScript everywhere; strict mode on. Node ≥ 20.11, pnpm ≥ 10.
- Validation: Zod schemas live in `packages/shared-types` and are reused by both
  apps. Validate on the client for UX **and** authoritatively on the server.
- Backend: NestJS modules under `apps/api/src/modules/*`; shared building blocks
  under `apps/api/src/common/*` (config, prisma, http, errors, auth).
- Frontend: Next.js App Router. Server components fetch via `lib/server-api.ts`
  (forwards the session cookie); client mutations via `lib/api.ts`.
- Styling: Tailwind with design tokens in `apps/web/tailwind.config.ts`. Follow the
  Goodsignal palette (evergreen brand, light-first). No purple/blue gradients.
- Naming: files `kebab-case`; Prisma tables `snake_case` via `@@map`; API paths
  `/api/v1/...`.
- Do **not** add comments unless they explain non-obvious intent.
- Prefer editing existing files; don't introduce new libraries without need.

## Security & multi-tenancy (non-negotiable)

- Every tenant-owned row has `organizationId`; every query must scope by it.
  The authenticated principal carries `organizationId` and `role`.
- Authorization is server-side: global `SessionAuthGuard` + `PermissionsGuard`
  (see `packages/shared-types/src/roles.ts` for the role → permission policy).
  Hiding UI is never the control.
- Sessions: HttpOnly cookie, token stored only as a hash server-side.
- Money: integer minor units or decimal — never binary floating point.
- Errors: use `AppError` / the global filter; never leak stack traces or provider internals.
- Documents are untrusted input; AI/extraction can never approve, send, or mutate records.

## Adding a feature (vertical slice)

For each feature implement **together**: UI, API route(s), persistence, authorization,
validation, error handling and tests. Use real DB data — no fake success, no dead
buttons (mark unfinished actions explicitly disabled with a reason).

When adding a Prisma model: update `schema.prisma`, create a migration, run
`prisma migrate deploy` on a clean DB to verify, and update `docs/data-model.md`
and `docs/api-contracts.md`.

## Current status

Phase 1 (foundation) is complete: tenancy, auth, RBAC, organizations, members,
invitations, health/ready, web shell + landing/auth/overview/members/settings,
demo seed, CI, docs. Next phases: core operations (suppliers, POs, receiving),
document/AI extraction + discrepancy engine, cases + supplier portal, polish.
