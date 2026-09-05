import { useEffect, useState } from 'react';

interface Props {
  onBack: () => void;
  onReconnected: () => void;
}

const NODE = {
  name: 'Majestic Bus Stand',
  bearing: 30, // degrees toward the node (N-NE)
  initialDistance: 340,
};

function ProximityBar({ devices }: { devices: number }) {
  const pct = Math.min((devices / 8) * 100, 100);
  const color = devices === 0 ? '#E5484D' : devices < 4 ? '#F5A524' : '#30A46C';
  const label = devices === 0 ? 'No signal' : devices < 4 ? `${devices} device${devices !== 1 ? 's' : ''}` : `${devices} devices`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC' }}>
          Proximity
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color }}>
          {label}
        </span>
      </div>
      <div style={{ height: 6, background: '#1A2540', borderRadius: 3, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 3,
            transition: 'width 0.6s ease, background 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

/* Small breadcrumb map */
function BreadcrumbMap({ progress }: { progress: number }) {
  // progress 0→1: user moves from far position toward node
  const nodeX = 285;
  const nodeY = 48;
  const startX = 80;
  const startY = 155;
  const userX = startX + (nodeX - startX) * progress;
  const userY = startY + (nodeY - startY) * progress;

  // Dotted trail from start to current user position
  const dx = userX - startX;
  const dy = userY - startY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const steps = Math.max(Math.floor(len / 8), 1);

  return (
    <div style={{ borderRadius: 6, border: '1px solid #243044', overflow: 'hidden', background: '#0D1628' }}>
      <svg viewBox="0 0 350 180" width="100%" style={{ display: 'block' }}>
        <rect width="350" height="180" fill="#0D1628" />
        {[40, 80, 120, 160].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2="350" y2={y} stroke="#1A2540" strokeWidth="1" />
        ))}
        {[50, 100, 150, 200, 250, 300].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="180" stroke="#1A2540" strokeWidth="1" />
        ))}
        <path d="M 0,90 Q 80,88 160,95 Q 240,102 350,98" stroke="#1E2D4A" strokeWidth="5" fill="none" />
        <path d="M 240,0 L 235,180" stroke="#1E2D4A" strokeWidth="4" fill="none" />

        {/* Node */}
        <circle cx={nodeX} cy={nodeY} r="10" fill="#30A46C22" stroke="#30A46C" strokeWidth="1.5" />
        <circle cx={nodeX} cy={nodeY} r="4" fill="#30A46C" />

        {/* Trail */}
        {Array.from({ length: steps }, (_, j) => {
          const t = j / steps;
          return (
            <circle key={j} cx={startX + dx * t} cy={startY + dy * t} r="1.5" fill="#F5A524" opacity="0.6" />
          );
        })}

        {/* User dot */}
        <circle cx={userX} cy={userY} r="10" fill={progress > 0.8 ? '#30A46C22' : '#E5484D22'} stroke={progress > 0.8 ? '#30A46C' : '#E5484D'} strokeWidth="1.5" />
        <circle cx={userX} cy={userY} r="4" fill={progress > 0.8 ? '#30A46C' : '#E5484D'} />
      </svg>
    </div>
  );
}

export default function ReturnGuidance({ onBack, onReconnected }: Props) {
  const [distance, setDistance] = useState(NODE.initialDistance);
  const [progress, setProgress] = useState(0); // 0→1
  const [devices, setDevices] = useState(0);
  const [reconnected, setReconnected] = useState(false);

  // Simulate walking back every 1.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setDistance(d => {
        const next = Math.max(d - 20, 0);
        const p = 1 - next / NODE.initialDistance;
        setProgress(p);
        if (p > 0.3) setDevices(Math.floor(p * 6));
        if (next === 0) {
          setReconnected(true);
          clearInterval(interval);
        }
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  /* Reconnected confirmation */
  if (reconnected) {
    return (
      <div
        className="animate-fade-in"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#0B1220',
          padding: '40px 20px 48px',
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#30A46C', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="24" height="24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: '28px', fontWeight: 600, color: '#E6EAF2', margin: '0 0 8px', lineHeight: 1.25 }}>
            Back in coverage.
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#30A46C', margin: 0 }}>
            4 devices in range.
          </p>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC', margin: '4px 0 0' }}>
            Queued SOS sent automatically.
          </p>
        </div>
        <button
          onClick={onReconnected}
          style={{
            width: '100%',
            padding: '15px 20px',
            borderRadius: 6,
            background: '#30A46C',
            border: 'none',
            fontFamily: "'Inter', sans-serif",
            fontSize: '17px',
            fontWeight: 600,
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Go to home
        </button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0B1220' }}>
      {/* Top bar */}
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid #243044',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
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
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Distance heading */}
        <div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '52px',
              fontWeight: 600,
              color: '#E6EAF2',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-1px',
            }}
          >
            {distance}
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', color: '#8A97AC', marginTop: 4 }}>
            metres to relay
          </div>
        </div>

        {/* Bearing arrow */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg
            viewBox="0 0 100 130"
            width="100"
            style={{
              transform: `rotate(${NODE.bearing}deg)`,
              transition: 'transform 0.5s ease',
            }}
          >
            {/* Arrow head */}
            <polygon points="50,6 90,70 50,54 10,70" fill="#E6EAF2" />
            {/* Arrow shaft */}
            <rect x="40" y="54" width="20" height="68" rx="4" fill="#E6EAF2" />
          </svg>
        </div>

        {/* Hint */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            color: '#8A97AC',
            textAlign: 'center',
            margin: 0,
          }}
        >
          Walking back restores your connection.
        </p>

        {/* Proximity bar */}
        <ProximityBar devices={devices} />

        {/* Breadcrumb map */}
        <BreadcrumbMap progress={progress} />

        {/* Target info */}
        <div
          style={{
            padding: '14px 16px',
            background: '#131C2E',
            border: '1px solid #243044',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC' }}>Last node</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#E6EAF2' }}>{NODE.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC' }}>Bearing</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#E6EAF2' }}>{NODE.bearing}° NNE</span>
          </div>
        </div>
      </div>
    </div>
  );
}
