# ENG/REL Finding Evidence

이 문서는 지정된 작업 ID와 구현 증거를 연결합니다. 최종 완료 판단은 로컬 검사, CI, 실제 배포 확인을 합치지 않고 각각 기록합니다.

| Finding IDs | 구현 증거 | 상태 |
| --- | --- | --- |
| ENG-003, ENG-004, ENG-005 | `src/lib/release-origin.ts`, `src/pages/robots.txt.ts`, `src/pages/sitemap.xml.ts` | HTTPS 공개 origin 단일 판정과 endpoint 적용 |
| ENG-006, ENG-007 | `src/content.config.ts` | 콘텐츠 HTTPS URL과 visual 판별 유니온 |
| ENG-008 | `package.json` | `build:raw`와 검사 선행 `build` 분리 |
| ENG-009, ENG-010, ENG-011 | `scripts/check-public-safety.mjs`, `src/data/public-assets.json` | 닫힌 공개 자산 목록, manifest 검증, PDF 추출 실패 차단과 `PDFTOTEXT_BIN` |
| ENG-012, ENG-013 | `scripts/generate-public-resume.mjs` | HTTP 상태·페이지 marker 확인, 임시 파일 교체, `finally` 정리 |
| ENG-014, ENG-015 | `scripts/check-content-invariants.mjs`, `tests/unit/release-origin.test.mjs` | 교차 콘텐츠 불변식과 origin 경계 검사 |
| REL-002, REL-004, REL-005 | `.github/workflows/ci.yml`, `tests/e2e/release.spec.ts` | 독립 release build, robots, sitemap 검사 |
| REL-006 | `src/pages/404.astro`, `tests/e2e/publishing.spec.ts`, `tests/e2e/release.spec.ts` | 404 noindex prop과 preview/release 기대 동작 검사 |
| REL-012, REL-013 | `tests/e2e/publishing.spec.ts`, `.github/workflows/ci.yml` | 이력서·인쇄·PDF와 preview CI 검사 |
| REL-014, REL-016 | `docs/release/runbook.md`, `README.md` | 릴리스, 실제 배포 확인, 되돌리기 절차 |

## 남은 외부 경계

- `src/pages/404.astro`는 `robots="noindex,nofollow"`를 전달합니다. `BaseLayout`이 이 prop을 head meta에 반영해야 release 404 검사가 성공합니다.
- 로컬 환경에 `pdftotext`가 없으면 공개 안전 검사는 의도적으로 실패합니다. 번들 또는 시스템 실행 파일을 `PDFTOTEXT_BIN`으로 지정해야 합니다.
- 실제 호스팅 배포와 배포 후 HTTP 확인은 이 저장소의 로컬 변경만으로 완료 처리하지 않습니다.
