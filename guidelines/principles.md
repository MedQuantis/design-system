# Principles

These principles decide the cases the other guidelines do not cover. When two rules seem to conflict, the earlier principle wins.

1. **Clinical clarity.** Sober and high-contrast. Nothing is decorative unless it carries meaning: colour communicates a role, a state or an emphasis, never an ornament. Every coloured element must earn its place.
2. **One accent.** Navy (`--mq-accent`, `#0a2463`) is the only brand accent, on every surface ([ADR-0003](../docs/architecture/decisions/adr-0003-navy-is-the-single-brand-accent.md)). Everything else is a warm neutral or the blue-grey family. Interactive apps add status colours for genuine system status only ([ADR-0004](../docs/architecture/decisions/adr-0004-status-colours-in-apps-only.md)).
3. **The figure before the adjective.** A claim is backed by a number, and every number can be traced to its source. Figures are the hero of a page: they get the largest type, the accent colour and room around them. Any fictitious figure says so on the page.
4. **Calm confidence.** Pale neutral surfaces, generous whitespace, one idea per block and one hero figure per column. When a page is full, cut content before shrinking text.
5. **Document-grade.** Every document reads as well printed on A4 or exported to PDF as on a screen. A design that only works on a screen is not finished.
6. **Sober motion, never required.** Motion is optional, short and carries meaning (a bar grows, a line draws). Nothing loops, and print always shows the final state.
7. **Three families, three roles.** Outfit for headings, labels and app UI; Newsreader for reading text; Geist Mono for codes, table figures and dates ([typography](typography.md)).
8. **One system, many media.** Slides, A4 reports, papers, the website, newsletters and apps share the same tokens. Media differ in what they may use (documents never carry status colours), never in the values themselves.

## Where the rules live

| Topic | File |
| :-- | :-- |
| Name, tagline, legal line, logo, monogram, icons | [brand.md](brand.md) |
| Tone, terminology in four languages | [voice.md](voice.md) |
| Punctuation, titles, sentence and list style | [writing.md](writing.md) |
| Colour tokens, the medium split, on-navy values | [colour.md](colour.md) |
| Families, weights, roles and sizes | [typography.md](typography.md) |
| Widths, spacing, radius, page and component patterns | [layout.md](layout.md) |
| Chart palette, marks, axes, labels | [charts.md](charts.md) |
| Numbers, amounts, dates, null versus zero, illustrative data | [data-patterns.md](data-patterns.md) |
| WCAG 2.2 AA, focus, contrast pairs, motion | [accessibility.md](accessibility.md) |
| Using and extending the system in a consumer | [specialising.md](specialising.md) |
| Where each legacy rule went | [README.md](README.md) |
