-- CreateEnum
CREATE TYPE "ExtractionReviewStatus" AS ENUM ('PENDING', 'CORRECTED', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "document_extractions" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "provider" VARCHAR(40) NOT NULL,
    "model" VARCHAR(80) NOT NULL,
    "schemaVersion" VARCHAR(20) NOT NULL,
    "rawJson" JSONB NOT NULL,
    "fields" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION,
    "reviewStatus" "ExtractionReviewStatus" NOT NULL DEFAULT 'PENDING',
    "correctedFields" JSONB,
    "error" TEXT,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_extractions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_extractions_documentId_idx" ON "document_extractions"("documentId");

-- CreateIndex
CREATE INDEX "document_extractions_organizationId_idx" ON "document_extractions"("organizationId");

-- AddForeignKey
ALTER TABLE "document_extractions" ADD CONSTRAINT "document_extractions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_extractions" ADD CONSTRAINT "document_extractions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
