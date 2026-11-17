import { previousCompanyProjects } from './site';

// Print-specific selection of the established career facts in site.ts.
// The resume covers professional experience; personal projects remain on the website.
export const resumePrint = {
  introduction: '기업용 교육 플랫폼과 공공·실시간 데이터 서비스를 개발해 온 Java·Spring Boot 백엔드 개발자입니다. REST API와 데이터 처리 기능을 구현하고, 플랫폼 버전 전환과 서비스 배포·운영을 담당했습니다.',
  coreSkills: [
    'Java · Spring Boot · Spring Data JPA · QueryDSL · MySQL · Redis',
    'RabbitMQ · AWS · Docker · Python · Pandas',
  ],
  currentProjects: [
    {
      title: 'B2B 교육 플랫폼 백엔드 개발',
      bullets: [
        '기업 고객 요구사항에 맞춰 Java·Spring Boot REST API와 관리자 기능을 개발했습니다.',
        'JPA·QueryDSL·MySQL을 사용해 서비스의 조회·저장 로직과 데이터 접근 계층을 개선했습니다.',
      ],
    },
    {
      title: '플랫폼 2.0 → 3.0 전환',
      bullets: [
        '기능 개편에 따른 API·DB 변경의 영향 범위를 점검하고 전환 작업에 참여했습니다.',
        '레거시 코드와 데이터 접근 로직을 정리하고, 변경 기능의 통합·회귀 테스트를 보완했습니다.',
      ],
    },
    {
      title: '비동기 처리와 운영 자동화',
      bullets: [
        'RabbitMQ 기반으로 발송 요청 접수와 후속 결과 기록을 분리하는 비동기 처리 변경에 참여했습니다.',
        '서비스 운영에 필요한 작업 실행 현황과 처리 결과 모니터링, Slack 알림을 구현했습니다.',
      ],
    },
    {
      title: '배포·인프라 운영과 개발 협업',
      bullets: [
        'AWS EC2·RDS·Lambda·CloudWatch·WAF 운영과 Docker 배포·전환 작업에 참여했습니다.',
        'CI/CD 개선과 코드리뷰에 참여하며 서비스 변경 사항을 함께 검토했습니다.',
      ],
    },
  ],
  supportingWork: '담당 환경 · Java / Spring Boot / JPA / QueryDSL / MySQL / Redis / RabbitMQ / AWS / Docker',
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
