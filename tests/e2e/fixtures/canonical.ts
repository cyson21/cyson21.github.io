import { expect, type Page } from '@playwright/test';

export const canonicalRoutes = [
  { id: 'home', path: '/' },
  { id: 'projects', path: '/projects/' },
  { id: 'project-stockrush', path: '/projects/stockrush/' },
  { id: 'project-enterprise-policy-rag', path: '/projects/enterprise-policy-rag/' },
  { id: 'experience', path: '/experience/' },
  { id: 'resume', path: '/resume/' },
] as const;

export const supplementalAuditRoutes = [
  { id: 'project-member-event-consistency', path: '/projects/member-event-consistency/' },
  { id: 'project-ai-gateway', path: '/projects/ai-gateway/' },
  { id: 'project-cdc-data-platform', path: '/projects/cdc-data-platform/' },
  { id: 'project-fashion-personalization-platform', path: '/projects/fashion-personalization-platform/' },
  { id: 'resume-print', path: '/resume/print/' },
  { id: 'not-found', path: '/missing-release-check/', expectedStatus: 404 },
] as const;

export const publicAuditRoutes = [
  ...canonicalRoutes,
  ...supplementalAuditRoutes,
] as const;

export const canonicalViewports = [
  { width: 320, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 1000 },
] as const;

export const visualAuditRoutes = [
  canonicalRoutes[0],
  canonicalRoutes[1],
  canonicalRoutes[2],
  canonicalRoutes[4],
  canonicalRoutes[5],
  supplementalAuditRoutes[5],
] as const;

export const visualViewports = [
  canonicalViewports[0],
  canonicalViewports[2],
  canonicalViewports[4],
] as const;

export const boundaryViewports = [
  { width: 639, height: 900 },
  { width: 640, height: 900 },
  { width: 959, height: 900 },
  { width: 960, height: 900 },
  { width: 1279, height: 900 },
  { width: 1280, height: 900 },
] as const;

export type CanonicalTypeScale = {
  body: number;
  h1: number;
  h2: number;
  h3: number;
  lede: number;
};

export function canonicalTypeScale(width: number): CanonicalTypeScale {
  if (width >= 1280) return { h1: 48, h2: 32, h3: 24, lede: 20, body: 18 };
  if (width >= 640) return { h1: 44, h2: 30, h3: 23, lede: 19, body: 18 };
  return { h1: 36, h2: 28, h3: 22, lede: 18, body: 17 };
}

export async function gotoCanonicalRoute(page: Page, route: string): Promise<void> {
  await gotoAuditRoute(page, { path: route });
}

export async function gotoAuditRoute(
  page: Page,
  route: { path: string; expectedStatus?: number },
): Promise<void> {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  const response = await page.goto(route.path, { waitUntil: 'networkidle' });
  if (route.expectedStatus) {
    expect(response?.status(), `${route.path} should return ${route.expectedStatus}`).toBe(route.expectedStatus);
  } else {
    expect(response?.ok(), `${route.path} should return a successful response`).toBeTruthy();
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

export async function expectNoHorizontalDocumentOverflow(page: Page): Promise<void> {
  const audit = await page.evaluate(() => {
    const root = document.documentElement;
    const overflowing = Array.from(document.body.querySelectorAll<HTMLElement>('*')).flatMap((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0) return [];
      if (rect.left >= -1 && rect.right <= window.innerWidth + 1) return [];
      if (element.closest('pre, table, .diagram-viewport, [role="region"]')) return [];
      return [`${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''} [${rect.left.toFixed(1)}, ${rect.right.toFixed(1)}]`];
    });

    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      overflowing: overflowing.slice(0, 12),
    };
  });

  expect(
    audit,
    `Document overflow: ${audit.scrollWidth}px > ${audit.clientWidth}px\n${audit.overflowing.join('\n')}`,
  ).toMatchObject({ scrollWidth: expect.any(Number), clientWidth: expect.any(Number) });
  expect(audit.scrollWidth, audit.overflowing.join('\n')).toBeLessThanOrEqual(audit.clientWidth + 1);
}
