// dist/claude-design-system/project/: the claude.ai Design System artifact, generated from the build
// so the artifact, the npm package and the kit carry the same version (Plan-0002 increment 04).
// The format is the type's instructions, saved in tests/fixtures/claude-design-system/ with their
// release id. A build output, gitignored with dist/, not in the npm package; the owner publishes it
// after each release (docs/audits/README.md, How a release runs). Part of make build.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readGuideline, unlinkRelative } from "../build/guidelines.mjs";
import { readTokens } from "../build/token-data.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "dist/claude-design-system/project");
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const tokens = readTokens(root);
const value = (name) => {
  if (!tokens[name]) throw new Error(`dist/tokens.json has no ${name}`);
  return tokens[name].value;
};
// SOURCE_DATE_EPOCH makes the index reproducible; publication keeps the marker already online.
const now = new Date(process.env.SOURCE_DATE_EPOCH ? Number(process.env.SOURCE_DATE_EPOCH) * 1000 : Date.now()).toISOString();

rmSync(join(root, "dist/claude-design-system"), { recursive: true, force: true });
const write = (path, text) => {
  mkdirSync(dirname(join(out, path)), { recursive: true });
  writeFileSync(join(out, path), text);
};

// tokens.json in the type's list shape: every non-deprecated semantic token of a family, named as
// in tokens.css without the leading dashes, so the --mq- names of the brand book stay recognisable.
const FAMILIES = {
  color: (token) => token.type === "color",
  spacing: (token) => token.path[1] === "space",
  radius: (token) => token.path[1] === "radius",
  shadow: (token) => token.type === "shadow",
};
// The dark theme (ADR-0007, dist/themes/dark.json): a re-valued colour carries its dark value as
// the dark theme's, light first so every other colour inherits its light value; a re-valued shadow,
// which has no themes, names its dark value in its note. Each note adds the dark role's description.
const dark = JSON.parse(readFileSync(join(root, "dist/themes/dark.json"), "utf8"));
const darkNote = (key, token) => (key === "shadow" ? ` Dark theme (.dark): \`${token.value}\`, ${token.description}` : ` Dark theme (.dark): ${token.description}`);
const family = (key) =>
  Object.entries(tokens)
    .filter(([, token]) => token.path[0] === "semantic" && !token.deprecated && FAMILIES[key](token))
    .map(([name, token]) => {
      if (!token.description) throw new Error(`${name} has no $description for its usage note`);
      const themed = dark[name];
      return {
        name: name.slice(2),
        value: key === "color" ? { light: token.value, ...(themed ? { dark: themed.value } : {}) } : token.value,
        usage: `${token.description}${themed ? darkNote(key, themed) : ""}`,
      };
    });

// Text styles of guidelines/typography.md (Roles and sizes), each property a token.
const style = (name, size, weight, lineHeight) => ({
  name,
  fontSize: value(`--mq-font-size-${size}`),
  fontWeight: value(`--mq-font-weight-${weight}`),
  ...(lineHeight ? { lineHeight: value(`--mq-font-line-height-${lineHeight}`) } : {}),
});
const type = {
  families: {
    heading: value("--mq-font-family-heading"),
    body: value("--mq-font-family-body"),
    mono: value("--mq-font-family-mono"),
  },
  groups: [
    {
      name: "Headings",
      family: "heading",
      styles: [
        style("hero-title", "hero-max", "heading"),
        style("slide-title", "slide-title", "heading", "tight"),
        style("section-title", "h2", "heading", "tight"),
        style("subsection-title", "h3", "heading"),
        style("takeaway", "takeaway", "heading"),
        style("label", "label", "heading"),
      ],
    },
    {
      name: "Figures",
      family: "heading",
      styles: [style("hero-figure", "figure", "heading"), style("kpi-value", "kpi", "heading"), style("counter-value", "stat", "heading")],
    },
    {
      name: "Reading text",
      family: "body",
      styles: [style("lead", "lead", "body"), style("body", "body", "body", "body"), style("small", "small", "body"), style("note", "note", "body")],
    },
    {
      name: "Mono",
      family: "mono",
      styles: [style("eyebrow", "eyebrow", "heading"), style("table-header", "table-header", "body"), style("table-figure", "table-cell", "body"), style("axis-label", "axis", "body")],
    },
  ],
};
write(
  "tokens.json",
  `${JSON.stringify(
    {
      name: "MedQuantis",
      version: 1,
      color: {
        themes: [
          { id: "light", name: "Light" },
          { id: "dark", name: "Dark" },
        ],
        tokens: family("color"),
      },
      type,
      spacing: { tokens: family("spacing") },
      radius: { tokens: family("radius") },
      shadow: { tokens: family("shadow") },
    },
    null,
    2,
  )}\n`,
);

// The brand book: README.md holds the guidelines the plan names, further sections the others, every
// section verbatim with relative links reduced to labels (the system cannot follow them).
const guidelineText = (name, level) => {
  const guideline = readGuideline(root, name);
  const sections = [...guideline.sections].filter(([heading]) => !(name === "principles.md" && heading === "Where the rules live"));
  return [guideline.intro && unlinkRelative(guideline.intro), ...sections.map(([heading, body]) => `${level} ${heading}\n\n${unlinkRelative(body)}`)].filter(Boolean).join("\n\n");
};
const README_GUIDELINES = ["principles.md", "colour.md", "typography.md", "writing.md", "charts.md", "data-patterns.md"];
const SECTION_GUIDELINES = ["brand.md", "voice.md", "layout.md", "accessibility.md", "specialising.md"];
write(
  "README.md",
  [
    "# MedQuantis",
    "",
    `The MedQuantis brand book, generated from guidelines/ and tokens/ by the build of @medquantis/design-system ${version}. Do not edit it here: the rules change in the design-system repository and come back with its next release.`,
    "",
    "Token names: each token of this system is the tokens.css custom property without its two leading dashes, so `mq-accent` in tokens.json is `--mq-accent` in the rules below, and `var(--mq-accent)` in code that loads tokens.css of the npm package.",
    "",
    `Further sections: ${SECTION_GUIDELINES.map((name) => readGuideline(root, name).title).join(", ")}.`,
    "",
    ...README_GUIDELINES.flatMap((name) => [`## ${readGuideline(root, name).title}`, "", guidelineText(name, "###"), ""]),
  ].join("\n"),
);
for (const name of SECTION_GUIDELINES) write(name, `# ${readGuideline(root, name).title}\n\n${guidelineText(name, "##")}\n`);

// Logos: the outlined files, since a system shows an SVG through <img>, which loads no web font.
const LOGOS = ["wordmark-on-light-print.svg", "wordmark-on-navy-print.svg", "monogram.svg", "monogram-square.svg", "monogram-small.svg"];
mkdirSync(join(out, "assets/Logos"), { recursive: true });
for (const name of LOGOS) copyFileSync(join(root, "brand", name), join(out, "assets/Logos", name));
const brand = readGuideline(root, "brand.md");
write(
  "assets/Logos/README.md",
  [
    "# Logos",
    "",
    "The MedQuantis wordmark and monogram, copied from brand/ of the design-system repository. The wordmarks here are the outlined print files, because an image cannot load web fonts; the live-text wordmarks stay in the npm package (brand/wordmark-on-light.svg, brand/wordmark-on-navy.svg).",
    "",
    ...["Wordmark", "Monogram and favicon", "No combined logo yet"].flatMap((heading) => [`## ${heading}`, "", unlinkRelative(brand.sections.get(heading)), ""]),
  ].join("\n"),
);

// Components: one per class of the kit document module, previewed with the module's own CSS. Each
// preview inlines the roles and rules of core, type, space-shape and document (dist/kit/), without
// the font faces: the page preloads the hosted faces.
const contract = JSON.parse(readFileSync(join(root, "tests/fixtures/kit-contract/modules.json"), "utf8"));
const kitCss = ["core", "type", "space-shape", "document"]
  .map((module) => readFileSync(join(root, "dist/kit", `${module}.css`), "utf8").replace(/@font-face\s*\{[^}]*\}\s*/g, ""))
  .join("\n")
  .trim();
const classRows = new Map(
  [...readFileSync(join(root, "build/kit-classes.md"), "utf8").matchAll(/^\| `([\w-]+)` \| `document` \| (.+) \|$/gm)].map(([, kitClass, text]) => [kitClass, text]),
);
const SAMPLES = {
  doc: { height: 260, body: '<main class="doc">\n  <h1>Quarterly review</h1>\n  <p>A document sheet on the canvas colour: Newsreader body text, Outfit 500 headings, one idea per block.</p>\n</main>' },
  "doc-keep": {
    height: 220,
    body: '<main class="doc">\n  <figure class="doc-keep">\n    <h3>A figure that never splits</h3>\n    <p>Its title, chart and source stay on one page when the document prints.</p>\n  </figure>\n</main>',
  },
  "doc-label": { height: 200, body: '<main class="doc">\n  <p class="doc-label">02 · Context</p>\n  <h2>Where the work stands</h2>\n</main>' },
  "doc-section": {
    height: 260,
    body: '<main class="doc">\n  <section class="doc-section">\n    <p class="doc-label">01 · Summary</p>\n    <h2>Summary</h2>\n    <p>A section opens with its own head, on a fresh page by default.</p>\n  </section>\n</main>',
  },
  "doc-section--flow": {
    height: 380,
    body: '<main class="doc">\n  <section class="doc-section">\n    <h2>Summary</h2>\n    <p>The first section.</p>\n  </section>\n  <section class="doc-section doc-section--flow">\n    <h2>Next steps</h2>\n    <p>A section that follows on the same page, after a hairline rule.</p>\n  </section>\n</main>',
  },
};
const componentName = (kitClass) => kitClass.split(/-+/).map((part) => part[0].toUpperCase() + part.slice(1)).join("");
const preview = (group, height, css, body) =>
  `<!-- @dsCard group="${group}" height=${height} -->\n<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<style>\n${css}\n</style>\n</head>\n<body>\n${body}\n</body>\n</html>\n`;
for (const kitClass of contract.modules.document.classes) {
  const row = classRows.get(kitClass);
  const sample = SAMPLES[kitClass];
  if (!row || !sample) throw new Error(`kit document class ${kitClass} has no build/kit-classes.md row or preview sample`);
  const name = componentName(kitClass);
  const rule = row.startsWith("follows ") ? row : `reproduces ${row}`;
  write(
    `components/${name}/README.md`,
    [
      `# ${name}`,
      "",
      `\`${kitClass}\`, a class of the homemade-claude-kit document module, ${rule}.`,
      "",
      `The rule is in dist/kit/document.css of @medquantis/design-system ${version}, written against the kit contract roles; the roles take their values from tokens/kit/.`,
      "",
      "## What the consumer provides",
      "",
      "The consumer provides the kit renderer that emits the class (com-slide-deck, mode: document) and the package's kit modules: core, type, space-shape and document, which kit-manifest.json declares. The preview inlines their roles and rules and relies on the page for the three hosted faces.",
      "",
    ].join("\n"),
  );
  write(`components/${name}/preview.html`, preview("Document", sample.height, `${kitCss}\n\nbody { margin: 0; }\n.doc { padding: var(--space-lg) var(--space-xl); }`, sample.body));
}

// The cover, written last: the outlined on-navy wordmark on the navy panel, with the tagline.
const wordmark = readFileSync(join(root, "brand/wordmark-on-navy-print.svg"), "utf8").replace(/<\?xml[^>]*>\s*/, "").trim();
const tagline = brand.sections.get("Tagline");
const taglineFor = (language) => tagline.match(new RegExp(`^\\| ${language} \\| ([^|]+) \\|$`, "m"))?.[1].trim();
const coverCss = [
  "body { margin: 0; }",
  `.cover { box-sizing: border-box; min-height: 320px; padding: ${value("--mq-space-7")} ${value("--mq-space-8")}; background: linear-gradient(135deg, ${value("--mq-panel-start")}, ${value("--mq-panel-end")}); color: ${value("--mq-on-navy-title")}; }`,
  ".cover svg { display: block; width: 255px; height: auto; }",
  `.cover-tagline { margin: ${value("--mq-space-6")} 0 ${value("--mq-space-2")}; font-family: ${value("--mq-font-family-heading")}; font-size: ${value("--mq-font-size-h3")}; font-weight: ${value("--mq-font-weight-heading")}; }`,
  `.cover-translation { margin: 0; color: ${value("--mq-on-navy-secondary")}; font-family: ${value("--mq-font-family-body")}; font-size: ${value("--mq-font-size-lead")}; font-style: italic; }`,
  `.cover-version { margin: ${value("--mq-space-6")} 0 0; color: ${value("--mq-on-navy-second-level")}; font-family: ${value("--mq-font-family-mono")}; font-size: ${value("--mq-font-size-eyebrow")}; font-weight: 500; letter-spacing: 0.16em; text-transform: uppercase; }`,
].join("\n");
write(
  "components/Cover/preview.html",
  preview(
    "Cover",
    320,
    coverCss,
    `<header class="cover">\n${wordmark}\n<p class="cover-tagline" lang="fr">${taglineFor("French")}</p>\n<p class="cover-translation">${taglineFor("English")}</p>\n<p class="cover-version">Design system · ${version}</p>\n</header>`,
  ),
);

// The index, last: the type's files index with its createdOnFiles marker. Publication uploads the
// logos and adds their records to assetGroups.Logos.files.
write(
  "design-system.json",
  `${JSON.stringify(
    {
      v: 3,
      layout: "files",
      createdOnFiles: { v: 1, at: now },
      title: "MedQuantis",
      namespace: "MedQuantis",
      libraries: [],
      sections: {},
      groups: ["Logos"],
      assetGroups: { Logos: { name: "Logos", tile: "l", order: LOGOS, files: {} } },
      blobs: {},
      docs: { sections: [] },
      lastChange: { by: "MedQuantis design-system build", at: now, via: `CI release v${version}`, note: `Generated from tokens/, guidelines/ and brand/ by the build of @medquantis/design-system ${version}.` },
    },
    null,
    2,
  )}\n`,
);
