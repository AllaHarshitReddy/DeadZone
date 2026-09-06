import type PouchDB from "pouchdb";
import { WebSocketServer, type WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import {
  deserializeEnvelope,
  tryDeserializeEnvelope,
  serializeEnvelope,
  PeerTable,
  type PeerHeartbeatPayload,
} from "@sankat-setu/comms";
import type { Envelope, SOSRequest } from "@sankat-setu/schema";

/**
 * Mesh server: WebSocket endpoint at /mesh for LAN-based peer-to-peer
 * message passing. One relay hop maximum (see CLAUDE.md cut list).
 *
 * Every message is an Envelope; the server validates it against the schema,
 * writes it to PouchDB using the envelope.id as _id (dedup for free), and
 * echoes an ACK.
 *
 * Broadcast: peers receive heartbeats from the responder every 10 seconds,
 * carrying its current geo + responder status. Used by coverage.ts to
 * compute GREEN/AMBER/RED coverage metrics.
 */

export interface MeshServerConfig {
  db: PouchDB.Database<SOSRequest>;
  peerTable: PeerTable;
  selfDeviceId: string;
  selfIsResponder: boolean;
  /** Same value startHeartbeat() broadcasts, so the greeting below matches. */
  selfGeo?: { lat: number; lng: number };
}

export function attachMeshServer(httpServer: HttpServer, config: MeshServerConfig): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: "/mesh" });

  wss.on("connection", (ws) => {
    console.log("[mesh] client connected");
    handleClient(ws, config);
  });

  return wss;
}

async function handleClient(ws: WebSocket, config: MeshServerConfig) {
  // Register this client as a peer and start receiving heartbeats from the
  // local peer table (which broadcasts heartbeats on a 10s interval).
  let clientDeviceId: string | null = null;

  const sendHeartbeat = (payload: PeerHeartbeatPayload) => {
    const msg = JSON.stringify({ type: "heartbeat", payload, ts: new Date().toISOString() });
    if (ws.readyState === 1) {
      ws.send(msg);
    }
  };
  config.peerTable.onHeartbeat((heartbeat) => {
    sendHeartbeat(heartbeat.payload);
  });

  // Greet immediately. The interval broadcast only fires every 10s, so without
  // this a freshly-connected client has no observation to reason about and its
  // coverage meter correctly -- but unhelpfully -- reads RED until the next
  // tick. This changes nothing about the interval or the coverage thresholds;
  // it just stops the client's first evaluation happening in the dark.
  sendHeartbeat({
    deviceId: config.selfDeviceId,
    isResponder: config.selfIsResponder,
    geo: config.selfGeo,
  });

  ws.on("message", async (raw: Buffer) => {
    let envelope: Envelope | null = null;
    try {
      envelope = tryDeserializeEnvelope(raw.toString());
      if (!envelope) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid envelope JSON" }));
        return;
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: "error", message: `Envelope validation failed: ${err}` }));
      return;
    }

    // Track the sender as a peer
    if (!clientDeviceId) {
      clientDeviceId = envelope.orig;
      config.peerTable.updatePeer({
        deviceId: clientDeviceId,
        isResponder: false, // phones connecting to this server are not responders
      });
    }

    // Store the envelope in PouchDB
    try {
      await config.db.put({
        ...envelope.body,
        _id: envelope.id,
      } as SOSRequest);
    } catch (err) {
      if ((err as { status: number }).status === 409) {
        // Document already exists (same envelope, same UUID) -- idempotent
      } else {
        console.error("[mesh] failed to write envelope:", err);
        ws.send(JSON.stringify({ type: "error", message: "Failed to store message" }));
        return;
      }
    }

    // Echo an ACK
    ws.send(JSON.stringify({ type: "ack", envelopeId: envelope.id }));
  });

  ws.on("close", () => {
    console.log("[mesh] client disconnected");
  });

  ws.on("error", (err) => {
    console.error("[mesh] client error:", err);
  });
}
