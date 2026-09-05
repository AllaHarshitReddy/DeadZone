import { useEffect, useRef, useState } from 'react';

interface Props {
  onBack: () => void;
}

type Phase = 'queued' | 'relayed' | 'delivered' | 'cancelled';

const PHASES: Exclude<Phase, 'cancelled'>[] = ['queued', 'relayed', 'delivered'];
const PHASE_DELAYS = [0, 2400, 5200];

const PHASE_CONFIG = {
  queued: {
    title: 'QUEUED',
    detail: 'Waiting for a nearby relay device',
    color: '#D97706',
    bg: '#2A1A00',
    border: '#78350F',
  },
  relayed: {
    title: 'RELAYED',
    detail: 'Passed to a relay — moving toward responder',
    color: '#EA580C',
    bg: '#2A1000',
    border: '#7C2D12',
  },
  delivered: {
    title: 'DELIVERED',
    detail: 'A responder has received your alert',
    color: '#16A34A',
    bg: '#0A2014',
    border: '#14532D',
  },
  cancelled: {
    title: 'MARKED SAFE',
    detail: 'Responders have been notified you are safe',
    color: '#16A34A',
    bg: '#0A2014',
    border: '#14532D',
  },
};

const HOP_NODES = [
  {
    label: 'YOUR\nPHONE',
    Icon: () => (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <rect x="5" y="2" width="10" height="16" rx="2" />
        <circle cx="10" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'RELAY\nDEVICE',
    Icon: () => (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <circle cx="10" cy="10" r="3" />
        <path d="M4 4.5C5.7 2.8 7.7 2 10 2s4.3.8 6 2.5" />
        <path d="M6.5 7C7.5 6 8.7 5.5 10 5.5s2.5.5 3.5 1.5" />
        <path d="M1.5 1.5C4 -1 7 -1.5 10 -1.5" opacity="0" />
      </svg>
    ),
  },
  {
    label: 'RESPONDER',
    Icon: () => (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path d="M10 2L2 7v11h16V7z" strokeLinejoin="round" />
        <path d="M8 18v-5h4v5" />
        <path d="M9 7h2M9 10h2" strokeLinecap="round" />
      </svg>
    ),
  },
];

function Elapsed({ startTime }: { startTime: number }) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSeconds(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return <>{m > 0 ? `${m}m ` : ''}{s}s ago</>;
}

export default function SOSStatus({ onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('queued');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (phase === 'cancelled') return;
    const timers = PHASE_DELAYS.slice(1).map((delay, i) =>
      setTimeout(() => {
        setPhase(prev => prev === 'cancelled' ? 'cancelled' : PHASES[i + 1]);
      }, delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const phaseIdx = PHASES.indexOf(phase as Exclude<Phase, 'cancelled'>);
  const cfg = PHASE_CONFIG[phase];
  const isCancelled = phase === 'cancelled';

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0A0A0E' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2A38] flex-shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#8A8A9A]"
          style={{ background: '#18181F' }}
        >
          ←
        </button>
        <div className="flex-1">
          <div
            className="text-[#F0F0F6] font-black tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px' }}
          >
            SOS STATUS
          </div>
          <div
            className="text-[#5A5A6A]"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
          >
            Sent · <Elapsed startTime={startTime.current} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">

        {/* Current stage — large */}
        <div
          className="rounded-2xl p-5 border-2 text-center transition-all duration-500"
          style={{ background: cfg.bg, borderColor: cfg.border }}
        >
          <div
            className="font-black tracking-[0.16em] mb-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '36px', color: cfg.color }}
          >
            {cfg.title}
          </div>
          <div className="text-[#C0C0CC] text-base">{cfg.detail}</div>
        </div>

        {/* Hop path */}
        {!isCancelled && (
          <div className="flex flex-col items-center gap-2">
            <div
              className="text-[#5A5A6A] tracking-[0.2em] text-xs"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              MESSAGE PATH
            </div>

            <div className="flex items-center w-full justify-center">
              {HOP_NODES.map((node, i) => {
                const reached = i <= phaseIdx;
                const lineReached = i < phaseIdx;
                const isCurrent = i === phaseIdx;

                return (
                  <div key={i} className="flex items-center">
                    {/* Node */}
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-700"
                        style={{
                          background: reached ? '#1C1C22' : '#111116',
                          borderColor: reached ? (isCurrent ? cfg.color : '#16A34A') : '#2A2A38',
                          color: reached ? (isCurrent ? cfg.color : '#16A34A') : '#3A3A50',
                          boxShadow: reached ? `0 0 16px ${isCurrent ? cfg.color : '#16A34A'}40` : 'none',
                        }}
                      >
                        <node.Icon />
                      </div>
                      <div
                        className="text-center whitespace-pre-line leading-tight"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '8px',
                          color: reached ? (isCurrent ? cfg.color : '#16A34A') : '#3A3A50',
                          letterSpacing: '0.06em',
                          maxWidth: '56px',
                        }}
                      >
                        {node.label}
                      </div>
                    </div>

                    {/* Connector */}
                    {i < HOP_NODES.length - 1 && (
                      <div className="relative flex items-center" style={{ width: 60, height: 4, margin: '0 -1px', marginBottom: '18px' }}>
                        <div className="absolute inset-0 rounded-full" style={{ background: '#2A2A38' }} />
                        <div
                          className="absolute left-0 top-0 bottom-0 rounded-full transition-all"
                          style={{
                            background: '#16A34A',
                            width: lineReached ? '100%' : '0%',
                            transition: 'width 0.8s ease-in-out',
                            boxShadow: lineReached ? '0 0 8px rgba(22,163,74,0.6)' : 'none',
                          }}
                        />
                        {!lineReached && i === phaseIdx && (
                          <div
                            className="absolute w-2.5 h-2.5 rounded-full"
                            style={{
                              background: cfg.color,
                              boxShadow: `0 0 8px ${cfg.color}CC`,
                              top: '-3px',
                              left: '35%',
                              animation: 'coverage-pulse 1s ease-in-out infinite',
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stage pills — all three visible */}
        {!isCancelled && (
          <div className="flex gap-2">
            {PHASES.map((p, i) => {
              const done = phaseIdx > i;
              const active = phaseIdx === i;
              const color = PHASE_CONFIG[p].color;
              return (
                <div
                  key={p}
                  className="flex-1 py-2.5 rounded-xl border text-center transition-all duration-500"
                  style={{
                    background: active ? PHASE_CONFIG[p].bg : done ? '#111116' : '#0D0D12',
                    borderColor: active ? color : done ? '#2A3A2A' : '#2A2A38',
                  }}
                >
                  <div
                    className="font-black tracking-wider"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '12px',
                      color: active ? color : done ? '#16A34A' : '#3A3A50',
                    }}
                  >
                    {done ? '✓ ' : ''}{p.toUpperCase()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SOS details */}
        <div
          className="rounded-xl p-4 border border-[#2A2A38]"
          style={{ background: '#111116' }}
        >
          <div
            className="text-[#5A5A6A] tracking-widest mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
          >
            YOUR ALERT
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#8A8A9A]">Location</span>
              <span className="text-[#F0F0F6]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
                12.9716°N 77.5946°E
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A8A9A]">Area</span>
              <span className="text-[#F0F0F6]">Bengaluru Central</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A8A9A]">Severity</span>
              <span style={{ color: '#DC2626', fontWeight: 600 }}>CRITICAL</span>
            </div>
          </div>
        </div>

        {/* Delivered confirmation */}
        {phase === 'delivered' && (
          <div
            className="rounded-2xl py-4 px-5 border border-[#16A34A] text-center"
            style={{ background: '#0A2014' }}
          >
            <div
              className="text-[#16A34A] font-black tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px' }}
            >
              ✓ HELP IS ON THE WAY
            </div>
            <div className="text-[#C0C0CC] text-sm mt-1">Stay where you are if it is safe to do so</div>
          </div>
        )}

        {/* Cancel confirmation overlay */}
        {confirmCancel && (
          <div
            className="rounded-2xl p-5 border-2 border-[#DC2626]"
            style={{ background: '#200A0A' }}
          >
            <div
              className="text-[#F0F0F6] font-bold mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px' }}
            >
              Stand down SOS?
            </div>
            <p className="text-[#8A8A9A] text-sm mb-4">
              Responders will be notified that you are safe. Only cancel if the emergency is resolved.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setPhase('cancelled'); setConfirmCancel(false); }}
                className="flex-1 py-3 rounded-xl font-black tracking-widest text-white"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', background: '#16A34A' }}
              >
                YES, I'M SAFE
              </button>
              <button
                onClick={() => setConfirmCancel(false)}
                className="flex-1 py-3 rounded-xl font-bold tracking-widest text-[#8A8A9A] border border-[#2A2A38]"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', background: '#111116' }}
              >
                KEEP ACTIVE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 pb-5 pt-3 flex flex-col gap-2 flex-shrink-0" style={{ background: '#0A0A0E' }}>
        {!isCancelled && !confirmCancel && (
          <button
            onClick={() => setConfirmCancel(true)}
            className="w-full py-3.5 rounded-2xl border border-[#2A2A38] font-bold tracking-widest text-[#8A8A9A] transition-colors hover:border-[#16A34A] hover:text-[#16A34A]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', background: '#111116' }}
          >
            ✓ I'M SAFE NOW — STAND DOWN
          </button>
        )}
        {isCancelled && (
          <div
            className="w-full py-3.5 rounded-2xl border border-[#16A34A] text-center font-bold tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', color: '#16A34A', background: '#0A2014' }}
          >
            ✓ MARKED SAFE — RESPONDERS NOTIFIED
          </div>
        )}
        <button
          onClick={onBack}
          className="w-full py-3.5 rounded-2xl border border-[#2A2A38] font-bold tracking-widest text-[#5A5A6A]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', background: '#111116' }}
        >
          BACK TO HOME
        </button>
      </div>
    </div>
  );
}
