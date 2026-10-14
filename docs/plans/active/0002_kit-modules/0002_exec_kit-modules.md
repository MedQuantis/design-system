---
type: Implementation Plan
title: Plan-0002 — kit modules, manifest, DESIGN.md and Claude Design System exports (v1.1.0)
description: Publishes the design system to the homemade-claude-kit modular contract (core, dataviz and the optional modules, declared by kit-manifest.json) and as a DESIGN.md file, so the kit's deck, visualisation and release-note skills render on-brand from the pinned package and other agents can read the brand; released as 1.1.0.
tags: [design-system, kit-contract, dataviz, design-md, release]
timestamp: 2026-10-11T18:30:00+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-11
review_interval: 30d
---

# Implementation Plan: kit modules, manifest and DESIGN.md export

## Summary

`dist/kit-contract.css` gives the homemade-claude-kit renderers 24 of the 173 tokens: colours and fonts, no chart palette, type scale, components, slide frame, print, logo or legal line. The kit is moving to a modular contract (kit Plan-0005, `docs/plans/active/0005_modular-design-contract/` in homemade-claude-kit): a design system declares the modules it provides in `kit-manifest.json`, must provide `core` and `dataviz`, and may provide `type`, `space-shape`, `document`, `slide-frame`, `print`, `brand` and `guidance`. This plan makes the build publish all nine from `tokens/`, `css/`, `brand/` and `guidelines/`, adds a DESIGN.md export (owner 2026-10-11) so tools and agents outside the kit read the same brand, generates a claude.ai Design System artifact so artifacts made in Claude use it too (owner 2026-10-11), and releases `1.1.0`. `dist/kit-contract.css` stays, unchanged, until the kit's 2.0.0 is in use everywhere.

Source: research 0004 in homemade-claude-kit (`docs/architecture/research/0004-design-systems-for-agents.md`) and the owner rulings of 2026-10-11. No PRD.

Principles:

1. One increment equals one coherent change set and one commit.
2. Every increment has an executable test gate, and its tests are written first and observed red; `progress.txt` records the red run and the green run. Exemptions are named in Scope.
3. Every value is defined once, in `tokens/`; the module files, the manifest and DESIGN.md are generated, never hand-written.
4. The contract belongs to the kit. This repository vendors the kit's `modules.json` and `kit-manifest.schema.json` at a pinned contract version under `tests/fixtures/kit-contract/` and tests against them; it never redefines a role.
5. No breaking change: every existing export keeps its path and its bytes, apart from the files this plan adds.

**Overall Status:** pending (draft, owner review)
**Current Increment:** --

## Prerequisites

1. Kit Plan-0005 increment 02 done on the kit's `main`: `modules.json` and `kit-manifest.schema.json` exist at contract version 2.0.0, with the class vocabularies, brand roles and contrast pairs. Blocks increments 01 and 02.
2. Kit Plan-0005 increment 03 done on the kit's `release/2.0` branch: the resolver can resolve a local folder. Blocks the exit criterion of increment 04 only.
3. Kit Plan-0005 increments 05 to 09 and 11 done on `release/2.0` (increment 13, the 2.0.0 release, if the gate runs from the marketplace instead of a kit checkout). Blocks increment 05.
4. Done: pull request #5 (copyright banner) merged and `1.0.1` released, so `1.0.1` precedes `1.1.0`.

## Increment Plan

### Increment 01: core, dataviz and the token modules, with the manifest

**Status:** pending

Scope:

1. **Write first, expect red:** `tests/unit/kit-modules.test.mjs`: for each of `core`, `dataviz`, `type`, `space-shape`, `brand` and `guidance`, `dist/kit/<module>.css` defines every role the vendored `modules.json` lists for it and nothing outside it; every value equals the value of the `--mq-*` token it maps to in `dist/tokens.json`; `dist/kit-manifest.json` validates against the vendored schema, declares `contractVersion` 2.0.0, provides those six modules under export paths that resolve in the packed tarball, and lists `document`, `slide-frame` and `print` under `omitted` until increment 02; the manifest is checked by `ajv` (pinned exactly as a devDependency) against the vendored schema; every text pair the vendored `modules.json` lists under `pairs` reaches 4.5:1 with this design's values, so the kit's resolve-time contrast check accepts the package; `core` and `dataviz` values equal today's `dist/kit-contract.css` where both define a role; the `package.json` `exports` gain `./kit/*` and `./kit-manifest.json`; `npm pack --dry-run` includes them.
2. A Style Dictionary format per module, in `build/formats/kit-modules.mjs`, fed by a mapping table from contract role to `--mq-*` token (`build/kit-roles.mjs`), so a role maps to exactly one token. `dataviz` maps the four ordered series, the remainder fill, the axis and baseline colour, the grid and the highlight of `guidelines/charts.md` to the kit roles `--chart-1` to `--chart-4`, `--chart-rest`, `--chart-axis`, `--chart-grid` and `--chart-highlight`. `type` and `space-shape` add roles and never redefine a `core` role. `core` keeps the embedded latin font faces `kit-contract.css` carries today; under the kit contract, fonts are the `@font-face` rules of any provided module.
3. `brand` sets the kit roles `--brand-logo-on-light`, `--brand-logo-on-dark` and `--brand-mark` to the logo export names (`./brand/wordmark-on-light.svg`, `./brand/wordmark-on-navy.svg`, `./brand/monogram.svg`) as CSS strings, and `--brand-legal` to the legal line of `guidelines/brand.md`, generated from one source shared with the guideline.
4. `guidance` is a folder `dist/kit/guidance/` with a short Markdown file per module generated from the guidelines (do and don't lines); the manifest maps `guidance` to that one export path. The kit treats it as informational (kit Plan-0005 Q-6).

Primary files:

1. `build/formats/kit-modules.mjs`, `build/kit-roles.mjs`, `build/style-dictionary.config.mjs`, `package.json`
2. `tests/unit/kit-modules.test.mjs`, `tests/fixtures/kit-contract/`

Test gate:

1. `make check`

Exit criteria:

1. The packed tarball holds six module files and a manifest the kit's schema accepts.

### Increment 02: document, slide-frame and print modules

**Status:** pending

Scope:

1. **Write first, expect red:** the three module files define the classes the vendored `modules.json` lists under `classes` for each of them (the kit's document components, the slide frame with section label, footer row, legal line and slide number, the A4 print page); they reference only roles of `core`, `type`, `space-shape` and `dataviz`, never a literal and never an `--mq-*` name; the manifest moves them from `omitted` to `provides`; a fixture page rendered with each module matches a committed screenshot baseline (`tests/e2e/`), within the configured tolerance.
2. Generated from `css/components.css`, `css/slide.css` and `css/print.css` by renaming their `--mq-*` references to contract roles through `build/kit-roles.mjs`; a component the contract does not list stays out, and the test names it.

Primary files:

1. `build/formats/kit-modules.mjs`, `tests/e2e/kit-modules.spec.mjs`, `tests/e2e/fixtures/`
2. `tests/unit/kit-modules.test.mjs`

Test gate:

1. `make check`

Exit criteria:

1. All nine modules ship; nothing is left in `omitted`.

### Increment 03: DESIGN.md export

**Status:** pending

Scope:

1. **Write first, expect red:** `dist/DESIGN.md` exists; its YAML front matter carries the colours, typography, radii and spacing of the semantic tier, each equal to `dist/tokens.json`; its prose sections are generated from `guidelines/` and end with the do and don't lines; Google's DESIGN.md linter, pinned to an exact version as a devDependency, exits 0 with no contrast error; the `exports` gain `./DESIGN.md`; no em dash in the generated prose.
2. `scripts/build-design-md.mjs`, run by `make build`.
3. Before pinning, verify the linter's npm package name and a version at least two weeks old; record both in `progress.txt`.

Primary files:

1. `scripts/build-design-md.mjs`, `package.json`, `Makefile`
2. `tests/unit/design-md.test.mjs`

Test gate:

1. `make check`

Exit criteria:

1. An agent reading only `DESIGN.md` gets the same values and rules as the guidelines.

### Increment 04: Claude Design System artifact generated from the build

**Status:** pending

claude.ai has a "Design System" artifact type that Claude reads before building decks, designs and pages; design systems are attached per account. Generated from the build, never filled by hand, so the artifact, the npm package and the kit carry the same version.

Scope:

1. **Write first, expect red:** `tests/unit/claude-design-system.test.mjs`: `scripts/build-claude-design-system.mjs` writes `dist/claude-design-system/project/` with `design-system.json` (the type's index, `createdOnFiles` marker, `title` "MedQuantis", `lastChange.via` "CI release vX.Y.Z"), `tokens.json` in the type's list shape (every color token carries a light value and a usage note taken from its `$description`; no DTCG map, no `var()`, no alias to a missing token), `README.md` (brand book generated from `guidelines/`: principles, colour, typography, writing, charts, data patterns, with token names in the rules), one `components/<Comp>/README.md` and `preview.html` for each document component the kit `document` module carries, and the logo files under `assets/Logos/`; type families name the three Google-hosted faces, so no font file ships; text pairs reach 4.5:1; no em dash in generated prose.
2. `scripts/build-claude-design-system.mjs`, run by `make build`; the folder is a build output (gitignored), not part of the npm package.
3. Publication: a documented manual step for the owner after each release (publish the folder to the system's artifact url from a Claude Code session), recorded in `docs/audits/README.md`; automating it from CI is a follow-up once the Artifact API allows it.
4. Plugin and pointer: `README.md` gains the five lines a consumer repo adds to `CLAUDE.md` or `AGENTS.md`, and the `.claude/settings.json` snippet that enables the `medquantis-design-system` plugin for local and cloud sessions.

Primary files:

1. `scripts/build-claude-design-system.mjs`, `Makefile`, `.gitignore`, `docs/audits/README.md`, `README.md`
2. `tests/unit/claude-design-system.test.mjs`

Test gate:

1. `make check`

Exit criteria:

1. The generated folder matches the type's format and the published artifact shows the MedQuantis tokens, brand book, logos and component previews.

### Increment 05: README and release 1.1.0

**Status:** pending

Scope:

1. **Exempt from red (documentation):** `README.md` gains a section "Using it from the delivery-comms kit" (pin in `docs/ux/package.json`, `ux-design-system point`, what each module carries) and a line on `DESIGN.md`; the plugin skill's reference names the kit modules.
2. The release PR that release-please opens after increments 01 to 04 proposes `1.1.0` (they are `feat` commits); merged by the owner.
3. After the publish, the kit resolver resolves `@medquantis/design-system@1.1.0` from npm and renders the kit's three fixture documents with the validator passing.

Primary files:

1. `README.md`, `plugins/medquantis-design-system/skills/medquantis-design-system/references/`

Test gate:

1. `make check`
2. From a kit checkout of `release/2.0` (or the 2.0.0 marketplace release): `ux-design-system point @medquantis/design-system@1.1.0` in a scratch project, then a deck, a view and a release note render with exit 0.

Exit criteria:

1. `1.1.0` on npm with provenance; the kit renders from it.

## Delivery rules

1. Tests named in Scope are written first and observed failing before the implementation lands; an increment whose tests were written after its code is not done.
2. Commit scope by capability: `kit` (01, 02), `design-md` (03), `claude` (04), `docs` (05). Trailer `Refs: Plan-0002 increment NN`.
3. The confidentiality check with the real deny-list runs in every gate (`MQ_DENYLIST` set); fixtures use fictitious content only.
4. Foreground gates only; every iteration ends with a definitive state.
