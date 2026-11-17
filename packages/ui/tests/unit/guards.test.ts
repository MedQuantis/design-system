import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve, sep } from 'node:path';
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

/** A text node or a quoted literal in a mustache: words the consumer should have passed in. */
const templateText: Guard = (tree) =>
  tree.files
    .filter((path) => path.endsWith('.vue'))
    .flatMap((path) => {
      const body = template(read(tree, path)).replace(/^<template[^>]*>/, '');
      const text = [...body.matchAll(/>([^<]+)</g)]
        .map((m) => m[1]!)
        .filter((node) => {
          const outside = node.replace(/\{\{[\s\S]*?\}\}/g, '').trim();
          const literal = [...node.matchAll(/\{\{([\s\S]*?)\}\}/g)].some((m) => /['"`]/.test(m[1]!));
          return outside !== '' || literal;
        });
      return text.map((node) => `${path}: ${node.trim()}`);
    });

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
