# Proofline API (NestJS) production image — pnpm monorepo.
FROM node:20-bookworm-slim

# Prisma needs OpenSSL at runtime.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app

# Install all workspace dependencies (lockfile-pinned).
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/config/package.json packages/config/package.json
RUN pnpm install --frozen-lockfile

# Build shared contracts, generate the Prisma client and compile the API.
COPY . .
RUN pnpm --filter @proofline/shared-types build \
  && pnpm --filter @proofline/api exec prisma generate \
  && pnpm --filter @proofline/api build

ENV NODE_ENV=production
EXPOSE 4000

# Migrate (with retries for a cold serverless DB) then start.
CMD ["sh", "-c", "attempt=1; while true; do pnpm --filter @proofline/api exec prisma migrate deploy && break; if [ $attempt -ge 6 ]; then echo 'migrate deploy failed after retries'; exit 1; fi; attempt=$((attempt+1)); echo 'retrying migrate in 5s...'; sleep 5; done; exec node apps/api/dist/main.js"]
