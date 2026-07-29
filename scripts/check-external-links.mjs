#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  checkExternalLinks,
  collectExternalLinks,
  failingResults,
  formatResultLine,
  loadAllowlistFile,
  selectLinksForMode,
  summarizeResults,
} from './lib/external-links.mjs';

function parseArgs(argv) {
  const options = {
    mode: 'smoke',
    root: resolve(import.meta.dirname, '..'),
    allowlist: resolve(import.meta.dirname, '../config/external-link-allowlist.json'),
    report: null,
    timeoutMs: 10_000,
    retries: 2,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mode') options.mode = argv[++i];
    else if (arg.startsWith('--mode=')) options.mode = arg.slice('--mode='.length);
    else if (arg === '--root') options.root = resolve(argv[++i]);
    else if (arg.startsWith('--root=')) options.root = resolve(arg.slice('--root='.length));
    else if (arg === '--allowlist') options.allowlist = resolve(argv[++i]);
    else if (arg.startsWith('--allowlist=')) options.allowlist = resolve(arg.slice('--allowlist='.length));
    else if (arg === '--report') options.report = resolve(argv[++i]);
    else if (arg.startsWith('--report=')) options.report = resolve(arg.slice('--report='.length));
    else if (arg === '--timeout-ms') options.timeoutMs = Number(argv[++i]);
    else if (arg === '--retries') options.retries = Number(argv[++i]);
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--') continue;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['smoke', 'full'].includes(options.mode)) {
    throw new Error(`--mode must be smoke or full (got ${options.mode})`);
  }
  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/check-external-links.mjs [--mode=smoke|full] [options]

Checks HTTPS external links from content sources (not dist HTML).
Internal link checking remains in scripts/check-links.mjs.

Options:
  --mode=smoke|full   smoke: unique hosts from github/demo/link fields (PR)
                      full: every collected HTTPS URL (weekly)
  --root=DIR          repository root
  --allowlist=FILE    JSON allowlist requiring url|host, reason, expiresOn
  --report=FILE       write JSON report
  --timeout-ms=N      per-request timeout (default 10000)
  --retries=N         bounded retries for transient failures (default 2)

Exit policy:
  fail  -> permanent broken (401/404/410/invalid/ENOTFOUND) not on allowlist
  warn  -> 403/429/transient 5xx/EAI_AGAIN/timeout soft failures (exit 0)
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }

  const allowlist = loadAllowlistFile(options.allowlist);
  const collected = collectExternalLinks(options.root);
  const selected = selectLinksForMode(collected, options.mode);
  const results = await checkExternalLinks(selected, allowlist, {
    timeoutMs: options.timeoutMs,
    retries: options.retries,
  });
  const summary = summarizeResults(results);
  const failures = failingResults(results);
  const soft = [
    ...summary.blocked,
    ...summary.rate_limited,
    ...summary.transient,
  ];

  console.log(`External link check (${options.mode}): ${selected.length} URL(s) from ${collected.length} collected`);
  console.log(`ok=${summary.ok.length} allowlisted=${summary.allowlisted.length} broken=${summary.broken.length} invalid=${summary.invalid.length} blocked=${summary.blocked.length} rate_limited=${summary.rate_limited.length} transient=${summary.transient.length}`);

  if (soft.length > 0) {
    console.warn(`Soft network/policy findings (${soft.length}) — not permanent broken:`);
    for (const result of soft) console.warn(`- ${formatResultLine(result)}`);
  }

  if (failures.length > 0) {
    console.error(`Permanent failures (${failures.length}):`);
    for (const result of failures) console.error(`- ${formatResultLine(result)}`);
  }

  if (options.report) {
    mkdirSync(dirname(options.report), { recursive: true });
    writeFileSync(options.report, `${JSON.stringify({
      mode: options.mode,
      checkedAt: new Date().toISOString(),
      policy: {
        permanentFail: ['broken', 'invalid'],
        softWarn: ['blocked', 'rate_limited', 'transient'],
        probe: 'HEAD first, limited GET fallback, follow redirects, bounded retry',
      },
      counts: Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, value.length])),
      results: results.map((result) => ({
        url: result.ref.url,
        file: result.ref.file,
        field: result.ref.field,
        line: result.ref.line,
        status: result.status,
        httpStatus: result.httpStatus ?? null,
        method: result.method ?? null,
        detail: result.detail,
      })),
    }, null, 2)}\n`);
    console.log(`Wrote report ${options.report}`);
  }

  if (failures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
