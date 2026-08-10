import { expect, test, type Page } from '@playwright/test';
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
  { role: 'lede', selector: 'main :is(.lede, .project-lede)', lineHeight: 1.6 },
  // Approved home intro uses denser leading than page lede.
  { role: 'lede', selector: 'main .hero-statement', lineHeight: 1.55 },
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

async function applyPortfolioTheme(page: Page, theme: 'b' | 'c'): Promise<void> {
  if (theme === 'c') {
    await page.evaluate(() => new Promise<void>((resolve, reject) => {
      document.documentElement.dataset.theme = 'c';
      const link = document.querySelector<HTMLLinkElement>('link[data-portfolio-theme]');
      if (!link) {
        reject(new Error('Missing portfolio theme stylesheet'));
        return;
      }
      link.addEventListener('load', () => resolve(), { once: true });
      link.addEventListener('error', () => reject(new Error('Failed to load C theme stylesheet')), { once: true });
      link.href = '/themes/c.css';
    }));
  }

  await page.waitForFunction(
    ({ expectedTheme, expectedRadius }) => {
      const root = document.documentElement;
      const link = document.querySelector<HTMLLinkElement>('link[data-portfolio-theme]');
      return root.dataset.theme === expectedTheme
        && link?.href.endsWith(`/themes/${expectedTheme}.css`)
        && getComputedStyle(root).getPropertyValue('--radius').trim() === expectedRadius;
    },
    {
      expectedTheme: theme,
      expectedRadius: theme === 'b' ? '2px' : '14px',
    },
  );
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

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

for (const theme of ['b', 'c'] as const) {
  for (const viewport of [...canonicalViewports, ...boundaryViewports]) {
    test(`resume theme ${theme.toUpperCase()} keeps its information priority and control geometry at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await gotoCanonicalRoute(page, '/resume/');
      await applyPortfolioTheme(page, theme);

      const layout = await page.evaluate(() => {
        const rect = (selector: string) => {
          const element = document.querySelector<HTMLElement>(selector);
          if (!element) throw new Error(`Missing resume element: ${selector}`);
          const bounds = element.getBoundingClientRect();
          return {
            top: bounds.top,
            right: bounds.right,
            bottom: bounds.bottom,
            left: bounds.left,
            width: bounds.width,
            height: bounds.height,
          };
        };
        const summary = document.querySelector<HTMLElement>('.resume-summary');
        const firstButton = document.querySelector<HTMLElement>('.resume-sidebar .button');
        const secondButton = document.querySelector<HTMLElement>('.resume-sidebar .button--secondary');
        const current = document.querySelector<HTMLElement>('.resume-job--current');
        const sidebar = document.querySelector<HTMLElement>('.resume-sidebar');
        const previous = document.querySelector<HTMLElement>('.resume-job--previous');
        if (!summary || !firstButton || !secondButton || !current || !sidebar || !previous) {
          throw new Error('Resume priority elements must all render');
        }
        const summaryStyle = getComputedStyle(summary);
        const precedesPrevious = Boolean(
          sidebar.compareDocumentPosition(previous) & Node.DOCUMENT_POSITION_FOLLOWING,
        );
        return {
          summary: rect('.resume-summary'),
          current: rect('.resume-job--current'),
          sidebar: rect('.resume-sidebar'),
          previous: rect('.resume-job--previous'),
          summaryPaddingInline: [
            Number.parseFloat(summaryStyle.paddingLeft),
            Number.parseFloat(summaryStyle.paddingRight),
          ],
          buttonHeights: [
            firstButton.getBoundingClientRect().height,
            secondButton.getBoundingClientRect().height,
          ],
          precedesPrevious,
        };
      });

      expect(layout.summaryPaddingInline.every((padding) => padding >= 18)).toBeTruthy();
      expect(layout.buttonHeights.every((height) => height >= 44)).toBeTruthy();
      expect(layout.precedesPrevious, 'CTA must precede previous experience in DOM order').toBeTruthy();

      if (viewport.width <= 959) {
        // Mobile order: sidebar → summary → current → previous (single column).
        // Allowed by hub UI rule (2026-08-10): sidebar may precede summary when
        // summary top < viewport height at 390x844 and 320x800.
        // Source: side-projects/docs/standards/resume-portfolio-ui-design-rules.md
        expect(layout.sidebar.bottom).toBeLessThanOrEqual(layout.summary.top + 1);
        expect(layout.summary.bottom).toBeLessThanOrEqual(layout.current.top + 1);
        expect(layout.current.bottom).toBeLessThanOrEqual(layout.previous.top + 1);
      } else {
        const columnGap = layout.current.left - layout.sidebar.right;
        expect(layout.sidebar.left).toBeLessThan(layout.current.left);
        expect(columnGap).toBeGreaterThanOrEqual(24);
        expect(columnGap).toBeLessThanOrEqual(32.1);
        expect(Math.abs(layout.summary.left - layout.current.left)).toBeLessThanOrEqual(1);
      }
    });
  }
}

for (const theme of ['b', 'c'] as const) {
  for (const viewport of [...canonicalViewports, ...boundaryViewports]) {
    test(`theme ${theme.toUpperCase()} keeps one divider boundary at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);

      await gotoCanonicalRoute(page, '/');
      await applyPortfolioTheme(page, theme);
      const homeHierarchy = await page.evaluate(() => {
        const heading = document.querySelector<HTMLElement>('#featured-projects .section-heading');
        const headingTitle = document.querySelector<HTMLElement>('#featured-projects .section-heading h2');
        const careerList = document.querySelector<HTMLElement>('.career-list');
        const careerItems = Array.from(document.querySelectorAll<HTMLElement>('.career-list li'));
        const projectRows = Array.from(document.querySelectorAll<HTMLElement>('#featured-projects .project-row'));
        const sectionLink = document.querySelector<HTMLElement>('.section-link');
        const projectLink = document.querySelector<HTMLElement>('.project-links a');
        if (!heading || !headingTitle || !careerList || careerItems.length < 2 || projectRows.length < 2 || !sectionLink || !projectLink) {
          throw new Error('Home hierarchy must render');
        }
        const style = (element: HTMLElement) => getComputedStyle(element);
        return {
          headingTop: Number.parseFloat(style(heading).borderTopWidth),
          headingAccent: Math.max(
            Number.parseFloat(style(headingTitle).borderBottomWidth),
            Number.parseFloat(getComputedStyle(headingTitle, '::after').height) || 0,
          ),
          careerTop: Number.parseFloat(style(careerList).borderTopWidth),
          lastCareerBottom: Number.parseFloat(style(careerItems.at(-1)!).borderBottomWidth),
          firstProjectTop: Number.parseFloat(style(projectRows[0]!).borderTopWidth),
          secondProjectTop: Number.parseFloat(style(projectRows[1]!).borderTopWidth),
          lastProjectBottom: Number.parseFloat(style(projectRows.at(-1)!).borderBottomWidth),
          sectionLinkDecoration: style(sectionLink).textDecorationLine,
          sectionLinkWeight: Number.parseFloat(style(sectionLink).fontWeight),
          projectLinkDecoration: style(projectLink).textDecorationLine,
          projectLinkWeight: Number.parseFloat(style(projectLink).fontWeight),
        };
      });
      expect(homeHierarchy.headingTop).toBe(0);
      expect(homeHierarchy.headingAccent).toBeGreaterThan(0);
      expect(homeHierarchy.careerTop).toBe(0);
      expect(homeHierarchy.lastCareerBottom).toBe(0);
      expect(homeHierarchy.firstProjectTop).toBe(0);
      expect(homeHierarchy.secondProjectTop).toBeGreaterThan(0);
      expect(homeHierarchy.lastProjectBottom).toBe(0);
      expect(homeHierarchy.sectionLinkDecoration).toBe('none');
      expect(homeHierarchy.sectionLinkWeight).toBeLessThanOrEqual(650);
      expect(homeHierarchy.projectLinkDecoration).toBe('none');
      expect(homeHierarchy.projectLinkWeight).toBeLessThanOrEqual(650);

      await gotoCanonicalRoute(page, '/projects/');
      await applyPortfolioTheme(page, theme);
      const projectFilter = await page.locator('.filter-bar').evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          borderBottomWidth: Number.parseFloat(style.borderBottomWidth),
          paddingBottom: Number.parseFloat(style.paddingBottom),
        };
      });
      expect(projectFilter).toEqual({ borderBottomWidth: 0, paddingBottom: 0 });

      await gotoCanonicalRoute(page, '/experience/');
      await applyPortfolioTheme(page, theme);
      const experienceBoundaries = await page.evaluate(() => {
        const list = document.querySelector<HTMLElement>('.experience-list');
        const entry = document.querySelector<HTMLElement>('.experience-entry');
        if (!list || !entry) throw new Error('Experience boundaries must render');
        return {
          listTop: Number.parseFloat(getComputedStyle(list).borderTopWidth),
          entryTop: Number.parseFloat(getComputedStyle(entry).borderTopWidth),
        };
      });
      expect(experienceBoundaries.listTop).toBe(0);
      expect(experienceBoundaries.entryTop).toBeGreaterThan(0);

      await gotoCanonicalRoute(page, '/resume/');
      await applyPortfolioTheme(page, theme);
      const resumeBoundaries = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll<HTMLElement>('.resume-layout h2'));
        const currentSection = document.querySelector<HTMLElement>('.resume-experience--current');
        const previousSection = document.querySelector<HTMLElement>('.resume-experience--previous');
        const currentJob = document.querySelector<HTMLElement>('.resume-job--current');
        const previousJob = document.querySelector<HTMLElement>('.resume-job--previous');
        if (!headings.length || !currentSection || !previousSection || !currentJob || !previousJob) {
          throw new Error('Resume boundaries must render');
        }
        return {
          headingBottoms: headings.map((heading) => Number.parseFloat(getComputedStyle(heading).borderBottomWidth)),
          currentSectionTop: Number.parseFloat(getComputedStyle(currentSection).borderTopWidth),
          previousSectionTop: Number.parseFloat(getComputedStyle(previousSection).borderTopWidth),
          currentJobTop: Number.parseFloat(getComputedStyle(currentJob).borderTopWidth),
          currentJobBottom: Number.parseFloat(getComputedStyle(currentJob).borderBottomWidth),
          previousJobTop: Number.parseFloat(getComputedStyle(previousJob).borderTopWidth),
        };
      });
      expect(resumeBoundaries.headingBottoms.every((width) => width === 0)).toBeTruthy();
      expect(resumeBoundaries.currentSectionTop).toBe(0);
      expect(resumeBoundaries.previousSectionTop).toBe(0);
      expect(resumeBoundaries.currentJobTop).toBeGreaterThan(0);
      expect(resumeBoundaries.currentJobBottom).toBeGreaterThan(0);
      expect(resumeBoundaries.previousJobTop).toBeGreaterThan(0);
    });
  }
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
