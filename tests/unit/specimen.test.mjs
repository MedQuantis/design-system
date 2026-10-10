import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

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

test("percentages follow owner ruling 8: decimal point and a space before %", async () => {
  const { formatPercent } = await loadScript();
  assert.equal(formatPercent(12.5), "12.5 %");
  assert.equal(formatPercent(40), "40.0 %");
  assert.equal(formatPercent(100, 0), "100 %");
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
