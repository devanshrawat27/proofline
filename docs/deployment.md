# Deployment (free tier)

Recommended all-free stack: **Vercel** (web), **Render** (API, Docker), **Neon**
(Postgres), **Upstash** (Redis), **Supabase Storage** (S3-compatible files),
**Brevo** (SMTP), **Gemini** (AI). No custom domain required — platform subdomains are fine.

## 1. Database — Neon
Create a project, copy the pooled connection string (with `?sslmode=require`).

## 2. Redis — Upstash
Create a Redis database and use the **TLS** URL (`rediss://default:...@host:6379`).

## 3. Storage — Supabase
Create a project + a **private** bucket (e.g. `proofline-documents`). Settings →
Storage → S3 access keys. Endpoint looks like
`https://<ref>.storage.supabase.co/storage/v1/s3`, `STORAGE_DRIVER=s3`.

## 4. Email — Brevo
Verify a sender address, then use the SMTP relay: `smtp-relay.brevo.com:587` with the
SMTP login + key.

## 5. AI — Gemini
Create a key at https://aistudio.google.com/apikey (`GEMINI_MODEL=gemini-3.1-flash-lite`).

## 6. API — Render
1. New **Web Service** → connect the GitHub repo.
2. Render can read [`render.yaml`](../render.yaml) (Blueprint) or configure manually:
   - Runtime: **Docker**, Dockerfile path `apps/api/Dockerfile`, context `.`
   - Health check path `/ready`
   - The image runs `prisma migrate deploy` then starts the API.
3. Add the secret env vars (marked `sync: false` in `render.yaml`): `DATABASE_URL`,
   `REDIS_URL`, `SESSION_SECRET`, `S3_*`, `SMTP_*`, `GEMINI_API_KEY`.
4. After the first deploy, set `API_PUBLIC_URL` (the Render URL),
   `WEB_PUBLIC_URL` (the Vercel URL) and `CORS_ALLOWED_ORIGINS` (the Vercel URL), then redeploy.

Notes: the free instance sleeps after inactivity (cold start ~40s) and the queue worker runs
in-process (no separate worker needed).

## 7. Web — Vercel
1. Import the repo. **Root Directory: `apps/web`** and enable
   *Include source files outside of the Root Directory in the Build Step*.
2. [`apps/web/vercel.json`](../apps/web/vercel.json) builds `@proofline/shared-types` then the web app.
3. Env vars (Production): `NEXT_PUBLIC_API_URL` = API URL, `API_INTERNAL_URL` = API URL,
   `SESSION_COOKIE_NAME=proofline_session`, `SUPPLIER_COOKIE_NAME=proofline_supplier_session`.

## Seeding demo data (optional)
The seed refuses to run when `NODE_ENV=production`. To load demo data into the hosted DB,
run it locally against the same `DATABASE_URL` with `NODE_ENV=development`:

```bash
pnpm --filter @proofline/api exec prisma migrate deploy
pnpm --filter @proofline/api prisma:seed
```

## End-to-end tests
```bash
pnpm install
pnpm exec playwright install chromium   # or: pnpm test:e2e:install
pnpm test:e2e                            # reuses running servers, or starts them
```

## Production checklist
- `NODE_ENV=production`, strong `SESSION_SECRET`, cookies `secure`.
- Rotate any key that has been shared publicly.
- Never commit `.env`; keep secrets in the platform dashboards.
- Restrict `CORS_ALLOWED_ORIGINS` to the real web origin.
