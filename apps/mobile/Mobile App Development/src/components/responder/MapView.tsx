import { useState } from 'react';
import { MOCK_INCIDENTS, MOCK_TEAMS, type SOSIncident } from '../../data/mockData';

interface Props {
  incidents: SOSIncident[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  networkStatus: string;
}

/* Severity shapes: triangle=critical, diamond=urgent, circle=stable/other */
const SEV_COLOR: Record<string, string> = {
  critical: '#E5484D',
  moderate: '#F5A524',
  minor: '#30A46C',
};
const SEV_LABEL: Record<string, string> = {
  critical: 'Critical',
  moderate: 'Urgent',
  minor: 'Stable',
};

function IncidentMarker({
  incident,
  isSelected,
  onClick,
}: {
  incident: SOSIncident;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = SEV_COLOR[incident.severity] ?? '#8A97AC';
  const cx = (incident.x / 100) * 760 + 20;
  const cy = (incident.y / 100) * 560 + 20;

  return (
    <g
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      transform={`translate(${cx},${cy})`}
    >
      {/* Selected ring */}
      {isSelected && (
        <circle r="22" fill="none" stroke="white" strokeWidth="2" opacity="0.9" />
      )}
      {/* Pulse for critical */}
      {incident.severity === 'critical' && (
        <circle r="18" fill="none" stroke={color} strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values="18;26;18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {/* Shape by severity */}
      {incident.severity === 'critical' ? (
        /* Triangle */
        <polygon points="0,-13 11,9 -11,9" fill={color} stroke={isSelected ? 'white' : color} strokeWidth={isSelected ? 1.5 : 0} />
      ) : incident.severity === 'moderate' ? (
        /* Diamond */
        <rect x="-9" y="-9" width="18" height="18" fill={color} stroke={isSelected ? 'white' : color} strokeWidth={isSelected ? 1.5 : 0} transform="rotate(45)" />
      ) : (
        /* Circle */
        <circle r="11" fill={color} stroke={isSelected ? 'white' : color} strokeWidth={isSelected ? 1.5 : 0} />
      )}
      {/* People count badge */}
      <circle cx="10" cy="-10" r="8" fill="#0B1220" stroke="#243044" strokeWidth="1" />
      <text x="10" y="-6" textAnchor="middle" fontSize="8" fill="#E6EAF2" fontFamily="Inter, sans-serif" fontWeight="600">
        {incident.people}
      </text>
    </g>
  );
}

/* Responder "You" dot */
function ResponderDot() {
  return (
    <g transform="translate(390,300)">
      {/* Accuracy halo */}
      <circle r="32" fill="#22D3EE" opacity="0.08" />
      <circle r="20" fill="#22D3EE" opacity="0.15" />
      {/* Heading cone */}
      <path d="M0,-28 L-10,-12 L10,-12 Z" fill="#22D3EE" opacity="0.5" />
      {/* Blue pulsing dot */}
      <circle r="8" fill="#22D3EE">
        <animate attributeName="r" values="8;11;8" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.7;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <circle r="4" fill="white" />
      {/* Label */}
      <rect x="-14" y="12" width="28" height="14" rx="3" fill="#131C2E" stroke="#243044" strokeWidth="1" />
      <text x="0" y="23" textAnchor="middle" fontSize="9" fill="#22D3EE" fontFamily="Inter, sans-serif" fontWeight="600">You</text>
    </g>
  );
}

/* Routing line from responder to selected incident */
function RoutingLine({ incident }: { incident: SOSIncident }) {
  const x2 = (incident.x / 100) * 760 + 20;
  const y2 = (incident.y / 100) * 560 + 20;
  const mx = (390 + x2) / 2;
  const my = (300 + y2) / 2;

  return (
    <g>
      <line x1="390" y1="300" x2={x2} y2={y2} stroke="#22D3EE" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.7" />
      {/* Distance badge on line */}
      <rect x={mx - 22} y={my - 10} width="44" height="18" rx="4" fill="#131C2E" stroke="#243044" strokeWidth="1" />
      <text x={mx} y={my + 5} textAnchor="middle" fontSize="9" fill="#E6EAF2" fontFamily="Inter, sans-serif">
        {incident.distance} · 4 min
      </text>
    </g>
  );
}

/* Team dispatch dropdown (simplified but functional) */
const UNIT_ICONS: Record<string, string> = {
  Medical: 'M',
  Fire: 'F',
  Rescue: 'R',
  Evacuation: 'E',
};

const TEAMS_EXTENDED = [
  { id: 't1', name: 'Alpha', unit: 'Medical', hq: 'Karnataka SDRF HQ', members: 6, status: 'available', distance: '0.8 km', eta: '3 min' },
  { id: 't2', name: 'Bravo', unit: 'Rescue', hq: 'Karnataka SDRF HQ', members: 4, status: 'en_route', distance: '2.1 km', eta: '9 min' },
  { id: 't3', name: 'Charlie', unit: 'Medical', hq: 'BBMP Emergency', members: 8, status: 'available', distance: '1.4 km', eta: '5 min' },
  { id: 't4', name: 'Delta', unit: 'Fire', hq: 'BBMP Emergency', members: 5, status: 'on_site', distance: '5.2 km', eta: '18 min' },
  { id: 't5', name: 'Echo', unit: 'Evacuation', hq: 'Karnataka SDRF HQ', members: 10, status: 'off_duty', distance: '8.4 km', eta: '25 min' },
];

const STATUS_COLOR: Record<string, string> = {
  available: '#30A46C',
  en_route: '#F5A524',
  on_site: '#22D3EE',
  off_duty: '#4A5A78',
};
const STATUS_LABEL: Record<string, string> = {
  available: 'Available',
  en_route: 'En route',
  on_site: 'On site',
  off_duty: 'Off duty',
};

function DispatchPanel({ incident, onClose }: { incident: SOSIncident; onClose: () => void }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [assigned, setAssigned] = useState<string[]>([]);
  const [dispatched, setDispatched] = useState(false);
  const [search, setSearch] = useState('');

  const color = SEV_COLOR[incident.severity] ?? '#E5484D';
  const severityLabel = SEV_LABEL[incident.severity] ?? 'Unknown';

  const filteredTeams = TEAMS_EXTENDED.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.unit.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAssign = (id: string) => {
    setAssigned(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const availableTeams = filteredTeams.filter(t => t.status === 'available');
  const otherTeams = filteredTeams.filter(t => t.status !== 'available');

  return (
    <div
      style={{
        width: 360,
        height: '100%',
        background: '#131C2E',
        borderLeft: '1px solid #243044',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #243044' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 4,
                background: color,
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 600,
                color: '#ffffff',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              {severityLabel}
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: '#E6EAF2' }}>
              {incident.location}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: '#4A5A78', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: 4 }}
          >
            ×
          </button>
        </div>

        {/* Facts grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {[
            { label: 'People', value: String(incident.people) },
            { label: 'Reported', value: incident.timeAgo },
            { label: 'Distance', value: incident.distance },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#0B1220', border: '1px solid #243044', borderRadius: 4, padding: '8px 10px' }}>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', fontWeight: 600, color: '#E6EAF2', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#4A5A78', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Triage reason */}
      <div
        style={{
          margin: '12px 20px',
          padding: '10px 14px',
          background: '#0B1220',
          borderLeft: `3px solid ${color}`,
          borderRadius: 4,
          flexShrink: 0,
        }}
      >
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#4A5A78', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Triage reason
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#E6EAF2', lineHeight: 1.5 }}>
          {incident.triageReason}
        </div>
      </div>

      {/* Assigned chips */}
      {assigned.length > 0 && (
        <div style={{ padding: '0 20px 12px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {assigned.map(id => {
            const t = TEAMS_EXTENDED.find(x => x.id === id);
            return t ? (
              <div
                key={id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  background: '#22D3EE15',
                  border: '1px solid #22D3EE44',
                  borderRadius: 99,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: '#22D3EE',
                }}
              >
                {t.name}
                <button onClick={() => toggleAssign(id)} style={{ color: '#22D3EE', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ) : null;
          })}
        </div>
      )}

      {/* Dispatch dropdown */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 20px' }}>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#8A97AC', marginBottom: 8 }}>
          Assign rescue team
        </div>

        <button
          onClick={() => setDropdownOpen(v => !v)}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: '#0B1220',
            border: '1px solid #243044',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: assigned.length > 0 ? '#E6EAF2' : '#4A5A78',
            cursor: 'pointer',
            marginBottom: 4,
          }}
        >
          <span>{assigned.length > 0 ? `${assigned.length} team${assigned.length !== 1 ? 's' : ''} selected` : 'Select teams…'}</span>
          <svg viewBox="0 0 10 6" fill="none" width="10" height="6">
            <path d={dropdownOpen ? 'M1 5l4-4 4 4' : 'M1 1l4 4 4-4'} stroke="#8A97AC" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {dropdownOpen && (
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              background: '#0B1220',
              border: '1px solid #243044',
              borderRadius: 6,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Search */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #243044' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search teams…"
                style={{
                  width: '100%',
                  background: '#131C2E',
                  border: '1px solid #243044',
                  borderRadius: 4,
                  padding: '6px 10px',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: '#E6EAF2',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Available groups */}
            {availableTeams.length > 0 && (
              <div>
                <div style={{ padding: '8px 14px 4px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#4A5A78', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Available
                </div>
                {availableTeams.map(t => (
                  <TeamRow key={t.id} team={t} assigned={assigned.includes(t.id)} onToggle={() => toggleAssign(t.id)} />
                ))}
              </div>
            )}
            {otherTeams.length > 0 && (
              <div>
                <div style={{ padding: '8px 14px 4px', fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#4A5A78', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Unavailable
                </div>
                {otherTeams.map(t => (
                  <TeamRow key={t.id} team={t} assigned={assigned.includes(t.id)} onToggle={() => toggleAssign(t.id)} dimmed />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dispatch button */}
      <div style={{ padding: '12px 20px 20px', borderTop: '1px solid #243044', flexShrink: 0 }}>
        {!dispatched ? (
          <button
            onClick={() => { if (assigned.length > 0) setDispatched(true); }}
            style={{
              width: '100%',
              padding: '13px 0',
              borderRadius: 6,
              background: assigned.length > 0 ? '#E5484D' : '#1A2540',
              border: 'none',
              fontFamily: "'Inter', sans-serif",
              fontSize: '16px',
              fontWeight: 600,
              color: assigned.length > 0 ? '#ffffff' : '#4A5A78',
              cursor: assigned.length > 0 ? 'pointer' : 'default',
            }}
          >
            Dispatch{assigned.length > 0 ? ` ${assigned.length} team${assigned.length !== 1 ? 's' : ''}` : ''}
          </button>
        ) : (
          <div
            style={{
              padding: '12px 16px',
              background: '#0B2318',
              border: '1px solid #30A46C',
              borderRadius: 6,
            }}
          >
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#30A46C', marginBottom: 4 }}>
              Dispatched — teams en route
            </div>
            {assigned.map(id => {
              const t = TEAMS_EXTENDED.find(x => x.id === id);
              return t ? (
                <div key={id} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#E6EAF2', display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                  <span>Team {t.name}</span>
                  <span style={{ color: '#8A97AC' }}>ETA {t.eta}</span>
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamRow({ team, assigned, onToggle, dimmed = false }: { team: typeof TEAMS_EXTENDED[0]; assigned: boolean; onToggle: () => void; dimmed?: boolean }) {
  const selectable = !dimmed;
  return (
    <button
      onClick={selectable ? onToggle : undefined}
      style={{
        width: '100%',
        padding: '10px 14px',
        background: assigned ? '#22D3EE10' : 'transparent',
        border: 'none',
        borderBottom: '1px solid #243044',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: selectable ? 'pointer' : 'default',
        opacity: dimmed ? 0.45 : 1,
        textAlign: 'left',
      }}
    >
      {/* Unit icon */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          background: '#1A2540',
          border: '1px solid #243044',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          fontWeight: 600,
          color: '#22D3EE',
          flexShrink: 0,
        }}
      >
        {UNIT_ICONS[team.unit] ?? '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#E6EAF2' }}>
            Team {team.name}
          </span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              color: STATUS_COLOR[team.status],
              background: `${STATUS_COLOR[team.status]}15`,
              border: `1px solid ${STATUS_COLOR[team.status]}44`,
              borderRadius: 3,
              padding: '1px 5px',
            }}
          >
            {STATUS_LABEL[team.status]}
          </span>
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#4A5A78' }}>
          {team.unit} · {team.members} members · {team.hq}
        </div>
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#8A97AC', textAlign: 'right', flexShrink: 0 }}>
        <div>{team.distance}</div>
        <div style={{ color: '#4A5A78' }}>{team.eta}</div>
      </div>
      {selectable && (
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: 3,
            background: assigned ? '#22D3EE' : 'transparent',
            border: `1.5px solid ${assigned ? '#22D3EE' : '#243044'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {assigned && (
            <svg viewBox="0 0 10 8" fill="none" stroke="white" strokeWidth="1.5" width="10" height="8">
              <polyline points="1 4 3.5 6.5 9 1" />
            </svg>
          )}
        </div>
      )}
    </button>
  );
}

export default function MapView({ incidents, selectedId, onSelect }: Props) {
  const [zoom, setZoom] = useState(1);
  const selected = incidents.find(i => i.id === selectedId) ?? null;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Left incident rail */}
      <div
        style={{
          width: 280,
          flexShrink: 0,
          background: '#0B1220',
          borderRight: '1px solid #243044',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #243044' }}>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: '#E6EAF2' }}>
            Active incidents
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#4A5A78', marginTop: 2 }}>
            {incidents.length} total · {incidents.filter(i => i.severity === 'critical').length} critical
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {[...incidents].sort((a, b) => {
            const order: Record<string, number> = { critical: 0, moderate: 1, minor: 2 };
            return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
          }).map(inc => {
            const color = SEV_COLOR[inc.severity] ?? '#8A97AC';
            const isSelected = selectedId === inc.id;
            return (
              <button
                key={inc.id}
                onClick={() => onSelect(isSelected ? null : inc.id)}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: isSelected ? '#131C2E' : 'transparent',
                  border: 'none',
                  borderLeft: `3px solid ${isSelected ? color : 'transparent'}`,
                  borderBottom: '1px solid #243044',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: inc.severity === 'critical' ? 0 : inc.severity === 'moderate' ? 0 : '50%',
                      background: color,
                      transform: inc.severity === 'critical' ? 'rotate(45deg) scale(1.1)' : 'none',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#E6EAF2', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.location.split(',')[0]}
                  </span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#4A5A78', flexShrink: 0 }}>
                    {inc.timeAgo}
                  </span>
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#8A97AC' }}>
                  {inc.people} people · {inc.distance}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0A1018' }}>
        <svg
          style={{ width: '100%', height: '100%' }}
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Base */}
          <rect width="800" height="600" fill="#0A1018" />

          {/* City blocks */}
          {[
            [60, 80, 120, 90], [200, 60, 140, 100], [360, 40, 100, 80],
            [480, 80, 130, 90], [630, 50, 120, 100],
            [50, 210, 110, 80], [180, 200, 160, 90], [360, 180, 120, 100],
            [510, 190, 140, 80], [670, 180, 110, 100],
            [60, 330, 130, 90], [210, 320, 110, 80], [340, 310, 150, 90],
            [510, 320, 130, 80], [660, 310, 110, 90],
            [70, 450, 140, 80], [230, 440, 120, 90], [370, 430, 130, 80],
            [520, 440, 140, 90], [680, 430, 100, 80],
          ].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill="#111820" rx="3" />
          ))}

          {/* Water */}
          <polygon points="630,0 800,0 800,180 760,260 700,240 650,180 635,100" fill="#0D1F3C" opacity="0.8" />
          <text x="710" y="110" fill="#1A3060" fontSize="11" fontFamily="Inter, sans-serif" textAnchor="middle" fontStyle="italic">Upper Lake</text>

          {/* Major roads */}
          <line x1="0" y1="170" x2="800" y2="170" stroke="#1C2435" strokeWidth="10" />
          <line x1="0" y1="400" x2="800" y2="400" stroke="#1C2435" strokeWidth="10" />
          <line x1="300" y1="0" x2="300" y2="600" stroke="#1C2435" strokeWidth="10" />
          <line x1="580" y1="0" x2="580" y2="600" stroke="#1C2435" strokeWidth="8" />
          {/* Minor roads */}
          <line x1="0" y1="280" x2="800" y2="280" stroke="#151D2A" strokeWidth="4" />
          <line x1="160" y1="0" x2="160" y2="600" stroke="#151D2A" strokeWidth="4" />
          <line x1="450" y1="0" x2="450" y2="600" stroke="#151D2A" strokeWidth="4" />
          <line x1="0" y1="530" x2="800" y2="530" stroke="#151D2A" strokeWidth="3" />
          <line x1="720" y1="0" x2="720" y2="600" stroke="#151D2A" strokeWidth="3" />
          {/* Diagonal */}
          <line x1="0" y1="350" x2="300" y2="170" stroke="#151D2A" strokeWidth="5" />
          <line x1="580" y1="170" x2="800" y2="300" stroke="#151D2A" strokeWidth="4" />

          {/* Area labels */}
          {[
            [130, 155, 'Majestic'], [390, 155, 'MG Road'], [490, 155, 'Indiranagar'],
            [130, 265, 'Shivajinagar'], [390, 265, 'Koramangala'], [650, 265, 'Whitefield'],
            [130, 390, 'Lalbagh'], [390, 390, 'HSR Layout'], [650, 390, 'Bellandur'],
          ].map(([x, y, label], i) => (
            <text key={i} x={x} y={y} fill="#1E2E44" fontSize="9" fontFamily="Inter, sans-serif" textAnchor="middle" letterSpacing="0.08em">
              {label}
            </text>
          ))}

          {/* Routing line to selected incident */}
          {selected && <RoutingLine incident={selected} />}

          {/* Incident markers */}
          {incidents.map(inc => (
            <IncidentMarker
              key={inc.id}
              incident={inc}
              isSelected={selectedId === inc.id}
              onClick={() => onSelect(selectedId === inc.id ? null : inc.id)}
            />
          ))}

          {/* Responder dot */}
          <ResponderDot />

          {/* Legend bottom-right */}
          <g transform="translate(620,490)">
            <rect width="168" height="86" rx="4" fill="#0B1220" stroke="#243044" strokeWidth="1" opacity="0.9" />
            {[
              { shape: 'triangle', color: '#E5484D', label: 'Critical' },
              { shape: 'diamond',  color: '#F5A524', label: 'Urgent' },
              { shape: 'circle',   color: '#30A46C', label: 'Stable' },
              { shape: 'dot',      color: '#22D3EE', label: 'You (responder)' },
            ].map(({ shape, color, label }, i) => (
              <g key={label} transform={`translate(12,${16 + i * 18})`}>
                {shape === 'triangle' && <polygon points="7,-6 13,4 1,4" fill={color} />}
                {shape === 'diamond'  && <rect x="2" y="-2" width="10" height="10" fill={color} transform="rotate(45,7,4)" />}
                {shape === 'circle'   && <circle cx="7" cy="4" r="6" fill={color} />}
                {shape === 'dot'      && <circle cx="7" cy="4" r="5" fill={color} opacity="0.8" />}
                <text x="20" y="8" fontSize="9" fill="#8A97AC" fontFamily="Inter, sans-serif">{label}</text>
              </g>
            ))}
            {/* Scale bar */}
            <g transform="translate(8,72)">
              <line x1="0" y1="0" x2="50" y2="0" stroke="#4A5A78" strokeWidth="1" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke="#4A5A78" strokeWidth="1" />
              <line x1="50" y1="-3" x2="50" y2="3" stroke="#4A5A78" strokeWidth="1" />
              <text x="25" y="12" fontSize="8" fill="#4A5A78" fontFamily="Inter, sans-serif" textAnchor="middle">500 m</text>
            </g>
          </g>
        </svg>

        {/* Zoom controls */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {[
            { label: '+', action: () => setZoom(z => Math.min(z + 0.25, 3)) },
            { label: '−', action: () => setZoom(z => Math.max(z - 0.25, 0.5)) },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              style={{
                width: 32,
                height: 32,
                background: '#131C2E',
                border: '1px solid #243044',
                borderRadius: 4,
                color: '#E6EAF2',
                fontFamily: "'Inter', sans-serif",
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {label}
            </button>
          ))}
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '10px',
              color: '#4A5A78',
              textAlign: 'center',
              marginTop: 2,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom(1)}
            style={{
              marginTop: 4,
              width: 32,
              height: 32,
              background: '#131C2E',
              border: '1px solid #243044',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Fit all incidents"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="#8A97AC" strokeWidth="1.5" width="14" height="14" strokeLinecap="round">
              <rect x="3" y="3" width="10" height="10" rx="1" />
              <path d="M1 5V1h4M15 5V1h-4M1 11v4h4M15 11v4h-4" />
            </svg>
          </button>
        </div>

        {/* Active incident count badge */}
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            background: '#131C2E',
            border: '1px solid #243044',
            borderRadius: 4,
            padding: '6px 12px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: '#E6EAF2',
          }}
        >
          <span style={{ fontWeight: 600 }}>{incidents.length}</span>
          <span style={{ color: '#4A5A78' }}> incidents · </span>
          <span style={{ color: '#E5484D', fontWeight: 600 }}>{incidents.filter(i => i.severity === 'critical').length}</span>
          <span style={{ color: '#4A5A78' }}> critical</span>
        </div>
      </div>

      {/* Right dispatch panel */}
      {selected && (
        <DispatchPanel incident={selected} onClose={() => onSelect(null)} />
      )}
    </div>
  );
}
