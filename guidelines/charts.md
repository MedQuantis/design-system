# Charts

Charts use the navy and blue-grey family, in every medium. An interactive app may also use the app categorical palette, for a chart of more categories than the ordered palette carries and for data categories such as change types; documents never do ([ADR-0008](../docs/architecture/decisions/adr-0008-apps-have-a-categorical-palette.md)). Status colours never colour a chart series, not even in an app; a chart that shows system status labels it in words.

## The ordered palette

Four categorical series plus a remainder fill (owner, 2026-10-10), always used in this order, darkest first:

| Order | Token | Value | Contrast on canvas | Typical role |
| :-- | :-- | :-- | :-- | :-- |
| 1 | `--mq-chart-series-1` | `#0a2463` | 13.90:1 | The main series, the current period, the value the text discusses |
| 2 | `--mq-chart-series-2` | `#5d6f91` | 4.84:1 | The second share of a whole |
| 3 | `--mq-chart-series-3` | `#8795b3` | 2.88:1 | Other values, projections, "upcoming" dashed marks, struck values |
| 4 | `--mq-chart-series-4` | `#c3cbdc` | 1.56:1 | Previous period, reference, neutral outline |
| Remainder | `--mq-chart-rest` | `#dde3ee` | | What is left, empty or not yet: never a categorical series |

The pairs between the four series stay at least CIEDE2000 10 apart under normal vision and under protan, deutan, tritan and achromatic simulation; the remainder fill is too close to series 4, so it is drawn with a series 4 outline.

**Series 3 and 4 are below 3:1 against the page** (WCAG 1.4.11). A chart that uses them must not rely on their colour alone: label those marks directly, give them a separating outline or stroke, or add a pattern. Series 1 and 2 meet 3:1 on their own.

Rules:

- Never more than four series at once. Group the rest as "Other" in the remainder fill.
- Fix colours per series when the order means something (reference before current); never let a charting library rotate through its palette.
- Only one element is navy when the others are there for comparison.

## Common cases

| Case | Colours |
| :-- | :-- |
| One series | Series 1 |
| Two series: reference or previous period, then current | Series 4, then series 1 |
| Parts of a whole | Series 1, series 2, remainder fill; in the legend the remainder swatch is outlined |
| States of an amount (paid, approved, claimed, not yet claimed) | Series 1, series 3, series 4 with its outline, and the upcoming part dashed in series 3; or the document mark styles of [colour](colour.md) |
| Ranking with more than four items | Highlight on grey, below |
| Workflow stages in an app | Series 1 to 4 with the stage name as a label or legend, never status hues, never white text on series 3 or 4 |

## App categorical palette (apps only)

Six hues for interactive apps whose charts or lists show more categories than the four ordered series can carry, and three change types built on them (owner rulings 20 and 21, [ADR-0008](../docs/architecture/decisions/adr-0008-apps-have-a-categorical-palette.md)). They are light only until their dark values are ruled, and they never appear in documents, which keep the ordered palette.

| Token | Value | Contrast on surface | Allowed for |
| :-- | :-- | :-- | :-- |
| `--mq-app-cat-green` | `#1c7e3f` | 5.12:1 | Marks, fills and text |
| `--mq-app-cat-orange` | `#d78000` | 3.01:1 | Marks and fills only |
| `--mq-app-cat-orange-text` | `#a35f00` | 5.01:1 | Text in the orange hue: counts and labels |
| `--mq-app-cat-vermillion` | `#cf2a00` | 5.27:1 | Marks, fills and text |
| `--mq-app-cat-blue` | `#3a8ff5` | 3.27:1 | Marks and fills only |
| `--mq-app-cat-violet` | `#5a2fbe` | 8.12:1 | Marks, fills and text |
| `--mq-app-cat-teal` | `#178a91` | 4.13:1 | Marks and fills only |

| Change type | Token | Reads |
| :-- | :-- | :-- |
| Added | `--mq-change-added` | The green |
| Modified | `--mq-change-modified`; its text `--mq-change-modified-text` | The orange; the orange text |
| Removed | `--mq-change-removed` | The vermillion |

Between the six hues and navy series 1, the smallest CIEDE2000 distance is 17.4 under normal vision, 11.9 under protanopia, 12.9 under deuteranopia and 8.4 under tritanopia (green and teal); the token test holds those floors.

Rules:

- A one-series chart stays navy (`--mq-chart-series-1`). Up to four series, the ordered palette applies in apps too; the categorical hues are for charts of five or more categories and for data categories.
- Fix each hue to its category across every view of the app; never let a charting library rotate through the palette.
- No series uses a status token. The vermillion is a data category ("removed from the list"), not an error: `--mq-danger` stays for errors. The green, the orange, the orange text and the vermillion sit CIEDE2000 3.3, 2.2, 2.8 and 7.9 from `--mq-success`, `--mq-warning-fill`, `--mq-warning` and `--mq-danger`, so code tells them apart by token name and the screen by the word or sign each carries, never by hue.
- Marks sit on the surface (`--mq-surface`), where every hue meets 3:1 and needs no outline. On the canvas the orange falls to 2.88:1, and on the recessed surface the orange and the blue fall below 3:1, so a chart in these hues sits in a white card.
- Text in a hue meets 4.5:1: the green, the vermillion and the violet may be text, orange text reads `--mq-app-cat-orange-text`, and the blue and the teal are never text.
- Never colour alone: the green and the vermillion have almost the same lightness, so in greyscale they cannot be told apart. Every mark carries a direct label or a legend entry, and a change type its sign (+, −) or its word; label the green and the teal directly where they touch.
- A change type keeps its hue wherever a change is listed (badge, dot, filter, count) and keeps its mark style on top: an added value with +, a removed value struck through.

## Highlight on grey

To point at one item among many (a ranking, one insurer among peers), draw the item the text discusses in series 1 and every other item in series 3. When the context should recede further, such as a reference period behind the current one, use series 4. Label the highlighted item directly; the others need a label or an outline because series 3 and 4 are below 3:1.

## Sequential and diverging use

There are no sequential or diverging ramp tokens yet.

- **Sequential:** for an ordered quantity (low to high), use the existing tokens as a light-to-dark ramp of up to five steps: `--mq-chart-rest`, `--mq-chart-series-4`, `--mq-chart-series-3`, `--mq-chart-series-2`, `--mq-chart-series-1`. Their lightness falls monotonically. Do not interpolate new values by hand; if a chart needs more steps, bin the data into five classes or ask for a ramp token.
- **Diverging:** documents have a single hue, so there is no second hue for the opposite side, and status colours are not allowed in charts. Until a diverging ramp is ruled, show the magnitude with the sequential ramp and the direction with the sign of the value and a mark style (filled for above the reference, outlined or dashed for below), with the reference line drawn as the baseline. This is an open point for the owner.

## Marks

- **Grid and axes:** no background grid. One baseline in `--mq-chart-baseline`, 1 px. No drawn vertical axis: at most three value labels on the left, without lines. Axis lines and ticks, where drawn, use `--mq-chart-axis` (non-text).
- **Axis labels:** Geist Mono at `--mq-font-size-axis`, in tertiary text (`--mq-tertiary`), three to five ticks. Dates as `2024` or `10.2026` ([data patterns](data-patterns.md)).
- **Value labels:** write only the value the text discusses (the peak, the latest value), in navy; leave about 18 % headroom above the tallest mark for it.
- **Vertical bars:** rounded at the top with the small radius (3 px), square at the base, with a narrow gap between bars of a monthly series.
- **Horizontal bars:** about 8 px thick, the far end rounded with the small radius, the value in Geist Mono at the end of the bar.
- **Ring:** for parts of a whole, a thick stroke starting at the top, small gaps between arcs, no text in the centre, the legend beside it. Never a pie of more than four parts.
- **Lines:** the main series in series 1 at 2 px with round caps; a reference in series 4 at 1.5 px; a projection in series 3 at 1.5 px dashed; an end dot in navy with its value above it. No area fill under a line and no smoothing.
- **Annotations:** a dotted vertical marker in series 3 with a short sentence in Newsreader italic, muted; or a numeric note under the chart (the number in navy, then a sentence).
- **Progress bar** (`mq-progress`): a quiet pale track (`--mq-accent-pale-2`), a navy fill, the value in Geist Mono beside it; a secondary value in series 3.
- **Distribution bar** (`mq-distribution`, `mq-segment`): segments in palette order, the remainder dashed or in the remainder fill.
- **Tooltips**, where a library draws them: navy background, white text, title in Outfit, values in Geist Mono, the small radius.

Never: background grids, zebra bands, 3D, shadows on marks, area fills under lines, pies of more than four parts.

## Ring construction

Build a ring in SVG from one circle per part, so the arcs need no path arithmetic:

1. Every circle has the same centre and radius, `fill="none"`, `pathLength="100"` (so lengths are percentages) and a thick stroke; wrap them in a group with `transform="rotate(-90 cx cy)"` so the first arc starts at the top.
2. Check that the values sum to 100 before drawing.
3. Each arc is drawn with `stroke-dasharray="L G"`, where the arc length L is its value minus the gap (1 unit) and G is 100 minus L. The arc is therefore one unit shorter than its value on purpose: that unit is the gap between arcs.
4. Each arc starts where the previous ones end: `stroke-dashoffset` is minus the running total of the previous values (0, then minus the first value, and so on).
5. The parts take series 1, 2, 3 in order. The remainder is two circles with the same dash: a `--mq-chart-series-4` arc 2 px wider, then a `--mq-chart-rest` arc over it, so the series 4 edge shows as its outline.
6. Set the stroke colour with `style="stroke: var(--mq-chart-series-1)"`, never a literal value. No text in the centre; the legend sits beside the ring (`mq-legend is-column`).

## Legends

The legend is HTML (`mq-legend`, `mq-legend-item`, `mq-swatch`) placed above or beside the plot, never inside it. Beside a ring, use `mq-legend is-column`: the items in a column, each value in `mq-legend-value` at the right edge in Geist Mono, and the remainder item (`is-rest`) separated by a rule. Above a bar or line chart, use the plain `mq-legend`, one inline row. Swatches: `is-1` to `is-4`, `is-rest`, `is-outline` and `is-dashed`.

## Size and motion

- An SVG chart takes the full width of its figure, and its text sizes are in viewBox units. Because the SVG shrinks with its figure in print, size the labels for the printed width: they should read about 8 pt on paper.
- On phones a wide chart keeps a minimum width and scrolls inside its frame.
- Motion is optional and carries meaning: bars grow from the base, a line draws, an arc sweeps, all within two seconds. It stops under `prefers-reduced-motion` and never runs in print.
