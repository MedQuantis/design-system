#!/usr/bin/env node
// Confidentiality gate (ADR-0005, layer 2): deny-listed names, currency amounts and figures,
// internal hosts and paths, image and SVG metadata. Runs after gitleaks in
// `make confidentiality-check` and in CI. Exit 0 clean, 1 findings, 2 misconfigured.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Fixtures that must contain violations. Exact paths, never a glob, so an exclusion can
// never hide a real file; a listed path that no longer exists is an error.
export const EXCLUDE_LIST = "scripts/confidentiality-exclude.txt";

// Applies to an amount or percentage on the same line, or to the whole file when it sits
// in the first five lines (a header comment).
const ILLUSTRATIVE_MARKER = "mq:illustrative";
const HEADER_LINES = 5;

const BINARY_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".ttf", ".otf", ".pdf"]);

const NUMBER = String.raw`\d[\d'’ ,.]*`;
// A code after a number must end a word, so identifiers such as "X7,Euro" are not amounts.
const CURRENCY_AMOUNT = new RegExp(String.raw`\b(?:CHF|EUR|USD|Fr\.)\s*${NUMBER}|${NUMBER}\s*(?:(?:CHF|EUR|USD)\b|€)|€\s*\d`, "i");
const PERCENTAGE = /\d\s*%/;

const INTERNAL_PATTERNS = [
  { rule: "internal-host", pattern: /[a-z0-9-]+(?:-my)?\.sharepoint\.com/i, message: "SharePoint host" },
  { rule: "internal-path", pattern: /(?:^|[^\w.-])crm\/[\w.-]+/i, message: "crm/ path" },
];

const ABSOLUTE_PATH = /(?:file:\/\/|(?:^|["'\s(=])\/(?:home|Users|mnt|private|var\/folders)\/|\b[A-Z]:\\)/;
const SVG_METADATA = [/<metadata\b/i, /\b(?:inkscape|sodipodi):/i, /<dc:creator\b/i];

// Lowercase, strip accents; whole-word comparison happens on the folded text.
const fold = (text) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function loadDenylist(path) {
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((term) => ({
      term,
      pattern: new RegExp(String.raw`(?<![\p{L}\p{N}])${fold(term).split(/\s+/).map(escapeRegExp).join(String.raw`\s+`)}(?![\p{L}\p{N}])`, "u"),
    }));
}

function denylistHits(text, denylist) {
  const folded = fold(text);
  return denylist.filter(({ pattern }) => pattern.test(folded));
}

export function scanPath(path, denylist) {
  return denylistHits(path, denylist).map(({ term }) => ({ file: path, line: 0, rule: "denylist", message: `file path contains deny-listed term "${term}"` }));
}

function scanText(file, text, denylist) {
  const findings = [];
  const lines = text.split(/\r?\n/);
  const inExamples = file.startsWith("examples/");
  const fileMarked = lines.slice(0, HEADER_LINES).some((line) => line.includes(ILLUSTRATIVE_MARKER));
  const report = (line, rule, message) => findings.push({ file, line, rule, message });

  lines.forEach((content, index) => {
    const line = index + 1;
    for (const { term } of denylistHits(content, denylist)) report(line, "denylist", `deny-listed term "${term}"`);
    for (const { rule, pattern, message } of INTERNAL_PATTERNS) if (pattern.test(content)) report(line, rule, message);

    const marked = fileMarked || content.includes(ILLUSTRATIVE_MARKER);
    if (marked) return;
    if (inExamples) {
      if (CURRENCY_AMOUNT.test(content) || PERCENTAGE.test(content)) report(line, "unmarked-figure", `figure in examples/ without the ${ILLUSTRATIVE_MARKER} marker`);
    } else if (CURRENCY_AMOUNT.test(content)) {
      report(line, "currency-amount", `currency amount outside examples/ (mark it ${ILLUSTRATIVE_MARKER} if fictitious)`);
    }
  });

  if (extname(file).toLowerCase() === ".svg") {
    lines.forEach((content, index) => {
      if (SVG_METADATA.some((pattern) => pattern.test(content))) report(index + 1, "svg-metadata", "SVG carries editor metadata");
      if (ABSOLUTE_PATH.test(content)) report(index + 1, "absolute-path", "SVG embeds an absolute file path");
    });
  }
  return findings;
}

const PNG_METADATA_CHUNKS = new Set(["tEXt", "iTXt", "zTXt", "eXIf"]);

function pngMetadata(bytes) {
  const found = [];
  for (let offset = 8; offset + 8 <= bytes.length; ) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("latin1", offset + 4, offset + 8);
    if (PNG_METADATA_CHUNKS.has(type)) found.push(type);
    offset += 12 + length;
  }
  return found;
}

// APP1 holds EXIF and XMP, APP13 holds IPTC; either can carry an author or a path.
function jpegMetadata(bytes) {
  const found = [];
  for (let offset = 2; offset + 4 <= bytes.length && bytes[offset] === 0xff; ) {
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = bytes.readUInt16BE(offset + 2);
    if (marker === 0xe1) found.push(bytes.toString("latin1", offset + 4, offset + 8) === "Exif" ? "EXIF" : "XMP");
    if (marker === 0xed) found.push("IPTC");
    offset += 2 + length;
  }
  return found;
}

function scanBinary(file, bytes) {
  const extension = extname(file).toLowerCase();
  const found = extension === ".png" ? pngMetadata(bytes) : [".jpg", ".jpeg"].includes(extension) ? jpegMetadata(bytes) : [];
  return found.length ? [{ file, line: 0, rule: "image-metadata", message: `image carries metadata (${found.join(", ")})` }] : [];
}

export function scan({ root, files, denylist }) {
  return files.flatMap((file) => {
    const bytes = readFileSync(join(root, file));
    const contentFindings = BINARY_EXTENSIONS.has(extname(file).toLowerCase()) ? scanBinary(file, bytes) : scanText(file, bytes.toString("utf8"), denylist);
    return [...scanPath(file, denylist), ...contentFindings];
  });
}

function fail(message) {
  console.error(`confidentiality-check: ${message}`);
  process.exit(2);
}

function resolveDenylist(root) {
  const configured = process.env.MQ_DENYLIST;
  if (!configured) {
    if (process.env.CI === "true") fail("MQ_DENYLIST is not set; the deny-list scan cannot be skipped in CI");
    console.warn("confidentiality-check: MQ_DENYLIST is not set, deny-list scan skipped (local run only)");
    return [];
  }
  const path = resolve(root, configured);
  if (!existsSync(path)) fail(`deny-list not found at ${configured}`);
  return loadDenylist(path);
}

function trackedFiles(root) {
  const output = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" });
  return [...new Set(output.split("\0").filter(Boolean))].filter((file) => existsSync(join(root, file)));
}

function main() {
  const root = process.cwd();
  const denylist = resolveDenylist(root);
  const files = trackedFiles(root);
  const excluded = loadExcludeList(join(root, EXCLUDE_LIST));
  const stale = excluded.filter((path) => !files.includes(path));
  if (stale.length) fail(`${EXCLUDE_LIST} lists paths that are not in the tree: ${stale.join(", ")}`);

  const findings = scan({ root, files: files.filter((file) => !excluded.includes(file)), denylist });
  for (const { file, line, rule, message } of findings) console.log(`${file}:${line}: [${rule}] ${message}`);
  console.log(`confidentiality-check: ${files.length - excluded.length} files scanned, ${excluded.length} excluded, ${findings.length} findings`);
  process.exit(findings.length ? 1 : 0);
}

function loadExcludeList(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
