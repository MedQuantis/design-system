---
type: llm
focus:
  source: file
  path: output.html
---

PASS if the dialog uses the 12 px overlay radius (--mq-radius-overlay), the buttons the 3 px radius.
PASS if the delete button is a danger outline or danger-coloured control with a destructive verb (Delete).
PASS if the dialog is accessible: role dialog, a labelled title, focusable buttons.
FAIL if the dialog or its buttons are pill-shaped, or the dialog radius is not 12 px.
FAIL if the delete action is navy with no danger cue.
