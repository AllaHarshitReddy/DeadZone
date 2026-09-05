import { z } from "zod";
import type { GeoPoint } from "@sankat-setu/schema";

/**
 * A peer on the mesh -- either another phone on the local hotspot or
 * the responder's edge-node laptop. RSSI is only populated over Bluetooth;
 * over Wi-Fi it stays null (we use the presence/absence of recent heartbeats
 * to judge reachability instead).
 *
 * hopsToResponder: 0 = this peer IS the responder, 1 = direct connection
 * to responder, null = unknown/unreachable.
 * See docs/decisions.md: multi-hop beyond one relay is on the cut list.
 */
export const PeerSchema = z.object({
  deviceId: z.string(),
  lastSeen: z.string(),
  rssi: z.number().optional(),
  isResponder: z.boolean(),
  hopsToResponder: z.number().int().nonnegative().optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
});
export type Peer = z.infer<typeof PeerSchema>;

/**
 * In-memory peer table. Tracks all known peers on the mesh, when we last
 * saw them, and whether they can reach the responder.
 */
export class PeerTable {
  private peers = new Map<string, Peer>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatCallbacks: ((heartbeat: PeerHeartbeat) => void)[] = [];

  /**
   * Updates or creates a peer record. A heartbeat from a peer is the only
   * way to know it still exists -- see coverage.ts for RED/AMBER/GREEN logic.
   */
  updatePeer(update: Partial<Peer> & { deviceId: string }): Peer {
    const existing = this.peers.get(update.deviceId) ?? {};
    const peer = PeerSchema.parse({
      ...existing,
      ...update,
      lastSeen: update.lastSeen ?? new Date().toISOString(),
    });
    this.peers.set(update.deviceId, peer);
    return peer;
  }

  /** Get a peer by deviceId, or null if not found. */
  getPeer(deviceId: string): Peer | null {
    return this.peers.get(deviceId) ?? null;
  }

  /** Get all known peers. */
  getAllPeers(): Peer[] {
    return Array.from(this.peers.values());
  }

  /**
   * Register a callback to be called every time a heartbeat is broadcast.
   * Used by the WebSocket layer to send heartbeats to connected clients.
   */
  onHeartbeat(callback: (heartbeat: PeerHeartbeat) => void): void {
    this.heartbeatCallbacks.push(callback);
  }

  /**
   * Start broadcasting heartbeats every 10 seconds with this device's current
   * status (geo, responder status, etc). Must be explicitly started by the
   * server after initialization. Call stop() to halt.
   */
  startHeartbeat(self: PeerHeartbeatPayload): void {
    if (this.heartbeatInterval) return; // already running
    this.heartbeatInterval = setInterval(() => {
      const heartbeat: PeerHeartbeat = {
        ts: new Date().toISOString(),
        payload: self,
      };
      for (const callback of this.heartbeatCallbacks) {
        callback(heartbeat);
      }
    }, 10_000);
  }

  /** Stop heartbeat broadcast. */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export interface PeerHeartbeatPayload {
  deviceId: string;
  isResponder: boolean;
  geo?: GeoPoint;
}

export interface PeerHeartbeat {
  ts: string; // ISO datetime
  payload: PeerHeartbeatPayload;
}
