# Proofline

> Every delivery. Every discrepancy. Proven.

Proofline is an AI-assisted **supplier delivery discrepancy and dispute-resolution** platform.
It matches purchase orders, receiving records and supplier invoices, flags every mismatch with
evidence, and tracks resolution through one auditable workflow.

## Demo

[![Proofline demo](https://i.ytimg.com/vi/QUia9HSccXc/maxresdefault.jpg)](https://youtu.be/QUia9HSccXc)

▶ **Watch the 2-minute demo:** https://youtu.be/QUia9HSccXc

Recorded from the live app across four roles — procurement manager, warehouse receiver, finance
and supplier. Source and rebuild steps: [`proofline-product-demo/`](proofline-product-demo/README.md).

## Live

| | |
| --- | --- |
| Web | https://proofline-inky.vercel.app |
| API | https://proofline-n9bo.onrender.com (OpenAPI at `/docs`) |

## What works

- Multi-tenant auth (HttpOnly session cookies), RBAC, invitations, members
- Suppliers and purchase orders (create / edit / issue / cancel)
- Receiving with partial and damaged records, PO status recompute
- Invoice + deterministic discrepancy engine: quantity, over-delivery, unit price, damaged goods
- Dispute cases: state machine, audit timeline, internal/supplier messages, resolutions
  (propose → approve → verify), supplier portal with its own identity
- Documents in private storage, AI extraction with human confirmation (Gemini)
- In-app + email notifications (BullMQ/Redis, SMTP fallback), reports, dashboard, audit log

## Stack

Next.js 14 (App Router) · NestJS · Prisma / PostgreSQL · Redis + BullMQ · Zod shared contracts · Tailwind

## Run locally

```bash
pnpm install
pnpm dev:infra                            # Postgres, Redis, MinIO, Mailpit
pnpm db:migrate && pnpm db:seed
pnpm --filter @proofline/api start:dev   # :4000
pnpm --filter @proofline/web dev         # :3000
```

Copy `.env.example` to `apps/api/.env` and create `apps/web/.env.local` (`NEXT_PUBLIC_API_URL`,
`API_INTERNAL_URL`, `SESSION_COOKIE_NAME`).

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## Layout

```text
apps/api                 NestJS REST API + Prisma
apps/web                 Next.js App Router frontend
packages/shared-types    Zod schemas shared by both apps
infra/                   docker-compose (Postgres, Redis, MinIO, Mailpit)
e2e/                     Playwright E2E + accessibility tests
docs/                    architecture, data model, API contracts, threat model, deployment
proofline-product-demo/  recorded product demo (video + scripts)
```
