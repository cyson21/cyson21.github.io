import { expect, test } from '@playwright/test';

const mobileViewports = [
  { width: 320, height: 800 },
  { width: 390, height: 844 },
] as const;

for (const viewport of mobileViewports) {
  test(`integrated portfolio serializes dense case-study flows at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const response = await page.goto('/portfolio/', { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();

    const viewportMetrics = await page.evaluate(() => {
      const root = document.documentElement;
      const metrics = (selector: string) => Array.from(document.querySelectorAll<HTMLElement>(selector)).map((flow) => {
        const items = Array.from(flow.children).filter((child): child is HTMLElement => child instanceof HTMLElement);
        return {
          count: items.length,
          rows: new Set(items.map((item) => Math.round(item.getBoundingClientRect().top))).size,
          minWidth: Math.min(...items.map((item) => item.getBoundingClientRect().width)),
        };
      });

      return {
        clientWidth: root.clientWidth,
        scrollWidth: root.scrollWidth,
        architecture: metrics('.case-study-page .case-architecture-flow'),
        stackColumns: Array.from(document.querySelectorAll<HTMLElement>('.case-study-page .case-rail .stack-grid'))
          .map((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length),
      };
    });

    expect(viewportMetrics.scrollWidth).toBeLessThanOrEqual(viewportMetrics.clientWidth + 1);
    expect(viewportMetrics.architecture.length).toBeGreaterThan(0);
    expect(viewportMetrics.stackColumns.length).toBeGreaterThan(0);
    expect(viewportMetrics.architecture.every(({ count, rows, minWidth }) => rows === count && minWidth >= 200)).toBeTruthy();
    expect(viewportMetrics.stackColumns.every((columns) => columns === 1)).toBeTruthy();
  });
}
