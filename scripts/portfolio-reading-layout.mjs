// Add stable navigation without replacing any project evidence or print content.
export function applyReadingLayout(html) {
  const ids = ['portfolio-intro','portfolio-results','portfolio-capabilities','stockrush','member-event-consistency','enterprise-policy-rag','ai-gateway','cdc-data-platform','fashion-personalization-platform','portfolio-scope'];
  html = html.replace(/<section class="page([^\"]*)" data-page="(\d+)"/g, (match, classes, number) => `<section class="page${classes}" id="${ids[Number(number)-1]}" data-page="${number}"`);
  html = html.replace(/<nav class="portfolio-reading-nav"[\s\S]*?<\/nav>\s*/g, '');
  const sections = [
    ['portfolio-intro', '소개'],
    ['work-cases', '실무 사례'],
    ['portfolio-results', '개인 프로젝트'],
    ['member-event-consistency', '공개 구현'],
  ];
  const links = sections.filter(([id]) => html.includes(`id="${id}"`))
    .map(([id, label]) => `<a href="#${id}">${label}</a>`).join('');
  const nav = `<nav class="portfolio-reading-nav" aria-label="포트폴리오 목차"><a href="/">홈</a>${links}</nav>`;
  html = html.replace('<body>', `<body>\n${nav}`);
  const names = {'StockRush':'stockrush','Member Event Consistency':'member-event-consistency','Enterprise Policy RAG':'enterprise-policy-rag','AI Gateway':'ai-gateway','CDC Data Platform (프로토타입)':'cdc-data-platform','Fashion Personalization Platform':'fashion-personalization-platform'};
  for (const [name,id] of Object.entries(names)) html = html.replaceAll(`<h3>${name}</h3>`, `<h3><a href="#${id}">${name}</a></h3>`);
  html = html.replace(/^[ \t]*<div class="right">실패 조건 · 보호 설계 · 관찰 결과<\/div>\r?\n/gm, '');
  if (!html.includes('class="intro-project-note"')) html = html.replace('아래 프로젝트는 실무 경력과 구분되는 개인 프로젝트 검증 자료입니다.', '<span class="intro-project-note">아래 프로젝트는 실무 경력과 구분되는 개인 프로젝트 검증 자료입니다.</span>');
  // A combined document has one main landmark, rather than one per case.
  html = html.replace(/<main (class="case-main"[^>]*)>([\s\S]*?)<\/main>/g, '<div $1>$2</div>');
  if (!html.includes('id="portfolio-document"')) {
    html = html.replace(`${nav}`, `${nav}\n<main id="portfolio-document">`)
      .replace('</body>', '</main>\n</body>');
  }
  return html;
}
