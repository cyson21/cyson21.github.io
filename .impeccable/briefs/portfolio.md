# Integrated portfolio — Read

User approved restructuring the integrated document for recruiter reading after the summary grid collapsed on narrow screens. Homepage remains unchanged. Quiet Slate palette stays in place. All original body text, evidence and numerical claims are retained; code and results remain expanded.

Reading path: introduction and project links, linear problem/design/result project summaries, implementation capabilities, full project evidence, validation scope. Stable section anchors and a sticky screen-only document navigation support movement. Summary rows use identity plus facts on wide screens and stack on narrow screens. Detail metadata becomes a header above the evidence, followed by the explanatory and code sections. Flows reflow from three columns to one.

Source: src/styles/portfolio-screen.css; scripts/portfolio-reading-layout.mjs adds navigation and links when scripts/sync-public-portfolio.mjs generates public/portfolio/index.html. Print retains original page composition; new navigation is hidden and heading links inherit print styling.

Verified: full build;12 reading/flow/navigation checks across320/390/768/1440; original body text comparison; whole-document WCAG A/AA at320/390/1440; desktop and phone viewport captures of intro, summaries and detail.

Browser annotation corrections: split the introduction context into two sentence blocks; remove the redundant results section caption. Sequential flow diagrams use one horizontal lane above1100px and a vertical lane below, with18px step numbers and28px SVG connectors. Comparison diagrams keep their comparison structure. All widths preserve the original node labels and order. Verified390/968/1440px captures and zero WCAG A/AA violations.

Section and type correction: project case studies have a white surface,1px slate perimeter and32px desktop padding; major non-project sections use one2px top boundary. Heading/list top dividers and terminal row dividers are removed to avoid doubled rules. Case headline and introduction paragraph both use the available content width, keep words together and reflow with balanced headings and pretty body text. No fixed36ch/75ch measure remains on these two elements. Verified1169px and390px captures plus12 regression checks.

Mobile annotation correction: remove the final cover-row divider so adjacent project groups have one boundary. Capabilities now share the project card surface, perimeter, radius and responsive padding. Verified zero horizontal overflow at390/556/1169px, white capability surface, removed terminal divider, build and public safety checks.

Integrated document sections now share the project card treatment: white surface, 1px slate boundary, 6px radius, 32px desktop / 20px 16px mobile padding. Introduction, results, capabilities, project details and validation scope use this same outer container; interior rows retain single dividers. Narrow summary fact labels use 32px plus 8px gap to preserve readable body width.

Flow density correction: horizontal six-step sequence starts at960px, so the1024px in-app view stays compact. Below960px, vertical diagrams cap at520px and center within the evidence column. Checked390/768/1024px without document overflow;12 reading/mobile regressions pass.
