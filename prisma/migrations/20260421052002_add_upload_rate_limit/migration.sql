-- CreateTable
CREATE TABLE "UploadRateLimit" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadRateLimit_userId_createdAt_idx" ON "UploadRateLimit"("userId", "createdAt");

