# Local one-offs

One line per component or token a consumer adds locally. Outcome is one of: promoted, kept local (with a reason), or replaced by an existing component. See [GOVERNANCE.md](../GOVERNANCE.md) for the promotion tests.

| Consumer | What | Date | Outcome |
| :-- | :-- | :-- | :-- |
| Paracel Explorer | Categorical chart hues `--app-chart-green`, `--app-chart-vermillion`, `--app-chart-blue`, `--app-chart-violet`, `--app-chart-teal`, drawn with `--mq-chart-series-1` as six series | 2026-10-29 | Kept local: the product owner rejected navy-only and muted charts for six change series; promotion requested in [#35](https://github.com/MedQuantis/design-system/issues/35) |
| Paracel Explorer | Change-type hue `--app-chart-orange` and its text shade `--app-chart-orange-text` (Modification; added and removed read the green and vermillion chart hues) | 2026-10-29 | Kept local: change types keep green, orange and red wherever a change is listed; promotion requested in [#35](https://github.com/MedQuantis/design-system/issues/35) |
| Paracel Explorer | Annotation hues `--app-green`, `--app-pink`, `--app-teal` and their `-tint`s (text-diff marks, biosimilar dot) | 2026-10-29 | Kept local: the release has no annotation tokens; see [#35](https://github.com/MedQuantis/design-system/issues/35) |
| Paracel Explorer | Backdrop `--app-scrim` (black at 30 %, behind the phone sidebar) | 2026-10-29 | Kept local until the release ships a scrim token; see [#35](https://github.com/MedQuantis/design-system/issues/35) |
| Paracel Explorer | Decimal comma in percentages (`95,1 %`), an exception to `guidelines/data-patterns.md` ruling 8; CHF amounts keep the decimal point | 2026-10-29 | Kept local: French-language Swiss sources write percentages with a comma (Federal Statistical Office, Federal Tax Administration VAT rates) |
