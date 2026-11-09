import { expect, test } from '@playwright/test';

test('home hero shows the Korean two-line role without a profile image shadow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.locator('.hero-role')).toHaveText('자바 스프링부트백엔드 개발자');
  await expect(page.locator('.hero-role span')).toHaveText(['자바 스프링부트', '백엔드 개발자']);

  const profileImageShadow = await page.locator('.hero-person img').evaluate((element) => getComputedStyle(element).boxShadow);
  expect(profileImageShadow).toBe('none');
});

test('home layout keeps the name below the profile and makes the highlights readable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const profileBox = await page.locator('.hero-person img').boundingBox();
  const nameBox = await page.locator('.hero h1').boundingBox();
  expect(profileBox).not.toBeNull();
  expect(nameBox).not.toBeNull();
  expect(nameBox!.y).toBeGreaterThanOrEqual(profileBox!.y + profileBox!.height);

  const highlightsColor = await page.locator('.hero-highlights').evaluate((element) => getComputedStyle(element).color);
  expect(highlightsColor).toBe('rgb(75, 91, 112)');
});

test('home omits the temporary career and project sections while keeping detail routes visible', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  await expect(page.locator('[aria-labelledby="experience-title"]')).toHaveCount(0);
  await expect(page.locator('#featured-projects')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '개인 프로젝트' })).toHaveAttribute('href', '/projects/');
  await expect(page.getByRole('navigation', { name: '주 메뉴' }).getByRole('link', { name: '경력·이력서' })).toHaveAttribute('href', '/experience/');
});

test('home keeps supporting copy readable without the temporary sections', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  const closingColor = await page.locator('.hero-closing').evaluate((element) => getComputedStyle(element).color);
  expect(closingColor).toBe('rgb(75, 91, 112)');

  await expect(page.locator('.contact-band')).toHaveCount(0);
});

test('home does not reserve empty main-space after the hero', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const heights = await page.evaluate(() => ({
    main: document.querySelector('main')?.getBoundingClientRect().height ?? 0,
    hero: document.querySelector('.hero')?.getBoundingClientRect().height ?? 0,
  }));
  expect(heights.main - heights.hero).toBeLessThanOrEqual(2);
});

test('home footer follows the hero with a bounded section gap', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const footerTop = await page.locator('.site-chrome-footer').evaluate(element => element.getBoundingClientRect().top);
  const mainBottom = await page.locator('main').evaluate(element => element.getBoundingClientRect().bottom);
  expect(footerTop - mainBottom).toBeGreaterThanOrEqual(0);
  expect(footerTop - mainBottom).toBeLessThanOrEqual(48);
});

test('footer avoids repeating the profile identity and aligns contact content to the left', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  await expect(page.locator('.footer-identity')).toHaveCount(0);
  const footerLeft = await page.locator('.site-chrome-footer-grid').evaluate(element => element.getBoundingClientRect().left);
  const firstGroupLeft = await page.locator('.site-chrome-footer-grid section').first().evaluate(element => element.getBoundingClientRect().left);
  expect(firstGroupLeft).toBe(footerLeft);
});
