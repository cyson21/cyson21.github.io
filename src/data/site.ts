const publicResumeUrl = import.meta.env.PUBLIC_RESUME_URL?.trim() || '/downloads/resume.pdf';
const siteUpdatedAt = '2026-09-19';

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
    context: '실무에서는 4인 개발팀에서 20개 이상의 기업 고객 서비스를 Java·Spring Boot 기반으로 개발·운영했습니다.',
    responsibilities: [
      {
        title: 'Anchor 플랫폼 REST API',
        description: 'Java·Spring Boot·JPA·QueryDSL·MySQL 기반으로 Anchor 플랫폼 REST API를 설계·개발·운영하고, 관리자 기능 개편을 지원했습니다.',
      },
      {
        title: 'Anchor 2.0 → 3.0 전환',
        description: 'Anchor 2.0 → 3.0 전환에서 영향 범위를 점검해 기존 기능 회귀를 막고, 레거시 정리와 API·DB 구조 개선을 진행했습니다.',
      },
      {
        title: '장애 분석·회귀 검증',
        description: '운영 장애와 데이터 오류를 재현·분석한 뒤 API·DB 로직을 수정하고, Testcontainers 기반 통합·회귀 테스트로 재발을 줄였습니다.',
      },
      {
        title: '데이터 접근 계층 개선',
        description: 'JPA·QueryDSL 조회·저장 구조를 정리해 데이터 접근 계층의 정합성과 유지보수성을 높였습니다.',
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
    stack: ['Java', 'Spring Boot', 'Spring', 'Spring Data JPA', 'JPA', 'QueryDSL', 'MySQL', 'AWS S3', 'AWS SDK v2', 'Docker', 'JUnit', 'Testcontainers', 'REST Docs', 'Git'],
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
        description: '서울 실시간 도시데이터 Open API 수집·가공 파이프라인과 조회 API 구현',
      },
      {
        title: '스키마·REST API 설계',
        description: '서비스별 요구사항에 맞춘 MySQL·MongoDB 스키마 및 REST API 설계',
      },
      {
        title: '데이터 백엔드 구현',
        description: 'Spring Boot·Django·FastAPI로 데이터 조회·저장 백엔드 기능 구현',
      },
      {
        title: '시계열 예측 연동',
        description: '시계열 예측 결과를 서비스 지표와 기능에 연동',
      },
      {
        title: 'Docker 배포·운영',
        description: '관련 서비스를 Docker 컨테이너로 배포·운영',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Django', 'SQL', 'MySQL', 'MongoDB', 'Docker'],
  },
] as const;

export const resumeIntro = 'Java·Spring Boot 기반의 5년 차 백엔드 개발자입니다.';

export const resumeHighlights = [
  '기업용 플랫폼의 요구사항 분석, API 설계, 데이터 모델링',
  '복잡한 상태 변경과 데이터 정합성 문제 분석 및 개선',
  '운영 이슈 재현, 원인 분석, 수정, 회귀 테스트까지 전 과정 수행',
  '비즈니스 규칙 정비와 통합 테스트를 통한 운영 안정성 강화',
  '공공·실시간 데이터 수집·가공 및 REST API 개발',
  '시계열 예측 결과 연동과 Docker 기반 배포·운영',
] as const;

export const resumeClosing =
  '기능 구현에 그치지 않고, 운영 환경에서 발생하는 문제를 구조적으로 해결하고 재발을 방지하는 데 강점이 있습니다.';

export const resumeSummary = [resumeIntro, resumeClosing] as const;

export const profile = {
  name: '손찬양',
  englishName: 'Son Chanyang',
  role: 'Java · Spring Boot 백엔드 개발자',
  subtitle: '5년 차 · API 개발·운영 · 데이터 정합성',
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
    items: ['Java', 'Spring Boot', 'Spring', 'Spring Data JPA', 'QueryDSL', 'WebFlux'],
  },
  {
    label: 'DB·ORM',
    items: ['MySQL', 'PostgreSQL', 'MongoDB', 'JPA'],
  },
  {
    label: '메시징·비동기',
    items: ['Kafka', 'RabbitMQ', 'Redis', 'Transactional Outbox', 'Saga', '멱등 처리'],
  },
  {
    label: 'AWS·인프라',
    items: ['AWS S3', 'AWS SDK v2', 'Docker', 'Docker Compose'],
  },
  {
    label: 'CI/CD·검증 자동화',
    items: ['GitHub Actions CI', 'Docker Build', 'JUnit', 'Testcontainers', 'REST Docs', 'Git'],
  },
  {
    label: '데이터·Python API',
    items: ['Python', 'FastAPI', 'Django', 'SQL'],
  },
] as const;
