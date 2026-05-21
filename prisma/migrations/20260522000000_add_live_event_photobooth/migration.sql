-- AlterTable: add liveEventId to Memory
ALTER TABLE "Memory" ADD COLUMN "liveEventId" UUID;

-- CreateTable: LiveEvent
CREATE TABLE "LiveEvent" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "bannerColor" VARCHAR(7) NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorId" UUID NOT NULL,
    "locationId" UUID NOT NULL,

    CONSTRAINT "LiveEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PhotoboothDraft
CREATE TABLE "PhotoboothDraft" (
    "id" UUID NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "photoPath" VARCHAR(500) NOT NULL,
    "caption" VARCHAR(500),
    "tags" JSONB NOT NULL DEFAULT '[]',
    "eventId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoboothDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: LiveEvent
CREATE INDEX "LiveEvent_isActive_idx" ON "LiveEvent"("isActive");
CREATE INDEX "LiveEvent_startAt_endAt_idx" ON "LiveEvent"("startAt", "endAt");
CREATE INDEX "LiveEvent_creatorId_idx" ON "LiveEvent"("creatorId");
CREATE INDEX "LiveEvent_locationId_idx" ON "LiveEvent"("locationId");

-- CreateIndex: PhotoboothDraft
CREATE UNIQUE INDEX "PhotoboothDraft_token_key" ON "PhotoboothDraft"("token");
CREATE INDEX "PhotoboothDraft_token_idx" ON "PhotoboothDraft"("token");
CREATE INDEX "PhotoboothDraft_eventId_idx" ON "PhotoboothDraft"("eventId");
CREATE INDEX "PhotoboothDraft_expiresAt_idx" ON "PhotoboothDraft"("expiresAt");

-- CreateIndex: Memory.liveEventId
CREATE INDEX "Memory_liveEventId_idx" ON "Memory"("liveEventId");

-- AddForeignKey: Memory.liveEventId -> LiveEvent
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_liveEventId_fkey" FOREIGN KEY ("liveEventId") REFERENCES "LiveEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: LiveEvent.creatorId -> User
ALTER TABLE "LiveEvent" ADD CONSTRAINT "LiveEvent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: LiveEvent.locationId -> Location
ALTER TABLE "LiveEvent" ADD CONSTRAINT "LiveEvent_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: PhotoboothDraft.eventId -> LiveEvent
ALTER TABLE "PhotoboothDraft" ADD CONSTRAINT "PhotoboothDraft_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "LiveEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
