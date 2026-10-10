---
type: llm
focus:
  source: file
  path: output.html
---

PASS if the page is in formal Swiss Standard German (Sie, ss instead of the sharp s).
PASS if numbers keep the decimal point and the straight apostrophe in German too (1'250'000 and 18.4 %).
PASS if the page carries a confidentiality mention, the legal line and a date written 08.10.2026 style.
FAIL if the page uses a decimal comma (18,4) or a German thousands separator such as a full stop.
FAIL if the sharp s appears, or any em or en dash.
