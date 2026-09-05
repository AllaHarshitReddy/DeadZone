import type { CoverageStatus } from '../../data/mockData';
import { COVERAGE_DEVICES, COVERAGE_HOPS } from '../../data/mockData';

interface Props {
  status: CoverageStatus;
  onClick: () => void;
}

const CONFIG = {
  green: {
    color: '#16A34A',
    dimColor: '#14532D',
    label: 'MESH CONNECTED',
    sub: 'Message will reach a responder',
    rings: 3,
    pulseSpeed: '2.8s',
  },
  amber: {
    color: '#D97706',
    dimColor: '#78350F',
    label: 'WEAK LINK',
    sub: 'Path exists but may be slow',
    rings: 2,
    pulseSpeed: '1.8s',
  },
  red: {
    color: '#DC2626',
    dimColor: '#7F1D1D',
    label: 'NO COVERAGE',
    sub: 'Move closer to other people',
    rings: 1,
    pulseSpeed: '1s',
  },
};

export default function CoverageMeter({ status, onClick }: Props) {
  const cfg = CONFIG[status];
  const devices = COVERAGE_DEVICES[status];
  const hops = COVERAGE_HOPS[status];

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full"
      style={{ touchAction: 'manipulation' }}
    >
      {/* Ring visualisation */}
      <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: 72, height: 72 }}>
        {[...Array(3)].map((_, i) => {
          const visible = i < cfg.rings;
          const size = 72 - i * 18;
          return (
            <div
              key={i}
              className="absolute rounded-full border-2"
              style={{
                width: size,
                height: size,
                borderColor: visible ? cfg.color : 'transparent',
                opacity: visible ? (i === 0 ? 0.9 : i === 1 ? 0.5 : 0.2) : 0,
                animation: visible
                  ? `coverage-pulse ${cfg.pulseSpeed} ease-in-out ${i * 0.4}s infinite`
                  : 'none',
                transition: 'border-color 0.5s, opacity 0.5s',
              }}
            />
          );
        })}
        <div
          className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: cfg.dimColor, border: `2px solid ${cfg.color}` }}
        >
          {status === 'green' && (
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
              <circle cx="10" cy="5" r="2.5" />
              <path d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6" />
              <path d="M1 10c2.5-3 5.5-5 9-5s6.5 2 9 5" opacity="0.5" />
            </svg>
          )}
          {status === 'amber' && (
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
              <path d="M10 3L19 17H1z" />
              <line x1="10" y1="9" x2="10" y2="13" />
              <circle cx="10" cy="15" r="0.8" fill="white" />
            </svg>
          )}
          {status === 'red' && (
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.8" className="w-5 h-5">
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          )}
        </div>
      </div>

      {/* Labels */}
      <div className="text-left flex-1">
        <div
          className="font-black tracking-[0.12em] leading-none mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px', color: cfg.color }}
        >
          {cfg.label}
        </div>
        <div className="text-[#C0C0CC] text-xs leading-snug">{cfg.sub}</div>
        <div
          className="mt-1.5 flex items-center gap-3"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
        >
          <span style={{ color: devices > 0 ? '#8A8A9A' : '#5A5A6A' }}>
            {devices === 0 ? 'No devices' : `${devices} devices`}
          </span>
          {hops && (
            <>
              <span className="text-[#3A3A50]">·</span>
              <span className="text-[#8A8A9A]">{hops}</span>
            </>
          )}
        </div>
      </div>
    </button>
  );
}
