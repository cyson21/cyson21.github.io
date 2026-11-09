import { expect, test } from '@playwright/test';
const paths = ['/', '/experience/', '/portfolio/', '/portfolio/cases.html', '/projects/', '/projects/stockrush/', '/projects/member-event-consistency/', '/projects/enterprise-policy-rag/', '/projects/ai-gateway/', '/projects/cdc-data-platform/', '/projects/fashion-personalization-platform/', '/404.html'];
for (const width of [390, 994]) {
  test(`page and utility navigation share one vocabulary and placement at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width, height: 921});
    for (const path of paths) {
      await page.goto(path);
      const header = page.locator('.site-chrome-header');
      const footer = page.locator('.site-chrome-footer');
      await expect(header).toHaveCount(1);
      await expect(footer).toHaveCount(1);
      if (width === 390) await header.getByRole('button', {name: '주 메뉴 열기'}).click();
      await expect(header.locator('nav a')).toHaveText(['경력·이력서', '실무 사례', '개인 프로젝트']);
      const destinations = await header.locator('nav a').evaluateAll(links => links.map(link => link.getAttribute('href')));
      expect(destinations).toEqual(['/experience/', '/portfolio/', '/projects/']);
      await expect(footer.getByRole('heading')).toHaveText(['페이지', '제출 자료', '연락·외부 링크']);
      for (const name of ['이력서 PDF 다운로드', '경력기술서 PDF 다운로드']) await expect(footer.getByRole('link', {name, exact: true})).toHaveAttribute('download', /\.pdf$/);
      if (width === 390) { await page.keyboard.press('Escape'); await expect(header.getByRole('button', {name: '주 메뉴 열기'})).toBeFocused(); }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), path).toBeFalsy();
    }
  });
}

// Updating the active TOC entry must never pull the document away from its target.
test('mobile project contents keep the selected section in view', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 921 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const slug of ['stockrush', 'member-event-consistency', 'enterprise-policy-rag', 'ai-gateway', 'cdc-data-platform', 'fashion-personalization-platform']) {
    await page.goto(`/projects/${slug}/`);
    for (const id of ['overview', 'decisions', 'evidence', 'verification', 'scope']) {
      await page.locator(`.project-toc a[href="#${id}"]`).click();
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      await expect(page.locator(`#${id} > h2`)).toBeInViewport();
    }
  }
});
