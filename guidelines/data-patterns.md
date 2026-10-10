# Data patterns

<!-- mq:illustrative: every figure in this file is a fictitious format example -->

Every example on this page is fictitious. Where a rule asks for a non-breaking space, the example contains the real character (U+00A0), so it can be copied as is.

## Numbers (owner ruling 8, as amended on 2026-10-10)

| Case | Write | Never |
| :-- | :-- | :-- |
| Thousands | `2'460'000`: the straight apostrophe (U+0027) | the curly apostrophe, a space, a comma, a full stop |
| Decimals | `12.5`: a decimal point, in every language | a decimal comma |
| Percentage | `12.5 %`: a non-breaking space before `%`, in every language | `12.5%`, a breaking space |
| Amount | `CHF 2'460'000`: the currency first, joined to the amount by a non-breaking space | `2'460'000 CHF`, `Fr.`, a breaking space |
| Cents | `CHF 6'826.20`; in a report, round to the franc whenever the cents add nothing | |
| Millions | `CHF 1.2 mio` (French), `CHF 1.2 Mio.` (German), `CHF 1.2 M` (English); in a sentence the word may be written out | a decimal comma |
| Negative | `−150'000`: the minus sign U+2212 | a hyphen |
| Change | `+14 %`, `−3 %`: the sign is enough | a colour or an arrow to show direction |
| Approximation | `~84`, `≈178`: approximate figures stay approximate | false precision |

The Italian abbreviation for millions is not yet defined; the owner is to provide it.

- One number format per document. Never mix two thousands separators, even when quoting a source that uses another one.
- A hero figure stays short, about seven to nine characters. The unit goes in its caption ("CHF of net gap"), not in the figure.
- A table's unit goes in its header, not in every cell ([layout](layout.md)).
- Shares of a whole are rounded with the largest-remainder method, so the displayed percentages add up to exactly 100.
- In code, format through one function per pattern (amount, number, percentage) rather than by hand; the specimen script exports such functions.

## Dates and periods

| Case | Write |
| :-- | :-- |
| Date | `08.10.2026`: day, month, year with full stops |
| Month (axes, tables) | `10.2026` |
| Year (axes) | `2024` |
| Period | `2019 → 2025`, with the arrow |
| Range | `2019-2025` with a plain hyphen, or in words: "3 to 6", « 3 à 6 » |

Never an en dash in a range.

## Null versus zero

A zero is a measurement; a missing value is not. Keep them apart everywhere:

- **Zero** is written `0` (or `CHF 0`) when the value was measured and is zero.
- **Missing** (not measured, not applicable, not yet available) is never written as `0` and never left as an empty cell. Write the language's "not available" abbreviation: `n.d.` (French and Italian), `k.A.` (German), `n/a` (English), and explain it once in a note under the table or chart.
- A dash is not used for a missing value: it reads as a minus sign or a range.
- An aggregate over values that are all missing is itself missing, never a total of `0`.
- A chart leaves a gap for a missing point; it never draws it at zero.

## Confidential values

A confidential rate, price, refund scale or commercial term is never invented and never shown, not even as an example. Show a mask instead: a lock icon followed by `••••` in Geist Mono, navy.

## Illustrative data

- Fictitious figures are flagged on the page itself, in a note (`mq-note`): "Illustrative figures · insurers and medicines anonymised".
- Fictitious names follow [ADR-0005](../docs/architecture/decisions/adr-0005-public-repo-with-confidentiality-gate.md): Assureur A, Assureur B (A being the largest), Médicament X, Médicament Y, round amounts such as `CHF 300'000`.
- Never name a real client, partner or person, never present a fictitious figure as real, and never cite a figure or a legal article that cannot be traced to its source.
- In this repository, a line holding a fictitious amount or percentage carries the marker `mq:illustrative`, on the same line or, for a whole file, in its first five lines (as this file does). Inside `examples/`, every amount and every percentage needs it; elsewhere, every currency amount does. The confidentiality check fails on an unmarked figure.
