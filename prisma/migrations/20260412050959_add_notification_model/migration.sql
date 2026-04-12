-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MEMORY_APPROVED', 'MEMORY_REJECTED', 'MEMORY_REMOVED', 'REPORT_RESOLVED', 'REPORT_DISMISSED');

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "targetMemoryId" UUID,
    "targetReportId" UUID,
    "reason" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_targetMemoryId_idx" ON "Notification"("targetMemoryId");

-- CreateIndex
CREATE INDEX "Notification_targetReportId_idx" ON "Notification"("targetReportId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_targetMemoryId_fkey" FOREIGN KEY ("targetMemoryId") REFERENCES "Memory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_targetReportId_fkey" FOREIGN KEY ("targetReportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
