---
type: llm
focus:
  source: file
  path: output.html
---

PASS if the tagline reads L'IA suisse au service des systèmes de santé.
PASS if French typography: a non-breaking space before : ; ? ! and %.
PASS if the button is navy with the small 3 px radius, not a pill.
PASS if fonts are self-hosted, with no request to a remote font service.
FAIL if the page loads Google Fonts or any remote stylesheet.
FAIL if the hero uses a gradient or accent outside the navy family.
