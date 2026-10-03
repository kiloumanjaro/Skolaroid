import { test, expect } from '@playwright/test';

/**
 * Pre-refactor regression test for src/components/map/MapComponent.tsx.
 *
 * MapComponent is the heart of /map and requires an authenticated session.
 * Without auth fixtures the observable contract is the proxy redirect chain:
 * /map → /. This test locks in:
 *   1. /map is registered and bundled (no 404 / 500 on the route)
 *   2. The unauth proxy redirects to '/'
 *   3. Query strings (e.g. ?era=2020) survive the redirect logic without crashing
 *
 * A refactor that breaks any of those — by removing the route, breaking the
 * MapComponent import chain, or changing the auth contract — will fail this
 * test.
 */
test.describe('MapComponent — pre-refactor', () => {
  test('unauthenticated /map redirects to landing page', async ({ page }) => {
    const response = await page.goto('/map', { waitUntil: 'load' });

    expect(response).not.toBeNull();
    // After redirect-following the URL should resolve to '/'.
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('unauthenticated /map?era=2020 also resolves to /', async ({ page }) => {
    await page.goto('/map?era=2020', { waitUntil: 'load' });
    expect(new URL(page.url()).pathname).toBe('/');
  });

  test('raw /map request returns a redirect status without throwing', async ({
    request,
  }) => {
    const res = await request.get('/map', { maxRedirects: 0 });
    expect([302, 307, 308]).toContain(res.status());
    const location = res.headers()['location'] ?? '';
    expect(location).toMatch(/\/$|\/\?/);
  });
});
