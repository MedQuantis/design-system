// The kit class modules (Plan-0002 increment 02, the dark module and the classification cell of
// Plan-0003 increment 04) on static copies of the markup the
// homemade-claude-kit renderers emit (tests/e2e/fixtures/, taken from the make kit-check renders of
// tests/fixtures/kit-render/), loading dist/kit/*.css, so these baselines need no kit checkout.
import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const fixture = (name) => pathToFileURL(join(root, "tests/e2e/fixtures", name)).href;

// The slide frame of owner ruling 11: 72 px side margins (guidelines/layout.md, Media).
const SIDE = 72;
const TERTIARY = "rgb(112, 112, 112)"; // #707070, the tertiary grey (owner rulings 1 and 11)
const CANVAS = "rgb(250, 250, 248)";
const ACCENT = "rgb(10, 36, 99)"; // #0a2463, navy

// The red, green and blue channels (0 to 255) of a computed colour, rgb()/rgba() or color(srgb ...),
// ignoring its alpha: a color-mix of the accent with transparent keeps the accent's channels.
const channels = (value) => {
  const srgb = value.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/);
  if (srgb) return srgb.slice(1, 4).map((channel) => Math.round(Number(channel) * 255));
  const rgb = value.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return rgb ? rgb.slice(1, 4).map(Number) : value;
};

let external;

test.beforeEach(async ({ page }) => {
  external = [];
  // Only local files and data URIs may load; anything else is aborted and recorded.
  await page.context().route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith("file:") || url.startsWith("data:")) return route.continue();
    external.push(url);
    return route.abort("blockedbyclient");
  });
});

const open = async (page, name) => {
  await page.goto(fixture(name));
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family.replace(/["']/g, "")),
  );
  return new Set(loaded);
};

// The dark slide of contract 2.1.0 (Plan-0003 increment 04): the kit remaps every mirrored role to
// its --dark- twin on .slide.dark and draws the key element from --dark-key-fill and --dark-key-edge.
const DARK_CANVAS = "rgb(17, 22, 31)"; // #11161f, the dark canvas (ADR-0007)
const DARK_INK = "rgb(245, 244, 241)"; // #f5f4f1, warm white
const DARK_TERTIARY = "rgb(143, 152, 170)"; // #8f98aa
const KEY_FILL = "linear-gradient(160deg, rgb(47, 76, 143) 0%, rgb(15, 42, 94) 100%)"; // the dark panel gradient
const KEY_EDGE = "rgba(159, 179, 232, 0.35) 0px 0px 0px 1px"; // the 1 px light-navy outline, no glow (owner ruling 13)

// The footer row of owner rulings 11 and 17: legal line bottom left, then the classification in the
// deck's language and the number at the right, in tertiary Geist Mono.
const checkFrame = async (slide, tertiary) => {
  const frame = await slide.boundingBox();
  expect(frame.width).toBe(1280);
  expect(frame.height).toBe(720);
  const legal = await slide.locator(".slide-legal").boundingBox();
  const level = await slide.locator(".slide-classification").boundingBox();
  const number = await slide.locator(".slide-number").boundingBox();
  expect(Math.abs(legal.x - (frame.x + SIDE)), "legal line at the left margin").toBeLessThanOrEqual(1);
  expect(Math.abs(number.x + number.width - (frame.x + frame.width - SIDE)), "number at the right margin").toBeLessThanOrEqual(1);
  expect(level.x + level.width, "the classification before the number").toBeLessThanOrEqual(number.x);
  expect(level.x, "the classification at the right of the footer").toBeGreaterThan(frame.x + frame.width / 2);
  for (const box of [legal, level, number]) expect(box.y, "in the footer row").toBeGreaterThan(frame.y + frame.height - SIDE);
  await expect(slide.locator(".slide-classification"), "the label in the deck's language (lang: fr)").toHaveText("Confidentiel");
  await expect(slide.locator(".slide-classification"), "the label as written, as the legal line").toHaveCSS("text-transform", "none");
  await expect(slide.locator(".slide-logo"), "MedQuantis slides carry no logo in the footer row").toBeHidden();
  for (const cell of [".slide-legal", ".slide-classification", ".slide-number"]) {
    await expect(slide.locator(cell)).toHaveCSS("color", tertiary);
    await expect(slide.locator(cell)).toHaveCSS("font-family", /Geist Mono/);
  }
  await expect(slide.locator(".slide-label")).toHaveCSS("text-transform", "uppercase");
};

test("kit deck: the slide frame puts the legal line bottom left, the classification and the number bottom right", async ({ page }) => {
  const fonts = await open(page, "kit-deck.html");
  expect(fonts.has("Geist Mono"), "Geist Mono from dist/kit/core.css").toBe(true);
  await expect(page.locator(".slide")).toHaveCount(3);
  const slides = page.locator(".slide:not(.dark)");
  await expect(slides).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    const slide = slides.nth(index);
    await checkFrame(slide, TERTIARY);
    await expect(slide).toHaveCSS("background-color", CANVAS);
    await expect(slide).toHaveScreenshot(`kit-slide-${index + 1}.png`);
  }
  await expect(page.locator(".slide-source-bar")).toHaveCSS("font-style", "italic");
  expect(external).toEqual([]);
});

test("kit deck: a dark slide reads the dark roles, its key element the panel gradient and outline", async ({ page }) => {
  await open(page, "kit-deck.html");
  const slide = page.locator(".slide.dark");
  await expect(slide).toHaveCount(1);
  await checkFrame(slide, DARK_TERTIARY);
  await expect(slide).toHaveCSS("background-color", DARK_CANVAS);
  await expect(slide).toHaveCSS("color", DARK_INK);
  await expect(slide.locator(".deck-title")).toHaveCSS("color", DARK_INK);
  const key = slide.locator(".dark-key");
  await expect(key).toHaveCount(1);
  await expect(key).toHaveCSS("background-image", KEY_FILL);
  await expect(key).toHaveCSS("box-shadow", KEY_EDGE);
  await expect(key).toHaveCSS("color", DARK_INK);
  await expect(slide).toHaveScreenshot("kit-slide-dark.png");
  expect(external).toEqual([]);
});

test("kit document: an A4 sheet on the canvas colour, Newsreader body, Outfit 500 headings", async ({ page }) => {
  const fonts = await open(page, "kit-document.html");
  for (const family of ["Outfit", "Newsreader", "Geist Mono"]) expect(fonts.has(family), `${family} is not loaded`).toBe(true);
  const sheet = page.locator(".doc");
  await expect(sheet).toHaveCSS("background-color", CANVAS);
  await expect(sheet).toHaveCSS("font-family", /Newsreader/);
  for (const heading of ["h1", "h2"]) {
    await expect(sheet.locator(heading).first()).toHaveCSS("font-family", /Outfit/);
    await expect(sheet.locator(heading).first()).toHaveCSS("font-weight", "500");
  }
  await expect(sheet.locator(".doc-label").first()).toHaveCSS("text-transform", "uppercase");
  await expect(sheet.locator(".doc-section--flow")).toHaveCSS("border-top-style", "solid");
  await expect(sheet).toHaveScreenshot("kit-document.png");
  expect(external).toEqual([]);
});

test("kit report: the release-note report in the MedQuantis print module", async ({ page }) => {
  const fonts = await open(page, "kit-report.html");
  expect(fonts.has("Outfit"), "Outfit from dist/kit/core.css").toBe(true);
  const report = page.locator(".report");
  await expect(report).toHaveCSS("background-color", CANVAS);
  await expect(report.locator(".report-title")).toHaveCSS("font-family", /Outfit/);
  await expect(report.locator(".report-title")).toHaveCSS("font-weight", "500");
  for (const label of await report.locator(".section-label").all()) await expect(label).toHaveCSS("font-weight", "500");
  // Documents are navy only (ADR-0004): the breaking-changes label and panel are drawn from the
  // accent (--print-breaking), never a status hue.
  await expect(report.locator(".section--breaking .section-label")).toHaveCSS("color", ACCENT);
  const panel = await report.locator(".breaking").evaluate((element) => {
    const style = getComputedStyle(element);
    return { border: style.borderTopColor, background: style.backgroundColor };
  });
  for (const [part, value] of Object.entries(panel)) {
    expect(channels(value), `.breaking ${part} ${value} is drawn from the accent`).toEqual([10, 36, 99]);
  }
  // Owner ruling 3: no pill; the kit's --radius-pill is the 6 px maximum.
  await expect(report.locator(".product-id").first()).toHaveCSS("border-radius", "6px");
  await expect(report).toHaveScreenshot("kit-report.png");
  expect(external).toEqual([]);
});
