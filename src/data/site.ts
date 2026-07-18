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
    context: '기업용 플랫폼의 API와 이벤트 기능을 개발·운영하며 요구사항 분석, 데이터 모델 설계, 기능 구현과 회귀 테스트를 담당합니다.',
    highlights: [
      {
        title: '상태 변경 충돌 방지',
        problem: '사용자가 화면을 연 뒤 저장하기 전에 처리 상태가 바뀌면 오래된 기준으로 저장되어 진행 상태와 완료 여부가 어긋날 수 있었습니다.',
        action: '저장 직전에 최신 상태를 다시 확인하고 유효하지 않은 변경을 차단했으며 정상·차단 경로를 테스트했습니다.',
        result: '정상 요청은 그대로 처리되고, 저장 전 상태가 달라진 요청은 거절되는 것을 회귀 테스트로 검증했습니다.',
      },
      {
        title: '시간대 변환 오류',
        problem: 'UTC 기준 날짜를 KST 일정으로 변환하는 과정에서 알림이 하루 늦게 실행되거나 누락되는 오류가 있었습니다.',
        action: '날짜가 바뀌는 경계 조건을 재현해 변환·발송 규칙을 수정하고 회귀 테스트를 추가했습니다.',
        result: 'UTC 기준일이 바뀌는 시각 전후에도 알림이 올바른 KST 날짜에 실행되는 것을 회귀 테스트로 검증했습니다.',
      },
      {
        title: '조회·삭제 조건 일치',
        problem: '같은 사용자 ID에 서로 다른 유형의 데이터가 연결될 때 일부 행이 누락되고 페이지 합계가 달라지는 오류가 있었습니다.',
        action: 'ID와 데이터 유형을 함께 비교하도록 조회·삭제 조건을 통일하고 통합 테스트로 결과를 비교했습니다.',
        result: '같은 ID가 여러 데이터 유형에 연결된 사례에서도 조회 건수와 페이지 합계가 일치함을 확인했습니다.',
      },
      {
        title: 'AWS SDK 전환과 테스트 표준화',
        problem: 'S3 연동 코드에 구형 AWS SDK와 기능별 테스트 설정이 혼재해 변경 영향과 회귀 여부를 확인하기 어려웠습니다.',
        action: 'S3 업로드·인증 코드를 AWS SDK v2로 통일하고 실제 MySQL을 사용하는 공통 통합 테스트 환경을 구성했습니다.',
        result: '구형 의존성을 제거하고 공통 환경에서 모듈 테스트와 빌드 산출물을 검증하도록 정리했습니다.',
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
    highlights: [
      {
        title: '실시간 데이터 파이프라인',
        problem: '서로 다른 외부 API의 응답 주기와 데이터 형식을 서비스에서 일관되게 사용해야 했습니다.',
        action: '수집·정제·저장 흐름과 Spring Boot·FastAPI 기반 제공 API를 구현했습니다.',
        result: '외부 API의 형식 차이를 내부 저장 형식으로 통일했습니다.',
      },
      {
        title: '예측 결과 서비스 연동',
        problem: '시계열 분석 결과를 모델 결과로만 남기지 않고 실제 서비스 지표와 기능에서 조회할 경로가 필요했습니다.',
        action: '입력 데이터를 가공하고 예측 결과 저장·조회 API와 서비스 지표 연동을 구현했습니다.',
        result: '예측 결과를 저장하고 API와 서비스 지표에서 조회할 수 있게 했습니다.',
      },
      {
        title: '배포와 운영',
        problem: '수집기, API와 데이터 처리 작업의 실행 환경이 달라 배포와 재실행 절차가 분산됐습니다.',
        action: '서비스를 Docker로 컨테이너화하고 MySQL·MongoDB 스키마와 실행 구성을 함께 관리했습니다.',
        result: '수집기·API·데이터 처리 작업을 독립적으로 배포·재실행할 수 있게 했습니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Django', 'MySQL', 'MongoDB', 'Docker'],
  },
] as const;

export const profile = {
  name: '손찬양',
  englishName: 'Son Chanyang',
  role: 'Java·Spring 백엔드 개발자',
  statement: 'Java와 Spring으로 기업용 플랫폼 API를 개발·운영하며 상태 충돌과 시간대 오류를 재현하고 회귀 테스트로 해결해 왔습니다.',
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
