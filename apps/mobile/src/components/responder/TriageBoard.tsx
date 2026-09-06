import { useEffect, useState } from 'react';
import { TRIAGE_COLOR, NEED_ICONS, type SOSIncident, type TriageCategory } from '../../data/mockData';

interface Props {
  /** Owned by App: snapshot from the command node plus live mesh envelopes. */
  incidents: SOSIncident[];
  onUpdate: (incidents: SOSIncident[]) => void;
}

const COLUMNS: { cat: TriageCategory; label: string; sub: string }[] = [
  { cat: 'RED', label: 'IMMEDIATE', sub: 'Life-threatening' },
  { cat: 'YELLOW', label: 'DELAYED', sub: 'Can wait 30–60 min' },
  { cat: 'GREEN', label: 'MINOR', sub: 'Walking wounded' },
  { cat: 'BLACK', label: 'EXPECTANT', sub: 'No pulse / respiration' },
];

export default function TriageBoard({ incidents, onUpdate }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCat, setDragOverCat] = useState<TriageCategory | null>(null);
  // Local copy so a responder's drag-to-reassign is instant; re-seeded whenever
  // App hands down new data (snapshot refresh, or a fresh envelope off the mesh).
  const [localIncidents, setLocalIncidents] = useState<SOSIncident[]>(incidents);
  useEffect(() => setLocalIncidents(incidents), [incidents]);

  const moveTo = (incidentId: string, cat: TriageCategory) => {
    const updated = localIncidents.map(i => i.id === incidentId ? { ...i, triage: cat } : i);
    setLocalIncidents(updated);
    onUpdate(updated);
  };

  return (
    <div className="h-full flex flex-col" style={{ background: '#0A0A0E' }}>
      <div className="px-5 py-4 border-b border-[#2A2A38] flex-shrink-0">
        <div
          className="text-[#F0F0F6] font-black tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px' }}
        >
          TRIAGE BOARD
        </div>
        <div
          className="text-[#5A5A6A]"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
        >
          START Simple Triage · Click card to reassign category
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-3 p-4">
        {COLUMNS.map(({ cat, label, sub }) => {
          const color = TRIAGE_COLOR[cat];
          const colIncidents = localIncidents.filter(i => i.triage === cat);
          const isDropTarget = dragOverCat === cat;

          return (
            <div
              key={cat}
              className="flex-1 flex flex-col rounded-2xl overflow-hidden transition-all duration-150"
              style={{
                background: isDropTarget ? `${color}22` : '#111116',
                border: `2px solid ${isDropTarget ? color : '#2A2A38'}`,
                minWidth: 0,
              }}
              onDragOver={e => { e.preventDefault(); setDragOverCat(cat); }}
              onDragLeave={() => setDragOverCat(null)}
              onDrop={e => {
                e.preventDefault();
                if (draggingId) moveTo(draggingId, cat);
                setDraggingId(null);
                setDragOverCat(null);
              }}
            >
              {/* Column header */}
              <div
                className="px-3 py-3 flex-shrink-0 border-b border-[#2A2A38]"
                style={{ borderTopColor: color, borderTopWidth: 3 }}
              >
                <div
                  className="font-black tracking-wider leading-none mb-0.5"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', color }}
                >
                  {label}
                </div>
                <div
                  className="text-[#5A5A6A] leading-tight"
                  style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px' }}
                >
                  {sub}
                </div>
                <div
                  className="font-black mt-1"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px', color }}
                >
                  {colIncidents.length}
                </div>
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
                {colIncidents.map(incident => (
                  <div
                    key={incident.id}
                    draggable
                    onDragStart={() => setDraggingId(incident.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverCat(null); }}
                    className="rounded-xl p-3 border border-[#2A2A38] cursor-grab active:cursor-grabbing transition-opacity"
                    style={{
                      background: '#18181F',
                      opacity: draggingId === incident.id ? 0.4 : 1,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[#F0F0F6] font-semibold leading-tight"
                        style={{ fontSize: '12px' }}
                      >
                        {incident.location.split(',')[0]}
                      </span>
                      <span
                        className="font-black"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', color }}
                      >
                        {incident.people}
                        <span className="text-[#5A5A6A] text-xs font-normal"> ppl</span>
                      </span>
                    </div>
                    <div
                      className="text-[#5A5A6A] mb-2 leading-tight"
                      style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {incident.triageReason.split('—')[1]?.trim() || incident.triageReason}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {incident.needs.map(n => (
                        <span key={n} className="text-xs">{NEED_ICONS[n]}</span>
                      ))}
                    </div>
                    <div
                      className="text-[#3A3A50] mt-2"
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
                    >
                      {incident.timeAgo}
                    </div>

                    {/* Quick reassign buttons */}
                    <div className="flex gap-1 mt-2">
                      {COLUMNS.filter(c => c.cat !== cat).map(({ cat: targetCat }) => (
                        <button
                          key={targetCat}
                          onClick={() => moveTo(incident.id, targetCat)}
                          className="flex-1 rounded py-0.5 text-white font-black transition-opacity hover:opacity-80"
                          style={{
                            background: TRIAGE_COLOR[targetCat],
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: '9px',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {targetCat}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {colIncidents.length === 0 && (
                  <div
                    className="flex items-center justify-center h-16 rounded-xl border-2 border-dashed"
                    style={{ borderColor: `${color}40`, color: `${color}60` }}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}>
                      drag here
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
