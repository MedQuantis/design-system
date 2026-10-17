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

// Plan-0003 increment 02: the dark theme of ADR-0007 in the guidelines, every figure from the build.
const darkJson = () => {
  const path = join(root, "dist/themes/dark.json");
  assert.ok(existsSync(path), "dist/themes/dark.json is missing: run make build first");
  return JSON.parse(readFileSync(path, "utf8"));
};
// How a guideline writes a value: a hex as is, a translucent colour as its alpha in per cent.
const valueForms = (value) => {
  const forms = [...String(value).matchAll(/#[0-9a-f]{6}\b/gi)].map(([hex]) => hex.toLowerCase());
  for (const [, alpha] of String(value).matchAll(/rgba\([^)]*,\s*([\d.]+)\)/g)) forms.push(`${Math.round(Number(alpha) * 100)} %`);
  return forms;
};
// The backgrounds a dark ratio is stated on, as the guideline writes them.
const GROUNDS = {
  canvas: ["--mq-canvas"],
  surface: ["--mq-surface"],
  "the recessed surface": ["--mq-surface-alt"],
  "the panel start": ["--mq-panel-start"],
  "the accent": ["--mq-accent"],
  "the warning fill": ["--mq-warning-fill"],
  "the warning tint": ["--mq-warning-tint"],
  "the pale fill": ["--mq-accent-pale"],
  "the quiet pale fill": ["--mq-accent-pale-2"],
};
const FOREGROUNDS = { ink: "--mq-ink", white: "--mq-on-navy-title" };

test("colour.md has a Dark theme section naming every dark role with its value, and every stated ratio is the built one", async () => {
  const { evaluatePair } = await import("../../build/contrast-pairs.mjs");
  const body = section(read("guidelines/colour.md"), /^## Dark theme$/);
  assert.ok(body, "guidelines/colour.md has no '## Dark theme' section");
  const text = body.join("\n");
  assert.doesNotMatch(text, /[\u2013\u2014]/, "no em or en dash");
  const dark = darkJson();
  const built = distJson();
  for (const [name, token] of Object.entries(dark)) {
    const lines = body.filter((line) => line.includes(`\`${name}\``));
    assert.ok(lines.length > 0, `the Dark theme section does not name ${name}`);
    for (const form of valueForms(token.value)) assert.ok(lines.some((line) => line.toLowerCase().includes(form)), `${name}: no line gives its dark value ${form}`);
  }
  const grounds = Object.keys(GROUNDS).sort((a, b) => b.length - a.length).join("|");
  const claim = new RegExp(`(?:\\b(ink|white) )?(\\d+\\.\\d\\d):1 on (${grounds})\\b`, "g");
  let checked = 0;
  for (const line of body.filter((entry) => /^(\||- )/.test(entry) && /`--mq-[\w-]+`/.test(entry))) {
    const role = line.match(/`(--mq-[\w-]+)`/)[1];
    const ratios = line.match(/\d+\.\d\d:1/g) ?? [];
    const claims = [...line.matchAll(claim)];
    assert.equal(claims.length, ratios.length, `every ratio names its background: ${line}`);
    for (const [, fg, ratio, ground] of claims) {
      const pair = { fg: FOREGROUNDS[fg] ?? role, bg: GROUNDS[ground], use: "decorative" };
      assert.equal(evaluatePair(pair, built, dark).ratio.toFixed(2), ratio, `${pair.fg} on ${ground}: ${line}`);
      checked += 1;
    }
    if (line.startsWith("|")) assert.ok(line.split("|").map((cell) => cell.trim()).at(-2), `a dark row has no contrast cell: ${line}`);
  }
  assert.ok(checked >= 30, `only ${checked} dark ratios checked`);
  // Scope (ADR-0007): apps, documents chosen per document at build time, slides; opt in by class.
  for (const fact of [/apps/i, /documents?/i, /slides?/i, /at build time/, /`\.dark`/, /themes\/dark\.css/, /never .*prefers-color-scheme|prefers-color-scheme.*never/]) assert.match(text, fact);
  // Owner rulings of 2026-10-17: accent text on the pale fills reads the highlight; the on-navy tier on dark.
  for (const fact of [/pale KPI value/, /pale badge/, /callout title/, /no glow/i]) assert.match(text, fact);
  assert.ok(body.some((line) => line.includes("`--mq-on-navy-discreet`") && /large text or non-text/i.test(line)), "the discreet on-navy role is large text or non-text only");
  for (const name of ["--mq-on-navy-title", "--mq-on-navy-secondary", "--mq-on-navy-second-level", "--mq-on-navy-accent", "--mq-on-navy-discreet"]) {
    assert.ok(body.some((line) => line.startsWith("|") && line.includes(`\`${name}\``) && /on the panel start/.test(line)), `the on-navy tier on dark lacks ${name} on the panel start`);
  }
});

test("colour.md scopes the warm-neutral rule to light and names the light navy a navy tint with its hue figures", async () => {
  const { toLch } = await import("../../build/color-math.mjs");
  const neutrals = section(read("guidelines/colour.md"), /^## Neutrals$/).join("\n");
  const rule = neutrals.split("\n").find((line) => line.includes("never blue-tinted greys"));
  assert.ok(rule, "the warm-neutral rule is gone from Neutrals");
  assert.match(rule, /light theme/, "the warm-neutral rule names the light theme");
  const text = section(read("guidelines/colour.md"), /^## Dark theme$/).join("\n");
  const hue = (hex) => toLch(hex)[2].toFixed(1);
  const dark = darkJson();
  assert.match(text, /navy tint/);
  assert.match(text, /sky blue/);
  assert.ok(text.includes(`hue ${hue(dark["--mq-accent-highlight"].value)}`), "the light navy's LCH hue");
  assert.ok(text.includes(`navy ${hue(distJson()["--mq-accent"].value)}`), "navy's LCH hue");
  assert.ok(text.includes("sky blue 269.9"), "the retired sky blue's LCH hue");
});

test("every hex value in the guidelines is a value of dist/tokens.json or of the dark theme", () => {
  const values = new Set(
    [...Object.values(distJson()), ...Object.values(darkJson())]
      .map(({ value }) => String(value))
      .filter((value) => /^#[0-9a-f]{3,8}$/i.test(value))
      .map(normaliseHex),
  );
  const hits = [];
  for (const { name, text } of markdown()) {
    for (const match of text.matchAll(/(?<![\w&/])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![\w-])/g)) {
      if (!values.has(normaliseHex(match[0]))) hits.push(`${name}: ${match[0]}`);
    }
  }
  assert.deepEqual(hits, [], `hex values outside the token set: ${hits.join(", ")}`);
});

test("brand.md: the white wordmark on every dark surface, a navy tile on dark takes the panel gradient, the monogram outlined on dark", () => {
  const brand = read("guidelines/brand.md");
  const wordmark = section(brand, /^## Wordmark$/).join("\n");
  assert.match(wordmark, /every dark surface/);
  assert.match(wordmark, /wordmark-on-navy/);
  assert.match(wordmark, /navy wordmark is never used on dark|never .*navy wordmark.* on dark/i);
  const monogram = section(brand, /^## Monogram and favicon$/).join("\n");
  assert.match(monogram, /dark/);
  assert.match(monogram, /panel gradient/);
  assert.match(monogram, /1 px light-navy outline/);
  assert.match(monogram, /`--mq-shadow-panel`/);
});

test("the classification sits at the right of the slide footer, before the number, as a label in the deck's language (amends ruling 11)", () => {
  const legal = section(read("guidelines/brand.md"), /\sLegal line$/).join("\n");
  const layout = read("guidelines/layout.md");
  for (const [name, text] of [["brand.md", legal], ["layout.md", layout]]) {
    assert.match(text, /classification/i, `${name} names the classification`);
    assert.match(text, /right of the footer, before the (slide )?number/, `${name} places it before the number`);
    assert.match(text, /ruling 17/, `${name} cites the ruling`);
  }
  assert.match(legal, /deck's language/);
  assert.match(legal, /label/);
  assert.match(legal, /never the C0 to C3 code/);
});

test("guidelines/README.md lists the rulings after the bootstrap, numbered on from ruling 11, each with its date, guideline and source", () => {
  const readme = read("guidelines/README.md");
  const rulings = section(readme, /rulings after the bootstrap/i);
  assert.ok(rulings, "guidelines/README.md has no 'Rulings after the bootstrap' section");
  const rows = tableRows(rulings);
  assert.ok(rows.length >= 8, `only ${rows.length} rulings`);
  rows.forEach((row, index) => {
    const cells = row.split("|").map((cell) => cell.trim()).filter(Boolean);
    assert.equal(cells[0], String(12 + index), `ruling numbers run on from 11: ${row}`);
    assert.match(cells[1], /^2026-10-1[57]$/, `ruling date: ${row}`);
    assert.match(row, /\]\((?:\.\/)?[a-z-]+\.md(?:#[\w-]+)?\)/, `ruling names no guideline file: ${row}`);
    assert.match(row, /ADR-0007/, `ruling cites ADR-0007: ${row}`);
  });
  assert.ok(rows.some((row) => /2026-10-17/.test(row) && /--mq-accent-highlight/.test(row)), "the pale-fill ruling of 2026-10-17");
  assert.ok(rows.some((row) => /2026-10-17/.test(row) && /--mq-on-navy-accent/.test(row)), "the on-navy ruling of 2026-10-17");
});
