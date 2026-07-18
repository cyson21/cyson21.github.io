# 손찬양 | 백엔드 개발자 웹 포트폴리오

Java와 Spring을 중심으로 상태 정합성, 부분 실패 복구, 이벤트 처리와 데이터 흐름 문제를 해결한 프로젝트를 정리했습니다.

[웹 포트폴리오](https://cyson21.github.io/) · [이력서 PDF](https://github.com/cyson21/portfolio-hub/releases/download/latest/resume.pdf) · [통합 포트폴리오 PDF](https://github.com/cyson21/portfolio-hub/releases/download/latest/portfolio-complete.pdf)

## 대표 프로젝트

| 프로젝트 | 주요 내용 |
|---|---|
| [StockRush](https://cyson21.github.io/projects/stockrush/) | 중복 주문과 결제 실패, Kafka 중단 뒤 주문·재고·Outbox 상태 수렴 |
| [Member Event Consistency](https://cyson21.github.io/projects/member-event-consistency/) | 최초 보상 1회, 쿠폰 수량, 포인트 잔액을 동시 요청에서도 보호 |
| [CDC Data Platform](https://cyson21.github.io/projects/cdc-data-platform/) | PostgreSQL 변경 캡처, 중복 적재 방지, 실패 이벤트 재처리 |

전체 프로젝트는 웹사이트에서 주제별로 볼 수 있으며, 각 프로젝트 페이지에서 주요 코드와 관련 테스트를 확인할 수 있습니다.

## 콘텐츠와 공개 경계

- 프로젝트 콘텐츠: `src/content/`
- 승인 자산 목록: `src/data/public-assets.json`
- 공개 자산: `public/` 아래에서 승인 목록과 SHA-256이 일치하는 파일
- 설계 결정: `docs/decisions/`
- 제외 대상: 원본 일감, 로컬 경로, 전화번호, ATS PDF

공개 배포에서는 `PUBLIC_RELEASE=true`, `PUBLIC_SITE_URL`, `PUBLIC_RESUME_URL`을 설정합니다. 사이트 URL은 경로, query, fragment, 인증 정보가 없는 공개 HTTPS origin이어야 합니다. 공개 모드가 아니면 페이지와 `robots.txt`를 검색 제외 상태로 유지합니다.

## 개발과 검증

```bash
pnpm install
pnpm dev
```

```bash
pnpm verify
```

`pnpm build:raw`는 Astro 정적 출력만 생성합니다. 기본 `pnpm build`는 타입, 콘텐츠 불변식, 단위 검사를 통과한 뒤 정적 출력을 생성합니다.

공개 안전 검사는 PDF 텍스트 추출 실패를 허용하지 않습니다. `pdftotext`가 PATH에 없으면 다음처럼 실행 파일을 지정합니다.

```bash
PDFTOTEXT_BIN=/path/to/pdftotext pnpm test:privacy
```

릴리스와 되돌리기 기준은 [`docs/release/runbook.md`](docs/release/runbook.md)에 기록합니다.
