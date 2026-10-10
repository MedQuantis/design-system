import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import postcss from "postcss";
import stylelint from "stylelint";

const root = fileURLToPath(new URL("../..", import.meta.url));
const css = (file) => join(root, "css", file);

// Each file owns one layer; documents load the first four, apps add app.css (ADR-0004).
const FILES = { "base.css": "mq.base", "components.css": "mq.components", "slide.css": "mq.slide", "print.css": "mq.print", "app.css": "mq.app" };
const DOCUMENT_FILES = ["base.css", "components.css", "slide.css", "print.css"];
const STATUS = /--mq-(success|warning|danger|info)\b|--mq-warning-(fill|tint)\b/;

const readCss = (file) => {
  assert.ok(existsSync(css(file)), `css/${file} is missing`);
  return readFileSync(css(file), "utf8");
};
const parse = (file) => postcss.parse(readCss(file), { from: css(file) });
const tokens = () => {
  const path = join(root, "dist/tokens.css");
  assert.ok(existsSync(path), "dist/tokens.css is missing: run make build first");
  return new Set([...readFileSync(path, "utf8").matchAll(/(--mq-[\w-]+)\s*:/g)].map((m) => m[1]));
};
const loadConfig = async () => (await import("../../stylelint.config.mjs")).default;

const lint = async (code) => {
  const { results } = await stylelint.lint({ code, codeFilename: join(root, "css/probe.css"), config: await loadConfig() });
  return results[0].warnings.map((warning) => warning.rule);
};

const layerName = (node) => {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "atrule" && parent.name === "layer") return parent.params.trim();
  }
  return null;
};

// Splits a selector list on top-level commas only.
const selectorList = (selector) => {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of selector) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  return [...parts, current.trim()];
};
const isWhere = (selector) => {
  if (!selector.startsWith(":where(")) return false;
  let depth = 0;
  for (let i = 0; i < selector.length; i += 1) {
    if (selector[i] === "(") depth += 1;
    if (selector[i] === ")" && (depth -= 1) === 0) return i === selector.length - 1;
  }
  return false;
};
const classes = (file) => new Set([...readCss(file).matchAll(/\.(mq-[a-z0-9-]+|is-[a-z0-9-]+)/g)].map((m) => m[1]));

test("stylelint is pinned exactly with both plugins", () => {
  const { devDependencies } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(devDependencies.stylelint, "17.16.0");
  assert.equal(devDependencies["stylelint-declaration-strict-value"], "1.12.1");
  assert.equal(devDependencies["stylelint-value-no-unknown-custom-properties"], "6.1.1");
});

test("the stylelint config is exported as @medquantis/design-system/stylelint", async () => {
  const { exports } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(exports?.["./stylelint"], "./stylelint.config.mjs");
  const exported = (await import("@medquantis/design-system/stylelint")).default;
  assert.equal(exported, await loadConfig());
  assert.deepEqual(exported.ignoreFiles, ["**/tokens/**", "**/dist/**"]);
});

test("stylelint rejects colours that are not tokens", async () => {
  assert.ok((await lint(".a { color: #0a2463; }")).includes("color-no-hex"));
  assert.ok((await lint(".a { color: navy; }")).includes("color-named"));
  assert.ok((await lint(".a { color: rgb(10 36 99); }")).includes("function-disallowed-list"));
  assert.ok((await lint(".a { background: color-mix(in srgb, var(--mq-accent) 50%, white); }")).includes("function-disallowed-list"));
  assert.ok((await lint(".a { background: linear-gradient(#0a2463, #0a2047); }")).includes("color-no-hex"));
  assert.ok((await lint(".a { border-color: var(--mq-accent, #0a2463); }")).includes("color-no-hex"));
  assert.ok((await lint(".a { color: inherit; fill: blue; }")).length > 0, "a named fill passes");
});

test("stylelint rejects !important, literal fonts and shadows, and undefined custom properties", async () => {
  assert.deepEqual(await lint(".a { color: var(--mq-ink) !important; }"), ["declaration-no-important"]);
  assert.deepEqual(await lint(".a { font-size: 13px; }"), ["scale-unlimited/declaration-strict-value"]);
  assert.deepEqual(await lint(".a { font-family: Arial; }"), ["scale-unlimited/declaration-strict-value"]);
  assert.deepEqual(await lint(".a { box-shadow: 0 1px 2px black; }").then((rules) => rules.filter((r) => r !== "color-named")), ["scale-unlimited/declaration-strict-value"]);
  assert.deepEqual(await lint(".a { color: var(--mq-not-a-token); }"), ["csstools/value-no-unknown-custom-properties"]);
});

test("stylelint rejects every radius that is not a radius token, so no pill can be drawn (owner ruling 3)", async () => {
  for (const value of ["4px", "999px", "9999px", "50%", "100vh", "calc(var(--mq-radius-medium) * 100)", "var(--deck-pill)", "var(--mq-space-8)"]) {
    assert.ok((await lint(`.a { border-radius: ${value}; }`)).includes("declaration-property-value-allowed-list"), `border-radius: ${value} passes`);
  }
  assert.deepEqual(await lint(".a { border-top-left-radius: 20px; }"), ["declaration-property-value-allowed-list"]);
  assert.deepEqual(await lint(".a { padding: 13px; }"), ["declaration-property-value-allowed-list"]);
});

test("stylelint accepts token-only CSS", async () => {
  const clean = [
    "@layer mq.components {",
    "  :where(.a) {",
    "    color: var(--mq-ink);",
    "    background: linear-gradient(160deg, var(--mq-panel-start), var(--mq-panel-end));",
    "    border: var(--mq-stroke-hairline) solid var(--mq-border);",
    "    border-radius: var(--mq-radius-small) var(--mq-radius-small) 0 0;",
    "    padding: var(--mq-space-2) var(--mq-space-3);",
    "    margin: 0 auto;",
    "    font: inherit;",
    "    font-size: var(--mq-font-size-label);",
    "    box-shadow: var(--mq-shadow-small);",
    "    fill: currentColor;",
    "    background-color: transparent;",
    "  }",
    "}",
  ].join("\n");
  assert.deepEqual(await lint(clean), []);
});

test("css/ holds base, components, slide, print and app, each in its own mq layer", () => {
  for (const [file, layer] of Object.entries(FILES)) {
    const tree = parse(file);
    const blocks = [];
    tree.walkAtRules("layer", (rule) => {
      if (rule.nodes) blocks.push(rule.params.trim());
    });
    assert.deepEqual([...new Set(blocks)], [layer], `css/${file} must wrap its rules in @layer ${layer}`);
    tree.walkRules((rule) => {
      if (rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
      assert.equal(layerName(rule), layer, `css/${file}: ${rule.selector} is outside @layer ${layer}`);
    });
    tree.walkAtRules((rule) => {
      if (rule.name === "layer" && !rule.nodes) {
        assert.equal(rule.params.replace(/\s+/g, " "), "mq.base, mq.components, mq.slide, mq.print, mq.app", `css/${file}: layer order statement`);
      }
      if (rule.name === "page") assert.equal(layerName(rule), layer, `css/${file}: @page outside @layer ${layer}`);
    });
  }
});

test("every selector in css/ sits inside :where()", () => {
  for (const file of Object.keys(FILES)) {
    parse(file).walkRules((rule) => {
      for (const selector of selectorList(rule.selector)) assert.ok(isWhere(selector), `css/${file}: ${selector} is not wrapped in :where()`);
    });
  }
});

test("css/ uses only defined --mq- custom properties and declares none of its own", () => {
  const defined = tokens();
  for (const file of Object.keys(FILES)) {
    const tree = parse(file);
    tree.walkDecls((decl) => {
      assert.ok(!decl.prop.startsWith("--"), `css/${file} declares ${decl.prop}; values belong in tokens/`);
      for (const [, name] of decl.value.matchAll(/var\(\s*(--[\w-]+)/g)) {
        assert.ok(name.startsWith("--mq-"), `css/${file}: ${name} is not an --mq- token`);
        assert.ok(defined.has(name), `css/${file}: ${name} is not defined in dist/tokens.css`);
      }
    });
  }
});

test("css/ names no core token, so consumers see only semantic names", () => {
  for (const file of Object.keys(FILES)) assert.doesNotMatch(readCss(file), /--mq-core-/, `css/${file} uses a core token`);
});

test("document CSS reaches no status colour; status badges live in app.css (ADR-0004)", () => {
  for (const file of DOCUMENT_FILES) {
    const text = readCss(file);
    assert.doesNotMatch(text, STATUS, `css/${file} references a status colour`);
    assert.doesNotMatch(text, /@import/, `css/${file} must not import another sheet`);
    assert.doesNotMatch(text, /\.is-(success|warning|danger|info)\b/, `css/${file} defines a status variant`);
  }
  const app = readCss("app.css");
  for (const status of ["success", "warning", "danger", "info"]) {
    assert.match(app, new RegExp(`\\.is-${status}\\b`), `app.css has no ${status} badge`);
    assert.match(app, new RegExp(`var\\(--mq-${status}\\)`), `app.css does not use --mq-${status}`);
  }
  assert.match(app, /var\(--mq-warning-fill\)/, "the filled warning badge uses the fill token (owner ruling 5)");
});

test("component CSS uses only the 3 and 6 px radii; the 12 px overlay is for app dialogs", () => {
  for (const file of Object.keys(FILES)) {
    const radii = [...readCss(file).matchAll(/var\((--mq-radius-[\w-]+)\)/g)].map((m) => m[1]);
    for (const name of radii) assert.match(name, /^--mq-radius-(small|medium)$/, `css/${file} uses ${name}`);
  }
});

test("components.css defines the report components rewritten from tokens", () => {
  const defined = classes("components.css");
  const expected = [
    "mq-card", "mq-card-title", "mq-card-body",
    "mq-panel", "mq-panel-kicker", "mq-panel-title", "mq-panel-text", "mq-panel-icon",
    "mq-kpis", "mq-kpi", "mq-kpi-label", "mq-kpi-value", "mq-kpi-caption", "is-navy", "is-pale",
    "mq-table", "mq-num", "is-key", "is-highlight", "is-total",
    "mq-badge", "is-solid", "is-ring", "is-pale", "is-outline", "is-quiet", "is-dashed",
    "mq-callout", "mq-callout-title",
    "mq-progress", "mq-progress-label", "mq-progress-track", "mq-progress-fill", "mq-progress-value",
    "mq-distribution", "mq-segment", "is-1", "is-2", "is-3", "is-4", "is-rest",
    "mq-legend", "mq-legend-item", "mq-swatch",
    "mq-takeaway", "mq-foot",
  ];
  for (const name of expected) assert.ok(defined.has(name), `components.css lacks .${name}`);
});

test("base.css defines the typography roles", () => {
  const defined = classes("base.css");
  for (const name of ["mq-doc", "mq-wrap", "mq-eyebrow", "mq-display", "mq-title", "mq-subtitle", "mq-lead", "mq-prose", "mq-label", "mq-note", "mq-mono", "mq-figure", "mq-em"]) {
    assert.ok(defined.has(name), `base.css lacks .${name}`);
  }
});

test("slide.css draws the 1280 x 720 canvas with section label, title and number", () => {
  const text = readCss("slide.css");
  for (const name of ["mq-slide", "mq-slide-label", "mq-slide-title", "mq-slide-body", "mq-slide-number"]) {
    assert.ok(classes("slide.css").has(name), `slide.css lacks .${name}`);
  }
  assert.match(text, /width:\s*var\(--mq-slide-width\)/);
  assert.match(text, /height:\s*var\(--mq-slide-height\)/);
  const built = readFileSync(join(root, "dist/tokens.css"), "utf8");
  assert.match(built, /--mq-slide-width: 1280px;/);
  assert.match(built, /--mq-slide-height: 720px;/);
  // @page cannot read custom properties, so the print size is restated and checked here.
  assert.match(text, /@page mq-slide\s*\{[^}]*size:\s*1280px 720px;[^}]*margin:\s*0;/);
});

test("print.css sets A4 pages with exact colour printing", () => {
  const text = readCss("print.css");
  assert.match(text, /@page mq-a4\s*\{[^}]*size:\s*A4;/);
  assert.match(text, /print-color-adjust:\s*exact;/);
  assert.match(text, /page:\s*mq-a4;/);
  assert.ok(classes("print.css").has("mq-page"));
});

test("make lint runs stylelint on css/ and make check includes it", () => {
  const makefile = readFileSync(join(root, "Makefile"), "utf8");
  const recipe = makefile.match(/^lint:[^\n]*\n((?:\t[^\n]*\n)+)/m)?.[1] ?? "";
  assert.match(recipe, /stylelint[^\n]*"css\/\*\*\/\*\.css"/, "make lint does not run stylelint on css/");
  assert.match(makefile, /^check:[^\n]*\blint\b/m);
});

test("README says which consumers load the mq- component CSS", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  assert.match(readme, /build-less/i);
  assert.match(readme, /component librar(y|ies)[^.]*tokens[^.]*Tailwind theme only/i);
});

test("base.css draws the focus ring from the focus tokens, and components.css turns it white on navy", () => {
  const focusRules = (file) => {
    const found = [];
    parse(file).walkRules((rule) => {
      if (rule.selector.includes(":focus-visible")) found.push(rule);
    });
    return found;
  };
  const decls = (rules) => Object.fromEntries(rules.flatMap((rule) => rule.nodes.filter((node) => node.type === "decl").map((decl) => [decl.prop, decl.value])));
  const base = decls(focusRules("base.css"));
  assert.match(base.outline ?? "", /var\(--mq-focus-ring-width\) solid var\(--mq-focus-ring-color\)/, "base.css has no focus ring on light backgrounds");
  assert.equal(base["outline-offset"], "var(--mq-focus-ring-offset)");
  const navy = focusRules("components.css");
  assert.ok(navy.some((rule) => rule.selector.includes(".mq-panel")), "no focus rule inside the navy panel");
  assert.equal(decls(navy)["outline-color"], "var(--mq-focus-ring-color-on-navy)");
});
