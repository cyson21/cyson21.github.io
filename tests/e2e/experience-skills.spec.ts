import { expect, test } from '@playwright/test';

test('experience page groups the verified backend strengths by delivery concern', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/experience/');

  await expect(page.locator('.skill-label')).toHaveText([
    'Java·Spring',
    'DB·ORM',
    '메시징·비동기',
    'AWS·인프라',
    'CI/CD·검증 자동화',
    '데이터·Python API',
  ]);

  const skills = page.locator('.skill-groups');
  await expect(skills).toContainText('Spring Data JPA');
  await expect(skills).toContainText('Transactional Outbox');
  await expect(skills).toContainText('Docker Compose');
  await expect(skills).toContainText('GitHub Actions CI');
  await expect(skills).toContainText('Testcontainers');
});
