import { useState } from 'react';

interface Props {
  onBack: () => void;
}

/* Demo: arrow points toward the nearest mesh node */
const NODE = {
  name: 'Majestic Relay Node',
  distance: 340,
  bearing: 210, // degrees: 0=up, 90=right, 180=down, 270=left
};

export default function DirectionScreen({ onBack }: Props) {
  const [dist, setDist] = useState(NODE.distance);

  // Simulate getting closer
  const handleStep = () => setDist(d => Math.max(0, d - 15));

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ background: '#0B1220' }}
    >
      {/* Minimal top — back only */}
      <div
        className="flex items-center px-2 flex-shrink-0"
        style={{ height: 52, borderBottom: '1px solid #243044' }}
      >
        <button
          onClick={onBack}
          className="flex items-center justify-center text-[#8896B0] hover:text-[#F0F4FF] transition-colors"
          style={{ width: 44, height: 44 }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>

      {/* Main content — very high contrast, glanceable */}
      <div className="flex-1 flex flex-col items-center justify-between px-6 py-8">
        {/* Distance — dominant */}
        <div className="text-center">
          <div
            className="font-bold"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '72px',
              color: '#F0F4FF',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-2px',
            }}
          >
            {dist}
          </div>
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '22px', color: '#8896B0', marginTop: 4 }}>
            metres
          </div>
        </div>

        {/* Directional arrow — takes up most of screen */}
        <button
          onClick={handleStep}
          className="flex items-center justify-center flex-1 w-full my-4"
          style={{ cursor: 'default' }}
          title="Tap to simulate walking"
        >
          <svg
            viewBox="0 0 160 200"
            className="w-48"
            style={{
              transform: `rotate(${NODE.bearing}deg)`,
              filter: `drop-shadow(0 0 24px #22D3EE88)`,
              transition: 'transform 0.5s ease',
              maxHeight: 240,
            }}
          >
            {/* Arrow head */}
            <polygon
              points="80,8 148,130 80,100 12,130"
              fill="#22D3EE"
              stroke="none"
            />
            {/* Arrow shaft */}
            <rect x="65" y="100" width="30" height="90" rx="6" fill="#22D3EE" />
          </svg>
        </button>

        {/* Node info + caption */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div
            className="px-5 py-4 rounded w-full text-center"
            style={{ background: '#131C2E', border: '1px solid #243044' }}
          >
            <div
              className="font-semibold text-[#F0F4FF]"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px' }}
            >
              {NODE.name}
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8896B0', marginTop: 3 }}>
              Bearing {NODE.bearing}° · Last known position
            </div>
          </div>

          <p
            className="text-center"
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#8896B0', lineHeight: 1.5 }}
          >
            Hold phone upright and walk in this direction
          </p>

          {dist === 0 && (
            <div
              className="w-full py-3 rounded text-center font-semibold animate-fade-in"
              style={{ background: '#52C41A22', border: '1px solid #52C41A', color: '#52C41A', fontSize: '16px' }}
            >
              ✓ Mesh node in range
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
