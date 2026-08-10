import { expect, test } from '@playwright/test';

test('home hero shows the Korean two-line role without a profile image shadow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.locator('.hero-role')).toHaveText('자바 스프링부트백엔드 개발자');
  await expect(page.locator('.hero-role span')).toHaveText(['자바 스프링부트', '백엔드 개발자']);

  const profileImageShadow = await page.locator('.hero-person img').evaluate((element) => getComputedStyle(element).boxShadow);
  expect(profileImageShadow).toBe('none');
});

test('home layout keeps the name below the profile and makes the dark-theme highlights readable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const profileBox = await page.locator('.hero-person img').boundingBox();
  const nameBox = await page.locator('.hero h1').boundingBox();
  expect(profileBox).not.toBeNull();
  expect(nameBox).not.toBeNull();
  expect(nameBox!.y).toBeGreaterThanOrEqual(profileBox!.y + profileBox!.height);

  const highlightsColor = await page.locator('.hero-highlights').evaluate((element) => getComputedStyle(element).color);
  expect(highlightsColor).toBe('rgb(227, 235, 239)');
});

test('home experience and project teasers route to their detail pages', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  const containerLeft = await page.locator('.experience-heading').locator('..').evaluate((element) => element.getBoundingClientRect().left);
  const headingLeft = await page.locator('.experience-heading h2').evaluate((element) => element.getBoundingClientRect().left);
  expect(headingLeft - containerLeft).toBeGreaterThanOrEqual(8);
  await expect(page.locator('.career-list')).toHaveCount(0);
  await expect(page.locator('.experience-teaser')).toContainText('2021.07 → 현재');
  await expect(page.locator('.experience-teaser .section-link')).toHaveAttribute('href', '/experience/');

  const projectTeasers = page.locator('.project-teaser');
  await expect(projectTeasers).toHaveCount(3);
  await expect(projectTeasers.locator('.project-teaser-summary')).toHaveCount(3);
  await expect(page.locator('.project-card-evidence')).toHaveCount(0);
  await expect(projectTeasers.getByRole('link', { name: /프로젝트 상세 보기/ })).toHaveCount(3);
});

test('home feedback keeps supporting copy readable and groups project context below the heading', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  const closingColor = await page.locator('.hero-closing').evaluate((element) => getComputedStyle(element).color);
  expect(closingColor).toBe('rgb(215, 224, 228)');

  await expect(page.locator('.featured-heading .section-link')).toHaveAttribute('href', '/projects/');

  await expect(page.locator('.contact-band')).toHaveCount(0);
  await expect(page.locator('.project-teaser').first()).toContainText('StockRush');
});

test('footer avoids repeating the profile identity and aligns contact content to the left', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  await expect(page.locator('.footer-identity')).toHaveCount(0);
  const footerLeft = await page.locator('.site-footer .container').last().evaluate((element) => element.getBoundingClientRect().left);
  const contactLeft = await page.locator('.footer-contact').evaluate((element) => element.getBoundingClientRect().left);
  expect(contactLeft).toBe(footerLeft);
});
