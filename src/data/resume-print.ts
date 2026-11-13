import { previousCompanyProjects } from './site';

// Print-specific selection of the established career facts in site.ts.
// The resume covers professional experience; personal projects remain on the website.
export const resumePrint = {
  introduction: '기업용 교육 플랫폼과 공공·실시간 데이터 서비스를 개발해 온 Java·Spring Boot 백엔드 개발자입니다. API 개발·운영과 데이터 처리, 동시 요청과 상태 변경에서 발생하는 오류의 원인 분석·수정을 담당했습니다.',
  coreSkills: [
    'Java · Spring Boot · Spring Data JPA · QueryDSL · MySQL · Redis',
    'RabbitMQ · AWS · Docker · JUnit · Testcontainers',
  ],
  currentProjects: [
    {
      title: '플랫폼 기능 개발과 2.0 → 3.0 전환',
      bullets: [
        '기업 고객 요구사항에 맞춰 REST API와 관리자 기능을 개발하고 조회·저장 로직을 개선했습니다.',
        'API·DB 변경의 영향 범위를 점검하고 레거시 코드를 정리했습니다. 변경 기능의 통합·회귀 테스트를 보완했습니다.',
      ],
    },
    {
      title: '배치 중복 실행 제어와 누락 모니터링',
      anchor: 'work-batch',
      bullets: [
        '서버마다 스케줄러가 실행돼 같은 배치가 중복 처리되는 문제에 ShedLock·Redis 분산락을 적용했습니다.',
        '예정 목록과 실행 기록을 대조하는 모니터링을 별도로 구현해, 고객사·배치별 실패와 실행 누락을 Slack으로 알렸습니다.',
      ],
    },
    {
      title: '저장 상태 재검증과 복합 식별자 오류 수정',
      anchor: 'work-policy',
      relatedAnchor: 'work-identity',
      bullets: [
        '화면을 연 뒤 작업 상태가 바뀌어도 설정이 저장되던 오류를 수정했습니다. 저장 직전 상태를 재조회해 변경 허용 여부와 후속 갱신 기준을 맞췄습니다.',
        '사용자 ID·그룹 유형을 함께 식별하도록 조회·삭제 로직을 수정하고, 페이지 목록과 총건수에 같은 필터 조건을 적용했습니다.',
      ],
    },
    {
      title: '주문·결제 요청의 락 경합과 커밋 경계 조정',
      anchor: 'work-purchase',
      bullets: [
        '주문 단위 분산락과 결제 트랜잭션 분리를 적용했습니다. QA에서 확인된 상태 조회 오류를 추적해 요청 상태를 먼저 커밋하도록 호출 순서를 수정했습니다.',
        '락 관련 예외만 재시도하고, 이미 결제가 완료된 주문은 다시 처리하지 않도록 보완했습니다.',
      ],
    },
  ],
  supportingWork: 'RabbitMQ 기반 비동기 요청·결과 처리 분리, AWS 운영과 Docker 배포·전환, CI/CD 개선 및 코드리뷰에도 참여했습니다.',
  previousProjects: [
    {
      title: '인파관리 시스템 백엔드·알림 서비스',
      technology: 'Spring Boot · 데이터 수집·가공 · Docker',
      bullets: [
        '이동통신 데이터를 수집·가공하고 조회 REST API와 상황별 카카오톡·문자·메신저 알림 서비스를 구현했습니다.',
        'DB 스키마 설계와 배포·운영을 담당하고, 프로젝트 일정 관리와 고객사 요구사항 확인·소통을 주도했습니다.',
      ],
    },
    {
      title: '인파 이동 시뮬레이터',
      bullets: [
        'j-Crowd Simulator 기반 인파 이동 시뮬레이터의 백엔드 개발과 배경·캘리브레이션 데이터 구성을 담당했습니다.',
        '다익스트라 기반 길찾기, 군집·경로 생성과 도로 차단 시나리오를 구현했습니다. 인파 이동을 표현하는 Social Force Model을 조정했습니다.',
      ],
    },
    {
      title: '서울시 실시간 도시데이터·Open API',
      technology: 'Spring Boot · Python · Pandas · Docker',
      bullets: [
        '실시간 데이터 수집·가공 파이프라인과 외부 조회용 Open API를 개발·운영했습니다.',
        '데이터 분석·지표 구성과 시계열 예측 결과의 서비스 연동, Docker 배포·운영을 담당했습니다.',
      ],
    },
    {
      title: '지자체 공공데이터·REST API',
      bullets: [
        '원주시·용인특례시 프로젝트의 데이터 수집 에이전트와 Pandas 가공, PostgreSQL·MySQL 구축을 수행했습니다.',
        'Spring·JPA·MyBatis 기반 REST API 개발과 Docker 배포를 담당했습니다.',
      ],
    },
  ].map(project => {
    const source = previousCompanyProjects.find(item => item.title === project.title);
    if (!source) throw new Error(`Missing resume project: ${project.title}`);
    return { ...project, period: source.period };
  }),
  otherSkills: 'Python · Pandas · PostgreSQL · MongoDB · Django · FastAPI · Git · REST Docs',
} as const;
