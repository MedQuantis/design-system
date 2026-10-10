# Guidelines

The MedQuantis brand, writing, colour, type, layout, chart, data and accessibility rules. They apply to every medium: slides, A4 reports, papers, the website, newsletters and interactive apps. These files are © MedQuantis SA, all rights reserved ([LICENSE](LICENSE)); the tokens and CSS they describe are MIT.

| File | Covers |
| :-- | :-- |
| [principles.md](principles.md) | The principles that decide the cases the other files do not cover |
| [brand.md](brand.md) | Name, tagline, legal line, wordmark, monogram, favicon, icons |
| [voice.md](voice.md) | Tone, words to prefer and avoid, languages, terminology in French, German, Italian and English |
| [writing.md](writing.md) | No em or en dash, titles, sentences and lists, French typography |
| [colour.md](colour.md) | Semantic colour tokens, the medium split, navy panels, states by mark style, status colours in apps |
| [typography.md](typography.md) | Families, weights, roles, sizes and line heights |
| [layout.md](layout.md) | Media, report skeleton, widths and spacing, radius, components, tables, app patterns, print |
| [charts.md](charts.md) | The ordered palette, highlight on grey, sequential and diverging use, marks, legends |
| [data-patterns.md](data-patterns.md) | Numbers, amounts, dates, null versus zero, confidential and illustrative data |
| [accessibility.md](accessibility.md) | WCAG 2.2 AA, contrast pairs, focus, targets, motion, structure |
| [specialising.md](specialising.md) | Framework neutrality, the four rules, the promotion tests, the one-off log |

The values themselves live in `tokens/` and reach these pages as `--mq-*` names; when a guideline and a token disagree, the token is right and the guideline is fixed. The generated specimen (`make specimen`) is the visual reference: when a rendering is in doubt, it decides.

## Where the legacy rules went

These guidelines replace five earlier documents, which competed and partly contradicted each other: the platform brand document, the platform design-system document, the platform report design system of 2026-10-08, the platform style guide and the Paracel design document. Every rule found in them is listed below, rewritten, either as carried over (with the file that now holds it) or as dropped (with the reason). Rulings cited by number are the owner rulings of 2026-10-09 and 2026-10-10 recorded in the bootstrap plan; ADRs are in `docs/architecture/decisions/`.

| Source | Rules found | Carried over | Dropped |
| :-- | --: | --: | --: |
| platform brand document | 17 | 13 | 4 |
| platform design-system document | 38 | 29 | 9 |
| platform report design system of 2026-10-08 | 132 | 119 | 13 |
| platform style guide | 26 | 22 | 4 |
| Paracel design document | 55 | 41 | 14 |
| Total | 268 | 224 | 44 |

### Carried over

| Rule | Source | Now in | Note |
| :-- | :-- | :-- | :-- |
| MedQuantis is the public name on every client-facing item | platform brand document | [brand.md](brand.md) |  |
| Paracel names the technology only, never the company | platform brand document | [brand.md](brand.md) |  |
| MedQuantis is one word with a capital M and Q | platform brand document | [brand.md](brand.md) |  |
| The wordmark sets Med heavier than Quantis | platform brand document | [brand.md](brand.md) | weights as amended by ruling 6 |
| Tagline in French, German and English | platform brand document | [brand.md](brand.md) |  |
| Legal footer: company, web address, locality | platform brand document | [brand.md](brand.md) |  |
| A confidentiality stamp and a date on material left with a reader | platform brand document | [brand.md](brand.md) |  |
| The wordmark alone is the logo; no icon is required | platform brand document | [brand.md](brand.md) |  |
| The monogram (white MQ on a navy square) stands in where the wordmark does not fit: favicon, avatar, app tile | platform brand document | [brand.md](brand.md) | ruling 7 |
| Logo letters are live text; outline them before print | platform brand document | [brand.md](brand.md) | ruling 6: two files per background |
| Short colour and type summary: navy accent, warm off-white canvas, three families | platform brand document | [colour.md](colour.md) |  |
| Keep terminology consistent across languages through one glossary | platform brand document | [voice.md](voice.md) |  |
| English is the source language; other languages are overlays | platform brand document | [voice.md](voice.md) |  |
| Principle: clinical clarity, sober and high-contrast, no decoration without meaning | platform design-system document | [principles.md](principles.md) |  |
| Principle: numbers are the hero, set in monospace | platform design-system document | [principles.md](principles.md) | figures in tables and codes; hero figures per ruling 4 |
| Principle: calm confidence, pale neutral surfaces, one navy accent, generous whitespace | platform design-system document | [principles.md](principles.md) |  |
| Principle: document-grade, credible on A4 and PDF | platform design-system document | [principles.md](principles.md) |  |
| Navy is the primary accent for emphasis and top rules | platform design-system document | [colour.md](colour.md) |  |
| Darker navy for hover and pressed states | platform design-system document | [colour.md](colour.md) |  |
| Pale navy fill for icon pills and chips | platform design-system document | [colour.md](colour.md) |  |
| Warm off-white page background | platform design-system document | [colour.md](colour.md) | ruling 9 |
| White for cards and panels | platform design-system document | [colour.md](colour.md) | ruling 9 |
| Recessed warm grey for grouped areas | platform design-system document | [colour.md](colour.md) |  |
| Near-black ink for primary text | platform design-system document | [colour.md](colour.md) |  |
| Two dark navy stops for panel and hero gradients | platform design-system document | [colour.md](colour.md) |  |
| Dark grey for secondary text | platform design-system document | [colour.md](colour.md) |  |
| Two warm border greys for borders and hairlines | platform design-system document | [colour.md](colour.md) |  |
| Success, warning, info and danger state colours | platform design-system document | [colour.md](colour.md) | apps only, ADR-0004; warning split by ruling 5 |
| Outfit for titles and headings | platform design-system document | [typography.md](typography.md) | ruling 4 |
| Newsreader for body copy, captions and italic leads | platform design-system document | [typography.md](typography.md) | ruling 10 |
| Geist Mono for numbers, codes, tags and eyebrows, uppercase and letter-spaced | platform design-system document | [typography.md](typography.md) |  |
| Slide canvas 1280 by 720 with wide side margins | platform design-system document | [layout.md](layout.md) |  |
| Section label: mono, uppercase, navy, top left | platform design-system document | [layout.md](layout.md) |  |
| Slide number bottom right | platform design-system document | [layout.md](layout.md) |  |
| Cards: white, bordered, soft shadow | platform design-system document | [layout.md](layout.md) | radius per ruling 3 |
| Navy panels with a gradient for hero blocks and closing cards | platform design-system document | [layout.md](layout.md) |  |
| Icon pill: pale navy rounded square with a navy Lucide icon | platform design-system document | [brand.md](brand.md) | radius per ruling 3 |
| Chips and tags: small mono labels | platform design-system document | [layout.md](layout.md) | square only, ruling 3 |
| Numbered rows: navy number, heading column, body column, one line per point | platform design-system document | [layout.md](layout.md) |  |
| No em dash or en dash in copy | platform design-system document | [writing.md](writing.md) |  |
| Icons offline from a pinned Lucide build, never a CDN | platform design-system document | [brand.md](brand.md) |  |
| One accent: navy carries emphasis, state colours only mean state | platform design-system document | [colour.md](colour.md) | ADR-0003, ADR-0004 |
| Expert to expert: confident, never boastful; show, do not promise | platform style guide | [voice.md](voice.md) |  |
| Partnership framing: we speak to you | platform style guide | [voice.md](voice.md) |  |
| No hype and no overselling of AI; concrete numbers before adjectives | platform style guide | [voice.md](voice.md) |  |
| No humour | platform style guide | [voice.md](voice.md) |  |
| No em dash or en dash in copy or translated strings; hyphens in compounds are fine | platform style guide | [writing.md](writing.md) |  |
| No technical jargon in client material (query languages, table names) | platform style guide | [voice.md](voice.md) |  |
| No unsupported claim of ease or speed; back it with a number | platform style guide | [voice.md](voice.md) |  |
| One number format per document | platform style guide | [data-patterns.md](data-patterns.md) |  |
| Ranges with a plain hyphen, never an en dash | platform style guide | [data-patterns.md](data-patterns.md) |  |
| Approximate figures stay approximate, without false precision | platform style guide | [data-patterns.md](data-patterns.md) |  |
| Periods written with an arrow | platform style guide | [data-patterns.md](data-patterns.md) |  |
| Million abbreviations per language | platform style guide | [data-patterns.md](data-patterns.md) | decimal point per ruling 8 |
| Product and regulatory list names keep their capitals | platform style guide | [voice.md](voice.md) |  |
| Titles in sentence case, with no final full stop | platform style guide | [writing.md](writing.md) |  |
| Section labels and eyebrows uppercase, mono, letter-spaced, set by CSS | platform style guide | [typography.md](typography.md) |  |
| Summary and agenda pages: one line per point, readable in a few seconds | platform style guide | [writing.md](writing.md) |  |
| Body pages: short sentences, one idea per bullet | platform style guide | [writing.md](writing.md) |  |
| Prefer verifiable wording: traced to the clause, executable, auditable, reproducible | platform style guide | [voice.md](voice.md) |  |
| Words to avoid: AI-powered, revolutionary, seamless, easy, simply, just | platform style guide | [voice.md](voice.md) |  |
| The regulator is not the board; the board is the client's executive management | platform style guide | [voice.md](voice.md) |  |
| German is formal Swiss Standard German: Sie, no sharp s | platform style guide | [voice.md](voice.md) |  |
| Never carry a dash over from a source language; restructure the sentence | platform style guide | [writing.md](writing.md) |  |
| A report is a scrolling web page that prints cleanly on A4, not a deck | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Build pages from the shared mq- components with their markup | platform report design system of 2026-10-08 | [specialising.md](specialising.md) |  |
| Add no colour, font, shadow or radius outside the system; combine components before inventing one | platform report design system of 2026-10-08 | [specialising.md](specialising.md) |  |
| The generated specimen is the reference when a rendering is in doubt | platform report design system of 2026-10-08 | [specialising.md](specialising.md) |  |
| Principle: one accent; everything else neutral or blue-grey | platform report design system of 2026-10-08 | [principles.md](principles.md) |  |
| Principle: states read by mark style (filled, pale, outline, dashed, struck), not by hue | platform report design system of 2026-10-08 | [colour.md](colour.md) | documents; ADR-0004 |
| Principle: three families, three roles | platform report design system of 2026-10-08 | [typography.md](typography.md) |  |
| Principle: one idea per block, one hero figure per column; cut content before shrinking text | platform report design system of 2026-10-08 | [principles.md](principles.md) |  |
| Principle: the figure before the adjective, every figure traceable to its source | platform report design system of 2026-10-08 | [principles.md](principles.md) |  |
| Principle: sober, optional motion; print shows the final state | platform report design system of 2026-10-08 | [principles.md](principles.md) |  |
| Report skeleton: header, in-brief, sections with a head, blocks and a takeaway, footer | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Flow layout: no absolute positions, no fixed heights | platform report design system of 2026-10-08 | [layout.md](layout.md) | documents; slides keep their fixed canvas |
| Every shared class carries the mq- prefix | platform report design system of 2026-10-08 | [specialising.md](specialising.md) |  |
| Darker navy for link hover only | platform report design system of 2026-10-08 | [colour.md](colour.md) |  |
| Navy gradients for the report header, the KPI band and panels | platform report design system of 2026-10-08 | [colour.md](colour.md) |  |
| Pale navy for icon pills, deviating values, the highlighted row and the pale state | platform report design system of 2026-10-08 | [colour.md](colour.md) |  |
| Quieter pale navy for progress tracks and quiet badges | platform report design system of 2026-10-08 | [colour.md](colour.md) |  |
| Blue-grey family replaces the old sky blue for secondary marks | platform report design system of 2026-10-08 | [colour.md](colour.md) |  |
| Blue-grey 2 for projections, dashed marks and struck rows; accent point on navy | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Blue-grey 3 for previous period, reference and neutral outline; second-level text on navy | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Blue-grey 4 for a remainder or an empty part | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Warm off-white page background; white cards, figures and tables | platform report design system of 2026-10-08 | [colour.md](colour.md) | ruling 9 |
| Ink, secondary and tertiary text roles | platform report design system of 2026-10-08 | [colour.md](colour.md) | tertiary per ruling 1 |
| Border grey for chart baselines and total rules; light grey for hairlines and card borders | platform report design system of 2026-10-08 | [colour.md](colour.md) |  |
| On navy: titles, figures and icons white | platform report design system of 2026-10-08 | [colour.md](colour.md) | ruling 2 |
| On navy: secondary text white at 68 % opacity | platform report design system of 2026-10-08 | [colour.md](colour.md) | ruling 2 |
| On navy: second-level text in blue-grey 3 | platform report design system of 2026-10-08 | [colour.md](colour.md) | ruling 2 |
| On navy: one-off accent in blue-grey 2 | platform report design system of 2026-10-08 | [colour.md](colour.md) | ruling 2 |
| On navy: rules white at 16 to 18 % | platform report design system of 2026-10-08 | [colour.md](colour.md) | ruling 2 |
| On navy: icon-pill fill white at 12 % | platform report design system of 2026-10-08 | [colour.md](colour.md) | ruling 2 |
| On navy: discreet numbers white at 40 % | platform report design system of 2026-10-08 | [colour.md](colour.md) | ruling 2: large text or non-text only |
| One large navy block per screen; separate navy blocks with light content | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Chart palette used in order, darkest first | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| One series: navy | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Two series: reference in blue-grey 3, then current in navy | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Parts of a whole: navy, blue-grey 1, remainder fill with an outlined legend swatch | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Ranking with more than four categories: the item in the text in navy, the others in blue-grey 2 | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Never more than four series at once; group the rest as Other | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Outfit for titles, labels, table text and conclusions | platform report design system of 2026-10-08 | [typography.md](typography.md) |  |
| Newsreader with its true italic for prose, leads, captions, notes and quoted official text | platform report design system of 2026-10-08 | [typography.md](typography.md) |  |
| Geist Mono for codes, table figures, dates, eyebrows and axes, always with tabular figures | platform report design system of 2026-10-08 | [typography.md](typography.md) |  |
| Type roles with a screen size and a print size | platform report design system of 2026-10-08 | [typography.md](typography.md) | sizes from the font-size tokens |
| Bold inside prose switches to Outfit at 600 | platform report design system of 2026-10-08 | [typography.md](typography.md) | ruling 4 |
| Notes and the illustrative mention in Newsreader italic, tertiary grey | platform report design system of 2026-10-08 | [typography.md](typography.md) | ruling 1 |
| Chart labels sized for print: SVG text shrinks with its figure | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Titles in sentence case without a final full stop | platform report design system of 2026-10-08 | [writing.md](writing.md) |  |
| A coloured full stop is reserved for a one-word name on a navy cover | platform report design system of 2026-10-08 | [brand.md](brand.md) |  |
| Letter spacing tightens as size grows | platform report design system of 2026-10-08 | [typography.md](typography.md) |  |
| Eyebrows typed in normal case and uppercased by CSS; a middle dot separates parts | platform report design system of 2026-10-08 | [typography.md](typography.md) |  |
| Readability floor of 11 px on screen | platform report design system of 2026-10-08 | [typography.md](typography.md) |  |
| Page width 1040 px, reading measure 760 px, side gutter 32 px (16 px on phones) | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Gaps: 48 px between calm columns, 24 px between cards, 72 px between sections (48 px on phones), 32 px from a section head to its content | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Prose, leads, in-brief and callouts stop at the measure; figures, tables and grids take the page width | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Grids: calm columns separated by rules, two and three columns; one column on phones | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Report header: navy gradient, logo, mono kicker, white title, one-sentence tagline, metadata row | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Logo inline as SVG; the on-navy file on navy, the on-light file on light; never altered | platform report design system of 2026-10-08 | [brand.md](brand.md) | ruling 6 |
| Section: numbered eyebrow, title, one-sentence lead, blocks, optional takeaway | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Footer: navy rule, numbered sources, legal line and date | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| A report sent outside carries a confidentiality mention and its date | platform report design system of 2026-10-08 | [brand.md](brand.md) |  |
| Print: exact colour printing, no animation, figures and rows never split, headings never alone at a page foot | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Check every PDF page before sending it | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Phones: one column, no horizontal page scroll; only tables and charts scroll inside their frame | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| A hero figure stays short; its unit goes in the caption | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Three KPI forms: calm columns with a hero figure, ruled counters, a navy band | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Card title bar: blue-grey icon, navy title, mono note on the right | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Callouts are always navy; no coloured warning or success variant | platform report design system of 2026-10-08 | [colour.md](colour.md) | documents |
| Tables: horizontal rules only, never zebra stripes | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Tables: mono uppercase headers with the unit on a second line | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Tables: figures in mono, right-aligned; key column in navy | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Tables: a deviating value in a pale pill; one highlighted row with a pale fill and a navy edge | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Tables: an excluded row is struck through and left out of the total | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Tables: total under a rule, key amount in navy | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Badge meanings: solid confirmed, ring approved, pale corrected, outline pending, quiet withdrawn, dashed upcoming | platform report design system of 2026-10-08 | [colour.md](colour.md) |  |
| Badges: small radius, Outfit 500; a page using badges gives their key once | platform report design system of 2026-10-08 | [accessibility.md](accessibility.md) |  |
| Progress bar: quiet pale track, navy fill, blue-grey 2 for a secondary value | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Stacked bar: filled, second share, remainder dashed | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Horizontal bars with the value at the bar end | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Legend beside a ring with right-aligned values and the remainder under a rule; inline legend above a chart | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Takeaway line, source note, superscript reference number | platform report design system of 2026-10-08 | [layout.md](layout.md) |  |
| Icons: Lucide only, monochrome, inline SVG, never emoji; navy on pale, white on navy | platform report design system of 2026-10-08 | [brand.md](brand.md) |  |
| Confidential rates or prices are masked, never invented | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Only one element in navy when the others are comparisons | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| No background grid; one baseline; no drawn vertical axis; at most three value labels | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Axis labels in Geist Mono at 11, three to five ticks; date ticks as year or month.year | platform report design system of 2026-10-08 | [charts.md](charts.md) | label colour per ruling 1 |
| Label only the value the text discusses, in navy; leave headroom above the maximum | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Vertical bars rounded at the top only; small gaps in a monthly series | platform report design system of 2026-10-08 | [charts.md](charts.md) | radius per ruling 3 |
| Horizontal bars thin, rounded at the end, value in mono | platform report design system of 2026-10-08 | [charts.md](charts.md) | radius per ruling 3 |
| Ring: thick stroke, starts at the top, small gaps between arcs, no text in the centre | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Lines: main series navy and thicker; reference blue-grey 3; projection blue-grey 2 dashed; end dot with its value; no area fill, no smoothing | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Annotations: dotted marker and a short italic sentence, or a numeric note under the chart | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Legend in HTML above or beside the plot, never inside it | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Shares of a whole rounded by largest remainder so they sum to 100 | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Chart motion: bars grow, lines draw, under two seconds; nothing in print | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Tooltips: navy background, white text, Outfit title, mono values | platform report design system of 2026-10-08 | [charts.md](charts.md) | radius per ruling 3 |
| Fix colours per series when order matters, never let a library rotate the palette | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| Thousands separated by a straight apostrophe | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) | ruling 8 |
| Amounts: CHF, a space, the amount | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) | ruling 8: non-breaking space |
| Cents with a decimal point; round to the franc in reports when possible | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Percentages with a non-breaking space | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) | ruling 8 as amended |
| Negative numbers with the minus sign, not a hyphen | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Changes shown by their sign alone, without colour or arrow | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Dates as day.month.year; months as month.year | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Periods with an arrow; ranges with a hyphen or a word | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Approximations with a tilde or an approximately-equal sign | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| A table's unit in its header, not in every cell | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Never mix two thousands separators in one document | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Voice: expert to expert, no humour, no overselling, numbers before adjectives, banned words | platform report design system of 2026-10-08 | [voice.md](voice.md) |  |
| Full sentences with a subject and a verb; distrust triads and mechanical bullets | platform report design system of 2026-10-08 | [writing.md](writing.md) |  |
| No em or en dash and no spaced hyphen as an aside; middle dot and arrow allowed | platform report design system of 2026-10-08 | [writing.md](writing.md) |  |
| French typography: non-breaking space before : ; ? ! and %, French quotation marks | platform report design system of 2026-10-08 | [writing.md](writing.md) |  |
| Regulatory names and abbreviations per language (list of specialities, federal office, article numbers) | platform report design system of 2026-10-08 | [voice.md](voice.md) |  |
| In client documents: do not judge the client's choices or estimate their internal costs; highlight only figures our work establishes | platform report design system of 2026-10-08 | [voice.md](voice.md) |  |
| Fictitious data flagged on the page itself; anonymised insurers lettered A, B, C with A the largest | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| No sky blue, green, orange, red, pink, purple or turquoise in documents, even for a status | platform report design system of 2026-10-08 | [colour.md](colour.md) | documents; apps per ADR-0004 |
| No background grid, zebra stripes, 3D, bar shadows, area fills, or pie with more than four parts | platform report design system of 2026-10-08 | [charts.md](charts.md) |  |
| No blur, zoom, reflection, spotlight or looping animation | platform report design system of 2026-10-08 | [accessibility.md](accessibility.md) |  |
| No corner above 6 px, no pill shapes | platform report design system of 2026-10-08 | [layout.md](layout.md) | ruling 3 as amended |
| No emoji, no second icon library, no external image | platform report design system of 2026-10-08 | [brand.md](brand.md) |  |
| No client name, no fictitious figure shown as real, no untraceable figure or legal reference | platform report design system of 2026-10-08 | [data-patterns.md](data-patterns.md) |  |
| Principle: colour communicates and never decorates; every coloured element earns its place | Paracel design document | [principles.md](principles.md) |  |
| Principle: three families, three roles; regulatory text in Newsreader | Paracel design document | [typography.md](typography.md) |  |
| Principle: warm off-white background with white cards | Paracel design document | [colour.md](colour.md) |  |
| Principle: consistent geometry on a 4 and 8 px grid, no pills | Paracel design document | [layout.md](layout.md) | radii per ruling 3 |
| Principle: dense data with breathing room; long regulatory text gets generous line height | Paracel design document | [typography.md](typography.md) |  |
| Recessed surface for table headers, tab backgrounds and hover | Paracel design document | [colour.md](colour.md) |  |
| Placeholder text has its own light grey | Paracel design document | [accessibility.md](accessibility.md) | replaced: placeholders use tertiary text, the light grey failed contrast |
| Status colours each with a light badge background | Paracel design document | [colour.md](colour.md) | apps only; light steps from the Tailwind scales |
| Borders have a warm undertone matching the canvas | Paracel design document | [colour.md](colour.md) |  |
| Small shadow for cards and tables, medium shadow for raised panels | Paracel design document | [layout.md](layout.md) |  |
| Outfit for display, UI headings, UI body, buttons, badges and navigation | Paracel design document | [typography.md](typography.md) |  |
| Geist Mono for data values, codes and percentages | Paracel design document | [typography.md](typography.md) |  |
| App type scale: UI body, help text, labels, data values | Paracel design document | [typography.md](typography.md) | weights per ruling 4, floor 11 px |
| Five named line heights from tight to regulatory text | Paracel design document | [typography.md](typography.md) |  |
| All spacing on the 4 and 8 px grid from the spacing scale | Paracel design document | [layout.md](layout.md) |  |
| No circles except status dots | Paracel design document | [layout.md](layout.md) | ruling 3: rounded-full only for circles |
| Short transitions on interactive elements | Paracel design document | [accessibility.md](accessibility.md) |  |
| Navigation links: secondary by default, ink on hover, accent when active | Paracel design document | [layout.md](layout.md) | navy per ADR-0003 |
| Navigation collapses to a menu on tablets | Paracel design document | [layout.md](layout.md) |  |
| Breadcrumb inside a light card, current page in ink | Paracel design document | [layout.md](layout.md) |  |
| Buttons: primary, secondary, danger outline, ghost; one shape and size | Paracel design document | [layout.md](layout.md) | navy primary, ruling 3 |
| Buttons stretch to full width on phones | Paracel design document | [layout.md](layout.md) |  |
| Two badge tiers: quiet labels and urgent flags with an icon and a border | Paracel design document | [colour.md](colour.md) | apps only |
| Search field: surface, border, small shadow; accent on focus | Paracel design document | [accessibility.md](accessibility.md) | focus ring tokens |
| Empty state: centred dimmed icon, title, one-line description, mono hint | Paracel design document | [layout.md](layout.md) |  |
| Stat cards stay still: no hover lift | Paracel design document | [layout.md](layout.md) |  |
| Proportional bar for workflow stage distribution | Paracel design document | [charts.md](charts.md) | navy family, not status hues |
| Underline tabs: active tab underlined in the accent | Paracel design document | [layout.md](layout.md) | navy per ADR-0003 |
| Regulatory text block: Newsreader, generous line height, inline codes in mono on the recessed surface | Paracel design document | [typography.md](typography.md) |  |
| Sober tables: small classification marks with a legend row instead of badges in every column | Paracel design document | [layout.md](layout.md) |  |
| Status column: a coloured dot with a plain word, no badge | Paracel design document | [colour.md](colour.md) | apps only |
| Flags as plain coloured words, only on rows that need attention | Paracel design document | [colour.md](colour.md) | apps only |
| Thin progress bar beside a mono percentage | Paracel design document | [charts.md](charts.md) |  |
| App table: recessed header, row hover, horizontal scroll under a minimum width | Paracel design document | [layout.md](layout.md) |  |
| Breakpoints at tablet and phone widths | Paracel design document | [layout.md](layout.md) |  |
| Touch targets at least 44 px high on mobile | Paracel design document | [accessibility.md](accessibility.md) |  |
| Rationale: the warm canvas reads institutional, pure white reads generic | Paracel design document | [colour.md](colour.md) |  |
| Rationale: Outfit reads cleanly from display to badge sizes | Paracel design document | [typography.md](typography.md) |  |
| Rationale: squared corners read professional, pills read consumer | Paracel design document | [layout.md](layout.md) |  |
| Rationale: underline tabs stay light in dense tools | Paracel design document | [layout.md](layout.md) |  |
| Rationale: graded visual weight in tables lets the eye rest on normal rows | Paracel design document | [layout.md](layout.md) |  |

### Dropped

| Rule | Source | Reason |
| :-- | :-- | :-- |
| Audit note listing slides that still use the product name | platform brand document | Consumer-specific: a one-off audit of one deck set |
| Light sky-blue accent for part of the wordmark on dark backgrounds | platform brand document | Superseded by ruling 2 (no sky blue) and ruling 6 (white on navy) |
| Logo files that combine the monogram, the wordmark and a strapline | platform brand document | Superseded by deferred issue #2: no lockup in v1 |
| Separator sign of a co-branded cover in the light-blue accent | platform brand document | Client-specific co-branding, and superseded by ruling 2 |
| A client deck's stylesheet is the source of truth; copy its folder to start a deck | platform design-system document | Superseded by ADR-0002: this repository is the only source |
| Light sky-blue accent for text and icons on navy | platform design-system document | Superseded by ruling 2 |
| The lighter grey as tertiary text | platform design-system document | Superseded by ruling 1: tertiary text is the darker grey, the lighter one is decoration only |
| Pink, purple and teal families for categorical charts | platform design-system document | Superseded by the four-series navy palette (owner, 2026-10-10) and ADR-0004 |
| Fonts loaded from Google Fonts | platform design-system document | Superseded by ADR-0002: fonts are self-hosted, no remote request |
| Slide title in Outfit at weight 600 | platform design-system document | Superseded by ruling 4 (weight 500) and the slide title size token |
| Card radius up to 13 px and a thick navy top border | platform design-system document | Superseded by ruling 3 (6 px maximum); cards carry no top bar in the shared components |
| Pill-shaped chips and light-blue borders on navy | platform design-system document | Superseded by rulings 2 and 3 |
| Navy panel accent text in the light-blue accent | platform design-system document | Superseded by ruling 2 |
| Thousands separated by a comma | platform style guide | Superseded by ruling 8 (straight apostrophe) |
| The translation build fails on a dash and prints a dash count | platform style guide | Tool-specific; this repository's guideline test does the same for guidelines |
| The English string is the translation key | platform style guide | Tool-specific (one deck pipeline); the general rule is carried as B13 |
| Commercial phrases to prefer (recovering every franc, zero risk, success-based fee, one-off audit) | platform style guide | Offer-specific positioning; belongs to the positioning material, not the design system |
| Copy the CSS block as is into every report | platform report design system of 2026-10-08 | Superseded by ADR-0002: load the released CSS |
| Load fonts from Google Fonts | platform report design system of 2026-10-08 | Superseded by ADR-0002: fonts are self-hosted |
| Provenance notes on transposed values and source file lists | platform report design system of 2026-10-08 | Obsolete: extraction notes, not rules |
| Decimal comma in prose, percentages and millions | platform report design system of 2026-10-08 | Superseded by ruling 8 (decimal point) |
| English percentages without a space | platform report design system of 2026-10-08 | Superseded by ruling 8 as amended (non-breaking space in every language) |
| A 4 px radius for small items, bars and tooltips | platform report design system of 2026-10-08 | Superseded by ruling 3 (3 px) |
| Notes, axes and legal line in the lighter grey | platform report design system of 2026-10-08 | Superseded by ruling 1 (tertiary text grey) |
| Hero figures in Geist Mono at 600 | platform report design system of 2026-10-08 | Superseded by ruling 4: hero figures in Outfit 500 with tabular figures |
| Header glow made of radial gradients; very light note background; translucent shading of a calculated column; white at 8 % | platform report design system of 2026-10-08 | Not encoded in v1: no token and no shared component uses them |
| Ready-made option sets for three charting libraries | platform report design system of 2026-10-08 | Tool-specific; the skill's chart reference (increment 10) carries library settings derived from the tokens |
| Do not follow the older colour documents and templates | platform report design system of 2026-10-08 | Obsolete: these guidelines replace them |
| A white page background in print | platform report design system of 2026-10-08 | Superseded by ruling 9: every document page uses the canvas colour |
| Anonymised insurers named Caisse A, Caisse B | platform report design system of 2026-10-08 | Superseded by ADR-0005 naming (Assureur A, Assureur B) |
| Swiss red as the accent with its light and hover variants | Paracel design document | Superseded by ADR-0003: navy everywhere, red only as danger |
| Pink, purple and teal colours and six annotation hues for regulatory text | Paracel design document | Consumer-specific: kept local in the app under its own prefix (ADR-0004) |
| 6 px radius on every component, 4 px on badges | Paracel design document | Superseded by ruling 3 (3 and 6 px, 12 px app overlays) |
| Fonts from Google Fonts and a font CDN | Paracel design document | Superseded by ADR-0002: self-hosted fonts |
| Headings and buttons at weights 600 to 800 | Paracel design document | Superseded by ruling 4 |
| Table headers at 10.5 px | Paracel design document | Superseded by the 11 px floor |
| Extra spacing steps of 40, 56 and 64 px and a separate hover surface | Paracel design document | Superseded by the token scale (no such tokens) |
| Product header with a red logo tile and a coloured product word | Paracel design document | Product-specific, and superseded by ADR-0003 and ruling 7 |
| Confidence heatmap and extracted-field rows with their thresholds | Paracel design document | Product-specific; the general rule (colour never alone) is in accessibility.md |
| Tier column in plain mono | Paracel design document | Product-specific |
| Container width of one product and grid recipes for swatches and stat cards | Paracel design document | Product-specific layout values |
| Copy-paste root block of custom properties | Paracel design document | Superseded by ADR-0002 and ADR-0006 (generated --mq- tokens) |
| Machine-readable kit token section with the red accent | Paracel design document | Superseded by ADR-0006: the kit contract is generated |
| Workflow stage colours with white text inside the bar segments | Paracel design document | Superseded by ADR-0004 (status hues for system status only) and the contrast pairs (white fails on the light series) |
