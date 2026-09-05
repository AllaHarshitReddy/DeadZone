interface Props {
  onSelect: (role: 'civilian' | 'responder') => void;
}

export default function RoleSelect({ onSelect }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-8" style={{ background: '#0A0A0E' }}>
      <div className="text-center mb-4">
        <div
          className="text-[#F0F0F6] font-black tracking-[0.2em] mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '36px' }}
        >
          SANKAT SETU
        </div>
        <div
          className="text-[#5A5A6A] tracking-[0.25em] uppercase"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
        >
          संकट सेतु — Disaster Bridge
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <button
          onClick={() => onSelect('civilian')}
          className="group w-full rounded-2xl border border-[#2A2A38] hover:border-[#DC2626] transition-all duration-200 p-6 text-left"
          style={{ background: '#111116' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: '#1C1C22' }}
            >
              🆘
            </div>
            <div>
              <div
                className="text-[#F0F0F6] font-bold tracking-wide mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '26px' }}
              >
                मुझे मदद चाहिए
              </div>
              <div className="text-[#8A8A9A] text-sm leading-snug">
                I need help — Send SOS, share location, track rescue status
              </div>
            </div>
          </div>
          <div
            className="mt-4 w-full rounded-xl py-3 text-center font-bold tracking-widest text-white transition-colors"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '18px',
              background: '#DC2626',
              letterSpacing: '0.1em',
            }}
          >
            CIVILIAN — I NEED HELP
          </div>
        </button>

        <button
          onClick={() => onSelect('responder')}
          className="group w-full rounded-2xl border border-[#2A2A38] hover:border-[#EA580C] transition-all duration-200 p-6 text-left"
          style={{ background: '#111116' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: '#1C1C22' }}
            >
              🚨
            </div>
            <div>
              <div
                className="text-[#F0F0F6] font-bold tracking-wide mb-1"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '26px' }}
              >
                मैं बचावकर्ता हूं
              </div>
              <div className="text-[#8A8A9A] text-sm leading-snug">
                I am a responder — Command post, triage, coordinate rescue teams
              </div>
            </div>
          </div>
          <div
            className="mt-4 w-full rounded-xl py-3 text-center font-bold tracking-widest text-white transition-colors"
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '18px',
              background: '#EA580C',
              letterSpacing: '0.1em',
            }}
          >
            RESPONDER — COMMAND POST
          </div>
        </button>
      </div>

      <div
        className="text-[#3A3A50] text-center"
        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.08em' }}
      >
        MESH ONLY — NO CELLULAR REQUIRED
      </div>
    </div>
  );
}
