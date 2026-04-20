-- Reconcile migration history for Memory.mediaURLs.
-- Some environments already have this column, so this migration is idempotent.
ALTER TABLE "Memory"
ADD COLUMN IF NOT EXISTS "mediaURLs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill empty arrays from legacy single mediaURL where available.
UPDATE "Memory"
SET "mediaURLs" = ARRAY["mediaURL"]::TEXT[]
WHERE "mediaURL" IS NOT NULL
  AND COALESCE(array_length("mediaURLs", 1), 0) = 0;
