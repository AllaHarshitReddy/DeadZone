import { useEffect, useRef, useState } from 'react';
import TopBar from '../ui/TopBar';

interface Props {
  severity: string;
  people: number;
  onBack: () => void;
  userName: string;
}

const STAGES = ['Sent', 'Relayed', 'Acknowledged', 'Dispatched', 'Arriving'] as const;

function Elapsed({ startMs }: { startMs: number }) {
  const [s, setS] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setS(Math.floor((Date.now() - startMs) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startMs]);
  const m = Math.floor(s / 60), sec = s % 60;
  return <>{m > 0 ? `${m}m ` : ''}{sec}s ago</>;
}

function ETA({ minutes }: { minutes: number }) {
  const [mins, setMins] = useState(minutes);
  useEffect(() => {
    const t = setInterval(() => setMins(m => Math.max(0, m - 1)), 60000);
    return () => clearInterval(t);
  }, []);
  if (mins === 0) return <>Arriving now</>;
  return <>{mins} min ETA</>;
}

export default function LiveTracking({ severity, people, onBack, userName }: Props) {
  const startMs = useRef(Date.now() - 8 * 60000).current; // simulate sent 8min ago
  const [stageIdx, setStageIdx] = useState(3); // Dispatched reached
  const severityColor = severity === 'critical' ? '#FF4D4F' : severity === 'urgent' ? '#FFA940' : '#52C41A';

  // Auto-advance to Arriving
  useEffect(() => {
    if (stageIdx < 4) {
      const t = setTimeout(() => setStageIdx(4), 8000);
      return () => clearTimeout(t);
    }
  }, [stageIdx]);

  // Team marker position along SVG path (0–1)
  const [teamPos, setTeamPos] = useState(0.35);
  useEffect(() => {
    const t = setInterval(() => setTeamPos(p => Math.min(p + 0.005, 0.82)), 300);
    return () => clearInterval(t);
  }, []);

  const PATH_D = 'M 40 310 C 100 280 180 260 220 220 C 260 180 290 150 330 100';
  const hopCount = 5;
  const etaMins = 4;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0B1220' }}>
      <TopBar title="Live Tracking" onBack={onBack} onProfile={() => {}} userName={userName} />

      <div className="flex-1 overflow-y-auto flex flex-col px-4 py-4 gap-4">
        {/* My SOS card */}
        <div
          className="px-4 py-4 rounded flex items-start gap-3"
          style={{ background: '#131C2E', border: `1px solid ${severityColor}44` }}
        >
          <div
            className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
            style={{ background: severityColor, boxShadow: `0 0 8px ${severityColor}` }}
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span
                className="font-semibold"
                style={{ fontSize: '15px', color: severityColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                {severity}
              </span>
              <span style={{ fontSize: '13px', color: '#4A5A78', fontVariantNumeric: 'tabular-nums' }}>
                Sent · <Elapsed startMs={startMs} />
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#8896B0', marginTop: 3 }}>
              {people} {people === 1 ? 'person' : 'people'} · {hopCount} hops · Acknowledged by Responder Alpha
            </div>
          </div>
        </div>

        {/* Route SVG */}
        <div
          className="rounded overflow-hidden relative"
          style={{ background: '#0D1829', border: '1px solid #243044', height: 340 }}
        >
          <svg width="100%" height="340" viewBox="0 0 370 340" preserveAspectRatio="xMidYMid slice">
            {/* Map grid */}
            {Array.from({ length: 8 }, (_, i) => (
              <line key={`v${i}`} x1={i * 53} y1="0" x2={i * 53} y2="340" stroke="#1A2540" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 57} x2="370" y2={i * 57} stroke="#1A2540" strokeWidth="0.5" />
            ))}

            {/* Roads */}
            <line x1="0" y1="220" x2="370" y2="220" stroke="#243044" strokeWidth="6" />
            <line x1="185" y1="0" x2="185" y2="340" stroke="#243044" strokeWidth="6" />
            <line x1="0" y1="120" x2="370" y2="120" stroke="#1A2540" strokeWidth="3" />

            {/* Dotted route path */}
            <path
              d={PATH_D}
              fill="none"
              stroke="#22D3EE"
              strokeWidth="2"
              strokeDasharray="8 5"
              opacity="0.5"
            />
            {/* Filled portion */}
            <path
              d={PATH_D}
              fill="none"
              stroke="#22D3EE"
              strokeWidth="2.5"
              strokeDasharray={`${teamPos * 480} 9999`}
            />

            {/* My pin */}
            <circle cx="40" cy="310" r="10" fill="#FF4D4F" />
            <circle cx="40" cy="310" r="14" fill="none" stroke="#FF4D4F" strokeWidth="2" opacity="0.4" />
            <text x="55" y="314" fill="#F0F4FF" fontSize="11" fontFamily="Inter">You</text>

            {/* Team marker — moves along path */}
            <circle
              cx={40 + teamPos * 290}
              cy={310 - teamPos * 210 - teamPos * teamPos * 60}
              r="10"
              fill="#22D3EE"
            />
            <circle
              cx={40 + teamPos * 290}
              cy={310 - teamPos * 210 - teamPos * teamPos * 60}
              r="14"
              fill="none"
              stroke="#22D3EE"
              strokeWidth="2"
              opacity="0.4"
            />
            <text
              x={40 + teamPos * 290 + 15}
              y={310 - teamPos * 210 - teamPos * teamPos * 60 + 4}
              fill="#22D3EE"
              fontSize="11"
              fontFamily="Inter"
            >
              Alpha
            </text>

            {/* Destination star */}
            <circle cx="330" cy="100" r="6" fill="#52C41A" />
            <text x="340" y="104" fill="#52C41A" fontSize="11" fontFamily="Inter">HQ</text>
          </svg>

          {/* ETA badge */}
          <div
            className="absolute top-3 right-3 px-3 py-2 rounded"
            style={{ background: '#0B1220CC', border: '1px solid #22D3EE', backdropFilter: 'blur(4px)' }}
          >
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#22D3EE', fontVariantNumeric: 'tabular-nums' }}>
              <ETA minutes={etaMins} />
            </div>
            <div style={{ fontSize: '11px', color: '#4A5A78' }}>Alpha Team</div>
          </div>
        </div>

        {/* Team card */}
        <div
          className="px-4 py-4 rounded flex items-center gap-4"
          style={{ background: '#131C2E', border: '1px solid #243044' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold"
            style={{ background: '#22D3EE22', border: '1.5px solid #22D3EE', color: '#22D3EE', fontSize: '15px' }}
          >
            A
          </div>
          <div className="flex-1">
            <div className="font-semibold text-[#F0F4FF]" style={{ fontSize: '15px' }}>Alpha Team</div>
            <div style={{ fontSize: '13px', color: '#8896B0' }}>6 members · NDRF · +91 98100 00001</div>
          </div>
          <div style={{ fontSize: '14px', color: '#22D3EE', fontVariantNumeric: 'tabular-nums' }}>
            <ETA minutes={etaMins} />
          </div>
        </div>

        {/* Status timeline */}
        <div
          className="px-4 py-4 rounded"
          style={{ background: '#131C2E', border: '1px solid #243044' }}
        >
          <div style={{ fontSize: '12px', color: '#4A5A78', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
            Status Timeline
          </div>
          {STAGES.map((stage, i) => {
            const done = i < stageIdx;
            const current = i === stageIdx;
            const dot = done ? '#52C41A' : current ? '#22D3EE' : '#243044';
            return (
              <div key={stage} className="flex items-start gap-4" style={{ marginBottom: i < STAGES.length - 1 ? 16 : 0 }}>
                {/* Dot + line */}
                <div className="flex flex-col items-center flex-shrink-0" style={{ width: 16 }}>
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{
                      width: 16,
                      height: 16,
                      background: dot,
                      boxShadow: current ? `0 0 8px ${dot}` : 'none',
                      transition: 'all 0.4s',
                    }}
                  >
                    {done && (
                      <svg viewBox="0 0 10 10" fill="none" stroke="#0B1220" strokeWidth="2" strokeLinecap="round" className="w-2.5 h-2.5">
                        <polyline points="2 5 4.5 7.5 8 3" />
                      </svg>
                    )}
                    {current && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: '#0B1220', animation: 'dot-blink 1.2s ease-in-out infinite' }}
                      />
                    )}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div
                      className="w-px flex-1 mt-1"
                      style={{ background: done ? '#52C41A' : '#243044', minHeight: 20, transition: 'background 0.4s' }}
                    />
                  )}
                </div>

                <div style={{ paddingTop: 0 }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: done || current ? 600 : 400,
                      color: done ? '#52C41A' : current ? '#22D3EE' : '#4A5A78',
                      transition: 'color 0.4s',
                    }}
                  >
                    {stage}
                  </div>
                  {current && (
                    <div style={{ fontSize: '12px', color: '#8896B0', marginTop: 2 }}>
                      {stage === 'Arriving' ? 'Team is 4 min away' : 'In progress…'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
