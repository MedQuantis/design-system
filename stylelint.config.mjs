// MedQuantis stylelint config, exported as @medquantis/design-system/stylelint for consumers.
// Colours, fonts and shadows come from custom properties only; radius comes from the three
// --mq-radius tokens only, so no stylesheet can draw a pill (owner ruling 3); spacing is a
// custom property, 0 or auto. Custom properties must be defined, here or in dist/tokens.css, and a
// consumer's --app-*, --site-* or --viz-* property may only point at tokens.
import { fileURLToPath } from "node:url";

const tokensCss = fileURLToPath(new URL("./dist/tokens.css", import.meta.url));

const COLOUR_FUNCTIONS = "/^(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|device-cmyk|light-dark)$/i";
const KEYWORDS = ["inherit", "initial", "unset", "revert", "revert-layer"];

const RADIUS_PROPERTY = "/^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/";
const RADIUS_VALUE = "/^(var\\(--mq-radius-(small|medium|overlay)\\)|0)( (var\\(--mq-radius-(small|medium|overlay)\\)|0)){0,3}$/";
const SPACING_PROPERTY = "/^((margin|padding)(-(top|right|bottom|left|block|inline)(-(start|end))?)?|(row-|column-)?gap)$/";
const SPACING_VALUE = "/^((var\\(--[a-z0-9-]+\\)|0|auto)( |$))+$/";

// A consumer's own custom properties (ADR-0002 rule 3) hold token references only: one or more
// var() of an --mq-* token or another local property, or a calc() that scales them by a plain
// number. A literal (12px, #0a2463, Outfit) or a literal fallback is rejected.
const LOCAL_PROPERTY = "/^--(app|site|viz)-/";
const LOCAL_REF = "var\\(--(mq|app|site|viz)-[a-z0-9-]+\\)";
const LOCAL_CALC = `calc\\((\\s*(${LOCAL_REF}|\\d+(\\.\\d+)?|[-+*/()]))+\\s*\\)`;
const LOCAL_VALUE = `/^(${LOCAL_REF}|${LOCAL_CALC})([ ,]+(${LOCAL_REF}|${LOCAL_CALC}))*$/`;

export default {
  plugins: ["stylelint-declaration-strict-value", "stylelint-value-no-unknown-custom-properties"],
  ignoreFiles: ["**/tokens/**", "**/dist/**"],
  rules: {
    "color-no-hex": true,
    "color-named": "never",
    "function-disallowed-list": [COLOUR_FUNCTIONS],
    "declaration-no-important": true,
    "scale-unlimited/declaration-strict-value": [
      ["/color$/", "fill", "stroke", "font-family", "font-size", "font-weight", "box-shadow"],
      {
        ignoreFunctions: false,
        ignoreValues: {
          "": KEYWORDS,
          "/color$/": ["transparent", "currentcolor", "currentColor", ...KEYWORDS],
          fill: ["none", "currentColor", ...KEYWORDS],
          stroke: ["none", "currentColor", ...KEYWORDS],
          "box-shadow": ["none", ...KEYWORDS],
        },
      },
    ],
    "declaration-property-value-allowed-list": [
      { [RADIUS_PROPERTY]: [RADIUS_VALUE], [SPACING_PROPERTY]: [SPACING_VALUE], [LOCAL_PROPERTY]: [LOCAL_VALUE] },
    ],
    "csstools/value-no-unknown-custom-properties": [true, { importFrom: [tokensCss] }],
  },
};
