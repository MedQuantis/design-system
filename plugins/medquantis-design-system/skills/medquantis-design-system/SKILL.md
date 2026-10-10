---
name: medquantis-design-system
description: Builds on-brand MedQuantis output (HTML slides and decks, A4 reports and papers, web pages, app screens, SVG charts) from the MedQuantis design-system tokens, shared mq- components and self-hosted fonts, then checks it with a validator that fails any colour outside the token set. Use whenever the user asks for anything that carries the MedQuantis brand or look, mentions MedQuantis slides, reports, one-pagers, website sections, app UI or charts, or asks for the navy MedQuantis style, its colours, fonts, number format or legal line.
license: Code and tokens MIT; the brand files and guideline text are all rights reserved by MedQuantis SA; fonts under the SIL Open Font License. See LICENSE.txt.
compatibility: Needs Python 3.11 or later (standard library only) to run the scripts. Works offline.
allowed-tools: Bash(python3 ${CLAUDE_SKILL_DIR}/scripts/*)
metadata:
  version: "0.0.0"
---

# MedQuantis design system

Every MedQuantis surface shares one set of tokens: navy `#0a2463` is the single accent, the page is a warm off-white, type is Outfit, Newsreader and Geist Mono. This skill carries the built tokens, the shared `mq-` CSS, the fonts and the brand files in `assets/`, the rules per medium in `references/`, and two scripts: a token lookup and a validator.

Paths below are relative to this skill's folder. In Claude Code that folder is `${CLAUDE_SKILL_DIR}`; on claude.ai it is the folder this SKILL.md was read from.

## Workflow

Copy this checklist and work through it:

```
- [ ] 1. Pick the medium and read its reference file
- [ ] 2. Copy assets/ next to the page and link the tokens, fonts and components
- [ ] 3. Build with mq- classes and var(--mq-*) values only
- [ ] 4. Write figures, dates and copy by the rules below
- [ ] 5. Bundle the page in place into one self-contained file
- [ ] 6. Run validate.py --record on it and fix every finding
- [ ] 7. Deliver the bundled file
```

**Shell discipline.** Run one plain command per Bash call: never chain with `&&`, `;`, pipes or heredocs, and never write a file by shell redirection. Permission-restricted sessions deny a compound command outright, so the step after it silently never happens. Write and edit files with the Write and Edit tools. Every command below is one such call.

## 1. Pick the medium

| Medium | Read | Colours allowed |
| :-- | :-- | :-- |
| Slides and decks (1280 by 720) | [references/slides.md](references/slides.md) | Navy, neutrals, blue-grey, chart tokens |
| A4 reports, papers, one-pagers | [references/a4-report.md](references/a4-report.md) | Navy, neutrals, blue-grey, chart tokens |
| Website and web pages | [references/web.md](references/web.md) | Navy, neutrals, blue-grey, chart tokens |
| Interactive apps and tools | [references/app.md](references/app.md) | All of the above plus the status colours |
| Charts, in any medium | [references/charts.md](references/charts.md) | Navy and blue-grey series only, never status hues |

The medium split (ADR-0004): documents (slides, reports, papers, newsletters, the website) are navy-only and show a state by mark style (solid, ring, pale, outline, quiet, dashed, struck through), never by green, orange or red. Only interactive apps use `--mq-success`, `--mq-warning`, `--mq-danger` and `--mq-info`, for genuine system status, and always with an icon or a word. When the medium is unclear, treat the output as a document.

## 2. Load the system into a page

`assets/` holds the files to load, in this order:

| File | Holds |
| :-- | :-- |
| `assets/tokens.css` | Every token as a `--mq-*` custom property. Always first |
| `assets/fonts/fonts.css` | Outfit, Newsreader, Geist Mono, self-hosted woff2 (relative paths: keep the `fonts/` folder next to it) |
| `assets/css/base.css` | Typography roles: `mq-doc`, `mq-wrap`, `mq-eyebrow`, `mq-display`, `mq-title`, `mq-subtitle`, `mq-lead`, `mq-prose`, `mq-label`, `mq-note`, `mq-mono`, `mq-figure`, `mq-em` |
| `assets/css/components.css` | Document components (below) |
| `assets/css/slide.css` | The slide canvas, for decks |
| `assets/css/print.css` | A4 pages, for reports and anything printed |
| `assets/css/app.css` | Status badges, apps only. Never in a document |
| `assets/brand/` | `wordmark-on-light.svg` and `wordmark-on-navy.svg` (live text, inline them in a page that loads fonts.css), the `-print` variants (outlined, for `<img>`, PDF, email) and `monogram.svg` |

Copy `assets/` next to the page with one command, then write the page with the Write tool and link the files:

```bash
cp -r ${CLAUDE_SKILL_DIR}/assets assets
```

If copying is not possible, link the files at `${CLAUDE_SKILL_DIR}/assets/...` by their absolute path instead; bundling (section 6) inlines them either way.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="assets/tokens.css">
<link rel="stylesheet" href="assets/fonts/fonts.css">
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/components.css">
<link rel="stylesheet" href="assets/css/print.css">
<style>
  /* Local layout only, under a local prefix, built from tokens. */
  .rep-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--mq-space-5); }
</style>
</head>
<body class="mq-doc">
```

The shared CSS sits in cascade layers (`mq.base`, `mq.components`, `mq.slide`, `mq.print`, `mq.app`) with every selector inside `:where()`, so any local class wins without `!important`. For a deck, link `slide.css` instead of `print.css` and wrap each slide in `<section class="mq-slide">`.

Apps built on a component library (Nuxt UI, shadcn/ui) take `tokens.css` and the Tailwind theme of the npm package only; they do not load the `mq-` component CSS. `assets/kit-contract.css` is only for the homemade-claude-kit renderers (deployed as `docs/ux/tokens.css`); never load it in an app or a page.

## 3. Build with the components

Use these classes before writing any local CSS; their markup is fixed:

```html
<div class="mq-card"><h3 class="mq-card-title">Title</h3><p class="mq-card-body">One idea.</p></div>

<div class="mq-panel">
  <p class="mq-panel-kicker">Summary</p>
  <h3 class="mq-panel-title">The message in one sentence</h3>
  <p class="mq-panel-text">The sentence that explains it.</p>
  <hr class="mq-panel-rule">
</div>

<div class="mq-kpis">
  <div class="mq-kpi"><p class="mq-kpi-label">Label</p><p class="mq-kpi-value">184</p><p class="mq-kpi-caption">medicines under review</p></div>
  <div class="mq-kpi is-navy">...</div>
  <div class="mq-kpi is-pale">...</div>
</div>

<table class="mq-table">
  <thead><tr><th scope="col">Insurer</th><th scope="col">Refund<br>CHF</th></tr></thead>
  <tbody>
    <tr class="is-highlight"><td class="is-key">Assureur A</td><td class="mq-num">...</td></tr>
    <tr class="is-total"><td>Total</td><td class="mq-num">...</td></tr>
  </tbody>
</table>

<span class="mq-badge is-solid">Paid</span>      <!-- also is-ring, is-pale, is-outline, is-quiet, is-dashed -->
<div class="mq-callout"><p class="mq-callout-title">Method</p><p>A reservation or a point of attention.</p></div>
<p class="mq-takeaway">The one sentence to remember.</p>

<div class="mq-distribution" role="img" aria-label="Shares, labelled in the legend">
  <div class="mq-segment is-1" style="flex: 46 1 0"></div><div class="mq-segment is-2" style="flex: 31 1 0"></div><div class="mq-segment is-rest" style="flex: 23 1 0"></div>
</div>
<ul class="mq-legend"><li class="mq-legend-item"><span class="mq-swatch is-1"></span>Assureur A</li></ul>

<p class="mq-foot">Sources ... MedQuantis SA · CH-1095 Lutry · medquantis.ch · 08.10.2026</p>
```

Slides: `mq-slide` holds `mq-slide-label`, `mq-slide-title`, `mq-slide-body`, `mq-slide-number`. A4: `<div class="mq-desk"><article class="mq-page">...</article></div>`; the desk is screen-only. App status (apps only): `<span class="mq-status is-danger"><svg class="mq-status-icon" aria-hidden="true">...</svg>Error</span>`.

Local additions use a local prefix (`--deck-*`, `--app-*`, `.rep-*`) and reference `var(--mq-*)` only. Never redefine an `--mq-*` name, never name a `--mq-core-*` token, never write a literal colour, font, shadow, radius or spacing value.

## 4. Rules every output follows

**Colour.** Semantic tokens only: `--mq-accent` (navy) for key figures, links, active states, series 1 and navy panels; `--mq-ink`, `--mq-muted`, `--mq-tertiary` for text (tertiary is the lightest text grey; `--mq-decoration` is never text); `--mq-canvas` (`#fafaf8`) as the page of every document, `--mq-surface` (white) for cards and panels, `--mq-desk` only around a page preview on screen. On navy: white titles and figures, `--mq-on-navy-secondary` and `--mq-on-navy-second-level` for smaller text. No sky blue, no gradients other than the panel tokens, one large navy block per page area.

**Charts.** Series in fixed order, darkest first: `--mq-chart-series-1` (navy), `--mq-chart-series-2`, `--mq-chart-series-3`, `--mq-chart-series-4`, then `--mq-chart-rest` for the remainder (drawn with a series 4 outline). Never more than four series; group the rest as "Other". Series 3 and 4 are below 3:1 on the page, so label those marks directly or outline them. One baseline in `--mq-chart-baseline`, no background grid, axis labels in Geist Mono in `--mq-tertiary`, legend in HTML (`mq-legend`) beside or above the plot. Charts never take a status colour, not even in an app.

**Corners (ruling 3).** `--mq-radius-small`, 3 px, for small items: tags, chips, badges, inputs, buttons, bar ends. `--mq-radius-medium`, 6 px, for cards, panels, KPI tiles, figures, slide frames; the maximum anywhere else. `--mq-radius-overlay`, 12 px, only for app dialogs, modals, side drawers and command palettes, never in documents. No pill shapes; a circle only for something round (a status dot, a numbered marker, an avatar).

**Type.** Outfit 500 for every heading, label, KPI value and button (`--mq-font-weight-heading`); Outfit 600 only for a short highlighted word in body text. Newsreader for reading text, its italic for leads and notes. Geist Mono for table figures, dates in tables, codes, eyebrows and axis labels, with tabular figures. No text below 11 px.

**Numbers (ruling 8, as amended).** Thousands with the straight apostrophe, decimals with a point, in every language: `2'460'000`, `12.5`. A non-breaking space (U+00A0, `&nbsp;` in HTML) before `%` and between `CHF` and the amount: `12.5&nbsp;%`, `CHF&nbsp;2'460'000` (mq:illustrative). Currency first, never `Fr.` or a trailing `CHF`. Negative with the minus sign U+2212. Change shown by its sign (`+14&nbsp;%`), never by a colour or an arrow alone. Dates `08.10.2026`, months `10.2026`, periods `2019 → 2025`. A missing value is `n/a` (English), `n.d.` (French, Italian) or `k.A.` (German), never `0`, a blank or a dash. Never invent a confidential rate or price: show a mask (`••••` in Geist Mono).

**Writing.** No em dash and no en dash anywhere, in any language: use a comma, a colon, a full stop, parentheses or a middle dot (`04 · Analytics`). Sentence-case titles without a final full stop. Numbers before adjectives, no hype, no humour. French takes a non-breaking space before `: ; ? ! %`. German is formal Swiss Standard German (Sie, ss).

**Brand.** The name is MedQuantis (capital M and Q). The wordmark is the logo, navy on light and white on navy; never recolour, stretch or rebuild it. The footer of every document sent outside carries the legal line and the date, in Geist Mono, tertiary colour: `MedQuantis SA · CH-1095 Lutry · medquantis.ch`. Icons: Lucide only, monochrome, stroke 2, colour inherited from the text; never an emoji. No remote font, icon or stylesheet request.

**Data.** Examples and placeholders use fictitious data only: Assureur A to D, Médicament X and Y, round amounts. Flag fictitious figures on the page in a note ("Illustrative figures · insurers and medicines anonymised"). Never name a real client, partner or person, and never present an invented figure as real.

**Accessibility.** WCAG 2.2 AA. Colour never carries meaning alone. One `h1` per page, headings in order, `lang` set. Keep the visible focus ring the base CSS draws. An SVG chart has `role="img"` and a `<title>` and `<desc>`, and its key values also appear as text.

## 5. Look up tokens

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/tokens.py accent              # names containing "accent"
python3 ${CLAUDE_SKILL_DIR}/scripts/tokens.py "#5d6f91"           # which token holds a value
python3 ${CLAUDE_SKILL_DIR}/scripts/tokens.py --medium document   # every token a document may use
python3 ${CLAUDE_SKILL_DIR}/scripts/tokens.py radius              # sizes, spacing, fonts work the same way
```

## 6. Bundle into one file

A page that links `assets/` renders unstyled once it leaves that folder. Bundle it in place before validating and delivering:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/bundle.py output.html output.html
```

It inlines the linked stylesheets (marked `data-mq-bundled`) and turns the fonts and local images into data URIs. Edit the bundled file directly afterwards; bundling it again is harmless.

## 7. Validate, then deliver

Run the validator on every HTML, SVG or CSS file you produced, with `--record` so the verdict is kept in a file, and fix each finding before showing the result:

```bash
python3 ${CLAUDE_SKILL_DIR}/scripts/validate.py --record validation.txt output.html                 # documents (default): navy-only
python3 ${CLAUDE_SKILL_DIR}/scripts/validate.py --medium app --record validation.txt output.html    # apps: status colours allowed
```

It checks the page's own CSS and markup, not the bundled design-system sheets, and fails on any colour outside the token set (hex, `rgb()`, `hsl()` and other colour functions, named colours, in CSS, style attributes, SVG attributes and script strings), an unknown, deprecated or redefined `--mq-*` token, a status colour in a document, an em or en dash in visible text, and a remote font service. Replace each literal with the `var(--mq-*)` token that holds the value; `tokens.py` finds it. Exit 0 and a first line `PASS` in `validation.txt` mean clean; re-run it after every fix.

Deliver the bundled, validated file itself (an artifact, an attachment, a PDF source): it carries its styles and fonts and opens anywhere. When the task names an output file, that file is the bundled one. For PDF, print the page from a browser with background graphics on; `print.css` keeps the colours exact and A4 pages whole. Check a PDF page by page before sending it.

## Reference files

- [references/slides.md](references/slides.md): slides and decks
- [references/a4-report.md](references/a4-report.md): A4 reports, papers and one-pagers
- [references/web.md](references/web.md): the website and web pages
- [references/app.md](references/app.md): interactive apps, including the status colours
- [references/charts.md](references/charts.md): charts in any medium

Each reference is generated from the MedQuantis guidelines and ends with the colour tokens of its medium.
