# 콘텐츠 검토와 개선 순서

검토일: 2026-10-01. 디자인 기준: `ffe62cae412f4589cf70214ca7aa72eb91953ba0`. 작업 브랜치의 기반 커밋은 Linux 시각 기준 이미지 갱신을 포함한 `f3b27dbeacb8f421c2b969d31aacdd5ca0136478`이다.

## 근거의 구분

- 실무 경력: 기존 `src/data/site.ts`와 이력서에 기록된 회사·직무·기간·업무를 기준으로 한다. 회사의 비공개 코드는 공개 프로젝트로 대신 입증하지 않는다.
- 개인 프로젝트: 공개 저장소 README, 주요 구현, 관련 테스트의 설정과 assertion을 함께 확인한다. 테스트 입력 건수는 서비스 이용자 수나 처리량이 아니다.
- 이번 작업의 코드 검토는 기존 테스트 결과의 범위를 확인하는 작업이다. 연결 프로젝트 6개의 테스트를 새로 실행한 것으로 표현하지 않는다.

## 우선순위

| 순서 | 문제 | 처리 |
|---|---|---|
| 1 | 2021.07부터 현재까지의 경력을 `5년 차`로 표기 | `2021년부터 백엔드 개발·운영`으로 통일. 입·퇴사일을 추측해 정확한 개월 수를 만들지 않음 |
| 2 | 요약에 API 설계·운영·안정성 문장이 반복됨 | 기업 플랫폼, 데이터 수집, 장애 재현·수정·테스트, 배포 경험으로 각각 구체화 |
| 3 | 실무 기술과 개인 프로젝트 기술이 같은 목록에 섞임 | 회사 경력에 있는 기술과 공개 프로젝트 기술을 구분. AWS 서비스와 테스트 도구는 기존 이력서 범위에서 유지 |
| 4 | `재발을 줄였다`, `유지보수성을 높였다`에 측정 근거 없음 | 수정한 대상과 검증한 작업을 기술. 개선율·장애 감소율을 추가하지 않음 |
| 5 | RAG가 생성된 인용을 사후 재검사한다고 읽힘 | SQL 후보 필터 → 검색 서비스 권한 재확인 → 검색 결과로 출처 구성. 생성 답변의 사실성 자동 검증으로 확대하지 않음 |
| 6 | Redis 성능 효과, RabbitMQ 순서 보장 범위가 과도함 | 성능 미측정과 단일 Spring 인스턴스 검증 범위를 명시 |
| 7 | CDC 이벤트 ID, 테스트 더블과 실제 DB 결과가 혼재 | 원천 메타데이터로 ID를 생성하는 구현과 DB 처리 이력 검증을 구분. 7→6 수치는 대응 근거를 확인하기 전 사용하지 않음 |
| 8 | Fashion의 `지연 0건`이 성능처럼 읽힘 | 고정 입력 배치에서 미반영 이벤트가 있는 스냅샷 수로 설명. HTTP 워커·외부 큐·스케줄러 미구현 표시 |
| 9 | 웹·인쇄·다운로드 PDF·통합 HTML이 별도 관리됨 | 동일한 사실과 범위를 반영하고 자산 해시 갱신. CSS와 디자인 유지 |

## 확인한 공개 코드

| 프로젝트 | 확인 기준 커밋 | 주요 근거 |
|---|---|---|
| StockRush | `aff3d3b706a2dff7c24b1bcc3ba351255bb5eeaa` | PersistentCreateOrderService, OrderSagaEventHandler, OutboxRelayService와 각 통합 테스트, README·Outbox 설계 |
| Member Event Consistency | `db2b546911dd3714193b0994fee34ddf5f32f02c` | SqlCouponCampaignRepository, SqlPointSpendRepository, CouponCampaignRabbitMqWorker, FirstLoginRewardDbConcurrencyIT, PointSpendDbConcurrencyIT, MvpLiveInfrastructureIT |
| Enterprise Policy RAG | `ba04968a48d9ade364e2b28bd8fae003cd7d1689` | retrieval.py, answer.py, repository.py, 권한 검색·답변·PostgreSQL 통합 테스트 |
| AI Gateway | `e90abf34a2b041171cd163e393665297484b9e88` | GatewayPipeline, TwoStageCache, FallbackChain와 관련 테스트, README |
| CDC Data Platform | `adba37f4e14ab4d7b70adfc81ad8dc954cd77be9` | CanonicalIngestService, ReplayRequestService, RetryEventService, 단위·DB 복구 테스트, cdc-smoke, README |
| Fashion Personalization | `b591e897fa62ac179a07e5aa96ee48178c7a39a1` | recommendation.py, batch.py, 이벤트·추천·배치 테스트, README |

## 남은 확인 사항

현재 재직 여부, 팀과 고객 수의 기준 시점, 장애의 구체 사례, 배포 파이프라인에서 본인이 바꾼 부분, 성과 측정값은 공개 코드만으로 추가 확인할 수 없다. 기존 사실은 보존하되, 새 성과나 담당 범위는 만들지 않는다. 개인 프로젝트의 구현 코드가 존재하는 것과 본인이 기술 선택의 전 과정을 설명할 수 있는지는 별개이므로 면접 전 확인이 필요하다.

## 반영 내용

소개·경력·실무 기술 스택·개인 프로젝트 기술을 구분하고, 프로젝트 6개의 요약·역할·검증 한계를 다듬었다. 통합 HTML의 RAG 권한 설명, CDC 중복 테스트 근거, 포인트 단위와 추천 배치 결과도 정정했다. HTML의 DOM 구조·CSS·이미지는 유지했다.

## PDF·화면 검증 후속 작업

2026-10-01에 로컬 렌더링이 가능한 환경에서 후속 검증을 수행했다.

- `/resume/print/`에서 다운로드 PDF를 재생성했다. A4 2페이지이며, 두 페이지를 PNG로 렌더링해 하단 잘림·겹침과 기술 구분을 확인했다.
- `public-assets.json`의 PDF SHA-256과 확인 날짜를 갱신했다.
- `/experience/`, `/portfolio/`, `/resume/print/`을 빌드 미리보기에서 320·390·1440px로 확인했다. 가로 넘침이 없고, 인쇄 내용은 두 페이지 모두 footer 위에 위치한다.
- 개발 서버의 `/portfolio/`는 정적 디렉터리 경로를 404로 응답하므로, 통합 HTML 화면은 빌드 후 미리보기에서 검증했다.
- 최신 `origin/main` (`cac147c`)을 병합했다. 이미 병합된 디자인 변경과 스크린샷 기준 제거를 보존하고, 통합 문서의 단일 main landmark와 실제 읽기·배치 검사를 유지했다.
- 기존 E2E의 경력 문구를 현재 콘텐츠에 맞추고, 실무 기술 목록 선택자를 개인 기술 목록과 구분했다. 사용하지 않는 UI 라벨 검사는 일반 설명 문장의 부분 문자열을 오인하지 않도록 정확한 텍스트로 검사한다.
- 최종 빌드의 타입·콘텐츠·테마·단위 테스트·공개 자산·내부 링크 검사가 통과했다.
- 최신 읽기·배치 검사를 포함한 전체 브라우저 E2E는 234개 통과, 기기별 조건에 따른 10개 제외로 완료했다.
- GitHub Pages 배포는 main 병합 이후의 별도 단계다. 이 작업에서는 콘텐츠 브랜치와 PR 검증을 대상으로 한다.
