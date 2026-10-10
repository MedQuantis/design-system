---
type: llm
focus:
  source: file
  path: output.html
---

PASS if bars use the navy chart series (2025 in series 1, earlier years in series 3 or 4), with a direct value label on the highlighted bar.
PASS if one baseline, no background grid, axis labels in a monospace face.
PASS if the SVG has role img with a title and description, and the values also appear as text.
PASS if amounts use apostrophe thousands separators.
FAIL if the chart uses a library default palette, a status colour or more than one accent hue.
FAIL if the chart has a background grid, 3D effects or shadows on bars.
