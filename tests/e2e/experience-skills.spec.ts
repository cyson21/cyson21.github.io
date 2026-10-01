import { expect, test } from '@playwright/test';

test('experience page separates professional skills from personal project skills', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/experience/');

  const professionalSkills = page.locator('.skill-groups:not(.project-skill-groups)');
  const projectSkills = page.locator('.project-skill-groups');
  await expect(professionalSkills.locator('.skill-label')).toHaveText([
    'Java·Spring',
    'DB·데이터',
    'Python·웹',
    'AWS·인프라',
    '형상관리·검증',
  ]);

  await expect(professionalSkills.locator(':scope > div')).toHaveText([
    'Java·SpringJavaSpring BootSpring Data JPAQueryDSL',
    'DB·데이터SQLMySQLMongoDB',
    'Python·웹PythonDjangoFastAPI',
    'AWS·인프라AWSDocker',
    '형상관리·검증GitJUnitTestcontainersREST Docs',
  ]);
  await expect(projectSkills).toContainText('PostgreSQL');
  await expect(projectSkills).toContainText('Kafka');
  await expect(projectSkills).toContainText('RabbitMQ');
  await expect(professionalSkills).not.toContainText('Kafka');
  await expect(professionalSkills).not.toContainText('RabbitMQ');
});
