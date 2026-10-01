import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Unknown paths run the full suite. Content checks still cover routes, PDF and reflow.
export function htmlStructure(html) {
  // Preserve CSS and scripts; strip only ordinary document text.
  return html.split(/(<(?:style|script)\b[\s\S]*?<\/(?:style|script)>)/gi)
    .map((part) => /^<(?:style|script)\b/i.test(part)
      ? part : part.replace(/>[^<]*</g, '><').replace(/\s+/g, ' ').trim())
    .join('');
}

export function testScope(paths, portfolioStructureChanged = false) {
  if (portfolioStructureChanged) return 'full';
  const contentPath = /^(?:AGENTS\.md|README\.md|docs\/.*|src\/data\/(?:site\.ts|public-assets\.json)|src\/content\/.*\.md|public\/downloads\/.*\.pdf|public\/portfolio\/index\.html)$/;
  return paths.length > 0 && paths.every((path) => contentPath.test(path)) ? 'content' : 'full';
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const base = process.argv[2];
  const paths = base
    ? execFileSync('git', ['diff', '--name-only', '-z', `${base}...HEAD`], { encoding: 'utf8' }).split('\0').filter(Boolean)
    : [];
  let portfolioStructureChanged = false;
  if (base && paths.includes('public/portfolio/index.html')) {
    try {
      const mergeBase = execFileSync('git', ['merge-base', base, 'HEAD'], { encoding: 'utf8' }).trim();
      const oldHtml = execFileSync('git', ['show', `${mergeBase}:public/portfolio/index.html`], { encoding: 'utf8' });
      const newHtml = execFileSync('git', ['show', 'HEAD:public/portfolio/index.html'], { encoding: 'utf8' });
      portfolioStructureChanged = htmlStructure(oldHtml) !== htmlStructure(newHtml);
    } catch {
      portfolioStructureChanged = true;
    }
  }
  console.log(testScope(paths, portfolioStructureChanged));
}
