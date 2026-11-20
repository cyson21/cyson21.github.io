import { expect, test } from '@playwright/test';

test('experience page presents professional skills without promoting personal projects', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/experience/');

  const professionalSkills = page.locator('.skill-groups:not(.project-skill-groups)');
  const projectSkills = page.locator('.project-skill-groups');
  await expect(professionalSkills.locator('dt')).toHaveText(['백엔드', '데이터·메시징', '배포·개발 도구']);

  const renderedSkills = await professionalSkills.locator('dd').allTextContents();
  expect(renderedSkills.flatMap((group) => group.split(', ')).sort()).toEqual([
    'Java', 'Spring Boot', 'Spring Data JPA', 'QueryDSL', 'Python', 'Django', 'FastAPI',
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'ShedLock', 'Redisson', 'RabbitMQ',
    'AWS', 'Docker', 'Git', 'JUnit', 'Testcontainers', 'REST Docs',
  ].sort());
  await expect(projectSkills).toHaveCount(0);
  await expect(page.locator('.work-case-list article')).toHaveCount(0);
  await expect(professionalSkills).not.toContainText('Kafka');
  await expect(professionalSkills).toContainText('RabbitMQ');
});
