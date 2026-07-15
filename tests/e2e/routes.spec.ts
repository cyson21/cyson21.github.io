import { expect, test } from '@playwright/test';

const routes = [
  '/',
  '/projects/',
  '/projects/stockrush/',
  '/projects/enterprise-policy-rag/',
  '/projects/member-event-consistency/',
  '/projects/ai-gateway/',
  '/projects/cdc-data-platform/',
  '/projects/fashion-personalization-platform/',
  '/experience/',
  '/resume/',
];

for (const route of routes) {
  test(`${route} renders one H1 without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText('undefined');
    expect(errors).toEqual([]);
  });
}

test('project filter works and code evidence keeps rules and tests visible', async ({ page }) => {
  await page.goto('/projects/');
  await page.getByRole('radio', { name: /^Backend/ }).check();
  await expect(page.locator('[data-project-domain="Backend"]')).toHaveCount(2);
  await expect(page.locator('[data-project-domain="AI"]:visible')).toHaveCount(0);
  await expect(page.locator('#filter-status')).toHaveText('Backend 2개 프로젝트');

  await page.goto('/projects/stockrush/');
  const firstEvidence = page.locator('.evidence').first();
  await expect(firstEvidence.getByRole('heading', { name: '보호하는 규칙' })).toBeVisible();
  await expect(firstEvidence.getByRole('heading', { name: '연결 테스트' })).toBeVisible();
  await expect(firstEvidence.locator('.test-path')).toBeVisible();
});

test('projects page heading levels do not skip from h1 to h3', async ({ page }) => {
  await page.goto('/projects/');
  const levels = await page.locator('main :is(h1, h2, h3, h4)').evaluateAll((headings) =>
    headings.map((heading) => Number(heading.tagName.slice(1))),
  );
  levels.forEach((level, index) => {
    const previous = levels[index - 1];
    if (previous) expect(level - previous).toBeLessThanOrEqual(1);
  });
});

test('navigation, all flow modes, and code evidence remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/projects/stockrush/');

  await expect(page.getByRole('navigation', { name: '모바일 탐색' })).toBeVisible();
  await expect(page.getByRole('tabpanel')).toHaveCount(3);
  await expect(page.locator('[role="tabpanel"]:visible')).toHaveCount(3);
  await expect(page.locator('.evidence').first().getByText('보호하는 규칙')).toBeVisible();
  await expect(page.locator('.evidence').first().getByText('연결 테스트')).toBeVisible();

  await context.close();
});

test('mobile project contents precede the visual and follow the current section', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only');
  await page.goto('/projects/stockrush/');

  const order = await page.locator('.project-layout').evaluate((layout) => ({
    toc: Array.from(layout.children).findIndex((child) => child.classList.contains('project-toc')),
    visual: Array.from(layout.children).findIndex((child) => child.classList.contains('visual-wrap')),
  }));
  expect(order.toc).toBeLessThan(order.visual);

  const verificationLink = page.locator('.project-toc a[href="#verification"]');
  await verificationLink.click();
  await expect(verificationLink).toHaveAttribute('aria-current', 'location');
});
