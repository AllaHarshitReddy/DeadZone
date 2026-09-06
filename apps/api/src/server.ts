import os from "node:os";
import { createServer } from "http";
import express from "express";
import PouchDB from "pouchdb";
import { PeerTable } from "@sankat-setu/comms";
import { couchDbUrl, getCouchConfig, remotePouchDbOptions } from "../scripts/couchdb";
import { attachMeshServer } from "./mesh";

/**
 * Sankat Setu coordination server. Runs on the responder's laptop,
 * co-located with the AI edge node (apps/ai). Handles:
 * - Local PouchDB for offline-first SOS storage
 * - WebSocket mesh at /mesh for LAN peer-to-peer messaging
 * - Peer table and heartbeat broadcasting (10s interval)
 * - Replication to remote CouchDB when network is available
 */

async function main() {
  const config = getCouchConfig();
  const app = express();
  const httpServer = createServer(app);

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Initialize PouchDB (local + remote sync)
  const db = new PouchDB<any>(`.data/local`);
  const remote = new PouchDB<any>(couchDbUrl(config), remotePouchDbOptions(config));

  // Start continuous replication to the remote
  db.sync(remote, { live: true, retry: true })
    .on("error", (err) => console.error("[sync] error:", err))
    .on("paused", (err) => console.log("[sync] paused:", err))
    .on("active", () => console.log("[sync] active"));

  // Peer table and heartbeat
  const peerTable = new PeerTable();
  const lanIp = getLanIp() ?? "localhost";
  const selfDeviceId = process.env.SELF_DEVICE_ID ?? "responder-laptop";

  const selfGeo = { lat: 12.9716, lng: 77.5946 }; // TODO(post-sih): from actual device location

  peerTable.startHeartbeat({
    deviceId: selfDeviceId,
    isResponder: true,
    geo: selfGeo,
  });

  // Attach WebSocket mesh server
  attachMeshServer(httpServer, {
    db,
    peerTable,
    selfDeviceId,
    selfIsResponder: true,
    selfGeo,
  });

  const PORT = Number(process.env.PORT ?? 4000);
  const HOST = "0.0.0.0";

  httpServer.listen(PORT, HOST, () => {
    console.log(`Sankat Setu coordination server listening on ${HOST}:${PORT}`);
    console.log(`Reachable from phones at: ws://${lanIp}:${PORT}/mesh`);
    console.log(`Remote CouchDB: ${couchDbUrl(config)}`);
  });
}

function getLanIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
