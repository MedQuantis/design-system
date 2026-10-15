import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, join, relative } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const at = (...parts) => join(root, ...parts);
const read = (...parts) => {
  const path = at(...parts);
  assert.ok(existsSync(path), `${relative(root, path)} is missing`);
  return readFileSync(path, "utf8");
};
const readPackage = () => JSON.parse(read("package.json"));
const loadCopyFonts = () => import("../../scripts/copy-fonts.mjs");
const loadScanner = () => import("../../scripts/confidentiality-check.mjs");

const walk = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
};

// Weights each family must render without synthesis: Outfit carries the wordmark (300, 600),
// UI text (400), headings (500, ruling 4) and highlighted words (600); Newsreader body text
// (400) and its bold (600), roman and italic; Geist Mono figures (400) and hero figures (500).
const REQUIRED = [
  { dir: "outfit", family: "Outfit", weights: [300, 400, 500, 600], styles: ["normal"] },
  { dir: "newsreader", family: "Newsreader", weights: [400, 600], styles: ["normal", "italic"] },
  { dir: "geist-mono", family: "Geist Mono", weights: [400, 500], styles: ["normal"] },
];

const unquote = (value) => value.trim().replace(/^['"]|['"]$/g, "");
const fontFaces = (css) =>
  [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
    const prop = (name) => body.match(new RegExp(`(?:^|[;\\s])${name}\\s*:\\s*([^;]+);`))?.[1]?.trim();
    const [min, max = min] = (prop("font-weight") ?? "400").split(/\s+/).map(Number);
    return {
      body,
      family: unquote(prop("font-family") ?? ""),
      style: prop("font-style") ?? "normal",
      display: prop("font-display"),
      min,
      max,
      urls: [...body.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1]),
    };
  });

const WOFF2_MAGIC = "wOF2";
const isRemote = (url) => /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(url) && !url.startsWith("data:");

// --- Fonts -------------------------------------------------------------------------------

test("each declared font weight has a woff2 file and an OFL licence file", () => {
  const faces = fontFaces(read("fonts/fonts.css"));
  assert.ok(faces.length > 0, "fonts/fonts.css declares no @font-face");
  for (const { dir, family, weights, styles } of REQUIRED) {
    const licence = read("fonts", dir, "OFL.txt");
    assert.match(licence, /SIL Open Font License/, `fonts/${dir}/OFL.txt is not the OFL`);
    for (const style of styles) {
      for (const weight of weights) {
        const matching = faces.filter((face) => face.family === family && face.style === style && face.min <= weight && weight <= face.max);
        assert.ok(matching.length > 0, `no @font-face for ${family} ${weight} ${style}`);
        for (const face of matching) {
          for (const url of face.urls) {
            assert.equal(extname(url), ".woff2", `${family}: ${url} is not woff2`);
            const file = at("fonts", url);
            assert.ok(existsSync(file), `${family}: fonts/${url} is missing`);
            assert.ok(relative(at("fonts", dir), file).split("/")[0] !== "..", `${family}: ${url} is outside fonts/${dir}/`);
            assert.equal(readFileSync(file).toString("latin1", 0, 4), WOFF2_MAGIC, `fonts/${url} is not a woff2 file`);
          }
        }
      }
    }
  }
});

test("Outfit covers every core font weight token", () => {
  const weights = JSON.parse(read("tokens/core/font.tokens.json")).core.font.weight;
  const values = Object.entries(weights).filter(([key]) => !key.startsWith("$")).map(([, token]) => token.$value);
  assert.ok(values.length > 0);
  const outfit = fontFaces(read("fonts/fonts.css")).filter((face) => face.family === "Outfit");
  for (const weight of values) assert.ok(outfit.some((face) => face.min <= weight && weight <= face.max), `Outfit ${weight} not covered`);
});

test("fonts/fonts.css references only relative paths and swaps", () => {
  const css = read("fonts/fonts.css");
  assert.doesNotMatch(css, /@import/, "fonts.css must not import another sheet");
  for (const face of fontFaces(css)) {
    assert.equal(face.display, "swap", `${face.family}: font-display must be swap`);
    assert.ok(face.urls.length > 0, `${face.family}: no src url`);
    for (const url of face.urls) {
      assert.ok(!isRemote(url) && !url.startsWith("/"), `${face.family}: ${url} is not a relative path`);
    }
  }
});

test("latin and latin-ext subsets are both shipped for every family", () => {
  const faces = fontFaces(read("fonts/fonts.css"));
  for (const { family } of REQUIRED) {
    const ranges = faces.filter((face) => face.family === family).map((face) => face.body.match(/unicode-range\s*:\s*([^;]+);/)?.[1] ?? "");
    assert.ok(ranges.some((range) => range.includes("U+0000-00FF")), `${family}: no latin subset`);
    assert.ok(ranges.some((range) => range.includes("U+0100-02BA")), `${family}: no latin-ext subset`);
  }
});

test("committed fonts are byte-identical to the exact-pinned fontsource packages", async () => {
  const { FONTS } = await loadCopyFonts();
  const devDependencies = readPackage().devDependencies ?? {};
  assert.ok(FONTS.length >= 3);
  const committed = new Set(walk(at("fonts")).filter((file) => file.endsWith(".woff2")).map((file) => relative(at("fonts"), file)));
  const expected = new Set();
  for (const font of FONTS) {
    assert.match(devDependencies[font.package] ?? "", /^\d+\.\d+\.\d+$/, `${font.package} is not an exact devDependency`);
    const installed = JSON.parse(read("node_modules", font.package, "package.json")).version;
    assert.equal(installed, devDependencies[font.package], `${font.package}: installed ${installed}, run npm ci`);
    for (const { file } of font.files) {
      const target = join(font.dir, file);
      expected.add(target);
      const source = readFileSync(at("node_modules", font.package, "files", file));
      assert.ok(existsSync(at("fonts", target)), `fonts/${target} is missing: run make assets`);
      assert.ok(source.equals(readFileSync(at("fonts", target))), `fonts/${target} differs from ${font.package}: run make assets`);
    }
    const licence = readFileSync(at("node_modules", font.package, "LICENSE"));
    assert.ok(licence.equals(readFileSync(at("fonts", font.dir, "OFL.txt"))), `fonts/${font.dir}/OFL.txt differs from ${font.package}`);
  }
  assert.deepEqual([...committed].sort(), [...expected].sort(), "fonts/ holds woff2 files the copy script does not produce");
});

// --- Remote requests ---------------------------------------------------------------------

// Licence texts name their origin as prose; the SVG namespace is an identifier, never fetched.
const LICENCE_FILE = /(?:^|\/)(?:OFL\.txt|LICENSE)$/;
const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const CDN_HOST = /fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com|jsdelivr\.net|cdnjs\.cloudflare\.com/i;
const TEXT_EXTENSIONS = new Set([".css", ".json", ".js", ".mjs", ".svg", ".html", ".txt", ".md", ""]);
// The llms files, the kit guidance and DESIGN.md are documentation for language models and agents:
// their links point readers at the CDN release or an issue and are never loaded by a page.
const LLM_DOCS = new Set(["dist/llms.txt", "dist/llms-full.txt", "dist/kit/guidance.md", "dist/DESIGN.md"]);

test("no shipped file requests a remote font, icon or stylesheet", () => {
  const files = ["fonts", "icons", "brand", "css", "dist"].flatMap((dir) => walk(at(dir)));
  assert.ok(files.some((file) => file.startsWith(at("fonts"))), "fonts/ is empty");
  for (const file of files) {
    const name = relative(root, file);
    if (!TEXT_EXTENSIONS.has(extname(file)) || LLM_DOCS.has(name)) continue;
    const text = readFileSync(file, "utf8");
    assert.doesNotMatch(text, CDN_HOST, `${name} names a font or script CDN`);
    for (const [, url] of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) assert.ok(!isRemote(url), `${name}: remote url(${url.slice(0, 60)})`);
    assert.doesNotMatch(text, /@import\s+(?:url\()?\s*['"]?(?:[a-z]+:)?\/\//i, `${name}: remote @import`);
    if (LICENCE_FILE.test(name)) continue;
    const remote = (text.match(/https?:\/\/[^\s"'()<>]+/g) ?? []).filter((url) => url !== SVG_NAMESPACE);
    assert.deepEqual(remote, [], `${name} contains remote URLs`);
  }
});

// --- Brand -------------------------------------------------------------------------------

const MONOGRAMS = ["brand/monogram.svg", "brand/monogram-square.svg", "brand/monogram-small.svg", "brand/favicon/favicon.svg"];
const WORDMARKS = {
  "on-light": { fill: "#0a2463" },
  "on-navy": { fill: "#ffffff" },
};
const NAVY = "#0a2463";

test("every SVG under icons/ and brand/ passes the confidentiality metadata check", async () => {
  const { scan } = await loadScanner();
  const files = [...walk(at("icons")), ...walk(at("brand"))].filter((file) => file.endsWith(".svg")).map((file) => relative(root, file));
  assert.ok(files.length >= MONOGRAMS.length + 4, `expected the monograms and four wordmarks, found ${files.length} SVGs`);
  assert.deepEqual(scan({ root, files, denylist: [] }), []);
  for (const file of files) {
    const svg = read(file);
    assert.doesNotMatch(svg, /<metadata\b|<!--|<\?xml-stylesheet|xlink:href=["'](?!#)|<image\b/i, `${file} carries metadata, comments or external references`);
  }
});

test("monogram, favicon and print wordmark SVGs contain no <text> element", () => {
  const outlined = [...MONOGRAMS, ...Object.keys(WORDMARKS).map((variant) => `brand/wordmark-${variant}-print.svg`)];
  for (const file of outlined) {
    const svg = read(file);
    assert.doesNotMatch(svg, /<text\b|<tspan\b/, `${file} must be outlined`);
    assert.match(svg, /<path\b/, `${file} has no outline paths`);
  }
});

test("favicon.svg is the rounded monogram on navy (ruling 7)", () => {
  assert.equal(read("brand/favicon/favicon.svg"), read("brand/monogram.svg"));
  for (const file of MONOGRAMS) assert.match(read(file), new RegExp(`<rect[^>]*fill="${NAVY}"`), `${file} is not on navy`);
  assert.match(read("brand/monogram.svg"), /<rect[^>]*rx="8"/);
  assert.match(read("brand/monogram-square.svg"), /<rect[^>]*rx="0"/);
});

test("screen wordmarks set Med in Outfit 600 and Quantis in Outfit 300 as live text (ruling 6)", () => {
  for (const [variant, { fill }] of Object.entries(WORDMARKS)) {
    const file = `brand/wordmark-${variant}.svg`;
    const svg = read(file);
    assert.match(svg, /<text\b[^>]*font-family="Outfit,[^"]*"/, `${file}: live text in Outfit`);
    assert.match(svg, new RegExp(`<text\\b[^>]*fill="${fill}"`), `${file}: text fill ${fill}`);
    assert.match(svg, /<tspan font-weight="600">Med<\/tspan><tspan font-weight="300">Quantis<\/tspan>/, `${file}: Med 600, Quantis 300`);
  }
});

test("print wordmarks are the outlined screen wordmarks, same box and colour", () => {
  for (const [variant, { fill }] of Object.entries(WORDMARKS)) {
    const screen = read(`brand/wordmark-${variant}.svg`);
    const print = read(`brand/wordmark-${variant}-print.svg`);
    const viewBox = (svg) => svg.match(/viewBox="([^"]+)"/)?.[1];
    assert.ok(viewBox(screen), `wordmark-${variant}.svg has no viewBox`);
    assert.equal(viewBox(print), viewBox(screen), `wordmark-${variant}: print and screen boxes differ`);
    const fills = [...print.matchAll(/fill="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(fills.length > 0 && fills.every((value) => value === fill), `wordmark-${variant}-print.svg fills ${fills.join(", ")}`);
  }
});

test("the outline script pins fontTools exactly and outlines the pinned fontsource Outfit", () => {
  const script = read("scripts/outline-brand.py");
  const metadata = script.match(/^# \/\/\/ script\n([\s\S]*?)^# \/\/\/$/m)?.[1];
  assert.ok(metadata, "scripts/outline-brand.py has no PEP 723 metadata block");
  const dependencies = [...metadata.matchAll(/"([A-Za-z0-9_.-]+)([^"]*)"/g)].filter(([, name]) => name !== "requires-python");
  const names = dependencies.map(([, name]) => name.toLowerCase());
  assert.ok(names.includes("fonttools"), "fontTools is not a script dependency");
  for (const [, name, spec] of dependencies) assert.match(spec, /^==\d+(\.\d+)*$/, `${name} is not pinned exactly (${spec})`);
  const makefile = read("Makefile");
  assert.match(makefile, /^brand:/m, "Makefile has no brand target");
  assert.match(makefile, /^brand-check:/m, "Makefile has no brand-check target");
  assert.match(makefile, /node_modules\/@fontsource-variable\/outfit\/files\/outfit-latin-wght-normal\.woff2/, "brand target does not read the fontsource Outfit file");
});

// --- Icons -------------------------------------------------------------------------------

test("the Lucide build is pinned in a manifest with its ISC licence", () => {
  const manifest = JSON.parse(read("icons/manifest.json"));
  const devDependencies = readPackage().devDependencies ?? {};
  assert.equal(manifest.package, "lucide");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/, "Lucide version is not exact");
  assert.equal(devDependencies.lucide, manifest.version, "manifest and package.json disagree on the Lucide version");
  assert.equal(manifest.licence, "ISC");
  const build = readFileSync(at("icons", manifest.file));
  assert.equal(manifest.file, "lucide.min.js");
  assert.match(build.toString("utf8", 0, 200), new RegExp(`@license lucide v${manifest.version.replaceAll(".", "\\.")} - ISC`));
  assert.equal(manifest.sha256, createHash("sha256").update(build).digest("hex"), "icons/lucide.min.js does not match its manifest hash");
  assert.match(read("icons/LICENSE"), /^ISC License/);
});

test("committed Lucide build is byte-identical to the pinned package", () => {
  const manifest = JSON.parse(read("icons/manifest.json"));
  const installed = JSON.parse(read("node_modules/lucide/package.json")).version;
  assert.equal(installed, manifest.version, `node_modules has lucide ${installed}: run npm ci`);
  assert.ok(readFileSync(at("node_modules/lucide/dist/umd/lucide.min.js")).equals(readFileSync(at("icons/lucide.min.js"))), "icons/lucide.min.js differs: run make assets");
  assert.ok(readFileSync(at("node_modules/lucide/LICENSE")).equals(readFileSync(at("icons/LICENSE"))), "icons/LICENSE differs: run make assets");
});
