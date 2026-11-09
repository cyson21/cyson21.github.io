import { expect, test } from '@playwright/test';

test('home keeps the profile link in the shared footer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.locator('.site-chrome-footer a[href="https://github.com/cyson21"]')).toHaveCount(1);
  await expect(page.locator('.hero-actions a[href="https://github.com/cyson21"]')).toHaveCount(0);
});
