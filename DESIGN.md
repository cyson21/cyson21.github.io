---
name: "손찬양 포트폴리오 — Quiet Slate B"
description: "Cool paper and slate presentation for the existing Korean portfolio"
colors:
  blue: "#315d88"
  blue-soft: "#eaf1f8"
  green: "#27664f"
  green-soft: "#edf5f0"
  amber: "#805b25"
  amber-soft: "#f8f1e6"
  red: "#9a4144"
  red-soft: "#faeded"
  paper: "#f7f8fa"
  surface: "#ffffff"
  surface-muted: "#edf1f5"
  ink: "#243449"
  ink-soft: "#4b5b70"
  ink-faint: "#617086"
  line: "#dce3eb"
  line-strong: "#a7b4c4"
typography:
  display:
    fontFamily: '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif'
    fontSize: "44px"
    fontWeight: 650
    lineHeight: 1.18
    letterSpacing: "-0.02em"
  headline:
    fontFamily: '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif'
    fontSize: "30px"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif'
    fontSize: "23px"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.68
    letterSpacing: "0"
  label:
    fontFamily: '"Pretendard Variable", Pretendard, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif'
    fontSize: "15px"
  code:
    fontFamily: '"Cascadia Code", "JetBrains Mono", "SFMono-Regular", Consolas, "Malgun Gothic", monospace'
    fontSize: "14px"
rounded:
  radius: "6px"
  badge: "4px"
spacing:
  button-gap: "10px"
  content-gap: "16px"
  record-padding: "22px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.radius}"
    padding: "9px 15px"
  button-primary-hover:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.surface}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "9px 15px"
  button-secondary-hover:
    backgroundColor: "{colors.blue-soft}"
    textColor: "{colors.blue}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "9px 4px"
  tag:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.badge}"
    padding: "4px 9px"
  domain:
    backgroundColor: "{colors.blue-soft}"
    textColor: "{colors.blue}"
    rounded: "{rounded.badge}"
    padding: "3px 7px"
  experience-record:
    backgroundColor: "{colors.surface}"
    padding: "22px"
---

# Design System: 손찬양 포트폴리오 — Quiet Slate B

## Overview

**Creative North Star: "Quiet Slate"**

Quiet Slate makes the existing Korean portfolio easier to read through cool paper, slate text, restrained blue, and flat surfaces. It supports recruiters reading career and technical evidence without decorative competition.

This record describes the active B theme in public/themes/b.css and the layout and component rules it inherits. The companion C theme and /resume/print/ document retain their own presentation. The standalone /portfolio/ screen now uses the same palette through src/styles/portfolio-screen.css; its composition and print styles remain independent. No PRODUCT.md predated this pass; the companion PRODUCT.md now records existing purpose and user-approved scope. This document records visual evidence without adding product claims.

**Key Characteristics:**
- Cool paper and slate text.
- Readable Korean sans typography.
- Flat surfaces, thin borders, and restrained state color.

## Colors

The palette pairs cool neutral surfaces with a muted blue accent and semantic result colors. Frontmatter retains the implemented CSS token names and is normative.

### Primary

- **Muted Blue:** Navigation, links, focus outlines, domain badges, and active table-of-contents entries use `blue`; `blue-soft` supplies their pale state surface.

### Neutral

- **Cool Paper:** `paper` is the page and footer background; `surface` is white for the header, controls, and records; `surface-muted` distinguishes contact, pagination, and mobile table-of-contents areas.
- **Slate Ink:** `ink` supports primary text and primary actions; `ink-soft` supports prose and metadata; `ink-faint` supports tertiary text.
- **Cool Rules:** `line` divides records and surfaces; `line-strong` defines secondary action boundaries. The hero uses a distinct cool introduction surface (`#f0f4f8`).

Green and its pale surface express passing or convergent evidence, amber and its pale surface express limitations, and red and its pale surface express failure. These are semantic status colors rather than additional decorative accents.

**The Functional Color Rule.** Blue supports navigation and information; green indicates passing or convergent results, amber indicates limits, and red indicates failure.

## Typography

**Display and Body Font:** Pretendard Variable / Pretendard with Korean platform and system sans fallbacks, as recorded in frontmatter.

**Code Font:** Cascadia Code, JetBrains Mono, SFMono-Regular, Consolas, Malgun Gothic, monospace.

The B overlay uses a moderate heading weight and ordinary sentence spacing. Korean text keeps words together; heading wrapping is balanced, while longer statements and summaries use pretty wrapping and break-word overflow handling.

### Hierarchy

Frontmatter records the default desktop roles. At widths below 640px, display/headline/title are (36px / 28px / 22px), body is (17px), and lede is (18px). At widths from 1280px, display/headline/title become (48px / 32px / 24px), and lede becomes (20px). Default lede is (19px). Buttons and desktop navigation use (16px / 600); badges and tags use (600). Hero statements use (650) and a line height of (1.55). Labels inherit component-specific weights rather than a single global label weight.

**The Korean Reading Rule.** Use sans for Korean labels and prose; reserve mono for code, paths, test names, and technical notation.

## Layout

The inherited container is capped at (1180px). Its total horizontal inset is (48px) by default, (64px) from 1280px, (40px) below 960px, and (32px) below 640px. Reading-width content is capped at `min(760px, 40ic)`. Sections use the recorded default spacing, rise to (80px) from 1280px, and reduce to (48px) below 640px. The sticky header is (72px), or (60px) below 640px.

Section headings and project rows collapse to one column below 960px. Full button rows stack below 640px. Project table-of-contents navigation changes from a side rule to a pale surface with a top rule and horizontal padding (16px) below 960px. Experience records reduce padding to (16px) below 640px.

## Elevation & Depth

B surfaces remain flat: the theme shadow token is `none`, header backdrop blur is removed, and buttons do not lift on hover. Tonal surface changes, spacing, and thin rules distinguish regions. Semantic proof blocks retain a thin colored left rule. The portrait remains circular and unfiltered.

**The Flat Surface Rule.** Separate content through spacing, tonal surfaces, and thin borders rather than shadows or glow.

## Shapes

Controls and selected evidence containers use the recorded radius. Compact badges and tags use the smaller badge radius. Borders are generally (1px); the active desktop navigation indicator is (2px), and keyboard focus uses a visible (3px) blue outline offset by (4px). The portrait and career markers retain circular silhouettes. Large page regions are not rounded cards.

## Components

### Buttons

Buttons have a minimum height (44px), the recorded padding, and restrained color transitions (160ms ease-out). Primary actions use slate ink with white text and turn blue on hover. Secondary actions use white, slate text, and a stronger border; hover uses pale blue, blue text, and a blue border. Text actions remain transparent with horizontal padding (4px). Reduced-motion preferences remove B button transitions.

### Chips

Technology tags use white, soft slate text, and a thin cool rule. Domain and scope badges use pale blue with blue text. Tags have a minimum height (32px), and long mobile tags can wrap. Amber case-study badges retain their semantic boundary and surface.

### Cards / Containers

Experience records use white, a thin rule, and the recorded padding with vertical margins (16px). Existing signal, decision, resource, code, and evidence containers retain their structure with modest corners and no shadow. Flat project rows remain records with separators rather than newly nested cards.

### Navigation

Desktop navigation uses soft slate text with blue hover/current states and a thin current-page underline. The mobile menu appears below 640px with a (44px) toggle and (48px) link rows; Escape closes it and restores focus to the toggle. With JavaScript unavailable the mobile navigation stays visible. Current project table-of-contents entries use blue text on pale blue with no shadow.

### Filters

The inherited radio filter group uses a pale neutral background and thin border, with modest outer corners. Selected labels use white and blue text with no shadow. This is an existing control pattern, not a new text-input system.

## Do's and Don'ts

### Do:
- Do use the active B palette for themed pages.
- Do preserve readable Korean body text and visible keyboard focus.
- Do use flat records and restrained separators for technical evidence.

### Don't:
- Don't add decorative gradients, glow, background grids, or shadows to the B theme.
- Don't turn Korean navigation or field labels into monospace text.
- Don't treat companion C or standalone document styling as B tokens.

The approved homepage scope is a visual refinement only: its existing composition, text, buttons, link destinations, portrait, and responsive content sequence are preserved. This surface-specific constraint is recorded in `.impeccable/briefs/homepage.md`.

Source evidence: `public/themes/b.css`, `src/styles/global.css`, `src/pages/index.astro`, `src/components/Header.astro`, `src/components/ProjectRow.astro`, and `src/layouts/BaseLayout.astro`; incumbent guidance: `docs/design/tone-and-manner.md`.

Not canonized as a general rule: B headings currently use slight negative tracking while incumbent tone guidance specifies zero tracking. This narrow documentation pass records the implemented heading value and does not silently rewrite that guidance. No build or browser test outcome is asserted by this document.

## Integrated document reading layout

The integrated screen uses a continuous1100px reading container, linear project summaries and anchor navigation. At900px and below identity and evidence stack into one column. Metadata moves above each case study, and body evidence uses16–17px text with1.65 line height. Code remains expanded at13px. Original print page geometry stays independent. See `.impeccable/briefs/portfolio.md` for scope and verification.

Integrated document sections now share the project card treatment: white surface, 1px slate boundary, 6px radius, 32px desktop / 20px 16px mobile padding. Introduction, results, capabilities, project details and validation scope use this same outer container; interior rows retain single dividers. Narrow summary fact labels use 32px plus 8px gap to preserve readable body width.
