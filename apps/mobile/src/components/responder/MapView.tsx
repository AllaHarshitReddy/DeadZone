import { useState } from 'react';
import { MOCK_INCIDENTS, TRIAGE_COLOR, NEED_ICONS, type SOSIncident, type NetworkStatus } from '../../data/mockData';

interface Props {
  incidents: SOSIncident[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  networkStatus: NetworkStatus;
}

const TRIAGE_BORDER: Record<string, string> = {
  RED: '#DC2626',
  YELLOW: '#D97706',
  GREEN: '#16A34A',
  BLACK: '#4B5563',
};

export default function MapView({ incidents, selectedId, onSelect, networkStatus }: Props) {
  const [showSheet, setShowSheet] = useState(false);
  const selected = incidents.find(i => i.id === selectedId);

  const handlePin = (id: string) => {
    onSelect(id);
    setShowSheet(true);
  };

  const closeSheet = () => {
    setShowSheet(false);
    onSelect(null);
  };

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#0D1117' }}>
      {/* Map background — SVG city mock */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Base */}
        <rect width="800" height="600" fill="#0D1117" />

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
          <rect key={i} x={x} y={y} width={w} height={h} fill="#141820" rx="4" />
        ))}

        {/* Water body */}
        <polygon
          points="620,0 800,0 800,200 760,280 700,260 660,200 640,120"
          fill="#1a2744"
          opacity="0.7"
        />
        <text x="700" y="120" fill="#2a4080" fontSize="12" fontFamily="monospace" textAnchor="middle">
          Upper Lake
        </text>

        {/* Major roads */}
        <line x1="0" y1="170" x2="800" y2="170" stroke="#2a2f3d" strokeWidth="10" />
        <line x1="0" y1="400" x2="800" y2="400" stroke="#2a2f3d" strokeWidth="10" />
        <line x1="300" y1="0" x2="300" y2="600" stroke="#2a2f3d" strokeWidth="10" />
        <line x1="580" y1="0" x2="580" y2="600" stroke="#2a2f3d" strokeWidth="8" />

        {/* Minor roads */}
        <line x1="0" y1="280" x2="800" y2="280" stroke="#1e2330" strokeWidth="4" />
        <line x1="160" y1="0" x2="160" y2="600" stroke="#1e2330" strokeWidth="4" />
        <line x1="450" y1="0" x2="450" y2="600" stroke="#1e2330" strokeWidth="4" />
        <line x1="0" y1="530" x2="800" y2="530" stroke="#1e2330" strokeWidth="3" />
        <line x1="720" y1="0" x2="720" y2="600" stroke="#1e2330" strokeWidth="3" />

        {/* Diagonal road */}
        <line x1="0" y1="350" x2="300" y2="170" stroke="#1e2330" strokeWidth="5" />
        <line x1="580" y1="170" x2="800" y2="300" stroke="#1e2330" strokeWidth="4" />

        {/* Area labels */}
        {[
          [130, 155, 'SECTOR 12'],
          [385, 155, 'MP NAGAR'],
          [490, 155, 'ZONE II'],
          [130, 265, 'OLD CITY'],
          [385, 265, 'SHIVAJI NGR'],
          [650, 265, 'BAIRAGARH'],
          [130, 390, 'GOVINDPURA'],
          [385, 390, 'PIPLANI'],
          [650, 390, 'MANDIDEEP'],
        ].map(([x, y, label], i) => (
          <text
            key={i}
            x={x} y={y}
            fill="#2a3050"
            fontSize="9"
            fontFamily="monospace"
            letterSpacing="0.15em"
            textAnchor="middle"
          >
            {label}
          </text>
        ))}

        {/* Grid overlay */}
        {Array.from({ length: 16 }, (_, i) => (
          <line key={`gv${i}`} x1={i * 50} y1="0" x2={i * 50} y2="600" stroke="#151820" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`gh${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} stroke="#151820" strokeWidth="0.5" />
        ))}

        {/* Compass */}
        <g transform="translate(750, 50)">
          <circle cx="0" cy="0" r="18" fill="#111116" stroke="#2a2a38" strokeWidth="1" />
          <text x="0" y="-5" textAnchor="middle" fill="#F0F0F6" fontSize="10" fontWeight="bold" fontFamily="monospace">N</text>
          <line x1="0" y1="-14" x2="0" y2="-6" stroke="#DC2626" strokeWidth="2" />
          <line x1="0" y1="14" x2="0" y2="6" stroke="#3A3A50" strokeWidth="2" />
        </g>
      </svg>

      {/* SOS Pins */}
      {incidents.map(incident => {
        const px = (incident.x / 100) * 100;
        const py = (incident.y / 100) * 100;
        const color = TRIAGE_COLOR[incident.triage];
        const isSelected = selectedId === incident.id;

        return (
          <button
            key={incident.id}
            onClick={() => handlePin(incident.id)}
            className="absolute transition-transform duration-150 hover:scale-110"
            style={{
              left: `${px}%`,
              top: `${py}%`,
              transform: `translate(-50%, -100%) ${isSelected ? 'scale(1.2)' : 'scale(1)'}`,
              zIndex: isSelected ? 30 : 10,
            }}
          >
            {/* Pulse ring for active */}
            {(incident.triage === 'RED') && (
              <div
                className="absolute rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  top: -8,
                  left: -4,
                  border: `2px solid ${color}`,
                  animation: 'coverage-pulse 1.5s ease-in-out infinite',
                  pointerEvents: 'none',
                }}
              />
            )}
            {/* Pin body */}
            <div
              className="relative flex flex-col items-center"
            >
              <div
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-white shadow-lg"
                style={{
                  background: color,
                  borderColor: isSelected ? '#FFFFFF' : TRIAGE_BORDER[incident.triage],
                  fontSize: '11px',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  boxShadow: `0 4px 12px ${color}66`,
                }}
              >
                {incident.people}
              </div>
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `8px solid ${color}`,
                  marginTop: '-1px',
                }}
              />
            </div>
          </button>
        );
      })}

      {/* Legend */}
      <div
        className="absolute top-3 left-3 rounded-xl p-3 border border-[#2A2A38]"
        style={{ background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(8px)' }}
      >
        <div
          className="text-[#5A5A6A] mb-2 tracking-widest"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
        >
          TRIAGE
        </div>
        {(['RED', 'YELLOW', 'GREEN', 'BLACK'] as const).map(cat => (
          <div key={cat} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ background: TRIAGE_COLOR[cat] }} />
            <span
              className="text-[#8A8A9A]"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
            >
              {cat}
            </span>
          </div>
        ))}
        <div
          className="mt-2 pt-2 border-t border-[#2A2A38] text-[#5A5A6A]"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
        >
          {incidents.length} active · {incidents.filter(i => i.triage === 'RED').length} critical
        </div>
      </div>

      {/* Scale */}
      <div
        className="absolute bottom-4 right-4 flex items-center gap-2"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#5A5A6A' }}
      >
        <div className="w-12 h-0.5 bg-[#5A5A6A]" />
        <span>500m</span>
      </div>

      {/* Incident bottom sheet */}
      {showSheet && selected && (
        <>
          <div className="absolute inset-0 bg-black/40 z-20" onClick={closeSheet} />
          <div
            className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl p-5 animate-slide-up"
            style={{ background: '#111116', border: '1px solid #2A2A38', maxHeight: '65%', overflowY: 'auto' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="px-3 py-1 rounded-lg font-black tracking-widest text-white"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '14px',
                      background: TRIAGE_COLOR[selected.triage],
                    }}
                  >
                    {selected.triage}
                  </div>
                  <span
                    className="text-[#8A8A9A]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
                  >
                    {selected.id.toUpperCase()}
                  </span>
                </div>
                <div
                  className="text-[#F0F0F6] font-bold"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px' }}
                >
                  {selected.location}
                </div>
              </div>
              <button onClick={closeSheet} className="text-[#5A5A6A] text-xl w-8 h-8 flex items-center justify-center">×</button>
            </div>

            {/* Triage reason */}
            <div
              className="rounded-xl p-3 mb-4 border-l-4"
              style={{ background: '#18181F', borderLeftColor: TRIAGE_COLOR[selected.triage] }}
            >
              <div
                className="text-[#5A5A6A] text-xs mb-1 tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                TRIAGE REASON
              </div>
              <div className="text-[#F0F0F6] text-sm font-medium">{selected.triageReason}</div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl" style={{ background: '#18181F' }}>
                <div className="text-2xl font-black text-[#F0F0F6]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{selected.people}</div>
                <div className="text-[#5A5A6A] text-xs">People</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: '#18181F' }}>
                <div className="text-[#8A8A9A] text-xs mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selected.timeAgo}</div>
                <div className="text-[#5A5A6A] text-xs">Time</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: '#18181F' }}>
                <div className="text-[#8A8A9A] text-xs mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selected.distance}</div>
                <div className="text-[#5A5A6A] text-xs">Distance</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selected.needs.map(n => (
                <span
                  key={n}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-[#2A2A38] text-[#8A8A9A]"
                  style={{ background: '#18181F' }}
                >
                  {NEED_ICONS[n]} {n.replace('_', '/')}
                </span>
              ))}
            </div>

            {selected.note && (
              <div
                className="text-[#8A8A9A] text-sm px-3 py-2 rounded-lg border border-[#2A2A38] mb-4"
                style={{ background: '#18181F' }}
              >
                "{selected.note}"
              </div>
            )}

            <button
              className="w-full py-4 rounded-xl font-black tracking-widest text-white"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '18px',
                background: 'linear-gradient(135deg, #EA580C, #C2410C)',
                boxShadow: '0 4px 16px rgba(234,88,12,0.3)',
              }}
            >
              DISPATCH TEAM →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
