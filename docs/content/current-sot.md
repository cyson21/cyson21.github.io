# 이력서·포트폴리오 콘텐츠 SoT

최종 검토: 2026-10-03. 회사 실무를 먼저 소개하고 개인 프로젝트를 구현·검증의 보조 근거로 연결한다. 경력 사실과 수치는 근거가 확인된 범위에서만 작성한다.

## 편집 기준

| 내용 | 원본 | 사용하는 화면·산출물 |
|---|---|---|
| 소개·경력·기술·대표 실무 사례 | [site.ts](../../src/data/site.ts) | 홈, 경력·이력서, 인쇄 이력서 |
| 실무 상세와 개인 프로젝트 근거 | [portfolio/index.html](../../public/portfolio/index.html) | 웹 포트폴리오 |
| 주장 범위와 근거 | [career_profile.md](career_profile.md), [batch-messaging-review.md](batch-messaging-review.md) | 작성·검수 기준 |
| PDF 출력 | [print.astro](../../src/pages/resume/print.astro) | [resume.pdf](../../public/downloads/resume.pdf) |
| 경력기술서 확장 설명 | [career-description.ts](../../src/data/career-description.ts) | 같은 4개 사례의 원인·판단·검증 근거 |
| 경력기술서 출력 | [career.astro](../../src/pages/resume/career.astro) | [career-description.pdf](../../public/downloads/career-description.pdf), 3쪽 |
| 공개 파일 승인 해시 | [public-assets.json](../../src/data/public-assets.json) | HTML·PDF 공개 안전성 검사 |

이력서에는 상태 재검증, 구매 API 락 경합·트랜잭션 경계, 배치 분산락·모니터링, 복합 식별자 정합성의 대표 4개를 싣는다. 포트폴리오는 같은 4개와 RabbitMQ 비동기 요청·결과 분리의 상세 5개를 싣는다. 이 차이는 문서 역할에 따른 의도된 구성이다. Redis 만료 이벤트는 보조 근거로 보존한다.

내용이 바뀌면 공통 원본과 상세 설명의 사실을 먼저 맞춘다. PDF 내용에 영향을 주는 변경만 인쇄 템플릿에서 재생성하고 공개 자산 해시를 함께 갱신한다. PDF를 직접 편집하거나 과거 생성기 입력에서 최신 제출본을 재생성하지 않는다.

## 경력기술서 추가 · 배포 대기

회사 실무 경력기술서는 site.ts의 경력·제목·문제·변경을 공유하고 career-description.ts에서 원인·판단·검증 근거를 확장한다. 개인 프로젝트는 보조 링크로만 둔다. [근거와 출력 검토](career-description-review.md)에 주장 범위와 생성 결과를 기록했다. A4 3쪽, 149,354 bytes이며 SHA-256은 `D143E07AC48DBFFACFECB0AA108871107DC3F4BA8DA2D3046146B3B21EF391CD`다.

현재 경력기술서는 PR 산출물이며 공개 배포·외부 플랫폼 반영은 대기 상태다. 아래 배포 대조 기록에 새 파일이 배포됐다고 추가하지 않는다.

## 배포 대조 기록

2026-10-03 새 HTTP 응답을 확인했다. 배포 기준 커밋은 `5e08dbd63df036fb1ae8c28d1fa67fb0f3ac96c2`, GitHub Pages run `37038347020`은 성공했다.

- 웹 이력서 대표 4개의 제목·문제·수정·검증 16개 필드는 원본·PDF와 일치한다.
- 배포 포트폴리오 HTML은 로컬 원본과 바이트가 일치한다.
- 배포 PDF는 로컬 파일과 SHA-256이 일치하며 2쪽, 511,762 bytes이다.
- PDF SHA-256: `99F3AD1A1F795E307BDD74B674481227B8DA1753A8DA94ACAE3A299B78074967`.

이 검토에서 경력 근거 문서와 갱신일 메타데이터를 정리한다. 위 배포 기록은 검토 직전 배포 내용에 대한 기록이며 이번 문서 변경의 배포 완료를 의미하지 않는다.

외부 채용 플랫폼 등록본과 별도 GitHub release 첨부 PDF는 이번에 확인하거나 갱신하지 않았다. 공개 웹 다운로드와 동일하다고 전제하지 않는다. 회사 소스·내부 URL·고객 정보·연락처 포함 플랫폼 스냅샷은 이 저장소에 복사하지 않는다.
