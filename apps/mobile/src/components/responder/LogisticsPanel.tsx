import { useEffect, useRef, useState } from 'react';
import { MOCK_TEAMS, MOCK_RESOURCES } from '../../data/mockData';

type Tab = 'teams' | 'resources';

const TEAM_STATUS_COLOR: Record<string, string> = {
  deployed: '#30A46C',
  in_transit: '#F5A524',
  available: '#22D3EE',
  off_duty: '#4A5A78',
};
const TEAM_STATUS_LABEL: Record<string, string> = {
  deployed: 'On site',
  in_transit: 'En route',
  available: 'Available',
  off_duty: 'Off duty',
};

/** A resource row. Allocation is component-local: no server, no endpoint. */
type ResourceRow = {
  id: string; item: string; hq: string; total: number;
  allocated: number; reserved: string; lastSynced: string;
};

const RESOURCES_EXTENDED: ResourceRow[] = [
  { id: 'r1', item: 'Ambulances', hq: 'Karnataka SDRF HQ', total: 8, allocated: 3, reserved: 'Koramangala flood', lastSynced: '2 min ago' },
  { id: 'r2', item: 'Medical kits', hq: 'BBMP Emergency', total: 40, allocated: 12, reserved: '—', lastSynced: '4 min ago' },
  { id: 'r3', item: 'Stretchers', hq: 'Karnataka SDRF HQ', total: 16, allocated: 6, reserved: 'Majestic incident', lastSynced: '2 min ago' },
  { id: 'r4', item: 'Water (L)', hq: 'BBMP Emergency', total: 8000, allocated: 1200, reserved: '—', lastSynced: '7 min ago' },
  { id: 'r5', item: 'Blankets', hq: 'Karnataka SDRF HQ', total: 300, allocated: 80, reserved: '—', lastSynced: '2 min ago' },
  { id: 'r6', item: 'Rescue boats', hq: 'NDRF Bengaluru', total: 6, allocated: 6, reserved: 'Bellandur flood', lastSynced: '1 min ago' },
  { id: 'r7', item: 'Generators', hq: 'BBMP Emergency', total: 12, allocated: 4, reserved: '—', lastSynced: '5 min ago' },
];

function SummaryTile({ label, value, delta, color = '#E6EAF2' }: { label: string; value: string; delta: string; color?: string }) {
  const deltaUp = delta.startsWith('+');
  return (
    <div
      style={{
        background: '#131C2E',
        border: '1px solid #243044',
        borderRadius: 6,
        padding: '14px 16px',
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '28px',
          fontWeight: 600,
          color,
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#8A97AC', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: deltaUp ? '#30A46C' : '#E5484D' }}>
        {delta} vs 1h ago
      </div>
    </div>
  );
}

function AllocationStepper({
  resource,
  onAllocate,
}: {
  resource: ResourceRow;
  onAllocate: (qty: number) => void;
}) {
  // Derived from the row the table is holding in state, so it falls as stock
  // is committed. Previously this read the RESOURCES_EXTENDED constant, which
  // never changes -- the counters could not move no matter what was allocated.
  const available = resource.total - resource.allocated;
  const [qty, setQty] = useState(0);
  const [justAllocated, setJustAllocated] = useState(0);
  const ackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (ackTimer.current) clearTimeout(ackTimer.current); }, []);

  // qty can exceed available if stock fell after it was dialled in; clamp so
  // the guard below can never be stepped past.
  const atCap = qty >= available;
  const overCap = qty > available;

  const dec = () => setQty(q => Math.max(0, q - 1));
  const inc = () => setQty(q => Math.min(available, q + 1));

  const handleAllocate = () => {
    if (qty <= 0 || qty > available) return;
    onAllocate(qty);
    setJustAllocated(qty);
    setQty(0);
    // Acknowledge, then return to the stepper so the row stays usable.
    if (ackTimer.current) clearTimeout(ackTimer.current);
    ackTimer.current = setTimeout(() => setJustAllocated(0), 2500);
  };

  if (justAllocated > 0) {
    return (
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#30A46C' }}>
        ✓ {justAllocated} allocated
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={dec}
        disabled={qty === 0}
        style={{
          width: 24,
          height: 24,
          background: '#0B1220',
          border: '1px solid #243044',
          borderRadius: 4,
          color: qty === 0 ? '#4A5A78' : '#E6EAF2',
          cursor: qty === 0 ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        −
      </button>
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '13px',
          color: overCap ? '#E5484D' : '#E6EAF2',
          minWidth: 24,
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {qty}
      </span>
      <button
        onClick={inc}
        disabled={atCap}
        style={{
          width: 24,
          height: 24,
          background: '#0B1220',
          border: `1px solid ${atCap ? '#E5484D44' : '#243044'}`,
          borderRadius: 4,
          color: atCap ? '#4A5A78' : '#E6EAF2',
          cursor: atCap ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
        }}
      >
        +
      </button>
      {atCap && available > 0 && (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#F5A524' }}>
          {available} of {available} available
        </span>
      )}
      {available === 0 ? (
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#E5484D' }}>
          Not enough stock — request transfer
        </span>
      ) : (
        <button
          onClick={handleAllocate}
          disabled={qty === 0}
          style={{
            padding: '3px 10px',
            borderRadius: 4,
            background: qty > 0 ? '#22D3EE' : '#1A2540',
            border: 'none',
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            fontWeight: 500,
            color: qty > 0 ? '#0B1220' : '#4A5A78',
            cursor: qty > 0 ? 'pointer' : 'default',
          }}
        >
          Allocate
        </button>
      )}
    </div>
  );
}

function TeamsTable() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = MOCK_TEAMS.filter(t => statusFilter === 'all' || t.status === statusFilter);

  return (
    <div>
      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['all', 'available', 'in_transit', 'deployed', 'off_duty'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: '4px 12px',
              borderRadius: 99,
              border: `1px solid ${statusFilter === s ? '#22D3EE' : '#243044'}`,
              background: statusFilter === s ? '#22D3EE15' : 'transparent',
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              color: statusFilter === s ? '#22D3EE' : '#8A97AC',
              cursor: 'pointer',
            }}
          >
            {s === 'all' ? 'All' : s === 'in_transit' ? 'En route' : s === 'deployed' ? 'On site' : 'Available'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#131C2E', border: '1px solid #243044', borderRadius: 6, overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            display: 'grid',
            // Header and row templates must stay identical or the columns
            // drift apart. 72px on Members because "MEMBERS" at 11px with
            // 0.06em tracking overruns a 60px track and collides with
            // "STATUS"; the gap keeps every heading off its neighbour.
            gridTemplateColumns: '1fr 1fr 72px 80px 80px 120px 80px',
            gap: 12,
            padding: '8px 16px',
            borderBottom: '1px solid #243044',
            background: '#0B1220',
          }}
        >
          {['Team', 'HQ', 'Members', 'Status', 'Assignment', 'Distance', 'Last update'].map(h => (
            <span
              key={h}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                color: '#4A5A78',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {h}
            </span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: "'Inter', sans-serif", fontSize: '14px', color: '#4A5A78' }}>
            No teams match this filter
          </div>
        ) : (
          filtered.map((team, i) => {
            const color = TEAM_STATUS_COLOR[team.status] ?? '#4A5A78';
            const label = TEAM_STATUS_LABEL[team.status] ?? team.status;
            return (
              <div
                key={team.id}
                style={{
                  display: 'grid',
                  // Must match the header template above exactly.
                  gridTemplateColumns: '1fr 1fr 72px 80px 80px 120px 80px',
                  gap: 12,
                  padding: '10px 16px',
                  borderBottom: i < filtered.length - 1 ? '1px solid #243044' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#0B1220')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#E6EAF2' }}>
                  Team {team.name}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#8A97AC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Karnataka SDRF
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#E6EAF2', fontVariantNumeric: 'tabular-nums' }}>
                  {team.members}
                </span>
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color,
                    background: `${color}15`,
                    border: `1px solid ${color}44`,
                    borderRadius: 3,
                    padding: '2px 6px',
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#8A97AC', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {team.assignedTo ?? '—'}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#8A97AC' }}>
                  —
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#4A5A78' }}>
                  just now
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ResourcesTable({
  rows,
  onAllocate,
}: {
  rows: ResourceRow[];
  onAllocate: (id: string, qty: number) => void;
}) {
  return (
    <div>
      <div style={{ background: '#131C2E', border: '1px solid #243044', borderRadius: 6, overflow: 'auto' }}>
        {/* Header */}
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#0B1220' }}>
              {['Item', 'HQ / Depot', 'Total', 'Allocated', 'Available', 'Reserved for', 'Last synced', 'Allocate'].map(h => (
                <th
                  key={h}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '11px',
                    color: '#4A5A78',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '8px 14px',
                    textAlign: 'left',
                    borderBottom: '1px solid #243044',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const available = r.total - r.allocated;
              const pct = (available / r.total) * 100;
              const avColor = pct < 20 ? '#E5484D' : pct < 50 ? '#F5A524' : '#30A46C';
              return (
                <tr
                  key={r.id}
                  style={{ borderBottom: i < rows.length - 1 ? '1px solid #243044' : 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#0B1220')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td style={{ padding: '10px 14px', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: '#E6EAF2', whiteSpace: 'nowrap' }}>
                    {r.item}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#8A97AC' }}>
                    {r.hq}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#E6EAF2', fontVariantNumeric: 'tabular-nums' }}>
                    {r.total.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: '#F5A524', fontVariantNumeric: 'tabular-nums' }}>
                    {r.allocated.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: avColor, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {available.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#8A97AC', whiteSpace: 'nowrap' }}>
                    {r.reserved}
                  </td>
                  <td style={{ padding: '10px 14px', fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#4A5A78', whiteSpace: 'nowrap' }}>
                    {r.lastSynced}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <AllocationStepper resource={r} onAllocate={qty => onAllocate(r.id, qty)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function LogisticsPanel() {
  const [tab, setTab] = useState<Tab>('teams');

  // Held here rather than in ResourcesTable so the summary tiles above the
  // tabs move with the table -- allocating ambulances has to change the
  // "Ambulances available" tile too, or the page contradicts itself.
  const [rows, setRows] = useState<ResourceRow[]>(() => RESOURCES_EXTENDED.map(r => ({ ...r })));

  const allocate = (id: string, qty: number) =>
    setRows(rs =>
      rs.map(r => {
        if (r.id !== id) return r;
        // Never commit more than is actually on the shelf.
        const available = r.total - r.allocated;
        return { ...r, allocated: r.allocated + Math.min(qty, available) };
      }),
    );

  const ambulancesAvail = rows.find(r => r.item === 'Ambulances');
  const medKitsAvail = rows.find(r => r.item === 'Medical kits');

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#0B1220', padding: '24px 24px 40px' }}>
      {/* Summary tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <SummaryTile
          label="Ambulances available"
          value={String(ambulancesAvail ? ambulancesAvail.total - ambulancesAvail.allocated : '—')}
          delta="-1"
          color="#F5A524"
        />
        <SummaryTile
          label="Medical kits available"
          value={String(medKitsAvail ? medKitsAvail.total - medKitsAvail.allocated : '—')}
          delta="-3"
          color="#30A46C"
        />
        <SummaryTile
          label="Teams on duty"
          value={String(MOCK_TEAMS.filter(t => t.status !== 'available').length)}
          delta="+2"
          color="#22D3EE"
        />
        <SummaryTile
          label="Open incidents"
          value="6"
          delta="+1"
          color="#E5484D"
        />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #243044' }}>
        {([['teams', 'Teams'], ['resources', 'Resources']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '10px 20px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: tab === key ? 600 : 400,
              color: tab === key ? '#E6EAF2' : '#8A97AC',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${tab === key ? '#22D3EE' : 'transparent'}`,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'teams' ? <TeamsTable /> : <ResourcesTable rows={rows} onAllocate={allocate} />}
    </div>
  );
}
