// The themes tier (ADR-0002, ADR-0007): the dark theme re-values existing semantic roles under
// .dark, in its own files; tokens.css keeps only the light values.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const themeDir = join(root, "tokens/themes/dark");
const darkCss = join(root, "dist/themes/dark.css");
const darkJson = join(root, "dist/themes/dark.json");

const readDist = (file) => {
  assert.ok(existsSync(file), `${relative(root, file)} is missing: run make build first`);
  return readFileSync(file, "utf8");
};

// Walks a DTCG tree and yields every token path.
function* walk(node, path = []) {
  if ("$value" in node) {
    yield path;
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith("$") && child && typeof child === "object") yield* walk(child, [...path, key]);
  }
}

const themePaths = () => {
  assert.ok(existsSync(themeDir), "tokens/themes/dark/ is missing");
  const files = readdirSync(themeDir).filter((name) => name.endsWith(".tokens.json"));
  assert.ok(files.length > 0, "no tokens/themes/dark/*.tokens.json");
  return files.flatMap((file) => [...walk(JSON.parse(readFileSync(join(themeDir, file), "utf8")))].map((path) => path.join(".")));
};

const darkTokens = () => JSON.parse(readDist(darkJson));
const lightTokens = () => JSON.parse(readDist(join(root, "dist/tokens.json")));

// The CSS declarations of the one .dark block, in order.
const darkBlock = () => {
  const css = readDist(darkCss).replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  assert.equal(blocks.length, 1, "dist/themes/dark.css must hold exactly one rule block");
  assert.equal(blocks[0][1].trim(), ".dark", "the one block must be .dark");
  return Object.fromEntries(
    blocks[0][2]
      .split(";")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const at = line.indexOf(":");
        return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
      }),
  );
};

// ADR-0007 "Values", "Status colours on dark" and "Charts on dark", with the owner rulings of
// 2026-10-17 on the on-navy tier, plus the two new roles and the deprecated aliases of tertiary
// and of the on-navy accent, which follow their targets by definition.
const ADR_0007 = {
  "--mq-canvas": "#11161f",
  "--mq-surface": "#1a2131",
  "--mq-surface-alt": "#141a26",
  "--mq-desk": "#0b0f16",
  "--mq-border": "rgba(255, 255, 255, 0.14)",
  "--mq-border-light": "rgba(255, 255, 255, 0.1)",
  "--mq-border-strong": "#8795b3",
  "--mq-ink": "#f5f4f1",
  "--mq-muted": "#c3cbdc",
  "--mq-tertiary": "#8f98aa",
  "--mq-dim": "#8f98aa",
  "--mq-decoration": "#6b7385",
  "--mq-accent": "#6f88c9",
  "--mq-accent-hover": "#8aa0d6",
  "--mq-on-accent": "#11161f",
  "--mq-accent-pale": "rgba(111, 136, 201, 0.18)",
  "--mq-accent-pale-2": "rgba(111, 136, 201, 0.1)",
  "--mq-accent-highlight": "#9fb3e8",
  "--mq-focus-ring-color": "#9fb3e8",
  "--mq-panel-start": "#2f4c8f",
  "--mq-panel-end": "#0f2a5e",
  "--mq-on-navy-accent": "#b2c2ed",
  "--mq-on-navy-discreet": "rgba(255, 255, 255, 0.5)",
  "--mq-accent-on-dark": "#b2c2ed",
  "--mq-shadow-panel": "0px 0px 0px 1px rgba(159, 179, 232, 0.35)",
  "--mq-success": "#6fbf73",
  "--mq-warning": "#e0a040",
  "--mq-danger": "#ff6b6b",
  "--mq-info": "#64a8f0",
  "--mq-warning-fill": "#d4850a",
  "--mq-warning-tint": "rgba(212, 133, 10, 0.16)",
  "--mq-on-warning-fill": "#11161f",
  "--mq-chart-series-1": "#9fb3e8",
  "--mq-chart-series-2": "#6f88c9",
  "--mq-chart-series-3": "#5d6f91",
  "--mq-chart-series-4": "#3a4560",
  "--mq-chart-rest": "#232b3d",
  "--mq-chart-axis": "#6b7385",
  "--mq-chart-baseline": "rgba(255, 255, 255, 0.1)",
};

test("dist/themes/dark.css is one .dark block holding exactly the roles tokens/themes/dark/ re-values", () => {
  const declared = darkBlock();
  const dark = darkTokens();
  const byPath = new Map(Object.entries(dark).map(([name, token]) => [token.path.join("."), name]));
  const paths = themePaths();
  assert.deepEqual([...byPath.keys()].sort(), [...paths].sort(), "dark.json names a role the theme files do not, or misses one");
  assert.deepEqual(Object.keys(declared).sort(), Object.keys(dark).sort(), "dark.css and dark.json name different roles");
  for (const [name, token] of Object.entries(dark)) assert.equal(declared[name], String(token.value), `${name} differs between dark.css and dark.json`);
});

test("every role of the dark theme is an existing light role, and none is new to it", () => {
  const light = lightTokens();
  for (const [name, token] of Object.entries(darkTokens())) {
    assert.ok(light[name], `${name} is not a light role`);
    assert.deepEqual(token.path, light[name].path, `${name} sits at another path than its light role`);
  }
});

test("the dark values are those of ADR-0007", () => {
  const dark = darkTokens();
  assert.deepEqual(Object.keys(dark).sort(), Object.keys(ADR_0007).sort(), "the dark theme re-values another set of roles than ADR-0007");
  for (const [name, expected] of Object.entries(ADR_0007)) assert.equal(dark[name].value, expected, name);
});

test("dist/tokens.css stays light: no .dark selector and none of the dark raw values", () => {
  const css = readDist(join(root, "dist/tokens.css"));
  assert.doesNotMatch(css, /\.dark\b/);
  assert.doesNotMatch(css, /#11161f|#6f88c9|#9fb3e8/i, "a dark-only core value leaked into the light tokens");
});

test("a light role that aliases a re-valued role is re-valued with it", () => {
  const paths = new Set(themePaths());
  const semanticDir = join(root, "tokens/semantic");
  for (const file of readdirSync(semanticDir).filter((name) => name.endsWith(".tokens.json"))) {
    const tree = JSON.parse(readFileSync(join(semanticDir, file), "utf8"));
    for (const path of walk(tree)) {
      const token = path.reduce((node, key) => node[key], tree);
      const target = String(token.$value).match(/^\{(semantic\.[^{}]+)\}$/)?.[1];
      if (target && paths.has(target)) assert.ok(paths.has(path.join(".")), `${path.join(".")} aliases ${target}, which the dark theme re-values, but keeps its light value`);
    }
  }
});
