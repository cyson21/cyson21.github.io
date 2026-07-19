import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const [layout, bCss, cCss] = await Promise.all([
  readFile(new URL('src/layouts/BaseLayout.astro', root), 'utf8'),
  readFile(new URL('public/themes/b.css', root), 'utf8'),
  readFile(new URL('public/themes/c.css', root), 'utf8'),
]);

const revisionPattern = /Dual-theme revision:\s*([^\s|]+)/;
const bRevision = bCss.match(revisionPattern)?.[1];
const cRevision = cCss.match(revisionPattern)?.[1];

assert.ok(bRevision, 'B theme must declare a dual-theme revision');
assert.equal(cRevision, bRevision, 'B and C must be developed under the same revision');
assert.match(layout, /<html[^>]*data-theme="b"/, 'Public portfolio must default to B');
assert.match(layout, /href="\/themes\/b\.css"[^>]*data-portfolio-theme/, 'Public portfolio must load B');

for (const [name, css] of [['B', bCss], ['C', cCss]]) {
  const id = name.toLowerCase();
  const scope = `html[data-theme="${id}"]`;

  assert.doesNotMatch(css, /data-astro-cid-/, `${name} must not depend on generated Astro scope IDs`);
  assert.doesNotMatch(css, /@import\s+url\(\s*["']?https?:/i, `${name} must not require a remote font stylesheet`);
  assert.doesNotMatch(css, /(^|\n)\s*:root\s*\{/m, `${name} must scope its variables to its theme`);
  assert.match(css, new RegExp(`${scope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{`), `${name} must declare a theme root`);
  assert.match(css, new RegExp(`${scope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+\\.site-header\\s*\\{`), `${name} selectors must be theme-scoped`);
  assert.match(css, /"Malgun Gothic"/, `${name} must keep a Windows Korean fallback`);
  assert.match(css, /@media\s*\(max-width:\s*639px\)/, `${name} must include mobile rules`);
  assert.match(css, /forced-colors:\s*active/, `${name} must include forced-colors support`);
}

assert.match(bCss, /--blue:\s*#0057ff/i);
assert.match(bCss, /--amber:\s*#b7f34a/i);
assert.match(bCss, /--green:\s*#06705c/i);
assert.match(bCss, /--contact-copy:\s*#f4f7ff/i);
assert.match(bCss, /--career-marker-gutter:\s*18px/i);
assert.match(cCss, /--blue:\s*#704163/i);
assert.match(cCss, /--green:\s*#2f6f69/i);
assert.match(cCss, /--contact-copy:\s*#5d5861/i);
assert.match(cCss, /--career-marker-gutter:\s*0px/i);

for (const [id, css] of [['b', bCss], ['c', cCss]]) {
  assert.match(
    css,
    new RegExp(
      `html\\[data-theme="${id}"\\] \\.wordmark-role,[\\s\\S]*?` +
      `html\\[data-theme="${id}"\\] \\.pagination-grid a span\\s*\\{\\s*` +
      `font-family:\\s*var\\(--sans\\)`,
    ),
    `${id.toUpperCase()} must use the text font for Korean interface labels`,
  );
}

console.log(`Dual-theme check passed: revision ${bRevision}, public B + companion C`);
