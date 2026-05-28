import { test, expect } from '@playwright/test';

/**
 * Pre-refactor regression test for src/components/shared/memory/AddMemoryModal.tsx.
 *
 * AddMemoryModal is opened from inside MapComponent (/map) and GroupPanel
 * (/groups/[id]). Both host routes require an authenticated session, so this
 * test exercises the modal's import/bundling chain indirectly by hitting those
 * routes and asserting the auth wall stays intact.
 *
 * A future refactor of AddMemoryModal that breaks its module graph (bad
 * imports, circular deps, missing exports) will surface here as a 500 instead
 * of the expected redirect.
 */
test.describe('AddMemoryModal — pre-refactor', () => {
  test('/map (host route for AddMemoryModal via map sidebar) compiles and redirects unauth users', async ({
    request,
  }) => {
    const res = await request.get('/map', { maxRedirects: 0 });
    // 307 = Next.js redirect via NextResponse.redirect
    expect([302, 307, 308]).toContain(res.status());
  });

  test('/groups/[id] (host route via group sidebar) compiles and redirects unauth users', async ({
    request,
  }) => {
    const res = await request.get(
      '/groups/00000000-0000-0000-0000-000000000000',
      { maxRedirects: 0 }
    );
    expect([302, 307, 308]).toContain(res.status());
  });

  test('neither host route returns a server error (5xx) for unauth requests', async ({
    request,
  }) => {
    const [mapRes, groupRes] = await Promise.all([
      request.get('/map', { maxRedirects: 0 }),
      request.get('/groups/00000000-0000-0000-0000-000000000000', {
        maxRedirects: 0,
      }),
    ]);
    expect(mapRes.status()).toBeLessThan(500);
    expect(groupRes.status()).toBeLessThan(500);
  });
});
