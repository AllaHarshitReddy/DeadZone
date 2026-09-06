# data/tiles — the offline basemap

Everything the map needs, served locally so it renders with no internet.
`apps/dashboard` serves this directory at its web root.

| Path | What | Source |
|---|---|---|
| `bengaluru/{z}/{x}/{y}.pbf` | Vector basemap tiles, z0–14, Bengaluru metro (77.45,12.82 → 77.75,13.14) | Protomaps daily planet build `20260905`, windowed to the bbox |
| `glyphs/Noto Sans Regular/`, `glyphs/Noto Sans Medium/` | Font glyph ranges (`{range}.pbf`) for map labels | [`protomaps/basemaps-assets`](https://github.com/protomaps/basemaps-assets) `fonts/` |
| `sprites/light*`, `sprites/dark*` | Icon sheets referenced by the style | [`protomaps/basemaps-assets`](https://github.com/protomaps/basemaps-assets) `sprites/v4/` |

The tiles are committed so a fresh clone has a working offline map with no build
step. To rebuild or move the area:

```bash
cd apps/dashboard
npm i --no-save pmtiles
node scripts/extract-tiles.mjs          # PROTOMAPS_BUILD=YYYYMMDD to pick a build
```

Glyphs and sprites were downloaded once from `raw.githubusercontent.com`; they
change rarely and there is no script for them.

**Licensing:** map data © OpenStreetMap contributors (ODbL), tile schema and
sprites © Protomaps (BSD), Noto fonts under the SIL Open Font License. This is a
hackathon demo extract.

Prove there are no external dependencies:

```bash
node apps/dashboard/scripts/verify-offline.js
```
