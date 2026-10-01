const publicResumeUrl = import.meta.env.PUBLIC_RESUME_URL?.trim() || '/downloads/resume.pdf';
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
    context: '4인 개발팀에서 20개 이상의 기업 고객 서비스를 제공하는 Anchor 플랫폼의 백엔드 개발·운영을 담당했습니다.',
    responsibilities: [
      {
        title: 'Anchor 플랫폼 REST API',
        description: 'Java·Spring Boot로 Anchor 플랫폼 REST API를 설계·개발·운영했습니다. JPA·QueryDSL·MySQL로 데이터 조회·저장을 구현하고 관리자 기능 개편을 지원했습니다.',
      },
      {
        title: 'Anchor 2.0 → 3.0 전환',
        description: '버전 전환에 따른 기존 기능의 영향 범위를 점검하고 회귀를 검증했습니다. 레거시 코드 정리와 API·DB 구조 개선을 진행했습니다.',
      },
      {
        title: '장애 분석·회귀 검증',
        description: '운영 장애와 데이터 오류를 재현해 원인을 분석하고 API·DB 로직을 수정했습니다. Testcontainers 기반 통합·회귀 테스트로 수정 결과를 확인했습니다.',
      },
      {
        title: '데이터 접근 계층 개선',
        description: 'JPA·QueryDSL의 조회·저장 구조를 정리하고 데이터 정합성과 유지보수 관점에서 접근 로직을 개선했습니다.',
      },
      {
        title: 'AWS 배포·운영',
        description: 'AWS(Lambda, CloudWatch, RDS, EC2, WAF 등) 기반 배포·모니터링·운영에 참여하고, Docker 배포·전환 이슈를 처리했습니다.',
      },
      {
        title: 'CI/CD·배포 품질',
        description: 'CI/CD 파이프라인 안정화와 코드리뷰 기반 배포 품질 관리에 참여했습니다.',
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
        title: '실시간 데이터 파이프라인',
        description: '서울 실시간 도시데이터 Open API를 수집·가공하는 파이프라인과 조회 API를 구현했습니다.',
      },
      {
        title: '스키마·REST API 설계',
        description: '서비스별 요구사항에 맞춰 MySQL·MongoDB 스키마와 REST API를 설계했습니다.',
      },
      {
        title: '데이터 백엔드 구현',
        description: 'Spring Boot·Django·FastAPI로 데이터 조회·저장 기능을 구현했습니다.',
      },
      {
        title: '시계열 예측 연동',
        description: '시계열 예측 결과를 서비스 지표와 기능에 연동했습니다.',
      },
      {
        title: 'Docker 배포·운영',
        description: '관련 서비스를 Docker 컨테이너로 배포·운영했습니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Django', 'SQL', 'MySQL', 'MongoDB', 'Docker'],
  },
] as const;

export const resumeIntro = '2021년부터 백엔드 개발·운영을 담당해 왔으며, Java·Spring Boot를 주력으로 사용합니다.';

export const resumeHighlights = [
  '기업용 플랫폼의 REST API 설계·개발과 관리자 기능 개편',
  '공공·실시간 데이터 수집·가공 파이프라인과 조회 API 구현',
  '운영 장애·데이터 오류 재현, 원인 분석과 API·DB 로직 수정',
  'JPA·QueryDSL 데이터 접근 계층 개선과 통합·회귀 테스트',
  'Anchor 버전 전환의 영향 범위 점검과 레거시 코드 정리',
  'AWS 운영 참여와 Docker 배포·전환 이슈 대응',
] as const;

export const resumeClosing =
  '운영 문제의 재현부터 로직 수정과 회귀 검증까지 연결합니다. 개인 프로젝트에서는 동시성 제어와 이벤트 처리의 실패·복구 흐름을 구현하고 테스트했습니다.';

export const resumeSummary = [resumeIntro, resumeClosing] as const;

export const profile = {
  name: '손찬양',
  englishName: 'Son Chanyang',
  role: 'Java · Spring Boot 백엔드 개발자',
  subtitle: '2021년부터 · API 개발·운영 · 데이터 정합성',
  statement: resumeIntro,
  email: 'cyson21@gmail.com',
  github: 'https://github.com/cyson21',
  portfolio: 'https://cyson21.github.io/',
  resumePath: publicResumeUrl,
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
