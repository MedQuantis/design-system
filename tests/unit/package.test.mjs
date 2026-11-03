import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const pkg = () => JSON.parse(read("package.json"));

// Exactly what a consumer may import; anything else is internal and may move without a major.
const EXPORTS = [
  "./tokens.css",
  "./tokens.json",
  "./tailwind.css",
  "./themes/dark.css",
  "./themes/dark.json",
  "./kit-contract.css",
  "./kit/*",
  "./kit-manifest.json",
  "./DESIGN.md",
  "./css/*",
  "./fonts.css",
  "./brand/*",
  "./stylelint",
  "./package.json",
];

// The generated files a release ships; the specimen, eval reports and the skill zip stay local.
// kit-manifest.json is generated too, at the root, because the kit reads it there only.
const DIST_FILES = [
  "dist/tokens.css",
  "dist/tokens.json",
  "dist/tailwind.css",
  "dist/themes/dark.css",
  "dist/themes/dark.json",
  "dist/kit-contract.css",
  ...["core", "dataviz", "type", "space-shape", "brand", "document", "slide-frame", "dark", "print"].map((module) => `dist/kit/${module}.css`),
  "dist/kit/guidance.md",
  "dist/DESIGN.md",
  "dist/llms.txt",
  "dist/llms-full.txt",
];
const SHIPPED_FOLDERS = ["css/", "fonts/", "icons/", "brand/", "guidelines/"];
const ROOT_FILES = ["LICENSE", "README.md", "package.json", "stylelint.config.mjs", "kit-manifest.json"];
const LICENCE_FILES = ["LICENSE", "brand/LICENSE", "guidelines/LICENSE", "icons/LICENSE", "fonts/outfit/OFL.txt", "fonts/newsreader/OFL.txt", "fonts/geist-mono/OFL.txt"];

let packed;
const tarball = () => {
  if (packed) return packed;
  // make test-unit builds dist/ first, so the dry run sees what a release would publish.
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: root, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  packed = JSON.parse(result.stdout)[0].files.map((file) => file.path);
  return packed;
};

test("the npm tarball holds only the built tokens, css, fonts, icons, brand, guidelines, licences and README", () => {
  const files = tarball();
  const allowed = (path) => DIST_FILES.includes(path) || ROOT_FILES.includes(path) || SHIPPED_FOLDERS.some((folder) => path.startsWith(folder));
  const strays = files.filter((path) => !allowed(path));
  assert.deepEqual(strays, [], `files outside the allow-list: ${strays.join(", ")}`);
  for (const folder of ["tests/", "scripts/", "docs/", "plugins/", "tokens/", "build/", "examples/", "dist/specimen/", "dist/skill-evals/", "dist/claude-design-system/", ".github/"]) {
    assert.ok(!files.some((path) => path.startsWith(folder)), `${folder} must not ship`);
  }
  for (const file of [...DIST_FILES, ...LICENCE_FILES, "README.md", "kit-manifest.json"]) assert.ok(files.includes(file), `${file} is missing from the tarball`);
});

test("package.json exports every subpath consumers use, and each target ships", () => {
  const { exports } = pkg();
  assert.deepEqual(Object.keys(exports ?? {}).sort(), [...EXPORTS].sort());
  const files = tarball();
  for (const [subpath, target] of Object.entries(exports)) {
    const path = target.replace(/^\.\//, "");
    if (path.includes("*")) {
      const [prefix, suffix] = path.split("*");
      assert.ok(files.some((file) => file.startsWith(prefix) && file.endsWith(suffix)), `${subpath} matches no shipped file`);
    } else {
      assert.ok(files.includes(path), `${subpath} points at ${path}, which does not ship`);
    }
  }
});

test("the package is publishable to the public registry from the GitHub repo", () => {
  const data = pkg();
  assert.notEqual(data.private, true, "private: true blocks npm publish");
  assert.equal(data.name, "@medquantis/design-system");
  assert.equal(data.publishConfig?.access, "public");
  // Trusted publishing and provenance compare this URL with the workflow's repository.
  assert.deepEqual(data.repository, { type: "git", url: "git+https://github.com/MedQuantis/design-system.git" });
});

test("consumers need Node 24 or later; contributors run the exact mise.toml Node (owner, 2026-10-10)", () => {
  const data = pkg();
  assert.equal(data.engines?.node, ">=24");
  const miseNode = read("mise.toml").match(/^node = "(\d+\.\d+\.\d+)"$/m)?.[1];
  assert.ok(miseNode, "mise.toml does not pin node exactly");
  assert.deepEqual(data.devEngines?.runtime, { name: "node", version: miseNode, onFail: "error" });
});

// Runtime dependencies would force stylelint (their required peer) into every consumer, so the
// plugins stay devDependencies and the README tells a linting consumer what to install.
test("the README names the stylelint version and the plugins the exported config loads", () => {
  const data = pkg();
  const config = read("stylelint.config.mjs");
  const readme = read("README.md");
  assert.equal(data.dependencies, undefined, "the package has no runtime dependency");
  assert.match(readme, new RegExp(`stylelint@${data.devDependencies.stylelint.replace(/\./g, "\\.")}`));
  for (const plugin of ["stylelint-declaration-strict-value", "stylelint-value-no-unknown-custom-properties"]) {
    assert.match(config, new RegExp(`"${plugin}"`), `${plugin} is not loaded by the config`);
    assert.match(readme, new RegExp(`${plugin}@${data.devDependencies[plugin].replace(/\./g, "\\.")}`), `README does not name ${plugin} at its version`);
  }
});

test("README documents CDN use with an exact version and an SRI hash, never a range or a gh/ URL", () => {
  const readme = read("README.md");
  const urls = [...readme.matchAll(/https:\/\/cdn\.jsdelivr\.net\/[^\s"'<>)`]+/g)].map((m) => m[0]);
  assert.ok(urls.length > 0, "README has no jsDelivr URL");
  for (const url of urls) {
    assert.match(url, /^https:\/\/cdn\.jsdelivr\.net\/npm\/@medquantis\/design-system@(\d+\.\d+\.\d+|X\.Y\.Z)\//, `not an exact npm version: ${url}`);
  }
  assert.ok(urls.some((url) => url.endsWith("/dist/tokens.css")), "no CDN URL for dist/tokens.css");
  assert.match(readme, /integrity="sha384-/);
  assert.match(readme, /crossorigin="anonymous"/);
  assert.match(readme, /openssl dgst -sha384 -binary dist\/tokens\.css \| openssl base64 -A/);
  assert.doesNotMatch(readme, /cdn\.jsdelivr\.net\/gh\//);
  assert.doesNotMatch(readme, /—/, "README carries an em dash");
});

// Increment 05 of Plan-0002: a consumer repo learns from the README how to render with the
// delivery-comms kit, where DESIGN.md is, and how to enable the plugin and brief its agents.
// Plan-0003 increment 05 adds the dark module (contract 2.1.0).
const KIT_MODULES = ["core", "dataviz", "type", "space-shape", "document", "slide-frame", "dark", "print", "brand", "guidance"];

// A level-two README section, to the next level-two heading outside a code block (the AGENTS.md lines hold one).
function readmeSection(readme, heading) {
  const lines = readme.split("\n");
  const start = lines.indexOf(heading);
  if (start < 0) return undefined;
  let fenced = false;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].startsWith("```")) fenced = !fenced;
    else if (!fenced && lines[i].startsWith("## ")) return lines.slice(start, i).join("\n");
  }
  return lines.slice(start).join("\n");
}

test("README explains use from the delivery-comms kit, DESIGN.md, the agent lines and the plugin settings", () => {
  const readme = read("README.md");
  const section = readmeSection(readme, "## Using it from the delivery-comms kit");
  assert.ok(section, "README has no section Using it from the delivery-comms kit");
  assert.match(section, /docs\/ux\/package\.json/);
  assert.match(section, /ux-design-system point @medquantis\/design-system@\d+\.\d+\.\d+/);
  for (const module of KIT_MODULES) assert.match(section, new RegExp("`" + module + "`"), `the kit section does not name the ${module} module`);
  assert.match(section, /https:\/\/github\.com\/VictorHueni\/homemade-claude-kit\/blob\/[\w./-]+\/plugins\/delivery-comms\/skills\/ux-design-system\/references\/agents-md-block\.md/);
  assert.doesNotMatch(section, /## Design system \(delivery-comms\)/, "link the kit's AGENTS.md block, do not copy it");
  assert.match(readme, /`dist\/DESIGN\.md`/);
  assert.match(section, /CLAUDE\.md/);
  assert.match(section, /AGENTS\.md/);
  const json = section.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(json, "the kit section has no .claude/settings.json snippet");
  const settings = JSON.parse(json[1]);
  assert.deepEqual(settings.extraKnownMarketplaces?.medquantis?.source, { source: "github", repo: "MedQuantis/design-system" });
  assert.equal(settings.enabledPlugins?.["medquantis-design-system@medquantis"], true);
  assert.doesNotMatch(section, /[–—]/, "the kit section carries an em or en dash");
  // Plan-0003 increment 05: the kit version the dark module needs, and the classification cell.
  assert.match(section, /delivery-comms 2\.1\.0/, "the kit section does not name the kit version the dark module needs");
  assert.match(section, /2\.0 kit refuses the unknown `dark` module/);
  assert.match(section, /classification:/, "the kit section does not say how a deck sets its classification");
});

// Plan-0003 increment 05: a consumer learns from the README how to turn the dark theme on.
test("README explains the dark theme: the exported file, the .dark class, the Tailwind 4 variant and build-time documents", () => {
  const readme = read("README.md");
  const section = readmeSection(readme, "## Dark theme");
  assert.ok(section, "README has no section Dark theme");
  const exports = JSON.parse(read("package.json")).exports;
  const imports = [...section.matchAll(/@import "@medquantis\/design-system\/([^"]+)"/g)].map((match) => `./${match[1]}`);
  assert.ok(imports.includes("./themes/dark.css"), "the dark theme section does not import themes/dark.css");
  for (const path of imports) assert.ok(exports[path], `${path} is not a package export`);
  assert.ok(imports.indexOf("./themes/dark.css") > imports.indexOf("./tailwind.css"), "themes/dark.css loads after the tokens");
  assert.match(section, /`\.dark`/);
  assert.match(section, /@custom-variant dark \(&:where\(\.dark, \.dark \*\)\);/);
  assert.match(section, /Nuxt UI 4/);
  assert.match(section, /build time/);
  assert.doesNotMatch(section, /[–—]/, "the dark theme section carries an em or en dash");
});
