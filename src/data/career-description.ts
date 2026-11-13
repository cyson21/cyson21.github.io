import professionalNarratives from './professional-case-narratives.json';
import { resumeWorkCases } from './site';

// Shared case facts are retained; each document selects its own depth.
const details = [
  {
    anchor: 'work-policy',
    cause: '화면 진입 시점의 상태를 저장할 때도 유효한 값으로 취급했습니다. 변경 허용 여부와 후속 데이터 갱신도 같은 상태를 기준으로 판단하지 않았습니다.',
    decision: '화면을 연 뒤에도 상태가 바뀔 수 있으므로 변경 허용 여부는 최종 저장 요청에서 판단해야 했습니다. 변경 차단과 후속 갱신이 서로 다른 기준을 사용하지 않도록 서버의 상태 조회 기준을 통일했습니다.',
    evidence: '저장소 대역을 사용하는 단위 테스트가 정상 변경·상태 전이·입력 누락과 저장·후속 호출 여부를 검사합니다. 당시 결과 기록은 있으나 후속 데이터의 실제 DB 갱신까지 검증한 결과는 아닙니다.',
    scope: '상태 조회와 저장 사이의 동시 변경까지 DB에서 원자적으로 차단하는 방식은 아닙니다.',
  },
  {
    anchor: 'work-purchase',
    cause: '주문 저장·컬렉션 갱신에서 락이 경합했습니다. 트랜잭션 분리 후에는 결제 처리가 앞 단계의 커밋보다 먼저 실행돼 필요한 요청 상태를 조회하지 못했습니다.',
    decision: '분산락으로 동시 요청을 제어하고, 결제 처리가 필요한 상태를 읽을 수 있도록 먼저 커밋했습니다. 재시도는 락 관련 예외에만 적용했습니다.',
    evidence: '초기 QA에서 결제 요청 상태를 읽지 못하는 문제가 드러나 커밋 순서를 수정했습니다. 관련 테스트는 저장소 대역에 락 예외를 발생시키고 재시도·완료 주문의 재처리 분기를 검사합니다. 실제 DB 데드락이나 분산락 경쟁을 재현한 검사는 아닙니다. 최종 테스트 실행 결과와 운영 재발률은 확인하지 못했습니다.',
    scope: '운영 데드락 감소율과 이벤트 리스너를 통한 비동기 분리는 확인되지 않았습니다.',
  },
  {
    anchor: 'work-batch',
    cause: '각 서버의 스케줄러가 같은 배치를 실행했습니다. 실행 기록만 확인하면 요청 발행이 누락된 배치와 발행 후 결과가 없는 배치를 구분하기 어려웠습니다.',
    decision: '중복 실행은 분산락으로 제어했습니다. 모니터링은 예정된 고객사·배치 목록과 실행 기록을 대조해 실패뿐 아니라 실행 누락도 찾도록 구현했습니다.',
    evidence: '당시 서버 로그·DB 기록으로 실행을 확인한 업무 경험과 구현을 근거로 설명합니다. 테스트는 고정 입력의 상태 집계, 시간 구간 및 스케줄·알림 구성 검사를 다룹니다. 다중 서버 동시 실행·Slack 실전송의 실행 결과는 확인하지 못했습니다.',
    scope: '전후 중복 횟수는 확인하지 못했으며, 장애 상황에서 정확히 한 번만 실행된다고 보장하지 않습니다.',
  },
  {
    anchor: 'work-identity',
    cause: '사용자 ID만 비교하는 동등성·제외 조건이 서로 다른 그룹의 행을 같은 대상으로 취급했습니다. 조회 후 필터링과 별도 합계 계산은 페이지 내용과 총건수에도 다른 기준을 적용했습니다.',
    decision: '삭제 대상과 컬렉션에 남길 행을 같은 식별 기준으로 구분해야 했습니다. 페이지 내용과 총건수도 동일한 필터 조건이 필요해, 조회 후 제외하던 처리를 DB 쿼리 단계로 옮겼습니다.',
    evidence: 'Set 동등성·선택 삭제 분기의 단위 테스트와 당시 결과 기록이 있습니다. 페이지 응답 검사는 서비스 대역이 반환한 총건수·페이지 값을 확인합니다. 실제 DB에서 제외 조건과 전체 건수를 대조한 통합 실행 결과와 구분합니다.',
    scope: '당시 검증 기록과 테스트 정의를 근거로 설명합니다. 전체 API의 정합성이나 조회 성능 향상을 수치로 확대하지 않습니다.',
  },
] as const;

export const careerCases = resumeWorkCases.map(item => {
  const detail = details.find(candidate => candidate.anchor === item.anchor);
  if (!detail) throw new Error(`Missing career detail: ${item.anchor}`);
  return { ...item, ...detail };
});

// The career PDF and web details share the same professional narratives.
export const careerPrintSheets = professionalNarratives.sheets;
