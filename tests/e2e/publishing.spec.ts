import { expect, test } from '@playwright/test';

test('preview robots blocks crawling and sitemap exposes no URLs', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBeTruthy();
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect(await robots.text()).toBe('User-agent: *\nDisallow: /\n');

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBeTruthy();
  expect(sitemap.headers()['content-type']).toMatch(/^(?:application|text)\/xml/);
  expect(await sitemap.text()).not.toContain('<loc>');
});

test('custom 404 renders useful content and remains noindex', async ({ page }) => {
  const response = await page.goto('/missing-release-check/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('요청한 페이지를 찾을 수 없습니다');
  const main = page.locator('main');
  await expect(main.getByRole('link', { name: '개인 프로젝트' })).toHaveAttribute('href', '/projects/');
  await expect(main.getByRole('link', { name: '경력·이력서' })).toHaveAttribute('href', '/experience/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.getByRole('link', { name: 'cyson21@gmail.com' })).toHaveCount(0);
});

for (const [filename, label] of [['resume.pdf', '이력서'], ['career-description.pdf', '경력기술서']]) {
  test(`experience page links to a valid two-page ${filename}`, async ({ page, request }) => {
    await page.goto('/experience/');
    await expect(page.locator('.resume-overview').getByRole('link', { name: `${label} PDF 다운로드`, exact: true })).toHaveAttribute('href', `/downloads/${filename}`);
    const response = await request.get(`/downloads/${filename}`);
    expect(response.ok()).toBeTruthy();
    expect(response.headers()['content-type']).toContain('application/pdf');
    const bytes = await response.body();
    expect(bytes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    const pdfSource = bytes.toString('latin1');
    expect(pdfSource.match(/\/Type\s*\/Page\b/g)).toHaveLength(2);
    expect(pdfSource).toContain('/StructTreeRoot');
    expect(pdfSource).toContain('/Lang (ko-KR)');
    expect(pdfSource.match(/\/Subtype\s*\/Link\b/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(pdfSource).toContain('%%EOF');
  });
}

test('print resume exposes exactly two ready sheets and stays noindex', async ({ page }) => {
  const response = await page.goto('/resume/print/', { waitUntil: 'networkidle' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('main > .sheet')).toHaveCount(2);
  await expect(page.locator('main > .sheet').first()).toHaveAttribute('aria-label', '이력서 1페이지');
  await expect(page.locator('main > .sheet').last()).toHaveAttribute('aria-label', '이력서 2페이지');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.getByRole('link', { name: 'cyson21@gmail.com', exact: true })).toHaveAttribute('href', 'mailto:cyson21@gmail.com');
});

test('first resume sheet presents core skills and professional problem solving', async ({ page }) => {
  await page.goto('/resume/print/');
  const first = page.locator('main > .sheet').first();
  await expect(first.locator('.skills')).toContainText('Java');
  await expect(first.locator('.company-heading')).toContainText('이엠캐스트');
  expect(await first.locator('[data-work-case]').evaluateAll(elements => elements.map(element => element.getAttribute('data-work-case'))))
    .toEqual(['work-batch', 'work-policy', 'work-identity', 'work-purchase']);
  await expect(first.locator('.personal')).toHaveCount(0);
  await expect(page.locator('main .personal')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('StockRush');
  await expect(page.locator('main')).not.toContainText('Enterprise Policy RAG');
});

test('career description separates four contributions across two sheets', async ({ page }) => {
  await page.goto('/resume/career/');
  const sheets = page.locator('main > .sheet');
  await expect(sheets).toHaveCount(2);
  for (const [index, anchors] of [['work-batch', 'work-purchase'], ['work-policy', 'work-identity']].entries()) {
    expect(await sheets.nth(index).locator('[data-career-case]').evaluateAll(elements => elements.map(element => element.getAttribute('data-career-case')))).toEqual(anchors);
  }
  for (const item of await page.locator('[data-career-case]').all()) {
    await expect(item.locator('dt')).toHaveText(['문제', '판단', '수행', '기여']);
    await expect(item.locator('ol > li')).toHaveCount(3);
  }
});
