// The homemade-claude-kit modular contract (2.0.0): dist/kit/<module>.css, dist/kit/guidance.md and
// the root kit-manifest.json, checked against the contract files vendored from the kit
// (tests/fixtures/kit-contract/, Plan-0002 Principle 4). make kit-check runs the real kit resolver.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import postcss from "postcss";
import { contrastRatio, parseColor } from "../../build/color-math.mjs";
import { readGuideline, unlinkRelative } from "../../build/guidelines.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => {
  assert.ok(existsSync(join(root, path)), `${path} is missing: run make build first`);
  return readFileSync(join(root, path), "utf8");
};
const readJson = (path) => JSON.parse(read(path));

const contract = () => readJson("tests/fixtures/kit-contract/modules.json");
const manifest = () => readJson("kit-manifest.json");
const pkg = () => readJson("package.json");

const TOKEN_MODULES = ["core", "dataviz", "type", "space-shape", "brand"];
// The class modules: roles from the kit tier, class rules written by hand in css/kit/ (Plan-0002
// increment 02, owner decision 4).
const CLASS_MODULES = ["document", "slide-frame", "print"];
const MODULES = [...TOKEN_MODULES, ...CLASS_MODULES];
const PROVIDED = [...MODULES, "guidance"];
// The roles a class module may read. com-release-note inlines only core, dataviz and print in the
// report (render_pdf.py REPORT_MODULES), so the print rules read no type or space-shape role.
const READS = {
  document: ["core", "type", "space-shape", "dataviz", "document"],
  "slide-frame": ["core", "type", "space-shape", "dataviz", "slide-frame"],
  print: ["core", "dataviz", "print"],
};
const AA = 4.5;

// Custom properties declared outside @font-face, last declaration wins (as the kit reads them).
const declarations = (css) =>
  new Map([...css.replace(/@font-face\s*\{[^}]*\}/g, "").matchAll(/(--[\w-]+)\s*:\s*([^;}]+);/g)].map((m) => [m[1], m[2].trim()]));
const fontFaces = (css) => [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map(([rule]) => rule);
const moduleCss = (module) => read(`dist/kit/${module}.css`);

// The kit tier: tokens/kit/*.tokens.json, one group per module under kit.<module>.
function* walk(node, path = [], type) {
  const inherited = node.$type ?? type;
  if ("$value" in node || "$extensions" in node) {
    yield { path, token: node, type: inherited };
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith("$") && child && typeof child === "object") yield* walk(child, [...path, key], inherited);
  }
}
const kitTier = () => {
  const dir = join(root, "tokens/kit");
  const entries = readdirSync(dir)
    .filter((name) => name.endsWith(".tokens.json"))
    .flatMap((name) => [...walk(JSON.parse(readFileSync(join(dir, name), "utf8")))]);
  return entries.map((entry) => ({ ...entry, module: entry.path[1], role: `--${entry.path.at(-1)}` }));
};
const builtByPath = () => new Map(Object.values(readJson("dist/tokens.json")).map((token) => [token.path.join("."), token]));

// Package export lookup, exact or through one * pattern, as the kit's _export_path does.
const exportTarget = (exports, key) => {
  if (typeof exports[key] === "string") return exports[key];
  for (const [pattern, value] of Object.entries(exports)) {
    if (!pattern.includes("*")) continue;
    const [head, tail] = pattern.split("*");
    if (key.startsWith(head) && key.endsWith(tail) && key.length >= head.length + tail.length) {
      return value.replace("*", key.slice(head.length, key.length - tail.length));
    }
  }
  return undefined;
};

let packed;
const tarball = () => {
  if (packed) return packed;
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  packed = JSON.parse(result.stdout)[0].files.map((file) => file.path);
  return packed;
};

test("the vendored kit contract is 2.0.0 from homemade-claude-kit eb04989", () => {
  assert.equal(contract().contractVersion, "2.0.0");
  const readme = read("tests/fixtures/kit-contract/README.md");
  for (const fact of ["homemade-claude-kit", "eb04989", "plugins/delivery-comms/contract/", "2.0.0"]) {
    assert.ok(readme.includes(fact), `tests/fixtures/kit-contract/README.md does not name ${fact}`);
  }
});

for (const module of MODULES) {
  test(`dist/kit/${module}.css defines exactly the ${module} roles of the contract, never a --kit-* property`, () => {
    const declared = declarations(moduleCss(module));
    const roles = Object.keys(contract().modules[module].roles);
    assert.deepEqual([...declared.keys()].sort(), [...roles].sort());
    for (const name of declared.keys()) assert.doesNotMatch(name, /^--kit-/, `${name}: --kit-* belongs to the kit`);
    for (const [name, value] of declared) {
      assert.ok(value.length > 0, `${name} is empty`);
      assert.doesNotMatch(value, /var\(/, `${name}: kit modules hold literal values`);
    }
  });
}

test("every role of a provided module is a token of the kit tier, under its own module", () => {
  const tier = kitTier();
  for (const module of MODULES) {
    const own = tier.filter((entry) => entry.module === module).map((entry) => entry.role);
    assert.deepEqual([...own].sort(), Object.keys(contract().modules[module].roles).sort(), `tokens/kit kit.${module}`);
  }
  const modules = new Set(tier.map((entry) => entry.module));
  assert.deepEqual([...modules].sort(), [...MODULES].sort(), "the kit tier holds one group per module");
});

// A string value may hold several aliases (the print margin): each {reference} is a semantic token,
// and the module value is the string with every reference replaced by that token's value.
test("kit tier aliases point at semantic tokens, and each module value equals the aliased tokens", () => {
  const byPath = builtByPath();
  for (const { module, role, token, path } of kitTier()) {
    if (typeof token.$value !== "string" || !token.$value.includes("{")) continue;
    const expected = token.$value.replace(/\{([^{}]+)\}/g, (_, alias) => {
      assert.match(alias, /^semantic\./, `${path.join(".")} aliases ${alias}, not a semantic token`);
      const target = byPath.get(alias);
      assert.ok(target, `${path.join(".")} aliases ${alias}, which is not in dist/tokens.json`);
      return String(target.value);
    });
    assert.equal(declarations(moduleCss(module)).get(role), expected, `${role} in dist/kit/${module}.css`);
  }
});

test("core and dataviz values equal dist/kit-contract.css where both define a role", () => {
  const legacy = declarations(read("dist/kit-contract.css"));
  let shared = 0;
  for (const module of ["core", "dataviz"]) {
    for (const [name, value] of declarations(moduleCss(module))) {
      if (!legacy.has(name)) continue;
      shared += 1;
      assert.equal(value, legacy.get(name), `${name} differs from dist/kit-contract.css`);
    }
  }
  assert.equal(shared, 24, "the 24 core roles of kit-contract.css");
});

test("core carries the same embedded font faces as dist/kit-contract.css", () => {
  const faces = fontFaces(moduleCss("core"));
  assert.ok(faces.length >= 3, "core.css embeds no font face");
  assert.deepEqual(faces, fontFaces(read("dist/kit-contract.css")));
  for (const face of faces) assert.match(face, /url\(data:font\/woff2;base64,/, "faces travel as data, the kit inlines the module elsewhere");
});

test("dataviz maps the chart roles by name, citing guidelines/charts.md", () => {
  const byRole = new Map(kitTier().filter((entry) => entry.module === "dataviz").map((entry) => [entry.role, entry.token]));
  const expected = {
    "--chart-1": "{semantic.chart.series.1}",
    "--chart-2": "{semantic.chart.series.2}",
    "--chart-3": "{semantic.chart.series.3}",
    "--chart-4": "{semantic.chart.series.4}",
    "--chart-rest": "{semantic.chart.rest}",
    "--chart-axis": "{semantic.chart.axis}",
    "--chart-grid": "{semantic.chart.baseline}",
    "--chart-highlight": "{semantic.chart.series.1}",
  };
  for (const [role, alias] of Object.entries(expected)) {
    assert.equal(byRole.get(role)?.$value, alias, role);
    assert.match(byRole.get(role).$description, /guidelines\/charts\.md/, `${role} $description cites guidelines/charts.md`);
  }
  const css = declarations(moduleCss("dataviz"));
  assert.equal(css.get("--chart-axis"), "#8c8c8c");
  assert.equal(css.get("--chart-grid"), "#dddbd6");
});

test("type and space-shape: line heights from base.css, hairline border, no pill", () => {
  const type = declarations(moduleCss("type"));
  assert.equal(type.get("--line-height-body"), "1.55");
  assert.equal(type.get("--line-height-tight"), "1.15");
  const shape = declarations(moduleCss("space-shape"));
  assert.equal(shape.get("--border-width"), "1px");
  assert.equal(shape.get("--radius-pill"), "6px", "owner ruling 3: the 6 px maximum, no pill shapes");
  const pill = kitTier().find((entry) => entry.role === "--radius-pill");
  assert.match(pill.token.$description, /Owner ruling 3/);
  const core = new Set(Object.keys(contract().modules.core.roles));
  for (const module of ["type", "space-shape"]) {
    for (const name of declarations(moduleCss(module)).keys()) assert.ok(!core.has(name), `${module} redefines core role ${name}`);
  }
});

test("css/base.css reads the line-height tokens instead of the literals 1.55 and 1.15", () => {
  const css = read("css/base.css");
  const tokens = readJson("dist/tokens.json");
  const names = Object.entries(tokens)
    .filter(([, token]) => token.path[0] === "semantic" && token.path.includes("line-height"))
    .map(([name, token]) => [token.path.at(-1), name, token.value]);
  assert.deepEqual(names.map(([key, , value]) => [key, value]).sort(), [["body", 1.55], ["tight", 1.15]]);
  for (const [, name] of names) assert.ok(css.includes(`line-height: var(${name})`), `css/base.css does not read ${name}`);
  assert.doesNotMatch(css, /line-height:\s*1\.(55|15);/, "a line-height literal the tokens now hold");
});

test("brand: logo roles are url() values of shipped exports, the legal line comes from guidelines/brand.md", () => {
  const brand = declarations(moduleCss("brand"));
  const { exports } = pkg();
  const files = tarball();
  const logos = {
    "--brand-logo-on-light": "./brand/wordmark-on-light.svg",
    "--brand-logo-on-dark": "./brand/wordmark-on-navy.svg",
    "--brand-mark": "./brand/monogram.svg",
  };
  for (const [role, key] of Object.entries(logos)) {
    assert.equal(brand.get(role), `url("${key}")`, role);
    const target = exportTarget(exports, key);
    assert.ok(target, `${key} is not a package export`);
    assert.ok(files.includes(target.replace(/^\.\//, "")), `${key} does not ship`);
  }
  const legal = readGuideline(root, "brand.md").sections.get("Legal line").match(/^`([^`]+)`$/m)[1];
  assert.equal(brand.get("--brand-legal"), JSON.stringify(legal));
});

test("every text pair of the contract reaches WCAG AA, a list pair when any of its roles does", () => {
  const values = new Map([...TOKEN_MODULES].flatMap((module) => [...declarations(moduleCss(module))]));
  const { pairs } = contract();
  assert.equal(pairs.length, 14); // 13, plus --tertiary on --canvas-bg (kit #148)
  for (const pair of pairs) {
    const bg = values.get(pair.bg);
    assert.match(bg ?? "", /^#[0-9a-f]{6}$/i, `${pair.bg} is not a hex colour`);
    const ratios = [pair.fg].flat().map((role) => [role, contrastRatio(parseColor(values.get(role)), parseColor(bg))]);
    assert.ok(
      ratios.some(([, ratio]) => ratio >= AA),
      `${pair.use}: ${ratios.map(([role, ratio]) => `${role} ${ratio.toFixed(2)}`).join(", ")} on ${pair.bg}`,
    );
  }
});

test("dist/kit/guidance.md is one file with a section per provided module, its lines taken from guidelines/", () => {
  const guidance = read("dist/kit/guidance.md");
  assert.doesNotMatch(guidance, /\u2014/, "no em dash");
  const sources = readdirSync(join(root, "guidelines"))
    .filter((name) => name.endsWith(".md"))
    .map((name) => unlinkRelative(readFileSync(join(root, "guidelines", name), "utf8")))
    .join("\n");
  const sections = guidance.split(/^## /m).slice(1);
  assert.deepEqual(
    sections.map((section) => section.split("\n")[0].trim()),
    Object.keys(contract().modules).filter((module) => MODULES.includes(module)),
    "one section per provided module, in contract order",
  );
  for (const section of sections) {
    const lines = section.split("\n").slice(1).filter((line) => line.trim() && !line.startsWith("Source:") && !line.startsWith("### "));
    assert.ok(lines.length > 0, `section ${section.split("\n")[0]} is empty`);
    for (const line of lines) assert.ok(sources.includes(line), `not a line of guidelines/: ${line}`);
  }
});

// The class modules (Plan-0002 increment 02): css/kit/<module>.css holds the class rules, written by
// hand against contract roles; the build writes dist/kit/<module>.css from the roles of the kit tier
// followed by those rules.
const BANNER = "/*! @medquantis/design-system | © 2026 MedQuantis SA | MIT License, see LICENSE */\n";
const handWritten = (module) => read(`css/kit/${module}.css`);
const ruleBody = (css) => css.slice(BANNER.length);
const classRules = (css) => {
  const rules = [];
  postcss.parse(css).walkRules((rule) => {
    if (rule.parent?.type === "atrule" && rule.parent.name === "font-face") return;
    rules.push(rule);
  });
  return rules;
};
const HEX = /#[0-9a-f]{3,8}\b/i;
const COLOUR_FUNCTION = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i;
const NAMED_COLOUR = new RegExp(
  `(?<![\\w#-])(?:${"aqua black blue brown fuchsia gold gray green grey lime maroon navy olive orange pink purple red silver teal white yellow".split(" ").join("|")})(?![\\w-])`,
  "i",
);
const COLOUR_PROPERTY = /color|background|border|outline|fill|stroke|shadow|accent|caret|column-rule/i;

for (const module of CLASS_MODULES) {
  test(`css/kit/${module}.css starts with the banner, holds class rules only, and dist/kit/${module}.css carries them`, () => {
    const source = handWritten(module);
    assert.ok(source.startsWith(BANNER), `css/kit/${module}.css lacks the copyright banner`);
    const declared = [];
    for (const rule of classRules(source)) {
      assert.notEqual(rule.selector.trim(), ":root", `css/kit/${module}.css: roles belong in tokens/kit/, not in a :root rule`);
      rule.walkDecls((decl) => decl.prop.startsWith("--") && declared.push(decl.prop));
    }
    assert.deepEqual(declared, [], `css/kit/${module}.css declares custom properties; values belong in tokens/kit/`);
    const built = moduleCss(module);
    assert.ok(built.startsWith(BANNER), `dist/kit/${module}.css lacks the copyright banner`);
    assert.ok(built.includes(ruleBody(source).trim()), `dist/kit/${module}.css does not carry the rules of css/kit/${module}.css`);
  });

  test(`css/kit/${module}.css styles every class the contract lists for ${module}`, () => {
    const selectors = classRules(handWritten(module)).map((rule) => rule.selector).join("\n");
    const classes = contract().modules[module].classes;
    assert.ok(classes.length > 0, `the contract lists no class for ${module}`);
    for (const name of classes) {
      assert.match(selectors, new RegExp(`\\.${name}(?![\\w-])`), `css/kit/${module}.css has no rule for .${name}`);
    }
  });

  test(`css/kit/${module}.css reads only the roles of ${READS[module].join(", ")}, never a literal colour, --mq-* or --kit-* name`, () => {
    const allowed = new Set(READS[module].flatMap((name) => Object.keys(contract().modules[name].roles)));
    const source = handWritten(module).replace(/\/\*[\s\S]*?\*\//g, "");
    assert.doesNotMatch(source, /--mq-/, "an --mq-* name: kit modules read contract roles only");
    assert.doesNotMatch(source, /(?<![\w-])--kit-/, "a --kit-* name belongs to the kit renderers");
    for (const [, name] of source.matchAll(/var\(\s*(--[\w-]+)/g)) {
      assert.ok(allowed.has(name), `css/kit/${module}.css reads ${name}, not a role of ${READS[module].join(", ")}`);
    }
    for (const rule of classRules(source)) {
      rule.walkDecls((decl) => {
        const where = `css/kit/${module}.css ${rule.selector} { ${decl.prop}: ${decl.value} }`;
        assert.doesNotMatch(decl.value, HEX, `${where}: a literal colour`);
        assert.doesNotMatch(decl.value, COLOUR_FUNCTION, `${where}: a colour function`);
        if (COLOUR_PROPERTY.test(decl.prop)) assert.doesNotMatch(decl.value, NAMED_COLOUR, `${where}: a named colour`);
      });
    }
  });
}

test("the class module roles alias semantic tokens by name, each citing its guideline", () => {
  const byRole = new Map(kitTier().filter((entry) => CLASS_MODULES.includes(entry.module)).map((entry) => [entry.role, entry.token]));
  const expected = {
    "--doc-page-bg": "{semantic.color.canvas}",
    "--doc-text-size": "{semantic.font.size.body}",
    "--doc-rule": "{semantic.color.border}",
    "--slide-bg": "{semantic.color.canvas}",
    "--slide-fg": "{semantic.color.ink}",
    "--slide-padding": "{semantic.space.8}",
    "--slide-width": "{semantic.slide.width}",
    "--slide-height": "{semantic.slide.height}",
    "--print-bg": "{semantic.color.canvas}",
    "--print-margin": "{semantic.space.7} {semantic.space.8}",
    "--print-page-size": "A4",
  };
  assert.deepEqual([...byRole.keys()].sort(), Object.keys(expected).sort());
  for (const [role, value] of Object.entries(expected)) {
    assert.equal(byRole.get(role).$value, value, role);
    assert.match(byRole.get(role).$description, /guidelines\/[\w-]+\.md/, `${role} $description cites a guideline`);
  }
  const values = new Map(CLASS_MODULES.flatMap((module) => [...declarations(moduleCss(module))]));
  assert.equal(values.get("--slide-width"), "1280px", "the 1280 by 720 slide canvas of css/slide.css");
  assert.equal(values.get("--slide-height"), "720px");
  assert.equal(values.get("--slide-padding"), "72px", "the 72 px side margins of guidelines/layout.md");
  assert.equal(values.get("--print-page-size"), "A4");
  assert.equal(values.get("--print-margin"), "48px 72px", "the padding of mq-page in css/print.css");
  assert.equal(values.get("--doc-page-bg"), "#fafaf8", "owner ruling 9: every document page is the canvas colour");
});

test("build/kit-classes.md maps every class of the class modules to a MedQuantis rule or a guideline", () => {
  const table = read("build/kit-classes.md");
  assert.doesNotMatch(table, /\u2014/, "no em dash");
  const mqSelectors = new Set(
    ["base", "components", "slide", "print"].flatMap((file) => [...read(`css/${file}.css`).matchAll(/\.(mq-[\w-]+)/g)].map((m) => m[1])),
  );
  const rows = new Map(
    table
      .split("\n")
      .map((line) => line.match(/^\| `([\w-]+)` \| ([^|]+) \| ([^|]+) \|/))
      .filter(Boolean)
      .map(([, name, module, source]) => [name, { module: module.trim(), source }]),
  );
  for (const module of CLASS_MODULES) {
    for (const name of contract().modules[module].classes) {
      const row = rows.get(name);
      assert.ok(row, `build/kit-classes.md has no row for ${name}`);
      assert.equal(row.module, `\`${module}\``, `${name}: module column`);
      const named = [...row.source.matchAll(/`(mq-[\w-]+)`/g)].map((m) => m[1]);
      assert.ok(named.length > 0 || /follows guidelines\/[\w-]+\.md/.test(row.source), `${name}: names no mq- rule and no guideline`);
      for (const mq of named) assert.ok(mqSelectors.has(mq), `${name}: ${mq} is not a class of css/`);
    }
  }
  const from = (name) => rows.get(name)?.source ?? "";
  assert.match(from("slide-footer"), /`mq-slide-foot`/);
  assert.match(from("slide-number"), /`mq-slide-number`/);
  assert.match(from("slide-label"), /`mq-slide-label`/);
  assert.match(from("report"), /`mq-page`/);
});

test("css/components.css and css/slide.css read the line-height tokens instead of the literals 1.55 and 1.15", () => {
  for (const [file, name] of [["components", "--mq-font-line-height-body"], ["slide", "--mq-font-line-height-tight"]]) {
    const css = read(`css/${file}.css`);
    assert.ok(css.includes(`line-height: var(${name})`), `css/${file}.css does not read ${name}`);
    assert.doesNotMatch(css, /line-height:\s*1\.(55|15);/, `css/${file}.css: a line-height literal the tokens hold`);
  }
});

test("kit-manifest.json at the package root validates against the vendored schema with ajv", () => {
  // Compiled as vendored: the kit's $id carries no fragment since homemade-claude-kit #147.
  const schema = readJson("tests/fixtures/kit-contract/kit-manifest.schema.json");
  assert.doesNotMatch(schema.$id, /#/, "a fragment in $id, which JSON Schema 2020-12 forbids");
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
  const data = manifest();
  assert.ok(validate(data), JSON.stringify(validate.errors));
  assert.equal(data.contractVersion, "2.0.0");
  assert.deepEqual(Object.keys(data.provides).sort(), [...PROVIDED].sort());
  assert.equal(data.omitted, undefined, "every module of the contract is provided, nothing is omitted");
  assert.equal(data.provides.guidance, "./kit/guidance.md");
});

test("every manifest path is a package export that ships, and the manifest ships at the package root", () => {
  const { exports, files } = pkg();
  const shipped = tarball();
  assert.equal(exports["./kit/*"], "./dist/kit/*");
  assert.equal(exports["./kit-manifest.json"], "./kit-manifest.json");
  assert.ok(files.includes("dist/kit/") && files.includes("kit-manifest.json"), "package.json files lists dist/kit/ and kit-manifest.json");
  assert.ok(shipped.includes("kit-manifest.json"), "the kit reads kit-manifest.json at the package root only");
  for (const [module, key] of Object.entries(manifest().provides)) {
    const target = exportTarget(exports, key);
    assert.ok(target, `${module}: ${key} is not a package export`);
    assert.ok(shipped.includes(target.replace(/^\.\//, "")), `${module}: ${target} does not ship`);
  }
  for (const module of MODULES) assert.equal(manifest().provides[module], `./kit/${module}.css`);
});

test("kit-manifest.json is a build output, gitignored", () => {
  const ignored = spawnSync("git", ["check-ignore", "-q", "kit-manifest.json"], { cwd: root });
  assert.equal(ignored.status, 0, "kit-manifest.json is not gitignored");
});
