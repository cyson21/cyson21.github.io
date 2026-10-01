import { expect, test } from '@playwright/test';
import { canonicalViewports, publicAuditRoutes, gotoAuditRoute, expectNoHorizontalDocumentOverflow } from './fixtures/canonical';
import { auditReadingLayout } from './fixtures/layout-health';

const routes = [...publicAuditRoutes.filter(route => route.path !== '/resume/print/'), { id: 'integrated-portfolio', path: '/portfolio/' }];
// Exercise both sides of the integrated document's actual transition as well.
const viewports = [...canonicalViewports, { width: 959, height: 986 }, { width: 960, height: 986 }];
for (const viewport of viewports) {
  test(`public content remains usable at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await gotoAuditRoute(page, route);
      const audit = await auditReadingLayout(page);
      await testInfo.attach(`${route.id}-layout.json`, { body: JSON.stringify(audit, null, 2), contentType: 'application/json' });
      try {
        await expectNoHorizontalDocumentOverflow(page);
        expect(audit, `${route.path}: ${JSON.stringify(audit)}`).toEqual({ clipped: [], overlaps: [], brokenImages: [], brokenAnchors: [] });
      } catch (error) {
        await testInfo.attach(`${route.id}-failure.png`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
        throw error;
      }
    }
  });
}

test('reading audit detects clipping, overlap, and broken assets', async ({ page }) => {
  await page.setContent(`<section class="page"><p style="width:40px;height:10px;overflow:hidden">Text that cannot fit in this box</p></section>
    <div><div class="summary-project-card" style="height:100px">First</div><div class="summary-project-card" style="height:100px;margin-top:-50px">Second</div></div>
    <img src="data:image/png;base64,broken" width="50" height="50"><a href="#missing">Missing section</a>`);
  const audit = await auditReadingLayout(page);
  expect(audit.clipped).toHaveLength(1);
  expect(audit.overlaps).toHaveLength(1);
  expect(audit.brokenImages).toHaveLength(1);
  expect(audit.brokenAnchors).toEqual(['#missing']);
});
