---
order: 6
featured: false
publicationState: case-study-only
name: Fashion Personalization Platform
domain: AI
eyebrow: Event-to-recommendation pipeline
summary: 상품 특성과 사용자 행동 이벤트를 규칙 기반 개인화 점수와 추천 snapshot으로 변환하고 중복·실패 이벤트 격리와 freshness 지표를 구성했습니다.
period: "2026.07"
role: 개인 프로젝트 · Python domain core, 이벤트 상태 전이, 규칙 기반 ranking, batch snapshot과 선택형 FastAPI 직접 구현
stack:
  - Python 3.11
  - FastAPI optional
  - pytest
  - Event processing
  - Batch workflow
  - In-memory repository
problem: 중복 이벤트나 처리 실패가 사용자 profile을 오염시키면 추천 결과가 누적해서 잘못되고 오래된 snapshot을 최신 결과로 오인할 수 있습니다.
responsibilities:
  - 외부 의존성 없는 domain·service core와 선택형 FastAPI adapter를 구현했습니다.
  - Idempotency, retry budget, DLQ·requeue 이벤트 처리 흐름을 구성했습니다.
  - Active user별 추천 snapshot batch, freshness 운영 지표와 관리자 리포트를 구현했습니다.
flow:
  normal:
    - 상품 catalog
    - 사용자 행동 이벤트
    - 개인화 Profile
    - 추천 Ranking
    - Materialized snapshot
  failure:
    - 동일 이벤트 중복
    - 처리 3회 실패
    - 오래된 Snapshot
  recovery:
    - Idempotency key 차단
    - DLQ·새 key Requeue
    - Event watermark·Freshness report
signals:
  - label: 실패 이벤트
    expression: 3 failures → DLQ
    result: 새 idempotency key로 requeue
    tone: danger
    source: test_event_processing.py::test_unknown_product_moves_to_dead_letter_after_retry_budget
  - label: 추천 fixture
    expression: 6 products → ranked
    result: brand · size · price · stock 반영
    tone: success
    source: test_recommendation_engine.py::test_personal_ranking_prioritizes_user_preferences
  - label: Batch snapshot
    expression: snapshots ≥ 2
    result: stale 0 · freshness assertion
    tone: warning
    source: test_batch_workflow.py::test_batch_refresh_writes_materialized_snapshots
decisions:
  - title: Dependency-free core
    choice: Domain과 service 핵심 흐름을 외부 웹 프레임워크 없이 실행할 수 있게 유지합니다.
    alternative: FastAPI request model과 ORM을 domain에 직접 사용
    reason: 설치 환경과 무관하게 추천·이벤트 규칙을 빠르게 검증하고 adapter를 교체하기 위해 선택했습니다.
  - title: Failure isolation
    choice: Idempotency, retry budget, DLQ와 requeue를 별도 단계로 둡니다.
    alternative: 실패 이벤트를 무제한 즉시 재실행
    reason: 반복 실패가 profile 갱신과 정상 이벤트 처리를 오염시키지 않도록 했습니다.
  - title: Realtime vs batch
    choice: 이벤트 기반 profile 갱신과 materialized snapshot 생성을 분리합니다.
    alternative: 모든 추천 요청에서 이벤트 전체를 다시 집계
    reason: 추천 응답 경로를 단순화하고 결과 생성 시각과 event watermark를 추적하기 위해 선택했습니다.
  - title: Deterministic business scoring
    choice: 브랜드·카테고리·태그·가격·사이즈·재고 규칙으로 점수와 이유를 만들고 동점은 product ID로 정렬합니다.
    alternative: 학습 모델이나 외부 추천 API로 순위를 생성
    reason: 같은 profile과 catalog에서 결과를 재현하고 각 순위의 근거를 코드로 확인하기 위해 선택했습니다.
protectionRules:
  - 동일 idempotency key는 profile에 한 번만 반영됩니다.
  - 세 번 실패한 이벤트는 정상 처리 경로에서 분리됩니다.
  - 추천 snapshot에는 생성 시각과 반영 이벤트 수가 함께 기록됩니다.
  - 같은 점수의 상품은 product ID 오름차순으로 순서를 고정합니다.
codeEvidence:
  - symbol: apply_event_to_profile
    displayPath: src/fashion_personalization/recommendation.py
    excerpt: |
      selected_size = event.payload.get("size")
      if isinstance(selected_size, str) and selected_size in product.sizes:
          _add_weight(
              profile.size_preferences, selected_size, max(weight, 0.1)
          )
    proves: 선택한 값이 실제 상품 옵션에 있을 때만 사이즈 선호에 반영해 잘못된 프로필 신호를 막습니다.
    testName: test_size_preference_contributes_to_ranking
    testPath: tests/test_recommendation_engine.py
  - symbol: rank_products
    displayPath: src/fashion_personalization/recommendation.py
    excerpt: |
      score, reasons = _score_product(profile, product)
      recommendations.append(
          Recommendation(product_id=product.product_id, score=round(score, 4), reasons=tuple(reasons))
      )
      return sorted(recommendations, key=lambda item: (-item.score, item.product_id))[:limit]
    proves: 규칙 기반 점수와 추천 이유를 함께 저장하고 같은 점수는 상품 ID로 정렬합니다. 연결한 테스트는 사용자 선호가 상위 결과와 이유에 반영되는 범위를 확인합니다.
    testName: test_personal_ranking_prioritizes_user_preferences
    testPath: tests/test_recommendation_engine.py
  - symbol: RecommendationBatchWorkflow.refresh_snapshots
    displayPath: src/fashion_personalization/batch.py
    excerpt: |
      snapshot = RecommendationSnapshot(
          generated_at=utc_now(),
          source_event_count=profile.event_count,
      )
      self.store.save_snapshot(snapshot)
    proves: Snapshot에 생성 시각과 반영 이벤트 수를 기록해 결과 최신성과 event watermark를 추적합니다.
    testName: test_batch_refresh_writes_materialized_snapshots
    testPath: tests/test_batch_workflow.py
verification:
  - layer: unit
    method: 같은 idempotency key와 세 번 실패하는 이벤트를 EventProcessor에 전달합니다.
    result: 중복은 한 번만 반영되고 반복 실패는 DLQ로 분리됩니다.
  - layer: unit
    method: 선호 브랜드, 선택 사이즈, 이벤트 입력 순서별 목표 가격과 재고 상태를 각각 ranking 테스트에 전달합니다.
    result: 선호 속성이 점수와 이유에 반영되고 품절 상품은 제외되며 가격 profile은 이벤트 입력 순서와 무관하게 같습니다.
  - layer: integration
    method: Active user를 대상으로 batch refresh와 freshness report를 실행합니다.
    result: Snapshot 2개 이상이 생성되고 stale 결과는 0건입니다.
limitations:
  - 검증 구현은 인메모리 저장소이며 PostgreSQL, SQS·EventBridge·S3와 AWS 배포는 포함하지 않았습니다.
  - 추천은 학습 모델이나 품질 벤치마크가 아닌 결정론적 비즈니스 규칙이며 동일 점수의 product ID 정렬을 직접 고정하는 전용 회귀 테스트는 아직 없습니다.
  - 코드 근거는 로컬 비공개 소스에서 확인했으며 경로와 테스트명은 확인 위치만 식별합니다. 외부 방문자가 소스나 실행 결과를 열어 재현할 수 없어 이 페이지는 case-study-only로 제공합니다.
next:
  - 저장소 adapter와 메시지 인프라를 교체 가능한 경계로 유지한 채 PostgreSQL 통합 테스트를 추가합니다.
links: {}
visual:
  kind: diagram
  alt: 행동 이벤트가 idempotency와 retry를 거쳐 개인화 profile, 추천 ranking과 snapshot으로 이어지는 구성도
seo:
  title: Fashion Personalization · 이벤트 기반 추천 Snapshot
  description: 중복과 실패 이벤트를 격리하고 사용자 profile과 추천 snapshot freshness를 검증한 Python 백엔드 프로젝트입니다.
updatedAt: 2026-07-15
---

추천 알고리즘 자체보다 행동 이벤트의 신뢰성과 snapshot 운영 경계를 중심으로 구성한 개인화 백엔드입니다.
