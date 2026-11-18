# @medquantis/ui

The optional Nuxt layer of the MedQuantis design system: the Nuxt UI 4 theme wired to the design tokens, and the presentation components that MedQuantis review screens share. It is decided by [ADR-0009](https://github.com/MedQuantis/design-system/blob/main/docs/architecture/decisions/adr-0009-optional-vue-component-package.md). The core outputs of `@medquantis/design-system` stay framework-neutral; this package is the only place Vue and Nuxt enter.

It carries the theme (Nuxt UI colours mapped to the design system's scales, the radius steps, the warning variants, light mode, and the icon settings), the components below and the number and date helpers they use. Each component draws a pattern of the design system's [app patterns](https://github.com/MedQuantis/design-system/blob/main/guidelines/app-patterns.md), which say its anatomy, states and tokens.

## Use it in a Nuxt app

Install both packages at an exact version, never a range:

```sh
npm install --save-exact @medquantis/ui@0.4.0 @medquantis/design-system@1.6.0
```

Pin `@medquantis/design-system` at the exact version this package's own `package.json` pins, so the tokens the layer reads are the ones your app loads.

Extend the layer in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  extends: ['@medquantis/ui'],
});
```

`nuxt` is a peer dependency: your app installs it, in the range this package's `peerDependencies` declares. `@nuxt/ui` comes with the layer.

## Components

| Component | Draws | App pattern |
| :-- | :-- | :-- |
| `MqAppNavigation` | The sidebar navigation in groups, with counts, unfolded or folded to a rail | App shell |
| `MqDataTable` | The review table: sortable columns, row selection, keyboard rows, a card per row on phones | Review table |
| `MqSegmentedFilter` | A filter as a segmented control, each segment with its count | Review table |
| `MqFilterSelect` | A filter as a select with its label inside, each option with its count | Review table |
| `MqStatusPill` | An item's state as an outlined tag in its tone, with an optional detail line | Review table |
| `MqReviewWindow` | The decision window: header with queue navigation, two panes with tabs and foldable sections, footer | Decision modal |
| `MqStepper` | A read-only row of steps: where an item stands in its process | Decision modal |
| `MqActionBar` | The acts at the foot of a decision window, a refused act disabled with its reason | Decision modal |
| `MqTimeline` | A decision log, newest first, with filters, foldable lines and the entry in force | History timeline |
| `MqEventTag` | What happened, as a small tag whose mark says how it ended | History timeline |
| `MqTimelineDot` | A timeline's dot, whose shape says who wrote the entry | History timeline |
| `MqLiveDot` | The live dot: what is in force today | History timeline |
| `MqLegend` | The caption under a timeline or a table: each mark with its meaning | History timeline |
| `MqErrorState` | An error card inside the shell: not found, unavailable with a retry and a polite live line, or unexpected with the request id framed beside a copy button | Sign-in, access refused and error pages |

Every label is a prop or a slot. The playground of this package (`playground/`, in the repository, not in the tarball) has one page per component, fed by fictitious data.

**Helpers** (`app/utils/format.ts`), figures and dates as the design system writes them: `formatCount`, `wholeShares`, `formatShare`, `formatShares`, `formatDate`, `formatTime`, `formatDateTime`, `zurichMidnight`, `daysSince`.

## Import a component

In a Nuxt app that extends the layer, every component is auto-imported by its name (`<MqDataTable>`).

The package has no `exports` map, so a component, its types and the helpers are also imported by their path in the package, which resolves the same in plain Vitest, in Nuxt and in the build:

```ts
import MqDataTable, { type MqColumn } from '@medquantis/ui/app/components/MqDataTable.vue';
import { formatCount, formatDate } from '@medquantis/ui/app/utils/format';
```

Each component exports its own types (`MqColumn`, `MqStep`, `MqTimelineEntry` and so on) from its file.

## What the layer guarantees

- **No wording.** The package writes no user-visible string; every label is a prop or a slot, so your app keeps all its wording in its own language.
- **Offline, under a strict content security policy.** Every icon is bundled into your build (`fallbackToApi: false`), and the layer loads no remote font, image, icon or script. It works server-rendered and as a static single-page app.
- **Values from tokens only.** Every colour, font, radius and shadow reads a `--mq-*` token of the pinned design system.

## What stays in your app

Your wording, domain types, routes, data fetching, permissions and domain components. A component enters this package only when two MedQuantis review screens need it.

A component changes here first, never in a copy in your app: the change is released as a new version of this package (tag `ui-vX.Y.Z`), then your app bumps its exact pin.

## Versions

The package follows the semver rule for a component API in ADR-0009 §Package rules, with its own release track (tags `ui-vX.Y.Z`). On 0.x a minor version may break. Version 0.0.0 is a placeholder with no code.
