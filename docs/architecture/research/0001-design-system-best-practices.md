---
type: Architecture Research
title: Design system best practices applied to the MedQuantis bootstrap
description: Synthesis of eight research passes (anatomy, tokens, tooling, distribution, governance, multi-medium and AI, accessibility, reference systems) and the corrections they imply for ADR-0002 to ADR-0006 and Plan 0001.
tags: [design-system, research]
timestamp: 2026-10-09T20:00:00+02:00
status: draft
owner: Victor Hueni
last_reviewed: 2026-10-09
review_interval: 90d
---

# Design system best practices applied to the MedQuantis bootstrap

All sources were accessed on 2026-10-09. Confidence: H (primary source read), M (vendor page with gaps, or reputable secondary), L (secondary or inferred). Statements without a source are marked as inference.

## 1. What a good design system contains

A design system is "a complete set of standards intended to manage design at scale using reusable components and patterns" with a style guide, a component library and a pattern library ([NN/g](https://www.nngroup.com/articles/design-systems-101/), H). Brad Frost frames it as a "library of solved problems" whose core is tokens, icons, components and a reference site, kept "only as complex as it needs to be" ([Frost 2023](https://bradfrost.com/blog/post/the-design-system-ecosystem/), H). GOV.UK and Atlassian both give accessibility, content and a component status (Trial, Stable) top-level sections ([GOV.UK](https://design-system.service.gov.uk/), [Atlassian](https://atlassian.design/), H).

Checklist: principles; tokens; brand assets (fonts, logos, icons); components with states; patterns and templates; content and voice; accessibility; reference site; governance (owner, contribution path, status, changelog); distribution and versioning.

Most cited failure modes: adoption ([Sparkbox 2021](https://designsystemssurvey.seesparkbox.com/2021), M), documentation drifting from code (Frost: generate docs from the source, H), building the system like an application, and having no maintainer (NN/g, H). Right-sized for a four-person company: tokens, assets, a thin CSS layer, a generated specimen, short guidelines, semver releases. Overkill: a component framework duplicating Nuxt UI, multi-framework wrappers, a formal RFC board, maturity metrics (inference, consistent with Curtis's "solitary" team model and the Sparkbox maturity stage 1).

## 2. Tokens

- DTCG Format Module 2025.10 is stable as a Final Community Group Report, not a W3C Standard ([W3C CG](https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/), H). Files `.tokens.json`; colours as objects (`colorSpace`, `components`, optional `hex`); `$type` inheritable on groups; `$root`, `$deprecated`, `$extends`. Theming lives in the separate Resolver Module.
- Style Dictionary 5.6.0 (2026-10-03) supports the parts we use but not the resolver ([issue #1590](https://github.com/style-dictionary/style-dictionary/issues/1590), H). Pin exactly; minor releases change dimension output. Terrazzo 2.7.1 is the alternative if resolver files or a ready Tailwind 4 generator become necessary.
- Naming: namespace, category, concept, property, variant, state; use only the levels needed (Curtis, M). Tiers core, semantic, component, with the component tier deferred.
- Tailwind 4: values that reference runtime variables belong in `@theme inline`. Nuxt UI 4 needs 50 to 950 scales, maps `primary` to step 500 (light) and 400 (dark), and names its status colour `error`, not `danger` ([Nuxt UI theme](https://ui.nuxt.com/docs/getting-started/theme/design-system), [CSS variables](https://ui.nuxt.com/docs/getting-started/theme/css-variables), H).

## 3. Visualisation and documentation

A specimen generated from the tokens is sufficient now; a hand-written one drifts. Add a static docs site (Astro Starlight or VitePress, self-hostable) when shared components exceed about ten or when usage guidance must sit next to examples. Storybook (plain-HTML support uncertain in v10) and Chromatic only with a visual-regression trigger; Penpot over Figma if a design practice starts (open source, self-hostable, native tokens). zeroheight, Supernova, Knapsack and Frontify are out of proportion and state no Swiss hosting. Claude Design (research preview since 2026-04-17) can read the repo but documents no export or sync, so it is a consumer to re-onboard on token change ([Anthropic](https://www.anthropic.com/news/claude-design-anthropic-labs), H).

## 4. Distribution and versioning

- One library-level version for tokens and CSS (Curtis, [Versioning Design Systems](https://nathanacurtis.substack.com/p/versioning-design-systems-48cceb5ace4d), H). npm is the origin of every channel.
- Publish with npm trusted publishing (OIDC), not a token; provenance requires a public repo ([npm docs](https://docs.npmjs.com/trusted-publishers), H). The first version may need a manual bootstrap publish (L).
- release-please does not publish; publish in the same workflow gated on `release_created`, because a release created with `GITHUB_TOKEN` triggers no other workflow (M).
- CDN: `cdn.jsdelivr.net/npm/@medquantis/design-system@X.Y.Z/...` with an SRI hash; exact versions are cached for a year and immutable, aliases for 7 days ([jsDelivr](https://github.com/jsdelivr/jsdelivr), H). Avoid `gh/` URLs and ranges.
- Dependabot cannot bump a version in a Makefile; give each Python consumer a tiny `design/package.json` that Dependabot can update and that `make design-sync` reads (inference from the [supported ecosystems](https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories), H).
- Token lifecycle: deprecate in a minor (alias plus lint warning), remove only in a major (Atlassian, M; Curtis, H).

## 5. Governance and specialisation

- Centralised model with one owner and contributions by PR; small changes as direct PRs, large ones (new component, rename, theme) start with a short written proposal ([Polaris](https://polaris.shopify.com/contributing), H). Name a backup owner and a review deadline to avoid local workarounds.
- Promotion: GOV.UK criteria useful, unique, consistent, versatile ([GOV.UK](https://design-system.service.gov.uk/community/contribution-criteria), H); log every local one-off and its outcome (Frost, M).
- Ship CSS in cascade layers (`@layer mq.reset, mq.base, mq.components;`) with component selectors in `:where()`, so consumer layers win without specificity fights; unlayered consumer CSS beats all layers and `!important` inverts the order ([MDN @layer](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), H).
- `color-no-hex` misses named colours and colour functions ([stylelint](https://stylelint.io/user-guide/rules/color-no-hex), H). Add `color-named: never`, `function-disallowed-list` for colour functions, and `stylelint-value-no-unknown-custom-properties` 6.1.1 against the token export; stylelint 17.16.0, `stylelint-declaration-strict-value` 1.12.1.

## 6. Media beyond the web, and AI consumers

- Print: `print-color-adjust: exact`; Chrome 131+ renders `@page` margin boxes and page counters ([Chrome](https://developer.chrome.com/blog/new-in-chrome-131), H).
- Email: CSS variables are unreliable in clients ([caniemail](https://www.caniemail.com/features/css-variables/), M); newsletters need resolved literal values, inlined styles and dark-mode-safe logos (padded background, not transparent).
- Charts: one ordered categorical palette used strictly in sequence ([Carbon](https://carbondesignsystem.com/data-visualization/color-palettes/), H), about seven hues at most, checked with a colour-vision-deficiency simulator; plus sequential, diverging and highlight-on-grey schemes.
- Agent Skills are one folder for Claude Code and claude.ai; SKILL.md under 500 lines, references one level deep, the `name` must not contain "claude" or "anthropic", deterministic work in scripts, at least three evals ([best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), H). Org provisioning by zip upload, on for all members by default ([support](https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization), H). Rules in prose do not stop agents inventing colours; ship a validator script that fails on any colour outside the token set. Primer ships an LLM build output and a "never use raw values" guide ([Primer](https://github.com/primer/primitives/blob/main/DESIGN_TOKENS_GUIDE.md), H); `llms.txt` is common and cheap.

## 7. Accessibility and quality

Contrast computed with the WCAG 2.x formula:

| Token | on `#fafaf8` | on `#ffffff` | on navy | Verdict |
|---|---|---|---|---|
| ink `#1a1a1a` | 16.65 | 17.40 | 1.20 | AAA on light |
| muted `#555555` | 7.13 | 7.46 | 1.95 | AAA on light |
| grey `#8c8c8c` | 3.22 | 3.36 | 4.32 | fails AA text |
| grey `#707070` | 4.74 | 4.95 | 2.93 | AA |
| success `#2e7d32` | 4.91 | 5.13 | 2.83 | AA |
| warning `#d4850a` | 2.81 | 2.93 | 4.95 | fails as text and as icon or border |
| warning text `#a06400` | 4.65 | 4.86 | 2.99 | AA, narrow margin |
| danger `#d8232a` | 4.79 | 5.01 | 2.90 | AA |
| info `#1565c0` | 5.50 | 5.75 | 2.53 | AA |

On navy only white or canvas text passes. On a warning fill, ink passes (5.93) and white fails (2.93).

- Gates: an allow-list of foreground and background pairs each tagged text (4.5), large text (3) or non-text (3), failing on undeclared pairs; stylelint; Playwright 1.64.0 with `@axe-core/playwright` 4.13.0 (tags wcag2a, wcag2aa, wcag21aa, wcag22aa); `toHaveScreenshot` in a pinned container; a no-remote-request route. axe does not cover 1.4.11 non-text contrast or focus ([rule list](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md), H), so the token test must.
- Focus: AA is 2.4.7 plus 1.4.11 (3:1); 2.4.13 Focus Appearance is AAA ([W3C](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html), H). A 2px navy ring with offset gives 13.9:1.
- APCA is not normative: the WCAG 3 contrast method is still undetermined ([Roselli, April 2026](https://adrianroselli.com/2026/04/wcag3-contrast-as-of-april-2026.html), H). Target WCAG 2.2 AA.
- PDF: Playwright `page.pdf` defaults `tagged` and `outline` to false; set both, validate with veraPDF if PDF/UA matters.
- Legal: eCH-0059 binds public bodies only; the BehiG revision would extend duties to private providers proportionately, earliest 2027 (M); the EU Accessibility Act covers consumer services and very likely not B2B tools sold to insurers (inference, M).

## 8. Reference systems

| System | Notable pattern |
|---|---|
| [Swiss Confederation](https://github.com/swiss/designsystem) | MIT with brand elements explicitly excluded in LICENSE; manual releases (a weakness); `publiccode.yml` |
| [GOV.UK](https://github.com/alphagov/govuk-frontend) | MIT code, documents under OGL, brand font and crown restricted; release runbooks; CODEOWNERS |
| [NHS](https://github.com/nhsuk/nhsuk-frontend) | Precompiled zip on each release; licensed font referenced, not redistributed |
| [USWDS](https://github.com/uswds/uswds) | Per-folder third-party licence list; GOVERNANCE.md, AGENTS.md |
| [SBB Lyne tokens](https://github.com/sbb-design-systems/lyne-design-tokens) | Tokens in their own package, Style Dictionary 5.6, release-please, Renovate; no LICENSE file (anti-pattern) |
| [Primer primitives](https://github.com/primer/primitives) | base, functional, component tiers; Style Dictionary 5; LLM build output; Changesets |
| [Open Props](https://github.com/argyleink/open-props) | `unpkg`/`jsdelivr` fields for zero-config CDN |

Licence pattern: code and tokens MIT (or Apache-2.0, which states no trademark grant); guidelines either CC BY 4.0 or all rights reserved; logos in a `brand/` folder excluded in the root LICENSE; OFL fonts committed with their OFL.txt; `license` in package.json consistent with LICENSE.

## 9. Corrections to ADR-0002 to ADR-0006 and Plan 0001

1. Tertiary text grey `#707070`; `#8c8c8c` only for non-text decoration (resolves owner ruling 1 on evidence).
2. Warning `#d4850a` becomes a fill-only token with ink text; icons and borders use `#a06400` or a 3:1 variant.
3. Status naming maps `danger` to Nuxt UI `error` in the Tailwind adapter; contrast tests run on generated values per mode.
4. `kit-contract.css` is never loaded in apps; its unprefixed names would collide with Tailwind and Nuxt UI.
5. Tokens as DTCG colour objects in `.tokens.json`, `$type` at group level; Style Dictionary 5.6.0 exact; no resolver in v1.
6. Specimen generated from tokens, not hand-written; docs site deferred to a ten-component trigger.
7. Shared `mq-` components serve build-less media only; the Nuxt app uses Nuxt UI components themed by tokens, never the `mq-` component CSS.
8. CSS shipped in `@layer mq.*` with `:where()` selectors; stylelint additions listed in section 5; `!important` banned in consumers.
9. npm trusted publishing in the release-please workflow; CDN by exact npm version with SRI; Dependabot-readable `design/package.json` in Python consumers.
10. Breaking-change table with a deprecation step; a visible re-theme needs an explicit policy (owner ruling).
11. New deliverables: chart palette (ordered, CVD-checked), email output (resolved values, dark-mode-safe logos) if newsletters are in scope, Claude skill validator script, per-medium skill references and evals, `llms.txt`.
12. Missing content: principles, voice and terminology (FR, DE, IT, EN), accessibility section, number and data patterns (CHF format, null versus zero), component status, `GOVERNANCE.md` and `CONTRIBUTING.md` with two contribution tiers, a backup owner, a one-off log.
13. Licence: root LICENSE excludes `brand/`; guidelines licence is an owner ruling; per-folder OFL notices.
14. Focus ring token and non-text contrast pairs in the token test; Playwright PDF with `tagged` and `outline`.
