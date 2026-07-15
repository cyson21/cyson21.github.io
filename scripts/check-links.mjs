import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, process.argv[2] ?? 'dist');
const errors = [];

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function htmlTarget(pathname) {
  const clean = pathname.replace(/^\//, '').replace(/\/$/, '');
  if (!clean) return join(dist, 'index.html');
  const direct = join(dist, clean);
  if (extname(direct)) return direct;
  return join(direct, 'index.html');
}

const htmlFiles = walk(dist).filter((path) => path.endsWith('.html'));
for (const htmlPath of htmlFiles) {
  const html = readFileSync(htmlPath, 'utf8');
  const ids = new Set(Array.from(html.matchAll(/\sid=["']([^"']+)["']/g), (match) => match[1]));
  const refs = Array.from(html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g), (match) => match[1]);

  for (const ref of refs) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) continue;
    const [pathname, fragment] = ref.split('#');
    if (!pathname && fragment) {
      if (!ids.has(fragment)) errors.push(`${relative(dist, htmlPath)}: missing fragment #${fragment}`);
      continue;
    }
    const target = pathname.startsWith('/')
      ? htmlTarget(pathname)
      : resolve(dirname(htmlPath), pathname);
    if (!existsSync(target)) {
      errors.push(`${relative(dist, htmlPath)}: missing target ${ref}`);
      continue;
    }
    if (fragment && target.endsWith('.html')) {
      const targetHtml = readFileSync(target, 'utf8');
      if (!new RegExp(`\\sid=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`).test(targetHtml)) {
        errors.push(`${relative(dist, htmlPath)}: missing target fragment ${ref}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Link check failed (${errors.length})`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Link check passed: ${htmlFiles.length} HTML files`);
