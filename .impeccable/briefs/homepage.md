# Homepage visual refinement

Approved scope: refine the existing homepage presentation for recruiters with calm, readable Quiet Slate B styling. Preserve the composition, all text, portrait, buttons, link destinations, and responsive content sequence. The user rejected reorganization; this is an incremental refinement, with no new composition or visual seed.

The implementation retains the desktop two-column hero: introduction at left, statement at right, and actions under the statement. Below 960px it follows the existing stacked sequence; below 640px the portrait is smaller and the action row stacks. The desktop hero copy remains capped at 1080px with the inherited 64px column gap; the hero padding remains 56px 64px, reducing to 30px 36px below 640px.

Use cool introduction paper, slate text, muted blue navigation, Pretendard, thin borders, and modest control corners. Remove decorative light, grids, shadow, and hover lift. Companion C, standalone /portfolio/ HTML, and /resume/print/ remain outside this refinement.

Evidence: src/pages/index.astro and public/themes/b.css. Validation results are maintained by the implementation task; this brief does not assert pending checks.
