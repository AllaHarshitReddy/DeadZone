import { MOCK_TEAMS, MOCK_RESOURCES, MOCK_RELAY_NODES } from '../../data/mockData';

const TEAM_STATUS_COLOR: Record<string, string> = {
  deployed: '#16A34A',
  in_transit: '#D97706',
  available: '#EA580C',
};

const NODE_STATUS_COLOR: Record<string, string> = {
  online: '#16A34A',
  degraded: '#D97706',
  offline: '#DC2626',
};

export default function LogisticsPanel() {
  return (
    <div className="h-full overflow-y-auto" style={{ background: '#0A0A0E' }}>
      <div className="px-5 py-4 border-b border-[#2A2A38]">
        <div
          className="text-[#F0F0F6] font-black tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '24px' }}
        >
          LOGISTICS
        </div>
        <div
          className="text-[#5A5A6A]"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
        >
          Field command · Bhopal Metro · Live via mesh
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Teams */}
        <section>
          <div
            className="text-[#8A8A9A] font-bold tracking-widest mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px' }}
          >
            RESCUE TEAMS
          </div>
          <div className="flex flex-col gap-2">
            {MOCK_TEAMS.map(team => {
              const color = TEAM_STATUS_COLOR[team.status];
              return (
                <div
                  key={team.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[#2A2A38]"
                  style={{ background: '#111116' }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: color, boxShadow: `0 0 6px ${color}` }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[#F0F0F6] font-black"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px' }}
                      >
                        {team.name} Team
                      </span>
                      <span
                        className="text-[#5A5A6A]"
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
                      >
                        {team.members} members
                      </span>
                    </div>
                    {team.assignedTo && (
                      <div
                        className="text-[#8A8A9A]"
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
                      >
                        → {team.assignedTo.toUpperCase()} · ETA {team.eta}
                      </div>
                    )}
                  </div>
                  <span
                    className="font-black tracking-wide px-3 py-1 rounded-lg text-white"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '12px',
                      background: color,
                    }}
                  >
                    {team.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Resources */}
        <section>
          <div
            className="text-[#8A8A9A] font-bold tracking-widest mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px' }}
          >
            RESOURCES
          </div>
          <div className="flex flex-col gap-2">
            {MOCK_RESOURCES.map(resource => {
              const pct = resource.available / resource.total;
              const barColor = pct > 0.5 ? '#16A34A' : pct > 0.25 ? '#D97706' : '#DC2626';
              return (
                <div
                  key={resource.name}
                  className="px-4 py-3 rounded-xl border border-[#2A2A38]"
                  style={{ background: '#111116' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#F0F0F6] text-sm font-medium">{resource.name}</span>
                    <span
                      className="font-black"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', color: barColor }}
                    >
                      {resource.available}
                      <span className="text-[#5A5A6A] text-xs font-normal"> / {resource.total} {resource.unit}</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#2A2A38] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct * 100}%`, background: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Relay nodes */}
        <section>
          <div
            className="text-[#8A8A9A] font-bold tracking-widest mb-3"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px' }}
          >
            MESH RELAY NODES
          </div>
          <div className="flex flex-col gap-2">
            {MOCK_RELAY_NODES.map(node => {
              const color = NODE_STATUS_COLOR[node.status];
              return (
                <div
                  key={node.id}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl border border-[#2A2A38]"
                  style={{ background: '#111116' }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      background: color,
                      boxShadow: `0 0 6px ${color}`,
                      animation: node.status === 'online' ? 'dot-blink 2.5s ease-in-out infinite' : 'none',
                    }}
                  />
                  <div className="flex-1">
                    <div
                      className="text-[#F0F0F6] font-bold"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '17px' }}
                    >
                      {node.name}
                    </div>
                    <div
                      className="text-[#5A5A6A]"
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
                    >
                      {node.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-black"
                      style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', color }}
                    >
                      {node.peers}
                    </div>
                    <div
                      className="text-[#5A5A6A]"
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
                    >
                      peers
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
