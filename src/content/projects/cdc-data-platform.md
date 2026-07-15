---
order: 5
featured: false
publicationState: public
name: CDC Data Platform
domain: Data
eyebrow: Source-to-mart lineage
summary: Docker CDC runtime, Spring Boot control plane과 local lakehouse를 각각 검증해 source metadata, 중복 억제·재처리와 fixture 기반 lineage 근거를 분리했습니다.
period: "2026.06"
role: 개인 프로젝트 · canonical 변환·ledger·재처리 API, 품질 판단과 CDC·lakehouse 검증 도구 직접 설계·구현
stack:
  - Java
  - Spring Boot
  - PostgreSQL
  - Debezium
  - Kafka
  - Apache Iceberg
problem: Source DB 변경의 LSN, offset과 event ID를 잃으면 중복 replay를 구분할 수 없고 sink 실패 뒤 어떤 mart row가 어느 변경에서 왔는지 추적하기 어렵습니다.
responsibilities:
  - Source PostgreSQL schema, Debezium·Kafka runtime과 Spring Boot CDC 제어면을 설계했습니다.
  - Idempotency ledger, retry·DLQ·replay와 connector health·lag·quality SLA를 구현했습니다.
  - Docker CDC, Spring control plane, local object·Iceberg·mart를 서로 독립적으로 확인하는 runner를 구성했습니다.
flow:
  normal:
    - "A · Docker CDC: PostgreSQL → Debezium → Kafka raw"
    - "B · Control plane: envelope fixture → canonical ledger"
    - "C · Local lakehouse: independent fixture → object·Iceberg·mart"
  failure:
    - 동일 offset 중복 수신
    - Sink 처리 실패
    - Lineage 연결 불완전
  recovery:
    - Idempotency ledger
    - Retry·DLQ 분리
    - Replay request·Lineage report
signals:
  - label: 중복 억제 fixture
    expression: 7 raw → 6 applied
    result: duplicate 1 suppressed
    tone: success
    source: test_lakehouse_smoke.py::test_multi_table_cdc_lineage_writes_joined_rows_with_source_metadata
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/tools/tests/test_lakehouse_smoke.py
  - label: Source coverage
    expression: 4 source tables
    result: applicant · job · evaluation · agent task
    tone: warning
    source: test_lakehouse_smoke.py::test_multi_table_cdc_lineage_writes_joined_rows_with_source_metadata
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/tools/tests/test_lakehouse_smoke.py
  - label: Lineage fixture
    expression: 2 rows → complete 1
    result: incomplete 경로 분리 보고
    tone: danger
    source: test_lakehouse_smoke.py::test_mart_lineage_validation_materializes_expected_rows_and_sql_refs
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/tools/tests/test_lakehouse_smoke.py
decisions:
  - title: Metadata-derived event ID
    choice: LSN과 source offset을 event ID, replay와 lineage의 기준으로 보존합니다.
    alternative: Consumer가 임의 UUID를 생성
    reason: 재전달된 같은 변경을 식별하고 source부터 mart까지 동일한 변경 키를 추적하기 위해 선택했습니다.
  - title: Separate failure lanes
    choice: Raw, canonical, retry, DLQ와 replay 흐름을 분리합니다.
    alternative: 실패 이벤트를 원래 topic으로 즉시 되돌림
    reason: 반복 실패가 정상 소비를 오염시키지 않고 운영자가 재처리 범위를 선택할 수 있도록 했습니다.
  - title: Local-first proof
    choice: MinIO·Iceberg·Parquet·mart를 로컬 환경에서 반복 검증합니다.
    alternative: AWS 실행 결과만 검증 기준으로 사용
    reason: 클라우드 자격과 비용 없이도 저장 형식과 lineage 규칙을 재현하기 위해 선택했습니다.
protectionRules:
  - 같은 source offset의 변경 이벤트는 canonical 결과를 두 번 증가시키지 않습니다.
  - DLQ에 존재하지 않는 이벤트는 replay 요청을 만들 수 없습니다.
  - 로컬 fixture 검증을 AWS 실행 결과로 표현하지 않습니다.
  - Docker CDC, control plane과 lakehouse의 독립 검증을 단일 종단 실행 결과로 표현하지 않습니다.
codeEvidence:
  - symbol: CanonicalIngestService.ingestRawEnvelope
    displayPath: backend/src/main/java/com/example/cdcplatform/event/CanonicalIngestService.java
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/backend/src/main/java/com/example/cdcplatform/event/CanonicalIngestService.java
    excerpt: |
      DebeziumEnvelope envelope = DebeziumEnvelope.parse(rawEnvelopeJson);
      CanonicalCdcEvent event = CanonicalCdcEvent.fromEnvelope(envelope);
      String sourceOffsetJson = sourceOffsetJson(envelope);
      boolean created = canonicalEventPublisher.recordCanonicalEvent(event, sourceOffsetJson);
    proves: Debezium 원본을 표준 이벤트로 정규화하면서 source offset을 보존하고 ledger 결과로 중복을 판정합니다.
    testName: CanonicalIngestServiceTest.duplicateRawEnvelopeDoesNotIncreaseCanonicalEventCount
    testPath: backend/src/test/java/com/example/cdcplatform/event/CanonicalIngestServiceTest.java
    testUrl: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/backend/src/test/java/com/example/cdcplatform/event/CanonicalIngestServiceTest.java
  - symbol: ReplayRequestService.requestReplay
    displayPath: backend/src/main/java/com/example/cdcplatform/replay/ReplayRequestService.java
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/backend/src/main/java/com/example/cdcplatform/replay/ReplayRequestService.java
    excerpt: |
      DlqEvent dlqEvent = dlqEventRepository.findById(dlqEventId)
          .orElseThrow(() -> new IllegalArgumentException("DLQ event not found: " + dlqEventId));
      String requestId = "replay_" + UUID.randomUUID();
    proves: 존재하는 DLQ 이벤트만 replay 대상으로 허용하고 요청 추적용 고유 ID를 생성합니다.
    testName: ReplayRequestServiceTest.createsReplayRequestAndMarksDlqEventForReplay
    testPath: backend/src/test/java/com/example/cdcplatform/replay/ReplayRequestServiceTest.java
    testUrl: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/backend/src/test/java/com/example/cdcplatform/replay/ReplayRequestServiceTest.java
  - symbol: IcebergJavaEngine.append
    displayPath: tools/iceberg-engine/src/main/java/com/example/cdcplatform/tools/IcebergJavaEngine.java
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/tools/iceberg-engine/src/main/java/com/example/cdcplatform/tools/IcebergJavaEngine.java
    excerpt: |
      DataFile dataFile = writer.toDataFile();
      table.newAppend().appendFile(dataFile).commit();
      table.refresh();
      Snapshot snapshot = table.currentSnapshot();
    proves: Parquet data file을 Iceberg append로 commit하고 현재 snapshot을 다시 조회해 적재 이력을 남깁니다.
    testName: LakehouseSmokeTest.test_iceberg_engine_append_passes_insert_sql_and_writes_data_file
    testPath: tools/tests/test_lakehouse_smoke.py
    testUrl: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/tools/tests/test_lakehouse_smoke.py
verification:
  - layer: integration
    method: 중복 offset을 포함한 raw event 7건 fixture를 canonical ingest에 전달합니다.
    result: 6건만 적용되고 중복 1건이 억제됩니다.
  - layer: container-smoke
    method: PostgreSQL의 applicant create·update·delete를 Debezium·Kafka raw topic에서 확인합니다.
    result: Docker CDC runtime에서 operation, source LSN과 offset을 관찰하며 control plane이나 lakehouse 전달은 이 결과에 포함하지 않습니다.
  - layer: static-demo
    method: 4개 source table의 독립 lineage fixture와 local mart 검증을 실행합니다.
    result: Raw 7건 중 중복 1건을 억제하고 lineage 2개 row를 complete 1개와 incomplete 1개로 분리합니다.
limitations:
  - Docker CDC runtime, Spring control plane과 lakehouse 저장 경로는 독립 검증 단계이며 하나의 종단 시스템으로 연결되어 있지 않습니다.
  - 기본 audit는 fixture와 local-first 경로이며 AWS S3·Athena·dbt-athena, Trino Compose 성공과 운영 규모 데이터는 포함하지 않았습니다.
next:
  - 현재 독립된 CDC runtime, control plane과 lakehouse를 연결한 뒤 종단 전달과 replay 지연을 별도 시나리오로 검증합니다.
links:
  github: https://github.com/cyson21/cdc-data-platform
  design: https://github.com/cyson21/cdc-data-platform/blob/feature/cdc-completion-gate/docs/portfolio/one-pager.md
  testReport: https://github.com/cyson21/cdc-data-platform/tree/feature/cdc-completion-gate/tools/tests
visual:
  kind: diagram
  alt: PostgreSQL 변경이 Debezium, Kafka, Canonical ingest와 Iceberg·mart lineage로 이어지는 데이터 흐름 구성도
seo:
  title: CDC Data Platform · 중복 억제와 Lineage
  description: Source offset을 보존하고 retry, DLQ, replay를 거쳐 Iceberg와 mart까지 lineage를 검증한 데이터 플랫폼 프로젝트입니다.
updatedAt: 2026-07-15
---

데이터 처리 성공 여부뿐 아니라 재처리와 source-to-mart 추적 가능성을 함께 검증한 CDC 프로젝트입니다.
