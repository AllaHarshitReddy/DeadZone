import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { TRIAGE_COLOR, NEED_ICONS, type SOSIncident, type NetworkStatus } from '../../data/mockData';

interface Props {
  incidents: SOSIncident[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  networkStatus: NetworkStatus;
}

const TRIAGE_BORDER: Record<string, string> = {
  RED: '#DC2626',
  YELLOW: '#D97706',
  GREEN: '#16A34A',
  BLACK: '#4B5563',
};

const BENGALURU: [number, number] = [77.5946, 12.9716];
// Locked just inside the extracted tile window (data/tiles/README.md) so the
// camera can never ask for a tile that isn't on disk.
const MAX_BOUNDS: [[number, number], [number, number]] = [
  [77.48, 12.84],
  [77.76, 13.13],
];

// The tile server (apps/dashboard) is reached through the Vite /tiles proxy, so
// the phone only ever talks to this origin. The shared style.json is authored
// light; these overrides repaint it for the dark responder shell.
const DARK_PAINT: Record<string, Record<string, unknown>> = {
  background: { 'background-color': '#0D1117' },
  earth: { 'fill-color': '#0D1117' },
  landcover: { 'fill-color': '#16221b', 'fill-opacity': 0.5 },
  'landuse-green': { 'fill-color': '#16241a', 'fill-opacity': 0.55 },
  'landuse-builtup': { 'fill-color': '#1a1a22', 'fill-opacity': 0.6 },
  water: { 'fill-color': '#0e2438' },
  'water-line': { 'line-color': '#1d3b56' },
  buildings: { 'fill-color': '#20242e', 'fill-outline-color': '#2a2f3d' },
  'roads-casing': { 'line-color': '#20242e' },
  'roads-minor': { 'line-color': '#242a36' },
  'roads-fill': { 'line-color': '#3a4150' },
  'roads-rail': { 'line-color': '#3a3f4c' },
  boundaries: { 'line-color': '#4a4560' },
  'roads-labels': { 'text-color': '#8a90a0', 'text-halo-color': '#0D1117' },
  'places-neighbourhood': { 'text-color': '#6b7180', 'text-halo-color': '#0D1117' },
  'places-macrohood': { 'text-color': '#9aa0b0', 'text-halo-color': '#0D1117' },
  'places-locality': { 'text-color': '#e6e6ee', 'text-halo-color': '#0D1117' },
  'pois-hospital-label': { 'text-color': '#f0a0a0', 'text-halo-color': '#0D1117' },
};

function toDark(style: maplibregl.StyleSpecification): maplibregl.StyleSpecification {
  for (const layer of style.layers) {
    const overrides = DARK_PAINT[layer.id];
    if (!overrides) continue;
    layer.paint = { ...(layer.paint ?? {}), ...overrides } as typeof layer.paint;
  }
  return style;
}

/**
 * The shared style.json is authored with same-origin paths for the dashboard.
 * Here every asset must instead go through the Vite `/tiles` proxy, and — because
 * MapLibre hands tile/glyph URLs to a Web Worker that has no relative-URL base —
 * the URL must be absolute. This runs for every request the map makes.
 */
function transformRequest(url: string): maplibregl.RequestParameters {
  try {
    const u = new URL(url, location.origin);
    if (u.origin === location.origin && !u.pathname.startsWith('/tiles/')) {
      u.pathname = '/tiles' + u.pathname;
    }
    return { url: u.href };
  } catch {
    return { url };
  }
}

function markerEl(incident: SOSIncident, selected: boolean): HTMLElement {
  const color = TRIAGE_COLOR[incident.triage];

  // MapLibre owns this element's `position` and `transform` (it re-writes the
  // transform every frame to keep the marker on its coordinate). So the wrapper
  // carries NO position/transform of its own — all visuals go on children.
  const wrap = document.createElement('div');
  wrap.style.cssText = 'width:28px;height:28px;cursor:pointer;';

  if (incident.triage === 'RED') {
    const ring = document.createElement('div');
    ring.style.cssText =
      `position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};` +
      `animation:coverage-pulse 1.5s ease-in-out infinite;pointer-events:none;`;
    wrap.appendChild(ring);
  }

  const dot = document.createElement('div');
  dot.textContent = String(incident.people);
  dot.style.cssText =
    `position:absolute;inset:0;border-radius:50%;display:flex;align-items:center;` +
    `justify-content:center;font-weight:900;font-size:11px;color:#fff;font-family:'Barlow Condensed',sans-serif;` +
    `background:${color};border:2px solid ${selected ? '#FFFFFF' : TRIAGE_BORDER[incident.triage]};` +
    `box-shadow:0 4px 12px ${color}66;${selected ? 'outline:2px solid #FFF;outline-offset:2px;' : ''}`;
  wrap.appendChild(dot);
  return wrap;
}

export default function MapView({ incidents, selectedId, onSelect, networkStatus }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const resizeObsRef = useRef<ResizeObserver | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const selected = incidents.find((i) => i.id === selectedId);
  const located = useMemo(
    () => incidents.filter((i) => typeof i.lat === 'number' && typeof i.lng === 'number'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [incidents.map((i) => `${i.id}:${i.lat},${i.lng},${i.triage}`).join('|')],
  );

  const handlePin = (id: string) => {
    onSelect(id);
    setShowSheet(true);
  };
  const closeSheet = () => {
    setShowSheet(false);
    onSelect(null);
  };

  // ── Init map once ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/tiles/style.json');
        if (!res.ok) throw new Error(`style ${res.status}`);
        const style = toDark(await res.json()) as maplibregl.StyleSpecification;
        if (cancelled) return;

        const map = new maplibregl.Map({
          container: containerRef.current!,
          style,
          transformRequest,
          center: BENGALURU,
          zoom: 11.5,
          minZoom: 10,
          maxZoom: 17,
          maxBounds: MAX_BOUNDS,
          renderWorldCopies: false,
          attributionControl: { compact: true },
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
        map.addControl(new maplibregl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-right');
        map.on('load', () => {
          if (cancelled) return;
          map.resize();
          setReady(true);
        });
        // The flex layout can settle a frame after init; make sure the canvas
        // catches up to the real container size.
        requestAnimationFrame(() => !cancelled && map.resize());
        setTimeout(() => !cancelled && map.resize(), 250);
        // A missing tile or glyph range fires a non-fatal error event; the map
        // just draws without it. Only surface anything that isn't a 404.
        map.on('error', (e) => {
          const msg = (e && e.error && e.error.message) || '';
          if (/\b404\b|not found/i.test(msg)) return;
          console.error('[map]', e && e.error);
        });
        mapRef.current = map;

        const ro = new ResizeObserver(() => map.resize());
        ro.observe(containerRef.current!);
        resizeObsRef.current = ro;
      } catch (err) {
        console.error('[MapView] falling back to the sketch map:', err);
        if (!cancelled) setMapError(true);
      }
    })();

    return () => {
      cancelled = true;
      resizeObsRef.current?.disconnect();
      resizeObsRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Sync SOS markers ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const live = new Set(located.map((i) => i.id));
    for (const [id, marker] of markersRef.current) {
      if (!live.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
    for (const incident of located) {
      markersRef.current.get(incident.id)?.remove();
      const el = markerEl(incident, incident.id === selectedId);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePin(incident.id);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([incident.lng!, incident.lat!])
        .addTo(map);
      markersRef.current.set(incident.id, marker);
    }
  }, [located, selectedId, ready]);

  // ── Fly to the selected incident ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selected || typeof selected.lat !== 'number') return;
    map.flyTo({ center: [selected.lng!, selected.lat!], zoom: Math.max(map.getZoom(), 14), duration: 600 });
  }, [selectedId, ready]);

  const redCount = incidents.filter((i) => i.triage === 'RED').length;

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: '#0D1117' }}>
      <div ref={containerRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />

      {mapError && <SketchMap incidents={incidents} selectedId={selectedId} onPin={handlePin} />}

      {/* Legend */}
      <div
        className="absolute top-3 left-3 rounded-xl p-3 border border-[#2A2A38] z-10"
        style={{ background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(8px)' }}
      >
        <div
          className="text-[#5A5A6A] mb-2 tracking-widest"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
        >
          TRIAGE
        </div>
        {(['RED', 'YELLOW', 'GREEN', 'BLACK'] as const).map((cat) => (
          <div key={cat} className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded-full" style={{ background: TRIAGE_COLOR[cat] }} />
            <span
              className="text-[#8A8A9A]"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
            >
              {cat}
            </span>
          </div>
        ))}
        <div
          className="mt-2 pt-2 border-t border-[#2A2A38] text-[#5A5A6A]"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
        >
          {incidents.length} active · {redCount} critical
          {located.length < incidents.length && (
            <div className="text-[#8A5A2A]">{incidents.length - located.length} without a fix</div>
          )}
        </div>
      </div>

      {/* Offline tag */}
      {networkStatus === 'offline' && (
        <div
          className="absolute top-3 right-14 z-10 px-2 py-1 rounded-lg border border-[#2A2A38] text-[#8A8A9A]"
          style={{ background: 'rgba(13,17,23,0.92)', fontFamily: "'JetBrains Mono', monospace", fontSize: '9px' }}
        >
          OFFLINE MAP
        </div>
      )}

      {/* Incident bottom sheet */}
      {showSheet && selected && (
        <>
          <div className="absolute inset-0 bg-black/40 z-20" onClick={closeSheet} />
          <div
            className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl p-5 animate-slide-up"
            style={{ background: '#111116', border: '1px solid #2A2A38', maxHeight: '65%', overflowY: 'auto' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div
                    className="px-3 py-1 rounded-lg font-black tracking-widest text-white"
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: '14px',
                      background: TRIAGE_COLOR[selected.triage],
                    }}
                  >
                    {selected.triage}
                  </div>
                  <span
                    className="text-[#8A8A9A]"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px' }}
                  >
                    {selected.id.toUpperCase()}
                  </span>
                </div>
                <div
                  className="text-[#F0F0F6] font-bold"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '20px' }}
                >
                  {selected.location}
                </div>
              </div>
              <button onClick={closeSheet} className="text-[#5A5A6A] text-xl w-8 h-8 flex items-center justify-center">×</button>
            </div>

            {/* Triage reason */}
            <div
              className="rounded-xl p-3 mb-4 border-l-4"
              style={{ background: '#18181F', borderLeftColor: TRIAGE_COLOR[selected.triage] }}
            >
              <div
                className="text-[#5A5A6A] text-xs mb-1 tracking-widest"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                TRIAGE REASON
              </div>
              <div className="text-[#F0F0F6] text-sm font-medium">{selected.triageReason}</div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl" style={{ background: '#18181F' }}>
                <div className="text-2xl font-black text-[#F0F0F6]" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{selected.people}</div>
                <div className="text-[#5A5A6A] text-xs">People</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: '#18181F' }}>
                <div className="text-[#8A8A9A] text-xs mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selected.timeAgo}</div>
                <div className="text-[#5A5A6A] text-xs">Time</div>
              </div>
              <div className="text-center p-3 rounded-xl" style={{ background: '#18181F' }}>
                <div className="text-[#8A8A9A] text-xs mb-1" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {selected.lat != null ? `${selected.lat.toFixed(4)}, ${selected.lng!.toFixed(4)}` : '—'}
                </div>
                <div className="text-[#5A5A6A] text-xs">Location</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selected.needs.map((n) => (
                <span
                  key={n}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-[#2A2A38] text-[#8A8A9A]"
                  style={{ background: '#18181F' }}
                >
                  {NEED_ICONS[n]} {n.replace('_', '/')}
                </span>
              ))}
            </div>

            {selected.note && (
              <div
                className="text-[#8A8A9A] text-sm px-3 py-2 rounded-lg border border-[#2A2A38] mb-4"
                style={{ background: '#18181F' }}
              >
                "{selected.note}"
              </div>
            )}

            <button
              className="w-full py-4 rounded-xl font-black tracking-widest text-white"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: '18px',
                background: 'linear-gradient(135deg, #EA580C, #C2410C)',
                boxShadow: '0 4px 16px rgba(234,88,12,0.3)',
              }}
            >
              DISPATCH TEAM →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Fallback shown only if the tile server can't be reached — the same
 * schematic city that shipped before the real basemap landed. Pins use the
 * legacy x/y percentages.
 */
function SketchMap({
  incidents,
  selectedId,
  onPin,
}: {
  incidents: SOSIncident[];
  selectedId: string | null;
  onPin: (id: string) => void;
}) {
  return (
    <div className="absolute inset-0">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
        <rect width="800" height="600" fill="#0D1117" />
        {[
          [60, 80, 120, 90], [200, 60, 140, 100], [360, 40, 100, 80], [480, 80, 130, 90], [630, 50, 120, 100],
          [50, 210, 110, 80], [180, 200, 160, 90], [360, 180, 120, 100], [510, 190, 140, 80], [670, 180, 110, 100],
          [60, 330, 130, 90], [210, 320, 110, 80], [340, 310, 150, 90], [510, 320, 130, 80], [660, 310, 110, 90],
          [70, 450, 140, 80], [230, 440, 120, 90], [370, 430, 130, 80], [520, 440, 140, 90], [680, 430, 100, 80],
        ].map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} fill="#141820" rx="4" />
        ))}
        <line x1="0" y1="170" x2="800" y2="170" stroke="#2a2f3d" strokeWidth="10" />
        <line x1="0" y1="400" x2="800" y2="400" stroke="#2a2f3d" strokeWidth="10" />
        <line x1="300" y1="0" x2="300" y2="600" stroke="#2a2f3d" strokeWidth="10" />
        <line x1="580" y1="0" x2="580" y2="600" stroke="#2a2f3d" strokeWidth="8" />
      </svg>
      {incidents.map((incident) => {
        const color = TRIAGE_COLOR[incident.triage];
        const isSelected = selectedId === incident.id;
        return (
          <button
            key={incident.id}
            onClick={() => onPin(incident.id)}
            className="absolute transition-transform duration-150 hover:scale-110"
            style={{
              left: `${incident.x}%`,
              top: `${incident.y}%`,
              transform: `translate(-50%, -100%) ${isSelected ? 'scale(1.2)' : 'scale(1)'}`,
              zIndex: isSelected ? 30 : 10,
            }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-black text-white shadow-lg"
              style={{
                background: color,
                borderColor: isSelected ? '#FFFFFF' : TRIAGE_BORDER[incident.triage],
                fontSize: '11px',
                fontFamily: "'Barlow Condensed', sans-serif",
              }}
            >
              {incident.people}
            </div>
          </button>
        );
      })}
    </div>
  );
}
