---
order: 6
featured: false
publicationState: public
name: Fashion Personalization Platform
domain: Backend
eyebrow: 이벤트 기반 추천 파이프라인
summary: 사용자 행동 이벤트를 반영해 상품 점수와 추천 이유를 생성하는 Python 백엔드입니다. 메모리 저장소에서 멱등 처리·실패 상태·재처리와 사용자별 추천 배치를 구현했습니다.
period: '2026.07'
role: 개인 프로젝트 · Python 도메인 로직·이벤트 처리·추천 배치 구현
stack:
  - Python 3.11
  - FastAPI
  - pytest
  - 이벤트 처리
  - 배치 작업
  - 메모리 저장소
problem: 같은 클릭이 두 번 들어가거나 처리 중 실패한 이벤트가 섞이면 사용자 취향 데이터가 틀어지고, 추천도 계속 엇나갑니다. 오래된 추천 결과를 최신인 줄 알고 보여 줄 수도 있습니다.
responsibilities:
  - 핵심 로직은 외부 서비스 없이 돌게 만들고, FastAPI는 필요할 때 붙이는 구조로 했습니다.
  - 멱등 키로 중복을 막고, 재시도 한도와 DLQ, 재처리 흐름을 넣었습니다.
  - 활성 사용자별 추천 스냅샷을 배치로 생성하고 생성 시각·반영 이벤트 수·미반영 상태를 기록했습니다.
flow:
  normal:
    - 상품 목록
    - 사용자 행동 이벤트
    - 사용자 취향 데이터
    - 추천 순위
    - 추천 스냅샷(수동 배치 호출)
  failure:
    - 같은 이벤트가 두 번
    - 처리 3번 실패
    - 오래된 추천 결과
  recovery:
    - 멱등 키로 건너뜀
    - DLQ로 빼고 새 키로 재처리
    - 생성 시각과 반영 건수로 최신인지 확인
signals:
  - label: 중복 처리 방지
    expression: 같은 멱등 키로 서비스 호출 2회
    result: 같은 이벤트 ID, 처리 건수 1회 증가
    tone: success
    source: test_event_processing.py::test_event_ingestion_is_idempotent
    sourceUrl: >-
      https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_event_processing.py
  - label: 실패 이벤트 분리
    expression: 처리 3번 실패
    result: 3회 처리 시도 후 DEAD_LETTER 1건, FAILED 0건
    tone: danger
    source: test_event_processing.py::test_unknown_product_moves_to_dead_letter_after_retry_budget
    sourceUrl: >-
      https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_event_processing.py
  - label: 추천 근거
    expression: 고정 데모의 사용자 선호 브랜드
    result: 상위 상품과 brand 추천 이유 확인
    tone: warning
    source: test_recommendation_engine.py::test_personal_ranking_prioritizes_user_preferences
    sourceUrl: >-
      https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py
decisions:
  - title: 핵심 로직은 프레임워크 없이
    choice: 추천과 이벤트 처리 로직은 FastAPI 없이도 돌아갑니다.
    alternative: FastAPI 모델과 ORM을 도메인 코드에서 바로 쓰기
    reason: 추천 규칙은 pytest만으로 빠르게 확인하고 싶었고, 나중에 HTTP 계층을 바꿔도 로직은 그대로 두고 싶었습니다.
  - title: 실패한 이벤트는 따로
    choice: 중복 확인, 재시도, DLQ, 재처리를 단계별로 나눴습니다.
    alternative: 실패하면 될 때까지 바로 재시도
    reason: 계속 실패하는 이벤트 하나 때문에 다른 이벤트 처리가 막히면 안 됐습니다.
  - title: 취향 갱신과 추천 생성은 따로
    choice: 이벤트가 올 때마다 취향 데이터를 바꾸고, 추천 결과는 배치로 따로 만듭니다.
    alternative: 추천 요청마다 이벤트를 전부 다시 집계
    reason: 스냅샷 조회와 추천 재계산을 구분하고 결과의 기준 시점을 추적하기 위한 선택입니다. 현재 HTTP 추천 API는 즉시 계산 경로를 사용합니다.
  - title: 규칙 기반 점수
    choice: 브랜드, 카테고리, 태그, 가격, 사이즈, 재고 규칙으로 점수와 이유를 만들고, 점수가 같으면 상품 ID 순으로 정렬합니다.
    alternative: 머신러닝 모델이나 외부 추천 API 쓰기
    reason: 같은 입력이면 항상 같은 결과가 나와야 테스트할 수 있고, 왜 이 상품이 위에 있는지 코드로 설명할 수 있어야 했습니다.
protectionRules:
  - 같은 멱등 키는 취향 데이터에 한 번만 반영됩니다.
  - 세 번 실패한 이벤트는 DLQ로 빠집니다.
  - 추천 결과에는 생성 시각과 반영한 이벤트 수가 같이 저장됩니다.
  - 점수가 같으면 상품 ID 순서로 고정합니다.
codeEvidence:
  - symbol: apply_event_to_profile
    displayPath: src/fashion_personalization/recommendation.py
    sourceUrl: >-
      https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/src/fashion_personalization/recommendation.py
    excerpt: |
      selected_size = event.payload.get("size")
      if isinstance(selected_size, str) and selected_size in product.sizes:
          _add_weight(
              profile.size_preferences, selected_size, max(weight, 0.1)
          )
    proves: 구현은 상품에 존재하는 사이즈만 취향 가중치에 반영합니다. 연결 테스트는 유효한 M 선택의 상위 추천과 sizes:M 이유를 확인하며, 잘못된 사이즈 입력 거절을 직접 검사하지는 않습니다.
    testName: test_size_preference_contributes_to_ranking
    testPath: tests/test_recommendation_engine.py
    testUrl: >-
      https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py
  - symbol: rank_products
    displayPath: src/fashion_personalization/recommendation.py
    sourceUrl: >-
      https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/src/fashion_personalization/recommendation.py
    excerpt: |
      score, reasons = _score_product(profile, product)
      recommendations.append(
          Recommendation(product_id=product.product_id, score=round(score, 4), reasons=tuple(reasons))
      )
      return sorted(recommendations, key=lambda item: (-item.score, item.product_id))[:limit]
    proves: >-
      구현은 점수·이유를 만들고 동점이면 상품 ID로 정렬합니다. 연결 테스트는 고정 데모의 상위 상품·브랜드 이유를 확인합니다. 동점 정렬은 코드 확인 범위이며 해당 테스트의 assertion은
      아닙니다.
    testName: test_personal_ranking_prioritizes_user_preferences
    testPath: tests/test_recommendation_engine.py
    testUrl: >-
      https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py
  - symbol: RecommendationBatchWorkflow.refresh_snapshots
    displayPath: src/fashion_personalization/batch.py
    sourceUrl: >-
      https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/src/fashion_personalization/batch.py
    excerpt: |
      snapshot = RecommendationSnapshot(
          generated_at=utc_now(),
          source_event_count=profile.event_count,
      )
      self.store.save_snapshot(snapshot)
    proves: 추천 결과에 생성 시각과 반영 이벤트 수를 남겨서 얼마나 최신인지 알 수 있게 합니다.
    testName: test_batch_refresh_writes_materialized_snapshots
    testPath: tests/test_batch_workflow.py
    testUrl: >-
      https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_batch_workflow.py
verification:
  - layer: unit
    method: 같은 멱등 키로 두 번 호출하고, 별도 테스트에서 없는 상품의 이벤트를 최초 1회와 재시도 2회 처리합니다.
    result: 이벤트 ID 재사용·처리 건수 1회 증가, 3회 시도 후 DEAD_LETTER를 확인했습니다. 실패 중 다른 이벤트의 지속 처리를 이 테스트가 직접 검사하지는 않습니다.
    sources:
      - label: test_event_ingestion_is_idempotent
        url: >-
          https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_event_processing.py#L8
      - label: test_unknown_product_moves_to_dead_letter_after_retry_budget
        url: >-
          https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_event_processing.py#L67
    evidenceStatus: local-rerun
  - layer: unit
    method: 고정 입력으로 선호 브랜드·사이즈·가격 이벤트 순서·재고 조건의 단위 테스트를 각각 실행합니다.
    result: 상위 상품과 추천 이유, 선택한 입력 순서에서의 가격 취향 일치, 품절 제외를 확인했습니다. 추천 품질·모든 이벤트 순서의 일반적 보장은 아닙니다.
    sources:
      - label: test_personal_ranking_prioritizes_user_preferences
        url: >-
          https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py#L5
      - label: test_size_preference_contributes_to_ranking
        url: >-
          https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py#L37
      - label: test_target_price_is_weighted_and_order_independent
        url: >-
          https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py#L79
      - label: test_stock_availability_and_low_stock_are_reflected
        url: >-
          https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py#L121
    evidenceStatus: local-rerun
  - layer: integration
    method: 외부 서비스 없이 데모 서비스 메서드로 수동 배치를 호출하고 저장된 스냅샷을 조회합니다.
    result: 고정 데모에서 스냅샷 2개 이상과 기준 시각·반영 이벤트 수, stale_snapshot_users=0을 확인했습니다. 자동 스케줄러·HTTP 이벤트 워커의 결과는 아닙니다.
    sources:
      - label: test_batch_refresh_writes_materialized_snapshots
        url: >-
          https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_batch_workflow.py#L5
    evidenceStatus: local-rerun
limitations:
  - 저장소는 단일 프로세스의 메모리 구현입니다. 외부 브로커·Outbox·분산 저장소와 AWS 배포는 구현·검증하지 않았습니다.
  - POST /events는 이벤트를 대기 상태로 저장합니다. HTTP 이벤트 워커와 자동 배치 스케줄러는 없으며 서비스 메서드로 처리합니다.
  - 추천은 정해 둔 규칙일 뿐 머신러닝이 아니고, 추천 품질을 평가하지도 않았습니다. 같은 점수일 때 ID 순서로 나오는지 직접 확인하는 테스트도 아직 없습니다.
next:
  - PostgreSQL 어댑터를 붙이고 통합 테스트를 추가하려고 합니다.
links:
  github: https://github.com/cyson21/fashion-personalization-platform
  adr: >-
    https://github.com/cyson21/fashion-personalization-platform/tree/d08843005c864ab10dab6616b883e76d54de16f0/docs/adr
  design: >-
    https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/docs/architecture.md
visual:
  kind: diagram
  alt: 행동 이벤트가 중복 확인과 재시도를 거쳐 취향 데이터, 추천 순위, 저장된 추천 결과로 이어지는 구성도
seo:
  title: Fashion Personalization · 행동 이벤트 기반 추천
  description: 중복되거나 실패한 행동 이벤트를 걸러 내고, 상품 조건과 사용자 취향으로 이유가 붙은 추천을 만드는 Python 백엔드입니다.
updatedAt: '2026-11-10'
evidenceReview:
  commit: d08843005c864ab10dab6616b883e76d54de16f0
  sourceUrl: https://github.com/cyson21/fashion-personalization-platform/tree/d08843005c864ab10dab6616b883e76d54de16f0
  checkedAt: '2026-11-10'
  ciUrl: https://github.com/cyson21/fashion-personalization-platform/actions/runs/37869920344
  ciRunDate: '2026-10-09'
  scope: 이번에 pytest 45개를 재실행했습니다. 단일 프로세스·메모리 저장소·고정 데모 데이터 범위입니다.
---
클릭 이벤트가 중복되거나 실패해도 추천이 엇나가지 않게 만든 규칙 기반 추천 백엔드입니다.
