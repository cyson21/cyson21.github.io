---
order: 4
featured: false
publicationState: public
name: AI Gateway
domain: AI
eyebrow: LLM 플랫폼 경계
summary: OpenAI 호환 WebFlux 진입점 뒤에 할당량 검사, 입·출력 검증, 캐시, 라우팅, 제한된 복구와 기록을 정해진 순서로 적용했습니다.
period: "2026.06"
role: 개인 프로젝트 · Java WebFlux 요청 처리, 인증·비용 보호·캐시·라우팅·복구와 정적 콘솔 직접 설계·구현
stack:
  - Java 21
  - Spring Boot WebFlux
  - Redis
  - PostgreSQL
  - pgvector
  - Testcontainers
problem: LLM 기능을 여러 애플리케이션에 붙이면 외부 모델 SDK, 장애 대응, 토큰·비용 예산, 캐시와 요청 기록이 서비스마다 중복됩니다.
responsibilities:
  - OpenAI 호환 게이트웨이 API와 할당량 → 입력 검사 → 캐시 → 라우팅 → 호출 → 대체 경로 → 출력 검사 → 기록의 8단계 처리를 구현했습니다.
  - 정확 일치·의미 유사도 캐시, 할당량, 라우팅, 재시도 예산, 회로 차단과 대체 경로를 구성했습니다.
  - JSON 일괄 응답, SSE 스트리밍, 도구 호출과 정적 운영 콘솔을 테스트했습니다.
flow:
  normal:
    - API 키 인증·사용자 조직 확인
    - 할당량 검사
    - 입력 검사
    - 정확 일치·의미 유사도 캐시
    - 정책 라우팅
    - 외부 모델 호출
    - 제한된 대체 경로
    - 출력 검사
    - 요청 기록
  failure:
    - 사용자 조직 할당량 초과
    - 우선 외부 모델 실패
    - 재시도 예산 소진
  recovery:
    - 외부 모델 호출 전 차단
    - 회로 차단
    - 제한된 대체 경로
signals:
  - label: 정책 적용 순서
    expression: 순서가 고정된 8단계
    result: 할당량 → 입력 검사 → 캐시 → 라우팅 → 호출 → 대체 경로 → 출력 검사 → 기록
    tone: success
    source: backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
  - label: 실행 방식
    expression: 4개 방식
    result: 그대로 전달 · 캐시만 사용 · 라우팅 · 복구 포함 라우팅
    tone: warning
    source: backend/src/main/java/com/example/gateway/api/PipelineMode.java
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/main/java/com/example/gateway/api/PipelineMode.java
  - label: 응답 인터페이스
    expression: JSON + SSE
    result: 일괄 · 스트리밍 · 도구 호출
    tone: danger
    source: ChatCompletionControllerTest · ToolCallPassthroughTest
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/web/ChatCompletionControllerTest.java
decisions:
  - title: 공통 호환 API
    choice: OpenAI 호환 /v1/chat/completions를 공통 진입점으로 사용합니다.
    alternative: 애플리케이션별 전용 API와 외부 모델 SDK 직접 연결
    reason: 호출부 변경을 줄이고 정책을 게이트웨이 경계에서 일관되게 적용하기 위해 선택했습니다.
  - title: 고정된 정책 순서
    choice: 인증 뒤 할당량·입력 검사·캐시·라우팅·호출·대체 경로·출력 검사·기록 순서를 코드로 고정합니다.
    alternative: 각 기능을 독립 WebFilter로 등록해 순서를 런타임 구성에 의존
    reason: 외부 모델 호출 전 비용 보호와 실패 기록의 선후 관계를 테스트할 수 있도록 했습니다.
  - title: 제한된 복구
    choice: 재시도 예산과 회로 차단 뒤에 제한된 대체 경로를 둡니다.
    alternative: 성공할 때까지 외부 모델을 순환 호출
    reason: 장애가 호출 폭증과 비용 증가로 확대되는 것을 막기 위해 복구 범위를 제한했습니다.
protectionRules:
  - 할당량 또는 예산을 초과한 요청은 외부 모델 호출 전에 종료됩니다.
  - 정확 일치 캐시가 적중하면 의미 유사도 검색과 외부 모델 호출을 실행하지 않습니다.
  - 재시도 예산을 소진하면 다음 대체 외부 모델을 호출하지 않습니다.
codeEvidence:
  - symbol: GatewayPipeline.execute
    displayPath: backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    excerpt: |
      QuotaOutcome quota = quotaGuard.evaluate(request, estimatedTokens);
      if (quota != QuotaOutcome.ALLOWED) {
          return rejected(request, mode, quota, elapsed(start));
      }
    proves: 예상 토큰으로 사용자 조직의 할당량을 먼저 검사해 초과 요청을 외부 모델 호출 전에 종료합니다.
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
    proves: 동일 요청은 정확 일치 캐시에서 반환하고 결과가 없을 때만 의미 유사도 캐시로 확장합니다.
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
    proves: 재시도 예산이 소진되면 다음 외부 모델 호출을 차단하고 추적 가능한 실패 이벤트를 남깁니다.
    testName: FallbackChainTest.exhaustedBudgetBlocksFallbackWithoutCallingProvider
    testPath: backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
    testUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
verification:
  - layer: unit
    method: 할당량·캐시·라우팅·대체 경로를 고정 응답 외부 모델로 각각 실행합니다.
    result: 정책 순서와 외부 모델 호출 여부가 테스트 검증값으로 고정됩니다.
  - layer: integration
    method: WebFlux API에서 JSON과 SSE 요청을 분리해 호출합니다.
    result: 일괄, 스트리밍과 도구 호출 응답 인터페이스가 유지됩니다.
  - layer: static-demo
    method: 고정 입력을 사용하는 운영 콘솔 정적 빌드를 검증합니다.
    result: 요청 흐름과 라우팅 결과를 서버 없이 탐색할 수 있습니다.
limitations:
  - 기본 검증은 고정 응답 외부 모델과 메모리 저장소이며 실제 모델 전송, 운영 저장소와 클라우드 배포는 포함하지 않았습니다.
  - API 키 인증은 8단계 요청 처리 앞의 WebFilter에서 수행되며 처리 단계 수에 포함하지 않습니다.
  - SSE는 완료된 고정 응답을 조각으로 나눈 인터페이스 검증이며 실제 외부 모델 토큰을 실시간 중계한 결과가 아닙니다.
next:
  - 실제 provider를 opt-in 경로로 연결하고 정책별 비용·지연 데이터를 분리해 측정합니다.
links:
  github: https://github.com/cyson21/ai-gateway
  design: https://github.com/cyson21/ai-gateway/blob/main/docs/portfolio-one-pager.md
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
