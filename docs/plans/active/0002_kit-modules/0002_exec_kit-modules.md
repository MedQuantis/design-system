---
type: Implementation Plan
title: Plan-0002 — kit modules, manifest, DESIGN.md and Claude Design System exports (v1.1.0)
description: Publishes the design system to the homemade-claude-kit modular contract (core, dataviz and the optional modules, declared by kit-manifest.json) and as a DESIGN.md file, so the kit's deck, visualisation and release-note skills render on-brand from the pinned package and other agents can read the brand; released as 1.1.0.
tags: [design-system, kit-contract, dataviz, design-md, release]
timestamp: 2026-10-11T18:30:00+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-15
review_interval: 30d
---

# Implementation Plan: kit modules, manifest and DESIGN.md export

## Summary

`dist/kit-contract.css` gives the homemade-claude-kit renderers 24 of the 173 tokens: colours and fonts, no chart palette, type scale, components, slide frame, print, logo or legal line. The kit has moved to a modular contract (kit Plan-0005, `docs/plans/active/0005_modular-design-contract/` in homemade-claude-kit): a design system declares the modules it provides in `kit-manifest.json`, must provide `core` and `dataviz`, and may provide `type`, `space-shape`, `document`, `slide-frame`, `print`, `brand` and `guidance`. This plan makes the build publish all nine from `tokens/`, `css/`, `brand/` and `guidelines/`, adds a DESIGN.md export (owner 2026-10-11) so tools and agents outside the kit read the same brand, generates a claude.ai Design System artifact so artifacts made in Claude use it too (owner 2026-10-11), and releases `1.1.0`. `dist/kit-contract.css` stays, unchanged, until the kit's 2.0.0 is in use everywhere.

Source: research 0004 in homemade-claude-kit (`docs/architecture/research/0004-design-systems-for-agents.md`), the owner rulings of 2026-10-11, and the peer review of 2026-10-15 with its owner decisions (recorded in `progress.txt`). No PRD.

Principles:

1. One increment equals one coherent change set and one commit.
2. Every increment has an executable test gate, and its tests are written first and observed red; `progress.txt` records the red run and the green run. Exemptions are named in Scope.
3. Every value is defined once, in `tokens/`. The kit roles are mapped in the kit tier, `tokens/kit/`, as DTCG aliases of semantic tokens, the same mechanism that produces `dist/kit-contract.css` today; the module files, the manifest and DESIGN.md are generated, never hand-written. The class rules of increment 02 are the one exception: they are written by hand against contract roles only.
4. The contract belongs to the kit. This repository vendors the kit's `modules.json` and `kit-manifest.schema.json` from homemade-claude-kit `eb04989` (contract 2.0.0; re-vendored in increment 02 for the schema `$id` fix, kit #147, and the optional `--tertiary` role, kit #148) under `tests/fixtures/kit-contract/`, with that source in a header line, and tests against them; it never redefines a role and never defines a `--kit-*` property.
5. No breaking change: every existing export keeps its path and its bytes, apart from the files this plan adds.
6. The real kit is the judge. From increment 01, `make kit-check` packs the package, unpacks it into a scratch folder and runs the kit resolver on it (`python3 $KIT_DIR/plugins/delivery-comms/shared/design_source.py provenance --design-system <folder>`), expecting exit 0 and every provided module reported as `design-system`; from increment 02 it also renders a kit fixture deck. It reads the kit checkout from `KIT_DIR` and skips with a clear message when `KIT_DIR` is unset, so CI stays self-contained; every increment's gate runs it locally.

**Overall Status:** in-progress
**Current Increment:** 02

## Prerequisites

1. Met 2026-10-15: kit Plan-0005 increments 01 to 13 are merged (01, 02 on the kit's `main`; 03 to 13 on `release/2.0`, last #144). The contract is 2.0.0 at `d9254da`.
2. Done: pull request #5 (copyright banner) merged and `1.0.1` released, so `1.0.1` precedes `1.1.0`.
3. A local checkout of homemade-claude-kit at `release/2.0` (or `main` after the 2.0.0 merge), named by `KIT_DIR`, with `mise` providing the kit's Python dependencies (PyYAML, and Playwright for the PDF fixture).

## Milestones

| Milestone | Increments | Status | Coherent outcome | Test gate | Commit scope |
| :-- | :-- | :-- | :-- | :-- | :-- |
| M1: Kit modules | 01-02 | done | All nine modules and the manifest, accepted by the real kit | `make check`, `make kit-check` | `kit` |
| M2: DESIGN.md | 03 | pending | Agents outside the kit read the same brand | `make check`, `make kit-check` | `design-md` |
| M3: Claude Design System | 04 | pending | The claude.ai design system generated from the build | `make check`, `make kit-check` | `claude` |
| M4: Release 1.1.0 | 05 | pending | 1.1.0 on npm, rendering from the kit | `make check`, `make kit-check`, packed-folder render | `docs` |

## Increment Plan

### Increment 01: core, dataviz and the token modules, with the manifest

**Status:** done

Scope:

1. **Write first, expect red:** `tests/unit/kit-modules.test.mjs`: for each of `core`, `dataviz`, `type`, `space-shape` and `brand`, `dist/kit/<module>.css` defines every role the vendored `modules.json` lists for it and nothing outside it, and never a `--kit-*` property; every value equals the value of the token it aliases in `tokens/kit/`; every role of a provided module resolves to a token in `tokens/`; `dist/kit/guidance.md` exists; `kit-manifest.json`, at the repository root, validates against the vendored schema (checked by `ajv`, pinned exactly as a devDependency), declares `contractVersion` 2.0.0, provides those five modules and `guidance` under export paths that resolve in the packed tarball, and lists `document`, `slide-frame` and `print` under `omitted` until increment 02; every text pair the vendored `modules.json` lists under `pairs` passes WCAG AA with this design's values, a pair whose `fg` is a list passing when any of its roles reaches 4.5:1 (all 13 pass today: white text on series 1 and 2, dark text on series 3); `core` and `dataviz` values equal today's `dist/kit-contract.css` where both define a role; every `dist/kit/*.css` starts with the copyright banner (extend `tests/unit/smoke.test.mjs`); the `package.json` `exports` gain `./kit/*` (to `./dist/kit/*`) and `./kit-manifest.json`, `files` gains `dist/kit/` and `kit-manifest.json`, and the lists in `tests/unit/package.test.mjs` follow; `npm pack --dry-run` includes them, with the manifest at `package/kit-manifest.json`. `make kit-check` reports `core`, `dataviz`, `type`, `space-shape`, `brand` and `guidance` as `design-system`.
2. **The kit tier.** One DTCG group per module under `tokens/kit/`, aliasing semantic tokens, extending `tokens/kit/contract.tokens.json`; a Style Dictionary format per module in `build/formats/kit-modules.mjs` writes `dist/kit/<module>.css` from it (with the banner from `build/licence-banner.mjs`), and `dist/kit-contract.css` keeps coming from the same entries. No separate mapping table. `type` and `space-shape` add roles and never redefine a `core` role. `core` keeps the embedded latin font faces `kit-contract.css` carries today; under the kit contract, fonts are the `@font-face` rules of any provided module.
3. **Dataviz mapping** (owner 2026-10-15, by name, each `$description` citing `guidelines/charts.md`): `--chart-1` to `--chart-4` to the four ordered series, `--chart-rest` to the remainder fill, `--chart-axis` to the chart axis token (axis lines and ticks), `--chart-grid` to the chart baseline token (the one 1 px baseline; MedQuantis draws no background grid), `--chart-highlight` to series 1 (highlight on grey).
4. **Type and space-shape** (owner 2026-10-15): two new semantic line-height tokens, `body` 1.55 and `tight` 1.15, taken from `css/base.css`, which then reads them too (the display size keeps its own 1.08, the kit has no role for it); `--line-height-body` and `--line-height-tight` alias them. `--border-width` aliases the hairline stroke (1px). `--radius-pill` aliases the 6 px maximum radius, its `$description` citing Owner ruling 3 (no pill shapes).
5. **Brand.** `--brand-logo-on-light`, `--brand-logo-on-dark` and `--brand-mark` are `url()` values naming the logo exports: `url("./brand/wordmark-on-light.svg")`, `url("./brand/wordmark-on-navy.svg")`, `url("./brand/monogram.svg")` (the kit resolver inlines only `url()` values). `--brand-legal` is a CSS string: the legal line of `guidelines/brand.md`, generated from one source shared with the guideline.
6. **Guidance** (owner 2026-10-15): one generated file, `dist/kit/guidance.md`, with a section per module (do and don't lines from the guidelines); the manifest maps `guidance` to `./kit/guidance.md`. Not a folder: the kit resolver refuses a folder export and with it the whole design (kit issue [#145](https://github.com/VictorHueni/homemade-claude-kit/issues/145)). The kit treats guidance as informational (kit Plan-0005 Q-6).
7. **Manifest at the package root** (owner 2026-10-15): the kit reads `kit-manifest.json` at the top of the unpacked package only, never through `exports` (`design_source.py` `_load_package`), so the build writes it to the repository root, not `dist/`; it is gitignored like every build output, with a comment saying why it sits there.
8. **`make kit-check`** (Principle 6): the `Makefile` target, and `KIT_DIR` documented in the README's Development section.

Primary files:

1. `tokens/kit/`, `tokens/semantic/`, `build/formats/kit-modules.mjs`, `build/style-dictionary.config.mjs`, `css/base.css`, `package.json`, `.gitignore`, `Makefile`
2. `tests/unit/kit-modules.test.mjs`, `tests/unit/smoke.test.mjs`, `tests/unit/package.test.mjs`, `tests/fixtures/kit-contract/`

Test gate:

1. `make check`
2. `make kit-check`

Exit criteria:

1. The packed tarball holds five module files, the guidance file and a manifest the kit's schema accepts, and the kit resolver resolves it with exit 0.

### Increment 02: document, slide-frame and print modules

**Status:** done

Owner 2026-10-15: these three modules are written by hand, so decks, A4 documents and printed reports follow the MedQuantis layout rulings (the legal line bottom left in tertiary grey, the slide number bottom right, `guidelines/brand.md`), rather than the kit's base layout.

Scope:

1. **Write first, expect red:** the three module files style every class the vendored `modules.json` lists under `classes` for each of them (`document`: `doc`, `doc-keep`, `doc-label`, `doc-section`, `doc-section--flow`; `slide-frame`: `slide`, `active`, `presenting`, `controls-hint`, `slide-source-bar`, `slide-label`, `slide-footer`, `slide-logo`, `slide-legal`, `slide-number`; `print`: `report`, `report-framing`, `report-kicker`, `report-title`, `section`, `section--breaking`, `section--page-break`, `section-label`) and define their roles (`print` includes `--print-page-size: A4`); they reference only roles of `core`, `type`, `space-shape`, `dataviz` and their own module, never a literal and never an `--mq-*` name; the manifest moves them from `omitted` to `provides`; `make kit-check` reports all nine modules as `design-system` and renders a kit fixture deck, A4 document and report from the packed folder; each rendered page matches a committed screenshot baseline (`tests/e2e/`), within the configured tolerance.
2. **Authoring, not renaming.** A class table in `build/kit-classes.md` names, for each kit class, the MedQuantis rule whose look it reproduces (`slide-footer` from `mq-slide-foot`, `slide-number` from `mq-slide-number`, `slide-label` from `mq-slide-label`, `report` from `mq-page`; a kit class with no MedQuantis counterpart follows the guidelines and says so). Each rule is written against contract roles. MedQuantis components the contract does not list (cards, KPIs, tables) stay out.

Primary files:

1. `css/kit/document.css`, `css/kit/slide-frame.css`, `css/kit/print.css` (hand-written, each with the copyright banner; the build copies them to `dist/kit/`), `build/kit-classes.md`, `tests/e2e/kit-modules.spec.mjs`, `tests/e2e/fixtures/`
2. `tests/unit/kit-modules.test.mjs`

Test gate:

1. `make check`
2. `make kit-check`

Exit criteria:

1. All nine modules ship; nothing is left in `omitted`; the kit renders the fixtures in the MedQuantis layout.

### Increment 03: DESIGN.md export

**Status:** pending

Scope:

1. **Write first, expect red:** `dist/DESIGN.md` exists; its YAML front matter carries the colours (chart colours under `colors`), typography (`body`, `heading` and `mono` as typography objects), radii and spacing of the semantic tier, each equal to `dist/tokens.json`, and no `kit:` key (the package describes itself to the kit through `kit-manifest.json`); its prose sections are generated from `guidelines/` and end with the do and don't lines; `@google/design.md@0.4.0` (published 2026-07-27, the version the kit lints with), pinned exactly as a devDependency, exits 0 with no error and no warning; the `exports` gain `./DESIGN.md`; no em dash in the generated prose.
2. `scripts/build-design-md.mjs`, run by `make build`.

Primary files:

1. `scripts/build-design-md.mjs`, `package.json`, `Makefile`
2. `tests/unit/design-md.test.mjs`

Test gate:

1. `make check`
2. `make kit-check`

Exit criteria:

1. An agent reading only `DESIGN.md` gets the same values and rules as the guidelines.

### Increment 04: Claude Design System artifact generated from the build

**Status:** pending

claude.ai has a "Design System" artifact type that Claude reads before building decks, designs and pages; design systems are attached per account. Generated from the build, never filled by hand, so the artifact, the npm package and the kit carry the same version. Format checked on 2026-10-15 against the type's instructions (type release `1791927328-0a67`, contract `0.2.47`).

Scope:

1. **Write first, expect red:** save the type's instructions with their release id as `tests/fixtures/claude-design-system/type-instructions.md`; the tests cite it, and a newer type release is adopted deliberately. `tests/unit/claude-design-system.test.mjs`: `scripts/build-claude-design-system.mjs` writes `dist/claude-design-system/project/` with `design-system.json` (the type's index, `createdOnFiles` marker, `title` "MedQuantis", `lastChange.via` "CI release vX.Y.Z", `assetGroups` without upload records), `tokens.json` in the type's list shape (every color token carries a light value and a usage note taken from its `$description`; no DTCG map, no `var()`, no alias to a missing token), `README.md` (brand book generated from `guidelines/`: principles, colour, typography, writing, charts, data patterns, with token names in the rules), one `components/<Comp>/README.md` and `preview.html` for each document component the kit `document` module carries, the cover `components/Cover/preview.html`, and the logo files under `assets/Logos/`; type families name the three Google-hosted faces, so no font file ships; text pairs reach 4.5:1; no em dash in generated prose.
2. `scripts/build-claude-design-system.mjs`, run by `make build`; the folder is a build output (gitignored), not part of the npm package.
3. Publication: a documented manual step for the owner after each release, recorded in `docs/audits/README.md` ("How a release runs"): from a Claude Code session, upload each logo to the system's url as an asset, complete the index's `assetGroups` with the returned blob ids, publish the files, and publish `design-system.json` last. Automating it from CI is a follow-up once the Artifact API allows it.

Primary files:

1. `scripts/build-claude-design-system.mjs`, `Makefile`, `.gitignore`, `docs/audits/README.md`
2. `tests/unit/claude-design-system.test.mjs`, `tests/fixtures/claude-design-system/`

Test gate:

1. `make check`
2. `make kit-check`

Exit criteria:

1. The generated folder matches the type's format and the published artifact shows the MedQuantis tokens, brand book, cover, logos and component previews.

### Increment 05: README and release 1.1.0

**Status:** pending

Scope:

1. **Exempt from red (documentation):** `README.md` gains a section "Using it from the delivery-comms kit" (pin in `docs/ux/package.json` with `ux-design-system point`, what each module carries, a link to the kit's `AGENTS.md` block in `ux-design-system/references/agents-md-block.md` rather than a copy of it) and a line on `DESIGN.md`; it also gains the MedQuantis-only lines a consumer repo adds to `CLAUDE.md` or `AGENTS.md` for the `medquantis-design-system` plugin, and the `.claude/settings.json` snippet that enables that plugin for local and cloud sessions (moved here from increment 04, owner 2026-10-15); the plugin skill's reference names the kit modules.
2. The release PR that release-please opens after increments 01 to 04 proposes `1.1.0` (they are `feat` commits); merged by the owner.

Primary files:

1. `README.md`, `plugins/medquantis-design-system/skills/medquantis-design-system/references/`

Test gate:

1. `make check`
2. `make kit-check`
3. Packed-folder render, before the release: `npm pack`, unpack into a scratch folder, `ux-design-system point <that folder>` in a scratch project from the `KIT_DIR` checkout, then a deck, a view and a release note render with exit 0 and `PASS: no findings` verdicts.

Exit criteria:

1. After the owner merges the release PR (outside the loop): `1.1.0` on npm with provenance, and `ux-design-system point @medquantis/design-system@1.1.0` in a scratch project renders the three fixtures with exit 0.

## Delivery rules

1. Tests named in Scope are written first and observed failing before the implementation lands; an increment whose tests were written after its code is not done.
2. Commit scope by capability: `kit` (01, 02), `design-md` (03), `claude` (04), `docs` (05). Trailer `Refs: Plan-0002 increment NN`.
3. The confidentiality check with the real deny-list runs in every gate (`MQ_DENYLIST` set); fixtures use fictitious content only.
4. Foreground gates only; every iteration ends with a definitive state.
