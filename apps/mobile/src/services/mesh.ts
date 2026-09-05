/**
 * WebSocket mesh client: connects to responder's coordination server
 * and sends/receives SOS messages via Envelopes.
 */

import { type Envelope, EnvelopeSchema } from "@sankat-setu/schema";
import { serializeEnvelope, deserializeEnvelope, type PeerHeartbeat } from "@sankat-setu/comms";

export type MeshStatus = "disconnected" | "connecting" | "connected" | "error";
export type HeartbeatPayload = { deviceId: string; isResponder: boolean; geo?: { lat: number; lng: number } };

interface MeshClientConfig {
  meshUrl: string;
  deviceId: string;
  onStatusChange?: (status: MeshStatus) => void;
  onHeartbeat?: (heartbeat: PeerHeartbeat) => void;
  onEnvelope?: (envelope: Envelope) => void;
  onError?: (error: string) => void;
}

export class MeshClient {
  private ws: WebSocket | null = null;
  private config: MeshClientConfig;
  private status: MeshStatus = "disconnected";
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private pendingAcks = new Map<string, { resolve: () => void; reject: (err: string) => void; timeout: ReturnType<typeof setTimeout> }>();

  constructor(config: MeshClientConfig) {
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.teardownSocket();
        this.intentionalClose = false;
        this.setStatus("connecting");
        this.ws = new WebSocket(this.config.meshUrl);

        this.ws.onopen = () => {
          console.log("[mesh] connected");
          this.setStatus("connected");
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
          const error = `WebSocket error: ${event}`;
          console.error("[mesh]", error);
          this.setStatus("error");
          this.config.onError?.(error);
          reject(new Error(error));
        };

        this.ws.onclose = () => {
          console.log("[mesh] disconnected");
          this.setStatus("disconnected");
          if (!this.intentionalClose) {
            this.attemptReconnect();
          }
        };
      } catch (err) {
        const error = `Failed to connect: ${err instanceof Error ? err.message : String(err)}`;
        this.config.onError?.(error);
        reject(new Error(error));
      }
    });
  }

  private handleMessage(data: string) {
    try {
      const msg = JSON.parse(data);

      if (msg.type === "heartbeat") {
        this.config.onHeartbeat?.(msg as PeerHeartbeat);
      } else if (msg.type === "ack") {
        const ack = this.pendingAcks.get(msg.envelopeId);
        if (ack) {
          clearTimeout(ack.timeout);
          ack.resolve();
          this.pendingAcks.delete(msg.envelopeId);
        }
      } else if (msg.type === "error") {
        console.error("[mesh] server error:", msg.message);
        this.config.onError?.(msg.message);
      } else {
        console.warn("[mesh] unknown message type:", msg.type);
      }
    } catch (err) {
      console.error("[mesh] failed to parse message:", err);
    }
  }

  async sendEnvelope(envelope: Envelope): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.status !== "connected" || !this.ws) {
        reject(new Error("Mesh not connected"));
        return;
      }

      try {
        const serialized = serializeEnvelope(envelope);
        this.ws.send(serialized);

        // Wait for ACK
        const timeout = setTimeout(() => {
          this.pendingAcks.delete(envelope.id);
          reject(new Error("ACK timeout"));
        }, 5000);

        this.pendingAcks.set(envelope.id, { resolve, reject, timeout });
      } catch (err) {
        reject(err);
      }
    });
  }

  private setStatus(status: MeshStatus) {
    if (this.status !== status) {
      this.status = status;
      this.config.onStatusChange?.(status);
    }
  }

  /** Detach handlers before closing so an outgoing socket can't drive reconnects or deliver messages. */
  private teardownSocket() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[mesh] reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      this.reconnectTimer = setTimeout(
        () => this.connect().catch((err) => console.error(err)),
        this.reconnectDelay * this.reconnectAttempts,
      );
    } else {
      console.error("[mesh] max reconnect attempts reached");
      this.setStatus("error");
    }
  }

  disconnect() {
    this.intentionalClose = true;
    this.teardownSocket();
    this.pendingAcks.forEach(({ timeout }) => clearTimeout(timeout));
    this.pendingAcks.clear();
    this.setStatus("disconnected");
  }

  getStatus(): MeshStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === "connected";
  }
}
