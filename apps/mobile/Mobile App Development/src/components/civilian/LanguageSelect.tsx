import TopBar from '../ui/TopBar';

interface Props {
  current: string;
  onSelect: (lang: string) => void;
  onBack: () => void;
}

const LANGUAGES = [
  { code: 'en', native: 'English',   roman: 'English' },
  { code: 'hi', native: 'हिन्दी',    roman: 'Hindi' },
  { code: 'kn', native: 'ಕನ್ನಡ',     roman: 'Kannada' },
  { code: 'ta', native: 'தமிழ்',     roman: 'Tamil' },
  { code: 'te', native: 'తెలుగు',    roman: 'Telugu' },
  { code: 'mr', native: 'मराठी',     roman: 'Marathi' },
  { code: 'bn', native: 'বাংলা',     roman: 'Bengali' },
  { code: 'gu', native: 'ગુજરાતી',   roman: 'Gujarati' },
];

export default function LanguageSelect({ current, onSelect, onBack }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0B1220' }}>
      <TopBar title="Language" onBack={onBack} />

      <div
        className="px-4 py-3 mx-4 mt-4 rounded"
        style={{ background: '#131C2E', border: '1px solid #22D3EE44' }}
      >
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8896B0', lineHeight: 1.5 }}>
          The entire app switches to the selected language, including all alerts and button labels.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {LANGUAGES.map(lang => {
          const selected = current === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => onSelect(lang.code)}
              className="w-full flex items-center justify-between px-4 mb-2"
              style={{
                height: 60,
                background: selected ? '#0D2228' : '#131C2E',
                border: `1px solid ${selected ? '#22D3EE' : '#243044'}`,
                borderRadius: 6,
              }}
            >
              <div className="text-left">
                <div
                  className="font-semibold"
                  style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', color: selected ? '#22D3EE' : '#F0F4FF' }}
                >
                  {lang.native}
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#4A5A78' }}>
                  {lang.roman}
                </div>
              </div>

              {/* Radio */}
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  border: `2px solid ${selected ? '#22D3EE' : '#3A4A68'}`,
                  background: selected ? '#22D3EE' : 'transparent',
                }}
              >
                {selected && (
                  <div className="w-2 h-2 rounded-full" style={{ background: '#0B1220' }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Hindi home preview */}
      <div
        className="mx-4 mb-4 rounded overflow-hidden"
        style={{ border: '1px solid #243044' }}
      >
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ background: '#1A2540', borderBottom: '1px solid #243044' }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
            <circle cx="8" cy="8" r="6" stroke="#22D3EE" strokeWidth="1.5" />
            <path d="M8 5v3l2 1.5" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#22D3EE' }}>
            Preview — Hindi (हिन्दी)
          </span>
        </div>

        {/* Mini home screen in Hindi */}
        <div
          className="flex flex-col items-center py-5 gap-3"
          style={{ background: '#0B1220' }}
        >
          <div
            className="w-24 h-24 rounded-full flex flex-col items-center justify-center"
            style={{ background: '#52C41A22', border: '3px solid #52C41A' }}
          >
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#52C41A', fontWeight: 700 }}>
              एसओएस
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', color: '#52C41A66', marginTop: 2 }}>
              2 सेकंड दबाएं
            </span>
          </div>

          <div className="text-center px-4">
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#52C41A', fontWeight: 600 }}>
              मजबूत कनेक्शन
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#4A5A78', marginTop: 2 }}>
              14 डिवाइस · 1 रिले
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
