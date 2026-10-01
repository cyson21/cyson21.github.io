# 손찬양 | 백엔드 개발자 웹 포트폴리오

Java와 Spring을 중심으로 상태 정합성, 부분 실패 복구, 이벤트 처리와 데이터 흐름 문제를 해결한 프로젝트를 정리했습니다.

실무에서는 4인 개발팀에서 20개 이상의 기업 고객 서비스를 개발·운영했으며, 아래 공개 저장소의 대표 프로젝트는 개인 프로젝트로 설계·구현·검증한 범위입니다.

[웹 포트폴리오](https://cyson21.github.io/) · [통합 포트폴리오 HTML](https://cyson21.github.io/portfolio/) · [프로젝트 HTML](https://cyson21.github.io/projects/) · [이력서 PDF](https://cyson21.github.io/downloads/resume.pdf)

## 대표 프로젝트

| 프로젝트 | 주요 내용 |
|---|---|
| [StockRush](https://cyson21.github.io/projects/stockrush/) | Saga 상태 전이, 주문·Outbox 원자적 저장과 발행 실패 재처리 |
| [Enterprise Policy RAG](https://cyson21.github.io/projects/enterprise-policy-rag/) | 검색 전 권한 적용과 근거 기반 응답 생성 제어 |
| [Member Event Consistency](https://cyson21.github.io/projects/member-event-consistency/) | 최초 보상 1회, 쿠폰 수량, 포인트 잔액을 동시 요청에서도 보호 |

전체 프로젝트는 웹사이트에서 주제별로 볼 수 있으며, 각 프로젝트 페이지에서 주요 코드와 관련 테스트를 확인할 수 있습니다. CDC는 독립 구성요소를 검증하는 프로토타입 범위로 소개합니다.

## 콘텐츠와 공개 경계

- 프로젝트 콘텐츠: `src/content/`
- 경력·소개·기술 스택: `src/data/site.ts` (실무와 개인 프로젝트 기술 구분)
- 경력 근거와 미확인 항목: `docs/content/career_profile.md`
- 승인 자산 목록: `src/data/public-assets.json`
- 공개 자산: `public/` 아래에서 승인 목록과 SHA-256이 일치하는 파일
- 통합 포트폴리오 HTML: `public/portfolio/index.html`
- 설계 결정: `docs/decisions/`
- 제외 대상: 원본 일감, 로컬 경로, 전화번호, 비공개 이력서 원본

공개 배포에서는 `PUBLIC_RELEASE=true`, `PUBLIC_SITE_URL`, `PUBLIC_RESUME_URL`을 설정합니다. 사이트 URL은 경로, query, fragment, 인증 정보가 없는 공개 HTTPS origin이어야 합니다. 공개 모드가 아니면 페이지와 `robots.txt`를 검색 제외 상태로 유지합니다.

통합 HTML은 프로젝트 Markdown과 별도로 관리하므로 문구 변경 시 두 파일을 함께 확인합니다. `generate:portfolio`의 기본 입력은 저장소의 통합 HTML이며 목차·화면 스타일을 다시 적용합니다. 외부 원본을 가져올 때만 `PORTFOLIO_HTML_SOURCE`를 지정합니다. 이력서 PDF는 `/resume/print/`에서 다시 생성하고, 두 공개 자산의 SHA-256도 `public-assets.json`에 반영합니다.

## 테마

공개 포트폴리오 기본 테마는 B `Signal Grid`입니다. B와 C는 한 쌍으로 유지합니다. 시각 변경 시 `public/themes/b.css`와 `public/themes/c.css`를 함께 고칩니다.

## 개발과 검증

```bash
pnpm install
pnpm dev
```

문구·콘텐츠 변경은 로컬에서 `pnpm build`와 변경 영역의 최소 확인만 수행합니다. 전체 브라우저 검증은 GitHub CI에 맡기며, 작업 규칙은 저장소의 [`AGENTS.md`](AGENTS.md)에 기록합니다.

CI는 변경 경로에 따라 콘텐츠 검사(`pnpm test:e2e:content`) 또는 전체 E2E(`pnpm test:e2e`)를 선택합니다. 콘텐츠 검사는 경력·경로·PDF·통합 포트폴리오 읽기와 320·390·768·959·960·1024·1440px 배치 문제를 자동 검사합니다. 코드·스타일·의존성·테스트·CI 변경, 알 수 없는 경로와 수동 실행은 전체 검사를 수행합니다. 빌드·공개 자산·링크·릴리스 검사는 항상 유지합니다.

통과한 검사를 로컬에서 다시 실행하거나 성공한 CI의 화면 이미지를 일괄 검토하지 않습니다. PDF는 변경된 페이지의 잘림·겹침만 확인하고, 디자인·기능 변경 시 해당 영역을 확인합니다. 필요할 때 전체 로컬 검증은 `pnpm verify`로 실행할 수 있습니다.

`pnpm build:raw`는 Astro 정적 출력만 생성합니다. 기본 `pnpm build`는 타입, 콘텐츠 불변식, 단위 검사를 통과한 뒤 정적 출력을 생성합니다.

공개 안전 검사는 PDF 텍스트 추출 실패를 허용하지 않습니다. `pdftotext`가 PATH에 없으면 다음처럼 실행 파일을 지정합니다.

```bash
PDFTOTEXT_BIN=/path/to/pdftotext pnpm test:privacy
```

릴리스와 되돌리기 기준은 [`docs/release/runbook.md`](docs/release/runbook.md)에 기록합니다.

## 의존성 유지보수

포트폴리오의 유지보수 비용을 줄이기 위해 Dependabot의 일반 버전 업데이트 PR은 생성하지 않습니다. 보안 취약점 알림과 보안 업데이트는 활성화하며, 보안 업데이트 PR은 패키지 생태계별로 묶습니다. 일반 버전 업그레이드는 필요한 기능이나 호환성 문제가 있을 때 진행합니다.
