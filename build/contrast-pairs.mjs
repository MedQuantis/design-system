// Contrast allow-list: every foreground and background pairing the design system uses is
// declared in tokens/contrast-pairs.json with its use, and checked with the WCAG 2.x formula.
import { readFileSync } from "node:fs";
import { composite, contrastRatio, parseColor } from "./color-math.mjs";

// WCAG 2.2: 1.4.3 text and large text, 1.4.11 non-text. Decorative marks (hairline rules,
// background tints behind an icon) carry no information and have no minimum, but must still
// be declared so every pairing is a deliberate choice.
export const THRESHOLDS = { text: 4.5, large: 3, "non-text": 3, decorative: 0 };

const DEFAULT_BACKGROUNDS = [["--mq-canvas"], ["--mq-surface"]];

// Every pair is checked in both themes (ADR-0007) unless it names the ones it applies to, with a
// note giving the rule that keeps it out of the others.
export const THEMES = ["light", "dark"];

export function loadPairs(file) {
  const { pairs } = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(pairs)) throw new Error(`${file}: "pairs" must be an array`);
  return pairs.map((pair, index) => {
    const where = `${file}: pair ${index + 1}`;
    if (typeof pair.fg !== "string" || !pair.fg.startsWith("--mq-")) throw new Error(`${where}: fg must be an --mq- name`);
    const bg = [pair.bg].flat();
    if (bg.length === 0 || bg.some((name) => typeof name !== "string" || !name.startsWith("--mq-"))) {
      throw new Error(`${where}: bg must be an --mq- name or a list of them, top layer first`);
    }
    if (!(pair.use in THRESHOLDS)) throw new Error(`${where}: use must be one of ${Object.keys(THRESHOLDS).join(", ")}`);
    if (pair.use === "decorative" && !pair.note) throw new Error(`${where}: a decorative pair needs a note`);
    const themes = pair.themes ?? THEMES;
    if (!Array.isArray(themes) || themes.length === 0 || themes.some((theme) => !THEMES.includes(theme))) {
      throw new Error(`${where}: themes must list some of ${THEMES.join(", ")}`);
    }
    if (pair.themes && !pair.note) throw new Error(`${where}: a pair kept out of a theme needs a note`);
    return { ...pair, bg, themes };
  });
}

// A theme is a map of the roles it re-values (dist/themes/<theme>.json), read over the light tokens.
const resolve = (name, tokens, theme = {}) => {
  const token = theme[name] ?? tokens[name];
  if (!token) throw new Error(`${name} is not a built token`);
  return token.value;
};

// Layers are listed top first; the bottom one must be opaque.
export function flatten(layers, tokens, theme = {}) {
  const colors = layers.map((name) => resolve(name, tokens, theme)).reverse();
  return colors.slice(1).reduce((below, above) => composite(above, below), parseColor(colors[0]));
}

// A translucent bottom layer (a tint of the dark theme) is laid over the canvas and over the
// surface, the page backgrounds it sits on, and the worst result counts.
export function evaluatePair(pair, tokens, theme = {}) {
  const fg = resolve(pair.fg, tokens, theme);
  const layers = [pair.bg].flat();
  const opaque = parseColor(resolve(layers.at(-1), tokens, theme)).a === 1;
  const stacks = opaque ? [layers] : DEFAULT_BACKGROUNDS.map((page) => [...layers, ...page]);
  const ratio = Math.min(...stacks.map((stack) => contrastRatio(fg, flatten(stack, tokens, theme))));
  const required = THRESHOLDS[pair.use];
  return { ratio, required, pass: ratio >= required };
}

const sameLayers = (a, b) => a.length === b.length && a.every((name, i) => name === b[i]);

// A text pairing must be declared as text or large text; a non-text one may be declared with
// any use, since every threshold is at least as strict as none.
export function isDeclared(pairs, { fg, bg, use }) {
  return pairs.some(
    (pair) => pair.fg === fg && sameLayers(pair.bg, bg) && (use !== "text" || pair.use === "text" || pair.use === "large"),
  );
}

const TOKENS = /var\(\s*(--mq-[\w-]+)/g;
const NON_TEXT = /^(border(-[a-z]+)*|outline(-color)?|fill|stroke|text-decoration(-color)?|column-rule(-color)?)$/;
const BACKGROUND = /^background(-color)?$/;
const ANNOTATION = /\/\*\s*mq-bg:\s*((?:--mq-[\w-]+\s*)+)\*\//;

// Pairings are read per innermost rule block. A block without its own background is checked
// against canvas and surface, unless a `/* mq-bg: --mq-x [--mq-y] */` comment names the
// background it sits on (layers top first), as for text inside a navy panel. With a set of
// colour token names, the first colour token of a value is used, so a border shorthand that
// names its width token first is still read by its colour.
export function findCssPairings(css, colours = null) {
  const firstColour = (value) => [...value.matchAll(TOKENS)].map((m) => m[1]).find((name) => !colours || colours.has(name));
  const pairings = [];
  for (const [, selectorText, body] of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    const selector = selectorText.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const annotation = body.match(ANNOTATION);
    const declarations = body
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split(";")
      .map((line) => line.split(":"))
      .filter((parts) => parts.length >= 2)
      .map(([property, ...rest]) => [property.trim().toLowerCase(), rest.join(":").trim()]);
    let backgrounds = annotation ? [annotation[1].trim().split(/\s+/)] : null;
    const foregrounds = [];
    for (const [property, value] of declarations) {
      const token = firstColour(value);
      if (!token) continue;
      if (BACKGROUND.test(property)) {
        if (!annotation) backgrounds = [[token]];
      } else if (property === "color") {
        foregrounds.push({ fg: token, use: "text" });
      } else if (NON_TEXT.test(property)) {
        foregrounds.push({ fg: token, use: "non-text" });
      }
    }
    for (const { fg, use } of foregrounds) {
      for (const bg of backgrounds ?? DEFAULT_BACKGROUNDS) pairings.push({ fg, bg, use, selector });
    }
  }
  return pairings;
}

export const undeclaredPairings = (pairings, pairs) => pairings.filter((pairing) => !isDeclared(pairs, pairing));
