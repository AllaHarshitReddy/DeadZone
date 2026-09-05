import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Envelope, SOSRequest } from "@sankat-setu/schema";
import { enqueue, dequeue, pendingCount, envelopeFor, drainQueue } from "./queue";

/** queue.ts persists through localStorage, which Node has no notion of. */
class MemoryStorage {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
}
(globalThis as unknown as { localStorage: MemoryStorage }).localStorage = new MemoryStorage();


function makeSOS(overrides: Partial<SOSRequest> = {}): SOSRequest {
  return {
    id: randomUUID(),
    deviceId: randomUUID(),
    reporterName: "Test Reporter",
    incidentType: "other",
    priority: "critical",
    victimCount: 1,
    description: "test",
    geo: { lat: 12.9716, lng: 77.5946 },
    status: "new",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Records what it was asked to send; optionally fails on a chosen id. */
function fakeMesh(failOn?: string) {
  const sent: string[] = [];
  return {
    sent,
    sendEnvelope: async (e: Envelope) => {
      if (failOn && e.id === failOn) throw new Error("link down");
      sent.push(e.id);
    },
  };
}

function fakeStore(records: SOSRequest[]) {
  let initCalls = 0;
  return {
    get initCalls() {
      return initCalls;
    },
    init: async () => {
      initCalls++;
    },
    getAllSOS: async () => records,
  };
}

beforeEach(() => {
  globalThis.localStorage.clear();
});

test("enqueue tracks an id and is idempotent", () => {
  const id = randomUUID();
  enqueue(id);
  enqueue(id);
  assert.equal(pendingCount(), 1);
});

test("dequeue removes only the named id", () => {
  const a = randomUUID();
  const b = randomUUID();
  enqueue(a);
  enqueue(b);
  dequeue(a);
  assert.equal(pendingCount(), 1);
});

test("dequeue of an unknown id is a no-op", () => {
  enqueue(randomUUID());
  dequeue(randomUUID());
  assert.equal(pendingCount(), 1);
});

test("envelopeFor fills every field the wire contract requires", () => {
  // Schema validation itself is covered end-to-end against the live mesh server;
  // importing Zod at runtime here would mean adding tsx to this package.
  const sos = makeSOS();
  const e = envelopeFor(sos);
  for (const field of ["id", "orig", "ts", "ttl", "prio", "type", "geo", "body"] as const) {
    assert.notEqual(e[field], undefined, `envelope is missing ${field}`);
  }
  assert.equal(e.type, "sos");
  assert.equal(e.ttl, 5);
  assert.equal(e.prio, sos.priority);
  assert.deepEqual(e.geo, sos.geo);
  assert.deepEqual(e.body, sos);
});

test("envelopeFor reuses the SOS id, so redelivery collapses to one document", () => {
  const sos = makeSOS();
  assert.equal(envelopeFor(sos).id, sos.id);
  assert.equal(envelopeFor(sos).orig, sos.deviceId);
  assert.equal(envelopeFor(sos).ts, sos.createdAt);
});

test("drainQueue with nothing pending sends nothing and never touches the store", async () => {
  const mesh = fakeMesh();
  const store = fakeStore([]);
  assert.equal(await drainQueue(mesh, store), 0);
  assert.equal(store.initCalls, 0);
});

test("drainQueue delivers every pending SOS and empties the queue", async () => {
  const records = [makeSOS(), makeSOS(), makeSOS()];
  records.forEach((r) => enqueue(r.id));
  const mesh = fakeMesh();

  const delivered = await drainQueue(mesh, fakeStore(records));

  assert.equal(delivered, 3);
  assert.equal(pendingCount(), 0);
  assert.deepEqual(mesh.sent.sort(), records.map((r) => r.id).sort());
});

test("a mid-drain failure leaves that SOS and everything after it queued", async () => {
  const records = [makeSOS(), makeSOS(), makeSOS()];
  records.forEach((r) => enqueue(r.id));
  const mesh = fakeMesh(records[1].id);

  const delivered = await drainQueue(mesh, fakeStore(records));

  assert.equal(delivered, 1, "only the first should have gone out");
  assert.equal(pendingCount(), 2, "the failed one and the one behind it stay queued");
  assert.deepEqual(mesh.sent, [records[0].id]);
});

test("a queued id with no local record is dropped rather than retried forever", async () => {
  const orphan = randomUUID();
  const real = makeSOS();
  enqueue(orphan);
  enqueue(real.id);
  const mesh = fakeMesh();

  const delivered = await drainQueue(mesh, fakeStore([real]));

  assert.equal(delivered, 1);
  assert.equal(pendingCount(), 0, "the orphan should be gone, not stuck");
  assert.deepEqual(mesh.sent, [real.id]);
});

test("draining twice is safe — the second run is a no-op", async () => {
  const records = [makeSOS(), makeSOS()];
  records.forEach((r) => enqueue(r.id));
  const store = fakeStore(records);

  assert.equal(await drainQueue(fakeMesh(), store), 2);
  assert.equal(await drainQueue(fakeMesh(), store), 0);
  assert.equal(pendingCount(), 0);
});
