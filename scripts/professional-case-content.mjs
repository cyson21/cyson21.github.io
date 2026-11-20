import { readFileSync } from 'node:fs';
const model = JSON.parse(readFileSync(new URL('../src/data/professional-case-narratives.json', import.meta.url), 'utf8'));
const cases = [...model.sheets.flatMap(sheet => sheet.cases), model.messaging];
const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const caseDiagrams = {
  'work-batch': `<figure class="case-diagram" aria-labelledby="batch-diagram-title">
        <figcaption id="batch-diagram-title">배치 실행 제어와 누락 모니터링</figcaption>
        <div class="case-diagram-lanes">
          <div>
            <h4>중복 실행 제어</h4>
            <ol class="case-diagram-track" role="list">
              <li>서버별 스케줄 실행</li>
              <li class="case-diagram-focus">ShedLock·Redis 락 획득</li>
              <li>배치 실행·발행 기록</li>
              <li>처리 결과·상태 기록</li>
            </ol>
          </div>
          <div>
            <h4>누락 모니터링</h4>
            <ol class="case-diagram-track" role="list">
              <li>예정 고객사·배치 목록</li>
              <li class="case-diagram-focus">예정 시각 1시간 뒤 실행 기록과 대조</li>
              <li>성공·실패·락 미획득·발행 누락·결과 미수신 구분</li>
              <li>Slack 요약</li>
            </ol>
          </div>
        </div>
        <p>분산락 도입과 누락 모니터링은 별도 시기에 개선했습니다.</p>
      </figure>`,
  'work-purchase': `<figure class="case-diagram" aria-labelledby="purchase-diagram-title">
        <figcaption id="purchase-diagram-title">요청 상태 커밋과 결제 호출 순서</figcaption>
        <div class="case-diagram-lanes">
          <div>
            <h4>수정 전 · QA에서 확인</h4>
            <ol class="case-diagram-track" role="list">
              <li>요청 상태 저장 · 커밋 전</li>
              <li>별도 트랜잭션에서 결제 호출</li>
              <li>결제 단계에서 요청 상태를 읽지 못함</li>
            </ol>
          </div>
          <div>
            <h4>수정 후 · 호출 순서</h4>
            <ol class="case-diagram-track" role="list">
              <li>요청 상태 저장</li>
              <li class="case-diagram-focus">요청 상태 커밋</li>
              <li>별도 트랜잭션에서 결제 호출</li>
            </ol>
          </div>
        </div>
      </figure>`,
  'work-policy': `<figure class="case-diagram case-diagram--decision" aria-labelledby="policy-diagram-title">
        <figcaption id="policy-diagram-title">최종 저장 요청에서 변경 여부 판단</figcaption>
        <ol class="case-diagram-track case-diagram-trunk" role="list">
          <li>최종 저장 요청 · 화면 진입 상태 값 확인</li>
          <li class="case-diagram-focus">서버에서 현재 작업 이력 재조회</li>
        </ol>
        <div class="case-diagram-lanes case-diagram-branches">
          <div>
            <h4>화면 진입 후 작업이 시작됨</h4>
            <ol class="case-diagram-track" role="list"><li>변경 차단</li></ol>
          </div>
          <div>
            <h4>변경이 허용됨</h4>
            <ol class="case-diagram-track" role="list">
              <li>설정 저장</li>
              <li>같은 이력 조회 기준으로 후속 데이터 갱신</li>
            </ol>
          </div>
        </div>
      </figure>`,
};

export function applyProfessionalNarratives(html) {
  const articles = cases.map(item => `<article class="work-case" id="${item.anchor}">
      <h3>${escape(item.title)}</h3>
      <p>${escape(item.context)}</p>
${caseDiagrams[item.anchor] ? `      ${caseDiagrams[item.anchor]}\n` : ''}      <dl class="work-case-facts">
        <div><dt>담당 범위</dt><dd>${escape(item.responsibility)}</dd></div>
        <div><dt>해결 과정</dt><dd><ol>${item.steps.map(step => `<li>${escape(step)}</li>`).join('')}</ol></dd></div>
        <div><dt>수정 결과</dt><dd>${escape(item.result)}</dd></div>
      </dl>
    </article>`);
  html = html.replace(/(?:<article class="work-case"[\s\S]*?<\/article>\s*)+/, articles.join('\n')+'\n');
  const links = cases.map(item => `        <li><a href="#${item.anchor}">${escape(item.title)}</a></li>`).join('\n');
  return html.replace(/<nav class="work-case-index"[\s\S]*?<\/nav>/, `<nav class="work-case-index" aria-label="실무 사례 바로가기"><ul>
${links}
      </ul></nav>`);
}

export function renderProfessionalOverview(html) {
  const arrow = '<svg class="m-arrow" viewBox="0 0 12 12" aria-hidden="true"><path class="m-arrow__stem" d="M1 6h8"/><path class="m-arrow__head" d="M4.5 2.5 8 6l-3.5 3.5"/></svg>';
  return html.replace('<!--PROFESSIONAL_CASE_LIST-->', cases.map(item => `<li id="${item.anchor}"><a href="cases.html#${item.anchor}"><span>${escape(item.title)}</span><small>${escape(item.summary)}</small>${arrow}</a></li>`).join(''));
}
