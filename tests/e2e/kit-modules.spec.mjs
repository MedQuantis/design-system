// The kit class modules (Plan-0002 increment 02) on static copies of the markup the
// homemade-claude-kit renderers emit (tests/e2e/fixtures/, taken from the make kit-check renders of
// tests/fixtures/kit-render/), loading dist/kit/*.css, so these baselines need no kit checkout.
import { test, expect } from "@playwright/test";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));
const fixture = (name) => pathToFileURL(join(root, "tests/e2e/fixtures", name)).href;

// The slide frame of owner ruling 11: 72 px side margins (guidelines/layout.md, Media).
const SIDE = 72;
const MUTED = "rgb(85, 85, 85)";
const CANVAS = "rgb(250, 250, 248)";

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

test("kit deck: the slide frame puts the legal line bottom left and the number bottom right", async ({ page }) => {
  const fonts = await open(page, "kit-deck.html");
  expect(fonts.has("Geist Mono"), "Geist Mono from dist/kit/core.css").toBe(true);
  const slides = page.locator(".slide");
  await expect(slides).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    const slide = slides.nth(index);
    const frame = await slide.boundingBox();
    expect(frame.width).toBe(1280);
    expect(frame.height).toBe(720);
    const legal = await slide.locator(".slide-legal").boundingBox();
    const number = await slide.locator(".slide-number").boundingBox();
    expect(Math.abs(legal.x - (frame.x + SIDE)), "legal line at the left margin").toBeLessThanOrEqual(1);
    expect(Math.abs(number.x + number.width - (frame.x + frame.width - SIDE)), "number at the right margin").toBeLessThanOrEqual(1);
    for (const box of [legal, number]) expect(box.y, "in the footer row").toBeGreaterThan(frame.y + frame.height - SIDE);
    await expect(slide.locator(".slide-logo"), "MedQuantis slides carry no logo in the footer row").toBeHidden();
    for (const cell of [".slide-legal", ".slide-number"]) {
      await expect(slide.locator(cell)).toHaveCSS("color", MUTED);
      await expect(slide.locator(cell)).toHaveCSS("font-family", /Geist Mono/);
    }
    await expect(slide).toHaveCSS("background-color", CANVAS);
    await expect(slide.locator(".slide-label")).toHaveCSS("text-transform", "uppercase");
    await expect(slide).toHaveScreenshot(`kit-slide-${index + 1}.png`);
  }
  await expect(page.locator(".slide-source-bar")).toHaveCSS("font-style", "italic");
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
  // Documents are navy only (ADR-0004): the breaking-changes label is navy, not a status hue.
  await expect(report.locator(".section--breaking .section-label")).toHaveCSS("color", "rgb(10, 36, 99)");
  await expect(report).toHaveScreenshot("kit-report.png");
  expect(external).toEqual([]);
});
