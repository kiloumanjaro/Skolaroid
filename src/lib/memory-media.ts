interface MemoryMediaSource {
  mediaURLs?: string[] | null;
}

export function getMemoryMediaURLs(
  source: MemoryMediaSource | null | undefined
): string[] {
  return Array.from(
    new Set((source?.mediaURLs ?? []).map((url) => url.trim()).filter(Boolean))
  );
}

export function getPrimaryMemoryMediaURL(
  source: MemoryMediaSource | null | undefined
): string | null {
  return getMemoryMediaURLs(source)[0] ?? null;
}
