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

test('home experience and project cards provide context at a glance', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  const containerLeft = await page.locator('.experience-heading').locator('..').evaluate((element) => element.getBoundingClientRect().left);
  const headingLeft = await page.locator('.experience-heading h2').evaluate((element) => element.getBoundingClientRect().left);
  const periodLeft = await page.locator('.career-list time').first().evaluate((element) => element.getBoundingClientRect().left);
  expect(headingLeft - containerLeft).toBeGreaterThanOrEqual(8);
  expect(periodLeft - containerLeft).toBeGreaterThanOrEqual(8);

  await expect(page.locator('.project-row--compact').filter({ hasText: 'Enterprise Policy RAG' }).locator('.project-summary'))
    .toHaveText('회사 내부 규정을 검색하고 질문에 답하는 AI 시스템입니다. 사용자가 볼 수 있는 문서만 검색하고, 근거가 없으면 답변하지 않습니다.');
  await expect(page.locator('.project-row--compact').filter({ hasText: 'Member Event Consistency' }).locator('.project-summary'))
    .toHaveText('회원 보상·포인트·쿠폰을 동시에 처리해도 중복 지급과 초과 발급을 막는 백엔드 시스템입니다. 업무 규칙에 따라 PostgreSQL·Redis·RabbitMQ의 동시성 전략을 비교했습니다.');
});

test('home feedback keeps supporting copy readable and groups project context below the heading', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  const closingColor = await page.locator('.hero-closing').evaluate((element) => getComputedStyle(element).color);
  expect(closingColor).toBe('rgb(215, 224, 228)');

  const deckBottom = await page.locator('.featured-heading .section-deck').evaluate((element) => element.getBoundingClientRect().bottom);
  const ledeTop = await page.locator('.featured-heading .lede').evaluate((element) => element.getBoundingClientRect().top);
  const ledeBottom = await page.locator('.featured-heading .lede').evaluate((element) => element.getBoundingClientRect().bottom);
  const linkTop = await page.locator('.featured-heading .section-link').evaluate((element) => element.getBoundingClientRect().top);
  expect(ledeTop).toBeGreaterThanOrEqual(deckBottom);
  expect(linkTop).toBeGreaterThanOrEqual(ledeBottom);

  const stockrush = page.locator('.project-row--compact').filter({ hasText: 'StockRush' });
  const titleLeft = await stockrush.locator('h3').evaluate((element) => element.getBoundingClientRect().left);
  const domainRight = await stockrush.locator('.domain').evaluate((element) => element.getBoundingClientRect().right);
  expect(domainRight).toBeLessThan(titleLeft);
  await expect(stockrush.locator('.project-summary'))
    .toHaveText('주문·재고·결제를 함께 처리하는 쇼핑몰 백엔드입니다. 한 단계가 실패해도 주문 상태가 꼬이지 않도록 Saga와 Outbox로 복구 흐름을 구현했습니다.');
});

test('footer avoids repeating the profile identity and aligns contact content to the left', async ({ page }) => {
  await page.setViewportSize({ width: 1083, height: 1195 });
  await page.goto('/');

  await expect(page.locator('.footer-identity')).toHaveCount(0);
  const footerLeft = await page.locator('.site-footer .container').last().evaluate((element) => element.getBoundingClientRect().left);
  const contactLeft = await page.locator('.footer-contact').evaluate((element) => element.getBoundingClientRect().left);
  expect(contactLeft).toBe(footerLeft);
});
