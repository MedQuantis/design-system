import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { evaluatePair, loadPairs } from "../../build/contrast-pairs.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const script = join(root, "scripts/build-specimen.mjs");
const loadScript = async () => {
  assert.ok(existsSync(script), "scripts/build-specimen.mjs is missing");
  return import(script);
};
const NBSP = " ";

test("amounts follow owner ruling 8: CHF first, non-breaking space, straight apostrophe thousands", async () => {
  const { formatChf, formatNumber } = await loadScript();
  assert.equal(formatChf(2460000), `CHF${NBSP}2'460'000`);
  assert.equal(formatChf(300000), `CHF${NBSP}300'000`);
  assert.equal(formatChf(950), `CHF${NBSP}950`);
  assert.equal(formatNumber(48000), "48'000");
  assert.equal(formatNumber(1234.5, 1), "1'234.5");
  assert.doesNotMatch(formatChf(1000000), /[’,]/);
});

test("percentages follow owner ruling 8 as amended: decimal point and a non-breaking space before %", async () => {
  const { formatPercent } = await loadScript();
  assert.equal(formatPercent(12.5), `12.5${NBSP}%`);
  assert.equal(formatPercent(40), `40.0${NBSP}%`);
  assert.equal(formatPercent(100, 0), `100${NBSP}%`);
  assert.doesNotMatch(formatPercent(7.5), / %/);
});

test("examples/ holds fictitious data only, every figure line carrying the illustrative marker", () => {
  const dir = join(root, "examples");
  assert.ok(existsSync(dir), "examples/ is missing");
  const files = readdirSync(dir).filter((name) => name.endsWith(".json"));
  assert.ok(files.length > 0, "examples/ has no JSON data");
  for (const name of files) {
    const text = read(`examples/${name}`);
    JSON.parse(text);
    for (const [index, line] of text.split("\n").entries()) {
      if (/:\s*-?\d/.test(line)) assert.match(line, /mq:illustrative/, `examples/${name}:${index + 1} has a figure without the marker`);
    }
    assert.match(text, /Assureur A/, `examples/${name} should use the invented names of ADR-0005`);
  }
});

test("make specimen builds the page, make test runs the unit tests and Playwright", () => {
  const makefile = read("Makefile");
  const recipe = (target) => makefile.match(new RegExp(`^${target}:([^\\n]*)\\n((?:\\t[^\\n]*\\n?)*)`, "m"));
  const specimen = recipe("specimen");
  assert.ok(specimen, "Makefile has no specimen target");
  assert.match(specimen[1], /\bbuild\b/, "make specimen must build the tokens first");
  assert.match(specimen[2], /node scripts\/build-specimen\.mjs/);
  assert.match(recipe("test")?.[1] ?? "", /\btest-unit\b.*\btest-e2e\b/, "make test must run the unit tests and the e2e tests");
  assert.match(recipe("test-unit")?.[2] ?? "", /node --test "tests\/unit\/\*\*\/\*\.test\.mjs"/);
  const e2e = recipe("test-e2e");
  assert.ok(e2e, "Makefile has no test-e2e target");
  assert.match(e2e[1], /\bspecimen\b/);
  assert.match(e2e[1], /\bbrowsers\b/);
  assert.match(e2e[2], /playwright test/);
  assert.match(recipe("browsers")?.[2] ?? "", /playwright install --only-shell .*chromium/, "browsers must install the Chromium build pinned by @playwright/test");
  assert.doesNotMatch(recipe("build")?.[2] ?? "", /build-specimen/, "make build ships package outputs only; the specimen has its own target");
});

test("Playwright and axe are pinned exactly", () => {
  const { devDependencies } = JSON.parse(read("package.json"));
  assert.equal(devDependencies["@playwright/test"], "1.64.0");
  assert.equal(devDependencies["@axe-core/playwright"], "4.13.0");
});

test("README names the specimen as the visual reference", () => {
  const readme = read("README.md");
  assert.match(readme, /dist\/specimen\/index\.html/);
  assert.match(readme, /visual reference/i);
  assert.match(readme, /make specimen/);
});

// Plan-0003 Inc 03: the specimen renders once per theme (ADR-0007), into a scratch folder here so
// the unit stage leaves dist/specimen/ to make specimen.
let built;
const buildPages = async () => {
  if (built) return built;
  const { buildSpecimen } = await loadScript();
  assert.equal(typeof buildSpecimen, "function", "build-specimen.mjs exports no buildSpecimen(out)");
  const out = mkdtempSync(join(tmpdir(), "mq-specimen-"));
  try {
    await buildSpecimen(out);
    const page = (name) => {
      assert.ok(existsSync(join(out, name)), `the build writes no ${name}`);
      return readFileSync(join(out, name), "utf8");
    };
    built = { light: page("index.html"), dark: page("dark.html"), darkCss: existsSync(join(out, "themes/dark.css")) ? readFileSync(join(out, "themes/dark.css"), "utf8") : null };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
  return built;
};
const section = (html, id) => html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>\\n\\n`))?.[0] ?? "";
const unescape = (text) => text.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

test("the build writes dist/specimen/dark.html with class dark on <html> and themes/dark.css loaded after the tokens", async () => {
  const { light, dark, darkCss } = await buildPages();
  assert.match(dark, /<html lang="en" class="dark">/);
  assert.match(dark, /<link rel="stylesheet" href="tokens\.css">\n<link rel="stylesheet" href="themes\/dark\.css">/);
  assert.equal(darkCss, read("dist/themes/dark.css"), "the specimen folder carries dist/themes/dark.css byte for byte");
  assert.match(light, /<html lang="en">/);
  assert.doesNotMatch(light, /themes\/dark\.css|class="dark"/, "the light page stays light");
});

test("on the dark page every swatch prints its dark value and every contrast row its dark ratio", async () => {
  const { dark } = await buildPages();
  const tokens = JSON.parse(read("dist/tokens.json"));
  const theme = JSON.parse(read("dist/themes/dark.json"));
  const swatches = [...dark.matchAll(/data-swatch="(--mq-[\w-]+)"[\s\S]*?<\/code><span>([^<]*)<\/span>/g)];
  assert.ok(swatches.length > 0, "the dark page has no swatch");
  for (const [, name, printed] of swatches) {
    const value = String((theme[name] ?? tokens[name]).value);
    assert.equal(unescape(printed).replace(/ on navy$/, ""), value, `${name} prints ${printed}, not its dark value`);
  }
  for (const name of Object.keys(theme).filter((key) => theme[key].type === "color" && !tokens[key].deprecated)) {
    assert.match(dark, new RegExp(`data-swatch="${name}"`), `${name} has no swatch on the dark page`);
  }
  const pairs = loadPairs(join(root, "tokens/contrast-pairs.json"));
  for (const pair of pairs) {
    const key = `${pair.fg} on ${pair.bg.join(" ")}`;
    const row = dark.match(new RegExp(`<tr data-pair="${key}">[\\s\\S]*?</tr>`))?.[0];
    if (!pair.themes.includes("dark")) {
      assert.equal(row, undefined, `${key} is kept out of dark yet has a row on the dark page`);
      continue;
    }
    assert.ok(row, `${key} has no row on the dark page`);
    assert.ok(row.includes(`${evaluatePair(pair, tokens, theme).ratio.toFixed(2)}:1`), `${key} does not print its dark ratio`);
  }
});

test("the brand section shows the white on-navy files on dark, never the navy wordmark, and the outlined monogram", async () => {
  const { light, dark } = await buildPages();
  assert.doesNotMatch(dark, /wordmark-on-light/, "the navy wordmark is never used on dark (owner ruling 14)");
  const brand = section(dark, "brand");
  assert.ok(brand, "the dark page has no brand section");
  assert.equal([...brand.matchAll(/data-brand="wordmark-on-navy\.svg"/g)].length, 2, "the live on-navy wordmark on the surface and on the navy tile");
  assert.equal([...brand.matchAll(/src="brand\/wordmark-on-navy-print\.svg"/g)].length, 2, "the outlined on-navy wordmark on the surface and on the navy tile");
  assert.match(brand, /<img class="mq-monogram" src="brand\/monogram\.svg"/);
  const lightBrand = section(light, "brand");
  assert.match(lightBrand, /data-brand="wordmark-on-light\.svg"/, "the light page keeps the navy wordmark on light");
  assert.match(lightBrand, /<img class="mq-monogram" src="brand\/monogram\.svg"/);
});
