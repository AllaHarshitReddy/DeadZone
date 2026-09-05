import type { GeoPoint, Responder, TriageCategory } from "@sankat-setu/schema";

/**
 * Greedy nearest-available responder allocation.
 *
 * No optimisation, no Hungarian algorithm, no routing — see
 * docs/decisions.md. Distance is straight-line haversine only; bearing is
 * out of scope for this track.
 *
 * Two judgement calls beyond the literal brief, both documented here rather
 * than made silently:
 *
 *  - "deceased" (BLACK-tag) victims are excluded from allocation entirely.
 *    START's own intent for the BLACK tag is that responders are not
 *    dispatched to it while RED/YELLOW/GREEN victims still need them — a
 *    life-critical rule, so it is applied here rather than left to whatever
 *    calls this function.
 *  - `Responder.capacity` (optional on the schema) is honoured: a responder
 *    can be the nearest match for more than one victim, up to `capacity`
 *    (default 1 when unset). This is still greedy, not optimised — each
 *    victim independently takes the nearest responder with remaining
 *    capacity at the time it is considered.
 */

const CATEGORY_PRIORITY: Record<TriageCategory, number> = {
  immediate: 0, // RED
  delayed: 1, // YELLOW
  minor: 2, // GREEN
  deceased: 3, // BLACK -- excluded before sorting matters, see below
};

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export interface AllocationCandidate {
  id: string;
  geo: GeoPoint;
  category: TriageCategory;
}

export type AllocationReasonCode = "NEAREST_AVAILABLE" | "NO_RESPONDER_AVAILABLE" | "EXCLUDED_DECEASED";

export interface AllocationAssignment {
  victimId: string;
  responderId: string | null;
  distanceKm: number | null;
  reasonCode: AllocationReasonCode;
}

export function allocate(
  victims: AllocationCandidate[],
  responders: Responder[],
): AllocationAssignment[] {
  const remainingCapacity = new Map<string, number>();
  for (const responder of responders) {
    if (responder.status === "available") {
      remainingCapacity.set(responder.id, responder.capacity ?? 1);
    }
  }

  const sorted = [...victims].sort(
    (a, b) => CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category],
  );

  const assignments: AllocationAssignment[] = [];

  for (const victim of sorted) {
    if (victim.category === "deceased") {
      assignments.push({
        victimId: victim.id,
        responderId: null,
        distanceKm: null,
        reasonCode: "EXCLUDED_DECEASED",
      });
      continue;
    }

    let nearest: { responder: Responder; distanceKm: number } | null = null;
    for (const responder of responders) {
      if ((remainingCapacity.get(responder.id) ?? 0) <= 0) continue;
      if (!responder.geo) continue;
      const distanceKm = haversineDistanceKm(victim.geo, responder.geo);
      if (!nearest || distanceKm < nearest.distanceKm) {
        nearest = { responder, distanceKm };
      }
    }

    if (!nearest) {
      assignments.push({
        victimId: victim.id,
        responderId: null,
        distanceKm: null,
        reasonCode: "NO_RESPONDER_AVAILABLE",
      });
      continue;
    }

    remainingCapacity.set(nearest.responder.id, (remainingCapacity.get(nearest.responder.id) ?? 1) - 1);
    assignments.push({
      victimId: victim.id,
      responderId: nearest.responder.id,
      distanceKm: nearest.distanceKm,
      reasonCode: "NEAREST_AVAILABLE",
    });
  }

  return assignments;
}
