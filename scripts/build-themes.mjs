// Second Style Dictionary run: the dark theme of ADR-0007, written to dist/themes/dark.css (one
// .dark block) and dist/themes/dark.json, after the light run of make build.
import StyleDictionary from "style-dictionary";
import { darkTheme } from "../build/style-dictionary.config.mjs";

await new StyleDictionary(darkTheme).buildAllPlatforms();
