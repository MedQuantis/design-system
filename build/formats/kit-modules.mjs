// dist/kit/<module>.css: the modules of the homemade-claude-kit design contract 2.0.0 that are
// tokens, one file per module, filled from the kit tier (tokens/kit/, group kit.<module>), whose
// tokens alias semantic tokens. Values are literal, as in kit-contract.css: the kit resolver checks
// the contract's text pairs on hex values and inlines only url() values.
import { LICENCE_BANNER } from "../licence-banner.mjs";
import { embeddedFontFaces } from "./kit-contract.mjs";

export const KIT_TOKEN_MODULES = ["core", "dataviz", "type", "space-shape", "brand"];

const inModule = (module) => (token) => token.path[0] === "kit" && token.path[1] === module;

// Under the kit contract the fonts are the @font-face rules of any provided module; core carries
// the same embedded latin faces as kit-contract.css, as data because the kit inlines the module.
export const kitModuleFormat = (module) => ({ dictionary }) => {
  const lines = dictionary.allTokens.filter(inModule(module)).map((token) => `  --${token.path.at(-1)}: ${token.$value};`);
  if (lines.length === 0) throw new Error(`dist/kit/${module}.css: the kit tier has no kit.${module} group`);
  const faces = module === "core" ? embeddedFontFaces().flatMap((rule) => [rule, ""]) : [];
  return [
    LICENCE_BANNER,
    "/*",
    ` * MedQuantis values for the ${module} module of the homemade-claude-kit design contract 2.0.0,`,
    " * generated from tokens/kit/ by the design-system build. Do not edit. kit-manifest.json lists it.",
    " * For kit renderers only: the unprefixed names collide with app and Tailwind variables.",
    " */",
    ":root {",
    ...lines,
    "}",
    "",
    ...faces,
  ].join("\n");
};
