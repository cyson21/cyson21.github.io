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
      await expect(footer.locator('a[download]')).toHaveCount(1);
      await expect(footer.getByRole('link', {name: '이력서 PDF 다운로드', exact: true})).toHaveAttribute('download', /\.pdf$/);
      await expect(page.locator('a[href$="/career-description.pdf"]')).toHaveCount(0);
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

test('project results stay with the verification methods instead of positional code pairing', async ({ page }) => {
  for (const slug of ['stockrush', 'member-event-consistency', 'enterprise-policy-rag', 'ai-gateway', 'cdc-data-platform', 'fashion-personalization-platform']) {
    await page.goto(`/projects/${slug}/`);
    await expect(page.locator('#evidence .evidence')).toHaveCount(3);
    await expect(page.locator('#evidence .test-result')).toHaveCount(0);
    await expect(page.locator('#verification .verification-result > .verification-outcome')).toHaveCount(slug === 'enterprise-policy-rag' ? 5 : 3);
  }
});

for (const width of [390, 994]) {
  test(`reviewed evidence sources and execution scope stay readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({width, height: 921});
    for (const slug of ['stockrush', 'member-event-consistency', 'enterprise-policy-rag', 'ai-gateway', 'cdc-data-platform', 'fashion-personalization-platform']) {
      await page.goto(`/projects/${slug}/`);
      await expect(page.locator('.evidence-review a')).toHaveCount(2);
      const outcomes = page.locator('.verification-outcome');
      expect(await outcomes.count()).toBeGreaterThanOrEqual(3);
      for (const outcome of await outcomes.all()) await expect(outcome).toBeVisible();
      for (const method of await page.getByText('테스트 방법과 근거', {exact: true}).all()) await method.click();
      const sources = await page.locator('.verification-sources a').evaluateAll(links => links.map(link => link.getAttribute('href')));
      expect(sources.length).toBeGreaterThanOrEqual(3);
      for (const source of sources) expect(source).toMatch(new RegExp(`/cyson21/${slug}/blob/[a-f0-9]{40}/`));
      if (slug === 'enterprise-policy-rag') {
        const citationResult = page.locator('.verification-result').filter({hasText: '권한 없는 문서는 답변 출처에서 제외'});
        await expect(citationResult.locator('.verification-outcome')).toContainText('보안 사고 대응 문서가 포함되지 않았습니다');
        await expect(citationResult.locator('.verification-sources a')).toHaveAttribute('href', /test_answer_api\.py#L40$/);
      }
      if (slug === 'cdc-data-platform') {
        await expect(page.locator('.evidence-status').filter({hasText: '실행 결과 미확인'})).toBeVisible();
        await expect(page.locator('.generated-diagram--independent ul li')).toHaveCount(3);
        expect(await page.locator('.generated-diagram--independent li').first().evaluate(element => getComputedStyle(element, '::after').display)).toBe('none');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), slug).toBeFalsy();
    }
  });
}
