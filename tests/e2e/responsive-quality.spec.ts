import { expect, test } from '@playwright/test';
import {
  boundaryViewports,
  canonicalRoutes,
  canonicalTypeScale,
  canonicalViewports,
  expectNoHorizontalDocumentOverflow,
  gotoAuditRoute,
  gotoCanonicalRoute,
  publicAuditRoutes,
  supplementalAuditRoutes,
} from './fixtures/canonical';

type TypeRole = 'h1' | 'h2' | 'h3' | 'lede' | 'control' | 'label' | 'code' | 'path' | 'dense';

const roleRules: Array<{ role: TypeRole; selector: string; lineHeight?: number; excludeSelector?: string }> = [
  { role: 'h1', selector: 'main h1', lineHeight: 1.18 },
  { role: 'h2', selector: 'main h2', lineHeight: 1.25 },
  { role: 'h3', selector: 'main h3', excludeSelector: '.evidence-header h3, .skill-groups h3', lineHeight: 1.35 },
  { role: 'lede', selector: 'main :is(.lede, .hero-statement, .project-lede)', lineHeight: 1.6 },
  { role: 'control', selector: ':is(header nav, .mobile-nav) a, main :is(a.button, button, [role="tab"], [role="radio"] + label)', lineHeight: 1.35 },
  { role: 'label', selector: 'main :is(.eyebrow, .intro-label, .status-label)', lineHeight: 1.5 },
  { role: 'code', selector: 'main :is(pre, pre code)', lineHeight: 1.55 },
  { role: 'path', selector: 'main :is(.signal-source code, .evidence-path code, code.test-name, .test-path, .test-path code)' },
  { role: 'dense', selector: 'main :is(.evidence-header h3 code, .skill-groups h3)', lineHeight: 1.35 },
];

const fixedRoleSizes: Record<Exclude<TypeRole, 'h1' | 'h2' | 'h3' | 'lede'>, number> = {
  control: 16,
  label: 15,
  code: 14,
  path: 14,
  dense: 16,
};

for (const route of canonicalRoutes) {
  for (const viewport of canonicalViewports) {
    test(`${route.path} matches canonical typography and reflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await gotoCanonicalRoute(page, route.path);
      await expectNoHorizontalDocumentOverflow(page);

      const scale = canonicalTypeScale(viewport.width);
      const roleAudit = await page.evaluate((rules) => rules.flatMap(({ role, selector, lineHeight, excludeSelector }) =>
        Array.from(document.querySelectorAll<HTMLElement>(selector)).flatMap((element) => {
          if (excludeSelector && element.matches(excludeSelector)) return [];
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) return [];
          const fontSize = Number.parseFloat(style.fontSize);
          return [{
            role,
            selector: `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''}`,
            text: element.textContent?.trim().slice(0, 80) ?? '',
            fontSize,
            lineHeightRatio: Number.parseFloat(style.lineHeight) / fontSize,
            expectedLineHeight: lineHeight ?? null,
          }];
        }),
      ), roleRules);

      expect(roleAudit.some(({ role }) => role === 'h1'), 'Each canonical route must expose one visible H1').toBeTruthy();
      const roleFailures = roleAudit.flatMap((item) => {
        const expectedSize = item.role in fixedRoleSizes
          ? fixedRoleSizes[item.role as keyof typeof fixedRoleSizes]
          : scale[item.role as keyof typeof scale];
        const sizeMatches = Math.abs(item.fontSize - expectedSize) <= 0.1;
        const lineHeightMatches = item.expectedLineHeight === null || Math.abs(item.lineHeightRatio - item.expectedLineHeight) <= 0.02;
        return sizeMatches && lineHeightMatches
          ? []
          : [`${item.role} ${item.selector}: ${item.fontSize.toFixed(2)}px/${item.lineHeightRatio.toFixed(3)} expected ${expectedSize}px${item.expectedLineHeight === null ? '' : `/${item.expectedLineHeight}`} (${item.text})`];
      });
      expect(roleFailures, roleFailures.join('\n')).toEqual([]);

      const allowedSizes = [14, 15, 16, scale.body, scale.lede, scale.h3, scale.h2, scale.h1];
      const tokenFailures = await page.evaluate((sizes) => Array.from(document.querySelectorAll<HTMLElement>('body *')).flatMap((element) => {
        if (element.closest('.visually-hidden') || ['SCRIPT', 'STYLE', 'SVG'].includes(element.tagName)) return [];
        const directText = Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent?.trim() ?? '')
          .join(' ')
          .trim();
        if (!directText) return [];
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) return [];
        const size = Number.parseFloat(style.fontSize);
        if (sizes.some((token) => Math.abs(token - size) <= 0.1)) return [];
        const name = `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).trim().replace(/\s+/g, '.')}` : ''}`;
        return [`${name}=${size.toFixed(2)}px (${directText.slice(0, 80)})`];
      }), allowedSizes);
      expect(tokenFailures, `Non-canonical typography tokens:\n${tokenFailures.join('\n')}`).toEqual([]);
    });
  }

  test(`${route.path} reflows at a 200% zoom-equivalent viewport`, async ({ page }) => {
    // At 200% browser zoom a 1280px viewport has an effective 640 CSS-pixel layout viewport.
    await page.setViewportSize({ width: 640, height: 720 });
    await gotoCanonicalRoute(page, route.path);
    await expectNoHorizontalDocumentOverflow(page);
  });

  test(`${route.path} tolerates WCAG text spacing at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await gotoCanonicalRoute(page, route.path);
    await page.addStyleTag({
      content: `
        * { letter-spacing: 0.12em !important; line-height: 1.5 !important; word-spacing: 0.16em !important; }
        p { margin-bottom: 2em !important; }
      `,
    });
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
    await expectNoHorizontalDocumentOverflow(page);

    const clippedText = await page.evaluate(() => Array.from(document.querySelectorAll<HTMLElement>('body *')).flatMap((element) => {
      const style = getComputedStyle(element);
      const hasDirectText = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
      if (!hasDirectText || element.closest('.visually-hidden') || style.display === 'none' || style.visibility === 'hidden') return [];
      const clipsX = ['hidden', 'clip'].includes(style.overflowX) && element.scrollWidth > element.clientWidth + 1;
      const clipsY = ['hidden', 'clip'].includes(style.overflowY) && element.scrollHeight > element.clientHeight + 1;
      if (!clipsX && !clipsY) return [];
      return [`${element.tagName.toLowerCase()}.${Array.from(element.classList).join('.')} (${element.textContent?.trim().slice(0, 80)})`];
    }));
    expect(clippedText, `Text clipped after spacing override:\n${clippedText.join('\n')}`).toEqual([]);
  });

  test(`${route.path} keeps keyboard focus visible and unobscured`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoCanonicalRoute(page, route.path);
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' });

    const visited = new Set<string>();
    // Cover skip navigation, global controls, primary actions, and initial in-page navigation.
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      await page.evaluate(() => {
        const element = document.activeElement;
        if (element instanceof HTMLElement && getComputedStyle(element).position !== 'fixed') {
          const rect = element.getBoundingClientRect();
          window.scrollTo(0, window.scrollY + rect.top - (window.innerHeight - rect.height) / 2);
        }
        return new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      });
      const focus = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        const x = Math.min(window.innerWidth - 1, Math.max(0, rect.left + rect.width / 2));
        const y = Math.min(window.innerHeight - 1, Math.max(0, rect.top + rect.height / 2));
        // Chromium can retain a transformed skip link in hit testing for one frame after focus moves.
        const topElement = document.elementsFromPoint(x, y)
          .find((candidate) => !candidate.matches('.skip-link:not(:focus)')) ?? null;
        const focusables = Array.from(document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'));
        return {
          key: String(focusables.indexOf(element)),
          name: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''} ${element.textContent?.trim().slice(0, 60) ?? ''}`,
          outlineStyle: style.outlineStyle,
          outlineWidth: Number.parseFloat(style.outlineWidth),
          rect: `[${rect.left.toFixed(1)}, ${rect.top.toFixed(1)}, ${rect.right.toFixed(1)}, ${rect.bottom.toFixed(1)}]`,
          topElement: topElement ? `${topElement.tagName.toLowerCase()}.${Array.from(topElement.classList).join('.')}` : 'none',
          transform: style.transform,
          visible: rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth,
          unobscured: Boolean(topElement && (element.contains(topElement) || topElement.contains(element))),
        };
      });

      if (!focus || visited.has(focus.key)) break;
      visited.add(focus.key);
      expect(focus.visible, `${focus.name} is outside the viewport: rect=${focus.rect}, transform=${focus.transform}`).toBeTruthy();
      expect(focus.unobscured, `${focus.name} is obscured by ${focus.topElement} at ${focus.rect}`).toBeTruthy();
      expect(focus.outlineStyle, `${focus.name} has no visible focus style`).not.toBe('none');
      expect(focus.outlineWidth, `${focus.name} must use the canonical 3px focus outline`).toBeGreaterThanOrEqual(3);
    }
    expect(visited.size, 'Expected at least one keyboard-focusable control').toBeGreaterThan(0);
  });
}

for (const viewport of canonicalViewports.filter(({ width }) => width <= 390)) {
  test(`project introduction stays within the first-screen density limit at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await gotoCanonicalRoute(page, '/projects/stockrush/');

    const heroHeight = await page.locator('.project-hero').evaluate((element) => element.getBoundingClientRect().height);
    const limit = Math.min(640, viewport.height * 0.7);
    expect(heroHeight, `Project introduction ${heroHeight}px exceeds ${limit}px`).toBeLessThanOrEqual(limit);
  });
}

for (const route of supplementalAuditRoutes) {
  for (const viewport of canonicalViewports) {
    test(`${route.path} reflows without horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await gotoAuditRoute(page, route);
      await expectNoHorizontalDocumentOverflow(page);
    });
  }
}

for (const viewport of boundaryViewports) {
  test(`all public pages reflow at the ${viewport.width}px layout boundary`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const route of publicAuditRoutes) {
      await gotoAuditRoute(page, route);
      await expectNoHorizontalDocumentOverflow(page);
    }
  });
}
