import { useEffect, useRef, useState } from 'react';
import type { CoverageStatus } from '../../data/mockData';
import { COVERAGE_DEVICES } from '../../data/mockData';

interface Props {
  coverageStatus: CoverageStatus;
  relayedCount: number;
  sosPending: boolean;
  showToast: boolean;
  userName: string;
  onSOS: () => void;
  onCoverageLost: () => void;
  onNearbyMesh: () => void;
  onProfile: () => void;
  onDismissToast: () => void;
  onGuideBack: () => void;
}

/* ── SOS button variants ── */
const VARIANT = {
  red: {
    color: '#E5484D',
    label: 'Send now',
    sub: 'Tap once — fires immediately',
    holdMs: 0,
    tapThreshold: 1,
  },
  amber: {
    color: '#F5A524',
    label: 'SOS',
    sub: 'Hold 2s or tap twice',
    holdMs: 2000,
    tapThreshold: 2,
  },
  green: {
    color: '#30A46C',
    label: 'SOS',
    sub: 'Hold 2s or tap three times',
    holdMs: 2000,
    tapThreshold: 3,
  },
} as const;

const RADIUS = 106;
const CIRC = 2 * Math.PI * RADIUS;

function SOSButton({ coverage, onFire }: { coverage: CoverageStatus; onFire: () => void }) {
  const v = VARIANT[coverage];
  const [holdProgress, setHoldProgress] = useState(0);
  const [tapCount, setTapCount] = useState(0);
  const [holding, setHolding] = useState(false);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tapResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const clear = () => {
    if (holdRef.current) clearInterval(holdRef.current);
    holdRef.current = null;
  };

  const fire = () => {
    if (firedRef.current) return;
    firedRef.current = true;
    clear();
    setHoldProgress(0);
    setHolding(false);
    setTapCount(0);
    onFire();
  };

  const handleDown = () => {
    if (coverage === 'red') { fire(); return; }
    firedRef.current = false;
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (tapResetRef.current) clearTimeout(tapResetRef.current);
    tapResetRef.current = setTimeout(() => setTapCount(0), 1200);
    if (newCount >= v.tapThreshold) { fire(); return; }
    setHolding(true);
    const start = Date.now();
    holdRef.current = setInterval(() => {
      const p = Math.min((Date.now() - start) / v.holdMs, 1);
      setHoldProgress(p);
      if (p >= 1) fire();
    }, 30);
  };

  const handleUp = () => {
    clear();
    setHolding(false);
    setHoldProgress(0);
  };

  useEffect(() => () => {
    clear();
    if (tapResetRef.current) clearTimeout(tapResetRef.current);
  }, []);

  const dashOffset = CIRC - CIRC * holdProgress;
  const tapIndicators = Array.from({ length: v.tapThreshold }, (_, i) => i < tapCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      {/* Ring + disc */}
      <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Thin SVG progress ring */}
        <svg
          style={{ position: 'absolute', inset: 0, width: 240, height: 240 }}
          viewBox="0 0 240 240"
        >
          {/* Track */}
          <circle cx="120" cy="120" r={RADIUS} fill="none" stroke="#243044" strokeWidth="2" />
          {/* Progress */}
          {(holding || holdProgress > 0) && (
            <circle
              cx="120" cy="120" r={RADIUS}
              fill="none"
              stroke={v.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 120 120)"
              style={{ transition: 'stroke-dashoffset 30ms linear' }}
            />
          )}
        </svg>

        {/* Flat solid disc */}
        <button
          onPointerDown={handleDown}
          onPointerUp={handleUp}
          onPointerLeave={handleUp}
          style={{
            width: 212,
            height: 212,
            borderRadius: '50%',
            background: v.color,
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transform: holding ? 'scale(0.97)' : 'scale(1)',
            transition: 'transform 0.1s',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: coverage === 'red' ? '22px' : '36px',
              fontWeight: 600,
              color: coverage === 'amber' ? '#0B1220' : '#ffffff',
              lineHeight: 1,
            }}
          >
            {v.label}
          </span>
          {holding && (
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '24px',
                fontWeight: 500,
                color: coverage === 'amber' ? '#0B1220' : '#ffffff',
                marginTop: 6,
              }}
            >
              {Math.ceil((1 - holdProgress) * (v.holdMs / 1000))}
            </span>
          )}
        </button>
      </div>

      {/* Caption */}
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#8A97AC', textAlign: 'center' }}>
        {v.sub}
      </p>

      {/* Tap pips */}
      {v.tapThreshold > 1 && (
        <div style={{ display: 'flex', gap: 8 }}>
          {tapIndicators.map((filled, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: filled ? v.color : '#243044',
                transition: 'background 0.15s',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Weakening toast ── */
function WeakeningToast({ onDismiss, onGuideBack }: { onDismiss: () => void; onGuideBack: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        background: '#131C2E',
        border: '1px solid #243044',
        borderLeft: '4px solid #F5A524',
        borderRadius: 6,
        padding: '12px 16px',
        zIndex: 10,
      }}
    >
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#E6EAF2', fontWeight: 500, marginBottom: 2 }}>
        Signal weakening — 3 devices left in range.
      </p>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC', marginBottom: 12 }}>
        You are moving away from the relay area.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onGuideBack}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            fontWeight: 500,
            color: '#F5A524',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Guide me back
        </button>
        <button
          onClick={onDismiss}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#8A97AC',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export default function HomeScreen({
  coverageStatus,
  relayedCount,
  sosPending,
  showToast,
  userName,
  onSOS,
  onCoverageLost,
  onNearbyMesh,
  onProfile,
  onDismissToast,
  onGuideBack,
}: Props) {
  const devices = COVERAGE_DEVICES[coverageStatus];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0B1220' }}>
      {/* Top bar */}
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid #243044',
          flexShrink: 0,
        }}
      >
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', fontWeight: 600, color: '#E6EAF2' }}>
          DeadZone SOS
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {relayedCount > 0 && (
            <button
              onClick={onNearbyMesh}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 6,
                background: '#22D3EE10',
                border: '1px solid #22D3EE30',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: '#22D3EE',
                cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="#22D3EE" strokeWidth="1.5" width="14" height="14">
                <circle cx="8" cy="8" r="3" />
                <path d="M2 8h2M12 8h2M8 2v2M8 12v2" />
              </svg>
              Relaying {relayedCount}
            </button>
          )}
          <button
            onClick={onProfile}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#22D3EE15',
              border: '1px solid #22D3EE44',
              color: '#22D3EE',
              fontFamily: "'Inter', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {userName.charAt(0).toUpperCase()}
          </button>
        </div>
      </div>

      {/* Toast zone */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {showToast && (
          <WeakeningToast onDismiss={onDismissToast} onGuideBack={onGuideBack} />
        )}
      </div>

      {/* SOS button — centred in remaining space */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
          padding: '0 20px',
        }}
      >
        <SOSButton coverage={coverageStatus} onFire={onSOS} />

        {/* Queued SOS card */}
        {sosPending && (
          <div
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 6,
              background: '#2D1A00',
              border: '1px solid #F5A524',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="#F5A524" strokeWidth="1.5" width="18" height="18" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="10" cy="10" r="8" />
              <path d="M10 6v4l2.5 2.5" strokeLinecap="round" />
            </svg>
            <div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: '#F5A524' }}>
                1 SOS queued
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC', marginTop: 2 }}>
                Waiting for a relay — will send automatically
              </p>
              <button
                onClick={onGuideBack}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '13px',
                  color: '#F5A524',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  marginTop: 8,
                  cursor: 'pointer',
                }}
              >
                Guide me back →
              </button>
            </div>
          </div>
        )}

        {/* Coverage-lost hint */}
        {coverageStatus === 'red' && (
          <button
            onClick={onCoverageLost}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 6,
              background: '#131C2E',
              border: '1px solid #243044',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
            }}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="#8A97AC" strokeWidth="1.5" width="18" height="18" style={{ flexShrink: 0 }}>
              <path d="M10 3l7 14H3z" strokeLinejoin="round" />
              <line x1="10" y1="9" x2="10" y2="12" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8A97AC' }}>
              Find nearest mesh node →
            </span>
          </button>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid #243044',
        }}
      >
        <button
          onClick={onNearbyMesh}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: '#4A5A78',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {devices === 0 ? 'No devices nearby' : `${devices} devices nearby`}
        </button>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#4A5A78' }}>
          Bengaluru
        </span>
      </div>
    </div>
  );
}
