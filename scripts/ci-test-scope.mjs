import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function htmlStructure(html) {
  return html.split(/(<(?:style|script)\b[\s\S]*?<\/(?:style|script)>)/gi)
    .map(part => /^<(?:style|script)\b/i.test(part) ? part : part.replace(/>[^<]*</g, '><').replace(/\s+/g, ' ').trim()).join('');
}
const docsPath = /^(?:AGENTS\.md|README\.md|docs\/.*|\.github\/PULL_REQUEST_TEMPLATE.*)$/;
const suites = {
  'home-hero.spec.ts': ['/'], 'home-github-link.spec.ts': ['/'],
  'experience-skills.spec.ts': ['/experience/'],
  'portfolio-reading.spec.ts': ['/portfolio/'], 'portfolio-mobile.spec.ts': ['/portfolio/'],
  'publishing.spec.ts': ['/experience/', '/resume/print/'],
};
const baseFiles = ['routes.spec.ts', 'publishing.spec.ts', 'layout-health.spec.ts', 'quality.spec.ts'];
const full = () => ({ scope: 'full', routes: null, files: [], externalLinks: true });
export function testPlan(paths) {
  if (!paths.length) return full();
  if (paths.every(path => docsPath.test(path))) return { scope: 'docs', routes: [], files: [], externalLinks: false };
  const routes = new Set();
  const files = new Set(baseFiles);
  let allRoutes = false;
  let externalLinks = false;
  for (const path of paths) {
    if (docsPath.test(path)) continue;
    if (path === 'src/data/site.ts' || path === 'src/data/public-assets.json') {
      allRoutes = true;
      externalLinks ||= path === 'src/data/site.ts';
    } else if (path === 'public/portfolio/index.html') {
      routes.add('/portfolio/'); externalLinks = true;
    } else if (/^public\/downloads\/.*\.pdf$/.test(path)) {
      routes.add('/experience/'); routes.add('/resume/print/');
    } else if (/^src\/content\/projects\/[^/]+\.md$/.test(path)) {
      const slug = path.split('/').at(-1).replace(/\.md$/, '');
      for (const route of ['/portfolio/', '/projects/', `/projects/${slug}/`]) routes.add(route);
      externalLinks = true;
    } else if (path === 'src/pages/index.astro') routes.add('/');
    else if (path === 'src/pages/404.astro') routes.add('/missing-release-check/');
    else if (path === 'src/pages/projects/[slug].astro') allRoutes = true;
    else if (/^src\/pages\/(?:experience|projects|resume)\/index\.astro$/.test(path)) {
      routes.add(`/${path.split('/')[2] === 'resume' ? 'experience' : path.split('/')[2]}/`);
    } else if (path === 'src/pages/resume/print.astro') routes.add('/resume/print/');
    else if (path.startsWith('tests/e2e/') && suites[path.slice('tests/e2e/'.length)]) {
      const suite = path.slice('tests/e2e/'.length); files.add(suite);
      for (const route of suites[suite]) routes.add(route);
    } else return full(); // Shared code, infrastructure and unknown changes keep full coverage.
  }
  for (const [suite, dependencies] of Object.entries(suites)) {
    if (allRoutes || dependencies.some(route => routes.has(route))) files.add(suite);
  }
  return { scope: 'targeted', routes: allRoutes ? null : [...routes].sort(), files: [...files], externalLinks };
}
export const testScope = paths => testPlan(paths).scope;
export function changedPaths(base) {
  return base ? execFileSync('git', ['diff', '--name-only', '-z', `${base}...HEAD`], { encoding: 'utf8' }).split('\0').filter(Boolean) : [];
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const plan = testPlan(changedPaths(process.argv[2]));
  if (process.argv.includes('--github')) {
    console.log(`scope=${plan.scope}\nexternal_links=${plan.externalLinks}\nplan=${JSON.stringify(plan)}`);
  } else console.log(plan.scope);
}
