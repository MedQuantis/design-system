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
| `--mq-accent-highlight` | `#0a2463` | Accent text on the pale fills (the pale KPI value, the pale badge, the callout title) and large highlighted title text: the accent itself in light, the light navy on dark (owner ruling 18) |

Navy carries emphasis on its own. Status colours never replace it for emphasis, in any medium.

## Neutrals

In the light theme the neutrals are warm greys tuned to the warm canvas, never blue-tinted greys; the neutrals of the dark theme carry the navy cast of its canvas ([Dark theme](#dark-theme)).

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
| `--mq-warning-fill` | `#d4850a` | Warning badge or highlight fill, always with its text role `--mq-on-warning-fill`, ink in light (5.93:1) | Fill only |
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

## Dark theme

MedQuantis has one dark theme ([ADR-0007](../docs/architecture/decisions/adr-0007-medquantis-has-a-dark-theme.md), owner ruling 12). It re-values the semantic roles above under the `.dark` class: a role it does not name keeps its light value, and no component needs a second name. A consumer opts in by loading `themes/dark.css` of the package after `tokens.css` and setting `.dark` on `<html>` or on one slide. The design system never switches on `prefers-color-scheme` by itself.

- **Apps and the website:** light and dark; the app decides how the viewer chooses, and may follow the viewer's setting by toggling `.dark`.
- **Documents** (A4 reports, papers, PDFs): light or dark, chosen by the author per document at build time, never from the reader's screen (owner ruling 15). A dark document stays dark in its PDF; light stays the default for anything likely to be printed on paper.
- **Slides:** a whole deck, or a single slide carrying `.dark`.

Every ratio below is the WCAG 2.x contrast with the dark values, on the dark canvas `#11161f` and surface `#1a2131`; the token test checks every declared pair in both themes.

| Token | Dark value | Use | Contrast |
| :-- | :-- | :-- | :-- |
| `--mq-canvas` | `#11161f`, a near-black with a navy cast | Background of every dark page and slide | Background |
| `--mq-surface` | `#1a2131` | Cards, panels, tables, figures, inputs | Background |
| `--mq-surface-alt` | `#141a26` | Recessed areas: table headers, grouped areas | Background |
| `--mq-desk` | `#0b0f16` | On screen only, around a dark page preview | Background |
| `--mq-border` | white at 14 % | Borders, dividers | Decorative |
| `--mq-border-light` | white at 10 % | Hairlines, card borders | Decorative |
| `--mq-border-strong` | `#8795b3` | Outline of outlined and dashed state marks | 6.03:1 on canvas, 5.35:1 on surface, non-text |
| `--mq-ink` | `#f5f4f1`, warm white | Primary text and values | 16.48:1 on canvas, 14.62:1 on surface |
| `--mq-muted` | `#c3cbdc` | Secondary text, leads, captions | 11.13:1 on canvas, 9.88:1 on surface |
| `--mq-tertiary` | `#8f98aa` | Tertiary text: notes, footers, axis labels | 6.25:1 on canvas, 5.54:1 on surface |
| `--mq-decoration` | `#6b7385` | Non-text decoration only, never text | 3.81:1 on canvas, 3.38:1 on surface, non-text |
| `--mq-accent` | `#6f88c9`, the lifted navy | Links, labels, key figures, active states | 5.22:1 on canvas, 4.63:1 on surface, 5.01:1 on the recessed surface |
| `--mq-accent-hover` | `#8aa0d6` | Hover and pressed state of a link or an accent control | 6.98:1 on canvas |
| `--mq-accent-pale` | the lifted navy at 18 % | Icon pills and chips, the highlighted row, the pale state | Fill |
| `--mq-accent-pale-2` | the lifted navy at 10 % | Progress tracks, the quiet state, callout background | Fill |
| `--mq-accent-highlight` | `#9fb3e8`, the light navy | Large highlighted title text, and accent text on the pale fills: the pale KPI value, the pale badge and the callout title (owner ruling 18) | 8.71:1 on canvas, 7.73:1 on surface, 5.97:1 on the pale fill, 6.77:1 on the quiet pale fill |
| `--mq-on-accent` | `#11161f` | Text and icons on an accent fill, never white (white 3.48:1 on the accent) | 5.22:1 on the accent |
| `--mq-focus-ring-color` | `#9fb3e8`, the light navy | Focus ring on dark backgrounds | 8.71:1 on canvas |
| `--mq-panel-start` | `#2f4c8f` | Light end of the navy panel gradient | Background, white 8.23:1 on the panel start |
| `--mq-panel-end` | `#0f2a5e` | Dark end of the navy panel gradient | Background |
| `--mq-shadow-panel` | a 1 px outline, light navy at 35 %, no glow (owner ruling 13) | Navy panels, the report header and the navy KPI tile on dark | Edge of a panel |

Accent text on the pale fills reads `--mq-accent-highlight` in both themes (owner ruling 18): in light it is the accent itself, while on dark the lifted navy would be only 3.57:1 on the pale fill and 4.05:1 on the quiet pale fill. The fills are measured laid over the canvas and over the surface, the worse result counting. The callout tab keeps `--mq-accent` on the quiet pale fill as a non-text mark.

The retired `--mq-dim` and `--mq-accent-on-dark` follow the roles they alias on dark too: `#8f98aa` (tertiary) and `#b2c2ed` (the on-navy accent).

**The navy panel on dark.** Navy itself fails on a dark canvas (`#0a2463` is 1.25:1 on `#11161f`), so on dark the brand shows as the lifted navy, the light navy and the panel gradient, with no new hue ([ADR-0003](../docs/architecture/decisions/adr-0003-navy-is-the-single-brand-accent.md)). Navy panels, the report header and the navy KPI tile keep the 160 degree gradient between `--mq-panel-start` and `--mq-panel-end`, with the dark values above, and draw `--mq-shadow-panel`: a 1 px light-navy outline, never a glow (owner ruling 13). A navy tile on dark takes the panel gradient, never the lifted accent. Contrast on navy is still checked against the panel start, the lighter stop.

The on-navy tier on the dark panel (owner ruling 19): two roles take dark values, the others keep their light values and are checked again on the lighter dark panel start.

| Token | Dark value | Contrast | Allowed for |
| :-- | :-- | :-- | :-- |
| `--mq-on-navy-title` | `#ffffff`, unchanged | 8.23:1 on the panel start | Text |
| `--mq-on-navy-secondary` | white at 68 %, unchanged | 4.80:1 on the panel start | Text |
| `--mq-on-navy-second-level` | `#c3cbdc`, unchanged | 5.05:1 on the panel start | Text |
| `--mq-on-navy-accent` | `#b2c2ed`, a lighter navy tint | 4.64:1 on the panel start | Text, narrow margin |
| `--mq-on-navy-discreet` | white at 50 % | 3.37:1 on the panel start | Large text or non-text only |
| `--mq-on-navy-rule`, `--mq-on-navy-rule-strong`, `--mq-on-navy-pill` | white at 16, 18 and 12 %, unchanged | Decorative | Decorative only |

Light keeps `#8795b3` (4.61:1) and white at 40 % (3.44:1) for those two roles; on the dark panel start they would fall to 2.74:1 and 2.71:1.

**The light navy is a navy tint.** `#9fb3e8` (`--mq-accent-highlight`, `--mq-focus-ring-color`, dark series 1) is not the retired sky blue: its LCH hue 280.4 (chroma 29.2) sits in the navy family with the lifted navy `#6f88c9` (hue 282.8), against navy 293.7 and sky blue 269.9 (chroma 36.1). Sky blue stays retired in both themes (owner ruling 2).

Status colours on dark, apps only (ADR-0004, owner ruling 16), each still with an icon or a word; `--mq-warning-fill` keeps its value and stays a fill:

- `--mq-success` `#6fbf73`: 8.09:1 on canvas, 7.18:1 on surface.
- `--mq-warning` `#e0a040`: 8.00:1 on canvas, 7.10:1 on surface.
- `--mq-danger` `#ff6b6b`: 6.53:1 on canvas, 5.80:1 on surface.
- `--mq-info` `#64a8f0`: 7.25:1 on canvas, 6.43:1 on surface.
- `--mq-warning-fill` `#d4850a`, unchanged: a fill, never text.
- `--mq-warning-tint`, the warning fill at 16 %: ink 11.63:1 on the warning tint.
- `--mq-on-warning-fill` `#11161f`, text on `--mq-warning-fill`: 6.18:1 on the warning fill, where the warm white ink 2.67:1 on the warning fill would fail.

Chart colours on dark (owner ruling 16): the four series run in reverse order, the lightest first, under the same rules as light ([charts](charts.md)): series 4 for context bars, the remainder drawn with a series 4 outline. Each dark series meets or beats its light counterpart against its canvas.

| Token | Dark value | Contrast |
| :-- | :-- | :-- |
| `--mq-chart-series-1` | `#9fb3e8` | 8.71:1 on canvas |
| `--mq-chart-series-2` | `#6f88c9` | 5.22:1 on canvas |
| `--mq-chart-series-3` | `#5d6f91` | 3.58:1 on canvas |
| `--mq-chart-series-4` | `#3a4560` | 1.90:1 on canvas, context bars only |
| `--mq-chart-rest` | `#232b3d` | 1.28:1 on canvas, with a series 4 outline |
| `--mq-chart-axis` | `#6b7385` | 3.81:1 on canvas, non-text |
| `--mq-chart-baseline` | white at 10 % | Decorative |
