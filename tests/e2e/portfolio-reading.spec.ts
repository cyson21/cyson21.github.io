import { expect, test } from '@playwright/test';
for (const width of [390, 768, 994, 1440]) {
  test(`professional and personal evidence have separate destinations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/portfolio/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('실무 사례');
    await page.locator('#work-batch > a').click();
    await expect(page).toHaveURL(/cases\.html#work-batch$/);
    await expect(page.locator('.work-case')).toHaveCount(5);
    await expect(page.locator('#portfolio-intro').getByRole('link', { name: '실무 사례 목록' })).toHaveCount(0);
    await expect(page.locator('.work-case-facts dt').filter({ hasText: /^수정 결과$/ })).toHaveCount(5);
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
  test(`case diagrams keep their sequences and branch outcomes readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 921 });
    await page.goto('/portfolio/cases.html#work-batch');
    const lists = page.locator('#work-batch .case-diagram-track');
    await expect(lists).toHaveCount(2);
    for (const list of await lists.all()) {
      await expect(list.locator('li')).toHaveCount(4);
      const rects = await list.locator('li').evaluateAll(items => items.map(item => ({ x: item.getBoundingClientRect().x, y: item.getBoundingClientRect().y, bottom: item.getBoundingClientRect().bottom })));
      expect(Math.max(...rects.map(r => r.x)) - Math.min(...rects.map(r => r.x))).toBeLessThan(2);
      for (let i = 1; i < rects.length; i++) expect(rects[i]!.y).toBeGreaterThanOrEqual(rects[i-1]!.bottom - 1);
    }
    await expect(page.getByRole('navigation', { name: '실무 사례 바로가기' }).getByRole('listitem')).toHaveCount(5);
    await expect(page.locator('#work-purchase .case-diagram-track').nth(1).locator('li')).toHaveText([
      '요청 상태 저장', '요청 상태 커밋', '별도 트랜잭션에서 결제 호출',
    ]);
    await expect(page.locator('#work-policy .case-diagram-branches')).toContainText('변경 차단');
    await expect(page.locator('#work-policy .case-diagram-branches')).toContainText('같은 이력 조회 기준으로 후속 데이터 갱신');
    const diagramOverflow = await page.locator('.case-diagram').evaluateAll(figures => figures.some(figure => figure.scrollWidth > figure.clientWidth + 1));
    expect(diagramOverflow).toBeFalsy();
  });
}
