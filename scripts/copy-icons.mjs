#!/usr/bin/env node
// Copies the exact-pinned Lucide UMD build and its licence into icons/ and records the
// version and hash in icons/manifest.json, so a consumer can tell which build it inlines.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function copyIcons(root) {
  const pkg = join(root, "node_modules", "lucide");
  const { version } = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8"));
  const out = join(root, "icons");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out);
  copyFileSync(join(pkg, "dist", "umd", "lucide.min.js"), join(out, "lucide.min.js"));
  copyFileSync(join(pkg, "LICENSE"), join(out, "LICENSE"));
  const sha256 = createHash("sha256").update(readFileSync(join(out, "lucide.min.js"))).digest("hex");
  // Icons derived from Feather are additionally MIT; icons/LICENSE carries both notices.
  const manifest = { package: "lucide", version, file: "lucide.min.js", sha256, licence: "ISC" };
  writeFileSync(join(out, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) copyIcons(process.cwd());
