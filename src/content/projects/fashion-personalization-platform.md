---
order: 6
featured: false
publicationState: public
name: Fashion Personalization Platform
domain: Backend
eyebrow: 이벤트 기반 추천 파이프라인
summary: 중복되거나 실패한 행동 이벤트가 사용자 프로필을 오염시키지 않도록 처리 상태와 재시도 범위를 분리했습니다. 상품 조건과 사용자 선호를 근거로 규칙 기반 추천 결과를 만들었습니다.
period: "2026.07"
role: 개인 프로젝트 · Python 이벤트 처리, 사용자 프로필, 규칙 기반 추천 순위, 배치 저장과 FastAPI 연결 계층 직접 구현
stack:
  - Python 3.11
  - FastAPI
  - pytest
  - 이벤트 처리
  - 배치 작업
  - 메모리 저장소
problem: 중복 이벤트나 처리 실패가 사용자 프로필을 오염시키면 추천 결과가 누적해서 잘못되고 오래된 스냅샷을 최신 결과로 오인할 수 있습니다.
responsibilities:
  - 외부 서비스 없이 실행되는 핵심 도메인·서비스와 선택형 FastAPI 연결 계층을 구현했습니다.
  - 멱등 처리, 재시도 예산, DLQ·재처리 이벤트 흐름을 구성했습니다.
  - 활성 사용자별 추천 결과를 저장하고 생성 시각과 반영 이벤트 수를 확인하는 배치 흐름을 구현했습니다.
flow:
  normal:
    - 상품 목록
    - 사용자 행동 이벤트
    - 개인화 프로필
    - 추천 순위
    - 저장된 추천 스냅샷
  failure:
    - 동일 이벤트 중복
    - 처리 3회 실패
    - 오래된 스냅샷
  recovery:
    - 멱등 키 차단
    - DLQ·새 키로 재처리
    - 이벤트 처리 기준점·최신성 리포트
signals:
  - label: 중복 처리 방지
    expression: 같은 이벤트 2회 → 프로필 반영 1회
    result: 사용자 행동 중복 반영 0건
    tone: success
    source: test_event_processing.py::test_event_ingestion_is_idempotent
    sourceUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_event_processing.py
  - label: 실패 이벤트 분리
    expression: 처리 3회 실패 → 별도 보관
    result: 정상 이벤트 처리와 분리
    tone: danger
    source: test_event_processing.py::test_unknown_product_moves_to_dead_letter_after_retry_budget
    sourceUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_event_processing.py
  - label: 추천 근거
    expression: 브랜드·사이즈·가격·재고 반영
    result: 점수와 추천 이유 함께 제공
    tone: warning
    source: test_recommendation_engine.py::test_personal_ranking_prioritizes_user_preferences
    sourceUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_recommendation_engine.py
decisions:
  - title: 외부 의존성 없는 핵심 로직
    choice: 도메인과 서비스 핵심 흐름을 외부 웹 프레임워크 없이 실행할 수 있게 유지합니다.
    alternative: FastAPI 요청 모델과 ORM을 도메인에 직접 사용
    reason: 설치 환경과 무관하게 추천·이벤트 규칙을 확인하고 HTTP 연결 계층을 교체하기 위해 선택했습니다.
  - title: 실패 이벤트 격리
    choice: 멱등 처리, 재시도 예산, DLQ와 재처리를 별도 단계로 둡니다.
    alternative: 실패 이벤트를 무제한 즉시 재실행
    reason: 반복 실패가 프로필 갱신과 정상 이벤트 처리를 오염시키지 않도록 했습니다.
  - title: 실시간 갱신과 배치 분리
    choice: 이벤트 기반 프로필 갱신과 저장된 추천 스냅샷 생성을 분리합니다.
    alternative: 모든 추천 요청에서 이벤트 전체를 다시 집계
    reason: 추천 응답 경로를 단순화하고 결과 생성 시각과 이벤트 처리 기준점을 추적하기 위해 선택했습니다.
  - title: 일관된 규칙 기반 점수
    choice: 브랜드·카테고리·태그·가격·사이즈·재고 규칙으로 점수와 이유를 만들고 동점은 상품 ID로 정렬합니다.
    alternative: 학습 모델이나 외부 추천 API로 순위를 생성
    reason: 같은 프로필과 상품 목록에서 결과를 재현하고 각 순위의 근거를 코드로 확인하기 위해 선택했습니다.
protectionRules:
  - 동일 멱등 키는 프로필에 한 번만 반영됩니다.
  - 세 번 실패한 이벤트는 정상 처리 경로에서 분리됩니다.
  - 추천 스냅샷에는 생성 시각과 반영 이벤트 수가 함께 기록됩니다.
  - 같은 점수의 상품은 상품 ID 오름차순으로 순서를 고정합니다.
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
    proves: 선택한 값이 실제 상품 옵션에 있을 때만 사이즈 선호에 반영해 잘못된 프로필 신호를 막습니다.
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
    proves: 규칙 기반 점수와 추천 이유를 함께 저장하고 같은 점수는 상품 ID로 정렬합니다. 연결한 테스트는 사용자 선호가 상위 결과와 이유에 반영되는 범위를 확인합니다.
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
    proves: 스냅샷에 생성 시각과 반영 이벤트 수를 기록해 결과 최신성과 이벤트 처리 기준점을 추적합니다.
    testName: test_batch_refresh_writes_materialized_snapshots
    testPath: tests/test_batch_workflow.py
    testUrl: https://github.com/cyson21/fashion-personalization-platform/blob/main/tests/test_batch_workflow.py
verification:
  - layer: unit
    method: 같은 멱등 키와 세 번 실패하는 이벤트를 이벤트 처리기에 전달합니다.
    result: 중복은 한 번만 반영되고 반복 실패는 DLQ로 분리됩니다.
  - layer: unit
    method: 선호 브랜드, 선택 사이즈, 이벤트 입력 순서별 목표 가격과 재고 상태를 각각 추천 순위 테스트에 전달합니다.
    result: 선호 속성이 점수와 이유에 반영되고 품절 상품은 제외되며 가격 프로필은 이벤트 입력 순서와 무관하게 같습니다.
  - layer: integration
    method: 활성 사용자를 대상으로 배치 갱신과 최신성 조회를 실행합니다.
    result: 스냅샷 2개 이상이 생성되고 지연된 결과는 0건입니다.
limitations:
  - 현재 저장소는 프로세스 메모리 구현이며 PostgreSQL, SQS·EventBridge·S3와 AWS 배포는 포함하지 않았습니다.
  - 추천은 학습 모델이나 품질 평가 결과가 아닌 고정된 비즈니스 규칙이며 동일 점수의 상품 ID 정렬을 직접 확인하는 전용 회귀 테스트는 아직 없습니다.
next:
  - 저장소 어댑터와 메시지 인프라를 교체 가능한 경계로 유지한 채 PostgreSQL 통합 테스트를 추가합니다.
links:
  github: https://github.com/cyson21/fashion-personalization-platform
  adr: https://github.com/cyson21/fashion-personalization-platform/tree/main/docs/adr
  design: https://github.com/cyson21/fashion-personalization-platform/blob/main/docs/architecture.md
visual:
  kind: diagram
  alt: 행동 이벤트가 멱등 처리와 재시도를 거쳐 개인화 프로필, 추천 순위와 스냅샷으로 이어지는 구성도
seo:
  title: Fashion Personalization · 이벤트 기반 추천 스냅샷
  description: 행동 이벤트의 중복·실패를 분리하고 상품 특성과 사용자 선호를 근거로 추천 결과를 만드는 Python 백엔드 프로젝트입니다.
updatedAt: 2026-07-19
---

행동 이벤트의 신뢰성과 스냅샷 운영 경계를 다루는 규칙 기반 개인화 백엔드입니다.
