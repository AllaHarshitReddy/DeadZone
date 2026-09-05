import { useState } from 'react';
import { TRIAGE_COLOR, NEED_ICONS, type SOSIncident } from '../../data/mockData';

interface Props {
  incidents: SOSIncident[];
  onSelect: (id: string) => void;
}

const TRIAGE_ORDER = { RED: 0, YELLOW: 1, GREEN: 2, BLACK: 3 };

export default function SOSList({ incidents, onSelect }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sorted = [...incidents].sort(
    (a, b) => TRIAGE_ORDER[a.triage] - TRIAGE_ORDER[b.triage]
  );

  const HOP_COLOR: Record<string, string> = {
    queued: '#D97706',
    relayed: '#EA580C',
    delivered: '#16A34A',
  };

  return (
    <div className="h-full flex flex-col" style={{ background: '#0A0A0E' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2A2A38] flex items-center justify-between">
        <div>
          <div
            className="text-[#F0F0F6] font-black tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px' }}
          >
            SOS INCIDENTS
          </div>
          <div
            className="text-[#5A5A6A]"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
          >
            {incidents.length} active · sorted by triage priority
          </div>
        </div>
        <div className="flex gap-2">
          {(['RED', 'YELLOW', 'GREEN'] as const).map(t => (
            <div key={t} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: TRIAGE_COLOR[t] }} />
              <span
                className="text-[#5A5A6A]"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
              >
                {incidents.filter(i => i.triage === t).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {sorted.map(incident => {
          const color = TRIAGE_COLOR[incident.triage];
          const expanded = expandedId === incident.id;

          return (
            <div
              key={incident.id}
              className="rounded-2xl border overflow-hidden transition-all duration-200"
              style={{ borderColor: expanded ? color : '#2A2A38', background: '#111116' }}
            >
              {/* Row */}
              <button
                className="w-full flex items-center gap-4 px-4 py-3 text-left"
                onClick={() => setExpandedId(expanded ? null : incident.id)}
              >
                {/* Triage badge */}
                <div
                  className="w-16 flex-shrink-0 py-1.5 rounded-lg text-center font-black tracking-wider text-white"
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '13px',
                    background: color,
                  }}
                >
                  {incident.triage}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[#F0F0F6] font-semibold truncate"
                      style={{ fontSize: '14px' }}
                    >
                      {incident.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[#8A8A9A]">👥 {incident.people}</span>
                    <span className="text-[#8A8A9A]">{incident.timeAgo}</span>
                    <span className="text-[#8A8A9A]">{incident.distance}</span>
                  </div>
                </div>

                {/* Needs + hop */}
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex gap-1">
                    {incident.needs.slice(0, 2).map(n => (
                      <span key={n} className="text-base">{NEED_ICONS[n]}</span>
                    ))}
                    {incident.needs.length > 2 && (
                      <span className="text-[#5A5A6A] text-xs">+{incident.needs.length - 2}</span>
                    )}
                  </div>
                  <span
                    className="text-xs font-mono"
                    style={{ color: HOP_COLOR[incident.hopStatus], fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
                  >
                    {incident.hopStatus.toUpperCase()}
                  </span>
                </div>
              </button>

              {/* Expanded detail */}
              {expanded && (
                <div className="px-4 pb-4 border-t border-[#2A2A38]">
                  {/* Triage reason */}
                  <div
                    className="rounded-xl p-3 mb-3 mt-3 border-l-4"
                    style={{ background: '#18181F', borderLeftColor: color }}
                  >
                    <div
                      className="text-[#5A5A6A] text-xs mb-1 tracking-widest"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      TRIAGE REASON
                    </div>
                    <div className="text-[#F0F0F6] text-sm font-medium">{incident.triageReason}</div>
                  </div>

                  {incident.note && (
                    <div className="text-[#8A8A9A] text-sm italic mb-3 px-2">
                      "{incident.note}"
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelect(incident.id)}
                      className="flex-1 py-3 rounded-xl text-white font-bold tracking-widest transition-colors"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '15px',
                        background: color,
                      }}
                    >
                      VIEW ON MAP
                    </button>
                    <button
                      className="flex-1 py-3 rounded-xl font-bold tracking-widest transition-colors"
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '15px',
                        background: '#1C1C22',
                        color: '#EA580C',
                        border: '1px solid #EA580C',
                      }}
                    >
                      DISPATCH
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
