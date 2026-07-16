---
order: 1
featured: true
publicationState: public
name: StockRush
domain: Backend
eyebrow: 이벤트 기반 커머스
summary: 한정 재고 주문의 부분 실패와 중복 처리를 제어하고 주문·재고·결제·조회 모델의 최종 상태 수렴을 장애 시나리오로 검증했습니다.
period: "2026"
role: 개인 프로젝트 · 도메인 모델, 백엔드 서비스, 게이트웨이, 로컬 인프라와 검증 도구 직접 설계·구현
stack:
  - Java
  - Spring Boot
  - Kafka
  - PostgreSQL
  - Keycloak
  - Docker Compose
problem: 동시 주문, 결제 실패와 지연, Kafka 중단, 이벤트 재처리 상황에서는 주문 상태와 재고 수량, 결제 결과, 조회 모델이 서로 다른 속도로 바뀝니다.
responsibilities:
  - 게이트웨이, 상품, 재고, 주문, 결제, 프로모션, 출고와 조회 모델의 서비스 경계를 설계했습니다.
  - 주문 Saga, 서비스별 Outbox 발행기, 소비자 멱등 처리와 관리자 재처리 경로를 구현했습니다.
  - 게이트웨이 OIDC/JWT와 서비스 내부 고객 소유권 검사를 분리해 신뢰 경계를 고정했습니다.
flow:
  normal:
    - 게이트웨이 인증
    - 주문·Outbox 저장
    - Kafka 이벤트 발행
    - 재고·결제 처리
    - 조회 모델 갱신
  failure:
    - 동일 이벤트 중복 전달
    - Kafka 발행 실패
    - 취소 뒤 늦은 결제 승인
  recovery:
    - 처리 완료 이벤트 키로 중복 차단
    - 발행 재시도·FAILED 전이
    - SQL 종료 상태 조건
signals:
  - label: 멱등 소비
    expression: 동일 이벤트 2회 → Outbox 1건
    result: 중복 후속 이벤트 0건
    tone: success
    source: OrderSagaEventHandlerIntegrationTest.ignores_duplicate_inventory_event
    sourceUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
  - label: 종료 상태 보호
    expression: 늦은 승인 → 무시
    result: 취소 주문 상태 유지
    tone: warning
    source: OrderSagaEventHandlerIntegrationTest.ignores_payment_authorized_for_cancelled_order
    sourceUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
  - label: 발행 재시도
    expression: 5회 실패 → FAILED
    result: 실패 상태와 재처리 경로 보존
    tone: danger
    source: OutboxRelayServiceIntegrationTest.marks_failed_when_publish_retry_count_is_exhausted
    sourceUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java
decisions:
  - title: Saga 상태 조율
    choice: 주문 서비스가 재고·결제·쿠폰·출고 상태 전이를 조율합니다.
    alternative: 각 서비스가 다음 이벤트를 직접 연쇄 발행하는 분산 조율
    reason: 보상 순서와 최종 주문 상태를 한 경계에서 추적하고 운영자가 재처리할 위치를 명확히 하기 위해 선택했습니다.
  - title: 트랜잭션 Outbox
    choice: 업무 데이터와 Outbox 행을 같은 DB 트랜잭션에 저장합니다.
    alternative: DB 커밋 이후 애플리케이션에서 Kafka에 직접 발행
    reason: 커밋과 발행 사이의 실패를 기록으로 남기고 발행기가 재시도할 수 있도록 했습니다.
  - title: 이중 신뢰 경계
    choice: 게이트웨이 인증과 서비스 내부 리소스 소유권 검사를 분리합니다.
    alternative: 게이트웨이 검증 결과만 신뢰
    reason: 내부 우회 호출에서도 고객 리소스 경계를 보호하기 위해 서비스 계층 검사를 유지했습니다.
protectionRules:
  - 같은 멱등 키로 다시 요청하면 새 주문을 만들지 않고 기존 주문 결과로 수렴합니다.
  - 취소·확정 주문에는 늦게 도착한 이벤트가 추가 상태 전이를 만들 수 없습니다.
  - 재시도 예산을 소진한 Outbox 이벤트는 삭제하지 않고 FAILED 상태로 남깁니다.
codeEvidence:
  - symbol: PersistentCreateOrderService.create
    displayPath: services/order-service/src/main/java/com/stockrush/order/application/PersistentCreateOrderService.java
    sourceUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/main/java/com/stockrush/order/application/PersistentCreateOrderService.java
    excerpt: |
      boolean saved = orderRepository.saveIfAbsent(result.order(), command.idempotencyKey());
      if (!saved) {
          return CreateOrderResult.replayed(
              replayOrder(command.idempotencyKey(), command.memberId())
          );
      }
      outboxEventRepository.save(result.outboxEvent());
    proves: 주문 저장과 Outbox 기록을 같은 트랜잭션에 두고 멱등 충돌은 기존 주문 재조회로 수렴시킵니다.
    testName: PersistentCreateOrderServiceIntegrationTest.persists_order_items_and_pending_outbox_event_together
    testPath: services/order-service/src/test/java/com/stockrush/order/infra/persistence/PersistentCreateOrderServiceIntegrationTest.java
    testUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/infra/persistence/PersistentCreateOrderServiceIntegrationTest.java
  - symbol: OrderSagaEventHandler.transitionOrder
    displayPath: services/order-service/src/main/java/com/stockrush/order/application/OrderSagaEventHandler.java
    sourceUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/main/java/com/stockrush/order/application/OrderSagaEventHandler.java
    excerpt: |
      where order_id = :orderId
        and status not in ('CANCELLED', 'CONFIRMED')

      return updated == 1;
    proves: 종료 상태 주문의 추가 전이를 SQL에서 차단해 늦은 이벤트가 취소·확정 주문을 되살리지 못하게 합니다.
    testName: OrderSagaEventHandlerIntegrationTest.ignores_payment_authorized_for_cancelled_order
    testPath: services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
    testUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
  - symbol: OutboxRelayService.claimPending
    displayPath: services/order-service/src/main/java/com/stockrush/order/infra/outbox/OutboxRelayService.java
    sourceUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/main/java/com/stockrush/order/infra/outbox/OutboxRelayService.java
    excerpt: |
      where status = 'PENDING'
        and (next_retry_at is null or next_retry_at <= now())
      order by created_at, id
      limit :batchSize
      for update skip locked
    proves: 재시도 가능 이벤트만 잠금 선점해 여러 발행기의 중복 발행을 피하고 소진 실패를 FAILED로 남깁니다.
    testName: OutboxRelayServiceIntegrationTest.marks_failed_when_publish_retry_count_is_exhausted
    testPath: services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java
    testUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java
verification:
  - layer: integration
    method: PostgreSQL 통합 테스트에서 동일 이벤트를 2회 처리합니다.
    result: Outbox가 1건만 남고 중복 후속 이벤트가 생성되지 않습니다.
  - layer: integration
    method: 취소 완료 뒤 결제 승인 이벤트를 늦게 전달합니다.
    result: SQL 종료 상태 guard가 주문 상태 변경을 거절합니다.
  - layer: integration
    method: PostgreSQL 통합 테스트에서 실패하는 발행기를 주입해 Outbox 발행 재시도 횟수를 소진합니다.
    result: 다섯 번째 실패 뒤 이벤트가 FAILED로 전이됩니다.
limitations:
  - 실결제, 다중 리전, 운영 규모 부하와 장시간 브로커 장애는 포함하지 않았습니다.
next:
  - 서비스별 OpenTelemetry trace와 장시간 브로커 장애 복구 시간을 측정합니다.
links:
  github: https://github.com/cyson21/stockrush
  adr: https://github.com/cyson21/stockrush/tree/main/docs/adr
  testReport: https://github.com/cyson21/stockrush/blob/main/docs/test-strategy.md
visual:
  kind: image
  src: /media/stockrush-architecture.png
  alt: Gateway에서 주문 Saga, 서비스별 Outbox와 Kafka, 조회 모델로 이어지는 StockRush 구성도
seo:
  title: StockRush · 이벤트 기반 주문 상태 수렴
  description: Saga, Transactional Outbox, 멱등 소비자와 종료 상태 guard로 부분 실패 뒤 주문 상태 수렴을 검증한 Java 백엔드 프로젝트입니다.
updatedAt: 2026-07-15
---

정상 주문보다 부분 실패 이후의 상태 수렴을 중심으로 설계한 이벤트 기반 커머스 프로젝트입니다.
