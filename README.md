# 손찬양 | 백엔드 개발자 웹 포트폴리오

Java와 Spring을 중심으로 상태 정합성, 부분 실패 복구, 이벤트 처리와 데이터 흐름 문제를 해결한 프로젝트를 정리했습니다.

실무에서는 4인 개발팀에서 20개 이상의 기업 고객 서비스를 개발·운영했으며, 아래 공개 저장소의 대표 프로젝트는 개인 프로젝트로 설계·구현·검증한 범위입니다.

[웹 포트폴리오](https://cyson21.github.io/) · [백엔드 문제 해결 사례](https://cyson21.github.io/portfolio/) · [개인 프로젝트](https://cyson21.github.io/projects/) · [이력서 PDF](https://cyson21.github.io/downloads/resume.pdf)

## 대표 프로젝트

| 프로젝트 | 주요 내용 |
|---|---|
| [StockRush](https://cyson21.github.io/projects/stockrush/) | Saga 상태 전이, 주문·Outbox 원자적 저장과 발행 실패 재처리 |
| [Enterprise Policy RAG](https://cyson21.github.io/projects/enterprise-policy-rag/) | 검색 전 권한 적용과 근거 기반 응답 생성 제어 |
| [Member Event Consistency](https://cyson21.github.io/projects/member-event-consistency/) | 최초 보상 1회, 쿠폰 수량, 포인트 잔액을 동시 요청에서도 보호 |

전체 프로젝트는 웹사이트에서 주제별로 볼 수 있으며, 각 프로젝트 페이지에서 주요 코드와 관련 테스트를 확인할 수 있습니다. CDC는 독립 구성요소를 검증하는 프로토타입 범위로 소개합니다.

## 콘텐츠와 공개 경계

현재 내용 원본·출력·검증 기록은 [콘텐츠 SoT](docs/content/current-sot.md)에서 관리합니다. 공통 경력 사실과 회사별 프로젝트는 site.ts에서 관리합니다. 이력서는 핵심 기여 요약, 경력기술서는 업무 맥락과 역할·기여, 포트폴리오는 실무 상세와 별도 개인 프로젝트 구현을 제공합니다. 개편본의 생성·PR·배포 상태는 SoT에서 구분합니다.

- 프로젝트 콘텐츠: `src/content/`
- 경력·소개·기술 스택: `src/data/site.ts` (실무와 개인 프로젝트 기술 구분)
- 경력 근거와 미확인 항목: `docs/content/career_profile.md`
- 승인 자산 목록: `src/data/public-assets.json`
- 공개 자산: `public/` 아래에서 승인 목록과 SHA-256이 일치하는 파일
- 실무 사례와 개인 프로젝트의 구현 근거: `public/portfolio/index.html`
- 설계 결정: `docs/decisions/`
- 제외 대상: 원본 일감, 로컬 경로, 전화번호, 비공개 이력서 원본

공개 배포에서는 `PUBLIC_RELEASE=true`, `PUBLIC_SITE_URL`을 설정합니다. PDF 다운로드는 같은 배포에 포함된 `/downloads/resume.pdf`를 사용합니다. 사이트 URL은 경로, query, fragment, 인증 정보가 없는 공개 HTTPS origin이어야 합니다. 공개 모드가 아니면 페이지와 `robots.txt`를 검색 제외 상태로 유지합니다.

통합 HTML은 프로젝트 Markdown과 별도로 관리하므로 문구 변경 시 두 파일을 함께 확인합니다. `generate:portfolio`의 기본 입력은 저장소의 통합 HTML이며 목차·화면 스타일을 다시 적용합니다. 외부 원본을 가져올 때만 `PORTFOLIO_HTML_SOURCE`를 지정합니다. 이력서 PDF는 `/resume/print/`에서 다시 생성하고, 공개 자산의 SHA-256도 `public-assets.json`에 반영합니다. 회사 실무 경력기술서는 같은 경력·사례 원본을 공유하며 `src/data/career-description.ts`에서 원인·판단·검증 근거를 확장합니다. `pnpm generate:career`는 `/resume/career/`에서 3쪽 PDF를 생성해 `public/downloads/career-description.pdf`에 저장합니다. [경력기술서 검토](docs/content/career-description-review.md)에 근거와 출력 범위를 기록합니다.

## 테마

공개 포트폴리오 기본 테마는 B `Signal Grid`입니다. B와 C는 한 쌍으로 유지합니다. 시각 변경 시 `public/themes/b.css`와 `public/themes/c.css`를 함께 고칩니다.

## 개발과 검증

```bash
pnpm install
pnpm dev
```

문구·콘텐츠·개별 화면 변경의 로컬 기본 검증은 최종 편집 후 `pnpm verify:local` 한 번입니다. 정적 빌드·공개 안전성·내부 링크만 실행하며, 변경된 PDF 페이지나 화면의 최소 확인을 추가합니다. 타입·콘텐츠·테마·전체 단위·접근성·반응형·브라우저·릴리스 검사는 CI가 담당합니다. 로직 변경은 해당 단위 테스트만 로컬에서 실패→통과를 확인합니다. 문서만 바뀌면 사이트 검사를 실행하지 않습니다.

CI는 `scripts/ci-test-scope.mjs`로 도구 설치 전에 범위를 정합니다.

- 문서만 변경: 사이트 검사·브라우저 설치·Pages 재배포 생략
- 개별 페이지·콘텐츠·관련 테스트 변경: 관련 테스트와 영향받은 경로의 접근성·배치 검사. 배치는 320·959·960·1440px 사용
- 공통 레이아웃·컴포넌트·스타일·의존성·검사 인프라·알 수 없는 변경: 전체 검사
- 주간·수동 CI: 전체 회귀. 320–1440px 전체 화면 폭과 레이아웃 경계 검사 유지

CI의 preview에서 공통 검사와 브라우저 검사를 한 번 수행합니다. release는 preview 성공 뒤 공개 모드 산출물을 새로 빌드하고 공개 안전성·링크·HTTP 메타데이터·PDF 배포 일치를 확인합니다. release에는 Chromium을 설치하지 않습니다. 외부 링크 smoke는 링크 소스 변경 때만 실행하고, 전체 외부 링크 검사는 주간 workflow에 유지합니다. 화면 폭을 자체 지정하는 검사와 PDF 정적 검사는 단일 Chromium 프로젝트에서 실행합니다.

`pnpm build`는 CI용 전체 공통 검사와 정적 빌드·공개 안전성·내부 링크를 포함합니다. `pnpm build:raw`는 정적 출력만 생성합니다. `pnpm verify`는 명시적으로 요청한 전체 로컬 검증에만 사용합니다. 통과한 검사와 성공 CI 화면을 반복 확인하지 않습니다.

PDF 생성 순서와 릴리스·되돌리기 기준은 [`docs/release/runbook.md`](docs/release/runbook.md), 작업 원칙은 [`AGENTS.md`](AGENTS.md)를 따릅니다. PDF 텍스트 추출 도구가 PATH에 없으면 `PDFTOTEXT_BIN`으로 실행 파일을 지정합니다.

## 의존성 유지보수

포트폴리오의 유지보수 비용을 줄이기 위해 Dependabot의 일반 버전 업데이트 PR은 생성하지 않습니다. 보안 취약점 알림과 보안 업데이트는 활성화하며, 보안 업데이트 PR은 패키지 생태계별로 묶습니다. 일반 버전 업그레이드는 필요한 기능이나 호환성 문제가 있을 때 진행합니다.
