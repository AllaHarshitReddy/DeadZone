import TopBar from '../ui/TopBar';

interface Props {
  onBack: () => void;
  onNext: (severity: 'critical' | 'urgent' | 'stable') => void;
  userName: string;
}

const OPTIONS = [
  {
    value: 'critical' as const,
    label: 'Critical',
    sub: 'Immediate threat to life',
    color: '#E5484D',
    bg: '#2D0808',
    border: '#E5484D',
    Icon: () => (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <circle cx="24" cy="24" r="22" stroke="#E5484D" strokeWidth="1.5" />
        <path d="M24 14v12M24 33v1" stroke="#E5484D" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'urgent' as const,
    label: 'Urgent',
    sub: 'Serious but not immediately life-threatening',
    color: '#F5A524',
    bg: '#2D1A00',
    border: '#F5A524',
    Icon: () => (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <path d="M24 5L43 39H5z" stroke="#F5A524" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M24 20v10M24 35v1" stroke="#F5A524" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    value: 'stable' as const,
    label: 'Stable',
    sub: 'Injured or stranded, not critical',
    color: '#30A46C',
    bg: '#0D2818',
    border: '#30A46C',
    Icon: () => (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <rect x="4" y="4" width="40" height="40" rx="6" stroke="#30A46C" strokeWidth="1.5" />
        <path d="M15 24l7 7 11-13" stroke="#30A46C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
] as const;

export default function SeverityStep({ onBack, onNext, userName }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0B1220' }}>
      <TopBar title="Step 1 of 3" onBack={onBack} onProfile={() => {}} userName={userName} />

      <div className="flex-1 flex flex-col justify-center px-4 gap-4 py-6">
        <div className="mb-2">
          <h2 className="font-bold text-[#E6EAF2]" style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px' }}>
            How serious is it?
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#8A97AC', marginTop: 4 }}>
            Choose the most accurate option. This sets your triage priority.
          </p>
        </div>

        {OPTIONS.map(({ value, label, sub, color, bg, border, Icon }) => (
          <button
            key={value}
            onClick={() => onNext(value)}
            className="w-full flex items-center gap-5 px-5 transition-all duration-150 active:scale-[0.98]"
            style={{
              height: 100,
              background: bg,
              border: `2px solid ${border}`,
              borderRadius: 6,
            }}
          >
            <Icon />
            <div className="text-left flex-1">
              <div
                className="font-bold"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', color }}
              >
                {label}
              </div>
              <div
                style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8896B0', marginTop: 3, lineHeight: 1.4 }}
              >
                {sub}
              </div>
            </div>
            <svg viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="2" className="w-5 h-5 flex-shrink-0" opacity="0.6">
              <polyline points="8 5 13 10 8 15" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
