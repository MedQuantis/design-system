import { createConfigForNuxt } from '@nuxt/eslint-config';

// The Nuxt flat config without the @nuxt/eslint module, so a consumer that extends the layer
// never needs this package's lint toolchain. The playground is a Nuxt app of its own.
export default createConfigForNuxt({
  dirs: {
    src: ['./app', './playground/app'],
    pages: ['./playground/app/pages'],
    components: ['./app/components', './playground/app/components'],
  },
}).append(
  // The planted offences are there for the guards to find, not to be linted; the rest is output.
  { ignores: ['tests/fixtures/**', '**/.nuxt/**', '**/.output/**', '**/dist/**'] },
  // The table's `selected` model (the picked rows) and its keyboard row share a name; a component
  // moves here as it is, so the rename waits for the app that owns it.
  {
    files: ['app/components/MqDataTable.vue'],
    rules: { 'vue/no-dupe-keys': 'off' },
  },
  {
    rules: {
      'vue/html-self-closing': [
        'warn',
        {
          html: { void: 'always', normal: 'always', component: 'always' },
          svg: 'always',
          math: 'always',
        },
      ],
    },
  },
);
