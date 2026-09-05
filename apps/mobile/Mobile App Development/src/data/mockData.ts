export type TriageCategory = 'RED' | 'YELLOW' | 'GREEN' | 'BLACK';
export type NeedType = 'medical' | 'rescue' | 'food_water' | 'shelter';
export type HopStatus = 'queued' | 'relayed' | 'delivered';
export type CoverageStatus = 'green' | 'amber' | 'red';
export type NetworkStatus = 'offline' | 'online';

export interface SOSIncident {
  id: string;
  x: number;
  y: number;
  people: number;
  needs: NeedType[];
  severity: 'critical' | 'moderate' | 'minor';
  triage: TriageCategory;
  triageReason: string;
  timeAgo: string;
  distance: string;
  note?: string;
  location: string;
  hopStatus: HopStatus;
}

export const MOCK_INCIDENTS: SOSIncident[] = [
  {
    id: 'sos-001',
    x: 22, y: 38,
    people: 7,
    needs: ['medical', 'rescue'],
    severity: 'critical',
    triage: 'RED',
    triageReason: 'RED — respiratory rate >30, unable to walk, capillary refill >2s',
    timeAgo: '4 min ago',
    distance: '340 m',
    location: 'Majestic Bus Stand, Bengaluru',
    hopStatus: 'delivered',
  },
  {
    id: 'sos-002',
    x: 58, y: 52,
    people: 3,
    needs: ['rescue', 'shelter'],
    severity: 'critical',
    triage: 'RED',
    triageReason: 'RED — building collapse, 2 trapped under load-bearing rubble',
    timeAgo: '11 min ago',
    distance: '820 m',
    location: 'Koramangala 5th Block, Bengaluru',
    hopStatus: 'delivered',
  },
  {
    id: 'sos-003',
    x: 38, y: 72,
    people: 2,
    needs: ['medical'],
    severity: 'moderate',
    triage: 'YELLOW',
    triageReason: 'YELLOW — closed fracture, walking wounded, BP 100/70, stable',
    timeAgo: '18 min ago',
    distance: '1.2 km',
    location: 'Indiranagar 100ft Road, Bengaluru',
    hopStatus: 'relayed',
    note: 'Child with mother, both conscious',
  },
  {
    id: 'sos-004',
    x: 76, y: 28,
    people: 4,
    needs: ['food_water', 'shelter'],
    severity: 'minor',
    triage: 'GREEN',
    triageReason: 'GREEN — ambulatory, minor lacerations, dehydrated but stable',
    timeAgo: '32 min ago',
    distance: '2.1 km',
    location: 'MG Road Metro Station, Bengaluru',
    hopStatus: 'delivered',
  },
  {
    id: 'sos-005',
    x: 14, y: 62,
    people: 1,
    needs: ['medical'],
    severity: 'critical',
    triage: 'BLACK',
    triageReason: 'BLACK — no pulse, no respiration at scene assessment, expectant',
    timeAgo: '47 min ago',
    distance: '490 m',
    location: 'Lalbagh West Gate, Bengaluru',
    hopStatus: 'delivered',
  },
  {
    id: 'sos-006',
    x: 68, y: 76,
    people: 12,
    needs: ['medical', 'rescue', 'food_water'],
    severity: 'critical',
    triage: 'RED',
    triageReason: 'RED — flash flood victims, blunt trauma, 4 reported unresponsive',
    timeAgo: '6 min ago',
    distance: '3.4 km',
    location: 'Bellandur Lake Road, Bengaluru',
    hopStatus: 'queued',
    note: 'Group stranded, water still rising',
  },
];

export const MOCK_TEAMS = [
  { id: 't1', name: 'Alpha', members: 6, status: 'deployed', assignedTo: 'sos-001', eta: '2 min' },
  { id: 't2', name: 'Bravo', members: 4, status: 'deployed', assignedTo: 'sos-002', eta: '8 min' },
  { id: 't3', name: 'Charlie', members: 8, status: 'in_transit', assignedTo: null, eta: '15 min' },
  { id: 't4', name: 'Delta', members: 5, status: 'available', assignedTo: null, eta: null },
];

export const MOCK_RESOURCES = [
  { name: 'Medical Kits', available: 12, total: 20, unit: 'units' },
  { name: 'Rescue Equipment', available: 4, total: 8, unit: 'sets' },
  { name: 'Food Packets', available: 340, total: 500, unit: 'packs' },
  { name: 'Water Cans (20L)', available: 67, total: 100, unit: 'cans' },
  { name: 'Stretchers', available: 6, total: 10, unit: 'units' },
  { name: 'Rope (30m)', available: 14, total: 20, unit: 'coils' },
];

export const MOCK_RELAY_NODES = [
  { id: 'r1', name: 'Node Alpha', location: 'Majestic Tower', status: 'online', peers: 14 },
  { id: 'r2', name: 'Node Bravo', location: 'Koramangala Junction', status: 'online', peers: 9 },
  { id: 'r3', name: 'Node Charlie', location: 'Indiranagar', status: 'degraded', peers: 3 },
  { id: 'r4', name: 'Node Delta', location: 'Bellandur Bridge', status: 'offline', peers: 0 },
];

export const TRIAGE_COLOR: Record<TriageCategory, string> = {
  RED: '#DC2626',
  YELLOW: '#D97706',
  GREEN: '#16A34A',
  BLACK: '#4B5563',
};

export const TRIAGE_BG: Record<TriageCategory, string> = {
  RED: '#7F1D1D',
  YELLOW: '#78350F',
  GREEN: '#14532D',
  BLACK: '#1F2937',
};

export const NEED_LABELS: Record<NeedType, string> = {
  medical: 'Medical',
  rescue: 'Rescue',
  food_water: 'Food/Water',
  shelter: 'Shelter',
};

export const NEED_ICONS: Record<NeedType, string> = {
  medical: '🏥',
  rescue: '🚒',
  food_water: '💧',
  shelter: '⛺',
};

export const COVERAGE_DEVICES: Record<CoverageStatus, number> = {
  green: 14,
  amber: 4,
  red: 0,
};

export const COVERAGE_HOPS: Record<CoverageStatus, string | null> = {
  green: '1 relay to responder',
  amber: '2 relays to responder',
  red: null,
};
