import { expect, test } from '@playwright/test';
for (const width of [390, 768, 994, 1440]) {
  test(`professional and personal evidence have separate destinations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/portfolio/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('실무 사례');
    await page.locator('#work-batch > a').click();
    await expect(page).toHaveURL(/cases\.html#work-batch$/);
    await expect(page.locator('.work-case')).toHaveCount(5);
    await expect(page.locator('.case-study-page')).toHaveCount(0);
    await page.goto('/portfolio/#stockrush');
    await expect(page).toHaveURL(/\/projects\/stockrush\/$/);
    await expect(page.locator('#evidence .evidence')).toHaveCount(3);
    await expect(page.locator('#evidence pre').first()).toBeVisible();
    await page.goto('/portfolio/cases.html#member-event-consistency');
    await expect(page).toHaveURL(/\/projects\/member-event-consistency\/$/);
  });
}

test('intermediate-width work overview keeps readable content-sized sections', async ({ page }) => {
  await page.setViewportSize({ width: 994, height: 1079 });
  await page.goto('/portfolio/');
  await page.evaluate(() => document.fonts.ready);
  const fontSizes = await page.locator('.work-list small').evaluateAll(elements => elements.map(e => parseFloat(getComputedStyle(e).fontSize)));
  expect(fontSizes).toHaveLength(5);
  expect(fontSizes.every(size => size >= 16)).toBeTruthy();
  const before = await page.locator('#work').evaluate(e => e.getBoundingClientRect().height);
  await page.setViewportSize({ width: 994, height: 800 });
  expect(Math.abs(await page.locator('#work').evaluate(e => e.getBoundingClientRect().height) - before)).toBeLessThan(2);
});

for (const width of [390, 922]) {
  test(`batch detail presents four ordered steps per flow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 921 });
    await page.goto('/portfolio/cases.html#work-batch');
    const lists = page.locator('#work-batch .batch-flow-steps');
    await expect(lists).toHaveCount(2);
    for (const list of await lists.all()) {
      await expect(list.locator('li')).toHaveCount(4);
      const rects = await list.locator('li').evaluateAll(items => items.map(item => ({ x: item.getBoundingClientRect().x, y: item.getBoundingClientRect().y, bottom: item.getBoundingClientRect().bottom })));
      expect(Math.max(...rects.map(r => r.x)) - Math.min(...rects.map(r => r.x))).toBeLessThan(2);
      for (let i = 1; i < rects.length; i++) expect(rects[i]!.y).toBeGreaterThanOrEqual(rects[i-1]!.bottom - 1);
    }
  });
}
