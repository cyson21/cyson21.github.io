const publicResumeUrl = import.meta.env.PUBLIC_RESUME_URL?.trim() || '/downloads/resume.pdf';
const siteUpdatedAt = '2026-09-09';

const formatMonth = (value: string) => value.replace('-', '.');
export const formatDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
};

const experienceRecords = [
  {
    start: '2024-03',
    end: null,
    company: '이엠케스트(주)',
    role: '백엔드 개발자 · 주임',
    context: '백엔드 2명, 프론트엔드 1명의 3인 개발팀에서 20개 이상의 기업 고객 서비스를 Java·Spring Boot 기반으로 개발·운영했습니다.',
    responsibilities: [
      {
        title: 'REST API 설계·개발·운영',
        description: 'Java·Spring Boot 기반 기업용 플랫폼의 REST API 설계·개발 및 운영',
      },
      {
        title: '기업 고객 서비스 개발·운영',
        description: '20개 이상의 기업 고객 서비스를 개발·운영하고 고객별 요구사항을 반영했습니다.',
      },
      {
        title: '운영 장애·데이터 오류 개선',
        description: '운영 장애와 데이터 오류의 원인을 분석하고 API·DB 로직을 개선했습니다.',
      },
      {
        title: '배포·운영',
        description: 'Docker 기반 배포와 서비스 운영을 담당했습니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'MySQL', 'AWS S3', 'JUnit'],
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
    stack: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Django', 'MySQL', 'MongoDB', 'Docker'],
  },
] as const;

export const resumeIntro = 'Java·Spring Boot 기반의 5년 차 백엔드 개발자입니다.';

export const resumeHighlights = [
  '20개 이상의 기업 고객 서비스를 개발·운영',
  '백엔드 2명, 프론트엔드 1명의 3인 개발팀에서 협업',
  'Java·Spring Boot 기반 REST API 개발·운영',
  '요구사항 분석, 데이터 모델링, 운영 이슈 원인 분석 및 개선',
  '공공·실시간 데이터 수집·가공과 백엔드 기능 구현',
  'Docker 기반 배포·운영',] as const;

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
    label: '백엔드',
    items: ['Java', 'Spring Boot', 'Spring Data JPA', 'QueryDSL'],
  },
  {
    label: '데이터베이스',
    items: ['MySQL', 'PostgreSQL', 'MongoDB'],
  },
  {
    label: '테스트·인프라',
    items: ['JUnit', 'Testcontainers', 'REST Docs', 'Docker', 'AWS S3'],
  },
  {
    label: '데이터·메시징',
    items: ['Python', 'FastAPI', 'Kafka', 'Redis', 'RabbitMQ'],
  },
] as const;
