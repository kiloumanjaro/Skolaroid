-- CreateEnum
CREATE TYPE "MemoryModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReportState" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ModerationActionType" AS ENUM ('MEMORY_APPROVED', 'MEMORY_REJECTED', 'MEMORY_REMOVED', 'MEMORY_RESTORED', 'REPORT_OPENED', 'REPORT_RESOLVED', 'REPORT_DISMISSED');

-- CreateEnum
CREATE TYPE "ModerationTargetType" AS ENUM ('MEMORY', 'REPORT');

-- AlterTable
ALTER TABLE "Memory" ADD COLUMN     "moderationStatus" "MemoryModerationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "PrivateGroup" ADD COLUMN     "message" VARCHAR(300);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "state" "ReportState" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "reporterId" UUID NOT NULL,
    "memoryId" UUID NOT NULL,
    "resolvedById" UUID,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationActionLog" (
    "id" UUID NOT NULL,
    "adminId" UUID NOT NULL,
    "action" "ModerationActionType" NOT NULL,
    "targetType" "ModerationTargetType" NOT NULL,
    "targetMemoryId" UUID,
    "targetReportId" UUID,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_state_idx" ON "Report"("state");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_memoryId_idx" ON "Report"("memoryId");

-- CreateIndex
CREATE INDEX "Report_resolvedById_idx" ON "Report"("resolvedById");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "ModerationActionLog_adminId_idx" ON "ModerationActionLog"("adminId");

-- CreateIndex
CREATE INDEX "ModerationActionLog_action_idx" ON "ModerationActionLog"("action");

-- CreateIndex
CREATE INDEX "ModerationActionLog_targetType_idx" ON "ModerationActionLog"("targetType");

-- CreateIndex
CREATE INDEX "ModerationActionLog_targetMemoryId_idx" ON "ModerationActionLog"("targetMemoryId");

-- CreateIndex
CREATE INDEX "ModerationActionLog_targetReportId_idx" ON "ModerationActionLog"("targetReportId");

-- CreateIndex
CREATE INDEX "ModerationActionLog_createdAt_idx" ON "ModerationActionLog"("createdAt");

-- CreateIndex
CREATE INDEX "Memory_moderationStatus_idx" ON "Memory"("moderationStatus");

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationActionLog" ADD CONSTRAINT "ModerationActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationActionLog" ADD CONSTRAINT "ModerationActionLog_targetMemoryId_fkey" FOREIGN KEY ("targetMemoryId") REFERENCES "Memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationActionLog" ADD CONSTRAINT "ModerationActionLog_targetReportId_fkey" FOREIGN KEY ("targetReportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
