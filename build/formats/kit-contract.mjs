// dist/kit-contract.css: the homemade-claude-kit token contract filled from the kit tier
// (tokens/kit/), whose tokens alias semantic tokens. Values are literal because kit renderers
// read some of them as hex (the release-note chart) and fall back to their own defaults on var().
const isKit = (token) => token.path[0] === "kit";

export const kitContractFormat = ({ dictionary }) => {
  const lines = dictionary.allTokens.filter(isKit).map((token) => `  --${token.path.at(-1)}: ${token.$value};`);
  return [
    "/*",
    " * MedQuantis values for the homemade-claude-kit token contract (delivery-comms 1.3.0),",
    " * generated from tokens/ by the design-system build. Do not edit.",
    " *",
    " * For kit renderers only: deploy it as docs/ux/tokens.css, the only path they read.",
    " * It must never be loaded in an app: its unprefixed names collide with Tailwind theme",
    " * variables and component-library variables. Apps use tokens.css and tailwind.css.",
    " */",
    ":root {",
    ...lines,
    "}",
    "",
  ].join("\n");
};
