import { useEffect, useState } from 'react';
import { MeshClient } from '../../services/mesh';
import type { Envelope } from '@sankat-setu/schema';
import { RESPONDER_CONFIG, getOrCreateDeviceId, generateUUID } from '../../config';

interface Props {
  severity: string;
  people: number;
  helpTypes?: string[];
  userName?: string;
  onDelivered: () => void;
}

const NODES = ['You', 'Relay 1', 'Relay 2', 'Responder'];

export default function SendingScreen({ severity, people, helpTypes = [], userName = 'Civilian', onDelivered }: Props) {
  const [litNodes, setLitNodes] = useState(1); // "You" starts lit
  const [relayCount, setRelayCount] = useState(0);
  const [phase, setPhase] = useState<'sending' | 'relaying' | 'delivered' | 'failed'>('sending');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const severityColor =
    severity === 'critical' ? '#E5484D' : severity === 'urgent' ? '#F5A524' : '#30A46C';

  useEffect(() => {
    const sendSOS = async () => {
      try {
        const deviceId = getOrCreateDeviceId();
        const meshClient = new MeshClient({
          meshUrl: RESPONDER_CONFIG.meshUrl,
          deviceId,
          onError: (err) => {
            console.error('[SendingScreen] mesh error:', err);
            setErrorMsg(err);
            setPhase('failed');
          },
        });

        // Connect to mesh
        console.log('[SendingScreen] connecting to mesh...');
        await meshClient.connect();

        // Create SOS envelope
        const envelope: Envelope = {
          id: generateUUID(),
          orig: deviceId,
          ts: new Date().toISOString(),
          ttl: 5,
          prio: severity === 'critical' ? 'critical' : severity === 'urgent' ? 'high' : 'medium',
          type: 'sos',
          geo: { lat: 12.9716, lng: 77.5946 }, // TODO: real geolocation
          body: {
            reporterName: userName,
            incidentType: 'other',
            priority: severity === 'critical' ? 'critical' : severity === 'urgent' ? 'high' : 'medium',
            victimCount: people,
            description: `${helpTypes.join(', ')} needed`,
            geo: { lat: 12.9716, lng: 77.5946 },
            status: 'new',
            deviceId,
          },
        };

        // Send SOS
        console.log('[SendingScreen] sending SOS envelope...');
        setPhase('sending');
        setLitNodes(1);
        setRelayCount(0);

        // Simulate relay progression
        const t1 = setTimeout(() => { setPhase('relaying'); setRelayCount(1); setLitNodes(2); }, 900);
        const t2 = setTimeout(() => { setRelayCount(2); setLitNodes(3); }, 2000);
        const t3 = setTimeout(() => { setRelayCount(3); setLitNodes(4); setPhase('delivered'); }, 3400);

        // Actually send the envelope
        await meshClient.sendEnvelope(envelope);
        console.log('[SendingScreen] SOS delivered via mesh');

        // Complete
        const t4 = setTimeout(() => {
          meshClient.disconnect();
          onDelivered();
        }, 5000);

        return () => {
          [t1, t2, t3, t4].forEach(clearTimeout);
          meshClient.disconnect();
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error('[SendingScreen] failed to send SOS:', errorMsg);
        setErrorMsg(errorMsg);
        setPhase('failed');
      }
    };

    const cleanup = sendSOS();
    return () => {
      cleanup?.then((fn) => fn?.());
    };
  }, [severity, people, helpTypes, userName, onDelivered]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#0B1220',
        padding: '0 20px',
        paddingTop: 32,
        gap: 0,
      }}
    >
      {/* Status headline */}
      <div style={{ marginBottom: 8 }}>
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '28px',
            fontWeight: 600,
            color: phase === 'failed' ? '#E5484D' : '#E6EAF2',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {phase === 'sending' && 'Sending SOS…'}
          {phase === 'relaying' && 'Relaying through mesh…'}
          {phase === 'delivered' && 'SOS delivered.'}
          {phase === 'failed' && 'Failed to send SOS'}
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: phase === 'failed' ? '#E5484D' : '#8A97AC', marginTop: 6 }}>
          {phase === 'failed'
            ? errorMsg || 'Network error. Please check connection and retry.'
            : phase === 'delivered'
              ? 'A responder has received your alert.'
              : `Relayed by ${relayCount} nearby device${relayCount !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Hop chain — main visual */}
      <div style={{ margin: '32px 0' }}>
        {/* Nodes row with connector lines */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', paddingBottom: 24 }}>
          {/* Background track */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              right: 20,
              height: 1,
              background: '#243044',
              zIndex: 0,
            }}
          />
          {/* Progress fill */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              height: 1,
              background: severityColor,
              width: `calc(${((litNodes - 1) / (NODES.length - 1)) * 100}% - 40px * ${(litNodes - 1) / (NODES.length - 1)})`,
              transition: 'width 0.5s ease',
              zIndex: 0,
            }}
          />

          {NODES.map((node, i) => {
            const lit = i < litNodes;
            const isLast = i === NODES.length - 1;
            return (
              <div
                key={node}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: lit ? severityColor : '#131C2E',
                    border: `2px solid ${lit ? severityColor : '#243044'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.4s ease',
                  }}
                >
                  {lit && (
                    isLast ? (
                      <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                        <polyline points="3 8 6.5 11.5 13 4.5" />
                      </svg>
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                    )
                  )}
                </div>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    fontWeight: lit ? 500 : 400,
                    color: lit ? '#E6EAF2' : '#4A5A78',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.4s',
                  }}
                >
                  {node}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Facts panel */}
      <div
        style={{
          padding: '16px 20px',
          background: '#131C2E',
          border: '1px solid #243044',
          borderRadius: 6,
        }}
      >
        {[
          { label: 'Severity', value: severity.charAt(0).toUpperCase() + severity.slice(1), color: severityColor },
          { label: 'People', value: `${people}`, color: '#E6EAF2' },
          { label: 'Hops', value: `${Math.max(litNodes - 1, 0)}`, color: '#E6EAF2' },
          { label: 'Relays', value: `${relayCount}`, color: '#E6EAF2' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid #243044',
            }}
          >
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC' }}>
              {label}
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color }}>
              {value}
            </span>
          </div>
        ))}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '6px 0',
          }}
        >
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC' }}>
            Location
          </span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#E6EAF2' }}>
            Bengaluru
          </span>
        </div>
      </div>
    </div>
  );
}
