---
type: llm
focus:
  source: file
  path: output.html
---

PASS if status is a small coloured dot followed by the plain word, using the status tokens.
PASS if the table sits in a white wrapper with a light border and the 6 px radius, with row hover on the recessed surface.
PASS if only rows needing attention carry a flag.
FAIL if every row carries a coloured badge in several columns.
FAIL if status is shown by colour alone.
