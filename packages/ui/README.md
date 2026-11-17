# @medquantis/ui

The optional Nuxt layer of the MedQuantis design system: the Nuxt UI 4 theme wired to the design tokens, and, in later versions, the presentation components that MedQuantis review screens share. It is decided by [ADR-0009](https://github.com/MedQuantis/design-system/blob/main/docs/architecture/decisions/adr-0009-optional-vue-component-package.md). The core outputs of `@medquantis/design-system` stay framework-neutral; this package is the only place Vue and Nuxt enter.

Version 0.1.0 carries the theme only: Nuxt UI colours mapped to the design system's scales, the radius steps, the warning variants, light mode, and the icon settings.

## Use it in a Nuxt app

Install both packages at an exact version, never a range:

```sh
npm install --save-exact @medquantis/ui@0.1.0 @medquantis/design-system@1.6.0
```

Pin `@medquantis/design-system` at the exact version this package's own `package.json` pins, so the tokens the layer reads are the ones your app loads.

Extend the layer in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  extends: ['@medquantis/ui'],
});
```

`nuxt` is a peer dependency: your app installs it, in the range this package's `peerDependencies` declares. `@nuxt/ui` comes with the layer.

## What the layer guarantees

- **No wording.** The package writes no user-visible string; every label is a prop or a slot, so your app keeps all its wording in its own language.
- **Offline, under a strict content security policy.** Every icon is bundled into your build (`fallbackToApi: false`), and the layer loads no remote font, image, icon or script. It works server-rendered and as a static single-page app.
- **Values from tokens only.** Every colour, font, radius and shadow reads a `--mq-*` token of the pinned design system.

## What stays in your app

Your wording, domain types, routes, data fetching, permissions and domain components. A component enters this package only when two MedQuantis review screens need it.

## Versions

The package follows the semver rule for a component API in ADR-0009 §Package rules, with its own release track (tags `ui-vX.Y.Z`). On 0.x a minor version may break. Version 0.0.0 is a placeholder with no code.
