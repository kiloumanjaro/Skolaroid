import { test, expect } from '@playwright/test';

/**
 * Pre-refactor regression test for src/components/shared/shell/MainShell.tsx.
 *
 * MainShell wraps every page via app/layout.tsx and renders the persistent
 * sidebar chrome. This test exercises it through the public landing page (`/`)
 * since that's the only surface a fresh, unauthenticated visitor can reach.
 *
 * Asserts current observable behaviour, not desired behaviour. Any future
 * refactor of MainShell that breaks one of these expectations is a regression.
 */
test.describe('MainShell — pre-refactor', () => {
  test('on a non-shell route (/) MainShell passes children through without its own sidebar chrome', async ({
    page,
  }) => {
    await page.goto('/');

    // MainShell only mounts its <aside> sidebar on shell routes
    // (/map, /gallery, /profile, /admin, /about). On '/' it must render
    // children only — locking in the current isShellRoute() pass-through path.
    const brandLink = page.getByRole('link', { name: 'Go to landing page' });
    await expect(brandLink).toHaveCount(0);

    // The pass-through path still has to render its children — the home-client
    // hero heading proves the wrapper didn't suppress them.
    await expect(page.getByText('turn your memories')).toBeVisible();
  });

  test('shows an unauthenticated Sign in entry point', async ({ page }) => {
    await page.goto('/');

    // The home client renders a top-right Sign in button when the visitor is
    // unauthenticated. MainShell sits alongside it; we use it here to confirm
    // the shell-wrapped page rendered without error.
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });
});
