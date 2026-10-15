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
const PROVIDED = [...TOKEN_MODULES, "guidance"];
const OMITTED = ["document", "slide-frame", "print"];
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

test("the vendored kit contract is 2.0.0 from homemade-claude-kit d9254da", () => {
  assert.equal(contract().contractVersion, "2.0.0");
  const readme = read("tests/fixtures/kit-contract/README.md");
  for (const fact of ["homemade-claude-kit", "d9254da", "plugins/delivery-comms/contract/", "2.0.0"]) {
    assert.ok(readme.includes(fact), `tests/fixtures/kit-contract/README.md does not name ${fact}`);
  }
});

for (const module of TOKEN_MODULES) {
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
  for (const module of TOKEN_MODULES) {
    const own = tier.filter((entry) => entry.module === module).map((entry) => entry.role);
    assert.deepEqual([...own].sort(), Object.keys(contract().modules[module].roles).sort(), `tokens/kit kit.${module}`);
  }
  const modules = new Set(tier.map((entry) => entry.module));
  assert.deepEqual([...modules].sort(), [...TOKEN_MODULES].sort(), "the kit tier holds one group per token module");
});

test("kit tier aliases point at semantic tokens, and each module value equals the aliased token", () => {
  const byPath = builtByPath();
  for (const { module, role, token, path } of kitTier()) {
    const alias = typeof token.$value === "string" ? token.$value.match(/^\{([^{}]+)\}$/)?.[1] : undefined;
    if (!alias) continue;
    assert.match(alias, /^semantic\./, `${path.join(".")} aliases ${alias}, not a semantic token`);
    const target = byPath.get(alias);
    assert.ok(target, `${path.join(".")} aliases ${alias}, which is not in dist/tokens.json`);
    assert.equal(declarations(moduleCss(module)).get(role), String(target.value), `${role} in dist/kit/${module}.css`);
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
  assert.equal(pairs.length, 13);
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
    TOKEN_MODULES,
    "one section per token module, in contract order",
  );
  for (const section of sections) {
    const lines = section.split("\n").slice(1).filter((line) => line.trim() && !line.startsWith("Source:") && !line.startsWith("### "));
    assert.ok(lines.length > 0, `section ${section.split("\n")[0]} is empty`);
    for (const line of lines) assert.ok(sources.includes(line), `not a line of guidelines/: ${line}`);
  }
});

test("kit-manifest.json at the package root validates against the vendored schema with ajv", () => {
  const schema = readJson("tests/fixtures/kit-contract/kit-manifest.schema.json");
  // The kit's $id ends in "#2.0.0", a non-empty fragment that JSON Schema 2020-12 forbids in $id, so
  // ajv refuses the schema itself. Only that fragment is dropped; every keyword is checked as shipped.
  assert.match(schema.$id, /#2\.0\.0$/, "the kit fixed its $id: compile the vendored schema as is");
  const validate = new Ajv2020({ allErrors: true, strict: true }).compile({ ...schema, $id: schema.$id.replace(/#.*$/, "") });
  const data = manifest();
  assert.ok(validate(data), JSON.stringify(validate.errors));
  assert.equal(data.contractVersion, "2.0.0");
  assert.deepEqual(Object.keys(data.provides).sort(), [...PROVIDED].sort());
  assert.deepEqual(Object.keys(data.omitted ?? {}).sort(), [...OMITTED].sort());
  for (const reason of Object.values(data.omitted)) assert.ok(reason.length > 0, "an omitted module names its reason");
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
  for (const module of TOKEN_MODULES) assert.equal(manifest().provides[module], `./kit/${module}.css`);
});

test("kit-manifest.json is a build output, gitignored", () => {
  const ignored = spawnSync("git", ["check-ignore", "-q", "kit-manifest.json"], { cwd: root });
  assert.equal(ignored.status, 0, "kit-manifest.json is not gitignored");
});
