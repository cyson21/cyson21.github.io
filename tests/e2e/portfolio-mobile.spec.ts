import { expect, test } from '@playwright/test';
for (const width of [320, 390]) {
  test(`mobile navigation exposes one personal-project index at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/projects/');
    await expect(page.locator('[data-project-domain]')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.locator('a[href="/projects/fashion-personalization-platform/"]').first().click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fashion Personalization Platform');
    await expect(page.locator('#evidence .evidence')).toHaveCount(3);
  });
}
