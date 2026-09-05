import { useState } from 'react';
import type { NeedType } from '../../data/mockData';

interface Props {
  onBack: () => void;
  onSend: () => void;
}

/* ── SVG icons ── */
function IconMedical({ selected }: { selected: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <line x1="12" y1="7" x2="12" y2="17" />
      <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
  );
}
function IconRescue() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-7 h-7">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
      <line x1="9" y1="9" x2="5" y2="5" />
      <line x1="15" y1="9" x2="19" y2="5" />
      <line x1="15" y1="15" x2="19" y2="19" />
      <line x1="9" y1="15" x2="5" y2="19" />
    </svg>
  );
}
function IconWater() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M12 2C12 2 5 10 5 15a7 7 0 0014 0c0-5-7-13-7-13z" />
    </svg>
  );
}
function IconShelter() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
      <path d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9,21 9,13 15,13 15,21" />
    </svg>
  );
}

const NEEDS: { type: NeedType; label: string; Icon: React.ComponentType<{ selected: boolean }> }[] = [
  { type: 'medical', label: 'Medical', Icon: IconMedical },
  { type: 'rescue', label: 'Rescue', Icon: IconRescue },
  { type: 'food_water', label: 'Food/Water', Icon: IconWater as React.ComponentType<{ selected: boolean }> },
  { type: 'shelter', label: 'Shelter', Icon: IconShelter as React.ComponentType<{ selected: boolean }> },
];

const SEVERITY = [
  { value: 'critical', label: 'CRITICAL', sub: 'Life-threatening', color: '#DC2626', bg: '#3D0A0A' },
  { value: 'moderate', label: 'MODERATE', sub: 'Injured but stable', color: '#D97706', bg: '#3D2000' },
  { value: 'minor', label: 'MINOR', sub: 'Safe, need assistance', color: '#16A34A', bg: '#0A2A14' },
];

export default function SOSCompose({ onBack, onSend }: Props) {
  const [people, setPeople] = useState(1);
  const [needs, setNeeds] = useState<Set<NeedType>>(new Set());
  const [severity, setSeverity] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');

  const toggleNeed = (t: NeedType) =>
    setNeeds(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });

  const canSend = needs.size > 0 && severity !== null;

  const missingHint = !canSend
    ? needs.size === 0 && !severity
      ? 'Select what you need and how serious'
      : needs.size === 0
      ? 'Select what you need'
      : 'Select how serious'
    : null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0A0A0E' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2A38] flex-shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[#8A8A9A] hover:text-white transition-colors flex-shrink-0"
          style={{ background: '#18181F' }}
        >
          ←
        </button>
        <div>
          <div
            className="text-[#F0F0F6] font-black tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px' }}
          >
            SEND SOS
          </div>
          <div
            className="text-[#8A8A9A]"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
          >
            Bengaluru · auto-located
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">

        {/* People count — compact row */}
        <div>
          <div
            className="text-[#8A8A9A] font-bold tracking-widest mb-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px' }}
          >
            HOW MANY PEOPLE?
          </div>
          <div className="flex items-center gap-5 justify-center py-1">
            <button
              onClick={() => setPeople(p => Math.max(1, p - 1))}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border border-[#2A2A38]"
              style={{ background: '#18181F', fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              −
            </button>
            <span
              className="text-[#F0F0F6] font-black w-14 text-center"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '48px', lineHeight: 1 }}
            >
              {people}
            </span>
            <button
              onClick={() => setPeople(p => Math.min(99, p + 1))}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border border-[#2A2A38]"
              style={{ background: '#18181F', fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              +
            </button>
          </div>
        </div>

        {/* Needs — 2×2 compact grid */}
        <div>
          <div
            className="text-[#8A8A9A] font-bold tracking-widest mb-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px' }}
          >
            WHAT DO YOU NEED?
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {NEEDS.map(({ type, label, Icon }) => {
              const selected = needs.has(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleNeed(type)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150"
                  style={{
                    background: selected ? '#1C1C22' : '#111116',
                    borderColor: selected ? '#EA580C' : '#2A2A38',
                    color: selected ? '#EA580C' : '#8A8A9A',
                  }}
                >
                  <Icon selected={selected} />
                  <span
                    className="font-bold tracking-wide"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px' }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Severity — compact rows with semantic color */}
        <div>
          <div
            className="text-[#8A8A9A] font-bold tracking-widest mb-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px' }}
          >
            HOW SERIOUS?
          </div>
          <div className="flex flex-col gap-2">
            {SEVERITY.map(({ value, label, sub, color, bg }) => {
              const selected = severity === value;
              return (
                <button
                  key={value}
                  onClick={() => setSeverity(value)}
                  className="flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150"
                  style={{
                    background: selected ? bg : '#111116',
                    borderColor: selected ? color : '#2A2A38',
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 border-2 transition-all"
                    style={{
                      borderColor: color,
                      background: selected ? color : 'transparent',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className="font-black tracking-wide"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '19px', color: selected ? color : '#F0F0F6' }}
                    >
                      {label}
                    </span>
                    <span className="text-[#8A8A9A] text-sm ml-2">{sub}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional note — collapsed by default */}
        <button
          onClick={() => setShowNote(v => !v)}
          className="flex items-center gap-2 text-[#5A5A6A] hover:text-[#8A8A9A] transition-colors text-sm"
        >
          <span className="text-base">{showNote ? '▾' : '▸'}</span>
          Add note (optional)
        </button>

        {showNote && (
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Describe situation briefly..."
            autoFocus
            className="w-full rounded-xl p-3 text-[#F0F0F6] placeholder-[#3A3A50] resize-none border border-[#2A2A38] outline-none focus:border-[#EA580C] transition-colors"
            style={{ background: '#111116', fontFamily: "'Inter', sans-serif", fontSize: '15px', minHeight: '72px' }}
          />
        )}

        {/* Location confirmation — below fold, read-only */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#2A2A38]"
          style={{ background: '#111116' }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="#5A5A6A" strokeWidth="1.8" className="w-5 h-5 flex-shrink-0">
            <circle cx="10" cy="8" r="3" />
            <path d="M10 2C6.7 2 4 4.7 4 8c0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6z" />
          </svg>
          <div>
            <div className="text-[#8A8A9A] text-xs mb-0.5">Auto-detected</div>
            <div
              className="text-[#F0F0F6]"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
            >
              12.9716°N 77.5946°E · Bengaluru
            </div>
          </div>
        </div>
      </div>

      {/* Send button — fixed at bottom */}
      <div className="px-4 pb-5 pt-3 flex-shrink-0" style={{ background: '#0A0A0E' }}>
        {missingHint && (
          <div
            className="text-center mb-2"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#5A5A6A' }}
          >
            {missingHint}
          </div>
        )}
        <button
          onClick={canSend ? onSend : undefined}
          aria-disabled={!canSend}
          className="w-full py-5 rounded-2xl font-black tracking-[0.12em] transition-all duration-200"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '22px',
            background: canSend ? 'linear-gradient(135deg, #DC2626, #B91C1C)' : '#18181F',
            color: canSend ? '#FFFFFF' : '#444450',
            cursor: canSend ? 'pointer' : 'default',
            border: canSend ? 'none' : '1px solid #2A2A38',
            boxShadow: canSend ? '0 8px 24px rgba(220,38,38,0.35)' : 'none',
          }}
        >
          {canSend ? 'SEND SOS NOW' : 'SEND SOS'}
        </button>
      </div>
    </div>
  );
}
