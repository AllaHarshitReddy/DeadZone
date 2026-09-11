import { useEffect, useRef, useState } from 'react';
import { MeshClient } from '../../services/mesh';
import { RESPONDER_CONFIG, getOrCreateDeviceId } from '../../config';
import { computeCoverage } from '@deadzone/comms';
import { drainQueue } from '../../services/queue';
import { PeerTable, type PeerHeartbeatPayload } from '@deadzone/comms';
import type { CoverageStatus } from '../../data/mockData';

interface Props {
  status?: CoverageStatus;
  /**
   * Starting count only, before the first heartbeat lands. Leave it unset:
   * the strip counts peers from the real PeerTable below, and seeding it with
   * a fabricated figure means the strip asserts a number it has not observed
   * for the first few seconds of every screen. App used to pass
   * COVERAGE_DEVICES[status] here, which read "Mesh strong · 14 devices" on a
   * link with one peer.
   */
  deviceCount?: number;
  onPress?: () => void;
}

// 5-bar sparkline: 60s of signal history (most-recent bar is rightmost)
const SPARKLINE: Record<CoverageStatus, number[]> = {
  green: [4, 4, 4, 4, 4],
  amber: [4, 4, 3, 2, 2],
  red:   [2, 1, 1, 0, 0],
};

const CFG = {
  green: { dot: '#30A46C', label: 'Mesh strong' },
  amber: { dot: '#F5A524', label: 'Mesh weakening' },
  red:   { dot: '#E5484D', label: 'No relay path' },
};

/**
 * How often coverage is re-evaluated. computeCoverage measures elapsed time
 * since the responder's last heartbeat, so it has to be called on a clock —
 * calling it only when a heartbeat *arrives* pins elapsed at ~0 and the
 * AMBER/RED branches can never be reached. Thresholds themselves live in
 * packages/comms/src/coverage.ts and are not changed here.
 */
const COVERAGE_POLL_MS = 5_000;

function readCoverage(peerTable: PeerTable): { status: CoverageStatus; peers: number } {
  const meters = computeCoverage(peerTable);
  return {
    status:
      meters.state === 'GREEN' ? 'green' : meters.state === 'AMBER' ? 'amber' : 'red',
    peers: meters.peersVisible,
  };
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            width: 4,
            height: v === 0 ? 2 : `${(v / 4) * 100}%`,
            background: v === 0 ? '#4A5A78' : color,
            borderRadius: 1,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}

export default function MeshStrip({ status: initialStatus, deviceCount: initialCount, onPress }: Props) {
  const [coverage, setCoverage] = useState<CoverageStatus>(initialStatus ?? 'red');
  const [deviceCount, setDeviceCount] = useState(initialCount ?? 0);
  const [peerTable] = useState(() => new PeerTable());
  const meshRef = useRef<MeshClient | null>(null);
  const [meshClient] = useState(() => {
    const client = new MeshClient({
      meshUrl: RESPONDER_CONFIG.meshUrl,
      deviceId: getOrCreateDeviceId(),
      onHeartbeat: (heartbeat) => {
        peerTable.updatePeer({
          deviceId: heartbeat.payload.deviceId,
          isResponder: heartbeat.payload.isResponder,
          geo: heartbeat.payload.geo,
        });

        // Reflect the fresh observation immediately; the interval below keeps
        // re-evaluating it as time passes without one.
        const { status: next, peers } = readCoverage(peerTable);
        setCoverage(next);
        setDeviceCount(peers);
      },
      // Every reconnect flushes whatever was written while the link was down.
      onStatusChange: (status) => {
        if (status === 'connected' && meshRef.current) {
          drainQueue(meshRef.current).catch((err) =>
            console.error('[MeshStrip] queue drain failed:', err),
          );
        }
      },
      onError: (err) => console.error('[MeshStrip] error:', err),
    });
    meshRef.current = client;
    return client;
  });

  // Re-evaluate coverage on a clock, not only when a heartbeat lands, so the
  // time since the last one actually accrues and the meter can decay
  // GREEN -> AMBER -> RED on its own.
  useEffect(() => {
    const id = setInterval(() => {
      const { status: next, peers } = readCoverage(peerTable);
      setCoverage(next);
      setDeviceCount(peers);
    }, COVERAGE_POLL_MS);
    return () => clearInterval(id);
  }, [peerTable]);

  // Connect to mesh on mount
  useEffect(() => {
    meshClient.connect().catch((err) => console.error('[MeshStrip] connect failed:', err));
    return () => meshClient.disconnect();
  }, [meshClient]);

  const cfg = CFG[coverage];
  const sparkData = SPARKLINE[coverage];

  const label =
    coverage === 'red'
      ? 'No relay path'
      : `${cfg.label} · ${deviceCount} device${deviceCount !== 1 ? 's' : ''}`;

  return (
    <button
      onClick={onPress}
      className="w-full flex items-center justify-between"
      style={{
        height: 32,
        paddingLeft: 20,
        paddingRight: 20,
        background: '#131C2E',
        borderBottom: '1px solid #243044',
        cursor: onPress ? 'pointer' : 'default',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: cfg.dot,
            flexShrink: 0,
            animation: coverage === 'red' ? 'dot-blink 1.2s ease-in-out infinite' : 'none',
          }}
        />
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: '13px',
            color: '#E6EAF2',
          }}
        >
          {label}
        </span>
      </div>
      <Sparkline data={sparkData} color={cfg.dot} />
    </button>
  );
}
