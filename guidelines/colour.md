# Colour

Use semantic tokens only. The `--mq-core-*` names hold raw values and exist so semantic tokens can point at them; a consumer never names them. Every value below is generated in `dist/tokens.css`, and every contrast ratio comes from `tokens/contrast-pairs.json`, checked by the token test and shown in the specimen.

## The medium split

| Medium | Colours allowed | How a state is shown |
| :-- | :-- | :-- |
| Documents: slides, A4 reports, papers, newsletters, the website | Navy, the neutrals, the blue-grey family, the chart tokens | By mark style: solid, ring, pale, outline, quiet, dashed, struck through |
| Interactive apps | Everything documents use, plus `--mq-success`, `--mq-warning`, `--mq-danger`, `--mq-info` | Status colour for genuine system status only (errors, validation, alerts, confirmations), always with an icon or a word |

Documents never carry green, orange, red, sky blue, pink, purple or turquoise, not even to say good or bad ([ADR-0004](../docs/architecture/decisions/adr-0004-status-colours-in-apps-only.md)). They never load `css/app.css`. A callout in a document is always navy; there is no warning-orange or success-green callout.

## Accent

| Token | Value | Use |
| :-- | :-- | :-- |
| `--mq-accent` | `#0a2463` | The single accent: key figures, links, active states, the key column of a table, top and edge rules, series 1, navy panels |
| `--mq-accent-hover` | `#061a4d` | Hover and pressed state of a link or an accent control, nothing else |
| `--mq-accent-pale` | `#eaeef7` | Icon pills and chips, a deviating value, the highlighted table row, the pale state |
| `--mq-accent-pale-2` | `#f2f4f9` | Progress tracks, the quiet state, callout background |
| `--mq-on-accent` | `#ffffff` | Text and icons on an accent fill (14.53:1) |

Navy carries emphasis on its own. Status colours never replace it for emphasis, in any medium.

## Neutrals

The neutrals are warm greys tuned to the warm canvas, never blue-tinted greys.

| Token | Value | Use | Contrast |
| :-- | :-- | :-- | :-- |
| `--mq-ink` | `#1a1a1a` | Primary text and values | 16.65:1 on canvas |
| `--mq-muted` | `#555555` | Secondary text, leads, captions | 7.13:1 on canvas |
| `--mq-tertiary` | `#707070` | Tertiary text: notes, footers, axis labels, placeholders (owner ruling 1) | 4.74:1 on canvas, 4.95:1 on surface |
| `--mq-decoration` | `#8c8c8c` | Non-text decoration only: axis lines, ticks, an icon beside its label. Never text (owner ruling 1) | 3.22:1 on canvas |
| `--mq-canvas` | `#fafaf8` | Background of every document page: A4 report, paper, slide (owner ruling 9) | |
| `--mq-surface` | `#ffffff` | Cards, panels, tables, figures, inputs | |
| `--mq-surface-alt` | `#f5f4f1` | Recessed areas: table headers, tab bars, grouped areas, hover | |
| `--mq-desk` | `#e9e8e4` | On screen only, around a page preview; never inside a document, so a printed page is never grey (owner ruling 9) | |
| `--mq-border` | `#dddbd6` | Borders, dividers, chart baselines | decorative |
| `--mq-border-light` | `#ebeae6` | Hairlines between rows and columns, card borders | decorative |
| `--mq-border-strong` | `#5d6f91` | Outline of outlined and dashed state marks | 4.84:1 on canvas, non-text |

Why a warm canvas: pure white reads clinical and generic; the warm off-white reads institutional while white cards still stand out on it. Tertiary text sits exactly at 4.50:1 on `--mq-surface-alt`, so put it on canvas or surface, not on the recessed grey.

## Navy panels and gradients

Navy panels, the report header and the navy KPI tile use a gradient between `--mq-panel-start` (`#0f2a5e`) and `--mq-panel-end` (`#0a2047`) at 160 degrees. Contrast is always checked against `--mq-panel-start`, the lighter stop and the worst case.

Text and marks on navy follow owner ruling 2. There is no sky blue anywhere.

| Token | Value | Use | On navy | On panel start | Allowed for |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `--mq-on-navy-title` | `#ffffff` | Titles, figures, icons | 14.53:1 | 13.88:1 | Text |
| `--mq-on-navy-secondary` | white at 68 % | Secondary text, kickers, labels | 7.40:1 | 7.18:1 | Text |
| `--mq-on-navy-second-level` | `#c3cbdc` | Second-level text, descriptions | 8.92:1 | 8.52:1 | Text |
| `--mq-on-navy-accent` | `#8795b3` | A one-off accent: one word, one dot | 4.83:1 | 4.61:1 | Text, narrow margin |
| `--mq-on-navy-discreet` | white at 40 % | Discreet numbers | 3.48:1 | 3.44:1 | Large text or non-text only |
| `--mq-on-navy-rule`, `--mq-on-navy-rule-strong` | white at 16 and 18 % | Rules and separators | 1.61:1 | 1.62:1 | Decorative only |
| `--mq-on-navy-pill` | white at 12 % | Icon pill fill; the icon on it stays white (10.31:1) | 1.41:1 | | Decorative only |

Use white icons on navy, including Lucide icons (set the SVG stroke). One large navy block per screen or page area ([layout](layout.md)).

## States by mark style (documents)

| Mark | Look | Meaning |
| :-- | :-- | :-- |
| Solid | Navy fill, white text | Acquired, paid, confirmed |
| Ring | White fill, navy outline and text | Approved, validated, in progress |
| Pale | Pale navy fill, navy text | Corrected, for information |
| Outline | White fill, blue-grey outline, ink text | Neutral, pending |
| Quiet | Quiet pale fill, muted text | Withdrawn, excluded, not applicable |
| Dashed | Dashed blue-grey outline, muted text | Upcoming, not yet claimed, on the roadmap |
| Struck through | Text struck through in blue-grey 2 | Excluded from the total |

The first six are the `mq-badge` states (`is-solid`, `is-ring`, `is-pale`, `is-outline`, `is-quiet`, `is-dashed`); the struck-through row is a table pattern without a shared class yet ([layout](layout.md)). A page that uses them gives their key once ([accessibility](accessibility.md)).

## Status colours (apps only)

| Token | Value | Use | Contrast |
| :-- | :-- | :-- | :-- |
| `--mq-success` | `#2e7d32` | Confirmation, published, valid | 5.13:1 on surface, 4.91:1 on canvas |
| `--mq-danger` | `#d8232a` | Errors, destructive actions | 5.01:1 on surface, 4.79:1 on canvas |
| `--mq-info` | `#1565c0` | Information | 5.75:1 on surface, 5.50:1 on canvas |
| `--mq-warning` | `#a06400` | Warning text, icons and borders | 4.86:1 on surface, 4.65:1 on canvas |
| `--mq-warning-fill` | `#d4850a` | Warning badge or highlight fill, always with ink text (5.93:1) | Fill only |
| `--mq-warning-tint` | `#fbf3e7` | Warning background behind ink text (15.81:1) | Fill only |

The warning split (owner ruling 5): the orange `#d4850a` is a fill and never text, an icon or a border (2.81:1 on canvas). Text on it is ink; white on it is forbidden (2.93:1). On the warning tint, the text stays ink and `--mq-warning` is used only for the icon and the border (4.42:1, non-text).

Every status colour comes with an icon or a word (WCAG 1.4.1):

- a status badge carries its word, an urgent flag adds an icon and a border (`mq-status` in `css/app.css`);
- a status column shows a small coloured dot followed by the plain word, not a badge;
- a flag is a coloured word, and only on the rows that need attention, so normal rows stay quiet;
- light badge backgrounds come from the 50 and 100 steps of the status scales in `dist/tailwind.css`, never a hand-picked tint.

The red of the old Paracel theme survives only as `--mq-danger` ([ADR-0003](../docs/architecture/decisions/adr-0003-navy-is-the-single-brand-accent.md)). App-specific hues, such as the annotation colours of regulatory text, stay local in the app under its own prefix until a second consumer needs them ([specialising](specialising.md)).

## Chart colours

The chart tokens (`--mq-chart-series-1` to `--mq-chart-series-4`, `--mq-chart-rest`, `--mq-chart-axis`, `--mq-chart-baseline`) and their order are in [charts](charts.md).
