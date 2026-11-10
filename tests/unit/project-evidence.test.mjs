import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
const require = createRequire(import.meta.resolve('astro/package.json'));
const { load } = require('js-yaml');
const root = new URL('../../src/content/projects/', import.meta.url);
for (const file of readdirSync(root).filter(name => name.endsWith('.md'))) {
  test(`${file} binds claims and result sources to its reviewed commit`, () => {
    const data = load(readFileSync(new URL(file, root), 'utf8').match(/^---\n([\s\S]*?)\n---/)[1]);
    const slug = file.replace(/\.md$/, '');
    assert.match(data.evidenceReview.commit, /^[a-f0-9]{40}$/);
    assert.equal(data.evidenceReview.sourceUrl, `https://github.com/cyson21/${slug}/tree/${data.evidenceReview.commit}`);
    assert.ok(data.evidenceReview.ciUrl.startsWith(`https://github.com/cyson21/${slug}/actions/runs/`));
    const prefix = `https://github.com/cyson21/${slug}/blob/${data.evidenceReview.commit}/`;
    for (const row of data.verification) {
      assert.ok(['ci-record', 'local-rerun', 'test-definition'].includes(row.evidenceStatus));
      assert.ok(row.sources.length > 0, 'Every result requires an explicit source, never an array-position join');
      for (const source of row.sources) { assert.ok(source.label); assert.ok(source.url.startsWith(prefix), source.url); }
    }
    for (const item of data.codeEvidence) { assert.ok(item.sourceUrl.startsWith(prefix)); assert.ok(item.testUrl.startsWith(prefix)); }
    for (const item of data.signals) assert.ok(item.sourceUrl.startsWith(prefix));
    if (slug === 'cdc-data-platform') {
      assert.equal(data.visual.connected, false, 'Independent prototype modules must not be drawn as one pipeline');
      assert.ok(data.verification.some(row => row.evidenceStatus === 'test-definition'), 'The uncaptured runtime script must not become a CI result');
    }
  });
}
