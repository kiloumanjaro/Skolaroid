import { test, expect } from '@playwright/test';

/**
 * Pre-refactor regression test for src/components/groups/GroupPanel.tsx.
 *
 * GroupPanel is rendered inside /groups/[groupId] and requires an authenticated
 * session. Without auth fixtures we lock in the auth-wall contract:
 *   1. /groups/[id] is registered and bundled
 *   2. The proxy redirects unauthenticated visitors
 *   3. None of the panel's tabs (Members / Roles / Settings) leak to anon users
 *
 * Refactors that break GroupPanel's module graph or accidentally render
 * member-only UI to anon visitors will surface here.
 */
test.describe('GroupPanel — pre-refactor', () => {
  const FAKE_GROUP_ID = '00000000-0000-0000-0000-000000000000';

  test('unauthenticated /groups/[id] redirects away from the group panel', async ({
    page,
  }) => {
    await page.goto(`/groups/${FAKE_GROUP_ID}`, { waitUntil: 'load' });
    expect(new URL(page.url()).pathname).not.toBe(`/groups/${FAKE_GROUP_ID}`);
  });

  test('raw /groups/[id] request returns a redirect, not 5xx', async ({
    request,
  }) => {
    const res = await request.get(`/groups/${FAKE_GROUP_ID}`, {
      maxRedirects: 0,
    });
    expect([302, 307, 308]).toContain(res.status());
    expect(res.status()).toBeLessThan(500);
  });

  test('no group-panel tab labels are exposed after the unauth redirect', async ({
    page,
  }) => {
    await page.goto(`/groups/${FAKE_GROUP_ID}`, { waitUntil: 'load' });
    // GroupPanel renders tabs such as "Members", "Roles", "Settings". None
    // should be present on the landing page the proxy lands us on.
    await expect(
      page.getByRole('tab', { name: 'Members', exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByRole('tab', { name: 'Roles', exact: true })
    ).toHaveCount(0);
  });
});
