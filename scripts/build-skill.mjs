// Generates the Claude skill's per-medium references from guidelines/ and the token build, and
// the generated graders of its eval tasks. Never edit the outputs by hand: run `make skill`.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readGuideline, unlinkRelative } from "../build/guidelines.mjs";
import { tokenTable, usableTokens } from "../build/token-data.mjs";

export const PLUGIN_DIR = "plugins/medquantis-design-system";
export const SKILL_DIR = `${PLUGIN_DIR}/skills/medquantis-design-system`;

const INTRO = ["principles.md", ""];

// Which guideline sections each medium needs, in reading order. "" is the text before the first
// second-level heading. Documents (every medium but app) are navy-only (ADR-0004).
export const MEDIA = {
  slides: {
    title: "Slides",
    summary: "Decks on the 1280 by 720 slide canvas (`css/slide.css`), exported to PDF.",
    sections: [
      INTRO,
      ["layout.md", "Media"],
      ["layout.md", "Widths and spacing"],
      ["layout.md", "Radius"],
      ["layout.md", "Elevation and navy blocks"],
      ["layout.md", "Document components"],
      ["layout.md", "Print and PDF"],
      ["colour.md", "The medium split"],
      ["colour.md", "Accent"],
      ["colour.md", "Neutrals"],
      ["colour.md", "Navy panels and gradients"],
      ["colour.md", "States by mark style (documents)"],
      ["typography.md", "Three families, three roles"],
      ["typography.md", "Weights"],
      ["typography.md", "Roles and sizes"],
      ["writing.md", "No em dash, no en dash"],
      ["writing.md", "Titles"],
      ["writing.md", "Sentences and lists"],
      ["writing.md", "French typography"],
      ["brand.md", "Name"],
      ["brand.md", "Legal line"],
      ["brand.md", "Wordmark"],
      ["brand.md", "No combined logo yet"],
      ["brand.md", "Icons"],
      ["data-patterns.md", "Numbers (owner ruling 8, as amended on 2026-10-10)"],
      ["data-patterns.md", "Dates and periods"],
      ["data-patterns.md", "Null versus zero"],
      ["data-patterns.md", "Illustrative data"],
      ["accessibility.md", "Colour is never alone"],
      ["accessibility.md", "Contrast pairs"],
    ],
  },
  "a4-report": {
    title: "A4 reports and papers",
    summary: "Reports and papers that scroll on screen and print on A4 (`css/print.css`).",
    sections: [
      INTRO,
      ["layout.md", "Media"],
      ["layout.md", "Report skeleton"],
      ["layout.md", "Widths and spacing"],
      ["layout.md", "Radius"],
      ["layout.md", "Elevation and navy blocks"],
      ["layout.md", "Document components"],
      ["layout.md", "Tables"],
      ["layout.md", "Print and PDF"],
      ["colour.md", "The medium split"],
      ["colour.md", "Accent"],
      ["colour.md", "Neutrals"],
      ["colour.md", "Navy panels and gradients"],
      ["colour.md", "States by mark style (documents)"],
      ["typography.md", "Three families, three roles"],
      ["typography.md", "Weights"],
      ["typography.md", "Roles and sizes"],
      ["typography.md", "Line height"],
      ["writing.md", "No em dash, no en dash"],
      ["writing.md", "Titles"],
      ["writing.md", "Sentences and lists"],
      ["writing.md", "French typography"],
      ["voice.md", "Tone"],
      ["voice.md", "Words"],
      ["voice.md", "Languages"],
      ["voice.md", "Terminology"],
      ["brand.md", "Name"],
      ["brand.md", "Legal line"],
      ["brand.md", "Wordmark"],
      ["brand.md", "Icons"],
      ["data-patterns.md", "Numbers (owner ruling 8, as amended on 2026-10-10)"],
      ["data-patterns.md", "Dates and periods"],
      ["data-patterns.md", "Null versus zero"],
      ["data-patterns.md", "Confidential values"],
      ["data-patterns.md", "Illustrative data"],
      ["accessibility.md", "Colour is never alone"],
      ["accessibility.md", "Contrast pairs"],
      ["accessibility.md", "Structure"],
    ],
  },
  web: {
    title: "Website and web pages",
    summary: "Pages of the public website and other build-less web pages.",
    sections: [
      INTRO,
      ["brand.md", "Name"],
      ["brand.md", "Tagline"],
      ["brand.md", "Legal line"],
      ["brand.md", "Wordmark"],
      ["brand.md", "Monogram and favicon"],
      ["brand.md", "No combined logo yet"],
      ["brand.md", "Icons"],
      ["voice.md", "Tone"],
      ["voice.md", "Words"],
      ["voice.md", "Languages"],
      ["voice.md", "Terminology"],
      ["writing.md", "No em dash, no en dash"],
      ["writing.md", "Titles"],
      ["writing.md", "Sentences and lists"],
      ["writing.md", "French typography"],
      ["colour.md", "The medium split"],
      ["colour.md", "Accent"],
      ["colour.md", "Neutrals"],
      ["colour.md", "Navy panels and gradients"],
      ["typography.md", "Three families, three roles"],
      ["typography.md", "Weights"],
      ["typography.md", "Roles and sizes"],
      ["typography.md", "Line height"],
      ["layout.md", "Media"],
      ["layout.md", "Widths and spacing"],
      ["layout.md", "Radius"],
      ["layout.md", "Elevation and navy blocks"],
      ["layout.md", "Document components"],
      ["layout.md", "Phones"],
      ["data-patterns.md", "Numbers (owner ruling 8, as amended on 2026-10-10)"],
      ["data-patterns.md", "Dates and periods"],
      ["data-patterns.md", "Illustrative data"],
      ["accessibility.md", "Target"],
      ["accessibility.md", "Colour is never alone"],
      ["accessibility.md", "Contrast pairs"],
      ["accessibility.md", "Focus"],
      ["accessibility.md", "Size and targets"],
      ["accessibility.md", "Motion"],
      ["accessibility.md", "Structure"],
    ],
  },
  app: {
    title: "Interactive apps",
    summary: "Interactive apps and tools, the only medium allowed status colours.",
    sections: [
      INTRO,
      ["colour.md", "The medium split"],
      ["colour.md", "Accent"],
      ["colour.md", "Neutrals"],
      ["colour.md", "Status colours (apps only)"],
      ["typography.md", "Three families, three roles"],
      ["typography.md", "Weights"],
      ["typography.md", "Line height"],
      ["typography.md", "App type scale"],
      ["layout.md", "Radius"],
      ["layout.md", "Elevation and navy blocks"],
      ["layout.md", "Tables"],
      ["layout.md", "App patterns"],
      ["layout.md", "Phones"],
      ["writing.md", "No em dash, no en dash"],
      ["writing.md", "Titles"],
      ["brand.md", "Monogram and favicon"],
      ["brand.md", "Icons"],
      ["data-patterns.md", "Numbers (owner ruling 8, as amended on 2026-10-10)"],
      ["data-patterns.md", "Dates and periods"],
      ["data-patterns.md", "Null versus zero"],
      ["data-patterns.md", "Confidential values"],
      ["accessibility.md", "Target"],
      ["accessibility.md", "Colour is never alone"],
      ["accessibility.md", "Contrast pairs"],
      ["accessibility.md", "Focus"],
      ["accessibility.md", "Size and targets"],
      ["accessibility.md", "Motion"],
      ["accessibility.md", "Structure"],
      ["specialising.md", "Framework neutrality"],
      ["specialising.md", "Use what exists first"],
      ["specialising.md", "The four rules"],
    ],
  },
  charts: {
    title: "Charts",
    summary: "Charts and data visualisation in any medium, apps included.",
    sections: [
      ["charts.md", ""],
      ["charts.md", "The ordered palette"],
      ["charts.md", "Common cases"],
      ["charts.md", "Highlight on grey"],
      ["charts.md", "Sequential and diverging use"],
      ["charts.md", "Marks"],
      ["charts.md", "Legends"],
      ["charts.md", "Size and motion"],
      ["colour.md", "The medium split"],
      ["data-patterns.md", "Numbers (owner ruling 8, as amended on 2026-10-10)"],
      ["data-patterns.md", "Dates and periods"],
      ["data-patterns.md", "Null versus zero"],
      ["data-patterns.md", "Illustrative data"],
      ["accessibility.md", "Colour is never alone"],
      ["accessibility.md", "Structure"],
    ],
  },
};

const STATUS_NAME = /--mq-(success|warning|warning-fill|warning-tint|danger|info)\b/;

// Documents never carry status colours, so lines that only matter to apps are left out of their
// references; the app reference keeps them.
const forMedium = (body, medium) => (medium === "app" ? body : body.split("\n").filter((line) => !STATUS_NAME.test(line)).join("\n"));

export const renderReference = (root, medium) => {
  const spec = MEDIA[medium];
  const cache = new Map();
  const guideline = (name) => {
    if (!cache.has(name)) cache.set(name, readGuideline(root, name));
    return cache.get(name);
  };
  const parts = spec.sections.map(([file, heading]) => {
    const source = guideline(file);
    const body = heading === "" ? source.intro : source.sections.get(heading);
    if (body === undefined) throw new Error(`guidelines/${file} has no section "${heading}"`);
    return { title: heading === "" ? source.title : heading, file, body: forMedium(unlinkRelative(body), medium) };
  });
  const tokens = usableTokens(root, medium === "app" ? "app" : "document").filter(([, token]) => token.type === "color" || token.type === "shadow");
  const contents = [...parts.map((part) => part.title), "Colour tokens for this medium"];
  return [
    `# ${spec.title}`,
    "",
    "<!-- Generated by scripts/build-skill.mjs from guidelines/ and dist/tokens.json. Do not edit: run make skill. -->",
    "<!-- mq:illustrative: every figure in this file is a fictitious format example -->",
    "",
    `${spec.summary} The sections below are copied from the MedQuantis guidelines; the source file of each is named under its heading.${medium === "app" ? "" : " Documents are navy-only (ADR-0004): no status colour appears here."}`,
    "",
    "## Contents",
    "",
    ...contents.map((title) => `- ${title}`),
    "",
    ...parts.flatMap((part) => [`## ${part.title}`, "", `Source: guidelines/${part.file}`, "", part.body, ""]),
    "## Colour tokens for this medium",
    "",
    "Generated from dist/tokens.json. Sizes, spacing, radii and fonts: run `python3 scripts/tokens.py`.",
    "",
    tokenTable(tokens),
    "",
  ].join("\n");
};

export const renderReferences = (root) => new Map(Object.keys(MEDIA).map((medium) => [`references/${medium}.md`, renderReference(root, medium)]));

// Hex values a medium may write: the semantic colours (and the colours inside the shadow tokens),
// with the three-digit form where one exists.
const allowedHex = (root, medium) => {
  const values = new Set();
  for (const [, token] of usableTokens(root, medium)) {
    for (const [hex] of String(token.value).matchAll(/#[0-9a-f]{6}\b/gi)) {
      const digits = hex.slice(1).toLowerCase();
      values.add(digits);
      if (digits[0] === digits[1] && digits[2] === digits[3] && digits[4] === digits[5]) values.add(digits[0] + digits[2] + digits[4]);
    }
  }
  return [...values].sort();
};

// Stylesheets bundle.py inlined from the skill's assets are the design system itself (tokens.css
// defines every token, status ones included): a match inside one does not count. JavaScript
// lookbehind is variable-length; it relies on the shipped CSS holding no "<".
const OUTSIDE_BUNDLED = "(?<!<style\\b[^>]*\\bdata-mq-bundled\\b[^>]*>[^<]*)";

// A literal colour the token set does not hold, near a colour property or as a quoted script
// value; for documents also any status token, outside the bundled system CSS. A cheap check on the
// produced file: the skill's validator is the full one.
export const offPalettePattern = (root, medium) => {
  const allowed = allowedHex(root, medium).join("|");
  const hex = `#(?!(?:${allowed})(?![0-9a-f]))[0-9a-f]{3,8}(?![0-9a-z_-])`;
  const near = `(?<=(?:colou?r|fill|stroke|background|border|outline|shadow|decoration)[^;{}<>]{0,120}?)${hex}`;
  // A quoted fragment link (href="#add") is not a colour.
  const quoted = `(?<![\\w:-]=\\s*['"])(?<=['"\`])${hex}(?=['"\`])`;
  const functions = "\\b(?:rgb|hsl|hwb|lab|lch|oklab|oklch)a?\\((?!\\s*(?:255,\\s*255,\\s*255|0,\\s*0,\\s*0|10,\\s*36,\\s*99)\\s*,)";
  const status = medium === "app" ? [] : ["--mq-(?:success|warning|danger|info)"];
  return [near, quoted, functions, ...status].map((alternative) => `(?:${alternative})${OUTSIDE_BUNDLED}`).join("|");
};

// The page carries its styles: no stylesheet linked by a local path, and the tokens defined inside.
export const SELF_CONTAINED_PATTERN =
  "^(?![\\s\\S]*<link\\b(?=[^>]*\\brel\\s*=\\s*[\"']?stylesheet)(?=[^>]*\\bhref\\s*=\\s*[\"']?(?![a-z][a-z0-9+.-]*:|//))[^>]*>)[\\s\\S]*--mq-accent\\s*:";

// The verdict validate.py --record wrote: clean, in the case's medium, and covering output.html.
export const validationCleanPattern = (palette) => `^PASS: \\d+ file\\(s\\) clean, medium ${palette}\\n(?:file: .*\\n)*?file: (?:.*/)?output\\.html$`;

const evalsDir = (root) => join(root, PLUGIN_DIR, "evals");

export const evalCases = (root) =>
  existsSync(evalsDir(root)) ? readdirSync(evalsDir(root)).filter((name) => existsSync(join(evalsDir(root), name, "prompt.md"))).sort() : [];

const mediumOf = (name) => Object.keys(MEDIA).find((medium) => name.startsWith(`${medium}-`));

export const renderEvalGraders = (root) => {
  const graders = new Map();
  for (const name of evalCases(root)) {
    const medium = mediumOf(name);
    if (!medium) throw new Error(`eval case ${name} does not start with a medium name`);
    const base = `${PLUGIN_DIR}/evals/${name}/graders`;
    // Charts appear in apps too, but a chart never takes a status colour (guidelines/charts.md).
    const palette = medium === "app" ? "app" : "document";
    graders.set(
      `${base}/on-palette.md`,
      [
        "---",
        "type: regex",
        "target:",
        "  source: file",
        "  path: output.html",
        "match: not_contains",
        "flags: i",
        `pattern: ${JSON.stringify(offPalettePattern(root, palette))}`,
        "---",
        "",
        `<!-- Generated by scripts/build-skill.mjs from dist/tokens.json (${palette} palette). Do not edit: run make skill. -->`,
        "",
      ].join("\n"),
    );
    graders.set(
      `${base}/skill-fired.md`,
      ["---", "type: tool_used", "tool: Skill", `input_match: ${JSON.stringify('"skill"\\s*:\\s*"(?:[\\w-]+:)?medquantis-design-system"')}`, "---", "", "<!-- Generated by scripts/build-skill.mjs. Do not edit: run make skill. -->", ""].join("\n"),
    );
    // A file, not a tool_used count: tool_used also counts a Bash call the permission mode denied.
    // The baseline arm has no validator, so the verdict is a plugin-only indicator.
    graders.set(
      `${base}/validation-clean.md`,
      [
        "---",
        "type: regex",
        "target:",
        "  source: file",
        "  path: validation.txt",
        "match: contains",
        "flags: m",
        `pattern: ${JSON.stringify(validationCleanPattern(palette))}`,
        "arm: with-only",
        "---",
        "",
        "<!-- Generated by scripts/build-skill.mjs. Do not edit: run make skill. -->",
        "",
      ].join("\n"),
    );
    graders.set(
      `${base}/self-contained.md`,
      [
        "---",
        "type: regex",
        "target:",
        "  source: file",
        "  path: output.html",
        "match: contains",
        "flags: i",
        `pattern: ${JSON.stringify(SELF_CONTAINED_PATTERN)}`,
        "---",
        "",
        "<!-- Generated by scripts/build-skill.mjs. Do not edit: run make skill. -->",
        "",
      ].join("\n"),
    );
  }
  return graders;
};

export const writeSkill = (root) => {
  for (const [path, text] of renderReferences(root)) {
    mkdirSync(dirname(join(root, SKILL_DIR, path)), { recursive: true });
    writeFileSync(join(root, SKILL_DIR, path), text);
  }
  for (const [path, text] of renderEvalGraders(root)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeSkill(fileURLToPath(new URL("..", import.meta.url)));
}
