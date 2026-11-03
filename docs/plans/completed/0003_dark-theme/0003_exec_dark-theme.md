---
type: Implementation Plan
title: "Plan-0003: the MedQuantis dark theme (v1.2.0)"
description: Builds the dark theme of ADR-0007 in the themes tier, the existing semantic roles re-valued under the .dark selector and shipped in their own files, for apps, documents and slides; checks every contrast pair in both themes, renders the specimen in both, documents the theme in the guidelines, DESIGN.md, the Claude Design System and the skill, provides it to the homemade-claude-kit as its optional dark module with the classification footer cell, and releases 1.2.0.
tags: [design-system, dark-theme, kit-contract, slides, release]
timestamp: 2026-10-15T23:00:00+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-15
review_interval: 30d
---

# Implementation Plan: the MedQuantis dark theme

## Summary

ADR-0007 decides that MedQuantis has a dark theme: the themes tier ADR-0002 reserves gets its first theme, `dark`, which re-values the existing semantic `--mq-*` roles under the `.dark` selector, for apps, documents and slides. A design pass on 2026-10-15 applied one such override to the whole specimen page and every section rendered dark with no component change; the owner then ruled each point (base mapping, no glow, brand on dark, documents in both themes, status colours, charts, the classification footer). This plan builds that decision.

This is a rework of the plan merged in #16, which added parallel `--mq-dark-*` tokens for dark slides only. Its peer review (2026-10-15, verdict "not ready to start") found the role set out of step with kit Plan-0006, an Inc 01 that could not pass its own gate, and six outputs missing from the predictions. Most of those findings came from the parallel names, which this rework drops; the rest are answered in the increments (see "Review findings").

Source: ADR-0007 (#17); the design-pass decision log (gitignored, `var/design-pass/dark-theme/decisions.md`); Paracel Plan 0190 (Q-17, Q-19, Prerequisite 3); kit Plan-0006; this repository's Plan-0002 for the kit tier, `make kit-check`, DESIGN.md and the Claude Design System. No PRD.

**Theme values** are the tables of ADR-0007 ("Values", "Status colours on dark", "Charts on dark"); this plan does not restate them. Two roles are new in both themes:

| New role | Light | Dark | Why |
| :-- | :-- | :-- | :-- |
| `--mq-on-warning-fill` | `--mq-ink` (5.93:1 on the fill) | `#11161f` (6.18:1) | Warm white on the amber fill is 2.67:1 (ADR-0007) |
| `--mq-accent-highlight` | `--mq-accent` | `#9fb3e8` (8.71:1 on canvas) | Large highlighted title text; on light it is the accent itself |

**Owner rulings of 2026-10-17** (from Inc 01, recorded in ADR-0007): accent text on the pale fills (pale KPI value, pale badge, callout title) reads `--mq-accent-highlight`, which is the accent in light; on the dark panel start, `--mq-on-navy-accent` is `#b2c2ed` (4.64:1) and `--mq-on-navy-discreet` white at 50 % (3.37:1, large text or non-text only), light values unchanged.

**Kit role mapping** (the `dark` module of kit Plan-0006 as reworked in kit #153: `--dark-<role>` mirrors every colour role of `core`, `dataviz`, `slide-frame`, `document` and `print`; Inc 04 follows the role list of the kit 2.1.0 that merges):

| Kit roles | MedQuantis dark value |
| :-- | :-- |
| `--dark-<role>` for each mirrored role | the dark value of the semantic token that `tokens/kit/` already maps to `<role>` (for example `--dark-ink` is the dark `--mq-ink`, `--dark-chart-1` the dark `--mq-chart-series-1`); `--dark-accent-ink` is on-accent `#11161f` (5.22:1; white is 3.48:1 and is out, owner decision of 2026-10-15) |
| `--dark-key-fill` | `linear-gradient(160deg, {panel-start} 0%, {panel-end} 100%)` in the dark theme |
| `--dark-key-base` | panel-start `#2f4c8f`, the fill's lightest point (ink 7.48:1 on it) |
| `--dark-key-edge` | the dark `--mq-shadow-panel`: a 1 px light-navy outline, no glow (owner, 2026-10-15) |
| `--dark-accent-text` | accent-highlight `#9fb3e8` (8.71:1 on canvas, 7.73:1 on surface) |

Principles:

1. One increment equals one coherent change set and one commit.
2. Every increment is test-driven: write-first tests observed red, then a green test gate; `progress.txt` records both runs.
3. Every value is defined once, in `tokens/` (Plan-0002 Principle 3). A dark value lives in `tokens/themes/dark/` under the same path as the light role it re-values; a role without a dark value keeps its light value.
4. The light outputs keep their bytes, apart from the two new roles and the files each `Prediction:` names. The theme ships in its own files (`dist/themes/dark.css`, `dist/themes/dark.json`); a consumer opts in by loading `dark.css` and setting `.dark`.
5. Components read roles only: a colour literal in `css/` is a defect, in either theme.
6. Navy stays the single accent (ADR-0003): on dark it shows as the lifted tint, the light tint and the panel gradient; no new hue.
7. The real kit is the judge: `make kit-check` reads the kit from `KIT_DIR` at the 2.1.0 checkout and renders a dark slide with a classification.

**Overall Status:** done
**Current Increment:** 05

## Prerequisites

1. ADR-0007 merged (#17). Blocks Inc 01.
2. Kit delivery-comms 2.1.0 (Plan-0006 as reworked in kit #153) merged to the kit's `main`: the `dark` module as a mirror of every colour role, the remap in `build.py`'s own layer (a selector-scoped rule in module CSS corrupts `role_values`, `design_source.py:256`), `theme: dark` for whole decks and documents, and the classification at the right of the footer, before the number, in the deck's `lang:`. Blocks Inc 04 only.

## Increment Plan

### Increment 01: the themes tier and the dark values

**Status:** done

Scope:

1. **Write first, expect red:**
   - extend `tests/unit/tokens.test.mjs`: every token under `tokens/themes/dark/` has the path of an existing semantic token (a theme never invents a role); every pair of `tokens/contrast-pairs.json` passes its use in both themes, the dark values resolved over the light ones; the contrast allow-list names `--mq-on-warning-fill` on `--mq-warning-fill` (text) and drops `--mq-ink` on the fill; `--mq-accent` on canvas, surface and surface-alt is `text` (it carries links and labels: 5.22, 4.63, 5.01 on dark); new core values use the alpha form (`white-alpha-10`, `white-alpha-14`).
   - new `tests/unit/themes.test.mjs`: `dist/themes/dark.css` is one `.dark { }` block holding exactly the roles `tokens/themes/dark/` re-values, each equal to its token; `dist/themes/dark.json` holds the same names and values; `dist/tokens.css` contains no `.dark` selector.
2. `tokens/themes/dark/*.tokens.json`: the dark values of ADR-0007, aliasing core tokens where one exists (`#c3cbdc` is `bluegrey-3`, `#f5f4f1` is `grey-100`, `#8795b3` is `bluegrey-2`, `#5d6f91` is `bluegrey-1`); `tokens/core/color.tokens.json` gains only the new raw values (canvas, surfaces, desk, tertiary, decoration, lifted and light navy, the dark status hues, series 4 and the remainder, the two alphas); `tokens/core/shadow.tokens.json` gains the outline. `tokens/semantic/color.tokens.json` gains `--mq-on-warning-fill` (under `status`, so Tailwind leaves it out) and `--mq-accent-highlight`.
3. `build/style-dictionary.config.mjs`: a second run that loads the dark sources over the semantic tier and emits only the tokens defined in `tokens/themes/dark/`, with `selector: ".dark"`, to `dist/themes/dark.css` and `dist/themes/dark.json` (the expected collisions are allowed in that run only; the light run keeps `warnings: "error"`).
4. `build/contrast-pairs.mjs`: `evaluatePair` takes a theme; `tokens/contrast-pairs.json` gains the two new pairs.
5. `package.json` `exports` and `files`: `./themes/dark.css` and `./themes/dark.json`.

Primary files:

1. `tokens/themes/dark/`, `tokens/core/color.tokens.json`, `tokens/core/shadow.tokens.json`, `tokens/semantic/color.tokens.json`, `tokens/contrast-pairs.json`, `build/style-dictionary.config.mjs`, `build/contrast-pairs.mjs`, `package.json`
2. `tests/unit/tokens.test.mjs`, `tests/unit/themes.test.mjs`, `tests/unit/package.test.mjs`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`

Exit criteria:

1. Every pair passes in both themes, and the dark theme exists as its own file.

Prediction:

1. New: `dist/themes/dark.css`, `dist/themes/dark.json`.
2. Changed by the two new roles only: `dist/tokens.css`, `dist/tokens.json`, `dist/tailwind.css` (gains `--color-accent-highlight`, not the status role), `dist/llms-full.txt`, `dist/DESIGN.md` colours, `dist/claude-design-system/project/tokens.json`, the skill's colour tables and eval graders and its asset copies (`make skill`), the specimen's colour and contrast parts and their two baselines (`part-colour`, `part-contrast`); `css/components.css` (the pale KPI value, the pale badge and the callout title read `--mq-accent-highlight`, owner 2026-10-17) and `css/app.css` (the filled warning status reads `--mq-on-warning-fill`) with their skill asset copies; the `part-app-status` baseline (the on-warning-fill pair row in the status table); the `part-shape`, `focus-on-light` and `focus-on-navy` baselines, sub-pixel layout shifts from the taller contrast table with no content or colour change (owner, 2026-10-17).
3. Byte-identical: `dist/kit-contract.css`, every `dist/kit/*.css`.

### Increment 02: the guideline, DESIGN.md, the Claude Design System and the skill

**Status:** done

Scope:

1. **Write first, expect red:**
   - extend `tests/unit/guidelines.test.mjs`: `guidelines/colour.md` has a "Dark theme" section naming every dark role, its value and its contrast, with no em dash; `guidelines/brand.md` has the dark rules for the wordmark and monogram; `guidelines/layout.md` and `brand.md` place the classification at the right of the footer, before the number (amending ruling 11's two-cell footer).
   - extend `tests/unit/design-md.test.mjs`: `dist/DESIGN.md` carries the "Dark theme" section and lists the dark colours as `dark-*` names equal to `dist/themes/dark.json`, with no gradient under `colors` (the linter rejects one); `@google/design.md@0.4.0` lints with no error and no warning.
   - extend `tests/unit/claude-design-system.test.mjs`: `tokens.json` carries the dark values with their usage notes; the README brand book carries the "Dark theme" section.
   - extend `tests/unit/skill.test.mjs`: the slides, documents and apps references each carry the "Dark theme" section, with a skill note naming `assets/themes/dark.css` and `.dark`; the skill ships `assets/themes/dark.css` and `dark.json` byte-equal to `dist/themes/`, and `validate.py` passes a page that bundles the dark theme and uses dark literal values while still failing a colour in neither theme, with status values apps only (owner, 2026-10-17: skill dark check in Inc 02).
2. `guidelines/colour.md` "Dark theme": the scope (apps, documents chosen per document, slides), the values and contrast, the navy panel on dark, status and charts on dark; the warm-neutral rule ("never blue-tinted greys") scoped to the light theme; the light navy named a navy tint, not the retired sky blue (LCH hue 280.4 against sky blue 269.9 and navy 293.7, from the review). `guidelines/brand.md`: the white wordmark on every dark surface, a navy tile takes the panel gradient, the monogram's outline. `guidelines/layout.md`: the classification cell. `guidelines/README.md`: the provenance rows (owner rulings of 2026-10-15, ADR-0007), under the next ruling numbers.
3. `scripts/build-design-md.mjs`: `["colour.md", "Dark theme"]` in the Colors section, the dark colours from `dist/themes/dark.json`. `scripts/build-claude-design-system.mjs`: the dark values and the section. `scripts/build-skill.mjs`: `["colour.md", "Dark theme"]` in `MEDIA.slides`, `MEDIA.documents` and `MEDIA.apps`, with the skill note under it; `scripts/sync-skill-assets.mjs` copies `dist/themes/dark.css` and `dark.json` into the skill's `assets/themes/`; the skill's `scripts/validate.py` allows the dark semantic values under the same medium rules as light; run `make skill`.

Primary files:

1. `guidelines/colour.md`, `guidelines/brand.md`, `guidelines/layout.md`, `guidelines/README.md`, `scripts/build-design-md.mjs`, `scripts/build-claude-design-system.mjs`, `scripts/build-skill.mjs`, `scripts/sync-skill-assets.mjs`, `plugins/medquantis-design-system/` (regenerated, and `scripts/validate.py`)
2. `tests/unit/guidelines.test.mjs`, `tests/unit/design-md.test.mjs`, `tests/unit/claude-design-system.test.mjs`, `tests/unit/skill.test.mjs`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`

Exit criteria:

1. An agent reading only a guideline, `DESIGN.md`, the claude.ai design system or the skill finds the dark theme and its rules.

Prediction:

1. Changed: the four guidelines, `dist/DESIGN.md`, `dist/llms-full.txt`, `dist/llms.txt` (the colour.md index line), `dist/kit/guidance.md` (the guideline sections it copies), `dist/claude-design-system/project/`, the skill's references and evals, `validate.py`. New: the skill's `assets/themes/dark.css` and `assets/themes/dark.json`. No CSS output changes (owner, 2026-10-17).

### Increment 03: components and the specimen in both themes

**Status:** done

Scope:

1. **Write first, expect red:**
   - extend `tests/unit/css.test.mjs`: no colour literal anywhere in `css/` or `scripts/specimen.css`; the navy panel reads the panel roles and `--mq-shadow-panel`, the navy KPI tile and the navy brand tile the panel roles and `--mq-shadow-edge` (none in light, the panel outline on dark; owner approval of 2026-10-17), never the accent; the specimen frames its slide with `--mq-shadow-edge`, on screen only; text on the warning fill reads `--mq-on-warning-fill`; a `mq-monogram` class draws the outline from `--mq-shadow-edge`, a role that is none in light; the highlighted row's key cell reads `--mq-accent-highlight` (ruling 18).
   - extend `tests/unit/specimen.test.mjs`: the build writes `dist/specimen/dark.html` with `class="dark"` on `<html>` and `themes/dark.css` loaded; every swatch prints its dark value and every contrast row its dark ratio; the brand section shows the on-navy files on dark.
   - extend `tests/e2e/specimen.spec.mjs`: the dark page passes axe with no violation; a screenshot baseline per part of the dark page; the light baselines unchanged.
   - extend `tests/unit/themes.test.mjs`: on dark, `--mq-shadow-small` is black at 40 % (0 1px 2px) and `--mq-shadow-medium` black at 50 % (0 3px 12px), the design-pass values (owner approval of 2026-10-17); light unchanged.
2. `css/components.css` and `css/app.css`: text on the warning fill reads `--mq-on-warning-fill`; the `mq-monogram` class; the navy KPI tile's edge. `tokens/themes/dark/`: the edge role and the dark small and medium shadows (core raw values tagged dark-only). `scripts/build-specimen.mjs`: renders once per theme, with the values and ratios of that theme; the brand tiles pick the files by theme.

Primary files:

1. `css/components.css`, `css/app.css`, `scripts/build-specimen.mjs`, `scripts/specimen.css`, `tokens/semantic/` (the monogram outline role), `tokens/themes/dark/`
2. `tests/unit/css.test.mjs`, `tests/unit/specimen.test.mjs`, `tests/e2e/specimen.spec.mjs` and its snapshots

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`

Exit criteria:

1. The specimen renders in both themes with the right numbers and no axe violation.

Prediction:

1. New: `dist/specimen/dark.html` and its baselines (11 `dark-part-*`, `dark-focus-on-canvas`, `dark-focus-on-navy`). Changed: `dist/tokens.css`, `dist/tokens.json` (the edge role and the core `shadow.none`), `dist/themes/dark.*` (the edge role, the dark small and medium shadows), the light warning-badge baseline only if its text colour value changes (it should not: `--mq-on-warning-fill` is ink in light).
2. Ripples (owner approval of 2026-10-17): `dist/llms-full.txt`, `dist/DESIGN.md`, `dist/claude-design-system/project/` (`README.md`, `tokens.json`, `design-system.json` by its build timestamp), the skill's asset copies (`css/components.css`, `tokens.css`, `tokens.json`, `themes/dark.css`, `themes/dark.json`) and references (`a4-report`, `app`, `charts`, `slides`, `web`); sources the existing tests require: `guidelines/colour.md` (the dark rows), `README.md` (the `mq-monogram` status row), `tests/unit/themes.test.mjs`; ADR-0007 records the edge and the dark shadows.
3. Light rendering: the specimen's navy brand tiles take the panel gradient (approved 2026-10-17); the `part-brand` baseline passes within tolerance and is not rewritten. Every other light baseline unchanged.
4. Dark baselines re-captured after the dark small and medium shadows and the slide frame's edge (owner approval of 2026-10-17): `dark-part-shape`, `dark-part-slide`, and, since cards draw the small shadow and the A4 page the medium one, `dark-part-components` and `dark-part-print`.
5. Byte-identical: `dist/kit-contract.css`, every `dist/kit/*`, `kit-manifest.json`, `dist/tailwind.css`.

### Increment 04: the kit dark module and the classification cell

**Status:** done

Scope:

1. **Write first, expect red:**
   - re-vendor `tests/fixtures/kit-contract/` from the kit's `main` at the 2.1.0 merge (header line names the commit). `tests/unit/kit-modules.test.mjs`: `dark` joins `CLASS_MODULES` and `READS`; `dist/kit/dark.css` defines every role the vendored `modules.json` lists for `dark` and nothing else, each value equal to its dark token per the mapping table; the role-alias test lists the dark roles; the pair test reads the `dark` module and its pair count follows the vendored contract; `kit-manifest.json` declares contract 2.1.0 and provides `dark`; `dist/kit-contract.css` byte-identical to 1.1.0.
   - `css/kit/dark.css` (hand-written, contract roles only): the `.dark` rule the class test requires, if the 2.1.0 class test still requires one; the kit's own layer draws the fill and outline from `--dark-key-fill` and `--dark-key-edge`; this file adds no competing rule. `css/kit/slide-frame.css` styles `.slide-classification` at the right of the footer, before the number.
   - regenerate `tests/e2e/fixtures/kit-deck.html` from a 2.1 `KIT_CHECK_OUT` render (Plan-0002 procedure), with a dark slide holding a key element and `classification: Confidential` with `lang: fr`; `tests/e2e/kit-modules.spec.mjs` splits light slides from the dark slide and asserts the computed canvas, text colour, key fill and outline; the classification reads "Confidentiel" before the number.
   - `tests/fixtures/kit-render/document/config.yaml` gains `classification:` (the running footer).
   - a negative check: a scratch design with a failing core pair still fails `make kit-check` under 2.1.
2. `tokens/kit/contract.tokens.json`: the dark roles as aliases of the dark tokens, `--dark-key-fill` as a `$type: other` gradient string over the two panel stops (the `--print-margin` precedent). `build/formats/kit-modules.mjs`: `dark` in `KIT_CLASS_MODULES`; the module header states its contract version. `scripts/build-kit.mjs`: `GUIDANCE.dark` (colour.md "Dark theme"), `CONTRACT_VERSION` 2.1.0. `scripts/kit-check.mjs`: ten modules in `FROM_DESIGN_SYSTEM`. `build/kit-classes.md`: `dark`, `dark-key`, `slide-classification` with their rulings. The skill's `references/kit-modules.md`: ten modules, `dark`.

Primary files:

1. `tokens/kit/contract.tokens.json`, `build/formats/kit-modules.mjs`, `scripts/build-kit.mjs`, `scripts/kit-check.mjs`, `css/kit/slide-frame.css`, `css/kit/dark.css`, `build/kit-classes.md`, `plugins/medquantis-design-system/skills/medquantis-design-system/references/kit-modules.md`
2. `tests/unit/kit-modules.test.mjs`, `tests/e2e/kit-modules.spec.mjs` and its snapshots, `tests/e2e/fixtures/kit-deck.html`, `tests/fixtures/kit-contract/`, `tests/fixtures/kit-render/`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`
2. `KIT_DIR=<kit checkout at the 2.1.0 merge> make kit-check`

Exit criteria:

1. The real kit 2.1.0 reads all ten modules from the packed package and renders a dark slide with a classification, with no finding.

Prediction:

1. New: `dist/kit/dark.css`, the dark-slide baseline. Changed: `kit-manifest.json` (contract 2.1.0, `dark` provided), `dist/kit/slide-frame.css` (the classification cell), `dist/kit/guidance.md` (`## dark`), every `dist/kit/*.css` header only if the module header names the contract version (decided in this increment and stated in `progress.txt`), the two light kit-slide baselines (the classification cell), the kit-render fixtures, the Claude Design System previews that inline kit module headers (`dist/claude-design-system/project/components/{Doc,DocKeep,DocLabel,DocSection,DocSectionFlow}/preview.html`, header lines only), `dist/claude-design-system/project/design-system.json` (build timestamp). Source outside Primary files: `tests/unit/package.test.mjs` (the tarball allow-list gains `dist/kit/dark.css`). Byte-identical: `dist/kit-contract.css`, `dist/tokens.css`, `dist/tailwind.css`.

### Increment 05: README and release 1.2.0

**Status:** done

Scope:

1. **Exempt from red-first (documentation):** `README.md` gains "Dark theme": load `themes/dark.css` and set `.dark`; for Tailwind 4 apps declare `@custom-variant dark (&:where(.dark, .dark *));` (Nuxt UI 4 already does); a document or deck sets it at build time; the kit section gains the `dark` module and the classification cell and says the kit modules of 1.2.0 need delivery-comms 2.1.0, since a 2.0 kit refuses the unknown `dark` module.
2. The release PR release-please opens after Inc 01 to 04 (`feat` commits) proposes 1.2.0; its release note states the kit requirement; merged by the owner.

Primary files:

1. `README.md`

Test gate:

1. `MQ_DENYLIST=<the real deny-list> make check`
2. `KIT_DIR=<kit checkout at the 2.1.0 merge> make kit-check`
3. Packed-folder render before the release, a manual check outside the loop: `npm pack`, unpack, `ux-design-system point <that folder>` in a scratch project with kit 2.1.0, then the fixture deck (dark slide, classification), a view and a release note render with exit 0 and `PASS: no findings`.

Exit criteria:

1. After the owner merges the release PR (outside the loop): 1.2.0 on npm with provenance, and `point @medquantis/design-system@1.2.0` renders the fixture deck with its dark slide and classification.

## Review findings (peer review of 2026-10-15)

| Finding | Where it is answered |
| :-- | :-- |
| C1 role set and `--accent-ink` | Kit role mapping table; on-accent `#11161f` (owner); Inc 04 follows the 2.1.0 role list |
| C2 Inc 01 red on DESIGN.md coverage | The guideline section and its DESIGN.md line land together in Inc 02 |
| M1 missing predictions, Tailwind exposure | Theme in its own files; Inc 01 Prediction lists every output the two new roles touch |
| M2 kit remap disables the contrast gate | Prerequisite 2; the negative kit-check in Inc 04 |
| M3 harness and generator changes | Inc 04 Scope 2 and Primary files |
| M4 skill test needs `kit-modules.md` | Moved into Inc 04 |
| M5 wrong e2e fixture | Inc 04 regenerates `kit-deck.html` |
| N1 key element styling | Roles only, `css/kit/dark.css` adds the edge and the `.dark` rule |
| N2 glow and border tokens | No glow (owner); the outline in `shadow.tokens.json`; the alphas in core |
| N3 pair levels | Inc 01: accent as text; pairs checked in both themes |
| N4 ADR, warm greys, sky blue | ADR-0007; Inc 02 guideline scope and hue figures |
| N5 classification placement | Owner: right, before the number, in the deck's language; Inc 02 guidelines, Inc 04 CSS and fixtures |
| N6 a 2.0 kit refuses 1.2.0 | Inc 05 README and release note; minor release (owner, O-1) |
| N7 slides without the kit | The theme reaches `mq-slide` through `.dark`; Inc 02 adds the section to every medium |
| L1 to L4 | Inc 05 gate 3 marked manual; Inc 04 gates; no gradient in DESIGN.md `colors` (Inc 02) |

## Open questions

1. **O-1, resolved (owner, 2026-10-15):** 1.2.0 is a minor release, although a kit 2.0 consumer bumping to it gets its kit modules refused: the pins are exact and only the kit modules need 2.1.0; the release note says so.

## Delivery Rules

1. One increment per commit.
2. **Commit scope:** `dark-theme` (01 to 03), `kit` (04), `docs` (05). Trailer `Refs: Plan-0003 increment NN`, never the plan number in the scope.
3. Each increment must be independently runnable and reversible.
4. Tests named in Scope are written or extended first and observed failing before the implementation lands; `progress.txt` records the red run and the green run. An increment whose tests were written after its code is not done.
5. The confidentiality check with the real deny-list runs in every gate (`MQ_DENYLIST` set); fixtures use fictitious content only (`mq:illustrative`).
6. A change to an existing output that its `Prediction:` does not name blocks the increment.
7. Foreground gates only; every iteration ends with a definitive state.
8. No em dash in prose; never hard-wrap markdown.

## Milestone Chunks (Standalone Delivery Groups)

| Milestone | Increments | Status | Coherent Outcome | Standalone Test Gate | Exit Criteria | Commit Guidance |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| M1: Dark theme defined | 01, 02 | done | Dark values with every pair checked in both themes, documented everywhere an agent reads | `make check` | Every pair passes in both themes | `feat(dark-theme)` |
| M2: Dark on screen | 03 | done | Components and the specimen in both themes | `make check` | Dark specimen, no axe violation | `feat(dark-theme)` |
| M3: Dark slides through the kit | 04 | done | The kit 2.1.0 renders a MedQuantis dark slide with a classification | `make check`, `make kit-check` | Ten modules from the design, no finding | `feat(kit)` |
| M4: Release 1.2.0 | 05 | done | 1.2.0 on npm | `make check`, `make kit-check`, packed-folder render (manual) | Paracel can pin 1.2.0 | `docs` |
