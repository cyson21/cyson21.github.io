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

test('home omits the temporary career and project sections while keeping detail routes visible', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  await expect(page.locator('[aria-labelledby="experience-title"]')).toHaveCount(0);
  await expect(page.locator('#featured-projects')).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: '주요 탐색' }).getByRole('link', { name: '프로젝트' })).toHaveAttribute('href', '/projects/');
  await expect(page.getByRole('navigation', { name: '주요 탐색' }).getByRole('link', { name: '경력·이력서' })).toHaveAttribute('href', '/experience/');
});

test('home keeps supporting copy readable without the temporary sections', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  const closingColor = await page.locator('.hero-closing').evaluate((element) => getComputedStyle(element).color);
  expect(closingColor).toBe('rgb(215, 224, 228)');

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

test('home footer fills the remaining viewport after the hero', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  const footerBottom = await page.locator('.site-footer').evaluate((element) => element.getBoundingClientRect().bottom);
  expect(footerBottom).toBeGreaterThanOrEqual(999);
});

test('footer avoids repeating the profile identity and aligns contact content to the left', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  await expect(page.locator('.footer-identity')).toHaveCount(0);
  const footerLeft = await page.locator('.site-footer .container').last().evaluate((element) => element.getBoundingClientRect().left);
  const contactLeft = await page.locator('.footer-contact').evaluate((element) => element.getBoundingClientRect().left);
  expect(contactLeft).toBe(footerLeft);
});
