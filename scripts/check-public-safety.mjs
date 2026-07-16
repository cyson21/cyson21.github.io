import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { extname, join, relative, resolve, sep } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, process.argv[2] ?? 'dist');
const manifestPath = resolve(root, 'src/data/public-assets.json');
const publicRoot = resolve(root, 'public');
const scanRoots = [resolve(root, 'src/content'), resolve(root, 'src/data'), publicRoot, dist];
const textExtensions = new Set(['.html', '.css', '.js', '.mjs', '.ts', '.tsx', '.json', '.md', '.txt', '.xml', '.svg', '.map']);
const approvedBinaryExtensions = new Set(['.gif', '.ico', '.jpeg', '.jpg', '.pdf', '.png', '.webp']);
const allowedEmails = new Set(['cyson21@kakao.com']);
const manifestFields = new Set(['output', 'sourceProject', 'sourcePath', 'sha256', 'owner', 'usage', 'approvedAt']);
const findings = [];

const bundledPython = resolve(
  homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
);
const pdfTextPython = String.raw`from pypdf import PdfReader
import sys
reader = PdfReader(sys.argv[1])
print("\n".join(page.extract_text() or "" for page in reader.pages))`;

const banned = [
  { label: 'local absolute path', pattern: /\/Users\//g },
  { label: 'file URL', pattern: /file:\/\//gi },
  { label: 'localhost', pattern: /localhost/gi },
  { label: 'loopback address', pattern: /127\.0\.0\.1/g },
  { label: 'private IPv4', pattern: /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g },
  { label: 'Korean phone number', pattern: /\b01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}\b/g },
  { label: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { label: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: 'generic secret assignment', pattern: /(?:api[_-]?key|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][^"']{12,}["']/gi },
];

function displayPath(path) {
  return relative(root, path).split(sep).join('/');
}

function walk(directory) {
  if (!existsSync(directory)) {
    findings.push(`missing scan target: ${displayPath(directory)}`);
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      findings.push(`${displayPath(path)}: symbolic links are not allowed in scan roots`);
      return [];
    }
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function scanTextContent(path, content, prefix = '') {
  for (const rule of banned) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(content)) findings.push(`${displayPath(path)}: ${prefix}${rule.label}`);
  }
  for (const match of content.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) {
    if (!allowedEmails.has(match[0].toLowerCase())) {
      findings.push(`${displayPath(path)}: ${prefix}unapproved email ${match[0]}`);
    }
  }
}

function scanText(path) {
  scanTextContent(path, readFileSync(path, 'utf8'));
}

function extractPdfText(path) {
  const binary = process.env.PDFTOTEXT_BIN?.trim() || 'pdftotext';
  const extraction = spawnSync(binary, [path, '-'], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (!extraction.error) return { ...extraction, extractor: binary };
  if (extraction.error.code !== 'ENOENT') return { ...extraction, extractor: binary };

  const pythonCandidates = [process.env.PYTHON_BIN?.trim(), 'python3', bundledPython]
    .filter((candidate, index, items) => candidate && items.indexOf(candidate) === index);
  for (const python of pythonCandidates) {
    if (python === bundledPython && !existsSync(python)) continue;
    const fallback = spawnSync(python, ['-c', pdfTextPython, path], {
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    if (!fallback.error && fallback.status === 0) {
      return { ...fallback, extractor: `${python} + pypdf` };
    }
  }

  return { ...extraction, extractor: binary };
}

function scanPdf(path) {
  const bytes = readFileSync(path);
  if (bytes.length < 1024 || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    findings.push(`${displayPath(path)}: invalid PDF file`);
    return;
  }

  const extraction = extractPdfText(path);
  if (extraction.error) {
    findings.push(`${displayPath(path)}: PDF text extraction failed via ${extraction.extractor}: ${extraction.error.code ?? extraction.error.message}`);
    return;
  }
  if (extraction.status !== 0 || extraction.signal) {
    const detail = extraction.signal
      ? `signal ${extraction.signal}`
      : `exit ${extraction.status}: ${(extraction.stderr || '').trim().split('\n')[0] || 'no error output'}`;
    findings.push(`${displayPath(path)}: PDF text extraction failed via ${extraction.extractor}: ${detail}`);
    return;
  }
  if (!extraction.stdout.trim()) {
    findings.push(`${displayPath(path)}: PDF text extraction returned no text`);
    return;
  }

  scanTextContent(path, extraction.stdout, 'PDF contains ');
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readManifest() {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    findings.push(`src/data/public-assets.json: invalid JSON: ${error.message}`);
    return [];
  }
  if (!Array.isArray(parsed)) {
    findings.push('src/data/public-assets.json: top level must be an array');
    return [];
  }

  const outputs = new Set();
  for (const [index, asset] of parsed.entries()) {
    const label = `src/data/public-assets.json[${index}]`;
    if (!isPlainObject(asset)) {
      findings.push(`${label}: entry must be an object`);
      continue;
    }

    const fields = Object.keys(asset);
    const missing = [...manifestFields].filter((field) => !(field in asset));
    const extra = fields.filter((field) => !manifestFields.has(field));
    if (missing.length) findings.push(`${label}: missing fields ${missing.join(', ')}`);
    if (extra.length) findings.push(`${label}: unknown fields ${extra.join(', ')}`);

    for (const field of ['output', 'sourceProject', 'sourcePath', 'owner', 'usage']) {
      if (typeof asset[field] !== 'string' || !asset[field].trim()) {
        findings.push(`${label}: ${field} must be a non-empty string`);
      }
    }
    if (typeof asset.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(asset.sha256)) {
      findings.push(`${label}: sha256 must be 64 lowercase hex characters`);
    }
    if (typeof asset.approvedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(asset.approvedAt)
      || Number.isNaN(Date.parse(`${asset.approvedAt}T00:00:00Z`))) {
      findings.push(`${label}: approvedAt must be a valid YYYY-MM-DD date`);
    }

    if (typeof asset.output === 'string') {
      const normalized = asset.output.split('\\').join('/');
      const segments = normalized.split('/');
      const resolved = resolve(root, normalized);
      if (normalized !== asset.output || !normalized.startsWith('public/')
        || segments.includes('..') || segments.includes('.')
        || !resolved.startsWith(`${publicRoot}${sep}`)) {
        findings.push(`${label}: output must be a normalized path below public/`);
      }
      if (outputs.has(normalized)) findings.push(`${label}: duplicate output ${normalized}`);
      outputs.add(normalized);
    }
  }

  return parsed.filter(isPlainObject);
}

const manifest = readManifest();
const manifestByOutput = new Map(manifest.map((asset) => [asset.output, asset]));
const publicFiles = walk(publicRoot).filter((path) => lstatSync(path).isFile());

for (const path of publicFiles) {
  const output = displayPath(path);
  if (!manifestByOutput.has(output)) findings.push(`${output}: public asset is not in the approved manifest`);
}

for (const asset of manifest) {
  if (typeof asset.output !== 'string') continue;
  const assetPath = resolve(root, asset.output);
  if (!existsSync(assetPath)) {
    findings.push(`${asset.output}: asset listed but missing`);
    continue;
  }
  if (!lstatSync(assetPath).isFile()) {
    findings.push(`${asset.output}: manifest output must be a regular file`);
    continue;
  }

  const digest = createHash('sha256').update(readFileSync(assetPath)).digest('hex');
  if (digest !== asset.sha256) findings.push(`${asset.output}: sha256 differs from approved manifest`);

  if (existsSync(dist)) {
    const builtPath = resolve(dist, asset.output.slice('public/'.length));
    if (!existsSync(builtPath)) {
      findings.push(`${displayPath(builtPath)}: approved public asset missing from build`);
    } else {
      const builtDigest = createHash('sha256').update(readFileSync(builtPath)).digest('hex');
      if (builtDigest !== asset.sha256) findings.push(`${displayPath(builtPath)}: built asset differs from approved manifest`);
    }
  }
}

for (const directory of scanRoots) {
  for (const path of walk(directory)) {
    if (!lstatSync(path).isFile()) continue;
    const extension = extname(path).toLowerCase();
    if (textExtensions.has(extension)) {
      scanText(path);
    } else if (extension === '.pdf') {
      scanPdf(path);
    } else if (!approvedBinaryExtensions.has(extension)) {
      findings.push(`${displayPath(path)}: unsupported file type ${extension || '(none)'}`);
    }
  }
}

if (findings.length > 0) {
  console.error(`Public safety check failed (${findings.length})`);
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(`Public safety check passed: ${scanRoots.length} roots, ${manifest.length} approved assets`);
