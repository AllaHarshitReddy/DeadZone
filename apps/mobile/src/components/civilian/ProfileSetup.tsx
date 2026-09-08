import { useState } from 'react';
import type { BloodGroup, MedicalProfile } from '../../services/profile';

/**
 * Collects the medical profile once, so an SOS can carry a blood group and a
 * next-of-kin number without the civilian typing anything mid-emergency.
 *
 * Routed as the 'profile-setup' CivilianView between login and home. What it
 * collects is now actually consumed, which is what previously kept it out of
 * the flow (taking medical data on an emergency app and discarding it is worse
 * than not asking):
 *   - SOSRequestSchema carries bloodGroup / emergencyContacts / medicalNotes
 *   - services/profile.ts persists it to localStorage and rehydrates at login
 *   - SendingScreen replays it into every SOS body
 *   - the responder map sidebar renders it
 *
 * The SOS beat itself is untouched at four gestures: this screen is passed
 * once, before home, and never appears on the send path.
 *
 * TODO(post-sih): the blood-group-to-allocation pathway. Carrying bloodGroup
 * into packages/triage so allocation can prefer a responder or facility with
 * compatible stock needs an inventory to match against, and nothing in
 * ResponderSchema carries one -- adding a fabricated blood stock to make the
 * rule fire would be invented data on a life-critical path, which is exactly
 * what the pitch promises we do not do. When a real inventory exists, the rule
 * belongs in packages/triage as a deterministic match over a compatibility
 * table with its own AllocationReasonCode saying blood group was a factor.
 * Never the LLM (CLAUDE.md).
 */

interface Props {
  name: string;
  phone: string;
  /** Save what was entered, then continue. */
  onFinish: (profile: MedicalProfile) => void;
  /** Continue without collecting anything. Must not be gated on a valid form. */
  onSkip: () => void;
  onBack: () => void;
}

/**
 * Display label vs wire value. The label uses a typographic minus (U+2212)
 * because a hyphen next to a capital letter reads as a dash at this size; the
 * value is the ASCII form in BloodGroupSchema, so nothing downstream has to
 * handle a lookalike character.
 */
const BLOOD_GROUPS: { value: BloodGroup; label: string }[] = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A−' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B−' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O−' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB−' },
];

function ContactRow({
  index,
  value,
  onChange,
  onRemove,
}: {
  index: number;
  value: { name: string; phone: string };
  onChange: (v: { name: string; phone: string }) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        padding: '12px 16px',
        background: '#131C2E',
        border: '1px solid #243044',
        borderRadius: 6,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC' }}>
          Contact {index + 1}
        </span>
        <button
          onClick={onRemove}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            color: '#E5484D',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          Remove
        </button>
      </div>
      <input
        type="text"
        value={value.name}
        onChange={e => onChange({ ...value, name: e.target.value })}
        placeholder="Contact name"
        className="dz-input"
        style={{ height: 40, fontSize: '15px' }}
      />
      {/* Phone with +91 prefix */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#0B1220',
          border: '1px solid #243044',
          borderRadius: 6,
          height: 40,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            padding: '0 10px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
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
          value={value.phone}
          onChange={e => onChange({ ...value, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
          placeholder="Mobile number"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '0 10px',
            fontFamily: "'Inter', sans-serif",
            fontSize: '14px',
            color: '#E6EAF2',
            fontVariantNumeric: 'tabular-nums',
            height: '100%',
          }}
        />
      </div>
    </div>
  );
}

export default function ProfileSetup({ name, phone, onFinish, onSkip, onBack }: Props) {
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>('');
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
  const [medicalNotes, setMedicalNotes] = useState('');
  const [showError, setShowError] = useState(false);

  const hasBloodGroup = bloodGroup.length > 0;
  const canFinish = hasBloodGroup;

  const addContact = () => {
    if (contacts.length < 3) setContacts(c => [...c, { name: '', phone: '' }]);
  };
  const removeContact = (i: number) => setContacts(c => c.filter((_, idx) => idx !== i));
  const updateContact = (i: number, v: { name: string; phone: string }) =>
    setContacts(c => c.map((item, idx) => idx === i ? v : item));

  const handleFinish = () => {
    if (!canFinish) { setShowError(true); return; }
    onFinish({
      bloodGroup: bloodGroup || undefined,
      emergencyContacts: contacts,
      medicalNotes,
    });
  };

  /**
   * Skip is unconditional. It used to require a blood group before it would
   * fire, which made "Skip for now" a second Finish button that refused to
   * skip -- a dead end on the only screen between login and the SOS button.
   */
  const handleSkip = () => onSkip();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0B1220' }}>
      {/* Header */}
      <div
        style={{
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid #243044',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#8A97AC',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
          }}
        >
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18" strokeLinecap="round">
            <polyline points="12 15 7 10 12 5" />
          </svg>
          Back
        </button>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '17px', fontWeight: 600, color: '#E6EAF2' }}>
          Your details
        </span>
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#4A5A78', minWidth: 40, textAlign: 'right' }}>
          2 of 2
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Blood group */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
            <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 500, color: '#E6EAF2' }}>
              Blood group
            </label>
            <span style={{ color: '#E5484D', fontSize: '15px' }}>*</span>
          </div>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC', marginBottom: 12 }}>
            Shared with responders when you send an SOS.
          </p>

          {/* 4×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
            {BLOOD_GROUPS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setBloodGroup(value); setShowError(false); }}
                style={{
                  padding: '10px 0',
                  borderRadius: 6,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '15px',
                  fontWeight: bloodGroup === value ? 600 : 400,
                  background: bloodGroup === value ? '#E5484D' : '#131C2E',
                  border: `1px solid ${bloodGroup === value ? '#E5484D' : showError && !hasBloodGroup ? '#E5484D44' : '#243044'}`,
                  color: bloodGroup === value ? '#ffffff' : '#E6EAF2',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Not known — full width */}
          <button
            onClick={() => { setBloodGroup('unknown'); setShowError(false); }}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 6,
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              fontWeight: bloodGroup === 'unknown' ? 600 : 400,
              background: '#131C2E',
              border: `1px solid ${bloodGroup === 'unknown' ? '#22D3EE' : showError && !hasBloodGroup ? '#E5484D44' : '#243044'}`,
              color: bloodGroup === 'unknown' ? '#22D3EE' : '#8A97AC',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Not known
          </button>

          {showError && !hasBloodGroup && (
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#E5484D', marginTop: 8 }}>
              Select a blood group to continue.
            </p>
          )}
        </div>

        {/* Emergency contacts */}
        <div>
          <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 500, color: '#E6EAF2', marginBottom: 4 }}>
            Emergency contacts
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: '#8A97AC', marginLeft: 8 }}>
              Optional · up to 3
            </span>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            {contacts.map((c, i) => (
              <ContactRow
                key={i}
                index={i}
                value={c}
                onChange={v => updateContact(i, v)}
                onRemove={() => removeContact(i)}
              />
            ))}
          </div>

          {contacts.length < 3 && (
            <button
              onClick={addContact}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                color: '#22D3EE',
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              + Add {contacts.length === 0 ? 'an' : 'another'} contact
            </button>
          )}
        </div>

        {/* Medical notes */}
        <div>
          <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 500, color: '#E6EAF2', marginBottom: 4 }}>
            Medical notes
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 400, color: '#8A97AC', marginLeft: 8 }}>
              Optional
            </span>
          </label>
          <div style={{ position: 'relative' }}>
            <textarea
              value={medicalNotes}
              onChange={e => setMedicalNotes(e.target.value.slice(0, 280))}
              placeholder="Allergies, medication, disability, anything a rescuer should know"
              rows={4}
              style={{
                width: '100%',
                background: '#131C2E',
                border: '1px solid #243044',
                borderRadius: 6,
                color: '#E6EAF2',
                fontFamily: "'Inter', sans-serif",
                fontSize: '15px',
                padding: '12px 16px',
                resize: 'none',
                outline: 'none',
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                right: 12,
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                color: medicalNotes.length >= 260 ? '#F5A524' : '#4A5A78',
              }}
            >
              {medicalNotes.length}/280
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          padding: '16px 20px 32px',
          borderTop: '1px solid #243044',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <button
          onClick={handleFinish}
          style={{
            width: '100%',
            height: 52,
            background: canFinish ? '#22D3EE' : '#1A2540',
            color: canFinish ? '#0B1220' : '#4A5A78',
            fontFamily: "'Inter', sans-serif",
            fontSize: '17px',
            fontWeight: 600,
            borderRadius: 6,
            border: 'none',
            cursor: canFinish ? 'pointer' : 'default',
            transition: 'all 0.15s',
          }}
        >
          Finish
        </button>
        <button
          onClick={handleSkip}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            color: '#8A97AC',
            background: 'none',
            border: 'none',
            padding: '4px 0',
            cursor: 'pointer',
            textAlign: 'center',
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
