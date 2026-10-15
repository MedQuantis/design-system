// Style Dictionary 5.6.0 build: DTCG sources in tokens/ to dist/tokens.css, dist/tokens.json,
// dist/tailwind.css, dist/kit-contract.css and the kit modules dist/kit/<module>.css.
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import { kitContractFormat } from "./formats/kit-contract.mjs";
import { KIT_TOKEN_MODULES, kitModuleFormat } from "./formats/kit-modules.mjs";
import { legalLine } from "./guidelines.mjs";
import { LICENCE_BANNER } from "./licence-banner.mjs";
import { tailwindFormat } from "./formats/tailwind.mjs";

// Names drop the "semantic" tier and the grouping segments that only organise the source, so
// semantic.color.accent is --mq-accent and semantic.color.status.danger is --mq-danger. Core
// tokens keep their tier (--mq-core-navy) to signal that consumers should use the semantic name.
const DROPPED = (segment, index, path) =>
  (index === 0 && segment === "semantic") ||
  (index === 1 && segment === "color") ||
  (index === 2 && segment === "status" && path[0] === "semantic" && path[1] === "color");

const nameMq = {
  type: "name",
  transform: (token, config) =>
    [config.prefix, ...token.path.filter((segment, index, path) => !DROPPED(segment, index, path))].join("-"),
};

// A flat map keyed by custom property, so scripts and tests read the exact value the CSS ships.
const jsonMq = ({ dictionary }) => {
  const entries = dictionary.allTokens.map((token) => [
    `--${token.name}`,
    {
      value: token.$value,
      type: token.$type,
      path: token.path,
      description: token.$description,
      ...(token.$deprecated ? { deprecated: token.$deprecated } : {}),
    },
  ]);
  return `${JSON.stringify(Object.fromEntries(entries), null, 2)}\n`;
};

// color/css does not reach the colours nested in a shadow; this writes them as 8-bit rgba(),
// the same form tokens.css uses for translucent colours.
const shadowColour = {
  type: "value",
  filter: (token) => token.$type === "shadow",
  transform: (token) =>
    [token.$value].flat().map((layer) => {
      const { components, alpha = 1 } = layer.color;
      const [r, g, b] = components.map((c) => Math.round(c * 255));
      return { ...layer, color: `rgba(${r}, ${g}, ${b}, ${alpha})` };
    }),
};

// A kit token whose text is written once in guidelines/ (the legal line) names its source in
// $extensions instead of carrying a copy; this fills its $value from that source before the build.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const EXTENSION = "com.medquantis.design-system";
const GUIDELINE_TEXT = { "brand.md#Legal line": () => legalLine(ROOT) };

const fromGuidelines = (node) => {
  if (!node || typeof node !== "object") return node;
  const source = node.$extensions?.[EXTENSION]?.fromGuideline;
  if (source) {
    const read = GUIDELINE_TEXT[`${source.file}#${source.section}`];
    if (!read) throw new Error(`no guideline reader for ${source.file}, section ${source.section}`);
    return { ...node, $value: read() };
  }
  return Object.fromEntries(Object.entries(node).map(([key, child]) => [key, key.startsWith("$") ? child : fromGuidelines(child)]));
};

// A string token (the legal line) becomes a CSS string, quoted and escaped.
const cssString = {
  type: "value",
  filter: (token) => token.$type === "string",
  transform: (token) => JSON.stringify(token.$value),
};

// The built-in css/variables output behind the licence banner.
const cssVariables = async (args) => `${LICENCE_BANNER}\n${await StyleDictionary.hooks.formats["css/variables"](args)}`;

// The kit tier only feeds kit-contract.css and dist/kit/; it never becomes an --mq- token.
const notKit = (token) => token.path[0] !== "kit";

const cssTransforms = StyleDictionary.hooks.transformGroups.css.flatMap((name) => {
  if (name === "name/kebab") return ["name/mq"];
  if (name === "shadow/css/shorthand") return ["shadow/mq-colour", name];
  return [name];
}).concat("value/css-string");

export default {
  usesDtcg: true,
  source: ["tokens/core/*.tokens.json", "tokens/semantic/*.tokens.json", "tokens/kit/*.tokens.json"],
  log: { verbosity: "default", warnings: "error" },
  preprocessors: ["mq/from-guidelines"],
  hooks: {
    preprocessors: { "mq/from-guidelines": fromGuidelines },
    transforms: { "name/mq": nameMq, "shadow/mq-colour": shadowColour, "value/css-string": cssString },
    formats: {
      "mq/css-variables": cssVariables,
      "mq/json": jsonMq,
      "mq/tailwind": tailwindFormat,
      "mq/kit-contract": kitContractFormat,
      ...Object.fromEntries(KIT_TOKEN_MODULES.map((module) => [`mq/kit-${module}`, kitModuleFormat(module)])),
    },
  },
  platforms: {
    css: {
      prefix: "mq",
      transforms: cssTransforms,
      buildPath: "dist/",
      files: [
        {
          destination: "tokens.css",
          format: "mq/css-variables",
          filter: notKit,
          options: { outputReferences: false, selector: ":root" },
        },
        { destination: "tokens.json", format: "mq/json", filter: notKit },
        { destination: "tailwind.css", format: "mq/tailwind", filter: notKit },
        { destination: "kit-contract.css", format: "mq/kit-contract" },
        ...KIT_TOKEN_MODULES.map((module) => ({ destination: `kit/${module}.css`, format: `mq/kit-${module}` })),
      ],
    },
  },
};
