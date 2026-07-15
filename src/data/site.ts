const publicResumeUrl = import.meta.env.PUBLIC_RESUME_URL?.trim() || '/downloads/resume.pdf';
const siteUpdatedAt = '2026-07-15';

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
    context: '기업용 플랫폼의 API와 이벤트 모듈을 개발·운영하며 요구사항 분석부터 저장소 설계, 회귀 테스트와 스테이징 검증까지 담당합니다.',
    highlights: [
      {
        title: '상태 변경 정합성',
        problem: '편집과 저장 사이에 처리 상태가 바뀌면 이전 완료 기준이 남아 진행 상태와 완료 여부가 서로 다른 기준을 참조했습니다.',
        action: '저장 시 현재 상태를 다시 검증하고 유효하지 않은 변경을 차단했으며 정상·차단 경로를 단위·통합 테스트로 고정했습니다.',
        result: '상태 변경 사이의 시간차가 잘못된 완료 판정으로 이어지지 않도록 보호 규칙을 명시했습니다.',
      },
      {
        title: '시간대 경계 장애',
        problem: 'UTC 시작일을 KST 스케줄로 변환하는 날짜 경계에서 실행 시점이 하루 밀리거나 누락되는 경로가 있었습니다.',
        action: '기간 유형과 등록 시각을 조합한 네 가지 시나리오를 재현하고 계산 규칙과 회귀 테스트를 수정했습니다.',
        result: '날짜 경계별 기대 실행일을 테스트와 스테이징 QA에서 같은 기준으로 확인했습니다.',
      },
      {
        title: '복합 조회 정확성',
        problem: '하나의 사용자에게 여러 대상 유형이 연결되면 ID만 비교한 조회와 삭제에서 행 누락과 페이지 합계 불일치가 발생했습니다.',
        action: '사용자 ID와 대상 유형의 복합 조건을 QueryDSL 조회·삭제에 적용하고 통합 테스트로 결과를 비교했습니다.',
        result: '조회 결과, 삭제 범위와 페이지 합계가 같은 식별 기준을 사용하도록 정리했습니다.',
      },
      {
        title: 'SDK와 테스트 기반 전환',
        problem: '여러 모듈에 오래된 AWS SDK 경로와 수동 JPA 테스트 설정이 남아 전환 범위와 회귀 여부를 확인하기 어려웠습니다.',
        action: '세 모듈의 S3·인증 경로를 AWS SDK v2로 통일하고 Testcontainers MySQL 기반 공통 저장소 테스트를 구성했습니다.',
        result: '모듈 테스트, 의존성 트리·JAR 검사와 스테이징 S3 회귀 경로로 활성 코드와 테스트 기반을 함께 확인했습니다.',
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
    description: '의존성 전환과 공통 테스트 기반을 단계적으로 적용하고 의존성 트리, 산출물과 실제 회귀 경로를 함께 확인합니다.',
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
