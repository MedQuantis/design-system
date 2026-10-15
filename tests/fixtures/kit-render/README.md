# Kit render fixtures

Fictitious sources that `make kit-check` (`scripts/kit-check.mjs`) renders with the real homemade-claude-kit renderers from the packed package (Plan-0002, Principle 6): a deck (`deck/`, com-slide-deck `build.py`), an A4 document (`document/`, com-slide-deck `mode: document`) and a release-note report (`release-note/`, com-release-note `render_pdf.py --html-only`). Each output must pass `check_render.py --record` with `PASS: no findings`. mq:illustrative

kit-check copies these folders into a scratch folder next to the unpacked `package/`, so `paths.design_tokens: "../package"` in each `config.yaml` names the packed design system; the release note gets the same folder through `--design-system`. Every name, date and figure here is invented.

`tests/e2e/fixtures/` holds static copies of the markup these renders produce, so the screenshot baselines run in CI without the kit.
