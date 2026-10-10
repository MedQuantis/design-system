import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import postcss from "postcss";
import { evaluatePair, loadPairs } from "../../build/contrast-pairs.mjs";

const root = fileURLToPath(new URL("../..", import.meta.url));
const specimenUrl = pathToFileURL(join(root, "dist/specimen/index.html")).href;
const tokens = () => JSON.parse(readFileSync(join(root, "dist/tokens.json"), "utf8"));
const CSS_FILES = ["base.css", "components.css", "slide.css", "print.css", "app.css"];
const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"];

// Splits a selector list on top-level commas only.
const selectorList = (selector) => {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const char of selector) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else current += char;
  }
  return [...parts, current.trim()];
};

// Every selector of the shared CSS, unwrapped from :where(); a :focus-visible state is
// matched by any focusable element in its scope, since nothing is focused at load.
const cssSelectors = () =>
  CSS_FILES.flatMap((file) => {
    const found = [];
    postcss.parse(readFileSync(join(root, "css", file), "utf8")).walkRules((rule) => {
      for (const selector of selectorList(rule.selector)) {
        const inner = selector.replace(/^:where\(([\s\S]*)\)$/, "$1");
        for (const part of selectorList(inner)) found.push({ file, selector: part.replace(/:focus-visible/g, ":is(a[href], button)") });
      }
    });
    return found;
  });

let external;

test.beforeEach(async ({ page }) => {
  external = [];
  // Only the specimen folder may be read; anything else is routed to a failure and recorded.
  await page.context().route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("file:") || url.startsWith("data:")) return route.continue();
    external.push(url);
    return route.abort("blockedbyclient");
  });
  page.on("request", (request) => {
    const url = request.url();
    if (!url.startsWith("file:") && !url.startsWith("data:") && !external.includes(url)) external.push(url);
  });
  await page.goto(specimenUrl);
  await page.evaluate(() => document.fonts.ready);
});

test("the specimen loads its fonts from its own folder and requests nothing outside it", async ({ page }) => {
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family.replace(/["']/g, ""));
  });
  for (const family of ["Outfit", "Newsreader", "Geist Mono"]) expect(loaded, `${family} is not loaded`).toContain(family);
  expect(external).toEqual([]);
});

test("every selector of css/ matches an element of the specimen", async ({ page }) => {
  const missing = [];
  for (const { file, selector } of cssSelectors()) {
    if ((await page.locator(selector).count()) === 0) missing.push(`${file}: ${selector}`);
  }
  expect(missing).toEqual([]);
});

test("swatches show every semantic colour token and the contrast table every declared pair", async ({ page }) => {
  const built = tokens();
  const colours = Object.entries(built).filter(([name, token]) => token.type === "color" && !name.startsWith("--mq-core-") && !token.deprecated);
  for (const [name, token] of colours) {
    const swatch = page.locator(`[data-swatch="${name}"]`);
    await expect(swatch, `${name} has no swatch`).toHaveCount(1);
    await expect(swatch).toContainText(String(token.value));
  }
  const pairs = loadPairs(join(root, "tokens/contrast-pairs.json"));
  for (const pair of pairs) {
    const key = `${pair.fg} on ${pair.bg.join(" ")}`;
    const row = page.locator(`[data-pair="${key}"]`);
    await expect(row, `${key} is not in the contrast table`).toHaveCount(1);
    const { ratio } = evaluatePair(pair, built);
    await expect(row).toContainText(`${ratio.toFixed(2)}:1`);
    await expect(row).toContainText(pair.use);
  }
});

test("type scale, radii, slide frame and A4 page have their token sizes", async ({ page }) => {
  const built = tokens();
  for (const [name, token] of Object.entries(built)) {
    if (!name.startsWith("--mq-font-size-")) continue;
    const sample = page.locator(`[data-type-sample="${name}"]`);
    await expect(sample, `${name} has no type sample`).toHaveCount(1);
    await expect(sample).toHaveCSS("font-size", token.value);
  }
  for (const [name, px] of [["small", "3px"], ["medium", "6px"], ["overlay", "12px"]]) {
    const sample = page.locator(`[data-radius="--mq-radius-${name}"]`);
    await expect(sample).toHaveCSS("border-top-left-radius", px);
  }
  await expect(page.locator('[data-radius="--mq-radius-overlay"]')).toContainText("apps, overlays only");
  const slide = await page.locator("#slide .mq-slide").boundingBox();
  expect([slide.width, slide.height]).toEqual([1280, 720]);
  const a4 = await page.locator("#print .mq-page").boundingBox();
  expect(Math.round(a4.width)).toBe(794);
  expect(Math.round(a4.height)).toBeGreaterThanOrEqual(1123);
});

test("the app status layer is labelled apps only and holds every status badge", async ({ page }) => {
  const section = page.locator("#app-status");
  await expect(section.locator("h2")).toContainText("apps only");
  await expect(section.locator(".mq-status")).toHaveCount(await page.locator(".mq-status").count());
  for (const status of ["success", "warning", "danger", "info"]) await expect(section.locator(`.mq-status.is-${status}`).first()).toBeVisible();
  await expect(page.locator(".mq-status").first()).toBeVisible();
});

test("brand: both wordmark files on light and on navy, and the monogram", async ({ page }) => {
  for (const background of ["on-light", "on-navy"]) {
    const live = page.locator(`[data-brand="wordmark-${background}.svg"] svg text`);
    await expect(live, `wordmark-${background}.svg live text`).toHaveCount(1);
    const outlined = page.locator(`img[src="brand/wordmark-${background}-print.svg"]`);
    await expect(outlined).toHaveCount(1);
    expect(await outlined.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  }
  const monogram = page.locator('img[src="brand/monogram.svg"]');
  await expect(monogram).toHaveCount(1);
  expect(await monogram.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
});

test("figures follow owner ruling 8 and are marked illustrative", async ({ page }) => {
  const text = await page.locator("body").evaluate((body) => body.textContent);
  expect(text).toMatch(/CHF \d{1,3}(?:'\d{3})+/);
  expect(text).not.toMatch(/CHF \d/);
  // Amended ruling 8: the space before % is non-breaking, like the one after CHF.
  expect(text).toMatch(/\d\u00a0%/);
  expect(text).not.toMatch(/\d[ ]?%/);
  expect(text).not.toMatch(/’|\d,\d{3}/);
  await expect(page.locator(".mq-foot").first()).toContainText(/illustrative/i);
});

test("no serious or critical accessibility violation (axe, WCAG 2.2 AA)", async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const blocking = results.violations
    .filter((violation) => ["serious", "critical"].includes(violation.impact))
    .map((violation) => `${violation.id} (${violation.impact}): ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`);
  expect(blocking).toEqual([]);
});

// One baseline per part of the page, so a change shows up in the section it touches and the
// baselines stay small; the focus section is covered by the two forced focus shots below.
const SCREENSHOT_PARTS = ["header", "colour", "contrast", "type", "shape", "components", "brand", "slide", "print", "app-status", "footer"];
const partLocator = (page, part) => (["header", "footer"].includes(part) ? page.locator(`body > ${part}`) : page.locator(`section#${part}`));

test("every part of the page except the focus section has a screenshot baseline", async ({ page }) => {
  const ids = await page.locator("section.specimen-section").evaluateAll((sections) => sections.map((section) => section.id));
  expect(ids.filter((id) => id !== "focus")).toEqual(SCREENSHOT_PARTS.filter((part) => !["header", "footer"].includes(part)));
});

for (const part of SCREENSHOT_PARTS) {
  test(`screenshot of the ${part} part matches its baseline`, async ({ page }) => {
    const locator = partLocator(page, part);
    await expect(locator).toHaveCount(1);
    await expect(locator).toHaveScreenshot(`part-${part}.png`);
  });
}

test("forced focus state: navy ring on light, white ring on navy", async ({ page }) => {
  const section = page.locator("#focus");
  for (const [target, colour, name] of [
    ["#focus-light", "rgb(10, 36, 99)", "focus-on-light.png"],
    ["#focus-navy", "rgb(255, 255, 255)", "focus-on-navy.png"],
  ]) {
    const link = page.locator(target);
    await link.focus();
    expect(await link.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
    await expect(link).toHaveCSS("outline-color", colour);
    await expect(link).toHaveCSS("outline-width", "2px");
    await expect(link).toHaveCSS("outline-offset", "2px");
    await expect(section).toHaveScreenshot(name);
  }
});

test("PDF export, tagged and with an outline, succeeds", async ({ page }) => {
  const pdf = await page.pdf({ tagged: true, outline: true, printBackground: true, preferCSSPageSize: true });
  expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(pdf.length).toBeGreaterThan(20000);
  expect(external).toEqual([]);
});

test("chart marks take the four series colours and the remainder fill, in order", async ({ page }) => {
  const built = tokens();
  const rgb = (hex) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;
  const expected = [1, 2, 3, 4].map((n) => [`is-${n}`, built[`--mq-chart-series-${n}`].value]).concat([["is-rest", built["--mq-chart-rest"].value]]);
  for (const kind of ["mq-segment", "mq-swatch"]) {
    for (const [modifier, hex] of expected) {
      await expect(page.locator(`#components .${kind}.${modifier}`).first(), `${kind}.${modifier}`).toHaveCSS("background-color", rgb(hex));
    }
  }
});

test("slide footer: legal line bottom left, slide number bottom right, on screen and in print (owner ruling 11)", async ({ page }) => {
  for (const media of ["screen", "print"]) {
    await page.emulateMedia({ media });
    const slide = await page.locator("#slide .mq-slide").boundingBox();
    const foot = page.locator("#slide .mq-slide-foot");
    await expect(foot).toHaveCount(1);
    await expect(foot).toContainText("MedQuantis SA · CH-1095 Lutry · medquantis.ch");
    await expect(foot).toHaveCSS("color", "rgb(112, 112, 112)");
    const legal = await foot.locator(":scope > :first-child").boundingBox();
    const number = await foot.locator(".mq-slide-number").boundingBox();
    expect(Math.round(legal.x - slide.x), `${media}: legal line at the left margin`).toBe(72);
    expect(Math.round(slide.x + slide.width - (number.x + number.width)), `${media}: number at the right margin`).toBe(72);
    for (const box of [legal, number]) {
      expect(box.y + box.height, `${media}: inside the canvas`).toBeLessThanOrEqual(slide.y + slide.height);
      expect(box.y, `${media}: in the bottom band`).toBeGreaterThan(slide.y + slide.height - 72);
    }
    expect(Math.abs(legal.y + legal.height - (number.y + number.height)), `${media}: one row`).toBeLessThanOrEqual(3);
  }
});

test("a column legend beside the ring: items stacked, values right-aligned in Geist Mono, the remainder after a rule", async ({ page }) => {
  const legend = page.locator("#components .mq-legend.is-column");
  await expect(legend).toHaveCount(1);
  const items = await legend.locator(".mq-legend-item").all();
  expect(items.length).toBeGreaterThanOrEqual(3);
  const boxes = await Promise.all(items.map((item) => item.boundingBox()));
  for (let i = 1; i < boxes.length; i += 1) {
    expect(Math.round(boxes[i].x)).toBe(Math.round(boxes[0].x));
    expect(boxes[i].y).toBeGreaterThan(boxes[i - 1].y + boxes[i - 1].height - 1);
  }
  const values = legend.locator(".mq-legend-value");
  await expect(values).toHaveCount(items.length);
  const rights = await values.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().right)));
  expect(new Set(rights).size, "values share one right edge").toBe(1);
  expect(await values.first().evaluate((node) => getComputedStyle(node).fontFamily)).toContain("Geist Mono");
  const rest = legend.locator(".mq-legend-item.is-rest");
  await expect(rest).toHaveCount(1);
  await expect(rest).toHaveCSS("border-top-style", "solid");
  await expect(rest).toHaveCSS("border-top-width", "1px");
  // The ring beside it follows the guideline recipe: arcs on pathLength 100 whose values sum to 100.
  const ring = page.locator("#components .specimen-ring svg");
  await expect(ring).toHaveCount(1);
  const arcs = await ring.locator("circle[data-value]").evaluateAll((nodes) => nodes.map((node) => Number(node.dataset.value)));
  expect(arcs.reduce((sum, value) => sum + value, 0)).toBe(100);
  expect(await ring.locator('circle:not([pathLength="100"])').count()).toBe(0);
});
