# Typography

## Three families, three roles

| Family | Token | Role |
| :-- | :-- | :-- |
| Outfit | `--mq-font-family-heading`, `--mq-font-family-ui` | Headings, column titles, hero figures, labels, table text, takeaways; the whole UI of apps (navigation, buttons, badges, UI body text) |
| Newsreader | `--mq-font-family-body` | Reading text: body of documents and slides, leads, captions, notes, quoted official text, and regulatory text in apps. The only serif (owner ruling 10) |
| Geist Mono | `--mq-font-family-mono` | Codes, figures in tables, dates in tables, eyebrows, axis labels, identifiers |

Georgia and Times New Roman appear only as fallbacks. The three families are self-hosted (`fonts/fonts.css`, variable woff2 with latin and latin-ext); no page loads a font from a remote service. Newsreader ships its true italic, so leads and notes are never a slanted roman.

Outfit was chosen because it reads cleanly from a display title down to an 11 px badge, with a geometric, contemporary character that stays distinct from the generic interface sans-serifs.

## Weights

| Weight | Token | Use |
| :-- | :-- | :-- |
| Outfit 500 | `--mq-font-weight-heading` | Every heading, column title, hero figure, KPI value, label, button label and badge (owner ruling 4) |
| Outfit 600 | `--mq-font-weight-emphasis` | Only a short highlighted word inside body text, as the "Med" of the wordmark. Bold inside Newsreader prose switches to Outfit 600 at about 0.94 em |
| Outfit 400 | `--mq-font-weight-body` | App UI body text |
| Outfit 300 | `--mq-font-weight-light` | Only the "Quantis" half of the wordmark |
| Newsreader 400 | `--mq-font-weight-body` | Reading text, with its italic for leads and notes |
| Geist Mono 400 and 500 | | Table figures and codes 400, eyebrows 500 |

Weights 700 and 800 appear only inside the monogram files; no heading, button or table uses them.

## Roles and sizes

Every size is a token. The print column gives the A4 scale for reports printed from a browser; it is not yet a token (open point).

| Role | Family and style | Screen token | Screen | Print (A4) |
| :-- | :-- | :-- | :-- | :-- |
| Hero title (`mq-display`) | Outfit 500, line height 1.04 to 1.08, letter spacing about -0.025 em | `--mq-font-size-hero-min` to `--mq-font-size-hero-max` | 34 to 56 px | 26 pt |
| Slide title (`mq-slide-title`) | Outfit 500, line height 1.15 | `--mq-font-size-slide-title` | 36 px | |
| Section title (`mq-title`) | Outfit 500, line height 1.15, about -0.015 em | `--mq-font-size-h2` | 32 px | 17 pt |
| Subsection, card and column title (`mq-subtitle`, `mq-card-title`) | Outfit 500, about -0.01 em | `--mq-font-size-h3` | 20 px | 12.5 pt |
| Lead (`mq-lead`) | Newsreader italic, muted, line height 1.5 | `--mq-font-size-lead` | 18 px | 11.5 pt |
| Body (`mq-doc`, `mq-prose`) | Newsreader 400, line height 1.6 | `--mq-font-size-body` | 16.5 px | 10 pt |
| Small text, figure caption | Newsreader | `--mq-font-size-small` | 15 px | 9.5 pt |
| Label (`mq-label`) | Outfit 500, muted | `--mq-font-size-label` | 13 px | 8.5 pt |
| Eyebrow (`mq-eyebrow`) | Geist Mono 500, capitals, letter spacing 0.16 to 0.18 em, navy | `--mq-font-size-eyebrow` | 11 px | 7.5 pt |
| Hero figure (`mq-figure`) | Outfit 500, tabular figures, navy | `--mq-font-size-figure` | 50 px | 28 pt |
| KPI value (`mq-kpi-value`) | Outfit 500, tabular figures | `--mq-font-size-kpi` | 30 px | 17 pt |
| Counter value | Outfit 500, tabular figures, navy | `--mq-font-size-stat` | 24 px | 14 pt |
| Table header | Geist Mono, capitals, small letter spacing | `--mq-font-size-table-header` | 11 px | 7 pt |
| Table figure (`mq-num`) | Geist Mono 400, tabular figures, right-aligned | `--mq-font-size-table-cell` | 13 px | 8.5 pt |
| Table text | Outfit 500 (first column) or Newsreader | `--mq-font-size-table-text` | 14 px | 8.5 pt |
| Takeaway (`mq-takeaway`) | Outfit 500 | `--mq-font-size-takeaway` | 16 px | 10.5 pt |
| Note, source, illustrative mention (`mq-note`, `mq-foot`) | Newsreader italic, tertiary | `--mq-font-size-note` | 12.5 px | 8 pt |
| Chart axis label | Geist Mono, tertiary | `--mq-font-size-axis` | 11 px | about 8 pt on paper |

Rules:

- **Floor:** no text below 11 px on screen, in any medium, including table headers and badges.
- **Letter spacing** is negative on titles and tightens as the size grows: about -0.01 em near 20 px, -0.015 em near 32 to 38 px, -0.025 em at 56 px and above. Body text keeps the font's own spacing.
- **Figures** always use tabular figures (`font-variant-numeric: tabular-nums`, or `mq-mono`), so columns of numbers align.
- **Eyebrows and section labels** are typed in normal case and set in capitals by CSS; a middle dot separates their parts: "02 · Amounts by year".

## Line height

| Context | Line height |
| :-- | :-- |
| Hero titles | 1.04 to 1.08 |
| Headings, counters, stat figures | 1.15 to 1.3 |
| Leads | 1.5 |
| App UI text, labels, descriptions | 1.55 |
| Reading text in documents | 1.6 |
| Help text and longer descriptions in apps | 1.75 |
| Regulatory text in apps (dense legal prose read under time pressure) | 2.2, and 2.0 on phones |

Long regulatory text is set in Newsreader at about 15 px with that generous line height, so long German compounds stay separable line by line. Codes inside it are set in Geist Mono at 12 px on the recessed surface with the small radius. Dense tables keep tight padding; the breathing room goes to the text people read word by word.

## App type scale

Apps use the same families and weights at UI sizes: UI body Outfit 400 at 14 px, help text 13 to 14 px at line height 1.75, labels and navigation Outfit 500 at 13 px, badges Outfit 500 at 11 px, data values Geist Mono at 12 to 13 px, page title Outfit 500. Heavier weights (600 to 800) and sizes below 11 px from older app designs are retired.
