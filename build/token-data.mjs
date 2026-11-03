// Token facts shared by the skill and llms generators, read from the built dist/tokens.json.
import { readFileSync } from "node:fs";
import { join } from "node:path";

export const readTokens = (root) => JSON.parse(readFileSync(join(root, "dist/tokens.json"), "utf8"));

// Status colours are for interactive apps only (ADR-0004): the status group plus the two
// warning surfaces of owner ruling 5.
export const isStatusToken = (name, token) =>
  token.path?.[0] === "semantic" && (token.path[2] === "status" || /^warning-(fill|tint)$/.test(token.path[2] ?? ""));

// The app categorical palette and the change-type tokens are apps only too (ADR-0008), and so is
// the live halo, which is built on the success colour (ADR-0004).
export const isAppPaletteToken = (name, token) =>
  token.path?.[0] === "semantic" && (/^(app-cat|change)$/.test(token.path[2] ?? "") || (token.path[1] === "shadow" && token.path[2] === "live"));

export const isAppOnlyToken = (name, token) => isStatusToken(name, token) || isAppPaletteToken(name, token);

export const isCoreToken = (name) => name.startsWith("--mq-core-");

// The names a consumer may use in a medium: semantic, not deprecated, no app-only colour in documents.
export const usableTokens = (root, medium) =>
  Object.entries(readTokens(root)).filter(
    ([name, token]) => !isCoreToken(name) && !token.deprecated && !(token.path?.[0] === "kit") && (medium === "app" || !isAppOnlyToken(name, token)),
  );

export const tokenTable = (entries) =>
  [
    "| Token | Value | Use |",
    "| :-- | :-- | :-- |",
    ...entries.map(([name, token]) => `| \`${name}\` | \`${String(token.value).replace(/\|/g, "\\|")}\` | ${String(token.description ?? "").replace(/\|/g, "\\|")} |`),
  ].join("\n");
