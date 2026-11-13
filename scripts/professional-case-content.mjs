import { readFileSync } from 'node:fs';
const model = JSON.parse(readFileSync(new URL('../src/data/professional-case-narratives.json', import.meta.url), 'utf8'));
const cases = [...model.sheets.flatMap(sheet => sheet.cases), model.messaging];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function applyProfessionalNarratives(html) {
  // Keep the existing two-lane batch figure and its accessible step order.
  const batchFigure = html.match(/<figure class="batch-flow"[\s\S]*?<\/figure>/)?.[0] ?? '';
  if (!batchFigure) throw new Error('Professional case source must retain the batch flow');
  const articles = cases.map(item => `<article class="work-case" id="${item.anchor}">
      <h3>${escape(item.title)}</h3>
      <p>${escape(item.context)}</p>
${item.anchor === 'work-batch' ? '      '+batchFigure+'\n' : ''}      <dl class="work-case-facts">
        <div><dt>담당 범위</dt><dd>${escape(item.responsibility)}</dd></div>
        <div><dt>해결 과정</dt><dd><ol>${item.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol></dd></div>
        <div><dt>변화</dt><dd>${escape(item.result)}</dd></div>
      </dl>
    </article>`);
  html = html.replace(/(?:<article class="work-case"[\s\S]*?<\/article>\s*)+/, articles.join('\n')+'\n');
  return html.replace(/<nav class="work-case-index"[\s\S]*?<\/nav>/, `<nav class="work-case-index" aria-label="실무 사례 바로가기">${cases.map(item => `<a href="#${item.anchor}">${escape(item.title)}</a>`).join('')}</nav>`);
}

export function renderProfessionalOverview(html) {
  const arrow = '<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg>';
  return html.replace('<!--PROFESSIONAL_CASE_LIST-->', cases.map(item => `<li id="${item.anchor}"><a href="cases.html#${item.anchor}"><span>${escape(item.title)}</span><small>${escape(item.summary)}</small>${arrow}</a></li>`).join(''));
}
