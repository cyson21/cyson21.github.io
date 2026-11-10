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
  result: 핸들러 직접 호출·PostgreSQL 통합 테스트에서 중복 이벤트의 Outbox 1건과 취소 뒤 결제 승인 무시를 확인했습니다.
period: '2026'
role: 개인 프로젝트 · 백엔드 설계·구현·테스트
stack:
  - Java
  - Spring Boot
  - Kafka
  - PostgreSQL
  - Keycloak
  - Docker Compose
problem: >-
  주문 저장, 재고 예약, 결제 승인과 이벤트 발행은 서비스 경계 때문에 하나의 DB 트랜잭션으로 처리할 수 없습니다. 부분 실패와 이벤트 재전달에 대비해 상태 전이, 보상 처리와 재발행을 구분해야
  합니다.
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
    expression: 같은 재고 이벤트를 핸들러에 2회 전달
    result: 다음 단계 이벤트는 1건만 생김
    tone: success
    source: OrderSagaEventHandlerIntegrationTest.ignores_duplicate_inventory_event
    sourceUrl: >-
      https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
  - label: 취소 주문 유지
    expression: 취소 뒤 결제 승인 도착
    result: 주문은 그대로 취소 상태
    tone: warning
    source: OrderSagaEventHandlerIntegrationTest.ignores_payment_authorized_for_cancelled_order
    sourceUrl: >-
      https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
  - label: 발행 재시도
    expression: 재시도 4/5 상태에서 발행기 대역 실패 1회
    result: retry_count 5, FAILED 상태와 오류 기록 보존
    tone: danger
    source: OutboxRelayServiceIntegrationTest.marks_failed_when_publish_retry_count_is_exhausted
    sourceUrl: >-
      https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java
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
  - 같은 회원·멱등 키의 주문 재요청은 기존 주문을 반환하도록 구현했습니다.
  - 취소되거나 확정된 주문은 뒤늦게 온 이벤트로 상태가 바뀌지 않습니다.
  - 끝내 발행하지 못한 이벤트도 지우지 않고 FAILED로 남겨 둡니다.
codeEvidence:
  - symbol: PersistentCreateOrderService.create
    displayPath: services/order-service/src/main/java/com/stockrush/order/application/PersistentCreateOrderService.java
    sourceUrl: >-
      https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/main/java/com/stockrush/order/application/PersistentCreateOrderService.java
    excerpt: |
      boolean saved = orderRepository.saveIfAbsent(result.order(), command.idempotencyKey());
      if (!saved) {
          return CreateOrderResult.replayed(
              replayOrder(command.idempotencyKey(), command.memberId())
          );
      }
      outboxEventRepository.save(result.outboxEvent());
    proves: 같은 회원·멱등 키의 요청을 재사용하는 분기입니다. 연결 테스트는 같은 요청을 두 번 실행해 동일 주문 반환과 주문·항목·Outbox가 각 1행인지 확인합니다.
    testName: PersistentCreateOrderServiceIntegrationTest.replays_same_idempotency_key_without_extra_rows
    testPath: >-
      services/order-service/src/test/java/com/stockrush/order/infra/persistence/PersistentCreateOrderServiceIntegrationTest.java
    testUrl: >-
      https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/infra/persistence/PersistentCreateOrderServiceIntegrationTest.java
  - symbol: OrderSagaEventHandler.transitionOrder
    displayPath: services/order-service/src/main/java/com/stockrush/order/application/OrderSagaEventHandler.java
    sourceUrl: >-
      https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/main/java/com/stockrush/order/application/OrderSagaEventHandler.java
    excerpt: |
      where order_id = :orderId
        and status not in ('CANCELLED', 'CONFIRMED')

      return updated == 1;
    proves: 구현은 CANCELLED·CONFIRMED를 UPDATE 대상에서 제외합니다. 연결 테스트가 직접 확인한 것은 취소 상태·FAILED 유지와 OrderConfirmed Outbox 0건입니다.
    testName: OrderSagaEventHandlerIntegrationTest.ignores_payment_authorized_for_cancelled_order
    testPath: >-
      services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
    testUrl: >-
      https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java
  - symbol: OutboxRelayService.claimPending
    displayPath: services/order-service/src/main/java/com/stockrush/order/infra/outbox/OutboxRelayService.java
    sourceUrl: >-
      https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/main/java/com/stockrush/order/infra/outbox/OutboxRelayService.java
    excerpt: |
      where status = 'PENDING'
        and (next_retry_at is null or next_retry_at <= now())
      order by created_at, id
      limit :batchSize
      for update skip locked
    proves: >-
      구현은 SKIP LOCKED로 행을 선택하고 PUBLISHING으로 선점합니다. 연결 테스트는 재시도 4/5 상태에서 대역 발행기 실패 1회 뒤 FAILED 전환을 확인하며, 여러 발행기의 선점
      경쟁을 검사한 테스트는 아닙니다.
    testName: OutboxRelayServiceIntegrationTest.marks_failed_when_publish_retry_count_is_exhausted
    testPath: services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java
    testUrl: >-
      https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java
verification:
  - layer: integration
    method: PostgreSQL에 이벤트를 넣은 뒤 같은 InventoryReserved 객체를 핸들러에 두 번 직접 전달합니다. Kafka 전달 테스트는 아닙니다.
    result: processed_events 1행, 후속 Outbox 1행을 확인했습니다.
    sources:
      - label: OrderSagaEventHandlerIntegrationTest.ignores_duplicate_inventory_event
        url: >-
          https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java#L169
    evidenceStatus: ci-record
  - layer: integration
    method: DB 주문을 CANCELLED로 바꾼 뒤 결제 승인 이벤트를 핸들러에 직접 전달합니다.
    result: CANCELLED·FAILED 상태가 유지되고 OrderConfirmed Outbox가 생성되지 않았습니다.
    sources:
      - label: OrderSagaEventHandlerIntegrationTest.ignores_payment_authorized_for_cancelled_order
        url: >-
          https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java#L87
    evidenceStatus: ci-record
  - layer: integration
    method: retry_count=4, max_retry_count=5인 행을 준비하고 발행기 대역을 한 번 실패시킵니다.
    result: retry_count=5와 FAILED 전환, 다음 재시도 시각 없음, 오류 메시지 보존을 확인했습니다. 다섯 번의 실제 Kafka 실패를 재현한 것은 아닙니다.
    sources:
      - label: OutboxRelayServiceIntegrationTest.marks_failed_when_publish_retry_count_is_exhausted
        url: >-
          https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java#L77
    evidenceStatus: ci-record
limitations:
  - 결제·출고는 내부 시뮬레이션입니다. 실제 PG·물류 연동과 운영 규모의 처리량·지연 시간은 검증하지 않았습니다.
  - >-
    이번 근거는 PostgreSQL 통합 테스트와 발행기 대역 범위입니다. 실제 Kafka 장애·복구, 여러 발행기의 동시 선점, 고가용성·다중 리전이나 컨테이너 이미지 배포 성공을 이 결과로 보장하지
    않습니다.
next:
  - OpenTelemetry로 주문 하나가 서비스를 거치는 경로를 추적하고, Kafka가 오래 멈췄다가 살아났을 때 복구에 얼마나 걸리는지 재 보려고 합니다.
links:
  github: https://github.com/cyson21/stockrush
  adr: https://github.com/cyson21/stockrush/tree/04027d3477e43e03e00e202b042dd210604dcb79/docs/adr
  testReport: https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/docs/test-strategy.md
visual:
  kind: image
  src: /media/stockrush-architecture.png
  alt: Gateway에서 주문 Saga, 서비스별 Outbox와 Kafka, 조회 모델로 이어지는 StockRush 구성도
seo:
  title: StockRush · 주문 상태 전이와 이벤트 재처리
  description: Saga와 Transactional Outbox로 결제 실패, 중복 이벤트와 발행 실패의 복구 흐름을 구현한 Java·Spring Boot 개인 프로젝트입니다.
updatedAt: '2026-11-10'
evidenceReview:
  commit: 04027d3477e43e03e00e202b042dd210604dcb79
  sourceUrl: https://github.com/cyson21/stockrush/tree/04027d3477e43e03e00e202b042dd210604dcb79
  checkedAt: '2026-11-10'
  ciUrl: https://github.com/cyson21/stockrush/actions/runs/37870631500
  ciRunDate: '2026-10-09'
  scope: PostgreSQL 통합 테스트의 해당 클래스 통과 기록을 확인했습니다. 발행기는 대역이며 실제 Kafka 장애 복구·운영 배포 증거와 구분합니다.
---

주문이 잘 되는 경우보다, 중간에 뭔가 실패했을 때 데이터가 어떻게 남는지를 더 많이 들여다본 프로젝트입니다.

취소한 주문에 결제 승인이 뒤늦게 오는 경우는 처음부터 막고 들어갔습니다. 실무에서 외부 콜백이 늦게 들어와 이미 취소된 데이터를 다시 바꿔 놓은 일을 겪은 적이 있어서입니다.
