---
order: 4
featured: false
publicationState: public
name: AI Gateway
domain: AI
eyebrow: LLM API 게이트웨이
summary: 서비스마다 LLM을 붙일 때 반복되는 인증, 사용량 제한, 캐시, 장애 대응을 게이트웨이 한곳에 모았습니다. 모델이 죽었을 때 끝없이 재시도하지 않도록 복구 범위도 제한했습니다.
period: "2026.06"
role: 개인 프로젝트 · 설계부터 구현, 테스트까지 혼자 진행
stack:
  - Java 21
  - Spring Boot WebFlux
  - Redis
  - PostgreSQL
  - pgvector
  - Testcontainers
problem: LLM 기능을 여러 서비스에 붙이면 모델 연동, 장애 대응, 토큰 예산, 캐시, 호출 기록을 서비스마다 따로 만들게 됩니다.
responsibilities:
  - OpenAI 호환 API를 만들고, 인증 뒤에 공통 정책이 정해진 순서대로 돌게 했습니다.
  - 캐시(똑같은 요청, 비슷한 질문), 할당량, 모델 선택, 재시도 한도, 서킷 브레이커, 대체 모델 전환을 넣었습니다.
  - 일반 응답, SSE 스트리밍, 도구 호출, 관리 화면까지 테스트했습니다.
flow:
  normal:
    - API 키 인증, 조직 확인
    - 할당량 검사
    - 입력 검사
    - 캐시 조회
    - 모델 선택
    - 외부 모델 호출
    - 실패하면 대체 모델
    - 출력 검사
    - 요청 기록
  failure:
    - 조직 할당량 초과
    - 기본 모델 장애
    - 재시도 한도 소진
  recovery:
    - 모델 호출 전에 거절
    - 서킷 브레이커
    - 대체 모델은 정해진 횟수까지만
signals:
  - label: 비용 보호
    expression: 할당량 넘긴 요청
    result: 모델을 부르지 않고 거절
    tone: success
    source: backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
  - label: 캐시 재사용
    expression: 같은 요청 2번
    result: 모델 호출은 1번, 두 번째는 캐시에서 응답
    tone: warning
    source: TwoStageCacheTest.identicalRepeatHitsExactlyAndSkipsProvider
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/cache/TwoStageCacheTest.java
  - label: 복구 범위
    expression: 재시도 한도를 다 씀
    result: 다른 모델로 넘어가지 않고 실패 이유를 기록
    tone: danger
    source: FallbackChainTest.exhaustedBudgetBlocksFallbackWithoutCallingProvider
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
decisions:
  - title: OpenAI 호환 API 하나로
    choice: 모든 서비스가 OpenAI 호환 /v1/chat/completions로 호출합니다.
    alternative: 서비스마다 전용 API를 두거나 모델 SDK를 직접 붙이기
    reason: 이미 OpenAI SDK를 쓰는 코드는 주소만 바꾸면 되고, 정책은 게이트웨이에서 한 번에 적용됩니다.
  - title: 정책 순서는 코드로
    choice: 인증 뒤 할당량, 입력 검사, 캐시, 모델 선택, 호출, 대체 모델, 출력 검사, 기록 순서를 코드에 박아 두었습니다.
    alternative: 기능마다 WebFilter로 등록하고 순서는 설정에 맡기기
    reason: 할당량 검사가 모델 호출보다 먼저 도는지 테스트로 확인할 수 있어야 했습니다. 설정에 맡기면 순서가 바뀌어도 알기 어렵습니다.
  - title: 재시도에는 한도를
    choice: 재시도 한도와 서킷 브레이커를 거친 뒤에만 대체 모델로 넘어갑니다.
    alternative: 성공할 때까지 모델을 돌아가며 호출
    reason: 모델 하나가 죽었을 때 무작정 재시도하면 호출 수와 비용이 같이 폭증합니다.
protectionRules:
  - 할당량이나 예산을 넘긴 요청은 모델을 부르기 전에 끝납니다.
  - 똑같은 요청이 캐시에 있으면 유사도 검색도, 모델 호출도 하지 않습니다.
  - 재시도 한도를 다 쓰면 다음 대체 모델을 부르지 않습니다.
codeEvidence:
  - symbol: GatewayPipeline.execute
    displayPath: backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    sourceUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    excerpt: |
      QuotaOutcome quota = quotaGuard.evaluate(request, estimatedTokens);
      if (quota != QuotaOutcome.ALLOWED) {
          return rejected(request, mode, quota, elapsed(start));
      }
    proves: 예상 토큰으로 조직 할당량부터 확인하고, 넘으면 모델을 부르기 전에 끝냅니다.
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
    proves: 똑같은 요청은 바로 캐시에서 돌려주고, 없을 때만 비슷한 질문을 찾습니다.
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
    proves: 재시도 한도를 다 쓰면 다음 모델을 부르지 않고 실패 이벤트를 남깁니다.
    testName: FallbackChainTest.exhaustedBudgetBlocksFallbackWithoutCallingProvider
    testPath: backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
    testUrl: https://github.com/cyson21/ai-gateway/blob/main/backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
verification:
  - layer: unit
    method: 할당량, 캐시, 모델 선택, 대체 모델을 가짜 모델로 하나씩 돌려 봅니다.
    result: 정책 순서와 모델 호출 여부가 예상대로 나옵니다.
  - layer: integration
    method: WebFlux API로 일반 요청과 SSE 요청을 각각 보냅니다.
    result: 일반, 스트리밍, 도구 호출 응답 형식이 맞게 나옵니다.
  - layer: static-demo
    method: 관리 화면을 정적 파일로 빌드합니다.
    result: 서버 없이도 요청 흐름과 모델 선택 결과를 둘러볼 수 있습니다.
limitations:
  - 기본 실행은 가짜 모델과 메모리 저장소입니다. 실제 모델 호출과 클라우드 배포는 해 보지 않았습니다.
  - API 키 인증은 파이프라인 앞의 WebFilter에서 합니다.
  - SSE는 완성된 가짜 응답을 잘라서 보내는 방식이라, 실제 모델 토큰을 실시간으로 중계한 건 아닙니다.
next:
  - 실제 모델을 붙여서 정책별 비용과 지연을 따로 재 보려고 합니다.
links:
  github: https://github.com/cyson21/ai-gateway
  design: https://github.com/cyson21/ai-gateway/blob/main/docs/portfolio-one-pager.md
  testReport: https://github.com/cyson21/ai-gateway/tree/main/backend/src/test
visual:
  kind: diagram
  alt: OpenAI 호환 요청이 인증, 할당량, 캐시, 모델 선택, 대체 모델을 거치는 구성도
seo:
  title: AI Gateway · 여러 서비스의 LLM 호출을 한곳에서
  description: 조직별 사용량과 캐시를 나누고, 모델 장애가 호출 폭증으로 번지지 않게 재시도를 제한한 Java WebFlux 게이트웨이입니다.
updatedAt: 2026-09-23
---
테스트와 기본 실행은 Java 21, Spring WebFlux, 메모리 저장소, 가짜 모델로 돌아갑니다. Redis, PostgreSQL, pgvector, 실제 모델 연동은 설정을 켜면 동작하도록 따로 분리해 두었습니다.

서비스마다 따로 만들던 LLM 호출 정책을 게이트웨이 하나로 모은 프로젝트입니다.
