---
order: 5
featured: false
publicationState: public
name: CDC Data Platform
domain: Data
eyebrow: CDC 데이터 파이프라인
summary: 데이터 변경을 중복 없이 처리하고 실패 이벤트를 추적·재처리할 수 있도록 CDC 실행 환경, 제어 API와 로컬 적재 경로를 구현하고 각 검증 범위를 구분했습니다.
period: "2026.06"
role: 개인 프로젝트 · 표준 이벤트 변환·멱등 처리 장부·재처리 API, 품질 확인과 CDC·레이크하우스 테스트 도구 직접 설계·구현
stack:
  - Java
  - Spring Boot
  - PostgreSQL
  - Debezium
  - Kafka
  - Apache Iceberg
problem: 원천 DB 변경의 LSN, 오프셋과 이벤트 ID를 잃으면 중복 재처리를 구분할 수 없고 적재 실패 뒤 어떤 마트 행이 어느 변경에서 왔는지 추적하기 어렵습니다.
responsibilities:
  - 원천 PostgreSQL 스키마, Debezium·Kafka 실행 환경과 Spring Boot CDC 제어 API를 설계했습니다.
  - 멱등 처리 장부, 재시도·DLQ·재처리와 커넥터 상태·지연·품질 기준을 구현했습니다.
  - Docker CDC, Spring 제어 API, 로컬 객체·Parquet·마트와 Iceberg 명령 경계를 서로 독립적으로 확인하는 실행 도구를 구성했습니다.
flow:
  normal:
    - "A · Docker CDC: PostgreSQL → Debezium → Kafka 원본"
    - "B · 제어 API: 고정 입력 → 표준 이벤트 장부"
    - "C · 로컬 레이크하우스: 독립 고정 입력 → 객체·Iceberg·마트"
  failure:
    - 동일 오프셋 중복 수신
    - 적재 처리 실패
    - 데이터 계보 연결 불완전
  recovery:
    - 멱등 처리 장부
    - 재시도·DLQ 분리
    - 재처리 요청·데이터 계보 리포트
signals:
  - label: 중복 억제
    expression: 원본 7건 → 6건 반영
    result: 중복 1건 억제
    tone: success
    source: test_lakehouse_smoke.py::test_multi_table_cdc_lineage_writes_joined_rows_with_source_metadata
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/tools/tests/test_lakehouse_smoke.py
  - label: 원천 데이터 범위
    expression: 원천 테이블 4개
    result: 지원자 · 공고 · 평가 · 에이전트 작업
    tone: warning
    source: test_lakehouse_smoke.py::test_multi_table_cdc_lineage_writes_joined_rows_with_source_metadata
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/tools/tests/test_lakehouse_smoke.py
  - label: 데이터 계보
    expression: 2행 중 계보 완성 1행
    result: 미완성 경로 분리 보고
    tone: danger
    source: test_lakehouse_smoke.py::test_mart_lineage_validation_materializes_expected_rows_and_sql_refs
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/tools/tests/test_lakehouse_smoke.py
decisions:
  - title: 원천 메타데이터 기반 이벤트 ID
    choice: LSN과 원천 오프셋을 이벤트 ID, 재처리와 계보 추적의 기준으로 보존합니다.
    alternative: 소비자가 임의 UUID를 생성
    reason: 재전달된 같은 변경을 식별하고 원천부터 마트까지 동일한 변경 키를 추적하기 위해 선택했습니다.
  - title: 실패 경로 분리
    choice: 원본, 표준 이벤트, 재시도, DLQ와 재처리 흐름을 분리합니다.
    alternative: 실패 이벤트를 원래 토픽으로 즉시 되돌림
    reason: 반복 실패가 정상 소비를 오염시키지 않고 운영자가 재처리 범위를 선택할 수 있도록 했습니다.
  - title: 로컬 우선 검증
    choice: 객체·Parquet·마트 고정 입력과 Iceberg 명령 경계를 로컬에서 각각 검증합니다.
    alternative: AWS 실행 결과만 검증 기준으로 사용
    reason: 클라우드 자격과 비용 없이도 저장 형식과 데이터 계보 규칙을 재현하기 위해 선택했습니다.
protectionRules:
  - 같은 원천 오프셋의 변경 이벤트는 표준 이벤트 결과를 두 번 증가시키지 않습니다.
  - DLQ에 존재하지 않는 이벤트는 재처리 요청을 만들 수 없습니다.
  - 검증은 로컬 고정 입력에서 수행했으며 AWS 실행은 포함하지 않았습니다.
  - CDC 실행 환경, 제어 API와 레이크하우스는 독립 검증 상태이며 종단 연결은 구현하지 않았습니다.
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
  - symbol: IcebergJavaEngine.append
    displayPath: tools/iceberg-engine/src/main/java/com/example/cdcplatform/tools/IcebergJavaEngine.java
    sourceUrl: https://github.com/cyson21/cdc-data-platform/blob/main/tools/iceberg-engine/src/main/java/com/example/cdcplatform/tools/IcebergJavaEngine.java
    excerpt: |
      DataFile dataFile = writer.toDataFile();
      table.newAppend().appendFile(dataFile).commit();
      table.refresh();
      Snapshot snapshot = table.currentSnapshot();
    proves: Java 엔진은 Parquet 데이터 파일을 Iceberg에 추가하도록 구성했습니다. 연결된 스모크 테스트는 대체 실행 파일로 명령 인자와 데이터 파일 생성 경계만 확인하며 실제 Iceberg 커밋은 검증하지 않습니다.
    testName: LakehouseSmokeTest.test_iceberg_engine_append_passes_insert_sql_and_writes_data_file
    testPath: tools/tests/test_lakehouse_smoke.py
    testUrl: https://github.com/cyson21/cdc-data-platform/blob/main/tools/tests/test_lakehouse_smoke.py
verification:
  - layer: integration
    method: 중복 오프셋을 포함한 원본 이벤트 7건의 고정 입력을 표준 이벤트 처리 경로에 전달합니다.
    result: 6건만 적용되고 중복 1건이 억제됩니다.
  - layer: container-smoke
    method: PostgreSQL의 applicant create·update·delete를 Debezium·Kafka raw topic에서 확인합니다.
    result: Docker CDC 실행 환경에서 연산 종류, 원천 LSN과 오프셋을 관찰하며 제어 API나 레이크하우스 전달은 이 결과에 포함하지 않습니다.
  - layer: static-demo
    method: 원천 테이블 4개의 독립 고정 입력과 로컬 마트 계보 검증을 실행합니다.
    result: 원본 7건 중 중복 1건을 억제하고 계보 2행을 완성 1행과 미완성 1행으로 분리합니다.
limitations:
  - Docker CDC 실행 환경, Spring 제어 API와 레이크하우스 저장 경로는 독립 검증 단계이며 하나의 종단 시스템으로 연결되어 있지 않습니다.
  - 기본 감사는 고정 입력과 로컬 우선 경로이며 AWS S3·Athena·dbt-athena, Trino Compose 성공과 운영 규모 데이터는 포함하지 않았습니다.
next:
  - 현재 독립된 CDC 실행 환경, 제어 API와 레이크하우스를 연결한 뒤 종단 전달과 재처리 지연을 별도 시나리오로 검증합니다.
links:
  github: https://github.com/cyson21/cdc-data-platform
  design: https://github.com/cyson21/cdc-data-platform/blob/main/docs/portfolio/one-pager.md
  testReport: https://github.com/cyson21/cdc-data-platform/tree/main/tools/tests
visual:
  kind: diagram
  alt: PostgreSQL 변경이 Debezium, Kafka, Canonical ingest와 Iceberg·mart lineage로 이어지는 데이터 흐름 구성도
seo:
  title: CDC Data Platform · 중복 처리 방지와 데이터 계보
  description: 원천 오프셋 보존, 재시도·DLQ·재처리, Iceberg 추가 코드와 마트 데이터 계보를 각각 테스트한 데이터 플랫폼 프로젝트입니다.
updatedAt: 2026-07-19
---

데이터 처리 성공 여부뿐 아니라 재처리와 source-to-mart 추적 가능성을 함께 검증한 CDC 프로젝트입니다.
