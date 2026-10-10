import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const distCss = join(root, "dist/tokens.css");
const distJson = join(root, "dist/tokens.json");
const pairsFile = join(root, "tokens/contrast-pairs.json");
const fixtures = join(root, "tests/fixtures/tokens");

const loadColorMath = () => import("../../build/color-math.mjs");
const loadPairs = () => import("../../build/contrast-pairs.mjs");

const readDist = (file) => {
  assert.ok(existsSync(file), `${relative(root, file)} is missing: run make build first`);
  return readFileSync(file, "utf8");
};
const builtTokens = () => JSON.parse(readDist(distJson));
const value = (name) => {
  const token = builtTokens()[name];
  assert.ok(token, `${name} is not in dist/tokens.json`);
  return token.value;
};

const tokenFiles = (tier) => {
  const dir = join(root, "tokens", tier);
  return existsSync(dir)
    ? readdirSync(dir)
        .filter((name) => name.endsWith(".tokens.json"))
        .map((name) => join(dir, name))
    : [];
};

// Walks a DTCG tree and yields every token with its path and the $type it inherits.
function* walk(node, path = [], inheritedType) {
  const type = node.$type ?? inheritedType;
  if ("$value" in node) {
    yield { path, token: node, type };
    return;
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith("$") && child && typeof child === "object") yield* walk(child, [...path, key], type);
  }
}

const sourceTokens = () => {
  const tokens = new Map();
  for (const file of [...tokenFiles("core"), ...tokenFiles("semantic")]) {
    for (const entry of walk(JSON.parse(readFileSync(file, "utf8")))) {
      tokens.set(entry.path.join("."), { ...entry, file: relative(root, file) });
    }
  }
  return tokens;
};

const ALIAS = /^\{([^{}]+)\}$/;

test("token sources exist as DTCG files split into core and semantic tiers", () => {
  assert.ok(tokenFiles("core").length > 0, "no tokens/core/*.tokens.json");
  assert.ok(tokenFiles("semantic").length > 0, "no tokens/semantic/*.tokens.json");
  for (const [key, { path }] of sourceTokens()) {
    assert.ok(["core", "semantic"].includes(path[0]), `${key} is outside the core and semantic groups`);
  }
});

test("$type is set at group level and every token carries a $description", () => {
  const tokens = sourceTokens();
  assert.ok(tokens.size > 0, "no tokens found");
  for (const [key, { token, type }] of tokens) {
    assert.equal(token.$type, undefined, `${key} sets $type on the token instead of its group`);
    assert.ok(type, `${key} has no inherited $type`);
    assert.ok(typeof token.$description === "string" && token.$description.length > 0, `${key} has no $description`);
  }
});

test("core colours are DTCG colour objects with colorSpace, components and hex", () => {
  const tokens = sourceTokens();
  assert.ok([...tokens.values()].some(({ path, type }) => path[0] === "core" && type === "color"), "no core colour");
  for (const [key, { path, token, type }] of tokens) {
    if (path[0] !== "core" || type !== "color") continue;
    const color = token.$value;
    assert.equal(typeof color, "object", `${key} is not a colour object`);
    assert.equal(color.colorSpace, "srgb", `${key} colorSpace`);
    assert.equal(color.components.length, 3, `${key} components`);
    assert.match(color.hex, /^#[0-9a-f]{6}$/, `${key} hex`);
    const fromComponents = `#${color.components.map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`;
    assert.equal(fromComponents, color.hex, `${key} components disagree with hex`);
  }
});

test("every semantic token resolves to a core value", () => {
  const tokens = sourceTokens();
  const built = builtTokens();
  const byPath = new Map(Object.values(built).map((token) => [token.path.join("."), token]));
  for (const [key, { path, token }] of tokens) {
    if (path[0] !== "semantic") continue;
    let target = token.$value;
    const seen = new Set([key]);
    while (typeof target === "string" && ALIAS.test(target)) {
      const ref = target.match(ALIAS)[1];
      assert.ok(tokens.has(ref), `${key} references missing ${ref}`);
      assert.ok(!seen.has(ref), `${key} has a reference cycle through ${ref}`);
      seen.add(ref);
      if (ref.startsWith("core.")) {
        assert.equal(byPath.get(key)?.value, byPath.get(ref)?.value, `${key} does not resolve to the value of ${ref}`);
        target = null;
        break;
      }
      target = tokens.get(ref).token.$value;
    }
    assert.equal(target, null, `${key} does not resolve to a core token`);
  }
});

test("dist/tokens.css defines --mq-accent as navy #0a2463", () => {
  assert.match(readDist(distCss), /--mq-accent:\s*#0a2463;/);
});

test("every custom property in dist/tokens.css carries the --mq- prefix", () => {
  const names = [...readDist(distCss).matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]);
  assert.ok(names.length > 0, "no custom properties found");
  for (const name of names) assert.match(name, /^--mq-/, `${name} lacks the --mq- prefix`);
});

test("dist/tokens.json lists every CSS property with the same value", () => {
  const built = builtTokens();
  const css = readDist(distCss);
  for (const [name, token] of Object.entries(built)) {
    const declared = css.match(new RegExp(`${name}:\\s*([^;]+);`));
    assert.ok(declared, `${name} is missing from dist/tokens.css`);
    assert.equal(declared[1].trim(), String(token.value), `${name} differs between CSS and JSON`);
  }
});

test("status colours are exactly success, warning, danger and info (ADR-0004)", () => {
  const tokens = sourceTokens();
  const status = [...tokens.values()]
    .filter(({ path }) => path[0] === "semantic" && path[1] === "color" && path[2] === "status")
    .map(({ path }) => path.slice(3).join("."));
  assert.deepEqual(status.sort(), ["danger", "info", "success", "warning"]);
});

test("ruled colour values: danger, tertiary, decoration, warning split and document backgrounds", () => {
  assert.equal(value("--mq-danger"), "#d8232a");
  assert.equal(value("--mq-tertiary"), "#707070", "owner ruling 1: tertiary text");
  assert.equal(value("--mq-decoration"), "#8c8c8c", "owner ruling 1: non-text decoration");
  assert.equal(value("--mq-warning"), "#a06400", "owner ruling 5: warning text, icon and border");
  assert.equal(value("--mq-warning-fill"), "#d4850a", "owner ruling 5: warning fill");
  assert.equal(value("--mq-canvas"), "#fafaf8", "owner ruling 9: document page");
  assert.equal(value("--mq-surface"), "#ffffff", "owner ruling 9: cards and panels");
  assert.equal(value("--mq-desk"), "#e9e8e4", "owner ruling 9: on-screen desk");
});

test("on-navy values follow owner ruling 2 and no sky blue exists", () => {
  assert.equal(value("--mq-on-navy-title"), "#ffffff");
  assert.equal(value("--mq-on-navy-secondary"), "rgba(255, 255, 255, 0.68)");
  assert.equal(value("--mq-on-navy-second-level"), "#c3cbdc");
  assert.equal(value("--mq-on-navy-accent"), "#8795b3");
  assert.match(value("--mq-on-navy-rule"), /^rgba\(255, 255, 255, 0\.1[678]\)$/);
  assert.equal(value("--mq-on-navy-pill"), "rgba(255, 255, 255, 0.12)");
  assert.equal(value("--mq-on-navy-discreet"), "rgba(255, 255, 255, 0.4)");
  assert.doesNotMatch(readDist(distCss), /#8fc0ff/i);
});

test("radius is 3 px for small items and 6 px for cards, never more (owner ruling 3)", () => {
  assert.equal(value("--mq-radius-small"), "3px");
  assert.equal(value("--mq-radius-medium"), "6px");
  for (const [name, token] of Object.entries(builtTokens())) {
    if (!name.includes("radius")) continue;
    assert.ok(Number.parseFloat(token.value) <= 6, `${name} is ${token.value}`);
  }
});

test("headings use Outfit 500 and 600 is kept for highlighted words (owner ruling 4)", () => {
  assert.equal(String(value("--mq-font-weight-heading")), "500");
  assert.equal(String(value("--mq-font-weight-emphasis")), "600");
  assert.match(String(value("--mq-font-family-heading")), /^'?"?Outfit/);
});

test("focus ring is 2 px navy with an offset, white on navy", () => {
  assert.equal(value("--mq-focus-ring-width"), "2px");
  assert.equal(value("--mq-focus-ring-color"), "#0a2463");
  assert.equal(value("--mq-focus-ring-color-on-navy"), "#ffffff");
  assert.match(value("--mq-focus-ring-offset"), /^[1-9]\d*px$/);
});

test("owner rulings 1 to 5 and 9 are cited in token descriptions", () => {
  const descriptions = [...sourceTokens().values()].map(({ token }) => token.$description).join("\n");
  for (const ruling of [1, 2, 3, 4, 5, 9]) {
    assert.match(descriptions, new RegExp(`Owner ruling ${ruling}, 2026-10-09`), `owner ruling ${ruling} is not cited`);
  }
});

test("descriptions cite rulings or decision records, never files or paths", () => {
  const tokens = sourceTokens();
  assert.ok(tokens.size > 0, "no tokens found");
  for (const [key, { token }] of tokens) {
    assert.doesNotMatch(token.$description, /\.(md|css|html|js|ts|py|vue)\b|\/[\w-]+\//, `${key} cites a file`);
  }
});

test("retired tokens are marked $deprecated and alias their replacement", () => {
  const deprecated = [...sourceTokens()].filter(([, { token }]) => token.$deprecated);
  assert.ok(deprecated.length > 0, "no deprecated token");
  for (const [key, { token }] of deprecated) {
    assert.match(token.$value, ALIAS, `${key} must alias its replacement`);
    assert.equal(typeof token.$deprecated, "string", `${key} must say what replaces it`);
  }
});

test("categorical chart palette: ordered, at most seven hues, distinct under colour-vision deficiency", async () => {
  const { minPairwiseDistance, CVD_KINDS } = await loadColorMath();
  const built = builtTokens();
  const series = Object.keys(built)
    .filter((name) => /^--mq-chart-series-\d+$/.test(name))
    .sort((a, b) => Number(a.split("-").at(-1)) - Number(b.split("-").at(-1)));
  assert.ok(series.length >= 3 && series.length <= 7, `${series.length} series`);
  series.forEach((name, index) => assert.equal(name, `--mq-chart-series-${index + 1}`, "series must be numbered 1..n without gaps"));
  assert.equal(built[series[0]].value, value("--mq-accent"), "series 1 is the navy accent");
  // Navy and blue-grey family only: CIELCh hue between 260 and 300 and chroma no higher than
  // navy's (43.5), which keeps out the saturated info blue (55) and every status hue.
  const { toLch } = await loadColorMath();
  for (const name of series) {
    const [, chroma, hue] = toLch(built[name].value);
    assert.ok(chroma <= 45 && hue >= 260 && hue <= 300, `${name} ${built[name].value} is outside the navy and blue-grey family`);
  }
  const colours = [...series.map((name) => built[name].value), value("--mq-canvas")];
  for (const kind of ["normal", ...CVD_KINDS]) {
    const { distance, pair } = minPairwiseDistance(colours, kind);
    assert.ok(distance >= 10, `${kind}: ${pair.join(" and ")} are only ${distance.toFixed(2)} apart (CIEDE2000, minimum 10)`);
  }
});

test("every declared contrast pair passes its threshold", async () => {
  const { loadPairs: readPairs, evaluatePair } = await loadPairs();
  const pairs = readPairs(pairsFile);
  assert.ok(pairs.length > 0, "no contrast pair declared");
  const built = builtTokens();
  for (const pair of pairs) {
    const result = evaluatePair(pair, built);
    assert.ok(result.pass, `${pair.fg} on ${[pair.bg].flat().join(" over ")} is ${result.ratio.toFixed(2)}:1, ${pair.use} needs ${result.required}:1`);
  }
});

test("the contrast allow-list covers every pair the plan requires", async () => {
  const { loadPairs: readPairs, isDeclared } = await loadPairs();
  const pairs = readPairs(pairsFile);
  const navy = ["--mq-accent", "--mq-panel-start"];
  const required = [
    ...["--mq-ink", "--mq-muted", "--mq-tertiary"].flatMap((fg) => ["--mq-canvas", "--mq-surface"].map((bg) => [fg, bg, "text"])),
    ...["title", "secondary", "second-level", "accent", "discreet"].flatMap((role) => navy.map((bg) => [`--mq-on-navy-${role}`, bg, "any"])),
    ...["rule", "pill"].map((role) => [`--mq-on-navy-${role}`, "--mq-accent", "any"]),
    ["--mq-ink", "--mq-warning-fill", "text"],
    ["--mq-warning", "--mq-surface", "text"],
    ["--mq-warning", "--mq-warning-tint", "any"],
    ["--mq-ink", "--mq-warning-tint", "text"],
    ...["--mq-success", "--mq-warning", "--mq-danger", "--mq-info"].map((fg) => [fg, "--mq-surface", "text"]),
    ["--mq-focus-ring-color", "--mq-canvas", "any"],
    ["--mq-focus-ring-color-on-navy", "--mq-accent", "any"],
  ];
  for (const [fg, bg, use] of required) {
    assert.ok(isDeclared(pairs, { fg, bg: [bg], use }), `${fg} on ${bg} (${use}) is not declared`);
  }
});

test("on-navy pairs below AA are restricted to large text or non-text use (owner ruling 2)", async () => {
  const { loadPairs: readPairs, evaluatePair } = await loadPairs();
  const built = builtTokens();
  for (const pair of readPairs(pairsFile).filter((entry) => entry.fg.startsWith("--mq-on-navy-"))) {
    const { ratio } = evaluatePair(pair, built);
    if (ratio < 4.5) assert.notEqual(pair.use, "text", `${pair.fg} on ${pair.bg} is ${ratio.toFixed(2)}:1 but declared as text`);
  }
});

test("white on the warning fill is never declared (owner ruling 5)", async () => {
  const { loadPairs: readPairs, evaluatePair } = await loadPairs();
  const forbidden = { fg: "--mq-on-accent", bg: ["--mq-warning-fill"], use: "text" };
  assert.ok(evaluatePair({ ...forbidden, use: "non-text" }, builtTokens()).ratio < 3);
  for (const fg of ["--mq-on-accent", "--mq-on-navy-title", "--mq-surface"]) {
    const declared = readPairs(pairsFile).some((pair) => pair.fg === fg && [pair.bg].flat()[0] === "--mq-warning-fill");
    assert.ok(!declared, `${fg} on --mq-warning-fill must not be declared`);
  }
});

test("a colour pairing used in CSS without a declaration fails", async () => {
  const { loadPairs: readPairs, findCssPairings, undeclaredPairings } = await loadPairs();
  const pairs = readPairs(pairsFile);
  const bad = undeclaredPairings(findCssPairings(readFileSync(join(fixtures, "undeclared.css"), "utf8")), pairs);
  assert.deepEqual(
    bad.map(({ fg, bg }) => `${fg} on ${bg.join(" over ")}`),
    ["--mq-muted on --mq-warning-fill"],
  );
  const good = findCssPairings(readFileSync(join(fixtures, "declared.css"), "utf8"));
  assert.ok(good.length >= 5, `expected at least five pairings, found ${good.length}`);
  assert.deepEqual(undeclaredPairings(good, pairs), []);
});

test("every colour pairing in css/ is declared", async () => {
  const { loadPairs: readPairs, findCssPairings, undeclaredPairings } = await loadPairs();
  const cssDir = join(root, "css");
  const files = existsSync(cssDir) ? readdirSync(cssDir, { recursive: true }).filter((name) => name.endsWith(".css")) : [];
  const pairs = readPairs(pairsFile);
  for (const file of files) {
    const bad = undeclaredPairings(findCssPairings(readFileSync(join(cssDir, file), "utf8")), pairs);
    assert.deepEqual(bad, [], `undeclared pairings in css/${file}`);
  }
});

test("no file under dist/ names a framework (ADR-0002 framework neutrality)", () => {
  const dist = join(root, "dist");
  assert.ok(existsSync(dist), "dist/ is missing: run make build first");
  for (const file of readdirSync(dist, { recursive: true })) {
    const path = join(dist, file);
    if (!/\.(css|json|txt|html|js|mjs)$/.test(path)) continue;
    // Embedded font data is base64, where any three letters occur by chance.
    const text = readFileSync(path, "utf8").replace(/url\(data:[^)]*\)/g, "url(data:)");
    assert.doesNotMatch(text, /vue|nuxt|--ui-|react|jsx/i, `dist/${file} names a framework`);
  }
});
