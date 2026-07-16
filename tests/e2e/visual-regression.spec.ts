import { expect, test } from '@playwright/test';
import { canonicalViewports, gotoAuditRoute, publicAuditRoutes } from './fixtures/canonical';

test.describe('approved UI canonical visual goldens', () => {
  for (const route of publicAuditRoutes) {
    for (const viewport of canonicalViewports) {
      test(`${route.path} at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await gotoAuditRoute(page, route);

        await expect(page).toHaveScreenshot(`${route.id}-${viewport.width}.png`, {
          fullPage: true,
        });
      });
    }
  }
});
