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

test('project filter and evidence tabs work with keyboard semantics', async ({ page }) => {
  await page.goto('/projects/');
  await page.getByRole('radio', { name: /^Backend/ }).check();
  await expect(page.locator('[data-project-domain="Backend"]')).toHaveCount(2);
  await expect(page.locator('[data-project-domain="AI"]:visible')).toHaveCount(0);
  await expect(page.locator('#filter-status')).toHaveText('Backend 2개 프로젝트');

  await page.goto('/projects/stockrush/');
  const ruleTab = page.getByRole('tab', { name: '보호하는 규칙' }).first();
  await ruleTab.click();
  await expect(ruleTab).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText('PROVES').first()).toBeVisible();
});
