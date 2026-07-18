---
order: 4
featured: false
publicationState: public
name: AI Gateway
domain: AI
eyebrow: LLM API 게이트웨이
summary: 여러 애플리케이션의 LLM 요청에 조직 인증, 사용량 제한, 캐시와 모델 장애 복구 정책을 한곳에서 일관되게 적용하는 게이트웨이를 구현했습니다.
period: "2026.06"
role: 개인 프로젝트 · Java WebFlux 요청 처리, 조직별 사용량·캐시 격리, 모델 선택과 제한된 장애 복구 직접 설계·구현
stack:
  - Java 21
  - Spring Boot WebFlux
  - Redis
  - PostgreSQL
  - pgvector
  - Testcontainers
problem: LLM 기능을 여러 애플리케이션에 붙이면 외부 모델 연동, 장애 대응, 토큰·비용 예산, 캐시와 요청 기록이 서비스마다 중복됩니다.
responsibilities:
  - OpenAI 호환 게이트웨이 API와 인증 뒤 공통 정책이 적용되는 요청 처리 순서를 구현했습니다.
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
  - label: 비용 보호
    expression: 사용량 초과 → 모델 호출 0회
    result: 외부 호출 전에 요청 차단
    tone: success
    source: backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
  - label: 캐시 재사용
    expression: 같은 요청 2회 → 모델 호출 1회
    result: 두 번째 요청은 정확 일치 캐시 사용
    tone: warning
    source: TwoStageCacheTest.identicalRepeatHitsExactlyAndSkipsProvider
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/cache/TwoStageCacheTest.java
  - label: 복구 범위
    expression: 재시도 예산 0 → 추가 호출 0회
    result: 후보 전환 중단과 실패 사유 기록
    tone: danger
    source: FallbackChainTest.exhaustedBudgetBlocksFallbackWithoutCallingProvider
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
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
    result: 정책 적용 순서와 외부 모델 호출 여부가 예상한 조건대로 유지됩니다.
  - layer: integration
    method: WebFlux API에서 JSON과 SSE 요청을 분리해 호출합니다.
    result: 일괄, 스트리밍과 도구 호출 응답 인터페이스가 유지됩니다.
  - layer: static-demo
    method: 고정 입력을 사용하는 운영 콘솔을 정적 파일로 빌드합니다.
    result: 요청 흐름과 라우팅 결과를 서버 없이 탐색할 수 있습니다.
limitations:
  - 기본 실행은 고정 응답 모델과 메모리 저장소를 사용하며 실제 외부 모델 호출, 운영 저장소와 클라우드 배포는 포함하지 않았습니다.
  - API 키 인증은 요청 처리 흐름 앞의 WebFilter에서 수행합니다.
  - SSE는 완료된 고정 응답을 조각으로 나눈 방식이며 실제 외부 모델 토큰을 실시간 중계한 결과가 아닙니다.
next:
  - 실제 외부 모델을 선택적으로 연결하고 정책별 비용·지연 데이터를 분리해 측정합니다.
links:
  github: https://github.com/cyson21/ai-gateway
  design: https://github.com/cyson21/ai-gateway/blob/main/docs/portfolio-one-pager.md
  testReport: https://github.com/cyson21/ai-gateway/tree/main/backend/src/test
visual:
  kind: diagram
  alt: OpenAI 호환 요청이 인증, 비용 보호, 캐시, 라우팅과 제한된 폴백을 통과하는 AI Gateway 구성도
seo:
  title: AI Gateway · LLM 정책과 제한된 복구
  description: 조직별 사용량과 캐시를 분리하고 모델 장애가 호출 폭증으로 이어지지 않도록 복구 범위를 제한한 Java WebFlux 프로젝트입니다.
updatedAt: 2026-07-19
---

애플리케이션마다 중복되는 LLM 호출 정책과 장애 대응을 공통 경계로 모은 Gateway 프로젝트입니다.
