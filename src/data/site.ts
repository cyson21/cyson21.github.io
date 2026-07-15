const publicResumeUrl = import.meta.env.PUBLIC_RESUME_URL?.trim() || '/downloads/resume.pdf';
const siteUpdatedAt = '2026-07-16';

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
    role: 'Backend Engineer · 주임',
    context: '기업용 플랫폼의 API와 이벤트 기능을 개발·운영하며 요구사항 분석부터 데이터 저장 구조 설계, 회귀 테스트와 스테이징 검증까지 담당합니다.',
    highlights: [
      {
        title: '상태 변경 충돌 방지',
        problem: '사용자가 화면을 연 뒤 저장하기 전에 처리 상태가 바뀌면 오래된 기준으로 저장되어 진행 상태와 완료 여부가 어긋날 수 있었습니다.',
        action: '저장 직전에 최신 상태를 다시 확인하고 유효하지 않은 변경을 차단했으며 정상·차단 경로를 테스트했습니다.',
        result: '동시에 상태가 바뀌어도 잘못된 완료 처리가 저장되지 않도록 보호했습니다.',
      },
      {
        title: '시간대 변환 오류',
        problem: 'UTC 기준 날짜를 KST 일정으로 변환하는 과정에서 알림이 하루 늦게 실행되거나 누락되는 오류가 있었습니다.',
        action: '날짜가 바뀌는 경계 조건을 재현해 변환·발송 규칙을 수정하고 회귀 테스트를 추가했습니다.',
        result: '시간대 경계에서도 예정된 날짜에 실행되는지 회귀 테스트와 스테이징에서 검증했습니다.',
      },
      {
        title: '조회·삭제 조건 일치',
        problem: '같은 사용자 ID에 서로 다른 유형의 데이터가 연결될 때 일부 행이 누락되고 페이지 합계가 달라지는 오류가 있었습니다.',
        action: 'ID와 데이터 유형을 함께 비교하도록 조회·삭제 조건을 통일하고 통합 테스트로 결과를 비교했습니다.',
        result: '조회 결과, 삭제 범위와 페이지 합계가 같은 기준으로 계산되도록 수정했습니다.',
      },
      {
        title: 'AWS SDK 전환과 테스트 표준화',
        problem: 'S3 연동 코드에 구형 AWS SDK와 기능별 테스트 설정이 혼재해 변경 영향과 회귀 여부를 확인하기 어려웠습니다.',
        action: 'S3 업로드·인증 코드를 AWS SDK v2로 통일하고 실제 MySQL을 사용하는 공통 통합 테스트 환경을 구성했습니다.',
        result: '구형 의존성 제거부터 빌드 산출물과 S3 동작까지 확인해 전환 후에도 기존 기능이 유지되는지 검증했습니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'QueryDSL', 'MySQL', 'AWS S3', 'JUnit', 'Testcontainers'],
  },
  {
    start: '2021-07',
    end: '2024-03',
    company: '주식회사 화이트스캔',
    role: 'Backend/Data Engineer · 연구원',
    context: '공공·실시간 데이터 수집과 가공, REST API 제공, 예측 결과 연동과 Docker 기반 배포·운영을 담당했습니다.',
    highlights: [
      {
        title: '실시간 데이터 파이프라인',
        problem: '서로 다른 외부 API의 응답 주기와 데이터 형식을 서비스에서 일관되게 사용해야 했습니다.',
        action: '수집·정제·저장 흐름과 Spring Boot·FastAPI 기반 제공 API를 구현했습니다.',
        result: '수집 원본에서 서비스 응답까지 이어지는 데이터 처리 경계를 운영 가능한 형태로 구성했습니다.',
      },
      {
        title: '예측 결과 서비스 연동',
        problem: '시계열 분석 결과를 모델 결과로만 남기지 않고 실제 서비스 지표와 기능에서 조회할 경로가 필요했습니다.',
        action: '입력 데이터를 가공하고 예측 결과 저장·조회 API와 서비스 지표 연동을 구현했습니다.',
        result: '분석 결과가 API와 화면 기능에서 반복적으로 사용되는 데이터 흐름을 만들었습니다.',
      },
      {
        title: '배포와 운영',
        problem: '수집기, API와 데이터 처리 작업의 실행 환경이 달라 배포와 재실행 절차가 분산됐습니다.',
        action: '서비스를 Docker로 컨테이너화하고 MySQL·MongoDB 스키마와 실행 구성을 함께 관리했습니다.',
        result: '개발 환경과 배포 환경의 실행 차이를 줄이고 서비스별 운영 경계를 분리했습니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Python', 'FastAPI', 'Django', 'MySQL', 'MongoDB', 'Docker'],
  },
] as const;

export const profile = {
  name: '손찬양',
  englishName: 'Son Chanyang',
  role: 'Java/Spring Backend Engineer',
  statement: 'Java/Spring으로 상태 정합성, 부분 실패 복구와 데이터 흐름을 설계하고 회귀 테스트와 재현 가능한 실행으로 검증합니다.',
  email: 'cyson21@kakao.com',
  github: 'https://github.com/cyson21',
  resumePath: publicResumeUrl,
  updatedAt: siteUpdatedAt,
} as const;

export const capabilities = [
  {
    id: '01',
    title: '운영 장애 분석',
    description: '로그, API 흐름과 DB 상태를 함께 추적해 재현 조건을 찾고 회귀 테스트와 스테이징 검증으로 수정 범위를 확인합니다.',
    signal: 'reproduce → isolate → verify',
  },
  {
    id: '02',
    title: '상태 정합성',
    description: '트랜잭션, 멱등 처리, 조건부 갱신과 종료 상태 규칙으로 중복·지연·동시 요청 뒤에도 상태를 보호합니다.',
    signal: 'invariant → guard → convergence',
  },
  {
    id: '03',
    title: '데이터 흐름',
    description: '수집, 표준화, 이벤트 발행과 재처리 경계를 분리하고 source부터 결과까지 추적 가능한 근거를 남깁니다.',
    signal: 'source → event → lineage',
  },
  {
    id: '04',
    title: '플랫폼 전환',
    description: '구형 의존성을 교체하고 공통 테스트 기반을 적용한 뒤 빌드 결과와 실제 연동 기능을 함께 확인합니다.',
    signal: 'impact → migrate → prove',
  },
] as const;

export const experiences = experienceRecords.map((experience) => ({
  ...experience,
  period: `${formatMonth(experience.start)} – ${experience.end ? formatMonth(experience.end) : '현재'}`,
}));

export const careerPeriod = `${formatMonth(experienceRecords.at(-1)?.start ?? experienceRecords[0].start)} → 현재`;

export const skillGroups = [
  {
    label: '실무 핵심',
    items: ['Java', 'Spring Boot', 'Spring Data JPA', 'QueryDSL', 'MySQL'],
  },
  {
    label: '검증·인프라',
    items: ['AWS S3', 'Docker', 'JUnit', 'Testcontainers', 'REST Docs'],
  },
  {
    label: '프로젝트·이전 경력',
    items: ['Python', 'FastAPI', 'PostgreSQL', 'MongoDB', 'Kafka', 'Redis', 'RabbitMQ'],
  },
] as const;
