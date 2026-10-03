import { test, expect } from '@playwright/test';
import {
  MEMORY_MEDIA_UPLOAD_ENDPOINT,
  formatFileSize,
  generateId,
} from '../src/components/shared/memory/AddMemoryModal.helpers';

/**
 * Post-refactor structural test for AddMemoryModal. Asserts that the helpers
 * extracted into AddMemoryModal.helpers.ts exist and produce the same outputs
 * as the inline versions they replaced.
 */
test.describe('AddMemoryModal — post-refactor helpers', () => {
  test('MEMORY_MEDIA_UPLOAD_ENDPOINT is the documented backend path', () => {
    expect(MEMORY_MEDIA_UPLOAD_ENDPOINT).toBe(
      '/api/storage/upload-memory-media'
    );
  });

  test('generateId returns a 10-char base36 string', () => {
    const id = generateId();
    expect(id).toHaveLength(10);
    expect(id).toMatch(/^[0-9a-z]{10}$/);
  });

  test('generateId is non-deterministic across calls', () => {
    const a = generateId();
    const b = generateId();
    // Astronomically unlikely to collide; if this ever fails we have a bug.
    expect(a).not.toBe(b);
  });

  test('formatFileSize uses B / KB / MB thresholds', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});
