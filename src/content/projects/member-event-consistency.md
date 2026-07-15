---
order: 3
featured: true
publicationState: public
name: Member Event Consistency
domain: Backend
eyebrow: Invariant-driven concurrency
summary: 최초 보상·쿠폰 발급·포인트 차감의 동시성 불변식을 PostgreSQL 제약과 조건부 갱신으로 지키고 Redis 잠금·RabbitMQ 단일 worker 경로를 구현해 기능 결과를 대조했습니다.
period: 2026.05–2026.06
role: 개인 프로젝트 · Spring 시나리오 API, JDBC 저장소, Redisson·RabbitMQ 제어 경로와 검증 도구 직접 구현
stack:
  - Java
  - Spring Boot
  - PostgreSQL
  - Redis
  - RabbitMQ
  - Outbox
problem: 모든 이벤트를 하나의 memberId lock으로 묶으면 hot key 병목이 커지고 아무 제어 없이 처리하면 중복 보상, 쿠폰 초과 발급과 포인트 음수 잔액이 발생합니다.
responsibilities:
  - First Login Reward, Coupon Campaign Issue, Point Spend 세 시나리오의 API와 persistence 경계를 구현했습니다.
  - PostgreSQL guard, Redis lock과 RabbitMQ 단일 worker 경로를 구현하고 같은 불변식 기준으로 기능 결과를 확인했습니다.
  - Docker/Testcontainers 검증과 SQL 기록, 시나리오 리포트 화면을 구성했습니다.
flow:
  normal:
    - 이벤트 시나리오 선택
    - 불변식 식별
    - DB 조건부 처리
    - Outbox 기록
    - 결과 리포트
  failure:
    - 최초 보상 동시 요청
    - 쿠폰 정원 초과 경쟁
    - 잔액보다 큰 동시 차감
  recovery:
    - Unique·Check·조건부 Update
    - Redis 경합 완화
    - RabbitMQ hot campaign 직렬화
signals:
  - label: 최초 보상
    expression: 8 requests → 1 reward
    result: 7 rejected · duplicate 0
    tone: success
    source: FirstLoginRewardDbConcurrencyIT.uniqueRewardIssueConstraintAllowsOnlyOneFirstLoginRewardPerMemberUnderConcurrentAttempts
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/backend/src/test/java/com/example/consistency/integration/FirstLoginRewardDbConcurrencyIT.java
  - label: 포인트 차감
    expression: 100 - (2 × 60) → 40
    result: 1 success · negative 0
    tone: warning
    source: PointSpendDbConcurrencyIT.rowLockSpendAllowsOnlyOneConcurrentDebitWhenBalanceCanCoverOneRequest
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/backend/src/test/java/com/example/consistency/integration/PointSpendDbConcurrencyIT.java
  - label: 쿠폰 용량
    expression: capacity 3 / requests 8
    result: issued 3 · rejected 5
    tone: danger
    source: MvpLiveInfrastructureIT.rabbitMqCouponCampaignRouteRunsOnlyWhenLiveDependenciesAreHealthy
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java
decisions:
  - title: DB is final guard
    choice: Unique·Check·조건부 갱신·row lock으로 최종 불변식을 보호합니다.
    alternative: Redis 분산 lock만으로 정확성 보장
    reason: 외부 lock의 만료나 장애에도 저장소 경계가 잘못된 상태를 수락하지 않도록 했습니다.
  - title: Lock by invariant
    choice: Redis lock을 모든 회원 이벤트의 공통 규칙이 아니라 경합 완화 수단으로 사용합니다.
    alternative: memberId 하나로 모든 작업을 직렬화
    reason: 서로 다른 자원을 보호하는 이벤트를 불필요하게 같은 임계 구역에 묶지 않기 위해 선택했습니다.
  - title: Queue hot campaigns
    choice: RabbitMQ 단일 worker로 hot campaign 발급을 직렬화합니다.
    alternative: 모든 요청이 캠페인 DB row lock을 직접 경쟁
    reason: 집중된 캠페인 트래픽의 경합을 완화하면서 DB capacity guard를 최종 보호 장치로 유지했습니다.
protectionRules:
  - 최초 로그인 보상은 같은 회원에게 한 번만 반영됩니다.
  - 포인트 잔액은 어떤 동시 실행 순서에서도 0보다 작아질 수 없습니다.
  - 쿠폰 발급 수는 캠페인 용량을 초과할 수 없습니다.
codeEvidence:
  - symbol: SqlCouponCampaignRepository.issueWithCapacityGuard
    displayPath: backend/src/main/java/com/example/consistency/coupon/SqlCouponCampaignRepository.java
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/backend/src/main/java/com/example/consistency/coupon/SqlCouponCampaignRepository.java
    excerpt: |
      where id = ?
        and status = 'ACTIVE'
        and issued_count < capacity
      for update
    proves: 캠페인 행 잠금과 용량 조건을 한 SQL 흐름에서 판정해 동시 요청의 초과 발급을 차단합니다.
    testName: SqlCouponCampaignRepositoryTest.issueWithCapacityGuardUsesSingleStatementWithCampaignRowLock
    testPath: backend/src/test/java/com/example/consistency/coupon/SqlCouponCampaignRepositoryTest.java
    testUrl: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/backend/src/test/java/com/example/consistency/coupon/SqlCouponCampaignRepositoryTest.java
  - symbol: SqlPointSpendRepository.tryDebit
    displayPath: backend/src/main/java/com/example/consistency/point/SqlPointSpendRepository.java
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/backend/src/main/java/com/example/consistency/point/SqlPointSpendRepository.java
    excerpt: |
      version = version + 1,
      updated_at = now()
      where member_id = ?
        and balance >= ?
    proves: 잔액이 지출액 이상일 때만 원자적으로 차감해 동시 요청에서도 음수 잔액을 허용하지 않습니다.
    testName: SqlPointSpendRepositoryTest.conditionalDebitKeepsBalanceNonNegative
    testPath: backend/src/test/java/com/example/consistency/point/SqlPointSpendRepositoryTest.java
    testUrl: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/backend/src/test/java/com/example/consistency/point/SqlPointSpendRepositoryTest.java
  - symbol: CouponCampaignRabbitMqWorker.handle
    displayPath: backend/src/main/java/com/example/consistency/web/CouponCampaignRabbitMqWorker.java
    sourceUrl: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/backend/src/main/java/com/example/consistency/web/CouponCampaignRabbitMqWorker.java
    excerpt: |
      @RabbitListener(queues = COMMAND_QUEUE, concurrency = "1")
      public void handle(CouponCampaignRabbitMqCommand command) {
          if (!tracker.isActive(command.operationId())) {
              return;
          }
    proves: 단일 consumer로 hot campaign을 직렬화하고 종료된 실행의 메시지를 무시합니다.
    testName: MvpLiveInfrastructureIT.rabbitMqCouponCampaignRouteRunsOnlyWhenLiveDependenciesAreHealthy
    testPath: backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java
    testUrl: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java
verification:
  - layer: container-smoke
    method: PostgreSQL Testcontainers에 최초 보상 동시 요청 8건을 전달합니다.
    result: 1건만 지급되고 7건이 거절됩니다.
  - layer: container-smoke
    method: 잔액 100에서 60 차감 요청 2건을 동시에 실행합니다.
    result: 1건만 성공하고 최종 잔액은 40입니다.
  - layer: container-smoke
    method: Redis·RabbitMQ·PostgreSQL 환경에서 용량 3 캠페인에 8건을 요청합니다.
    result: 3건 발급, 5건 거절, 초과 발급 0건입니다.
limitations:
  - 운영 규모 부하, 장시간 메시지 장애와 복구 SLO는 포함하지 않았습니다.
  - Redis와 RabbitMQ 결과는 잠금·단일 worker 구현과 정합성 확인이며 동일 부하에서 처리량이나 tail latency를 측정한 성능 비교가 아닙니다.
next:
  - 전략별 처리량과 tail latency를 같은 부하 조건에서 비교합니다.
links:
  github: https://github.com/cyson21/member-event-consistency
  design: https://github.com/cyson21/member-event-consistency/blob/feature/review/remediation-hardening/docs/portfolio/one-pager.md
  testReport: https://github.com/cyson21/member-event-consistency/tree/feature/review/remediation-hardening/backend/src/test
visual:
  kind: diagram
  alt: 이벤트 시나리오별 불변식을 PostgreSQL guard와 Redis·RabbitMQ 비교 경로로 연결한 구성도
seo:
  title: Member Event Consistency · 불변식 기반 동시성 제어
  description: PostgreSQL guard를 최종 보호 장치로 두고 Redis와 RabbitMQ 동시성 전략을 비교한 Java 백엔드 프로젝트입니다.
updatedAt: 2026-07-15
---

하나의 동시성 도구가 아니라 업무 불변식별로 적합한 제어 경계를 선택하고 비교한 프로젝트입니다.
