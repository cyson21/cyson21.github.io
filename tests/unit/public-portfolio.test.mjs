import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = join(import.meta.dirname, '..', '..');
const integratedPortfolioPath = join(root, 'public', 'portfolio', 'index.html');
const projectsDirectory = join(root, 'src', 'content', 'projects');

function readIntegratedPortfolio() {
  return readFileSync(integratedPortfolioPath, 'utf8');
}

function summaryGridBody(html) {
  const openingTag = '<div class="summary-project-grid">';
  const start = html.indexOf(openingTag);
  const end = html.indexOf('<div class="quote">', start + openingTag.length);
  assert.notEqual(start, -1, 'integrated portfolio must contain its summary grid');
  assert.notEqual(end, -1, 'integrated portfolio must contain its summary note');
  return html.slice(start + openingTag.length, end);
}

test('integrated portfolio keeps the generated summary project cards', () => {
  const html = readIntegratedPortfolio();
  const summary = summaryGridBody(html);
  const cards = summary.match(/<article class="summary-project-card"/g) ?? [];

  assert.equal(cards.length, 6, 'the generated integrated portfolio must expose all six project cards');
  for (const label of [
    'StockRush',
    'Enterprise Policy RAG',
    'Member Event Consistency',
    'AI Gateway',
    'CDC Data Platform',
    'Fashion Personalization Platform',
  ]) {
    assert.match(summary, new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /종단 연결은 구현하지 않았습니다/);
  assert.match(html, /운영 규모 부하/);
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
