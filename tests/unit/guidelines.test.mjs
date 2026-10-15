import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../..", import.meta.url));
const dir = join(root, "guidelines");
const read = (path) => readFileSync(join(root, path), "utf8");

// Increment 09 scope: one file per topic, plus the index that maps every legacy rule.
const FILES = ["README.md", "principles.md", "brand.md", "voice.md", "colour.md", "typography.md", "layout.md", "charts.md", "data-patterns.md", "accessibility.md", "writing.md", "specialising.md"];

const markdown = () => {
  assert.ok(existsSync(dir), "guidelines/ is missing");
  const files = readdirSync(dir).filter((name) => name.endsWith(".md"));
  assert.ok(files.length > 0, "guidelines/ holds no markdown file");
  return files.map((name) => ({ name, text: read(`guidelines/${name}`) }));
};

// Lines outside fenced code blocks, with their 1-based numbers.
const prose = (text) => {
  let fenced = false;
  return text.split("\n").flatMap((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return [];
    }
    return fenced ? [] : [{ line, number: index + 1 }];
  });
};

const distJson = () => {
  const path = join(root, "dist/tokens.json");
  assert.ok(existsSync(path), "dist/tokens.json is missing: run make build first");
  return JSON.parse(readFileSync(path, "utf8"));
};

const normaliseHex = (hex) => {
  const digits = hex.slice(1).toLowerCase();
  return digits.length === 3 || digits.length === 4 ? `#${[...digits].map((c) => c + c).join("")}` : `#${digits}`;
};

test("every guideline file of the increment 09 scope exists, under the all-rights-reserved licence", () => {
  for (const name of FILES) assert.ok(existsSync(join(dir, name)), `guidelines/${name} is missing`);
  assert.match(read("guidelines/LICENSE"), /all rights reserved/i);
});

test("guidelines contain no em dash or en dash (writing rule)", () => {
  markdown();
  const hits = [];
  for (const name of readdirSync(dir)) {
    read(`guidelines/${name}`).split("\n").forEach((line, index) => {
      if (/[\u2013\u2014]/.test(line)) hits.push(`${name}:${index + 1}`);
    });
  }
  assert.deepEqual(hits, [], `em or en dash found in ${hits.join(", ")}`);
});

test("guideline paragraphs are never hard-wrapped: one line per paragraph or list item", () => {
  // A line that starts a block: heading, list item, table row, quote, HTML comment, rule.
  const blockStart = /^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|\||>|<!--|---\s*$|\*\*\*\s*$)/;
  const hits = [];
  for (const { name, text } of markdown()) {
    const lines = prose(text);
    for (let i = 1; i < lines.length; i += 1) {
      const previous = lines[i - 1];
      const { line, number } = lines[i];
      if (previous.number !== number - 1) continue;
      if (!previous.line.trim() || !line.trim()) continue;
      if (blockStart.test(line)) continue;
      if (/^\s*\|/.test(previous.line) || /^\s*#{1,6}\s/.test(previous.line) || /^\s*<!--/.test(previous.line)) continue;
      hits.push(`${name}:${number}`);
    }
  }
  assert.deepEqual(hits, [], `hard-wrapped lines continue a paragraph at ${hits.join(", ")}`);
});

test("every hex value in the guidelines is a value of dist/tokens.json", () => {
  const values = new Set(Object.values(distJson()).map(({ value }) => String(value)).filter((value) => /^#[0-9a-f]{3,8}$/i.test(value)).map(normaliseHex));
  const hits = [];
  for (const { name, text } of markdown()) {
    for (const match of text.matchAll(/(?<![\w&/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])/g)) {
      if (!values.has(normaliseHex(match[0]))) hits.push(`${name}: ${match[0]}`);
    }
  }
  assert.deepEqual(hits, [], `hex values outside the token set: ${hits.join(", ")}`);
});

test("every --mq- token the guidelines cite exists in dist/tokens.css", () => {
  const path = join(root, "dist/tokens.css");
  assert.ok(existsSync(path), "dist/tokens.css is missing: run make build first");
  const defined = [...readFileSync(path, "utf8").matchAll(/(--mq-[\w-]+)\s*:/g)].map((m) => m[1]);
  const hits = [];
  for (const { name, text } of markdown()) {
    for (const [cited] of text.matchAll(/--mq-[a-z0-9-]+/g)) {
      // A trailing hyphen cites a family (`--mq-radius-*`): it must prefix a real token.
      const known = cited.endsWith("-") ? defined.some((token) => token.startsWith(cited)) : defined.includes(cited);
      if (!known) hits.push(`${name}: ${cited}`);
    }
  }
  assert.deepEqual(hits, [], `unknown tokens cited: ${hits.join(", ")}`);
});

test("guidelines name no consumer file path, repository slug or local path", () => {
  const forbidden = [
    /\bdecks?\/[\w.-]/i,
    /\bfrontend\/[\w.-]/i,
    /\bviewer\/[\w.-]/i,
    /\bdocs\/(?:brand|ux|design-system|style-guide|glossary|developer)/i,
    /\bDESIGN_SYSTEM\.md\b/,
    /\bdesign-system-rapport\b/i,
    /\bstyle-guide\.md\b/i,
    /\bMedQuantis\/(?!design-system\b)[\w.-]+/,
    /swiss-aos/i,
    /medquantis-design-inventory/i,
    /\.claude\//,
    /\/(?:home|Users|mnt)\//,
    /\bpaper_pdf\b|\bi18n_build\b|\bLEARNINGS\b/,
  ];
  const hits = [];
  for (const { name, text } of markdown()) {
    text.split("\n").forEach((line, index) => {
      for (const pattern of forbidden) if (pattern.test(line)) hits.push(`${name}:${index + 1} ${pattern}`);
    });
  }
  assert.deepEqual(hits, [], `consumer paths or slugs found: ${hits.join(", ")}`);
});

const section = (text, heading) => {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => /^#{2,3}\s/.test(line) && heading.test(line));
  if (start < 0) return null;
  const level = lines[start].match(/^#+/)[0].length;
  const end = lines.findIndex((line, index) => index > start && new RegExp(`^#{1,${level}}\\s`).test(line));
  return lines.slice(start + 1, end < 0 ? undefined : end);
};
const tableRows = (lines) => lines.filter((line) => /^\|/.test(line) && !/^\|\s*:?-{2,}/.test(line)).slice(1);

test("guidelines/README.md maps every legacy rule: a carried-over table and a dropped table", () => {
  assert.ok(existsSync(join(dir, "README.md")), "guidelines/README.md is missing");
  const readme = read("guidelines/README.md");
  const carried = section(readme, /carried over/i);
  const dropped = section(readme, /dropped/i);
  assert.ok(carried, "guidelines/README.md has no 'Carried over' section");
  assert.ok(dropped, "guidelines/README.md has no 'Dropped' section");
  const carriedRows = tableRows(carried);
  const droppedRows = tableRows(dropped);
  assert.ok(carriedRows.length >= 50, `carried-over table has ${carriedRows.length} rows`);
  assert.ok(droppedRows.length >= 10, `dropped table has ${droppedRows.length} rows`);
  const sources = ["platform brand document", "platform design-system document", "platform report design system of 2026-10-08", "platform style guide", "Paracel design document"];
  for (const source of sources) {
    assert.ok(carriedRows.some((row) => row.includes(source)), `no carried-over rule cites the ${source}`);
  }
  for (const row of carriedRows) assert.match(row, /\]\((?:\.\/)?[a-z-]+\.md(?:#[\w-]+)?\)/, `carried-over row names no guideline file: ${row}`);
  for (const row of droppedRows) {
    const cells = row.split("|").map((cell) => cell.trim()).filter(Boolean);
    assert.ok(cells.length >= 3 && cells.at(-1).length > 0, `dropped row has no reason: ${row}`);
  }
});

test("data-patterns.md encodes owner ruling 8 as amended and carries the illustrative marker in its header", () => {
  const text = read("guidelines/data-patterns.md");
  assert.ok(text.split("\n").slice(0, 5).some((line) => line.includes("mq:illustrative")), "data-patterns.md needs the mq:illustrative marker in its first five lines");
  assert.match(text, /CHF\u00a02'460'000/, "CHF before the amount, joined by a non-breaking space, apostrophe thousands");
  assert.match(text, /12\.5\u00a0%/, "decimal point and a non-breaking space before %");
  assert.doesNotMatch(text, /\d\u2019\d/, "the curly apostrophe is never a thousands separator");
  assert.match(text, /null/i);
});

test("the root README lists every mq- component with its status, trial or stable", () => {
  const classes = new Set();
  // The mq- stylesheets only: css/kit/ restyles the kit's own classes and defines no mq- component.
  for (const file of readdirSync(join(root, "css")).filter((name) => name.endsWith(".css"))) {
    for (const [, name] of read(`css/${file}`).matchAll(/\.(mq-[a-z]+)(?![a-z-])/g)) classes.add(name);
  }
  const readme = read("README.md");
  const status = section(readme, /component status/i);
  assert.ok(status, "README.md has no 'Component status' section");
  const rows = tableRows(status);
  const missing = [...classes].filter((name) => !rows.some((row) => row.includes(`\`${name}\``) && /\b(trial|stable)\b/i.test(row)));
  assert.deepEqual(missing, [], `components without a status row: ${missing.join(", ")}`);
});

test("charts.md: a legend beside a ring is mq-legend is-column, and the ring has a construction recipe", () => {
  const text = read("guidelines/charts.md");
  const legends = section(text, /\sLegends$/);
  assert.ok(legends && legends.join("\n").includes("is-column"), "the Legends section names mq-legend is-column");
  const recipe = section(text, /ring construction/i);
  assert.ok(recipe, "charts.md has no ring construction section");
  const body = recipe.join("\n");
  for (const fact of [/pathLength="100"/, /rotate/i, /gap/i, /stroke-dashoffset/, /--mq-chart-rest/, /--mq-chart-series-4/, /2 px wider/, /100/]) assert.match(body, fact);
});

test("slides carry the legal line in mq-slide-foot, bottom left, with the slide number bottom right (owner ruling 11)", () => {
  const layout = read("guidelines/layout.md");
  assert.match(layout, /mq-slide-foot/);
  assert.match(layout, /ruling 11/);
  const legal = section(read("guidelines/brand.md"), /\sLegal line$/).join("\n");
  assert.match(legal, /mq-slide-foot/);
  assert.match(legal, /bottom left/);
  assert.match(legal, /ruling 11/);
});

test("typography.md names the light weight token for the Quantis half of the wordmark (owner ruling 6)", () => {
  const row = read("guidelines/typography.md").split("\n").find((line) => line.startsWith("| Outfit 300 |"));
  assert.ok(row, "no Outfit 300 row in the weights table");
  assert.match(row, /`--mq-font-weight-light`/);
});
