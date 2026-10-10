import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadDenylist, scan, scanPath } from "../../scripts/confidentiality-check.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const fixtures = join(root, "tests/fixtures/confidentiality");
const denylist = loadDenylist(join(root, "tests/fixtures/denylist.txt"));
const script = join(root, "scripts/confidentiality-check.mjs");

const findingsFor = (file) => scan({ root: fixtures, files: [file], denylist });
const rulesFor = (file) => findingsFor(file).map((finding) => finding.rule);
const scanText = (line) => {
  const dir = mkdtempSync(join(tmpdir(), "mq-scan-"));
  writeFileSync(join(dir, "note.md"), `${line}\n`);
  try {
    return scan({ root: dir, files: ["note.md"], denylist }).map((finding) => finding.rule).join(",");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

test("deny-list term is found case- and accent-insensitively", () => {
  const findings = findingsFor("deny-term.md");
  assert.deepEqual(findings.map((f) => [f.rule, f.line]), [["denylist", 1]]);
});

test("CHF amount outside examples/ is reported", () => {
  assert.deepEqual(rulesFor("chf-amount.md"), ["currency-amount"]);
});

test("unmarked percentage inside examples/ is reported", () => {
  assert.deepEqual(rulesFor("examples/unmarked-percentage.md"), ["unmarked-figure"]);
});

test("figures written with a non-breaking space (owner ruling 8) are still reported", () => {
  const findings = findingsFor("examples/unmarked-nbsp-figures.md");
  assert.deepEqual(findings.map((f) => [f.rule, f.line]), [["unmarked-figure", 3], ["unmarked-figure", 4]]);
  assert.equal(scanText("Budget CHF\u00a02'460'000 per year."), "currency-amount"); // mq:illustrative
});

test("SharePoint URL is reported", () => {
  assert.deepEqual(rulesFor("sharepoint-url.md"), ["internal-host"]);
});

test("crm/ path is reported", () => {
  assert.deepEqual(rulesFor("crm-path.md"), ["internal-path"]);
});

test("SVG metadata element and absolute file path are both reported", () => {
  assert.deepEqual(rulesFor("svg-metadata.svg").sort(), ["absolute-path", "svg-metadata"]);
});

test("JPEG carrying EXIF (author) is reported", () => {
  assert.deepEqual(rulesFor("jpeg-exif.jpg"), ["image-metadata"]);
});

test("clean fixtures pass, including marked figures in examples/", () => {
  const files = ["notes.md", "examples/marked.md", "clean.svg"];
  assert.deepEqual(scan({ root: join(fixtures, "clean"), files, denylist }), []);
});

test("a currency code inside a longer word is not an amount", () => {
  assert.deepEqual(scan({ root: join(fixtures, "clean"), files: ["currency-words.md"], denylist }), []);
  const amounts = ["Budget 12 EUR per seat.", "Budget EUR 12 per seat.", "Budget 2'000 CHF.", "Budget 40 €."]; // mq:illustrative
  for (const line of amounts) assert.equal(scanText(line), "currency-amount", line);
});

test("deny-list term in a file path is reported", () => {
  // Built from the fixture deny-list so this file never names a term itself.
  const path = `docs/${denylist[1].term.toLowerCase()}-renewal.md`;
  assert.deepEqual(scanPath(path, denylist).map((f) => f.rule), ["denylist"]);
});

const runCli = (env) =>
  spawnSync(process.execPath, [script], {
    cwd: root,
    encoding: "utf8",
    env: { PATH: process.env.PATH, HOME: process.env.HOME, ...env },
  });

test("CLI fails closed in CI when no deny-list is configured", () => {
  const result = runCli({ CI: "true" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MQ_DENYLIST/);
});

test("CLI fails when the configured deny-list does not exist", () => {
  const result = runCli({ MQ_DENYLIST: "tests/fixtures/no-such-denylist.txt" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /no-such-denylist/);
});
