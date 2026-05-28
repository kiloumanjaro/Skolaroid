import { test, expect } from '@playwright/test';
import {
  SHELL_ROUTES,
  formatNotificationTime,
  isShellRoute,
} from '../src/components/shared/shell/MainShell.helpers';

/**
 * Post-refactor structural test for MainShell. Asserts that the helpers
 * extracted into MainShell.helpers.tsx exist and behave identically to the
 * inline versions they replaced.
 */
test.describe('MainShell — post-refactor helpers', () => {
  test('SHELL_ROUTES enumerates the sidebar-chrome routes', () => {
    expect(SHELL_ROUTES).toEqual([
      '/map',
      '/gallery',
      '/profile',
      '/admin',
      '/about',
    ]);
  });

  test('isShellRoute matches exact and nested shell routes', () => {
    expect(isShellRoute('/map')).toBe(true);
    expect(isShellRoute('/gallery')).toBe(true);
    expect(isShellRoute('/profile/edit')).toBe(true);
    expect(isShellRoute('/admin/audit')).toBe(true);
  });

  test('isShellRoute rejects non-shell routes', () => {
    expect(isShellRoute('/')).toBe(false);
    expect(isShellRoute('/onboarding')).toBe(false);
    expect(isShellRoute('/invite')).toBe(false);
    // Substring-only matches must NOT count — '/gallery2' is not '/gallery/...'
    expect(isShellRoute('/gallery2')).toBe(false);
  });

  test('formatNotificationTime renders relative buckets for recent times', () => {
    const now = Date.now();
    const ago = (ms: number) => new Date(now - ms).toISOString();
    expect(formatNotificationTime(ago(0))).toBe('Just now');
    expect(formatNotificationTime(ago(5 * 60_000))).toBe('5m ago');
    expect(formatNotificationTime(ago(3 * 3_600_000))).toBe('3h ago');
    expect(formatNotificationTime(ago(2 * 86_400_000))).toBe('2d ago');
  });

  test('formatNotificationTime falls back to locale date past 7 days', () => {
    const old = new Date(Date.now() - 30 * 86_400_000);
    expect(formatNotificationTime(old.toISOString())).toBe(
      old.toLocaleDateString()
    );
  });
});
