import { test, expect } from '@playwright/test';
import {
  ANALYTICS_HIGHLIGHT_LIMIT,
  ANALYTICS_WINDOW_PRESETS,
  DEFAULT_ANALYTICS_WINDOW_DAYS,
  MAX_ANALYTICS_WINDOW_DAYS,
  MIN_ANALYTICS_WINDOW_DAYS,
  clampAnalyticsWindowDays,
  formatCount,
  formatPercent,
} from '../src/app/admin/admin-client.helpers';

/**
 * Post-refactor structural test for admin-client. Asserts that helpers and
 * threshold constants extracted into admin-client.helpers.ts produce the same
 * outputs as the inline versions they replaced.
 */
test.describe('admin-client — post-refactor helpers', () => {
  test('analytics window thresholds keep their published values', () => {
    expect(MIN_ANALYTICS_WINDOW_DAYS).toBe(7);
    expect(MAX_ANALYTICS_WINDOW_DAYS).toBe(365);
    expect(DEFAULT_ANALYTICS_WINDOW_DAYS).toBe(30);
    expect(ANALYTICS_HIGHLIGHT_LIMIT).toBe(5);
    expect(ANALYTICS_WINDOW_PRESETS).toEqual([7, 14, 30, 60, 90, 180, 365]);
  });

  test('clampAnalyticsWindowDays clamps below the floor', () => {
    expect(clampAnalyticsWindowDays(0)).toBe(MIN_ANALYTICS_WINDOW_DAYS);
    expect(clampAnalyticsWindowDays(-50)).toBe(MIN_ANALYTICS_WINDOW_DAYS);
  });

  test('clampAnalyticsWindowDays clamps above the ceiling', () => {
    expect(clampAnalyticsWindowDays(1000)).toBe(MAX_ANALYTICS_WINDOW_DAYS);
  });

  test('clampAnalyticsWindowDays rounds and keeps valid values', () => {
    expect(clampAnalyticsWindowDays(45.4)).toBe(45);
    expect(clampAnalyticsWindowDays(45.6)).toBe(46);
    expect(clampAnalyticsWindowDays(30)).toBe(30);
  });

  test('formatCount uses US grouping locale', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(1234)).toBe('1,234');
    expect(formatCount(1_000_000)).toBe('1,000,000');
  });

  test('formatPercent renders one decimal with a percent suffix', () => {
    expect(formatPercent(0)).toBe('0.0%');
    expect(formatPercent(12.34)).toBe('12.3%');
    expect(formatPercent(99.95)).toBe('100.0%');
  });
});
