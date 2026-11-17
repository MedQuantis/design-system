import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const LAYER_ROOT = join(import.meta.dirname, '..', '..');

/** A tree laid out as the layer is: `nuxt.config.ts` and `app/`. */
export interface SourceTree {
  root: string;
  files: string[];
}

/** The layer's own sources under `root`: `nuxt.config.ts` and every file under `app/`. */
export function sourceTree(root: string): SourceTree {
  const files: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (!name.endsWith('.d.ts')) files.push(relative(root, path));
    }
  };
  if (existsSync(join(root, 'nuxt.config.ts'))) files.push('nuxt.config.ts');
  if (existsSync(join(root, 'app'))) walk(join(root, 'app'));
  return { root, files: files.sort() };
}

export function read(tree: SourceTree, path: string): string {
  return readFileSync(join(tree.root, path), 'utf8');
}

/** Lines of `path` that match `pattern`, as `path:line: text`. */
export function offendingLines(tree: SourceTree, path: string, pattern: RegExp): string[] {
  return read(tree, path)
    .split('\n')
    .flatMap((text, i) => (pattern.test(text) ? [`${path}:${i + 1}: ${text.trim()}`] : []));
}
