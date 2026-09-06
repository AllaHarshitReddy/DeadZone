/**
 * Rebuilds data/tiles/bengaluru/ — the offline vector basemap.
 *
 * Pulls a Bengaluru-sized window out of the Protomaps daily planet build (which
 * serves HTTP range requests, so only the bytes we need are downloaded) and
 * writes it as a flat {z}/{x}/{y}.pbf tree that any static file server can host.
 *
 * The output is committed to the repo, so you only need to run this to refresh
 * the basemap or change the area. It is not part of any build step.
 *
 *   cd apps/dashboard
 *   npm i --no-save pmtiles
 *   node scripts/extract-tiles.mjs
 *
 * Glyphs (data/tiles/glyphs/) and sprites (data/tiles/sprites/) come from
 * github.com/protomaps/basemaps-assets and are also committed; see
 * data/tiles/README.md.
 */
import { PMTiles } from "pmtiles";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUILD = process.env.PROTOMAPS_BUILD || "20260905";
const SRC = `https://build.protomaps.com/${BUILD}.pmtiles`;

// Bengaluru: BBMP area plus a margin. Keep in sync with style.json "bounds".
const BBOX = { w: 77.45, s: 12.82, e: 77.75, n: 13.14 };
const MINZOOM = 0;
const MAXZOOM = 14;

const OUT = path.resolve(fileURLToPath(import.meta.url), "../../../../data/tiles/bengaluru");

const lon2x = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};

const src = new PMTiles(SRC);
const header = await src.getHeader();
if (header.tileType !== 1) throw new Error(`expected vector tiles, got tileType ${header.tileType}`);
console.log(`source: ${SRC}  (z${header.minZoom}-${header.maxZoom})`);

const tmp = `${OUT}.new`;
fs.rmSync(tmp, { recursive: true, force: true });

let written = 0;
let downloaded = 0;
for (let z = MINZOOM; z <= MAXZOOM; z++) {
  const max = 2 ** z - 1;
  const xMin = Math.max(0, lon2x(BBOX.w, z));
  const xMax = Math.min(max, lon2x(BBOX.e, z));
  const yMin = Math.max(0, lat2y(BBOX.n, z));
  const yMax = Math.min(max, lat2y(BBOX.s, z));
  let zc = 0;
  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      const t = await src.getZxy(z, x, y);
      if (!t || !t.data) continue;
      const dir = path.join(tmp, String(z), String(x));
      fs.mkdirSync(dir, { recursive: true });
      const buf = Buffer.from(t.data); // getZxy() returns decompressed MVT
      fs.writeFileSync(path.join(dir, `${y}.pbf`), buf);
      written++;
      downloaded += buf.length;
      zc++;
    }
  }
  console.log(`  z${z}: ${zc} tiles`);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.renameSync(tmp, OUT);
console.log(`\nwrote ${written} tiles (${(downloaded / 1e6).toFixed(1)} MB) to ${path.relative(process.cwd(), OUT)}`);
