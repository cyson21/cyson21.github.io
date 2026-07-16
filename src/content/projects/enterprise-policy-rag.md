---
order: 2
featured: true
publicationState: public
name: Enterprise Policy RAG
domain: AI
eyebrow: 권한 기반 RAG
summary: 권한이 없는 문서의 검색 노출과 근거 없는 답변을 막기 위해 검색 전 권한 필터, 인용·거절 응답, 실행 지연과 추정 토큰·비용 기록을 구현했습니다.
period: 2026.05–2026.06
role: 개인 프로젝트 · FastAPI 검색·답변·운영 API, 저장소·외부 모델 경계와 React 콘솔 직접 설계·구현
stack:
  - Python
  - FastAPI
  - React
  - PostgreSQL
  - pgvector
  - 선택형 OpenAI 연동
problem: 기업 내부 정책 RAG는 검색 품질만으로 부족합니다. 사용자가 볼 수 없는 문서가 검색 후보에 섞이지 않아야 하고 근거가 없으면 답변 생성을 중단해야 합니다.
responsibilities:
  - 문서 등록, 결정적 문서 분할, 권한 필터 검색과 인용·거절 응답 API를 구현했습니다.
  - 질의 로그와 고정 평가 사례 3개, PostgreSQL/pgvector 선택 저장소와 외부 모델 경계를 분리했습니다.
  - 검색·지식 관리·운영 화면과 정적 데모 검증 경로를 구성했습니다.
flow:
  normal:
    - 문서 등록·분할
    - 워크스페이스 권한 필터
    - 관련 문단 검색
    - 근거 인용 답변
    - 질의 로그 기록
  failure:
    - 권한 밖 문서 후보
    - 검색 근거 0건
    - 응답 인용 범위 이탈
  recovery:
    - 검색 전 가시성 필터
    - 무근거 거절 응답
    - 서비스 계층 인용 범위 재검사
signals:
  - label: 권한 검색
    expression: 문서 5건 → 허용 3건
    result: 다른 워크스페이스 결과 0건
    tone: success
    source: test_retrieval_permissions.py::test_retrieval_allows_public_owner_and_department_documents_only
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_retrieval_permissions.py
  - label: 답변 거절
    expression: 근거 없음 → 답변 생성 안 함
    result: 답변 없음 · 인용 0건
    tone: warning
    source: test_answer_api.py::test_answer_api_refuses_when_no_evidence_is_available
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_answer_api.py
  - label: 인용 범위 검사
    expression: 권한 밖 인용 → 제외
    result: 접근 범위 밖 문서 인용 제외
    tone: danger
    source: test_answer_api.py::test_answer_api_keeps_retrieval_permission_filter_for_citations
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_answer_api.py
decisions:
  - title: 권한 검사 우선
    choice: 답변 생성 전에 접근 가능한 문단만 검색 후보로 제한합니다.
    alternative: 전체 검색 뒤 응답 단계에서만 결과 필터링
    reason: 비인가 내용이 검색 결과와 모델 입력에 들어가는 시점 자체를 막기 위해 검색 전 필터를 선택했습니다.
  - title: 근거 기반 거절
    choice: 인용 근거가 없으면 답변과 인용이 비어 있는 거절 응답을 반환합니다.
    alternative: 모델이 일반 지식으로 답변하도록 허용
    reason: 사내 정책 답변의 검증 가능성을 유지하기 위해 선택했습니다.
  - title: 교체 가능한 경계
    choice: 외부 모델과 저장소를 인터페이스로 분리합니다.
    alternative: 외부 API와 pgvector 구현을 서비스 로직에 직접 결합
    reason: 고정 입력 경로와 선택형 외부 연동 경로의 검증 수준을 분리하기 위해 선택했습니다.
protectionRules:
  - 다른 워크스페이스 또는 권한 범위 밖 문서는 검색 결과와 인용에 포함하지 않습니다.
  - 근거가 한 건도 없으면 답변 문자열을 생성하지 않습니다.
  - 기본 검증은 고정 입력과 메모리 저장소에서 수행했으며 외부 모델 연동은 선택 실행 범위입니다.
codeEvidence:
  - symbol: RetrievalService.retrieve
    displayPath: app/retrieval.py
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/app/retrieval.py
    excerpt: |
      access_reason = _access_reason(chunk, query)
      if access_reason is None:
          continue
    proves: 저장소 필터 뒤에도 워크스페이스·소유자·부서 가시성을 다시 판정해 비인가 결과를 제거합니다.
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
    proves: 인용 근거가 없으면 답변과 인용을 비우고 insufficient_evidence 사유를 반환합니다.
    testName: test_answer_api_refuses_when_no_evidence_is_available
    testPath: tests/test_answer_api.py
    testUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_answer_api.py
  - symbol: run_eval
    displayPath: app/evaluation.py
    sourceUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/app/evaluation.py
    excerpt: |
      cases = [_run_case(services, request.workspace_id, case) for case in GOLDEN_CASES]
      retrieval_hit_rate = _rate(case.retrieval_hit for case in cases)
      citation_coverage = _rate(case.citation_covered for case in cases)
    proves: 3개 고정 평가 사례를 테스트용 답변 경로로 실행해 검색 적중률과 인용 커버리지를 함께 계산합니다.
    testName: test_eval_run_api_returns_retrieval_and_citation_metrics
    testPath: tests/test_eval_api.py
    testUrl: https://github.com/cyson21/enterprise-policy-rag/blob/main/tests/test_eval_api.py
verification:
  - layer: unit
    method: 권한 조합을 가진 문서 5건의 고정 입력으로 검색 경로를 실행합니다.
    result: 허용 범위 3건만 반환하고 다른 워크스페이스 결과는 0건입니다.
  - layer: integration
    method: 검색 결과가 없는 답변 API 시나리오를 실행합니다.
    result: 답변과 인용이 비어 있는 insufficient_evidence 응답을 반환합니다.
  - layer: static-demo
    method: 운영·지식 관리 화면을 고정 입력과 정적 빌드로 확인합니다.
    result: 공개 데모에서 검색 결과, 근거 인용과 평가 지표를 확인할 수 있습니다.
limitations:
  - 기본 경로는 메모리 저장소와 고정 fixture이며 운영 IAM, PostgreSQL/pgvector와 외부 provider는 선택 검증입니다.
  - 지연 시간은 해당 실행에서 관찰한 값이지만 토큰은 문자열 길이를 4글자당 1개로 근사하고 비용은 정적 단가를 적용한 추정치라 실제 외부 모델 사용량이나 청구액이 아닙니다.
  - 검색 적중률과 인용 커버리지는 테스트용 provider를 사용한 3개 고정 사례의 회귀 지표이며 일반적인 RAG 품질을 대표하지 않습니다.
next:
  - 운영 인증과 감사 로그를 추가하고 실제 외부 모델 평가를 별도 결과로 축적합니다.
links:
  github: https://github.com/cyson21/enterprise-policy-rag
  demo: https://enterprise-policy-rag.vercel.app
  adr: https://github.com/cyson21/enterprise-policy-rag/tree/main/docs/adr
  testReport: https://github.com/cyson21/enterprise-policy-rag/tree/main/tests
visual:
  kind: image
  src: /media/rag-operations.jpg
  alt: 권한 검색 결과와 Citation, 질의 평가 지표를 보여주는 Enterprise Policy RAG 운영 화면
seo:
  title: Enterprise Policy RAG · 권한 검색과 근거 응답
  description: 권한 밖 문서를 검색 전에 차단하고 근거가 없으면 답변을 거절하는 사내 정책 RAG 백엔드 프로젝트입니다.
updatedAt: 2026-07-15
---

검색 정확도뿐 아니라 권한 경계와 답변 근거를 동시에 검증하는 사내 정책 RAG 프로젝트입니다.
