# Integration Status — Sept 5, 2026

## What's Wired ✅

All frontend components are now integrated with real backend services:

### Civilian Flow
- **SendingScreen.tsx** ✅
  - Creates MeshClient on mount
  - Generates Envelope with SOS data (priority, victim count, description)
  - Serializes and sends via mesh.sendEnvelope()
  - Animates relay progression (sending → relaying → delivered)
  - Shows error on mesh failures
  - Cleans up on unmount

### Responder Dashboard
- **App.tsx** ✅
  - Loads all SOS incidents from PouchDB on init
  - Subscribes to DB changes via watchChanges()
  - Passes real incidents to MapView, TriageBoard, SOSList
  - Fallback to MOCK_INCIDENTS if DB is empty

- **MapView.tsx** ✅
  - Receives real SOSIncident[] from App.tsx
  - Renders SOS pins colored by triage (RED/YELLOW/GREEN/BLACK)
  - Shows incident details in bottom sheet on pin click

- **TriageBoard.tsx** ✅
  - Loads SOS from PouchDB
  - Calls triageSOSReport() for each to compute START protocol category
  - Maps computed triage to UI colors
  - Subscribes to DB changes via watchChanges()
  - Supports drag-to-reassign categories (manual override)

- **SOSList.tsx** ✅
  - Loads SOS from PouchDB
  - Computes triage for each via triageSOSReport()
  - Sorts by triage priority (RED → YELLOW → GREEN → BLACK)
  - Subscribes to DB changes
  - Shows triage reason in expanded view

- **MeshStrip.tsx** ✅
  - Creates MeshClient on mount
  - Creates PeerTable
  - Receives heartbeats, updates peer table
  - Computes coverage via computeCoverage() (GREEN/AMBER/RED)
  - Displays peer count and signal strength sparkline

## Service Layer

All services fully implemented:

- **mesh.ts** — MeshClient class
  - `connect()` — establish WebSocket to ws://localhost:4000/mesh
  - `sendEnvelope()` — serialize and send, wait for ACK
  - `onHeartbeat` callback for peer updates
  - Auto-reconnect with exponential backoff

- **pouchdb.ts** — LocalDatabase class
  - `init()` — initialize IndexedDB-backed PouchDB
  - `storeSOS()` — write SOS by UUID (_id)
  - `getAllSOS()` — fetch all docs
  - `watchChanges()` — subscribe to DB changes
  - `syncWithRemote()` — bidirectional sync to CouchDB

- **triage.ts** — Pure START protocol
  - `triageSOSReport(sos)` → {category, reasonCode, reasonText}
  - Maps priority + description to immediate/delayed/minor/deceased
  - Reason codes explain every decision

## Configuration

- **config.ts** — Centralized URLs with env var overrides
  ```
  REACT_APP_MESH_URL = ws://localhost:4000/mesh
  REACT_APP_COUCH_URL = http://localhost:5984
  REACT_APP_AI_URL = http://localhost:4001
  REACT_APP_MAP_URL = http://localhost:3000
  ```

## What's Still Needed

### 1. Backend Services Must Run
   - apps/api — Express on 0.0.0.0:4000 (/mesh WebSocket)
   - apps/ai — Ollama proxy on 0.0.0.0:4001
   - apps/dashboard — Tile server on 0.0.0.0:3000

### 2. Database
   - CouchDB running (docker-compose up from infra/)
   - Seed data loaded

### 3. Frontend Build
   ```bash
   cd apps/mobile
   pnpm install
   pnpm dev
   ```

### 4. PMTiles (Optional)
   - For real offline maps, extract Bengaluru PMTiles
   - Place at apps/dashboard/src/city.pmtiles

## Demo Flow

1. Civilian: Login → Send SOS
2. SendingScreen animates relay progression via mesh
3. Responder dashboard loads SOS from PouchDB
4. MapView renders pins by triage color
5. TriageBoard shows in START columns
6. SOSList sorts by priority

---

**All core components wired and ready for testing.**
