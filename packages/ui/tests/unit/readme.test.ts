import { existsSync, readFileSync } from 'node:fs';
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

  it('has no em dash', () => {
    expect(text).not.toContain('—');
  });
});
