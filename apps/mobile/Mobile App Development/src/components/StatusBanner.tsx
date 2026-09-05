import { useEffect, useRef, useState } from 'react';
import type { NetworkStatus, CoverageStatus } from '../data/mockData';

interface Props {
  internetStatus: NetworkStatus;
  coverageStatus: CoverageStatus;
  onToggle: () => void;
}

function meshLabel(coverage: CoverageStatus): string {
  if (coverage === 'green') return 'MESH: CONNECTED';
  if (coverage === 'amber') return 'MESH: WEAK LINK';
  return 'MESH: NO PATH';
}

export default function StatusBanner({ internetStatus, coverageStatus, onToggle }: Props) {
  const [flashing, setFlashing] = useState(false);
  const prevRef = useRef(`${internetStatus}-${coverageStatus}`);

  useEffect(() => {
    const key = `${internetStatus}-${coverageStatus}`;
    if (key !== prevRef.current) {
      prevRef.current = key;
      setFlashing(true);
      const t = setTimeout(() => setFlashing(false), 1200);
      return () => clearTimeout(t);
    }
  }, [internetStatus, coverageStatus]);

  const online = internetStatus === 'online';
  const bg = online ? '#16A34A' : '#DC2626';

  const line1 = online ? 'INTERNET: ONLINE' : 'INTERNET: OFFLINE';
  const line2 = online ? 'SYNCING' : meshLabel(coverageStatus);

  return (
    <div
      className={`w-full flex-shrink-0 select-none z-50 transition-colors duration-500 ${flashing ? 'animate-banner-flash' : ''}`}
      style={{ background: bg }}
    >
      {/* Safe-area spacer — fills behind Dynamic Island / notch */}
      <div style={{ height: 'env(safe-area-inset-top, 0px)' }} />

      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-start gap-3 min-w-0">
          <span
            className="mt-1 inline-block w-3 h-3 rounded-full bg-white flex-shrink-0"
            style={{
              boxShadow: '0 0 10px rgba(255,255,255,0.9)',
              animation: !online ? 'dot-blink 1.2s ease-in-out infinite' : 'none',
            }}
          />
          <div className="min-w-0">
            <div
              className="text-white font-black leading-tight tracking-[0.12em] whitespace-nowrap"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '19px' }}
            >
              {line1}
            </div>
            <div
              className="text-white/85 font-bold leading-tight tracking-[0.1em] whitespace-nowrap"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px' }}
            >
              {line2}
            </div>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="flex-shrink-0 ml-3 text-white/50 hover:text-white/90 transition-colors border border-white/25 hover:border-white/60 rounded px-2 py-1"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.1em' }}
          title="Toggle network state (demo)"
        >
          DEMO
        </button>
      </div>
    </div>
  );
}
