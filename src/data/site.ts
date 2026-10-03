const siteUpdatedAt = '2026-10-03';

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
        description: '운영 장애와 데이터 오류를 재현해 원인을 추적하고 API·DB 로직을 수정했습니다. 저장 시점 상태 검증, 분산락 기반 배치 제어와 구매 API 트랜잭션 분리, 복합 식별자 처리와 회귀 테스트를 다뤘습니다.',
      },
      {
        title: 'AWS 인프라·CI/CD·배포 운영',
        description: 'AWS EC2·RDS·Lambda·CloudWatch·WAF 기반 배포·모니터링·운영에 참여했습니다. Docker 배포·전환 이슈에 대응하고 CI/CD 파이프라인 안정화와 코드리뷰 기반 배포 품질 관리에 참여했습니다.',
      },
    ],
    stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'QueryDSL', 'MySQL', 'Redis', 'ShedLock', 'Redisson', 'RabbitMQ', 'AWS EC2', 'AWS RDS', 'AWS S3', 'AWS Lambda', 'CloudWatch', 'AWS WAF', 'AWS SDK v2', 'Docker', 'JUnit', 'Testcontainers', 'REST Docs', 'Git'],
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

export const professionalSummary = 'B2B 리테일 교육 플랫폼과 공공·실시간 데이터 서비스의 API를 개발·운영했습니다. 상태 변경, 다중 서버의 배치 중복 실행, 구매 API 락 경합과 데이터 식별자 오류를 분석하고 서버 로직을 수정했습니다.';

export const resumeWorkCases = [
  {
    anchor: 'work-policy',
    title: '저장 시점의 상태 변경으로 발생하는 데이터 오류 방지',
    problem: '설정 변경 화면을 연 뒤 관련 작업이 시작되면, 이전 상태를 기준으로 저장하면서 진행 중인 작업에 서로 다른 처리 기준이 적용될 수 있었습니다.',
    change: '저장 직전 서버에서 현재 상태를 다시 확인하도록 수정했습니다. 화면 진입 후 작업이 시작됐다면 변경을 차단하고, 후속 데이터 갱신 기준도 같은 상태 조회로 통일했습니다.',
    verification: '정상 변경·저장 전 상태 전이·필수 입력 누락을 다루는 단위 테스트와 저장된 검증 기록.',
  },
  {
    anchor: 'work-purchase',
    title: '구매 API의 락 경합과 트랜잭션 경계 조정',
    problem: '동시 구매 요청에서 주문 저장 중 DB 데드락이 발생했습니다. 결제 처리를 별도 트랜잭션으로 옮기자 앞 단계의 미커밋 상태를 읽는 문제도 드러났습니다.',
    change: '주문 단위 분산락과 별도 트랜잭션, 락 오류의 제한적 재시도를 적용했습니다. 결제 요청 상태를 먼저 커밋하도록 호출 경계를 조정하고, 재처리 시 결제 완료 상태를 확인했습니다.',
    verification: '동시 요청·락 예외·결제 완료 재처리 테스트 정의. 저장된 초기 QA 기록의 추가 검증 항목은 별도로 관리.',
  },
  {
    anchor: 'work-batch',
    title: '배치 중복 실행 제어와 실패·실행 누락 모니터링',
    problem: '서버마다 스케줄러가 실행돼 같은 배치가 중복 처리됐습니다. 고객사별로 예정된 배치의 실패와 실행 누락도 구분해야 했습니다.',
    change: 'ShedLock·Redis 분산락을 적용했습니다. 별도 개선으로 고객사·배치별 상태를 집계하고, 예정 시각 1시간 후 실패·발행 누락·결과 미수신을 구분해 Slack으로 알리도록 구현했습니다.',
    verification: '서버 로그·DB 기록으로 실행 결과 확인. 스케줄러·상태 집계 코드와 관련 테스트 정의 대조. 운영 개선 수치는 미확인.',
  },
  {
    anchor: 'work-identity',
    title: '복합 식별자 누락으로 발생한 삭제·페이지 집계 오류 수정',
    problem: '같은 사용자의 여러 그룹 데이터를 사용자 ID만으로 구분해 삭제 대상이 누락되고, 조회 제외 조건과 페이지 집계도 실제 행 수와 어긋났습니다.',
    change: '사용자 ID와 그룹 유형의 복합 식별자를 조회·삭제·컬렉션 동등성에 적용했습니다. 제외 조건을 DB 쿼리로 옮기고 페이지 집계를 맞췄습니다.',
    verification: '같은 사용자·다른 그룹의 동시 삭제, 일부 그룹 제외와 페이지 경계를 다루는 테스트 및 저장된 검증 기록.',
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
  '운영 문제의 재현과 원인 분석을 서버 로직 수정으로 연결합니다. 실무의 상태 보호·락 경합·데이터 정합성 사례를 중심으로 소개합니다.';

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
  careerDescriptionPath: '/downloads/career-description.pdf',
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
    label: '분산락·메시징',
    items: ['Redis', 'ShedLock', 'Redisson', 'RabbitMQ'],
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
