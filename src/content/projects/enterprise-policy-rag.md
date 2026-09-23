---
order: 2
featured: true
publicationState: public
name: Enterprise Policy RAG
domain: AI
eyebrow: 권한 기반 RAG
summary: 사내 규정 문서를 검색해서 질문에 답하는 RAG입니다. 볼 권한이 있는 문서만 검색하고, 근거 문서가 없으면 답하지 않습니다.
cardEvidence:
  implementation: 벡터 검색을 하기 전에 워크스페이스, 작성자, 공개 범위, 부서 조건으로 먼저 걸러 냅니다.
  result: 문서 5건 중 볼 수 있는 3건만 나오고, 검색 결과가 없으면 모델을 부르지 않고 바로 거절합니다.
period: 2026.05–2026.06
role: 개인 프로젝트 · 백엔드 API와 React 관리 화면까지 혼자 진행
stack:
  - Python
  - FastAPI
  - React
  - PostgreSQL
  - pgvector
  - OpenAI 연동
problem: 사내 문서 RAG는 검색이 잘 되는 것만으로는 부족합니다. 인사팀 문서가 다른 부서 사람 질문에 섞여 나오면 안 되고, 근거가 없는데 그럴듯하게 답해도 안 됩니다.
responsibilities:
  - 문서 등록과 분할, 권한별 검색, 출처를 붙인 답변과 거절 응답 API를 만들었습니다.
  - pgvector 저장소와 OpenAI 연동은 인터페이스 뒤로 빼서, 외부 서비스 없이도 테스트할 수 있게 했습니다.
  - 검색 결과, 문서 관리, 질문 이력을 볼 수 있는 관리 화면과 정적 데모를 만들었습니다.
flow:
  normal:
    - 문서 등록·분할
    - 권한으로 먼저 거르기
    - 관련 문단 검색
    - 출처를 붙여 답변
    - 질의 로그 기록
  failure:
    - 볼 권한 없는 문서가 후보에 섞임
    - 관련 문서가 하나도 없음
    - 답변이 권한 밖 문서를 인용
  recovery:
    - 검색 전에 권한 필터
    - 근거 없으면 거절
    - 인용한 문서를 한 번 더 권한 확인
signals:
  - label: 권한 검색
    expression: 문서 5건 검색
    result: 볼 수 있는 3건만 반환
    tone: success
    source: test_retrieval_permissions.py::test_retrieval_allows_public_owner_and_department_documents_only
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_retrieval_permissions.py
  - label: 답변 거절
    expression: 관련 문서 없음
    result: 답변하지 않고 거절
    tone: warning
    source: test_answer_api.py::test_answer_api_refuses_when_no_evidence_is_available
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_answer_api.py
  - label: 인용 범위 검사
    expression: 권한 밖 문서 인용
    result: 인용 목록에서 빠짐
    tone: danger
    source: test_answer_api.py::test_answer_api_keeps_retrieval_permission_filter_for_citations
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_answer_api.py
decisions:
  - title: 권한 확인은 검색 전에
    choice: 볼 수 있는 문서만 검색 후보에 올립니다.
    alternative: 전부 검색한 뒤 답변 단계에서 거르기
    reason: 나중에 거르면 이미 모델 입력에 들어간 뒤입니다. 모델이 한 번이라도 본 내용은 답변에 새어 나올 수 있습니다.
  - title: 근거 없으면 답하지 않기
    choice: 인용할 문서가 없으면 답변과 출처가 빈 거절 응답을 돌려줍니다.
    alternative: 모델이 일반 상식으로 답하게 두기
    reason: 사내 규정 질문에 출처 없는 답이 나오면 맞는지 확인할 방법이 없습니다.
  - title: 외부 의존성 분리
    choice: 모델과 저장소를 인터페이스로 분리했습니다.
    alternative: OpenAI API와 pgvector를 서비스 코드에서 바로 호출
    reason: 테스트는 가짜 모델로 빠르게 돌리고, 실제 모델 연동은 따로 확인하고 싶었습니다.
protectionRules:
  - 다른 워크스페이스나 권한 밖 문서는 검색 결과와 출처에 나오지 않습니다.
  - 근거가 하나도 없으면 답변을 만들지 않습니다.
  - 기본 실행은 메모리 저장소와 가짜 모델을 쓰고, OpenAI 연동은 켜야 동작합니다.
codeEvidence:
  - symbol: RetrievalService.retrieve
    displayPath: app/retrieval.py
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/app/retrieval.py
    excerpt: |
      access_reason = _access_reason(chunk, query)
      if access_reason is None:
          continue
    proves: 저장소에서 한 번 거른 뒤에도 워크스페이스, 작성자, 부서 권한을 다시 확인합니다.
    testName: test_retrieval_allows_public_owner_and_department_documents_only
    testPath: tests/test_retrieval_permissions.py
    testUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_retrieval_permissions.py
  - symbol: AnswerService.answer
    displayPath: app/answer.py
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/app/answer.py
    excerpt: |
      if not citations:
          return AnswerResponse(
              query=query.query,
              answer=None,
              citations=[],
              refusal_reason="insufficient_evidence",
          )
    proves: 인용할 문서가 없으면 답변과 출처를 비우고 insufficient_evidence를 돌려줍니다.
    testName: test_answer_api_refuses_when_no_evidence_is_available
    testPath: tests/test_answer_api.py
    testUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_answer_api.py
  - symbol: PostgresPolicyRepository.search_candidate_chunks
    displayPath: app/repository.py
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/app/repository.py
    excerpt: |
      WHERE c.workspace_id = %s
        AND d.indexing_status = 'ready'
        AND (
          d.owner_user_id = %s
          OR d.visibility = 'public'
          OR (d.visibility = 'department' AND d.department_ids && %s::text[])
        )
      ORDER BY c.embedding <=> %s::vector
    proves: 벡터 유사도로 정렬하기 전에 SQL WHERE 절에서 권한 조건부터 적용합니다.
    testName: test_postgres_repository_retrieval_filters_mixed_access_control_rows
    testPath: tests/test_postgres_repository_integration.py
    testUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_postgres_repository_integration.py
verification:
  - layer: unit
    method: 권한이 서로 다른 문서 5건으로 검색을 실행합니다.
    result: 볼 수 있는 3건만 나옵니다.
  - layer: integration
    method: 관련 문서가 없는 질문을 답변 API에 보냅니다.
    result: insufficient_evidence로 거절합니다.
  - layer: static-demo
    method: 관리 화면을 정적 빌드로 띄워 봅니다.
    result: 공개 데모에서 검색 결과, 출처, 평가 지표를 볼 수 있습니다.
limitations:
  - 기본 실행은 메모리 저장소와 가짜 모델입니다. 실제 사내 인증 연동이나 운영 환경 pgvector는 해 보지 않았습니다.
  - 화면의 토큰 수와 비용은 글자 수로 어림잡은 값이라 실제 청구액과 다릅니다.
  - 검색 적중률은 테스트 사례 3개로만 잰 값이라 일반적인 품질 지표로 보기는 어렵습니다.
next:
  - 사내 인증과 감사 로그를 붙이고, 실제 모델로 평가를 따로 쌓아 보려고 합니다.
links:
  github: https://github.com/cyson21/enterprise-policy-rag
  demo: https://enterprise-policy-rag.vercel.app
  adr: https://github.com/cyson21/enterprise-policy-rag/tree/main/docs/adr
  testReport: https://github.com/cyson21/enterprise-policy-rag/tree/main/tests
visual:
  kind: image
  src: /media/rag-operations.jpg
  alt: 권한별 검색 결과, 답변 출처, 질문 이력을 보여 주는 관리 화면
seo:
  title: Enterprise Policy RAG · 권한을 지키는 사내 문서 검색
  description: 볼 권한이 없는 문서는 검색 단계에서 빼고, 근거가 없으면 답하지 않는 사내 규정 RAG 프로젝트입니다.
updatedAt: 2026-09-23
---
테스트와 기본 실행은 메모리 저장소와 가짜 모델로 돌아갑니다. PostgreSQL, pgvector, OpenAI 연동은 설정을 켜면 동작하도록 따로 분리해 두었습니다.

검색 품질보다 "이 사람이 이 문서를 봐도 되는가"를 먼저 챙긴 사내 규정 RAG입니다.
