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
 * The headline for an incident.
 *
 * This used to scrape a landmark out of the description with a `near (...)`
 * regex and, failing that, fall back to the incident type plus a coordinate --
 * so every phone-sent SOS, which carries no landmark text, displayed as
 * "Medical emergency (12.972, 77.595)". The triage board then cut that at the
 * first comma and showed "Medical emergency (12.972".
 *
 * We have no way to turn a coordinate into a place name: there is no
 * reverse-geocoder here and inventing one is not on the table. So the headline
 * is now the civilian's own words where they wrote any -- real, user-supplied
 * text -- and the incident type otherwise. The coordinate moves to its own
 * field and is displayed as what it is, rather than dressed up as a location.
 */
const MAX_TITLE = 60;

function locationLabel(sos: SOSRequest): string {
  const described = sos.description?.trim();
  if (described) {
    // First sentence, so a long message does not swamp the row.
    const firstSentence = described.split(/(?<=[.!?])\s/)[0].trim();
    const text = firstSentence || described;
    return text.length > MAX_TITLE ? `${text.slice(0, MAX_TITLE - 1).trimEnd()}…` : text;
  }
  return TITLE[sos.incidentType] ?? 'SOS';
}

/**
 * The raw fix, to 4dp, shown as a monospace subtitle. Empty when the SOS
 * carried no geo -- better nothing than a placeholder that reads like a
 * position.
 */
function coordsLabel(sos: SOSRequest): string {
  if (typeof sos.geo?.lat !== 'number' || typeof sos.geo?.lng !== 'number') return '';
  return `${sos.geo.lat.toFixed(4)}, ${sos.geo.lng.toFixed(4)}`;
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
    coords: coordsLabel(sos),
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
