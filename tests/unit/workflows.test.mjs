import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const workflowsDir = join(root, ".github/workflows");
const read = (path) => readFileSync(join(root, path), "utf8");

const workflowFiles = () =>
  existsSync(workflowsDir) ? readdirSync(workflowsDir).filter((name) => /\.ya?ml$/.test(name)) : [];

// No YAML dependency: these checks only need top-level blocks and single-line keys, which an
// indentation scan reads reliably for the workflow shapes this repo writes.
const topLevelBlock = (text, key) => {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start === -1) return null;
  const end = lines.findIndex((line, index) => index > start && /^\S/.test(line) && !line.startsWith("#"));
  return lines.slice(start, end === -1 ? undefined : end).join("\n");
};

const ciPath = ".github/workflows/ci.yml";
const ci = () => read(ciPath);

test("CI workflow exists", () => {
  assert.ok(existsSync(join(root, ciPath)), `${ciPath} is missing`);
});

test("every uses: is pinned to a 40-character commit SHA with its tag in a comment", () => {
  const files = workflowFiles();
  assert.ok(files.length > 0, "no workflow files found");
  let count = 0;
  for (const name of files) {
    const text = readFileSync(join(workflowsDir, name), "utf8");
    for (const [index, line] of text.split("\n").entries()) {
      const match = line.match(/^\s*(?:-\s+)?uses:\s*(.+)$/);
      if (!match) continue;
      count += 1;
      assert.match(
        match[1].trim(),
        /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}\s+#\s*v\d\S*$/,
        `${name}:${index + 1} is not SHA-pinned with a tag comment: ${match[1].trim()}`,
      );
    }
  }
  assert.ok(count > 0, "no uses: lines found");
});

test("CI runs on pull_request and on push of tags", () => {
  const on = topLevelBlock(ci(), "on");
  assert.ok(on, "no top-level on: block");
  assert.match(on, /^\s+pull_request:/m);
  const push = on.match(/^ {2}push:\n((?: {4,}.*\n?)*)/m);
  assert.ok(push, "no push trigger");
  assert.match(push[1], /^\s+tags:/m, "push trigger has no tags filter");
});

test("CI runs the confidentiality check through make check", () => {
  assert.match(ci(), /^\s+(?:-\s+)?run:\s*make check\s*$/m);
  assert.match(read("Makefile"), /^check:.*\bconfidentiality-check\b/m);
});

test("CI installs Node and tools from mise.toml with jdx/mise-action, not setup-node", () => {
  const text = ci();
  assert.match(text, /uses:\s*jdx\/mise-action@/);
  assert.doesNotMatch(text, /actions\/setup-node/);
});

test("checkout does not persist credentials and permissions are read-only", () => {
  const text = ci();
  assert.match(text, /persist-credentials:\s*false/);
  const permissions = topLevelBlock(text, "permissions");
  assert.ok(permissions, "no top-level permissions: block");
  assert.match(permissions, /contents:\s*read/);
  assert.doesNotMatch(text, /:\s*write\b/);
});

test("deny-list is fetched with MQ_DENYLIST_TOKEN to a temp path and never echoed", () => {
  const text = ci();
  assert.match(text, /\$\{\{\s*secrets\.MQ_DENYLIST_TOKEN\s*\}\}/);
  assert.match(text, /MQ_DENYLIST=\$\{?RUNNER_TEMP\}?\//);
  assert.match(text, /GITHUB_ENV/);
  for (const line of text.split("\n")) {
    if (/\b(echo|printf)\b/.test(line)) assert.doesNotMatch(line, /\$\{?\w*TOKEN\b|secrets\./, `echoes a secret: ${line.trim()}`);
  }
});

test("workflow-lint mirrors CI's actionlint and zizmor and is part of make check", () => {
  const makefile = read("Makefile");
  assert.match(makefile, /^check:.*\bworkflow-lint\b/m);
  const recipe = makefile.match(/^workflow-lint:.*\n((?:\t.*\n?)*)/m);
  assert.ok(recipe, "no workflow-lint target");
  assert.match(recipe[1], /^\tactionlint\b/m);
  assert.match(recipe[1], /^\tzizmor --min-severity high \.github\/$/m);
});

test("mise.toml pins actionlint, zizmor and shellcheck exactly", () => {
  const mise = read("mise.toml");
  for (const tool of ["actionlint", "zizmor", "shellcheck"]) {
    assert.match(mise, new RegExp(`^${tool} = "\\d+\\.\\d+\\.\\d+"$`, "m"), `${tool} is not pinned exactly`);
  }
});

test("dependabot covers npm and github-actions weekly", () => {
  const path = ".github/dependabot.yml";
  assert.ok(existsSync(join(root, path)), `${path} is missing`);
  const entries = read(path).split(/^\s+-\s+package-ecosystem:/m).slice(1);
  const ecosystems = Object.fromEntries(entries.map((entry) => [entry.trim().split(/\s/)[0].replace(/"/g, ""), entry]));
  for (const ecosystem of ["npm", "github-actions"]) {
    assert.ok(ecosystems[ecosystem], `${ecosystem} ecosystem missing`);
    assert.match(ecosystems[ecosystem], /interval:\s*"?weekly"?/);
  }
});

test("README lists the deny-list repo and token as owner set-up steps and the manual mise bumps", () => {
  const readme = read("README.md");
  assert.match(readme, /MQ_DENYLIST_TOKEN/);
  assert.match(readme, /MQ_DENYLIST_REPO/);
  assert.match(readme, /mise\.toml.*by hand/);
});

test("CI installs the Playwright browser pinned by the lockfile, with its OS libraries, before make check and uncached", () => {
  const text = ci();
  const install = text.search(/^\s+(?:-\s+)?run:\s*make browsers PLAYWRIGHT_INSTALL_FLAGS=--with-deps\s*$/m);
  const check = text.search(/^\s+(?:-\s+)?run:\s*make check\s*$/m);
  assert.notEqual(install, -1, "CI does not install the Playwright browser through make browsers");
  assert.ok(install < check, "the browser must be installed before make check");
  assert.doesNotMatch(text, /actions\/cache|playwright install(?!-)/, "the browser comes from make browsers, never from a cache or an ad-hoc install");
  const recipe = read("Makefile").match(/^browsers:.*\n((?:\t.*\n?)*)/m);
  assert.ok(recipe, "no browsers target");
  assert.match(recipe[1], /node_modules\/\.bin\/playwright install --only-shell \$\(PLAYWRIGHT_INSTALL_FLAGS\) chromium/);
});
