import { defineConfig } from "@playwright/test";

// The browser is Playwright's own Chromium headless shell, pinned by the exact @playwright/test
// version (make browsers), so local runs and CI render with the same build. One worker: the
// suite is small and the machines it runs on are shared.
export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  // CI never writes a baseline; a missing one fails. Locally a missing baseline is written once.
  updateSnapshots: process.env.CI ? "none" : "missing",
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      // Absorbs anti-aliasing noise between hosts; a changed colour, size or layout exceeds it.
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    browserName: "chromium",
    headless: true,
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
    launchOptions: {
      // Hinting follows the host's font configuration; switching it off keeps glyph outlines
      // identical between this machine and the CI runner.
      args: ["--font-render-hinting=none"],
    },
  },
});
