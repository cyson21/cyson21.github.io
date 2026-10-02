import test from 'node:test';
import assert from 'node:assert/strict';
import * as scope from '../../scripts/ci-test-scope.mjs';

test('documentation-only changes need no site or browser checks', () => {
  assert.equal(scope.testScope(['AGENTS.md', 'README.md', 'docs/release/runbook.md']), 'docs');
});

test('experience and print changes select their routes and PDF checks', () => {
  assert.deepEqual(scope.testPlan?.(['src/pages/experience/index.astro', 'src/pages/resume/print.astro', 'public/downloads/resume.pdf']), {
    scope: 'targeted', routes: ['/experience/', '/resume/print/'],
    files: ['routes.spec.ts', 'publishing.spec.ts', 'layout-health.spec.ts', 'quality.spec.ts', 'experience-skills.spec.ts'],
    externalLinks: false,
  });
});

test('project content checks its listing, detail and integrated evidence', () => {
  const plan = scope.testPlan?.(['src/content/projects/stockrush.md']);
  assert.equal(plan?.scope, 'targeted');
  assert.deepEqual(plan?.routes, ['/portfolio/', '/projects/', '/projects/stockrush/']);
  assert.equal(plan?.externalLinks, true);
});

test('shared code, tooling, unknown paths and manual runs retain full coverage', () => {
  for (const paths of [[], ['src/layouts/BaseLayout.astro'], ['src/components/PageIntro.astro'], ['src/styles/global.css'], ['public/themes/b.css'], ['package.json'], ['.github/workflows/ci.yml'], ['scripts/check-links.mjs'], ['public/unknown.html']]) {
    assert.equal(scope.testScope(paths), 'full', paths.join(','));
  }
});

test('editing known tests selects those suites without promoting unrelated pages', () => {
  const plan = scope.testPlan?.(['tests/e2e/experience-skills.spec.ts', 'src/pages/experience/index.astro']);
  assert.equal(plan?.scope, 'targeted');
  assert.deepEqual(plan?.routes, ['/experience/']);
  assert.ok(plan?.files.includes('experience-skills.spec.ts'));
  assert.equal(scope.testScope(['playwright.config.ts']), 'full');
});

test('integrated document structure changes remain scoped to that document', () => {
  assert.equal(scope.testScope(['public/portfolio/index.html'], true), 'targeted');
  assert.notEqual(scope.htmlStructure('<main><p>Text</p></main>'), scope.htmlStructure('<main><h1>Text</h1></main>'));
});
