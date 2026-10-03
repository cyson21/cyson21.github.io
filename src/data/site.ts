const siteUpdatedAt = '2026-10-04';

const formatMonth = (value: string) => value.replace('-', '.');
export const formatDate = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  return `${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`;
};

// Project dates and responsibilities are retained from the saved career records.
export const previousCompanyProjects = [
  {
    title: '서울시 실시간 도시데이터·Open API',
    period: '2022.01 – 2023.02',
    role: 'Open API 개발, 데이터 수집·가공, 서비스 지표·예측 결과 연동, 배포·운영',
    description: 'Spring Boot Open API와 Python·Pandas 수집·가공 파이프라인을 구현했습니다. 시계열 예측 결과를 서비스 지표·기능에 연동하고 Docker로 배포·운영했습니다.',
    context: '실시간 데이터를 지도 서비스와 외부 조회 API에서 사용할 수 있도록 수집·가공·제공하는 프로젝트입니다.',
    contribution: 'Spring Boot 기반 Open API를 개발·운영하고 Python·Pandas로 데이터를 서비스 제공 형태로 가공했습니다. 지표 구성을 위한 데이터 분석과 TensorFlow 기반 시계열 예측 결과의 서비스 연동, Docker 배포·운영을 담당했습니다.',
    outcome: '수집 데이터와 예측 결과를 서비스 지표 및 조회 API로 제공했습니다.',
  },
  {
    title: '인파관리 시스템 백엔드·알림 서비스',
    period: '2023.06 – 2024.01',
    role: '백엔드 API, 데이터 수집·가공, 알림 서비스, DB 설계, 배포·운영',
    description: '이동통신 데이터의 수집·가공과 조회 REST API, 상황별 알림 서비스를 구현했습니다. DB 스키마 설계와 Docker 배포·운영을 담당했습니다.',
    context: '행정안전부 인파관리지원시스템에서 밀집 정보를 분석·가공하고 화면과 알림에 제공하는 백엔드 개발에 참여했습니다.',
    contribution: '수집·가공 데이터의 REST API와 실시간 데이터 처리 스크립트를 작성했습니다. 특이 상황 대응용 카카오톡·문자·메신저 알림 서비스를 구현하고 DB 스키마 설계 및 Docker 배포·운영을 담당했습니다.',
    outcome: '가공한 데이터를 화면 조회와 상황 알림에 연결했습니다.',
  },
  {
    title: '지자체 공공데이터·REST API',
    period: '2021.07 – 2024.03 중 병행',
    role: '데이터 수집·가공, API 개발, DB 구축, 배포·운영',
    description: '원주시·용인특례시 프로젝트에서 수집 에이전트, Pandas 가공, PostgreSQL·MySQL 구축과 Spring REST API 개발, Docker 배포를 수행했습니다.',
    context: '지자체 데이터를 수집하고 외부 서비스가 사용할 수 있는 Open API로 제공하는 프로젝트입니다.',
    contribution: '공공데이터 수집 에이전트와 Pandas 가공을 구현하고 PostgreSQL·MySQL을 구축했습니다. Spring·JPA·MyBatis 기반 REST API 개발과 Docker 배포를 수행했습니다.',
    outcome: '수집·가공·저장·API 제공·배포 업무에 참여했습니다.',
  },
  {
    title: '인파 이동 시뮬레이터',
    period: '2023.03 – 2024.03',
    role: '백엔드 API, 시뮬레이션 로직, 데이터 분석',
    description: 'j-Crowd Simulator 기반 시뮬레이터에 참여했습니다. 배경·캘리브레이션 데이터, 길찾기와 이동 모델, 군집·경로·도로 조건별 로직을 구현했습니다.',
    context: '이동 패턴과 도로 조건에 따른 인파 시나리오를 시뮬레이션하는 프로젝트입니다.',
    contribution: '배경·캘리브레이션 데이터를 구성하고 이동 패턴을 분석했습니다. 다익스트라 기반 길찾기, Social Force Model 튜닝, 군집·경로 생성과 도로 차단 등 시나리오별 로직 및 백엔드 API를 구현했습니다.',
    outcome: '이동 조건별 시나리오 구현에 참여했습니다.',
  },
] as const;

const experienceRecords = [
  {
    start: '2024-03', end: null,
    company: '이엠캐스트(주)', role: '백엔드 개발자 · 주임',
    context: '4인 개발팀에서 20개 이상의 기업 고객 서비스를 제공하는 B2B 리테일 교육 플랫폼의 백엔드 개발·운영을 담당했습니다.',
    responsibilities: [
      { title: 'API·데이터 접근 계층 개발', description: 'Java·Spring Boot REST API와 JPA·QueryDSL·MySQL 조회·저장을 구현하고 관리자 기능 개편을 지원했습니다.' },
      { title: '플랫폼 버전 전환·회귀 검증', description: '2.0 → 3.0 전환의 영향 범위를 점검하고 기존 기능을 검증했습니다. 레거시 코드와 API·DB 구조, 데이터 접근 로직을 정리했습니다.' },
      { title: '저장 시점의 상태 재검증', description: '화면 진입 후 상태가 바뀐 요청을 저장 직전 서버에서 다시 검증해 변경을 차단하고, 후속 데이터 갱신 기준을 통일했습니다.' },
      { title: '배치 중복 제어·실패 및 누락 모니터링', description: 'ShedLock·Redis 분산락을 적용했습니다. 별도 개선으로 고객사·배치별 상태·처리 건수·실행 시간을 집계하고 예정 시각 1시간 뒤 Slack으로 실패·누락을 알렸습니다.' },
      { title: '구매 API 락 경합·트랜잭션 개선', description: '주문 단위 분산락과 트랜잭션 분리, 제한적 락 재시도를 적용했습니다. 요청 상태의 커밋 경계를 조정하고 결제 완료 상태 확인으로 재처리를 보완했습니다.' },
      { title: 'AWS 인프라·CI/CD·배포 운영', description: 'EC2·RDS·Lambda·CloudWatch·WAF 운영과 Docker 배포·전환에 참여했습니다. CI/CD 파이프라인 안정화와 코드리뷰 기반 배포 품질 관리에 참여했습니다.' },
    ],
    stack: ['Java', 'Spring Boot', 'Spring Data JPA', 'QueryDSL', 'MySQL', 'Redis', 'ShedLock', 'Redisson', 'RabbitMQ', 'AWS EC2', 'AWS RDS', 'AWS S3', 'AWS Lambda', 'CloudWatch', 'AWS WAF', 'AWS SDK v2', 'Docker', 'JUnit', 'Testcontainers', 'REST Docs', 'Git'],
  },
  {
    start: '2021-07', end: '2024-03',
    company: '주식회사 화이트스캔', role: '백엔드·데이터 개발자 · 연구원',
    context: '공공·실시간 데이터 기반 서비스에서 데이터 수집·가공, 백엔드 API와 배포·운영을 담당했습니다.',
    responsibilities: previousCompanyProjects.map(({ title, description }) => ({ title, description })),
    stack: ['Java', 'Spring Boot', 'Python', 'Pandas', 'FastAPI', 'Django', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker'],
  },
] as const;

export const professionalSummary = '기업용 플랫폼의 API와 공공·실시간 데이터 처리 서비스를 개발하고, 데이터 정합성 및 운영·배포 흐름을 개선했습니다.';
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
    items: ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB'],
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
