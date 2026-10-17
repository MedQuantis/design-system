// dist/DESIGN.md, the Google DESIGN.md export (Plan-0002 increment 03), so tools and agents outside
// the kit read the same brand: front matter values from dist/tokens.json through the kit tier,
// prose from guidelines/, linted by the pinned @google/design.md.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { parse } from "yaml";
import { readGuideline, unlinkRelative } from "../../build/guidelines.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => {
  assert.ok(existsSync(join(root, path)), `${path} is missing: run make build first`);
  return readFileSync(join(root, path), "utf8");
};
const tokens = () => JSON.parse(read("dist/tokens.json"));
const LINTER = "0.4.0";

const designMd = () => {
  const text = read("dist/DESIGN.md");
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  assert.ok(match, "dist/DESIGN.md opens with a YAML front matter block");
  return { text, front: parse(match[1]), prose: match[2] };
};

// The kit tier, role name to the semantic path it aliases, for the token modules a DESIGN.md
// describes (the class modules carry page and slide roles, not brand values).
function* walk(node, path = []) {
  if ("$value" in node || "$extensions" in node) {
    yield { path, token: node };
    return;
  }
  for (const [key, child] of Object.entries(node)) if (!key.startsWith("$") && child && typeof child === "object") yield* walk(child, [...path, key]);
}
const kitRoles = () => {
  const dir = join(root, "tokens/kit");
  const roles = new Map();
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".tokens.json"))) {
    for (const { path, token } of walk(JSON.parse(readFileSync(join(dir, file), "utf8")))) {
      if (!["core", "dataviz", "type", "space-shape"].includes(path[1])) continue;
      const alias = typeof token.$value === "string" && token.$value.match(/^\{(semantic\.[\w.-]+)\}$/);
      if (alias) roles.set(path.at(-1), alias[1]);
    }
  }
  return roles;
};
const bySemanticPath = () => new Map(Object.entries(tokens()).map(([name, token]) => [token.path.join("."), { name, ...token }]));
const roleToken = (role) => {
  const path = kitRoles().get(role);
  assert.ok(path, `the kit tier has no aliased role ${role}`);
  return bySemanticPath().get(path);
};

// Each front matter group: the kit roles aliasing a semantic token of the group under their role
// name (the kit's DESIGN.md shape, owner decision 13), then every other semantic token of the
// group under its tokens.css name without --mq-.
const GROUPS = {
  colors: (token) => token.type === "color",
  rounded: (token) => token.path[1] === "radius",
  spacing: (token) => token.path[1] === "space",
};
const expectedGroup = (group) => {
  const inGroup = (token) => token.path[0] === "semantic" && GROUPS[group](token);
  const semantic = bySemanticPath();
  const entries = new Map();
  const aliased = new Set();
  for (const [role, path] of kitRoles()) {
    const token = semantic.get(path);
    if (!token || !inGroup(token)) continue;
    entries.set(role, token);
    aliased.add(token.name);
  }
  for (const [name, token] of Object.entries(tokens())) {
    if (inGroup(token) && !aliased.has(name)) entries.set(name.replace(/^--mq-/, ""), { name, ...token });
  }
  return entries;
};

// Google typography tokens, property to kit role (the kit's ux-design-system typography table).
const TYPOGRAPHY = {
  body: { fontFamily: "font-body", fontSize: "font-size-md", fontWeight: "font-weight-regular", lineHeight: "line-height-body" },
  heading: { fontFamily: "font-heading", fontSize: "title-size", fontWeight: "font-weight-bold", lineHeight: "line-height-tight" },
  mono: { fontFamily: "font-mono" },
  "text-xs": { fontSize: "font-size-xs" },
  "text-sm": { fontSize: "font-size-sm" },
  "text-lg": { fontSize: "font-size-lg" },
  "text-xl": { fontSize: "font-size-xl" },
};

const SECTIONS = ["Overview", "Colors", "Typography", "Layout", "Elevation & Depth", "Shapes", "Components", "Do's and Don'ts"];

test("dist/DESIGN.md names MedQuantis and carries only Google DESIGN.md keys, no kit: key", () => {
  const { front } = designMd();
  assert.equal(front.name, "MedQuantis");
  assert.deepEqual(Object.keys(front).sort(), ["colors", "description", "name", "rounded", "spacing", "typography"]);
  assert.match(front.description, /Generated from tokens\/ and guidelines\/.*Do not edit/);
});

test("DESIGN.md colours, radii and spacing equal dist/tokens.json, kit role names first", () => {
  const { front } = designMd();
  assert.equal(front.colors.primary, "{colors.accent}", "Google's primary colour reads the accent");
  for (const group of Object.keys(GROUPS)) {
    const expected = expectedGroup(group);
    assert.ok(expected.size > 0, `no semantic token in ${group}`);
    const actual = Object.entries(front[group]).filter(([name]) => !(group === "colors" && (name === "primary" || name.startsWith("dark-"))));
    assert.deepEqual(actual.map(([name]) => name), [...expected.keys()], `${group}: names and order`);
    for (const [name, value] of actual) assert.equal(value, expected.get(name).value, `${group}.${name}`);
  }
  // The chart colours sit under colors, by their dataviz role names.
  for (const role of ["chart-1", "chart-2", "chart-3", "chart-4", "chart-rest", "chart-axis", "chart-grid", "chart-highlight"]) assert.ok(role in front.colors, `colors.${role}`);
  assert.equal(front.colors.accent, tokens()["--mq-accent"].value);
  assert.equal(front.colors["canvas-bg"], tokens()["--mq-canvas"].value);
  assert.equal(front.rounded["radius-overlay"], tokens()["--mq-radius-overlay"].value);
});

test("DESIGN.md typography: body, heading and mono as typography objects, plus the text sizes", () => {
  const { front } = designMd();
  assert.deepEqual(Object.keys(front.typography), Object.keys(TYPOGRAPHY));
  for (const [name, properties] of Object.entries(TYPOGRAPHY)) {
    assert.deepEqual(Object.keys(front.typography[name]), Object.keys(properties), `typography.${name}`);
    for (const [property, role] of Object.entries(properties)) {
      assert.equal(front.typography[name][property], roleToken(role).value, `typography.${name}.${property} (${role})`);
    }
  }
  const t = tokens();
  assert.deepEqual(front.typography.body, {
    fontFamily: t["--mq-font-family-body"].value,
    fontSize: "16.5px",
    fontWeight: 400,
    lineHeight: 1.55,
  });
  assert.equal(front.typography.heading.fontWeight, 500, "Owner ruling 4: headings at 500");
});

test("DESIGN.md maps every front matter name to its tokens.css name", () => {
  const { front, prose } = designMd();
  for (const group of Object.keys(GROUPS)) {
    for (const [name, token] of expectedGroup(group)) {
      assert.ok(prose.includes(`| \`${group}.${name}\` | \`${token.name}\` | \`${token.value}\` |`), `no table row for ${group}.${name}`);
    }
  }
  for (const [name, properties] of Object.entries(TYPOGRAPHY)) {
    for (const [property, role] of Object.entries(properties)) {
      const token = roleToken(role);
      assert.ok(prose.includes(`| \`typography.${name}.${property}\` | \`${token.name}\` | \`${token.value}\` |`), `no table row for typography.${name}.${property}`);
    }
  }
  assert.ok(prose.includes("| `colors.primary` | `--mq-accent` |"), "primary maps to the accent");
  for (const [name, token] of expectedDark()) {
    assert.ok(prose.includes(`| \`colors.${name}\` | \`${token.name}\` in \`.dark\` | \`${token.value}\` |`), `no table row for colors.${name}`);
  }
  assert.equal(Object.keys(front.colors).length, expectedGroup("colors").size + expectedDark().size + 1);
});

// Plan-0003 increment 02: the dark theme of ADR-0007. Each light colour the theme re-values comes
// again as dark-<its DESIGN.md name>, in the same order, with the value of dist/themes/dark.json.
const darkTheme = () => JSON.parse(read("dist/themes/dark.json"));
const expectedDark = () => {
  const dark = darkTheme();
  return new Map([...expectedGroup("colors")].filter(([, token]) => dark[token.name]).map(([name, token]) => [`dark-${name}`, { name: token.name, value: dark[token.name].value }]));
};

test("DESIGN.md lists the dark colours as dark-* names equal to dist/themes/dark.json, with no gradient under colors", () => {
  const { front } = designMd();
  const expected = expectedDark();
  const colourRoles = Object.entries(darkTheme()).filter(([, token]) => token.type === "color");
  assert.ok(expected.size > 0, "no dark colour");
  assert.deepEqual(new Set([...expected.values()].map((token) => token.name)), new Set(colourRoles.map(([name]) => name)), "every dark colour role is exported");
  const actual = Object.entries(front.colors).filter(([name]) => name.startsWith("dark-"));
  assert.deepEqual(actual.map(([name]) => name), [...expected.keys()], "dark names and order");
  for (const [name, value] of actual) assert.equal(value, expected.get(name).value, `colors.${name}`);
  assert.equal(front.colors["dark-canvas-bg"], darkTheme()["--mq-canvas"].value);
  for (const [name, value] of Object.entries(front.colors)) assert.doesNotMatch(String(value), /gradient/i, `colors.${name} is a gradient, which the linter rejects`);
});

test("DESIGN.md carries the Dark theme section of colour.md under Colors", () => {
  const { prose } = designMd();
  const colors = prose.slice(prose.indexOf("## Colors"), prose.indexOf("## Typography"));
  assert.match(colors, /^### Colour: Dark theme$/m);
});

test("DESIGN.md prose: Google's sections in order, each guideline section verbatim, ending with the do and don't lines", () => {
  const { prose } = designMd();
  const headings = [...prose.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(headings, SECTIONS);
  const blocks = [...prose.matchAll(/^### ([^:\n]+): (.+)\n\n([\s\S]*?)(?=\n### |\n## |(?![\s\S]))/gm)];
  assert.ok(blocks.length >= 20, `expected the guideline sections, found ${blocks.length}`);
  const titles = new Map();
  for (const file of readdirSync(join(root, "guidelines")).filter((name) => name.endsWith(".md") && !["README.md"].includes(name))) {
    const guideline = readGuideline(root, file);
    titles.set(guideline.title, guideline);
  }
  for (const [, title, heading, body] of blocks) {
    const guideline = titles.get(title);
    assert.ok(guideline, `### ${title}: no guideline has this title`);
    const source = heading === "Introduction" ? guideline.intro : guideline.sections.get(heading);
    assert.ok(source !== undefined, `guidelines/${guideline.name} has no section "${heading}"`);
    assert.equal(body.trim(), unlinkRelative(source).trim(), `### ${title}: ${heading} is not the guideline text`);
  }
  // The same rules as the guidelines: every section and every non-empty introduction, once. The
  // principles' file index is left out, because DESIGN.md is read without the other files.
  const exported = blocks.map(([, title, heading]) => `${title}: ${heading}`);
  const expected = [...titles.values()].flatMap((guideline) => [
    ...(guideline.intro ? [`${guideline.title}: Introduction`] : []),
    ...[...guideline.sections.keys()].filter((heading) => !(guideline.name === "principles.md" && heading === "Where the rules live")).map((heading) => `${guideline.title}: ${heading}`),
  ]);
  assert.deepEqual(exported.filter((name, index) => exported.indexOf(name) !== index), [], "a guideline section appears twice");
  assert.deepEqual(expected.filter((name) => !exported.includes(name)), [], "guideline sections missing from DESIGN.md");
  const last = prose.slice(prose.indexOf("## Do's and Don'ts"));
  for (const [title, heading] of [["Specialising the design system", "Use what exists first"], ["Specialising the design system", "The four rules"], ["Writing", "No em dash, no en dash"]]) {
    assert.ok(last.includes(`### ${title}: ${heading}`), `Do's and Don'ts lacks ${title}: ${heading}`);
  }
  const ends = last.trimEnd().split("\n").at(-1);
  assert.match(ends, /^(- |\d+\. )/, "the file ends with a do or don't line");
});

test("DESIGN.md carries no em dash or en dash (writing rule)", () => {
  const { text } = designMd();
  assert.doesNotMatch(text, /[–—]/);
});

test(`@google/design.md ${LINTER}, pinned exactly, lints dist/DESIGN.md with no error and no warning`, () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.devDependencies["@google/design.md"], LINTER);
  designMd();
  const result = spawnSync(join(root, "node_modules/.bin/design.md"), ["lint", "dist/DESIGN.md"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const report = JSON.parse(result.stdout);
  const problems = report.findings.filter((finding) => finding.severity !== "info");
  assert.deepEqual(problems, [], JSON.stringify(problems, null, 2));
  assert.equal(report.summary.errors, 0);
  assert.equal(report.summary.warnings, 0);
});
