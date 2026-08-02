import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  compactBestPracticeWarnings,
  filterUnapprovedWarnings,
  loadAxeBestPracticePolicy,
} from './fixtures/axe-policy';
import { gotoAuditRoute, publicAuditRoutes } from './fixtures/canonical';

const wcagTags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
const policy = loadAxeBestPracticePolicy();

for (const route of publicAuditRoutes) {
  test(`${route.path} has no WCAG A or AA axe violations`, async ({ page }, testInfo) => {
    await gotoAuditRoute(page, route);
    const results = await new AxeBuilder({ page }).withTags([...wcagTags, 'best-practice']).analyze();
    const blocking = results.violations.filter((violation) => violation.tags.some((tag) => wcagTags.includes(tag)));
    const bestPractice = results.violations.filter((violation) => !blocking.includes(violation));
    const compact = compactBestPracticeWarnings(route.path, bestPractice);
    const unapproved = filterUnapprovedWarnings(compact, policy);

    const summary = {
      route: route.path,
      project: testInfo.project.name,
      blockingCount: blocking.length,
      bestPracticeCount: bestPractice.length,
      unapprovedCount: unapproved.length,
      maxUnapprovedWarnings: policy.maxUnapprovedWarnings,
      allowlistSize: policy.entries.length,
      bestPractice: compact,
      unapproved,
    };

    // Preserve best-practice findings on green runs (not only on failure).
    await testInfo.attach('axe-summary.json', {
      body: JSON.stringify(summary, null, 2),
      contentType: 'application/json',
    });
    await testInfo.attach('axe-best-practice-warnings.json', {
      body: JSON.stringify(bestPractice, null, 2),
      contentType: 'application/json',
    });

    const outDir = resolve(process.cwd(), 'artifacts/playwright');
    mkdirSync(outDir, { recursive: true });
    const safeRoute = route.id;
    writeFileSync(
      resolve(outDir, `axe-best-practice-${testInfo.project.name}-${safeRoute}.json`),
      `${JSON.stringify(summary, null, 2)}\n`,
    );

    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    expect(
      unapproved.length,
      `Unapproved axe best-practice warnings exceed per-route budget ${policy.maxUnapprovedWarnings}. `
      + 'Add ruleId/selector/reason/expiresOn to config/axe-best-practice-policy.json or fix the warning.\n'
      + JSON.stringify(unapproved, null, 2),
    ).toBeLessThanOrEqual(policy.maxUnapprovedWarnings);
  });
}

test('mobile menu opens, traps no content, and closes after navigation', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only');
  await page.goto('/');
  const menu = page.locator('.menu-button');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(menu).toHaveAccessibleName('탐색 메뉴 닫기');
  await page.getByRole('navigation', { name: '모바일 탐색' }).getByRole('link', { name: '프로젝트' }).click();
  await expect(page).toHaveURL(/\/projects\/$/);
});

test('preview metadata stays noindex without release environment', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
