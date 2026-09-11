/**
 * Delivery queue for SOS records that were written locally but never
 * acknowledged by a responder.
 *
 * Delivery state is tracked outside the SOS document on purpose: `SOSStatus`
 * in packages/schema describes the incident's lifecycle (new, acknowledged,
 * dispatched), not whether this device managed to transmit it. Keeping the two
 * separate means the queue needs no change to the shared contract.
 */

import type { Envelope, SOSRequest } from "@deadzone/schema";
import { getDatabase } from "./pouchdb";

/** Only the surface drainQueue needs, so tests can pass a plain fake. */
interface EnvelopeSender {
  sendEnvelope(envelope: Envelope): Promise<void>;
}
interface SOSStore {
  init(): Promise<void>;
  getAllSOS(): Promise<SOSRequest[]>;
}

const QUEUE_KEY = "deadzone_pending_sos";

function readQueue(): string[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch (err) {
    console.warn("[queue] unreadable, starting empty:", err);
    return [];
  }
}

function writeQueue(ids: string[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(ids));
  } catch (err) {
    console.error("[queue] failed to persist:", err);
  }
}

export function enqueue(id: string) {
  const ids = readQueue();
  if (!ids.includes(id)) {
    writeQueue([...ids, id]);
    console.log("[queue] pending delivery:", id, `(${ids.length + 1} queued)`);
  }
}

export function dequeue(id: string) {
  const ids = readQueue();
  if (ids.includes(id)) {
    writeQueue(ids.filter((x) => x !== id));
    console.log("[queue] delivered:", id);
  }
}

export function pendingCount(): number {
  return readQueue().length;
}

/**
 * Rebuilds the wire envelope from a stored record. Every field the envelope
 * needs already lives on the SOS, so nothing extra has to be persisted — and
 * reusing `sos.id` as the envelope id is what makes redelivery collapse to one
 * document on the receiving side instead of creating a duplicate.
 */
export function envelopeFor(sos: SOSRequest): Envelope {
  return {
    id: sos.id,
    orig: sos.deviceId,
    ts: sos.createdAt,
    ttl: 5,
    prio: sos.priority,
    type: "sos",
    geo: sos.geo,
    body: sos,
  };
}

/**
 * Transmits every locally-stored SOS still awaiting acknowledgement.
 * Safe to call on every reconnect: delivery is idempotent.
 *
 * Returns the number actually delivered.
 */
export async function drainQueue(
  mesh: EnvelopeSender,
  db: SOSStore = getDatabase(),
): Promise<number> {
  const pending = readQueue();
  if (pending.length === 0) return 0;

  console.log(`[queue] draining ${pending.length} pending SOS...`);

  await db.init();
  const byId = new Map((await db.getAllSOS()).map((s) => [s.id, s]));

  let delivered = 0;
  for (const id of pending) {
    const sos = byId.get(id);
    if (!sos) {
      // The record is gone from local storage; stop retrying it forever.
      console.warn("[queue] no local record for", id, "- dropping from queue");
      dequeue(id);
      continue;
    }

    try {
      await mesh.sendEnvelope(envelopeFor(sos));
      dequeue(id);
      delivered++;
    } catch (err) {
      // Link went down again mid-drain. Leave this and everything after it
      // queued rather than burning through retries against a dead socket.
      console.warn("[queue] delivery failed for", id, "- staying queued:", err);
      break;
    }
  }

  if (delivered > 0) {
    console.log(`[queue] drained ${delivered} SOS, ${pendingCount()} still pending`);
  }
  return delivered;
}
