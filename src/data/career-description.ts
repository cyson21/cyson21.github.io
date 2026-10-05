import { experiences, resumeWorkCases } from './site';

// Shared case facts are retained; each document selects its own depth.
const details = [
  {
    anchor: 'work-policy',
    cause: '화면 진입 시점의 상태를 저장할 때도 유효한 값으로 취급했습니다. 변경 허용 여부와 후속 데이터 갱신도 같은 상태를 기준으로 판단하지 않았습니다.',
    decision: '화면을 연 뒤에도 상태가 바뀔 수 있으므로 변경 허용 여부는 최종 저장 요청에서 판단해야 했습니다. 변경 차단과 후속 갱신이 서로 다른 기준을 사용하지 않도록 서버의 상태 조회 기준을 통일했습니다.',
    evidence: '정상 변경, 저장 전 상태 전이, 기존 이력 존재, 필수 입력 누락을 다루는 단위 테스트와 당시 결과 기록이 있습니다.',
    scope: '저장 시점 재검증으로 변경을 차단하는 범위입니다. DB 수준의 모든 동시성 경합을 원자적으로 막는다고 확대하지 않습니다.',
  },
  {
    anchor: 'work-purchase',
    cause: '주문 저장·컬렉션 갱신에서 락이 경합했습니다. 트랜잭션 분리 후에는 결제 처리가 앞 단계의 커밋보다 먼저 실행돼 필요한 요청 상태를 조회하지 못했습니다.',
    decision: '분산락으로 동시 구매 요청을 제어하고, 결제 처리가 필요한 상태를 읽을 수 있도록 먼저 커밋했습니다. 재시도는 락 관련 예외에만 적용했습니다.',
    evidence: '동시 요청·락 재시도·결제 완료 주문의 재처리 테스트가 있습니다. 초기 QA에서 결제 요청 상태를 읽지 못하는 문제가 드러나 커밋 순서를 수정했습니다. 최종 테스트 실행 결과와 운영 재발률은 현재 자료에서 확인되지 않았습니다.',
    scope: '초기 기록의 예상 PASS를 실행 성공으로 쓰지 않습니다. 운영 데드락 감소율과 이벤트 리스너를 통한 비동기 분리는 확인된 결과에 포함하지 않습니다.',
  },
  {
    anchor: 'work-batch',
    cause: '각 서버의 스케줄러가 같은 배치를 실행했습니다. 실행 기록만 확인하면 요청 발행이 누락된 배치와 발행 후 결과가 없는 배치를 구분하기 어려웠습니다.',
    decision: '중복 실행은 분산락으로 제어했습니다. 모니터링은 예정된 고객사·배치 목록과 실행 기록을 대조해 실패뿐 아니라 실행 누락도 찾도록 구현했습니다.',
    evidence: '조치 후 서버 로그와 DB 기록으로 배치 실행 결과를 확인했습니다. 고객사·배치별 성공·실패, 처리 건수와 실행 시간을 기록하고 예정 목록 대조·Slack 알림 로직을 구현했습니다. 관련 테스트 정의가 남아 있습니다.',
    scope: '당시 로그 원본과 전후 중복 횟수는 현재 자료에 없습니다. 분산락 도입과 모니터링은 별도 시기의 개선이며, 장애 상황까지 정확히 한 번 실행을 보장한다고 쓰지 않습니다.',
  },
  {
    anchor: 'work-identity',
    cause: '사용자 ID만 비교하는 동등성·제외 조건이 서로 다른 그룹의 행을 같은 대상으로 취급했습니다. 조회 후 필터링과 별도 합계 계산은 페이지 내용과 총건수에도 다른 기준을 적용했습니다.',
    decision: '삭제 대상과 컬렉션에 남길 행을 같은 식별 기준으로 구분해야 했습니다. 페이지 내용과 총건수도 동일한 필터 조건이 필요해, 조회 후 제외하던 처리를 DB 쿼리 단계로 옮겼습니다.',
    evidence: '같은 사용자의 서로 다른 그룹을 Set에서 보존하는 경우, 선택한 조합만 삭제하는 경우, 일부 그룹 제외와 페이지 경계를 다루는 테스트 및 당시 검증 기록이 있습니다.',
    scope: '당시 검증 기록과 테스트 정의를 근거로 설명합니다. 전체 API의 정합성이나 조회 성능 향상을 수치로 확대하지 않습니다.',
  },
] as const;

export const careerCases = resumeWorkCases.map(item => {
  const detail = details.find(candidate => candidate.anchor === item.anchor);
  if (!detail) throw new Error(`Missing career detail: ${item.anchor}`);
  return { ...item, ...detail };
});
export const careerPrimaryCases = ['work-batch', 'work-purchase'].map(anchor => careerCases.find(item => item.anchor === anchor)!);
export const careerAdditionalCases = ['work-policy', 'work-identity'].map(anchor => careerCases.find(item => item.anchor === anchor)!);
const currentExperience = experiences[0];
if (!currentExperience) throw new Error('경력기술서에는 현재 회사 경력이 필요합니다.');
export const careerBusinessWorks = [
  { ...currentExperience.responsibilities[0], detail: '기업 고객의 요구사항에 맞춰 REST API를 개발했습니다. 관리자 기능 개편에서는 기존 데이터와 처리 순서를 확인하고 JPA·QueryDSL·MySQL 조회·저장 로직을 수정했습니다.' },
  { ...currentExperience.responsibilities[1], detail: '플랫폼 2.0에서 3.0으로 전환하면서 변경된 API·DB가 기존 기능에 미치는 영향을 점검했습니다. 레거시 코드와 데이터 접근 로직을 정리하고 통합·회귀 테스트로 기존 동작을 확인했습니다.' },
  { title: '데이터 정합성·운영 오류 대응', description: '운영 장애와 데이터 오류를 재현하고 원인을 추적했습니다.', detail: '서버 로그와 DB 기록으로 오류가 발생한 조회·저장 로직을 찾아 수정했습니다. 저장 직전 상태 확인, 복합 식별자 적용, 분산락과 트랜잭션 분리 등을 담당했습니다.' },
  { ...currentExperience.responsibilities[5], detail: 'EC2·RDS·Lambda·CloudWatch·WAF 기반 운영과 Docker 배포·전환 이슈 대응에 참여했습니다. CI/CD 파이프라인 안정화와 코드리뷰 기반 배포 품질 관리에 참여하며 배포 전 주요 기능을 확인했습니다.' },
];
