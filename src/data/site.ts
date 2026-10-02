const siteUpdatedAt = '2026-10-01';

const formatMonth = (value: string) => value.replace('-', '.');
export const formatDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
};

const experienceRecords = [
  {
    start: '2024-03',
    end: null,
    company: '이엠캐스트(주)',
    role: '백엔드 개발자 · 주임',
    context: '4인 개발팀에서 20개 이상의 기업 고객 서비스를 제공하는 B2B 리테일 교육 플랫폼의 백엔드 개발·운영을 담당했습니다.',
    responsibilities: [
      {
        title: '교육 플랫폼 API 개발·운영',
        description: 'Java·Spring Boot로 B2B 리테일 교육 플랫폼의 REST API를 설계·개발·운영했습니다. JPA·QueryDSL·MySQL로 조회·저장을 구현하고 관리자 기능 개편을 지원했습니다.',
      },
      {
        title: '버전 전환·데이터 접근 계층 개선',
        description: '플랫폼 2.0 → 3.0 전환의 영향 범위를 점검하고 기존 기능의 회귀를 검증했습니다. 레거시 코드와 API·DB 구조, JPA·QueryDSL 조회·저장 로직을 정리했습니다.',
      },
      {
        title: '운영 오류 분석·수정·회귀 검증',
        description: '운영 장애와 데이터 오류를 재현해 원인을 추적하고 API·DB 로직을 수정했습니다. 상태 변경과 시간대 경계 문제를 다루고 Testcontainers 기반 통합·회귀 테스트를 정리했습니다.',
      },
      {
        title: 'AWS 인프라·CI/CD·배포 운영',
        description: 'AWS EC2·RDS·Lambda·CloudWatch·WAF 기반 배포·모니터링·운영에 참여했습니다. Docker 배포·전환 이슈에 대응하고 CI/CD 파이프라인 안정화와 코드리뷰 기반 배포 품질 관리에 참여했습니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'QueryDSL', 'MySQL', 'AWS EC2', 'AWS RDS', 'AWS S3', 'AWS Lambda', 'CloudWatch', 'AWS WAF', 'AWS SDK v2', 'Docker', 'JUnit', 'Testcontainers', 'REST Docs', 'Git'],
  },
  {
    start: '2021-07',
    end: '2024-03',
    company: '주식회사 화이트스캔',
    role: '백엔드·데이터 개발자 · 연구원',
    context: '공공·실시간 데이터 기반 서비스의 백엔드와 데이터 처리, 배포·운영을 담당했습니다.',
    responsibilities: [
      {
        title: '도시데이터 수집·가공·조회 API',
        description: '서울 실시간 도시데이터 Open API를 수집·가공하는 파이프라인과 조회 API를 구현했습니다.',
      },
      {
        title: '데이터 모델·백엔드 개발',
        description: '서비스 요구사항에 맞춰 MySQL·MongoDB 스키마와 REST API를 설계하고, Spring Boot·Django·FastAPI로 데이터 조회·저장 기능을 구현했습니다.',
      },
      {
        title: '예측 결과 연동·Docker 운영',
        description: '시계열 예측 결과를 서비스 지표와 기능에 연동하고 관련 서비스를 Docker 컨테이너로 배포·운영했습니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Django', 'SQL', 'MySQL', 'MongoDB', 'Docker'],
  },
] as const;

export const professionalSummary = 'B2B 리테일 교육 플랫폼과 공공·실시간 데이터 서비스의 API를 개발·운영했습니다. 상태 변경·시간대 경계에서 발생한 오류를 추적하고, 서버 로직과 회귀 테스트를 개선했습니다.';

export const resumeWorkCases = [
  {
    title: '저장 시점의 상태 변경으로 발생하는 데이터 오류 방지',
    problem: '설정 변경 화면을 연 뒤 관련 작업이 시작되면, 이전 상태를 기준으로 저장하면서 진행 중인 작업에 서로 다른 처리 기준이 적용될 수 있었습니다.',
    change: '저장 직전 서버에서 현재 상태를 다시 확인하도록 수정했습니다. 작업이 시작되기 전에는 새 설정을 적용하고, 이미 시작됐다면 변경을 차단해 기존 데이터를 보호했습니다.',
    verification: '정상 변경과 진행 중 변경 차단의 단위·통합 테스트, 별도 검증 환경에서의 수동 확인.',
  },
  {
    title: '시간대 차이로 발생한 알림 지연·누락 수정',
    problem: '데이터 저장 시간대(UTC)와 국내 서비스 시간대(KST)를 변환할 때 날짜가 달라져, 알림이 하루 늦거나 등록 시점에 따라 발송이 누락되는 경로가 있었습니다.',
    change: '알림 발송일을 한국 시간 기준으로 계산하도록 통일했습니다. 등록 시각에 따라 당일·다음 날 발송을 구분하고, 이미 지난 시각으로 처리되는 경로를 수정했습니다.',
    verification: '발송 조건과 날짜 경계를 조합한 재현 사례 4개, 단위·통합 테스트와 별도 검증 환경의 수동 확인.',
  },
  {
    title: '실제 운영 환경에 맞춘 데이터베이스 테스트 정리',
    problem: '서비스별로 다른 DB 설정과 중복된 테스트 환경을 사용하고 있었습니다. 실제 운영 DB와 같은 조건에서 오류를 확인할 수 있도록 환경을 통일할 필요가 있었습니다.',
    change: '공통 테스트용 DB에 운영 환경과 같은 테이블 구조를 적용했습니다. 중복 설정을 제거하고, 데이터 조회와 시간대 변환을 확인하는 기존 테스트를 유지했습니다.',
    verification: 'DB 기본 동작, 관련 서비스와 API의 기존 기능 유지 여부.',
  },
];

export const resumeIntro = '2021년부터 백엔드 개발·운영을 담당해 왔으며, Java·Spring Boot를 주력으로 사용합니다.';

export const resumeHighlights = [
  'B2B 리테일 교육 플랫폼의 REST API 설계·개발과 관리자 기능 개편',
  '공공·실시간 데이터 수집·가공 파이프라인과 조회 API 구현',
  '운영 장애·데이터 오류 재현, 원인 분석과 API·DB 로직 수정',
  'JPA·QueryDSL 데이터 접근 계층 개선과 통합·회귀 테스트',
  'B2B 교육 플랫폼 버전 전환의 영향 범위 점검과 레거시 코드 정리',
  'AWS 인프라 운영과 CI/CD 파이프라인 안정화, Docker 기반 배포',
] as const;

export const resumeClosing =
  '운영 문제의 재현부터 로직 수정과 회귀 검증까지 연결합니다. 개인 프로젝트에서는 동시성 제어와 이벤트 처리의 실패·복구 흐름을 구현하고 테스트했습니다.';

export const resumeSummary = [resumeIntro, resumeClosing] as const;

export const profile = {
  name: '손찬양',
  englishName: 'Son Chanyang',
  role: 'Java · Spring Boot 백엔드 개발자',
  subtitle: 'API 개발·운영 · 데이터 정합성',
  statement: resumeIntro,
  email: 'cyson21@gmail.com',
  github: 'https://github.com/cyson21',
  portfolio: 'https://cyson21.github.io/',
  resumePath: '/downloads/resume.pdf',
  updatedAt: siteUpdatedAt,
} as const;

export const experiences = experienceRecords.map((experience) => ({
  ...experience,
  period: `${formatMonth(experience.start)} – ${experience.end ? formatMonth(experience.end) : '현재'}`,
}));

export const careerPeriod = `${formatMonth(experienceRecords.at(-1)?.start ?? experienceRecords[0].start)} → 현재`;

export const skillGroups = [
  {
    label: 'Java·Spring',
    items: ['Java', 'Spring Boot', 'Spring Data JPA', 'QueryDSL'],
  },
  {
    label: 'DB·데이터',
    items: ['SQL', 'MySQL', 'MongoDB'],
  },
  {
    label: 'Python·웹',
    items: ['Python', 'Django', 'FastAPI'],
  },
  {
    label: 'AWS·인프라',
    items: ['AWS', 'Docker'],
  },
  {
    label: '형상관리·검증',
    items: ['Git', 'JUnit', 'Testcontainers', 'REST Docs'],
  },
] as const;

// 공개 프로젝트의 구현·테스트 경험이며 실무 운영 경험을 뜻하지 않습니다.
export const projectSkillGroups = [
  { label: 'DB·캐시', items: ['PostgreSQL', 'Redis', 'pgvector'] },
  { label: '이벤트·CDC', items: ['Kafka', 'RabbitMQ', 'Debezium'] },
  { label: 'API·인증', items: ['Spring WebFlux', 'Keycloak'] },
] as const;
