import { expect, test } from '@playwright/test';

test('experience page presents professional skills without promoting personal projects', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/experience/');

  const professionalSkills = page.locator('.skill-groups:not(.project-skill-groups)');
  const projectSkills = page.locator('.project-skill-groups');
  await expect(professionalSkills.locator('.skill-label')).toHaveText([
    'Java·Spring',
    'DB·데이터',
    '분산락·메시징',
    'Python·웹',
    'AWS·인프라',
    '형상관리·검증',
  ]);

  await expect(professionalSkills.locator(':scope > div')).toHaveText([
    'Java·SpringJavaSpring BootSpring Data JPAQueryDSL',
    'DB·데이터SQLMySQLMongoDB',
    '분산락·메시징RedisShedLockRedissonRabbitMQ',
    'Python·웹PythonDjangoFastAPI',
    'AWS·인프라AWSDocker',
    '형상관리·검증GitJUnitTestcontainersREST Docs',
  ]);
  await expect(projectSkills).toHaveCount(0);
  await expect(page.locator('.work-case-list article')).toHaveCount(4);
  await expect(professionalSkills).not.toContainText('Kafka');
  await expect(professionalSkills).toContainText('RabbitMQ');
});
