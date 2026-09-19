import { expect, test } from '@playwright/test';

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

for (const route of routes) {
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
      await expect(page.locator('body')).not.toContainText(label);
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
  await expect(page.locator('.resume-overview .summary-intro')).toHaveText('Java·Spring Boot 기반의 5년 차 백엔드 개발자입니다.');
  await expect(page.locator('.resume-overview .summary-highlights li')).toHaveText([
    '기업용 플랫폼의 요구사항 분석, API 설계, 데이터 모델링',
    '복잡한 상태 변경과 데이터 정합성 문제 분석 및 개선',
    '운영 이슈 재현, 원인 분석, 수정, 회귀 테스트까지 전 과정 수행',
    '비즈니스 규칙 정비와 통합 테스트를 통한 운영 안정성 강화',
    '공공·실시간 데이터 수집·가공 및 REST API 개발',
    '시계열 예측 결과 연동과 Docker 기반 배포·운영',
  ]);
  await expect(page.getByRole('heading', { name: '주요 업무' })).toHaveCount(2);
  const currentExperience = page.locator('.experience-entry').first();
  await expect(currentExperience.getByRole('heading', { name: '이엠캐스트(주)' })).toBeVisible();
  await expect(currentExperience.locator('.responsibilities li p')).toHaveText([
    'Java·Spring Boot·JPA·QueryDSL·MySQL 기반으로 Anchor 플랫폼 REST API를 설계·개발·운영하고, 관리자 기능 개편을 지원했습니다.',
    'Anchor 2.0 → 3.0 전환에서 영향 범위를 점검해 기존 기능 회귀를 막고, 레거시 정리와 API·DB 구조 개선을 진행했습니다.',
    '운영 장애와 데이터 오류를 재현·분석한 뒤 API·DB 로직을 수정하고, Testcontainers 기반 통합·회귀 테스트로 재발을 줄였습니다.',
    'JPA·QueryDSL 조회·저장 구조를 정리해 데이터 접근 계층의 정합성과 유지보수성을 높였습니다.',
    'AWS(Lambda, CloudWatch, RDS, EC2, WAF 등) 기반 배포·모니터링·운영에 참여하고, Docker 배포·전환 이슈를 처리했습니다.',
    'CI/CD 파이프라인 안정화와 코드리뷰 기반 배포 품질 관리에 참여했습니다.',
  ]);
  await expect(currentExperience).not.toContainText(/자격증명|액세스 키|CDN/);
  await expect(currentExperience.locator('.context')).toHaveText(
    '실무에서는 4인 개발팀에서 20개 이상의 기업 고객 서비스를 Java·Spring Boot 기반으로 개발·운영했습니다.',
  );
  await expect(page.locator('.experience-support .skill-groups')).toBeVisible();
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
