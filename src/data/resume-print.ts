import { previousCompanyProjects } from './site';

// Print-specific selection of the established career facts in site.ts.
// The resume covers professional experience; personal projects remain on the website.
export const resumePrint = {
  introduction: '기업용 교육 플랫폼과 공공·실시간 데이터 서비스의 백엔드를 개발하고 운영했습니다.',
  coreSkills: [
    'Java · Spring Boot · Spring Data JPA · QueryDSL · MySQL · Redis',
    'RabbitMQ · AWS · Docker · Python · Pandas',
  ],
  currentProjects: [
    {
      title: 'B2B 교육 플랫폼 백엔드 개발',
      bullets: [
        '기업 고객의 요구사항을 반영해 REST API와 관리자 기능을 개발했습니다.',
        'JPA·QueryDSL·MySQL 기반 조회·저장 로직을 개선했습니다.',
      ],
    },
    {
      title: '플랫폼 2.0 → 3.0 전환',
      bullets: [
        'API·DB 변경이 기존 기능에 미치는 영향을 점검하고, 레거시 코드와 데이터 접근 로직을 정리했습니다.',
        '변경 기능의 통합·회귀 테스트를 보완했습니다.',
      ],
    },
    {
      title: '비동기 처리와 운영 자동화',
      bullets: [
        'RabbitMQ 기반 발송 요청 접수와 후속 결과 기록을 분리하는 작업에 참여했습니다.',
        '작업 실행 현황과 처리 결과를 모니터링하고 Slack으로 알리는 기능을 구현했습니다.',
      ],
    },
    {
      title: '배포·인프라 운영과 개발 협업',
      bullets: [
        'AWS EC2·RDS·Lambda·CloudWatch·WAF 운영과 Docker 배포 작업에 참여했습니다.',
        'CI/CD 개선과 코드리뷰에 참여했습니다.',
      ],
    },
  ],
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
      period: '원주 2022.07–2022.10 · 용인 2021.07–2021.10',
      bullets: [
        '원주시와 용인특례시의 공공데이터 수집 에이전트를 개발하고 Pandas로 데이터를 가공했습니다.',
        '원주에서는 PostgreSQL을 구축하고 Spring·JPA로, 용인에서는 MySQL을 구축하고 Spring·MyBatis로 REST API를 개발했습니다. 두 서비스는 Docker로 배포했습니다.',
      ],
    },
  ].map(project => {
    const source = previousCompanyProjects.find(item => item.title === project.title);
    if (!source) throw new Error(`Missing resume project: ${project.title}`);
    return { period: source.period, ...project };
  }),
  otherSkills: 'MongoDB · Django · FastAPI · Git · REST Docs',
} as const;
