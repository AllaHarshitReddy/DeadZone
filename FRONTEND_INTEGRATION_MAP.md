# Frontend-Backend Integration Map

**Date**: Sept 5, 2026  
**Status**: Frontend (Vite React) ready to wire to Backend (Tracks D–E)  
**Goal**: Integrate and identify gaps for Sept 10 demo

---

## 📊 What Frontend Has

| Layer | What's Built | Status |
|-------|---|---|
| **UI Framework** | React 19 + Vite + Tailwind 4 | ✅ Production-ready |
| **Civilian Flows** | 11 screens (home, SOS form, coverage lost, live tracking, etc.) | ✅ Visual complete |
| **Responder Views** | 4 dashboards (map, SOS list, triage board, logistics) | ✅ Visual complete |
| **Navigation** | Role-based (civilian/responder) + screen routing | ✅ Complete |
| **Mock Data** | 6 realistic SOS incidents with triage/location/needs | ✅ Ready |
| **Coverage Meter** | GREEN/AMBER/RED UI with device count | ✅ Hardcoded toggle |
| **Network Toggle** | Simulated online/offline switch | ✅ UI mock |
| **SOS Form** | Severity, help type, people count steps | ✅ Flow complete |

---

## 🔌 What Needs Backend Wiring

### **1. Civilian: Send SOS (CRITICAL for demo)**
**File**: `src/components/civilian/SendingScreen.tsx`  
**Current**: Mock `onDelivered()` called after 2s delay  
**Needs**:
- Connect to WebSocket mesh: `ws://<responder-ip>:4000/mesh`
- Package SOS as Envelope (id, orig, ts, ttl, prio, type, geo, body)
- Send serialized JSON
- Wait for ACK response
- Show "sending" → "delivered" → "relayed" state

**Backend Ready**: ✅ `packages/comms/src/envelope.ts` + `apps/api/src/mesh.ts`

---

### **2. Civilian: Coverage Meter (CRITICAL for demo)**
**File**: `src/components/ui/MeshStrip.tsx`  
**Current**: Hardcoded `cycleCoverage()` toggle; static device count  
**Needs**:
- Listen to WebSocket heartbeats from peer table
- Track responder `lastSeen` timestamp
- Compute coverage: GREEN (≤30s) → AMBER (30–120s) → RED (>120s)
- Show live device count + peer list

**Backend Ready**: ✅ `packages/comms/src/coverage.ts` + `apps/api/src/mesh.ts`

---

### **3. Responder: Triage Board (CRITICAL for demo)**
**File**: `src/components/responder/TriageBoard.tsx`  
**Current**: Mock incidents with hardcoded triage values  
**Needs**:
- Fetch live SOS from local PouchDB (or sync state)
- Call triage engine on each: `packages/triage` (pure TS logic in browser)
  - Input: civilian's severity + description
  - Output: RED/YELLOW/GREEN + reason code
- Display triage category + reason
- Allow responder to override/edit

**Backend Ready**: ✅ `packages/triage` (use directly in browser, no API needed)

---

### **4. Responder: Map View (IMPORTANT for demo)**
**File**: `src/components/responder/MapView.tsx`  
**Current**: Canvas-based mock map with hardcoded SOS pins  
**Needs**:
- Load MapLibre from `apps/dashboard` static server (or embed native)
- Fetch PMTiles from `http://<responder-ip>:3000/city.pmtiles`
- Fetch SOS data from local PouchDB
- Render each SOS as a pin (color by triage)
- Click pin → show details

**Backend Ready**: ✅ `apps/dashboard` (static tile server, map page, SOS pins)

---

### **5. Responder: SOS List (IMPORTANT for demo)**
**File**: `src/components/responder/SOSList.tsx`  
**Current**: Hardcoded mock incidents  
**Needs**:
- Fetch live SOS from local PouchDB
- Sort by: triage (RED > YELLOW > GREEN > BLACK), then time
- Show summary: location, people, needs, triage reason
- Click → open on map

**Backend Ready**: ✅ `apps/api/.data/local/` (PouchDB with seed data)

---

### **6. Network Status (NICE-TO-HAVE for demo)**
**File**: `src/App.tsx` line 85  
**Current**: Manual toggle `toggleNetwork()`  
**Needs**:
- Detect actual Wi-Fi connectivity (check if mesh is reachable)
- Auto-update on connect/disconnect
- Show in StatusBanner

**Backend**: Not critical for Sept 10 (manual toggle sufficient)

---

### **7. Chat: Weather Integration (NICE-TO-HAVE)**
**File**: None yet (responder UI doesn't have weather)  
**Needs**:
- Optional: Add "Weather" tab to responder dashboard
- Call `POST http://<ai-ip>:4001/ai/chat` with user question
- Display risk band + safety action

**Backend Ready**: ✅ `apps/ai/src/routes/chat.ts` (live weather cached)

---

## 🗂️ File Structure for Wiring

### Frontend Files to Update
```
src/
├── App.tsx                              # Main routing (NONE needed)
├── components/
│   ├── civilian/
│   │   ├── SendingScreen.tsx           # ⚠️ WIRE: send to mesh
│   │   └── HomeScreen.tsx              # ⚠️ WIRE: real coverage data
│   ├── responder/
│   │   ├── MapView.tsx                 # ⚠️ WIRE: fetch SOS + PMTiles
│   │   ├── SOSList.tsx                 # ⚠️ WIRE: fetch SOS from PouchDB
│   │   ├── TriageBoard.tsx             # ⚠️ WIRE: call triage logic
│   │   └── LogisticsPanel.tsx          # ⚠️ OPTIONAL: responder guidance
│   └── ui/
│       └── MeshStrip.tsx               # ⚠️ WIRE: coverage + heartbeats
├── data/
│   └── mockData.ts                     # ⚠️ REPLACE: use real SOS stream
└── services/ (NEW)
    ├── mesh.ts                         # WebSocket connection to mesh
    ├── triage.ts                       # Import triage logic
    └── pouchdb.ts                      # Local DB + sync
```

### Backend Files Ready
```
apps/
├── api/
│   ├── src/
│   │   ├── mesh.ts                    # ✅ WebSocket handler
│   │   └── server.ts                  # ✅ Coordination server
│   ├── scripts/
│   │   ├── seed.ts                    # ✅ Load demo SOS
│   │   └── setup-db.ts                # ✅ Create PouchDB
│   └── .data/local/                   # ✅ Local database
├── ai/
│   ├── src/
│   │   └── routes/chat.ts             # ✅ Weather chat API
│   └── data/weather.json              # ✅ Live Bengaluru forecast
└── dashboard/
    ├── src/
    │   ├── server.js                  # ✅ Tile server + range requests
    │   ├── index.html                 # ✅ Map page (reusable)
    │   └── style.json                 # ✅ Offline MapLibre style
    └── data/tiles/
        ├── city.pmtiles               # ⚠️ NEEDS: pmtiles extract
        ├── glyphs/                    # ⚠️ PLACEHOLDER: minimal
        └── sprites/                   # ✅ Minimal valid sprite set

packages/
├── triage/src/                        # ✅ Pure TS, ready to import
├── comms/src/
│   ├── envelope.ts                    # ✅ Serialization
│   ├── peers.ts                       # ✅ Peer table
│   └── coverage.ts                    # ✅ Coverage logic
└── schema/src/                        # ✅ Shared Zod schemas
```

---

## 🎯 Demo-Critical Path (What Must Work)

### Minimum Viable Demo (Sept 10)
```
1. Civilian opens app → login → press SOS
   ✅ Form: severity, help type, people
   ⚠️ NEED: Send SOS to mesh (WebSocket)

2. SOS arrives at responder laptop
   ✅ Received in local PouchDB
   ⚠️ NEED: Fetch + display in SOS list

3. Responder triages the SOS
   ✅ Triage logic available
   ⚠️ NEED: Call triage, show RED/YELLOW/GREEN

4. Responder sees SOS on map
   ⚠️ NEED: Show Bengaluru map with SOS pins

5. Turn off network → send SOS again
   ✅ Mesh queues offline
   ⚠️ NEED: Show "queued" state in UI

6. Turn network back on → syncs
   ✅ PouchDB syncs to CouchDB
   ⚠️ NEED: Watch sync state, update UI
```

### Not Required for Sept 10
- ❌ Responder logistics panel (nice-to-have)
- ❌ Weather chat in responder UI (nice-to-have)
- ❌ Voip/calls (on cut list)
- ❌ Native map integration (can use web map embedded)
- ❌ Real glyph fonts (placeholder OK if tiles render)

---

## 🚀 Next Steps

1. **Copy frontend to repo**
   ```bash
   cp -r "C:\Users\harsh\Downloads\Mobile App Development" \
         C:\Users\harsh\OneDrive\Desktop\Sanket Setu\apps\mobile
   ```

2. **Create service layer** (`apps/mobile/src/services/`)
   - `mesh.ts`: WebSocket connection + Envelope send/receive
   - `triage.ts`: Import `@deadzone/triage`, call locally
   - `pouchdb.ts`: Local DB init + sync setup

3. **Wire key components**
   - `SendingScreen.tsx` → call mesh service
   - `MeshStrip.tsx` → listen to coverage changes
   - `SOSList.tsx` → fetch from PouchDB
   - `TriageBoard.tsx` → run triage logic
   - `MapView.tsx` → embed or link to map server

4. **Add package.json entry** for `@deadzone/triage` import

5. **Test end-to-end**
   - All 3 servers running (api, ai, dashboard)
   - Phone connects to mesh
   - SOS flow: send → arrive → triage → display

---

## 📝 Assumptions & Knowns

- **Frontend is web-based** (Vite + React), not React Native/Expo
  - This is fine for demo; we'll web-wrap it or run in browser
  - Phone access: open `http://<laptop-ip>:5173` (Vite dev server)

- **Triage logic is pure TS** in `packages/triage`
  - No runtime dependency; import directly in React

- **Mesh is real WebSocket**, not mock
  - Phone will connect to `ws://<responder-ip>:4000/mesh`
  - Requires both on same Wi-Fi

- **Map can be embedded** from `apps/dashboard`
  - Responder sees full MapLibre in browser
  - Phone can open separate map tab if needed

- **PouchDB lives on responder laptop**
  - Civilian phone connects via mesh → SOS writes to laptop's local DB
  - Laptop syncs laptop DB to remote CouchDB (when online)

---

## ⚠️ Known Gaps (Will Identify & Fill)

- [ ] Frontend service layer not yet written
- [ ] WebSocket message typing / error handling
- [ ] Offline queue UI feedback
- [ ] Real geolocation (currently hardcoded Bengaluru)
- [ ] Network detection (using manual toggle for now)
- [ ] Responder responder-to-responder coordination (not in demo scope)
- [ ] Multi-language support (hand-translated strings ready, not wired)

---

## 🎬 Ready to Start Integration

**Backend**: ✅ All 5 tracks complete, tested, ready  
**Frontend**: ✅ Visual structure complete, awaiting service wiring  
**Timeline**: ~2 days (Sept 5–7) to integrate + test

Let's begin!
