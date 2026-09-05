import { useState, useCallback } from 'react';

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
import ProfileSetup, { type ProfileData } from './components/civilian/ProfileSetup';

// ── Responder UI ──────────────────────────────────────────────────────────────
import MapView from './components/responder/MapView';
import SOSList from './components/responder/SOSList';
import TriageBoard from './components/responder/TriageBoard';
import LogisticsPanel from './components/responder/LogisticsPanel';

import { MOCK_INCIDENTS, COVERAGE_DEVICES, type SOSIncident, type NetworkStatus, type CoverageStatus } from './data/mockData';

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
  const [incidents, setIncidents] = useState<SOSIncident[]>(MOCK_INCIDENTS);
  const [sosPending, setSosPending] = useState(false);
  const [sosData, setSOSData] = useState<Partial<SOSData>>({});

  const relayedCount = 4;

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

  const logout = useCallback(() => {
    setUser(null); setRole(null); setCivilianView('home');
    setSosPending(false); setSOSData({});
  }, []);

  const devices = COVERAGE_DEVICES[coverageStatus];

  /* ── Login ───────────────────────────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050810' }}>
        <div style={PHONE_SHELL}>
          {/* Safe area — minimum 59px to clear Dynamic Island */}
          <div style={{ height: 'max(env(safe-area-inset-top, 0px), 59px)', background: '#0B1220', flexShrink: 0 }} />
          <MeshStrip status={coverageStatus} deviceCount={devices} onPress={cycleCoverage} />
          <LoginScreen
            onEnter={data => {
              setUser(data);
              setRole(data.role);
              // Civilian goes to profile setup; responder goes straight to dashboard
              if (data.role === 'civilian') setCivilianView('profile-setup');
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
              deviceCount={devices}
              onPress={() => setCivilianView('nearby-mesh')}
            />
          )}

          {/* ── Screens ── */}
          {civilianView === 'profile-setup' && (
            <ProfileSetup
              name={user.name}
              phone={user.phone}
              onBack={() => { setUser(null); setRole(null); }}
              onFinish={(_profile: ProfileData) => setCivilianView('home')}
            />
          )}

          {civilianView === 'home' && (
            <HomeScreen
              coverageStatus={coverageStatus}
              relayedCount={relayedCount}
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
              relayedCount={relayedCount}
              userName={user.name}
              onBack={() => setCivilianView('home')}
            />
          )}
        </div>
      </div>
    );
  }

  /* ── Responder dashboard ──────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0E' }}>
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
        <main className="flex-1 overflow-hidden" style={{ minWidth: 0 }}>
          {responderView === 'map' && (
            <MapView incidents={incidents} selectedId={selectedIncidentId} onSelect={setSelectedIncidentId} networkStatus={networkStatus} />
          )}
          {responderView === 'sos-list' && (
            <SOSList incidents={incidents} onSelect={id => { setSelectedIncidentId(id); setResponderView('map'); }} />
          )}
          {responderView === 'triage' && <TriageBoard incidents={incidents} onUpdate={setIncidents} />}
          {responderView === 'logistics' && <LogisticsPanel />}
        </main>
      </div>
    </div>
  );
}
