---
order: 4
featured: false
publicationState: public
name: AI Gateway
domain: AI
eyebrow: LLM platform boundary
summary: OpenAI 호환 WebFlux 진입점 뒤에 quota, 입·출력 guardrail, cache, routing, dispatch, 제한된 fallback과 기록의 8단계 처리 순서를 구성했습니다.
period: "2026.06"
role: 개인 프로젝트 · Java WebFlux 요청 pipeline, 인증·비용 보호·cache·routing·복구와 정적 콘솔 직접 설계·구현
stack:
  - Java 21
  - Spring Boot WebFlux
  - Redis
  - PostgreSQL
  - pgvector
  - Testcontainers
problem: LLM 기능을 여러 애플리케이션에 붙이면 provider SDK, 장애 대응, 토큰·비용 예산, 캐시와 요청 관측이 서비스마다 중복됩니다.
responsibilities:
  - OpenAI 호환 Gateway API와 quota → input guardrail → cache → route → dispatch → fallback → output guardrail → record의 8단계 pipeline을 구현했습니다.
  - Exact·semantic cache, quota, routing, retry budget, circuit breaker와 fallback 경계를 구성했습니다.
  - Buffered JSON, SSE streaming, tool call과 정적 운영 콘솔을 테스트했습니다.
flow:
  normal:
    - API key 인증·tenant 확인 (pipeline 전)
    - Quota
    - Input guardrail
    - Exact·Semantic cache
    - Policy routing
    - Provider dispatch
    - Bounded fallback
    - Output guardrail
    - Request record
  failure:
    - Tenant quota 초과
    - Primary provider 실패
    - Retry budget 소진
  recovery:
    - Provider 호출 전 차단
    - Circuit breaker
    - Bounded fallback chain
signals:
  - label: Policy pipeline
    expression: 8 ordered stages
    result: quota → input guard → cache → route → dispatch → fallback → output guard → record
    tone: success
    source: backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
  - label: Pipeline modes
    expression: 4 modes
    result: passthrough · cache only · routed · routed resilient
    tone: warning
    source: backend/src/main/java/com/example/gateway/api/PipelineMode.java
  - label: Response interface
    expression: JSON + SSE
    result: buffered · streaming · tool call
    tone: danger
    source: ChatCompletionControllerTest · ToolCallPassthroughTest
decisions:
  - title: Compatible entry
    choice: OpenAI 호환 /v1/chat/completions를 공통 진입점으로 사용합니다.
    alternative: 애플리케이션별 전용 API와 provider SDK 직접 연결
    reason: 호출부 변경을 줄이고 정책을 Gateway 경계에서 일관되게 적용하기 위해 선택했습니다.
  - title: Ordered policy pipeline
    choice: 인증 뒤 quota·input guardrail·cache·route·dispatch·fallback·output guardrail·record 순서를 코드로 고정합니다.
    alternative: 각 기능을 독립 WebFilter로 등록해 순서를 런타임 구성에 의존
    reason: provider 호출 전 비용 보호와 실패 기록의 선후 관계를 테스트할 수 있도록 했습니다.
  - title: Bounded resilience
    choice: Retry budget과 circuit breaker 뒤에 제한된 fallback chain을 둡니다.
    alternative: 성공할 때까지 provider를 순환 호출
    reason: 장애가 호출 폭증과 비용 증가로 확대되는 것을 막기 위해 복구 범위를 제한했습니다.
protectionRules:
  - Quota 또는 budget을 초과한 요청은 provider 호출 전에 종료됩니다.
  - Exact cache가 적중하면 semantic 검색과 provider 호출을 실행하지 않습니다.
  - Retry budget을 소진하면 다음 fallback provider를 호출하지 않습니다.
codeEvidence:
  - symbol: GatewayPipeline.execute
    displayPath: backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    excerpt: |
      QuotaOutcome quota = quotaGuard.evaluate(request, estimatedTokens);
      if (quota != QuotaOutcome.ALLOWED) {
          return rejected(request, mode, quota, elapsed(start));
      }
    proves: 예상 토큰으로 tenant 할당량을 먼저 검사해 초과 요청을 provider 호출 전에 종료합니다.
    testName: RequestLogStoreTest.quotaRejectPathCreatesRowWithNullProviderAndOutcome
    testPath: backend/src/test/java/com/example/gateway/observability/RequestLogStoreTest.java
    testUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/observability/RequestLogStoreTest.java
  - symbol: TwoStageCache.lookup
    displayPath: backend/src/main/java/com/example/gateway/cache/TwoStageCache.java
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/main/java/com/example/gateway/cache/TwoStageCache.java
    excerpt: |
      if (exactLookup.hit()) {
          return exactLookup;
      }
      return semantic.lookup(request);
    proves: 동일 요청은 exact cache에서 반환하고 miss일 때만 semantic cache로 확장합니다.
    testName: TwoStageCacheTest.differentlyWordedSimilarPromptFallsThroughToSemanticHit
    testPath: backend/src/test/java/com/example/gateway/cache/TwoStageCacheTest.java
    testUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/cache/TwoStageCacheTest.java
  - symbol: FallbackChain.dispatch
    displayPath: backend/src/main/java/com/example/gateway/resilience/FallbackChain.java
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/main/java/com/example/gateway/resilience/FallbackChain.java
    excerpt: |
      lastErrorType = RETRY_BUDGET_EXHAUSTED;
      events.add(FallbackEvent.failed(
          attempt, candidate.provider(), candidate.model(), lastErrorType
      ));
      return FallbackResult.ofFailure(attempt, lastErrorType, events);
    proves: 재시도 예산이 소진되면 다음 provider 호출을 차단하고 관측 가능한 실패 이벤트를 남깁니다.
    testName: FallbackChainTest.exhaustedBudgetBlocksFallbackWithoutCallingProvider
    testPath: backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
    testUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
verification:
  - layer: unit
    method: Quota·cache·routing·fallback을 고정 응답 provider로 각각 실행합니다.
    result: 정책 순서와 provider 호출 여부가 테스트 assertion으로 고정됩니다.
  - layer: integration
    method: WebFlux API에서 JSON과 SSE 요청을 분리해 호출합니다.
    result: Buffered, streaming과 tool-call 응답 인터페이스가 유지됩니다.
  - layer: static-demo
    method: 고정 fixture를 사용하는 운영 콘솔 정적 빌드를 검증합니다.
    result: 요청 흐름과 라우팅 결과를 서버 없이 탐색할 수 있습니다.
limitations:
  - 기본 검증은 고정 응답 provider와 메모리 저장소이며 실제 provider 전송, 운영 저장소와 클라우드 배포는 포함하지 않았습니다.
  - API key 인증은 8단계 pipeline 앞의 WebFilter에서 수행되며 pipeline 단계 수에 포함하지 않습니다.
  - SSE는 완료된 고정 응답을 chunk로 투영한 인터페이스 검증이며 실제 provider 토큰을 실시간 중계한 결과가 아닙니다.
next:
  - 실제 provider를 opt-in 경로로 연결하고 정책별 비용·지연 데이터를 분리해 측정합니다.
links:
  github: https://github.com/cyson21/ai-gateway
  adr: https://github.com/cyson21/ai-gateway/tree/main/docs/adr
  testReport: https://github.com/cyson21/ai-gateway/tree/main/backend/src/test
visual:
  kind: diagram
  alt: OpenAI 호환 요청이 인증, 비용 보호, 캐시, 라우팅과 제한된 폴백을 통과하는 AI Gateway 구성도
seo:
  title: AI Gateway · LLM 정책과 제한된 복구
  description: OpenAI 호환 API에 비용 보호, 캐시, 정책 라우팅과 제한된 폴백을 구성한 Java WebFlux 프로젝트입니다.
updatedAt: 2026-07-15
---

애플리케이션마다 중복되는 LLM 호출 정책과 장애 대응을 공통 경계로 모은 Gateway 프로젝트입니다.
