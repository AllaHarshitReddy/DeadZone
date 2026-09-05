interface Props {
  title?: string;
  onBack?: () => void;
  onProfile?: () => void;
  userName?: string;
}

function BackChevron() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export default function TopBar({ title, onBack, onProfile, userName = 'U' }: Props) {
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div
      className="w-full flex items-center justify-between px-2 flex-shrink-0"
      style={{ height: 52, background: '#0B1220', borderBottom: '1px solid #243044' }}
    >
      {/* Back — 44px touch target */}
      <div style={{ width: 44 }}>
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center text-[#8896B0] hover:text-[#F0F4FF] transition-colors"
            style={{ width: 44, height: 44 }}
          >
            <BackChevron />
          </button>
        )}
      </div>

      {/* Title */}
      <span
        className="font-semibold text-[#F0F4FF]"
        style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px' }}
      >
        {title ?? ''}
      </span>

      {/* Profile avatar */}
      <div style={{ width: 44 }}>
        {onProfile && (
          <button
            onClick={onProfile}
            className="flex items-center justify-center ml-auto"
            style={{ width: 44, height: 44 }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm"
              style={{ background: '#22D3EE22', border: '1.5px solid #22D3EE', color: '#22D3EE' }}
            >
              {initial}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
