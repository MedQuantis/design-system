# Accessibility

## Target

WCAG 2.2 level AA for every medium: apps, the website, HTML reports, slides exported to PDF and newsletters. APCA is not normative and is not used; contrast is measured with the WCAG 2.x formula.

## Colour is never alone

Colour never carries meaning on its own (WCAG 1.4.1):

- documents show states by mark style (solid, ring, pale, outline, quiet, dashed, struck through) and a page that uses these marks gives their key once, in a legend or a note;
- apps pair every status colour with an icon or a word;
- charts label the marks that use series 3 or 4, or give them an outline, since those colours are below 3:1 on the page ([charts](charts.md));
- a change in a figure is shown by its sign, not by a colour or an arrow alone.

## Contrast pairs

Every foreground and background pair the system uses is declared in `tokens/contrast-pairs.json` with its allowed use: text (4.5:1), large text (3:1), non-text (3:1, WCAG 1.4.11) or decorative (no minimum, for marks that carry no information). The token test checks every declared pair and fails on any pairing used in `css/` without a declaration; the specimen shows each pair with its ratio. A consumer that needs a new pair asks for it here rather than eyeballing it.

Pairs to remember:

| Pair | Ratio | Allowed for |
| :-- | :-- | :-- |
| Ink on canvas | 16.65:1 | Text |
| Muted on canvas | 7.13:1 | Text |
| Tertiary on canvas, on surface | 4.74:1, 4.95:1 | Text. Not on the recessed surface (exactly 4.50:1, not declared) |
| Decoration grey on canvas | 3.22:1 | Non-text only, never text |
| Navy on canvas | 13.90:1 | Text |
| White on navy | 14.53:1 | Text |
| On-navy accent on the lighter panel stop | 4.61:1 | Text, narrow margin |
| On-navy discreet (white at 40 %) on navy | 3.48:1 | Large text or non-text only |
| Warning text on surface | 4.86:1 | Text |
| Ink on the warning fill | 5.93:1 | Text; white on the fill is forbidden (2.93:1) |
| Blue-grey outline on canvas | 4.84:1 | Non-text |

Placeholder text in inputs uses the tertiary text colour, never a lighter grey.

## Focus

- Every interactive element shows a visible focus ring on keyboard focus (WCAG 2.4.7 and 1.4.11): `--mq-focus-ring-width` (2 px) of `--mq-focus-ring-color` (navy, 13.90:1 on canvas) at `--mq-focus-ring-offset` (2 px) from the element.
- On navy, the ring is white (`--mq-focus-ring-color-on-navy`, 14.53:1). `css/base.css` and `css/components.css` draw both.
- Never remove the outline without drawing this ring. A focused input may also change its border to navy, but the ring stays.

## Size and targets

- No text below 11 px on screen ([typography](typography.md)).
- Touch targets in apps are at least 44 px high on mobile (buttons, tabs, navigation links), above the 24 px minimum of WCAG 2.5.8.
- Text reflows: pages work at 320 px wide and at 200 % zoom without horizontal page scrolling; only tables and wide charts scroll inside their frame.

## Motion

- Motion is optional, short and meaningful. Interactive elements may use short transitions (about 120 ms) on colour and background; documents do not animate on hover.
- Never blur, zoom, reflections, spotlight effects or looping animation.
- Everything respects `prefers-reduced-motion: reduce` (no animation at all) and print shows the final state.

## Structure

- One `h1` per page and headings in order; the eyebrow is not a heading.
- Set the page language (`lang`) and mark passages in another language.
- An SVG chart has `role="img"` and an accessible name and description (`<title>` and `<desc>`, or `aria-labelledby`); the figure's key values also appear in text or in a table.
- Icons that carry meaning have a label; decorative icons are hidden (`aria-hidden="true"`).
- PDFs exported from HTML are tagged and carry an outline (Playwright `tagged` and `outline`); the specimen test exports one.
