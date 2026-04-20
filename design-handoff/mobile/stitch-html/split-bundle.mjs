/**
 * Split _paste-bundle.txt on HTML comments like `<!-- Design System -->`
 * into individual screen-*.html files (one full document per marker).
 *
 * Usage (from this directory):
 *   node split-bundle.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(__dirname, "_paste-bundle.txt"), "utf8").replace(/^\uFEFF/, "");

/** Markers must be on their own line: `<!-- Name -->` */
const marker = /(?:^|\n)<!--\s*([^>]+?)\s*-->\s*\n/g;
const matches = [...raw.matchAll(marker)];

if (matches.length === 0) {
  console.error("No `<!-- ... -->` markers found in _paste-bundle.txt");
  process.exit(1);
}

const slug = (name) =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

for (let i = 0; i < matches.length; i++) {
  const start = matches[i].index + matches[i][0].length;
  const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
  const chunk = raw.slice(start, end).trim();
  if (!chunk.startsWith("<!DOCTYPE")) {
    console.warn(`Skip segment ${i}: does not start with DOCTYPE`);
    continue;
  }
  const name = matches[i][1];
  const file = join(__dirname, `screen-${String(i + 1).padStart(2, "0")}-${slug(name)}.html`);
  writeFileSync(file, chunk + "\n", "utf8");
  console.log("Wrote", file);
}
