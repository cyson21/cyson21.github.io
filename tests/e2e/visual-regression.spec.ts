import { expect, test } from '@playwright/test';
import { gotoAuditRoute, visualAuditRoutes, visualViewports } from './fixtures/canonical';

test.describe('approved UI canonical visual goldens', () => {
  for (const route of visualAuditRoutes) {
    for (const viewport of visualViewports) {
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
