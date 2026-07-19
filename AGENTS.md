# Portfolio theme development

- The public portfolio defaults to B `Signal Grid`.
- B and C are a permanent pair. Do not remove C or update only one theme.
- Content, page structure, links and accessibility behavior stay in the shared Astro source.
- Visual changes must update both `public/themes/b.css` and `public/themes/c.css`.
- Both files must keep the same `Dual-theme revision` marker.
- After every portfolio change, rebuild both previews with the design preview site's `scripts/build-developed-themes.mjs` and run both repositories' checks.
- Do not copy compiled Astro scope IDs into either theme stylesheet.
