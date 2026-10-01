---
order: 1
featured: true
publicationState: public
name: StockRush
domain: Backend
eyebrow: 이벤트 기반 커머스
summary: 주문·재고·결제를 분리한 커머스 백엔드입니다. Saga와 Transactional Outbox로 결제 실패 시 보상 처리, 중복 이벤트 처리 방지, 발행 실패 후 재처리 흐름을 구현했습니다.
cardEvidence:
  implementation: 주문과 이벤트를 같은 DB 트랜잭션에 저장하고, 주문 서비스가 Saga 상태 전이와 보상 처리를 조정합니다.
  result: PostgreSQL 통합 테스트에서 중복 이벤트의 후속 Outbox 1건과 취소 후 늦은 결제 승인 무시를 확인했습니다.
period: "2026"
role: 개인 프로젝트 · 백엔드 설계·구현·테스트
stack:
  - Java
  - Spring Boot
  - Kafka
  - PostgreSQL
  - Keycloak
  - Docker Compose
problem: 주문 저장, 재고 예약, 결제 승인과 이벤트 발행은 서비스 경계 때문에 하나의 DB 트랜잭션으로 처리할 수 없습니다. 부분 실패와 이벤트 재전달에 대비해 상태 전이, 보상 처리와 재발행을 구분해야 합니다.
responsibilities:
  - 게이트웨이와 도메인별 서비스를 분리하고 서비스별 PostgreSQL 스키마를 구성했습니다.
  - 주문 Saga, 서비스별 Outbox 발행기와 발행 실패 이벤트의 관리자 재처리 API를 구현했습니다.
  - 게이트웨이의 OIDC/JWT 인증과 서비스의 리소스 소유권 검사를 분리했습니다.
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
    - 처리한 이벤트 ID를 기록해 두 번째는 건너뜀
    - 5번까지 재시도, 그래도 안 되면 FAILED로 보관
    - 이미 끝난 주문은 UPDATE 조건에서 제외
signals:
  - label: 중복 처리 방지
    expression: 같은 재고 이벤트를 2번 보냄
    result: 다음 단계 이벤트는 1건만 생김
    tone: success
    source: OrderSagaEventHandlerIntegrationTest.ignores_duplicate_inventory_event
    sourceUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
  - label: 취소 주문 유지
    expression: 취소 뒤 결제 승인 도착
    result: 주문은 그대로 취소 상태
    tone: warning
    source: OrderSagaEventHandlerIntegrationTest.ignores_payment_authorized_for_cancelled_order
    sourceUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
  - label: 발행 재시도
    expression: 발행 5번 연속 실패
    result: 지우지 않고 FAILED로 남겨 다시 보낼 수 있음
    tone: danger
    source: OutboxRelayServiceIntegrationTest.marks_failed_when_publish_retry_count_is_exhausted
    sourceUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java
decisions:
  - title: 주문 서비스가 흐름을 지휘
    choice: 재고, 결제, 쿠폰, 출고의 다음 단계는 주문 서비스가 정합니다.
    alternative: 각 서비스가 이벤트를 받아 다음 서비스로 알아서 넘기는 방식
    reason: 다음 단계와 보상 순서를 주문 서비스에 모아 상태 전이를 추적하기 위한 선택입니다. 각 서비스의 처리 결과와 Outbox 상태도 함께 확인해야 합니다.
  - title: 이벤트는 DB에 먼저 기록
    choice: 주문을 저장할 때 보낼 이벤트도 같은 트랜잭션으로 Outbox 테이블에 넣습니다.
    alternative: 커밋한 다음 코드에서 바로 Kafka로 보내기
    reason: DB 커밋과 Kafka 발행 사이에 실패하더라도 발행할 이벤트가 DB에 남아 재시도할 수 있습니다.
  - title: 권한 확인은 두 번
    choice: 게이트웨이에서 로그인을 확인하고, 서비스에서 주문 주인을 다시 확인합니다.
    alternative: 게이트웨이를 통과했으면 믿기
    reason: 게이트웨이를 거치지 않는 내부 호출이 생기면 남의 주문도 조회할 수 있게 됩니다.
protectionRules:
  - 같은 멱등 키로 주문을 다시 보내면 새로 만들지 않고 처음 만든 주문을 돌려줍니다.
  - 취소되거나 확정된 주문은 뒤늦게 온 이벤트로 상태가 바뀌지 않습니다.
  - 끝내 발행하지 못한 이벤트도 지우지 않고 FAILED로 남겨 둡니다.
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
    proves: 주문과 Outbox를 한 트랜잭션에 저장합니다. 같은 멱등 키가 이미 있으면 저장하지 않고 기존 주문을 찾아 돌려줍니다.
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
    proves: WHERE 조건에서 취소, 확정 주문을 빼 두었기 때문에 늦게 온 이벤트는 0건 업데이트로 끝납니다.
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
    proves: SKIP LOCKED로 잠긴 행을 건너뛰고 선택한 이벤트를 PUBLISHING으로 전환합니다. 연결 테스트는 재시도 한도 초과 후 FAILED 전환을 확인합니다.
    testName: OutboxRelayServiceIntegrationTest.marks_failed_when_publish_retry_count_is_exhausted
    testPath: services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java
    testUrl: https://github.com/cyson21/stockrush/blob/main/services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java
verification:
  - layer: integration
    method: PostgreSQL 통합 테스트에서 같은 이벤트를 두 번 처리합니다.
    result: Outbox에는 1건만 남습니다.
  - layer: integration
    method: 주문을 취소한 다음 결제 승인 이벤트를 보냅니다.
    result: 업데이트가 0건이라 주문은 취소 상태 그대로입니다.
  - layer: integration
    method: 항상 실패하는 발행기를 넣고 재시도를 끝까지 돌립니다.
    result: 다섯 번째 실패 뒤 FAILED로 바뀝니다.
limitations:
  - 결제·출고는 내부 시뮬레이션입니다. 실제 PG·물류 연동과 운영 규모의 처리량·지연 시간은 검증하지 않았습니다.
  - Kafka 중단·재개는 로컬 단일 브로커 시나리오 범위이며, 장기 장애와 발행기 고가용성은 검증하지 않았습니다.
next:
  - OpenTelemetry로 주문 하나가 서비스를 거치는 경로를 추적하고, Kafka가 오래 멈췄다가 살아났을 때 복구에 얼마나 걸리는지 재 보려고 합니다.
links:
  github: https://github.com/cyson21/stockrush
  adr: https://github.com/cyson21/stockrush/tree/main/docs/adr
  testReport: https://github.com/cyson21/stockrush/blob/main/docs/test-strategy.md
visual:
  kind: image
  src: /media/stockrush-architecture.png
  alt: Gateway에서 주문 Saga, 서비스별 Outbox와 Kafka, 조회 모델로 이어지는 StockRush 구성도
seo:
  title: StockRush · 주문 상태 전이와 이벤트 재처리
  description: Saga와 Transactional Outbox로 결제 실패, 중복 이벤트와 발행 실패의 복구 흐름을 구현한 Java·Spring Boot 개인 프로젝트입니다.
updatedAt: 2026-10-01
---

주문이 잘 되는 경우보다, 중간에 뭔가 실패했을 때 데이터가 어떻게 남는지를 더 많이 들여다본 프로젝트입니다.

취소한 주문에 결제 승인이 뒤늦게 오는 경우는 처음부터 막고 들어갔습니다. 실무에서 외부 콜백이 늦게 들어와 이미 취소된 데이터를 다시 바꿔 놓은 일을 겪은 적이 있어서입니다.
