# Charts

Charts use the navy and blue-grey family only, in every medium. Status colours never colour a chart series, not even in an app; a chart that shows system status labels it in words.

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

## Legends

The legend is HTML (`mq-legend`, `mq-legend-item`, `mq-swatch`) placed above or beside the plot, never inside it. Beside a ring, list the items in a column with their values right-aligned and the remainder separated by a rule; above a bar or line chart, use one inline row. Swatches: `is-1` to `is-4`, `is-rest`, `is-outline` and `is-dashed`.

## Size and motion

- An SVG chart takes the full width of its figure, and its text sizes are in viewBox units. Because the SVG shrinks with its figure in print, size the labels for the printed width: they should read about 8 pt on paper.
- On phones a wide chart keeps a minimum width and scrolls inside its frame.
- Motion is optional and carries meaning: bars grow from the base, a line draws, an arc sweeps, all within two seconds. It stops under `prefers-reduced-motion` and never runs in print.
