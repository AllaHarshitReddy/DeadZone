import { useState } from 'react';

interface Props {
  onBack: () => void;
  onGuideBack: () => void;
  onSOSQueued: () => void;
}

const NODE = {
  name: 'Majestic Bus Stand',
  distance: 340,
  bearing: 210,
  leftCoverage: '2 min ago',
};

/* Mini dark map card — 350×220 SVG */
function MiniMap({ distanceWalked }: { distanceWalked: number }) {
  // User dot moves bottom-left as they walk away
  // Node is top-right
  const nodeX = 285;
  const nodeY = 48;
  const userX = 80 + distanceWalked * 0.2;
  const userY = 155 + distanceWalked * 0.1;

  // Breadcrumb trail: a series of dots from node toward user position
  const crumbs = [
    { x: nodeX, y: nodeY + 20 },
    { x: 260, y: 70 },
    { x: 230, y: 90 },
    { x: 200, y: 110 },
    { x: 165, y: 130 },
    { x: 130, y: 145 },
    { x: userX, y: userY },
  ];

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 6,
        border: '1px solid #243044',
        overflow: 'hidden',
        background: '#0D1628',
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 350 220"
        width="100%"
        style={{ display: 'block' }}
      >
        {/* Dark map background */}
        <rect width="350" height="220" fill="#0D1628" />

        {/* Grid lines */}
        {[40, 80, 120, 160, 200].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="350" y2={y} stroke="#1A2540" strokeWidth="1" />
        ))}
        {[50, 100, 150, 200, 250, 300].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="220" stroke="#1A2540" strokeWidth="1" />
        ))}

        {/* Roads */}
        <path d="M 0,90 Q 80,88 160,110 Q 240,132 350,128" stroke="#1E2D4A" strokeWidth="5" fill="none" />
        <path d="M 240,0 L 235,220" stroke="#1E2D4A" strokeWidth="4" fill="none" />
        <path d="M 0,155 L 350,160" stroke="#1E2D4A" strokeWidth="3" fill="none" />
        <path d="M 100,0 Q 110,80 90,220" stroke="#1E2D4A" strokeWidth="3" fill="none" />

        {/* Relay node pin */}
        <circle cx={nodeX} cy={nodeY} r="10" fill="#30A46C22" stroke="#30A46C" strokeWidth="1.5" />
        <circle cx={nodeX} cy={nodeY} r="4" fill="#30A46C" />
        {/* Pin label */}
        <rect x="220" y="10" width="110" height="20" rx="3" fill="#131C2E" stroke="#243044" strokeWidth="1" />
        <text x="275" y="24" fontFamily="Inter, sans-serif" fontSize="10" fill="#8A97AC" textAnchor="middle">
          Last node · Majestic
        </text>

        {/* Breadcrumb trail (dotted) */}
        {crumbs.slice(0, -1).map((c, i) => {
          const next = crumbs[i + 1];
          const dx = next.x - c.x;
          const dy = next.y - c.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          const steps = Math.floor(len / 8);
          return Array.from({ length: steps }, (_, j) => {
            const t = j / steps;
            return (
              <circle
                key={`crumb-${i}-${j}`}
                cx={c.x + dx * t}
                cy={c.y + dy * t}
                r="1.5"
                fill="#F5A524"
                opacity="0.6"
              />
            );
          });
        })}

        {/* User dot */}
        <circle cx={userX} cy={userY} r="12" fill="#E5484D22" stroke="#E5484D" strokeWidth="1.5" />
        <circle cx={userX} cy={userY} r="5" fill="#E5484D" />

        {/* Compass rose */}
        <text x="20" y="20" fontFamily="Inter, sans-serif" fontSize="10" fill="#4A5A78" fontWeight="500">N</text>
        <line x1="18" y1="24" x2="18" y2="35" stroke="#4A5A78" strokeWidth="1" />
        <polygon points="18,24 15,30 21,30" fill="#4A5A78" />

        {/* Scale bar */}
        <line x1="270" y1="205" x2="340" y2="205" stroke="#4A5A78" strokeWidth="1" />
        <line x1="270" y1="202" x2="270" y2="208" stroke="#4A5A78" strokeWidth="1" />
        <line x1="340" y1="202" x2="340" y2="208" stroke="#4A5A78" strokeWidth="1" />
        <text x="305" y="215" fontFamily="Inter, sans-serif" fontSize="9" fill="#4A5A78" textAnchor="middle">200 m</text>
      </svg>
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #243044' }}>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC' }}>{label}</span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#E6EAF2' }}>{value}</span>
    </div>
  );
}

export default function CoverageLostScreen({ onBack, onGuideBack, onSOSQueued }: Props) {
  const [queued, setQueued] = useState(false);

  const handleSOSQueued = () => {
    setQueued(true);
    onSOSQueued();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0B1220' }}>
      {/* Red status bar below island */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 20px',
          background: '#2A0C0C',
          borderBottom: '1px solid #E5484D44',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#E5484D', animation: 'dot-blink 1.2s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#E5484D' }}>
          No relay path — out of coverage
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 32px' }}>
        {/* Back button */}
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 20,
            color: '#8A97AC',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
          }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" strokeLinecap="round">
            <polyline points="12 15 7 10 12 5" />
          </svg>
          Back
        </button>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '28px',
            fontWeight: 600,
            color: '#E6EAF2',
            lineHeight: 1.25,
            margin: '0 0 8px',
          }}
        >
          You've left relay coverage.
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#8A97AC', margin: '0 0 24px', lineHeight: 1.5 }}>
          Your SOS can't reach a responder from here.
        </p>

        {/* Map hero */}
        <MiniMap distanceWalked={0} />

        {/* Facts */}
        <div style={{ marginTop: 20, marginBottom: 24 }}>
          <FactRow label="Distance" value={`${NODE.distance} m`} />
          <FactRow label="Bearing" value={`${NODE.bearing}° SW`} />
          <FactRow label="Last node" value={NODE.name} />
          <FactRow label="Left coverage" value={NODE.leftCoverage} />
        </div>

        {/* CTAs */}
        <button
          onClick={onGuideBack}
          style={{
            width: '100%',
            padding: '15px 20px',
            borderRadius: 6,
            background: '#E5484D',
            border: 'none',
            fontFamily: "'Inter', sans-serif",
            fontSize: '17px',
            fontWeight: 600,
            color: '#ffffff',
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          Guide me back
        </button>

        {!queued ? (
          <button
            onClick={handleSOSQueued}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: '#8A97AC',
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            Send SOS anyway (queued)
          </button>
        ) : (
          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2D1A00',
              border: '1px solid #F5A524',
              borderRadius: 6,
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              color: '#F5A524',
              textAlign: 'center',
            }}
          >
            SOS queued — will send when relay is found
          </div>
        )}
      </div>
    </div>
  );
}
