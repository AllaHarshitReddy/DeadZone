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
import type { SOSIncident } from '../data/mockData';

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
    needs: [],
    severity:
      sos.priority === 'critical' ? 'critical' : sos.priority === 'high' ? 'moderate' : 'minor',
    triage,
    triageReason: reason,
    timeAgo: relativeTime(sos.createdAt) || '< 1 min',
    distance: '',
    location: sos.description || 'Unknown location',
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
