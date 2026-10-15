-- CreateEnum
CREATE TYPE "DocumentEntityType" AS ENUM ('PURCHASE_ORDER', 'RECEIPT', 'INVOICE', 'CASE');

-- CreateEnum
CREATE TYPE "DocumentKind" AS ENUM ('PHOTO', 'CHALLAN', 'INVOICE_FILE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('INTERNAL', 'SUPPLIER_VISIBLE');

-- CreateEnum
CREATE TYPE "DocumentExtractionStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'DONE', 'FAILED');

-- CreateTable
CREATE TABLE "documents" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "entityType" "DocumentEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "kind" "DocumentKind" NOT NULL DEFAULT 'OTHER',
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "fileName" TEXT NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "checksum" VARCHAR(64) NOT NULL,
    "uploadedByUserId" UUID,
    "extractionStatus" "DocumentExtractionStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "documents_storageKey_key" ON "documents"("storageKey");

-- CreateIndex
CREATE INDEX "documents_organizationId_idx" ON "documents"("organizationId");

-- CreateIndex
CREATE INDEX "documents_entityType_entityId_idx" ON "documents"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
