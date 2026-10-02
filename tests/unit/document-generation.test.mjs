import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

const root = resolve(import.meta.dirname, '../..');
test('unknown document selection exits before touching the existing resume PDF', () => {
  const path = resolve(root, 'public/downloads/resume.pdf');
  const before = readFileSync(path);
  const result = spawnSync(process.execPath, ['scripts/generate-public-resume.mjs', '--document=typo'], {
    cwd: root, encoding: 'utf8', timeout: 15000,
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown document: typo/);
  assert.deepEqual(readFileSync(path), before);
});
