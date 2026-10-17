# Layout

## Media

| Medium | Canvas | Layout |
| :-- | :-- | :-- |
| Slide | 1280 by 720 px (`--mq-slide-width`, `--mq-slide-height`, `css/slide.css`) | Fixed canvas, 72 px side margins (`--mq-space-8`), section label top left, title under it, and a footer row (`mq-slide-foot`) with the legal line bottom left and the slide number bottom right, both in tertiary mono (owner ruling 11); a classified deck adds its classification label at the right of the footer, before the slide number (owner ruling 17) |
| Screen report or paper | A page that scrolls, centred, `--mq-page-width` (1040 px) wide | Flow layout: no absolute positions, no fixed heights. It is not a deck: no slide canvas inside a report |
| A4 print | 210 by 297 mm (`--mq-a4-width`, `--mq-a4-height`, `css/print.css`) | One `mq-page` per sheet on the canvas colour; on screen the pages sit on the desk |

## Report skeleton

1. A navy header: navy gradient, the on-navy wordmark, a mono kicker preceded by a short rule, the title in white Outfit 500, one sentence that carries the message (its first clause in white, the rest in on-navy secondary), and a row of metadata (author, scope, date) separated by on-navy rules. The header is a pattern, not yet a shared component.
2. "In brief": three or four self-contained sentences with the figure that matters, under a 2 px navy rule.
3. Sections. Each opens with a head (numbered eyebrow such as "02 · Amounts by year", title, one-sentence lead), then its blocks, then, when useful, one takeaway line (`mq-takeaway`).
4. The footer (`mq-foot`): a rule, the numbered sources, then the legal line and the date ([brand](brand.md)).

A source is cited in the text with a small superscript number in Geist Mono, navy, pointing to the numbered source list.

## Widths and spacing

All spacing comes from the 4 and 8 px scale (`--mq-space-1` to `--mq-space-8`: 4, 8, 12, 16, 24, 32, 48, 72 px). No other spacing value.

| Measure | Token | Value |
| :-- | :-- | :-- |
| Page width | `--mq-page-width` | 1040 px |
| Reading measure: prose, leads, in-brief, callouts stop here | `--mq-page-measure` | 760 px |
| Side gutter | `--mq-space-6` | 32 px, 16 px (`--mq-space-4`) on phones |
| Between cards | `--mq-space-5` | 24 px |
| Between calm columns | `--mq-space-7` | 48 px |
| From a section head to its content | `--mq-space-6` | 32 px |
| Between sections | `--mq-space-8` | 72 px, 48 px on phones |

Figures, tables and grids take the full page width; running text never does.

Grids: calm columns (three columns separated by thin rules, no boxes, one hero figure each), two-column and three-column grids of cards or figures. On phones every grid becomes one column, and a band of four tiles becomes two by two.

## Radius

Owner ruling 3, as amended on 2026-10-10:

| Token | Value | For |
| :-- | :-- | :-- |
| `--mq-radius-small` | 3 px | Small items: tags, chips, badges, inputs, buttons, progress tracks, bar ends, tooltips |
| `--mq-radius-medium` | 6 px | Cards, panels, KPI tiles, figures, icon pills, slide frames. The maximum anywhere else |
| `--mq-radius-overlay` | 12 px | Apps only: dialogs and modals, side drawers and command palettes. Never in documents, slides, cards or website media |

- No pill shapes, ever: no fully rounded buttons, tags, chips or tabs.
- A circle is allowed only for something that is genuinely round: a status dot, a numbered marker, an avatar. In Tailwind that is `rounded-full`, and only there.
- In `dist/tailwind.css` the steps `rounded`, `rounded-xs` and `rounded-sm` resolve to 3 px, `rounded-md` to `rounded-4xl` to 6 px, and `rounded-overlay` to 12 px, so no utility class can exceed the ruling. The shared stylelint config rejects any other radius.

Squared-off corners read professional and institutional; pills read consumer.

## Elevation and navy blocks

- Cards, figures and tables: `--mq-shadow-small`. Raised panels, menus and a page or slide previewed on the desk: `--mq-shadow-medium`. Navy panels: `--mq-shadow-panel`, which on dark is a 1 px light-navy outline and never a glow (owner ruling 13). No shadow in print and none on chart marks.
- One large navy block per screen, slide or page area. In a report, keep the header, a navy KPI band and a navy panel apart with light content.

## Document components

| Pattern | Shared class | Rules |
| :-- | :-- | :-- |
| Card | `mq-card` | White, light border, small shadow, 6 px radius. An optional title bar (blue-grey icon, navy title, mono note on the right on the canvas colour) is a pattern, not yet a class |
| Navy panel | `mq-panel` | Navy gradient, white title, on-navy secondary and second-level text, white icons in translucent pills |
| KPI tiles | `mq-kpis`, `mq-kpi` | Three forms: calm columns with one hero figure each; ruled counters (a navy left rule, value, muted label) in rows of three or four; a navy band (`is-navy`) or pale tiles (`is-pale`). Value above its caption, never side by side |
| Callout | `mq-callout` | A reservation or a point of attention: navy left tab, quiet pale fill, mono navy title. Always navy |
| Takeaway | `mq-takeaway` | The one sentence to remember, under a navy tab, Outfit 500 |
| Numbered rows | (pattern) | A navy circle with the number, a heading column, a body column: one line per point |
| Footer | `mq-foot` | Sources and legal line in tertiary italic, in reports and papers; never inside a slide |
| Slide footer | `mq-slide-foot` | On every slide (owner ruling 11): the legal line bottom left, the slide number bottom right, small, tertiary, Geist Mono. A classified deck shows its classification at the right of the footer, before the slide number: the label in the deck's language, never the C0 to C3 code (owner ruling 17). Without a classification: `<footer class="mq-slide-foot"><p>MedQuantis SA · CH-1095 Lutry · medquantis.ch</p><p class="mq-slide-number">03</p></footer>` |

## Tables

Document tables (`mq-table`):

- Horizontal hairlines only, never vertical rules and never zebra stripes.
- Headers in Geist Mono capitals on the recessed surface; the unit goes on a second header line ("Gap" then "CHF"), never repeated in every cell.
- Figures in Geist Mono, right-aligned (`mq-num`); the first column in Outfit 500 or Newsreader.
- The key column in navy (`is-key`).
- A deviating value may sit in a pale navy pill with the small radius.
- At most one highlighted row (`tr.is-highlight`): a pale navy fill. The source pattern adds a 3 px navy edge on its first cell; the shared class does not draw it yet.
- An excluded row is struck through in blue-grey 2 and left out of the total (pattern, not yet a class).
- The total row (`tr.is-total`) sits under a 2 px navy rule; its key amount is navy.

App tables (sober tables):

- A white wrapper with a light border, the small shadow and the 6 px radius; recessed header row; row hover on the recessed surface.
- Below a minimum width (about 640 px) the table scrolls horizontally inside its wrapper, never the page.
- Do not put a badge in every column. Use three levels of visual weight so the eye rests on normal rows: small classification marks explained by a legend row under the table, a status dot followed by its word, and flags as coloured words only on the rows that need attention ([colour](colour.md)).

## App patterns

- **Navigation:** links in muted Outfit 500; hover in ink on the recessed surface; the active link in navy on pale navy. On tablets the navigation collapses into a menu.
- **Tabs:** underline tabs, not segmented pills. The active tab is navy with a 2 px navy underline (`--mq-stroke-strong`); hover in ink on the recessed surface. Underline tabs stay light in dense tools.
- **Breadcrumb:** inside a light bordered card; links muted, navy on hover; the separator is a single right angle quote in tertiary; the current page in ink.
- **Buttons:** primary (navy fill, white text, darker navy on hover), secondary (white, border, recessed on hover), danger outline (danger border and text, with an icon or a destructive verb), ghost (no border, muted text). One size, Outfit 500, the small radius. On phones a button row stretches to full width.
- **Empty state:** centred, a dimmed icon, an Outfit 500 title, one muted sentence, and a hint in Geist Mono tertiary.
- **Stat cards:** stable. No hover lift, no animation: reference data must not move under the pointer.
- **Breakpoints:** documents switch to one column below 720 px. Apps use 768 px (tablet: navigation menu, narrower gutters) and 480 px (phone: full-width buttons, two stat cards per row, keys of key-value rows above their values).

## Print and PDF

- `css/print.css` prints colours exactly (`print-color-adjust: exact`), so navy headers and panels do not print white, and stops all animation.
- Every document page uses the canvas colour (owner ruling 9); the desk never reaches paper.
- Figures, cards, panels, KPI bands, callouts, takeaways, table rows and source items never split across pages, and a heading is never left alone at the foot of a page.
- Before sending a PDF, check it page by page.

## Phones

One column, a 16 px gutter, and no horizontal scrolling of the page. Only tables and wide charts scroll, inside their own frame.
