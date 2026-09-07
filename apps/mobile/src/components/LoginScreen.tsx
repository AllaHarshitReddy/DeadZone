import { useState } from 'react';

interface Props {
  onEnter: (data: { name: string; phone: string; location: string; role: 'civilian' | 'responder' }) => void;
  onLanguage: () => void;
}

/* Gov ID validation states */
type GovState = 'idle' | 'focused' | 'valid';

const DEMO_PASSWORD = '123456';

function PhoneField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isValid = value.length === 10;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: '#131C2E',
        border: `1px solid ${isValid && value.length > 0 ? '#30A46C' : '#243044'}`,
        borderRadius: 6,
        height: 48,
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
    >
      <span
        style={{
          padding: '0 12px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '15px',
          color: '#8A97AC',
          borderRight: '1px solid #243044',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
          userSelect: 'none',
        }}
      >
        +91
      </span>
      <input
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder="98765 43210"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          padding: '0 12px',
          fontFamily: "'Inter', sans-serif",
          fontSize: '16px',
          color: '#E6EAF2',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '0.04em',
          height: '100%',
        }}
      />
      {isValid && (
        <div style={{ paddingRight: 12, flexShrink: 0 }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="#30A46C" strokeWidth="2" strokeLinecap="round" width="16" height="16">
            <polyline points="3 8 6.5 11.5 13 4.5" />
          </svg>
        </div>
      )}
    </div>
  );
}

function GovIdBlock({ onReady }: { onReady: (id: string) => void }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [idState, setIdState] = useState<GovState>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ID: any non-empty username is accepted in the demo
  const handleIdBlur = () => {
    setIdState(id.trim().length > 0 ? 'valid' : 'idle');
  };

  const passwordCorrect = password === DEMO_PASSWORD;
  const passwordTouched = password.length > 0;
  const passwordError = passwordTouched && !passwordCorrect;

  const canSignIn = id.trim().length > 0 && passwordCorrect;

  const handleSignIn = () => {
    if (!canSignIn || loading) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onReady(`${id.trim()}@gov.in`);
    }, 600);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Official ID field */}
      <div>
        <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#8A97AC', marginBottom: 6 }}>
          Official ID
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#131C2E',
            border: `1px solid ${idState === 'valid' ? '#30A46C' : idState === 'focused' ? '#22D3EE' : '#243044'}`,
            borderRadius: 6,
            height: 48,
            overflow: 'hidden',
            transition: 'border-color 0.15s',
          }}
        >
          <input
            type="text"
            value={id}
            onChange={e => { setId(e.target.value); setIdState('focused'); }}
            onFocus={() => setIdState('focused')}
            onBlur={handleIdBlur}
            placeholder="your.name"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '0 12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: '#E6EAF2',
              height: '100%',
            }}
          />
          <span
            style={{
              padding: '0 12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: '#8A97AC',
              borderLeft: '1px solid #243044',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              userSelect: 'none',
            }}
          >
            @gov.in
          </span>
          {idState === 'valid' && (
            <div style={{ paddingRight: 10, flexShrink: 0 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#30A46C" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                <polyline points="3 8 6.5 11.5 13 4.5" />
              </svg>
            </div>
          )}
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', marginTop: 4, color: idState === 'valid' ? '#30A46C' : '#4A5A78' }}>
          {idState === 'valid' ? 'Verified — Karnataka SDRF' : 'Only @gov.in accounts can access the responder dashboard.'}
        </p>
      </div>

      {/* Password field with show/hide toggle */}
      <div>
        <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#8A97AC', marginBottom: 6 }}>
          Password
        </label>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: '#131C2E',
            border: `1px solid ${passwordError ? '#E5484D' : passwordCorrect && passwordTouched ? '#30A46C' : '#243044'}`,
            borderRadius: 6,
            height: 48,
            overflow: 'hidden',
            transition: 'border-color 0.15s',
          }}
        >
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={DEMO_PASSWORD}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: '0 12px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: '#E6EAF2',
              height: '100%',
            }}
          />
          {/* Show/hide toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{
              padding: '0 12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4A5A78',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            {showPassword ? (
              /* Eye-off */
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="18" height="18">
                <path d="M3 3l14 14M10 4C5.5 4 2 10 2 10s1.2 2 3.5 3.8M10 16c4.5 0 8-6 8-6s-1.2-2-3.5-3.8" />
                <path d="M8 8a3 3 0 004 4" />
              </svg>
            ) : (
              /* Eye */
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="18" height="18">
                <path d="M2 10s3.5-6 8-6 8 6 8 6-3.5 6-8 6-8-6-8-6z" />
                <circle cx="10" cy="10" r="2.5" />
              </svg>
            )}
          </button>
          {passwordCorrect && passwordTouched && (
            <div style={{ paddingRight: 10, flexShrink: 0 }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="#30A46C" strokeWidth="2" strokeLinecap="round" width="14" height="14">
                <polyline points="3 8 6.5 11.5 13 4.5" />
              </svg>
            </div>
          )}
        </div>
        {passwordError ? (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#E5484D', marginTop: 4 }}>
            Incorrect password. Use {DEMO_PASSWORD} for the demo.
          </p>
        ) : (
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#4A5A78', marginTop: 4 }}>
            Demo password: {DEMO_PASSWORD}
          </p>
        )}
      </div>

      {/* Sign in button */}
      <button
        onClick={handleSignIn}
        disabled={!canSignIn || loading}
        style={{
          width: '100%',
          height: 52,
          background: canSignIn ? '#22D3EE' : '#1A2540',
          color: canSignIn ? '#0B1220' : '#4A5A78',
          fontFamily: "'Inter', sans-serif",
          fontSize: '16px',
          fontWeight: 600,
          borderRadius: 6,
          border: 'none',
          cursor: canSignIn && !loading ? 'pointer' : 'default',
          transition: 'all 0.15s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {loading ? (
          <>
            <svg viewBox="0 0 20 20" width="16" height="16" style={{ animation: 'spin 0.7s linear infinite' }}>
              <circle cx="10" cy="10" r="8" stroke="#0B1220" strokeWidth="2.5" fill="none" strokeDasharray="40 14" />
            </svg>
            Signing in…
          </>
        ) : (
          'Sign in to dashboard'
        )}
      </button>
    </div>
  );
}

export default function LoginScreen({ onEnter, onLanguage }: Props) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'civilian' | 'responder'>('civilian');

  const canContinue = phone.length === 10 && name.trim().length >= 2;

  const handleContinue = () => {
    if (!canContinue) return;
    onEnter({ name: name.trim(), phone: `+91${phone}`, location: '', role });
  };

  const handleOffline = () => {
    onEnter({ name: name.trim() || 'User', phone: phone || '0000000000', location: '', role });
  };

  const handleResponderSignIn = (govId: string) => {
    onEnter({ name: govId, phone: '0000000000', location: '', role: 'responder' });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#0B1220' }}>
      {/* Logo */}
      <div style={{ padding: '32px 20px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: '#131C2E',
              border: '1px solid #243044',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
              <circle cx="16" cy="16" r="14" stroke="#E5484D" strokeWidth="1.5" />
              <path d="M16 8v8l5 3" stroke="#E5484D" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', fontWeight: 600, color: '#E6EAF2', lineHeight: 1 }}>
              DeadZone SOS
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#4A5A78', marginTop: 2 }}>
              Emergency mesh network
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Name */}
        <div>
          <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#8A97AC', marginBottom: 6 }}>
            Full name
          </label>
          <input
            className="dz-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Priya Mehta"
            autoComplete="name"
            style={{ height: 48, fontSize: '16px' }}
          />
        </div>

        {/* Mobile number — static +91 */}
        <div>
          <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#8A97AC', marginBottom: 6 }}>
            Mobile number
          </label>
          <PhoneField value={phone} onChange={setPhone} />
        </div>

        {/* Role segmented control */}
        <div>
          <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#8A97AC', marginBottom: 6 }}>
            I am a
          </label>
          <div
            style={{
              display: 'flex',
              background: '#131C2E',
              border: '1px solid #243044',
              borderRadius: 8,
              padding: 3,
            }}
          >
            {(['civilian', 'responder'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 6,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  fontWeight: role === r ? 600 : 400,
                  background: role === r ? (r === 'civilian' ? '#E5484D' : '#22D3EE') : 'transparent',
                  color: role === r ? (r === 'civilian' ? '#ffffff' : '#0B1220') : '#8A97AC',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {r === 'civilian' ? 'Civilian' : 'Responder'}
              </button>
            ))}
          </div>
        </div>

        {/* Responder: inline gov.in block */}
        {role === 'responder' && (
          <GovIdBlock onReady={handleResponderSignIn} />
        )}

        {/* Civilian: Continue button */}
        {role === 'civilian' && (
          <>
            <button
              onClick={handleContinue}
              style={{
                width: '100%',
                height: 52,
                background: canContinue ? '#22D3EE' : '#1A2540',
                color: canContinue ? '#0B1220' : '#4A5A78',
                fontFamily: "'Inter', sans-serif",
                fontSize: '16px',
                fontWeight: 600,
                borderRadius: 6,
                border: 'none',
                cursor: canContinue ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              Continue
            </button>

            <button
              onClick={handleOffline}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#8A97AC',
                background: 'none',
                border: 'none',
                padding: '8px 0',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Continue offline — no OTP required
            </button>
          </>
        )}
      </div>

      {/* Language footer */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: '16px 20px',
          borderTop: '1px solid #243044',
        }}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="#4A5A78" strokeWidth="1.5" width="16" height="16">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 2C7.5 5 6 7.5 6 10s1.5 5 4 8M10 2c2.5 3 4 5.5 4 8s-1.5 5-4 8M2 10h16" />
        </svg>
        <button
          onClick={onLanguage}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8A97AC', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          English · हिन्दी · ಕನ್ನಡ · more
        </button>
      </div>
    </div>
  );
}
