const publicResumeUrl = import.meta.env.PUBLIC_RESUME_URL?.trim() || '/downloads/resume.pdf';
const siteUpdatedAt = '2026-07-22';

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
    context: '기업용 플랫폼에서 요구사항을 API·데이터 모델로 설계하고, 운영 이슈의 재현·수정·회귀 검증까지 맡았습니다.',
    responsibilities: [
      {
        title: '상태 변경 충돌 방지',
        description: '사용자가 화면을 연 뒤 저장하기 전에 상태가 바뀌면, 이전 상태를 기준으로 저장되어 진행 상태와 완료 여부가 어긋나는 문제가 있었습니다. 저장 직전에 최신 상태를 다시 검증해, 이미 상태가 변경된 건은 저장되지 않도록 수정했습니다.',
      },
      {
        title: '시간대 경계 알림 오류',
        description: 'UTC로 저장된 날짜를 KST 발송 일정으로 해석하는 날짜 경계에서 알림이 누락되거나 하루 늦게 발송되는 오류를 재현했습니다. 변환과 발송 규칙을 수정하고, 경계 조건을 회귀 테스트로 확인했습니다.',
      },
      {
        title: '조회·삭제 조건 일치',
        description: '같은 사용자 ID에 서로 다른 유형의 데이터가 연결될 때 일부 행이 누락되고 페이지 합계가 달라지는 원인을 확인했습니다. ID와 데이터 유형을 함께 비교하도록 QueryDSL 조회·삭제 조건을 통일하고 통합 테스트로 검증했습니다.',
      },
      {
        title: 'AWS SDK v2 전환',
        description: 'S3 연동에 섞여 있던 구형 AWS SDK 의존성을 v2로 통일하고, 업로드·인증 구현의 기준을 정리했습니다. 구형 의존성 제거와 모듈 테스트·빌드 검증으로 전환 범위를 확인했습니다.',
      },
      {
        title: 'DB 테스트 표준화',
        description: '테스트마다 반복되던 MySQL 컨테이너와 설정을 Testcontainers 기반 공통 구성으로 묶었습니다. QueryDSL 조회와 시간대 처리 로직을 실제 MySQL 조건에서 일관되게 반복 검증할 수 있게 했습니다.',
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

export const resumeSummary = [
  '기업용 플랫폼의 API와 이벤트 모듈을 Java·Spring Boot로 개발·운영해 온 5년 경력 백엔드 개발자입니다.',
  '운영 오류를 재현해 상태 변경과 시간대 처리의 경계 규칙을 바로잡고, 회귀 테스트로 재발 경로를 관리해 왔습니다.',
] as const;

export const profile = {
  name: '손찬양',
  englishName: 'Son Chanyang',
  role: 'Java·Spring 백엔드 개발자',
  statement: resumeSummary.join(' '),
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
