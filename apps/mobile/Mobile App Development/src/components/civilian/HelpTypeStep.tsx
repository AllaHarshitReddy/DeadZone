import { useState } from 'react';
import TopBar from '../ui/TopBar';

interface Props {
  onBack: () => void;
  onNext: (types: string[]) => void;
  userName: string;
}

const TYPES = [
  {
    id: 'medical',
    label: 'Medical',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <line x1="12" y1="7" x2="12" y2="17" />
        <line x1="7" y1="12" x2="17" y2="12" />
      </svg>
    ),
  },
  {
    id: 'rescue',
    label: 'Rescue',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="4" />
        <line x1="9" y1="9" x2="5" y2="5" />
        <line x1="15" y1="9" x2="19" y2="5" />
        <line x1="15" y1="15" x2="19" y2="19" />
        <line x1="9" y1="15" x2="5" y2="19" />
      </svg>
    ),
  },
  {
    id: 'food_water',
    label: 'Food & Water',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6">
        <path d="M12 2c0 0-7 8-7 13a7 7 0 0014 0c0-5-7-13-7-13z" />
      </svg>
    ),
  },
  {
    id: 'shelter',
    label: 'Shelter',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,21 9,13 15,13 15,21" />
      </svg>
    ),
  },
  {
    id: 'fire',
    label: 'Fire',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z" />
      </svg>
    ),
  },
  {
    id: 'evacuation',
    label: 'Evacuation',
    Icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="12" cy="8" r="3" />
        <path d="M8 18v-4l4-2 4 2v4" />
        <path d="M17 18h4M3 18h4" />
        <path d="M19 15l2 3-2 3M5 15l-2 3 2 3" />
      </svg>
    ),
  },
];

export default function HelpTypeStep({ onBack, onNext, userName }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleContinue = () => onNext([...selected]);
  const noneSelected = selected.size === 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0B1220' }}>
      <TopBar title="Step 2 of 3" onBack={onBack} onProfile={() => {}} userName={userName} />

      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5">
        <div>
          <h2 className="font-bold text-[#F0F4FF]" style={{ fontFamily: "'Inter', sans-serif", fontSize: '22px' }}>
            What do you need?
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8896B0', marginTop: 4 }}>
            Optional — if nothing is selected, all types are sent to available responders.
          </p>
        </div>

        {/* All-types hint when none selected */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded"
          style={{
            background: noneSelected ? '#0D2228' : '#131C2E',
            border: `1px solid ${noneSelected ? '#22D3EE' : '#243044'}`,
            transition: 'all 0.2s',
          }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke={noneSelected ? '#22D3EE' : '#4A5A78'} strokeWidth="1.8" className="w-5 h-5 flex-shrink-0">
            <circle cx="10" cy="10" r="8" />
            <path d="M10 6v4h4" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: '13px', color: noneSelected ? '#22D3EE' : '#4A5A78', lineHeight: 1.4 }}>
            {noneSelected
              ? 'All help types will be sent — responders will see everything.'
              : `${selected.size} type${selected.size !== 1 ? 's' : ''} selected`}
          </p>
        </div>

        {/* Chips grid */}
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map(({ id, label, Icon }) => {
            const active = selected.has(id);
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                className="flex items-center gap-3 px-4 transition-all duration-150 active:scale-95"
                style={{
                  height: 60,
                  background: active ? '#22D3EE15' : '#131C2E',
                  border: `1.5px solid ${active ? '#22D3EE' : '#243044'}`,
                  borderRadius: 6,
                  color: active ? '#22D3EE' : '#8896B0',
                }}
              >
                <Icon />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: active ? 600 : 400 }}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Continue */}
      <div className="px-4 pb-6 pt-3 flex-shrink-0" style={{ borderTop: '1px solid #243044' }}>
        <button
          onClick={handleContinue}
          style={{
            width: '100%',
            height: 52,
            background: '#22D3EE',
            color: '#0B1220',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '16px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {noneSelected ? 'Continue — send all types' : `Continue with ${selected.size} selected`}
        </button>
      </div>
    </div>
  );
}
