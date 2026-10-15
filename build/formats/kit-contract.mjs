// dist/kit-contract.css: the homemade-claude-kit token contract filled from the kit tier
// (tokens/kit/), whose tokens alias semantic tokens. Values are literal because kit renderers
// read some of them as hex (the release-note chart) and fall back to their own defaults on var().
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { LICENCE_BANNER } from "../licence-banner.mjs";

// The 24 roles of the old contract are the kit tier's core module (tokens/kit/, kit.core), less the
// roles contract 2.0.0 added to core, which the old renderers do not know.
const ADDED_IN_2_0 = ["tertiary"];
const isKit = (token) => token.path[0] === "kit" && token.path[1] === "core" && !ADDED_IN_2_0.includes(token.path.at(-1));

// Kit renderers inline this file into the HTML they write elsewhere and ignore @import, so a
// relative url() would resolve against the output, not against fonts/. The faces travel as
// base64 data instead: the latin subset of each variable family (every weight the renderers
// ask for, French, German and Italian included), roman, plus the Newsreader italic so the
// renderers' italic body text is drawn rather than synthesised.
const FONTS_DIR = new URL("../../fonts/", import.meta.url);
const EMBEDDED = /-latin-wght-normal\.woff2$|^\.\/newsreader\/newsreader-latin-wght-italic\.woff2$/;

export const embeddedFontFaces = () =>
  [...readFileSync(new URL("fonts.css", FONTS_DIR), "utf8").matchAll(/@font-face\s*\{[^}]*\}/g)]
    .map(([rule]) => rule)
    .filter((rule) => EMBEDDED.test(rule.match(/url\(([^)]+)\)/)[1]))
    .map((rule) =>
      rule.replace(/url\(([^)]+)\) format\('woff2'\)/, (_, path) => {
        const data = readFileSync(fileURLToPath(new URL(path, FONTS_DIR))).toString("base64");
        return `url(data:font/woff2;base64,${data}) format('woff2')`;
      }),
    );

export const kitContractFormat = ({ dictionary }) => {
  const lines = dictionary.allTokens.filter(isKit).map((token) => `  --${token.path.at(-1)}: ${token.$value};`);
  return [
    LICENCE_BANNER,
    "/*",
    " * MedQuantis values for the homemade-claude-kit token contract (delivery-comms 1.3.0),",
    " * generated from tokens/ by the design-system build. Do not edit.",
    " *",
    " * For kit renderers only: deploy it as docs/ux/tokens.css, the only path they read.",
    " * It must never be loaded in an app: its unprefixed names collide with Tailwind theme",
    " * variables and component-library variables. Apps use tokens.css and tailwind.css.",
    " *",
    " * The @font-face rules at the end embed the latin subset of Outfit, Newsreader and Geist Mono",
    " * (SIL Open Font License 1.1) as data, because kit renderers inline this file elsewhere.",
    " */",
    ":root {",
    ...lines,
    "}",
    "",
    ...embeddedFontFaces().flatMap((rule) => [rule, ""]),
  ].join("\n");
};
