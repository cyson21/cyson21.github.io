import { previousCompanyProjects } from './site';

// Career documents describe projects and sustained responsibilities.
// Technical incident narratives belong to the separate portfolio case pages.
export const currentCareerAreas = [
  {
    title: '교육 플랫폼 API와 관리자 기능',
    scope: '20개 이상의 기업 고객 서비스를 제공하는 B2B 리테일 교육 플랫폼. 4인 개발팀에서 백엔드 개발·운영을 담당했습니다.',
    contributions: [
      '기업 고객 요구사항에 맞춰 REST API와 관리자 기능을 개발했습니다. Java·Spring Boot를 사용하고 JPA·QueryDSL·MySQL 기반 조회·저장 로직을 구현·개선했습니다.',
      '운영 중인 서비스의 기능 변경과 데이터 처리 요구를 반영하며 백엔드 유지보수를 담당했습니다.',
    ],
  },
  {
    title: '플랫폼 2.0 → 3.0 전환',
    scope: '운영 서비스의 기능 개편과 버전 전환에 참여했습니다.',
    contributions: [
      'API·DB 변경이 기존 기능에 미치는 영향을 점검하고, 전환 대상의 레거시 코드와 데이터 접근 로직을 정리했습니다.',
      '변경 기능의 통합·회귀 테스트를 보완하고 코드리뷰를 통해 전환 과정의 변경 사항을 검토했습니다.',
    ],
  },
  {
    title: '비동기 처리·운영 자동화·배포',
    scope: '백엔드 기능 개발과 함께 서비스 운영에 필요한 처리·관측·배포 작업을 수행했습니다.',
    contributions: [
      'RabbitMQ 기반으로 발송 요청 접수와 후속 결과 기록을 분리하는 비동기 처리 변경에 참여했습니다. 작업 실행 현황과 처리 결과를 확인하는 모니터링 및 Slack 알림을 구현했습니다.',
      'AWS EC2·RDS·Lambda·CloudWatch·WAF 운영, Docker 배포·전환과 CI/CD 개선에 참여했습니다.',
    ],
  },
] as const;

export const previousCareerProjects = ['인파관리 시스템 백엔드·알림 서비스', '인파 이동 시뮬레이터', '서울시 실시간 도시데이터·Open API', '지자체 공공데이터·REST API'].map(title => {
  const project = previousCompanyProjects.find(item => item.title === title);
  if (!project) throw new Error(`Missing career project: ${title}`);
  return project;
});
