// Style Dictionary 5.6.0 build: DTCG sources in tokens/ to dist/tokens.css and dist/tokens.json.
import StyleDictionary from "style-dictionary";

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

const cssTransforms = StyleDictionary.hooks.transformGroups.css.map((name) => (name === "name/kebab" ? "name/mq" : name));

export default {
  usesDtcg: true,
  source: ["tokens/core/*.tokens.json", "tokens/semantic/*.tokens.json"],
  log: { verbosity: "default", warnings: "error" },
  hooks: {
    transforms: { "name/mq": nameMq },
    formats: { "mq/json": jsonMq },
  },
  platforms: {
    css: {
      prefix: "mq",
      transforms: cssTransforms,
      buildPath: "dist/",
      files: [
        {
          destination: "tokens.css",
          format: "css/variables",
          options: { outputReferences: false, selector: ":root" },
        },
        { destination: "tokens.json", format: "mq/json" },
      ],
    },
  },
};
