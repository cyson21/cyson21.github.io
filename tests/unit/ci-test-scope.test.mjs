import test from 'node:test';
import assert from 'node:assert/strict';
import { testScope, htmlStructure } from '../../scripts/ci-test-scope.mjs';

test('content changes retain route, PDF and reading checks without full regression', () => {
  assert.equal(testScope(['src/data/site.ts', 'src/content/projects/stockrush.md', 'public/downloads/resume.pdf', 'public/portfolio/index.html', 'src/data/public-assets.json']), 'content');
});
test('docs and repository instructions use the content suite', () => {
  assert.equal(testScope(['AGENTS.md', 'README.md', 'docs/reviews/review.md']), 'content');
});
test('code, styles, dependencies, CI and tests require the full suite', () => {
  for (const path of ['src/pages/index.astro', 'src/styles/portfolio-screen.css', 'public/themes/b.css', 'package.json', 'pnpm-lock.yaml', '.github/workflows/ci.yml', 'tests/e2e/routes.spec.ts']) {
    assert.equal(testScope(['src/data/site.ts', path]), 'full', path);
  }
});
test('empty or unknown changes default to full regression', () => {
  assert.equal(testScope([]), 'full');
  assert.equal(testScope(['public/new-file.html']), 'full');
});

test('integrated HTML text changes can use content checks', () => {
  assert.equal(htmlStructure('<main><p>Old wording</p></main>'), htmlStructure('<main><p>New wording</p></main>'));
});
test('integrated HTML CSS, scripts and structure trigger full regression', () => {
  for (const [before, after] of [
    ['<style>p {color: red}</style>', '<style>p {color: blue}</style>'],
    ['<script>run(1)</script>', '<script>run(2)</script>'],
    ['<main><p>Text</p></main>', '<main><h1>Text</h1></main>'],
  ]) {
    assert.notEqual(htmlStructure(before), htmlStructure(after));
    assert.equal(testScope(['public/portfolio/index.html'], true), 'full');
  }
});
