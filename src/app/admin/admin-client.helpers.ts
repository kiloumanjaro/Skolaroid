/**
 * Pure helpers and threshold constants extracted from admin-client.tsx so the
 * page client stays focused on rendering and side effects.
 */

const numberFormatter = new Intl.NumberFormat('en-US');

/** Inclusive lower bound (days) for the analytics rolling window selector. */
export const MIN_ANALYTICS_WINDOW_DAYS = 7;
/** Inclusive upper bound (days) for the analytics rolling window selector. */
export const MAX_ANALYTICS_WINDOW_DAYS = 365;
/** Default rolling window (days) shown on first load of the analytics tab. */
export const DEFAULT_ANALYTICS_WINDOW_DAYS = 30;
/** Preset shortcut buttons rendered above the analytics window slider. */
export const ANALYTICS_WINDOW_PRESETS = [7, 14, 30, 60, 90, 180, 365] as const;
/** Maximum number of "top X" rows surfaced in any analytics highlight list. */
export const ANALYTICS_HIGHLIGHT_LIMIT = 5;

/** Format an integer count with the US-English grouping locale. */
export function formatCount(value: number): string {
  return numberFormatter.format(value);
}

/** Format a 0–100 number as a fixed-1 percent string (e.g. "12.4%"). */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** Format an ISO date string for display in the admin tables. */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Clamp a window-in-days input to the supported analytics range and round it
 * to a whole number of days.
 */
export function clampAnalyticsWindowDays(days: number): number {
  return Math.min(
    MAX_ANALYTICS_WINDOW_DAYS,
    Math.max(MIN_ANALYTICS_WINDOW_DAYS, Math.round(days))
  );
}
