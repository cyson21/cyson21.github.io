import type { Page } from '@playwright/test';

// Test observable reading failures rather than exact pixels or design tokens.
export async function auditReadingLayout(page: Page) {
  return page.evaluate(() => {
    const visible = (e: Element) => {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden';
    };
    const describe = (e: Element) => `${e.tagName.toLowerCase()}${e.id ? `#${e.id}` : ''}: ${e.textContent?.trim().slice(0, 70)}`;
    const clipped = Array.from(document.querySelectorAll<HTMLElement>('body *')).flatMap(e => {
      if (!visible(e) || e.closest('.visually-hidden, svg, pre, [aria-hidden="true"]')) return [];
      // Only text-bearing boxes: cropping decoration and imagery is intentional.
      if (!e.textContent?.trim()) return [];
      const s = getComputedStyle(e);
      // Accessible mobile table headers use the standard off-screen text pattern.
      if (s.position === 'absolute' && s.clipPath === 'inset(50%)' && s.clip === 'rect(0px, 0px, 0px, 0px)') return [];
      const x = ['hidden', 'clip'].includes(s.overflowX) && e.scrollWidth > e.clientWidth + 2;
      const y = ['hidden', 'clip'].includes(s.overflowY) && e.scrollHeight > e.clientHeight + 2;
      return x || y ? [describe(e)] : [];
    });
    const overlaps: string[] = [];
    for (const selector of ['#portfolio-document > section.page', '.summary-project-card', '.capability-row', '.cover-row', '.case-arch-node']) {
      const items = Array.from(document.querySelectorAll(selector)).filter(visible);
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
        const a = items[i]!, b = items[j]!;
        if (a.parentElement !== b.parentElement) continue;
        const ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
        if (Math.min(ar.right, br.right) - Math.max(ar.left, br.left) > 2
          && Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top) > 2) {
          overlaps.push(`${describe(a)} overlaps ${describe(b)}`);
        }
      }
    }
    const brokenImages = Array.from(document.images).filter(e => visible(e) && (!e.complete || e.naturalWidth === 0)).map(e => e.getAttribute('src'));
    const brokenAnchors = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')).filter(e => {
      const hash = e.getAttribute('href')?.slice(1);
      return hash && !document.getElementById(decodeURIComponent(hash));
    }).map(e => e.getAttribute('href'));
    return { clipped, overlaps, brokenImages, brokenAnchors };
  });
}
