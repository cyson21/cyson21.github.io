import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const releaseOrigin = process.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
test.beforeEach(() => { test.skip(process.env.PUBLIC_RELEASE !== 'true' || !releaseOrigin, 'release build only'); });
const tag = (html: string, name: string, marker: string) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'g'))?.find(value => value.includes(marker));

test('release metadata uses the configured HTTPS origin', async ({ request }) => {
  const response = await request.get('/'); expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(tag(html, 'meta', 'name="robots"')).toContain('content="index,follow,max-image-preview:large"');
  expect(tag(html, 'link', 'rel="canonical"')).toContain(`href="${releaseOrigin}/"`);
});

test('release robots and sitemap expose only public routes', async ({ request }) => {
  const robots = await request.get('/robots.txt'); expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toBe(`User-agent: *\nAllow: /\nSitemap: ${releaseOrigin}/sitemap.xml\n`);
  const sitemap = await request.get('/sitemap.xml'); expect(sitemap.ok()).toBeTruthy();
  const body = await sitemap.text();
  const locations = Array.from(body.matchAll(/<loc>([^<]+)<\/loc>/g)).flatMap(match => match[1] ? [match[1]] : []);
  expect(locations).toHaveLength(10);
  expect(locations.every(location => location.startsWith(`${releaseOrigin}/`))).toBeTruthy();
  expect(locations).toContain(`${releaseOrigin}/portfolio/`); expect(locations).toContain(`${releaseOrigin}/experience/`);
  expect(body).not.toContain('/resume/print/'); expect(body).not.toContain('/404');
});

test('work portfolio and personal evidence use separate published pages', async ({ request }) => {
  const response = await request.get('/portfolio/'); expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body).toMatch(/<title>[^<]+<\/title>/);
  expect(body).toContain('실무 사례'); expect(body).not.toContain('portfolio-complete.pdf');
  expect(body).toContain('href="/projects/"');
  const details = await request.get('/portfolio/cases.html'); expect(details.ok()).toBeTruthy();
  const detailBody = await details.text();
  expect(detailBody.match(/<article class="work-case"/g)).toHaveLength(5);
  expect(detailBody).not.toContain('class="case-code-snippet"');
  const personal = await request.get('/projects/stockrush/'); expect(personal.ok()).toBeTruthy();
  expect(await personal.text()).toContain('PersistentCreateOrderService.create');
});

test('release 404 remains noindex', async ({ request }) => {
  const response = await request.get('/missing-release-check/'); expect(response.status()).toBe(404);
  expect(tag(await response.text(), 'meta', 'name="robots"')).toContain('content="noindex,nofollow"');
});

test('release PDF links serve the resume included in this deployment', async ({ request }) => {
  for (const route of ['/', '/experience/']) {
    const response = await request.get(route); expect(response.ok()).toBeTruthy();
    const links = (await response.text()).match(/<a\b[^>]*href="[^"]*resume\.pdf"[^>]*>/g);
    expect(links?.length ?? 0).toBeGreaterThanOrEqual(1);
    for (const link of links ?? []) {
      expect(link).toContain('href="/downloads/resume.pdf"');
      expect(link).toContain('download="손찬양_이력서.pdf"');
    }
  }
  const response = await request.get('/downloads/resume.pdf'); expect(response.ok()).toBeTruthy();
  expect(response.headers()['content-type']).toContain('application/pdf');
  const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
  expect(digest(await response.body())).toBe(digest(readFileSync('public/downloads/resume.pdf')));
});
