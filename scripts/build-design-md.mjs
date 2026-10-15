// dist/DESIGN.md: the design system as a Google DESIGN.md (format alpha, linted by the pinned
// @google/design.md), so tools and agents outside the kit read the same brand (Plan-0002
// increment 03). The front matter follows the kit's DESIGN.md shape without its kit: key (owner
// decision 13): colours, radii and spacing under the kit role names where the kit tier aliases a
// semantic token, then every other semantic token of the group under its tokens.css name without
// --mq-; typography as the kit's body, heading, mono and text-* tokens. The prose is guideline
// sections, verbatim, in Google's section order. Part of make build.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { stringify } from "yaml";
import { readGuideline, unlinkRelative } from "../build/guidelines.mjs";
import { readTokens } from "../build/token-data.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const tokens = readTokens(root);
const bySemanticPath = new Map(Object.entries(tokens).map(([name, token]) => [token.path.join("."), { name, ...token }]));

// The kit tier's roles in the token modules, in file order, each with the semantic token it
// aliases. Roles with a literal value (shell-max, the logos) have no semantic token to export.
function* walk(node, path = []) {
  if ("$value" in node || "$extensions" in node) {
    yield { path, token: node };
    return;
  }
  for (const [key, child] of Object.entries(node)) if (!key.startsWith("$") && child && typeof child === "object") yield* walk(child, [...path, key]);
}
const kitRoles = new Map();
for (const file of readdirSync(join(root, "tokens/kit")).filter((name) => name.endsWith(".tokens.json"))) {
  for (const { path, token } of walk(JSON.parse(readFileSync(join(root, "tokens/kit", file), "utf8")))) {
    if (!["core", "dataviz", "type", "space-shape"].includes(path[1])) continue;
    const alias = typeof token.$value === "string" && token.$value.match(/^\{(semantic\.[\w.-]+)\}$/);
    if (!alias) continue;
    const target = bySemanticPath.get(alias[1]);
    if (!target) throw new Error(`kit role ${path.at(-1)} aliases ${alias[1]}, which dist/tokens.json lacks`);
    kitRoles.set(path.at(-1), target);
  }
}

const GROUPS = {
  colors: (token) => token.type === "color",
  rounded: (token) => token.path[1] === "radius",
  spacing: (token) => token.path[1] === "space",
};

// One front matter group as [DESIGN.md name, token] pairs.
const group = (key) => {
  const inGroup = (token) => token.path[0] === "semantic" && GROUPS[key](token);
  const entries = [...kitRoles].filter(([, token]) => inGroup(token));
  const aliased = new Set(entries.map(([, token]) => token.name));
  for (const [name, token] of Object.entries(tokens)) {
    if (inGroup(token) && !aliased.has(name)) entries.push([name.replace(/^--mq-/, ""), { name, ...token }]);
  }
  const names = entries.map(([name]) => name);
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate) throw new Error(`DESIGN.md ${key}: two tokens are named ${duplicate}`);
  return entries;
};

// Google typography tokens, property to kit role (the kit's ux-design-system typography table).
const TYPOGRAPHY = {
  body: { fontFamily: "font-body", fontSize: "font-size-md", fontWeight: "font-weight-regular", lineHeight: "line-height-body" },
  heading: { fontFamily: "font-heading", fontSize: "title-size", fontWeight: "font-weight-bold", lineHeight: "line-height-tight" },
  mono: { fontFamily: "font-mono" },
  "text-xs": { fontSize: "font-size-xs" },
  "text-sm": { fontSize: "font-size-sm" },
  "text-lg": { fontSize: "font-size-lg" },
  "text-xl": { fontSize: "font-size-xl" },
};
const typography = Object.entries(TYPOGRAPHY).flatMap(([name, properties]) =>
  Object.entries(properties).map(([property, role]) => {
    const token = kitRoles.get(role);
    if (!token) throw new Error(`typography.${name}.${property}: the kit tier has no aliased role ${role}`);
    return [`${name}.${property}`, token];
  }),
);

const groups = Object.fromEntries(Object.keys(GROUPS).map((key) => [key, group(key)]));
const front = {
  name: "MedQuantis",
  description: `The MedQuantis design system ${version}. Generated from tokens/ and guidelines/ by the design-system build. Do not edit. Names are the homemade-claude-kit role names where the kit has a role, else the tokens.css name without --mq-; the tables below map each to its --mq-* token.`,
  colors: { primary: "{colors.accent}", ...Object.fromEntries(groups.colors.map(([name, token]) => [name, token.value])) },
  typography: Object.fromEntries(
    Object.entries(TYPOGRAPHY).map(([name, properties]) => [name, Object.fromEntries(Object.entries(properties).map(([property, role]) => [property, kitRoles.get(role).value]))]),
  ),
  rounded: Object.fromEntries(groups.rounded.map(([name, token]) => [name, token.value])),
  spacing: Object.fromEntries(groups.spacing.map(([name, token]) => [name, token.value])),
};

const table = (rows) => ["| DESIGN.md | tokens.css | Value |", "| :-- | :-- | :-- |", ...rows.map(([name, token, value]) => `| \`${name}\` | \`${token}\` | \`${value}\` |`), ""];
const rows = (key) => groups[key].map(([name, token]) => [`${key}.${name}`, token.name, token.value]);

// Google's sections in its canonical order, each the guideline sections behind it; "" is the text
// before a guideline's first second-level heading. Every guideline section appears once, so an
// agent reading only this file has every rule; the principles' file index is left out.
const SECTIONS = [
  [
    "Overview",
    [],
    [
      ["principles.md", ""],
      ["brand.md", "Name"],
      ["brand.md", "Tagline"],
      ["voice.md", "Tone"],
      ["voice.md", "Words"],
      ["voice.md", "Languages"],
      ["voice.md", "Terminology"],
      ["writing.md", "Titles"],
      ["writing.md", "Sentences and lists"],
      ["writing.md", "French typography"],
      ["writing.md", "Source files"],
    ],
  ],
  [
    "Colors",
    [["colors.primary", "--mq-accent", "{colors.accent}"], ...rows("colors")],
    [
      ["colour.md", ""],
      ["colour.md", "The medium split"],
      ["colour.md", "Accent"],
      ["colour.md", "Neutrals"],
      ["colour.md", "Navy panels and gradients"],
      ["colour.md", "States by mark style (documents)"],
      ["colour.md", "Status colours (apps only)"],
      ["colour.md", "Chart colours"],
      ["charts.md", ""],
      ["charts.md", "The ordered palette"],
      ["charts.md", "Common cases"],
      ["charts.md", "Highlight on grey"],
      ["charts.md", "Sequential and diverging use"],
      ["accessibility.md", "Colour is never alone"],
      ["accessibility.md", "Contrast pairs"],
    ],
  ],
  [
    "Typography",
    typography.map(([name, token]) => [`typography.${name}`, token.name, token.value]),
    [
      ["typography.md", "Three families, three roles"],
      ["typography.md", "Weights"],
      ["typography.md", "Roles and sizes"],
      ["typography.md", "Line height"],
      ["typography.md", "App type scale"],
    ],
  ],
  [
    "Layout",
    rows("spacing"),
    [
      ["layout.md", "Media"],
      ["layout.md", "Report skeleton"],
      ["layout.md", "Widths and spacing"],
      ["layout.md", "Print and PDF"],
      ["layout.md", "Phones"],
      ["accessibility.md", "Target"],
      ["accessibility.md", "Size and targets"],
      ["accessibility.md", "Structure"],
      ["accessibility.md", "Motion"],
    ],
  ],
  ["Elevation & Depth", [], [["layout.md", "Elevation and navy blocks"]]],
  ["Shapes", rows("rounded"), [["layout.md", "Radius"]]],
  [
    "Components",
    [],
    [
      ["layout.md", "Document components"],
      ["layout.md", "Tables"],
      ["layout.md", "App patterns"],
      ["accessibility.md", "Focus"],
      ["charts.md", "Marks"],
      ["charts.md", "Ring construction"],
      ["charts.md", "Legends"],
      ["charts.md", "Size and motion"],
      ["brand.md", "Legal line"],
      ["brand.md", "Wordmark"],
      ["brand.md", "Monogram and favicon"],
      ["brand.md", "No combined logo yet"],
      ["brand.md", "Icons"],
    ],
  ],
  // Ends with the rule lists, so the file closes on the do and don't lines.
  [
    "Do's and Don'ts",
    [],
    [
      ["writing.md", "No em dash, no en dash"],
      ["data-patterns.md", ""],
      ["data-patterns.md", "Numbers (owner ruling 8, as amended on 2026-10-10)"],
      ["data-patterns.md", "Dates and periods"],
      ["data-patterns.md", "Null versus zero"],
      ["data-patterns.md", "Confidential values"],
      ["data-patterns.md", "Illustrative data"],
      ["specialising.md", ""],
      ["specialising.md", "Framework neutrality"],
      ["specialising.md", "Promotion tests"],
      ["specialising.md", "The one-off log"],
      ["specialising.md", "Use what exists first"],
      ["specialising.md", "The four rules"],
    ],
  ],
];

const block = ([file, heading]) => {
  const guideline = readGuideline(root, file);
  const body = heading === "" ? guideline.intro : guideline.sections.get(heading);
  if (body === undefined) throw new Error(`guidelines/${file} has no section "${heading}"`);
  if (!body.trim()) throw new Error(`guidelines/${file}, "${heading || "introduction"}" is empty`);
  return [`### ${guideline.title}: ${heading || "Introduction"}`, "", unlinkRelative(body), ""];
};

const prose = [
  "# MedQuantis design",
  "",
  `Generated from tokens/ and guidelines/ by the build of @medquantis/design-system ${version}. Do not edit. Each section opens with a table that maps the front matter names to the --mq-* custom properties of tokens.css, the names the guideline text uses; the rules are the MedQuantis guidelines, section by section.`,
  "",
  ...SECTIONS.flatMap(([title, tableRows, sections]) => [`## ${title}`, "", ...(tableRows.length ? table(tableRows) : []), ...sections.flatMap(block)]),
]
  .join("\n")
  .replace(/\n+$/, "\n");

writeFileSync(join(root, "dist/DESIGN.md"), `---\n${stringify(front, { lineWidth: 0 })}---\n\n${prose}`);
