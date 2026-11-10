# 개인 프로젝트 근거 대조 · 2026-11-10

공개 설명을 아래 커밋의 코드·테스트 및 해당 CI 원본 로그와 대조했다. Python은 별도 가상환경(Python 3.13)에서 Fashion 45개, RAG 비-PostgreSQL 121개를 재실행했다. RAG PostgreSQL 3개와 Java 프로젝트는 해당 버전 CI 기록을 사용했으며 이번 로컬 환경에서 전체 인프라를 다시 구동한 결과로 표현하지 않는다.

코드 발췌 18개·검증 행 19개·연결 소스 참조 81개를 점검했다. 자료 링크는 검토한 커밋에 고정하고, 각 결과 행에 명시적인 근거와 확인 방식을 넣었다. 파일/함수 존재 검사는 의미적 보장의 자동 증명이 아니므로 아래 수동 대조 범위를 함께 기록한다.

## AI Gateway

- [검토 소스](https://github.com/cyson21/ai-gateway/tree/68b73923e5ab4322d0807106d5747a644a62c6f8) · [CI 기록](https://github.com/cyson21/ai-gateway/actions/runs/37869858667)
- 가짜 provider·할당량 검사 대역·형식 테스트를 실제 과금 방지·SDK 전체 호환·토큰 스트리밍과 구분.
- 해당 버전 CI의 backend 테스트 187개 통과 기록을 확인했습니다. 가짜 provider를 사용하며 실제 모델 호출·과금·SDK 전체 호환 검증이 아닙니다.

| 확인 조건·방법 | 결과 | 근거 |
|---|---|---|
| 할당량 거절 대역, 캐시용 호출 카운터, 실패 provider와 소진된 재시도 예산을 각각 사용하는 단위 테스트입니다. | 거절 로그의 provider 없음, 동일 요청 두 번의 provider 호출 1회, 소진 후 대체 후보 호출 0회를 확인했습니다. | [RequestLogStoreTest.budgetExceededPathCreatesRow](https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/observability/RequestLogStoreTest.java#L160)<br>[TwoStageCacheTest.identicalRepeatHitsExactlyAndSkipsProvider](https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/cache/TwoStageCacheTest.java#L68)<br>[FallbackChainTest.exhaustedBudgetBlocksFallbackWithoutCallingProvider](https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/resilience/FallbackChainTest.java#L346) |
| WebTestClient와 가짜 provider로 일반 채팅·SSE 형식과 tool 정의 전달·tool_calls 반환을 검사합니다. | HTTP 응답·SSE 청크와 종료 표식·도구 호출 필드가 예상 형식입니다. 실제 모델의 토큰 스트리밍이나 도구 실행 결과는 아닙니다. | [ChatCompletionControllerTest.streamingRequestReturnsServerSentChunksAndDoneSentinel](https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/web/ChatCompletionControllerTest.java#L69)<br>[ToolCallPassthroughTest.toolDefinitionsPassThroughToProviderAndReturnOpenAiStyleToolCalls](https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/backend/src/test/java/com/example/gateway/web/ToolCallPassthroughTest.java#L31) |
| 관리 화면을 정적 파일로 빌드합니다. | 고정·모의 데이터로 흐름을 보여 주는 정적 화면의 빌드·smoke가 통과했습니다. 실제 모델 호출 결과 화면으로 검증한 것은 아닙니다. | [정적 화면 빌드·검사 workflow](https://github.com/cyson21/ai-gateway/blob/68b73923e5ab4322d0807106d5747a644a62c6f8/.github/workflows/ci.yml) |

## CDC Data Platform

- [검토 소스](https://github.com/cyson21/cdc-data-platform/tree/4523561b8ddac7ccd01f493952bd3e08018374ce) · [CI 기록](https://github.com/cyson21/cdc-data-platform/actions/runs/37869868595)
- DB 상태 변경과 DTO 반환을 Kafka 재발행·sink 복구로 표현하지 않음. 별도 PostgreSQL·EmbeddedKafka 테스트의 재시도 발행·수신은 인정. 실제 변경 캡처는 스크립트 정의만 확인. fixture 출력은 실환경 실행 증거에서 제외. 독립 구성요소 도식의 연결 화살표 제거.
- CI의 PostgreSQL 저장소·서비스 테스트와 EmbeddedKafka 재시도 발행·수신 테스트를 확인했습니다. 실제 Debezium 변경 캡처는 스크립트 정의만 확인했으며 fixture 출력으로 실캡처 성공을 주장하지 않습니다.

| 확인 조건·방법 | 결과 | 근거 |
|---|---|---|
| PostgreSQL Testcontainers에서 같은 원천 이벤트를 처리 이력 저장소에 두 번 등록합니다. | 첫 등록은 성공하고 두 번째는 거절되며 DB 행은 1건입니다. | [CdcEventLedgerRepositoryTest.insertIfAbsentReturnsFalseForDuplicateSourceEvent](https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/ledger/CdcEventLedgerRepositoryTest.java#L42) |
| cdc-smoke applicant-change-capture는 PostgreSQL 변경과 Kafka raw 이벤트의 종류·LSN·오프셋을 점검하도록 작성된 실행 스크립트입니다. | 이번 대조에서는 실제 Debezium·Kafka 변경 캡처의 실행 증거를 확인하지 못했습니다. CI의 fixture 대역 테스트 출력은 실제 캡처 성공으로 세지 않았습니다. | [applicant_change_capture 실행 스크립트](https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/tools/runner/cdc-smoke) |
| DB 재처리 테스트는 처리 이력·DLQ 행을 직접 준비합니다. 별도 KafkaRetryEventPublisher 테스트는 PostgreSQL과 EmbeddedKafka로 재시도 이벤트를 발행·수신합니다. | DB 테스트는 원천 메타데이터·반환 목록 1건·상태를 확인했습니다. 별도 Kafka 테스트는 브로커의 키·payload·오프셋과 DB PUBLISHED·시도 횟수 1을 확인했습니다. 실제 sink 장애부터 재적재까지 복구한 결과는 아닙니다. | [SinkFailureReplayFlowTest.sinkFailureReplayFlowKeepsSourceMetadataIdempotency](https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/resilience/SinkFailureReplayFlowTest.java#L65)<br>[KafkaRetryEventPublisherTest.publishesReadyRetryEventToKafkaBeforeMarkingPublished](https://github.com/cyson21/cdc-data-platform/blob/4523561b8ddac7ccd01f493952bd3e08018374ce/backend/src/test/java/com/example/cdcplatform/resilience/KafkaRetryEventPublisherTest.java#L96) |

## Enterprise Policy RAG

- [검토 소스](https://github.com/cyson21/enterprise-policy-rag/tree/d5f71c1501d3b9582d2e801eb5c656daf2c21fb4) · [CI 기록](https://github.com/cyson21/enterprise-policy-rag/actions/runs/37869909842)
- 메모리·가짜 임베딩·가짜 모델, 선택 PostgreSQL 어댑터 검사와 실모델 답변 품질·운영 인증·관리형 환경을 구분.
- 이번에 메모리·가짜 모델 테스트 121개를 재실행했습니다. PostgreSQL 테스트 3개는 기준 버전 CI의 실행 기록으로 확인했습니다.

| 확인 조건·방법 | 결과 | 근거 |
|---|---|---|
| 메모리 저장소·가짜 임베딩과 공개·소유자·부서 권한이 다른 문서 5건을 사용합니다. | 볼 수 있는 3건만 나옵니다. | [test_retrieval_allows_public_owner_and_department_documents_only](https://github.com/cyson21/enterprise-policy-rag/blob/d5f71c1501d3b9582d2e801eb5c656daf2c21fb4/tests/test_retrieval_permissions.py#L46) |
| 메모리 저장소·가짜 모델을 사용한 답변 API에 검색 근거가 없는 질문을 보냅니다. | insufficient_evidence로 거절합니다. | [test_answer_api_refuses_when_no_evidence_is_available](https://github.com/cyson21/enterprise-policy-rag/blob/d5f71c1501d3b9582d2e801eb5c656daf2c21fb4/tests/test_answer_api.py#L63) |
| 선택 실행 PostgreSQL 테스트에서 권한이 다른 문서와 색인 대기 문서를 등록합니다. | 기준 버전의 PostgreSQL CI에서 허용된 문서만 후보·검색 결과에 남는지 확인했습니다. 관리형 DB나 운영 OIDC·실제 OpenAI 검증은 아닙니다. | [test_postgres_repository_retrieval_filters_mixed_access_control_rows](https://github.com/cyson21/enterprise-policy-rag/blob/d5f71c1501d3b9582d2e801eb5c656daf2c21fb4/tests/test_postgres_repository_integration.py#L62) |
| 관리 화면을 정적 빌드로 띄워 봅니다. | 고정 데이터로 검색 결과·출처·질문 이력을 보여 줍니다. 실제 백엔드 검색 결과는 아닙니다. | [정적 web build·smoke workflow](https://github.com/cyson21/enterprise-policy-rag/blob/d5f71c1501d3b9582d2e801eb5c656daf2c21fb4/.github/workflows/ci.yml) |

## Fashion Personalization Platform

- [검토 소스](https://github.com/cyson21/fashion-personalization-platform/tree/d08843005c864ab10dab6616b883e76d54de16f0) · [CI 기록](https://github.com/cyson21/fashion-personalization-platform/actions/runs/37869920344)
- 실패 후 다른 이벤트가 계속 처리된다는 미검사 주장을 제거. 유효 사이즈·브랜드 예시의 실제 assertion 범위와 수동 배치·메모리 저장 범위를 명시.
- 이번에 pytest 45개를 재실행했습니다. 단일 프로세스·메모리 저장소·고정 데모 데이터 범위입니다.

| 확인 조건·방법 | 결과 | 근거 |
|---|---|---|
| 같은 멱등 키로 두 번 호출하고, 별도 테스트에서 없는 상품의 이벤트를 최초 1회와 재시도 2회 처리합니다. | 이벤트 ID 재사용·처리 건수 1회 증가, 3회 시도 후 DEAD_LETTER를 확인했습니다. 실패 중 다른 이벤트의 지속 처리를 이 테스트가 직접 검사하지는 않습니다. | [test_event_ingestion_is_idempotent](https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_event_processing.py#L8)<br>[test_unknown_product_moves_to_dead_letter_after_retry_budget](https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_event_processing.py#L67) |
| 고정 입력으로 선호 브랜드·사이즈·가격 이벤트 순서·재고 조건의 단위 테스트를 각각 실행합니다. | 상위 상품과 추천 이유, 선택한 입력 순서에서의 가격 취향 일치, 품절 제외를 확인했습니다. 추천 품질·모든 이벤트 순서의 일반적 보장은 아닙니다. | [test_personal_ranking_prioritizes_user_preferences](https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py#L5)<br>[test_size_preference_contributes_to_ranking](https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py#L37)<br>[test_target_price_is_weighted_and_order_independent](https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py#L79)<br>[test_stock_availability_and_low_stock_are_reflected](https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_recommendation_engine.py#L121) |
| 외부 서비스 없이 데모 서비스 메서드로 수동 배치를 호출하고 저장된 스냅샷을 조회합니다. | 고정 데모에서 스냅샷 2개 이상과 기준 시각·반영 이벤트 수, stale_snapshot_users=0을 확인했습니다. 자동 스케줄러·HTTP 이벤트 워커의 결과는 아닙니다. | [test_batch_refresh_writes_materialized_snapshots](https://github.com/cyson21/fashion-personalization-platform/blob/d08843005c864ab10dab6616b883e76d54de16f0/tests/test_batch_workflow.py#L5) |

## Member Event Consistency

- [검토 소스](https://github.com/cyson21/member-event-consistency/tree/7a2dfc5d41817ec70e479a997277d8aba0af37f9) · [CI 기록](https://github.com/cyson21/member-event-consistency/actions/runs/37869938820)
- SQL RecordingSqlExecutor 단위 테스트·테스트 전용 JDBC 경합·단일 Spring HTTP/RabbitMQ 경로를 구분. RabbitListener 발췌의 설정 클래스 이름을 실제 코드와 일치시킴.
- CI의 Testcontainers 18개·일반 회귀 96개 통과 기록을 확인했습니다. 보상·포인트 수치는 JDBC DB 테스트, 쿠폰은 단일 인스턴스 HTTP·RabbitMQ 경로입니다.

| 확인 조건·방법 | 결과 | 근거 |
|---|---|---|
| Testcontainers PostgreSQL에 테스트 전용 JDBC INSERT를 8개 트랜잭션으로 동시에 실행합니다. 보상 HTTP API 전체 경로는 아닙니다. | 등록 1건·유니크 제약 거절 7건, reward_issue 행 1건을 확인했습니다. | [FirstLoginRewardDbConcurrencyIT.uniqueRewardIssueConstraintAllowsOnlyOneFirstLoginRewardPerMemberUnderConcurrentAttempts](https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/FirstLoginRewardDbConcurrencyIT.java#L42) |
| 테스트 전용 JDBC SELECT FOR UPDATE·차감 트랜잭션으로 잔액 100에서 60 차감을 두 번 요청합니다. | 차감 1건만 반영되고 잔액은 40입니다. 운영 서비스의 모든 차감 경로·부하를 검증한 결과는 아닙니다. | [PointSpendDbConcurrencyIT.rowLockSpendAllowsOnlyOneConcurrentDebitWhenBalanceCanCoverOneRequest](https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/PointSpendDbConcurrencyIT.java#L42) |
| Redis·RabbitMQ·PostgreSQL 컨테이너와 Spring 인스턴스 1개에서 HTTP로 정원 3·요청 8건을 보냅니다. | 완료 8건, 발급 3건·거절 5건, 소비자 lane 1개를 확인했습니다. 재시도는 입력 플래그로 유도한 시나리오입니다. | [MvpLiveInfrastructureIT.rabbitMqCouponCampaignRouteRunsOnlyWhenLiveDependenciesAreHealthy](https://github.com/cyson21/member-event-consistency/blob/7a2dfc5d41817ec70e479a997277d8aba0af37f9/backend/src/test/java/com/example/consistency/integration/MvpLiveInfrastructureIT.java#L63) |

## StockRush

- [검토 소스](https://github.com/cyson21/stockrush/tree/04027d3477e43e03e00e202b042dd210604dcb79) · [CI 기록](https://github.com/cyson21/stockrush/actions/runs/37870631500)
- 발행 실패 5회 재현을 retry_count=4 준비 후 대역 실패 1회의 경계값 검사로 수정. 핸들러 호출·DB 검사와 실제 Kafka 전달·다중 발행기 경쟁을 구분.
- PostgreSQL 통합 테스트의 해당 클래스 통과 기록을 확인했습니다. 발행기는 대역이며 실제 Kafka 장애 복구·운영 배포 증거와 구분합니다.

| 확인 조건·방법 | 결과 | 근거 |
|---|---|---|
| PostgreSQL에 이벤트를 넣은 뒤 같은 InventoryReserved 객체를 핸들러에 두 번 직접 전달합니다. Kafka 전달 테스트는 아닙니다. | processed_events 1행, 후속 Outbox 1행을 확인했습니다. | [OrderSagaEventHandlerIntegrationTest.ignores_duplicate_inventory_event](https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java#L169) |
| DB 주문을 CANCELLED로 바꾼 뒤 결제 승인 이벤트를 핸들러에 직접 전달합니다. | CANCELLED·FAILED 상태가 유지되고 OrderConfirmed Outbox가 생성되지 않았습니다. | [OrderSagaEventHandlerIntegrationTest.ignores_payment_authorized_for_cancelled_order](https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/application/OrderSagaEventHandlerIntegrationTest.java#L87) |
| retry_count=4, max_retry_count=5인 행을 준비하고 발행기 대역을 한 번 실패시킵니다. | retry_count=5와 FAILED 전환, 다음 재시도 시각 없음, 오류 메시지 보존을 확인했습니다. 다섯 번의 실제 Kafka 실패를 재현한 것은 아닙니다. | [OutboxRelayServiceIntegrationTest.marks_failed_when_publish_retry_count_is_exhausted](https://github.com/cyson21/stockrush/blob/04027d3477e43e03e00e202b042dd210604dcb79/services/order-service/src/test/java/com/stockrush/order/infra/outbox/OutboxRelayServiceIntegrationTest.java#L77) |

## 재발 방지

- 콘텐츠 스키마에서 결과별 근거와 확인 방식, 검토 버전·CI 기록을 요구한다.
- 단위 검사에서 코드·테스트·결과 링크가 해당 프로젝트의 검토 커밋을 가리키는지 검사한다.
- 실행 결과 미확인 스크립트를 CI 통과 결과로 바꾸거나 독립 CDC 구성요소를 연결된 파이프라인으로 그리지 않도록 검사한다.
- StockRush의 테스트 CI는 별도 이미지 릴리스 성공과 구분했다. 서비스 CI 기록을 운영 배포 근거로 사용하지 않는다.
