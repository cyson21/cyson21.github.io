---
order: 3
featured: true
publicationState: public
name: Member Event Consistency
domain: Backend
eyebrow: 동시 요청 제어
summary: >-
  회원 보상·포인트·쿠폰의 동시 요청을 처리하는 백엔드입니다. PostgreSQL 제약·잠금·조건부 갱신으로 중복 지급과 초과 발급·차감을 막고, Redis 락과 RabbitMQ 처리 방식의 동시 요청
  결과를 비교했습니다.
cardEvidence:
  implementation: 중복 보상은 유니크 제약으로, 포인트는 조건부 UPDATE로, 쿠폰은 행 잠금과 남은 수량 조건으로 막습니다.
  result: 독립 JDBC 트랜잭션 테스트에서 보상 등록 8건 중 1건 반영과 잔액 100의 동시 60 차감 2건 중 1건 성공을 확인했습니다.
period: 2026.05–2026.06
role: 개인 프로젝트 · 백엔드 설계·구현·인프라 비교 테스트
stack:
  - Java
  - Spring Boot
  - PostgreSQL
  - Redis
  - RabbitMQ
  - Outbox
problem: >-
  제어 없이 처리하면 첫 로그인 보상이 두 번 나가고, 쿠폰이 준비한 수량보다 많이 발급되고, 포인트가 마이너스가 됩니다. 반대로 회원 ID 하나로 전부 잠그면 한 사람에게 요청이 몰릴 때 다 같이
  느려집니다.
responsibilities:
  - 첫 로그인 보상, 선착순 쿠폰 발급, 포인트 차감 API를 만들었습니다.
  - DB 제약·갱신 조건을 공통으로 유지한 채 Redis 잠금과 RabbitMQ 처리 경로를 구성하고 결과를 비교했습니다.
  - 방식별 결과를 나란히 볼 수 있는 조회 화면을 붙였습니다.
flow:
  normal:
    - 이벤트 시나리오 선택
    - 지켜야 할 규칙 확인
    - DB에서 조건부로 처리
    - 시나리오별 후속 처리
    - 결과 비교
  failure:
    - 최초 보상 동시 요청
    - 쿠폰 정원 초과 경쟁
    - 잔액보다 큰 동시 차감
  recovery:
    - 유니크, CHECK 제약과 조건부 UPDATE
    - 회원·캠페인별 Redis 잠금
    - 로컬 단일 RabbitMQ 소비자 처리
signals:
  - label: 보상 DB 제약
    expression: JDBC 동시 등록 8건
    result: 등록 1건, 유니크 제약 거절 7건
    tone: success
    source: >-
      FirstLoginRewardDbConcurrencyIT.uniqueRewardIssueConstraintAllowsOnlyOneFirstLoginRewardPerMemberUnderConcurrentAttempts
    sourceUrl: >-
      https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/FirstLoginRewardDbConcurrencyIT.java
  - label: 포인트 DB 잠금
    expression: JDBC 잔액 100, 동시 60 차감 2건
    result: 성공 1건, 최종 잔액 40
    tone: warning
    source: PointSpendDbConcurrencyIT.rowLockSpendAllowsOnlyOneConcurrentDebitWhenBalanceCanCoverOneRequest
    sourceUrl: >-
      https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/PointSpendDbConcurrencyIT.java
  - label: 쿠폰 용량
    expression: 정원 3건 / 요청 8건
    result: 3건 발급, 5건 거절
    tone: danger
    source: MvpLiveInfrastructureIT.rabbitMqCouponCampaignRouteRunsOnlyWhenLiveDependenciesAreHealthy
    sourceUrl: >-
      https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java
decisions:
  - title: 마지막 방어선은 DB
    choice: 유니크, CHECK 제약과 조건부 UPDATE, 행 잠금으로 DB가 잘못된 값을 받지 않게 합니다.
    alternative: Redis 분산 락만 믿기
    reason: Redis 락 만료나 장애로 동시 요청이 들어와도 DB 제약과 갱신 조건으로 중복·초과 처리를 막도록 했습니다.
  - title: 잠금은 필요한 곳에만
    choice: 보상은 회원별, 쿠폰은 캠페인별 Redis 잠금을 사용하고 DB 제약·갱신 조건은 유지합니다.
    alternative: 회원 ID 하나로 모든 작업을 줄 세우기
    reason: 포인트 차감과 쿠폰 발급은 서로 상관이 없는데 같은 락을 기다릴 이유가 없습니다.
  - title: 몰리는 캠페인은 큐로
    choice: 테스트용 Spring 인스턴스 하나에서 RabbitMQ listener concurrency를 1로 두고 캠페인 발급 경로를 비교했습니다.
    alternative: 모든 요청이 캠페인 행 잠금을 직접 경쟁
    reason: 로컬 인스턴스에서 소비자 경쟁을 줄이는 경로를 비교하려는 선택입니다. 수량 조건은 DB에 유지했으며, 처리량 개선 효과는 측정하지 않았습니다.
protectionRules:
  - 회원·보상 유형 유니크 제약으로 같은 보상의 중복 등록을 거절하도록 구현했습니다.
  - 조건부 UPDATE·행 잠금·CHECK 제약으로 음수 잔액을 거절하도록 구현했습니다.
  - 단일 인스턴스 HTTP·RabbitMQ 테스트의 정원 3·요청 8건 조건에서 3건만 발급됐습니다.
codeEvidence:
  - symbol: SqlCouponCampaignRepository.issueWithCapacityGuard
    displayPath: backend/src/main/java/com/example/consistency/coupon/SqlCouponCampaignRepository.java
    sourceUrl: >-
      https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/main/java/com/example/consistency/coupon/SqlCouponCampaignRepository.java
    excerpt: |
      where id = ?
        and status = 'ACTIVE'
        and issued_count < capacity
      for update
    proves: >-
      FOR UPDATE와 수량 조건을 포함하는 CTE SQL을 구성합니다. 연결된 RecordingSqlExecutor 단위 테스트는 SQL 구조·바인딩을 검사하며 실제 DB 동시 발급 결과는 별도
      통합 테스트 범위입니다.
    testName: SqlCouponCampaignRepositoryTest.issueWithCapacityGuardUsesSingleStatementWithCampaignRowLock
    testPath: backend/src/test/java/com/example/consistency/coupon/SqlCouponCampaignRepositoryTest.java
    testUrl: >-
      https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/coupon/SqlCouponCampaignRepositoryTest.java
  - symbol: SqlPointSpendRepository.tryDebit
    displayPath: backend/src/main/java/com/example/consistency/point/SqlPointSpendRepository.java
    sourceUrl: >-
      https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/main/java/com/example/consistency/point/SqlPointSpendRepository.java
    excerpt: |
      version = version + 1,
      updated_at = now()
      where member_id = ?
        and balance >= ?
    proves: >-
      balance >= 조건을 붙인 차감 SQL을 구성합니다. 연결된 단위 테스트는 대역 실행기가 반환한 실패와 SQL·파라미터를 검사합니다. 실제 DB 경합 결과를 이 테스트 하나로 증명하지
      않습니다.
    testName: SqlPointSpendRepositoryTest.conditionalDebitKeepsBalanceNonNegative
    testPath: backend/src/test/java/com/example/consistency/point/SqlPointSpendRepositoryTest.java
    testUrl: >-
      https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/point/SqlPointSpendRepositoryTest.java
  - symbol: CouponCampaignRabbitMqWorker.handle
    displayPath: backend/src/main/java/com/example/consistency/web/CouponCampaignRabbitMqWorker.java
    sourceUrl: >-
      https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/main/java/com/example/consistency/web/CouponCampaignRabbitMqWorker.java
    excerpt: |
      @RabbitListener(queues = CouponCampaignRabbitMqConfiguration.COMMAND_QUEUE, concurrency = "1")
      public void handle(CouponCampaignRabbitMqCommand command) {
          if (!tracker.isActive(command.operationId())) {
              return;
          }
    proves: Spring 인스턴스 하나의 listener concurrency를 1로 설정하고 비활성 실행의 메시지를 무시합니다. 여러 인스턴스의 전역 순서 보장을 뜻하지 않습니다.
    testName: MvpLiveInfrastructureIT.rabbitMqCouponCampaignRouteRunsOnlyWhenLiveDependenciesAreHealthy
    testPath: backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java
    testUrl: >-
      https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java
verification:
  - layer: container-smoke
    method: Testcontainers PostgreSQL에 테스트 전용 JDBC INSERT를 8개 트랜잭션으로 동시에 실행합니다. 보상 HTTP API 전체 경로는 아닙니다.
    result: 등록 1건·유니크 제약 거절 7건, reward_issue 행 1건을 확인했습니다.
    sources:
      - label: >-
          FirstLoginRewardDbConcurrencyIT.uniqueRewardIssueConstraintAllowsOnlyOneFirstLoginRewardPerMemberUnderConcurrentAttempts
        url: >-
          https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/FirstLoginRewardDbConcurrencyIT.java#L42
    evidenceStatus: ci-record
  - layer: container-smoke
    method: 테스트 전용 JDBC SELECT FOR UPDATE·차감 트랜잭션으로 잔액 100에서 60 차감을 두 번 요청합니다.
    result: 차감 1건만 반영되고 잔액은 40입니다. 운영 서비스의 모든 차감 경로·부하를 검증한 결과는 아닙니다.
    sources:
      - label: PointSpendDbConcurrencyIT.rowLockSpendAllowsOnlyOneConcurrentDebitWhenBalanceCanCoverOneRequest
        url: >-
          https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/PointSpendDbConcurrencyIT.java#L42
    evidenceStatus: ci-record
  - layer: container-smoke
    method: Redis·RabbitMQ·PostgreSQL 컨테이너와 Spring 인스턴스 1개에서 HTTP로 정원 3·요청 8건을 보냅니다.
    result: 완료 8건, 발급 3건·거절 5건, 소비자 lane 1개를 확인했습니다. 재시도는 입력 플래그로 유도한 시나리오입니다.
    sources:
      - label: MvpLiveInfrastructureIT.rabbitMqCouponCampaignRouteRunsOnlyWhenLiveDependenciesAreHealthy
        url: >-
          https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java#L63
    evidenceStatus: ci-record
limitations:
  - >-
    Testcontainers의 제한된 요청 수로 정합성을 확인했습니다. RabbitMQ 비교는 Spring 인스턴스 1개·소비자 1개 조건입니다. 운영 수준의 처리량·지연과 브로커 장기 장애는 검증하지
    않았습니다.
  - Redis의 다중 프로세스 잠금 경쟁·만료·장애 복구와 RabbitMQ 다중 인스턴스 순서 보장은 검증하지 않았습니다.
  - 방식별 성능 우위나 DB 부하 감소 효과는 측정하지 않았습니다.
  - RabbitMQ 재시도·DLQ는 transientFailureBudget/dlq 입력으로 분기하는 비교 시나리오입니다. 실제 네트워크 단절·소비자 프로세스 장애 복구 결과로 해석하지 않습니다.
next:
  - 같은 부하에서 방식별 처리량과 p99 지연을 비교해 보려고 합니다.
links:
  github: https://github.com/cyson21/member-event-consistency
  design: >-
    https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/docs/portfolio/one-pager.md
  testReport: >-
    https://github.com/cyson21/member-event-consistency/tree/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test
visual:
  kind: diagram
  alt: 보상, 포인트, 쿠폰 시나리오를 PostgreSQL 제약과 Redis, RabbitMQ 경로로 연결한 구성도
seo:
  title: Member Event Consistency · 쿠폰, 포인트 동시성 처리
  description: 쿠폰 초과 발급, 포인트 마이너스, 중복 보상을 PostgreSQL, Redis, RabbitMQ로 막아 보고 비교한 Java 백엔드 프로젝트입니다.
updatedAt: '2026-11-10'
evidenceReview:
  commit: 7a2dfc5d41817ec70e479a997277d8aba0af37f9
  sourceUrl: https://github.com/cyson21/member-event-consistency/tree/7a2dfc5d41817ec70e479a997277d8aba0af37f9
  checkedAt: '2026-11-10'
  ciUrl: https://github.com/cyson21/member-event-consistency/actions/runs/37869938820
  ciRunDate: '2026-10-09'
  scope: CI의 Testcontainers 18개·일반 회귀 96개 통과 기록을 확인했습니다. 보상·포인트 수치는 JDBC DB 테스트, 쿠폰은 단일 인스턴스 HTTP·RabbitMQ 경로입니다.
---
동시성 문제를 한 가지 도구로 다 풀기보다, 문제마다 어디서 막는 게 맞는지 비교해 본 프로젝트입니다.
