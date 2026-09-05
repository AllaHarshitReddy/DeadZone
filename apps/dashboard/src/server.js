const express = require("express");
const path = require("path");
const os = require("os");
const fs = require("fs");

/**
 * Static tile server for offline maps. Serves PMTiles, glyphs, and sprites
 * with support for HTTP range requests (required by PMTiles).
 * Bound to 0.0.0.0 and logs the LAN IP so phones can load the map.
 */

const app = express();
const TILES_DIR = path.resolve(__dirname, "../../data/tiles");
const PORT = Number(process.env.PORT ?? 3000);
const HOST = "0.0.0.0";

// Middleware for range request support (required for PMTiles)
app.use((req, res, next) => {
  const originalSend = res.send;

  res.send = function (data) {
    const filePath = path.join(TILES_DIR, req.path);

    // Only handle range requests for actual files that exist
    if (req.get("range") && fs.existsSync(filePath)) {
      try {
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const range = req.get("range").match(/bytes=(\d+)-(\d*)/);

        if (range) {
          const start = parseInt(range[1], 10);
          const end = range[2] ? parseInt(range[2], 10) : fileSize - 1;

          if (start >= 0 && start < fileSize && end >= start && end < fileSize) {
            res.status(206);
            res.set("Content-Range", `bytes ${start}-${end}/${fileSize}`);
            res.set("Content-Length", end - start + 1);
            res.set("Accept-Ranges", "bytes");

            const stream = fs.createReadStream(filePath, { start, end });
            stream.pipe(res);
            return;
          }
        }
      } catch (err) {
        console.warn("Range request error:", err.message);
      }
    }

    return originalSend.call(this, data);
  };

  next();
});

// Serve static files from data/tiles
app.use(express.static(TILES_DIR));

// Serve the test HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Serve style JSON
app.get("/style.json", (req, res) => {
  res.sendFile(path.join(__dirname, "style.json"));
});

// Verification endpoint: check if style has external URLs
app.get("/verify-offline", (req, res) => {
  try {
    const styleFile = path.join(__dirname, "style.json");
    const style = JSON.parse(fs.readFileSync(styleFile, "utf-8"));

    const styleStr = JSON.stringify(style);
    const hasExternalUrl =
      styleStr.includes("http://") || styleStr.includes("https://");

    if (hasExternalUrl) {
      const lines = styleStr.split("\n");
      const externalMatches = [];
      lines.forEach((line, idx) => {
        if (line.includes("http://") || line.includes("https://")) {
          externalMatches.push({ line: idx, content: line.substring(0, 100) });
        }
      });

      res.status(400).json({
        verified: false,
        error: "Style contains external URLs",
        examples: externalMatches.slice(0, 5),
      });
    } else {
      res.json({
        verified: true,
        message: "Style is offline-only (no external http/https URLs)",
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

app.listen(PORT, HOST, () => {
  const lanIp = getLanIp();
  console.log(`Tile server running on ${HOST}:${PORT}`);
  console.log(`Open http://${lanIp}:${PORT} in your browser`);
  console.log(`Tiles directory: ${TILES_DIR}`);
});
