// make kit-check: the real kit is the judge (Plan-0002, Principle 6). Packs the package as npm
// would publish it, unpacks it into a fresh scratch folder and runs the kit resolver on the
// unpacked package/ folder, then checks each module's source in the provenance report. It then
// renders the fixtures of tests/fixtures/kit-render/ with the kit's own renderers from that folder
// (a deck, an A4 document and a release-note report) and runs the kit validator on each output,
// which must record "PASS: no findings". The kit checkout comes from KIT_DIR; without it the check
// is skipped, so CI stays self-contained. KIT_CHECK_OUT, when set, names a folder that receives a
// copy of the three rendered pages. Runs after make build (the Makefile target depends on it).
import { spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

// Every module of the contract comes from this package since increment 02; the ten of contract
// 2.1.0, dark included, since Plan-0003 increment 04.
const FROM_DESIGN_SYSTEM = ["core", "dataviz", "type", "space-shape", "document", "slide-frame", "dark", "print", "brand", "guidance"];
// The release note's date, so the report renders the same bytes on every run (2026-01-30).
const SOURCE_DATE_EPOCH = "1769731200";

const kitDir = process.env.KIT_DIR;
if (!kitDir) {
  console.log("kit-check: skipped, KIT_DIR is not set. Set KIT_DIR to a homemade-claude-kit checkout to run the kit resolver and renderers on the packed package.");
  process.exit(0);
}
const kit = (path) => join(kitDir, "plugins/delivery-comms", path);
const resolver = kit("shared/design_source.py");
const validator = kit("shared/check_render.py");
if (!existsSync(resolver)) {
  console.error(`kit-check: ${resolver} does not exist; KIT_DIR must name a homemade-claude-kit checkout`);
  process.exit(2);
}

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  return result;
};

const scratch = mkdtempSync(join(tmpdir(), "mq-kit-check-"));
// mise provides the kit's Python environment (PyYAML); env -C keeps every relative output in the
// scratch folder, never in the kit checkout.
const python = (...args) => run("mise", ["exec", "-C", kitDir, "--", "env", "-C", scratch, `SOURCE_DATE_EPOCH=${SOURCE_DATE_EPOCH}`, "python3", ...args]);

// The fixtures, copied next to package/ so each deck config.yaml names it as "../package".
const renders = (folder) => [
  {
    name: "deck",
    fixture: "deck",
    args: [kit("skills/com-slide-deck/scripts/build.py"), "--config", join(scratch, "deck/config.yaml")],
    output: join(scratch, "deck/output/deck.html"),
  },
  {
    name: "A4 document",
    fixture: "document",
    args: [kit("skills/com-slide-deck/scripts/build.py"), "--config", join(scratch, "document/config.yaml")],
    output: join(scratch, "document/output/document.html"),
  },
  {
    name: "release-note report",
    fixture: "release-note",
    args: [
      kit("skills/com-release-note/scripts/render_pdf.py"),
      join(scratch, "release-note/v0.1.0-kit-fixture.md"),
      "--design-system",
      folder,
      "--html-only",
      "--output",
      join(scratch, "release-note/output/report.pdf"),
    ],
    output: join(scratch, "release-note/output/report.html"),
  },
];

const failures = [];
const verdicts = [];
try {
  const pack = run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch], { cwd: root });
  if (pack.status !== 0) throw new Error(`npm pack failed:\n${pack.stderr}`);
  const tarball = join(scratch, JSON.parse(pack.stdout)[0].filename);
  const untar = run("tar", ["-xzf", tarball, "-C", scratch]);
  if (untar.status !== 0) throw new Error(`tar failed:\n${untar.stderr}`);
  const folder = join(scratch, "package");

  const resolved = python(resolver, "provenance", "--design-system", folder);
  process.stdout.write(resolved.stdout);
  process.stderr.write(resolved.stderr);
  if (resolved.status !== 0) throw new Error(`the kit resolver exited ${resolved.status}`);

  const { modules, guidance } = JSON.parse(resolved.stdout);
  for (const module of FROM_DESIGN_SYSTEM) {
    if (modules[module] !== "design-system") failures.push(`${module} comes from ${modules[module]}, expected design-system`);
  }
  if (guidance?.export !== "./kit/guidance.md") failures.push(`guidance export is ${guidance?.export}, expected ./kit/guidance.md`);

  for (const { name, fixture, args, output } of renders(folder)) {
    cpSync(join(root, "tests/fixtures/kit-render", fixture), join(scratch, fixture), { recursive: true });
    const rendered = python(...args);
    process.stdout.write(rendered.stdout);
    process.stderr.write(rendered.stderr);
    if (rendered.status !== 0 || !existsSync(output)) {
      failures.push(`${name}: the kit renderer exited ${rendered.status}`);
      continue;
    }
    const provenance = JSON.parse(readFileSync(`${output}.provenance.json`, "utf8"));
    const elsewhere = FROM_DESIGN_SYSTEM.filter((module) => provenance.modules[module] !== "design-system");
    if (elsewhere.length) failures.push(`${name}: ${elsewhere.join(", ")} did not come from the design system`);
    const record = `${output}.verdict.txt`;
    const checked = python(validator, output, "--design-system", folder, "--record", record);
    const verdict = existsSync(record) ? readFileSync(record, "utf8").split("\n")[0] : "no verdict recorded";
    verdicts.push(`${name} (${basename(output)}): ${verdict}`);
    if (checked.status !== 0 || verdict !== "PASS: no findings") {
      failures.push(`${name}: check_render.py exited ${checked.status}, ${verdict}\n${checked.stdout}${checked.stderr}`);
    }
    if (process.env.KIT_CHECK_OUT) {
      const out = resolve(process.env.KIT_CHECK_OUT);
      mkdirSync(out, { recursive: true });
      copyFileSync(output, join(out, basename(output)));
    }
  }
} catch (error) {
  failures.push(error.message);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

for (const line of verdicts) console.log(`kit-check: ${line}`);
if (failures.length) {
  console.error(`kit-check: FAIL\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`kit-check: PASS, the kit resolver reads ${FROM_DESIGN_SYSTEM.join(", ")} from the packed package, and the deck, the A4 document and the report render with no findings`);
