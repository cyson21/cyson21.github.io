// One vocabulary and destination map for native pages and standalone case pages.
export const pageLinks = [
  { label: '경력·이력서', href: '/experience/' },
  { label: '실무 사례', href: '/portfolio/' },
  { label: '개인 프로젝트', href: '/projects/' },
];
export const workCases = [
  { id: 'work-policy', label: '저장 시점의 상태 재검증' },
  { id: 'work-purchase', label: '락 경합과 트랜잭션 경계' },
  { id: 'work-batch', label: '배치 중복 제어와 누락 감지' },
  { id: 'work-identity', label: '복합 식별자와 페이지 집계' },
  { id: 'work-messaging', label: '메시지 요청과 결과 처리' },
];
const active = (href, path) => path.startsWith(href) ? ' aria-current="page"' : '';
export function renderHeader(path) {
  return `<header class="site-chrome-header"><div class="site-chrome-bar"><a class="site-chrome-brand" href="/" aria-label="손찬양 · 홈">손찬양<span>백엔드 개발자</span></a><button class="site-chrome-toggle" type="button" aria-expanded="false" aria-controls="site-chrome-menu" aria-label="주 메뉴 열기" hidden>메뉴</button><nav id="site-chrome-menu" class="site-chrome-menu" aria-label="주 메뉴">${pageLinks.map(({label,href}) => `<a href="${href}"${active(href,path)}>${label}</a>`).join('')}</nav></div></header>`;
}
export function renderFooter() {
  return `<footer class="site-chrome-footer" id="contact"><div class="site-chrome-footer-grid"><section><h2>페이지</h2><nav aria-label="하단 페이지"><a href="/">홈</a>${pageLinks.map(({label,href}) => `<a href="${href}">${label}</a>`).join('')}</nav></section><section><h2>제출 자료</h2><a href="/downloads/resume.pdf" download="손찬양_이력서.pdf">이력서 PDF 다운로드</a><a href="/downloads/career-description.pdf" download="손찬양_경력기술서.pdf">경력기술서 PDF 다운로드</a></section><section><h2>연락·외부 링크</h2><a href="mailto:cyson21@gmail.com">이메일 보내기</a><a href="https://github.com/cyson21" target="_blank" rel="noreferrer" aria-label="GitHub 프로필 · 새 창">GitHub 프로필 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17 17 7M7 7h10v10"/></svg></a></section></div><p class="site-chrome-copyright">© 손찬양</p></footer>`;
}
export function applySiteChrome(html, path) {
  const skip = html.match(/<a class="portfolio-skip-link"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
  html = html.replace(/<a class="portfolio-skip-link"[^>]*>[\s\S]*?<\/a>/g, '');
  html = html.replace(/<header class="(?:site-chrome-header|nav)"[\s\S]*?<\/header>/g, '');
  html = html.replace(/<footer class="(?:site-chrome-footer|footer closing)"[\s\S]*?<\/footer>/g, '');
  html = html.replace(/<link rel="stylesheet" href="(?:assets\/|\/portfolio\/assets\/)site-chrome.css"\s*\/?>/g, '');
  html = html.replace(/<script[^>]*src="(?:assets\/|\/portfolio\/assets\/)site-chrome.js"[^>]*><\/script>/g, '');
  html = html.replace('</head>', '<link rel="stylesheet" href="assets/site-chrome.css"></head>');
  html = html.replace('<body>', `<body>${renderHeader(path).replace('<header class="site-chrome-header">', '<header class="site-chrome-header">' + skip)}`);
  return html.replace('</body>', `${renderFooter()}<script type="module" src="assets/site-chrome.js"></script></body>`);
}
