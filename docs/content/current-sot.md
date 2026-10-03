# 이력서·경력기술서·포트폴리오 콘텐츠 SoT

최종 개편: 2026-10-04. 상태: **병합·공개 배포 완료 / 채용 사이트 갱신 대기**. PR #62를 squash 병합했고 main 25c208222c771cbe8b06a4974c5f96777998c44c의 CI run 37159132600이 성공했다. 공개 PDF 두 개와 HTML의 HTTP 다운로드 SHA-256이 아래 로컬 파일과 일치함을 확인했다. 외부 채용 사이트는 개편 전 상태다.

## 편집 기준과 문서 역할

- 공통 경력 사실·회사별 프로젝트·핵심 기여: `src/data/site.ts`. 웹 경력과 이력서 PDF는 짧은 문안을 공유한다.
- 경력기술서의 업무 맥락·역할·근거: `src/data/career-description.ts`. 공통 사실을 참조하되 문서에 맞는 깊이로 설명한다.
- 실무 상세와 개인 프로젝트의 공개 구현: `public/portfolio/index.html`. 같은 사실 변경 시 수동 대조가 필요하다.
- 근거와 주장 경계: `docs/content/career_profile.md`, `docs/content/batch-messaging-review.md`.
- 현재 PDF 출력은 `/resume/print/`의 2쪽과 `/resume/career/`의 3쪽이다. 개인 프로젝트는 이력서·경력기술서의 상세 본문에 넣지 않는다.

같은 사례의 재등장은 허용하지만 네 사례의 전체 문단을 모든 문서에 반복하지 않는다. 이력서는 회사별 핵심 기여, 경력기술서는 프로젝트·담당 범위와 주요 기여, 포트폴리오는 판단·흐름·구현·확인 근거를 제공한다.

## 개편 내용

이력서는 최근 회사와 이전 회사에 각 1쪽을 배분했다. 경력기술서는 플랫폼 개발·전환과 운영 / 운영 안정화 / 화이트스캔 프로젝트의 3쪽으로 재구성했다. 이전 회사의 프로젝트·기간·역할은 저장된 경력 기록을 대조해 복원했으며 수치와 새로운 성과를 추가하지 않았다.

포트폴리오는 상태 재검증 → 배치 제어·모니터링 → Member Event Consistency의 별도 개인 구현을 먼저 안내한다. 실무 5개와 개인 프로젝트 6개의 상세·URL·앵커를 유지한다. 개인 프로젝트의 반복 요약을 제거하고 검증 범위를 각 상세에 모았다. `portfolio-results`는 프로젝트 목록이며 이전 `portfolio-capabilities`, `portfolio-scope` 링크는 같은 목록의 앵커로 남긴다.

## 로컬 산출물

| 파일 | SHA-256 | 크기 |
|---|---|---|
| `public/portfolio/index.html` | `c13fa43c0f5a38d46195c09f6a9fb6607accf0ee41ebc36dca9d035eda0ed7a9` | 186843 bytes |
| `public/downloads/career-description.pdf` | `ef352e28fc1f58d6fbee64ecdbea4c15f441c6698ce70b8d7e1b7069f4011d7d` | 148375 bytes |
| `public/downloads/resume.pdf` | `ee72f40df8b4234b5cb9a4cdad747ddd62527bd37bc6a35d9cc911718fff781e` | 479502 bytes |

정적 빌드 1회 후 두 PDF를 생성하고 dist에 복사했다. 공개 안전성·내부 링크 검사 통과, PDF 2쪽·3쪽 및 다섯 페이지 시각 검토, PDF 텍스트·링크 추출을 확인했다. 포트폴리오 320·1440px에서 가로 넘침 0과 목차 대상 존재를 확인했다. 목차 생성기 관련 단위 검사 9건이 통과했다. 타입·전체 단위·접근성·반응형·브라우저 회귀는 PR CI에 맡긴다.

디자인 탐지 검사 1회를 수행했다. 기존 인쇄·통합 HTML의 색상·크기와 과거 스타일 선언에 advisory/warning이 남아 있으며, 디자인 검사 무경고 통과로 표현하지 않는다. 변경 화면과 PDF의 직접 확인을 별도로 수행했다.

## 배포·외부 사이트 상태

2026-10-04 후속 병합 요청에 따라 PR #62를 병합·배포했다. 공개 이력서 2쪽·경력기술서 3쪽·포트폴리오 HTML은 승인 파일과 HTTP 다운로드 해시가 일치한다. 외부 플랫폼은 새 입력문안 준비만 완료했으며 갱신 대기다. 별도 portfolio-hub 릴리스 첨부는 과거 자료이므로 최신 제출 파일은 cyson21.github.io/downloads/와 /portfolio/index.html을 사용한다.

## CI 후속 · 타입 오류 수정

첫 preview(run 37154820685)의 타입 검사에서 배열에서 가져온 회사 항목의 undefined 가능성으로 실패했다. 현재·이전 회사의 필수 데이터 확인을 추가했으며 해당 pnpm check:types만 로컬에서 실행해 오류0·경고0·기존 hint1을 확인했다. 문구와 출력 내용은 바뀌지 않아 PDF를 재생성하지 않았다. 후속 PR CI run 37155021013과 병합 후 main CI run 37159132600이 성공했다.
