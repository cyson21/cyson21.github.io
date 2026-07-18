# Portfolio Web 릴리스 Runbook

## 목적

Preview의 검색 제외 상태와 공개 릴리스의 HTTPS 메타데이터를 별도로 검증하고, 승인된 `dist/`만 배포합니다. 로컬 성공, CI 성공, 실제 배포 확인은 각각 독립된 증거로 기록합니다.

## 사전 조건

- 저장소가 보호 브랜치가 아닌 작업 브랜치에 있어야 합니다.
- Node 22와 `pnpm@11.1.3`을 사용합니다.
- Playwright Chromium이 준비되어 있어야 합니다.
- `pdftotext`가 PATH에 있거나 `PDFTOTEXT_BIN`에 실행 파일 절대경로가 설정되어 있어야 합니다.
- `PUBLIC_SITE_URL`은 경로, query, fragment, 인증 정보가 없는 공개 HTTPS origin이어야 합니다.

```bash
export PDFTOTEXT_BIN=/absolute/path/to/pdftotext
```

## 이력서 PDF 갱신

PDF 내용이 바뀐 경우에만 이 단계를 수행합니다.

1. Preview를 실행합니다.

   ```bash
   pnpm build:raw
   pnpm preview --host 127.0.0.1
   ```

2. 다른 터미널에서 PDF를 생성합니다. 생성기는 HTTP 성공 상태, `main > .sheet` 2개, 글꼴 준비를 확인한 뒤 임시 PDF를 최종 경로로 원자적으로 교체합니다.

   ```bash
   pnpm generate:resume
   ```

3. 페이지 수, A4 크기, 텍스트 잘림, 겹침, 글자 가독성을 실제 렌더로 확인합니다.

   ```bash
   pdfinfo public/downloads/resume.pdf
   pdftoppm -png public/downloads/resume.pdf tmp/resume
   ```

4. SHA-256을 확인하고 검토 승인 뒤 `src/data/public-assets.json`의 이력서 항목과 `approvedAt`을 갱신합니다.

   ```bash
   shasum -a 256 public/downloads/resume.pdf
   ```

5. 공개 안전 검사를 다시 실행합니다. manifest를 갱신하지 않았거나 PDF 텍스트 추출이 실패하면 이 단계는 실패해야 합니다.

   ```bash
   pnpm build:raw
   pnpm test:privacy
   ```

## Preview 검증

```bash
pnpm build
pnpm test:e2e
```

확인 결과:

- 일반 페이지와 404가 `noindex,nofollow`입니다.
- `robots.txt`가 전체 경로를 차단합니다.
- `sitemap.xml`에 `<loc>`가 없습니다.
- 웹 이력서, 인쇄 화면 2페이지, 공개 PDF 2페이지가 모두 열립니다.
- 승인되지 않은 `public/` 파일과 manifest SHA 불일치가 없습니다.
- 구조·접근성·오버플로 검사는 모든 공개 경로를 대상으로 합니다.
- 전체 페이지 시각 기준은 대표 레이아웃을 320px, 768px, 1440px에서 비교합니다.

## Release 검증

실제 origin을 사용해 정적 산출물을 새로 만듭니다. Preview의 `dist/`를 재사용하지 않습니다.

```bash
export PUBLIC_RELEASE=true
export PUBLIC_SITE_URL=https://portfolio.example.com
pnpm build
pnpm test:e2e:release
```

확인 결과:

- 일반 페이지는 `index,follow,max-image-preview:large`와 HTTPS canonical을 가집니다.
- 404는 공개 모드에서도 `noindex,nofollow`입니다.
- `robots.txt`의 Sitemap URL과 `sitemap.xml`의 모든 `<loc>`가 같은 HTTPS origin을 사용합니다.
- 인쇄 이력서와 404는 sitemap에서 제외됩니다.

`PUBLIC_RELEASE=true`에서 origin이 누락되거나 HTTP, 로컬 주소, 경로 포함 URL이면 빌드 실패가 정상입니다.

## 배포와 확인

1. 보호된 `main`에는 `preview`, `release`가 모두 성공한 PR만 병합합니다.
2. 병합 뒤 Pages workflow가 같은 `main` tree를 공개 환경으로 다시 빌드합니다. `pnpm build`에 포함된 타입·콘텐츠·단위·공개 안전·링크 검사를 통과한 `dist/`만 배포합니다.
3. 전체 E2E는 PR에서 한 번 수행하며 Pages workflow에서는 반복하지 않습니다.
4. 배포 식별자, commit SHA, 공개 origin, 배포 시각을 릴리스 기록에 남깁니다.
5. 실제 배포 주소에서 다음을 다시 확인합니다.

   ```bash
   curl -fsS https://portfolio.example.com/robots.txt
   curl -fsS https://portfolio.example.com/sitemap.xml
   curl -fsSI https://portfolio.example.com/downloads/resume.pdf
   ```

6. 브라우저에서 홈, 프로젝트 상세, 웹 이력서, 존재하지 않는 경로를 확인합니다.
7. 검색 도구 등록이나 캐시 purge는 실제 배포 확인 뒤 별도 단계로 수행합니다.

## 되돌리기

다음 중 하나라도 발생하면 직전 검증 완료 산출물로 되돌립니다.

- 공개하면 안 되는 문자열이나 자산이 노출됩니다.
- canonical, robots, sitemap origin이 실제 공개 origin과 다릅니다.
- 404가 색인 허용 상태입니다.
- 이력서 PDF가 열리지 않거나 2페이지가 아닙니다.
- 주요 경로가 404 또는 5xx를 반환합니다.

되돌린 뒤 새 배포 식별자와 확인 결과를 기록하고, 실패 원인을 수정한 새 commit으로 전체 Preview/Release 검증을 다시 수행합니다.
