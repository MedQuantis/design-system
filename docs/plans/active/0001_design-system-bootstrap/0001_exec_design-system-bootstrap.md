---
type: Implementation Plan
title: MedQuantis design system bootstrap and consumer migration
description: Builds the central tokens-first design system behind a confidentiality gate, then migrates the platform, website and Paracel consumers one at a time.
tags: [design-system, tokens, brand]
timestamp: 2026-10-09T19:06:23+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-09
review_interval: 30d
---

# Implementation Plan: MedQuantis design system bootstrap

## Summary

Implements [ADR-0002](../../../architecture/decisions/adr-0002-central-tokens-first-design-system.md) (central tokens-first repo, pinned consumption), [ADR-0003](../../../architecture/decisions/adr-0003-navy-is-the-single-brand-accent.md) (navy everywhere), [ADR-0004](../../../architecture/decisions/adr-0004-status-colours-in-apps-only.md) (status colours in apps only), [ADR-0005](../../../architecture/decisions/adr-0005-public-repo-with-confidentiality-gate.md) (public behind a confidentiality gate) and [ADR-0006](../../../architecture/decisions/adr-0006-mq-token-prefix.md) (`--mq-` prefix). No PRD; the ADRs are the source.

The plan has two halves. Increments 01 to 11 build this repo; nothing is pushed to a public remote before increment 11's audit passes. Increments 12 to 17 migrate one consumer each, in that consumer's own repo, through its own branch and PR, following that repo's own rules (`AGENTS.md`, CI gates, doc-sync obligations).

Principles:

1. One increment equals one coherent change set.
2. Every increment has an executable test gate, and is test-driven: the tests named first in Scope are written and observed failing before the implementation lands (red, then green).
3. Confidentiality before visibility: the gate exists and passes before any content is written that could be published.
4. Every value is defined once, in `tokens/`; every other file references `var(--mq-*)` or a generated output.
5. Content is rewritten, never bulk-copied, from consumer repos; all examples use fictitious data.

**Overall Status:** in-progress
**Current Increment:** 06

## Repository layout (approved 2026-10-09)

Grounded in research note 0001 and the layout research of 2026-10-09: `dist/` is never committed (Primer, SBB tokens, Open Props, Radix); tokens split by tier then category (Primer); build code apart from token data; tests at the root split unit and e2e; Agent Skill and plugin layout per Anthropic's documentation; community-health files per GitHub's lookup order. Top-level `fonts/`, `icons/`, `brand/`, `examples/` and the skill's synced `assets/` are local choices, explained in the tree.

```
design-system/
├── .claude-plugin/marketplace.json      # Claude Code marketplace, one entry: ./plugins/medquantis-design-system
├── .github/
│   ├── CODEOWNERS                       # @VictorHueni @MikimikeDevloppAI
│   ├── dependabot.yml
│   ├── ISSUE_TEMPLATE/  pull_request_template.md
│   └── workflows/  ci.yml  release.yml  # release-please and npm publish in one workflow
├── tokens/                              # DTCG source, the only place a value is defined
│   ├── core/       color, font, radius, space, stroke (*.tokens.json)
│   ├── semantic/   color, type, chart, focus, layout (*.tokens.json)
│   └── contrast-pairs.json              # allow-list of tested colour pairs
├── css/                                 # tokens only, one @layer mq.* per file or folder
│   ├── base.css  slide.css  print.css  app.css
│   └── components/                      # card, kpi, table, badge, panel, legend, ...
├── fonts/                               # Outfit, Newsreader, Geist Mono woff2, OFL.txt, fonts.css
├── icons/                               # pinned Lucide build and its licence
├── brand/                               # logos, monogram, LICENSE (all rights reserved)
├── guidelines/                          # markdown guidelines, LICENSE (all rights reserved)
├── examples/                            # fictitious data for the specimen; the only place amounts may appear
├── build/                               # style-dictionary.config.mjs, formats/ (tailwind, kit-contract, specimen, llms)
├── scripts/                             # confidentiality-check, build-specimen, copy-fonts, sync-skill-assets
├── tests/
│   ├── unit/  fixtures/                 # node --test
│   └── e2e/   __screenshots__/          # Playwright and axe on the specimen, PDF export
├── plugins/medquantis-design-system/
│   ├── .claude-plugin/plugin.json
│   └── skills/medquantis-design-system/
│       ├── SKILL.md
│       ├── references/                  # one file per medium: slides, a4-report, web, app, charts
│       ├── scripts/                     # token lookup, off-palette colour validator
│       ├── assets/                      # synced copy of built files; CI fails on drift
│       └── evals/
├── docs/
│   ├── architecture/decisions/  architecture/research/
│   ├── plans/active/  audits/
│   └── one-offs.md
├── dist/                                # gitignored; tokens.css/json, tailwind.css, kit-contract.css, specimen/, llms.txt
├── README.md  LICENSE  CHANGELOG.md  CONTRIBUTING.md  GOVERNANCE.md  SECURITY.md
├── release-please-config.json  .release-please-manifest.json
└── package.json  package-lock.json  .nvmrc  mise.toml  Makefile  stylelint.config.mjs  playwright.config.mjs
```

## Owner rulings for Increments 04 and 06 (all ruled 2026-10-09)

These values diverged between sources; increment 04 encodes them.

1. ~~Tertiary grey~~ **Ruled 2026-10-09:** `#707070` for all text (4.74:1 on canvas); `#8c8c8c` (3.22:1) only for non-text decoration.
2. ~~Accent on navy backgrounds~~ **Ruled 2026-10-09:** the 2026-10-08 report rule, no sky blue `#8fc0ff`. On navy: titles, figures and icons `#ffffff`; secondary text and labels white at 68 % opacity; second-level text `#c3cbdc`; one-off accent `#8795b3`; rules white at 16 to 18 %; icon-pill fill white at 12 %; discreet numbers white at 40 %. Each text pair is checked by the contrast test, and any that fails AA is restricted to large or non-text use.
3. ~~Corner radius~~ **Ruled 2026-10-09:** 6 px maximum everywhere; two values, 3 px for small items (tags, inputs, chips) and 6 px for cards and panels; no pill shapes.
4. ~~Heading weight~~ **Ruled 2026-10-09:** Outfit 500 for every heading, column title and hero figure; 600 only for a short highlighted word inside body text (as the bold "Med" of the logo).
5. **Warning colour, ruled 2026-10-09 (apps only):** `#d4850a` is a fill-only token (badges, highlights) always carrying ink text (5.93:1); `#a06400` is the warning text, icon and border token (4.86:1 on white, 4.42:1 on the warning tint, so text on the tint stays ink). White on the warning fill is forbidden (2.93:1).
6. **Wordmark, ruled 2026-10-09:** "Med" Outfit 600, "Quantis" Outfit 300 (the website treatment), navy on light backgrounds and white on navy, at every size.
7. **Monogram and favicon, ruled 2026-10-09:** the MQ monogram (white on navy `#0a2463`, M Outfit 700, Q Outfit 400, centred on cap height, corners 8/64) is the favicon and app icon. Draft assets in `brand/`, outlined from Outfit: `monogram.svg` (rounded), `monogram-square.svg` (for platforms that round icons themselves), `monogram-small.svg` (16 px variant, larger letters, M 800, Q 600), `favicon/` (`favicon.svg`, `favicon.ico` 16/32/48, `apple-touch-icon.png` 180, `icon-192.png`, `icon-512.png`, PNG metadata stripped). Increment 06 adds the outline script to `scripts/` so the assets are reproducible, and a test that the SVGs contain no `<text>` element.
8. **Number format, ruled 2026-10-09:** thousands separator is the straight apostrophe (`2'460'000`), never the curly one, a space or a comma; decimal point (`12.5`); a space before `%` (`12.5 %`); currency before the amount (`CHF 2'460'000`) joined with a non-breaking space so it never wraps. Encoded in `guidelines/data-patterns.md`, the skill references and a guideline test. <!-- mq:illustrative -->
9. **Report background, ruled 2026-10-09:** every document page (A4 report, paper, slide) uses `#fafaf8`; white `#ffffff` is for cards and panels. `#e9e8e4` becomes the `desk` token, used only on screen around a page preview and never inside a document, so printed PDFs never carry a grey sheet. The 6 platform files on `#e9e8e4` move to `#fafaf8` when migrated.
10. **Fonts, ruled 2026-10-09:** Newsreader is the only serif (body text of documents, slides and regulatory text in apps); Outfit for headings, labels and app UI; Geist Mono for figures and codes. In `kit-contract.css`, `--font-body` is Newsreader, `--font-heading` Outfit, `--font-mono` Geist Mono. Georgia and Times New Roman remain fallbacks only. A repo whose dense views need a sans body overrides it locally (ADR-0002 rule 3).

## Deferred out of v1 (tracked as GitHub issues)

1. **Email output for HTML newsletters** (owner, 2026-10-09, [#1](https://github.com/MedQuantis/design-system/issues/1)). Needs literal resolved values with inlined styles (CSS variables are unreliable in mail clients), dark-mode-safe colours and logo variants (Gmail and Outlook invert), and a real-client test step. Until then the newsletter template is aligned by hand to the brand colours, citing the token release it copies. Source: research 0001 §6.

## Increment Plan

### Increment 01: Repo skeleton and toolchain

**Status:** done

Scope:

1. **Write first, expect red:** `tests/unit/smoke.test.mjs` asserting `package.json` pins Node 24 in `engines`, every dependency is an exact version, and `LICENSE`, `brand/LICENSE`, `guidelines/LICENSE`, `.github/CODEOWNERS` exist and `license` equals `SEE LICENSE IN LICENSE`.
2. `package.json` (private until increment 11, `type: module`), `mise.toml` (node 24, gitleaks pinned), `Makefile` with `test`, `build`, `lint`, `confidentiality-check`, `check` (aggregate).
3. Licence split (owner, 2026-10-09): code, tokens and generated CSS under MIT; the root `LICENSE` explicitly excludes `brand/` (logos, monogram) and `guidelines/` (brand, writing and chart rules), both "© MedQuantis SA, all rights reserved", restated in `brand/LICENSE` and `guidelines/LICENSE`; each font folder keeps its OFL.txt; `package.json` `license` is `SEE LICENSE IN LICENSE` because the package ships both. The smoke test asserts the three notices exist and the `license` field matches.
4. `README.md` (purpose, consumption, specialisation rules from ADR-0002), `.github/CODEOWNERS` (`* @VictorHueni @MikimikeDevloppAI`), `GOVERNANCE.md` (owner and backup, 5-working-day review target, small changes by PR, large changes by short written proposal, promotion tests), `docs/one-offs.md` (empty log with its column header), `.gitignore`, `.editorconfig`.

Primary files:

1. `package.json`, `mise.toml`, `Makefile`
2. `LICENSE`, `brand/LICENSE`, `guidelines/LICENSE`, `CODEOWNERS`, `README.md`
3. `tests/unit/smoke.test.mjs`

Test gate:

1. `make check` exits 0.

Exit criteria:

1. Smoke test observed red before the files existed, green after.
2. `make check` runs `node --test` and is the single local entry point.

### Increment 02: Confidentiality scanner

**Status:** done

Scope:

1. **Write first, expect red:** `tests/unit/confidentiality.test.mjs` with fixtures under `tests/fixtures/confidentiality/`: a file containing a deny-list term (fixture deny-list uses invented names), a CHF amount outside `examples/`, an unmarked percentage in `examples/`, a SharePoint URL, a `crm/` path, an SVG with `<metadata>` and an absolute file path, a JPEG with EXIF author. Each must be reported; a clean fixture must pass. A missing deny-list must fail closed when `CI=true`.
2. `scripts/confidentiality-check.mjs`: scans the tracked tree (`git ls-files`), deny-list path from `MQ_DENYLIST`, case- and accent-insensitive whole-word matching, exit 1 with file:line findings.
3. `.gitleaks.toml` and `make confidentiality-check` running gitleaks then the scanner.
4. Declare gitleaks in the dotfiles `dot_mise.toml` if absent (separate dotfiles commit, per CI/local parity).

Primary files:

1. `scripts/confidentiality-check.mjs`, `.gitleaks.toml`
2. `tests/unit/confidentiality.test.mjs`, `tests/fixtures/confidentiality/**`

Test gate:

1. `make test` exits 0.
2. `MQ_DENYLIST=tests/fixtures/denylist.txt make confidentiality-check` exits 0 on the real tree (fixtures excluded by an explicit path list, not a glob that could hide real files).

Exit criteria:

1. Every fixture category observed red, then detected.
2. Scanner fails closed in CI without a deny-list.

### Increment 03: CI workflow

**Status:** done

Scope:

1. **Write first, expect red:** a `tests/unit/workflows.test.mjs` asserting every `uses:` is pinned to a 40-character SHA and that the confidentiality job runs on `pull_request` and on `push` of tags.
2. `.github/workflows/ci.yml`: checkout, `jdx/mise-action` (SHA-pinned) installing Node and every tool from `mise.toml`, so local and CI versions have one declaration (no `setup-node`), then `make check`; deny-list fetched from the private MedQuantis deny-list repo with a fine-grained read-only token secret (`MQ_DENYLIST_TOKEN`), written to a temp path, never echoed.
3. `.github/workflows/ci.yml` runs actionlint and zizmor on `.github/**`.
4. Local mirror (CI/local parity): a `workflow-lint` Makefile target running the same `actionlint` and `zizmor --min-severity high .github/` invocations as CI, wired into `make check`; `mise.toml` pins actionlint and zizmor exactly (both are already declared in the owner's dotfiles, so no dotfiles change).
5. `.github/dependabot.yml` for the `npm` and `github-actions` ecosystems (weekly). Dependabot has no mise ecosystem (owner, 2026-10-09: one bot, no Renovate), so `README.md` states that `mise.toml` pins are bumped by hand in a PR whose gate must pass.

Primary files:

1. `.github/workflows/ci.yml`, `.github/dependabot.yml`, `Makefile`, `mise.toml`
2. `tests/unit/workflows.test.mjs`

Test gate:

1. `make test` exits 0.
2. `make workflow-lint` exits 0.
3. `make check` exits 0.

Exit criteria:

1. Workflow is valid and pinned; the private deny-list repo and the secret are listed as owner set-up steps in `README.md`.

### Increment 04: Token source and CSS output

**Status:** done

Scope:

1. **Write first, expect red:** `tests/unit/tokens.test.mjs` asserting: `dist/tokens.css` defines `--mq-accent: #0a2463`; no custom property without the `--mq-` prefix in `dist/tokens.css`; every semantic token resolves to a core value; contrast pairs are declared in an allow-list, each tagged text (4.5:1), large text (3:1) or non-text (3:1), and every declared pair passes while any colour pairing used in `css/` without a declaration fails (covers ink, muted and tertiary on canvas and surface, every on-navy value of ruling 2, warning fill with ink, warning strong on surface and on the warning tint, status colours on surface, the focus ring on canvas and on navy); the status set is exactly success, warning, danger, info (ADR-0004); danger equals `#d8232a`; tertiary text equals `#707070`; no file under `dist/` contains a framework-specific name (`vue`, `nuxt`, `--ui-`, `react`, `jsx`; ADR-0002 framework neutrality).
2. `tokens/core/*.tokens.json` and `tokens/semantic/*.tokens.json` in DTCG Format 2025.10: colours as objects (`colorSpace`, `components`, `hex`), `$type` set at group level, `$deprecated` for retired tokens. Values from the 2026-10-08 report design system plus owner rulings 1 to 5, including radius (3 and 6 px), heading weight (500), a focus-ring token (2 px navy with offset, white on navy) and an ordered categorical chart palette of at most seven hues from the navy and blue-grey family, checked by a colour-vision-deficiency simulation test.
3. Style Dictionary 5.6.0 (exact pin; no DTCG resolver support, none needed in v1) config emitting `dist/tokens.css` and `dist/tokens.json`; `make build`. Contrast computed with the WCAG 2.x formula in a local helper, no dependency.

Primary files:

1. `tokens/core/*.tokens.json`, `tokens/semantic/*.tokens.json`
2. `build/style-dictionary.config.mjs`
3. `tests/unit/tokens.test.mjs`

Test gate:

1. `make build && make test` exits 0.

Exit criteria:

1. All five owner rulings encoded and cited in the token `$description` fields.

Prediction:

1. `dist/tokens.css` and `dist/tokens.json` created; nothing else under `dist/`.

### Increment 05: Generated mappings for Tailwind and the kit

**Status:** done

Scope:

1. **Write first, expect red:** tests asserting `dist/tailwind.css` contains a `@theme static` block with `--color-navy-50` to `--color-navy-950` where `-500`… resolves to the accent, plus success, warning, danger, info scales, and `--font-sans` mapped to Outfit; and that `dist/kit-contract.css` defines every custom property listed in the homemade-claude-kit generic contract (`tokens.template.css`, list vendored as `tests/fixtures/kit-contract-names.txt` with its kit version, including `--font-heading`, which the kit fallback lacks) with **literal values**, never `var()`: the release-note chart reads `--accent`, `--ink` and `--surface` as hex and silently falls back to the kit's blue otherwise. The kit `--warning` maps to `#a06400` because kit renderers put white text on it. The `@font-face` rules are added in increment 06, once the font files exist.
2. Style Dictionary formats for both outputs; the navy scale is derived deterministically in OKLCH (fixed hue, stepped lightness, documented algorithm, not hand-picked). Scales go in `@theme static`; any Tailwind value that points at a `--mq-*` variable goes in `@theme inline` so runtime overrides reach the utilities. No `--ui-*` or Nuxt-specific names (framework neutrality); the Nuxt UI `danger` to `error` mapping lives in the Paracel app.
3. `dist/kit-contract.css` starts with a header comment stating it is for kit renderers only and must never be loaded in an app, because its unprefixed names collide with Tailwind and Nuxt UI.

Primary files:

1. `build/style-dictionary.config.mjs`, `build/formats/*.mjs`
2. `tests/unit/mappings.test.mjs`, `tests/fixtures/kit-contract-names.txt`

Test gate:

1. `make build && make test` exits 0.

Exit criteria:

1. `tailwind.css` contains no literal hex outside the generated scales; `kit-contract.css` values are generated from the tokens, never hand-written. Consumers deploy `kit-contract.css` as `docs/ux/tokens.css`, the only path the kit renderers read.

Prediction:

1. `dist/tailwind.css` and `dist/kit-contract.css` created; `dist/tokens.css` unchanged.

### Increment 06: Assets (fonts, logos, icons)

**Status:** done

Scope:

1. **Write first, expect red:** tests asserting each declared font weight has a woff2 file and an OFL licence file; `fonts/fonts.css` references only relative paths (no `fonts.googleapis.com` or any remote URL anywhere in `fonts/`, `css/` or `dist/`); every SVG under `icons/` and `brand/` passes the confidentiality metadata check; the Lucide build version is pinned in a manifest.
2. Fonts from fontsource packages (Outfit, Newsreader, Geist Mono), copied by a build script, with licences.
3. Logo wordmark, monogram, logo on light and on navy in `brand/` (all rights reserved, its own `LICENSE`): redrawn clean SVGs (text outlined for print variants, live-text variants kept for screen).
4. Lucide pinned build in `icons/` with its licence.
5. `dist/kit-contract.css` embeds the `@font-face` rules for the three families (kit renderers ignore `@import`), with a test asserting they are present and reference no remote URL.

Primary files:

1. `fonts/**` (woff2, OFL.txt, `fonts.css`), `scripts/copy-fonts.mjs`
2. `brand/*.svg`, `brand/LICENSE`, `icons/lucide.min.js`, `icons/LICENSE`
3. `tests/unit/assets.test.mjs`

Test gate:

1. `make build && make test && make confidentiality-check` exits 0.

Exit criteria:

1. Zero remote font or icon requests from any shipped file.

### Increment 07: Component CSS (base, components, slide, print)

**Status:** pending

Scope:

1. **Write first, expect red:** a stylelint 17.16.0 config with `color-no-hex`, `color-named: never`, `function-disallowed-list` for colour functions, `declaration-no-important`, `stylelint-declaration-strict-value` 1.12.1 on colour properties and `stylelint-value-no-unknown-custom-properties` 6.1.1 against `dist/tokens.css` (exempting `tokens/` and `dist/`); a test asserting every `var(--mq-*)` in `css/` is defined, and that every file in `css/` wraps its rules in `@layer mq.base`, `mq.components`, `mq.slide`, `mq.print` or `mq.app` with component selectors inside `:where()`. The same stylelint config is exported as `@medquantis/design-system/stylelint` for consumers.
2. `css/base.css` (typography roles), `css/components.css` (`mq-` card, navy panel, KPI tile variants, table, badges in line-style states, callout, progress and distribution bars, legend, takeaway, footer), rewritten from the report design system using tokens only.
3. `css/slide.css` (1280×720 canvas, section label, slide title, slide number) and `css/print.css` (A4, `print-color-adjust: exact`).
4. Status-colour badges live in an `css/app.css` layer only (ADR-0004), not in `components.css`.
5. Token gaps found in increment 04: shadows, gradients, motion and layout widths are not tokens yet; add any the components need to `tokens/` first (never a literal in `css/`). Text on a navy panel declares its background with a `/* mq-bg: --mq-x */` comment so the contrast test can check the pair.
6. Radius cap (owner, 2026-10-10, option A of ruling 3): `dist/tailwind.css` sets every Tailwind radius step, `xs` and `sm` to the 3 px token and `md` to `4xl` to the 6 px token, so no class can exceed ruling 3; `rounded-full` stays for circles. A test asserts every `--radius-*` step in `tailwind.css` resolves to 3 or 6 px. Pills are rejected by the stylelint config and named in the guidelines (increment 09).
7. The `mq-` component CSS serves build-less media (slides, reports, papers, website, Python-built HTML). Apps with a component library (Nuxt UI, shadcn/ui) take tokens and the Tailwind theme only; `README.md` states this.

Primary files:

1. `css/*.css`, `.stylelintrc.json`
2. `tests/unit/css.test.mjs`

Test gate:

1. `make lint && make test` exits 0.

Exit criteria:

1. Documents can load `components.css` without any status hue reaching them.

### Increment 08: Specimen page

**Status:** pending

Scope:

1. **Write first, expect red:** a Playwright 1.64.0 test (system Chromium) loading the generated `dist/specimen/index.html`: every component class from `css/components.css` appears at least once; `@axe-core/playwright` 4.13.0 with tags `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` reports no serious or critical violation; `toHaveScreenshot` baselines for the page and for a forced focus state; every request outside the file origin is routed to a failure; a PDF export with `tagged: true` and `outline: true` succeeds.
2. `scripts/build-specimen.mjs` generates the specimen from `dist/tokens.json`, `css/` and `examples/` (swatches with contrast, type scale, radius, every component, a 1280×720 slide frame, an A4 print page, the app status layer), fictitious data only. It is never hand-edited. A docs site (Starlight or VitePress) is deferred until about ten shared components or usage guidance next to examples is needed.

Primary files:

1. `scripts/build-specimen.mjs`, `examples/**`
2. `tests/e2e/specimen.spec.mjs`, `playwright.config.mjs`

Test gate:

1. `make test` (including Playwright) and `make confidentiality-check` exit 0.

Exit criteria:

1. The specimen is the visual reference named in `README.md`.

### Increment 09: Guidelines

**Status:** pending

Scope:

1. **Write first, expect red:** a test failing on any em or en dash in `guidelines/`, any hard-wrapped paragraph, and any hex value not present in `dist/tokens.json`.
2. `guidelines/` (all rights reserved, its own `LICENSE`): `principles.md`, `brand.md` (name, tagline FR/DE/EN, legal footer, logo usage), `voice.md` (tone and FR/DE/IT/EN terminology), `colour.md` (incl. the medium split of ADR-0004 and the warning split), `typography.md`, `layout.md`, `charts.md` (ordered palette of four series plus the remainder fill, owner 2026-10-10; series 3 and 4 are below 3:1 on the page, so charts using them carry direct labels or an outline; highlight-on-grey, sequential and diverging use), `data-patterns.md` (CHF and number formats, apostrophe thousands separator, dates, null versus zero, illustrative-data marking), `accessibility.md` (WCAG 2.2 AA target, colour never alone, focus ring, contrast pairs), `writing.md` (no em dash), `specialising.md` (framework neutrality, the four rules and the promotion tests of ADR-0002), and a component status table (trial or stable) in `README.md`.
3. Examples fictitious only; no consumer file paths.

Primary files:

1. `guidelines/*.md`
2. `tests/unit/guidelines.test.mjs`

Test gate:

1. `make test && make confidentiality-check` exits 0.

Exit criteria:

1. Every rule in the platform's brand, design-system, report design-system and style-guide docs and in the Paracel design-system doc is either carried over or explicitly listed as dropped in `guidelines/README.md`.

### Increment 10: Claude skill and plugin

**Status:** pending

Scope:

1. **Write first, expect red:** tests asserting the skill frontmatter has `name` (without the reserved words `claude` or `anthropic`), `description`, `version`; `SKILL.md` is under 500 lines and references are one level deep; every referenced file exists; the plugin and marketplace manifests parse and their versions equal `package.json`'s; the validator script fails on a fixture HTML using a colour outside the token set and passes on a clean one.
2. `plugins/medquantis-design-system/skills/medquantis-design-system/SKILL.md` (when to use, medium split, how to load tokens and components into a page or deck), `references/` per medium (slides, a4-report, web, app, charts) generated from `guidelines/`, not duplicated, and `scripts/` with a token lookup and a validator that fails generated HTML or CSS containing any colour outside the token set.
3. Evals: at least three tasks per medium, run on Haiku, Sonnet and Opus, recorded in the skill's `evals/`.
4. `dist/llms.txt` and `dist/llms-full.txt` generated from `guidelines/` and the token list, served through the CDN.
5. `scripts/sync-skill-assets.mjs` copies the built `tokens.css`, `kit-contract.css` and fonts into the skill's `assets/` (the plugin cache cannot reach `dist/`); a test fails when the committed copy differs from a fresh build.
6. `plugins/medquantis-design-system/.claude-plugin/plugin.json` and the root `.claude-plugin/marketplace.json` so the repo is installable as a Claude Code marketplace; a zipped skill build for claude.ai upload via `make skill-zip`.

Primary files:

1. `plugins/medquantis-design-system/**`
2. `.claude-plugin/marketplace.json`, `scripts/sync-skill-assets.mjs`
3. `tests/unit/skill.test.mjs`

Test gate:

1. `make test` exits 0 and `claude plugin validate .` passes if available, else the manifest test is authoritative.

Exit criteria:

1. A fresh Claude Code session with the plugin installed builds a one-page report that uses only `--mq-*` tokens (manual acceptance check, recorded in `progress.txt`).

### Increment 11: Release pipeline and pre-public audit

**Status:** pending

Scope:

1. **Write first, expect red:** a test running `npm pack --dry-run --json` asserting the tarball contains only `dist/`, `css/`, `fonts/`, `icons/`, `brand/`, `guidelines/`, the licence files, `README.md`, and nothing from `tests/`, `scripts/` or `docs/`; and that `package.json` `exports` lists every subpath consumers use (`./tokens.css`, `./tokens.json`, `./tailwind.css`, `./kit-contract.css`, `./css/*`, `./fonts.css`, `./stylelint`, `./package.json`) with `publishConfig.access: public` and a `repository` URL matching the GitHub repo exactly.
2. release-please config (semver per ADR-0002) and npm publication in the same workflow, gated on release-please's `release_created` output and on the confidentiality job, using npm trusted publishing (OIDC, `id-token: write`, npm CLI 11.5.1 or later) with automatic provenance. The first version may need a manual bootstrap publish before the trusted publisher can be configured; record it in `docs/audits/`.
3. Pre-public audit: gitleaks over the full history and the confidentiality scan with the real deny-list, results recorded in `docs/audits/`.
4. Owner steps (manual, listed not automated): the private GitHub repo `MedQuantis/design-system` exists since 2026-10-09; create the `@medquantis` npm organisation, add the deny-list secret, protect `main`, configure the npm trusted publisher, switch visibility to public only after the audit is green.
5. `README.md` documents CDN use with an exact version and an SRI hash (`https://cdn.jsdelivr.net/npm/@medquantis/design-system@X.Y.Z/dist/tokens.css`), never a range or a `gh/` URL.

Primary files:

1. `release-please-config.json`, `.release-please-manifest.json`, `.github/workflows/release.yml`
2. `tests/unit/package.test.mjs`, `docs/audits/`

Test gate:

1. `make check` exits 0; `gitleaks detect --log-opts="--all"` exits 0.

Exit criteria:

1. `v1.0.0` tagged and published with provenance; the exact-version CDN URL of `dist/tokens.css` resolves and matches its SRI hash.

### Increment 12: Platform decks consume the design system (platform repo, own PR)

**Status:** pending

Scope:

1. **Write first, expect red:** a test in the platform repo asserting a deck built by `build.py` inlines `vendor/medquantis-ds/` CSS before the deck's local CSS, and that the deck-local CSS contains no hex value (stylelint rule from ADR-0002).
2. `design/package.json` pins `@medquantis/design-system` at an exact version so Dependabot (npm ecosystem, `directory: /design`) proposes bumps; `make design-sync` reads that version, extracts the npm tarball into `vendor/medquantis-ds/` and writes `VERSION`; CI checks the vendored copy matches the pinned version.
3. `build.py` inline order: design system, then `design/deck.css` (deck-specific layouts only).
4. Pilot: migrate the single most recent deck still in edition; finished decks stay frozen on their stitched output.
5. Update the platform's `decks/CLAUDE.md` and the `slide-deck` skill to point at the design system.

Test gate:

1. Platform's own lint and deck build pass; the pilot deck's PDF is visually compared with the pre-migration PDF and the differences are listed in the PR.

Exit criteria:

1. New decks start from the design system, not from a copied `styles.css`.

### Increment 13: Platform viewer, report templates and docs (platform repo, own PR)

**Status:** pending

Scope:

1. **Write first, expect red:** a test asserting `viewer/src/styles.css` defines no colour or font value of its own.
2. Viewer depends on `@medquantis/design-system` at an exact version; `:root` copy removed; status colours via the app layer.
3. The redaction answer and report templates load the vendored design system.
4. `docs/design-system.md`, `docs/design-system-rapport.md`, `docs/brand.md`, `docs/style-guide.md` reduced to pointers to the design-system guidelines.

Test gate:

1. `npm run build` in `viewer/` and the platform lint pass.

Exit criteria:

1. No design value is defined anywhere in the platform repo outside `vendor/medquantis-ds/` and `node_modules/`.

### Increment 14: Website (website repo, own PR)

**Status:** pending

Scope:

1. **Write first, expect red:** a check that `assets/styles.css` defines no colour or font value and loads no remote font.
2. Website loads the tagged CDN `tokens.css` and `fonts.css` (or a vendored copy, owner's choice at PR time); its `:root` removed; on-navy colour follows the ruling.

Test gate:

1. The website check passes and screenshots of FR, DE and EN pages at desktop and mobile width are attached to the PR.

Exit criteria:

1. Zero requests to Google Fonts.

### Increment 15: Paracel frontend switches to navy (Paracel repo, own PR)

**Status:** pending

**Prerequisite:** Paracel repo issue #997 fixed and merged in its own PR first. `frontend/app.config.ts` sits outside the Nuxt 4 `app/` source directory, so Nuxt UI ignores it today (neutrals render slate, status colours render Tailwind defaults, the brand colour only reaches Nuxt UI through CSS overrides). Moving it switches the neutrals to stone, a visible change that must not ship in the same PR as the navy switch. Also before the palette swap: move the about 15 places where the accent red means "bad" (chart series, negative deltas, the 404 icon) to the error token, or they turn navy.

Scope:

1. **Write first, expect red:** a vitest asserting `primary` resolves to the navy scale and that `#d8232a` appears only as the danger colour; existing Playwright static tests updated for the new accent where they assert colour.
2. `frontend/app/assets/css/main.css` imports `@medquantis/design-system/tailwind.css`; the local red palette and duplicated tokens are removed; Paracel's six limitation-annotation hues stay local as `--app-*`; the app keeps Nuxt UI components and never loads the `mq-` component CSS or `kit-contract.css`.
3. `app/app.config.ts`: `primary: 'navy'`, `error` mapped to the danger scale (Nuxt UI names it `error`); `--ui-radius` set to the 3 px token, because Nuxt UI derives its whole radius scale as multiples of it (6 px gives 9 px `md` and 12 px `lg`), and the design-system theme loaded after Nuxt UI's so every step resolves to 3 or 6 px, checked on the computed radius of a modal, a card, a button and a badge; the three pill-shaped elements counted on 2026-10-10 (two filter buttons, one version tag) move to the 3 px radius; warning badges use the fill with ink text and `#a06400` for text, icons and borders (ruling 5).
4. Update `docs/developer/frontend-guide.md` (repo rule for theming changes).

Test gate:

1. `make fe-ci-local` exits 0.

Exit criteria:

1. Active tab, focus ring, logo and primary buttons render navy; errors and destructive actions stay red with an icon or label.

### Increment 16: Paracel docs/ux tokens and design-system doc (Paracel repo, own PR)

**Status:** pending

Scope:

1. **Write first, expect red:** a check that `docs/ux/tokens.css` is byte-identical to the vendored `kit-contract.css` of the pinned release.
2. `make design-sync` in the Paracel repo writes `docs/ux/tokens.css` from the release; `docs/ux/DESIGN_SYSTEM.md` and `design-system-final.html` reduced to pointers.

Test gate:

1. The check passes; the docs quality gate passes.

Exit criteria:

1. Kit skills (`com-slide-deck`, `com-artefact-viz`) render on-brand in the Paracel repo with no renderer change.

### Increment 17: Paracel slides pilot (Paracel repo, own PR)

**Status:** pending

Scope:

1. **Write first, expect red:** the rebuilt pilot deck's stitched HTML contains `--mq-accent` and no `#d8232a` outside danger usage.
2. Rebuild the most recently edited Paracel deck on the design system; other decks migrate when next edited.

Test gate:

1. The deck builds and renders to PDF.

Exit criteria:

1. One Paracel deck proven on the design system; the migration recipe recorded in the deck folder's README.

## Delivery Rules

1. One increment per commit in this repo; increments 12 to 17 are one PR each in their consumer repo.
2. **Commit scope:** no capability map exists; use the area scope of each increment: `repo` (01), `gate` (02, 03), `tokens` (04, 05), `assets` (06), `css` (07), `specimen` (08), `guidelines` (09), `skill` (10), `release` (11), `design-system` (12 to 17, in the consumer repo). Plan reference in a `Refs: Plan-0001 increment NN` trailer, never in the scope.
3. Tests named in Scope are written first and observed failing before the implementation lands; `progress.txt` records the red run (failing test names) and then the green run. An increment whose tests were written after its code is not done. No exemption is declared in this plan.
4. Nothing is pushed to a public remote before increment 11's audit is green. Until then, a private remote at most.
5. No content is copied from a consumer repo without being rewritten with fictitious data; `make confidentiality-check` runs before every commit.
6. Every dependency and every GitHub Action is pinned exactly (actions by full SHA).
7. Consumer increments follow the consumer repo's own rules and gates, and ask the owner before committing.
8. Each increment must be independently runnable and reversible.
9. The Ralph loop in this repo runs increments 01 to 11 only. Increments 12 to 17 change other repositories and are driven separately; an iteration agent never edits files outside this repository, except the dotfiles declaration of increment 02, which it records in `progress.txt` as a pending owner action instead of committing when the dotfiles source is not available.
10. Run every test gate in the foreground and end each iteration with a definitive state (done or blocked), never waiting on a background process.

## Milestone Chunks (Standalone Delivery Groups)

| Milestone | Increments | Status | Coherent Outcome | Standalone Test Gate | Exit Criteria | Commit Guidance |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| M1: Confidentiality gate | 01-03 | done | Repo exists with a blocking leak check, locally and in CI | `make check`, actionlint, zizmor | Every leak category detected; fails closed without a deny-list | `chore(repo)`, `feat(gate)`, `ci(gate)` |
| M2: Tokens | 04-05 | done | One token source emitting CSS, Tailwind and kit outputs | `make build && make test` | Owner rulings encoded; contrast AA; kit names complete | `feat(tokens)` |
| M3: Components and assets | 06-08 | pending | Self-hosted assets, token-only components, specimen | `make check` + Playwright + axe | No remote requests; no hex outside tokens | `feat(assets)`, `feat(css)`, `feat(specimen)` |
| M4: Guidelines and Claude | 09-10 | pending | One brand guide and an installable Claude skill | `make test` | Every legacy rule carried or listed as dropped | `docs(guidelines)`, `feat(skill)` |
| M5: Release | 11 | pending | `v1.0.0` public on npm and CDN | `make check`, full-history gitleaks | Audit green before visibility switch | `ci(release)` |
| M6: Consumers | 12-17 | pending | Platform, website and Paracel consume a pinned release | Each consumer's own gate | No design value defined outside the vendored release | `refactor(design-system)` per consumer PR |
