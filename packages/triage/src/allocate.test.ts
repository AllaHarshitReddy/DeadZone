import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Responder } from "@sankat-setu/schema";
import { allocate, haversineDistanceKm, type AllocationCandidate } from "./allocate";

function makeResponder(overrides: Partial<Responder> = {}): Responder {
  return {
    id: randomUUID(),
    deviceId: randomUUID(),
    name: "Responder",
    status: "available",
    geo: { lat: 12.9352, lng: 77.6245 },
    ...overrides,
  };
}

function makeVictim(overrides: Partial<AllocationCandidate> = {}): AllocationCandidate {
  return {
    id: randomUUID(),
    geo: { lat: 12.9352, lng: 77.6245 },
    category: "delayed",
    ...overrides,
  };
}

test("haversineDistanceKm: same point is zero", () => {
  const p = { lat: 12.9352, lng: 77.6245 };
  assert.equal(haversineDistanceKm(p, p), 0);
});

test("haversineDistanceKm: known short distance is approximately correct", () => {
  // Koramangala to Whitefield, Bengaluru: roughly 15-16 km straight-line.
  const a = { lat: 12.9352, lng: 77.6245 };
  const b = { lat: 12.9698, lng: 77.75 };
  const km = haversineDistanceKm(a, b);
  assert.ok(km > 12 && km < 18, `expected ~12-18km, got ${km}`);
});

test("sorts RED before YELLOW before GREEN regardless of input order", () => {
  const near = { lat: 12.9352, lng: 77.6245 };
  const responder = makeResponder({ geo: near, capacity: 3 });
  const green = makeVictim({ id: "green", category: "minor", geo: near });
  const yellow = makeVictim({ id: "yellow", category: "delayed", geo: near });
  const red = makeVictim({ id: "red", category: "immediate", geo: near });

  const assignments = allocate([green, yellow, red], [responder]);
  assert.deepEqual(
    assignments.map((a) => a.victimId),
    ["red", "yellow", "green"],
  );
});

test("deceased victims are excluded from allocation", () => {
  const responder = makeResponder({ capacity: 5 });
  const deceased = makeVictim({ id: "deceased", category: "deceased" });
  const [assignment] = allocate([deceased], [responder]);
  assert.equal(assignment.reasonCode, "EXCLUDED_DECEASED");
  assert.equal(assignment.responderId, null);
});

test("assigns the nearest available responder by haversine distance", () => {
  const victim = makeVictim({ geo: { lat: 12.9352, lng: 77.6245 } });
  const near = makeResponder({ id: "near", geo: { lat: 12.94, lng: 77.63 } });
  const far = makeResponder({ id: "far", geo: { lat: 13.1, lng: 77.9 } });

  const [assignment] = allocate([victim], [far, near]);
  assert.equal(assignment.responderId, "near");
  assert.equal(assignment.reasonCode, "NEAREST_AVAILABLE");
  assert.ok(assignment.distanceKm !== null && assignment.distanceKm > 0);
});

test("skips responders that are not status=available", () => {
  const victim = makeVictim();
  const busy = makeResponder({ id: "busy", status: "busy" });
  const [assignment] = allocate([victim], [busy]);
  assert.equal(assignment.reasonCode, "NO_RESPONDER_AVAILABLE");
});

test("skips responders with no geo", () => {
  const victim = makeVictim();
  const noGeo = makeResponder({ id: "no-geo", geo: undefined });
  const [assignment] = allocate([victim], [noGeo]);
  assert.equal(assignment.reasonCode, "NO_RESPONDER_AVAILABLE");
});

test("respects responder capacity: a second victim goes to a different responder", () => {
  const v1 = makeVictim({ id: "v1", category: "immediate" });
  const v2 = makeVictim({ id: "v2", category: "immediate" });
  const single = makeResponder({ id: "single-capacity", capacity: 1, geo: { lat: 12.9352, lng: 77.6245 } });
  const backup = makeResponder({ id: "backup", capacity: 1, geo: { lat: 13.1, lng: 77.9 } });

  const assignments = allocate([v1, v2], [single, backup]);
  const responderIds = assignments.map((a) => a.responderId);
  assert.ok(responderIds.includes("single-capacity"));
  assert.ok(responderIds.includes("backup"));
});

test("a responder with capacity 2 can take two victims", () => {
  const v1 = makeVictim({ id: "v1", category: "immediate" });
  const v2 = makeVictim({ id: "v2", category: "delayed" });
  const responder = makeResponder({ capacity: 2 });

  const assignments = allocate([v1, v2], [responder]);
  assert.ok(assignments.every((a) => a.responderId === responder.id));
});

test("responder with unset capacity defaults to handling exactly one victim", () => {
  const v1 = makeVictim({ id: "v1", category: "immediate" });
  const v2 = makeVictim({ id: "v2", category: "delayed" });
  const responder = makeResponder({ capacity: undefined });

  const assignments = allocate([v1, v2], [responder]);
  const assignedCount = assignments.filter((a) => a.responderId === responder.id).length;
  assert.equal(assignedCount, 1);
});
