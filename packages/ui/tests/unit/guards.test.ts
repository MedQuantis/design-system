import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAYER_ROOT, type SourceTree, offendingLines, read, sourceTree } from './support';

// The guards over the layer's source (nuxt.config.ts and app/), ADR-0009 §Package rules: every
// colour, font and shadow comes from the pinned design system, nothing leaves the package at run
// time, and no user-visible string is written here, because the consumer owns its language.
// Each guard runs twice: on the planted fixture under tests/fixtures/planted, where it must find
// what it names, and on the layer, where it must find nothing. Comments count for the value
// guards: a value in a comment is how a stale one survives a migration.

const LAYER = sourceTree(LAYER_ROOT);
const PLANTED = sourceTree(join(LAYER_ROOT, 'tests', 'fixtures', 'planted'));

const SCANNED = /\.(vue|css|ts)$/;

/** A hex (not an HTML entity such as `&#8627;`), or an rgb(a)/hsl(a)/oklch()/hwb()/lab() call. */
const COLOUR_LITERAL = /(?<!&)#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|hwb|lab|lch|color)\(/i;
/** A CSS colour keyword as a value. */
const COLOUR_KEYWORD = /:\s*(?:white|black|red|green|blue|gray|grey)\b/i;
/** A font family or shorthand that names a face instead of reading a token. */
const FONT_LITERAL = /\bfont(?:-family)?\s*:\s*(?!\s|var\(|inherit\b|unset\b)/i;
/** A shadow that is not a token or none. */
const SHADOW_LITERAL = /\b(?:box|text)-shadow\s*:\s*(?!\s|var\(|none\b)/i;
/** Tailwind utilities with an arbitrary value: `bg-[…]`, `shadow-[…]`, `font-[…]`. */
const ARBITRARY_VALUE =
  /\b(?:bg|text|border|ring|fill|stroke|outline|shadow|font|decoration|from|to|via)-\[(?!var\()/;
/** Tailwind's default palette, a set of literals too. */
const PALETTE_UTILITY =
  /\b(?:bg|text|border|ring|decoration|fill|stroke|outline|from|to|via|divide|shadow|caret|placeholder)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|white|black)(?:-\d+)?\b/;
/** An assignment to a design-system property: the release owns every --mq-* name. */
const MQ_ASSIGNMENT = /--mq-[a-z0-9-]+\s*:/;
/** A remote URL. */
const REMOTE_URL = /\bhttps?:/i;

type Guard = (tree: SourceTree) => string[];

const scanned = (tree: SourceTree): string[] => tree.files.filter((path) => SCANNED.test(path));
const lines =
  (...patterns: RegExp[]): Guard =>
  (tree) =>
    scanned(tree).flatMap((path) => patterns.flatMap((p) => offendingLines(tree, path, p)));

/** Every `@import` and `url()` target that is a remote, absolute or outside-the-package path. */
const leavingImports: Guard = (tree) =>
  scanned(tree).flatMap((path) =>
    [...read(tree, path).matchAll(/@import\s+(?:url\()?\s*['"]?([^'")\s;]+)|\burl\(\s*['"]?([^'")\s]+)/g)]
      .map((m) => (m[1] ?? m[2])!)
      .filter((target) => {
        if (target.startsWith('data:') || target.startsWith('#')) return false;
        if (/^[a-z][a-z0-9+.-]*:|^\/\//i.test(target) || target.startsWith('/')) return true;
        if (!target.startsWith('.')) return false; // a bare specifier names a declared dependency
        const to = resolve(tree.root, dirname(path), target);
        return to !== tree.root && !to.startsWith(tree.root + sep);
      })
      .map((target) => `${path}: ${target}`),
  );

/** The template of a single-file component, comments blanked. */
function template(source: string): string {
  const open = source.search(/<template(\s[^>]*)?>/);
  const close = source.lastIndexOf('</template>');
  if (open === -1 || close === -1) return '';
  return source.slice(open, close).replace(/<!--[\s\S]*?-->/g, '');
}

/** An opening or closing tag, read past a `>` inside a quoted attribute such as `v-if="n > 0"`. */
const TAG = /<\/?[A-Za-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/g;

/** A quoted literal holding a character; `' '` between two values writes no word. */
const WORD_LITERAL = /'[^']*\S[^']*'|"[^"]*\S[^"]*"|`[^`]*\S[^`]*`/;

/** The text nodes of a template that hold a word or a quoted literal in a mustache. */
function textNodes(body: string): string[] {
  return body.split(TAG).filter((node) => {
    const outside = node.replace(/\{\{[\s\S]*?\}\}/g, '').trim();
    const literal = [...node.matchAll(/\{\{([\s\S]*?)\}\}/g)].some((m) => WORD_LITERAL.test(m[1]!));
    return outside !== '' || literal;
  });
}

/** A text node or a quoted literal in a mustache: words the consumer should have passed in. */
const templateText: Guard = (tree) =>
  tree.files
    .filter((path) => path.endsWith('.vue'))
    .flatMap((path) => textNodes(template(read(tree, path))).map((node) => `${path}: ${node.trim()}`));

/** A label, title, placeholder or aria-label given a string literal, static or bound. */
const VISIBLE_ATTRIBUTE =
  /(?<![\w:-])(?:label|title|placeholder|aria-label)\s*=\s*"[^"]*\S[^"]*"|:(?:label|title|placeholder|aria-label)\s*=\s*"\s*['`]/;
const visibleAttributes: Guard = (tree) =>
  tree.files
    .filter((path) => path.endsWith('.vue'))
    .flatMap((path) =>
      template(read(tree, path))
        .split('\n')
        .filter((line) => VISIBLE_ATTRIBUTE.test(line))
        .map((line) => `${path}: ${line.trim()}`),
    );

// The components of app/components/ are presentation only: they read their props and the
// package's own helpers, never a consumer's module, a route, the router or a fetch. A word of a
// product's domain is the confidentiality scan's to find (make check, with the deny-list).
const COMPONENTS = 'app/components/';
const ALLOWED_IMPORT = /^(vue|@nuxt\/ui|reka-ui|\.\/Mq\w+\.vue|\.\.\/utils\/format)$/;
const APP_WIRING = /\bnavigateTo\b|\buseFetch\b|\$fetch\b|\buseRoute\b|\buseRouter\b/;
const ROUTE_LITERAL = /['"`]\/[A-Za-z]/;

const blank = (comment: string): string => comment.replace(/[^\n]/g, ' ');
function withoutComments(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:'"`])\/\/.*$/gm, (match, before: string) => before + blank(match.slice(1)));
}

const components = (tree: SourceTree): string[] =>
  tree.files.filter((path) => path.startsWith(COMPONENTS) && path.endsWith('.vue'));

const componentImports: Guard = (tree) =>
  components(tree).flatMap((path) =>
    [...withoutComments(read(tree, path)).matchAll(/\bimport\b[^'"]*['"]([^'"]+)['"]/g)]
      .map((m) => m[1]!)
      .filter((from) => !ALLOWED_IMPORT.test(from))
      .map((from) => `${path}: import from ${from}`),
  );

const componentLines =
  (pattern: RegExp): Guard =>
  (tree) =>
    components(tree).flatMap((path) =>
      withoutComments(read(tree, path))
        .split('\n')
        .flatMap((text, i) => (pattern.test(text) ? [`${path}:${i + 1}: ${text.trim()}`] : [])),
    );

const GUARDS: [string, Guard][] = [
  ['no colour literal or keyword', lines(COLOUR_LITERAL, COLOUR_KEYWORD)],
  ['no font family', lines(FONT_LITERAL)],
  ['no shadow', lines(SHADOW_LITERAL)],
  ['no arbitrary-value or default-palette utility', lines(ARBITRARY_VALUE, PALETTE_UTILITY)],
  ['no assignment to a --mq-* property', lines(MQ_ASSIGNMENT)],
  ['no http: or https: URL', lines(REMOTE_URL)],
  ['no @import or url() that leaves the package', leavingImports],
  ['no text node in a component template', templateText],
  ['no string literal given to label, title, placeholder or aria-label', visibleAttributes],
  ['no component import from outside vue, @nuxt/ui, the components and the helpers', componentImports],
  ['no router, navigation or fetch in a component', componentLines(APP_WIRING)],
  ['no route literal in a component', componentLines(ROUTE_LITERAL)],
];

describe('the guards scan the layer', () => {
  it('reads nuxt.config.ts, the theme and the app config', () => {
    expect(LAYER.files).toContain('nuxt.config.ts');
    expect(LAYER.files).toContain('app/app.config.ts');
    expect(LAYER.files).toContain('app/assets/css/main.css');
  });
});

describe.each(GUARDS)('%s', (_, guard) => {
  it('catches its planted offence', () => {
    expect(guard(PLANTED)).not.toEqual([]);
  });

  it('finds nothing in the layer', () => {
    expect(guard(LAYER)).toEqual([]);
  });
});

describe('a component imports only vue, @nuxt/ui, reka-ui, its siblings and the helpers', () => {
  it.each(['vue', '@nuxt/ui', './MqSibling.vue', '../utils/format'])('%s is allowed', (from) => {
    expect(ALLOWED_IMPORT.test(from)).toBe(true);
  });

  // reka-ui is the primitive library Nuxt UI is built on, pinned as a dependency of the package at
  // the version Nuxt UI requires: a dialog's title comes from it.
  it('reka-ui is allowed, and none of its subpaths', () => {
    expect(ALLOWED_IMPORT.test('reka-ui')).toBe(true);
    expect(ALLOWED_IMPORT.test('reka-ui/internal')).toBe(false);
  });

  it.each(['#app-types', '../utils/wording', '~/composables/useItems', 'reka-ui-extra'])(
    '%s is not',
    (from) => {
      expect(ALLOWED_IMPORT.test(from)).toBe(false);
    },
  );

  it('reads a commented-out route or import as nothing', () => {
    expect(withoutComments("// navigateTo('/inbox')\n<!-- '/inbox' -->").trim()).toBe('');
  });
});

// Each component has a page in the playground, fed by the fictitious fixtures its mounted tests
// use, so it can be looked at before a screen uses it.
const COMPONENT_FILES = components(LAYER).map((path) => basename(path));
const PLAYGROUND_PAGES = join('playground', 'app', 'pages');
const kebab = (name: string): string =>
  name
    .replace(/\.vue$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();

describe('the components', () => {
  it('exist in app/components/, each prefixed Mq', () => {
    expect(COMPONENT_FILES.length).toBeGreaterThan(0);
    for (const name of COMPONENT_FILES) expect(name).toMatch(/^Mq[A-Z]\w+\.vue$/);
  });
});

describe('the playground', () => {
  it.each(COMPONENT_FILES)('has a page for %s', (name) => {
    expect(existsSync(join(LAYER_ROOT, PLAYGROUND_PAGES, `${kebab(name)}.vue`))).toBe(true);
  });

  it.each(COMPONENT_FILES)('feeds the page of %s with the neutral fixtures only', (name) => {
    const page = join(LAYER_ROOT, PLAYGROUND_PAGES, `${kebab(name)}.vue`);
    const source = existsSync(page) ? readFileSync(page, 'utf8') : '';
    expect(source).toMatch(/from '\.\.\/\.\.\/\.\.\/tests\/nuxt\/fixtures\/neutral'/);
    expect(source).not.toMatch(/from '[^']*fixtures\/(?!neutral')/);
  });
});

describe('the template text guard', () => {
  it('reads a > inside a quoted attribute as part of the tag', () => {
    expect(textNodes('<template><b v-if="(n ?? 0) > 0" :label="String(n)" />{{ n }}</template>')).toEqual([]);
  });

  it('finds a word and a quoted literal, not an interpolation', () => {
    expect(textNodes('<template><b>{{ n }}</b><i>Total</i><s>{{ \'Two\' }}</s></template>')).toEqual([
      'Total',
      "{{ 'Two' }}",
    ]);
  });
});

describe('the template text guard, between two values', () => {
  it('reads a literal space as no word', () => {
    expect(textNodes("<template><b>{{ a }}</b>{{ ' '\n}}<i>{{ b }}</i></template>")).toEqual([]);
  });

  it('still finds a literal that holds a character', () => {
    expect(textNodes("<template><b>{{ a }}</b>{{ ' / ' }}<i>{{ b }}</i></template>")).toEqual([
      "{{ ' / ' }}",
    ]);
  });
});

describe('the guard patterns let the tokens through', () => {
  it.each([
    ['font-family: var(--mq-font-family-ui);', FONT_LITERAL],
    ['box-shadow: var(--mq-shadow-small);', SHADOW_LITERAL],
    ['class="bg-(--mq-warning-tint)"', ARBITRARY_VALUE],
    ['class="text-primary"', PALETTE_UTILITY],
    ['<span>&#8627;</span>', COLOUR_LITERAL],
    ['color: var(--mq-ink);', MQ_ASSIGNMENT],
    [':label="props.label"', VISIBLE_ATTRIBUTE],
  ])('%s', (line, pattern) => {
    expect(pattern.test(line)).toBe(false);
  });
});

// Every --mq-* name the layer reads is one the pinned release defines (the stylesheet the theme
// imports and what it imports in turn): an unknown name resolves to nothing, so a colour silently
// disappears instead of failing.
const RELEASE_ENTRY = createRequire(join(LAYER_ROOT, 'package.json')).resolve(
  '@medquantis/design-system/tailwind.css',
);
function definedNames(entry: string, seen = new Set<string>()): Set<string> {
  const names = new Set<string>();
  if (seen.has(entry)) return names;
  seen.add(entry);
  const css = readFileSync(entry, 'utf8');
  for (const m of css.matchAll(/(--mq-[a-z0-9-]+)\s*:/g)) names.add(m[1]!);
  for (const m of css.matchAll(/@import\s+["'](\.[^"']+)["']/g))
    for (const name of definedNames(join(dirname(entry), m[1]!), seen)) names.add(name);
  return names;
}
const RELEASE_NAMES = definedNames(RELEASE_ENTRY);

describe('every --mq-* name read is one the release defines', () => {
  it('reads the release names', () => {
    expect(RELEASE_NAMES.has('--mq-ink')).toBe(true);
    expect(RELEASE_NAMES.has('--mq-error')).toBe(false);
  });

  it.each(scanned(LAYER))('%s reads no name the release lacks', (path) => {
    const names = [...new Set(read(LAYER, path).match(/--mq-[a-z0-9-]*[a-z0-9]/g) ?? [])];
    expect(names.filter((name) => !RELEASE_NAMES.has(name)).map((n) => `${relative('.', path)}: ${n}`)).toEqual([]);
  });
});

describe('the theme', () => {
  it('loads Tailwind, Nuxt UI, then the release and its fonts', () => {
    const imports = [...read(LAYER, 'app/assets/css/main.css').matchAll(/@import\s+['"]([^'"]+)['"]/g)].map(
      (m) => m[1],
    );
    expect(imports).toEqual([
      'tailwindcss',
      '@nuxt/ui',
      '@medquantis/design-system/tailwind.css',
      '@medquantis/design-system/fonts.css',
    ]);
  });
});
