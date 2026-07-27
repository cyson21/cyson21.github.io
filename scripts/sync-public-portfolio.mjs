import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';

const source = resolve(
  process.env.PORTFOLIO_HTML_SOURCE?.trim()
    || resolve(import.meta.dirname, '../../../portfolio/portfolio-complete.html'),
);
const output = resolve(import.meta.dirname, '../public/portfolio/index.html');
const temporaryOutput = resolve(dirname(output), `.portfolio-${process.pid}-${Date.now()}.tmp.html`);

const html = readFileSync(source, 'utf8');
if (
  !html.trimStart().toLowerCase().startsWith('<!doctype html>')
  || !html.includes('<html lang="ko-KR">')
  || !html.includes('<body>')
  || !html.includes('손찬양')
) {
  throw new Error(`Portfolio source is not the approved standalone HTML document: ${source}`);
}

mkdirSync(dirname(output), { recursive: true });
try {
  writeFileSync(temporaryOutput, html, 'utf8');
  renameSync(temporaryOutput, output);
  console.log(`Synced public portfolio HTML atomically: ${output}`);
} finally {
  rmSync(temporaryOutput, { force: true });
}
