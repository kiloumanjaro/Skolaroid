DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Memory'
      AND column_name = 'mediaURL'
  ) THEN
    EXECUTE '
      UPDATE "Memory"
      SET "mediaURLs" = ARRAY["mediaURL"]::TEXT[]
      WHERE "mediaURL" IS NOT NULL
        AND COALESCE(array_length("mediaURLs", 1), 0) = 0
    ';
  END IF;
END $$;

DROP INDEX IF EXISTS "Memory_uploadDate_idx";

ALTER TABLE "Memory"
  DROP COLUMN IF EXISTS "mediaURL",
  DROP COLUMN IF EXISTS "uploadDate";
