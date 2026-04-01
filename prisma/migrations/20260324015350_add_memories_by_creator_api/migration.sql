-- CreateTable
CREATE TABLE "MemoryComment" (
    "id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "memoryId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryComment_memoryId_idx" ON "MemoryComment"("memoryId");

-- CreateIndex
CREATE INDEX "MemoryComment_authorId_idx" ON "MemoryComment"("authorId");

-- CreateIndex
CREATE INDEX "MemoryComment_createdAt_idx" ON "MemoryComment"("createdAt");

-- CreateIndex
CREATE INDEX "MemoryComment_deletedAt_idx" ON "MemoryComment"("deletedAt");

-- AddForeignKey
ALTER TABLE "MemoryComment" ADD CONSTRAINT "MemoryComment_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemoryComment" ADD CONSTRAINT "MemoryComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
