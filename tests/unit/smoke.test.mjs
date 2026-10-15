import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const readPackage = () => JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

// An exact pin is a bare semver version: no range operator, no tag, no URL.
const EXACT_VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

test("every dependency is pinned to an exact version", () => {
  const pkg = readPackage();
  for (const field of ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"]) {
    for (const [name, version] of Object.entries(pkg[field] ?? {})) {
      assert.match(version, EXACT_VERSION, `${field}.${name} is "${version}"`);
    }
  }
});

test("licence notices and CODEOWNERS exist", () => {
  for (const file of ["LICENSE", "brand/LICENSE", "guidelines/LICENSE", ".github/CODEOWNERS"]) {
    assert.ok(existsSync(join(root, file)), `${file} is missing`);
  }
});

test("package licence points at the split LICENSE", () => {
  assert.equal(readPackage().license, "SEE LICENSE IN LICENSE");
});

test("root LICENSE excludes brand/ and guidelines/", () => {
  const licence = readFileSync(join(root, "LICENSE"), "utf8");
  assert.match(licence, /MIT License/);
  assert.match(licence, /brand\//);
  assert.match(licence, /guidelines\//);
  assert.match(licence, /all rights reserved/i);
});

test("package names MedQuantis SA as its author", () => {
  assert.equal(readPackage().author, "MedQuantis SA (https://medquantis.ch)");
});

// A CSS file fetched alone from a CDN must still carry the MIT notice; /*! survives minifiers.
const BANNER = "/*! @medquantis/design-system | © 2026 MedQuantis SA | MIT License, see LICENSE */\n";

test("every shipped stylesheet starts with the copyright banner", () => {
  const sheets = [
    ...["tokens", "tailwind", "kit-contract"].map((name) => `dist/${name}.css`),
    ...["core", "dataviz", "type", "space-shape", "brand", "document", "slide-frame", "print"].map((module) => `dist/kit/${module}.css`),
    ...["app", "base", "components", "print", "slide"].map((name) => `css/${name}.css`),
    ...["document", "slide-frame", "print"].map((module) => `css/kit/${module}.css`),
    "fonts/fonts.css",
  ];
  for (const sheet of sheets) {
    assert.ok(readFileSync(join(root, sheet), "utf8").startsWith(BANNER), `${sheet} lacks the banner`);
  }
});
