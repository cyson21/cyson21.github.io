import { expect, test } from '@playwright/test';
import { canonicalRoutes, canonicalViewports, gotoCanonicalRoute } from './fixtures/canonical';

test.describe('approved UI canonical visual goldens', () => {
  for (const route of canonicalRoutes) {
    for (const viewport of canonicalViewports) {
      test(`${route.path} at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await gotoCanonicalRoute(page, route.path);

        await expect(page).toHaveScreenshot(`${route.id}-${viewport.width}.png`, {
          fullPage: true,
        });
      });
    }
  }
});
