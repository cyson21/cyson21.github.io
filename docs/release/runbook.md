# Portfolio Web 검증·릴리스 Runbook

## 로컬 기본

- 문구·콘텐츠·개별 화면: 최종 편집 후 `pnpm verify:local` 한 번. 정적 빌드·공개 안전성·내부 링크와 변경 영역의 최소 확인만 수행한다.
- 문서만 변경: `git diff --check`. 사이트 빌드·브라우저 검사 없음.
- 로직 변경: 관련 단위 테스트의 실패→통과만 확인한다.
- 검사 도구·CI 변경: 관련 단위 테스트와 구문·diff 확인. 실제 workflow와 전체 검사는 PR CI에 맡긴다.
- CI 검사 전체를 로컬에서 선행·반복하지 않는다. 실패 재현이나 명시적 전체 검증 요청이 있을 때만 범위를 넓힌다.
- 사용자 요청 없이 로컬 미리보기를 열거나 링크를 제공하지 않는다.

Node 22, pnpm 11.1.3을 사용한다. 공개 안전 검사에는 pdftotext 또는 지원되는 Python PDF 추출기가 필요하다. pdftotext 경로는 `PDFTOTEXT_BIN`으로 지정할 수 있다.

## PDF 갱신

PDF 내용이 바뀐 경우에만 수행한다.

1. 인쇄 소스 편집을 정리한 뒤 `pnpm build:raw` 한 번으로 출력한다. 내부 검증 서버를 실행한다.
2. `pnpm generate:resume`으로 PDF를 한 번 생성한다. 생성기는 HTTP 상태, 인쇄 시트 2개, 글꼴 준비를 확인하고 원자적으로 교체한다.
3. `pdfinfo`로 A4 2페이지를 확인하고, 바뀐 페이지만 `pdftoppm`으로 렌더해 잘림·겹침을 확인한다.
4. `src/data/public-assets.json`의 PDF SHA-256과 승인일을 갱신한다.
5. 그 사이 인쇄 소스가 바뀌지 않았다면 재빌드하지 않고 PDF만 dist에 동기화한다.

```bash
node --input-type=module -e "import {copyFileSync} from 'node:fs'; copyFileSync('public/downloads/resume.pdf', 'dist/downloads/resume.pdf')"
pnpm test:privacy
pnpm test:links
```

다른 페이지 소스도 추가로 바뀌었다면 `pnpm verify:local`로 최종 출력한다. PDF·manifest 변경만으로 타입·전체 단위·브라우저 검사를 다시 실행하지 않는다.

## PR CI

보호 브랜치의 필수 잡 이름 `preview`, `release`를 유지한다.

- 문서만 변경: 두 잡은 성공으로 종료하고 도구 설치·사이트 검사·Pages 재배포를 생략한다.
- 페이지·콘텐츠·알려진 관련 테스트 변경: 영향받은 경로와 관련 테스트 선택. 접근성·이미지·앵커·잘림·겹침·가로 넘침을 검사한다. 320·959·960·1440px를 사용한다.
- 공통 레이아웃·컴포넌트·스타일·의존성·설정·검사 인프라·알 수 없는 변경: 전체 회귀를 수행한다.
- 주간·수동 CI: 전체 회귀와 전체 화면 폭·경계 검사.

preview에서 타입·콘텐츠 불변식·테마·단위 검사와 브라우저 검사를 한 번 수행한다. Chromium headless shell은 preview에만 설치한다. release는 preview 성공에 의존하며 공통 검사를 반복하지 않는다. 공개 모드 정적 빌드·공개 안전성·내부 링크와 APIRequestContext 기반 HTTP 검사는 release에서 수행한다. 정적 산출물의 robots·canonical·sitemap·404·PDF 링크와 해시를 검사하므로 release에 브라우저 설치가 필요하지 않다.

공개 모드는 `PUBLIC_RELEASE=true`, `PUBLIC_SITE_URL=https://cyson21.github.io`를 사용한다. preview 출력은 검색 제외이며 공개 출력과 따로 생성한다. origin 유효성 단위 검사는 preview 공통 검사에 유지한다.

## 외부 링크·진단

- 링크 소스 변경 PR: host 단위 외부 링크 smoke.
- 주간 외부 링크 workflow: 수집된 HTTPS URL 전체.
- 영구 broken·잘못된 URL은 실패, 403·429·일시적 오류는 경고. 예외에는 이유·만료일이 필요하다.
- WCAG A/AA는 차단 검사로 유지한다. axe best-practice 정책·JSON 보고서도 유지한다.
- 실패한 검사에는 화면·추적·JSON 근거를 남긴다. 성공 결과는 상태만 확인하고 화면을 다시 일괄 검토하지 않는다.

## 배포

1. 사이트 변경 PR은 preview·release가 모두 성공한 뒤 squash merge한다.
2. Pages는 병합된 main을 공개 모드로 다시 빌드·검사한다. 병합 결과가 PR head와 다를 수 있으므로 이 공통 검사는 유지한다. 브라우저 회귀는 반복하지 않는다.
3. 문서만 변경한 push에는 Pages를 실행하지 않는다. 수동 배포는 항상 실행한다.
4. 실제 공개 origin에서 robots·sitemap·PDF 다운로드 상태만 확인한다. 기능 변경이 있으면 해당 경로만 확인한다. 모든 페이지를 다시 순회하지 않는다.

## 되돌리기

비공개 문자열·미승인 자산 노출, origin 불일치, 404 색인 허용, PDF 손상·페이지 수 오류, 주요 경로 404/5xx가 있으면 직전 검증 완료 배포로 되돌린다. 수정 후 원인에 해당하는 검사를 실행하며, 공통 코드·배포 설정 문제는 전체 PR CI로 확인한다.
