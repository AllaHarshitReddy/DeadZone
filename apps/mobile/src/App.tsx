import { useState, useCallback, useEffect } from 'react';

// ── Civilian UI ──────────────────────────────────────────────────────────────
import MeshStrip from './components/ui/MeshStrip';
import LoginScreen from './components/LoginScreen';
import LanguageSelect from './components/civilian/LanguageSelect';
import Profile from './components/civilian/Profile';
import HomeScreen from './components/civilian/HomeScreen';
import SeverityStep from './components/civilian/SeverityStep';
import HelpTypeStep from './components/civilian/HelpTypeStep';
import PeopleStep from './components/civilian/PeopleStep';
import SendingScreen from './components/civilian/SendingScreen';
import CoverageLostScreen from './components/civilian/CoverageLostScreen';
import ReturnGuidance from './components/civilian/ReturnGuidance';
import LiveTracking from './components/civilian/LiveTracking';
import NearbyMesh from './components/civilian/NearbyMesh';
import ProfileSetup from './components/civilian/ProfileSetup';

// ── Responder UI (unchanged) ─────────────────────────────────────────────────
import StatusBanner from './components/StatusBanner';
import MapView from './components/responder/MapView';
import SOSList from './components/responder/SOSList';
import TriageBoard from './components/responder/TriageBoard';
import LogisticsPanel from './components/responder/LogisticsPanel';

import { MOCK_INCIDENTS, USE_MOCK_DATA, type SOSIncident, type NetworkStatus, type CoverageStatus } from './data/mockData';
import { MeshClient } from './services/mesh';
import { RESPONDER_CONFIG, getOrCreateDeviceId } from './config';
import { sosToIncident } from './services/incidents';
import { clearProfile, hasProfile, saveProfile } from './services/profile';
import type { SOSRequest } from '@deadzone/schema';

// ── Types ────────────────────────────────────────────────────────────────────
type Role = 'civilian' | 'responder' | null;

type CivilianView =
  | 'home'
  | 'profile-setup'
  | 'language'
  | 'profile'
  | 'severity'
  | 'help-type'
  | 'people'
  | 'sending'
  | 'live-track'
  | 'coverage-lost'
  | 'return-guidance'
  | 'nearby-mesh';

type ResponderView = 'map' | 'sos-list' | 'triage' | 'logistics';

interface UserProfile {
  name: string;
  phone: string;
  location: string;
  role: 'civilian' | 'responder';
}

interface SOSData {
  severity: 'critical' | 'urgent' | 'stable';
  helpTypes: string[];
  people: number;
}

const NAV_ITEMS: { view: ResponderView; icon: string; label: string }[] = [
  { view: 'map', icon: '◉', label: 'MAP' },
  { view: 'sos-list', icon: '⚡', label: 'SOS' },
  { view: 'triage', icon: '+', label: 'TRIAGE' },
  { view: 'logistics', icon: '▦', label: 'LOGISTICS' },
];

/**
 * Fabricated incidents are a local development aid and must never reach a
 * demo: on screen they are indistinguishable from real ones, and several of
 * them carry convincing-looking START reason strings. The gate itself now
 * lives in data/mockData.ts, shared with the responder panels so there is one
 * definition rather than a copy per consumer.
 */
const USE_MOCK_INCIDENTS = USE_MOCK_DATA;

function EmptyIncidents() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2" style={{ background: '#0A0A0E' }}>
      <div
        className="text-[#F0F0F6] font-black tracking-widest"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '22px' }}
      >
        NO ACTIVE INCIDENTS
      </div>
      <div className="text-[#5A5A6A]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}>
        Connected to the command node · waiting for an SOS
      </div>
    </div>
  );
}

const PHONE_SHELL: React.CSSProperties = {
  width: '100%',
  maxWidth: 390,
  height: '100svh',
  maxHeight: 844,
  background: '#0B1220',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 0 80px rgba(0,0,0,0.95), 0 0 0 1px #243044',
  borderRadius: 'clamp(0px, 4vw, 40px)',
  position: 'relative',
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [civilianView, setCivilianView] = useState<CivilianView>('home');
  const [responderView, setResponderView] = useState<ResponderView>('map');

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('offline');
  const [coverageStatus, setCoverageStatus] = useState<CoverageStatus>('green');
  const [language, setLanguage] = useState('en');
  const [showToast, setShowToast] = useState(false);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [incidents, setIncidents] = useState<SOSIncident[]>(USE_MOCK_INCIDENTS ? MOCK_INCIDENTS : []);
  const [sosPending, setSosPending] = useState(false);
  const [sosData, setSOSData] = useState<Partial<SOSData>>({});

  const toggleNetwork = useCallback(() => {
    setNetworkStatus(s => s === 'offline' ? 'online' : 'offline');
  }, []);

  const cycleCoverage = useCallback(() => {
    setCoverageStatus(prev => {
      if (prev === 'green') {
        setShowToast(true);
        return 'amber';
      }
      if (prev === 'amber') {
        setShowToast(false);
        return 'red';
      }
      return 'green';
    });
  }, []);

  // Clearing the medical profile is part of logging out, not housekeeping.
  // It is stored under one device-wide key, so without this the next person to
  // log in on the same handset inherits the previous one: hasProfile() is true,
  // ProfileSetup never appears, and SendingScreen stamps someone else's blood
  // group and next of kin onto their SOS.
  // TODO(post-sih): key the profile by user, so it survives a legitimate logout
  // instead of being discarded to keep it from leaking.
  const logout = useCallback(() => {
    clearProfile();
    setUser(null); setRole(null); setCivilianView('home');
    setSosPending(false); setSOSData({});
  }, []);


  // Responder view: take a snapshot of what the command node already holds,
  // then keep up via envelopes the server fans out over the mesh socket.
  //
  // Deliberately NOT loadIncidents() from services/incidents.ts: that reads
  // this browser's localStorage, which on the responder's laptop is empty by
  // construction -- the phone's records live on the command node, not here.
  // Conversion still goes through sosToIncident so there is one shared path.
  useEffect(() => {
    if (role !== 'responder') return;

    let cancelled = false;

    fetch('/sos')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((docs: SOSRequest[]) => {
        if (cancelled) return;
        setIncidents(docs.map(sosToIncident));
        console.log(`[responder] snapshot: ${docs.length} incident(s) from the command node`);
      })
      .catch((err) => console.error('[responder] snapshot failed:', err));

    const client = new MeshClient({
      meshUrl: RESPONDER_CONFIG.meshUrl,
      deviceId: getOrCreateDeviceId(),
      onEnvelope: (envelope) => {
        const sos = envelope.body as SOSRequest | undefined;
        if (!sos || typeof sos.id !== 'string') {
          console.warn('[responder] envelope carried no usable SOS body');
          return;
        }
        console.log('[responder] envelope received over mesh:', sos.id);
        // Same id collapses to one row, so a redelivered SOS never duplicates.
        setIncidents((prev) =>
          prev.some((i) => i.id === sos.id) ? prev : [...prev, sosToIncident(sos)],
        );
      },
      onError: (err) => console.error('[responder] mesh error:', err),
    });
    client.connect().catch((err) => console.error('[responder] mesh connect failed:', err));

    return () => {
      cancelled = true;
      client.disconnect();
    };
  }, [role]);

  /* ── Login ───────────────────────────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050810' }}>
        <div style={PHONE_SHELL}>
          {/* Safe area — minimum 59px to clear Dynamic Island */}
          <div style={{ height: 'max(env(safe-area-inset-top, 0px), 59px)', background: '#0B1220', flexShrink: 0 }} />
          <MeshStrip status={coverageStatus} onPress={cycleCoverage} />
          <LoginScreen
            onEnter={data => {
              setUser(data);
              setRole(data.role);
              // Ask for the medical profile once, before home. hasProfile() is
              // true after either Finish or Skip, so a civilian who declined is
              // not asked again on every login.
              if (data.role === 'civilian') {
                setCivilianView(hasProfile() ? 'home' : 'profile-setup');
              }
            }}
            onLanguage={() => {}}
          />
        </div>
      </div>
    );
  }

  /* ── Civilian ────────────────────────────────────────────────────────────── */
  if (role === 'civilian') {
    const showStrip = civilianView !== 'coverage-lost' && civilianView !== 'return-guidance';

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050810' }}>
        <div style={PHONE_SHELL}>
          {/* Safe area — min 59px clears Dynamic Island */}
          <div style={{ height: 'max(env(safe-area-inset-top, 0px), 59px)', background: '#0B1220', flexShrink: 0 }} />

          {/* Ambient mesh strip — always visible except coverage-related screens */}
          {showStrip && (
            <MeshStrip
              status={coverageStatus}
              onPress={() => setCivilianView('nearby-mesh')}
            />
          )}

          {/* ── Screens ── */}
          {civilianView === 'profile-setup' && (
            <ProfileSetup
              name={user.name}
              phone={user.phone}
              onBack={logout}
              onFinish={(profile) => {
                // A failed write is logged by saveProfile and deliberately not
                // surfaced or blocking: losing a profile must never stand
                // between someone and the SOS button.
                saveProfile(profile);
                setCivilianView('home');
              }}
              onSkip={() => {
                // Store the empty profile rather than nothing, so hasProfile()
                // records that we asked and they declined. Without this the
                // screen reappears at every login, turning an optional step
                // into a recurring obstacle in front of the SOS button.
                saveProfile({});
                setCivilianView('home');
              }}
            />
          )}

          {civilianView === 'home' && (
            <HomeScreen
              coverageStatus={coverageStatus}
              sosPending={sosPending}
              showToast={showToast}
              userName={user.name}
              onSOS={() => {
                if (coverageStatus === 'red') { setSosPending(true); return; }
                setSosPending(true);
                setCivilianView('severity');
              }}
              onCoverageLost={() => setCivilianView('coverage-lost')}
              onNearbyMesh={() => setCivilianView('nearby-mesh')}
              onProfile={() => setCivilianView('profile')}
              onDismissToast={() => setShowToast(false)}
              onGuideBack={() => { setShowToast(false); setCivilianView('return-guidance'); }}
            />
          )}

          {civilianView === 'language' && (
            <LanguageSelect
              current={language}
              onSelect={lang => { setLanguage(lang); setCivilianView('home'); }}
              onBack={() => setCivilianView('home')}
            />
          )}

          {civilianView === 'profile' && (
            <Profile
              name={user.name}
              phone={user.phone}
              onBack={() => setCivilianView('home')}
            />
          )}

          {civilianView === 'severity' && (
            <SeverityStep
              userName={user.name}
              onBack={() => { setSosPending(false); setCivilianView('home'); }}
              onNext={severity => { setSOSData(d => ({ ...d, severity })); setCivilianView('help-type'); }}
            />
          )}

          {civilianView === 'help-type' && (
            <HelpTypeStep
              userName={user.name}
              onBack={() => setCivilianView('severity')}
              onNext={types => { setSOSData(d => ({ ...d, helpTypes: types })); setCivilianView('people'); }}
            />
          )}

          {civilianView === 'people' && (
            <PeopleStep
              userName={user.name}
              onBack={() => setCivilianView('help-type')}
              onNext={count => { setSOSData(d => ({ ...d, people: count })); setCivilianView('sending'); }}
            />
          )}

          {civilianView === 'sending' && (
            <SendingScreen
              severity={sosData.severity ?? 'critical'}
              people={sosData.people ?? 1}
              helpTypes={sosData.helpTypes ?? []}
              userName={user.name}
              userPhone={user.phone}
              onDelivered={() => setCivilianView('live-track')}
            />
          )}

          {civilianView === 'live-track' && (
            <LiveTracking
              severity={sosData.severity ?? 'critical'}
              people={sosData.people ?? 1}
              userName={user.name}
              onBack={() => { setSosPending(false); setCivilianView('home'); }}
            />
          )}

          {civilianView === 'coverage-lost' && (
            <CoverageLostScreen
              onBack={() => setCivilianView('home')}
              onGuideBack={() => setCivilianView('return-guidance')}
              onSOSQueued={() => setSosPending(true)}
            />
          )}

          {civilianView === 'return-guidance' && (
            <ReturnGuidance
              onBack={() => setCivilianView('home')}
              onReconnected={() => {
                setCoverageStatus('green');
                setSosPending(false);
                setCivilianView('home');
              }}
            />
          )}

          {civilianView === 'nearby-mesh' && (
            <NearbyMesh
              userName={user.name}
              onBack={() => setCivilianView('home')}
            />
          )}
        </div>
      </div>
    );
  }

  /* ── Responder dashboard (unchanged visual system) ───────────────────────── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0E' }}>
      <StatusBanner internetStatus={networkStatus} coverageStatus={coverageStatus} onToggle={toggleNetwork} />
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        <nav
          className="flex-shrink-0 flex flex-col items-center py-4 gap-2 border-r border-[#2A2A38]"
          style={{ width: 64, background: '#0A0A0E' }}
        >
          <button
            onClick={logout}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors mb-3"
            style={{ background: '#18181F', color: '#5A5A6A', fontSize: '18px', fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            ←
          </button>
          {NAV_ITEMS.map(({ view, icon, label }) => {
            const active = responderView === view;
            return (
              <button
                key={view}
                onClick={() => setResponderView(view)}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: active ? '#EA580C' : '#18181F',
                  color: active ? '#fff' : '#5A5A6A',
                  border: active ? 'none' : '1px solid #2A2A38',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: '16px',
                  fontWeight: 900,
                }}
                title={label}
              >
                {icon}
              </button>
            );
          })}
          <div className="mt-auto flex flex-col items-center gap-1 pb-2">
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#DC2626', textAlign: 'center' }}>
              {incidents.filter(i => i.triage === 'RED').length}
              <div style={{ color: '#5A5A6A' }}>RED</div>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#D97706', textAlign: 'center' }}>
              {incidents.filter(i => i.triage === 'YELLOW').length}
              <div style={{ color: '#5A5A6A' }}>YLW</div>
            </div>
          </div>
        </nav>
        <main className="flex-1 overflow-hidden relative" style={{ minWidth: 0 }}>
          {incidents.length === 0 && responderView !== 'logistics' && <EmptyIncidents />}
          {incidents.length > 0 && responderView === 'map' && (
            <MapView incidents={incidents} selectedId={selectedIncidentId} onSelect={setSelectedIncidentId} networkStatus={networkStatus} />
          )}
          {incidents.length > 0 && responderView === 'sos-list' && (
            <SOSList incidents={incidents} onSelect={id => { setSelectedIncidentId(id); setResponderView('map'); }} />
          )}
          {incidents.length > 0 && responderView === 'triage' && (
            <TriageBoard incidents={incidents} onUpdate={setIncidents} />
          )}
          {responderView === 'logistics' && <LogisticsPanel />}
        </main>
      </div>
    </div>
  );
}
