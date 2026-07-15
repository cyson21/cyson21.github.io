import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/', '/projects/', '/projects/stockrush/', '/projects/enterprise-policy-rag/', '/experience/', '/resume/'];

for (const route of routes) {
  test(`${route} has no horizontal document overflow`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 1);
  });

  test(`${route} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    const results = await new AxeBuilder({ page }).analyze();
    const blocking = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''));
    expect(blocking).toEqual([]);
  });

  test(`${route} keeps visible text readable and the H1 within the editorial scale`, async ({ page }) => {
    await page.goto(route, { waitUntil: 'networkidle' });
    const audit = await page.evaluate(() => {
      const tooSmall = Array.from(document.querySelectorAll<HTMLElement>('body *')).flatMap((element) => {
        if (element.closest('.visually-hidden') || ['SCRIPT', 'STYLE', 'SVG'].includes(element.tagName)) return [];
        const directText = Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent?.trim() ?? '')
          .join(' ')
          .trim();
        if (!directText) return [];
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) return [];
        const size = Number.parseFloat(style.fontSize);
        return size < 13 ? [`${element.tagName.toLowerCase()}.${element.className || '-'}=${size}px:${directText.slice(0, 40)}`] : [];
      });
      const heading = document.querySelector('h1');
      return {
        tooSmall,
        h1Size: heading ? Number.parseFloat(getComputedStyle(heading).fontSize) : 0,
      };
    });
    expect(audit.tooSmall).toEqual([]);
    expect(audit.h1Size).toBeGreaterThanOrEqual(34);
    expect(audit.h1Size).toBeLessThanOrEqual(60);
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
