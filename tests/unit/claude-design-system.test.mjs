// dist/claude-design-system/project/, the claude.ai Design System artifact generated from the build
// (Plan-0002 increment 04), checked against the type's instructions saved in
// tests/fixtures/claude-design-system/type-instructions.md (release 1791927328-0a67, contract
// 0.2.47). A newer type release is adopted deliberately: replace the fixture, then this release id.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import { readGuideline, unlinkRelative } from "../../build/guidelines.mjs";
import { evaluatePair, flatten, loadPairs } from "../../build/contrast-pairs.mjs";
import { contrastRatio } from "../../build/color-math.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const project = join(root, "dist/claude-design-system/project");
const TYPE_RELEASE = "1791927328-0a67";
const TYPE_CONTRACT = "0.2.47";
const read = (path) => {
  assert.ok(existsSync(join(root, path)), `${path} is missing: run make build first`);
  return readFileSync(join(root, path), "utf8");
};
const readProject = (path) => read(join("dist/claude-design-system/project", path));
const json = (path) => JSON.parse(readProject(path));
const builtTokens = () => JSON.parse(read("dist/tokens.json"));
const version = () => JSON.parse(read("package.json")).version;
const files = (dir = project) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : [relative(project, join(dir, entry.name))]));

// The semantic tokens the system carries: every non-deprecated one of each family.
const FAMILIES = {
  color: (token) => token.type === "color",
  spacing: (token) => token.path[1] === "space",
  radius: (token) => token.path[1] === "radius",
  shadow: (token) => token.type === "shadow",
};
const semantic = (family) => Object.entries(builtTokens()).filter(([, token]) => token.path[0] === "semantic" && !token.deprecated && FAMILIES[family](token));
const LOGOS = ["wordmark-on-light-print.svg", "wordmark-on-navy-print.svg", "monogram.svg", "monogram-square.svg", "monogram-small.svg"];
const documentClasses = () => JSON.parse(read("tests/fixtures/kit-contract/modules.json")).modules.document.classes;
const componentName = (kitClass) => kitClass.split(/-+/).map((part) => part[0].toUpperCase() + part.slice(1)).join("");

test(`the type's instructions are saved with their release id (${TYPE_RELEASE}, contract ${TYPE_CONTRACT})`, () => {
  const text = read("tests/fixtures/claude-design-system/type-instructions.md");
  assert.match(text, new RegExp(`release ${TYPE_RELEASE}, contract ${TYPE_CONTRACT}`));
  assert.match(text, /^name: design-system$/m);
  assert.match(text, /## What a system holds/);
});

test("the index is the type's files index, with the createdOnFiles marker, the title and the CI release", () => {
  const index = json("design-system.json");
  assert.equal(index.v, 3);
  assert.equal(index.layout, "files");
  assert.equal(index.createdOnFiles.v, 1);
  assert.ok(!Number.isNaN(Date.parse(index.createdOnFiles.at)), "createdOnFiles.at is an ISO-8601 time");
  assert.equal(index.title, "MedQuantis");
  assert.equal(index.namespace, "MedQuantis");
  assert.deepEqual(index.libraries, [], "no bundle, so previews load no library");
  assert.deepEqual(index.groups, ["Logos"]);
  assert.deepEqual(index.assetGroups, { Logos: { name: "Logos", tile: "l", order: LOGOS, files: {} } }, "no upload record: publication adds them");
  assert.deepEqual(index.sections, {});
  assert.deepEqual(index.blobs, {});
  assert.deepEqual(index.docs, { sections: [] });
  assert.equal(index.lastChange.via, `CI release v${version()}`);
  assert.ok(index.lastChange.by && index.lastChange.note, "lastChange names who and why");
  assert.ok(!Number.isNaN(Date.parse(index.lastChange.at)));
});

test("tokens.json is in the type's list shape, never a DTCG map", () => {
  const tokens = json("tokens.json");
  assert.equal(tokens.name, "MedQuantis");
  assert.deepEqual(tokens.color.themes, [{ id: "light", name: "Light" }, { id: "dark", name: "Dark" }], "light first: a token without a dark value inherits it");
  assert.doesNotMatch(readProject("tokens.json"), /"\$value"|var\(|color-mix\(/);
  const names = [];
  for (const [family, group] of Object.entries(tokens)) {
    if (["name", "version", "type", "meta"].includes(family)) continue;
    assert.ok(Array.isArray(group.tokens), `${family}.tokens is a list`);
    for (const entry of group.tokens) {
      assert.deepEqual(Object.keys(entry).sort(), ["name", "usage", "value"], `${family} ${entry.name}`);
      assert.match(entry.name, /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/);
      assert.ok(entry.usage.trim(), `${entry.name} has a usage note`);
      names.push(entry.name);
    }
  }
  assert.deepEqual(names.filter((name, index) => names.indexOf(name) !== index), [], "each name once across the families");
});

// Plan-0003 increment 02: the dark theme of ADR-0007 (dist/themes/dark.json). A re-valued colour
// carries its dark value as the dark theme's; a re-valued shadow, which has no themes, names its
// dark value in its note; each note adds the dark role's own description.
const darkTheme = () => JSON.parse(read("dist/themes/dark.json"));
const darkNote = (family, dark) => (family === "shadow" ? ` Dark theme (.dark): \`${dark.value}\`, ${dark.description}` : ` Dark theme (.dark): ${dark.description}`);

test("every semantic colour, space, radius and shadow token is carried with its value and its $description, the dark values with their notes", () => {
  const tokens = json("tokens.json");
  const darkValues = darkTheme();
  for (const family of Object.keys(FAMILIES)) {
    const expected = semantic(family).map(([name, token]) => {
      const dark = darkValues[name];
      return {
        name: name.slice(2),
        value: family === "color" ? { light: token.value, ...(dark ? { dark: dark.value } : {}) } : token.value,
        usage: `${token.description}${dark ? darkNote(family, dark) : ""}`,
      };
    });
    assert.ok(expected.length > 0, `${family} has tokens`);
    assert.deepEqual(tokens[family].tokens, expected, `${family}: same names (tokens.css without --), values and notes`);
  }
  for (const { name, value } of tokens.color.tokens) {
    for (const theme of Object.keys(value)) assert.match(value[theme], /^(#[0-9a-f]{3,8}|rgba?\([\d.,\s]+\))$/i, `${name} (${theme}) is a colour value the page reads`);
  }
  const carriedDark = tokens.color.tokens.filter(({ value }) => value.dark).map(({ name }) => `--${name}`);
  const expectedDark = Object.entries(darkValues).filter(([name, token]) => token.type === "color" && !builtTokens()[name].deprecated).map(([name]) => name);
  assert.deepEqual(carriedDark.sort(), expectedDark.sort(), "every non-deprecated dark colour is carried");
});

test("type names the three Google-hosted faces, ships no font file, and every style is a token value", () => {
  const { type } = json("tokens.json");
  const built = builtTokens();
  assert.equal(type.fonts, undefined, "a hosted face has no file");
  assert.equal(existsSync(join(project, "fonts")), false);
  assert.deepEqual(type.families, {
    heading: built["--mq-font-family-heading"].value,
    body: built["--mq-font-family-body"].value,
    mono: built["--mq-font-family-mono"].value,
  });
  const values = (prefix) => new Set(Object.entries(built).filter(([name]) => name.startsWith(prefix)).map(([, token]) => token.value));
  const sizes = values("--mq-font-size-");
  const weights = values("--mq-font-weight-");
  const lineHeights = values("--mq-font-line-height-");
  assert.ok(type.groups.length > 0);
  for (const group of type.groups) {
    assert.ok(group.family in type.families, `${group.name} names a family`);
    for (const style of group.styles) {
      assert.ok(sizes.has(style.fontSize), `${style.name} fontSize ${style.fontSize} is a --mq-font-size token`);
      assert.ok(weights.has(style.fontWeight), `${style.name} fontWeight ${style.fontWeight} is a --mq-font-weight token`);
      if ("lineHeight" in style) assert.ok(lineHeights.has(style.lineHeight), `${style.name} lineHeight ${style.lineHeight} is a token`);
    }
  }
});

test("every text pair of tokens/contrast-pairs.json reaches 4.5:1 with the values the system carries, in each of its themes", () => {
  const colours = json("tokens.json").color.tokens;
  const carried = Object.fromEntries(colours.map(({ name, value }) => [`--${name}`, { value: value.light }]));
  const carriedDark = Object.fromEntries(colours.filter(({ value }) => value.dark).map(({ name, value }) => [`--${name}`, { value: value.dark }]));
  const pairs = loadPairs(join(root, "tokens/contrast-pairs.json")).filter((pair) => pair.use === "text");
  assert.ok(pairs.length > 0);
  assert.ok(Object.keys(carriedDark).length > 0, "the system carries no dark value");
  for (const pair of pairs) {
    const ratio = contrastRatio(carried[pair.fg].value, flatten(pair.bg, carried));
    assert.ok(ratio >= 4.5, `${pair.fg} on ${pair.bg.join(" over ")}: ${ratio.toFixed(2)}:1`);
    if (!pair.themes.includes("dark")) continue;
    const dark = evaluatePair(pair, carried, carriedDark).ratio;
    assert.ok(dark >= 4.5, `dark: ${pair.fg} on ${pair.bg.join(" over ")}: ${dark.toFixed(2)}:1`);
  }
});

// The brand book: README.md for principles, colour, typography, writing, charts and data patterns,
// one further section file for each other guideline, every section verbatim with its token names.
const README_GUIDELINES = ["principles.md", "colour.md", "typography.md", "writing.md", "charts.md", "data-patterns.md"];
const SECTION_GUIDELINES = ["brand.md", "voice.md", "layout.md", "accessibility.md", "specialising.md"];
const expectSections = (text, name, level) => {
  const guideline = readGuideline(root, name);
  if (guideline.intro) assert.ok(text.includes(unlinkRelative(guideline.intro)), `${name}: introduction`);
  for (const [heading, body] of guideline.sections) {
    if (name === "principles.md" && heading === "Where the rules live") continue;
    assert.ok(text.includes(`${level} ${heading}\n\n${unlinkRelative(body)}`), `${name}: ${heading}`);
  }
};

test("README.md is the brand book generated from guidelines/, with the --mq- token names in the rules", () => {
  const text = readProject("README.md");
  assert.match(text, /^# MedQuantis\n/);
  assert.match(text, new RegExp(`@medquantis/design-system ${version().replace(/\./g, "\\.")}`));
  assert.match(text, /`mq-accent` in tokens\.json is `--mq-accent`/, "says how token names map to the rules");
  for (const name of README_GUIDELINES) expectSections(text, name, "###");
  assert.match(text, /`--mq-accent`/);
  assert.match(text, /^### Dark theme$/m, "the brand book carries the Dark theme section (Plan-0003 increment 02)");
});

test("each other guideline is a further brand book section, at most 24", () => {
  const sections = files().filter((path) => path.endsWith(".md") && !path.includes("/") && path !== "README.md");
  assert.deepEqual(sections.sort(), [...SECTION_GUIDELINES].sort());
  assert.ok(sections.length <= 24);
  for (const name of SECTION_GUIDELINES) expectSections(readProject(name), name, "##");
});

test("one component per kit document class, with guidelines and a live preview", () => {
  for (const kitClass of documentClasses()) {
    const dir = `components/${componentName(kitClass)}`;
    const readme = readProject(`${dir}/README.md`);
    assert.match(readme, new RegExp(`^# ${componentName(kitClass)}\n\n[^\n]*\`${kitClass}\``), `${dir}/README.md: first sentence names the class`);
    assert.match(readme, /consumer provides/i, `${dir}/README.md says what the consumer provides`);
    const preview = readProject(`${dir}/preview.html`);
    assert.match(preview.split("\n")[0], /^<!-- @dsCard group="Document" height=\d+ -->$/);
    assert.match(preview, new RegExp(`class="[^"]*\\b${kitClass}\\b`), `${dir}/preview.html renders ${kitClass}`);
    const declared = new Set([...preview.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]));
    const used = [...preview.matchAll(/var\((--[\w-]+)/g)].map((match) => match[1]);
    assert.deepEqual(used.filter((name) => !declared.has(name)), [], `${dir}/preview.html declares every role it reads`);
    assert.doesNotMatch(preview, /@font-face|data:font|https?:\/\//, "no font file and no remote load: the page preloads the hosted faces");
  }
});

test("the cover is a preview card, carrying the outlined on-navy wordmark", () => {
  const cover = readProject("components/Cover/preview.html");
  assert.match(cover.split("\n")[0], /^<!-- @dsCard group="Cover" height=\d+ -->$/);
  const wordmark = read("brand/wordmark-on-navy-print.svg").replace(/<\?xml[^>]*>\s*/, "").trim();
  assert.ok(cover.includes(wordmark), "the wordmark is copied, never redrawn");
  assert.match(cover, /Swiss AI for healthcare systems/);
});

test("the logos are byte copies of brand/, with a README for the group", () => {
  for (const name of LOGOS) assert.equal(readProject(`assets/Logos/${name}`), read(`brand/${name}`), name);
  assert.match(readProject("assets/Logos/README.md"), /^# Logos\n/);
  assert.deepEqual(
    files().filter((path) => path.startsWith("assets/")).sort(),
    [...LOGOS.map((name) => `assets/Logos/${name}`), "assets/Logos/README.md"].sort(),
  );
});

test("only paths the type holds, never a generated or toolchain file", () => {
  for (const path of files()) {
    assert.match(path, /^(design-system\.json|tokens\.json|[\w-]+\.md|components\/[A-Za-z]+\/(README\.md|preview\.html)|assets\/Logos\/[\w.-]+)$/, path);
    assert.doesNotMatch(path, /(^|\/)\./);
  }
  assert.ok(files().length <= 1008);
});

test("no em dash or en dash in the generated prose (writing rule)", () => {
  for (const path of files().filter((path) => /\.(md|html|json)$/.test(path))) assert.doesNotMatch(readProject(path), /[–—]/, path);
});
