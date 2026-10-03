import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test, expect } from '@playwright/test';

const SOURCE_PATH = resolve(
  __dirname,
  '..',
  'src',
  'components',
  'map',
  'MapComponent.tsx'
);

/**
 * Post-refactor structural test for MapComponent. The refactor extracted
 * timing magic numbers (900/1500/300) into named constants in the same file.
 * MapComponent has no separate helpers file (the existing helpers — markers,
 * filters — already live in their own modules), so the assertion is on the
 * file's declared constants and on the JSDoc added to the export.
 */
test.describe('MapComponent — post-refactor source structure', () => {
  test('named timing constants exist in the file', () => {
    const src = readFileSync(SOURCE_PATH, 'utf-8');
    expect(src).toContain('const OVERVIEW_EASE_DURATION_MS = 900');
    expect(src).toContain('const CINEMATIC_FLYTO_DURATION_MS = 1500');
    expect(src).toContain('const POST_STYLE_LOAD_FLYTO_DELAY_MS = 300');
  });

  test('flyTo and easeTo call sites use the named constants, not raw numbers', () => {
    const src = readFileSync(SOURCE_PATH, 'utf-8');
    expect(src).toContain('duration: OVERVIEW_EASE_DURATION_MS');
    expect(src).toContain('duration: CINEMATIC_FLYTO_DURATION_MS');
    expect(src).toContain('POST_STYLE_LOAD_FLYTO_DELAY_MS');
  });

  test('the exported MapComponent carries JSDoc', () => {
    const src = readFileSync(SOURCE_PATH, 'utf-8');
    // The JSDoc block must immediately precede the export.
    expect(src).toMatch(/\/\*\*[\s\S]+?\*\/\s+export function MapComponent\(/);
  });
});
