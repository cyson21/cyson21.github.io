# AGENTS.md

## Portfolio theme development

- B and C are a permanent pair. Do not remove C or update only one theme.
- Content, page structure, links and accessibility behavior stay in the shared Astro source.
- Visual changes must update both `public/themes/b.css` and `public/themes/c.css`.
- Both files must keep the same `Dual-theme revision` marker.
- After every portfolio change, run from this repo: `pnpm check` then `pnpm build` (includes unit + privacy + link checks). If a separate design-preview site is in use, rebuild its dual-theme previews with that site's `scripts/build-developed-themes.mjs` as well.
- Do not copy compiled Astro scope IDs into either theme stylesheet.

Default theme name and human-facing setup live in `README.md`.
