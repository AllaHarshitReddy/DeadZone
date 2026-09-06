#!/usr/bin/env node
/**
 * Proves the offline map is actually offline.
 *
 * Fails loudly (exit 1) if:
 *   - style.json or index.html reference any http(s) host other than localhost
 *   - any local resource the style points at is missing on disk
 *     (the basemap tiles, every glyph fontstack, the sprite sheet)
 *
 * Run:  node scripts/verify-offline.js          (human output)
 *       node scripts/verify-offline.js --json    (machine output, used by /verify-offline)
 */

const fs = require("fs");
const path = require("path");

const JSON_OUT = process.argv.includes("--json");
const SRC = path.resolve(__dirname, "../src");
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TILES = path.join(REPO_ROOT, "data/tiles");

const problems = [];
const checks = [];
const ok = (msg) => checks.push(msg);
const fail = (msg) => problems.push(msg);

const mb = (n) => (n / 1e6).toFixed(1);
function countFiles(dir, ext) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += countFiles(path.join(dir, e.name), ext);
    else if (e.name.endsWith(ext)) n++;
  }
  return n;
}
function dirSize(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    n += e.isDirectory() ? dirSize(p) : fs.statSync(p).size;
  }
  return n;
}

// 1. No external URLs in the files the browser loads.
const EXTERNAL_URL = /(https?:)\/\/([^\s"'()]+)/g;
for (const rel of ["src/style.json", "src/index.html"]) {
  const file = path.join(REPO_ROOT, "apps/dashboard", rel);
  const text = fs.readFileSync(file, "utf-8");
  const hits = [];
  let m;
  while ((m = EXTERNAL_URL.exec(text)) !== null) {
    const host = m[2].split("/")[0];
    if (!host.startsWith("localhost") && !host.startsWith("127.0.0.1")) hits.push(m[0]);
  }
  if (hits.length) fail(`${rel} reaches external hosts: ${[...new Set(hits)].join(", ")}`);
  else ok(`${rel} - no external hosts`);
}

// 2. Everything style.json points at exists on disk.
const style = JSON.parse(fs.readFileSync(path.join(SRC, "style.json"), "utf-8"));

// 2a. basemap tile source — must be a same-origin {z}/{x}/{y} template on disk
const tileUrls = style.sources?.basemap?.tiles ?? [];
const tpl = tileUrls[0] ?? "";
if (!tpl.startsWith("/") || /^https?:/.test(tpl)) {
  fail(`basemap tiles url is not same-origin: "${tpl}"`);
} else {
  const tileRoot = path.join(TILES, tpl.replace(/^\//, "").split("/{")[0]); // data/tiles/bengaluru
  const count = countFiles(tileRoot, ".pbf");
  if (count === 0) fail(`no basemap tiles on disk under data/tiles/${path.basename(tileRoot)}/`);
  else ok(`basemap tiles present: ${count} .pbf under data/tiles/${path.basename(tileRoot)}/ (${mb(dirSize(tileRoot))} MB)`);
}

// 2b. glyph fontstacks — one range file is enough to prove the stack is installed
const fonts = new Set();
for (const layer of style.layers ?? []) {
  const f = layer.layout?.["text-font"];
  if (Array.isArray(f)) f.forEach((name) => typeof name === "string" && fonts.add(name));
}
const glyphsBase = (style.glyphs ?? "").replace(/^\.\//, "").split("{")[0]; // "glyphs/"
for (const font of fonts) {
  const dir = path.join(TILES, glyphsBase, font);
  const has = fs.existsSync(dir) && fs.readdirSync(dir).some((f) => f.endsWith(".pbf"));
  if (!has) fail(`glyph fontstack missing: ${glyphsBase}${font}/*.pbf`);
  else ok(`glyph fontstack present: ${font} (${fs.readdirSync(dir).filter((f) => f.endsWith(".pbf")).length} ranges)`);
}
if (fonts.size === 0) fail("style.json declares no text-font - labels cannot render");

// 2c. sprite sheet
if (style.sprite) {
  const spriteBase = style.sprite.replace(/^\.\//, "");
  for (const ext of [".json", ".png"]) {
    const p = path.join(TILES, spriteBase + ext);
    if (!fs.existsSync(p)) fail(`sprite file missing: ${spriteBase}${ext}`);
    else ok(`sprite file present: ${spriteBase}${ext}`);
  }
}

// 3. Vendored browser libraries.
for (const v of ["maplibre-gl.js", "maplibre-gl.css"]) {
  const p = path.join(SRC, "vendor", v);
  if (!fs.existsSync(p)) fail(`vendored library missing: src/vendor/${v}`);
  else ok(`vendored library present: ${v}`);
}

const result = { ok: problems.length === 0, checks, problems };

if (JSON_OUT) {
  console.log(JSON.stringify(result, null, 2));
} else if (result.ok) {
  console.log("PASS - the offline map has no external dependencies\n");
  checks.forEach((c) => console.log("  ok   " + c));
} else {
  console.error("FAIL - the map is not fully offline\n");
  problems.forEach((p) => console.error("  FAIL " + p));
  console.error("");
  checks.forEach((c) => console.error("  ok   " + c));
}

process.exit(result.ok ? 0 : 1);
