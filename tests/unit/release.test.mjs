import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const readJson = (path) => JSON.parse(read(path));

const PLUGIN_JSON = "plugins/medquantis-design-system/.claude-plugin/plugin.json";
const MARKETPLACE_JSON = ".claude-plugin/marketplace.json";
const SKILL_MD = "plugins/medquantis-design-system/skills/medquantis-design-system/SKILL.md";
const RELEASE_YML = ".github/workflows/release.yml";

const config = () => readJson("release-please-config.json");
const rootPackage = () => config().packages?.["."];
const manifestVersion = () => readJson(".release-please-manifest.json")["."];

// Jobs of a workflow, keyed by id; the body is every line indented under the job.
const jobs = (text) => {
  const block = text.split(/^jobs:\n/m)[1] ?? "";
  return Object.fromEntries(
    block
      .split(/^(?= {2}[\w-]+:\s*$)/m)
      .filter((chunk) => /^ {2}[\w-]+:/.test(chunk))
      .map((chunk) => [chunk.match(/^ {2}([\w-]+):/)[1], chunk]),
  );
};
// Permission lines of a job, without their explanatory comments.
const jobPermissions = (job) => (job.match(/^ {4}permissions:\n((?: {6}.*\n)*)/m)?.[1] ?? "").replace(/ *#.*$/gm, "");

test("release-please manages the root package as an npm package tagged vX.Y.Z (semver, ADR-0002)", () => {
  assert.ok(existsSync(join(root, "release-please-config.json")), "release-please-config.json is missing");
  const data = config();
  assert.equal(data.$schema, "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json");
  const pkg = rootPackage();
  assert.ok(pkg, "no package at the repository root");
  assert.equal(pkg["release-type"], "node");
  assert.equal(pkg["include-component-in-tag"], false, "tags must read v1.0.0, not design-system-v1.0.0");
  assert.equal(pkg["changelog-path"], "CHANGELOG.md");
});

test("the manifest carries package.json's version, and the first release is forced to 1.0.0 only until it exists", () => {
  const version = manifestVersion();
  assert.equal(version, readJson("package.json").version);
  const releaseAs = rootPackage()?.["release-as"];
  // release-as pins every release PR to one version, so it must go once v1.0.0 is out.
  if (releaseAs !== undefined) {
    assert.equal(releaseAs, "1.0.0");
    assert.ok(["0.0.0", "1.0.0"].includes(version), `release-as 1.0.0 is still set at ${version}: remove it`);
  }
  if (version === "0.0.0") assert.equal(releaseAs, "1.0.0", "the first public release must be 1.0.0");
});

test("release-please bumps the plugin, the marketplace and the skill together with package.json", () => {
  const extra = rootPackage()?.["extra-files"] ?? [];
  const entry = (path) => extra.find((file) => (typeof file === "string" ? file : file.path) === path);
  for (const path of [PLUGIN_JSON, MARKETPLACE_JSON]) {
    assert.deepEqual(entry(path), { type: "json", path, jsonpath: "$.version" }, `${path} is not bumped`);
  }
  assert.deepEqual(entry(SKILL_MD), { type: "generic", path: SKILL_MD }, "SKILL.md is not bumped");

  const version = readJson("package.json").version;
  assert.equal(readJson(PLUGIN_JSON).version, version);
  assert.equal(readJson(MARKETPLACE_JSON).version, version);
  // The generic updater rewrites the version inside the marker block only.
  const block = read(SKILL_MD).match(/^ {2}# x-release-please-start-version\n([\s\S]*?)\n {2}# x-release-please-end$/m);
  assert.ok(block, "SKILL.md has no x-release-please-start-version block");
  assert.equal(block[1], `  version: "${version}"`);
});

test("release workflow: release-please on main, then a full check, then publish only when a release was created", () => {
  assert.ok(existsSync(join(root, RELEASE_YML)), `${RELEASE_YML} is missing`);
  const text = read(RELEASE_YML);
  assert.match(text, /^on:\n {2}push:\n {4}branches: \[main\]\n/m);
  assert.doesNotMatch(text, /pull_request/);
  assert.match(text, /^permissions: \{\}$/m, "top-level permissions must be empty; each job asks for its own");
  const { "release-please": release, check, publish } = jobs(text);
  assert.ok(release && check && publish, "jobs release-please, check and publish are required");

  assert.match(release, /uses:\s*googleapis\/release-please-action@[0-9a-f]{40}/);
  assert.match(release, /release_created: \$\{\{ steps\.\w+\.outputs\.release_created \}\}/);
  assert.match(jobPermissions(release), /contents: write/);
  assert.match(jobPermissions(release), /pull-requests: write/);

  for (const [name, job] of [["check", check], ["publish", publish]]) {
    assert.match(job, /needs\.release-please\.outputs\.release_created == 'true'/, `${name} must run only when a release was created`);
  }
  assert.match(publish, /needs: \[release-please, check\]/, "publish must wait for the check job");
});

test("the release check runs the confidentiality scan with the real deny-list before anything is packed", () => {
  const { check } = jobs(read(RELEASE_YML));
  assert.equal(jobPermissions(check).trim(), "contents: read");
  assert.match(check, /\$\{\{\s*secrets\.MQ_DENYLIST_TOKEN\s*\}\}/);
  assert.match(check, /MQ_DENYLIST=\$\{?RUNNER_TEMP\}?\//);
  const make = check.search(/^\s+(?:-\s+)?run:\s*make check\s*$/m);
  const pack = check.search(/npm pack --ignore-scripts/);
  assert.ok(make !== -1 && pack > make, "make check must run, then npm pack");
  assert.match(check, /uses:\s*actions\/upload-artifact@/);
});

test("publish uses npm trusted publishing (OIDC) with provenance, no token, and runs no dependency code", () => {
  const text = read(RELEASE_YML);
  const { publish } = jobs(text);
  const permissions = jobPermissions(publish).trim().split("\n").map((line) => line.trim()).sort();
  assert.deepEqual(permissions, ["contents: read", "id-token: write"]);
  assert.match(publish, /uses:\s*actions\/download-artifact@/);
  assert.match(publish, /npm publish .*--provenance/);
  assert.match(publish, /--ignore-scripts/);
  assert.doesNotMatch(publish, /\bmake\b|npm ci|npm install/, "publish must not install or build: it publishes the checked tarball");
  // Trusted publishing needs npm 11.5.1 or later; the job checks the CLI before publishing.
  assert.match(publish, /11\.5\.1/);
  assert.doesNotMatch(text, /NPM_TOKEN|NODE_AUTH_TOKEN|secrets: inherit/);
  for (const checkout of text.matchAll(/uses:\s*actions\/checkout@.*\n((?: {8,}.*\n)*)/g)) {
    assert.match(checkout[1], /persist-credentials: false/);
  }
});
