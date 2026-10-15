// make kit-check: the real kit is the judge (Plan-0002, Principle 6). Packs the package as npm
// would publish it, unpacks it into a fresh scratch folder and runs the kit resolver on the
// unpacked package/ folder, then checks each module's source in the provenance report. The kit
// checkout comes from KIT_DIR; without it the check is skipped, so CI stays self-contained.
// Runs after make build (the Makefile target depends on it).
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

// The modules this package provides, and the ones the kit base theme fills until increment 02.
const FROM_DESIGN_SYSTEM = ["core", "dataviz", "type", "space-shape", "brand", "guidance"];
const FROM_BASE = ["document", "slide-frame", "print"];

const kitDir = process.env.KIT_DIR;
if (!kitDir) {
  console.log("kit-check: skipped, KIT_DIR is not set. Set KIT_DIR to a homemade-claude-kit checkout to run the kit resolver on the packed package.");
  process.exit(0);
}
const resolver = join(kitDir, "plugins/delivery-comms/shared/design_source.py");
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
const failures = [];
try {
  const pack = run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch], { cwd: root });
  if (pack.status !== 0) throw new Error(`npm pack failed:\n${pack.stderr}`);
  const tarball = join(scratch, JSON.parse(pack.stdout)[0].filename);
  const untar = run("tar", ["-xzf", tarball, "-C", scratch]);
  if (untar.status !== 0) throw new Error(`tar failed:\n${untar.stderr}`);
  const folder = join(scratch, "package");

  // mise provides the kit's Python environment (PyYAML); env -C keeps every relative output in the
  // scratch folder, never in the kit checkout.
  const resolved = run("mise", ["exec", "-C", kitDir, "--", "env", "-C", scratch, "python3", resolver, "provenance", "--design-system", folder]);
  process.stdout.write(resolved.stdout);
  process.stderr.write(resolved.stderr);
  if (resolved.status !== 0) throw new Error(`the kit resolver exited ${resolved.status}`);

  const { modules, guidance } = JSON.parse(resolved.stdout);
  for (const module of FROM_DESIGN_SYSTEM) {
    if (modules[module] !== "design-system") failures.push(`${module} comes from ${modules[module]}, expected design-system`);
  }
  for (const module of FROM_BASE) {
    if (modules[module] !== "base") failures.push(`${module} comes from ${modules[module]}, expected base until increment 02`);
  }
  if (guidance?.export !== "./kit/guidance.md") failures.push(`guidance export is ${guidance?.export}, expected ./kit/guidance.md`);
} catch (error) {
  failures.push(error.message);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`kit-check: FAIL\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`kit-check: PASS, the kit resolver reads ${FROM_DESIGN_SYSTEM.join(", ")} from the packed package`);
