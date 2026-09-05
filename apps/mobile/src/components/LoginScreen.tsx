import { useState } from 'react';

interface Props {
  onEnter: (data: { name: string; phone: string; location: string; role: 'civilian' | 'responder' }) => void;
  onLanguage: () => void;
}

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', label: 'IN' },
  { code: '+1',  flag: '🇺🇸', label: 'US' },
  { code: '+44', flag: '🇬🇧', label: 'UK' },
];

export default function LoginScreen({ onEnter, onLanguage }: Props) {
  const [countryIdx, setCountryIdx] = useState(0);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'civilian' | 'responder'>('civilian');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const country = COUNTRIES[countryIdx];
  const canContinue = phone.trim().length >= 10 && name.trim().length >= 2;

  const handleContinue = () => {
    if (!canContinue) return;
    onEnter({ name: name.trim(), phone: `${country.code}${phone.trim()}`, location: '', role });
  };

  const handleOffline = () => {
    onEnter({ name: name.trim() || 'User', phone: phone || '0000000000', location: '', role });
  };

  return (
    <div
      className="flex-1 flex flex-col overflow-y-auto"
      style={{ background: '#0B1220' }}
    >
      {/* Logo block */}
      <div className="px-6 pt-8 pb-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          {/* App icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#131C2E', border: '1px solid #243044' }}
          >
            <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
              <circle cx="16" cy="16" r="14" stroke="#FF4D4F" strokeWidth="2" />
              <path d="M16 8v8l5 3" stroke="#FF4D4F" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <div
              className="font-bold text-[#F0F4FF]"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '20px', lineHeight: 1 }}
            >
              DeadZone SOS
            </div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#4A5A78', marginTop: 2 }}>
              Emergency mesh network
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 flex flex-col gap-5">
        {/* Name field */}
        <div>
          <label className="block mb-2 font-medium text-[#8896B0]" style={{ fontSize: '13px' }}>
            Full name
          </label>
          <input
            className="dz-input"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Priya Mehta"
            autoComplete="name"
          />
        </div>

        {/* Phone number */}
        <div>
          <label className="block mb-2 font-medium text-[#8896B0]" style={{ fontSize: '13px' }}>
            Mobile number
          </label>
          <div className="flex gap-2">
            {/* Country code */}
            <button
              onClick={() => setShowCountryPicker(v => !v)}
              className="flex items-center gap-2 px-3 rounded flex-shrink-0 border font-medium"
              style={{
                background: '#131C2E',
                borderColor: showCountryPicker ? '#22D3EE' : '#243044',
                height: 48,
                color: '#F0F4FF',
                fontSize: '15px',
                borderRadius: 6,
                minWidth: 80,
              }}
            >
              <span>{country.flag}</span>
              <span>{country.code}</span>
              <svg viewBox="0 0 10 6" className="w-2.5 h-2.5 flex-shrink-0" fill="none">
                <path d="M1 1l4 4 4-4" stroke="#8896B0" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {/* Picker dropdown */}
            {showCountryPicker && (
              <div
                className="absolute z-50 rounded"
                style={{ background: '#1A2540', border: '1px solid #243044', marginTop: 52, width: 160 }}
              >
                {COUNTRIES.map((c, i) => (
                  <button
                    key={c.code}
                    onClick={() => { setCountryIdx(i); setShowCountryPicker(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#243044] text-left"
                    style={{ fontSize: '15px', color: '#F0F4FF' }}
                  >
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                    <span style={{ color: '#8896B0' }}>{c.label}</span>
                  </button>
                ))}
              </div>
            )}

            <input
              className="dz-input flex-1"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="98765 43210"
              style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em', height: 48 }}
            />
          </div>
        </div>

        {/* Role toggle */}
        <div>
          <label className="block mb-2 font-medium text-[#8896B0]" style={{ fontSize: '13px' }}>
            I am a
          </label>
          <div
            className="flex rounded"
            style={{ background: '#131C2E', border: '1px solid #243044', padding: 3, borderRadius: 8 }}
          >
            {(['civilian', 'responder'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className="flex-1 py-3 rounded font-semibold transition-all duration-150"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  background: role === r ? (r === 'civilian' ? '#FF4D4F' : '#52C41A') : 'transparent',
                  color: role === r ? '#fff' : '#8896B0',
                  borderRadius: 6,
                }}
              >
                {r === 'civilian' ? 'Civilian' : 'Responder'}
              </button>
            ))}
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          style={{
            background: canContinue ? '#22D3EE' : '#1A2540',
            color: canContinue ? '#0B1220' : '#4A5A78',
            fontFamily: "'Inter', sans-serif",
            fontSize: '16px',
            fontWeight: 700,
            height: 52,
            borderRadius: 6,
            border: 'none',
            cursor: canContinue ? 'pointer' : 'default',
            transition: 'all 0.15s',
            marginTop: 4,
          }}
        >
          Continue
        </button>

        {/* Offline link */}
        <button
          onClick={handleOffline}
          className="text-center"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8896B0', padding: '8px 0' }}
        >
          Continue offline — no OTP required
        </button>
      </div>

      {/* Language selector */}
      <div
        className="flex-shrink-0 flex items-center justify-center gap-3 px-6 py-4"
        style={{ borderTop: '1px solid #243044' }}
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="#4A5A78" strokeWidth="1.5" className="w-4 h-4">
          <circle cx="10" cy="10" r="8" />
          <path d="M10 2C7.5 5 6 7.5 6 10s1.5 5 4 8M10 2c2.5 3 4 5.5 4 8s-1.5 5-4 8M2 10h16" />
        </svg>
        <button
          onClick={onLanguage}
          style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8896B0' }}
        >
          English · हिन्दी · ಕನ್ನಡ · more
        </button>
      </div>
    </div>
  );
}
