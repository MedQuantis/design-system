---
type: llm
focus:
  source: file
  path: output.html
---

PASS if the amount reads 2'460'000 with a straight apostrophe as thousands separator, the currency code CHF written before the amount.
PASS if the share is written 12.5 % with a decimal point and a space before the percent sign.
PASS if the three figures sit in KPI tiles or a calm column layout, with the figure above its caption.
PASS if a note says the figures are illustrative.
PASS if the legal line (MedQuantis SA · CH-1095 Lutry · medquantis.ch) sits bottom left with the slide number bottom right (owner ruling 11).
FAIL if the thousands separator is a comma, a space or a curly apostrophe, or the amount ends in CHF.
FAIL if the figures are coloured green, orange or red.
