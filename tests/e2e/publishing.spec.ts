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
  await expect(page.getByRole('link', { name: '프로젝트' })).toHaveAttribute('href', '/projects/');
  await expect(page.getByRole('link', { name: '웹 이력서' })).toHaveAttribute('href', '/resume/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});

test('resume page links to a valid two-page PDF', async ({ page, request }) => {
  await page.goto('/resume/');
  await expect(page.getByRole('link', { name: /PDF 다운로드/ })).toHaveAttribute('href', '/downloads/resume.pdf');

  const response = await request.get('/downloads/resume.pdf');
  expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/pdf');
  const bytes = await response.body();
  expect(bytes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(bytes.toString('latin1').match(/\/Type\s*\/Page\b/g)).toHaveLength(2);
  expect(bytes.toString('latin1')).toContain('%%EOF');
});

test('print resume exposes exactly two ready sheets and stays noindex', async ({ page }) => {
  const response = await page.goto('/resume/print/', { waitUntil: 'networkidle' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('main > .sheet')).toHaveCount(2);
  await expect(page.locator('main > .sheet').first()).toHaveAttribute('aria-label', '이력서 1페이지');
  await expect(page.locator('main > .sheet').last()).toHaveAttribute('aria-label', '이력서 2페이지');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});
