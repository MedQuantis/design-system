# Kit modules

When a page is rendered by the homemade-claude-kit delivery-comms skills (a deck from `com-slide-deck`, a view from `com-artefact-viz`, a release note from `com-release-note`), the kit takes the MedQuantis brand from the pinned `@medquantis/design-system` package, not from this skill. The project pins it with the kit's `ux-design-system point @medquantis/design-system@<x.y.z>`, which writes `docs/ux/package.json`. Do not copy this skill's `assets/` into such a project and never add a `docs/ux/tokens.css`. Run the kit's own validator, `check_render.py`, on a kit render; this skill's `validate.py` is for pages built from the `mq-` classes.

The package's `kit-manifest.json` (contract 2.1.0) declares ten modules, so the kit's base theme fills none of them; the kit modules need delivery-comms 2.1.0 or later. The kit reads its own role names (`--ink`, `--accent`, `--chart-1`), each an alias of a MedQuantis `--mq-*` token, and emits its own class names (`slide`, `doc`, `report`), which the document, slide-frame and print modules restyle as their `mq-` counterparts.

| Module | File | Carries |
| :-- | :-- | :-- |
| `core` | dist/kit/core.css | Text, canvas, surface, border, accent and status colours, the tertiary grey of footers and legal lines, the three faces with their font files, title size, spacing, radii and the card shadow |
| `dataviz` | dist/kit/dataviz.css | The ordered navy and blue-grey chart series, the rest series, axis, grid and highlight |
| `type` | dist/kit/type.css | The type scale, the body and tight line heights, weights 400 and 500 |
| `space-shape` | dist/kit/space-shape.css | The smallest and largest spacing steps, the small radius, the 6 px maximum radius (no pill shapes) and the hairline stroke |
| `document` | dist/kit/document.css | The A4 document: page colour, text size, rules; the kit's `doc` classes look like `mq-page`, `mq-doc` and `mq-eyebrow` |
| `slide-frame` | dist/kit/slide-frame.css | The 1280 by 720 slide; the kit's `slide` classes look like `mq-slide`, with the footer row of `mq-slide-foot` (legal line left, number right, no logo); a classified deck's label sits before the number, in the deck's language |
| `dark` | dist/kit/dark.css | The dark twin of every colour role, the dark values of the MedQuantis tokens; a dark slide (`dark` on the slide, or `theme: dark` for the whole deck) has one `dark-key` element on the navy panel gradient with its 1 px outline, no glow, and `dark-accent` for highlighted text |
| `print` | dist/kit/print.css | The release-note report: page size, margins, and breaking changes in navy, never a status hue |
| `brand` | dist/kit/brand.css | The wordmarks on light and on navy, the monogram and the legal line |
| `guidance` | dist/kit/guidance.md | The MedQuantis rules the kit's skills read before writing a page |

A kit render follows the same rules as everything else: documents are navy only, no colour outside the tokens, weights 400 and 500, no pill shapes. Each render writes `<output>.provenance.json`; every module in it should read `design-system`.
