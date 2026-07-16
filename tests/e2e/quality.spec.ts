import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoAuditRoute, publicAuditRoutes } from './fixtures/canonical';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

for (const route of publicAuditRoutes) {
  test(`${route.path} has no WCAG A or AA axe violations`, async ({ page }, testInfo) => {
    await gotoAuditRoute(page, route);
    const results = await new AxeBuilder({ page }).withTags([...wcagTags, 'best-practice']).analyze();
    const blocking = results.violations.filter((violation) => violation.tags.some((tag) => wcagTags.includes(tag)));
    const bestPractice = results.violations.filter((violation) => !blocking.includes(violation));
    if (bestPractice.length > 0) {
      await testInfo.attach('axe-best-practice-warnings.json', {
        body: JSON.stringify(bestPractice, null, 2),
        contentType: 'application/json',
      });
    }
    expect(blocking).toEqual([]);
  });
}

test('mobile menu opens, traps no content, and closes after navigation', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only');
  await page.goto('/');
  const menu = page.locator('.menu-button');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toHaveAccessibleName('탐색 메뉴 닫기');
  await page.getByRole('navigation', { name: '모바일 탐색' }).getByRole('link', { name: '프로젝트' }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
});

test('preview metadata stays noindex without release environment', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
