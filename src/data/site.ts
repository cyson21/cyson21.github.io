const publicResumeUrl = import.meta.env.PUBLIC_RESUME_URL?.trim() || '/downloads/resume.pdf';
const siteUpdatedAt = '2026-07-19';

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
    context: '기업용 플랫폼의 API와 이벤트 기능을 개발·운영하며 요구사항 분석, 데이터 모델과 비즈니스 로직 설계, 운영 안정성 개선과 테스트를 담당합니다.',
    responsibilities: [
      {
        title: '플랫폼 API 개발·운영',
        description: '요구사항을 분석하고 데이터 모델과 비즈니스 로직을 설계해 기업용 플랫폼의 API와 이벤트 기능을 개발·운영합니다.',
      },
      {
        title: '운영 안정성 개선',
        description: '운영 중 발생하는 상태·일정·데이터 처리 문제를 분석하고 저장·알림·조회 규칙을 개선합니다.',
      },
      {
        title: '테스트 체계 정비',
        description: '회귀·통합 테스트를 작성하고 공통 테스트 환경을 정비해 기능 변경과 운영 이슈의 재발 여부를 검증합니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'QueryDSL', 'MySQL', 'AWS S3', 'JUnit', 'Testcontainers'],
  },
  {
    start: '2021-07',
    end: '2024-03',
    company: '주식회사 화이트스캔',
    role: '백엔드·데이터 개발자 · 연구원',
    context: '공공·실시간 데이터의 수집·가공, REST API 개발, 예측 결과 연동과 Docker 기반 배포·운영을 담당했습니다.',
    responsibilities: [
      {
        title: '데이터 수집·가공',
        description: '공공·실시간 데이터를 수집·정제·저장하고 서로 다른 외부 API 형식을 내부 데이터 구조로 통일했습니다.',
      },
      {
        title: '서비스 API 개발',
        description: '수집 데이터와 예측 결과를 저장·조회하는 REST API와 서비스 연동 기능을 개발했습니다.',
      },
      {
        title: '배포·운영',
        description: '수집기, API와 데이터 처리 작업을 컨테이너화하고 실행 환경과 데이터베이스 구성을 관리했습니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Django', 'MySQL', 'MongoDB', 'Docker'],
  },
] as const;

export const profile = {
  name: '손찬양',
  englishName: 'Son Chanyang',
  role: 'Java·Spring 백엔드 개발자',
  statement: 'Java와 Spring으로 기업용 플랫폼 API를 개발·운영하며 데이터 모델 설계, 운영 안정성 개선과 테스트를 담당해 왔습니다.',
  email: 'cyson21@kakao.com',
  github: 'https://github.com/cyson21',
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
