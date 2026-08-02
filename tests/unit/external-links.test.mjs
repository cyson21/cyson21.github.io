import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  cancelResponseBody,
  checkExternalLinks,
  classifyHttpStatus,
  classifyNetworkError,
  collectExternalLinks,
  failingResults,
  isAllowlisted,
  parseAllowlist,
  probeUrl,
  selectLinksForMode,
  summarizeResults,
} from '../../scripts/lib/external-links.mjs';

const fixtureRoot = join(import.meta.dirname, '../fixtures/external-links');

test('parseAllowlist requires url or host, reason, and future expiresOn', () => {
  assert.throws(
    () => parseAllowlist({ entries: [{ reason: 'x', expiresOn: '2099-01-01' }] }),
    /url or host/,
  );
  assert.throws(
    () => parseAllowlist({ entries: [{ host: 'example.com', expiresOn: '2099-01-01' }] }),
    /reason/,
  );
  assert.throws(
    () => parseAllowlist({
      entries: [{ host: 'example.com', reason: 'old', expiresOn: '2020-01-01' }],
    }, { now: new Date('2026-07-29T00:00:00Z') }),
    /expired/,
  );
  const parsed = parseAllowlist({
    entries: [{
      url: 'https://example.com/path',
      reason: 'temporary CDN block',
      expiresOn: '2099-06-01',
    }],
  });
  assert.equal(parsed.entries.length, 1);
});

test('collectExternalLinks traces file, field, and line from markdown fixtures', () => {
  const root = mkdtempSync(join(tmpdir(), 'external-links-'));
  const projects = join(root, 'src/content/projects');
  mkdirSync(projects, { recursive: true });
  mkdirSync(join(root, 'src/data'), { recursive: true });
  writeFileSync(join(projects, 'sample.md'), `
---
name: Fixture
links:
  github: https://github.com/example/fixture-ok
  demo: https://example.com/missing-demo
signals:
  - label: ok
    sourceUrl: https://github.com/example/fixture-ok/blob/main/README.md
---

Body https://ignored.example/body
`.trimStart());
  writeFileSync(join(root, 'src/data/site.ts'), `
export const profile = {
  github: 'https://github.com/cyson21',
} as const;
`.trimStart());

  const refs = collectExternalLinks(root);
  assert.ok(refs.some((ref) => ref.field === 'github' && ref.url.includes('fixture-ok')));
  assert.ok(refs.some((ref) => ref.field === 'demo' && ref.line > 0));
  assert.ok(refs.some((ref) => ref.field === 'sourceUrl'));
  assert.ok(refs.some((ref) => ref.field === 'profile.github'));
  assert.equal(refs.some((ref) => ref.url.includes('ignored.example')), false);

  const smoke = selectLinksForMode(refs, 'smoke');
  assert.ok(smoke.every((ref) => ref.priority === 'smoke'));
  assert.ok(smoke.length <= refs.length);
  const hosts = new Set(smoke.map((ref) => new URL(ref.url).host));
  assert.equal(hosts.size, smoke.length);
});

test('classifyHttpStatus separates permanent broken from soft failures', () => {
  assert.equal(classifyHttpStatus(200), 'ok');
  assert.equal(classifyHttpStatus(301), 'ok');
  assert.equal(classifyHttpStatus(404), 'broken');
  assert.equal(classifyHttpStatus(410), 'broken');
  assert.equal(classifyHttpStatus(401), 'broken');
  assert.equal(classifyHttpStatus(403), 'blocked');
  assert.equal(classifyHttpStatus(429), 'rate_limited');
  assert.equal(classifyHttpStatus(503), 'transient');
  assert.equal(classifyNetworkError({ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' }), 'broken');
  assert.equal(classifyNetworkError({ code: 'EAI_AGAIN', message: 'getaddrinfo EAI_AGAIN' }), 'transient');
  assert.equal(classifyNetworkError({ code: 'ETIMEDOUT', message: 'timeout' }), 'transient');
});

test('probeUrl prefers HEAD and falls back to ranged GET when HEAD is rejected', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ method: init.method, range: init.headers?.Range ?? init.headers?.range });
    if (init.method === 'HEAD') {
      return new Response(null, { status: 405, headers: { allow: 'GET, OPTIONS' } });
    }
    return new Response('ok', { status: 200 });
  };
  const result = await probeUrl('https://example.com/resource', { fetchImpl, retries: 0 });
  assert.deepEqual(calls.map((call) => call.method), ['HEAD', 'GET']);
  assert.equal(calls[1].range, 'bytes=0-0');
  assert.equal(result.status, 'ok');
  assert.equal(result.method, 'GET');
});

test('probeUrl GET fallback cancels the response body after status is known', async () => {
  let cancelCount = 0;
  const fetchImpl = async (_url, init) => {
    if (init.method === 'HEAD') {
      return new Response(null, { status: 405, headers: { allow: 'GET' } });
    }
    const body = {
      cancel: async () => {
        cancelCount += 1;
      },
    };
    return {
      status: 200,
      headers: new Headers(),
      body,
    };
  };
  const result = await probeUrl('https://example.com/resource', { fetchImpl, retries: 0 });
  assert.equal(result.status, 'ok');
  assert.equal(result.method, 'GET');
  assert.equal(cancelCount, 1);
});

test('cancelResponseBody ignores responses without a cancelable body', async () => {
  await cancelResponseBody({ status: 204, body: null });
  await cancelResponseBody({ status: 204, body: {} });
});

test('checkExternalLinks allowlists hosts and fails only permanent broken', async () => {
  const allowlist = parseAllowlist({
    entries: [{
      host: 'blocked.example',
      reason: 'fixture host',
      expiresOn: '2099-01-01',
    }],
  });
  assert.ok(isAllowlisted('https://blocked.example/x', allowlist));

  const fetchImpl = async (url) => {
    if (String(url).includes('missing')) return new Response(null, { status: 404 });
    if (String(url).includes('soft')) return new Response(null, { status: 503 });
    return new Response(null, { status: 200 });
  };

  const refs = [
    { url: 'https://ok.example/', file: 'a.md', field: 'github', line: 1, priority: 'smoke' },
    { url: 'https://example.com/missing', file: 'a.md', field: 'demo', line: 2, priority: 'smoke' },
    { url: 'https://example.com/soft', file: 'a.md', field: 'demo', line: 3, priority: 'full' },
    { url: 'https://blocked.example/x', file: 'a.md', field: 'demo', line: 4, priority: 'full' },
  ];
  const results = await checkExternalLinks(refs, allowlist, { fetchImpl, retries: 0 });
  const summary = summarizeResults(results);
  assert.equal(summary.ok.length, 1);
  assert.equal(summary.broken.length, 1);
  assert.equal(summary.transient.length, 1);
  assert.equal(summary.allowlisted.length, 1);
  assert.equal(failingResults(results).length, 1);
  assert.match(failingResults(results)[0].ref.url, /missing/);
});

test('fixture allowlist file parses', async () => {
  const { readFileSync } = await import('node:fs');
  const raw = JSON.parse(readFileSync(join(fixtureRoot, 'allowlist.json'), 'utf8'));
  const parsed = parseAllowlist(raw, { now: new Date('2026-07-29T00:00:00Z') });
  assert.equal(parsed.entries[0].host, 'blocked.example');
});
