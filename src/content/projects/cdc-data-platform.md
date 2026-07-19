---
order: 5
featured: false
publicationState: public
name: CDC Data Platform
domain: Data
eyebrow: CDC 데이터 파이프라인
summary: 재전달된 DB 변경을 같은 이벤트로 식별하고, 적재 실패 뒤에도 원천 위치와 처리 상태를 추적할 수 있도록 설계했습니다. 처리 장부와 재처리 경로를 구현했습니다.
period: "2026.06"
role: 개인 프로젝트 · Debezium·Kafka 변경 수집, 표준 이벤트 변환, 처리 장부와 실패·재처리 API 직접 설계·구현
stack:
  - Java
  - Spring Boot
  - PostgreSQL
  - Debezium
  - Kafka
  - Apache Iceberg
problem: DB 변경은 수집기 재시작이나 재전달로 중복될 수 있습니다. 원천 위치를 잃으면 같은 변경인지 판단할 수 없고, 적재 실패 뒤 어떤 이벤트를 다시 처리해야 하는지도 추적하기 어렵습니다.
responsibilities:
  - 원천 PostgreSQL 스키마, Debezium·Kafka 실행 환경과 Spring Boot CDC 제어 API를 설계했습니다.
  - 멱등 처리 장부, 재시도·DLQ·재처리와 커넥터 상태·지연·품질 기준을 구현했습니다.
  - 변경 수집, 상태 제어와 로컬 적재를 독립된 범위로 구현해 연결된 구간과 아직 연결하지 않은 구간을 구분했습니다.
flow:
  normal:
    - "A · 변경 수집: PostgreSQL → Debezium → Kafka"
    - "B · 상태 제어: 원천 이벤트 → 표준 이벤트·처리 장부"
    - "C · 로컬 적재: 표준 이벤트 → 객체 저장·조회 데이터"
  failure:
    - 동일 오프셋 중복 수신
    - 적재 처리 실패
    - 같은 변경의 재전달
  recovery:
    - 멱등 처리 장부
    - 재시도·DLQ 분리
    - 재처리 요청과 상태 기록
signals:
  - label: 변경 수집
    expression: 생성·수정·삭제 3종
    result: 변경 종류·LSN·오프셋 보존
    tone: success
    source: tools/runner/cdc-smoke applicant-change-capture
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/tools/runner/cdc-smoke
  - label: 중복 처리 방지
    expression: 같은 변경 2회 → 장부 1건
    result: 두 번째 반영 차단
    tone: warning
    source: CanonicalIngestServiceTest.duplicateRawEnvelopeDoesNotIncreaseCanonicalEventCount
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/test/java/com/example/cdcplatform/event/CanonicalIngestServiceTest.java
  - label: 실패 재처리
    expression: 적재 실패 → 재처리 요청·재발행
    result: 원천 위치 보존 · 처리 장부 1건 유지
    tone: danger
    source: SinkFailureReplayFlowTest.sinkFailureReplayFlowKeepsSourceMetadataIdempotency
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java
decisions:
  - title: 원천 메타데이터 기반 이벤트 ID
    choice: LSN과 원천 오프셋을 이벤트 ID, 재처리와 계보 추적의 기준으로 보존합니다.
    alternative: 소비자가 임의 UUID를 생성
    reason: 재전달된 같은 변경을 식별하고 원천부터 마트까지 동일한 변경 키를 추적하기 위해 선택했습니다.
  - title: 실패 경로 분리
    choice: 원본, 표준 이벤트, 재시도, DLQ와 재처리 흐름을 분리합니다.
    alternative: 실패 이벤트를 원래 토픽으로 즉시 되돌림
    reason: 반복 실패가 정상 소비를 오염시키지 않고 운영자가 재처리 범위를 선택할 수 있도록 했습니다.
  - title: 구현 범위 분리
    choice: 변경 수집, 상태 제어와 로컬 적재의 실행 범위를 나누고 연결 여부를 명시합니다.
    alternative: 고정 입력으로 이어 붙인 결과를 하나의 종단 파이프라인으로 설명
    reason: 실제로 연결해 확인한 구간과 독립적으로 구현한 구간을 구분해 결과를 과장하지 않기 위해 선택했습니다.
protectionRules:
  - 같은 원천 오프셋의 변경 이벤트는 표준 이벤트 결과를 두 번 증가시키지 않습니다.
  - DLQ에 존재하지 않는 이벤트는 재처리 요청을 만들 수 없습니다.
  - 로컬 적재는 고정 입력으로 확인했으며 AWS 실행은 포함하지 않았습니다.
  - 변경 수집, 상태 제어와 로컬 적재는 독립 구현 상태이며 종단 연결은 구현하지 않았습니다.
codeEvidence:
  - symbol: CanonicalIngestService.ingestRawEnvelope
    displayPath: backend/src/main/java/com/example/cdcplatform/event/CanonicalIngestService.java
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/main/java/com/example/cdcplatform/event/CanonicalIngestService.java
    excerpt: |
      DebeziumEnvelope envelope = DebeziumEnvelope.parse(rawEnvelopeJson);
      CanonicalCdcEvent event = CanonicalCdcEvent.fromEnvelope(envelope);
      String sourceOffsetJson = sourceOffsetJson(envelope);
      boolean created = canonicalEventPublisher.recordCanonicalEvent(event, sourceOffsetJson);
    proves: Debezium 원본을 표준 이벤트로 정규화하면서 원천 오프셋을 보존하고 처리 장부 결과로 중복을 판정합니다.
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
    proves: 존재하는 DLQ 이벤트만 재처리 대상으로 허용하고 요청 추적용 고유 ID를 생성합니다.
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
    proves: 재시도 이벤트에도 원천 테이블·기본 키·LSN을 보존하고 같은 이벤트는 한 번만 등록합니다.
    testName: SinkFailureReplayFlowTest.sinkFailureReplayFlowKeepsSourceMetadataIdempotency
    testPath: backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java
    testUrl: https://github.com/cyson21/cdc-data-platform/blob/main/backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java
verification:
  - layer: integration
    method: 중복 오프셋을 포함한 원본 이벤트 7건의 고정 입력을 표준 이벤트 처리 경로에 전달합니다.
    result: 6건만 적용되고 중복 1건이 억제됩니다.
  - layer: container-smoke
    method: PostgreSQL의 applicant create·update·delete를 Debezium·Kafka raw topic에서 확인합니다.
    result: Docker CDC 실행 환경에서 연산 종류, 원천 LSN과 오프셋을 관찰하며 제어 API나 레이크하우스 전달은 이 결과에 포함하지 않습니다.
  - layer: integration
    method: 적재 실패 이벤트를 DLQ에 기록한 뒤 재처리 요청과 재발행을 실행합니다.
    result: 원천 위치를 보존한 채 재처리·재발행 상태가 남고 처리 장부는 한 건으로 유지됩니다.
limitations:
  - Docker CDC 실행 환경, Spring 제어 API와 로컬 적재 경로는 독립 구현 범위이며 하나의 종단 시스템으로 연결되어 있지 않습니다.
  - 로컬 적재는 고정 입력을 사용하며 AWS S3·Athena·dbt-athena, Trino Compose 실행과 운영 규모 데이터는 포함하지 않았습니다.
next:
  - 현재 독립된 CDC 실행 환경, 제어 API와 레이크하우스를 연결한 뒤 종단 전달과 재처리 지연을 별도 시나리오로 검증합니다.
links:
  github: https://github.com/cyson21/cdc-data-platform
  design: https://github.com/cyson21/cdc-data-platform/blob/main/docs/portfolio/one-pager.md
  testReport: https://github.com/cyson21/cdc-data-platform/tree/main/tools/tests
visual:
  kind: diagram
  alt: PostgreSQL 변경 수집, 표준 이벤트 처리 장부와 로컬 적재 범위를 구분한 CDC 구성도
seo:
  title: CDC Data Platform · 중복 처리 방지와 데이터 계보
  description: DB 변경의 원천 위치를 보존하고 중복 반영을 막으며 적재 실패를 추적·재처리할 수 있게 구현한 CDC 데이터 플랫폼 프로젝트입니다.
updatedAt: 2026-07-19
---

중복될 수 있는 DB 변경을 식별하고 적재 실패 뒤 재처리 상태를 추적할 수 있게 구현한 CDC 프로젝트입니다.
