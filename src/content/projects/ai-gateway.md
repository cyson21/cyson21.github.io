---
order: 4
featured: false
publicationState: public
name: AI Gateway
domain: AI
eyebrow: LLM API 게이트웨이
summary: OpenAI 형식의 채팅 API에 공통 정책·캐시·대체 모델 경로를 구현한 Java WebFlux 프로젝트입니다. 가짜 provider로 요청 거절, 캐시 재사용과 대체 후보 호출 제한을 검사했습니다.
period: '2026.06'
role: 개인 프로젝트 · Java·WebFlux API와 정책 파이프라인 구현
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
    - provider 호출(기본 가짜 모델)
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
  - label: 할당량 차단
    expression: 검사 대역이 BUDGET_EXCEEDED 반환
    result: 거절 로그 1행, 선택 provider 없음
    tone: success
    source: RequestLogStoreTest.budgetExceededPathCreatesRow
    sourceUrl: >-
      https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/observability/RequestLogStoreTest.java
  - label: 캐시 재사용
    expression: 같은 요청 2번
    result: 모델 호출은 1번, 두 번째는 캐시에서 응답
    tone: warning
    source: TwoStageCacheTest.identicalRepeatHitsExactlyAndSkipsProvider
    sourceUrl: >-
      https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/cache/TwoStageCacheTest.java
  - label: 복구 범위
    expression: 재시도 한도를 다 씀
    result: 대체 후보 호출 0회, retry_budget_exhausted 반환
    tone: danger
    source: FallbackChainTest.exhaustedBudgetBlocksFallbackWithoutCallingProvider
    sourceUrl: >-
      https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
decisions:
  - title: OpenAI 호환 API 하나로
    choice: 클라이언트가 OpenAI 호환 /v1/chat/completions로 호출할 수 있도록 구현했습니다.
    alternative: 서비스마다 전용 API를 두거나 모델 SDK를 직접 붙이기
    reason: OpenAI 형식의 채팅 요청·응답을 맞춰 클라이언트 연결 지점을 단순화했습니다. OpenAI SDK의 모든 기능을 호환성 검증한 것은 아닙니다.
  - title: 정책 순서는 코드로
    choice: 인증 이후 할당량, 입력 검사, 캐시, 모델 선택·호출, 대체 모델, 출력 검사와 기록 순서를 파이프라인에 명시했습니다.
    alternative: 기능마다 WebFilter로 등록하고 순서는 설정에 맡기기
    reason: 할당량 검사가 모델 호출보다 먼저 도는지 테스트로 확인할 수 있어야 했습니다. 설정에 맡기면 순서가 바뀌어도 알기 어렵습니다.
  - title: 재시도에는 한도를
    choice: 재시도 한도와 서킷 브레이커를 거친 뒤에만 대체 모델로 넘어갑니다.
    alternative: 성공할 때까지 모델을 돌아가며 호출
    reason: 기본 모델 장애가 무제한 재시도로 이어지지 않도록 호출 횟수와 후보 범위를 제한하기 위한 선택입니다.
protectionRules:
  - 할당량이나 예산을 넘긴 요청은 모델을 부르기 전에 끝납니다.
  - 똑같은 요청이 캐시에 있으면 유사도 검색도, 모델 호출도 하지 않습니다.
  - 재시도 한도를 다 쓰면 다음 대체 모델을 부르지 않습니다.
codeEvidence:
  - symbol: GatewayPipeline.execute
    displayPath: backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    sourceUrl: >-
      https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/main/java/com/example/gateway/api/GatewayPipeline.java
    excerpt: |
      QuotaOutcome quota = quotaGuard.evaluate(request, estimatedTokens);
      if (quota != QuotaOutcome.ALLOWED) {
          return rejected(request, mode, quota, elapsed(start));
      }
    proves: 할당량 검사에서 거절되면 provider 선택 전에 반환합니다. 연결 테스트는 BUDGET_EXCEEDED를 반환하는 검사 대역으로 거절 로그와 provider 없음만 확인합니다.
    testName: RequestLogStoreTest.budgetExceededPathCreatesRow
    testPath: backend/src/test/java/com/example/gateway/observability/RequestLogStoreTest.java
    testUrl: >-
      https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/observability/RequestLogStoreTest.java
  - symbol: TwoStageCache.lookup
    displayPath: backend/src/main/java/com/example/gateway/cache/TwoStageCache.java
    sourceUrl: >-
      https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/main/java/com/example/gateway/cache/TwoStageCache.java
    excerpt: |
      if (exactLookup.hit()) {
          return exactLookup;
      }
      return semantic.lookup(request);
    proves: 똑같은 요청은 바로 캐시에서 돌려주고, 없을 때만 비슷한 질문을 찾습니다.
    testName: TwoStageCacheTest.differentlyWordedSimilarPromptFallsThroughToSemanticHit
    testPath: backend/src/test/java/com/example/gateway/cache/TwoStageCacheTest.java
    testUrl: >-
      https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/cache/TwoStageCacheTest.java
  - symbol: FallbackChain.dispatch
    displayPath: backend/src/main/java/com/example/gateway/resilience/FallbackChain.java
    sourceUrl: >-
      https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/main/java/com/example/gateway/resilience/FallbackChain.java
    excerpt: |
      lastErrorType = RETRY_BUDGET_EXHAUSTED;
      events.add(FallbackEvent.failed(
          attempt, candidate.provider(), candidate.model(), lastErrorType
      ));
      return FallbackResult.ofFailure(attempt, lastErrorType, events);
    proves: 공유 재시도 예산이 비어 있으면 대체 후보 호출을 중단하고 실패 이벤트를 반환합니다. 연결 테스트는 가짜 provider의 주 호출 1회·대체 호출 0회를 확인합니다.
    testName: FallbackChainTest.exhaustedBudgetBlocksFallbackWithoutCallingProvider
    testPath: backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
    testUrl: >-
      https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java
verification:
  - layer: unit
    method: 할당량 거절 대역, 캐시용 호출 카운터, 실패 provider와 소진된 재시도 예산을 각각 사용하는 단위 테스트입니다.
    result: 거절 로그의 provider 없음, 동일 요청 두 번의 provider 호출 1회, 소진 후 대체 후보 호출 0회를 확인했습니다.
    sources:
      - label: RequestLogStoreTest.budgetExceededPathCreatesRow
        url: >-
          https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/observability/RequestLogStoreTest.java#L160
      - label: TwoStageCacheTest.identicalRepeatHitsExactlyAndSkipsProvider
        url: >-
          https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/cache/TwoStageCacheTest.java#L68
      - label: FallbackChainTest.exhaustedBudgetBlocksFallbackWithoutCallingProvider
        url: >-
          https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java#L346
    evidenceStatus: ci-record
  - layer: integration
    method: WebTestClient와 가짜 provider로 일반 채팅·SSE 형식과 tool 정의 전달·tool_calls 반환을 검사합니다.
    result: HTTP 응답·SSE 청크와 종료 표식·도구 호출 필드가 예상 형식입니다. 실제 모델의 토큰 스트리밍이나 도구 실행 결과는 아닙니다.
    sources:
      - label: ChatCompletionControllerTest.streamingRequestReturnsServerSentChunksAndDoneSentinel
        url: >-
          https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/web/ChatCompletionControllerTest.java#L69
      - label: ToolCallPassthroughTest.toolDefinitionsPassThroughToProviderAndReturnOpenAiStyleToolCalls
        url: >-
          https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/web/ToolCallPassthroughTest.java#L31
    evidenceStatus: ci-record
  - layer: static-demo
    method: 관리 화면을 정적 파일로 빌드합니다.
    result: 고정·모의 데이터로 흐름을 보여 주는 정적 화면의 빌드·smoke가 통과했습니다. 실제 모델 호출 결과 화면으로 검증한 것은 아닙니다.
    sources:
      - label: 정적 화면 빌드·검사 workflow
        url: >-
          https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/.github/workflows/ci.yml
    evidenceStatus: ci-record
limitations:
  - 기본 실행은 테스트 모델·임베딩과 메모리 저장소입니다. 실제 OpenAI·Anthropic 호출·과금·클라우드 배포와 부하 테스트는 검증하지 않았습니다.
  - Redis Testcontainers 테스트와 운영 환경 검증은 구분합니다. PostgreSQL·pgvector의 운영 성능과 고가용성은 검증하지 않았습니다.
  - SSE는 완성된 가짜 응답을 잘라서 보내는 방식이라, 실제 모델 토큰을 실시간으로 중계한 건 아닙니다.
  - 정책·캐시·대체 모델의 단위 테스트와 OpenAI 형식의 HTTP 테스트를 확인했으며, SDK 전체 호환이나 실제 모델의 도구 실행을 보장하지 않습니다.
next:
  - 실제 모델을 붙여서 정책별 비용과 지연을 따로 재 보려고 합니다.
links:
  github: https://github.com/cyson21/ai-gateway
  design: https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/docs/portfolio-one-pager.md
  testReport: https://github.com/cyson21/ai-gateway/tree/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test
visual:
  kind: diagram
  alt: OpenAI 호환 요청이 인증, 할당량, 캐시, 모델 선택, 대체 모델을 거치는 구성도
seo:
  title: AI Gateway · 여러 서비스의 LLM 호출을 한곳에서
  description: 조직별 사용량과 캐시를 나누고, 모델 장애가 호출 폭증으로 번지지 않게 재시도를 제한한 Java WebFlux 게이트웨이입니다.
updatedAt: '2026-11-10'
evidenceReview:
  commit: 68b73923e5ab4322d0807106d5747a644a62c6f8
  sourceUrl: https://github.com/cyson21/ai-gateway/tree/68b73923e5ab4322d0807106d5747a644a62c6f8
  checkedAt: '2026-11-10'
  ciUrl: https://github.com/cyson21/ai-gateway/actions/runs/37869858667
  ciRunDate: '2026-10-09'
  scope: 해당 버전 CI의 backend 테스트 187개 통과 기록을 확인했습니다. 가짜 provider를 사용하며 실제 모델 호출·과금·SDK 전체 호환 검증이 아닙니다.
---
테스트와 기본 실행은 Java 21, Spring WebFlux, 메모리 저장소, 가짜 모델로 돌아갑니다. Redis, PostgreSQL, pgvector, 실제 모델 연동은 설정을 켜면 동작하도록 따로 분리해 두었습니다.

문서 검색·상담 챗봇·요약 기능의 공통 호출 경로를 가정한 개인 프로젝트입니다. 인증·예산 검사, 캐시, 모델 선택과 장애 시 대체 모델 호출을 한 요청 흐름으로 구현했으며, 실제 서비스 운영 사례는 아닙니다.
