---
type: llm
focus:
  source: file
  path: output.html
---

PASS if the table has a total row under a navy rule and the unit CHF in the header, not repeated in every cell.
PASS if the missing 2025 value is shown as n/a (or n.d.) and explained in a note, never as 0, a blank or a dash.
PASS if figures are right-aligned in a monospace face with apostrophe thousands separators.
FAIL if the missing value is written as 0, left blank or shown as a dash.
FAIL if the table uses vertical rules or zebra stripes.
