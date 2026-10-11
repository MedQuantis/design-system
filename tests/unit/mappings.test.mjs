import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const dist = (file) => join(root, "dist", file);
const namesFixture = join(root, "tests/fixtures/kit-contract-names.txt");

const loadColorMath = () => import("../../build/color-math.mjs");
const loadScales = () => import("../../build/scales.mjs");

const readDist = (file) => {
  const path = dist(file);
  assert.ok(existsSync(path), `${relative(root, path)} is missing: run make build first`);
  return readFileSync(path, "utf8");
};

// Last declaration wins, as in the cascade.
const declarations = (css) => {
  const map = new Map();
  for (const [, name, value] of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) map.set(name, value.trim());
  return map;
};
const mqTokens = () => declarations(readDist("tokens.css"));

const themeBlocks = (css, kind) => [...css.matchAll(new RegExp(`@theme\\s+${kind}\\s*\\{([^}]*)\\}`, "g"))].map((m) => m[1]);
const themeDeclarations = (kind) => declarations(themeBlocks(readDist("tailwind.css"), kind).join("\n"));

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const SCALES = { navy: "--mq-accent", success: "--mq-success", warning: "--mq-warning", danger: "--mq-danger", info: "--mq-info" };
const HEX6 = /^#[0-9a-f]{6}$/;

const kitNames = () => {
  assert.ok(existsSync(namesFixture), "tests/fixtures/kit-contract-names.txt is missing");
  return readFileSync(namesFixture, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
};

// OKLab reference values from Ottosson's published conversion (sRGB primaries and white).
test("OKLCH conversion matches reference values and round-trips 8-bit colours", async () => {
  const { toOklch, oklchToHex } = await loadColorMath();
  const close = (actual, expected, tolerance, label) =>
    assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not ${expected}`);
  const [lw, cw] = toOklch("#ffffff");
  close(lw, 1, 1e-4, "white L");
  close(cw, 0, 1e-4, "white C");
  const [lr, cr, hr] = toOklch("#ff0000");
  close(lr, 0.62796, 1e-4, "red L");
  close(cr, 0.25768, 1e-4, "red C");
  close(hr, 29.2339, 1e-2, "red h");
  const [lb, cb, hb] = toOklch("#0000ff");
  close(lb, 0.45201, 1e-4, "blue L");
  close(cb, 0.31321, 1e-4, "blue C");
  close(hb, 264.052, 1e-2, "blue h");
  for (const hex of ["#0a2463", "#a06400", "#d8232a", "#2e7d32", "#1565c0", "#fafaf8"]) {
    assert.equal(oklchToHex(toOklch(hex)), hex, `${hex} does not round-trip`);
  }
});

test("dist/tailwind.css has a @theme static block and a @theme inline block", () => {
  const css = readDist("tailwind.css");
  assert.equal(themeBlocks(css, "static").length, 1, "expected exactly one @theme static block");
  assert.equal(themeBlocks(css, "inline").length, 1, "expected exactly one @theme inline block");
});

test("navy scale --color-navy-50 to -950 in @theme static, -500 is the accent", () => {
  const theme = themeDeclarations("static");
  for (const step of STEPS) assert.match(theme.get(`--color-navy-${step}`) ?? "", HEX6, `--color-navy-${step}`);
  assert.equal(theme.get("--color-navy-500"), "#0a2463");
  assert.equal(theme.get("--color-navy-500"), mqTokens().get("--mq-accent"));
});

test("success, warning, danger and info scales in @theme static, -500 is the status token", () => {
  const theme = themeDeclarations("static");
  const tokens = mqTokens();
  for (const [scale, token] of Object.entries(SCALES)) {
    for (const step of STEPS) assert.match(theme.get(`--color-${scale}-${step}`) ?? "", HEX6, `--color-${scale}-${step}`);
    assert.equal(theme.get(`--color-${scale}-500`), tokens.get(token), `--color-${scale}-500 is not ${token}`);
  }
  const statusScales = new Set([...theme.keys()].map((name) => name.match(/^--color-([a-z]+)-\d+$/)?.[1]).filter(Boolean));
  assert.deepEqual([...statusScales].sort(), Object.keys(SCALES).sort(), "unexpected colour scale (no framework aliases such as error)");
});

test("scales are derived in OKLCH: one hue, lightness falling step by step, generated not hand-picked", async () => {
  const { toOklch } = await loadColorMath();
  const { deriveScale } = await loadScales();
  const theme = themeDeclarations("static");
  const tokens = mqTokens();
  for (const [scale, token] of Object.entries(SCALES)) {
    const derived = deriveScale(tokens.get(token));
    assert.deepEqual(derived.map(({ step }) => step), STEPS, `${scale} steps`);
    for (const { step, hex } of derived) assert.equal(theme.get(`--color-${scale}-${step}`), hex, `${scale}-${step} differs from the generator`);
    const lch = STEPS.map((step) => toOklch(theme.get(`--color-${scale}-${step}`)));
    for (let i = 1; i < lch.length; i += 1) {
      assert.ok(lch[i][0] < lch[i - 1][0], `${scale}-${STEPS[i]} is not darker than ${scale}-${STEPS[i - 1]}`);
    }
    const anchorHue = toOklch(tokens.get(token))[2];
    for (const [i, [, chroma, hue]] of lch.entries()) {
      // 8-bit rounding moves the hue of near-neutral colours; only chromatic steps are held to it.
      if (chroma < 0.02) continue;
      const delta = Math.abs(((hue - anchorHue + 540) % 360) - 180);
      assert.ok(delta <= 2, `${scale}-${STEPS[i]} hue ${hue.toFixed(1)} drifts from ${anchorHue.toFixed(1)}`);
    }
  }
});

test("warning scale keeps owner ruling 5: -500 is the text colour #a06400, white on it passes AA", async () => {
  const { contrastRatio } = await loadColorMath();
  const theme = themeDeclarations("static");
  assert.equal(theme.get("--color-warning-500"), "#a06400");
  assert.ok(contrastRatio("#ffffff", theme.get("--color-warning-500")) >= 4.5);
  assert.notEqual(theme.get("--color-warning-500"), mqTokens().get("--mq-warning-fill"), "the fill-only colour is not the scale anchor");
});

test("--font-sans maps to Outfit through @theme inline", () => {
  const inline = themeDeclarations("inline");
  const value = inline.get("--font-sans");
  assert.ok(value, "--font-sans is not in @theme inline");
  const ref = value.match(/^var\((--mq-[\w-]+)\)$/)?.[1];
  assert.ok(ref, `--font-sans should point at an --mq- token, got ${value}`);
  assert.match(mqTokens().get(ref) ?? "", /^Outfit,/);
});

test("@theme inline only points at defined --mq- tokens; @theme static holds no var()", () => {
  const tokens = mqTokens();
  const inline = themeDeclarations("inline");
  assert.ok(inline.size > 0, "@theme inline is empty");
  for (const [name, value] of inline) {
    const ref = value.match(/^var\((--mq-[\w-]+)\)$/)?.[1];
    assert.ok(ref, `${name} in @theme inline is not a single var(--mq-*)`);
    assert.ok(tokens.has(ref), `${name} points at undefined ${ref}`);
  }
  for (const [name, value] of themeDeclarations("static")) assert.doesNotMatch(value, /var\(/, `${name} in @theme static uses var()`);
});

test("tailwind.css has no literal hex outside the generated scales and loads tokens.css", () => {
  const css = readDist("tailwind.css");
  const scaleLine = /^\s*--color-(navy|success|warning|danger|info)-\d+:\s*#[0-9a-f]{6};\s*$/;
  for (const line of css.split("\n")) {
    if (/#[0-9a-f]{3,8}\b/i.test(line)) assert.match(line, scaleLine, `literal hex outside a scale: ${line.trim()}`);
  }
  assert.match(css, /@import\s+"\.\/tokens\.css";/);
});

test("the vendored kit name list names its kit plugin and version and includes --font-heading", () => {
  const header = readFileSync(namesFixture, "utf8").split("\n")[0];
  assert.match(header, /delivery-comms plugin \d+\.\d+\.\d+/);
  assert.doesNotMatch(header, /\/home\/|\/Users\//, "no absolute paths in the fixture");
  const names = kitNames();
  assert.ok(names.length >= 20, "kit name list looks truncated");
  for (const name of names) assert.match(name, /^--[a-z][\w-]*$/, `not a custom property name: ${name}`);
  assert.ok(names.includes("--font-heading"));
});

test("dist/kit-contract.css starts with a kit-renderers-only header", () => {
  const css = readDist("kit-contract.css");
  const header = css.match(/^(?:\/\*![^\n]*\n)?\/\*([\s\S]*?)\*\//)?.[1] ?? "";
  assert.match(header, /kit renderers only/i);
  assert.match(header, /never.*load(ed)? in an app/i);
});

test("dist/kit-contract.css defines every kit contract name with a literal value, never var()", () => {
  const css = readDist("kit-contract.css");
  const kit = declarations(css);
  for (const name of kitNames()) {
    assert.ok(kit.has(name), `${name} is not defined`);
    assert.ok(kit.get(name).length > 0, `${name} is empty`);
  }
  assert.doesNotMatch(css, /var\(/, "kit-contract.css must hold literal values");
  for (const name of kit.keys()) assert.doesNotMatch(name, /^--mq-/, `${name}: the kit contract uses the kit's own names`);
});

test("kit colours, fonts and shapes are the generated --mq- values", () => {
  const kit = declarations(readDist("kit-contract.css"));
  const tokens = mqTokens();
  const expected = {
    "--ink": "--mq-ink",
    "--muted": "--mq-muted",
    "--canvas-bg": "--mq-canvas",
    "--surface": "--mq-surface",
    "--surface-2": "--mq-surface-alt",
    "--border": "--mq-border",
    "--accent": "--mq-accent",
    "--accent-ink": "--mq-on-accent",
    "--success": "--mq-success",
    "--warning": "--mq-warning",
    "--danger": "--mq-danger",
    "--info": "--mq-info",
    "--font-body": "--mq-font-family-body",
    "--font-heading": "--mq-font-family-heading",
    "--font-mono": "--mq-font-family-mono",
    "--card-radius": "--mq-radius-medium",
    "--btn-radius": "--mq-radius-small",
    "--node-radius": "--mq-radius-medium",
    // Owner decision 2026-10-10: the kit card elevation is the MedQuantis small shadow.
    "--shadow": "--mq-shadow-small",
  };
  for (const [name, source] of Object.entries(expected)) {
    assert.ok(tokens.has(source), `${source} missing from tokens.css`);
    assert.equal(kit.get(name), tokens.get(source), `${name} should equal ${source}`);
  }
  assert.match(kit.get("--font-body"), /^Newsreader,/);
  assert.match(kit.get("--font-heading"), /^Outfit,/);
  assert.match(kit.get("--font-mono"), /^'Geist Mono',/);
});

test("the release-note chart reads --accent, --ink and --surface as hex", () => {
  // Same lookup as the kit's release-note renderer: last declaration, first hex in its value.
  const css = readDist("kit-contract.css");
  const resolve = (name) => {
    const values = [...css.matchAll(new RegExp(`--${name}:\\s*([^;]+);`, "g"))].map((m) => m[1]);
    for (const value of values.reverse()) {
      const hex = value.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/);
      if (hex) return `#${hex[1]}`;
    }
    return null;
  };
  assert.equal(resolve("accent"), "#0a2463");
  assert.equal(resolve("ink"), mqTokens().get("--mq-ink"));
  assert.equal(resolve("surface"), mqTokens().get("--mq-surface"));
});

test("kit --warning is #a06400 because kit renderers put white text on it", async () => {
  const { contrastRatio } = await loadColorMath();
  const kit = declarations(readDist("kit-contract.css"));
  assert.equal(kit.get("--warning"), "#a06400");
  assert.ok(contrastRatio(kit.get("--accent-ink"), kit.get("--warning")) >= 4.5);
});

test("kit-only values come from the kit token tier and stay out of tokens.css and tokens.json", () => {
  const kitDir = join(root, "tokens/kit");
  assert.ok(existsSync(kitDir), "tokens/kit/ is missing");
  assert.ok(readdirSync(kitDir).some((name) => name.endsWith(".tokens.json")), "no tokens/kit/*.tokens.json");
  assert.doesNotMatch(readDist("tokens.css"), /--mq-kit-/);
  assert.doesNotMatch(readDist("tokens.json"), /--mq-kit-/);
});

// Kit renderers inline docs/ux/tokens.css into the HTML they write elsewhere and ignore
// @import, so a relative url() would resolve against the output file: fonts travel as data.
const KIT_FONTS = { Outfit: "fonts/outfit/outfit-latin-wght-normal.woff2", Newsreader: "fonts/newsreader/newsreader-latin-wght-normal.woff2", "Geist Mono": "fonts/geist-mono/geist-mono-latin-wght-normal.woff2" };
const KIT_CONTRACT_BUDGET = 260 * 1024;

test("dist/kit-contract.css embeds the @font-face rules for the three families as data", () => {
  const css = readDist("kit-contract.css");
  assert.doesNotMatch(css, /@import/, "kit renderers ignore @import");
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  for (const [family, file] of Object.entries(KIT_FONTS)) {
    const face = faces.find((body) => new RegExp(`font-family:\\s*['"]?${family}['"]?;`).test(body));
    assert.ok(face, `no @font-face for ${family}`);
    assert.match(face, /font-display:\s*swap;/, `${family}: font-display must be swap`);
    assert.match(face, /font-weight:\s*\d+ \d+;/, `${family}: the variable weight range is declared`);
    const data = face.match(/url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/)?.[1];
    assert.ok(data, `${family}: src is not a woff2 data URI`);
    assert.ok(Buffer.from(data, "base64").equals(readFileSync(join(root, file))), `${family}: embedded font is not ${file}`);
  }
});

test("dist/kit-contract.css embeds the Newsreader latin italic, so kit renderers stop synthesising it", () => {
  const css = readDist("kit-contract.css");
  const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
  const italic = faces.filter((body) => /font-family:\s*['"]?Newsreader['"]?;/.test(body) && /font-style:\s*italic;/.test(body));
  assert.equal(italic.length, 1, "expected one Newsreader italic face");
  const data = italic[0].match(/url\(data:font\/woff2;base64,([A-Za-z0-9+/=]+)\)/)?.[1];
  assert.ok(data, "the italic src is not a woff2 data URI");
  assert.ok(Buffer.from(data, "base64").equals(readFileSync(join(root, "fonts/newsreader/newsreader-latin-wght-italic.woff2"))));
  assert.equal(faces.filter((body) => /font-style:\s*italic;/.test(body)).length, 1, "only Newsreader carries an italic");
});

// Tailwind 4.3.3 theme.css defines --radius-xs to --radius-4xl and the deprecated bare --radius
// (the plain `rounded` class). Every one is capped by owner ruling 3; overlay is its exception.
const TAILWIND_RADII = ["--radius", "--radius-xs", "--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-2xl", "--radius-3xl", "--radius-4xl"];

test("every Tailwind radius step resolves to 3 or 6 px, rounded-overlay alone to 12 px (owner ruling 3)", () => {
  const tokens = mqTokens();
  const steps = new Map([...themeDeclarations("inline"), ...themeDeclarations("static")].filter(([name]) => /^--radius(-|$)/.test(name)));
  for (const name of [...TAILWIND_RADII, "--radius-overlay"]) assert.ok(steps.has(name), `${name} is not set in tailwind.css`);
  const px = (name) => {
    const ref = steps.get(name).match(/^var\((--mq-[\w-]+)\)$/)?.[1];
    assert.ok(ref, `${name} should point at an --mq- radius token`);
    return tokens.get(ref);
  };
  for (const name of ["--radius", "--radius-xs", "--radius-sm"]) assert.equal(px(name), "3px", name);
  for (const name of ["--radius-md", "--radius-lg", "--radius-xl", "--radius-2xl", "--radius-3xl", "--radius-4xl"]) assert.equal(px(name), "6px", name);
  assert.equal(px("--radius-overlay"), "12px");
  for (const name of steps.keys()) assert.ok([...TAILWIND_RADII, "--radius-overlay"].includes(name), `unexpected radius step ${name}`);
  assert.doesNotMatch(readDist("tailwind.css"), /--radius-full/, "rounded-full stays Tailwind's own, for circles");
});

test("dist/kit-contract.css references no remote URL and stays within its size budget", () => {
  const css = readDist("kit-contract.css");
  for (const [, url] of css.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) assert.ok(url.startsWith("data:"), `kit-contract.css: url(${url.slice(0, 40)}) is not embedded`);
  assert.doesNotMatch(css, /https?:\/\/|fonts\.googleapis|fonts\.gstatic/);
  assert.ok(Buffer.byteLength(css) <= KIT_CONTRACT_BUDGET, `kit-contract.css is ${Buffer.byteLength(css)} bytes, budget ${KIT_CONTRACT_BUDGET}`);
});
