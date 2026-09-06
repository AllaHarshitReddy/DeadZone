const express = require("express");
const path = require("path");
const os = require("os");
const { execFileSync } = require("child_process");

/**
 * Static tile server for the offline map.
 *
 * Serves the vector basemap tiles, self-hosted glyphs and sprites, the style
 * JSON, and a small MapLibre test page. Everything it serves is local — there
 * is no code path here that reaches the internet.
 *
 * Bound to 0.0.0.0 and logs the LAN IP so a phone on the hotspot can load it.
 */

const app = express();
const SRC_DIR = __dirname;
const REPO_ROOT = path.resolve(__dirname, "../../..");
const TILES_DIR = path.join(REPO_ROOT, "data/tiles");
const SEED_DIR = path.join(REPO_ROOT, "data/seed");
const PORT = Number(process.env.PORT ?? 3000);
const HOST = "0.0.0.0";

// Optional request log — set DASH_LOG=/path to enable. Diagnostic only.
if (process.env.DASH_LOG) {
  const fs = require("fs");
  fs.writeFileSync(process.env.DASH_LOG, "");
  app.use((req, res, next) => {
    const t = Date.now();
    res.on("finish", () => {
      fs.appendFileSync(process.env.DASH_LOG, `${res.statusCode} ${req.method} ${req.originalUrl} ${Date.now() - t}ms\n`);
    });
    next();
  });
}

// The map's own assets: bengaluru/{z}/{x}/{y}.pbf tiles, glyphs/, sprites/.
app.use(
  express.static(TILES_DIR, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".pbf")) res.type("application/x-protobuf");
    },
  }),
);

// Vendored MapLibre + PMTiles bundles and the style JSON.
app.use("/vendor", express.static(path.join(SRC_DIR, "vendor")));
app.get("/style.json", (_req, res) => res.sendFile(path.join(SRC_DIR, "style.json")));

// Fictional demo incidents, read straight from the committed seed file.
app.get("/seed/sos.json", (_req, res) => res.sendFile(path.join(SEED_DIR, "sos.json")));

app.get("/", (_req, res) => res.sendFile(path.join(SRC_DIR, "index.html")));

// Offline check: runs the same verifier as the CLI script and returns its report.
app.get("/verify-offline", (_req, res) => {
  try {
    const out = execFileSync(
      process.execPath,
      [path.join(REPO_ROOT, "apps/dashboard/scripts/verify-offline.js"), "--json"],
      { encoding: "utf-8" },
    );
    res.type("application/json").send(out);
  } catch (err) {
    // verify-offline.js exits non-zero when it finds a problem; its JSON is on stdout.
    const body = err.stdout && err.stdout.trim();
    res.status(400).type("application/json").send(body || JSON.stringify({ ok: false, error: err.message }));
  }
});

function getLanIp() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces ?? []) {
      if (iface.family === "IPv4" && !iface.internal) return iface.address;
    }
  }
  return "localhost";
}

app.listen(PORT, HOST, () => {
  const lanIp = getLanIp();
  console.log(`Offline tile server on ${HOST}:${PORT}`);
  console.log(`  this machine:  http://localhost:${PORT}`);
  console.log(`  from a phone:  http://${lanIp}:${PORT}`);
  console.log(`  tiles:         ${TILES_DIR}`);
});
