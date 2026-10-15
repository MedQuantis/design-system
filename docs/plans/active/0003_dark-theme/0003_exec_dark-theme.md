---
type: Implementation Plan
title: "Plan-0003: a MedQuantis dark theme for slides, provided to the kit (v1.2.0)"
description: Adds a dark theme to the MedQuantis design system for dark slides (a near-black with a navy cast, a lifted navy for marks, a light navy for highlighted text, the deep navy kept as a gradient fill with a soft glow on the slide's one key element), defined once in tokens/, documented in guidelines/colour.md, provided to the homemade-claude-kit as its optional dark module (contract 2.1.0), carried into DESIGN.md and the Claude Design System, and styles the kit's new classification footer cell; released as 1.2.0.
tags: [design-system, dark-theme, kit-contract, slides, release]
timestamp: 2026-10-15T19:45:00+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-15
review_interval: 30d
---

# Implementation Plan: a MedQuantis dark theme for slides

## Summary

MedQuantis has one dark surface today, the navy panel (`guidelines/colour.md`, "Navy panels and gradients"): a navy gradient with an on-navy text tier, meant for one block per slide or page. It is not a theme a whole slide can sit on. Paracel's decks have dark section slides, and their migration (Paracel Plan 0190, Q-17, owner 2026-10-15) needs them to stay dark on a theme MedQuantis owns. The owner compared five renders of the same slide and kept this one: a near-black with a navy cast, surfaces one step lighter, warm white text, a lifted navy for marks, meters, arrows and frames, a light navy for highlighted text, and the deep navy kept as a gradient fill with a soft navy glow on the slide's one key element. Navy on near-black as a line or text is 1.2:1, so on dark the brand shows as its lifted and light tints, and as a fill under white.

The kit carries the theme through its new optional `dark` module (homemade-claude-kit Plan-0006, delivery-comms 2.1.0, contract 2.1.0): a design names its dark roles once, and a slide with the `dark` class gets every core role remapped. The same kit release adds a per-deck classification in the slide footer (`.slide-classification`), which this design styles.

Source: Paracel Plan 0190 (Q-17, Q-19, Prerequisite 3) and its progress log; kit Plan-0006; this repository's Plan-0002 for the kit tier, the generated modules, `make kit-check`, DESIGN.md and the Claude Design System. No PRD.

**Baseline values (to refine in Inc 01, contrast computed with the WCAG 2.x formula on `#11161f`):**

| Role | Value | Contrast |
| :-- | :-- | --: |
| Canvas | `#11161f` | |
| Surface, recessed surface | `#1a2131`, `#141a26` | |
| Border | white at 10 % | decorative |
| Text | `#f5f4f1` | 16.5:1 |
| Muted text | `#c3cbdc` (the existing second-level on-navy grey) | 11.1:1 |
| Tertiary text | `#8f98aa` | 6.3:1 |
| Lifted navy (marks, lines, meters, frames) | `#6f88c9` | 5.2:1 |
| Light navy (highlighted text) | `#9fb3e8` | 8.7:1 |
| Key element fill | gradient `#0f2a5e` to `#0a2047` (the panel stops) | |
| Key element edge and glow | `#6f88c9`, a navy shadow | |

Principles:

1. One increment equals one coherent change set and one commit.
2. Every increment is test-driven: write-first tests observed red, then a green test gate; `progress.txt` records both runs.
3. Every value is defined once, in `tokens/` (Plan-0002 Principle 3): the dark roles are semantic tokens, mapped to the kit in `tokens/kit/`; the module file is generated; the class rules of `slide-frame` stay hand-written against contract roles only.
4. No breaking change: every existing export keeps its path and its bytes, apart from the files this plan adds and the files the dark and classification additions must change (named in each `Prediction:`).
5. The real kit is the judge: `make kit-check` reads the kit from `KIT_DIR` at the 2.1.0 checkout and renders a dark slide with a classification.
6. Navy stays the single accent (ADR-0003): on dark it appears only as its lifted and light tints and as a fill under white; no new hue.

**Overall Status:** pending
**Current Increment:** --

## Prerequisites

1. Kit delivery-comms 2.1.0 (Plan-0006) merged to the kit's `main`: the `dark` module, contract 2.1.0, `.slide-classification`. Blocks Inc 02 onward; Inc 01 does not need it.

## Increment Plan

### Increment 01: dark tokens and the guideline

**Status:** pending

Scope:

1. **Write first, expect red:**
   - extend `tests/unit/tokens.test.mjs` (the contrast test reads `tokens/contrast-pairs.json`): the new dark pairs, text on canvas and on surface, muted and tertiary text, the light navy highlight, white on the key fill's lighter stop, the lifted navy as non-text 3:1; every pair passes its WCAG level.
   - extend `tests/unit/guidelines.test.mjs`: `guidelines/colour.md` has a "Dark slides" section naming every dark token, its use and its contrast, with no em dash.
2. `tokens/semantic/`: the dark tokens (`--mq-dark-canvas`, `--mq-dark-surface`, `--mq-dark-surface-alt`, `--mq-dark-border`, `--mq-dark-ink`, `--mq-dark-muted`, `--mq-dark-tertiary`, `--mq-dark-accent`, `--mq-dark-accent-text`, `--mq-dark-key-start`, `--mq-dark-key-end`, `--mq-dark-glow`), each with a `$description`, aliasing core tokens where one exists (the panel stops, `#c3cbdc`); new core values only for the canvas, surfaces, tertiary, lifted and light navy.
3. `tokens/contrast-pairs.json`: the dark pairs.
4. `guidelines/colour.md` "Dark slides" (when to use a dark slide, one key element per slide, navy only as a fill under white, lifted navy for marks, light navy for highlighted text); `guidelines/README.md` gains the provenance row (owner ruling of 2026-10-15, Paracel Plan 0190 Q-17).

Primary files:

1. `tokens/core/color.tokens.json`, `tokens/semantic/`, `tokens/contrast-pairs.json`, `guidelines/colour.md`, `guidelines/README.md`
2. `tests/unit/tokens.test.mjs`, `tests/unit/guidelines.test.mjs`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`

Exit criteria:

1. The dark theme exists as tokens with every pair checked, and the guideline states its rules.

Prediction:

1. Changed outputs: `dist/tokens.css`, `dist/tokens.json`, `dist/llms-full.txt` and the plugin skill's generated colour reference gain the dark tokens; `dist/kit-contract.css` and `dist/tailwind.css` stay byte-identical; `dist/kit/*.css` unchanged.

### Increment 02: the kit dark module and the classification cell

**Status:** pending

Scope:

1. **Write first, expect red:**
   - re-vendor `tests/fixtures/kit-contract/` from the kit's `main` at the 2.1.0 merge (header line names the commit); extend `tests/unit/kit-modules.test.mjs`: `dist/kit/dark.css` defines every role the vendored `modules.json` lists for `dark` and nothing else, each value equal to its token; `kit-manifest.json` declares contract 2.1.0 and provides `dark`; every vendored dark pair passes AA with this design's values; `dist/kit-contract.css` stays byte-identical to 1.1.0.
   - extend `tests/unit/kit-modules.test.mjs` (class rules): `css/kit/slide-frame.css` styles `.slide-classification` and `css/kit/dark.css` (hand-written, contract roles only) styles `.dark-key` with the gradient fill, the lifted edge and the glow.
   - extend `tests/e2e/kit-modules.spec.mjs` and `tests/fixtures/kit-render/deck/`: the fixture deck gains a dark slide with a key element and `classification: Confidential`; a screenshot baseline of that slide.
   - `make kit-check` with `KIT_DIR` at 2.1.0: ten modules from `design-system`; the deck renders with `PASS: no findings`.
2. `tokens/kit/contract.tokens.json`: the dark roles as DTCG aliases of the semantic tokens; `build/formats/kit-modules.mjs` emits `dist/kit/dark.css`; the manifest generator provides `dark` at contract 2.1.0; `build/kit-classes.md` gains `dark`, `dark-key` and `slide-classification`.

Primary files:

1. `tokens/kit/contract.tokens.json`, `build/formats/kit-modules.mjs`, `scripts/build-kit.mjs`, `css/kit/{slide-frame,dark}.css`, `build/kit-classes.md`
2. `tests/unit/kit-modules.test.mjs`, `tests/e2e/kit-modules.spec.mjs` and its snapshots, `tests/fixtures/kit-contract/`, `tests/fixtures/kit-render/deck/`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`
2. `KIT_DIR=<kit checkout at the 2.1.0 merge> make kit-check`

Exit criteria:

1. The real kit 2.1.0 reads all ten modules from the packed package and renders a dark slide with a classification, with no finding.

Prediction:

1. Changed outputs: new `dist/kit/dark.css`; `kit-manifest.json` (contract 2.1.0, `dark` provided); `dist/kit/slide-frame.css` (the classification cell); the kit-render fixture deck and its screenshot baselines; `dist/kit-contract.css`, `dist/tailwind.css` and the other `dist/kit/*.css` byte-identical.

### Increment 03: DESIGN.md and the Claude Design System carry the dark theme

**Status:** pending

Scope:

1. **Write first, expect red:**
   - extend `tests/unit/design-md.test.mjs`: `dist/DESIGN.md` lists the dark colours (named `dark-*` under `colors`, each equal to `dist/tokens.json`) and the "Dark slides" prose; `@google/design.md@0.4.0` still lints with no error and no warning.
   - extend `tests/unit/claude-design-system.test.mjs`: `tokens.json` carries the dark colours with their usage notes; the README brand book carries the "Dark slides" section; a `components/DarkSlide/preview.html` shows a dark slide with a key element, rendered from `dist/kit/` roles.
2. `scripts/build-design-md.mjs`, `scripts/build-claude-design-system.mjs`.

Primary files:

1. `scripts/build-design-md.mjs`, `scripts/build-claude-design-system.mjs`
2. `tests/unit/design-md.test.mjs`, `tests/unit/claude-design-system.test.mjs`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`
2. `KIT_DIR=<kit checkout at the 2.1.0 merge> make kit-check`

Exit criteria:

1. An agent reading only `DESIGN.md`, or the claude.ai design system, finds the dark theme and its rules.

Prediction:

1. Changed outputs: `dist/DESIGN.md` and `dist/claude-design-system/project/` (tokens, README, the new component); nothing else.

### Increment 04: README and release 1.2.0

**Status:** pending

Scope:

1. **Exempt from red-first (documentation):** `README.md` "Using it from the delivery-comms kit" gains the `dark` module and the classification cell, and says 1.2.0 needs kit 2.1.0 (a 2.0 kit refuses the unknown `dark` module); the plugin skill's `references/kit-modules.md` names ten modules.
2. The release PR release-please opens after Inc 01 to 03 (`feat` commits) proposes 1.2.0; merged by the owner.

Primary files:

1. `README.md`, `plugins/medquantis-design-system/skills/medquantis-design-system/references/kit-modules.md`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`
2. `KIT_DIR=<kit checkout at the 2.1.0 merge> make kit-check`
3. Packed-folder render, before the release: `npm pack`, unpack, `ux-design-system point <that folder>` in a scratch project with kit 2.1.0, then the fixture deck (dark slide and classification), a view and a release note render with exit 0 and `PASS: no findings`.

Exit criteria:

1. After the owner merges the release PR (outside the loop): 1.2.0 on npm with provenance, and `point @medquantis/design-system@1.2.0` in a scratch project renders the fixture deck with its dark slide and classification.

## Delivery Rules

1. One increment per commit.
2. **Commit scope:** `dark-theme` (01), `kit` (02), `design-md` (03), `docs` (04). Trailer `Refs: Plan-0003 increment NN`, never the plan number in the scope.
3. Each increment must be independently runnable and reversible.
4. Tests named in Scope are written or extended first and observed failing before the implementation lands; `progress.txt` records the red run and the green run. An increment whose tests were written after its code is not done.
5. The confidentiality check with the real deny-list runs in every gate (`MQ_DENYLIST` set); fixtures use fictitious content only (`mq:illustrative`).
6. A change to an existing output that its `Prediction:` does not name blocks the increment.
7. Foreground gates only; every iteration ends with a definitive state.
8. No em dash in prose; never hard-wrap markdown.

## Milestone Chunks (Standalone Delivery Groups)

| Milestone | Increments | Status | Coherent Outcome | Standalone Test Gate | Exit Criteria | Commit Guidance |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| M1: Dark theme defined | 01 | pending | Dark tokens with checked pairs and a guideline | `make check` | Every dark pair passes its level | `feat(dark-theme)` |
| M2: Dark slides through the kit | 02 | pending | The kit 2.1.0 renders a MedQuantis dark slide with a classification | `make check`, `make kit-check` | Ten modules from the design, no finding | `feat(kit)` |
| M3: Agents see it | 03 | pending | DESIGN.md and the Claude Design System carry the dark theme | `make check` | Lint clean, artifact files generated | `feat(design-md)` |
| M4: Release 1.2.0 | 04 | pending | 1.2.0 on npm, rendering dark slides from the kit | `make check`, `make kit-check`, packed-folder render | Paracel can pin 1.2.0 | `docs` |
