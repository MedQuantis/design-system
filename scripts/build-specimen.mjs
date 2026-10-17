#!/usr/bin/env node
// Generates dist/specimen/, the visual reference of the design system: index.html (light) and
// dark.html (the dark theme of ADR-0007) plus copies of tokens.css, themes/dark.css, css/, fonts/
// and brand/, so the folder opens offline on its own and requests nothing outside itself. Built
// from dist/tokens.json, dist/themes/dark.json, tokens/contrast-pairs.json, css/ and the
// fictitious data in examples/; never hand-edited. Run through `make specimen`.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { evaluatePair, loadPairs, THRESHOLDS } from "../build/contrast-pairs.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const NBSP = " ";

// Owner ruling 8: straight apostrophe thousands separator, decimal point, currency first; the
// space after CHF and the one before % are non-breaking, so a figure never wraps from its unit.
export function formatNumber(value, decimals = 0) {
  const [integer, fraction] = Math.abs(value).toFixed(decimals).split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  return `${value < 0 ? "-" : ""}${grouped}${fraction ? `.${fraction}` : ""}`;
}
export const formatChf = (value) => `CHF${NBSP}${formatNumber(value)}`;
export const formatPercent = (value, decimals = 1) => `${formatNumber(value, decimals)}${NBSP}%`;

const formatFigure = ({ value, format }) => {
  if (format === "chf") return formatChf(value);
  if (format === "percent") return formatPercent(value);
  return formatNumber(value);
};

const escape = (text) =>
  String(text).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

// Status colours belong to apps only (ADR-0004); they appear in the app section alone.
const STATUS = new Set(["--mq-success", "--mq-warning", "--mq-danger", "--mq-info", "--mq-warning-fill", "--mq-warning-tint"]);
const isStatusPair = (pair) => [pair.fg, ...pair.bg].some((name) => STATUS.has(name));

const colourGroup = (name, token) => {
  if (STATUS.has(name)) return "status";
  if (token.path[1] === "chart") return "chart";
  if (token.path[1] === "focus") return "focus";
  if (/^--mq-(accent|on-accent|panel|on-navy)/.test(name)) return "navy";
  return "neutral";
};

const layers = (names) => {
  const [top, ...rest] = [names].flat();
  return rest.length === 0 ? `var(${top})` : `linear-gradient(var(${top}), var(${top})), ${layers(rest)}`;
};

function icon(node, { size = 16, className = "" } = {}) {
  const children = node
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${escape(value)}"`).join(" ")}/>`)
    .join("");
  const classAttr = className ? ` class="${className}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg"${classAttr} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${children}</svg>`;
}

const inlineSvg = (file) =>
  readFileSync(join(root, "brand", file), "utf8")
    .trim()
    .replace(/^<svg /, '<svg role="img" aria-label="MedQuantis" ');

// The pages, one per theme; a theme page prints the values and ratios of its theme, read over
// the light tokens for the roles it does not re-value.
export const PAGES = [
  { file: "index.html", theme: "light" },
  { file: "dark.html", theme: "dark" },
];

function swatches(tokens, group, theme = {}) {
  const dark = Object.keys(theme).length > 0;
  const items = Object.entries(tokens)
    .filter(([name, token]) => token.type === "color" && !name.startsWith("--mq-core-") && !token.deprecated && colourGroup(name, token) === group)
    .map(([name, token]) => [name, theme[name] ?? token]);
  return `<div class="specimen-grid">${items
    .map(([name, token]) => {
      const onNavy = /^--mq-on-navy-/.test(name) && group === "navy";
      // On dark the navy shows as the panel gradient, never the lifted accent (owner ruling 14).
      const chip = onNavy ? layers([name, dark ? "--mq-panel-start" : "--mq-accent"]) : `var(${name})`;
      return `<figure class="specimen-swatch" data-swatch="${name}" style="margin: 0">
  <div style="background: ${chip}"></div>
  <figcaption class="specimen-swatch-text"><code>${name}</code><span>${escape(token.value)}${onNavy ? " on navy" : ""}</span><span class="specimen-swatch-note">${escape(token.description ?? "")}</span></figcaption>
</figure>`;
    })
    .join("\n")}</div>`;
}

function contrastTable(pairs, tokens, caption, theme = {}) {
  const rows = pairs
    .map((pair) => {
      const { ratio, required } = evaluatePair(pair, tokens, theme);
      const background = layers(pair.bg);
      const sample =
        pair.use === "text" || pair.use === "large"
          ? `<span class="specimen-sample${pair.use === "large" ? " is-large" : ""}" style="background: ${background}; color: var(${pair.fg})">Aa</span>`
          : `<span class="specimen-sample" style="background: ${background}"><span class="specimen-mark${pair.use === "decorative" ? " is-hairline" : ""}" style="background: var(${pair.fg})"></span></span>`;
      const minimum = required > 0 ? `${required}:1 minimum` : "no minimum";
      return `<tr data-pair="${pair.fg} on ${pair.bg.join(" ")}">
  <td>${sample}</td><td><code>${pair.fg}</code></td><td>${pair.bg.map((name) => `<code>${name}</code>`).join(" over ")}</td>
  <td class="mq-num">${ratio.toFixed(2)}:1</td><td>${pair.use}, ${minimum}${pair.note ? `<br><span class="mq-note">${escape(pair.note)}</span>` : ""}</td>
</tr>`;
    })
    .join("\n");
  return `<table class="mq-table specimen-contrast">
<caption class="mq-label" style="text-align: left">${caption}</caption>
<thead><tr><th scope="col" class="is-sample">Sample</th><th scope="col" class="is-token">Foreground</th><th scope="col" class="is-token">Background</th><th scope="col" class="is-ratio">Ratio</th><th scope="col">Allowed use</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>`;
}

const TYPE_FAMILY = (name) => {
  if (/hero|h2|h3|figure|kpi|stat|slide-title|takeaway/.test(name)) return ["heading", "heading"];
  if (/eyebrow|table-header|table-cell|axis/.test(name)) return ["mono", "body"];
  if (/label|table-text/.test(name)) return ["ui", "body"];
  return ["body", "body"];
};

function typeScale(tokens) {
  const families = ["heading", "body", "ui", "mono"]
    .map((role) => {
      const token = tokens[`--mq-font-family-${role}`];
      return `<div class="specimen-type-row"><code>--mq-font-family-${role}</code><span class="specimen-type-sample" style="font-family: var(--mq-font-family-${role}); font-size: var(--mq-font-size-h3)">${escape(token.value.split(",")[0].replace(/'/g, ""))}: Rapport de marché fictif</span></div>`;
    })
    .join("\n");
  const weights = [
    ["heading", "Outfit 500 for every heading, column title and hero figure"],
    ["emphasis", "600 only for a short highlighted word"],
    ["body", "400 for body text"],
    ["light", "300 only for the Quantis half of the wordmark"],
  ]
    .map(([weight, text]) => `<div class="specimen-type-row"><code>--mq-font-weight-${weight}</code><span class="specimen-type-sample" style="font-family: var(--mq-font-family-heading); font-size: var(--mq-font-size-h3); font-weight: var(--mq-font-weight-${weight})">${text}</span></div>`)
    .join("\n");
  const sizes = Object.entries(tokens)
    .filter(([name]) => name.startsWith("--mq-font-size-"))
    .map(([name, token]) => {
      const [family, weight] = TYPE_FAMILY(name);
      return `<div class="specimen-type-row"><code>${name} ${escape(token.value)}</code><span class="specimen-type-sample" data-type-sample="${name}" style="font-family: var(--mq-font-family-${family}); font-size: var(${name}); font-weight: var(--mq-font-weight-${weight})">Rapport de marché fictif</span></div>`;
    })
    .join("\n");
  return `<h3 class="mq-subtitle specimen-sub">Families</h3>${families}<h3 class="mq-subtitle specimen-sub">Weights</h3>${weights}<h3 class="mq-subtitle specimen-sub">Sizes</h3>${sizes}`;
}

function insurerTable(insurers) {
  const total = insurers.reduce((sum, row) => ({ premium: sum.premium + row.premium, share: sum.share + row.share }), { premium: 0, share: 0 });
  const rows = insurers
    .map(
      (row, index) => `<tr${index === 0 ? ' class="is-highlight"' : ""}><td${index === 0 ? ' class="is-key"' : ""}>${escape(row.name)}</td><td class="mq-num">${formatChf(row.premium)}</td><td class="mq-num">${formatPercent(row.share)}</td></tr>`,
    )
    .join("\n");
  return `<table class="mq-table">
<thead><tr><th scope="col">Assureur</th><th scope="col">Primes</th><th scope="col">Part</th></tr></thead>
<tbody>
${rows}
<tr class="is-total"><td>Total</td><td class="mq-num">${formatChf(total.premium)}</td><td class="mq-num">${formatPercent(total.share)}</td></tr>
</tbody>
</table>`;
}

function chart(insurers) {
  const series = ["is-1", "is-2", "is-3", "is-4", "is-rest"];
  const segments = insurers.map((row, index) => `<div class="mq-segment ${series[index]}" style="flex: ${row.share} 1 0"></div>`).join("");
  const legend = insurers
    .map((row, index) => `<li class="mq-legend-item"><span class="mq-swatch ${series[index]}"></span>${escape(row.name)} · ${formatPercent(row.share)}</li>`)
    .join("\n");
  return `<div class="specimen-stack">
<div class="mq-distribution" role="img" aria-label="Distribution of premiums by insurer, labelled in the legend">${segments}</div>
<ul class="mq-legend">
${legend}
<li class="mq-legend-item"><span class="mq-swatch is-outline"></span>Objectif</li>
<li class="mq-legend-item"><span class="mq-swatch is-dashed"></span>Projection</li>
</ul>
</div>`;
}

// Ring per guidelines/charts.md: one circle per part on pathLength 100, rotated to start at
// the top; each arc is its value minus a one-unit gap and starts at minus the running total;
// the remainder is a rest arc drawn over a 2 px wider series 4 arc, its outline.
function ring(insurers) {
  const parts = [
    { name: insurers[0].name, value: insurers[0].share, series: "is-1", stroke: "--mq-chart-series-1" },
    { name: insurers[1].name, value: insurers[1].share, series: "is-2", stroke: "--mq-chart-series-2" },
    { name: "Autres assureurs", value: insurers.slice(2).reduce((sum, row) => sum + row.share, 0), series: "is-rest", stroke: "--mq-chart-rest" },
  ];
  const gap = 1;
  let start = 0;
  const arcs = parts
    .map((part) => {
      const dash = `stroke-dasharray="${part.value - gap} ${100 - part.value + gap}" stroke-dashoffset="${-start}"`;
      const circle = (stroke, width, value) =>
        `<circle cx="60" cy="60" r="44" pathLength="100" fill="none" ${dash} stroke-width="${width}" style="stroke: var(${stroke})"${value === undefined ? "" : ` data-value="${value}"`}/>`;
      start += part.value;
      return part.series === "is-rest" ? circle("--mq-chart-series-4", 18, undefined) + circle(part.stroke, 16, part.value) : circle(part.stroke, 16, part.value);
    })
    .join("");
  const items = parts
    .map((part) => `<li class="mq-legend-item${part.series === "is-rest" ? " is-rest" : ""}"><span class="mq-swatch ${part.series}"></span>${escape(part.name)}<span class="mq-legend-value">${formatPercent(part.value)}</span></li>`)
    .join("\n");
  return `<div class="specimen-ring">
<svg viewBox="0 0 120 120" width="160" height="160" role="img" aria-label="Share of premiums by insurer, labelled in the legend"><g transform="rotate(-90 60 60)">${arcs}</g></svg>
<ul class="mq-legend is-column">
${items}
</ul>
</div>`;
}

const LEGAL = "MedQuantis SA · CH-1095 Lutry · medquantis.ch";

const kpiTile = (kpi, variant = "") =>
  `<div class="mq-kpi${variant ? ` ${variant}` : ""}"><p class="mq-kpi-label">${escape(kpi.label)}</p><p class="mq-kpi-value">${formatFigure(kpi)}</p><p class="mq-kpi-caption">${escape(kpi.caption)}</p></div>`;

const FOOT = "Illustrative data: invented insurers and products, round figures, no real market.";

const BRAND_TILES = {
  light: [
    ["wordmark-on-light.svg", "", true],
    ["wordmark-on-light-print.svg", "", false],
    ["wordmark-on-navy.svg", " is-navy", true],
    ["wordmark-on-navy-print.svg", " is-navy", false],
  ],
  // On dark the white on-navy files go on every surface; the navy wordmark is 1.25:1 there (owner ruling 14).
  dark: [
    ["wordmark-on-navy.svg", "", true],
    ["wordmark-on-navy-print.svg", "", false],
    ["wordmark-on-navy.svg", " is-navy", true],
    ["wordmark-on-navy-print.svg", " is-navy", false],
  ],
};

function brandTiles(themeName) {
  return BRAND_TILES[themeName]
    .map(([file, variant, live]) =>
      live
        ? `<div class="specimen-brand-tile${variant}" data-brand="${file}">${inlineSvg(file)}<span>${file} · live text</span></div>`
        : `<div class="specimen-brand-tile${variant}"><img src="brand/${file}" alt="MedQuantis"><span>${file} · outlined</span></div>`,
    )
    .join("\n");
}

export function renderSpecimen({ tokens, pairs, examples, version, icons, theme = "light", themeTokens = {} }) {
  const { kpis, insurers, products } = examples;
  const dark = theme === "dark";
  const shown = pairs.filter((pair) => pair.themes.includes(theme));
  const documentPairs = shown.filter((pair) => !isStatusPair(pair));
  const statusPairs = shown.filter(isStatusPair);
  const lead = insurers[0];
  const sections = [
    ["colour", "Colour"],
    ["contrast", "Contrast"],
    ["type", "Typography"],
    ["shape", "Radius and elevation"],
    ["components", "Components"],
    ["brand", "Brand"],
    ["slide", "Slide"],
    ["print", "A4 page"],
    ["focus", "Focus"],
    ["app-status", "App status layer"],
  ];

  return `<!doctype html>
<html lang="en"${dark ? ' class="dark"' : ""}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>MedQuantis design system specimen${dark ? ", dark theme" : ""}</title>
<link rel="icon" href="brand/favicon/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="fonts/fonts.css">
<link rel="stylesheet" href="tokens.css">
${dark ? '<link rel="stylesheet" href="themes/dark.css">\n' : ""}<link rel="stylesheet" href="css/base.css">
<link rel="stylesheet" href="css/components.css">
<link rel="stylesheet" href="css/slide.css">
<link rel="stylesheet" href="css/print.css">
<link rel="stylesheet" href="css/app.css">
<link rel="stylesheet" href="specimen.css">
</head>
<body class="mq-doc" style="margin: 0">
<header class="mq-wrap specimen-header">
${inlineSvg(dark ? "wordmark-on-navy.svg" : "wordmark-on-light.svg").replace("<svg ", '<svg class="specimen-brandline" ')}
<p class="mq-eyebrow" style="margin-top: var(--mq-space-5)">Design system specimen${dark ? " · dark theme" : ""} · version ${escape(version)}</p>
<h1 class="mq-display">MedQuantis design system</h1>
<p class="mq-lead">The visual reference of every token and shared component, generated from <code>dist/tokens.json</code>, <code>css/</code> and <code>examples/</code> by <code>scripts/build-specimen.mjs</code>. Never edit this page by hand.</p>
<nav class="specimen-nav mq-no-print" aria-label="Sections"><ul>
${sections.map(([id, title]) => `<li><a href="#${id}">${title}</a></li>`).join("\n")}
</ul></nav>
</header>
<main>

<section class="mq-wrap specimen-section" id="colour" aria-labelledby="colour-title">
<h2 class="mq-title" id="colour-title">Colour</h2>
<p class="mq-prose">Semantic tokens only; consumers never use the <code>--mq-core-*</code> names. Status colours are shown in the app status layer, since documents never use them (ADR-0004).</p>
<h3 class="mq-subtitle specimen-sub">Text, surfaces and lines</h3>
${swatches(tokens, "neutral", themeTokens)}
<h3 class="mq-subtitle specimen-sub">Navy and on navy</h3>
${swatches(tokens, "navy", themeTokens)}
<h3 class="mq-subtitle specimen-sub">Charts: four ordered series and the remainder</h3>
${swatches(tokens, "chart", themeTokens)}
<h3 class="mq-subtitle specimen-sub">Focus ring</h3>
${swatches(tokens, "focus", themeTokens)}
</section>

<section class="mq-wrap specimen-section" id="contrast" aria-labelledby="contrast-title">
<h2 class="mq-title" id="contrast-title">Contrast</h2>
<p class="mq-prose">Every foreground and background pairing the shared CSS uses, from <code>tokens/contrast-pairs.json</code>, with its WCAG 2.x ratio and the use it is allowed for. A pairing that is not listed is not allowed.</p>
${contrastTable(documentPairs, tokens, "Document and app pairings", themeTokens)}
</section>

<section class="mq-wrap specimen-section" id="type" aria-labelledby="type-title">
<h2 class="mq-title" id="type-title">Typography</h2>
<p class="mq-prose">Outfit for headings, labels and app UI, Newsreader for body text, Geist Mono for figures and codes, all self-hosted.</p>
${typeScale(tokens)}
</section>

<section class="mq-wrap specimen-section" id="shape" aria-labelledby="shape-title">
<h2 class="mq-title" id="shape-title">Radius and elevation</h2>
<p class="mq-prose">Two radii in every document, never a pill. The 12 px radius exists for app overlays alone.</p>
<div class="specimen-row">
<div class="specimen-radius is-small" data-radius="--mq-radius-small">3 px · tags, inputs and chips</div>
<div class="specimen-radius is-medium" data-radius="--mq-radius-medium">6 px · cards and panels, the maximum in documents</div>
<div class="specimen-radius is-overlay" data-radius="--mq-radius-overlay">12 px · apps, overlays only: dialogs, drawers, command palettes</div>
</div>
<div class="specimen-row" style="margin-top: var(--mq-space-5)">
${["small", "medium", "panel"].map((name) => `<div class="specimen-elevation" style="box-shadow: var(--mq-shadow-${name})">--mq-shadow-${name}</div>`).join("\n")}
</div>
</section>

<section class="mq-wrap specimen-section" id="components" aria-labelledby="components-title">
<h2 class="mq-title" id="components-title">Components</h2>
<p class="mq-prose">The <code>mq-</code> classes of <code>css/base.css</code> and <code>css/components.css</code>, for slides, reports, papers and the website.</p>

<h3 class="mq-subtitle specimen-sub">Typography roles</h3>
<div class="specimen-stack">
<p class="mq-eyebrow">Eyebrow · rapport de marché</p>
<p class="mq-title">Section title</p>
<p class="mq-subtitle">Subsection title</p>
<p class="mq-lead">A lead paragraph sets the question the page answers, in one or two sentences.</p>
<p class="mq-prose">Body prose in Newsreader. <span class="mq-em">Highlighted word</span> in weight 600, a code in <span class="mq-mono">Geist Mono 2026-Q1</span>, and a <a href="#components">link in navy</a>.</p>
<p class="mq-label">Label in Outfit</p>
<p class="mq-note">A note or source line in tertiary grey.</p>
<p class="mq-figure">${formatFigure(kpis[0])}</p>
</div>

<h3 class="mq-subtitle specimen-sub">Cards</h3>
<div class="specimen-columns">
<div class="mq-card"><h4 class="mq-card-title">${escape(products[0].name)}</h4><p class="mq-card-body">A card holds one idea: a title, a short body and, at most, one figure.</p></div>
<div class="mq-card"><h4 class="mq-card-title">${escape(products[1].name)}</h4><p class="mq-card-body">Cards sit on ${dark ? "the dark surface" : "white"} with a hairline and the small shadow.</p></div>
</div>

<h3 class="mq-subtitle specimen-sub">Navy panel</h3>
<div class="mq-panel">
<span class="mq-panel-icon">${icon(icons.ChartColumn, { size: 24 })}</span>
<p class="mq-panel-kicker" style="margin-top: var(--mq-space-4)">Synthèse</p>
<h4 class="mq-panel-title">${escape(lead.name)} détient ${formatPercent(lead.share)} des primes</h4>
<p class="mq-panel-text">Second-level text on navy, for the sentence that explains the figure.</p>
<hr class="mq-panel-rule">
<p class="mq-panel-text">Total des primes : ${formatChf(insurers.reduce((sum, row) => sum + row.premium, 0))}</p>
</div>

<h3 class="mq-subtitle specimen-sub">KPI tiles</h3>
<div class="mq-kpis">
${kpiTile(kpis[0])}
${kpiTile(kpis[1], "is-navy")}
${kpiTile(kpis[2], "is-pale")}
</div>

<h3 class="mq-subtitle specimen-sub">Table</h3>
${insurerTable(insurers)}

<h3 class="mq-subtitle specimen-sub">Badges: state by mark style, never by hue</h3>
<div class="specimen-row">
<span class="mq-badge is-solid">Validé</span>
<span class="mq-badge is-ring">À relire</span>
<span class="mq-badge is-pale">Brouillon</span>
<span class="mq-badge is-outline">Archivé</span>
<span class="mq-badge is-quiet">Interne</span>
<span class="mq-badge is-dashed">Estimé</span>
</div>

<h3 class="mq-subtitle specimen-sub">Callout</h3>
<div class="mq-callout"><p class="mq-callout-title">Note méthodologique</p><p style="margin: 0">Les chiffres de cette page sont inventés et arrondis.</p></div>

<h3 class="mq-subtitle specimen-sub">Progress</h3>
<div class="specimen-stack">
${products
  .map(
    (product) => `<div class="mq-progress"><span class="mq-progress-label">${escape(product.name)}</span><span class="mq-progress-value">${formatPercent(product.progress)}</span><div class="mq-progress-track" aria-hidden="true"><div class="mq-progress-fill" style="width: ${product.progress}%"></div></div></div>`,
  )
  .join("\n")}
</div>

<h3 class="mq-subtitle specimen-sub">Chart: distribution and legend</h3>
${chart(insurers)}
<h3 class="mq-subtitle specimen-sub">Chart: ring and column legend</h3>
${ring(insurers)}
<p class="mq-takeaway">${escape(lead.name)} reste en tête avec ${formatPercent(lead.share)} des primes.</p>
<p class="mq-foot">${FOOT}</p>
</section>

<section class="mq-wrap specimen-section" id="brand" aria-labelledby="brand-title">
<h2 class="mq-title" id="brand-title">Brand</h2>
<p class="mq-prose">${
    dark
      ? "On dark, the white on-navy files on every surface, never the navy wordmark (owner ruling 14): live text for pages that load <code>fonts.css</code>, outlined for images, documents, email and print. A navy tile takes the panel gradient, and the monogram the panel's 1 px edge."
      : "Two wordmark files per background: live text for pages that load <code>fonts.css</code>, outlined for images, documents, email and print. The monogram is the favicon and app icon."
  }</p>
<div class="specimen-columns">
${brandTiles(theme)}
<div class="specimen-brand-tile"><img class="mq-monogram" src="brand/monogram.svg" alt="MedQuantis monogram"><span>monogram.svg</span></div>
</div>
</section>

<section class="specimen-section" id="slide" aria-labelledby="slide-title">
<div class="mq-wrap"><h2 class="mq-title" id="slide-title">Slide</h2>
<p class="mq-prose">The 1280 x 720 canvas of <code>css/slide.css</code>, shown at full size; in print each slide is a page of its own.</p></div>
<div class="specimen-wide">
<section class="mq-slide" aria-label="Slide example">
<p class="mq-slide-label">Marché fictif</p>
<h3 class="mq-slide-title">${escape(lead.name)} détient ${formatPercent(lead.share)} des primes</h3>
<div class="mq-slide-body specimen-slide-body">
${chart(insurers)}
${kpiTile(kpis[0], "is-navy")}
</div>
<footer class="mq-slide-foot"><p>${LEGAL}</p><p class="mq-slide-number">03</p></footer>
</section>
</div>
</section>

<section class="specimen-section" id="print" aria-labelledby="print-title">
<div class="mq-wrap"><h2 class="mq-title" id="print-title">A4 page</h2>
<p class="mq-prose">One <code>mq-page</code> per sheet of <code>css/print.css</code>, on the desk colour that never reaches paper.</p></div>
<div class="mq-desk">
<article class="mq-page" aria-label="A4 page example">
<p class="mq-eyebrow">Rapport de marché · édition fictive</p>
<h3 class="mq-title">Primes par assureur</h3>
<p class="mq-lead">Comment se répartissent les primes entre les assureurs d'un marché inventé ?</p>
<p class="mq-prose">${escape(lead.name)} encaisse ${formatChf(lead.premium)}, soit ${formatPercent(lead.share)} du total. Les quatre suivants se partagent le reste.</p>
${insurerTable(insurers)}
<p class="mq-takeaway">Deux assureurs concentrent ${formatPercent(insurers[0].share + insurers[1].share)} des primes.</p>
<p class="mq-foot">${FOOT}</p>
</article>
</div>
</section>

<section class="mq-wrap specimen-section" id="focus" aria-labelledby="focus-title">
<h2 class="mq-title" id="focus-title">Focus</h2>
<p class="mq-prose">Keyboard focus draws a 2 px ring with a 2 px offset: ${dark ? "the light navy on the dark canvas" : "navy on light backgrounds"}, for instance on <a id="focus-light" href="#colour">this link to the colours</a>, and white inside a navy panel.</p>
<div class="mq-panel"><p class="mq-panel-text" style="margin: 0">On navy, the ring turns white, as on <a id="focus-navy" href="#brand">this link to the brand</a>.</p></div>
</section>

<section class="mq-wrap specimen-section" id="app-status" aria-labelledby="app-status-title">
<h2 class="mq-title" id="app-status-title">App status layer · apps only</h2>
<p class="mq-prose"><code>css/app.css</code> is for interactive apps only, for genuine system status, always with an icon or a word. Documents never load it (ADR-0004). Warning text, icons and borders use <code>--mq-warning</code>; the warning fill always carries ${dark ? "<code>--mq-on-warning-fill</code> text, near-black on dark (ADR-0007)" : "ink text (owner ruling 5)"}.</p>
<div class="specimen-row">
<span class="mq-status is-success">${icon(icons.CircleCheck, { className: "mq-status-icon" })}Enregistré</span>
<span class="mq-status is-info">${icon(icons.Info, { className: "mq-status-icon" })}Information</span>
<span class="mq-status is-warning">${icon(icons.TriangleAlert, { className: "mq-status-icon" })}À vérifier</span>
<span class="mq-status is-warning is-filled">${icon(icons.TriangleAlert, { className: "mq-status-icon" })}Échéance proche</span>
<span class="mq-status is-danger">${icon(icons.CircleX, { className: "mq-status-icon" })}Erreur</span>
</div>
<h3 class="mq-subtitle specimen-sub">Status colours</h3>
${swatches(tokens, "status", themeTokens)}
<h3 class="mq-subtitle specimen-sub">Status pairings</h3>
${contrastTable(statusPairs, tokens, "App status pairings", themeTokens)}
</section>

</main>
<footer class="mq-wrap specimen-footer">
<p class="mq-foot">${FOOT} Generated from @medquantis/design-system ${escape(version)}; thresholds ${Object.entries(THRESHOLDS)
    .filter(([, value]) => value > 0)
    .map(([use, value]) => `${use} ${value}:1`)
    .join(", ")}.</p>
</footer>
</body>
</html>
`;
}

export async function buildSpecimen(out = join(root, "dist/specimen")) {
  const tokensPath = join(root, "dist/tokens.json");
  const darkPath = join(root, "dist/themes/dark.json");
  for (const path of [tokensPath, darkPath]) {
    if (!existsSync(path)) throw new Error(`${path} is missing: run make build first`);
  }
  const tokens = JSON.parse(readFileSync(tokensPath, "utf8"));
  const themes = { light: {}, dark: JSON.parse(readFileSync(darkPath, "utf8")) };
  const pairs = loadPairs(join(root, "tokens/contrast-pairs.json"));
  const examples = JSON.parse(readFileSync(join(root, "examples/specimen.json"), "utf8"));
  const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const icons = await import("lucide");

  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, "themes"), { recursive: true });
  for (const dir of ["css", "fonts", "brand"]) cpSync(join(root, dir), join(out, dir), { recursive: true });
  cpSync(join(root, "dist/tokens.css"), join(out, "tokens.css"));
  cpSync(join(root, "dist/themes/dark.css"), join(out, "themes/dark.css"));
  cpSync(join(root, "scripts/specimen.css"), join(out, "specimen.css"));
  for (const { file, theme } of PAGES) {
    writeFileSync(join(out, file), renderSpecimen({ tokens, pairs, examples, version, icons, theme, themeTokens: themes[theme] }));
  }
  return PAGES.map(({ file }) => file);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const files = await buildSpecimen();
    console.log(`dist/specimen/ written: ${files.join(", ")}`);
  } catch (error) {
    console.error(error.message);
    process.exit(2);
  }
}
