/**
 * Stateless helpers and small JSX glue extracted from MainShell.tsx so the
 * main file can focus on layout, providers, and effects.
 */

import {
  Bell,
  CheckCircle,
  FileCheck,
  FileMinus,
  Trash2,
  XCircle,
} from 'lucide-react';

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

/** Routes that get MainShell's persistent sidebar chrome. */
export const SHELL_ROUTES = [
  '/map',
  '/gallery',
  '/profile',
  '/admin',
  '/about',
];

/**
 * Returns true when the given pathname falls under one of MainShell's
 * sidebar-chrome routes (exact match or nested subroute).
 */
export function isShellRoute(pathname: string): boolean {
  return SHELL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/** Map a notification type code to the small status icon used in the menu. */
export function getNotificationIcon(type: string) {
  switch (type) {
    case 'MEMORY_APPROVED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'MEMORY_REJECTED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'MEMORY_REMOVED':
      return <Trash2 className="h-4 w-4 text-red-600" />;
    case 'REPORT_RESOLVED':
      return <FileCheck className="h-4 w-4 text-blue-500" />;
    case 'REPORT_DISMISSED':
      return <FileMinus className="h-4 w-4 text-gray-500" />;
    default:
      return <Bell className="h-4 w-4 text-gray-500" />;
  }
}

/**
 * Format a notification timestamp as a short relative string (e.g. "5m ago",
 * "3d ago") for items younger than a week, otherwise as a locale date.
 */
export function formatNotificationTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / MINUTE_MS);
  const diffHours = Math.floor(diffMs / HOUR_MS);
  const diffDays = Math.floor(diffMs / DAY_MS);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
