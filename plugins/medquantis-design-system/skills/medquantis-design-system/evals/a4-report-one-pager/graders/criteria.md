---
type: llm
focus:
  source: file
  path: output.html
---

PASS if the page uses var(--mq-*) tokens for every colour and the shared mq- classes (for example mq-table, mq-takeaway, mq-foot).
PASS if the footer carries the legal line MedQuantis SA · CH-1095 Lutry · medquantis.ch and a date.
PASS if amounts are written with the currency first and apostrophe thousands separators (for example 840'000).
PASS if the page is set up for A4 print and the figures are marked as illustrative.
FAIL if the report uses any status colour (green, orange, red) or a hue outside navy, the neutrals and the blue-grey family.
FAIL if the legal line is missing or the amounts use commas or spaces as thousands separators.
