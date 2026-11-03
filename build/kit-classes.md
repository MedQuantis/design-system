# Kit classes and the MedQuantis rules they reproduce

The homemade-claude-kit renderers emit their own class names, listed under `classes` in the kit contract (`tests/fixtures/kit-contract/modules.json`). The MedQuantis document, slide-frame and print modules restyle them by hand, in `css/kit/document.css`, `css/kit/slide-frame.css` and `css/kit/print.css`, against contract roles only (Plan-0002 increment 02, owner decision 4). The dark module (contract 2.1.0, Plan-0003 increment 04) styles none of its classes: the kit's own dark layer draws them from the dark roles, so `css/kit/dark.css` holds no rule. This table names, for each kit class, the MedQuantis rule whose look it reproduces, or the guideline it follows where MedQuantis has no counterpart. `tests/unit/kit-modules.test.mjs` checks that every class has a row and that every named `mq-` class exists in `css/`.

Where a MedQuantis value has no contract role, the closest role stands in, as noted: the 12.5 px note size `--font-size-sm` (13 px), the 18 px slide text `--font-size-md` (16.5 px), the medium shadow `--shadow` (the small one). The print rules use the literal A4 print sizes of guidelines/typography.md, which are not yet tokens, and the heading weight 500.

| Kit class | Module | Reproduces |
| :-- | :-- | :-- |
| `doc` | `document` | `mq-page` (A4 sheet on the canvas colour) with the body text of `mq-doc`: Newsreader at the body size, line height 1.55; headings inside it in Outfit 500 as `mq-title` and `mq-subtitle` |
| `doc-keep` | `document` | follows guidelines/layout.md, Print and PDF: figures, cards and blocks never split across pages |
| `doc-label` | `document` | `mq-eyebrow`: Geist Mono 500 capitals in navy, 0.16 em letter spacing |
| `doc-section` | `document` | follows guidelines/layout.md, Report skeleton: a section opens with its own head |
| `doc-section--flow` | `document` | follows guidelines/layout.md, Widths and spacing: the space between sections and a hairline rule in the border colour |
| `slide` | `slide-frame` | `mq-slide`: the 1280 by 720 canvas on the canvas colour, Newsreader text; no radius, because the kit prints slides as they show |
| `active` | `slide-frame` | follows guidelines/layout.md, Elevation and navy blocks: the slide shown alone in presentation mode loses the desk shadow |
| `presenting` | `slide-frame` | follows guidelines/layout.md, Media: the canvas alone on an ink surround while presenting |
| `controls-hint` | `slide-frame` | follows guidelines/layout.md, App patterns: the hint of an empty state, in Geist Mono, keys on the small radius |
| `slide-source-bar` | `slide-frame` | `mq-note`: Newsreader italic in a quiet grey, above the footer row at the side margins |
| `slide-label` | `slide-frame` | `mq-slide-label`: Geist Mono 500 capitals in navy, 48 px from the top, 72 px from the left, 0.18 em letter spacing |
| `slide-footer` | `slide-frame` | `mq-slide-foot`: one row 24 px above the bottom edge at the 72 px side margins, legal line at the left and number at the right, Geist Mono (owner ruling 11) |
| `slide-logo` | `slide-frame` | `mq-slide-foot`: hidden, the MedQuantis footer row carries no logo (owner ruling 11) |
| `slide-legal` | `slide-frame` | `mq-slide-foot`: the legal line, bottom left (guidelines/brand.md, Legal line) |
| `slide-classification` | `slide-frame` | `mq-slide-foot`: the deck's classification at the right of the footer row, before the number, in the same small tertiary Geist Mono as the legal line, the label in the deck's language (owner ruling 17) |
| `slide-number` | `slide-frame` | `mq-slide-number`: bottom right at the eyebrow size, tabular figures |
| `dark` | `dark` | follows guidelines/colour.md, Dark theme: a dark slide or page; the kit's own layer reads every role from its `--dark-` twin, which the dark module maps to the dark value of the same MedQuantis token (owner ruling 12) |
| `dark-key` | `dark` | `mq-panel`: the navy panel gradient of the dark theme with its 1 px light-navy outline, no glow, drawn by the kit's own layer from `--dark-key-fill` and `--dark-key-edge` (owner rulings 13 and 14) |
| `dark-accent` | `dark` | follows guidelines/colour.md, Dark theme: highlighted text in `--mq-accent-highlight`, drawn by the kit's own layer from `--dark-accent-text` (owner ruling 18) |
| `report` | `print` | `mq-page`: the A4 sheet on the canvas colour in ink, with the 48 and 72 px page margins of `--print-margin` |
| `report-framing` | `print` | `mq-lead`: Newsreader italic in the secondary text colour, 11.5 pt |
| `report-kicker` | `print` | `mq-eyebrow`: Geist Mono 500 capitals in navy, 7.5 pt |
| `report-title` | `print` | `mq-display`: Outfit 500 at the 26 pt print size of the hero title |
| `section` | `print` | follows guidelines/layout.md, Widths and spacing: the space between sections |
| `section--breaking` | `print` | follows guidelines/colour.md, The medium split: documents are navy only (ADR-0004), so the breaking-changes label and the kit's panel take `--print-breaking`, the navy accent, not a status hue |
| `section--page-break` | `print` | follows guidelines/layout.md, Print and PDF: a section that leads a fresh page |
| `section-label` | `print` | `mq-subtitle` set in capitals under the 2 px navy rule of the "In brief" block (guidelines/layout.md, Report skeleton) |
