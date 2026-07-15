# portfolio-web

손찬양의 공개 기술 포트폴리오입니다. 이력서 웹 복제본이 아니라 백엔드 시스템의 실패 조건, 보호 규칙, 코드와 테스트 근거를 프로젝트별로 연결합니다.

- 공개 웹: [cyson21.github.io](https://cyson21.github.io/)
- 최신 이력서: [PDF](https://github.com/cyson21/portfolio-hub/releases/download/latest/resume.pdf)
- 전체 포트폴리오: [PDF](https://github.com/cyson21/portfolio-hub/releases/download/latest/portfolio-complete.pdf)

## 로컬 실행

```bash
pnpm install
pnpm dev
```

## 검증

```bash
pnpm verify
```

`pnpm build:raw`는 Astro 정적 출력만 생성합니다. 기본 `pnpm build`는 타입, 콘텐츠 불변식, 단위 검사를 통과한 뒤 정적 출력을 생성합니다.

공개 안전 검사는 PDF 텍스트 추출 실패를 허용하지 않습니다. `pdftotext`가 PATH에 없으면 설치된 실행 파일의 절대경로를 지정합니다.

```bash
PDFTOTEXT_BIN=/path/to/pdftotext pnpm test:privacy
```

## 공개 범위

- 공개 콘텐츠: `src/content/`
- 승인 자산 목록: `src/data/public-assets.json`
- 공개 자산: `public/` 아래에서 승인 목록과 SHA-256이 일치하는 파일
- 결정 기록: `docs/decisions/`
- 원본 일감, 로컬 경로, 전화번호, ATS PDF는 포함하지 않습니다.

공개 배포에서는 `PUBLIC_RELEASE=true`, `PUBLIC_SITE_URL=https://...`, `PUBLIC_RESUME_URL=https://...`를 설정합니다. 사이트 URL은 경로, 쿼리, fragment, 인증 정보가 없는 공개 HTTPS origin이어야 합니다. 공개 모드가 아니면 페이지와 `robots.txt`는 검색 제외 상태를 유지합니다.

릴리스 절차와 되돌리기 기준은 [`docs/release/runbook.md`](docs/release/runbook.md)에 기록합니다.
