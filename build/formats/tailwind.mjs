// dist/tailwind.css: a Tailwind 4 theme generated from the tokens.
// Scales are literal hex in `@theme static` (always emitted, so apps can read them as
// variables). Everything that points at an --mq- token goes in `@theme inline`, so the
// utilities carry var(--mq-*) and a runtime override of the token reaches them.
import { deriveScale } from "../scales.mjs";
import { LICENCE_BANNER } from "../licence-banner.mjs";

const SCALES = [
  ["navy", "accent"],
  ["success", "success"],
  ["warning", "warning"],
  ["danger", "danger"],
  ["info", "info"],
];

const FONTS = [
  ["--font-sans", "mq-font-family-ui"],
  ["--font-serif", "mq-font-family-body"],
  ["--font-mono", "mq-font-family-mono"],
  ["--font-heading", "mq-font-family-heading"],
];

// Every radius step Tailwind 4 defines (xs to 4xl, plus the deprecated bare --radius behind
// `rounded`) is capped by owner ruling 3: 3 px up to sm, 6 px from md. rounded-full stays
// Tailwind's own, for circles; rounded-overlay is the 12 px exception for app overlays.
const RADII = [
  ["--radius", "mq-radius-small"],
  ...["xs", "sm"].map((step) => [`--radius-${step}`, "mq-radius-small"]),
  ...["md", "lg", "xl", "2xl", "3xl", "4xl"].map((step) => [`--radius-${step}`, "mq-radius-medium"]),
  ["--radius-overlay", "mq-radius-overlay"],
];

const isThemeColour = (token) =>
  !token.$deprecated &&
  token.path[0] === "semantic" &&
  ((token.path[1] === "color" && token.path[2] !== "status") || token.path[1] === "chart");

export const tailwindFormat = ({ dictionary }) => {
  const byName = new Map(dictionary.allTokens.map((token) => [token.name, token]));
  const need = (name) => {
    const token = byName.get(name);
    if (!token) throw new Error(`tailwind.css: --${name} is not a token`);
    return token;
  };

  const scaleLines = SCALES.flatMap(([scale, anchor]) =>
    deriveScale(need(`mq-${anchor}`).$value).map(({ step, hex }) => `  --color-${scale}-${step}: ${hex};`),
  );

  const ref = ([key, name]) => `  ${key}: var(--${need(name).name});`;
  const colourLines = dictionary.allTokens
    .filter(isThemeColour)
    .map((token) => `  --color-${token.name.replace(/^mq-/, "")}: var(--${token.name});`);

  return [
    LICENCE_BANNER,
    "/*",
    " * MedQuantis Tailwind 4 theme, generated from tokens/ by the design-system build. Do not edit.",
    " * Import it after Tailwind: @import \"tailwindcss\"; then this file. It loads tokens.css itself.",
    " * Scales (50 to 950) are derived in OKLCH from one token each; step 500 is that token.",
    " */",
    '@import "./tokens.css";',
    "",
    "@theme static {",
    ...scaleLines,
    "}",
    "",
    "@theme inline {",
    ...FONTS.map(ref),
    ...RADII.map(ref),
    ...colourLines,
    "}",
    "",
  ].join("\n");
};
