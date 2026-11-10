---
order: 5
featured: false
publicationState: public
name: CDC Data Platform
domain: Data
eyebrow: CDC 이벤트 처리 프로토타입
summary: 원천 메타데이터 기반 중복 방지와 DB 재처리 상태를 구현한 프로토타입입니다. 변경 캡처 검사 스크립트·관리 API·로컬 적재는 독립 구성요소이며 전체 자동 연결은 구현하지 않았습니다.
period: '2026.06'
role: 개인 프로젝트 · CDC 관리 API·중복 처리·재처리 흐름 구현
stack:
  - Java
  - Spring Boot
  - PostgreSQL
  - Debezium (실행 설정)
  - Kafka (토픽 설정)
  - Apache Iceberg (독립 실험)
problem: >-
  Debezium이 재시작되거나 같은 변경을 다시 보내면 이벤트가 중복됩니다. 원본 위치(LSN, 오프셋)를 잃어버리면 같은 변경인지 알 수 없고, 적재가 실패했을 때 무엇을 다시 돌려야 하는지도
  모릅니다.
responsibilities:
  - PostgreSQL·Debezium·Kafka의 로컬 실행 설정과 Spring Boot 관리 API를 작성했습니다.
  - 처리 이력 테이블로 중복을 막고, 재시도, DLQ, 재처리 요청과 커넥터 상태 확인 기능을 넣었습니다.
  - 수집, 상태 관리, 적재를 따로 만들고, 어디까지 연결했는지 문서에 구분해 적었습니다.
flow:
  normal:
    - 변경 캡처 검사 스크립트
    - 표준 이벤트·처리 이력 DB
    - 테스트 데이터의 로컬 파일 적재
  failure:
    - 같은 오프셋이 두 번 들어옴
    - 적재 실패
    - 같은 변경의 재전달
  recovery:
    - DB 중복 등록 거절
    - 재시도·DLQ 상태 분리
    - 재처리 요청·재시도 대상 반환
signals:
  - label: 변경 캡처 스크립트
    expression: INSERT·UPDATE·DELETE 검사 명령
    result: LSN·오프셋 점검 로직 정의 · 실캡처 실행 결과 미확인
    tone: warning
    source: tools/runner/cdc-smoke applicant-change-capture
    sourceUrl: >-
      https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/tools/runner/cdc-smoke
  - label: 중복 처리 방지
    expression: 같은 변경 2번
    result: 처리 이력 1건, 두 번째는 건너뜀
    tone: warning
    source: CdcEventLedgerRepositoryTest.insertIfAbsentReturnsFalseForDuplicateSourceEvent
    sourceUrl: >-
      https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/ledger/CdcEventLedgerRepositoryTest.java
  - label: DB 재처리 상태
    expression: DLQ·재시도 행을 준비한 DB 테스트
    result: 원천 메타데이터 유지, 재시도 반환값 1건 · Kafka 전송 아님
    tone: danger
    source: SinkFailureReplayFlowTest.sinkFailureReplayFlowKeepsSourceMetadataIdempotency
    sourceUrl: >-
      https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java
decisions:
  - title: 이벤트 ID는 원본 위치로
    choice: 수집기·스키마·테이블·기본 키·LSN·변경 종류를 해시해 이벤트 ID를 만들고, 원천 오프셋은 별도로 보존합니다.
    alternative: 소비자가 UUID를 새로 만들기
    reason: UUID를 새로 만들면 같은 변경이 다시 왔을 때 알아볼 방법이 없습니다.
  - title: 실패한 이벤트는 따로
    choice: 원본·표준·재시도·DLQ·재처리 토픽 이름과 상태 모델을 분리했습니다. 상시 소비·자동 전달은 연결되지 않은 상태입니다.
    alternative: 실패한 이벤트를 원래 토픽에 바로 다시 넣기
    reason: 계속 실패하는 이벤트가 정상 이벤트 처리를 막지 않게 하고, 무엇을 다시 돌릴지 사람이 고를 수 있게 했습니다.
  - title: 구성요소별 검증
    choice: 수집, 상태 관리와 적재를 독립 실행하고 단계별 결과를 확인합니다.
    alternative: 전체 파이프라인을 먼저 연결한 뒤 종단 테스트만 수행
    reason: 이벤트 변환·DB 중복 방지·적재 결과를 각각 확인하기 위한 구성입니다. 단계 사이의 자동 전달은 후속 구현 범위입니다.
protectionRules:
  - 처리 이력의 동일 이벤트 ID는 중복 등록되지 않습니다.
  - DLQ에 없는 이벤트는 재처리를 요청할 수 없습니다.
  - 로컬 적재는 테스트 데이터로만 확인했고, AWS에서는 돌려 보지 않았습니다.
  - 수집, 상태 관리, 적재는 아직 하나로 연결되어 있지 않습니다.
codeEvidence:
  - symbol: CanonicalIngestService.ingestRawEnvelope
    displayPath: backend/src/main/java/com/example/cdcplatform/event/CanonicalIngestService.java
    sourceUrl: >-
      https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/main/java/com/example/cdcplatform/event/CanonicalIngestService.java
    excerpt: |
      DebeziumEnvelope envelope = DebeziumEnvelope.parse(rawEnvelopeJson);
      CanonicalCdcEvent event = CanonicalCdcEvent.fromEnvelope(envelope);
      String sourceOffsetJson = sourceOffsetJson(envelope);
      boolean created = canonicalEventPublisher.recordCanonicalEvent(event, sourceOffsetJson);
    proves: 원천 LSN·오프셋을 표준 이벤트와 함께 넘기고 저장소의 등록 결과로 중복 응답을 구분합니다. 연결 단위 테스트는 발행기 대역을 사용합니다.
    testName: CanonicalIngestServiceTest.duplicateRawEnvelopeDoesNotIncreaseCanonicalEventCount
    testPath: backend/src/test/java/com/example/cdcplatform/event/CanonicalIngestServiceTest.java
    testUrl: >-
      https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/event/CanonicalIngestServiceTest.java
  - symbol: ReplayRequestService.requestReplay
    displayPath: backend/src/main/java/com/example/cdcplatform/replay/ReplayRequestService.java
    sourceUrl: >-
      https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/main/java/com/example/cdcplatform/replay/ReplayRequestService.java
    excerpt: |
      DlqEvent dlqEvent = dlqEventRepository.findById(dlqEventId)
          .orElseThrow(() -> new IllegalArgumentException("DLQ event not found: " + dlqEventId));
      String requestId = "replay_" + UUID.randomUUID();
    proves: DLQ에 실제로 있는 이벤트만 재처리 대상이 되고, 요청마다 추적용 ID를 붙입니다.
    testName: ReplayRequestServiceTest.createsReplayRequestAndMarksDlqEventForReplay
    testPath: backend/src/test/java/com/example/cdcplatform/replay/ReplayRequestServiceTest.java
    testUrl: >-
      https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/replay/ReplayRequestServiceTest.java
  - symbol: RetryEventService.scheduleRetry
    displayPath: backend/src/main/java/com/example/cdcplatform/retry/RetryEventService.java
    sourceUrl: >-
      https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/main/java/com/example/cdcplatform/retry/RetryEventService.java
    excerpt: |
      RetryEventRepository.InsertResult insertResult =
          retryEventRepository.insertIfAbsent(
              new RetryEventRepository.RetryEvent(
                  command.eventId(),
                  command.sourceConnector(),
                  command.sourceSchema(),
                  command.sourceTable(),
                  command.sourcePrimaryKey(),
                  command.sourceLsn(),
                  command.sourceOffsetJson(),
                  command.rawPayloadJson(),
                  command.failureReason(),
                  command.retryTopic(),
                  command.nextAttemptAt(),
                  command.maxAttempts()
              )
          );
    proves: >-
      재시도 저장 행에 원천 메타데이터를 보존합니다. 연결 테스트는 DB 행과 publishReady 반환 목록 1건을 검사합니다. 이 메서드는 실제 Kafka 전송이 아니라 PUBLISHED 상태
      변경과 DTO 반환을 수행합니다.
    testName: SinkFailureReplayFlowTest.sinkFailureReplayFlowKeepsSourceMetadataIdempotency
    testPath: backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java
    testUrl: >-
      https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java
verification:
  - layer: container-smoke
    method: PostgreSQL Testcontainers에서 같은 원천 이벤트를 처리 이력 저장소에 두 번 등록합니다.
    result: 첫 등록은 성공하고 두 번째는 거절되며 DB 행은 1건입니다.
    sources:
      - label: CdcEventLedgerRepositoryTest.insertIfAbsentReturnsFalseForDuplicateSourceEvent
        url: >-
          https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/ledger/CdcEventLedgerRepositoryTest.java#L42
    evidenceStatus: ci-record
  - layer: container-smoke
    method: cdc-smoke applicant-change-capture는 PostgreSQL 변경과 Kafka raw 이벤트의 종류·LSN·오프셋을 점검하도록 작성된 실행 스크립트입니다.
    result: 이번 대조에서는 실제 Debezium·Kafka 변경 캡처의 실행 증거를 확인하지 못했습니다. CI의 fixture 대역 테스트 출력은 실제 캡처 성공으로 세지 않았습니다.
    sources:
      - label: applicant_change_capture 실행 스크립트
        url: >-
          https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/tools/runner/cdc-smoke
    evidenceStatus: test-definition
  - layer: integration
    method: PostgreSQL 테스트가 처리 이력·DLQ 행을 직접 준비하고 requestReplay, scheduleRetry, publishReady를 호출합니다.
    result: 원천 메타데이터, 재시도 반환 목록 1건과 DB 상태를 확인했습니다. 실제 sink 장애, Kafka 재발행이나 적재 복구를 수행한 결과는 아닙니다.
    sources:
      - label: SinkFailureReplayFlowTest.sinkFailureReplayFlowKeepsSourceMetadataIdempotency
        url: >-
          https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java#L65
    evidenceStatus: ci-record
limitations:
  - >-
    변경 캡처 실행 스크립트, 관리 API, 로컬 적재는 독립 구성요소입니다. Kafka 상시 소비와 전체 단계의 자동 연결은 구현되어 있지 않습니다. 실제 변경 캡처·장기 Connect 실행 증거는
    이번 대조에서 확인하지 못했습니다.
  - 적재는 테스트 데이터로만 확인했고, S3·Athena·Trino 같은 실제 환경, 운영 규모 부하와 다중 리전은 검증하지 않았습니다.
next:
  - 세 부분을 이어서 처음부터 끝까지 흘려 보고, 재처리에 얼마나 걸리는지 재 보려고 합니다.
links:
  github: https://github.com/cyson21/cdc-data-platform
  design: >-
    https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/docs/portfolio/one-pager.md
  testReport: https://github.com/cyson21/cdc-data-platform/tree/4523561b8ddac7ccd01f493952bd3e08018374ce/tools/tests
visual:
  kind: diagram
  alt: 자동 연결되지 않은 변경 캡처 스크립트, 처리 이력 DB, 로컬 적재의 독립 구성요소
  connected: false
seo:
  title: CDC Data Platform · 변경 이벤트의 처리 이력·재시도 상태
  description: 원천 메타데이터 기반 중복 방지와 DB 재처리 상태를 구현한 프로토타입입니다. Kafka 실전송·전체 파이프라인 복구 검증과 구분합니다.
updatedAt: '2026-11-10'
evidenceReview:
  commit: 4523561b8ddac7ccd01f493952bd3e08018374ce
  sourceUrl: https://github.com/cyson21/cdc-data-platform/tree/4523561b8ddac7ccd01f493952bd3e08018374ce
  checkedAt: '2026-11-10'
  ciUrl: https://github.com/cyson21/cdc-data-platform/actions/runs/37869868595
  ciRunDate: '2026-10-09'
  scope: CI의 PostgreSQL 저장소·서비스 테스트를 확인했습니다. 실제 변경 캡처는 스크립트 정의만 확인했으며 fixture 출력으로 실캡처 성공을 주장하지 않습니다.
---
같은 DB 변경이 두 번 와도 한 번만 반영되고, 실패하면 어디서부터 다시 돌릴지 알 수 있게 만든 CDC 프로토타입입니다.
