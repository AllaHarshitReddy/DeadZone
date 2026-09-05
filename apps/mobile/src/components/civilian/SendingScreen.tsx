import { useEffect, useRef, useState } from 'react';
import { MeshClient } from '../../services/mesh';
import { getDatabase } from '../../services/pouchdb';
import { enqueue, dequeue } from '../../services/queue';
import type { Envelope, SOSRequest } from '@sankat-setu/schema';
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
  const [phase, setPhase] = useState<'queued' | 'sending' | 'relaying' | 'delivered' | 'failed'>('queued');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const severityColor =
    severity === 'critical' ? '#E5484D' : severity === 'urgent' ? '#F5A524' : '#30A46C';

  // Stable across re-renders and StrictMode's double-mount, so a repeated
  // send collapses onto the same record instead of creating a second SOS.
  const sosIdRef = useRef<string>(generateUUID());

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let meshClient: MeshClient | null = null;

    const sendSOS = async () => {
      const deviceId = getOrCreateDeviceId();
      const sosId = sosIdRef.current;
      const now = new Date().toISOString();
      const priority =
        severity === 'critical' ? 'critical' : severity === 'urgent' ? 'high' : 'medium';
      const geo = { lat: 12.9716, lng: 77.5946 }; // TODO(post-sih): real geolocation

      // Envelope id doubles as the SOS document id, so the same report arriving
      // by several relay paths collapses to one record on every device.
      const body: SOSRequest = {
        id: sosId,
        deviceId,
        reporterName: userName,
        incidentType: 'other',
        priority,
        victimCount: people,
        description: `${helpTypes.join(', ')} needed`,
        geo,
        status: 'new',
        createdAt: now,
      };

      const envelope: Envelope = {
        id: sosId,
        orig: deviceId,
        ts: now,
        ttl: 5,
        prio: priority,
        type: 'sos',
        geo,
        body,
      };

      // Local write first — this has to succeed with no network at all.
      try {
        const db = getDatabase();
        await db.init();
        await db.storeSOS(body);
        enqueue(sosId);
        setPhase('queued');
        console.log('[SendingScreen] SOS stored locally:', sosId);
      } catch (err) {
        console.error('[SendingScreen] local write failed:', err);
        setErrorMsg('Could not save the SOS on this device.');
        setPhase('failed');
        return;
      }

      // Then attempt delivery. Failure leaves the SOS queued, never lost.
      try {
        meshClient = new MeshClient({ meshUrl: RESPONDER_CONFIG.meshUrl, deviceId });
        await meshClient.connect();

        setPhase('sending');
        setLitNodes(1);
        setRelayCount(0);
        timers.push(setTimeout(() => { setPhase('relaying'); setRelayCount(1); setLitNodes(2); }, 900));
        timers.push(setTimeout(() => { setRelayCount(2); setLitNodes(3); }, 2000));

        await meshClient.sendEnvelope(envelope);
        dequeue(sosId);
        console.log('[SendingScreen] SOS delivered via mesh');

        timers.push(setTimeout(() => { setRelayCount(3); setLitNodes(4); setPhase('delivered'); }, 3400));
        timers.push(setTimeout(() => onDelivered(), 5000));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn('[SendingScreen] delivery failed, SOS stays queued:', msg);
        setErrorMsg(msg);
        setPhase('queued');
        timers.push(setTimeout(() => onDelivered(), 3000));
      }
    };

    void sendSOS();

    return () => {
      timers.forEach(clearTimeout);
      meshClient?.disconnect();
    };
    // Runs once per mount; the SOS id is held in a ref so retries stay idempotent.
  }, []);

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
          {phase === 'queued' && 'SOS saved on this device.'}
          {phase === 'sending' && 'Sending SOS…'}
          {phase === 'relaying' && 'Relaying through mesh…'}
          {phase === 'delivered' && 'SOS delivered.'}
          {phase === 'failed' && 'Could not save SOS'}
        </h1>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: phase === 'failed' ? '#E5484D' : '#8A97AC', marginTop: 6 }}>
          {phase === 'failed'
            ? errorMsg || 'This device could not store the SOS.'
            : phase === 'delivered'
              ? 'A responder has received your alert.'
              : phase === 'queued'
                ? 'Saved on this device. Not yet delivered to a responder.'
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
