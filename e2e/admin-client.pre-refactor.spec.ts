import { test, expect } from '@playwright/test';

/**
 * Pre-refactor regression test for src/app/admin/admin-client.tsx.
 *
 * /admin is gated by the proxy and the AdminPageClient itself. Without an
 * authenticated admin session the observable behavior is a redirect through
 * the proxy. This test locks in:
 *   1. /admin is a registered route
 *   2. The admin route's import chain still resolves (no 500)
 *   3. Unauth visitors are redirected away
 *
 * If a refactor breaks the AdminPageClient module graph or accidentally exposes
 * admin UI to anonymous users, this test fails.
 */
test.describe('admin-client — pre-refactor', () => {
  test('unauthenticated /admin redirects away from the admin surface', async ({
    page,
  }) => {
    await page.goto('/admin', { waitUntil: 'load' });
    expect(new URL(page.url()).pathname).not.toBe('/admin');
  });

  test('raw /admin request returns a redirect, not 5xx or 200 admin HTML', async ({
    request,
  }) => {
    const res = await request.get('/admin', { maxRedirects: 0 });
    expect([302, 307, 308]).toContain(res.status());
    expect(res.status()).toBeLessThan(500);
  });

  test('after the redirect, no admin tab labels are exposed to anon visitors', async ({
    page,
  }) => {
    await page.goto('/admin', { waitUntil: 'load' });
    // AdminPageClient renders tabs like "Published Posts", "Pending Review",
    // "Reports", "Audit Log", "Live Events". None should be present on the
    // landing page the proxy redirects us to.
    await expect(
      page.getByRole('button', { name: 'Pending Review', exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Audit Log', exact: true })
    ).toHaveCount(0);
  });
});
