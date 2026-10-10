// Generates dist/llms.txt (llmstxt.org format: title, summary, link lists) and dist/llms-full.txt
// (every guideline in full and every token) from guidelines/ and dist/tokens.json. Part of make build.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { guidelineFiles, readGuideline, unlinkRelative } from "../build/guidelines.mjs";
import { isCoreToken, readTokens, tokenTable } from "../build/token-data.mjs";

const SUMMARY =
  "Design tokens, shared CSS, self-hosted fonts, brand files and written guidelines for every MedQuantis medium: slides, A4 reports, papers, the website, newsletters and interactive apps. Navy is the single brand accent; documents never use status colours.";

const DETAILS = [
  "Every value is a `--mq-*` CSS custom property in `tokens.css`. Use the semantic names, never the `--mq-core-*` ones, and never write a literal colour, font, radius or spacing value. Status colours (`--mq-success`, `--mq-warning`, `--mq-danger`, `--mq-info`) are for interactive apps only, always with an icon or a word. Corners are 3 px for small items and 6 px for cards; 12 px only for app dialogs, drawers and command palettes. Numbers use the straight apostrophe as thousands separator, a decimal point, a non-breaking space before `%` and after `CHF`. Copy never contains an em dash or an en dash.",
  "The links below point at the exact release on the jsDelivr CDN; pin that version, never a range.",
];

const cdn = (version, path) => `https://cdn.jsdelivr.net/npm/@medquantis/design-system@${version}/${path}`;

// The "Covers" column of guidelines/README.md describes each file.
const covers = (root) => {
  const map = new Map();
  for (const [, name, text] of readFileSync(join(root, "guidelines/README.md"), "utf8").matchAll(/^\| \[[^\]]+\]\(([\w-]+\.md)\) \| (.+) \|$/gm)) map.set(name, text);
  return map;
};

export const renderLlms = (root) => {
  const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
  const files = guidelineFiles(root);
  const notes = covers(root);
  const guidelines = files.map((name) => readGuideline(root, name));
  const link = (title, path, note) => `- [${title}](${cdn(version, path)})${note ? `: ${note}` : ""}`;

  const llms = [
    "# MedQuantis design system",
    "",
    `> ${SUMMARY}`,
    "",
    ...DETAILS.flatMap((paragraph) => [paragraph, ""]),
    "## Guidelines",
    "",
    ...guidelines.map((g) => link(g.title, `guidelines/${g.name}`, notes.get(g.name))),
    "",
    "## Tokens and CSS",
    "",
    link("tokens.css", "dist/tokens.css", "every token as a `--mq-*` custom property; load it first"),
    link("tokens.json", "dist/tokens.json", "every token with its resolved value and description"),
    link("tailwind.css", "dist/tailwind.css", "Tailwind 4 theme with 50 to 950 scales, for apps"),
    link("base.css", "css/base.css", "typography roles for documents"),
    link("components.css", "css/components.css", "the shared `mq-` document components"),
    link("slide.css", "css/slide.css", "the 1280 by 720 slide canvas"),
    link("print.css", "css/print.css", "A4 pages with exact colour printing"),
    link("app.css", "css/app.css", "status badges, for interactive apps only"),
    link("fonts.css", "fonts/fonts.css", "self-hosted Outfit, Newsreader and Geist Mono"),
    "",
    "## Optional",
    "",
    link("llms-full.txt", "dist/llms-full.txt", "every guideline in full and every token with its value"),
    link("kit-contract.css", "dist/kit-contract.css", "unprefixed names for homemade-claude-kit renderers only, never loaded in an app"),
    link("Guidelines index", "guidelines/README.md", "the file list and where each legacy rule went"),
    "",
  ].join("\n");

  const readme = readFileSync(join(root, "guidelines/README.md"), "utf8").split(/^## /m)[0].trim();
  const tokens = Object.entries(readTokens(root));
  const full = [
    "# MedQuantis design system",
    "",
    `> ${SUMMARY}`,
    "",
    ...DETAILS.flatMap((paragraph) => [paragraph, ""]),
    unlinkRelative(readme),
    "",
    ...guidelines.flatMap((g) => [unlinkRelative(g.text.replace(/<!--[\s\S]*?-->\n*/g, "")).trim(), ""]),
    "# Tokens",
    "",
    `Every token of release ${version}, generated from dist/tokens.json. Consumers use the semantic names; the \`--mq-core-*\` names exist so semantic tokens can point at them. A deprecated token names its replacement.`,
    "",
    "## Semantic tokens",
    "",
    tokenTable(tokens.filter(([name]) => !isCoreToken(name)).map(([name, token]) => [name, token.deprecated ? { ...token, description: `Deprecated: ${token.deprecated}` } : token])),
    "",
    "## Core tokens (never named by a consumer)",
    "",
    tokenTable(tokens.filter(([name]) => isCoreToken(name))),
    "",
  ].join("\n");

  return { "llms.txt": llms, "llms-full.txt": full };
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  for (const [name, text] of Object.entries(renderLlms(root))) writeFileSync(join(root, "dist", name), text);
}
