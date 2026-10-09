import { test } from "node:test";
import assert from "node:assert/strict";

// Imported per test so a missing helper fails each case by name.
const load = () => import("../../build/color-math.mjs");

const close = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} is not within ${tolerance} of ${expected}`);

test("parseColor reads hex, short hex, hex with alpha and rgba()", async () => {
  const { parseColor } = await load();
  assert.deepEqual(parseColor("#0a2463"), { r: 10 / 255, g: 36 / 255, b: 99 / 255, a: 1 });
  assert.deepEqual(parseColor("#fff"), { r: 1, g: 1, b: 1, a: 1 });
  close(parseColor("#ffffffad").a, 0.678, 0.001, "hex8 alpha");
  assert.deepEqual(parseColor("rgba(255, 255, 255, 0.68)"), { r: 1, g: 1, b: 1, a: 0.68 });
  assert.throws(() => parseColor("navy"), /unsupported colour/i);
});

test("WCAG 2.x contrast ratio matches reference values", async () => {
  const { contrastRatio } = await load();
  close(contrastRatio("#000000", "#ffffff"), 21, 1e-9, "black on white");
  close(contrastRatio("#ffffff", "#ffffff"), 1, 1e-9, "white on white");
  close(contrastRatio("#777777", "#ffffff"), 4.48, 0.005, "#777 on white");
  close(contrastRatio("#707070", "#fafaf8"), 4.74, 0.005, "tertiary on canvas (owner ruling 1)");
  close(contrastRatio("#1a1a1a", "#d4850a"), 5.93, 0.005, "ink on warning fill (owner ruling 5)");
});

test("a translucent foreground is composited over the background before measuring", async () => {
  const { contrastRatio, composite } = await load();
  const over = composite("rgba(255, 255, 255, 0.5)", "#000000");
  close(over.r, 0.5, 0.003, "50 % white over black");
  assert.equal(over.a, 1);
  close(contrastRatio("rgba(255, 255, 255, 0.68)", "#0a2463"), 7.40, 0.01, "white 68 % on navy");
  assert.throws(() => contrastRatio("#000000", "rgba(0, 0, 0, 0.5)"), /opaque/i);
});

test("CIEDE2000 matches Sharma, Wu and Dalal (2005) test pairs", async () => {
  const { deltaE2000 } = await load();
  close(deltaE2000([50, 2.6772, -79.7751], [50, 0, -82.7485]), 2.0425, 1e-4, "pair 1");
  close(deltaE2000([50, 0, 0], [50, -1, 2]), 2.3669, 1e-4, "pair 7");
  close(deltaE2000([50, 2.5, 0], [73, 25, -18]), 27.1492, 1e-4, "pair 17");
  close(deltaE2000([2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514]), 0.9082, 1e-4, "pair 34");
});

test("sRGB to CIELAB (D65) matches reference values", async () => {
  const { toLab } = await load();
  const white = toLab("#ffffff");
  close(white[0], 100, 0.01, "white L");
  close(white[1], 0, 0.01, "white a");
  close(white[2], 0, 0.01, "white b");
  const red = toLab("#ff0000");
  close(red[0], 53.24, 0.05, "red L");
  close(red[1], 80.09, 0.1, "red a");
  close(red[2], 67.2, 0.1, "red b");
});

test("CVD simulation keeps neutrals and collapses the red-green axis for protanopia and deuteranopia", async () => {
  const { simulateCvd, toLab, deltaE2000 } = await load();
  for (const kind of ["protanopia", "deuteranopia", "tritanopia", "achromatopsia"]) {
    const white = simulateCvd("#ffffff", kind);
    for (const channel of ["r", "g", "b"]) close(white[channel], 1, 0.002, `${kind} white ${channel}`);
  }
  assert.throws(() => simulateCvd("#ffffff", "unknown"), /unknown cvd kind/i);
  const redGreen = (kind) => deltaE2000(toLab(simulateCvd("#d8232a", kind)), toLab(simulateCvd("#2e7d32", kind)));
  const normal = deltaE2000(toLab("#d8232a"), toLab("#2e7d32"));
  for (const kind of ["protanopia", "deuteranopia"]) {
    assert.ok(redGreen(kind) < normal / 2, `${kind} keeps red and green apart (${redGreen(kind)} vs ${normal})`);
  }
  const grey = simulateCvd("#d8232a", "achromatopsia");
  close(grey.r, grey.g, 1e-9, "achromatopsia is grey");
});

test("minimum pairwise distance reports the closest pair under each simulation", async () => {
  const { minPairwiseDistance } = await load();
  const result = minPairwiseDistance(["#000000", "#808080", "#7f7f7f"], "normal");
  assert.deepEqual(result.pair, ["#808080", "#7f7f7f"]);
  assert.ok(result.distance < 1);
});
