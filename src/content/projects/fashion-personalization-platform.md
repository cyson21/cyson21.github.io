---
order: 6
featured: false
publicationState: public
name: Fashion Personalization Platform
domain: Backend
eyebrow: 이벤트 기반 추천 파이프라인
summary: 사용자 행동 이벤트로 상품을 추천하는 백엔드입니다. 같은 이벤트가 두 번 오거나 처리에 실패해도 사용자 취향 데이터가 틀어지지 않게 했고, 추천마다 이유를 함께 보여 줍니다.
period: "2026.07"
role: 개인 프로젝트 · 설계부터 구현, 테스트까지 혼자 진행
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
  - 활성 사용자별 추천 결과를 배치로 미리 만들어 두고, 언제 만들었는지와 이벤트를 몇 건 반영했는지 같이 남깁니다.
flow:
  normal:
    - 상품 목록
    - 사용자 행동 이벤트
    - 사용자 취향 데이터
    - 추천 순위
    - 미리 만든 추천 결과
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
    expression: 같은 이벤트 2번
    result: 취향 데이터에는 1번만 반영
    tone: success
    source: test_event_processing.py::test_event_ingestion_is_idempotent
    sourceUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_event_processing.py
  - label: 실패 이벤트 분리
    expression: 처리 3번 실패
    result: DLQ로 빠지고 나머지 이벤트는 계속 처리
    tone: danger
    source: test_event_processing.py::test_unknown_product_moves_to_dead_letter_after_retry_budget
    sourceUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_event_processing.py
  - label: 추천 근거
    expression: 브랜드, 사이즈, 가격, 재고
    result: 점수와 추천 이유가 같이 나옴
    tone: warning
    source: test_recommendation_engine.py::test_personal_ranking_prioritizes_user_preferences
    sourceUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_recommendation_engine.py
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
    reason: 추천 API는 저장된 결과만 읽으면 되니 단순해지고, 결과가 언제 기준인지도 알 수 있습니다.
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
    sourceUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/src/fashion_personalization/recommendation.py
    excerpt: |
      selected_size = event.payload.get("size")
      if isinstance(selected_size, str) and selected_size in product.sizes:
          _add_weight(
              profile.size_preferences, selected_size, max(weight, 0.1)
          )
    proves: 실제로 있는 사이즈 옵션을 골랐을 때만 사이즈 취향에 반영해서, 잘못된 값이 섞이지 않게 합니다.
    testName: test_size_preference_contributes_to_ranking
    testPath: tests/test_recommendation_engine.py
    testUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_recommendation_engine.py
  - symbol: rank_products
    displayPath: src/fashion_personalization/recommendation.py
    sourceUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/src/fashion_personalization/recommendation.py
    excerpt: |
      score, reasons = _score_product(profile, product)
      recommendations.append(
          Recommendation(product_id=product.product_id, score=round(score, 4), reasons=tuple(reasons))
      )
      return sorted(recommendations, key=lambda item: (-item.score, item.product_id))[:limit]
    proves: 점수와 추천 이유를 같이 저장하고, 같은 점수는 상품 ID로 정렬합니다. 테스트는 사용자 취향이 상위 결과와 이유에 반영되는지 확인합니다.
    testName: test_personal_ranking_prioritizes_user_preferences
    testPath: tests/test_recommendation_engine.py
    testUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_recommendation_engine.py
  - symbol: RecommendationBatchWorkflow.refresh_snapshots
    displayPath: src/fashion_personalization/batch.py
    sourceUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/src/fashion_personalization/batch.py
    excerpt: |
      snapshot = RecommendationSnapshot(
          generated_at=utc_now(),
          source_event_count=profile.event_count,
      )
      self.store.save_snapshot(snapshot)
    proves: 추천 결과에 생성 시각과 반영 이벤트 수를 남겨서 얼마나 최신인지 알 수 있게 합니다.
    testName: test_batch_refresh_writes_materialized_snapshots
    testPath: tests/test_batch_workflow.py
    testUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_batch_workflow.py
verification:
  - layer: unit
    method: 같은 멱등 키 이벤트와 세 번 실패하는 이벤트를 넣습니다.
    result: 중복은 한 번만 반영되고, 실패한 이벤트는 DLQ로 빠집니다.
  - layer: unit
    method: 선호 브랜드, 사이즈, 가격, 재고 조건을 바꿔 가며 추천 순위를 확인합니다.
    result: 취향이 점수와 이유에 반영되고, 품절 상품은 빠지고, 이벤트 순서가 달라도 가격 취향은 같게 나옵니다.
  - layer: integration
    method: 활성 사용자 대상으로 배치를 돌리고 최신 여부를 조회합니다.
    result: 추천 결과가 2개 이상 만들어지고, 오래된 결과는 없습니다.
limitations:
  - 저장소는 메모리 구현이고, PostgreSQL, SQS, S3 같은 실제 인프라와 AWS 배포는 해 보지 않았습니다.
  - 추천은 정해 둔 규칙일 뿐 머신러닝이 아니고, 추천 품질을 평가하지도 않았습니다. 같은 점수일 때 ID 순서로 나오는지 직접 확인하는 테스트도 아직 없습니다.
next:
  - PostgreSQL 어댑터를 붙이고 통합 테스트를 추가하려고 합니다.
links:
  github: https://github.com/cyson21/fashion-personalization-platform
  adr: https://github.com/cyson21/fashion-personalization-platform/tree/main/docs/adr
  design: https://github.com/cyson21/fashion-personalization-platform/blob/main/docs/architecture.md
visual:
  kind: diagram
  alt: 행동 이벤트가 중복 확인과 재시도를 거쳐 취향 데이터, 추천 순위, 저장된 추천 결과로 이어지는 구성도
seo:
  title: Fashion Personalization · 행동 이벤트 기반 추천
  description: 중복되거나 실패한 행동 이벤트를 걸러 내고, 상품 조건과 사용자 취향으로 이유가 붙은 추천을 만드는 Python 백엔드입니다.
updatedAt: 2026-09-23
---
클릭 이벤트가 중복되거나 실패해도 추천이 엇나가지 않게 만든 규칙 기반 추천 백엔드입니다.
