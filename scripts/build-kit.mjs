// The two kit contract files that are not token modules, written after the Style Dictionary
// build: dist/kit/guidance.md (the guideline sections behind each provided module) and
// kit-manifest.json at the repository root, because the kit resolver reads the manifest at the top
// of the unpacked package only (design_source.py _load_package), never through exports. Part of
// make build.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { readGuideline, unlinkRelative } from "../build/guidelines.mjs";
import { CONTRACT_VERSION, KIT_MODULES } from "../build/formats/kit-modules.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

// CONTRACT_VERSION, the kit contract version this build targets (2.1.0), is defined with the module
// list in build/formats/kit-modules.mjs, since every module header names it too.

// The guideline sections each module's guidance carries, in reading order.
const GUIDANCE = {
  core: [
    ["colour.md", ["The medium split", "Accent", "Neutrals"]],
    ["typography.md", ["Three families, three roles"]],
    ["layout.md", ["Elevation and navy blocks"]],
    ["accessibility.md", ["Colour is never alone"]],
  ],
  dataviz: [["charts.md", ["The ordered palette", "Highlight on grey", "Marks"]]],
  type: [["typography.md", ["Weights", "Roles and sizes", "Line height"]]],
  "space-shape": [["layout.md", ["Widths and spacing", "Radius"]]],
  document: [["layout.md", ["Print and PDF"]]],
  "slide-frame": [["layout.md", ["Media"]]],
  dark: [["colour.md", ["Dark theme"]]],
  print: [["layout.md", ["Report skeleton"]]],
  brand: [["brand.md", ["Legal line", "Wordmark", "Monogram and favicon", "No combined logo yet"]]],
};

// A section as the guideline writes it, its relative links reduced to their label.
const ruleLines = (body) => unlinkRelative(body).split("\n");

const guidanceSection = (module) => {
  const blocks = GUIDANCE[module].flatMap(([file, headings]) => {
    const guideline = readGuideline(root, file);
    return headings.map((heading) => {
      const body = guideline.sections.get(heading);
      if (body === undefined) throw new Error(`guidelines/${file} has no section "${heading}"`);
      const lines = ruleLines(body);
      if (!lines.some((line) => line.trim())) throw new Error(`guidelines/${file}, "${heading}" is empty`);
      return [`### ${guideline.title}: ${heading}`, "", ...lines, ""];
    });
  });
  const sources = GUIDANCE[module].map(([file]) => `guidelines/${file}`).join(", ");
  return [`## ${module}`, "", `Source: ${sources}.`, "", ...blocks.flat()];
};

const guidance = [
  "# MedQuantis guidance for the delivery-comms kit",
  "",
  "Generated from guidelines/ by the design-system build. Do not edit. The MedQuantis guideline sections behind each module this package provides; token names are the --mq-* names of tokens.css, which the kit roles of each module alias. The kit treats this file as informational.",
  "",
  ...KIT_MODULES.flatMap(guidanceSection),
]
  .join("\n")
  .replace(/\n+$/, "\n");

const manifest = {
  contractVersion: CONTRACT_VERSION,
  provides: {
    ...Object.fromEntries(KIT_MODULES.map((module) => [module, `./kit/${module}.css`])),
    guidance: "./kit/guidance.md",
  },
};

mkdirSync(join(root, "dist/kit"), { recursive: true });
writeFileSync(join(root, "dist/kit/guidance.md"), guidance);
writeFileSync(join(root, "kit-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
