import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LAYER_ROOT } from './support';

// The README ships in the tarball (npm always packs it) and is the consumer contract of
// ADR-0009: how an app takes the layer, what it pins, and what stays the app's own.
const README = join(LAYER_ROOT, 'README.md');

describe('the package README', () => {
  it('exists', () => {
    expect(existsSync(README)).toBe(true);
  });

  const text = existsSync(README) ? readFileSync(README, 'utf8') : '';

  it.each([
    ["the extends line", "extends: ['@medquantis/ui']"],
    ['the exact pin of the layer', '@medquantis/ui'],
    ['the exact pin of the core', '@medquantis/design-system'],
    ['nuxt as a peer', 'peer'],
    ['the wording rule', 'wording'],
    ['the bundled icons', 'icon'],
    ['the content security policy', 'content security policy'],
  ])('states %s', (_name, needle) => {
    expect(text).toContain(needle);
  });

  it('states that both packages are pinned exactly', () => {
    expect(text).toMatch(/exact version/i);
  });

  // The shipped components and helpers, read from the layer, so one that ships undocumented fails here.
  const components = readdirSync(join(LAYER_ROOT, 'app', 'components'))
    .filter((name) => /^Mq\w+\.vue$/.test(name))
    .map((name) => name.replace(/\.vue$/, ''));
  const helpers = [...readFileSync(join(LAYER_ROOT, 'app', 'utils', 'format.ts'), 'utf8').matchAll(/^export function (\w+)/gm)].map(
    (match) => match[1],
  );

  it('reads the shipped components and helpers', () => {
    expect(components.length).toBeGreaterThan(0);
    expect(helpers.length).toBeGreaterThan(0);
  });

  it('no longer says the package carries the theme only', () => {
    expect(text).not.toMatch(/theme only/i);
  });

  it.each(components)('lists the component %s in a table row', (name) => {
    expect(text.split('\n').some((line) => line.startsWith('|') && line.includes(`\`${name}\``))).toBe(true);
  });

  it.each(helpers)('names the helper %s', (name) => {
    expect(text).toContain(`\`${name}\``);
  });

  it.each([
    ['the import path of a component', '@medquantis/ui/app/components/'],
    ['the import path of the helpers', '@medquantis/ui/app/utils/format'],
    ['the auto-import of the layer', 'auto-import'],
    ['the release tag of the package', 'ui-v'],
    ['the exact pin the consumer bumps', 'exact pin'],
  ])('states %s', (_name, needle) => {
    expect(text).toContain(needle);
  });

  it('has no em dash', () => {
    expect(text).not.toContain('—');
  });
});
