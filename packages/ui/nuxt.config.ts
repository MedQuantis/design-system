import { fileURLToPath } from 'node:url';

// A layer's own files are named from the layer, never through `~`, which resolves to the app that
// extends it.
const mainCss = fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url));

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: [mainCss],

  // Light only: the design system's dark theme is not imported, so the colour-mode module stays
  // off and never writes `.dark` on <html>.
  ui: {
    colorMode: false,
  },

  // Every icon ships in the bundle: a consumer's content security policy may block the Iconify
  // API, and the layer works offline.
  icon: {
    fallbackToApi: false,
    clientBundle: {
      // The default scan skips .ts files, where a consumer may name its icons.
      scan: { globInclude: ['**/*.{vue,ts,jsx,tsx,md,mdc,mdx,yml,yaml}'] },
    },
    serverBundle: 'local',
  },

  devtools: { enabled: false },

  compatibilityDate: '2025-04-01',
});
