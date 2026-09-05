import { useEffect, useState } from 'react';
import { MeshClient } from '../../services/mesh';
import { RESPONDER_CONFIG, getOrCreateDeviceId } from '../../config';
import { computeCoverage } from '@sankat-setu/comms';
import { PeerTable, type PeerHeartbeatPayload } from '@sankat-setu/comms';
import type { CoverageStatus } from '../../data/mockData';

interface Props {
  status?: CoverageStatus;
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
  const [meshClient] = useState(() => new MeshClient({
    meshUrl: RESPONDER_CONFIG.meshUrl,
    deviceId: getOrCreateDeviceId(),
    onHeartbeat: (heartbeat) => {
      peerTable.updatePeer({
        deviceId: heartbeat.payload.deviceId,
        isResponder: heartbeat.payload.isResponder,
        geo: heartbeat.payload.geo,
      });

      // Update coverage status
      const coverageMeters = computeCoverage(peerTable);
      const newStatus = coverageMeters.state === 'GREEN' ? 'green' :
                       coverageMeters.state === 'AMBER' ? 'amber' : 'red';
      setCoverage(newStatus as CoverageStatus);
      setDeviceCount(coverageMeters.peersVisible);
    },
    onError: (err) => console.error('[MeshStrip] error:', err),
  }));

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
            animation: status === 'red' ? 'dot-blink 1.2s ease-in-out infinite' : 'none',
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
