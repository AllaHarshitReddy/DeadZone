/**
 * One place that turns a stored SOS record into the `SOSIncident` shape the
 * responder screens render. The map, the list and the triage board all read
 * from here so they can't drift apart.
 *
 * Runs entirely on local data — `getDatabase().getAllSOS()` reads the device's
 * own store, no network.
 */

import type { SOSRequest } from '@sankat-setu/schema';
import { getDatabase } from './pouchdb';
import { triageSOSReport } from './triage';
import type { NeedType, SOSIncident } from '../data/mockData';

/** SOSRequest has no structured needs field yet, so read them back out of the text. */
const NEED_PATTERNS: [NeedType, RegExp][] = [
  ['medical', /\bmedical\b|\binjur|\bbleed|\bunconscious\b/i],
  ['rescue', /\brescue\b|\btrapped\b|\bstuck\b|\bcollapse/i],
  ['food_water', /\bfood\b|drinking water|\bwater and food\b|food and water|\bdehydrat/i],
  ['shelter', /\bshelter\b/i],
];

function needsFrom(sos: SOSRequest): NeedType[] {
  const text = `${sos.incidentType} ${sos.description}`;
  const found = NEED_PATTERNS.filter(([, re]) => re.test(text)).map(([n]) => n);
  return found.length ? found : sos.incidentType === 'medical' ? ['medical'] : [];
}

const TITLE: Record<string, string> = {
  medical: 'Medical emergency',
  fire: 'Fire',
  flood: 'Flood',
  building_collapse: 'Building collapse',
  trapped: 'People trapped',
  road_accident: 'Road accident',
  gas_leak: 'Gas leak',
  drowning: 'Drowning',
  other: 'SOS',
};

/**
 * A place label for the incident. Seed records carry a real sentence with a
 * landmark ("...near Koramangala 5th Block..."); phone-sent ones don't, so fall
 * back to the incident type plus a coordinate rather than showing "needs
 * medical" where a location should be.
 */
function locationLabel(sos: SOSRequest): string {
  const near = sos.description.match(/\bnear ([^,.;]+)/i);
  if (near) return near[1].trim();
  const coord =
    typeof sos.geo?.lat === 'number' ? ` (${sos.geo.lat.toFixed(3)}, ${sos.geo.lng.toFixed(3)})` : '';
  return `${TITLE[sos.incidentType] ?? 'SOS'}${coord}`;
}

/** "< 1 min", "12 min ago", "3 h ago", "2 d ago" from an ISO timestamp. */
function relativeTime(iso?: string): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return '';
  const min = Math.floor(ms / 60000);
  if (min < 1) return '< 1 min';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} h ago`;
  return `${Math.floor(hr / 24)} d ago`;
}

export function sosToIncident(sos: SOSRequest): SOSIncident {
  const triageResult = triageSOSReport(sos);

  // Deliberately a priority-level statement, not the START medical reasoning —
  // the civilian did not supply vitals, so we don't surface clinical assumptions.
  const reason =
    sos.priority === 'critical'
      ? 'Critical - needs immediate response'
      : sos.priority === 'high'
        ? 'Urgent - needs quick response'
        : 'Stable - can wait';

  const triage =
    triageResult.category === 'immediate'
      ? 'RED'
      : triageResult.category === 'delayed'
        ? 'YELLOW'
        : triageResult.category === 'minor'
          ? 'GREEN'
          : 'BLACK';

  return {
    id: sos.id,
    // Legacy SVG-mock coordinates, still filled so the fallback map works.
    x: Math.random() * 100,
    y: Math.random() * 100,
    lat: sos.geo?.lat,
    lng: sos.geo?.lng,
    people: sos.victimCount || 1,
    needs: needsFrom(sos),
    severity:
      sos.priority === 'critical' ? 'critical' : sos.priority === 'high' ? 'moderate' : 'minor',
    triage,
    triageReason: reason,
    timeAgo: relativeTime(sos.createdAt) || '< 1 min',
    distance: '',
    location: locationLabel(sos),
    note: sos.description || undefined,
    hopStatus: 'delivered',
  };
}

/** Load every stored SOS as a responder-facing incident. */
export async function loadIncidents(): Promise<SOSIncident[]> {
  const db = getDatabase();
  await db.init();
  const records = await db.getAllSOS();
  return records.map(sosToIncident);
}
