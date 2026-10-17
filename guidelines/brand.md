# Brand

## Name

- **MedQuantis** is the company and the public brand. It is the name on every slide, report, paper, page and email a reader outside the company sees.
- It is written as one word with a capital M and a capital Q: MedQuantis. Never Medquantis, MEDQUANTIS in running text, or Med Quantis.
- **Paracel** names the technology (the engine and its data), never the company. Use it only when the sentence is about the technology itself; to a client, the company that speaks is MedQuantis.

## Tagline

| Language | Tagline |
| :-- | :-- |
| French | L'IA suisse au service des systèmes de santé |
| German | Schweizer KI für das Gesundheitswesen |
| English | Swiss AI for healthcare systems |
| Italian | Not yet defined, owner to provide |

The French line is the reference; the German and English lines are its approved translations. Do not write an Italian tagline until the owner provides one.

## Legal line

The footer of every document sent outside carries the legal line and the date of the document:

`MedQuantis SA · CH-1095 Lutry · medquantis.ch`

Set it in Geist Mono at the note size, tertiary text colour (`--mq-tertiary`), with the date at the right end of the same line.

On slides the legal line appears on every slide, bottom left, small and in tertiary grey, with the slide number bottom right (owner ruling 11). Use the slide footer row `mq-slide-foot` of `css/slide.css`, never `mq-foot`, which flows from the top of a slide canvas.

A deck that carries a classification shows it at the right of the footer, before the slide number, in the same small tertiary mono (owner ruling 17, amending ruling 11's two-cell footer). It is the label only, in the deck's language (Confidential in an English deck, Confidentiel in a French one), never the C0 to C3 code. A kit deck takes it from its `classification:` and `lang:`.

Material left with a reader (a deck after a meeting, a report sent outside) also carries a confidentiality mention and its date, in the document's language:

| Medium | French | German | English | Italian |
| :-- | :-- | :-- | :-- | :-- |
| Presentation | Présentation confidentielle | Präsentation vertraulich | Confidential presentation | Not yet defined, owner to provide |
| Report | Rapport confidentiel | Vertraulicher Bericht (proposed, owner to confirm) | Confidential report (proposed, owner to confirm) | Not yet defined, owner to provide |

## Wordmark

The wordmark is the logo; no icon is required next to it. "Med" is set in Outfit 600 and "Quantis" in Outfit 300, in navy (`#0a2463`) on light backgrounds and in white on navy and on every dark surface, at every size (owner rulings 6 and 14).

Each background has two files in `brand/`:

| File | Use |
| :-- | :-- |
| `wordmark-on-light.svg`, `wordmark-on-navy.svg` | Live text. Inline the SVG in a page that loads `fonts/fonts.css`, so the letters render in Outfit and stay selectable. |
| `wordmark-on-light-print.svg`, `wordmark-on-navy-print.svg` | Outlined letters. Use for images (`<img>` cannot load web fonts), documents, PDFs, email and anything sent to a printer. |

Rules:

- Use the on-navy file on navy and the on-light file on light backgrounds. Never recolour, stretch, outline, shadow or rearrange the wordmark.
- On dark (the dark theme, a dark slide or page), use the white `wordmark-on-navy` files on every dark surface: 18.13:1 on the dark canvas, 16.08:1 on the dark surface. The navy wordmark is never used on dark: it is 1.25:1 there (owner ruling 14).
- Inline the SVG rather than linking an external image, and remove its `width` and `height` so the page sizes it. On a report header the wordmark sits at about 198 by 44 px on screen and 162 by 36 px in print.
- A full stop in the on-navy accent (`--mq-on-navy-accent`) after a name is reserved for a one-word name on a navy cover. It is never added to the wordmark.

## Monogram and favicon

Where the wordmark does not fit (favicon, app icon, avatar, app tile), use the monogram: a white M and Q on a navy (`#0a2463`) square with rounded corners of 8/64 of its side, M in Outfit 700 and Q in Outfit 400, centred on the cap height (owner ruling 7). The letters are outlined in every file.

| File | Use |
| :-- | :-- |
| `brand/monogram.svg` | The monogram with its rounded corners |
| `brand/monogram-square.svg` | For platforms that round icons themselves |
| `brand/monogram-small.svg` | 16 px and smaller: larger letters, M 800 and Q 600 |
| `brand/favicon/` | `favicon.svg`, `favicon.ico` (16, 32, 48), `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png` |

On dark (owner ruling 14) the monogram keeps its file and takes the navy panel's edge, the 1 px light-navy outline that `--mq-shadow-panel` draws in the dark theme, since its navy square is only 1.11:1 against the dark surface; in light it has no outline. A navy brand tile or app tile on dark takes the panel gradient (`--mq-panel-start` to `--mq-panel-end`), never the lifted accent, on which white is 3.48:1. No new brand file is needed.

## No combined logo yet

There is no lockup of the monogram and the wordmark in v1, and no on-navy variant of the monogram. Do not compose one locally: the combined logo is deferred until a real surface needs it ([issue #2](https://github.com/MedQuantis/design-system/issues/2)). Older lockups with a strapline under the wordmark are retired.

## Icons

- Lucide only, from the pinned build in `icons/` (version and hash in `icons/manifest.json`). No second icon library, and never an emoji in place of an icon.
- Icons are offline: the pinned build or an inline SVG, never a CDN or any remote request.
- Monochrome, stroke 2, round caps and joins, colour inherited from the text. Navy on a pale navy pill (`--mq-accent-pale`), white on a navy panel inside a translucent pill (`--mq-on-navy-pill`), blue-grey (`--mq-border-strong`) in a card title bar.
- The icon pill is a small square with the 6 px radius (`--mq-radius-medium`), never a circle or a pill shape.
- An icon that carries meaning has a text label or an accessible name; a decorative icon is hidden from assistive technology.
