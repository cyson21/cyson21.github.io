---
order: 5
featured: false
publicationState: public
name: CDC Data Platform
domain: Data
eyebrow: CDC 이벤트 처리 프로토타입
summary: DB 변경 수집, 이벤트 처리 이력과 실패 재처리를 구현한 CDC 프로토타입입니다. 원천 메타데이터로 중복을 식별하며, 수집·관리 API·로컬 적재는 각각 검증한 독립 구성요소입니다.
period: "2026.06"
role: 개인 프로젝트 · CDC 관리 API·중복 처리·재처리 흐름 구현
stack:
  - Java
  - Spring Boot
  - PostgreSQL
  - Debezium
  - Kafka
  - Apache Iceberg
problem: Debezium이 재시작되거나 같은 변경을 다시 보내면 이벤트가 중복됩니다. 원본 위치(LSN, 오프셋)를 잃어버리면 같은 변경인지 알 수 없고, 적재가 실패했을 때 무엇을 다시 돌려야 하는지도 모릅니다.
responsibilities:
  - PostgreSQL, Debezium, Kafka 실행 환경과 Spring Boot 관리 API를 만들었습니다.
  - 처리 이력 테이블로 중복을 막고, 재시도, DLQ, 재처리 요청과 커넥터 상태 확인 기능을 넣었습니다.
  - 수집, 상태 관리, 적재를 따로 만들고, 어디까지 연결했는지 문서에 구분해 적었습니다.
flow:
  normal:
    - A · 변경 수집, PostgreSQL → Debezium → Kafka
    - B · 상태 관리, 원본 이벤트 → 표준 이벤트와 처리 이력
    - C · 로컬 적재, 표준 이벤트 → 파일 저장과 조회
  failure:
    - 같은 오프셋이 두 번 들어옴
    - 적재 실패
    - 같은 변경의 재전달
  recovery:
    - 처리 이력으로 중복 확인
    - 재시도와 DLQ 분리
    - 재처리 요청과 상태 기록
signals:
  - label: 변경 수집
    expression: INSERT, UPDATE, DELETE
    result: 변경 종류, LSN, 오프셋이 그대로 남음
    tone: success
    source: tools/runner/cdc-smoke applicant-change-capture
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/tools/runner/cdc-smoke
  - label: 중복 처리 방지
    expression: 같은 변경 2번
    result: 처리 이력 1건, 두 번째는 건너뜀
    tone: warning
    source: CdcEventLedgerRepositoryTest.insertIfAbsentReturnsFalseForDuplicateSourceEvent
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/test/java/com/example/cdcplatform/ledger/CdcEventLedgerRepositoryTest.java
  - label: 실패 재처리
    expression: 적재 실패 후 재처리
    result: 원본 위치 유지, 처리 이력은 1건
    tone: danger
    source: SinkFailureReplayFlowTest.sinkFailureReplayFlowKeepsSourceMetadataIdempotency
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java
decisions:
  - title: 이벤트 ID는 원본 위치로
    choice: 수집기·스키마·테이블·기본 키·LSN·변경 종류를 해시해 이벤트 ID를 만들고, 원천 오프셋은 별도로 보존합니다.
    alternative: 소비자가 UUID를 새로 만들기
    reason: UUID를 새로 만들면 같은 변경이 다시 왔을 때 알아볼 방법이 없습니다.
  - title: 실패한 이벤트는 따로
    choice: 원본, 표준 이벤트, 재시도, DLQ, 재처리 토픽을 나눴습니다.
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
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/main/java/com/example/cdcplatform/event/CanonicalIngestService.java
    excerpt: |
      DebeziumEnvelope envelope = DebeziumEnvelope.parse(rawEnvelopeJson);
      CanonicalCdcEvent event = CanonicalCdcEvent.fromEnvelope(envelope);
      String sourceOffsetJson = sourceOffsetJson(envelope);
      boolean created = canonicalEventPublisher.recordCanonicalEvent(event, sourceOffsetJson);
    proves: 원천 LSN·오프셋을 표준 이벤트와 함께 넘기고 저장소의 등록 결과로 중복 응답을 구분합니다. 연결 단위 테스트는 발행기 대역을 사용합니다.
    testName: CanonicalIngestServiceTest.duplicateRawEnvelopeDoesNotIncreaseCanonicalEventCount
    testPath: backend/src/test/java/com/example/cdcplatform/event/CanonicalIngestServiceTest.java
    testUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/test/java/com/example/cdcplatform/event/CanonicalIngestServiceTest.java
  - symbol: ReplayRequestService.requestReplay
    displayPath: backend/src/main/java/com/example/cdcplatform/replay/ReplayRequestService.java
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/main/java/com/example/cdcplatform/replay/ReplayRequestService.java
    excerpt: |
      DlqEvent dlqEvent = dlqEventRepository.findById(dlqEventId)
          .orElseThrow(() -> new IllegalArgumentException("DLQ event not found: " + dlqEventId));
      String requestId = "replay_" + UUID.randomUUID();
    proves: DLQ에 실제로 있는 이벤트만 재처리 대상이 되고, 요청마다 추적용 ID를 붙입니다.
    testName: ReplayRequestServiceTest.createsReplayRequestAndMarksDlqEventForReplay
    testPath: backend/src/test/java/com/example/cdcplatform/replay/ReplayRequestServiceTest.java
    testUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/test/java/com/example/cdcplatform/replay/ReplayRequestServiceTest.java
  - symbol: RetryEventService.scheduleRetry
    displayPath: backend/src/main/java/com/example/cdcplatform/retry/RetryEventService.java
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/main/java/com/example/cdcplatform/retry/RetryEventService.java
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
    proves: 재시도할 때도 원본 테이블, 기본 키, LSN을 그대로 들고 가고, 같은 이벤트는 한 번만 등록합니다.
    testName: SinkFailureReplayFlowTest.sinkFailureReplayFlowKeepsSourceMetadataIdempotency
    testPath: backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java
    testUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java
verification:
  - layer: container-smoke
    method: PostgreSQL Testcontainers에서 같은 원천 이벤트를 처리 이력 저장소에 두 번 등록합니다.
    result: 첫 등록은 성공하고 두 번째는 거절되며 DB 행은 1건입니다.
  - layer: container-smoke
    method: PostgreSQL에서 INSERT, UPDATE, DELETE를 하고 Kafka raw 토픽에 들어오는지 봅니다.
    result: 변경 종류, LSN, 오프셋이 그대로 들어옵니다. 관리 API나 적재까지 이어진 결과는 아닙니다.
  - layer: integration
    method: 적재에 실패한 이벤트를 DLQ에 넣고 재처리를 요청합니다.
    result: 원본 위치가 유지된 채 다시 발행되고, 처리 이력은 1건 그대로입니다.
limitations:
  - Debezium 실행 환경, 관리 API, 적재는 각각 따로 동작하고 아직 하나로 이어지지 않았습니다.
  - 적재는 테스트 데이터로만 확인했고, S3, Athena, Trino 같은 실제 환경과 대용량 데이터는 해 보지 않았습니다.
next:
  - 세 부분을 이어서 처음부터 끝까지 흘려 보고, 재처리에 얼마나 걸리는지 재 보려고 합니다.
links:
  github: https://github.com/cyson21/cdc-data-platform
  design: https://github.com/cyson21/cdc-data-platform/blob/main/docs/portfolio/one-pager.md
  testReport: https://github.com/cyson21/cdc-data-platform/tree/main/tools/tests
visual:
  kind: diagram
  alt: PostgreSQL 변경 수집, 처리 이력, 로컬 적재를 나눠 그린 CDC 구성도
seo:
  title: CDC Data Platform · 중복 없는 변경 이벤트 적재
  description: DB 변경의 원본 위치를 남겨 중복 반영을 막고, 적재 실패를 추적해서 다시 돌릴 수 있게 만든 CDC 프로토타입입니다.
updatedAt: 2026-10-01
---
같은 DB 변경이 두 번 와도 한 번만 반영되고, 실패하면 어디서부터 다시 돌릴지 알 수 있게 만든 CDC 프로토타입입니다.
