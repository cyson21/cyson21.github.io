import { expect, test } from '@playwright/test';

import { isAuditRouteSelected } from './fixtures/canonical';

const testRoutes: Record<string, string[]> = {
  'project filter works and code details keep implementation and tests visible': ['/projects/', '/projects/stockrush/'],
  'Korean interface labels use the text font rather than the code font': ['/projects/', '/projects/stockrush/'],
  'detail pages expose an explicit route back to the portfolio home': ['/projects/stockrush/', '/experience/'],
  'experience page unifies the résumé summary and career evidence': ['/experience/'],
  'print résumé keeps page-two content above the footer': ['/resume/print/'],
  'resume route redirects to the unified experience page': ['/experience/'],
  'home navigation prioritizes career and labels personal projects': ['/'],
  'projects page heading levels do not skip from h1 to h3': ['/projects/'],
  'navigation, document flow, and code evidence remain readable without JavaScript': ['/projects/stockrush/'],
  'mobile project contents precede the article and follow the current section': ['/projects/stockrush/'],
};
test.beforeEach(({}, testInfo) => {
  const dependencies = testRoutes[testInfo.title];
  if (dependencies) test.skip(!dependencies.some(isAuditRouteSelected), 'unaffected route');
  if (testInfo.title.startsWith('print résumé')) {
    test.skip(!isAuditRouteSelected('/resume/print/') || testInfo.project.name === 'mobile', 'print uses one A4 geometry');
  }
});

const routes = [
  '/',
  '/projects/',
  '/projects/stockrush/',
  '/projects/enterprise-policy-rag/',
  '/projects/member-event-consistency/',
  '/projects/ai-gateway/',
  '/projects/cdc-data-platform/',
  '/projects/fashion-personalization-platform/',
  '/experience/',
];
const deprecatedLabels = [
  '최근 수정',
  '사례 문서',
  '설계 판단',
  '선택한 구조와 제외한 대안',
  '대표 구현 근거',
  '대표 코드, 보호 규칙과 연결 테스트',
  '보호하는 규칙',
  '연결 테스트',
  '검증 근거',
  '실행한 입력과 확인한 상태',
  '실행 환경과 방법 상세 보기',
  '검증 수준',
  '현재 검증 범위',
  '아직 검증하지 않은 것',
  '다음 검증 단계',
  '페이지 목차',
  '사용 기술',
  '사용 범위',
  '경력과 구현 근거',
  'Backend Engineer',
  '시간대 변환 오류',
  'AWS SDK 전환과 테스트 표준화',
];

for (const route of routes.filter(isAuditRouteSelected)) {
  test(`${route} renders one H1 without console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const response = await page.goto(route, { waitUntil: 'networkidle' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('body')).not.toContainText('undefined');
    for (const label of deprecatedLabels) {
      await expect(page.getByText(label, { exact: true })).toHaveCount(0);
    }
    expect(errors).toEqual([]);
  });
}

test('project filter works and code details keep implementation and tests visible', async ({ page }) => {
  await page.goto('/projects/');
  await page.getByRole('radio', { name: /^백엔드/ }).check();
  await expect(page.locator('[data-project-domain="Backend"]')).toHaveCount(2);
  await expect(page.locator('[data-project-domain="AI"]:visible')).toHaveCount(0);
  await expect(page.locator('#filter-status')).toHaveText('백엔드 2개 프로젝트');
  await expect(page.locator('[data-project-domain="Backend"] .domain')).toHaveText(['백엔드', '백엔드']);

  await page.goto('/projects/stockrush/');
  const firstEvidence = page.locator('.evidence').first();
  await expect(firstEvidence.getByRole('heading', { name: '구현 내용' })).toBeVisible();
  await expect(firstEvidence.getByRole('heading', { name: '관련 테스트' })).toBeVisible();
  await expect(firstEvidence.locator('.test-path')).toBeVisible();
});

test('Korean interface labels use the text font rather than the code font', async ({ page }) => {
  const codeFontPattern = /JetBrains Mono|Cascadia Mono|SFMono|Consolas/i;
  const expectTextFonts = async (selectors: string[]) => {
    const fontFamilies = await page.locator(selectors.join(', ')).evaluateAll((elements) =>
      elements.map((element) => getComputedStyle(element).fontFamily),
    );
    expect(fontFamilies.length).toBeGreaterThan(0);
    fontFamilies.forEach((fontFamily) => expect(fontFamily).not.toMatch(codeFontPattern));
  };

  await page.goto('/projects/');
  await expectTextFonts(['.wordmark-role', '.domain', '#filter-status']);

  await page.goto('/projects/stockrush/');
  await expectTextFonts([
    '.project-meta dt',
    '.project-toc > p',
    '.decision-item dt',
    '.evidence-count',
    '.evidence-context h4',
    '.verification-table thead th',
    '.pagination-grid a span',
  ]);
});

test('detail pages expose an explicit route back to the portfolio home', async ({ page, isMobile }) => {
  for (const route of ['/projects/stockrush/', '/experience/']) {
    await page.goto(route);
    if (isMobile) {
      await page.getByRole('button', { name: '탐색 메뉴 열기' }).click();
      await expect(page.getByRole('navigation', { name: '모바일 탐색' }).getByRole('link', { name: '홈' })).toHaveAttribute('href', '/');
    } else {
      await expect(page.getByRole('navigation', { name: '주요 탐색' }).getByRole('link', { name: '홈' })).toHaveAttribute('href', '/');
    }
  }
});

test('experience page unifies the résumé summary and career evidence', async ({ page }) => {
  await page.goto('/experience/');
  await expect(page.getByRole('heading', { name: '경력·이력서' })).toBeVisible();
  await expect(page.locator('.resume-overview .summary-intro')).toHaveText('2021년부터 백엔드 개발·운영을 담당해 왔으며, Java·Spring Boot를 주력으로 사용합니다.');
  await expect(page.locator('.resume-overview .summary-highlights li')).toHaveText([
    'B2B 리테일 교육 플랫폼의 REST API 설계·개발과 관리자 기능 개편',
    '공공·실시간 데이터 수집·가공 파이프라인과 조회 API 구현',
    '운영 장애·데이터 오류 재현, 원인 분석과 API·DB 로직 수정',
    'JPA·QueryDSL 데이터 접근 계층 개선과 통합·회귀 테스트',
    'B2B 교육 플랫폼 버전 전환의 영향 범위 점검과 레거시 코드 정리',
    'AWS 인프라 운영과 CI/CD 파이프라인 안정화, Docker 기반 배포',
  ]);
  await expect(page.getByRole('heading', { name: '주요 업무' })).toHaveCount(2);
  const currentExperience = page.locator('.experience-entry').first();
  await expect(currentExperience.getByRole('heading', { name: '이엠캐스트(주)' })).toBeVisible();
  await expect(currentExperience.locator('.responsibilities li p')).toHaveText([
    'Java·Spring Boot로 B2B 리테일 교육 플랫폼의 REST API를 설계·개발·운영했습니다. JPA·QueryDSL·MySQL로 데이터 조회·저장을 구현하고 관리자 기능 개편을 지원했습니다.',
    '버전 전환에 따른 기존 기능의 영향 범위를 점검하고 회귀를 검증했습니다. 레거시 코드 정리와 API·DB 구조 개선을 진행했습니다.',
    '운영 장애와 데이터 오류를 재현해 원인을 분석하고 API·DB 로직을 수정했습니다. Testcontainers 기반 통합·회귀 테스트로 수정 결과를 확인했습니다.',
    'JPA·QueryDSL의 조회·저장 구조를 정리하고 데이터 정합성과 유지보수 관점에서 접근 로직을 개선했습니다.',
    'AWS(Lambda, CloudWatch, RDS, EC2, WAF 등) 기반 배포·모니터링·운영에 참여하고, Docker 배포·전환 이슈를 처리했습니다.',
    'CI/CD 파이프라인 안정화와 코드리뷰 기반 배포 품질 관리에 참여했습니다.',
  ]);
  await expect(currentExperience).not.toContainText(/자격증명|액세스 키|CDN/);
  await expect(currentExperience.locator('.context')).toHaveText(
    '4인 개발팀에서 20개 이상의 기업 고객 서비스를 제공하는 B2B 리테일 교육 플랫폼의 백엔드 개발·운영을 담당했습니다.',
  );
  await expect(page.locator('.experience-support .skill-groups:not(.project-skill-groups)')).toBeVisible();
  await expect(page.getByRole('heading', { name: '학력' })).toBeVisible();
});

test('print résumé keeps page-two content above the footer', async ({ page }) => {
  await page.goto('/resume/print/');
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('.sheet')).toHaveCount(2);

  const secondSheet = page.locator('.sheet').nth(1);
  const contentBottom = await secondSheet.locator('.lower-grid').evaluate((element) => element.getBoundingClientRect().bottom);
  const footerTop = await secondSheet.locator('footer').evaluate((element) => element.getBoundingClientRect().top);

  expect(contentBottom).toBeLessThanOrEqual(footerTop);
});

test('resume route redirects to the unified experience page', async ({ page }) => {
  await page.goto('/resume/');
  await page.waitForTimeout(250);
  const path = new URL(page.url()).pathname;
  if (path === '/resume/') {
    await expect(page.locator('meta[http-equiv="refresh"]')).toHaveAttribute('content', '0;url=/experience/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', '/experience/');
  } else {
    expect(path).toBe('/experience/');
    await expect(page.getByRole('heading', { name: '경력·이력서' })).toBeVisible();
  }
});

test('home navigation prioritizes career and labels personal projects', async ({ page, isMobile }) => {
  await page.goto('/');
  await expect(page.locator('[aria-labelledby="experience-title"]')).toHaveCount(0);
  await expect(page.locator('#featured-projects')).toHaveCount(0);
  if (isMobile) {
    await page.getByRole('button', { name: '탐색 메뉴 열기' }).click();
  }
  const navigation = page.getByRole('navigation', { name: isMobile ? '모바일 탐색' : '주요 탐색' });
  const links = navigation.getByRole('link');
  await expect(links.nth(0)).toHaveText('홈');
  await expect(links.nth(1)).toHaveText('경력·이력서');
  await expect(links.nth(2)).toHaveText('개인 프로젝트');
  await expect(links.nth(1)).toHaveAttribute('href', '/experience/');
  await expect(links.nth(2)).toHaveAttribute('href', '/projects/');
});

test('projects page heading levels do not skip from h1 to h3', async ({ page }) => {
  await page.goto('/projects/');
  const levels = await page.locator('main :is(h1, h2, h3, h4)').evaluateAll((headings) =>
    headings.map((heading) => Number(heading.tagName.slice(1))),
  );
  levels.forEach((level, index) => {
    const previous = levels[index - 1];
    if (previous) expect(level - previous).toBeLessThanOrEqual(1);
  });
});

test('navigation, document flow, and code evidence remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/projects/stockrush/');

  await expect(page.getByRole('navigation', { name: '모바일 탐색' })).toBeVisible();
  await expect(page.locator('.project-toc a')).toHaveText([
    '프로젝트 개요',
    '기술 선택',
    '주요 구현',
    '테스트 결과',
    '프로젝트 범위',
  ]);
  await expect(page.locator('.visual-wrap')).toBeVisible();
  await expect(page.locator('.evidence').first().getByText('구현 내용')).toBeVisible();
  await expect(page.locator('.evidence').first().getByText('관련 테스트')).toBeVisible();
  await expect(page.locator('.evidence[open]')).toHaveCount(1);
  await expect(page.locator('.evidence:not([open])')).toHaveCount(2);

  await context.close();
});

test('mobile project contents precede the article and follow the current section', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only');
  await page.goto('/projects/stockrush/');

  const order = await page.locator('.project-layout').evaluate((layout) => ({
    toc: Array.from(layout.children).findIndex((child) => child.classList.contains('project-toc')),
    content: Array.from(layout.children).findIndex((child) => child.classList.contains('project-content')),
  }));
  expect(order.toc).toBeLessThan(order.content);

  const contentOrder = await page.locator('.project-content').evaluate((content) => ({
    overview: Array.from(content.children).findIndex((child) => child.id === 'overview'),
    visual: Array.from(content.children).findIndex((child) => child.classList.contains('visual-wrap')),
    decisions: Array.from(content.children).findIndex((child) => child.id === 'decisions'),
  }));
  expect(contentOrder.overview).toBeLessThan(contentOrder.visual);
  expect(contentOrder.visual).toBeLessThan(contentOrder.decisions);

  const verificationLink = page.locator('.project-toc a[href="#verification"]');
  await verificationLink.click();
  await expect(verificationLink).toHaveAttribute('aria-current', 'location');
});
