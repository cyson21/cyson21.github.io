import { expect, test } from '@playwright/test';

test('home removes the duplicate GitHub call-to-action while keeping global navigation', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.locator('header .desktop-nav .github-link')).toHaveCount(1);
  await expect(page.locator('.hero-actions a[href="https://github.com/cyson21"]')).toHaveCount(0);
});
