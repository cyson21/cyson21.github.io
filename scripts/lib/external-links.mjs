import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

export const DEFAULT_TIMEOUT_MS = 10_000;
export const DEFAULT_RETRIES = 2;
export const DEFAULT_RETRY_DELAY_MS = 500;
export const USER_AGENT = 'portfolio-web-external-link-check/1.0 (+https://github.com/cyson21/cyson21.github.io)';

const HTTPS_URL_RE = /https:\/\/[^\s"'`<>)\\]]+/g;
const FIELD_URL_RE = /^\s*([A-Za-z0-9_.\[\]]+):\s*(https:\/\/\S+)\s*$/;
const LIST_URL_RE = /^\s*-\s*(https:\/\/\S+)\s*$/;

/**
 * @typedef {{ url: string, file: string, field: string, line: number, priority: 'smoke' | 'full' }} ExternalLinkRef
 * @typedef {{ url?: string, host?: string, reason: string, expiresOn: string }} AllowlistEntry
 * @typedef {'ok' | 'broken' | 'blocked' | 'rate_limited' | 'transient' | 'allowlisted' | 'invalid'} LinkStatus
 * @typedef {{ ref: ExternalLinkRef, status: LinkStatus, httpStatus?: number, method?: string, detail: string, allowlisted?: boolean }} LinkCheckResult
 */

export function todayUtcDateString(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function parseAllowlist(raw, { now = new Date() } = {}) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.entries)) {
    throw new Error('allowlist must be an object with an entries array');
  }
  const today = todayUtcDateString(now);
  /** @type {AllowlistEntry[]} */
  const entries = [];
  for (const [index, entry] of raw.entries.entries()) {
    if (!entry || typeof entry !== 'object') {
      throw new Error(`allowlist.entries[${index}] must be an object`);
    }
    const hasUrl = typeof entry.url === 'string' && entry.url.length > 0;
    const hasHost = typeof entry.host === 'string' && entry.host.length > 0;
    if (!hasUrl && !hasHost) {
      throw new Error(`allowlist.entries[${index}] requires url or host`);
    }
    if (typeof entry.reason !== 'string' || entry.reason.trim().length === 0) {
      throw new Error(`allowlist.entries[${index}] requires reason`);
    }
    if (typeof entry.expiresOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.expiresOn)) {
      throw new Error(`allowlist.entries[${index}] requires expiresOn as YYYY-MM-DD`);
    }
    if (entry.expiresOn < today) {
      throw new Error(`allowlist.entries[${index}] expired on ${entry.expiresOn}`);
    }
    entries.push({
      url: hasUrl ? entry.url : undefined,
      host: hasHost ? entry.host : undefined,
      reason: entry.reason.trim(),
      expiresOn: entry.expiresOn,
    });
  }
  return { entries };
}

export function isAllowlisted(url, allowlist) {
  let host;
  try {
    host = new URL(url).host;
  } catch {
    return null;
  }
  return allowlist.entries.find((entry) => {
    if (entry.url && entry.url === url) return true;
    if (entry.host && entry.host === host) return true;
    return false;
  }) ?? null;
}

function stripTrailingPunctuation(url) {
  return url.replace(/[.,;:!?)\]}>]+$/g, '');
}

function inferFieldFromContext(lines, lineIndex) {
  for (let i = lineIndex; i >= 0; i -= 1) {
    const line = lines[i];
    const indentedKey = line.match(/^(\s*)([A-Za-z0-9_]+):\s*(?:\|>-?|>-?|\|-?)?\s*$/);
    if (indentedKey) return indentedKey[2];
    const keyValue = line.match(/^(\s*)([A-Za-z0-9_]+):\s+/);
    if (keyValue && i === lineIndex) return keyValue[2];
    if (/^[A-Za-z0-9_]+:\s*$/.test(line.trim()) || /^[A-Za-z0-9_]+:\s+\S/.test(line)) {
      const top = line.match(/^([A-Za-z0-9_]+):/);
      if (top && !line.startsWith(' ') && !line.startsWith('\t')) return top[1];
    }
  }
  return 'unknown';
}

function collectFromMarkdown(filePath, relativeFile, text) {
  /** @type {ExternalLinkRef[]} */
  const refs = [];
  const lines = text.split(/\r?\n/);
  let inFrontmatter = false;
  let frontmatterDone = false;
  let frontmatterStart = -1;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (i === 0 && line.trim() === '---') {
      inFrontmatter = true;
      frontmatterStart = i;
      continue;
    }
    if (inFrontmatter && line.trim() === '---') {
      inFrontmatter = false;
      frontmatterDone = true;
      continue;
    }
    if (!inFrontmatter && frontmatterDone) break;
    if (!inFrontmatter && frontmatterStart < 0) break;

    const fieldMatch = line.match(FIELD_URL_RE);
    if (fieldMatch) {
      const url = stripTrailingPunctuation(fieldMatch[2]);
      refs.push({
        url,
        file: relativeFile,
        field: fieldMatch[1],
        line: i + 1,
        priority: smokeField(fieldMatch[1]) ? 'smoke' : 'full',
      });
      continue;
    }

    const listMatch = line.match(LIST_URL_RE);
    if (listMatch) {
      const url = stripTrailingPunctuation(listMatch[1]);
      refs.push({
        url,
        file: relativeFile,
        field: inferFieldFromContext(lines, i),
        line: i + 1,
        priority: 'full',
      });
      continue;
    }

    for (const match of line.matchAll(HTTPS_URL_RE)) {
      const url = stripTrailingPunctuation(match[0]);
      const field = inferFieldFromContext(lines, i);
      refs.push({
        url,
        file: relativeFile,
        field,
        line: i + 1,
        priority: smokeField(field) ? 'smoke' : 'full',
      });
    }
  }
  return refs;
}

function smokeField(field) {
  return /^(github|demo|adr|design|testReport|links\.(github|demo|adr|design|testReport))$/.test(field)
    || field === 'github'
    || field === 'demo'
    || field === 'links';
}

function collectFromSiteTs(filePath, relativeFile, text) {
  /** @type {ExternalLinkRef[]} */
  const refs = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/\bgithub:\s*'(https:\/\/[^']+)'/);
    if (match) {
      refs.push({
        url: match[1],
        file: relativeFile,
        field: 'profile.github',
        line: i + 1,
        priority: 'smoke',
      });
    }
  }
  return refs;
}

export function collectExternalLinks(rootDir) {
  const root = resolve(rootDir);
  /** @type {ExternalLinkRef[]} */
  const refs = [];

  const projectsDir = join(root, 'src/content/projects');
  if (existsSync(projectsDir)) {
    for (const name of readdirSync(projectsDir).sort()) {
      if (!name.endsWith('.md')) continue;
      const absolute = join(projectsDir, name);
      const relativeFile = relative(root, absolute);
      refs.push(...collectFromMarkdown(absolute, relativeFile, readFileSync(absolute, 'utf8')));
    }
  }

  const siteTs = join(root, 'src/data/site.ts');
  if (existsSync(siteTs)) {
    refs.push(...collectFromSiteTs(siteTs, relative(root, siteTs), readFileSync(siteTs, 'utf8')));
  }

  return dedupeRefs(refs);
}

function dedupeRefs(refs) {
  const seen = new Map();
  for (const ref of refs) {
    const key = `${ref.url}|${ref.file}|${ref.field}|${ref.line}`;
    if (!seen.has(key)) seen.set(key, ref);
  }
  return [...seen.values()];
}

export function selectLinksForMode(refs, mode) {
  if (mode === 'full') return refs;
  if (mode !== 'smoke') throw new Error(`unsupported mode: ${mode}`);

  const byUrl = new Map();
  for (const ref of refs) {
    if (ref.priority !== 'smoke') continue;
    if (!byUrl.has(ref.url)) byUrl.set(ref.url, ref);
  }
  // Prefer unique hosts for smoke when many URLs share a host.
  const byHost = new Map();
  for (const ref of byUrl.values()) {
    const host = new URL(ref.url).host;
    const current = byHost.get(host);
    if (!current || smokeRank(ref) < smokeRank(current)) byHost.set(host, ref);
  }
  return [...byHost.values()].sort((a, b) => a.url.localeCompare(b.url));
}

function smokeRank(ref) {
  if (ref.field === 'profile.github') return 0;
  if (ref.field === 'github' || ref.field === 'demo') return 1;
  if (['adr', 'design', 'testReport'].includes(ref.field)) return 2;
  return 3;
}

export function classifyHttpStatus(status) {
  if (status >= 200 && status < 400) return 'ok';
  if (status === 404 || status === 410 || status === 451) return 'broken';
  if (status === 401 || status === 403) return 'blocked';
  if (status === 429) return 'rate_limited';
  if (status === 408 || status === 425 || status === 500 || status === 502 || status === 503 || status === 504) {
    return 'transient';
  }
  if (status >= 400 && status < 500) return 'broken';
  if (status >= 500) return 'transient';
  return 'broken';
}

export function classifyNetworkError(error) {
  const code = error?.cause?.code || error?.code || '';
  const message = String(error?.message || error);
  if (['ENOTFOUND', 'EAI_AGAIN'].includes(code) || /getaddrinfo/i.test(message)) return 'broken';
  if (['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT', 'AbortError'].includes(code)
    || /aborted|timeout|network/i.test(message)) {
    return 'transient';
  }
  return 'transient';
}

async function sleep(ms) {
  await new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function fetchOnce(url, { method, timeoutMs, redirect, fetchImpl }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method,
      redirect,
      signal: controller.signal,
      headers: {
        'user-agent': USER_AGENT,
        accept: '*/*',
      },
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * HEAD first; if the server rejects HEAD, fall back to a bounded GET.
 */
export async function probeUrl(url, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    redirect = 'follow',
    fetchImpl = globalThis.fetch,
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      let response = await fetchOnce(url, { method: 'HEAD', timeoutMs, redirect, fetchImpl });
      let method = 'HEAD';
      if ([405, 501].includes(response.status) || (response.status === 403 && response.headers.get('allow')?.includes('GET'))) {
        response = await fetchOnce(url, { method: 'GET', timeoutMs, redirect, fetchImpl });
        method = 'GET';
      } else if (response.status === 403 || response.status === 404) {
        // Some hosts reject HEAD with a misleading status; confirm with GET once.
        const getResponse = await fetchOnce(url, { method: 'GET', timeoutMs, redirect, fetchImpl });
        response = getResponse;
        method = 'GET';
      }

      const status = classifyHttpStatus(response.status);
      if (status === 'transient' && attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      return {
        status,
        httpStatus: response.status,
        method,
        detail: `${method} ${response.status}`,
      };
    } catch (error) {
      lastError = error;
      const status = classifyNetworkError(error);
      if (status === 'transient' && attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
        continue;
      }
      return {
        status,
        method: 'HEAD',
        detail: String(error?.message || error),
      };
    }
  }
  return {
    status: classifyNetworkError(lastError),
    method: 'HEAD',
    detail: String(lastError?.message || lastError || 'unknown error'),
  };
}

export async function checkExternalLinks(refs, allowlist, options = {}) {
  /** @type {LinkCheckResult[]} */
  const results = [];
  for (const ref of refs) {
    let parsedOk = true;
    try {
      const parsed = new URL(ref.url);
      if (parsed.protocol !== 'https:') parsedOk = false;
    } catch {
      parsedOk = false;
    }
    if (!parsedOk) {
      results.push({
        ref,
        status: 'invalid',
        detail: 'URL is not a valid HTTPS URL',
      });
      continue;
    }

    const allow = isAllowlisted(ref.url, allowlist);
    if (allow) {
      results.push({
        ref,
        status: 'allowlisted',
        detail: `allowlisted until ${allow.expiresOn}: ${allow.reason}`,
        allowlisted: true,
      });
      continue;
    }

    const probed = await probeUrl(ref.url, options);
    results.push({
      ref,
      status: probed.status,
      httpStatus: probed.httpStatus,
      method: probed.method,
      detail: probed.detail,
    });
  }
  return results;
}

export function summarizeResults(results) {
  const groups = {
    ok: [],
    broken: [],
    blocked: [],
    rate_limited: [],
    transient: [],
    allowlisted: [],
    invalid: [],
  };
  for (const result of results) {
    groups[result.status].push(result);
  }
  return groups;
}

export function formatResultLine(result) {
  const { ref } = result;
  return `${ref.file}:${ref.line} field=${ref.field} url=${ref.url} -> ${result.status} (${result.detail})`;
}

export function failingResults(results) {
  return results.filter((result) => result.status === 'broken' || result.status === 'invalid');
}

export function loadAllowlistFile(path, options = {}) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  return parseAllowlist(raw, options);
}
