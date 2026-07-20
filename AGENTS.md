# AGENTS.md

## 공통 작업 규칙

- 이 파일은 저장소 전체에 적용한다.
- 더 하위 경로에 별도 `AGENTS.md`가 생기면 해당 범위에서는 하위 파일이 우선한다.
- `side-projects` 작업공간에서 브랜치·PR·Git worktree를 다룰 때는 [공통 운영 규칙](../../docs/standards/git-branch-worktree-operations.md)을 따른다.

## Portfolio theme development

- The public portfolio defaults to B `Signal Grid`.
- B and C are a permanent pair. Do not remove C or update only one theme.
- Content, page structure, links and accessibility behavior stay in the shared Astro source.
- Visual changes must update both `public/themes/b.css` and `public/themes/c.css`.
- Both files must keep the same `Dual-theme revision` marker.
- After every portfolio change, rebuild both previews with the design preview site's `scripts/build-developed-themes.mjs` and run both repositories' checks.
- Do not copy compiled Astro scope IDs into either theme stylesheet.
