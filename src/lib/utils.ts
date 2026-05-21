import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Derives the era decade (e.g. 2020) from a `batch-XXXX` tag on a memory.
 * Falls back to the decade of `fallbackDate` if no matching tag is found.
 */
export function getEraFromBatchTag(
  tags: { name: string }[],
  fallbackDate?: string | Date | null
): number {
  for (const tag of tags) {
    const match = tag.name.match(/^batch-(\d{4})$/i);
    if (match) {
      return Math.floor(parseInt(match[1], 10) / 10) * 10;
    }
  }
  if (fallbackDate) {
    return Math.floor(new Date(fallbackDate as string).getFullYear() / 10) * 10;
  }
  return 2020;
}

/**
 * Formats a vote count for compact display:
 *   < 1 000        → exact number  (e.g. "42")
 *   1 000–999 999  → one decimal k  (e.g. "1.2k")
 *   ≥ 1 000 000    → one decimal m  (e.g. "3.5m")
 */
export function formatVoteCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}m`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return String(count);
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
