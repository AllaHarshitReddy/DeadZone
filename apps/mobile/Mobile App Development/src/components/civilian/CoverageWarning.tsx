interface Props {
  onBack: () => void;
}

export default function CoverageWarning({ onBack }: Props) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-between px-6 py-8"
      style={{ background: '#0A0A0E' }}
    >
      <div />

      <div className="flex flex-col items-center gap-8 w-full">
        {/* Warning icon */}
        <div
          className="w-28 h-28 rounded-3xl flex items-center justify-center"
          style={{
            background: '#7F1D1D',
            border: '3px solid #DC2626',
            boxShadow: '0 0 32px rgba(220,38,38,0.4)',
          }}
        >
          <span style={{ fontSize: '56px' }}>⚠️</span>
        </div>

        <div className="text-center">
          <div
            className="text-[#DC2626] font-black tracking-[0.08em] mb-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '32px', lineHeight: 1.1 }}
          >
            YOU ARE LEAVING<br />RELAY COVERAGE
          </div>
          <div className="text-[#8A8A9A] text-base leading-relaxed">
            Your SOS cannot reach a responder from here. Move back toward the last connected point.
          </div>
        </div>

        {/* Last point info */}
        <div
          className="w-full rounded-2xl p-5 border border-[#DC2626]"
          style={{ background: '#1C0A0A' }}
        >
          <div
            className="text-[#5A5A6A] tracking-widest mb-3"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
          >
            LAST CONNECTED POINT
          </div>
          <div
            className="text-[#F0F0F6] font-bold mb-1"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px' }}
          >
            340 m back
          </div>
          <div className="text-[#8A8A9A] text-sm">Majestic Bus Stand, Bengaluru</div>
        </div>

        {/* Direction arrow */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="text-[#5A5A6A] tracking-widest"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
          >
            RETURN BEARING
          </div>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-[#DC2626]"
            style={{ background: '#18181F' }}
          >
            <span
              className="inline-block text-5xl"
              style={{ transform: 'rotate(30deg)', filter: 'hue-rotate(0deg)' }}
            >
              ↑
            </span>
          </div>
          <div
            className="text-[#8A8A9A]"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}
          >
            210° SW — Majestic Bus Stand
          </div>
        </div>
      </div>

      {/* Guide me back — big bottom button */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={onBack}
          className="w-full py-5 rounded-2xl font-black tracking-[0.1em] text-white"
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '22px',
            background: 'linear-gradient(135deg, #EA580C, #C2410C)',
            boxShadow: '0 8px 24px rgba(234,88,12,0.35)',
          }}
        >
          ← GUIDE ME BACK
        </button>
        <button
          onClick={onBack}
          className="w-full py-4 rounded-2xl font-bold tracking-widest text-[#8A8A9A] border border-[#2A2A38]"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px', background: '#111116' }}
        >
          I UNDERSTAND — STAY HERE
        </button>
      </div>
    </div>
  );
}
