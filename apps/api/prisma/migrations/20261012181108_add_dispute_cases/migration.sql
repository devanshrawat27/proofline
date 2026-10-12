-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'SENT_TO_SUPPLIER', 'SUPPLIER_RESPONDED', 'RESOLUTION_PROPOSED', 'AWAITING_INTERNAL_APPROVAL', 'RESOLUTION_IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CasePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MessageVisibility" AS ENUM ('INTERNAL', 'SUPPLIER_VISIBLE');

-- CreateEnum
CREATE TYPE "ResolutionType" AS ENUM ('REPLACEMENT', 'CREDIT_NOTE', 'PARTIAL_CREDIT', 'REFUND', 'RETURN', 'NO_ADJUSTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ResolutionStatus" AS ENUM ('PROPOSED', 'APPROVED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "dispute_cases" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "assigneeUserId" UUID,
    "caseNumber" VARCHAR(20) NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "CasePriority" NOT NULL DEFAULT 'NORMAL',
    "summary" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispute_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_case_items" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "discrepancyId" UUID NOT NULL,

    CONSTRAINT "dispute_case_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_messages" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "authorUserId" UUID,
    "visibility" "MessageVisibility" NOT NULL DEFAULT 'INTERNAL',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_events" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "actorUserId" UUID,
    "type" VARCHAR(40) NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolutions" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "type" "ResolutionType" NOT NULL,
    "status" "ResolutionStatus" NOT NULL DEFAULT 'PROPOSED',
    "proposedAmountMinor" INTEGER,
    "reference" VARCHAR(120),
    "notes" TEXT,
    "proposedByUserId" UUID NOT NULL,
    "approvedByUserId" UUID,
    "verifiedByUserId" UUID,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dispute_cases_organizationId_idx" ON "dispute_cases"("organizationId");

-- CreateIndex
CREATE INDEX "dispute_cases_organizationId_status_idx" ON "dispute_cases"("organizationId", "status");

-- CreateIndex
CREATE INDEX "dispute_cases_supplierId_idx" ON "dispute_cases"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_cases_organizationId_caseNumber_key" ON "dispute_cases"("organizationId", "caseNumber");

-- CreateIndex
CREATE INDEX "dispute_case_items_caseId_idx" ON "dispute_case_items"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "dispute_case_items_caseId_discrepancyId_key" ON "dispute_case_items"("caseId", "discrepancyId");

-- CreateIndex
CREATE INDEX "case_messages_caseId_idx" ON "case_messages"("caseId");

-- CreateIndex
CREATE INDEX "case_events_caseId_idx" ON "case_events"("caseId");

-- CreateIndex
CREATE INDEX "resolutions_caseId_idx" ON "resolutions"("caseId");

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_cases" ADD CONSTRAINT "dispute_cases_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_case_items" ADD CONSTRAINT "dispute_case_items_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "dispute_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_case_items" ADD CONSTRAINT "dispute_case_items_discrepancyId_fkey" FOREIGN KEY ("discrepancyId") REFERENCES "discrepancies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_messages" ADD CONSTRAINT "case_messages_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "dispute_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_messages" ADD CONSTRAINT "case_messages_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "dispute_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "dispute_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_proposedByUserId_fkey" FOREIGN KEY ("proposedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
