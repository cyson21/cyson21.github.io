import { expect, test } from '@playwright/test';

test('experience page uses the Saramin canonical skill set', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/experience/');

  await expect(page.locator('.skill-label')).toHaveText([
    'Java·Spring',
    'DB·데이터',
    '메시징·캐시',
    'AWS·인프라',
    '형상관리·검증',
  ]);

  await expect(page.locator('.skill-groups > div')).toHaveText([
    'Java·SpringJavaSpring BootSpringSpring Data JPAQueryDSL',
    'DB·데이터SQLPostgreSQLMySQL',
    '메시징·캐시RedisRabbitMQ',
    'AWS·인프라AWSDocker',
    '형상관리·검증GitJUnitTestcontainers',
  ]);
});
