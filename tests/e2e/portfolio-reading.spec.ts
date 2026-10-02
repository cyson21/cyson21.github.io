import { expect, test } from '@playwright/test';
for (const width of [320, 390, 768, 1440]) {
  test(`integrated evidence stays readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/portfolio/');
    const metrics = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - innerWidth,
      rows: Array.from(document.querySelectorAll<HTMLElement>('.summary-project-card')).map(card => ({
        width: card.getBoundingClientRect().width,
        facts: Array.from(card.querySelectorAll<HTMLElement>('dd')).map(e => ({
          width: e.getBoundingClientRect().width,
          clipped: e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1,
        })),
      })),
    }));
    expect(metrics.overflow).toBeLessThanOrEqual(1);
    expect(metrics.rows).toHaveLength(6);
    for (const row of metrics.rows) {
      expect(row.width).toBeGreaterThan(250);
      expect(row.facts).toHaveLength(3);
      for (const fact of row.facts) {
        expect(fact.width).toBeGreaterThan(200);
        expect(fact.clipped).toBe(false);
      }
    }
    await page.getByRole('navigation', { name: '통합 포트폴리오 목차' }).getByRole('link', { name: '실무 문제 해결' }).click();
    await expect(page).toHaveURL(/#work-cases$/);
    await expect(page.locator('#work-cases .work-case')).toHaveCount(5);
    await expect(page.locator('#work-policy h3')).toBeVisible();
    await page.locator('#work-policy').getByRole('link', { name: 'StockRush', exact: true }).click();
    await expect(page).toHaveURL(/#stockrush$/);
    await page.getByRole('navigation', { name: '통합 포트폴리오 목차' }).getByRole('link', { name: '문제와 검증 결과' }).click();
    await expect(page).toHaveURL(/#portfolio-results$/);
    await page.locator('#portfolio-results .summary-project-card').getByRole('link', { name: 'StockRush', exact: true }).click();
    await expect(page).toHaveURL(/#stockrush$/);
    await expect(page.locator('#stockrush .case-code-snippet')).toBeVisible();
  });
}
