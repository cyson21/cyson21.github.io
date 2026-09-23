---
order: 3
featured: true
publicationState: public
name: Member Event Consistency
domain: Backend
eyebrow: 동시 요청 제어
summary: 회원 보상, 포인트, 쿠폰 요청이 동시에 몰려도 두 번 지급되거나 수량보다 많이 나가지 않게 만든 백엔드입니다. 같은 문제를 PostgreSQL, Redis, RabbitMQ로 각각 풀어 보고 비교했습니다.
cardEvidence:
  implementation: 중복 보상은 유니크 제약으로, 포인트는 조건부 UPDATE로, 쿠폰은 행 잠금과 남은 수량 조건으로 막습니다.
  result: 동시에 보상 요청 8건을 보내면 1건만 지급됩니다. 잔액 100에서 60씩 두 번 빼면 한 번만 성공합니다.
period: 2026.05–2026.06
role: 개인 프로젝트 · 설계부터 구현, 테스트까지 혼자 진행
stack:
  - Java
  - Spring Boot
  - PostgreSQL
  - Redis
  - RabbitMQ
  - Outbox
problem: 제어 없이 처리하면 첫 로그인 보상이 두 번 나가고, 쿠폰이 준비한 수량보다 많이 발급되고, 포인트가 마이너스가 됩니다. 반대로 회원 ID 하나로 전부 잠그면 한 사람에게 요청이 몰릴 때 다 같이 느려집니다.
responsibilities:
  - 첫 로그인 보상, 선착순 쿠폰 발급, 포인트 차감 API를 만들었습니다.
  - 같은 기능을 PostgreSQL 제약, Redis 잠금, RabbitMQ 단일 소비자 세 가지 방식으로 구현하고 결과가 같은지 확인했습니다.
  - 방식별 결과를 나란히 볼 수 있는 조회 화면을 붙였습니다.
flow:
  normal:
    - 이벤트 시나리오 선택
    - 지켜야 할 규칙 확인
    - DB에서 조건부로 처리
    - Outbox 기록
    - 결과 비교
  failure:
    - 최초 보상 동시 요청
    - 쿠폰 정원 초과 경쟁
    - 잔액보다 큰 동시 차감
  recovery:
    - 유니크, CHECK 제약과 조건부 UPDATE
    - Redis 잠금으로 DB 부담 줄이기
    - 인기 캠페인은 RabbitMQ로 한 줄 세우기
signals:
  - label: 최초 보상
    expression: 동시 요청 8건
    result: 1건 지급, 7건 거절
    tone: success
    source: FirstLoginRewardDbConcurrencyIT.uniqueRewardIssueConstraintAllowsOnlyOneFirstLoginRewardPerMemberUnderConcurrentAttempts
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/main/backend/src/test/java/com/example/consistency/integration/FirstLoginRewardDbConcurrencyIT.java
  - label: 포인트 차감
    expression: 100 - (2 × 60) → 40
    result: 1건만 성공, 잔액은 40
    tone: warning
    source: PointSpendDbConcurrencyIT.rowLockSpendAllowsOnlyOneConcurrentDebitWhenBalanceCanCoverOneRequest
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/main/backend/src/test/java/com/example/consistency/integration/PointSpendDbConcurrencyIT.java
  - label: 쿠폰 용량
    expression: 정원 3건 / 요청 8건
    result: 3건 발급, 5건 거절
    tone: danger
    source: MvpLiveInfrastructureIT.rabbitMqCouponCampaignRouteRunsOnlyWhenLiveDependenciesAreHealthy
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/main/backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java
decisions:
  - title: 마지막 방어선은 DB
    choice: 유니크, CHECK 제약과 조건부 UPDATE, 행 잠금으로 DB가 잘못된 값을 받지 않게 합니다.
    alternative: Redis 분산 락만 믿기
    reason: Redis 락은 만료되거나 Redis가 죽으면 풀립니다. 그때도 DB가 막아 주면 데이터는 안전합니다.
  - title: 잠금은 필요한 곳에만
    choice: Redis 잠금은 경합이 심한 곳에서 DB 부담을 덜어 주는 용도로만 씁니다.
    alternative: 회원 ID 하나로 모든 작업을 줄 세우기
    reason: 포인트 차감과 쿠폰 발급은 서로 상관이 없는데 같은 락을 기다릴 이유가 없습니다.
  - title: 몰리는 캠페인은 큐로
    choice: 요청이 몰리는 캠페인은 RabbitMQ 소비자 하나가 순서대로 발급합니다.
    alternative: 모든 요청이 캠페인 행 잠금을 직접 경쟁
    reason: 수천 건이 한 행을 두고 싸우는 대신 큐에서 기다리게 했습니다. 수량 조건은 그대로 DB에 남겨 두었습니다.
protectionRules:
  - 첫 로그인 보상은 한 회원에게 한 번만 나갑니다.
  - 요청이 어떤 순서로 겹쳐도 포인트는 0 아래로 내려가지 않습니다.
  - 쿠폰은 준비한 수량보다 많이 나가지 않습니다.
codeEvidence:
  - symbol: SqlCouponCampaignRepository.issueWithCapacityGuard
    displayPath: backend/src/main/java/com/example/consistency/coupon/SqlCouponCampaignRepository.java
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/main/backend/src/main/java/com/example/consistency/coupon/SqlCouponCampaignRepository.java
    excerpt: |
      where id = ?
        and status = 'ACTIVE'
        and issued_count < capacity
      for update
    proves: 캠페인 행을 잠그고 남은 수량을 SQL 한 번에 확인해서, 동시에 들어와도 수량을 넘겨 발급하지 않습니다.
    testName: SqlCouponCampaignRepositoryTest.issueWithCapacityGuardUsesSingleStatementWithCampaignRowLock
    testPath: backend/src/test/java/com/example/consistency/coupon/SqlCouponCampaignRepositoryTest.java
    testUrl: https://github.com/cyson21/member-event-consistency/blob/main/backend/src/test/java/com/example/consistency/coupon/SqlCouponCampaignRepositoryTest.java
  - symbol: SqlPointSpendRepository.tryDebit
    displayPath: backend/src/main/java/com/example/consistency/point/SqlPointSpendRepository.java
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/main/backend/src/main/java/com/example/consistency/point/SqlPointSpendRepository.java
    excerpt: |
      version = version + 1,
      updated_at = now()
      where member_id = ?
        and balance >= ?
    proves: 잔액이 충분할 때만 UPDATE가 적용되기 때문에 동시에 빼도 마이너스가 되지 않습니다.
    testName: SqlPointSpendRepositoryTest.conditionalDebitKeepsBalanceNonNegative
    testPath: backend/src/test/java/com/example/consistency/point/SqlPointSpendRepositoryTest.java
    testUrl: https://github.com/cyson21/member-event-consistency/blob/main/backend/src/test/java/com/example/consistency/point/SqlPointSpendRepositoryTest.java
  - symbol: CouponCampaignRabbitMqWorker.handle
    displayPath: backend/src/main/java/com/example/consistency/web/CouponCampaignRabbitMqWorker.java
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/main/backend/src/main/java/com/example/consistency/web/CouponCampaignRabbitMqWorker.java
    excerpt: |
      @RabbitListener(queues = COMMAND_QUEUE, concurrency = "1")
      public void handle(CouponCampaignRabbitMqCommand command) {
          if (!tracker.isActive(command.operationId())) {
              return;
          }
    proves: 소비자 하나가 순서대로 처리하고, 이미 끝난 실행에서 온 메시지는 버립니다.
    testName: MvpLiveInfrastructureIT.rabbitMqCouponCampaignRouteRunsOnlyWhenLiveDependenciesAreHealthy
    testPath: backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java
    testUrl: https://github.com/cyson21/member-event-consistency/blob/main/backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java
verification:
  - layer: container-smoke
    method: Testcontainers PostgreSQL에 첫 로그인 보상 요청 8건을 동시에 보냅니다.
    result: 1건 지급, 7건 거절
  - layer: container-smoke
    method: 잔액 100에서 60 차감을 두 번 동시에 요청합니다.
    result: 1건만 성공하고 잔액은 40입니다.
  - layer: container-smoke
    method: Redis, RabbitMQ, PostgreSQL을 띄우고 수량 3개짜리 캠페인에 8건을 요청합니다.
    result: 3건 발급, 5건 거절
limitations:
  - 실제 운영 수준의 트래픽이나 메시지 브로커 장기 장애는 해 보지 않았습니다.
  - 세 방식 모두 결과가 맞는지만 확인했고, 어느 쪽이 더 빠른지는 아직 재 보지 않았습니다.
next:
  - 같은 부하에서 방식별 처리량과 p99 지연을 비교해 보려고 합니다.
links:
  github: https://github.com/cyson21/member-event-consistency
  design: https://github.com/cyson21/member-event-consistency/blob/main/docs/portfolio/one-pager.md
  testReport: https://github.com/cyson21/member-event-consistency/tree/main/backend/src/test
visual:
  kind: diagram
  alt: 보상, 포인트, 쿠폰 시나리오를 PostgreSQL 제약과 Redis, RabbitMQ 경로로 연결한 구성도
seo:
  title: Member Event Consistency · 쿠폰, 포인트 동시성 처리
  description: 쿠폰 초과 발급, 포인트 마이너스, 중복 보상을 PostgreSQL, Redis, RabbitMQ로 막아 보고 비교한 Java 백엔드 프로젝트입니다.
updatedAt: 2026-09-23
---
동시성 문제를 한 가지 도구로 다 풀기보다, 문제마다 어디서 막는 게 맞는지 비교해 본 프로젝트입니다.
