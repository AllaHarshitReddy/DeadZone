import { useRef, useState } from 'react';
import TopBar from '../ui/TopBar';

interface Props {
  onBack: () => void;
  onNext: (count: number) => void;
  userName: string;
}

export default function PeopleStep({ onBack, onNext, userName }: Props) {
  const [count, setCount] = useState(1);
  const [inputFocused, setInputFocused] = useState(false);
  const [inputValue, setInputValue] = useState('1');
  const inputRef = useRef<HTMLInputElement>(null);

  const set = (n: number) => {
    const clamped = Math.max(1, Math.min(999, n));
    setCount(clamped);
    setInputValue(String(clamped));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setInputValue(raw);
    const n = parseInt(raw, 10);
    if (!isNaN(n) && n > 0) setCount(Math.min(n, 999));
  };

  const handleInputBlur = () => {
    setInputFocused(false);
    const n = parseInt(inputValue, 10);
    if (isNaN(n) || n < 1) { setCount(1); setInputValue('1'); }
    else set(n);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0B1220' }}>
      <TopBar title="Step 3 of 3" onBack={onBack} onProfile={() => {}} userName={userName} />

      <div
        className="flex-1 flex flex-col px-4"
        style={{
          /* When keyboard opens, this shrinks; Continue button stays above keyboard */
          overflowY: 'auto',
          paddingTop: 24,
          paddingBottom: 24,
          gap: 32,
        }}
      >
        <div>
          <h2 className="font-bold text-[#F0F4FF]" style={{ fontFamily: "'Inter', sans-serif", fontSize: '22px' }}>
            How many people need help?
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8896B0', marginTop: 4 }}>
            Include yourself if you need assistance.
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => set(count - 1)}
            className="flex items-center justify-center font-bold"
            style={{
              width: 64,
              height: 64,
              background: '#131C2E',
              border: '1px solid #243044',
              borderRadius: 6,
              color: '#F0F4FF',
              fontSize: '28px',
              cursor: 'pointer',
            }}
          >
            −
          </button>

          {/* Tappable number field */}
          <div className="relative">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={inputFocused ? inputValue : count}
              onChange={handleInputChange}
              onFocus={() => { setInputFocused(true); setInputValue(String(count)); }}
              onBlur={handleInputBlur}
              className="text-center font-bold"
              style={{
                width: 112,
                height: 80,
                background: '#131C2E',
                border: `2px solid ${inputFocused ? '#22D3EE' : '#243044'}`,
                borderRadius: 6,
                color: '#F0F4FF',
                fontFamily: "'Inter', sans-serif",
                fontSize: '44px',
                fontVariantNumeric: 'tabular-nums',
                outline: 'none',
              }}
            />
            {inputFocused && (
              <div
                className="absolute -bottom-5 left-0 right-0 text-center"
                style={{ fontSize: '11px', color: '#22D3EE' }}
              >
                tap to type
              </div>
            )}
          </div>

          <button
            onClick={() => set(count + 1)}
            className="flex items-center justify-center font-bold"
            style={{
              width: 64,
              height: 64,
              background: '#131C2E',
              border: '1px solid #243044',
              borderRadius: 6,
              color: '#F0F4FF',
              fontSize: '28px',
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>

        {/* Quick-select buttons */}
        <div>
          <p style={{ fontSize: '13px', color: '#4A5A78', textAlign: 'center', marginBottom: 12 }}>
            Quick select
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {[1, 2, 3, 5, 10, 20, 50].map(n => (
              <button
                key={n}
                onClick={() => set(n)}
                style={{
                  padding: '8px 16px',
                  background: count === n ? '#22D3EE22' : '#131C2E',
                  border: `1px solid ${count === n ? '#22D3EE' : '#243044'}`,
                  borderRadius: 6,
                  color: count === n ? '#22D3EE' : '#8896B0',
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  fontWeight: count === n ? 600 : 400,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Keyboard-open: Continue stays visible */}
        <button
          onClick={() => onNext(count)}
          style={{
            width: '100%',
            height: 52,
            background: '#FF4D4F',
            color: '#fff',
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '16px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            marginTop: 'auto',
          }}
        >
          Send SOS for {count} {count === 1 ? 'person' : 'people'}
        </button>
      </div>
    </div>
  );
}
