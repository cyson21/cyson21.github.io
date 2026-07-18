import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const contentDirectory = resolve(root, 'src/content/projects');
const manifestPath = resolve(root, 'src/data/public-assets.json');
const astroRequire = createRequire(import.meta.resolve('astro/package.json'));
const { load: parseYaml } = astroRequire('js-yaml');
const findings = [];
const todayPartsInKorea = Object.fromEntries(new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).formatToParts(new Date()).map(({ type, value }) => [type, value]));
const todayInKorea = `${todayPartsInKorea.year}-${todayPartsInKorea.month}-${todayPartsInKorea.day}`;

function parseDocument(path) {
  const source = readFileSync(path, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    findings.push(`${basename(path)}: missing YAML frontmatter boundaries`);
    return null;
  }

  let data;
  try {
    data = parseYaml(match[1]);
  } catch (error) {
    findings.push(`${basename(path)}: invalid YAML: ${error.message}`);
    return null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    findings.push(`${basename(path)}: frontmatter must be an object`);
    return null;
  }
  if (!match[2].trim()) findings.push(`${basename(path)}: project body must not be empty`);

  return { id: basename(path, extname(path)), path, data };
}

function requireHttps(value, label) {
  if (value === undefined) return;
  if (typeof value !== 'string') {
    findings.push(`${label}: URL must be a string`);
    return;
  }
  try {
    if (new URL(value).protocol !== 'https:') findings.push(`${label}: URL must use HTTPS`);
  } catch {
    findings.push(`${label}: URL must be absolute`);
  }
}

let approvedOutputs = new Set();
try {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (Array.isArray(manifest)) approvedOutputs = new Set(manifest.map((asset) => asset.output));
} catch (error) {
  findings.push(`public-assets.json: unable to read approved assets: ${error.message}`);
}

const documents = readdirSync(contentDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
  .map((entry) => parseDocument(resolve(contentDirectory, entry.name)))
  .filter(Boolean);

const orders = new Map();
const names = new Map();
for (const document of documents) {
  const { data, id } = document;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) findings.push(`${id}: project id must use lowercase kebab-case`);

  if (!Number.isInteger(data.order) || data.order < 1) {
    findings.push(`${id}: order must be a positive integer`);
  } else if (orders.has(data.order)) {
    findings.push(`${id}: order ${data.order} duplicates ${orders.get(data.order)}`);
  } else {
    orders.set(data.order, id);
  }

  if (typeof data.name !== 'string' || !data.name.trim()) {
    findings.push(`${id}: name must be non-empty`);
  } else if (names.has(data.name)) {
    findings.push(`${id}: name duplicates ${names.get(data.name)}`);
  } else {
    names.set(data.name, id);
  }

  if (!['public', 'case-study-only'].includes(data.publicationState)) {
    findings.push(`${id}: invalid publicationState`);
  }
  const links = data.links && typeof data.links === 'object' ? data.links : {};
  for (const [name, value] of Object.entries(links)) requireHttps(value, `${id}: links.${name}`);
  if (data.publicationState === 'public' && !links.github) findings.push(`${id}: public projects require links.github`);
  if (data.publicationState === 'case-study-only' && links.github) findings.push(`${id}: case-study-only projects must not expose links.github`);

  if (!Array.isArray(data.codeEvidence)) {
    findings.push(`${id}: codeEvidence must be an array`);
  } else {
    for (const [index, evidence] of data.codeEvidence.entries()) {
      requireHttps(evidence?.sourceUrl, `${id}: codeEvidence[${index}].sourceUrl`);
      requireHttps(evidence?.testUrl, `${id}: codeEvidence[${index}].testUrl`);
      if (data.publicationState === 'public' && (!evidence?.sourceUrl || !evidence?.testUrl)) {
        findings.push(`${id}: public codeEvidence[${index}] requires sourceUrl and testUrl`);
      }
    }
  }

  if (!data.visual || typeof data.visual !== 'object') {
    findings.push(`${id}: visual must be an object`);
  } else if (data.visual.kind === 'image') {
    if (typeof data.visual.src !== 'string' || !data.visual.src.startsWith('/') || data.visual.src.startsWith('//')) {
      findings.push(`${id}: image visual requires a root-relative src`);
    } else {
      const publicPath = `public${data.visual.src}`;
      if (!existsSync(resolve(root, publicPath))) findings.push(`${id}: visual asset is missing: ${publicPath}`);
      if (!approvedOutputs.has(publicPath)) findings.push(`${id}: visual asset is not approved: ${publicPath}`);
    }
  } else if (data.visual.kind === 'diagram') {
    if ('src' in data.visual) findings.push(`${id}: diagram visual must not define src`);
  } else {
    findings.push(`${id}: visual.kind must be image or diagram`);
  }

  const updatedAt = data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt);
  if (Number.isNaN(updatedAt.getTime())) {
    findings.push(`${id}: updatedAt must be a valid date`);
  } else if (updatedAt.toISOString().slice(0, 10) > todayInKorea) {
    findings.push(`${id}: updatedAt must not be in the future`);
  }
}

const expectedOrders = Array.from({ length: documents.length }, (_, index) => index + 1);
const actualOrders = [...orders.keys()].sort((a, b) => a - b);
if (actualOrders.join(',') !== expectedOrders.join(',')) {
  findings.push(`project order must be contiguous: expected ${expectedOrders.join(',')}, received ${actualOrders.join(',')}`);
}

if (findings.length > 0) {
  console.error(`Content invariant check failed (${findings.length})`);
  findings.forEach((finding) => console.error(`- ${finding}`));
  process.exit(1);
}

console.log(`Content invariant check passed: ${documents.length} projects`);
