-- DropForeignKey
ALTER TABLE "resolutions" DROP CONSTRAINT "resolutions_proposedByUserId_fkey";

-- AlterTable
ALTER TABLE "case_messages" ADD COLUMN     "authorName" TEXT;

-- AlterTable
ALTER TABLE "resolutions" ADD COLUMN     "proposedByName" TEXT,
ALTER COLUMN "proposedByUserId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "supplier_users" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_sessions" (
    "id" UUID NOT NULL,
    "supplierUserId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "ipAddress" TEXT,

    CONSTRAINT "supplier_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "supplier_users_email_key" ON "supplier_users"("email");

-- CreateIndex
CREATE INDEX "supplier_users_supplierId_idx" ON "supplier_users"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_sessions_tokenHash_key" ON "supplier_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "supplier_sessions_supplierUserId_idx" ON "supplier_sessions"("supplierUserId");

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_proposedByUserId_fkey" FOREIGN KEY ("proposedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_users" ADD CONSTRAINT "supplier_users_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_sessions" ADD CONSTRAINT "supplier_sessions_supplierUserId_fkey" FOREIGN KEY ("supplierUserId") REFERENCES "supplier_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
