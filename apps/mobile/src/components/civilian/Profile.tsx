import { useState } from 'react';
import TopBar from '../ui/TopBar';

interface Props {
  name: string;
  phone: string;
  onBack: () => void;
}

const BLOOD_GROUPS = ['A+', 'A−', 'B+', 'B−', 'O+', 'O−', 'AB+', 'AB−'];

export default function Profile({ name, phone, onBack }: Props) {
  const [editing, setEditing] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [medicalNotes, setMedicalNotes] = useState('No known allergies.');
  const [contacts, setContacts] = useState([
    { name: 'Anjali Mehta', phone: '+91 98100 12345', relation: 'Mother' },
    { name: 'Rahul Mehta', phone: '+91 96300 54321', relation: 'Brother' },
  ]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0B1220' }}>
      <TopBar
        title="Profile"
        onBack={onBack}
        onProfile={() => {}}
        userName={name}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 px-4 py-4 rounded" style={{ background: '#131C2E', border: '1px solid #243044' }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{ background: '#22D3EE22', border: '2px solid #22D3EE', color: '#22D3EE' }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[#F0F4FF]" style={{ fontSize: '18px' }}>{name}</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#8896B0', fontVariantNumeric: 'tabular-nums' }}>
              {phone}
            </div>
          </div>
        </div>

        {/* Blood group */}
        <div className="rounded" style={{ background: '#131C2E', border: '1px solid #243044' }}>
          <div className="px-4 pt-4 pb-2">
            <div style={{ fontSize: '12px', color: '#4A5A78', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Blood Group
            </div>
          </div>
          <div className="flex flex-wrap gap-2 px-4 pb-4">
            {BLOOD_GROUPS.map(bg => (
              <button
                key={bg}
                onClick={() => editing && setBloodGroup(bg)}
                className="font-semibold rounded"
                style={{
                  padding: '6px 14px',
                  fontSize: '14px',
                  background: bloodGroup === bg ? '#FF4D4F' : '#1A2540',
                  color: bloodGroup === bg ? '#fff' : '#8896B0',
                  border: `1px solid ${bloodGroup === bg ? '#FF4D4F' : '#243044'}`,
                  cursor: editing ? 'pointer' : 'default',
                }}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>

        {/* Emergency contacts */}
        <div className="rounded overflow-hidden" style={{ background: '#131C2E', border: '1px solid #243044' }}>
          <div className="px-4 pt-4 pb-3 flex items-center justify-between">
            <div style={{ fontSize: '12px', color: '#4A5A78', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Emergency Contacts
            </div>
            {editing && (
              <button
                style={{ fontSize: '13px', color: '#22D3EE' }}
                onClick={() => setContacts([...contacts, { name: '', phone: '', relation: '' }])}
              >
                + Add
              </button>
            )}
          </div>
          {contacts.map((c, i) => (
            <div
              key={i}
              className="px-4 py-3 flex items-center gap-3"
              style={{ borderTop: i > 0 ? '1px solid #243044' : undefined }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-semibold"
                style={{ background: '#1A2540', color: '#8896B0', fontSize: '14px' }}
              >
                {c.name.charAt(0) || '?'}
              </div>
              {editing ? (
                <div className="flex-1 flex flex-col gap-1">
                  <input className="dz-input" style={{ padding: '6px 10px', fontSize: '14px' }} value={c.name}
                    onChange={e => setContacts(contacts.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <input className="dz-input" style={{ padding: '6px 10px', fontSize: '14px' }} value={c.phone}
                    onChange={e => setContacts(contacts.map((x, j) => j === i ? { ...x, phone: e.target.value } : x))} />
                </div>
              ) : (
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#F0F4FF]" style={{ fontSize: '15px' }}>{c.name}</div>
                  <div style={{ fontSize: '13px', color: '#8896B0', fontVariantNumeric: 'tabular-nums' }}>{c.phone} · {c.relation}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Medical notes */}
        <div className="rounded" style={{ background: '#131C2E', border: '1px solid #243044' }}>
          <div className="px-4 pt-4 pb-2">
            <div style={{ fontSize: '12px', color: '#4A5A78', fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Medical Notes
            </div>
          </div>
          <div className="px-4 pb-4">
            {editing ? (
              <textarea
                className="dz-input"
                style={{ minHeight: 80, resize: 'none' }}
                value={medicalNotes}
                onChange={e => setMedicalNotes(e.target.value)}
              />
            ) : (
              <p style={{ fontSize: '15px', color: '#8896B0', lineHeight: 1.6 }}>{medicalNotes}</p>
            )}
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => setEditing(v => !v)}
          style={{
            height: 52,
            background: editing ? '#22D3EE' : '#131C2E',
            color: editing ? '#0B1220' : '#22D3EE',
            border: `1px solid ${editing ? '#22D3EE' : '#243044'}`,
            borderRadius: 6,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '16px',
          }}
        >
          {editing ? 'Save Profile' : 'Edit Profile'}
        </button>
      </div>
    </div>
  );
}
