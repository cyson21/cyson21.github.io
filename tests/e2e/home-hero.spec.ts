import { expect, test } from '@playwright/test';

test('home hero shows the Korean two-line role without a profile image shadow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');

  await expect(page.locator('.hero-role')).toHaveText('자바 스프링부트백엔드 개발자');
  await expect(page.locator('.hero-role span')).toHaveText(['자바 스프링부트', '백엔드 개발자']);

  const profileImageShadow = await page.locator('.hero-person img').evaluate((element) => getComputedStyle(element).boxShadow);
  expect(profileImageShadow).toBe('none');
});
