import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = join(import.meta.dirname, '..', '..');
const integratedPortfolioPath = join(root, 'public', 'portfolio', 'cases.html');
const projectsDirectory = join(root, 'src', 'content', 'projects');

function readIntegratedPortfolio() {
  return readFileSync(integratedPortfolioPath, 'utf8');
}

test('work portfolio retains the five professional cases without duplicating personal project details', () => {
  const html = readIntegratedPortfolio();
  assert.equal((html.match(/<article class="work-case"/g) ?? []).length, 5);
  assert.doesNotMatch(html, /<section class="page case-page/);
  assert.doesNotMatch(html, /class="case-code-snippet"/);
  for (const slug of ['stockrush', 'member-event-consistency', 'enterprise-policy-rag', 'ai-gateway', 'cdc-data-platform', 'fashion-personalization-platform']) {
    const source = readFileSync(join(projectsDirectory, `${slug}.md`), 'utf8');
    assert.equal((source.match(/^  - symbol:/gm) ?? []).length, 3, `${slug} keeps its three canonical code evidence entries`);
  }
  const articles = html.match(/<article class="work-case"[\s\S]*?<\/article>/g) ?? [];
  for (const article of articles) assert.doesNotMatch(article, /href="\/projects\//);
});

test('overview legacy links route to one canonical personal project page', () => {
  const html = readFileSync(join(root, 'public', 'portfolio', 'index.html'), 'utf8');
  assert.doesNotMatch(html, /class="project-card"/);
  for (const slug of ['stockrush', 'member-event-consistency', 'enterprise-policy-rag', 'ai-gateway', 'cdc-data-platform', 'fashion-personalization-platform']) assert.ok(html.includes(`/projects/${slug}/`));
  assert.match(html, /href="\/projects\/"/);
});

test('project publication flags keep the three representative projects and detail-only projects', () => {
  const readFeatured = (slug) => {
    const source = readFileSync(join(projectsDirectory, `${slug}.md`), 'utf8');
    const match = source.match(/^featured:\s*(true|false)\s*$/m);
    assert.ok(match, `${slug} must declare a featured flag`);
    return match[1] === 'true';
  };

  assert.deepEqual(
    ['stockrush', 'member-event-consistency', 'enterprise-policy-rag'].map(readFeatured),
    [true, true, true],
  );
  assert.equal(readFeatured('cdc-data-platform'), false);
  assert.equal(readFeatured('fashion-personalization-platform'), false);
});

test('manifest-approved text assets use LF line endings', () => {
  for (const relativePath of [
    'public/portfolio/index.html',
    'public/portfolio/cases.html',
    'public/icons/favicon.svg',
  ]) {
    const contents = readFileSync(join(root, relativePath), 'utf8');
    assert.doesNotMatch(contents, /\r/, `${relativePath} must use LF line endings so SHA-256 stays platform-independent`);
  }
});

test('reading layout retains work-case navigation when regenerated', async () => {
  const { applyReadingLayout } = await import('../../scripts/portfolio-reading-layout.mjs');
  const source = '<body><section class="page work-cases" id="work-cases"><article id="work-policy">Policy</article></section><section class="page complete-sheet" data-page="02">Projects</section></body>';
  const once = applyReadingLayout(source);
  const twice = applyReadingLayout(once);
  for (const html of [once, twice]) {
    assert.match(html, /href="\/portfolio\/"/);
    assert.match(html, /id="work-policy"/);
    assert.match(html, /id="portfolio-results"/);
    assert.equal((html.match(/<nav /g) ?? []).length, 1);
  }
});

test('integrated reading layout keeps one main landmark across regeneration', async () => {
  const { applyReadingLayout } = await import('../../scripts/portfolio-reading-layout.mjs');
  const source = '<body><section class="page case-page" data-page="04"><main class="case-main"><h2>Evidence</h2></main></section></body>';
  const once = applyReadingLayout(source);
  const twice = applyReadingLayout(once);
  for (const html of [once, twice]) {
    assert.equal((html.match(/<main[ >]/g) ?? []).length, 1);
    assert.equal((html.match(/<\/main>/g) ?? []).length, 1);
    assert.equal((html.match(/<nav /g) ?? []).length, 1);
    assert.match(html, /<div class="case-main"><h2>Evidence<\/h2><\/div>/);
  }
});

test('reading navigation only links to retained sections and preserves their anchors', async () => {
  const { applyReadingLayout } = await import('../../scripts/portfolio-reading-layout.mjs');
  const source = '<body><section class="page cover" id="portfolio-intro" data-page="01">Intro</section><section class="page work-cases" id="work-cases">Work</section><section class="page complete-sheet" id="portfolio-results" data-page="02">Index</section><section class="page case-page" id="member-event-consistency" data-page="05">Code</section><section id="portfolio-scope">Scope</section></body>';
  for (const html of [applyReadingLayout(source), applyReadingLayout(applyReadingLayout(source))]) {
    const nav = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/)[0];
    assert.doesNotMatch(nav, /portfolio-capabilities|#stockrush|#member-event-consistency/);
    assert.doesNotMatch(nav, /href="#portfolio-scope"/);
    assert.match(nav, /href="\/projects\/"/);
    for (const [, anchor] of nav.matchAll(/href="#([^"]+)"/g)) {
      assert.ok(html.includes(`id="${anchor}"`), `missing navigation target: ${anchor}`);
    }
  }
});

test('web professional narratives retain the same contribution scope as career PDF data', () => {
  const model = JSON.parse(readFileSync(join(root, 'src/data/professional-case-narratives.json'), 'utf8'));
  const html = readIntegratedPortfolio();
  const cases = [...model.sheets.flatMap(sheet => sheet.cases), model.messaging];
  for (const item of cases) {
    const article = html.match(new RegExp(`<article class="work-case" id="${item.anchor}">[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(article, `missing ${item.anchor}`);
    assert.ok(article.includes(item.title), `${item.anchor} title matches the canonical narrative`);
    assert.ok(article.includes(item.responsibility), `${item.anchor} retains contribution scope`);
    assert.ok(article.includes(item.result), `${item.anchor} retains the supported outcome`);
    assert.doesNotMatch(article, /테스트 범위|테스트·확인 내용|확인하지 못했습니다/);
  }
});

test('professional content regeneration preserves case order and both batch sequences', async () => {
  const { applyProfessionalNarratives } = await import('../../scripts/professional-case-content.mjs');
  const html = readIntegratedPortfolio();
  const once = applyProfessionalNarratives(html);
  assert.equal(applyProfessionalNarratives(once), once);
  const anchors = [...once.matchAll(/<article class="work-case" id="([^"]+)">/g)].map(match => match[1]);
  assert.deepEqual(anchors, ['work-batch', 'work-purchase', 'work-policy', 'work-identity', 'work-messaging']);
  assert.equal((once.match(/class="batch-flow-steps"/g) ?? []).length, 2);
});
