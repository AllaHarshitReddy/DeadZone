import TopBar from '../ui/TopBar';

interface Props {
  relayedCount: number;
  onBack: () => void;
  userName: string;
}

const PEERS = [
  { id: 'peer-1', label: 'Device A', signal: 4, dist: '12 m', relaying: true },
  { id: 'peer-2', label: 'Device B', signal: 3, dist: '45 m', relaying: false },
  { id: 'peer-3', label: 'Device C', signal: 3, dist: '78 m', relaying: true },
  { id: 'peer-4', label: 'Node Alpha', signal: 2, dist: '120 m', relaying: false, isNode: true },
  { id: 'peer-5', label: 'Device D', signal: 1, dist: '210 m', relaying: false },
  { id: 'peer-6', label: 'Device E', signal: 1, dist: '340 m', relaying: false },
];

function SignalBars({ level }: { level: number }) {
  const bars = [1, 2, 3, 4];
  return (
    <div className="flex items-end gap-0.5" style={{ height: 14 }}>
      {bars.map(b => (
        <div
          key={b}
          style={{
            width: 4,
            height: `${(b / 4) * 100}%`,
            background: b <= level ? '#52C41A' : '#243044',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

export default function NearbyMesh({ relayedCount, onBack, userName }: Props) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0B1220' }}>
      <TopBar title="Nearby Mesh" onBack={onBack} onProfile={() => {}} userName={userName} />

      {/* Relay banner */}
      {relayedCount > 0 && (
        <div
          className="mx-4 mt-4 px-4 py-3 rounded flex items-center gap-3 flex-shrink-0"
          style={{ background: '#22D3EE15', border: '1px solid #22D3EE44' }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="#22D3EE" strokeWidth="1.8" className="w-5 h-5 flex-shrink-0">
            <circle cx="10" cy="10" r="3" />
            <path d="M2 10h3M15 10h3M10 2v3M10 15v3" />
            <path d="M4.9 4.9l2.1 2.1M13 13l2.1 2.1M4.9 15.1l2.1-2.1M13 7l2.1-2.1" />
          </svg>
          <div>
            <p className="font-semibold" style={{ fontSize: '15px', color: '#22D3EE' }}>
              You are relaying {relayedCount} message{relayedCount !== 1 ? 's' : ''} for others
            </p>
            <p style={{ fontSize: '13px', color: '#4A5A78', marginTop: 2 }}>
              Your phone is part of the mesh — helping others reach responders
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        <div
          className="flex items-center justify-between mb-2"
          style={{ fontSize: '12px', color: '#4A5A78', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          <span>{PEERS.length} peers visible</span>
          <span>updated just now</span>
        </div>

        {PEERS.map(peer => (
          <div
            key={peer.id}
            className="flex items-center gap-4 px-4"
            style={{
              height: 64,
              background: '#131C2E',
              border: `1px solid ${peer.isNode ? '#22D3EE44' : '#243044'}`,
              borderRadius: 6,
            }}
          >
            {/* Icon */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: peer.isNode ? '#22D3EE22' : '#1A2540' }}
            >
              {peer.isNode ? (
                <svg viewBox="0 0 20 20" fill="none" stroke="#22D3EE" strokeWidth="1.8" className="w-4.5 h-4.5">
                  <circle cx="10" cy="10" r="3" />
                  <path d="M4 4.5C5.7 2.8 7.7 2 10 2s4.3.8 6 2.5M6.5 7C7.5 6 8.7 5.5 10 5.5s2.5.5 3.5 1.5" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" fill="none" stroke="#8896B0" strokeWidth="1.8" className="w-4.5 h-4.5">
                  <rect x="5" y="2" width="10" height="16" rx="2" />
                  <circle cx="10" cy="15" r="1" fill="#8896B0" />
                </svg>
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <div
                className="font-medium"
                style={{ fontSize: '15px', color: peer.isNode ? '#22D3EE' : '#F0F4FF' }}
              >
                {peer.label}
              </div>
              <div style={{ fontSize: '12px', color: '#4A5A78', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>
                {peer.dist}
                {peer.relaying && (
                  <span style={{ color: '#52C41A', marginLeft: 8 }}>· relaying</span>
                )}
              </div>
            </div>

            {/* Signal bars */}
            <SignalBars level={peer.signal} />
          </div>
        ))}
      </div>
    </div>
  );
}
