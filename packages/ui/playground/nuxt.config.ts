// A Nuxt app that extends the layer alone and shows the themed Nuxt UI components with fictitious
// text: no API, nothing a consumer brings. `nuxi build` renders it on the server; `nuxi generate
// --envName spa` writes it as a static single-page app, the other render mode a consumer may use.
export default defineNuxtConfig({
  extends: ['..'],

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'MedQuantis UI playground',
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
    },
  },

  $env: {
    spa: {
      ssr: false,
      // Hash routes: the static build opens from any folder or host, without server rewrites.
      router: { options: { hashMode: true } },
    },
  },

  devtools: { enabled: false },

  compatibilityDate: '2025-04-01',
});
