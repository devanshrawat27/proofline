# Proofline

> Every delivery. Every discrepancy. Proven.

AI-assisted **supplier delivery discrepancy and dispute-resolution** platform: match purchase
orders, receiving records and supplier invoices, flag every mismatch with evidence, and resolve
it through one auditable workflow.

## Demo

[![Watch the Proofline demo on YouTube](proofline-product-demo/assets/demo-preview.gif)](https://youtu.be/QUia9HSccXc)

▶ **[Watch the full 2-minute demo on YouTube](https://youtu.be/QUia9HSccXc)** — it also plays
from the site’s **Watch demo** button.

## How it works

1. **Order** — Procurement issues a purchase order: supplier, line items, quantities, unit prices.
2. **Receive** — Warehouse records what actually arrived: received, damaged, delivery reference.
3. **Bill** — Finance adds the supplier invoice and links each line to the purchase order line.
4. **Match** — The engine compares order, receipt and invoice, and flags every mismatch with
   expected vs actual values (quantity, over-delivery, unit price, damaged goods).
5. **Resolve** — A case is opened from an exception and moves through guarded states:
   open → under review → resolution proposed → approved → verified, with a full audit timeline.
6. **Collaborate** — The supplier signs in to their own portal, sees only their own cases, and
   responds there. Every action is recorded against the case.

## Live

| | |
| --- | --- |
| Web | https://proofline-inky.vercel.app |
| API | https://proofline-n9bo.onrender.com (OpenAPI at `/docs`) |

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
