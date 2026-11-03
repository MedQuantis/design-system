import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const PLUGIN = "plugins/medquantis-design-system";
const SKILL = `${PLUGIN}/skills/medquantis-design-system`;
const MEDIA = ["slides", "a4-report", "web", "app", "charts"];
// Status tokens are for interactive apps only (ADR-0004); documents never name them.
const STATUS_TOKENS = /--mq-(success|warning|warning-fill|warning-tint|danger|info)\b/;
// Keys a skill uploaded to claude.ai may carry; any other key is rejected there.
const UPLOAD_KEYS = ["name", "description", "license", "compatibility", "metadata", "allowed-tools"];

// Standard-library modules the skill scripts may import (claude.ai and API containers install nothing).
const STDLIB = new Set(["argparse", "base64", "colorsys", "html", "json", "mimetypes", "os", "pathlib", "re", "sys", "zipfile", "__future__"]);

// Every eval case carries these graders, all on files the run produced except skill-fired.
const EVAL_GRADERS = ["criteria.md", "on-palette.md", "self-contained.md", "skill-fired.md", "validation-clean.md"];

// The value of one frontmatter key of a generated grader (a JSON-quoted string or a bare word).
const graderField = (text, key) => {
  const line = text.match(new RegExp(`^${key}: (.*)$`, "m"));
  if (!line) return undefined;
  return line[1].startsWith('"') ? JSON.parse(line[1]) : line[1];
};
const graderRegex = (text) => new RegExp(graderField(text, "pattern"), graderField(text, "flags") ?? "");

const read = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(read(path));
const pkgVersion = () => readJson("package.json").version;
const python = (args, options = {}) => spawnSync("python3", args, { cwd: root, encoding: "utf8", ...options });

const walk = (dir) =>
  readdirSync(join(root, dir), { recursive: true })
    .map((entry) => join(dir, entry))
    .filter((path) => statSync(join(root, path)).isFile());

// Minimal YAML frontmatter reader: flat keys plus one level of nested keys.
const frontmatter = (text) => {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(match, "SKILL.md has no YAML frontmatter");
  const data = {};
  let parent = null;
  for (const line of match[1].split("\n")) {
    const nested = line.match(/^ {2}([\w-]+):\s*(.*)$/);
    const flat = line.match(/^([\w-]+):\s*(.*)$/);
    const unquote = (value) => value.replace(/^["']|["']$/g, "");
    if (nested && parent) data[parent][nested[1]] = unquote(nested[2]);
    else if (flat) {
      parent = flat[2] === "" ? flat[1] : null;
      data[flat[1]] = flat[2] === "" ? {} : unquote(flat[2]);
    }
  }
  return data;
};

const skillText = () => {
  assert.ok(existsSync(join(root, SKILL, "SKILL.md")), `${SKILL}/SKILL.md is missing`);
  return read(`${SKILL}/SKILL.md`);
};

const relativeLinks = (text) =>
  [...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]).filter((href) => !/^(https?:|mailto:|#)/.test(href));

test("skill frontmatter: name without reserved words, description, version in metadata, upload-safe keys only", () => {
  const data = frontmatter(skillText());
  assert.match(data.name ?? "", /^[a-z0-9-]{1,64}$/);
  assert.equal(data.name, "medquantis-design-system");
  assert.doesNotMatch(data.name, /claude|anthropic/);
  assert.ok(typeof data.description === "string" && data.description.length > 0, "description is empty");
  assert.ok(data.description.length <= 1024, "description exceeds 1024 characters");
  assert.doesNotMatch(data.description, /<[^>]+>/, "description holds an XML tag");
  // The Agent Skills spec has no top-level version field; the documented home is metadata.
  assert.equal(data.metadata?.version, pkgVersion(), "metadata.version differs from package.json");
  for (const key of Object.keys(data)) assert.ok(UPLOAD_KEYS.includes(key), `frontmatter key ${key} is rejected by claude.ai uploads`);
});

test("SKILL.md is under 500 lines and every file it links exists", () => {
  const text = skillText();
  assert.ok(text.split("\n").length < 500, `SKILL.md has ${text.split("\n").length} lines`);
  const links = relativeLinks(text);
  assert.ok(links.length > 0, "SKILL.md links no reference");
  for (const href of links) assert.ok(existsSync(join(root, SKILL, href)), `SKILL.md links a missing file: ${href}`);
});

test("one reference per medium, each linked from SKILL.md, references one level deep", () => {
  const links = relativeLinks(skillText());
  for (const medium of MEDIA) {
    const path = `references/${medium}.md`;
    assert.ok(existsSync(join(root, SKILL, path)), `${path} is missing`);
    assert.ok(links.includes(path), `SKILL.md does not link ${path}`);
    assert.deepEqual(relativeLinks(read(`${SKILL}/${path}`)), [], `${path} links another file: keep references one level deep`);
  }
});

test("references are generated from guidelines/, not hand-written", async () => {
  const { renderReferences } = await import("../../scripts/build-skill.mjs");
  const rendered = renderReferences(root);
  assert.deepEqual([...rendered.keys()].sort(), MEDIA.map((m) => `references/${m}.md`).sort());
  for (const [path, text] of rendered) {
    assert.equal(read(`${SKILL}/${path}`), text, `${path} differs from a fresh generation: run make skill`);
    assert.match(text.split("\n").slice(0, 5).join("\n"), /Generated by scripts\/build-skill\.mjs from guidelines\//);
    const sources = [...text.matchAll(/^Source: guidelines\/([\w-]+\.md)/gm)].map((m) => m[1]);
    assert.ok(sources.length > 0, `${path} cites no guideline`);
    for (const name of sources) assert.ok(existsSync(join(root, "guidelines", name)), `${path} cites a missing guideline ${name}`);
  }
});

test("document references carry no status colour; the app reference does (ADR-0004)", () => {
  for (const medium of MEDIA.filter((m) => m !== "app")) {
    assert.doesNotMatch(read(`${SKILL}/references/${medium}.md`), STATUS_TOKENS, `${medium}.md names a status token`);
  }
  assert.match(read(`${SKILL}/references/app.md`), STATUS_TOKENS);
});

// Plan-0003 increment 02: every medium the dark theme serves (ADR-0007: slides, documents, apps and
// the website) carries the Dark theme section of colour.md; documents without its status lines.
test("the slides, document, web and app references carry the Dark theme section of colour.md", () => {
  for (const medium of ["slides", "a4-report", "web", "app"]) {
    const text = read(`${SKILL}/references/${medium}.md`);
    assert.ok(text.includes("## Dark theme\n\nSource: guidelines/colour.md\n"), `${medium}.md has no Dark theme section`);
    assert.match(text, /^- Dark theme$/m, `${medium}.md lists the Dark theme section in its contents`);
    const body = text.slice(text.indexOf("## Dark theme\n"), text.indexOf("\n## ", text.indexOf("## Dark theme\n") + 1));
    assert.match(body, /`assets\/themes\/dark\.css`/, `${medium}.md names the skill's dark theme file`);
    assert.match(body, /In this skill:.*`\.dark`/, `${medium}.md names the class in its skill note`);
  }
});

test("skill assets are byte-identical to a fresh build and nothing else sits in assets/", async () => {
  const { assetPairs } = await import("../../scripts/sync-skill-assets.mjs");
  const pairs = assetPairs(root);
  const targets = pairs.map((pair) => pair.to);
  for (const name of ["tokens.css", "tokens.json", "kit-contract.css", "fonts/fonts.css", "css/components.css"]) {
    assert.ok(targets.includes(`${SKILL}/assets/${name}`), `assets/${name} is not synced`);
  }
  assert.ok(targets.some((t) => t.endsWith(".woff2")), "no woff2 file is synced");
  for (const { from, to } of pairs) {
    assert.ok(existsSync(join(root, to)), `${to} is missing: run make skill`);
    assert.ok(readFileSync(join(root, from)).equals(readFileSync(join(root, to))), `${to} differs from ${from}: run make skill`);
  }
  const committed = walk(`${SKILL}/assets`).sort();
  assert.deepEqual(committed, targets.filter((t) => t.startsWith(`${SKILL}/assets/`)).sort(), "assets/ holds a file the sync does not produce");
});

test("dist/llms.txt follows llmstxt.org and lists every guideline file", () => {
  assert.ok(existsSync(join(root, "dist/llms.txt")), "dist/llms.txt is missing: run make build");
  const text = read("dist/llms.txt");
  const lines = text.split("\n");
  assert.match(lines[0], /^# MedQuantis design system$/);
  assert.match(text, /^> .+/m, "no blockquote summary");
  for (const name of readdirSync(join(root, "guidelines")).filter((n) => n.endsWith(".md"))) {
    assert.match(text, new RegExp(`^- \\[[^\\]]+\\]\\([^)]*guidelines/${name.replace(".", "\\.")}\\)`, "m"), `llms.txt does not list guidelines/${name}`);
  }
  assert.match(text, /^## Optional$/m);
});

test("dist/llms-full.txt carries every guideline and every token", () => {
  assert.ok(existsSync(join(root, "dist/llms-full.txt")), "dist/llms-full.txt is missing: run make build");
  const text = read("dist/llms-full.txt");
  for (const name of readdirSync(join(root, "guidelines")).filter((n) => n.endsWith(".md"))) {
    const title = read(`guidelines/${name}`).match(/^# (.+)$/m)[1];
    assert.ok(text.includes(`# ${title}`), `llms-full.txt lacks guidelines/${name}`);
  }
  for (const token of Object.keys(readJson("dist/tokens.json"))) {
    assert.ok(text.includes(`\`${token}\``), `llms-full.txt lacks ${token}`);
  }
});

test("llms files are a generated output, equal to a fresh render", async () => {
  const { renderLlms } = await import("../../scripts/build-llms.mjs");
  const rendered = renderLlms(root);
  assert.equal(read("dist/llms.txt"), rendered["llms.txt"]);
  assert.equal(read("dist/llms-full.txt"), rendered["llms-full.txt"]);
});

test("framework neutrality applies to the generated CSS and JSON; llms-full.txt may name frameworks as guidance", () => {
  // Owner, 2026-10-10 (increment 10 scope item 7): the guidelines explain what stays local in a
  // component-library app, so the LLM text keeps those names.
  assert.match(read("dist/llms-full.txt"), /Nuxt UI/);
  const neutrality = read("tests/unit/tokens.test.mjs");
  assert.match(neutrality, /tokens\.css.*tokens\.json.*tailwind\.css.*kit-contract\.css/s, "the neutrality test is not narrowed to the four outputs");
});

test("plugin and marketplace manifests parse, follow the documented schema, and carry package.json's version", () => {
  const plugin = readJson(`${PLUGIN}/.claude-plugin/plugin.json`);
  assert.equal(plugin.name, "medquantis-design-system");
  assert.equal(plugin.version, pkgVersion());
  assert.ok(plugin.description && plugin.author?.name, "plugin.json needs description and author.name");
  const evalDir = plugin.experimental?.evals;
  assert.equal(evalDir, "evals", "plugin.json experimental.evals must name the plugin-root evals/ folder");
  assert.ok(existsSync(join(root, PLUGIN, evalDir)), `${PLUGIN}/evals is missing`);
  assert.ok(!existsSync(join(root, SKILL, "evals")), "evals must not sit inside the skill: the model under test could read the rubrics");

  const market = readJson(".claude-plugin/marketplace.json");
  assert.match(market.name, /^[A-Za-z0-9][A-Za-z0-9._-]*$/);
  assert.doesNotMatch(market.name, /claude|anthropic/i);
  assert.ok(market.owner?.name, "marketplace.json needs owner.name");
  assert.ok(market.description, "marketplace.json needs a description");
  assert.equal(market.version, pkgVersion());
  assert.equal(market.plugins.length, 1);
  const [entry] = market.plugins;
  assert.equal(entry.name, plugin.name);
  assert.equal(entry.source, `./${PLUGIN}`);
  // plugin.json wins over an entry version and the validator warns on both, so the entry has none.
  assert.equal(entry.version, undefined);
});

test("the validator fails an off-token colour and passes a clean page", () => {
  const validator = `${SKILL}/scripts/validate.py`;
  assert.ok(existsSync(join(root, validator)), `${validator} is missing`);
  const off = python([validator, "tests/fixtures/skill/off-token.html"]);
  assert.equal(off.status, 1, off.stdout + off.stderr);
  for (const value of ["#ff0000", "rgb(0, 128, 0)", "tomato", "#123456"]) assert.match(off.stdout, new RegExp(value.replace(/[()]/g, "\\$&"), "i"));
  const clean = python([validator, "tests/fixtures/skill/clean.html"]);
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
});

test("validate.py --record writes the verdict and the files checked, and keeps its exit code", () => {
  const validator = join(root, SKILL, "scripts/validate.py");
  const dir = mkdtempSync(join(tmpdir(), "mq-record-"));
  const clean = python([validator, "--record", join(dir, "clean.txt"), "tests/fixtures/skill/clean.html"]);
  assert.equal(clean.status, 0, clean.stdout + clean.stderr);
  const cleanRecord = readFileSync(join(dir, "clean.txt"), "utf8");
  assert.match(cleanRecord, /^PASS: 1 file\(s\) clean, medium document$/m);
  assert.match(cleanRecord, /^file: tests\/fixtures\/skill\/clean\.html$/m);
  const off = python([validator, "--record", join(dir, "off.txt"), "tests/fixtures/skill/off-token.html"]);
  assert.equal(off.status, 1);
  const offRecord = readFileSync(join(dir, "off.txt"), "utf8");
  assert.match(offRecord, /^FAIL: \d+ finding\(s\) in 1 file\(s\), medium document$/m);
  assert.match(offRecord, /^file: tests\/fixtures\/skill\/off-token\.html$/m);
  assert.match(offRecord, /#ff0000/i, "the record lists the findings");
  assert.doesNotMatch(offRecord, /^PASS/m);
});

test("the validator enforces the medium split, known tokens and the no-dash rule", () => {
  const validator = `${SKILL}/scripts/validate.py`;
  const status = "tests/fixtures/skill/app-status.html";
  const asDocument = python([validator, status]);
  assert.equal(asDocument.status, 1, "a status token in a document must fail");
  assert.match(asDocument.stdout, /--mq-danger/);
  assert.equal(python([validator, "--medium", "app", status]).status, 0, "a status token in an app passes");
  const unknown = python([validator, "tests/fixtures/skill/unknown-token.css"]);
  assert.equal(unknown.status, 1);
  assert.match(unknown.stdout, /--mq-accent-sky/);
  assert.match(unknown.stdout, /--mq-accent: /, "redefining an --mq- token must fail");
  const dash = python([validator, "tests/fixtures/skill/dash.html"]);
  assert.equal(dash.status, 1);
  assert.match(dash.stdout, /dash/i);
});

test("the token lookup finds a token by name and by value", () => {
  const lookup = `${SKILL}/scripts/tokens.py`;
  assert.ok(existsSync(join(root, lookup)), `${lookup} is missing`);
  const byName = python([lookup, "accent"]);
  assert.equal(byName.status, 0, byName.stderr);
  assert.match(byName.stdout, /--mq-accent\s+#0a2463/);
  const byValue = python([lookup, "#5d6f91"]);
  assert.match(byValue.stdout, /--mq-chart-series-2/);
  const document = python([lookup, "--medium", "document", "danger"]);
  assert.doesNotMatch(document.stdout, /--mq-danger/);
});

test("skill scripts run on Python 3.11, the claude.ai and API container version, with the standard library only", () => {
  const scripts = walk(`${SKILL}/scripts`).filter((p) => p.endsWith(".py"));
  const siblings = new Set(scripts.map((p) => p.split("/").pop().replace(/\.py$/, "")));
  for (const script of scripts) {
    const text = read(script);
    for (const [, module] of text.matchAll(/^\s*(?:from|import)\s+([\w.]+)/gm)) {
      const top = module.split(".")[0];
      assert.ok(!module.startsWith(".") && (STDLIB.has(top) || siblings.has(top)), `${script} imports ${module}, neither the standard library nor a sibling script`);
    }
  }
  assert.match(read("mise.toml"), /^python = "3\.11\.\d+"$/m, "mise.toml must pin Python 3.11 so the scripts are tested on the container version");
});

test("at least three eval tasks per medium, each with a prompt and graders on the produced file", () => {
  const evals = `${PLUGIN}/evals`;
  assert.ok(existsSync(join(root, evals)), `${evals} is missing`);
  const cases = readdirSync(join(root, evals)).filter((name) => existsSync(join(root, evals, name, "prompt.md")));
  for (const medium of MEDIA) {
    const own = cases.filter((name) => name.startsWith(`${medium}-`));
    assert.ok(own.length >= 3, `${medium} has ${own.length} eval tasks, needs 3`);
  }
  const allowed = ["schema_version", "name", "description", "tags", "plugins", "runs", "expected_outcome", "model", "max_turns", "timeout_seconds", "allowed_tools", "append_system_prompt", "env"];
  for (const name of cases) {
    const prompt = read(`${evals}/${name}/prompt.md`);
    const head = prompt.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(head, `${name}/prompt.md has no frontmatter`);
    for (const key of head[1].matchAll(/^([\w]+):/gm)) assert.ok(allowed.includes(key[1]), `${name}/prompt.md uses unknown key ${key[1]}`);
    assert.match(prompt, /output\.html/, `${name} does not name output.html`);
    const graders = readdirSync(join(root, evals, name, "graders")).sort();
    // validator-ran (tool_used) counted a Bash call the permission mode had denied: graders read files, not attempts.
    assert.deepEqual(graders, EVAL_GRADERS, `${name} must carry exactly the graders ${EVAL_GRADERS.join(", ")}`);
    assert.match(read(`${evals}/${name}/graders/criteria.md`), /^type: llm$/m);
  }
});

test("generated eval graders match the token set and the medium split", async () => {
  const { renderEvalGraders } = await import("../../scripts/build-skill.mjs");
  const rendered = renderEvalGraders(root);
  assert.ok(rendered.size >= MEDIA.length * 3 * 2, "fewer generated graders than cases");
  for (const [path, text] of rendered) assert.equal(read(path), text, `${path} differs from a fresh generation: run make skill`);
  const documentGrader = [...rendered].find(([path]) => /evals\/slides-[^/]+\/graders\/on-palette\.md$/.test(path))[1];
  assert.match(documentGrader, /success\|warning/);
  for (const name of readdirSync(join(root, PLUGIN, "evals")).filter((n) => existsSync(join(root, PLUGIN, "evals", n, "prompt.md")))) {
    const base = `${PLUGIN}/evals/${name}/graders`;
    const verdict = rendered.get(`${base}/validation-clean.md`);
    assert.ok(verdict, `${name} has no generated validation-clean grader`);
    assert.equal(graderField(verdict, "type"), "regex");
    assert.match(verdict, /^ {2}source: file$/m);
    assert.match(verdict, /^ {2}path: validation\.txt$/m);
    assert.equal(graderField(verdict, "match"), "contains");
    assert.equal(graderField(verdict, "arm"), "with-only", "the baseline arm has no validator, so its verdict file cannot count");
    const contained = rendered.get(`${base}/self-contained.md`);
    assert.ok(contained, `${name} has no generated self-contained grader`);
    assert.equal(graderField(contained, "type"), "regex");
    assert.match(contained, /^ {2}path: output\.html$/m);
    assert.equal(graderField(contained, "match"), "contains");
    assert.equal(graderField(contained, "arm"), "with-only", "a model without the skill cannot know --mq-accent, so the check would only inflate the baseline gap");
    assert.ok(!existsSync(join(root, base, "validator-ran.md")), `${base}/validator-ran.md is obsolete`);
  }
});

test("the validation-clean grader passes a clean recorded verdict on output.html and fails a failing or foreign one", async () => {
  const { renderEvalGraders } = await import("../../scripts/build-skill.mjs");
  const grader = graderRegex([...renderEvalGraders(root)].find(([path]) => path.endsWith("/validation-clean.md"))[1]);
  const dir = mkdtempSync(join(tmpdir(), "mq-verdict-"));
  const validator = join(root, SKILL, "scripts/validate.py");
  copyFileSync(join(root, "tests/fixtures/skill/clean.html"), join(dir, "output.html"));
  assert.equal(python([validator, "--record", "validation.txt", "output.html"], { cwd: dir }).status, 0);
  assert.match(readFileSync(join(dir, "validation.txt"), "utf8"), grader);
  copyFileSync(join(root, "tests/fixtures/skill/off-token.html"), join(dir, "output.html"));
  assert.equal(python([validator, "--record", "validation.txt", "output.html"], { cwd: dir }).status, 1);
  assert.doesNotMatch(readFileSync(join(dir, "validation.txt"), "utf8"), grader);
  copyFileSync(join(root, "tests/fixtures/skill/clean.html"), join(dir, "other.html"));
  assert.equal(python([validator, "--record", "validation.txt", "other.html"], { cwd: dir }).status, 0);
  assert.doesNotMatch(readFileSync(join(dir, "validation.txt"), "utf8"), grader, "a clean verdict on another file is not a verdict on output.html");
});

test("bundle.py makes output.html self-contained in place; the validator and the graders ignore the bundled system CSS", async () => {
  const { renderEvalGraders } = await import("../../scripts/build-skill.mjs");
  const rendered = [...renderEvalGraders(root)];
  const contained = graderRegex(rendered.find(([path]) => path.endsWith("/self-contained.md"))[1]);
  const palette = graderRegex(rendered.find(([path]) => /evals\/a4-report-[^/]+\/graders\/on-palette\.md$/.test(path))[1]);
  const dir = mkdtempSync(join(tmpdir(), "mq-bundle-"));
  cpSync(join(root, SKILL, "assets"), join(dir, "assets"), { recursive: true });
  const sheets = ["tokens.css", "fonts/fonts.css", "css/base.css", "css/components.css", "css/print.css"];
  const page = [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    ...sheets.map((sheet) => `<link rel="stylesheet" href="assets/${sheet}">`),
    "<style>.rep-grid { display: grid; gap: var(--mq-space-5); color: var(--mq-accent); }</style>",
    "</head>",
    '<body class="mq-doc"><p class="rep-grid">Refunds 2024</p><p class="mq-foot">MedQuantis SA · CH-1095 Lutry · medquantis.ch</p></body>',
    "</html>",
    "",
  ].join("\n");
  writeFileSync(join(dir, "output.html"), page);
  assert.doesNotMatch(page, contained, "a page that links its stylesheets is not self-contained");
  const bundled = python([join(root, SKILL, "scripts/bundle.py"), "output.html", "output.html"], { cwd: dir });
  assert.equal(bundled.status, 0, bundled.stdout + bundled.stderr);
  const text = readFileSync(join(dir, "output.html"), "utf8");
  assert.doesNotMatch(text, /<link\b[^>]*stylesheet/i);
  assert.match(text, /--mq-accent\s*:/);
  assert.match(text, contained);
  assert.doesNotMatch(text, palette, "the inlined tokens.css must not trip the on-palette grader");
  const checked = python([join(root, SKILL, "scripts/validate.py"), "output.html"], { cwd: dir });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  const forged = text.replace("</head>", '<style data-mq-bundled="assets/tokens.css">.rep-alert { color: #ff0000; }</style>\n</head>');
  writeFileSync(join(dir, "forged.html"), forged);
  const caught = python([join(root, SKILL, "scripts/validate.py"), "forged.html"], { cwd: dir });
  assert.equal(caught.status, 1, "a block that only claims to be bundled must still be checked");
  assert.match(caught.stdout + caught.stderr, /ff0000|data-mq-bundled/i);
  const edited = text.replace(/(<style data-mq-bundled="assets\/tokens\.css">)/, "$1.rep-x { color: #ff0000; }");
  writeFileSync(join(dir, "edited.html"), edited);
  const tampered = python([join(root, SKILL, "scripts/validate.py"), "edited.html"], { cwd: dir });
  assert.equal(tampered.status, 1, "an edited bundled block no longer matches the shipped asset and must be checked");
  writeFileSync(join(dir, "output.html"), text.replace("gap: var(--mq-space-5); color: var(--mq-accent);", "gap: var(--mq-space-5); color: #ff0000;"));
  assert.equal(python([join(root, SKILL, "scripts/validate.py"), "output.html"], { cwd: dir }).status, 1, "the page's own CSS is still checked");
  assert.match(readFileSync(join(dir, "output.html"), "utf8"), palette);
});

// Owner, 2026-10-17 (Plan-0003 increment 02): the skill can build and check a dark page. It ships
// the dark theme next to tokens.css, and the validator allows the dark semantic values under the
// same medium rules as light, while a colour in neither theme still fails.
test("the skill ships the dark theme, and the validator passes a dark page but not a colour outside both themes", () => {
  for (const name of ["dark.css", "dark.json"]) {
    const shipped = join(root, SKILL, "assets/themes", name);
    assert.ok(existsSync(shipped), `assets/themes/${name} is missing: run make skill`);
    assert.ok(readFileSync(shipped).equals(readFileSync(join(root, "dist/themes", name))), `assets/themes/${name} differs from dist/themes/${name}`);
  }
  const validator = join(root, SKILL, "scripts/validate.py");
  const dir = mkdtempSync(join(tmpdir(), "mq-dark-"));
  cpSync(join(root, SKILL, "assets"), join(dir, "assets"), { recursive: true });
  const page = (ownCss, svgFill) =>
    [
      "<!doctype html>",
      '<html lang="en" class="dark">',
      "<head>",
      '<meta charset="utf-8">',
      '<link rel="stylesheet" href="assets/tokens.css">',
      '<link rel="stylesheet" href="assets/themes/dark.css">',
      `<style>${ownCss}</style>`,
      "</head>",
      `<body><p class="rep-note">Refunds 2024</p><svg viewBox="0 0 10 10"><rect width="10" height="10" fill="${svgFill}"/></svg></body>`,
      "</html>",
      "",
    ].join("\n");
  const bundleAndCheck = (name, html, medium = "document") => {
    writeFileSync(join(dir, name), html);
    const bundled = python([join(root, SKILL, "scripts/bundle.py"), name, name], { cwd: dir });
    assert.equal(bundled.status, 0, bundled.stdout + bundled.stderr);
    return python([validator, "--medium", medium, name], { cwd: dir });
  };
  // Dark literal values: the canvas, the lifted navy at 18 %, the light navy as series 1.
  const dark = bundleAndCheck("dark.html", page(".rep-note { background: #11161f; border-color: rgba(111, 136, 201, 0.18); color: var(--mq-ink); }", "#9fb3e8"));
  assert.equal(dark.status, 0, dark.stdout + dark.stderr);
  assert.match(readFileSync(join(dir, "dark.html"), "utf8"), /<style data-mq-bundled="assets\/themes\/dark\.css">[^<]*\.dark \{/, "the dark theme is inlined as a shipped bundle");
  const foreign = bundleAndCheck("foreign.html", page(".rep-note { color: #123456; }", "#9fb3e8"));
  assert.equal(foreign.status, 1, "a colour in neither theme must fail");
  assert.match(foreign.stdout, /#123456/);
  // Status values stay apps only on dark too (ADR-0004).
  const status = page(".rep-note { color: var(--mq-ink); }", "#ff6b6b");
  assert.equal(bundleAndCheck("status.html", status).status, 1, "a dark status value fails in a document");
  assert.equal(bundleAndCheck("status-app.html", status, "app").status, 0, "a dark status value passes in an app");
});

test("eval runs are a separate, owner-approved make target, Sonnet by default, outside make check", () => {
  const makefile = read("Makefile");
  assert.match(makefile, /^skill-evals:/m);
  assert.match(makefile, /^SKILL_EVAL_MODELS \?= sonnet$/m, "a plain make skill-evals runs Sonnet only (owner, 2026-10-10)");
  assert.match(makefile, /claude plugin eval/);
  assert.doesNotMatch(makefile.match(/^check:.*$/m)[0], /skill-evals/);
  assert.match(read(".gitignore"), /evals\/results\//);
});

test("make skill-evals runs claude with a Linux-only PATH and a temporary HOME linking only the Claude config", () => {
  // A stub claude records what the recipe hands it; no model is called.
  const work = mkdtempSync(join(tmpdir(), "mq-evals-"));
  const stubs = join(work, "bin");
  const home = join(work, "home");
  mkdirSync(stubs);
  mkdirSync(join(home, ".claude"), { recursive: true });
  writeFileSync(join(home, ".claude.json"), "{}");
  mkdirSync(join(home, ".docker"));
  const out = join(work, "seen.txt");
  writeFileSync(
    join(stubs, "claude"),
    ['#!/bin/sh', '{ echo "HOME=$HOME"; echo "PATH=$PATH"; echo "ARGS=$*"; echo "ENTRIES=$(ls -A "$HOME" | tr "\\n" " ")"; } >> "$MQ_STUB_OUT"', ""].join("\n"),
    { mode: 0o755 },
  );
  const run = spawnSync("make", ["--no-print-directory", "skill-evals"], {
    cwd: root,
    encoding: "utf8",
    env: { HOME: home, PATH: `${stubs}:/mnt/c/Windows/system32:/usr/local/bin:/usr/bin:/bin`, MQ_STUB_OUT: out },
  });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const seen = readFileSync(join(out), "utf8");
  const field = (key) => seen.match(new RegExp(`^${key}=(.*)$`, "m"))[1];
  assert.match(field("ARGS"), /^plugin eval plugins\/medquantis-design-system --model sonnet /, "a plain make skill-evals runs Sonnet only");
  assert.equal(seen.match(/^ARGS=/gm).length, 1);
  const paths = field("PATH").split(":");
  assert.ok(paths.includes(stubs), "the Linux PATH entries stay");
  assert.ok(!paths.some((dir) => dir.startsWith("/mnt/")), "the WSL Windows interop entries are dropped");
  const evalHome = field("HOME");
  assert.notEqual(evalHome, home, "claude plugin eval must not see the real HOME");
  assert.deepEqual(field("ENTRIES").trim().split(" ").sort(), [".claude", ".claude.json"]);
  assert.ok(!existsSync(evalHome), "the temporary HOME is removed after the run");
  const makefile = read("Makefile");
  assert.match(makefile, /ln -s "\$\$HOME\/\.claude" /);
  assert.match(makefile, /ln -s "\$\$HOME\/\.claude\.json" /);
  assert.deepEqual(readdirSync(home).sort(), [".claude", ".claude.json", ".docker"], "the real HOME is untouched");
});

test("make skill regenerates the skill and make skill-zip builds an upload zip without evals", () => {
  const makefile = read("Makefile");
  assert.match(makefile, /^skill:/m);
  assert.match(makefile, /^skill-zip:/m);
  const out = join(mkdtempSync(join(tmpdir(), "mq-skill-")), "skill.zip");
  const zipped = python(["scripts/skill-zip.py", SKILL, out]);
  assert.equal(zipped.status, 0, zipped.stderr);
  const listing = python(["-m", "zipfile", "-l", out]);
  assert.match(listing.stdout, /medquantis-design-system\/SKILL\.md/);
  assert.match(listing.stdout, /medquantis-design-system\/scripts\/validate\.py/);
  assert.doesNotMatch(listing.stdout, /\/evals\//);
});

test("skill files hold no em or en dash and no local path", () => {
  for (const path of [...walk(PLUGIN), ".claude-plugin/marketplace.json"]) {
    if (/\.(woff2|svg)$/.test(path) || path.endsWith("kit-contract.css")) continue;
    const text = read(path);
    assert.doesNotMatch(text, /[\u2013\u2014]/, `${path} holds an em or en dash`);
    assert.doesNotMatch(text, /\/home\/|\/Users\//, `${path} holds a local path`);
  }
});

test("SKILL.md carries the rules every output needs", () => {
  const text = skillText();
  assert.ok(text.includes("MedQuantis SA · CH-1095 Lutry · medquantis.ch"), "legal line missing");
  assert.match(text, /3 px/);
  assert.match(text, /6 px/);
  assert.match(text, /12 px/);
  assert.match(text, /apostrophe/);
  assert.match(text, /non-breaking space/);
  assert.match(text, /validate\.py/);
  assert.match(text, /tokens\.py/);
  assert.match(text, /illustrative/i);
  assert.match(text, /em dash/);
  assert.match(text, /--mq-chart-series-1/);
});

test("SKILL.md workflow survives a permission-restricted session and delivers one self-contained output.html", () => {
  const text = skillText();
  assert.match(text, /python3 \$\{CLAUDE_SKILL_DIR\}\/scripts\/bundle\.py output\.html output\.html/);
  assert.match(text, /python3 \$\{CLAUDE_SKILL_DIR\}\/scripts\/validate\.py --record validation\.txt output\.html/);
  assert.doesNotMatch(text, /\bcp -r\b/, "no copy step: restricted sessions deny reading the skill folder with cp, and bundling inlines linked assets anyway");
  assert.match(text, /absolute path of this skill/i);
  assert.match(text, /one plain command per Bash call/i);
  assert.match(text, /never chain/i);
  for (const operator of ["`&&`", "`;`", "pipes", "heredocs"]) assert.ok(text.includes(operator), `SKILL.md must name ${operator} as forbidden in a Bash call`);
  assert.match(text, /Write tool/);
  for (const block of text.matchAll(/```bash\n([\s\S]*?)```/g)) {
    for (const line of block[1].split("\n").filter(Boolean)) {
      const command = line.replace(/\s+#.*$/, "");
      assert.doesNotMatch(command, /&&|;|\||<<|>/, `SKILL.md shows a compound or redirected command: ${line}`);
    }
  }
});

test("SKILL.md shows the slide footer and the column legend; the ring and slide rubrics state their rules", () => {
  const text = skillText();
  assert.match(text, /mq-slide-foot/, "SKILL.md shows the slide footer (owner ruling 11)");
  assert.match(text, /mq-legend is-column/, "SKILL.md shows the column legend beside a ring");
  assert.match(text, /mq-legend-value/);
  const ring = read(`${PLUGIN}/evals/charts-ring/graders/criteria.md`);
  assert.match(ring, /one unit shorter/i, "the judge is told the arc gaps are required");
  assert.match(ring, /outline/i);
  assert.match(ring, /is-column/, "the legend must be a column");
  for (const name of ["slides-title", "slides-kpis", "slides-states"]) {
    const rubric = read(`${PLUGIN}/evals/${name}/graders/criteria.md`);
    assert.match(rubric, /bottom left/, `${name} rubric places the legal line (owner ruling 11)`);
    assert.match(rubric, /bottom right/, `${name} rubric places the slide number (owner ruling 11)`);
  }
});

test("the kit reference names every module of the kit manifest and SKILL.md links it", () => {
  const path = "references/kit-modules.md";
  assert.ok(relativeLinks(skillText()).includes(path), `SKILL.md does not link ${path}`);
  const text = read(`${SKILL}/${path}`);
  const manifest = readJson("kit-manifest.json");
  for (const [module, file] of Object.entries(manifest.provides)) {
    assert.match(text, new RegExp("`" + module + "`"), `${path} does not name the ${module} module`);
    assert.ok(text.includes(file.replace("./", "dist/")), `${path} does not name ${file}`);
  }
  assert.deepEqual(relativeLinks(text), [], `${path} links another file: keep references one level deep`);
});
