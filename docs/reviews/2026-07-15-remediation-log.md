# 2026-07-15 병렬 리뷰 개선 원장

## 집계 기준

- 5개 병렬 리뷰의 지적 85건을 통합했습니다.
- 같은 수정으로 해소된 중복 지적은 한 건으로 계산했습니다.
- 실제 소스에 반영되고 자동 또는 화면 검증이 가능한 항목만 완료로 기록했습니다.
- 외부 호스팅, 실제 운영 성능처럼 현재 근거가 없는 항목은 완료 수에 포함하지 않았습니다.

## 완료 항목

| ID | 축 | 개선 내용 | 근거 |
| --- | --- | --- | --- |
| IMP-001 | 콘텐츠 | 홈 첫 문장을 기술 나열이 아닌 상태 정합성·부분 실패·데이터 흐름 중심으로 수정 | `src/data/site.ts` |
| IMP-002 | 콘텐츠 | 실무 기술과 개인 프로젝트 기술을 별도 그룹으로 분리 | `src/data/site.ts` |
| IMP-003 | 콘텐츠 | 최근 경력의 책임 범위를 요구사항 분석부터 저장소 설계·회귀 테스트·스테이징 검증까지 명시 | `src/data/site.ts` |
| IMP-004 | 콘텐츠 | 경력 사례를 문제·행동·결과 구조로 통일 | `src/data/site.ts` |
| IMP-005 | 콘텐츠 | StockRush Outbox 근거를 실제 PostgreSQL 통합 테스트 범위에 맞게 수정 | `src/content/projects/stockrush.md` |
| IMP-006 | 콘텐츠 | StockRush 대표 코드마다 실제 구현 경로·보호 규칙·테스트명을 연결 | `src/content/projects/stockrush.md` |
| IMP-007 | 콘텐츠 | Member Event Consistency의 동시성 시나리오와 직접 담당 범위를 분명하게 기술 | `src/content/projects/member-event-consistency.md` |
| IMP-008 | 콘텐츠 | AI Gateway의 라우팅·회복 흐름을 실제 8단계 처리 순서로 정리 | `src/content/projects/ai-gateway.md` |
| IMP-009 | 콘텐츠 | AI Gateway 대표 근거의 테스트명과 소스 경로를 실제 저장소 기준으로 교정 | `src/content/projects/ai-gateway.md` |
| IMP-010 | 콘텐츠 | RAG 인용 근거의 출처와 검증 범위를 실제 평가 경로 기준으로 교정 | `src/content/projects/enterprise-policy-rag.md` |
| IMP-011 | 콘텐츠 | RAG 토큰·비용 값을 측정값이 아닌 추정값으로 명시 | `src/content/projects/enterprise-policy-rag.md` |
| IMP-012 | 콘텐츠 | CDC 단계별 검증을 독립된 실행 결과로 표시하고 전체 연동 과장을 제거 | `src/content/projects/cdc-data-platform.md` |
| IMP-013 | 콘텐츠 | 패션 개인화 후보 생성이 결정 규칙 기반임을 명시 | `src/content/projects/fashion-personalization-platform.md` |
| IMP-014 | 콘텐츠 | 비공개 소스 프로젝트의 공개 범위와 확인 가능한 근거를 구분 | `src/content/projects/fashion-personalization-platform.md` |
| IMP-015 | 콘텐츠 | Redis·RabbitMQ는 구현 검증과 성능 비교를 별도 수준으로 분리 | `src/content/projects/fashion-personalization-platform.md` |
| IMP-016 | 콘텐츠 | 모든 프로젝트에 현재 검증 범위와 다음 검증 단계를 노출 | `src/content/projects/*.md` |
| IMP-017 | 접근성 | 본문 건너뛰기 링크가 실제 `main`으로 초점을 이동하도록 수정 | `src/layouts/BaseLayout.astro` |
| IMP-018 | 접근성 | 모바일 메뉴를 Escape로 닫고 메뉴 버튼으로 초점을 복원 | `src/components/Header.astro` |
| IMP-019 | 접근성 | 프로젝트 외부 링크마다 대상이 드러나는 고유 접근성 이름 제공 | `src/components/ProjectRow.astro`, `src/components/CodeEvidence.astro` |
| IMP-020 | 접근성 | 새 창 링크에 새 창 열림 정보를 접근성 이름으로 제공 | `src/components/ProjectRow.astro`, `src/components/CodeEvidence.astro` |
| IMP-021 | 접근성 | 증거 탭에 좌우 화살표·Home·End 키 이동을 구현 | `src/components/CodeEvidence.astro` |
| IMP-022 | 접근성 | 활성 탭과 패널의 `aria-selected`, `aria-controls`, `aria-labelledby` 연결 | `src/components/CodeEvidence.astro` |
| IMP-023 | 접근성 | 가로로 넘치는 코드만 키보드로 스크롤할 수 있도록 초점 제어 | `src/components/CodeEvidence.astro` |
| IMP-024 | 접근성 | 웹폰트 적용 뒤 코드 넘침을 재판정해 누락되는 초점 문제 수정 | `src/components/CodeEvidence.astro` |
| IMP-025 | 접근성 | 프로젝트 필터를 키보드로 선택 가능한 단일 선택 의미 구조로 수정 | `src/pages/projects/index.astro` |
| IMP-026 | 접근성 | 모바일 검증 표에 LEVEL·METHOD·RESULT 레이블을 지속 노출 | `src/pages/projects/[slug].astro` |
| IMP-027 | 접근성 | 생성 구성도를 순서 있는 목록으로 표현 | `src/components/ProjectVisual.astro` |
| IMP-028 | 접근성 | 장식용 연결선과 화살표를 보조 기술에서 제외 | `src/components/SystemMap.astro`, `src/components/FlowExplorer.astro` |
| IMP-029 | 접근성 | 프로젝트 이미지에 화면 설명과 시스템 흐름을 연결한 긴 설명 제공 | `src/components/ProjectVisual.astro` |
| IMP-030 | 접근성 | 가로 구성도 영역을 키보드 초점 가능한 스크롤 영역으로 제공 | `src/components/ProjectVisual.astro` |
| IMP-031 | 접근성 | 목차 해시 이동 시 대상 섹션으로 초점을 함께 이동 | `src/pages/projects/[slug].astro` |
| IMP-032 | 반응형 | 모바일 프로젝트 목차를 상단 고정 가로 탐색으로 축소 | `src/pages/projects/[slug].astro` |
| IMP-033 | 반응형 | 모바일 목차의 최소 콘텐츠 폭이 문서를 넓히는 10px 오버플로 수정 | `src/pages/projects/[slug].astro` |
| IMP-034 | 반응형 | 모바일 검증 카드의 고정 최소 높이를 제거해 불필요한 여백 축소 | `src/components/VerificationSignal.astro` |
| IMP-035 | 반응형 | 프로젝트 목록 행에서 모바일 메타·태그 밀도를 축소 | `src/components/ProjectRow.astro` |
| IMP-036 | 반응형 | 모바일 홈 히어로의 글자 크기·간격·2열 구성을 한 열로 조정 | `src/pages/index.astro` |
| IMP-037 | 반응형 | 모바일 경력 타임라인을 한 열 구조로 재배치 | `src/pages/experience/index.astro` |
| IMP-038 | 반응형 | 모바일 웹 이력서의 헤더·요약·경력 밀도를 별도로 조정 | `src/pages/resume/index.astro` |
| IMP-039 | 시각 | 실제 프로젝트 이미지를 자르지 않고 전체가 보이도록 `contain` 처리 | `src/components/ProjectVisual.astro` |
| IMP-040 | 시각 | 세부 이미지를 새 탭 원본으로 확인하는 명시적 버튼 추가 | `src/components/ProjectVisual.astro` |
| IMP-041 | 시각 | 세로 이미지의 최대 높이를 제한해 첫 화면 균형 유지 | `src/components/ProjectVisual.astro` |
| IMP-042 | 시각 | 모바일 생성 구성도를 문서 폭이 아닌 내부 영역에서 가로 스크롤하도록 수정 | `src/components/ProjectVisual.astro` |
| IMP-043 | 성능 | 상세 페이지 상단 대표 이미지를 우선 로딩하도록 변경 | `src/components/ProjectVisual.astro` |
| IMP-044 | PDF | 공개 이력서를 전용 인쇄 경로에서 정확히 A4 2페이지로 생성 | `src/pages/resume/print.astro`, `scripts/generate-public-resume.mjs` |
| IMP-045 | PDF | 대표 프로젝트 3개와 보조 프로젝트 2개의 정보 위계를 분리 | `src/pages/resume/print.astro` |
| IMP-046 | PDF | 프로젝트 근거를 검증 수준·실행 결과·상세 경로로 구성 | `src/pages/resume/print.astro` |
| IMP-047 | PDF | 본문 크기와 줄 간격을 키우고 페이지 하단 여백을 축소 | `src/pages/resume/print.astro` |
| IMP-048 | 공개 안전 | 기본 프리뷰를 `noindex,nofollow`로 고정 | `src/layouts/BaseLayout.astro` |
| IMP-049 | 공개 안전 | 공개 모드 URL을 HTTPS origin으로 제한하고 경로·인증정보·로컬 주소를 거부 | `src/lib/release-origin.ts` |
| IMP-050 | 공개 안전 | 404에서 색인과 canonical 생성을 차단 | `src/layouts/BaseLayout.astro`, `src/pages/404.astro` |
| IMP-051 | 공개 안전 | `pdftotext` 누락·추출 실패를 성공으로 넘기지 않는 fail-closed 검사 추가 | `scripts/check-public-safety.mjs` |
| IMP-052 | 공개 안전 | 공개 파일을 닫힌 허용 목록으로 관리하고 SHA-256 일치 여부 확인 | `src/data/public-assets.json`, `scripts/check-public-safety.mjs` |
| IMP-053 | 공개 안전 | 원본과 빌드 산출물의 공개 자산 해시를 함께 비교 | `scripts/check-public-safety.mjs` |
| IMP-054 | 생성 안정성 | PDF를 임시 파일에 생성한 뒤 검증 성공 시 원자적으로 교체 | `scripts/generate-public-resume.mjs` |
| IMP-055 | 생성 안정성 | PDF 생성 실패 시 브라우저·임시 파일을 항상 정리 | `scripts/generate-public-resume.mjs` |
| IMP-056 | 데이터 품질 | 이미지와 생성 구성도를 구분하는 판별형 콘텐츠 스키마 적용 | `src/content.config.ts` |
| IMP-057 | 데이터 품질 | 프로젝트 순서·경로·근거·검증 수준의 불변식 검사 추가 | `scripts/check-content-invariants.mjs` |
| IMP-058 | SEO | 공개 모드에서 canonical·Open Graph·Twitter 이미지를 절대 URL로 생성 | `src/layouts/BaseLayout.astro` |
| IMP-059 | SEO | 기본 소셜 이미지 대체 텍스트와 ProfilePage·TechArticle 구조화 데이터 추가 | `src/layouts/BaseLayout.astro` |
| IMP-060 | 릴리스 | 기본 빌드에 타입·콘텐츠·단위·공개 안전·링크 검사를 연결 | `package.json` |
| IMP-061 | 릴리스 | 프리뷰와 공개 릴리스 빌드를 CI에서 분리 검증 | `.github/workflows/verify.yml` |
| IMP-062 | 릴리스 | 공개 모드 canonical·robots·sitemap·404 검증 E2E 추가 | `tests/e2e/release.spec.ts` |
| IMP-063 | 회귀 | 데스크톱·모바일 문서 폭, 접근성, 라우트, 상호작용 E2E 추가 | `tests/e2e/*.spec.ts` |

## 완료 수

**63개 개선을 반영했습니다.** 외부 호스팅 연결, 실제 운영 트래픽 성능 측정, 비공개 원 저장소의 공개 전환은 이번 완료 수에서 제외했습니다.
