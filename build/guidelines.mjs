// Reads guidelines/ as data, so the Claude skill references and the llms files are generated from
// the one written source instead of being copied by hand.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Reading order of the guidelines, the order llms.txt lists them in; README.md maps legacy rules
// and is not guidance for producing output.
export const GUIDELINE_ORDER = [
  "principles.md",
  "brand.md",
  "voice.md",
  "writing.md",
  "colour.md",
  "typography.md",
  "layout.md",
  "charts.md",
  "data-patterns.md",
  "accessibility.md",
  "specialising.md",
];

export const guidelineFiles = (root) => {
  const present = readdirSync(join(root, "guidelines")).filter((name) => name.endsWith(".md") && name !== "README.md");
  const unknown = present.filter((name) => !GUIDELINE_ORDER.includes(name));
  if (unknown.length) throw new Error(`guidelines without a reading position: ${unknown.join(", ")}`);
  return GUIDELINE_ORDER.filter((name) => present.includes(name));
};

// One guideline as { title, intro, sections: Map<heading, body> }. The intro is the text between
// the title and the first second-level heading, minus HTML comments.
export const readGuideline = (root, name) => {
  const text = readFileSync(join(root, "guidelines", name), "utf8");
  const lines = text.split("\n");
  const title = lines.find((line) => line.startsWith("# "))?.slice(2);
  if (!title) throw new Error(`guidelines/${name} has no title`);
  const sections = new Map();
  let current = "";
  const buffer = { "": [] };
  for (const line of lines.slice(lines.indexOf(`# ${title}`) + 1)) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      current = heading[1];
      buffer[current] = [];
    } else buffer[current].push(line);
  }
  const clean = (body) => body.join("\n").replace(/<!--[\s\S]*?-->/g, "").trim();
  for (const [heading, body] of Object.entries(buffer)) if (heading) sections.set(heading, clean(body));
  return { name, title, text, intro: clean(buffer[""]), sections };
};

// A reference read outside the repository cannot follow relative links, and Agent Skills keep
// references one level deep, so relative links become their plain label; absolute URLs stay.
export const unlinkRelative = (markdown) => markdown.replace(/\[([^\]]+)\]\((?!https?:)[^)\s]+\)/g, "$1");

// The legal line, written once in guidelines/brand.md (section "Legal line", the line in
// backticks). The kit brand module reads it here instead of a second copy in tokens/.
export const legalLine = (root) => {
  const section = readGuideline(root, "brand.md").sections.get("Legal line");
  const line = section?.match(/^`([^`]+)`$/m)?.[1];
  if (!line) throw new Error("guidelines/brand.md has no legal line in backticks under ## Legal line");
  return line;
};
