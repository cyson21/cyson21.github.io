import { expect, test } from '@playwright/test';

const releaseOrigin = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');

test.beforeEach(() => {
  test.skip(process.env.PUBLIC_RELEASE !== 'true' || !releaseOrigin, 'release build only');
});

test('release metadata uses the configured HTTPS origin', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow,max-image-preview:large');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${releaseOrigin}/`);
});

test('release robots and sitemap expose only public routes', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toBe(`User-agent: *\nAllow: /\nSitemap: ${releaseOrigin}/sitemap.xml\n`);

  const sitemap = await request.get('/sitemap.xml');
  const body = await sitemap.text();
  const locations = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/g))
    .flatMap((match) => match[1] ? [match[1]] : []);
  expect(locations).toHaveLength(10);
  expect(locations.every((location) => location.startsWith(`${releaseOrigin}/`))).toBeTruthy();
  expect(locations).toContain(`${releaseOrigin}/resume/`);
  expect(body).not.toContain('/resume/print/');
  expect(body).not.toContain('/404');
});

test('release 404 remains noindex', async ({ page }) => {
  const response = await page.goto('/missing-release-check/');
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});
