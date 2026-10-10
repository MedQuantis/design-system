// Copies the built tokens, the shared CSS, the fonts and the wordmark and monogram files into the
// Claude skill's assets/, because an installed plugin (or a skill uploaded to claude.ai) cannot
// reach dist/. The copy is committed; skill.test.mjs fails when it differs from a fresh build.
import { copyFileSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SKILL_DIR } from "./build-skill.mjs";

const ASSETS = `${SKILL_DIR}/assets`;
const CSS = ["base.css", "components.css", "slide.css", "print.css", "app.css"];
const BRAND = ["wordmark-on-light.svg", "wordmark-on-navy.svg", "wordmark-on-light-print.svg", "wordmark-on-navy-print.svg", "monogram.svg"];

export const assetPairs = (root) => {
  const fonts = readdirSync(join(root, "fonts"), { recursive: true })
    .filter((entry) => /\.(woff2|css)$|OFL\.txt$/.test(entry))
    .sort()
    .map((entry) => ({ from: `fonts/${entry}`, to: `${ASSETS}/fonts/${entry}` }));
  return [
    ...["tokens.css", "tokens.json", "kit-contract.css"].map((name) => ({ from: `dist/${name}`, to: `${ASSETS}/${name}` })),
    ...CSS.map((name) => ({ from: `css/${name}`, to: `${ASSETS}/css/${name}` })),
    ...fonts,
    ...BRAND.map((name) => ({ from: `brand/${name}`, to: `${ASSETS}/brand/${name}` })),
    // The licence split of the root LICENSE applies to the skill too: brand files and guideline
    // text are all rights reserved, the rest MIT, the fonts OFL.
    { from: "LICENSE", to: `${SKILL_DIR}/LICENSE.txt` },
  ];
};

export const syncSkillAssets = (root) => {
  rmSync(join(root, ASSETS), { recursive: true, force: true });
  for (const { from, to } of assetPairs(root)) {
    mkdirSync(dirname(join(root, to)), { recursive: true });
    copyFileSync(join(root, from), join(root, to));
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncSkillAssets(fileURLToPath(new URL("..", import.meta.url)));
}
